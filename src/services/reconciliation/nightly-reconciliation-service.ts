/**
 * Nightly Reconciliation Service
 *
 * Compares Neo4j LedgerLine sums vs TimescaleDB gl_period_balances
 * per (entity_id, period_id). Reports discrepancies and stores
 * reconciliation run results in PostgreSQL.
 *
 * Designed to run as a scheduled nightly job or triggered via API.
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import { logger } from '../../lib/logger.js';

// ============================================================
// Types
// ============================================================

export type ReconciliationStatus = 'BALANCED' | 'DISCREPANCY' | 'ERROR';

export interface ReconciliationDiscrepancy {
  entity_id: string;
  period_id: string;
  neo4j_debit: number;
  neo4j_credit: number;
  pg_debit: number;
  pg_credit: number;
  debit_difference: number;
  credit_difference: number;
}

export interface ReconciliationRunResult {
  id: string;
  run_date: string;
  status: ReconciliationStatus;
  entity_id_filter?: string;
  period_id_filter?: string;
  total_pairs_checked: number;
  balanced_count: number;
  discrepancy_count: number;
  tolerance: number;
  discrepancies: ReconciliationDiscrepancy[];
  duration_ms: number;
  error_message?: string;
  created_at: string;
}

export interface ReconciliationRunSummary {
  id: string;
  run_date: string;
  status: ReconciliationStatus;
  entity_id_filter?: string;
  period_id_filter?: string;
  total_pairs_checked: number;
  balanced_count: number;
  discrepancy_count: number;
  tolerance: number;
  duration_ms: number;
  created_at: string;
}

export interface RunReconciliationInput {
  entityId?: string;
  periodId?: string;
  tolerance?: number; // default 0.01
}

// ============================================================
// Core Reconciliation Logic
// ============================================================

/**
 * Run a reconciliation comparing Neo4j LedgerLine totals against
 * TimescaleDB gl_period_balances for each (entity_id, period_id).
 *
 * Optionally filter by entity and/or period.
 */
export async function runReconciliation(
  input: RunReconciliationInput = {},
): Promise<ReconciliationRunResult> {
  const runId = uuid();
  const startTime = Date.now();
  const tolerance = input.tolerance ?? 0.01;

  try {
    // Step 1: Get Neo4j LedgerLine totals per (entity, period)
    const neo4jTotals = await getNeo4jTotals(input.entityId, input.periodId);

    // Step 2: Compare each pair against TimescaleDB
    const discrepancies: ReconciliationDiscrepancy[] = [];
    let balancedCount = 0;

    for (const n4j of neo4jTotals) {
      const pgTotals = await getPgTotals(n4j.entity_id, n4j.period_id);

      const debitDiff = Math.abs(n4j.neo4j_debit - pgTotals.pg_debit);
      const creditDiff = Math.abs(n4j.neo4j_credit - pgTotals.pg_credit);

      if (debitDiff > tolerance || creditDiff > tolerance) {
        discrepancies.push({
          entity_id: n4j.entity_id,
          period_id: n4j.period_id,
          neo4j_debit: n4j.neo4j_debit,
          neo4j_credit: n4j.neo4j_credit,
          pg_debit: pgTotals.pg_debit,
          pg_credit: pgTotals.pg_credit,
          debit_difference: debitDiff,
          credit_difference: creditDiff,
        });
      } else {
        balancedCount++;
      }
    }

    // Step 3: Also check for orphaned PG rows (in TimescaleDB but not Neo4j)
    const orphanedPg = await findOrphanedPgPairs(
      neo4jTotals.map((n) => ({ entity_id: n.entity_id, period_id: n.period_id })),
      input.entityId,
      input.periodId,
    );

    for (const orphan of orphanedPg) {
      discrepancies.push({
        entity_id: orphan.entity_id,
        period_id: orphan.period_id,
        neo4j_debit: 0,
        neo4j_credit: 0,
        pg_debit: orphan.pg_debit,
        pg_credit: orphan.pg_credit,
        debit_difference: orphan.pg_debit,
        credit_difference: orphan.pg_credit,
      });
    }

    const durationMs = Date.now() - startTime;
    const totalPairs = neo4jTotals.length + orphanedPg.length;
    const status: ReconciliationStatus = discrepancies.length === 0 ? 'BALANCED' : 'DISCREPANCY';

    const result: ReconciliationRunResult = {
      id: runId,
      run_date: new Date().toISOString(),
      status,
      entity_id_filter: input.entityId,
      period_id_filter: input.periodId,
      total_pairs_checked: totalPairs,
      balanced_count: balancedCount,
      discrepancy_count: discrepancies.length,
      tolerance,
      discrepancies,
      duration_ms: durationMs,
      created_at: new Date().toISOString(),
    };

    // Step 4: Persist the result
    await persistRunResult(result);

    logger.info(
      { runId, status, totalPairs, discrepancies: discrepancies.length, durationMs },
      'Nightly reconciliation complete',
    );

    return result;
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const result: ReconciliationRunResult = {
      id: runId,
      run_date: new Date().toISOString(),
      status: 'ERROR',
      entity_id_filter: input.entityId,
      period_id_filter: input.periodId,
      total_pairs_checked: 0,
      balanced_count: 0,
      discrepancy_count: 0,
      tolerance,
      discrepancies: [],
      duration_ms: durationMs,
      error_message: (err as Error).message,
      created_at: new Date().toISOString(),
    };

    await persistRunResult(result).catch(() => {});
    logger.error({ runId, err: (err as Error).message }, 'Nightly reconciliation failed');
    return result;
  }
}

