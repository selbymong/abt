import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { emit } from '../../lib/kafka.js';
import type { ControlClass } from '../../schema/neo4j/types.js';

// ============================================================
// Scenario Set Management
// ============================================================

export interface ScenarioInput {
  label: string;
  probability: number;  // 0-1
  impactMultiplier: number;  // e.g., 0.5 = 50% of base, 1.5 = 150%
  description?: string;
}

export interface CreateScenarioSetInput {
  nodeId: string;
  label: string;
  scenarios: ScenarioInput[];
  baseValue: number;
}

export async function createScenarioSet(
  input: CreateScenarioSetInput,
): Promise<string> {
  // Validate probabilities sum to ~1.0
  const totalProb = input.scenarios.reduce((s, sc) => s + sc.probability, 0);
  if (Math.abs(totalProb - 1.0) > 0.01) {
    throw new Error(`Scenario probabilities must sum to 1.0, got ${totalProb}`);
  }

  const id = uuid();
  await runCypher(
    `MATCH (n {id: $nodeId})
     CREATE (ss:ScenarioSet {
       id: $id,
       node_id: $nodeId,
       entity_id: n.entity_id,
       label: $label,
       base_value: $baseValue,
       scenarios: $scenariosJson,
       created_at: datetime(), updated_at: datetime()
     })
     CREATE (n)-[:HAS_SCENARIOS]->(ss)`,
    {
      nodeId: input.nodeId,
      id,
      label: input.label,
      baseValue: input.baseValue,
      scenariosJson: JSON.stringify(input.scenarios),
    },
  );

  return id;
}

export async function getScenarioSet(id: string): Promise<Record<string, unknown> | null> {
  const results = await runCypher<{ ss: Record<string, unknown> }>(
    `MATCH (ss:ScenarioSet {id: $id}) RETURN properties(ss) AS ss`,
    { id },
  );
  if (results.length === 0) return null;
  const ss = results[0].ss;
  return {
    ...ss,
    scenarios: typeof ss.scenarios === 'string' ? JSON.parse(ss.scenarios as string) : ss.scenarios,
  };
}

export async function getScenarioSetsForNode(nodeId: string): Promise<Record<string, unknown>[]> {
  const results = await runCypher<{ ss: Record<string, unknown> }>(
    `MATCH (n {id: $nodeId})-[:HAS_SCENARIOS]->(ss:ScenarioSet)
     RETURN properties(ss) AS ss ORDER BY ss.created_at DESC`,
    { nodeId },
  );
  return results.map((r) => ({
    ...r.ss,
    scenarios: typeof r.ss.scenarios === 'string'
      ? JSON.parse(r.ss.scenarios as string)
      : r.ss.scenarios,
  }));
}

// ============================================================
// Monte Carlo Simulation
// ============================================================

export interface MonteCarloResult {
  scenarioSetId: string;
  nodeId: string;
  baseValue: number;
  simulations: number;
  mean: number;
  median: number;
  stdDev: number;
  p5: number;   // 5th percentile (tail risk)
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  min: number;
  max: number;
  expectedValue: number;  // probability-weighted
  tailRisk: number;       // expected loss at 5th percentile
  distribution: number[]; // sampled values for visualization
}

/**
 * Run Monte Carlo simulation on a scenario set.
 * Samples from the discrete probability distribution defined by the scenarios.
 */
