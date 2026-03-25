import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import { emit, type EBGEvent } from '../../lib/kafka.js';
import type { OutcomeOntology, ValueState } from '../../schema/neo4j/types.js';

// State discount map per docs
const STATE_DISCOUNT: Record<ValueState, number> = {
  FORECASTED: 0.30,
  ESTIMATED: 0.45,
  VALIDATED: 0.80,
  REALIZED: 1.00,
  STALE_ESTIMATED: 0.20,
};

// Max back-propagation depth
const MAX_HOPS = 6;

// Default learning rate — should be config-driven in production
const DEFAULT_LEARNING_RATE = 0.05;

// Exponential smoothing factor for calibration
const CALIBRATION_ALPHA = 0.3;

// ============================================================
// Record Realization
// ============================================================

export interface RecordRealizationInput {
  outcomeId: string;
  realizedDelta: number;
  periodId: string;
}

/**
 * Record a realization event on an Outcome node.
 * Triggers weight back-propagation and calibration update.
 */
export async function recordRealization(
  input: RecordRealizationInput,
): Promise<{
  accuracy: number;
  edgesUpdated: number;
  calibrationBefore: number;
  calibrationAfter: number;
}> {
  // 1. Get outcome node
  const outcomes = await runCypher<{
    o: Record<string, unknown>;
    entityOntology: OutcomeOntology;
  }>(
    `MATCH (o:Outcome {id: $id})
     MATCH (e:Entity {id: o.entity_id})
     RETURN properties(o) AS o, e.outcome_ontology AS entityOntology`,
    { id: input.outcomeId },
  );

  if (outcomes.length === 0) {
    throw new Error(`Outcome ${input.outcomeId} not found`);
  }

  const outcome = outcomes[0].o;
  const entityOntology = outcomes[0].entityOntology;
  const entityId = outcome.entity_id as string;
  const outcomeType = outcome.outcome_type as string;
  const ciPointEstimate = Number(outcome.ci_point_estimate ?? outcome.target_delta);

  if (ciPointEstimate === 0) {
    throw new Error('Cannot compute accuracy: ci_point_estimate is 0');
  }

  // 2. Update outcome with realization
  await runCypher(
    `MATCH (o:Outcome {id: $id})
     SET o.realized_delta = $realizedDelta,
         o.value_state = 'REALIZED',
         o.updated_at = datetime()`,
    { id: input.outcomeId, realizedDelta: input.realizedDelta },
  );

  // 3. Compute accuracy
  const accuracy = input.realizedDelta / ciPointEstimate;

  // 4. Back-propagate weights (ontology-aware)
  const edgesUpdated = await backPropagateWeights(
    input.outcomeId,
    accuracy,
    entityOntology,
    DEFAULT_LEARNING_RATE,
  );

  // 5. Update calibration factor
  const { before, after } = await updateCalibration(
    entityId,
    outcomeType,
    input.periodId,
    input.realizedDelta,
    ciPointEstimate,
    accuracy,
  );

  // 6. Emit realization event
  await emit('ebg.outcomes', {
    event_id: uuid(),
    event_type: 'REALIZATION_RECORDED',
    sequence_number: Date.now(),
    idempotency_key: `realization-${input.outcomeId}-${input.periodId}`,
    entity_id: entityId,
    period_id: input.periodId,
    timestamp: new Date().toISOString(),
    payload: {
      outcomeId: input.outcomeId,
      realizedDelta: input.realizedDelta,
      accuracy,
      edgesUpdated,
    },
  });

  return {
    accuracy: Math.round(accuracy * 10000) / 10000,
    edgesUpdated,
    calibrationBefore: before,
    calibrationAfter: after,
  };
}

// ============================================================
// Back-Propagation
// ============================================================

/**
 * Traverse ancestor CONTRIBUTES_TO edges up to MAX_HOPS and apply gradient descent.
 * Enforces ontology boundary — never updates edges that cross ontologies.
 */
