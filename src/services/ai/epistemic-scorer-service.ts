import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import type { ValueState } from '../../schema/neo4j/types.js';

// State discount map
const STATE_DISCOUNT: Record<ValueState, number> = {
  FORECASTED: 0.30,
  ESTIMATED: 0.45,
  VALIDATED: 0.80,
  REALIZED: 1.00,
  STALE_ESTIMATED: 0.20,
};

// Next state for EVOI computation
const NEXT_STATE: Partial<Record<ValueState, ValueState>> = {
  FORECASTED: 'ESTIMATED',
  ESTIMATED: 'VALIDATED',
};

// ============================================================
// EVOI Computation
// ============================================================

export interface EVOIResult {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  valueState: ValueState;
  ciPointEstimate: number;
  currentEffectiveStake: number;
  nextState: ValueState | null;
  nextEffectiveStake: number;
  uncertaintyReduction: number;
  evoi: number;
  recommendedAction: string;
}

/**
 * Compute Expected Value of Information (EVOI) for a node.
 * EVOI = Δ(effective_stake) when advancing to next value state.
 * This represents the information value of reducing uncertainty.
 */
export async function computeEVOI(nodeId: string): Promise<EVOIResult | null> {
  const results = await runCypher<{
    n: Record<string, unknown>;
    labels: string[];
    entityId: string;
  }>(
    `MATCH (n {id: $id})
     RETURN properties(n) AS n, labels(n) AS labels, n.entity_id AS entityId`,
    { id: nodeId },
  );

  if (results.length === 0) return null;

  const node = results[0].n;
  const labels = results[0].labels as string[];
  const entityId = results[0].entityId as string;
  const nodeLabel = (node.label as string) ?? labels[0];
  const nodeType = labels[0];

  const ciPoint = Number(node.ci_point_estimate ?? 0);
  if (ciPoint === 0) return null;

  const valueState = (node.value_state as ValueState) ?? 'FORECASTED';
  const currentDiscount = STATE_DISCOUNT[valueState] ?? 0.30;
  const nextState = NEXT_STATE[valueState] ?? null;

  // Get calibration factor
  const outcomeType = (node.outcome_type as string) ?? 'UNKNOWN';
  const calResult = await query<{ calibration_factor_after: string }>(
    `SELECT calibration_factor_after
     FROM calibration_history
     WHERE entity_id = $1 AND outcome_type = $2
     ORDER BY computed_at DESC LIMIT 1`,
    [entityId, outcomeType],
  );
  const calibration = calResult.rows.length > 0
    ? Number(calResult.rows[0].calibration_factor_after)
    : 1.0;

  // CI width penalty
  const ciLower = Number(node.ci_lower_bound ?? 0);
  const ciUpper = Number(node.ci_upper_bound ?? 0);
  const ciWidthPct = ciPoint > 0 ? (ciUpper - ciLower) / ciPoint : 0;
  const ciWidthPenalty = Math.max(0, 1 - ciWidthPct * 0.18);

  const currentEffectiveStake = Math.round(
    ciPoint * currentDiscount * calibration * ciWidthPenalty * 100,
  ) / 100;

  if (!nextState) {
    return {
      nodeId,
      nodeLabel,
      nodeType,
      valueState,
      ciPointEstimate: ciPoint,
      currentEffectiveStake,
      nextState: null,
      nextEffectiveStake: currentEffectiveStake,
      uncertaintyReduction: 0,
      evoi: 0,
      recommendedAction: 'Node is already VALIDATED or REALIZED — no further epistemic investment needed',
    };
  }

  const nextDiscount = STATE_DISCOUNT[nextState];
  // Assume CI narrows by ~30% on state advancement
  const nextWidthPenalty = Math.max(0, 1 - ciWidthPct * 0.7 * 0.18);
  const nextEffectiveStake = Math.round(
    ciPoint * nextDiscount * calibration * nextWidthPenalty * 100,
  ) / 100;

  const uncertaintyReduction = nextDiscount - currentDiscount;
  const evoi = Math.round((nextEffectiveStake - currentEffectiveStake) * 100) / 100;

  let recommendedAction: string;
  if (valueState === 'FORECASTED') {
    recommendedAction = 'Conduct estimation exercise (analogical, Delphi, or parametric)';
  } else if (valueState === 'ESTIMATED') {
    recommendedAction = 'Run validation activity (pilot, A/B test, or proof of concept)';
  } else {
    recommendedAction = 'No epistemic investment recommended';
  }

  return {
    nodeId,
    nodeLabel,
    nodeType,
    valueState,
    ciPointEstimate: ciPoint,
    currentEffectiveStake,
    nextState,
    nextEffectiveStake,
    uncertaintyReduction,
    evoi,
    recommendedAction,
  };
}