// ============================================================
// Query Helpers
// ============================================================

interface Neo4jTotal {
  entity_id: string;
  period_id: string;
  neo4j_debit: number;
  neo4j_credit: number;
}

async function getNeo4jTotals(
  entityId?: string,
  periodId?: string,
): Promise<Neo4jTotal[]> {
  let cypher = `
    MATCH (j:JournalEntry)
    MATCH (l:LedgerLine {journal_entry_id: j.id})`;

  const params: Record<string, string> = {};

  if (entityId) {
    cypher += `\n    WHERE j.entity_id = $entityId`;
    params.entityId = entityId;
    if (periodId) {
      cypher += ` AND j.period_id = $periodId`;
      params.periodId = periodId;
    }
  } else if (periodId) {
    cypher += `\n    WHERE j.period_id = $periodId`;
    params.periodId = periodId;
  }

  cypher += `
    WITH j.entity_id AS entity_id, j.period_id AS period_id,
      SUM(CASE WHEN l.side = 'DEBIT' THEN l.functional_amount ELSE 0 END) AS neo4j_debit,
      SUM(CASE WHEN l.side = 'CREDIT' THEN l.functional_amount ELSE 0 END) AS neo4j_credit
    RETURN entity_id, period_id, neo4j_debit, neo4j_credit`;

  return runCypher<Neo4jTotal>(cypher, params);
}

interface PgTotal {
  pg_debit: number;
  pg_credit: number;
}

async function getPgTotals(entityId: string, periodId: string): Promise<PgTotal> {
  const result = await query<{ pg_debit: string; pg_credit: string }>(
    `SELECT COALESCE(SUM(debit_total), 0) AS pg_debit,
            COALESCE(SUM(credit_total), 0) AS pg_credit
     FROM gl_period_balances
     WHERE entity_id = $1 AND period_id = $2`,
    [entityId, periodId],
  );

  return {
    pg_debit: Number(result.rows[0]?.pg_debit ?? 0),
    pg_credit: Number(result.rows[0]?.pg_credit ?? 0),
  };
}

interface OrphanedPgPair {
  entity_id: string;
  period_id: string;
  pg_debit: number;
  pg_credit: number;
}

