/**
 * Forecast Snapshot Service
 *
 * Preserves point-in-time forecast values so they survive the arrival of actuals.
 * Core workflow:
 *   1. Create a snapshot — runs the rolling forecast and freezes every line.
 *   2. Later, pull a forecast-vs-actual report that joins the frozen forecast
 *      against current gl_period_balances to surface assumption errors.
 *
 * Three-way comparison: original budget → forecast (snapshot) → actual.
 */
import { v4 as uuid } from 'uuid';
import { query } from '../../lib/pg.js';
import {
  getBudget,
  getBudgetLines,
  generateRollingForecast,
  type VarianceType,
} from './budgeting-service.js';

// ============================================================
// Types
// ============================================================

export type SnapshotType = 'ROLLING' | 'MANUAL' | 'PERIOD_CLOSE';

export interface CreateSnapshotInput {
  budgetId: string;
  name: string;
  createdBy: string;
  completedPeriodIds: string[];
  remainingPeriodIds: string[];
  snapshotType?: SnapshotType;
  notes?: string;
}

export interface ForecastSnapshot {
  id: string;
  budget_id: string;
  entity_id: string;
  name: string;
  fiscal_year: number;
  currency: string;
  snapshot_type: SnapshotType;
  created_by: string;
  created_at: string;
  notes: string | null;
  line_count?: number;
}

export interface ForecastSnapshotLine {
  id: string;
  snapshot_id: string;
  period_id: string;
  node_ref_id: string;
  node_ref_type: string;
  economic_category: string;
  forecast_amount: number;
  budget_amount: number;
  adjustment_reason: string | null;
}

export interface ForecastVsActualItem {
  periodId: string;
  nodeRefId: string;
  nodeRefType: string;
  economicCategory: string;
  budgetAmount: number;
  forecastAmount: number;
  actualAmount: number;
  forecastVariance: number;
  forecastVariancePercent: number;
  varianceType: VarianceType;
}

export interface ForecastVsActualReport {
  snapshotId: string;
  snapshotName: string;
  entityId: string;
  fiscalYear: number;
  currency: string;
  snapshotDate: string;
  items: ForecastVsActualItem[];
  totalBudget: number;
  totalForecast: number;
  totalActual: number;
  totalForecastVariance: number;
}

// ============================================================
// Create Snapshot
// ============================================================