async function backPropagateWeights(
  outcomeId: string,
  accuracy: number,
  targetOntology: OutcomeOntology,
  learningRate: number,
): Promise<number> {
  // Find all ancestor edges within MAX_HOPS
  // Use variable-length path pattern with hop limit
  const ancestors = await runCypher<{
    sourceId: string;
    targetId: string;
    weight: number;
    hops: number;
    sourceOntology: string | null;
  }>(
    `MATCH path = (source)-[:CONTRIBUTES_TO*1..${MAX_HOPS}]->(outcome:Outcome {id: $outcomeId})
     WITH source, relationships(path) AS rels, length(path) AS hops
     UNWIND rels AS r
     WITH startNode(r) AS s, endNode(r) AS t, r, hops
     OPTIONAL MATCH (sEntity:Entity {id: s.entity_id})
     RETURN s.id AS sourceId, t.id AS targetId,
            r.weight AS weight, hops,
            sEntity.outcome_ontology AS sourceOntology`,
    { outcomeId },
  );

  let updated = 0;
  const processedEdges = new Set<string>();

  for (const edge of ancestors) {
    const edgeKey = `${edge.sourceId}->${edge.targetId}`;
    if (processedEdges.has(edgeKey)) continue;
    processedEdges.add(edgeKey);

    // Ontology boundary check: skip if source entity has different ontology
    if (edge.sourceOntology && edge.sourceOntology !== targetOntology) {
      continue;
    }

    const oldWeight = Number(edge.weight);
    // Gradient descent: w_new = w_old + lr * (accuracy - 1)
    // Decay learning rate by hop distance
    const hopDecay = 1 / Number(edge.hops);
    const delta = learningRate * hopDecay * (accuracy - 1);
    let newWeight = oldWeight + delta;

    // Clamp to [0, 1]
    newWeight = Math.max(0, Math.min(1, newWeight));
    newWeight = Math.round(newWeight * 10000) / 10000;

    if (newWeight !== oldWeight) {
      await runCypher(
        `MATCH (s {id: $sourceId})-[r:CONTRIBUTES_TO]->(t {id: $targetId})
         SET r.weight = $newWeight, r.updated_at = datetime()`,
        { sourceId: edge.sourceId, targetId: edge.targetId, newWeight },
      );

      // Emit edge weight updated event
      await emit('ebg.graph', {
        event_id: uuid(),
        event_type: 'EDGE_WEIGHT_UPDATED',
        sequence_number: Date.now(),
        idempotency_key: `weight-${edge.sourceId}-${edge.targetId}-${Date.now()}`,
        entity_id: edge.sourceId,
        timestamp: new Date().toISOString(),
        payload: {
          sourceId: edge.sourceId,
          targetId: edge.targetId,
          oldWeight,
          newWeight,
          accuracy,
          hops: edge.hops,
        },
      });

      updated++;
    }
  }

  return updated;
}

// ============================================================
// Calibration
// ============================================================

/**
 * Update calibration factor for (entity, outcome_type) using exponential smoothing.
 * new_cal = alpha * accuracy + (1 - alpha) * old_cal
 */
async function updateCalibration(
  entityId: string,
  outcomeType: string,
  periodId: string,
  realizedDelta: number,
  ciPointEstimate: number,
  accuracy: number,
): Promise<{ before: number; after: number }> {
  // Get current calibration factor
  const calResult = await query<{ calibration_factor_after: string }>(
    `SELECT calibration_factor_after
     FROM calibration_history
     WHERE entity_id = $1 AND outcome_type = $2
     ORDER BY computed_at DESC LIMIT 1`,
    [entityId, outcomeType],
  );

  const oldCal = calResult.rows.length > 0
    ? Number(calResult.rows[0].calibration_factor_after)
    : 1.0;

  const newCal = Math.round(
    (CALIBRATION_ALPHA * accuracy + (1 - CALIBRATION_ALPHA) * oldCal) * 10000,
  ) / 10000;

  // Insert calibration history
  await query(
    `INSERT INTO calibration_history
       (entity_id, outcome_type, period_id, realized_delta, ci_point_estimate,
        accuracy, calibration_factor_before, calibration_factor_after)
     VALUES ($1, $2, $3, $4::numeric, $5::numeric, $6::numeric, $7::numeric, $8::numeric)`,
    [entityId, outcomeType, periodId, realizedDelta, ciPointEstimate, accuracy, oldCal, newCal],
  );

  return { before: oldCal, after: newCal };
}

// ============================================================
// Effective Stake Computation
// ============================================================

export interface EffectiveStake {
  nodeId: string;
  nodeLabel: string;
  ciPointEstimate: number;
  valueState: ValueState;
  stateDiscount: number;
  calibrationFactor: number;
  ciWidthPenalty: number;
  effectiveStake: number;
  blocked: boolean;
}

/**
 * Compute effective_stake for a node.
 * effective_stake = ci_point_estimate × state_discount × calibration_factor × ci_width_penalty
 * If effective_stake / ci_point_estimate < 0.30, node is HARD_BLOCKED.
 */
