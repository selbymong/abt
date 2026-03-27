/**
 * Outcome Attribution P&L — Integration Tests
 *
 * Tests P&L breakdown by Outcome via CONTRIBUTES_TO graph traversal.
 * Verifies that revenue/expenses flow through graph paths and attribute
 * proportionally to outcomes based on effective contribution weights.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { query, closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import {
  getAllEntities,
  createAccountingPeriod,
  createOutcome,
  createActivity,
  createContributesToEdge,
} from '../../src/services/graph/graph-crud-service.js';
import { getOutcomeAttributedPnL } from '../../src/services/gl/reporting-service.js';

let caFpEntityId: string;
let periodId: string;
let outcome1Id: string;
let outcome2Id: string;
let activity1Id: string;
let activity2Id: string;
const cleanupIds: { label: string; id: string }[] = [];

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  caFpEntityId = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'CA')!.id;

  // Create period
  periodId = track('AccountingPeriod', await createAccountingPeriod({
    entityId: caFpEntityId,
    label: 'Attribution Test Q1',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
  }));

  // Create two outcomes
  outcome1Id = track('Outcome', await createOutcome({
    entityId: caFpEntityId,
    label: 'Revenue Growth',
    ontology: 'FINANCIAL',
    outcomeType: 'IMPROVE_REVENUE',
    targetDelta: 100000,
    currency: 'CAD',
    periodStart: '2026-01-01',
    periodEnd: '2026-12-31',
  }));

  outcome2Id = track('Outcome', await createOutcome({
    entityId: caFpEntityId,
    label: 'Cost Reduction',
    ontology: 'FINANCIAL',
    outcomeType: 'MITIGATE_EXPENSE',
    targetDelta: 50000,
    currency: 'CAD',
    periodStart: '2026-01-01',
    periodEnd: '2026-12-31',
  }));

  // Create two activities
  activity1Id = track('Activity', await createActivity({
    entityId: caFpEntityId,
    label: 'Sales Campaign',
  }));

  activity2Id = track('Activity', await createActivity({
    entityId: caFpEntityId,
    label: 'Ops Efficiency',
  }));

  // Create CONTRIBUTES_TO edges:
  // activity1 --0.8--> outcome1 (Revenue Growth)
  // activity1 --0.3--> outcome2 (Cost Reduction)
  // activity2 --0.6--> outcome2 (Cost Reduction)
  await createContributesToEdge({
    sourceId: activity1Id,
    targetId: outcome1Id,
    weight: 0.8,
    confidence: 0.9,
    contributionFunction: 'LINEAR',
  });

  await createContributesToEdge({
    sourceId: activity1Id,
    targetId: outcome2Id,
    weight: 0.3,
    confidence: 0.7,
    contributionFunction: 'LINEAR',
  });

  await createContributesToEdge({
    sourceId: activity2Id,
    targetId: outcome2Id,
    weight: 0.6,
    confidence: 0.85,
    contributionFunction: 'LINEAR',
  });

  // Seed P&L balances in TimescaleDB:
  // activity1 → 50K revenue, 10K expenses
  // activity2 → 0 revenue, 20K expenses
  // unlinked node → 5K revenue (should be unattributed)
  const unlinkedId = 'a0000000-0000-0000-0000-000000000001';

  await query(
    `INSERT INTO gl_period_balances (id, entity_id, period_id, node_ref_id, node_ref_type, economic_category, debit_total, credit_total, net_balance, updated_at)
     VALUES
       (gen_random_uuid(), $1, $2, $3, 'ACTIVITY', 'REVENUE', 0, 50000, -50000, NOW()),
       (gen_random_uuid(), $1, $2, $3, 'ACTIVITY', 'EXPENSE', 10000, 0, 10000, NOW()),
       (gen_random_uuid(), $1, $2, $4, 'ACTIVITY', 'EXPENSE', 20000, 0, 20000, NOW()),
       (gen_random_uuid(), $1, $2, $5::uuid, 'ACTIVITY', 'REVENUE', 0, 5000, -5000, NOW())
     ON CONFLICT DO NOTHING`,
    [caFpEntityId, periodId, activity1Id, activity2Id, unlinkedId],
  );
});

afterAll(async () => {
  // Cleanup graph nodes and edges
  for (const { id } of [...cleanupIds].reverse()) {
    try {
      await runCypher(`MATCH (n {id: $id}) DETACH DELETE n`, { id });
    } catch { /* ignore */ }
  }
  // Cleanup TimescaleDB test data
  await query(`DELETE FROM gl_period_balances WHERE period_id = $1`, [periodId]).catch(() => {});
  await Promise.all([closeNeo4j(), closePg(), closeKafka()]);
});

