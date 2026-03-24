/**
 * Ontology Invariant Tests (ONTOLOGY_INVARIANT_1, _2, _3)
 *
 * These tests verify the hard boundary between FINANCIAL and MISSION
 * ontologies in the business graph.
 *
 * Requires: Neo4j running
 */
import { describe, it, expect, afterAll } from 'vitest';
import { runCypher, closeNeo4j } from '../../src/lib/neo4j.js';

afterAll(async () => {
  await closeNeo4j();
});

describe('Ontology Invariants', () => {
  /**
   * ONTOLOGY_INVARIANT_1: Every Outcome.ontology matches owning entity.outcome_ontology
   *
   * FOR_PROFIT entities have FINANCIAL ontology outcomes.
   * NOT_FOR_PROFIT entities have MISSION ontology outcomes.
   */
  it('ONTOLOGY_INVARIANT_1: outcome ontology matches entity', async () => {
    const results = await runCypher<{ outcome_id: string; outcome_ontology: string; entity_ontology: string }>(
      `MATCH (o:Outcome)
       MATCH (e:Entity {id: o.entity_id})
       WHERE o.ontology <> e.outcome_ontology
       RETURN o.id AS outcome_id,
         o.ontology AS outcome_ontology,
         e.outcome_ontology AS entity_ontology`,
    );

    expect(results).toHaveLength(0);
  });

  /**
   * ONTOLOGY_INVARIANT_2: Every CONTRIBUTES_TO path terminates at
   * an Outcome whose ontology matches the originating entity's ontology.
   */
  it('ONTOLOGY_INVARIANT_2: contribution paths stay within ontology', async () => {
    const results = await runCypher<{ path_count: number }>(
      `MATCH path = (a:Activity)-[:CONTRIBUTES_TO*1..6]->(o:Outcome)
       MATCH (e:Entity {id: a.entity_id})
       WHERE o.ontology <> e.outcome_ontology
       RETURN count(path) AS path_count`,
    );

    const pathCount = results[0]?.path_count ?? 0;
    const count = typeof pathCount === 'object' ? Number(pathCount) : pathCount;
    expect(count).toBe(0);
  });

  /**
   * ONTOLOGY_INVARIANT_3: No back-propagation crosses ontology boundary.
   *
   * The weight learner must never propagate gradients across the
   * FINANCIAL/MISSION boundary. We verify that no CONTRIBUTES_TO edge
   * has ontology_bridge = true between different-ontology endpoints.
   *
   * (ontology_bridge is always false; it exists as a documentation marker)
   */
  it('ONTOLOGY_INVARIANT_3: no cross-ontology back-propagation', async () => {
    const results = await runCypher<{ edge_count: number }>(
      `MATCH (source)-[r:CONTRIBUTES_TO]->(target)
       WHERE source.entity_id IS NOT NULL AND target.entity_id IS NOT NULL
       MATCH (e1:Entity {id: source.entity_id})
       MATCH (e2:Entity {id: target.entity_id})
       WHERE e1.outcome_ontology <> e2.outcome_ontology
         AND r.ontology_bridge = false
       RETURN count(r) AS edge_count`,
    );

    // Cross-ontology edges with ontology_bridge=false should not exist
    const edgeCount = results[0]?.edge_count ?? 0;
    const count = typeof edgeCount === 'object' ? Number(edgeCount) : edgeCount;
    expect(count).toBe(0);
  });
});
