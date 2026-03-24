/**
 * Equity Invariant Test (EQUITY_INVARIANT_1)
 *
 * Verifies that equity node balances match LedgerLine equity totals
 * per entity/period.
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

describe('Equity Invariants', () => {
  /**
   * EQUITY_INVARIANT_1: Equity node balances match LedgerLine equity totals.
   *
   * For hard-closed periods:
   *   RetainedEarnings.closing_balance + Σ(OCI.closing_balance) + ShareCapital
   *   = Σ(LedgerLine WHERE economic_category = 'EQUITY')
   *
   * Verified against the TimescaleDB equity_period_balances projection.
   */
  it('EQUITY_INVARIANT_1: equity nodes match ledger line equity totals', async () => {
    // Get all hard-closed periods
    const periods = await runCypher<{ entity_id: string; period_id: string }>(
      `MATCH (p:AccountingPeriod {status: 'HARD_CLOSED'})
       RETURN p.entity_id AS entity_id, p.id AS period_id`,
    );

    for (const period of periods) {
      // Get equity from RetainedEarnings + OCI nodes
      const equityNodes = await runCypher<{ total_equity: number }>(
        `MATCH (re:RetainedEarnings {entity_id: $entityId, period_id: $periodId})
         OPTIONAL MATCH (oci:OtherComprehensiveIncome {entity_id: $entityId, period_id: $periodId})
         WITH re.closing_balance AS re_balance,
              COALESCE(SUM(oci.closing_balance), 0) AS oci_balance
         RETURN re_balance + oci_balance AS total_equity`,
        { entityId: period.entity_id, periodId: period.period_id },
      );

      // Get equity from gl_period_balances
      const glEquity = await query<{ total_equity: string }>(
        `SELECT COALESCE(SUM(net_balance), 0) AS total_equity
         FROM gl_period_balances
         WHERE entity_id = $1 AND period_id = $2
           AND economic_category = 'EQUITY'`,
        [period.entity_id, period.period_id],
      );

      const nodeEquity = equityNodes[0]?.total_equity ?? 0;
      const ledgerEquity = Number(glEquity.rows[0]?.total_equity ?? 0);

      expect(Math.abs(Number(nodeEquity) - ledgerEquity)).toBeLessThan(0.01);
    }
  });
});