/**
 * Compute EVOI for all ESTIMATED/FORECASTED nodes in an entity.
 * Returns sorted by EVOI descending (highest information value first).
 */
export async function computeEntityEVOIs(
  entityId: string,
  minEvoi?: number,
): Promise<EVOIResult[]> {
  const results = await runCypher<{ id: string }>(
    `MATCH (n {entity_id: $entityId})
     WHERE n.value_state IN ['FORECASTED', 'ESTIMATED']
       AND n.ci_point_estimate IS NOT NULL
     RETURN n.id AS id`,
    { entityId },
  );

  const evois: EVOIResult[] = [];
  for (const r of results) {
    const evoi = await computeEVOI(r.id);
    if (evoi && evoi.evoi > 0) {
      if (!minEvoi || evoi.evoi >= minEvoi) {
        evois.push(evoi);
      }
    }
  }

  return evois.sort((a, b) => b.evoi - a.evoi);
}

/**
 * Update epistemic_priority on nodes based on computed EVOI.
 * Higher EVOI → higher priority for epistemic investment.
 */
export async function updateEpistemicPriorities(
  entityId: string,
): Promise<number> {
  const evois = await computeEntityEVOIs(entityId);

  let updated = 0;
  for (const evoi of evois) {
    await runCypher(
      `MATCH (n {id: $id})
       SET n.epistemic_priority = $priority,
           n.updated_at = datetime()`,
      { id: evoi.nodeId, priority: Math.round(evoi.evoi * 100) / 100 },
    );
    updated++;
  }

  return updated;
}

// ============================================================
// Epistemic ROI
// ============================================================

export interface EpistemicROI {
  nodeId: string;
  nodeLabel: string;
  activityCost: number;
  informationValue: number;
  roi: number;
  justified: boolean;
}

/**
 * Compute epistemic ROI for a specific epistemic investment.
 * ROI = (information_value - cost) / cost
 * Information value = EVOI = Δ(effective_stake)
 */
export async function computeEpistemicROI(
  nodeId: string,
  activityCost: number,
): Promise<EpistemicROI | null> {
  const evoi = await computeEVOI(nodeId);
  if (!evoi) return null;

  const informationValue = evoi.evoi;
  const roi = activityCost > 0
    ? Math.round(((informationValue - activityCost) / activityCost) * 100) / 100
    : 0;

  return {
    nodeId,
    nodeLabel: evoi.nodeLabel,
    activityCost,
    informationValue,
    roi,
    justified: informationValue > activityCost,
  };
}

// ============================================================
// Stale Estimation Detection
// ============================================================

/**
 * Find nodes with expired estimates (past expires_at).
 * These should be downgraded to STALE_ESTIMATED.
 */
export async function findStaleEstimates(
  entityId: string,
): Promise<Array<{ nodeId: string; label: string; expiresAt: string }>> {
  const results = await runCypher<{ id: string; label: string; expiresAt: string }>(
    `MATCH (n {entity_id: $entityId})
     WHERE n.value_state = 'ESTIMATED'
       AND n.expires_at IS NOT NULL
       AND datetime(n.expires_at) < datetime()
     RETURN n.id AS id, n.label AS label, n.expires_at AS expiresAt`,
    { entityId },
  );

  return results.map((r) => ({
    nodeId: r.id,
    label: r.label,
    expiresAt: r.expiresAt,
  }));
}

/**
 * Downgrade stale estimates to STALE_ESTIMATED.
 */
export async function downgradeStaleEstimates(
  entityId: string,
): Promise<number> {
  const stale = await findStaleEstimates(entityId);

  for (const s of stale) {
    await runCypher(
      `MATCH (n {id: $id})
       SET n.value_state = 'STALE_ESTIMATED',
           n.updated_at = datetime()`,
      { id: s.nodeId },
    );
  }

  return stale.length;
}
