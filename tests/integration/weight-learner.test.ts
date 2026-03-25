/**
 * Weight Learner — Integration Tests
 *
 * Tests realization recording, weight back-propagation, calibration updates,
 * effective stake computation, value state transitions, and ontology boundary.
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
  createContributesToEdge,
  createAccountingPeriod,
} from '../../src/services/graph/graph-crud-service.js';
import {
  recordRealization,
  computeEffectiveStake,
  computeEntityEffectiveStakes,
  computeEffectiveContributions,
  transitionValueState,
  getCalibrationHistory,
  getCurrentCalibration,
} from '../../src/services/ai/weight-learner-service.js';

let caFpEntityId: string;
let caNfpEntityId: string;
let periodId: string;
let outcomeId: string;
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
  caNfpEntityId = entities.find((e) => e.entity_type === 'NOT_FOR_PROFIT' && e.jurisdiction === 'CA')!.id;

  periodId = track('AccountingPeriod', await createAccountingPeriod({
    entityId: caFpEntityId,
    label: 'Weight Learner Test Period',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
  }));

  // Create outcome with epistemic properties
  outcomeId = track('Outcome', await createOutcome({
    entityId: caFpEntityId,
    label: 'Revenue Improvement Q2',
    ontology: 'FINANCIAL',
    outcomeType: 'IMPROVE_REVENUE',
    targetDelta: 100000,
    currency: 'CAD',
    periodStart: '2026-04-01',
    periodEnd: '2026-06-30',
  }));

  // Set epistemic properties on the outcome
  await runCypher(
    `MATCH (o:Outcome {id: $id})
     SET o.value_state = 'ESTIMATED',
         o.uncertainty_type = 'EPISTEMIC',
         o.uncertainty_score = 0.3,
         o.ci_point_estimate = 100000,
         o.ci_lower_bound = 70000,
         o.ci_upper_bound = 130000,
         o.ci_confidence_pct = 0.70,
         o.ci_distribution = 'NORMAL',
         o.ci_estimation_method = 'ANALOGICAL',
         o.calibration_factor = 1.0,
         o.epistemic_priority = 0`,
    { id: outcomeId },
  );

  // Create activities that contribute to the outcome
  activity1Id = track('Activity', await createActivity({
    entityId: caFpEntityId,
    label: 'Sales Campaign A',
    status: 'IN_PROGRESS',
  }));

  // Set control properties on activity
  await runCypher(
    `MATCH (a:Activity {id: $id})
     SET a.control_class = 'DIRECT',
         a.control_score = 0.9,
         a.value_state = 'ESTIMATED',
         a.ci_point_estimate = 50000,
         a.ci_lower_bound = 30000,
         a.ci_upper_bound = 70000`,
    { id: activity1Id },
  );

  activity2Id = track('Activity', await createActivity({
    entityId: caFpEntityId,
    label: 'Marketing Initiative B',
    status: 'IN_PROGRESS',
  }));

  await runCypher(
    `MATCH (a:Activity {id: $id})
     SET a.control_class = 'DIRECT',
         a.control_score = 0.8,
         a.value_state = 'FORECASTED',
         a.ci_point_estimate = 30000,
         a.ci_lower_bound = 15000,
         a.ci_upper_bound = 45000`,
    { id: activity2Id },
  );

  // Create CONTRIBUTES_TO edges
  await createContributesToEdge({
    sourceId: activity1Id,
    targetId: outcomeId,
    weight: 0.6,
    confidence: 0.8,
    lagDays: 30,
    contributionFunction: 'LINEAR',
  });

  await createContributesToEdge({
    sourceId: activity2Id,
    targetId: outcomeId,
    weight: 0.4,
    confidence: 0.6,
    lagDays: 60,
    contributionFunction: 'LOGARITHMIC',
  });
});

afterAll(async () => {
  // Clean up calibration history
  await query('DELETE FROM calibration_history WHERE entity_id = $1', [caFpEntityId]);

  // Clean up edges
  for (const { id } of cleanupIds) {
    await runCypher(`MATCH (n {id: $id})-[r:CONTRIBUTES_TO]-() DELETE r`, { id });
  }

  // Clean up nodes
  for (const { label, id } of cleanupIds) {
    await runCypher(`MATCH (n:${label} {id: $id}) DETACH DELETE n`, { id });
  }

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

describe('Value State Transitions', () => {
  let transitionNodeId: string;

  beforeAll(async () => {
    transitionNodeId = track('Activity', await createActivity({
      entityId: caFpEntityId,
      label: 'State Transition Test',
      status: 'IN_PROGRESS',
    }));
    await runCypher(
      `MATCH (n {id: $id}) SET n.value_state = 'FORECASTED'`,
      { id: transitionNodeId },
    );
  });

  it('transitions FORECASTED → ESTIMATED', async () => {
    const result = await transitionValueState({
      nodeId: transitionNodeId,
      newState: 'ESTIMATED',
    });
    expect(result).toBe(true);

    const check = await runCypher<{ state: string }>(
      `MATCH (n {id: $id}) RETURN n.value_state AS state`,
      { id: transitionNodeId },
    );
    expect(check[0].state).toBe('ESTIMATED');
  });

  it('rejects ESTIMATED → VALIDATED without epistemic activity', async () => {
    await expect(
      transitionValueState({
        nodeId: transitionNodeId,
        newState: 'VALIDATED',
      }),
    ).rejects.toThrow(/epistemic_activity_id/);
  });

  it('allows ESTIMATED → VALIDATED with epistemic activity', async () => {
    const result = await transitionValueState({
      nodeId: transitionNodeId,
      newState: 'VALIDATED',
      epistemicActivityId: 'pilot-test-123',
    });
    expect(result).toBe(true);
  });

  it('rejects invalid transitions', async () => {
    await expect(
      transitionValueState({
        nodeId: transitionNodeId,
        newState: 'FORECASTED',
      }),
    ).rejects.toThrow(/Invalid state transition/);
  });
});

describe('Realization & Back-Propagation', () => {
  it('records realization and updates outcome', async () => {
    const result = await recordRealization({
      outcomeId,
      realizedDelta: 90000, // 90% of estimate
      periodId,
    });

    expect(result.accuracy).toBeCloseTo(0.9, 2);
    expect(result.edgesUpdated).toBeGreaterThanOrEqual(1);
    expect(result.calibrationBefore).toBe(1.0);
    expect(result.calibrationAfter).toBeLessThan(1.0); // accuracy < 1 pulls cal down
  });

  it('outcome is now REALIZED', async () => {
    const results = await runCypher<{ state: string; delta: number }>(
      `MATCH (o:Outcome {id: $id})
       RETURN o.value_state AS state, o.realized_delta AS delta`,
      { id: outcomeId },
    );
    expect(results[0].state).toBe('REALIZED');
    expect(Number(results[0].delta)).toBe(90000);
  });

  it('edge weights adjusted downward (accuracy < 1)', async () => {
    const edges = await runCypher<{ weight: number; targetId: string }>(
      `MATCH (a:Activity {id: $id})-[r:CONTRIBUTES_TO]->(o)
       RETURN r.weight AS weight, o.id AS targetId`,
      { id: activity1Id },
    );
    const edge = edges.find((e) => e.targetId === outcomeId);
    expect(edge).toBeDefined();
    // Original weight was 0.6, accuracy was 0.9, so should decrease slightly
    expect(Number(edge!.weight)).toBeLessThan(0.6);
  });

  it('second activity edge also adjusted', async () => {
    const edges = await runCypher<{ weight: number; targetId: string }>(
      `MATCH (a:Activity {id: $id})-[r:CONTRIBUTES_TO]->(o)
       RETURN r.weight AS weight, o.id AS targetId`,
      { id: activity2Id },
    );
    const edge = edges.find((e) => e.targetId === outcomeId);
    expect(edge).toBeDefined();
    expect(Number(edge!.weight)).toBeLessThan(0.4);
  });
});

describe('Calibration', () => {
  it('calibration history recorded', async () => {
    const history = await getCalibrationHistory(caFpEntityId, 'IMPROVE_REVENUE');
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].accuracy).toBeCloseTo(0.9, 2);
    expect(history[0].calibrationBefore).toBe(1.0);
  });

  it('current calibration reflects learning', async () => {
    const factor = await getCurrentCalibration(caFpEntityId, 'IMPROVE_REVENUE');
    // new_cal = 0.3 * 0.9 + 0.7 * 1.0 = 0.27 + 0.70 = 0.97
    expect(factor).toBeCloseTo(0.97, 2);
  });

  it('second realization further updates calibration', async () => {
    // Create another outcome for a second realization
    const outcome2Id = track('Outcome', await createOutcome({
      entityId: caFpEntityId,
      label: 'Revenue Improvement Q2-2',
      ontology: 'FINANCIAL',
      outcomeType: 'IMPROVE_REVENUE',
      targetDelta: 50000,
      currency: 'CAD',
      periodStart: '2026-04-01',
      periodEnd: '2026-06-30',
    }));

    await runCypher(
      `MATCH (o:Outcome {id: $id})
       SET o.value_state = 'ESTIMATED',
           o.ci_point_estimate = 50000`,
      { id: outcome2Id },
    );

    const result = await recordRealization({
      outcomeId: outcome2Id,
      realizedDelta: 55000, // 110% of estimate
      periodId,
    });

    expect(result.accuracy).toBeCloseTo(1.1, 2);
    // Second calibration should pull back toward accuracy
    // new = 0.3 * 1.1 + 0.7 * 0.97 = 0.33 + 0.679 = 1.009
    const factor = await getCurrentCalibration(caFpEntityId, 'IMPROVE_REVENUE');
    expect(factor).toBeGreaterThan(0.97);
  });
});

describe('Effective Stake', () => {
  it('computes effective stake for activity', async () => {
    const stake = await computeEffectiveStake(activity1Id);
    expect(stake).toBeDefined();
    expect(stake!.ciPointEstimate).toBe(50000);
    expect(stake!.valueState).toBe('ESTIMATED');
    expect(stake!.stateDiscount).toBe(0.45);
    expect(stake!.effectiveStake).toBeGreaterThan(0);
  });

  it('FORECASTED nodes get higher discount', async () => {
    const stake = await computeEffectiveStake(activity2Id);
    expect(stake).toBeDefined();
    expect(stake!.valueState).toBe('FORECASTED');
    expect(stake!.stateDiscount).toBe(0.30);
    // Effective stake should be lower due to higher discount
    expect(stake!.effectiveStake).toBeLessThan(stake!.ciPointEstimate);
  });

  it('computes entity-wide effective stakes', async () => {
    const stakes = await computeEntityEffectiveStakes(caFpEntityId);
    expect(stakes.length).toBeGreaterThanOrEqual(2);
    // Should be sorted by effectiveStake descending
    if (stakes.length >= 2) {
      expect(stakes[0].effectiveStake).toBeGreaterThanOrEqual(stakes[1].effectiveStake);
    }
  });

  it('wide CI penalizes effective stake', async () => {
    const stake = await computeEffectiveStake(activity2Id);
    expect(stake).toBeDefined();
    // CI width = (45000-15000)/30000 = 1.0, penalty = max(0, 1 - 1.0 * 0.18) = 0.82
    expect(stake!.ciWidthPenalty).toBeLessThan(1.0);
  });
});

describe('Effective Contribution', () => {
  it('computes effective contributions from activity', async () => {
    const contributions = await computeEffectiveContributions(activity1Id);
    expect(contributions.length).toBeGreaterThanOrEqual(1);

    const toOutcome = contributions.find((c) => c.targetId === outcomeId);
    expect(toOutcome).toBeDefined();
    // effective_contribution = weight × temporal_value_pct × control_score
    expect(toOutcome!.effectiveContribution).toBeGreaterThan(0);
    expect(toOutcome!.effectiveContribution).toBeLessThanOrEqual(1);
  });
});

describe('Ontology Boundary', () => {
  it('back-propagation does not cross ontology boundary', async () => {
    // Create an NFP outcome
    const nfpPeriodId = track('AccountingPeriod', await createAccountingPeriod({
      entityId: caNfpEntityId,
      label: 'NFP Weight Test Period',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
    }));

    const nfpOutcomeId = track('Outcome', await createOutcome({
      entityId: caNfpEntityId,
      label: 'Mission Delivery Test',
      ontology: 'MISSION',
      outcomeType: 'DELIVER_MISSION',
      targetDelta: 10000,
      currency: 'CAD',
      periodStart: '2026-04-01',
      periodEnd: '2026-06-30',
    }));

    await runCypher(
      `MATCH (o:Outcome {id: $id})
       SET o.value_state = 'ESTIMATED',
           o.ci_point_estimate = 10000`,
      { id: nfpOutcomeId },
    );

    // Create an FP activity that wrongly connects to NFP outcome
    // (this shouldn't happen in practice but tests boundary enforcement)
    const crossActivity = track('Activity', await createActivity({
      entityId: caFpEntityId,
      label: 'Cross-Ontology Activity',
      status: 'IN_PROGRESS',
    }));

    await runCypher(
      `MATCH (a:Activity {id: $aid}), (o:Outcome {id: $oid})
       CREATE (a)-[:CONTRIBUTES_TO {
         weight: 0.5, confidence: 0.7, lag_days: 10,
         temporal_value_pct: 0.97, ai_inferred: false,
         contribution_function: 'LINEAR', is_cross_asset_edge: false,
         ontology_bridge: false
       }]->(o)`,
      { aid: crossActivity, oid: nfpOutcomeId },
    );

    // Record realization — should NOT update the FP activity's edge
    const oldEdge = await runCypher<{ weight: number }>(
      `MATCH (a:Activity {id: $aid})-[r:CONTRIBUTES_TO]->(o:Outcome {id: $oid})
       RETURN r.weight AS weight`,
      { aid: crossActivity, oid: nfpOutcomeId },
    );
    const oldWeight = Number(oldEdge[0].weight);

    await recordRealization({
      outcomeId: nfpOutcomeId,
      realizedDelta: 8000, // 80% accuracy
      periodId: nfpPeriodId,
    });

    // The FP activity's edge should NOT have been updated (ontology boundary)
    const newEdge = await runCypher<{ weight: number }>(
      `MATCH (a:Activity {id: $aid})-[r:CONTRIBUTES_TO]->(o:Outcome {id: $oid})
       RETURN r.weight AS weight`,
      { aid: crossActivity, oid: nfpOutcomeId },
    );

    expect(Number(newEdge[0].weight)).toBe(oldWeight);
  });
});
