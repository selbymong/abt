/**
 * Nightly Reconciliation — Integration Tests
 *
 * Tests the reconciliation service that compares Neo4j LedgerLine sums
 * vs TimescaleDB gl_period_balances per (entity_id, period_id).
 *
 * Note: These tests verify the reconciliation logic using mocked
 * data sources. Full end-to-end tests require live databases.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We'll mock the database modules to test reconciliation logic in isolation
vi.mock('../../src/lib/neo4j.js', () => ({
  runCypher: vi.fn(),
}));

vi.mock('../../src/lib/pg.js', () => ({
  query: vi.fn(),
}));

vi.mock('../../src/lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { runCypher } from '../../src/lib/neo4j.js';
import { query } from '../../src/lib/pg.js';
import {
  runReconciliation,
  startReconciliationScheduler,
  stopReconciliationScheduler,
  type ReconciliationRunResult,
} from '../../src/services/reconciliation/nightly-reconciliation-service.js';

const mockRunCypher = vi.mocked(runCypher);
const mockQuery = vi.mocked(query);

describe('P7-NIGHTLY-RECONCILIATION', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: persist run result succeeds
    mockQuery.mockImplementation(async (sql: string) => {
      if (typeof sql === 'string' && sql.includes('INSERT INTO reconciliation_runs')) {
        return { rows: [], rowCount: 1 } as any;
      }
      // Default for gl_period_balances queries
      return { rows: [], rowCount: 0 } as any;
    });
  });

  afterEach(() => {
    stopReconciliationScheduler();
  });

  // ========== Balanced Scenarios ==========

  it('should report BALANCED when Neo4j and PG totals match', async () => {
    const entityId = '11111111-1111-1111-1111-111111111111';
    const periodId = '22222222-2222-2222-2222-222222222222';

    // Neo4j returns one (entity, period) pair
    mockRunCypher.mockResolvedValueOnce([
      { entity_id: entityId, period_id: periodId, neo4j_debit: 1000, neo4j_credit: 1000 },
    ]);

    // PG returns matching totals for that pair
    mockQuery.mockImplementation(async (sql: string, params?: any[]) => {
      if (typeof sql === 'string' && sql.includes('INSERT INTO reconciliation_runs')) {
        return { rows: [], rowCount: 1 } as any;
      }
      if (typeof sql === 'string' && sql.includes('FROM gl_period_balances') && !sql.includes('GROUP BY')) {
        return {
          rows: [{ pg_debit: '1000', pg_credit: '1000' }],
          rowCount: 1,
        } as any;
      }
      // Orphan check returns empty
      if (typeof sql === 'string' && sql.includes('GROUP BY')) {
        return { rows: [], rowCount: 0 } as any;
      }
      return { rows: [], rowCount: 0 } as any;
    });

    const result = await runReconciliation();

    expect(result.status).toBe('BALANCED');
    expect(result.total_pairs_checked).toBe(1);
    expect(result.balanced_count).toBe(1);
    expect(result.discrepancy_count).toBe(0);
    expect(result.discrepancies).toHaveLength(0);
  });

  it('should report BALANCED with no data', async () => {
    // Neo4j returns no pairs
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await runReconciliation();

    expect(result.status).toBe('BALANCED');
    expect(result.total_pairs_checked).toBe(0);
    expect(result.discrepancy_count).toBe(0);
  });

  // ========== Discrepancy Scenarios ==========

  it('should detect DISCREPANCY when PG debits differ from Neo4j', async () => {
    const entityId = '11111111-1111-1111-1111-111111111111';
    const periodId = '22222222-2222-2222-2222-222222222222';

    mockRunCypher.mockResolvedValueOnce([
      { entity_id: entityId, period_id: periodId, neo4j_debit: 5000, neo4j_credit: 5000 },
    ]);

    mockQuery.mockImplementation(async (sql: string) => {
      if (typeof sql === 'string' && sql.includes('INSERT INTO reconciliation_runs')) {
        return { rows: [], rowCount: 1 } as any;
      }
      if (typeof sql === 'string' && sql.includes('FROM gl_period_balances') && !sql.includes('GROUP BY')) {
        // PG has different debit total — a projection lag
        return {
          rows: [{ pg_debit: '4500', pg_credit: '5000' }],
          rowCount: 1,
        } as any;
      }
      if (typeof sql === 'string' && sql.includes('GROUP BY')) {
        return { rows: [], rowCount: 0 } as any;
      }
      return { rows: [], rowCount: 0 } as any;
    });

    const result = await runReconciliation();

    expect(result.status).toBe('DISCREPANCY');
    expect(result.discrepancy_count).toBe(1);
    expect(result.discrepancies[0].entity_id).toBe(entityId);
    expect(result.discrepancies[0].debit_difference).toBeCloseTo(500);
    expect(result.discrepancies[0].credit_difference).toBeCloseTo(0);
  });

  it('should detect DISCREPANCY for orphaned PG rows (in PG but not Neo4j)', async () => {
    const entityId = '33333333-3333-3333-3333-333333333333';
    const periodId = '44444444-4444-4444-4444-444444444444';

    // Neo4j returns nothing
    mockRunCypher.mockResolvedValueOnce([]);

    mockQuery.mockImplementation(async (sql: string) => {
      if (typeof sql === 'string' && sql.includes('INSERT INTO reconciliation_runs')) {
        return { rows: [], rowCount: 1 } as any;
      }
      // Orphan query returns a PG-only pair
      if (typeof sql === 'string' && sql.includes('GROUP BY')) {
        return {
          rows: [
            { entity_id: entityId, period_id: periodId, pg_debit: '200', pg_credit: '200' },
          ],
          rowCount: 1,
        } as any;
      }
      return { rows: [], rowCount: 0 } as any;
    });

    const result = await runReconciliation();

    expect(result.status).toBe('DISCREPANCY');
    expect(result.discrepancy_count).toBe(1);
    expect(result.discrepancies[0].neo4j_debit).toBe(0);
    expect(result.discrepancies[0].neo4j_credit).toBe(0);
    expect(result.discrepancies[0].pg_debit).toBe(200);
  });

  // ========== Multi-Entity ==========

  it('should reconcile multiple entity-period pairs', async () => {
    const e1 = '11111111-1111-1111-1111-111111111111';
    const e2 = '22222222-2222-2222-2222-222222222222';
    const p1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    mockRunCypher.mockResolvedValueOnce([
      { entity_id: e1, period_id: p1, neo4j_debit: 1000, neo4j_credit: 1000 },
      { entity_id: e2, period_id: p1, neo4j_debit: 2000, neo4j_credit: 2000 },
    ]);

    let callCount = 0;
    mockQuery.mockImplementation(async (sql: string) => {
      if (typeof sql === 'string' && sql.includes('INSERT INTO reconciliation_runs')) {
        return { rows: [], rowCount: 1 } as any;
      }
      if (typeof sql === 'string' && sql.includes('FROM gl_period_balances') && !sql.includes('GROUP BY')) {
        callCount++;
        if (callCount === 1) {
          // e1 matches
          return { rows: [{ pg_debit: '1000', pg_credit: '1000' }], rowCount: 1 } as any;
        }
        // e2 has a discrepancy
        return { rows: [{ pg_debit: '1800', pg_credit: '2000' }], rowCount: 1 } as any;
      }
      if (typeof sql === 'string' && sql.includes('GROUP BY')) {
        return { rows: [], rowCount: 0 } as any;
      }
      return { rows: [], rowCount: 0 } as any;
    });

    const result = await runReconciliation();

    expect(result.total_pairs_checked).toBe(2);
    expect(result.balanced_count).toBe(1);
    expect(result.discrepancy_count).toBe(1);
    expect(result.status).toBe('DISCREPANCY');
  });

  // ========== Tolerance ==========

  it('should respect custom tolerance', async () => {
    const entityId = '11111111-1111-1111-1111-111111111111';
    const periodId = '22222222-2222-2222-2222-222222222222';

    mockRunCypher.mockResolvedValueOnce([
      { entity_id: entityId, period_id: periodId, neo4j_debit: 1000, neo4j_credit: 1000 },
    ]);

    mockQuery.mockImplementation(async (sql: string) => {
      if (typeof sql === 'string' && sql.includes('INSERT INTO reconciliation_runs')) {
        return { rows: [], rowCount: 1 } as any;
      }
      if (typeof sql === 'string' && sql.includes('FROM gl_period_balances') && !sql.includes('GROUP BY')) {
        // 0.5 difference — within tolerance of 1.0
        return { rows: [{ pg_debit: '999.5', pg_credit: '1000' }], rowCount: 1 } as any;
      }
      if (typeof sql === 'string' && sql.includes('GROUP BY')) {
        return { rows: [], rowCount: 0 } as any;
      }
      return { rows: [], rowCount: 0 } as any;
    });

    const result = await runReconciliation({ tolerance: 1.0 });

    expect(result.status).toBe('BALANCED');
    expect(result.tolerance).toBe(1.0);
  });

  // ========== Error Handling ==========

  it('should return ERROR status when Neo4j query fails', async () => {
    mockRunCypher.mockRejectedValueOnce(new Error('Neo4j connection refused'));

    const result = await runReconciliation();

    expect(result.status).toBe('ERROR');
    expect(result.error_message).toBe('Neo4j connection refused');
    expect(result.total_pairs_checked).toBe(0);
  });

  // ========== Result Shape ==========

  it('should return correct result shape', async () => {
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await runReconciliation();

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('run_date');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('total_pairs_checked');
    expect(result).toHaveProperty('balanced_count');
    expect(result).toHaveProperty('discrepancy_count');
    expect(result).toHaveProperty('tolerance');
    expect(result).toHaveProperty('discrepancies');
    expect(result).toHaveProperty('duration_ms');
    expect(result).toHaveProperty('created_at');
    expect(typeof result.duration_ms).toBe('number');
    expect(result.duration_ms).toBeGreaterThanOrEqual(0);
  });

  // ========== Filter ==========

  it('should pass entity filter to Neo4j query', async () => {
    const entityId = '11111111-1111-1111-1111-111111111111';

    mockRunCypher.mockResolvedValueOnce([]);

    await runReconciliation({ entityId });

    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining('entity_id = $entityId'),
      expect.objectContaining({ entityId }),
    );
  });

  // ========== Scheduler ==========

  it('should start and stop scheduler without errors', () => {
    startReconciliationScheduler(60_000);
    // Starting again should warn but not throw
    startReconciliationScheduler(60_000);
    stopReconciliationScheduler();
    // Stopping again should be safe
    stopReconciliationScheduler();
  });

  // ========== Persistence ==========

  it('should persist run result to reconciliation_runs table', async () => {
    mockRunCypher.mockResolvedValueOnce([]);

    await runReconciliation();

    // Verify INSERT was called
    const insertCalls = mockQuery.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO reconciliation_runs'),
    );
    expect(insertCalls.length).toBe(1);

    // Verify the params include the run data
    const params = insertCalls[0][1] as any[];
    expect(params).toHaveLength(13);
    expect(params[2]).toBe('BALANCED'); // status
  });
});
