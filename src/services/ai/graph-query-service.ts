import { runCypher } from '../../lib/neo4j.js';

// ============================================================
// Path Traversal
// ============================================================

export interface PathStep {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  weight: number;
  confidence: number;
  temporalValuePct: number;
  contributionFunction: string;
  effectiveContribution: number;
}

export interface PathResult {
  path: PathStep[];
  totalEffectiveContribution: number;
  pathLength: number;
}

/**
 * Find all paths from a source node to target Outcome nodes.
 * Returns paths with aggregated effective contribution at each hop.
 */
export async function findPathsToOutcomes(
  sourceId: string,
  maxHops: number = 6,
): Promise<PathResult[]> {
  const results = await runCypher<{
    nodeIds: string[];
    nodeLabels: string[];
    nodeTypes: string[][];
    weights: number[];
    confidences: number[];
    tvps: number[];
    functions: string[];
    controlScores: number[];
  }>(
    `MATCH path = (source {id: $sourceId})-[:CONTRIBUTES_TO*1..${maxHops}]->(outcome:Outcome)
     WITH path, nodes(path) AS ns, relationships(path) AS rs
     RETURN [n IN ns | n.id] AS nodeIds,
            [n IN ns | n.label] AS nodeLabels,
            [n IN ns | labels(n)] AS nodeTypes,
            [r IN rs | r.weight] AS weights,
            [r IN rs | r.confidence] AS confidences,
            [r IN rs | COALESCE(r.temporal_value_pct, 1.0)] AS tvps,
            [r IN rs | COALESCE(r.contribution_function, 'LINEAR')] AS functions,
            [n IN ns | COALESCE(n.control_score, 1.0)] AS controlScores`,
    { sourceId },
  );

  return results.map((r) => {
    const steps: PathStep[] = [];
    let totalEC = 1.0;

    for (let i = 0; i < r.weights.length; i++) {
      const w = Number(r.weights[i]);
      const tvp = Number(r.tvps[i]);
      const cs = Number(r.controlScores[i]);
      const ec = w * tvp * cs;
      totalEC *= ec;

      steps.push({
        nodeId: r.nodeIds[i + 1],
        nodeLabel: r.nodeLabels[i + 1],
        nodeType: (r.nodeTypes[i + 1] as string[])[0],
        weight: w,
        confidence: Number(r.confidences[i]),
        temporalValuePct: tvp,
        contributionFunction: r.functions[i],
        effectiveContribution: Math.round(ec * 10000) / 10000,
      });
    }

    return {
      path: steps,
      totalEffectiveContribution: Math.round(totalEC * 10000) / 10000,
      pathLength: steps.length,
    };
  }).sort((a, b) => b.totalEffectiveContribution - a.totalEffectiveContribution);
}

/**
 * Find activities with highest impact on a specific outcome.
 */
export async function findTopContributors(
  outcomeId: string,
  maxHops: number = 6,
  limit: number = 10,
): Promise<Array<{
  activityId: string;
  activityLabel: string;
  effectiveContribution: number;
  pathLength: number;
  controlScore: number;
}>> {
  const results = await runCypher<{
    activityId: string;
    activityLabel: string;
    weights: number[];
    tvps: number[];
    controlScore: number;
    pathLen: number;
  }>(
    `MATCH path = (activity)-[:CONTRIBUTES_TO*1..${maxHops}]->(outcome:Outcome {id: $outcomeId})
     WHERE NOT activity:Outcome
     WITH activity, path, relationships(path) AS rs, length(path) AS pathLen
     RETURN activity.id AS activityId,
            activity.label AS activityLabel,
            [r IN rs | r.weight] AS weights,
            [r IN rs | COALESCE(r.temporal_value_pct, 1.0)] AS tvps,
            COALESCE(activity.control_score, 1.0) AS controlScore,
            pathLen
     ORDER BY pathLen ASC
     LIMIT toInteger($limit)`,
    { outcomeId, limit },
  );

  return results.map((r) => {
    let ec = 1.0;
    for (let i = 0; i < r.weights.length; i++) {
      ec *= Number(r.weights[i]) * Number(r.tvps[i]);
    }
    ec *= Number(r.controlScore);

    return {
      activityId: r.activityId,
      activityLabel: r.activityLabel,
      effectiveContribution: Math.round(ec * 10000) / 10000,
      pathLength: Number(r.pathLen),
      controlScore: Number(r.controlScore),
    };
  }).sort((a, b) => b.effectiveContribution - a.effectiveContribution);
}

// ============================================================
// Natural Language Query Support
// ============================================================

export interface QueryIntent {
  type: 'PATH_TO_OUTCOME' | 'TOP_CONTRIBUTORS' | 'IMPACT_ANALYSIS' | 'NODE_SEARCH' | 'UNKNOWN';
  entityId?: string;
  nodeId?: string;
  outcomeId?: string;
  nodeType?: string;
  searchTerm?: string;
  timeHorizonDays?: number;
}

/**
 * Parse a natural language query into a structured intent.
 * This is a rule-based parser — Claude API integration would replace this.
 */
