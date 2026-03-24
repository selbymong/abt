/**
 * GL Invariant Tests (GL_INVARIANT_1 through GL_INVARIANT_5)
 *
 * These tests verify the fundamental accounting invariants of the
 * Enterprise Business Graph general ledger.
 *
 * Requires: Neo4j + PostgreSQL/TimescaleDB running
 */
import { describe, it, expect, afterAll } from 'vitest';
import { runCypher, closeNeo4j } from '../../src/lib/neo4j.js';
import { query, closePg } from '../../src/lib/pg.js';

afterAll(async () => {
  await closeNeo4j();
  await closePg();
});

describe('GL Invariants', () => {
  /**
   * GL_INVARIANT_1: Closed period — SUM(DEBIT) == SUM(CREDIT)
   *
   * For every SOFT_CLOSED or HARD_CLOSED period, the sum of all
   * debit LedgerLines must equal the sum of all credit LedgerLines.
   */
  it('GL_INVARIANT_1: closed period debits equal credits', async () => {
    const results = await runCypher<{
      period_id: string;
      total_debit: number;
      total_credit: number;
    }>(
      `MATCH (p:AccountingPeriod)
       WHERE p.status IN ['SOFT_CLOSED', 'HARD_CLOSED']
       OPTIONAL MATCH (l:LedgerLine)-[:POSTED_IN]->(j:JournalEntry {period_id: p.id})
       WITH p,
         COALESCE(SUM(CASE WHEN l.side = 'DEBIT' THEN l.functional_amount ELSE 0 END), 0) AS total_debit,
         COALESCE(SUM(CASE WHEN l.side = 'CREDIT' THEN l.functional_amount ELSE 0 END), 0) AS total_credit
       WHERE total_debit <> total_credit
       RETURN p.id AS period_id, total_debit, total_credit`,
    );

    expect(results).toHaveLength(0);
  });

  /**
   * GL_INVARIANT_2: Per JournalEntry — total_debit == total_credit
   *
   * Every JournalEntry node must have equal total_debit and total_credit.
   */
  it('GL_INVARIANT_2: every journal entry balances', async () => {
    const results = await runCypher<{ id: string; diff: number }>(
      `MATCH (j:JournalEntry)
       WHERE abs(j.total_debit - j.total_credit) > 0.001
       RETURN j.id AS id, j.total_debit - j.total_credit AS diff`,
    );

    expect(results).toHaveLength(0);
  });

  /**
   * GL_INVARIANT_3: Posted JournalEntry immutable (hash/audit verification)
   *
   * No JournalEntry with approval_status = 'APPROVED' should have a
   * transaction_time_end set (which would indicate modification).
   * In empty DB, this is trivially true.
   */
  it('GL_INVARIANT_3: posted entries are immutable', async () => {
    const results = await runCypher<{ id: string }>(
      `MATCH (j:JournalEntry)
       WHERE j.approval_status = 'APPROVED'
         AND j.transaction_time_end IS NOT NULL
       RETURN j.id AS id`,
    );

    expect(results).toHaveLength(0);
  });

  /**
   * GL_INVARIANT_4: TimescaleDB totals match Neo4j per (entity, period)
   *
   * The gl_period_balances projection must match the sum of LedgerLines
   * in Neo4j for every (entity_id, period_id) combination.
   */
  it('GL_INVARIANT_4: TimescaleDB matches Neo4j', async () => {
    // Get Neo4j totals
    const neo4jTotals = await runCypher<{
      entity_id: string;
      period_id: string;
      neo4j_debit: number;
      neo4j_credit: number;
    }>(
      `MATCH (j:JournalEntry)
       MATCH (l:LedgerLine {journal_entry_id: j.id})
       WITH j.entity_id AS entity_id, j.period_id AS period_id,
         SUM(CASE WHEN l.side = 'DEBIT' THEN l.functional_amount ELSE 0 END) AS neo4j_debit,
         SUM(CASE WHEN l.side = 'CREDIT' THEN l.functional_amount ELSE 0 END) AS neo4j_credit
       RETURN entity_id, period_id, neo4j_debit, neo4j_credit`,
    );

    for (const n4j of neo4jTotals) {
      const pgResult = await query<{ pg_debit: string; pg_credit: string }>(
        `SELECT COALESCE(SUM(debit_total), 0) AS pg_debit,
                COALESCE(SUM(credit_total), 0) AS pg_credit
         FROM gl_period_balances
         WHERE entity_id = $1 AND period_id = $2`,
        [n4j.entity_id, n4j.period_id],
      );

      const pgDebit = Number(pgResult.rows[0]?.pg_debit ?? 0);
      const pgCredit = Number(pgResult.rows[0]?.pg_credit ?? 0);

      expect(Math.abs(n4j.neo4j_debit - pgDebit)).toBeLessThan(0.01);
      expect(Math.abs(n4j.neo4j_credit - pgCredit)).toBeLessThan(0.01);
    }
  });

  /**
   * GL_INVARIANT_5: Open TemporalClaim has unprocessed schedule entries
   *
   * Every TemporalClaim with remaining_amount > 0 must have at least
   * one unprocessed entry in its recognition_schedule.
   */
  it('GL_INVARIANT_5: open temporal claims have unprocessed schedules', async () => {
    const results = await runCypher<{ id: string }>(
      `MATCH (tc:TemporalClaim)
       WHERE tc.remaining_amount > 0
         AND tc.status = 'ACTIVE'
         AND NOT ANY(entry IN tc.recognition_schedule WHERE entry.processed = false)
       RETURN tc.id AS id`,
    );

    expect(results).toHaveLength(0);
  });
});
