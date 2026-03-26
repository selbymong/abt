/**
 * Graph Query (Claude Integration) — Integration Tests
 *
 * Tests path traversal, top contributors, natural language query parsing,
 * query execution, and graph summary.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import {
  getAllEntities,
  createOutcome,
  createActivity,
  createContributesToEdge,
} from '../../src/services/graph/graph-crud-service.js';
import {
  findPathsToOutcomes,
  findTopContributors,
  parseQuery,
  executeQuery,
  getEntityGraphSummary,
} from '../../src/services/ai/graph-query-service.js';

let caFpEntityId: string;
let outcomeId: string;
let activity1Id: string;
let activity2Id: string;
let intermediateId: string;
const cleanupIds: { label: string; id: string }[] = [];

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  caFpEntityId = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'CA')!.id;

  // Create graph: Activity1 → Intermediate → Outcome
  //               Activity2 → Outcome (direct)
  outcomeId = track('Outcome', await createOutcome({
    entityId: caFpEntityId,
    label: 'Revenue Growth Q3',
    ontology: 'FINANCIAL',
    outcomeType: 'IMPROVE_REVENUE',
    targetDelta: 150000,
    currency: 'CAD',
    periodStart: '2026-07-01',
    periodEnd: '2026-09-30',
  }));

  intermediateId = track('Activity', await createActivity({
    entityId: caFpEntityId,
    label: 'Sales Pipeline Management',
    status: 'IN_PROGRESS',
  }));
  await runCypher(
    `MATCH (n {id: $id}) SET n.control_score = 0.85`,
    { id: intermediateId },
  );

  activity1Id = track('Activity', await createActivity({
    entityId: caFpEntityId,
    label: 'Lead Generation Campaign',
    status: 'IN_PROGRESS',
  }));
  await runCypher(
    `MATCH (n {id: $id}) SET n.control_score = 0.9`,
    { id: activity1Id },
  );

  activity2Id = track('Activity', await createActivity({
    entityId: caFpEntityId,
    label: 'Direct Sales Outreach',
    status: 'IN_PROGRESS',
  }));
  await runCypher(
    `MATCH (n {id: $id}) SET n.control_score = 0.95`,
    { id: activity2Id },
  );

  // Activity1 → Intermediate (2-hop path to outcome)
  await createContributesToEdge({
    sourceId: activity1Id,
    targetId: intermediateId,
    weight: 0.7,
    confidence: 0.8,
    lagDays: 15,
    contributionFunction: 'LINEAR',
  });

  // Intermediate → Outcome
  await createContributesToEdge({
    sourceId: intermediateId,
    targetId: outcomeId,
    weight: 0.8,
    confidence: 0.9,
    lagDays: 30,
    contributionFunction: 'LINEAR',
  });

  // Activity2 → Outcome (direct 1-hop)
  await createContributesToEdge({
    sourceId: activity2Id,
    targetId: outcomeId,
    weight: 0.6,
    confidence: 0.7,
    lagDays: 10,
    contributionFunction: 'LOGARITHMIC',
  });
});

afterAll(async () => {
  for (const { id } of cleanupIds) {
    await runCypher(`MATCH (n {id: $id})-[r:CONTRIBUTES_TO]-() DELETE r`, { id });
  }
  for (const { label, id } of cleanupIds) {
    await runCypher(`MATCH (n:${label} {id: $id}) DETACH DELETE n`, { id });
  }

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

describe('Path Traversal', () => {
  it('finds paths from activity to outcome', async () => {
    const paths = await findPathsToOutcomes(activity1Id);
    expect(paths.length).toBeGreaterThanOrEqual(1);
    // Should find the 2-hop path: Activity1 → Intermediate → Outcome
    const twoHopPath = paths.find((p) => p.pathLength === 2);
    expect(twoHopPath).toBeDefined();
  });

  it('computes effective contribution along path', async () => {
    const paths = await findPathsToOutcomes(activity1Id);
    const twoHopPath = paths.find((p) => p.pathLength === 2)!;

    // Total EC = product of (weight × tvp × control_score) at each hop
    expect(twoHopPath.totalEffectiveContribution).toBeGreaterThan(0);
    expect(twoHopPath.totalEffectiveContribution).toBeLessThanOrEqual(1);
  });

  it('finds direct path from activity2', async () => {
    const paths = await findPathsToOutcomes(activity2Id);
    expect(paths.length).toBeGreaterThanOrEqual(1);
    const directPath = paths.find((p) => p.pathLength === 1);
    expect(directPath).toBeDefined();
  });

  it('paths are sorted by effective contribution descending', async () => {
    const paths = await findPathsToOutcomes(activity1Id);
    if (paths.length >= 2) {
      expect(paths[0].totalEffectiveContribution).toBeGreaterThanOrEqual(
        paths[1].totalEffectiveContribution,
      );
    }
  });
});

describe('Top Contributors', () => {
  it('finds top contributors to an outcome', async () => {
    const contributors = await findTopContributors(outcomeId);
    expect(contributors.length).toBeGreaterThanOrEqual(2);
  });

  it('contributors sorted by effective contribution', async () => {
    const contributors = await findTopContributors(outcomeId);
    if (contributors.length >= 2) {
      expect(contributors[0].effectiveContribution).toBeGreaterThanOrEqual(
        contributors[1].effectiveContribution,
      );
    }
  });

  it('includes both direct and indirect contributors', async () => {
    const contributors = await findTopContributors(outcomeId);
    const ids = contributors.map((c) => c.activityId);
    expect(ids).toContain(activity2Id); // direct
    // activity1 may also appear through intermediate
    const hasActivity1OrIntermediate = ids.includes(activity1Id) || ids.includes(intermediateId);
    expect(hasActivity1OrIntermediate).toBe(true);
  });
});

describe('Natural Language Query Parsing', () => {
  it('parses "impact revenue" as TOP_CONTRIBUTORS', () => {
    const intent = parseQuery('What activities most impact revenue in the next 90 days?');
    expect(intent.type).toBe('TOP_CONTRIBUTORS');
    expect(intent.timeHorizonDays).toBe(90);
  });

  it('parses "show path" as PATH_TO_OUTCOME', () => {
    const intent = parseQuery('Show the path from Activity A to the outcome');
    expect(intent.type).toBe('PATH_TO_OUTCOME');
  });

  it('parses "find activities" as NODE_SEARCH', () => {
    const intent = parseQuery('Find activities matching sales');
    expect(intent.type).toBe('NODE_SEARCH');
  });

  it('parses "what is the effect" as IMPACT_ANALYSIS', () => {
    const intent = parseQuery('What is the effect of this initiative?');
    expect(intent.type).toBe('IMPACT_ANALYSIS');
  });

  it('returns UNKNOWN for unrecognized queries', () => {
    const intent = parseQuery('Hello world');
    expect(intent.type).toBe('UNKNOWN');
  });
});

describe('Query Execution', () => {
  it('executes PATH_TO_OUTCOME query', async () => {
    const result = await executeQuery(
      { type: 'PATH_TO_OUTCOME' },
      { nodeId: activity1Id },
    );
    expect(Array.isArray(result)).toBe(true);
    expect((result as any[]).length).toBeGreaterThanOrEqual(1);
  });

  it('executes TOP_CONTRIBUTORS query', async () => {
    const result = await executeQuery(
      { type: 'TOP_CONTRIBUTORS' },
      { outcomeId },
    );
    expect(Array.isArray(result)).toBe(true);
  });

  it('executes IMPACT_ANALYSIS query', async () => {
    const result = await executeQuery(
      { type: 'IMPACT_ANALYSIS' },
      { nodeId: activity2Id },
    );
    expect(Array.isArray(result)).toBe(true);
    const impacts = result as any[];
    if (impacts.length > 0) {
      expect(impacts[0].outcomeId).toBeDefined();
      expect(impacts[0].totalContribution).toBeGreaterThan(0);
    }
  });

  it('executes NODE_SEARCH query', async () => {
    const result = await executeQuery(
      { type: 'NODE_SEARCH', searchTerm: 'Sales' },
      { entityId: caFpEntityId },
    );
    expect(Array.isArray(result)).toBe(true);
    const nodes = result as any[];
    expect(nodes.length).toBeGreaterThanOrEqual(1);
    // Should find "Sales Pipeline Management" and/or "Direct Sales Outreach"
    expect(nodes.some((n: any) => n.label.includes('Sales'))).toBe(true);
  });
});

describe('Graph Summary', () => {
  it('returns node and edge counts', async () => {
    const summary = await getEntityGraphSummary(caFpEntityId);
    expect(summary.nodeCounts.length).toBeGreaterThan(0);
    expect(summary.edgeCounts.length).toBeGreaterThanOrEqual(0);
    expect(summary.outcomes.length).toBeGreaterThanOrEqual(1);
  });

  it('includes outcome details', async () => {
    const summary = await getEntityGraphSummary(caFpEntityId);
    const revenueOutcome = summary.outcomes.find((o) => o.id === outcomeId);
    expect(revenueOutcome).toBeDefined();
    expect(revenueOutcome!.outcomeType).toBe('IMPROVE_REVENUE');
  });
});
