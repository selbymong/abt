/**
 * Graph Invariant Tests (GRAPH_INVARIANT_1, GRAPH_INVARIANT_2)
 *
 * These tests verify the structural integrity of the business graph.
 *
 * Requires: Neo4j running
 */
import { describe, it, expect, afterAll } from 'vitest';
import { runCypher, closeNeo4j } from '../../src/lib/neo4j.js';

afterAll(async () => {
  await closeNeo4j();
});

describe('Graph Invariants', () => {
  /**
   * GRAPH_INVARIANT_1: Every IN_PROGRESS or PLANNED Activity has a
   * CONTRIBUTES_TO path to at least one Outcome.
   *
   * Activities that are spending money (cost_monetary > 0) but have
   * no contribution path to any outcome represent orphaned spend.
   */
  it('GRAPH_INVARIANT_1: active activities have outcome paths', async () => {
    const results = await runCypher<{ orphaned_count: number }>(
      `MATCH (a:Activity)
       WHERE a.status IN ['IN_PROGRESS', 'PLANNED']
         AND NOT EXISTS {
           MATCH (a)-[:CONTRIBUTES_TO*1..6]->(:Outcome)
         }
       RETURN count(a) AS orphaned_count`,
    );

    const orphanCount = results[0]?.orphaned_count ?? 0;
    // Convert neo4j integer if necessary
    const count = typeof orphanCount === 'object' ? Number(orphanCount) : orphanCount;
    expect(count).toBe(0);
  });

  /**
   * GRAPH_INVARIANT_2: HARD_CLOSED period — back-propagation complete
   *
   * For every HARD_CLOSED period, all Outcomes with realized_delta
   * must have had their CONTRIBUTES_TO edge weights updated by
   * the weight learner (back-propagation).
   *
   * In empty DB, trivially true. In populated DB, we check that
   * no Outcome in a hard-closed period has a pending back-prop marker.
   */
  it('GRAPH_INVARIANT_2: hard-closed periods have complete back-propagation', async () => {
    const results = await runCypher<{ id: string }>(
      `MATCH (p:AccountingPeriod {status: 'HARD_CLOSED'})
       MATCH (o:Outcome {entity_id: p.entity_id})
       WHERE o.period_end <= p.end_date
         AND o.realized_delta <> 0
         AND o.value_state <> 'REALIZED'
       RETURN o.id AS id`,
    );

    expect(results).toHaveLength(0);
  });
});