export function parseQuery(queryText: string): QueryIntent {
  const lower = queryText.toLowerCase();

  // "What activities most impact revenue" → TOP_CONTRIBUTORS
  if ((lower.includes('impact') || lower.includes('contribut')) &&
      (lower.includes('revenue') || lower.includes('outcome') || lower.includes('mission'))) {
    const timeMatch = lower.match(/(\d+)\s*days?/);
    return {
      type: 'TOP_CONTRIBUTORS',
      timeHorizonDays: timeMatch ? parseInt(timeMatch[1]) : undefined,
    };
  }

  // "Show path from X to Y" → PATH_TO_OUTCOME
  if (lower.includes('path') || lower.includes('route') || lower.includes('connection')) {
    return { type: 'PATH_TO_OUTCOME' };
  }

  // "What is the impact of X" → IMPACT_ANALYSIS
  if (lower.includes('impact') || lower.includes('effect') || lower.includes('influence')) {
    return { type: 'IMPACT_ANALYSIS' };
  }

  // "Find activities matching X" → NODE_SEARCH
  if (lower.includes('find') || lower.includes('search') || lower.includes('list')) {
    const typeMatch = lower.match(/(activit|outcome|project|initiative|metric|resource)/);
    return {
      type: 'NODE_SEARCH',
      nodeType: typeMatch ? typeMatch[1] : undefined,
      searchTerm: queryText,
    };
  }

  return { type: 'UNKNOWN' };
}

/**
 * Execute a structured query intent against the graph.
 */
export async function executeQuery(
  intent: QueryIntent,
  params: {
    entityId?: string;
    nodeId?: string;
    outcomeId?: string;
  } = {},
): Promise<unknown> {
  switch (intent.type) {
    case 'PATH_TO_OUTCOME': {
      if (!params.nodeId) return { error: 'nodeId required for path query' };
      return findPathsToOutcomes(params.nodeId);
    }

    case 'TOP_CONTRIBUTORS': {
      if (!params.outcomeId) {
        // Find all outcomes for entity and return top contributors across all
        if (!params.entityId) return { error: 'entityId or outcomeId required' };
        const outcomes = await runCypher<{ id: string; label: string }>(
          `MATCH (o:Outcome {entity_id: $entityId})
           RETURN o.id AS id, o.label AS label`,
          { entityId: params.entityId },
        );
        const allContributors: Array<{
          outcomeLabel: string;
          activityId: string;
          activityLabel: string;
          effectiveContribution: number;
        }> = [];
        for (const o of outcomes) {
          const contribs = await findTopContributors(o.id, 6, 5);
          for (const c of contribs) {
            allContributors.push({
              outcomeLabel: o.label,
              ...c,
            });
          }
        }
        return allContributors.sort((a, b) => b.effectiveContribution - a.effectiveContribution);
      }
      return findTopContributors(params.outcomeId);
    }

    case 'IMPACT_ANALYSIS': {
      if (!params.nodeId) return { error: 'nodeId required for impact analysis' };
      const paths = await findPathsToOutcomes(params.nodeId);
      const outcomes = new Map<string, { label: string; totalContribution: number; pathCount: number }>();
      for (const p of paths) {
        const lastStep = p.path[p.path.length - 1];
        const existing = outcomes.get(lastStep.nodeId);
        if (existing) {
          existing.totalContribution += p.totalEffectiveContribution;
          existing.pathCount++;
        } else {
          outcomes.set(lastStep.nodeId, {
            label: lastStep.nodeLabel,
            totalContribution: p.totalEffectiveContribution,
            pathCount: 1,
          });
        }
      }
      return Array.from(outcomes.entries()).map(([id, v]) => ({
        outcomeId: id,
        outcomeLabel: v.label,
        totalContribution: Math.round(v.totalContribution * 10000) / 10000,
        pathCount: v.pathCount,
      })).sort((a, b) => b.totalContribution - a.totalContribution);
    }

    case 'NODE_SEARCH': {
      if (!params.entityId) return { error: 'entityId required for search' };
      const searchTerm = intent.searchTerm ?? '';
      const results = await runCypher<{
        id: string;
        label: string;
        nodeType: string[];
        valueState: string;
      }>(
        `MATCH (n {entity_id: $entityId})
         WHERE n.label IS NOT NULL
           AND toLower(n.label) CONTAINS toLower($term)
         RETURN n.id AS id, n.label AS label, labels(n) AS nodeType,
                COALESCE(n.value_state, 'UNKNOWN') AS valueState
         ORDER BY n.label
         LIMIT 20`,
        { entityId: params.entityId, term: searchTerm },
      );
      return results.map((r) => ({
        id: r.id,
        label: r.label,
        type: (r.nodeType as string[])[0],
        valueState: r.valueState,
      }));
    }

    default:
      return { error: 'Could not understand query. Try: "What impacts revenue?", "Show path from X to Y", "Find activities matching X"' };
  }
}

// ============================================================
// Graph Summary
// ============================================================

/**
 * Get a summary of the entity's graph for context.
 */
export async function getEntityGraphSummary(entityId: string) {
  const nodeCounts = await runCypher<{ label: string; count: number }>(
    `MATCH (n {entity_id: $entityId})
     WITH labels(n) AS lbls
     UNWIND lbls AS label
     WITH label WHERE label <> 'Node'
     RETURN label, count(*) AS count
     ORDER BY count DESC`,
    { entityId },
  );

  const edgeCounts = await runCypher<{ type: string; count: number }>(
    `MATCH (n {entity_id: $entityId})-[r]->()
     RETURN type(r) AS type, count(r) AS count
     ORDER BY count DESC`,
    { entityId },
  );

  const outcomes = await runCypher<{ id: string; label: string; outcomeType: string; valueState: string }>(
    `MATCH (o:Outcome {entity_id: $entityId})
     RETURN o.id AS id, o.label AS label,
            o.outcome_type AS outcomeType,
            COALESCE(o.value_state, 'UNKNOWN') AS valueState
     ORDER BY o.label`,
    { entityId },
  );

  return {
    nodeCounts: nodeCounts.map((r) => ({ label: r.label, count: Number(r.count) })),
    edgeCounts: edgeCounts.map((r) => ({ type: r.type, count: Number(r.count) })),
    outcomes: outcomes.map((r) => ({
      id: r.id,
      label: r.label,
      outcomeType: r.outcomeType,
      valueState: r.valueState,
    })),
  };
}