export async function computeEffectiveStake(nodeId: string): Promise<EffectiveStake | null> {
  const results = await runCypher<{ n: Record<string, unknown>; entityId: string; labels: string[] }>(
    `MATCH (n {id: $id})
     RETURN properties(n) AS n, n.entity_id AS entityId, labels(n) AS labels`,
    { id: nodeId },
  );

  if (results.length === 0) return null;

  const node = results[0].n;
  const entityId = results[0].entityId as string;
  const nodeLabel = (results[0].labels as string[])[0] ?? 'Unknown';

  const ciPoint = Number(node.ci_point_estimate ?? 0);
  if (ciPoint === 0) return null;

  const valueState = (node.value_state as ValueState) ?? 'FORECASTED';
  const stateDiscount = STATE_DISCOUNT[valueState] ?? 0.30;

  // Get calibration factor from history
  const outcomeType = (node.outcome_type as string) ?? 'UNKNOWN';
  const calResult = await query<{ calibration_factor_after: string }>(
    `SELECT calibration_factor_after
     FROM calibration_history
     WHERE entity_id = $1 AND outcome_type = $2
     ORDER BY computed_at DESC LIMIT 1`,
    [entityId, outcomeType],
  );
  const calibrationFactor = calResult.rows.length > 0
    ? Number(calResult.rows[0].calibration_factor_after)
    : 1.0;

  // CI width penalty
  const ciLower = Number(node.ci_lower_bound ?? 0);
  const ciUpper = Number(node.ci_upper_bound ?? 0);
  const ciWidthPct = ciPoint > 0 ? (ciUpper - ciLower) / ciPoint : 0;
  const ciWidthPenalty = Math.max(0, 1 - ciWidthPct * 0.18);

  const effectiveStake = Math.round(
    ciPoint * stateDiscount * calibrationFactor * ciWidthPenalty * 100,
  ) / 100;

  const ratio = ciPoint > 0 ? effectiveStake / ciPoint : 0;
  const blocked = ratio < 0.30;

  return {
    nodeId,
    nodeLabel,
    ciPointEstimate: ciPoint,
    valueState,
    stateDiscount,
    calibrationFactor,
    ciWidthPenalty: Math.round(ciWidthPenalty * 10000) / 10000,
    effectiveStake,
    blocked,
  };
}

/**
 * Compute effective stakes for all ESTIMATED/FORECASTED nodes for an entity.
 */
export async function computeEntityEffectiveStakes(
  entityId: string,
): Promise<EffectiveStake[]> {
  const results = await runCypher<{ id: string }>(
    `MATCH (n {entity_id: $entityId})
     WHERE n.value_state IN ['FORECASTED', 'ESTIMATED', 'VALIDATED']
       AND n.ci_point_estimate IS NOT NULL
     RETURN n.id AS id`,
    { entityId },
  );

  const stakes: EffectiveStake[] = [];
  for (const r of results) {
    const stake = await computeEffectiveStake(r.id);
    if (stake) stakes.push(stake);
  }

  return stakes.sort((a, b) => b.effectiveStake - a.effectiveStake);
}

// ============================================================
// Effective Contribution (edge-level)
// ============================================================

export interface EffectiveContribution {
  sourceId: string;
  targetId: string;
  weight: number;
  temporalValuePct: number;
  controlScore: number;
  effectiveContribution: number;
}

/**
 * Compute effective_contribution for all CONTRIBUTES_TO edges from a source node.
 * effective_contribution = weight × temporal_value_pct × control_score
 */
export async function computeEffectiveContributions(
  sourceId: string,
): Promise<EffectiveContribution[]> {
  const results = await runCypher<{
    targetId: string;
    weight: number;
    temporalValuePct: number;
    controlScore: number;
  }>(
    `MATCH (s {id: $sourceId})-[r:CONTRIBUTES_TO]->(t)
     RETURN t.id AS targetId,
            r.weight AS weight,
            r.temporal_value_pct AS temporalValuePct,
            COALESCE(s.control_score, 1.0) AS controlScore`,
    { sourceId },
  );

  return results.map((r) => {
    const w = Number(r.weight);
    const tvp = Number(r.temporalValuePct);
    const cs = Number(r.controlScore);
    return {
      sourceId,
      targetId: r.targetId,
      weight: w,
      temporalValuePct: tvp,
      controlScore: cs,
      effectiveContribution: Math.round(w * tvp * cs * 10000) / 10000,
    };
  });
}