describe('P7-OUTCOME-ATTRIBUTION-PNL', () => {
  it('should return attributed P&L broken down by outcome', async () => {
    const result = await getOutcomeAttributedPnL(caFpEntityId, periodId);

    expect(result.entityId).toBe(caFpEntityId);
    expect(result.periodId).toBe(periodId);
    expect(result.totalRevenue).toBe(55000); // 50K + 5K
    expect(result.totalExpenses).toBe(30000); // 10K + 20K
    expect(result.totalNetIncome).toBe(25000); // 55K - 30K
  });

  it('should attribute activity1 revenue/expenses across its two outcomes', async () => {
    const result = await getOutcomeAttributedPnL(caFpEntityId, periodId);

    // activity1 connects to outcome1 (w=0.8) and outcome2 (w=0.3)
    // Normalized: outcome1 gets 0.8/(0.8+0.3)=0.727, outcome2 gets 0.3/(0.8+0.3)=0.273
    const outcome1 = result.attributedToOutcomes.find((a) => a.outcomeId === outcome1Id);
    const outcome2 = result.attributedToOutcomes.find((a) => a.outcomeId === outcome2Id);

    expect(outcome1).toBeTruthy();
    expect(outcome2).toBeTruthy();

    // outcome1 gets ~72.7% of activity1's 50K revenue = ~36,363.64
    expect(outcome1!.revenue).toBeGreaterThan(35000);
    expect(outcome1!.revenue).toBeLessThan(40000);

    // outcome2 gets activity2's full 20K expenses + share of activity1
    expect(outcome2!.expenses).toBeGreaterThan(20000);
  });

  it('should have unattributed amounts for nodes without graph paths', async () => {
    const result = await getOutcomeAttributedPnL(caFpEntityId, periodId);

    // The unlinked node's 5K revenue should be unattributed
    expect(result.unattributed.revenue).toBe(5000);
  });

  it('should include node breakdown per outcome', async () => {
    const result = await getOutcomeAttributedPnL(caFpEntityId, periodId);

    const outcome1 = result.attributedToOutcomes.find((a) => a.outcomeId === outcome1Id);
    expect(outcome1!.nodeBreakdown.length).toBeGreaterThanOrEqual(1);

    // activity1 should appear in outcome1's breakdown
    const a1Breakdown = outcome1!.nodeBreakdown.find((n) => n.nodeRefId === activity1Id);
    expect(a1Breakdown).toBeTruthy();
    expect(a1Breakdown!.weight).toBeGreaterThan(0);
  });

  it('should compute attribution percentages', async () => {
    const result = await getOutcomeAttributedPnL(caFpEntityId, periodId);

    // Sum of attribution percentages for attributed outcomes should sum to ~1
    // (minus unattributed portion)
    const totalAttrPct = result.attributedToOutcomes.reduce((s, a) => s + a.attributionPct, 0);
    // Won't be exactly 1 due to unattributed amounts, but should be close
    expect(totalAttrPct).toBeGreaterThan(0);
    expect(totalAttrPct).toBeLessThanOrEqual(1.01);
  });

  it('should handle empty period gracefully', async () => {
    const emptyPeriodId = 'f0000000-0000-0000-0000-000000000099';
    const result = await getOutcomeAttributedPnL(caFpEntityId, emptyPeriodId);

    expect(result.totalRevenue).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.attributedToOutcomes).toHaveLength(0);
  });
});