export async function createForecastSnapshot(input: CreateSnapshotInput): Promise<string> {
  const budget = await getBudget(input.budgetId);
  if (!budget) throw new Error(`Budget ${input.budgetId} not found`);

  const snapshotId = uuid();
  const snapshotType = input.snapshotType ?? 'ROLLING';

  // Generate rolling forecast for remaining periods
  const forecastItems = await generateRollingForecast(
    input.budgetId,
    input.completedPeriodIds,
    input.remainingPeriodIds,
  );

  // Also capture completed-period budget lines (their "forecast" is the actual)
  const allBudgetLines = await getBudgetLines(input.budgetId);
  const completedLines = allBudgetLines.filter((l) =>
    input.completedPeriodIds.includes(l.period_id),
  );

  // Insert snapshot header
  await query(
    `INSERT INTO forecast_snapshots
       (id, budget_id, entity_id, name, fiscal_year, currency, snapshot_type, created_by, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      snapshotId, budget.id, budget.entity_id, input.name,
      budget.fiscal_year, budget.currency, snapshotType,
      input.createdBy, input.notes ?? null,
    ],
  );

  // Insert forecast lines for remaining periods (from rolling forecast)
  for (const item of forecastItems) {
    // Find the matching budget line to get node_ref_type
    const matchingBudgetLine = allBudgetLines.find(
      (bl) =>
        bl.period_id === item.periodId &&
        bl.node_ref_id === item.nodeRefId &&
        bl.economic_category === item.economicCategory,
    );

    await query(
      `INSERT INTO forecast_snapshot_lines
         (id, snapshot_id, period_id, node_ref_id, node_ref_type, economic_category,
          forecast_amount, budget_amount, adjustment_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        uuid(), snapshotId, item.periodId, item.nodeRefId,
        matchingBudgetLine?.node_ref_type ?? 'UNKNOWN',
        item.economicCategory, item.forecastAmount, item.budgetAmount,
        item.adjustmentReason,
      ],
    );
  }

  // Insert lines for completed periods (forecast = actual at snapshot time)
  for (const line of completedLines) {
    // For completed periods, fetch the actual from gl_period_balances
    const actualResult = await query(
      `SELECT COALESCE(SUM(net_balance), 0) AS net
       FROM gl_period_balances
       WHERE entity_id = $1 AND period_id = $2
         AND node_ref_id = $3 AND economic_category = $4`,
      [budget.entity_id, line.period_id, line.node_ref_id, line.economic_category],
    );
    const actualAmount = Number(actualResult.rows[0]?.net ?? 0);

    await query(
      `INSERT INTO forecast_snapshot_lines
         (id, snapshot_id, period_id, node_ref_id, node_ref_type, economic_category,
          forecast_amount, budget_amount, adjustment_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        uuid(), snapshotId, line.period_id, line.node_ref_id,
        line.node_ref_type, line.economic_category,
        actualAmount, Number(line.amount),
        'Completed period — forecast equals actual at snapshot time',
      ],
    );
  }

  return snapshotId;
}

// ============================================================
// List / Get / Delete
// ============================================================

export async function listForecastSnapshots(
  entityId: string,
  budgetId?: string,
  fiscalYear?: number,
): Promise<ForecastSnapshot[]> {
  let sql = `SELECT s.*, COUNT(l.id)::int AS line_count
             FROM forecast_snapshots s
             LEFT JOIN forecast_snapshot_lines l ON l.snapshot_id = s.id
             WHERE s.entity_id = $1`;
  const params: unknown[] = [entityId];
  let idx = 2;

  if (budgetId) {
    sql += ` AND s.budget_id = $${idx++}`;
    params.push(budgetId);
  }
  if (fiscalYear) {
    sql += ` AND s.fiscal_year = $${idx++}`;
    params.push(fiscalYear);
  }

  sql += ' GROUP BY s.id ORDER BY s.created_at DESC';
  const result = await query(sql, params);
  return result.rows as ForecastSnapshot[];
}

export async function getForecastSnapshot(
  snapshotId: string,
): Promise<{ snapshot: ForecastSnapshot; lines: ForecastSnapshotLine[] } | null> {
  const snapResult = await query(
    'SELECT * FROM forecast_snapshots WHERE id = $1',
    [snapshotId],
  );
  if (snapResult.rows.length === 0) return null;

  const linesResult = await query(
    `SELECT * FROM forecast_snapshot_lines
     WHERE snapshot_id = $1
     ORDER BY period_id, economic_category`,
    [snapshotId],
  );

  return {
    snapshot: snapResult.rows[0] as ForecastSnapshot,
    lines: linesResult.rows as ForecastSnapshotLine[],
  };
}

export async function deleteForecastSnapshot(snapshotId: string): Promise<void> {
  // CASCADE deletes lines
  const result = await query('DELETE FROM forecast_snapshots WHERE id = $1', [snapshotId]);
  if (result.rowCount === 0) throw new Error(`Snapshot ${snapshotId} not found`);
}

// ============================================================
// Forecast vs Actual Report
// ============================================================

export async function getForecastVsActualReport(
  snapshotId: string,
  periodIds?: string[],
): Promise<ForecastVsActualReport> {
  const data = await getForecastSnapshot(snapshotId);
  if (!data) throw new Error(`Snapshot ${snapshotId} not found`);

  const { snapshot, lines } = data;

  // Filter lines by period if requested
  const filteredLines = periodIds && periodIds.length > 0
    ? lines.filter((l) => periodIds.includes(l.period_id))
    : lines;

  // Get current actuals from gl_period_balances
  const uniquePeriods = [...new Set(filteredLines.map((l) => l.period_id))];

  const actuals = new Map<string, number>();
  if (uniquePeriods.length > 0) {
    const actualsResult = await query(
      `SELECT period_id, node_ref_id, economic_category,
              SUM(net_balance) AS net
       FROM gl_period_balances
       WHERE entity_id = $1 AND period_id = ANY($2)
       GROUP BY period_id, node_ref_id, economic_category`,
      [snapshot.entity_id, uniquePeriods],
    );

    for (const row of actualsResult.rows as any[]) {
      const key = `${row.period_id}:${row.node_ref_id}:${row.economic_category}`;
      actuals.set(key, Number(row.net));
    }
  }

  // Build variance items
  const items: ForecastVsActualItem[] = filteredLines.map((line) => {
    const key = `${line.period_id}:${line.node_ref_id}:${line.economic_category}`;
    const forecastAmount = Number(line.forecast_amount);
    const budgetAmount = Number(line.budget_amount);
    const actualAmount = actuals.get(key) ?? 0;
    const forecastVariance = actualAmount - forecastAmount;
    const forecastVariancePercent = forecastAmount !== 0
      ? Math.round((forecastVariance / Math.abs(forecastAmount)) * 10000) / 100
      : 0;

    const isExpense = line.economic_category === 'EXPENSE';
    let varianceType: VarianceType;
    if (Math.abs(forecastVariance) < 0.01) {
      varianceType = 'ON_TARGET';
    } else if (isExpense) {
      // Spending less than forecast is favorable
      varianceType = forecastVariance < 0 ? 'FAVORABLE' : 'UNFAVORABLE';
    } else {
      // Earning more than forecast is favorable
      varianceType = forecastVariance > 0 ? 'FAVORABLE' : 'UNFAVORABLE';
    }

    return {
      periodId: line.period_id,
      nodeRefId: line.node_ref_id,
      nodeRefType: line.node_ref_type,
      economicCategory: line.economic_category,
      budgetAmount,
      forecastAmount,
      actualAmount,
      forecastVariance: Math.round(forecastVariance * 100) / 100,
      forecastVariancePercent,
      varianceType,
    };
  });

  const totalBudget = items.reduce((s, i) => s + i.budgetAmount, 0);
  const totalForecast = items.reduce((s, i) => s + i.forecastAmount, 0);
  const totalActual = items.reduce((s, i) => s + i.actualAmount, 0);
  const totalForecastVariance = Math.round((totalActual - totalForecast) * 100) / 100;

  return {
    snapshotId,
    snapshotName: snapshot.name,
    entityId: snapshot.entity_id,
    fiscalYear: snapshot.fiscal_year,
    currency: snapshot.currency,
    snapshotDate: snapshot.created_at,
    items,
    totalBudget,
    totalForecast,
    totalActual,
    totalForecastVariance,
  };
}
