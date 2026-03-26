/**
 * Vector Embedder Service
 *
 * Generates node embeddings, stores them in pgvector,
 * and discovers potential CONTRIBUTES_TO edges via cosine similarity.
 */
import { v4 as uuid } from 'uuid';
import { query } from '../../lib/pg.js';
import { runCypher } from '../../lib/neo4j.js';
import { emit } from '../../lib/kafka.js';
import type { EBGEvent } from '../../lib/kafka.js';

// ============================================================
// Embedding generation
// ============================================================

/**
 * Pluggable embedding function. In production this would call
 * an external API (Claude, OpenAI, etc.). For testing, callers
 * can supply a deterministic function.
 */
export type EmbeddingFn = (text: string) => Promise<number[]>;

const EMBEDDING_DIM = 1536;

/**
 * Default embedding function — generates a deterministic hash-based
 * embedding from the input text. Suitable for testing only.
 */
export function hashEmbedding(text: string): number[] {
  const vec = new Array(EMBEDDING_DIM).fill(0);
  for (let i = 0; i < text.length; i++) {
    const idx = (text.charCodeAt(i) * (i + 1)) % EMBEDDING_DIM;
    vec[idx] += (text.charCodeAt(i) - 64) / 100;
  }
  // Normalize to unit vector
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

let activeEmbeddingFn: EmbeddingFn = async (text: string) => hashEmbedding(text);

export function setEmbeddingFunction(fn: EmbeddingFn): void {
  activeEmbeddingFn = fn;
}

export function resetEmbeddingFunction(): void {
  activeEmbeddingFn = async (text: string) => hashEmbedding(text);
}

/**
 * Build a text representation of a node for embedding.
 */
function nodeToText(label: string, properties: Record<string, any>): string {
  const parts = [label];
  if (properties.label) parts.push(properties.label);
  if (properties.description) parts.push(properties.description);
  if (properties.economic_category) parts.push(properties.economic_category);
  if (properties.direction) parts.push(properties.direction);
  if (properties.ontology) parts.push(properties.ontology);
  if (properties.status) parts.push(properties.status);
  return parts.join(' | ');
}

// ============================================================
// Embedding CRUD
// ============================================================

export async function generateAndStoreEmbedding(
  nodeId: string,
  entityId: string,
  nodeLabel: string,
  properties: Record<string, any> = {},
): Promise<{ nodeId: string; dimension: number }> {
  const text = nodeToText(nodeLabel, properties);
  const embedding = await activeEmbeddingFn(text);

  await query(
    `INSERT INTO node_embeddings (node_id, entity_id, node_label, embedding, updated_at)
     VALUES ($1, $2, $3, $4::vector, NOW())
     ON CONFLICT (node_id) DO UPDATE SET
       entity_id = $2, node_label = $3, embedding = $4::vector, updated_at = NOW()`,
    [nodeId, entityId, nodeLabel, `[${embedding.join(',')}]`],
  );

  return { nodeId, dimension: embedding.length };
}

export async function getEmbedding(nodeId: string): Promise<{
  node_id: string;
  entity_id: string;
  node_label: string;
  updated_at: Date;
} | null> {
  const result = await query<{
    node_id: string;
    entity_id: string;
    node_label: string;
    updated_at: Date;
  }>(
    `SELECT node_id, entity_id, node_label, updated_at
     FROM node_embeddings WHERE node_id = $1`,
    [nodeId],
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function deleteEmbedding(nodeId: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM node_embeddings WHERE node_id = $1`,
    [nodeId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function countEmbeddings(entityId?: string): Promise<number> {
  if (entityId) {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM node_embeddings WHERE entity_id = $1`,
      [entityId],
    );
    return Number(result.rows[0].count);
  }
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM node_embeddings`,
  );
  return Number(result.rows[0].count);
}

// ============================================================
// Bulk embedding
// ============================================================

export async function embedEntityNodes(entityId: string): Promise<{
  embedded: number;
  nodeLabels: string[];
}> {
  // Fetch all embeddable nodes for this entity
  const nodeTypes = [
    'Activity', 'Resource', 'Project', 'Initiative', 'Metric',
    'Capability', 'Asset', 'Outcome', 'CashFlowEvent', 'Obligation',
  ];

  let embedded = 0;
  const nodeLabels: string[] = [];

  for (const nodeType of nodeTypes) {
    const rows = await runCypher<Record<string, any>>(
      `MATCH (n:${nodeType} {entity_id: $entityId})
       RETURN n.id AS id, labels(n)[0] AS nodeLabel, properties(n) AS props`,
      { entityId },
    );

    for (const row of rows) {
      await generateAndStoreEmbedding(
        row.id as string,
        entityId,
        row.nodeLabel as string,
        row.props as Record<string, any>,
      );
      embedded++;
      if (!nodeLabels.includes(row.nodeLabel as string)) {
        nodeLabels.push(row.nodeLabel as string);
      }
    }
  }

  return { embedded, nodeLabels };
}

// ============================================================
// Similarity search + edge discovery
// ============================================================

export interface SimilarityCandidate {
  sourceId: string;
  targetId: string;
  cosineSimilarity: number;
  sourceLabel: string;
  targetLabel: string;
}

export async function findSimilarNodes(
  nodeId: string,
  threshold: number = 0.82,
  limit: number = 50,
): Promise<SimilarityCandidate[]> {
  const result = await query<{
    source: string;
    target: string;
    cosine_similarity: number;
    source_label: string;
    target_label: string;
  }>(
    `SELECT a.node_id AS source, b.node_id AS target,
       1 - (a.embedding <=> b.embedding) AS cosine_similarity,
       a.node_label AS source_label, b.node_label AS target_label
     FROM node_embeddings a, node_embeddings b
     WHERE a.node_id = $1
       AND a.node_id <> b.node_id
       AND 1 - (a.embedding <=> b.embedding) > $2
     ORDER BY cosine_similarity DESC
     LIMIT $3`,
    [nodeId, threshold, limit],
  );

  return result.rows.map(r => ({
    sourceId: r.source,
    targetId: r.target,
    cosineSimilarity: Number(r.cosine_similarity),
    sourceLabel: r.source_label,
    targetLabel: r.target_label,
  }));
}

export async function discoverEdgeCandidates(
  entityId: string,
  threshold: number = 0.82,
  limit: number = 50,
): Promise<SimilarityCandidate[]> {
  // Find pairs above threshold that don't already have edges
  const result = await query<{
    source: string;
    target: string;
    cosine_similarity: number;
    source_label: string;
    target_label: string;
  }>(
    `SELECT a.node_id AS source, b.node_id AS target,
       1 - (a.embedding <=> b.embedding) AS cosine_similarity,
       a.node_label AS source_label, b.node_label AS target_label
     FROM node_embeddings a, node_embeddings b
     WHERE a.entity_id = $1
       AND b.entity_id = $1
       AND a.node_id <> b.node_id
       AND a.node_id < b.node_id
       AND 1 - (a.embedding <=> b.embedding) > $2
     ORDER BY cosine_similarity DESC
     LIMIT $3`,
    [entityId, threshold, limit],
  );

  const candidates = result.rows.map(r => ({
    sourceId: r.source,
    targetId: r.target,
    cosineSimilarity: Number(r.cosine_similarity),
    sourceLabel: r.source_label,
    targetLabel: r.target_label,
  }));

  // Filter out pairs that already have a CONTRIBUTES_TO edge in Neo4j
  const filtered: SimilarityCandidate[] = [];
  for (const c of candidates) {
    const existing = await runCypher<{ count: number }>(
      `MATCH (a {id: $source})-[:CONTRIBUTES_TO]-(b {id: $target})
       RETURN count(*) AS count`,
      { source: c.sourceId, target: c.targetId },
    );
    if (Number(existing[0]?.count ?? 0) === 0) {
      filtered.push(c);
    }
  }

  return filtered;
}

// ============================================================
// Create inferred edges from discovered candidates
// ============================================================

export async function createInferredEdges(
  candidates: SimilarityCandidate[],
  entityId: string,
): Promise<{ created: number; edgeIds: string[] }> {
  const edgeIds: string[] = [];

  for (const c of candidates) {
    const edgeId = uuid();
    await runCypher(
      `MATCH (a {id: $source}), (b {id: $target})
       CREATE (a)-[:CONTRIBUTES_TO {
         id: $edgeId,
         weight: $weight,
         contribution_function: 'DIRECT',
         confidence: 'LOW',
         discovery_method: 'AI_EMBEDDING',
         cosine_similarity: $similarity,
         created_at: datetime(), updated_at: datetime()
       }]->(b)`,
      {
        source: c.sourceId,
        target: c.targetId,
        edgeId,
        weight: Math.round(c.cosineSimilarity * 100) / 100,
        similarity: c.cosineSimilarity,
      },
    );
    edgeIds.push(edgeId);

    // Emit edge created event
    const event: EBGEvent = {
      event_id: uuid(),
      event_type: 'EDGE_CREATED_BY_AI',
      sequence_number: Date.now(),
      idempotency_key: uuid(),
      entity_id: entityId,
      timestamp: new Date().toISOString(),
      payload: {
        edgeId,
        sourceId: c.sourceId,
        targetId: c.targetId,
        cosineSimilarity: c.cosineSimilarity,
        discoveryMethod: 'AI_EMBEDDING',
      },
    };
    await emit('ebg.graph', event);
  }

  return { created: edgeIds.length, edgeIds };
}

// ============================================================
// Full pipeline: embed → discover → create edges
// ============================================================

export async function runEdgeDiscoveryPipeline(
  entityId: string,
  options: {
    threshold?: number;
    limit?: number;
    autoCreate?: boolean;
  } = {},
): Promise<{
  embedded: number;
  candidates: SimilarityCandidate[];
  created: number;
  edgeIds: string[];
}> {
  const threshold = options.threshold ?? 0.82;
  const limit = options.limit ?? 50;
  const autoCreate = options.autoCreate ?? false;

  // Step 1: embed all entity nodes
  const { embedded } = await embedEntityNodes(entityId);

  // Step 2: discover candidates
  const candidates = await discoverEdgeCandidates(entityId, threshold, limit);

  // Step 3: optionally create edges
  let created = 0;
  let edgeIds: string[] = [];
  if (autoCreate && candidates.length > 0) {
    const result = await createInferredEdges(candidates, entityId);
    created = result.created;
    edgeIds = result.edgeIds;
  }

  return { embedded, candidates, created, edgeIds };
}