export async function runMonteCarlo(
  scenarioSetId: string,
  simulations: number = 10000,
): Promise<MonteCarloResult | null> {
  const ss = await getScenarioSet(scenarioSetId);
  if (!ss) return null;

  const baseValue = Number(ss.base_value);
  const scenarios = ss.scenarios as ScenarioInput[];
  const nodeId = ss.node_id as string;

  // Build cumulative probability distribution
  const cdf: { cutoff: number; multiplier: number }[] = [];
  let cumProb = 0;
  for (const sc of scenarios) {
    cumProb += sc.probability;
    cdf.push({ cutoff: cumProb, multiplier: sc.impactMultiplier });
  }

  // Sample
  const samples: number[] = [];
  for (let i = 0; i < simulations; i++) {
    const r = Math.random();
    let multiplier = cdf[cdf.length - 1].multiplier;
    for (const entry of cdf) {
      if (r <= entry.cutoff) {
        multiplier = entry.multiplier;
        break;
      }
    }
    // Add noise: ±10% uniform noise around the multiplier
    const noise = 1 + (Math.random() - 0.5) * 0.2;
    samples.push(Math.round(baseValue * multiplier * noise * 100) / 100);
  }

  // Sort for percentile computation
  samples.sort((a, b) => a - b);

  const mean = Math.round((samples.reduce((s, v) => s + v, 0) / simulations) * 100) / 100;
  const median = samples[Math.floor(simulations / 2)];

  // Standard deviation
  const variance = samples.reduce((s, v) => s + (v - mean) ** 2, 0) / simulations;
  const stdDev = Math.round(Math.sqrt(variance) * 100) / 100;

  const p5 = samples[Math.floor(simulations * 0.05)];
  const p25 = samples[Math.floor(simulations * 0.25)];
  const p50 = median;
  const p75 = samples[Math.floor(simulations * 0.75)];
  const p95 = samples[Math.floor(simulations * 0.95)];

  // Expected value from scenario probabilities (exact, not sampled)
  const expectedValue = Math.round(
    scenarios.reduce((s, sc) => s + sc.probability * sc.impactMultiplier * baseValue, 0) * 100,
  ) / 100;

  const tailRisk = Math.round((baseValue - p5) * 100) / 100;

  // Store distribution summary (100 evenly spaced samples for visualization)
  const step = Math.floor(simulations / 100);
  const distribution = Array.from({ length: 100 }, (_, i) => samples[i * step]);

  return {
    scenarioSetId,
    nodeId,
    baseValue,
    simulations,
    mean,
    median,
    stdDev,
    p5,
    p25,
    p50,
    p75,
    p95,
    min: samples[0],
    max: samples[simulations - 1],
    expectedValue,
    tailRisk,
    distribution,
  };
}

// ============================================================
// Entity-Wide Risk Assessment
// ============================================================

export interface NodeRiskProfile {
  nodeId: string;
  nodeLabel: string;
  controlClass: ControlClass;
  baseValue: number;
  expectedValue: number;
  tailRisk: number;
  p5: number;
  p95: number;
  riskAdjustedValue: number;
}

/**
 * Compute risk profiles for all DISTAL_EXT and FORCE_MAJEURE nodes.
 * These are the nodes with highest uncertainty requiring scenario analysis.
 */
export async function computeEntityRiskProfiles(
  entityId: string,
): Promise<NodeRiskProfile[]> {
  const nodes = await runCypher<{
    id: string;
    label: string;
    controlClass: string;
  }>(
    `MATCH (n {entity_id: $entityId})
     WHERE n.control_class IN ['DISTAL_EXT', 'FORCE_MAJEURE']
     RETURN n.id AS id, n.label AS label, n.control_class AS controlClass`,
    { entityId },
  );

  const profiles: NodeRiskProfile[] = [];

  for (const node of nodes) {
    const scenarioSets = await getScenarioSetsForNode(node.id);
    if (scenarioSets.length === 0) continue;

    // Use most recent scenario set
    const latest = scenarioSets[0];
    const result = await runMonteCarlo(latest.id as string, 5000);
    if (!result) continue;

    // Risk-adjusted value = 10th percentile (conservative)
    const p10 = result.distribution[Math.floor(result.distribution.length * 0.1)];

    profiles.push({
      nodeId: node.id,
      nodeLabel: node.label,
      controlClass: node.controlClass as ControlClass,
      baseValue: result.baseValue,
      expectedValue: result.expectedValue,
      tailRisk: result.tailRisk,
      p5: result.p5,
      p95: result.p95,
      riskAdjustedValue: p10,
    });
  }

  return profiles.sort((a, b) => b.tailRisk - a.tailRisk);
}

/**
 * Fire a scenario event — signal that a specific scenario has materialized.
 */
export async function fireScenario(
  scenarioSetId: string,
  scenarioLabel: string,
  actualImpact: number,
): Promise<boolean> {
  const ss = await getScenarioSet(scenarioSetId);
  if (!ss) return false;

  const nodeId = ss.node_id as string;
  const entityId = ss.entity_id as string;

  await emit('ebg.scenarios', {
    event_id: uuid(),
    event_type: 'SCENARIO_FIRED',
    sequence_number: Date.now(),
    idempotency_key: `scenario-${scenarioSetId}-${scenarioLabel}-${Date.now()}`,
    entity_id: entityId,
    timestamp: new Date().toISOString(),
    payload: {
      scenarioSetId,
      nodeId,
      scenarioLabel,
      actualImpact,
      baseValue: Number(ss.base_value),
    },
  });

  return true;
}
