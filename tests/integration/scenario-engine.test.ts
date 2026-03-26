/**
 * Scenario Engine — Integration Tests
 *
 * Tests scenario set management, Monte Carlo simulation,
 * risk profiles, and scenario firing.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import {
  getAllEntities,
  createActivity,
} from '../../src/services/graph/graph-crud-service.js';
import {
  createScenarioSet,
  getScenarioSet,
  getScenarioSetsForNode,
  runMonteCarlo,
  computeEntityRiskProfiles,
  fireScenario,
} from '../../src/services/ai/scenario-engine-service.js';

let caFpEntityId: string;
let distalNodeId: string;
let forceMajeureNodeId: string;
let scenarioSetId: string;
const cleanupIds: { label: string; id: string }[] = [];

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  caFpEntityId = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'CA')!.id;

  // Create DISTAL_EXT node (external factor with moderate uncertainty)
  distalNodeId = track('Activity', await createActivity({
    entityId: caFpEntityId,
    label: 'Market Expansion — APAC',
    status: 'PLANNED',
  }));
  await runCypher(
    `MATCH (n {id: $id})
     SET n.control_class = 'DISTAL_EXT',
         n.control_score = 0.3,
         n.value_state = 'ESTIMATED',
         n.ci_point_estimate = 200000`,
    { id: distalNodeId },
  );

  // Create FORCE_MAJEURE node (extreme uncertainty)
  forceMajeureNodeId = track('Activity', await createActivity({
    entityId: caFpEntityId,
    label: 'Regulatory Change Impact',
    status: 'PLANNED',
  }));
  await runCypher(
    `MATCH (n {id: $id})
     SET n.control_class = 'FORCE_MAJEURE',
         n.control_score = 0.1,
         n.value_state = 'FORECASTED',
         n.ci_point_estimate = 500000`,
    { id: forceMajeureNodeId },
  );
});

afterAll(async () => {
  // Clean up scenario set edges and nodes
  for (const { id } of cleanupIds.filter((c) => c.label === 'Activity')) {
    await runCypher(
      `MATCH (n {id: $id})-[r:HAS_SCENARIOS]->(ss:ScenarioSet)
       DELETE r, ss`,
      { id },
    );
  }

  for (const { label, id } of cleanupIds) {
    await runCypher(`MATCH (n:${label} {id: $id}) DETACH DELETE n`, { id });
  }

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

describe('Scenario Set Management', () => {
  it('creates a scenario set', async () => {
    scenarioSetId = await createScenarioSet({
      nodeId: distalNodeId,
      label: 'APAC Market Scenarios',
      baseValue: 200000,
      scenarios: [
        { label: 'Best Case', probability: 0.2, impactMultiplier: 1.5, description: 'Strong market uptake' },
        { label: 'Base Case', probability: 0.5, impactMultiplier: 1.0, description: 'Expected trajectory' },
        { label: 'Downside', probability: 0.2, impactMultiplier: 0.5, description: 'Slow adoption' },
        { label: 'Worst Case', probability: 0.1, impactMultiplier: 0.1, description: 'Market failure' },
      ],
    });
    expect(scenarioSetId).toBeDefined();
  });

  it('retrieves scenario set', async () => {
    const ss = await getScenarioSet(scenarioSetId);
    expect(ss).toBeDefined();
    expect(ss!.label).toBe('APAC Market Scenarios');
    expect(Number(ss!.base_value)).toBe(200000);
    expect((ss!.scenarios as any[]).length).toBe(4);
  });

  it('retrieves scenario sets for node', async () => {
    const sets = await getScenarioSetsForNode(distalNodeId);
    expect(sets.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects probabilities that do not sum to 1.0', async () => {
    await expect(
      createScenarioSet({
        nodeId: distalNodeId,
        label: 'Bad Scenarios',
        baseValue: 100000,
        scenarios: [
          { label: 'A', probability: 0.3, impactMultiplier: 1.0 },
          { label: 'B', probability: 0.3, impactMultiplier: 0.5 },
          // Sum = 0.6, not 1.0
        ],
      }),
    ).rejects.toThrow(/probabilities must sum to 1.0/);
  });
});

describe('Monte Carlo Simulation', () => {
  it('runs Monte Carlo with default 10000 simulations', async () => {
    const result = await runMonteCarlo(scenarioSetId);
    expect(result).toBeDefined();
    expect(result!.simulations).toBe(10000);
    expect(result!.baseValue).toBe(200000);
    expect(result!.mean).toBeGreaterThan(0);
    expect(result!.median).toBeGreaterThan(0);
    expect(result!.stdDev).toBeGreaterThan(0);
  });

  it('percentiles are in correct order', async () => {
    const result = await runMonteCarlo(scenarioSetId, 5000);
    expect(result!.p5).toBeLessThanOrEqual(result!.p25);
    expect(result!.p25).toBeLessThanOrEqual(result!.p50);
    expect(result!.p50).toBeLessThanOrEqual(result!.p75);
    expect(result!.p75).toBeLessThanOrEqual(result!.p95);
    expect(result!.min).toBeLessThanOrEqual(result!.p5);
    expect(result!.p95).toBeLessThanOrEqual(result!.max);
  });

  it('expected value is probability-weighted', async () => {
    const result = await runMonteCarlo(scenarioSetId);
    // Expected = 0.2*1.5 + 0.5*1.0 + 0.2*0.5 + 0.1*0.1 = 0.3+0.5+0.1+0.01 = 0.91
    // So EV = 200000 * 0.91 = 182000
    expect(result!.expectedValue).toBeCloseTo(182000, -2);
  });

  it('tail risk represents downside from base', async () => {
    const result = await runMonteCarlo(scenarioSetId);
    // Tail risk = baseValue - p5
    expect(result!.tailRisk).toBe(result!.baseValue - result!.p5);
    expect(result!.tailRisk).toBeGreaterThan(0);
  });

  it('distribution has 100 sample points', async () => {
    const result = await runMonteCarlo(scenarioSetId, 10000);
    expect(result!.distribution).toHaveLength(100);
  });
});

describe('Entity Risk Profiles', () => {
  beforeAll(async () => {
    // Create scenario set for force majeure node
    await createScenarioSet({
      nodeId: forceMajeureNodeId,
      label: 'Regulatory Scenarios',
      baseValue: 500000,
      scenarios: [
        { label: 'Favorable', probability: 0.3, impactMultiplier: 1.2 },
        { label: 'Neutral', probability: 0.4, impactMultiplier: 1.0 },
        { label: 'Adverse', probability: 0.2, impactMultiplier: 0.3 },
        { label: 'Catastrophic', probability: 0.1, impactMultiplier: 0.0 },
      ],
    });
  });

  it('computes risk profiles for DISTAL_EXT and FORCE_MAJEURE nodes', async () => {
    const profiles = await computeEntityRiskProfiles(caFpEntityId);
    expect(profiles.length).toBeGreaterThanOrEqual(2);

    const distal = profiles.find((p) => p.nodeId === distalNodeId);
    const fm = profiles.find((p) => p.nodeId === forceMajeureNodeId);

    expect(distal).toBeDefined();
    expect(distal!.controlClass).toBe('DISTAL_EXT');
    expect(fm).toBeDefined();
    expect(fm!.controlClass).toBe('FORCE_MAJEURE');
  });

  it('profiles sorted by tail risk descending', async () => {
    const profiles = await computeEntityRiskProfiles(caFpEntityId);
    if (profiles.length >= 2) {
      expect(profiles[0].tailRisk).toBeGreaterThanOrEqual(profiles[1].tailRisk);
    }
  });

  it('force majeure has higher tail risk than distal', async () => {
    const profiles = await computeEntityRiskProfiles(caFpEntityId);
    const distal = profiles.find((p) => p.nodeId === distalNodeId);
    const fm = profiles.find((p) => p.nodeId === forceMajeureNodeId);
    // FM has catastrophic scenario (0.0 multiplier) and higher base value
    expect(fm!.tailRisk).toBeGreaterThan(distal!.tailRisk);
  });
});

describe('Scenario Firing', () => {
  it('fires a scenario event', async () => {
    const result = await fireScenario(scenarioSetId, 'Base Case', 190000);
    expect(result).toBe(true);
  });

  it('returns false for non-existent scenario set', async () => {
    const result = await fireScenario('non-existent-id', 'Test', 0);
    expect(result).toBe(false);
  });
});