async function findOrphanedPgPairs(
  neo4jPairs: Array<{ entity_id: string; period_id: string }>,
  entityId?: string,
  periodId?: string,
): Promise<OrphanedPgPair[]> {
  // Get all distinct (entity_id, period_id) from PG
  let sql = `
    SELECT entity_id::text, period_id::text,
           COALESCE(SUM(debit_total), 0) AS pg_debit,
           COALESCE(SUM(credit_total), 0) AS pg_credit
    FROM gl_period_balances`;

  const params: (string | undefined)[] = [];
  const conditions: string[] = [];

  if (entityId) {
    params.push(entityId);
    conditions.push(`entity_id = $${params.length}`);
  }
  if (periodId) {
    params.push(periodId);
    conditions.push(`period_id = $${params.length}`);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ` GROUP BY entity_id, period_id`;

  const result = await query<{
    entity_id: string;
    period_id: string;
    pg_debit: string;
    pg_credit: string;
  }>(sql, params);

  // Filter to pairs NOT in the Neo4j set
  const neo4jSet = new Set(neo4jPairs.map((p) => `${p.entity_id}|${p.period_id}`));

  return result.rows
    .filter((row) => !neo4jSet.has(`${row.entity_id}|${row.period_id}`))
    .map((row) => ({
      entity_id: row.entity_id,
      period_id: row.period_id,
      pg_debit: Number(row.pg_debit),
      pg_credit: Number(row.pg_credit),
    }));
}

// ============================================================
// Persistence
// ============================================================

async function persistRunResult(result: ReconciliationRunResult): Promise<void> {
  await query(
    `INSERT INTO reconciliation_runs
      (id, run_date, status, entity_id_filter, period_id_filter,
       total_pairs_checked, balanced_count, discrepancy_count,
       tolerance, discrepancies, duration_ms, error_message, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      result.id,
      result.run_date,
      result.status,
      result.entity_id_filter ?? null,
      result.period_id_filter ?? null,
      result.total_pairs_checked,
      result.balanced_count,
      result.discrepancy_count,
      result.tolerance,
      JSON.stringify(result.discrepancies),
      result.duration_ms,
      result.error_message ?? null,
      result.created_at,
    ],
  );
}

// ============================================================
// Query Past Runs
// ============================================================

/**
 * Get a specific reconciliation run by ID.
 */
export async function getReconciliationRun(runId: string): Promise<ReconciliationRunResult | null> {
  const result = await query<{
    id: string;
    run_date: string;
    status: ReconciliationStatus;
    entity_id_filter: string | null;
    period_id_filter: string | null;
    total_pairs_checked: number;
    balanced_count: number;
    discrepancy_count: number;
    tolerance: string;
    discrepancies: string;
    duration_ms: number;
    error_message: string | null;
    created_at: string;
  }>(`SELECT * FROM reconciliation_runs WHERE id = $1`, [runId]);

  if (result.rows.length === 0) return null;
  const row = result.rows[0];

  return {
    id: row.id,
    run_date: String(row.run_date),
    status: row.status,
    entity_id_filter: row.entity_id_filter ?? undefined,
    period_id_filter: row.period_id_filter ?? undefined,
    total_pairs_checked: Number(row.total_pairs_checked),
    balanced_count: Number(row.balanced_count),
    discrepancy_count: Number(row.discrepancy_count),
    tolerance: Number(row.tolerance),
    discrepancies: typeof row.discrepancies === 'string'
      ? JSON.parse(row.discrepancies)
      : row.discrepancies,
    duration_ms: Number(row.duration_ms),
    error_message: row.error_message ?? undefined,
    created_at: String(row.created_at),
  };
}

/**
 * List reconciliation runs, most recent first.
 */
export async function listReconciliationRuns(
  limit = 20,
  entityId?: string,
): Promise<ReconciliationRunSummary[]> {
  let sql = `
    SELECT id, run_date, status, entity_id_filter, period_id_filter,
           total_pairs_checked, balanced_count, discrepancy_count,
           tolerance, duration_ms, created_at
    FROM reconciliation_runs`;

  const params: (string | number)[] = [];

  if (entityId) {
    params.push(entityId);
    sql += ` WHERE entity_id_filter = $${params.length}`;
  }

  sql += ` ORDER BY created_at DESC`;
  params.push(limit);
  sql += ` LIMIT $${params.length}`;

  const result = await query<{
    id: string;
    run_date: string;
    status: ReconciliationStatus;
    entity_id_filter: string | null;
    period_id_filter: string | null;
    total_pairs_checked: number;
    balanced_count: number;
    discrepancy_count: number;
    tolerance: string;
    duration_ms: number;
    created_at: string;
  }>(sql, params);

  return result.rows.map((row) => ({
    id: row.id,
    run_date: String(row.run_date),
    status: row.status,
    entity_id_filter: row.entity_id_filter ?? undefined,
    period_id_filter: row.period_id_filter ?? undefined,
    total_pairs_checked: Number(row.total_pairs_checked),
    balanced_count: Number(row.balanced_count),
    discrepancy_count: Number(row.discrepancy_count),
    tolerance: Number(row.tolerance),
    duration_ms: Number(row.duration_ms),
    created_at: String(row.created_at),
  }));
}

/**
 * Get the latest reconciliation run (optionally filtered by entity).
 */
export async function getLatestReconciliationRun(
  entityId?: string,
): Promise<ReconciliationRunResult | null> {
  let sql = `SELECT id FROM reconciliation_runs`;
  const params: string[] = [];

  if (entityId) {
    params.push(entityId);
    sql += ` WHERE entity_id_filter = $1`;
  }

  sql += ` ORDER BY created_at DESC LIMIT 1`;

  const result = await query<{ id: string }>(sql, params);
  if (result.rows.length === 0) return null;

  return getReconciliationRun(result.rows[0].id);
}

// ============================================================
// Scheduler
// ============================================================

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the nightly reconciliation scheduler.
 * Runs at the specified interval (default: 24 hours).
 */
export function startReconciliationScheduler(
  intervalMs = 24 * 60 * 60 * 1000,
): void {
  if (schedulerInterval) {
    logger.warn('Reconciliation scheduler already running');
    return;
  }

  logger.info({ intervalMs }, 'Starting nightly reconciliation scheduler');

  schedulerInterval = setInterval(async () => {
    logger.info('Running scheduled reconciliation...');
    await runReconciliation();
  }, intervalMs);

  // Don't prevent Node from exiting
  schedulerInterval.unref();
}

/**
 * Stop the reconciliation scheduler.
 */
export function stopReconciliationScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('Reconciliation scheduler stopped');
  }
}
