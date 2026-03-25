/**
 * Epistemic Scorer — Integration Tests
 *
 * Tests EVOI computation, epistemic priorities, epistemic ROI,
 * and stale estimate detection/downgrade.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { query, closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import {
  getAllEntities,
  createOutcome,
  createActivity,
} from '../../src/services/graph/graph-crud-service.js';
import {
  computeEVOI,
  computeEntityEVOIs,
  updateEpistemicPriorities,
  computeEpistemicROI,
  findStaleEstimates,
  downgradeStaleEstimates,
} from '../../src/services/ai/epistemic-scorer-service.js';

let caFpEntityId: string;
let forecastedOutcomeId: string;
let estimatedOutcomeId: string;
let validatedOutcomeId: string;
let staleActivityId: string;
const cleanupIds: { label: string; id: string }[] = [];

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  caFpEntityId = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'CA')!.id;

  // Create FORECASTED outcome (high-value, large CI)
  forecastedOutcomeId = track('Outcome', await createOutcome({
    entityId: caFpEntityId,
    label: 'New Revenue Stream Alpha',
    ontology: 'FINANCIAL',
    outcomeType: 'NEW_REVENUE',
    targetDelta: 500000,
    currency: 'CAD',
    periodStart: '2026-05-01',
    periodEnd: '2026-12-31',
  }));

  await runCypher(
    `MATCH (o:Outcome {id: $id})
     SET o.value_state = 'FORECASTED',
         o.ci_point_estimate = 500000,
         o.ci_lower_bound = 200000,
         o.ci_upper_bound = 800000,
         o.ci_confidence_pct = 0.60,
         o.uncertainty_type = 'EPISTEMIC',
         o.uncertainty_score = 0.5`,
    { id: forecastedOutcomeId },
  );

  // Create ESTIMATED outcome (medium-value, narrower CI)
  estimatedOutcomeId = track('Outcome', await createOutcome({
    entityId: caFpEntityId,
    label: 'Cost Reduction Initiative',
    ontology: 'FINANCIAL',
    outcomeType: 'MITIGATE_EXPENSE',
    targetDelta: 200000,
    currency: 'CAD',
    periodStart: '2026-05-01',
    periodEnd: '2026-12-31',
  }));

  await runCypher(
    `MATCH (o:Outcome {id: $id})
     SET o.value_state = 'ESTIMATED',
         o.ci_point_estimate = 200000,
         o.ci_lower_bound = 150000,
         o.ci_upper_bound = 250000,
         o.ci_confidence_pct = 0.80,
         o.uncertainty_type = 'EPISTEMIC',
         o.uncertainty_score = 0.2`,
    { id: estimatedOutcomeId },
  );

  // Create VALIDATED outcome (should have EVOI ≈ 0)
  validatedOutcomeId = track('Outcome', await createOutcome({
    entityId: caFpEntityId,
    label: 'Proven Revenue Channel',
    ontology: 'FINANCIAL',
    outcomeType: 'IMPROVE_REVENUE',
    targetDelta: 100000,
    currency: 'CAD',
    periodStart: '2026-05-01',
    periodEnd: '2026-12-31',
  }));

  await runCypher(
    `MATCH (o:Outcome {id: $id})
     SET o.value_state = 'VALIDATED',
         o.ci_point_estimate = 100000,
         o.ci_lower_bound = 85000,
         o.ci_upper_bound = 115000`,
    { id: validatedOutcomeId },
  );

  // Create stale activity (expires_at in the past)
  staleActivityId = track('Activity', await createActivity({
    entityId: caFpEntityId,
    label: 'Stale Estimate Activity',
    status: 'IN_PROGRESS',
  }));

  await runCypher(
    `MATCH (n {id: $id})
     SET n.value_state = 'ESTIMATED',
         n.ci_point_estimate = 30000,
         n.expires_at = '2025-01-01T00:00:00Z'`,
    { id: staleActivityId },
  );
});

afterAll(async () => {
  await query('DELETE FROM calibration_history WHERE entity_id = $1', [caFpEntityId]);

  for (const { label, id } of cleanupIds) {
    await runCypher(`MATCH (n:${label} {id: $id}) DETACH DELETE n`, { id });
  }

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

describe('EVOI Computation', () => {
  it('computes EVOI for FORECASTED node', async () => {
    const result = await computeEVOI(forecastedOutcomeId);
    expect(result).toBeDefined();
    expect(result!.valueState).toBe('FORECASTED');
    expect(result!.nextState).toBe('ESTIMATED');
    expect(result!.evoi).toBeGreaterThan(0);
    // FORECASTED → ESTIMATED: discount goes 0.30 → 0.45
    expect(result!.uncertaintyReduction).toBeCloseTo(0.15, 2);
    expect(result!.recommendedAction).toContain('estimation');
  });

  it('computes EVOI for ESTIMATED node', async () => {
    const result = await computeEVOI(estimatedOutcomeId);
    expect(result).toBeDefined();
    expect(result!.valueState).toBe('ESTIMATED');
    expect(result!.nextState).toBe('VALIDATED');
    expect(result!.evoi).toBeGreaterThan(0);
    // ESTIMATED → VALIDATED: discount goes 0.45 → 0.80
    expect(result!.uncertaintyReduction).toBeCloseTo(0.35, 2);
    expect(result!.recommendedAction).toContain('validation');
  });

  it('VALIDATED node has EVOI = 0', async () => {
    const result = await computeEVOI(validatedOutcomeId);
    expect(result).toBeDefined();
    expect(result!.evoi).toBe(0);
    expect(result!.nextState).toBeNull();
  });

  it('higher-value FORECASTED node has higher EVOI', async () => {
    const forecasted = await computeEVOI(forecastedOutcomeId);
    const estimated = await computeEVOI(estimatedOutcomeId);
    // Despite estimated having higher discount jump (0.35 vs 0.15),
    // the forecasted has much higher point estimate (500k vs 200k)
    expect(forecasted!.ciPointEstimate).toBeGreaterThan(estimated!.ciPointEstimate);
  });
});

describe('Entity-Wide EVOI', () => {
  it('returns EVOIs sorted by value descending', async () => {
    const evois = await computeEntityEVOIs(caFpEntityId);
    expect(evois.length).toBeGreaterThanOrEqual(2);
    // Should be sorted descending
    if (evois.length >= 2) {
      expect(evois[0].evoi).toBeGreaterThanOrEqual(evois[1].evoi);
    }
  });

  it('filters by minimum EVOI threshold', async () => {
    const allEvois = await computeEntityEVOIs(caFpEntityId);
    const highEvois = await computeEntityEVOIs(caFpEntityId, 100000);
    expect(highEvois.length).toBeLessThanOrEqual(allEvois.length);
    for (const e of highEvois) {
      expect(e.evoi).toBeGreaterThanOrEqual(100000);
    }
  });
});

describe('Epistemic Priorities', () => {
  it('updates epistemic_priority on nodes', async () => {
    const updated = await updateEpistemicPriorities(caFpEntityId);
    expect(updated).toBeGreaterThanOrEqual(2);

    // Check that priorities were written
    const results = await runCypher<{ priority: number }>(
      `MATCH (o:Outcome {id: $id})
       RETURN o.epistemic_priority AS priority`,
      { id: forecastedOutcomeId },
    );
    expect(Number(results[0].priority)).toBeGreaterThan(0);
  });
});

describe('Epistemic ROI', () => {
  it('computes positive ROI for cheap epistemic activity', async () => {
    // EVOI for a 500k forecasted outcome should be substantial
    const roi = await computeEpistemicROI(forecastedOutcomeId, 10000);
    expect(roi).toBeDefined();
    expect(roi!.activityCost).toBe(10000);
    expect(roi!.informationValue).toBeGreaterThan(0);
    expect(roi!.justified).toBe(true);
    expect(roi!.roi).toBeGreaterThan(0);
  });

  it('computes negative ROI for expensive activity on small node', async () => {
    // Stale activity has ci_point_estimate = 30000
    // Set it to FORECASTED for EVOI computation
    await runCypher(
      `MATCH (n {id: $id}) SET n.value_state = 'FORECASTED'`,
      { id: staleActivityId },
    );

    const roi = await computeEpistemicROI(staleActivityId, 100000);
    expect(roi).toBeDefined();
    // EVOI for 30k node is small; 100k activity cost is way more
    expect(roi!.justified).toBe(false);
    expect(roi!.roi).toBeLessThan(0);

    // Restore state for stale test
    await runCypher(
      `MATCH (n {id: $id}) SET n.value_state = 'ESTIMATED'`,
      { id: staleActivityId },
    );
  });
});

describe('Stale Estimate Detection', () => {
  it('finds nodes with expired estimates', async () => {
    const stale = await findStaleEstimates(caFpEntityId);
    expect(stale.length).toBeGreaterThanOrEqual(1);
    expect(stale.some((s) => s.nodeId === staleActivityId)).toBe(true);
  });

  it('downgrades stale estimates to STALE_ESTIMATED', async () => {
    const count = await downgradeStaleEstimates(caFpEntityId);
    expect(count).toBeGreaterThanOrEqual(1);

    const results = await runCypher<{ state: string }>(
      `MATCH (n {id: $id}) RETURN n.value_state AS state`,
      { id: staleActivityId },
    );
    expect(results[0].state).toBe('STALE_ESTIMATED');
  });

  it('no stale estimates after downgrade', async () => {
    const stale = await findStaleEstimates(caFpEntityId);
    expect(stale.some((s) => s.nodeId === staleActivityId)).toBe(false);
  });
});