// ============================================================
// Value State Transitions
// ============================================================

export interface TransitionValueStateInput {
  nodeId: string;
  newState: ValueState;
  epistemicActivityId?: string;
}

/**
 * Transition a node's value state.
 * FORECASTED → ESTIMATED requires no gate.
 * ESTIMATED → VALIDATED requires epistemic_activity_id.
 * VALIDATED → REALIZED handled by recordRealization.
 */
export async function transitionValueState(
  input: TransitionValueStateInput,
): Promise<boolean> {
  const results = await runCypher<{ state: ValueState; entityId: string }>(
    `MATCH (n {id: $id})
     RETURN n.value_state AS state, n.entity_id AS entityId`,
    { id: input.nodeId },
  );

  if (results.length === 0) return false;

  const currentState = results[0].state;
  const entityId = results[0].entityId;

  // Validate transition
  const validTransitions: Record<string, string[]> = {
    FORECASTED: ['ESTIMATED'],
    ESTIMATED: ['VALIDATED', 'STALE_ESTIMATED'],
    VALIDATED: ['REALIZED'],
    STALE_ESTIMATED: ['ESTIMATED'],
  };

  if (!validTransitions[currentState]?.includes(input.newState)) {
    throw new Error(
      `Invalid state transition: ${currentState} → ${input.newState}`,
    );
  }

  // ESTIMATED → VALIDATED requires epistemic activity
  if (currentState === 'ESTIMATED' && input.newState === 'VALIDATED' && !input.epistemicActivityId) {
    throw new Error(
      'ESTIMATED → VALIDATED requires epistemic_activity_id (pilot, A/B test, etc.)',
    );
  }

  await runCypher(
    `MATCH (n {id: $id})
     SET n.value_state = $newState,
         n.epistemic_activity_id = $activityId,
         n.updated_at = datetime()`,
    {
      id: input.nodeId,
      newState: input.newState,
      activityId: input.epistemicActivityId ?? null,
    },
  );

  // Emit state transition event
  await emit('ebg.outcomes', {
    event_id: uuid(),
    event_type: 'VALUE_STATE_TRANSITION',
    sequence_number: Date.now(),
    idempotency_key: `state-${input.nodeId}-${input.newState}-${Date.now()}`,
    entity_id: entityId,
    timestamp: new Date().toISOString(),
    payload: {
      nodeId: input.nodeId,
      fromState: currentState,
      toState: input.newState,
      epistemicActivityId: input.epistemicActivityId,
    },
  });

  return true;
}

// ============================================================
// Calibration Query
// ============================================================

/**
 * Get calibration history for an entity and outcome type.
 */
export async function getCalibrationHistory(
  entityId: string,
  outcomeType?: string,
): Promise<Array<{
  periodId: string;
  outcomeType: string;
  accuracy: number;
  calibrationBefore: number;
  calibrationAfter: number;
  computedAt: string;
}>> {
  const params: unknown[] = [entityId];
  let whereClause = 'WHERE entity_id = $1';
  if (outcomeType) {
    whereClause += ' AND outcome_type = $2';
    params.push(outcomeType);
  }

  const result = await query<{
    period_id: string;
    outcome_type: string;
    accuracy: string;
    calibration_factor_before: string;
    calibration_factor_after: string;
    computed_at: string;
  }>(
    `SELECT period_id, outcome_type, accuracy,
            calibration_factor_before, calibration_factor_after, computed_at
     FROM calibration_history
     ${whereClause}
     ORDER BY computed_at DESC`,
    params,
  );

  return result.rows.map((r) => ({
    periodId: r.period_id,
    outcomeType: r.outcome_type,
    accuracy: Number(r.accuracy),
    calibrationBefore: Number(r.calibration_factor_before),
    calibrationAfter: Number(r.calibration_factor_after),
    computedAt: r.computed_at,
  }));
}

/**
 * Get the current calibration factor for an entity/outcome_type.
 */
export async function getCurrentCalibration(
  entityId: string,
  outcomeType: string,
): Promise<number> {
  const result = await query<{ calibration_factor_after: string }>(
    `SELECT calibration_factor_after
     FROM calibration_history
     WHERE entity_id = $1 AND outcome_type = $2
     ORDER BY computed_at DESC LIMIT 1`,
    [entityId, outcomeType],
  );
  return result.rows.length > 0
    ? Number(result.rows[0].calibration_factor_after)
    : 1.0;
}
