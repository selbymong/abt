/**
 * Vector Embedder — Integration Tests
 *
 * Tests node embedding generation/storage, similarity search,
 * edge discovery, and the full pipeline.
 *
 * Requires: Neo4j + PostgreSQL (with pgvector) + Kafka running.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { v4 as uuid } from 'uuid';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { closePg, query } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities } from '../../src/services/graph/graph-crud-service.js';
import {
  generateAndStoreEmbedding,
  getEmbedding,
  deleteEmbedding,
  countEmbeddings,
  embedEntityNodes,
  findSimilarNodes,
  discoverEdgeCandidates,
  createInferredEdges,
  runEdgeDiscoveryPipeline,
  hashEmbedding,
  setEmbeddingFunction,
  resetEmbeddingFunction,
} from '../../src/services/ai/vector-embedder-service.js';

let testEntityId: string;
const cleanupNodeIds: string[] = [];
const cleanupEmbeddingIds: string[] = [];

function trackNode(id: string) {
  cleanupNodeIds.push(id);
  return id;
}
function trackEmb(id: string) {
  cleanupEmbeddingIds.push(id);
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  const fpEntity = entities.find((e) => e.entity_type === 'FOR_PROFIT');
  testEntityId = fpEntity!.id;
});

afterAll(async () => {
  // Clean up embeddings
  for (const id of cleanupEmbeddingIds) {
    await query('DELETE FROM node_embeddings WHERE node_id = $1', [id]);
  }
  // Clean up Neo4j test nodes and edges
  for (const id of cleanupNodeIds) {
    await runCypher(`MATCH (n {id: $id}) DETACH DELETE n`, { id });
  }
  // Clean up any AI-created edges
  await runCypher(
    `MATCH ()-[e:CONTRIBUTES_TO {discovery_method: 'AI_EMBEDDING'}]-()
     DELETE e`,
    {},
  );

  resetEmbeddingFunction();
  await closeNeo4j();
  await closePg();
  await closeKafka();
});

// ============================================================
// Hash Embedding (deterministic)
// ============================================================

describe('Hash Embedding', () => {
  it('produces a 1536-dim unit vector', () => {
    const vec = hashEmbedding('Test Activity');
    expect(vec.length).toBe(1536);
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 4);
  });

  it('produces identical vectors for identical text', () => {
    const a = hashEmbedding('Revenue Growth');
    const b = hashEmbedding('Revenue Growth');
    expect(a).toEqual(b);
  });

  it('produces different vectors for different text', () => {
    const a = hashEmbedding('Revenue Growth');
    const b = hashEmbedding('Cost Reduction');
    expect(a).not.toEqual(b);
  });
});

// ============================================================
// Embedding CRUD
// ============================================================

describe('Embedding CRUD', () => {
  const nodeId = uuid();

  it('stores an embedding', async () => {
    trackEmb(nodeId);
    const result = await generateAndStoreEmbedding(
      nodeId, testEntityId, 'Activity',
      { label: 'Marketing Campaign', description: 'Digital ads' },
    );
    expect(result.nodeId).toBe(nodeId);
    expect(result.dimension).toBe(1536);
  });

  it('retrieves an embedding', async () => {
    const emb = await getEmbedding(nodeId);
    expect(emb).not.toBeNull();
    expect(emb!.node_id).toBe(nodeId);
    expect(emb!.node_label).toBe('Activity');
    expect(emb!.entity_id).toBe(testEntityId);
  });

  it('upserts on conflict', async () => {
    await generateAndStoreEmbedding(
      nodeId, testEntityId, 'Resource',
      { label: 'Updated Label' },
    );
    const emb = await getEmbedding(nodeId);
    expect(emb!.node_label).toBe('Resource');
  });

  it('counts embeddings', async () => {
    const count = await countEmbeddings(testEntityId);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('deletes an embedding', async () => {
    const deleted = await deleteEmbedding(nodeId);
    expect(deleted).toBe(true);
    const emb = await getEmbedding(nodeId);
    expect(emb).toBeNull();
  });
});

// ============================================================
// Similarity Search
// ============================================================

describe('Similarity Search', () => {
  const ids = [uuid(), uuid(), uuid()];

  beforeAll(async () => {
    // Use a custom embedding fn that puts similar nodes close together
    setEmbeddingFunction(async (text: string) => {
      const vec = new Array(1536).fill(0);
      if (text.includes('Marketing')) {
        vec[0] = 0.9; vec[1] = 0.3; vec[2] = 0.1;
      } else if (text.includes('Advertising')) {
        vec[0] = 0.88; vec[1] = 0.32; vec[2] = 0.12;
      } else {
        vec[0] = 0.1; vec[1] = 0.1; vec[2] = 0.9;
      }
      const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
      return vec.map(v => v / norm);
    });

    for (const id of ids) trackEmb(id);

    await generateAndStoreEmbedding(ids[0], testEntityId, 'Activity', { label: 'Marketing Campaign' });
    await generateAndStoreEmbedding(ids[1], testEntityId, 'Activity', { label: 'Advertising Spend' });
    await generateAndStoreEmbedding(ids[2], testEntityId, 'Outcome', { label: 'Server Infrastructure' });
  });

  it('finds similar nodes above threshold', async () => {
    const results = await findSimilarNodes(ids[0], 0.9);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].targetId).toBe(ids[1]);
    expect(results[0].cosineSimilarity).toBeGreaterThan(0.9);
  });

  it('does not return dissimilar nodes', async () => {
    const results = await findSimilarNodes(ids[0], 0.9);
    const serverResult = results.find(r => r.targetId === ids[2]);
    expect(serverResult).toBeUndefined();
  });
});

// ============================================================
// Edge Discovery
// ============================================================

describe('Edge Discovery', () => {
  const activityId1 = uuid();
  const activityId2 = uuid();
  const outcomeId = uuid();

  beforeAll(async () => {
    // Create real Neo4j nodes
    await runCypher(
      `CREATE (a:Activity {
        id: $id, entity_id: $entityId, label: 'Sales Outreach',
        status: 'IN_PROGRESS', created_at: datetime(), updated_at: datetime()
      })`,
      { id: activityId1, entityId: testEntityId },
    );
    trackNode(activityId1);

    await runCypher(
      `CREATE (a:Activity {
        id: $id, entity_id: $entityId, label: 'Sales Pipeline',
        status: 'IN_PROGRESS', created_at: datetime(), updated_at: datetime()
      })`,
      { id: activityId2, entityId: testEntityId },
    );
    trackNode(activityId2);

    await runCypher(
      `CREATE (o:Outcome {
        id: $id, entity_id: $entityId, label: 'Warehouse Operations',
        ontology: 'FINANCIAL', created_at: datetime(), updated_at: datetime()
      })`,
      { id: outcomeId, entityId: testEntityId },
    );
    trackNode(outcomeId);

    // Embed them with controlled similarity
    setEmbeddingFunction(async (text: string) => {
      const vec = new Array(1536).fill(0);
      if (text.includes('Sales Outreach')) {
        vec[0] = 0.9; vec[1] = 0.3; vec[2] = 0.15;
      } else if (text.includes('Sales Pipeline')) {
        vec[0] = 0.89; vec[1] = 0.31; vec[2] = 0.14;
      } else {
        vec[0] = 0.1; vec[1] = 0.1; vec[2] = 0.95;
      }
      const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
      return vec.map(v => v / norm);
    });

    trackEmb(activityId1);
    trackEmb(activityId2);
    trackEmb(outcomeId);

    await generateAndStoreEmbedding(activityId1, testEntityId, 'Activity', { label: 'Sales Outreach' });
    await generateAndStoreEmbedding(activityId2, testEntityId, 'Activity', { label: 'Sales Pipeline' });
    await generateAndStoreEmbedding(outcomeId, testEntityId, 'Outcome', { label: 'Warehouse Operations' });
  });

  it('discovers edge candidates that have no existing edge', async () => {
    const candidates = await discoverEdgeCandidates(testEntityId, 0.9);
    const pair = candidates.find(
      c => (c.sourceId === activityId1 && c.targetId === activityId2) ||
           (c.sourceId === activityId2 && c.targetId === activityId1),
    );
    expect(pair).toBeDefined();
    expect(pair!.cosineSimilarity).toBeGreaterThan(0.9);
  });

  it('excludes pairs that already have edges', async () => {
    // Create an edge between activity1 and activity2
    await runCypher(
      `MATCH (a {id: $src}), (b {id: $tgt})
       CREATE (a)-[:CONTRIBUTES_TO {
         id: $edgeId, weight: 0.5, contribution_function: 'DIRECT',
         created_at: datetime(), updated_at: datetime()
       }]->(b)`,
      { src: activityId1, tgt: activityId2, edgeId: uuid() },
    );

    const candidates = await discoverEdgeCandidates(testEntityId, 0.9);
    const pair = candidates.find(
      c => (c.sourceId === activityId1 && c.targetId === activityId2) ||
           (c.sourceId === activityId2 && c.targetId === activityId1),
    );
    expect(pair).toBeUndefined();
  });

  it('creates inferred edges from candidates', async () => {
    const testCandidates = [{
      sourceId: activityId1,
      targetId: outcomeId,
      cosineSimilarity: 0.85,
      sourceLabel: 'Activity',
      targetLabel: 'Outcome',
    }];

    const result = await createInferredEdges(testCandidates, testEntityId);
    expect(result.created).toBe(1);
    expect(result.edgeIds.length).toBe(1);

    // Verify edge exists in Neo4j
    const edges = await runCypher<Record<string, any>>(
      `MATCH (a {id: $src})-[e:CONTRIBUTES_TO {discovery_method: 'AI_EMBEDDING'}]->(b {id: $tgt})
       RETURN e.cosine_similarity AS similarity, e.confidence AS confidence`,
      { src: activityId1, tgt: outcomeId },
    );
    expect(edges.length).toBe(1);
    expect(Number(edges[0].similarity)).toBeCloseTo(0.85, 2);
    expect(edges[0].confidence).toBe('LOW');
  });
});

// ============================================================
// Bulk Entity Embedding
// ============================================================

describe('Bulk Entity Embedding', () => {
  const actId = uuid();

  beforeAll(async () => {
    resetEmbeddingFunction();
    await runCypher(
      `CREATE (a:Activity {
        id: $id, entity_id: $entityId, label: 'Bulk Test Activity',
        status: 'PLANNED', created_at: datetime(), updated_at: datetime()
      })`,
      { id: actId, entityId: testEntityId },
    );
    trackNode(actId);
    trackEmb(actId);
  });

  it('embeds all nodes for an entity', async () => {
    const result = await embedEntityNodes(testEntityId);
    expect(result.embedded).toBeGreaterThanOrEqual(1);
    expect(result.nodeLabels.length).toBeGreaterThanOrEqual(1);

    // Verify the test activity was embedded
    const emb = await getEmbedding(actId);
    expect(emb).not.toBeNull();
    expect(emb!.node_label).toBe('Activity');
  });
});

// ============================================================
// Full Pipeline
// ============================================================

describe('Edge Discovery Pipeline', () => {
  const pipeNode1 = uuid();
  const pipeNode2 = uuid();

  beforeAll(async () => {
    // Create two very similar nodes
    await runCypher(
      `CREATE (a:Activity {
        id: $id, entity_id: $entityId, label: 'Pipeline Node Alpha',
        status: 'IN_PROGRESS', created_at: datetime(), updated_at: datetime()
      })`,
      { id: pipeNode1, entityId: testEntityId },
    );
    trackNode(pipeNode1);
    trackEmb(pipeNode1);

    await runCypher(
      `CREATE (a:Activity {
        id: $id, entity_id: $entityId, label: 'Pipeline Node Alpha Copy',
        status: 'IN_PROGRESS', created_at: datetime(), updated_at: datetime()
      })`,
      { id: pipeNode2, entityId: testEntityId },
    );
    trackNode(pipeNode2);
    trackEmb(pipeNode2);

    // Make them nearly identical embeddings
    setEmbeddingFunction(async (text: string) => {
      const vec = new Array(1536).fill(0);
      if (text.includes('Alpha Copy')) {
        vec[0] = 0.901; vec[1] = 0.301; vec[2] = 0.101;
      } else if (text.includes('Alpha')) {
        vec[0] = 0.9; vec[1] = 0.3; vec[2] = 0.1;
      } else {
        // Other nodes get a distant embedding
        vec[500] = 0.9; vec[501] = 0.3;
      }
      const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
      return vec.map(v => v / norm);
    });
  });

  it('runs the full pipeline (embed + discover)', async () => {
    const result = await runEdgeDiscoveryPipeline(testEntityId, {
      threshold: 0.99,
      autoCreate: false,
    });
    expect(result.embedded).toBeGreaterThanOrEqual(2);
    // The two pipeline nodes should be candidates at threshold 0.99
    expect(result.candidates.length).toBeGreaterThanOrEqual(1);
    expect(result.created).toBe(0); // autoCreate=false
  });

  it('runs pipeline with autoCreate', async () => {
    const result = await runEdgeDiscoveryPipeline(testEntityId, {
      threshold: 0.999,
      autoCreate: true,
    });
    // May or may not create edges depending on similarity,
    // but the pipeline should complete without error
    expect(typeof result.created).toBe('number');
    expect(Array.isArray(result.edgeIds)).toBe(true);
  });
});
