/**
 * Segment Reporting (IFRS 8) — Integration Tests
 *
 * Tests the segment reporting service that aggregates P&L and assets
 * by Initiative (segment) using data from TimescaleDB and Neo4j.
 *
 * Uses mocked database modules for isolation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/neo4j.js', () => ({
  runCypher: vi.fn(),
}));

vi.mock('../../src/lib/pg.js', () => ({
  query: vi.fn(),
}));

import { runCypher } from '../../src/lib/neo4j.js';
import { query } from '../../src/lib/pg.js';
import {
  getSegmentReport,
  getSegmentDetail,
} from '../../src/services/gl/segment-reporting-service.js';

const mockRunCypher = vi.mocked(runCypher);
const mockQuery = vi.mocked(query);

const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const PERIOD_ID = '22222222-2222-2222-2222-222222222222';
const INIT_A_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const INIT_B_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const ACTIVITY_1 = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const ACTIVITY_2 = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const PROJECT_1 = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

describe('P7-SEGMENT-REPORTING', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== Basic Segment Report ==========

  it('should produce segment report with two segments', async () => {
    // Step 1: Initiatives query
    mockRunCypher.mockResolvedValueOnce([
      { id: INIT_A_ID, label: 'Digital Transformation', entity_id: ENTITY_ID, status: 'IN_PROGRESS', budget: 500000 },
      { id: INIT_B_ID, label: 'Cost Optimization', entity_id: ENTITY_ID, status: 'IN_PROGRESS', budget: 200000 },
    ]);

    // Step 2: Activities query
    mockRunCypher.mockResolvedValueOnce([
      { initiative_id: INIT_A_ID, id: ACTIVITY_1 },
      { initiative_id: INIT_B_ID, id: ACTIVITY_2 },
    ]);

    // Step 3: Projects query
    mockRunCypher.mockResolvedValueOnce([
      { initiative_id: INIT_A_ID, id: PROJECT_1 },
    ]);

    // Step 4: gl_period_balances query
    mockQuery.mockResolvedValueOnce({
      rows: [
        { node_ref_id: ACTIVITY_1, economic_category: 'REVENUE', debit_total: '0', credit_total: '100000', net_balance: '-100000' },
        { node_ref_id: ACTIVITY_1, economic_category: 'EXPENSE', debit_total: '60000', credit_total: '0', net_balance: '60000' },
        { node_ref_id: ACTIVITY_2, economic_category: 'REVENUE', debit_total: '0', credit_total: '50000', net_balance: '-50000' },
        { node_ref_id: ACTIVITY_2, economic_category: 'EXPENSE', debit_total: '30000', credit_total: '0', net_balance: '30000' },
        { node_ref_id: PROJECT_1, economic_category: 'ASSET', debit_total: '200000', credit_total: '0', net_balance: '200000' },
      ],
      rowCount: 5,
    } as any);

    // Step 5: Inter-segment elimination query
    mockQuery.mockResolvedValueOnce({
      rows: [{ elimination: '0' }],
      rowCount: 1,
    } as any);

    const report = await getSegmentReport(ENTITY_ID, PERIOD_ID);

    expect(report.entity_id).toBe(ENTITY_ID);
    expect(report.period_id).toBe(PERIOD_ID);
    expect(report.segments).toHaveLength(2);

    // Segment A: Digital Transformation
    const segA = report.segments.find((s) => s.segment.id === INIT_A_ID)!;
    expect(segA.segment.label).toBe('Digital Transformation');
    expect(segA.revenue).toBe(100000);
    expect(segA.expenses).toBe(60000);
    expect(segA.segment_profit).toBe(40000);
    expect(segA.assets).toBe(200000);

    // Segment B: Cost Optimization
    const segB = report.segments.find((s) => s.segment.id === INIT_B_ID)!;
    expect(segB.revenue).toBe(50000);
    expect(segB.expenses).toBe(30000);
    expect(segB.segment_profit).toBe(20000);
  });

  it('should handle empty entity with no segments', async () => {
    mockRunCypher.mockResolvedValueOnce([]); // No initiatives

    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // No balances
    mockQuery.mockResolvedValueOnce({ rows: [{ elimination: '0' }], rowCount: 1 } as any);

    const report = await getSegmentReport(ENTITY_ID, PERIOD_ID);

    expect(report.segments).toHaveLength(0);
    expect(report.consolidated.revenue).toBe(0);
    expect(report.consolidated.expenses).toBe(0);
  });

  // ========== Unallocated Bucket ==========

  it('should capture unallocated balances not tied to any segment', async () => {
    const ORPHAN_NODE = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

    mockRunCypher.mockResolvedValueOnce([
      { id: INIT_A_ID, label: 'Segment A', entity_id: ENTITY_ID, status: 'IN_PROGRESS', budget: 100000 },
    ]);
    mockRunCypher.mockResolvedValueOnce([]); // No activities
    mockRunCypher.mockResolvedValueOnce([]); // No projects

    mockQuery.mockResolvedValueOnce({
      rows: [
        // One balance for the initiative itself
        { node_ref_id: INIT_A_ID, economic_category: 'REVENUE', debit_total: '0', credit_total: '10000', net_balance: '-10000' },
        // One orphan balance not tied to any segment
        { node_ref_id: ORPHAN_NODE, economic_category: 'EXPENSE', debit_total: '5000', credit_total: '0', net_balance: '5000' },
      ],
      rowCount: 2,
    } as any);

    mockQuery.mockResolvedValueOnce({ rows: [{ elimination: '0' }], rowCount: 1 } as any);

    const report = await getSegmentReport(ENTITY_ID, PERIOD_ID);

    expect(report.segments).toHaveLength(1);
    expect(report.segments[0].revenue).toBe(10000);

    expect(report.unallocated.segment.id).toBe('UNALLOCATED');
    expect(report.unallocated.expenses).toBe(5000);
  });

  // ========== Inter-Segment Eliminations ==========

  it('should include inter-segment eliminations in consolidated profit', async () => {
    mockRunCypher.mockResolvedValueOnce([
      { id: INIT_A_ID, label: 'Segment A', entity_id: ENTITY_ID, status: 'IN_PROGRESS', budget: 100000 },
    ]);
    mockRunCypher.mockResolvedValueOnce([
      { initiative_id: INIT_A_ID, id: ACTIVITY_1 },
    ]);
    mockRunCypher.mockResolvedValueOnce([]); // No projects

    mockQuery.mockResolvedValueOnce({
      rows: [
        { node_ref_id: ACTIVITY_1, economic_category: 'REVENUE', debit_total: '0', credit_total: '80000', net_balance: '-80000' },
        { node_ref_id: ACTIVITY_1, economic_category: 'EXPENSE', debit_total: '50000', credit_total: '0', net_balance: '50000' },
      ],
      rowCount: 2,
    } as any);

    // Inter-segment elimination of 10000
    mockQuery.mockResolvedValueOnce({
      rows: [{ elimination: '10000' }],
      rowCount: 1,
    } as any);

    const report = await getSegmentReport(ENTITY_ID, PERIOD_ID);

    expect(report.inter_segment_eliminations).toBe(10000);
    // Consolidated profit = (80000 - 50000) - 10000 = 20000
    expect(report.consolidated.segment_profit).toBe(20000);
  });

  // ========== Consolidated Totals ==========

  it('should compute correct consolidated totals across segments', async () => {
    mockRunCypher.mockResolvedValueOnce([
      { id: INIT_A_ID, label: 'Seg A', entity_id: ENTITY_ID, status: 'IN_PROGRESS', budget: 100000 },
      { id: INIT_B_ID, label: 'Seg B', entity_id: ENTITY_ID, status: 'IN_PROGRESS', budget: 50000 },
    ]);
    mockRunCypher.mockResolvedValueOnce([
      { initiative_id: INIT_A_ID, id: ACTIVITY_1 },
      { initiative_id: INIT_B_ID, id: ACTIVITY_2 },
    ]);
    mockRunCypher.mockResolvedValueOnce([]); // No projects

    mockQuery.mockResolvedValueOnce({
      rows: [
        { node_ref_id: ACTIVITY_1, economic_category: 'REVENUE', debit_total: '0', credit_total: '100000', net_balance: '-100000' },
        { node_ref_id: ACTIVITY_1, economic_category: 'EXPENSE', debit_total: '70000', credit_total: '0', net_balance: '70000' },
        { node_ref_id: ACTIVITY_1, economic_category: 'ASSET', debit_total: '300000', credit_total: '10000', net_balance: '290000' },
        { node_ref_id: ACTIVITY_2, economic_category: 'REVENUE', debit_total: '0', credit_total: '60000', net_balance: '-60000' },
        { node_ref_id: ACTIVITY_2, economic_category: 'EXPENSE', debit_total: '40000', credit_total: '0', net_balance: '40000' },
        { node_ref_id: ACTIVITY_2, economic_category: 'LIABILITY', debit_total: '5000', credit_total: '50000', net_balance: '-45000' },
      ],
      rowCount: 6,
    } as any);

    mockQuery.mockResolvedValueOnce({ rows: [{ elimination: '0' }], rowCount: 1 } as any);

    const report = await getSegmentReport(ENTITY_ID, PERIOD_ID);

    expect(report.consolidated.revenue).toBe(160000); // 100k + 60k
    expect(report.consolidated.expenses).toBe(110000); // 70k + 40k
    expect(report.consolidated.segment_profit).toBe(50000); // 160k - 110k
    expect(report.consolidated.assets).toBe(290000); // 300k - 10k
    expect(report.consolidated.liabilities).toBe(45000); // 50k - 5k
  });

  // ========== Segment Detail ==========

  it('should return node-level breakdown for a segment', async () => {
    // getSegmentDetail: first query is initiative info
    mockRunCypher.mockResolvedValueOnce([
      { id: INIT_A_ID, label: 'Digital Transformation', entity_id: ENTITY_ID, status: 'IN_PROGRESS', budget: 500000 },
    ]);

    // Child nodes
    mockRunCypher.mockResolvedValueOnce([
      { id: ACTIVITY_1, label: 'Dev Sprint', node_type: 'Activity' },
      { id: PROJECT_1, label: 'Cloud Migration', node_type: 'Project' },
      { id: INIT_A_ID, label: 'Digital Transformation', node_type: 'Initiative' },
    ]);

    // Balances per node
    mockQuery.mockResolvedValueOnce({
      rows: [
        { node_ref_id: ACTIVITY_1, node_ref_type: 'ACTIVITY', economic_category: 'REVENUE', debit_total: '0', credit_total: '50000' },
        { node_ref_id: ACTIVITY_1, node_ref_type: 'ACTIVITY', economic_category: 'EXPENSE', debit_total: '30000', credit_total: '0' },
        { node_ref_id: PROJECT_1, node_ref_type: 'PROJECT', economic_category: 'EXPENSE', debit_total: '20000', credit_total: '0' },
      ],
      rowCount: 3,
    } as any);

    const detail = await getSegmentDetail(ENTITY_ID, PERIOD_ID, INIT_A_ID);

    expect(detail.segment.label).toBe('Digital Transformation');
    expect(detail.pnl.revenue).toBe(50000);
    expect(detail.pnl.expenses).toBe(50000); // 30k + 20k
    expect(detail.pnl.segment_profit).toBe(0);
    expect(detail.nodes).toHaveLength(3);

    const actNode = detail.nodes.find((n) => n.node_ref_id === ACTIVITY_1)!;
    expect(actNode.revenue).toBe(50000);
    expect(actNode.expenses).toBe(30000);
    expect(actNode.net).toBe(20000);
  });

  it('should throw if initiative not found', async () => {
    mockRunCypher.mockResolvedValueOnce([]); // No initiative found

    await expect(
      getSegmentDetail(ENTITY_ID, PERIOD_ID, 'nonexistent-id'),
    ).rejects.toThrow('not found');
  });

  // ========== Result Shape ==========

  it('should return correct report shape', async () => {
    mockRunCypher.mockResolvedValueOnce([]); // No initiatives
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ elimination: '0' }], rowCount: 1 } as any);

    const report = await getSegmentReport(ENTITY_ID, PERIOD_ID);

    expect(report).toHaveProperty('entity_id');
    expect(report).toHaveProperty('period_id');
    expect(report).toHaveProperty('segments');
    expect(report).toHaveProperty('unallocated');
    expect(report).toHaveProperty('consolidated');
    expect(report).toHaveProperty('inter_segment_eliminations');
    expect(report.unallocated).toHaveProperty('segment');
    expect(report.unallocated).toHaveProperty('revenue');
    expect(report.unallocated).toHaveProperty('expenses');
    expect(report.unallocated).toHaveProperty('segment_profit');
    expect(report.unallocated).toHaveProperty('assets');
    expect(report.unallocated).toHaveProperty('liabilities');
    expect(report.unallocated).toHaveProperty('byCategory');
    expect(report.consolidated).toHaveProperty('revenue');
    expect(report.consolidated).toHaveProperty('expenses');
    expect(report.consolidated).toHaveProperty('segment_profit');
    expect(report.consolidated).toHaveProperty('assets');
    expect(report.consolidated).toHaveProperty('liabilities');
  });

  // ========== Balance Sheet Items per Segment ==========

  it('should compute segment assets and liabilities', async () => {
    mockRunCypher.mockResolvedValueOnce([
      { id: INIT_A_ID, label: 'Segment A', entity_id: ENTITY_ID, status: 'IN_PROGRESS', budget: 0 },
    ]);
    mockRunCypher.mockResolvedValueOnce([{ initiative_id: INIT_A_ID, id: ACTIVITY_1 }]);
    mockRunCypher.mockResolvedValueOnce([]); // No projects

    mockQuery.mockResolvedValueOnce({
      rows: [
        { node_ref_id: ACTIVITY_1, economic_category: 'ASSET', debit_total: '500000', credit_total: '100000', net_balance: '400000' },
        { node_ref_id: ACTIVITY_1, economic_category: 'LIABILITY', debit_total: '20000', credit_total: '200000', net_balance: '-180000' },
      ],
      rowCount: 2,
    } as any);

    mockQuery.mockResolvedValueOnce({ rows: [{ elimination: '0' }], rowCount: 1 } as any);

    const report = await getSegmentReport(ENTITY_ID, PERIOD_ID);
    const seg = report.segments[0];

    expect(seg.assets).toBe(400000); // 500k - 100k
    expect(seg.liabilities).toBe(180000); // 200k - 20k
  });
});
