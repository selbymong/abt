/**
 * Forecast Snapshot — Integration Tests
 *
 * Tests snapshot creation, listing, retrieval, deletion,
 * and forecast-vs-actual report generation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/neo4j.js', () => ({ runCypher: vi.fn() }));
vi.mock('../../src/lib/pg.js', () => ({ query: vi.fn() }));
vi.mock('../../src/lib/kafka.js', () => ({ sendEvent: vi.fn() }));
vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn() },
}));

import { runCypher } from '../../src/lib/neo4j.js';
import { query } from '../../src/lib/pg.js';
import {
  createForecastSnapshot,
  listForecastSnapshots,
  getForecastSnapshot,
  deleteForecastSnapshot,
  getForecastVsActualReport,
} from '../../src/services/gl/forecast-snapshot-service.js';

const mockRunCypher = vi.mocked(runCypher);
const mockQuery = vi.mocked(query);

const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const BUDGET_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const SNAPSHOT_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const PERIOD_1 = '22222222-2222-2222-2222-222222222201';
const PERIOD_2 = '22222222-2222-2222-2222-222222222202';
const PERIOD_3 = '22222222-2222-2222-2222-222222222203';
const NODE_ID = '33333333-3333-3333-3333-333333333333';

const qr = (rows: any[]) => ({ rows, rowCount: rows.length, command: 'SELECT' as any, oid: 0, fields: [] });

// Budget mock used by createForecastSnapshot (via getBudget)
const SAMPLE_BUDGET = {
  id: BUDGET_ID,
  entity_id: ENTITY_ID,
  name: 'FY2026 Budget',
  fiscal_year: 2026,
  currency: 'CAD',
  status: 'APPROVED',
  created_by: 'admin',
  description: null,
  total_amount: 120000,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

const SAMPLE_BUDGET_LINE = {
  id: '44444444-4444-4444-4444-444444444444',
  budget_id: BUDGET_ID,
  period_id: PERIOD_1,
  node_ref_id: NODE_ID,
  node_ref_type: 'ACTIVITY',
  economic_category: 'EXPENSE',
  amount: '10000',
  label: 'Salaries',
};

const SAMPLE_BUDGET_LINE_REMAINING = {
  ...SAMPLE_BUDGET_LINE,
  id: '44444444-4444-4444-4444-444444444445',
  period_id: PERIOD_2,
};

beforeEach(() => {
  vi.resetAllMocks();
});

// ============================================================
// Create Snapshot
// ============================================================

describe('createForecastSnapshot', () => {
  it('creates a snapshot with forecast lines from rolling forecast', async () => {
    // getBudget called twice: once in createForecastSnapshot, once in generateRollingForecast
    mockRunCypher
      .mockResolvedValueOnce([{ b: SAMPLE_BUDGET }])
      .mockResolvedValueOnce([{ b: SAMPLE_BUDGET }]);

    mockQuery
      // generateRollingForecast: getBudgetLines
      .mockResolvedValueOnce(qr([SAMPLE_BUDGET_LINE, SAMPLE_BUDGET_LINE_REMAINING]))
      // generateRollingForecast: gl_period_balances actuals for completed periods
      .mockResolvedValueOnce(qr([{ period_id: PERIOD_1, node_ref_id: NODE_ID, economic_category: 'EXPENSE', net_amount: '11000' }]))
      // createForecastSnapshot: getBudgetLines (all)
      .mockResolvedValueOnce(qr([SAMPLE_BUDGET_LINE, SAMPLE_BUDGET_LINE_REMAINING]))
      // INSERT snapshot header
      .mockResolvedValueOnce(qr([]))
      // INSERT forecast line (remaining period from rolling forecast)
      .mockResolvedValueOnce(qr([]))
      // gl_period_balances for completed period actual
      .mockResolvedValueOnce(qr([{ net: '11000' }]))
      // INSERT forecast line (completed period)
      .mockResolvedValueOnce(qr([]));

    const id = await createForecastSnapshot({
      budgetId: BUDGET_ID,
      name: 'Q1 Rolling',
      createdBy: 'admin',
      completedPeriodIds: [PERIOD_1],
      remainingPeriodIds: [PERIOD_2],
    });

    expect(id).toBeDefined();
    expect(typeof id).toBe('string');

    // Verify INSERT INTO forecast_snapshots was called
    const insertCall = mockQuery.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('INSERT INTO forecast_snapshots'),
    );
    expect(insertCall).toBeDefined();
  });

  it('throws if budget not found', async () => {
    mockRunCypher.mockResolvedValueOnce([]);
    await expect(
      createForecastSnapshot({
        budgetId: BUDGET_ID,
        name: 'Test',
        createdBy: 'admin',
        completedPeriodIds: [],
        remainingPeriodIds: [PERIOD_2],
      }),
    ).rejects.toThrow(/not found/);
  });

  it('sets default snapshotType to ROLLING', async () => {
    // getBudget called twice
    mockRunCypher
      .mockResolvedValueOnce([{ b: SAMPLE_BUDGET }])
      .mockResolvedValueOnce([{ b: SAMPLE_BUDGET }]);
    mockQuery
      .mockResolvedValueOnce(qr([]))  // getBudgetLines (rolling forecast)
      .mockResolvedValueOnce(qr([]))  // getBudgetLines (all)
      .mockResolvedValueOnce(qr([])); // INSERT snapshot

    const id = await createForecastSnapshot({
      budgetId: BUDGET_ID,
      name: 'Manual snapshot',
      createdBy: 'admin',
      completedPeriodIds: [],
      remainingPeriodIds: [],
    });

    expect(id).toBeDefined();
    const insertCall = mockQuery.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('INSERT INTO forecast_snapshots'),
    );
    // snapshotType param should be 'ROLLING'
    expect(insertCall?.[1]?.[6]).toBe('ROLLING');
  });

  it('uses explicit snapshotType when provided', async () => {
    // getBudget called twice
    mockRunCypher
      .mockResolvedValueOnce([{ b: SAMPLE_BUDGET }])
      .mockResolvedValueOnce([{ b: SAMPLE_BUDGET }]);
    mockQuery
      .mockResolvedValueOnce(qr([]))  // getBudgetLines (rolling forecast)
      .mockResolvedValueOnce(qr([]))  // getBudgetLines (all)
      .mockResolvedValueOnce(qr([])); // INSERT snapshot

    await createForecastSnapshot({
      budgetId: BUDGET_ID,
      name: 'Period close snap',
      createdBy: 'admin',
      completedPeriodIds: [],
      remainingPeriodIds: [],
      snapshotType: 'PERIOD_CLOSE',
    });

    const insertCall = mockQuery.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('INSERT INTO forecast_snapshots'),
    );
    expect(insertCall?.[1]?.[6]).toBe('PERIOD_CLOSE');
  });
});

// ============================================================
// List Snapshots
// ============================================================

describe('listForecastSnapshots', () => {
  it('lists snapshots for an entity', async () => {
    mockQuery.mockResolvedValueOnce(qr([
      { id: SNAPSHOT_ID, budget_id: BUDGET_ID, entity_id: ENTITY_ID, name: 'Q1', fiscal_year: 2026, currency: 'CAD', snapshot_type: 'ROLLING', created_by: 'admin', created_at: '2026-04-01', notes: null, line_count: 5 },
    ]));

    const result = await listForecastSnapshots(ENTITY_ID);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Q1');
    expect(result[0].line_count).toBe(5);
  });

  it('filters by budgetId', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));

    await listForecastSnapshots(ENTITY_ID, BUDGET_ID);
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('budget_id');
  });

  it('filters by fiscalYear', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));

    await listForecastSnapshots(ENTITY_ID, undefined, 2026);
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('fiscal_year');
  });

  it('returns empty array when no snapshots exist', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));
    const result = await listForecastSnapshots(ENTITY_ID);
    expect(result).toEqual([]);
  });
});

// ============================================================
// Get Snapshot
// ============================================================

describe('getForecastSnapshot', () => {
  it('returns snapshot with lines', async () => {
    mockQuery
      .mockResolvedValueOnce(qr([
        { id: SNAPSHOT_ID, budget_id: BUDGET_ID, entity_id: ENTITY_ID, name: 'Q1', fiscal_year: 2026, currency: 'CAD', snapshot_type: 'ROLLING', created_by: 'admin', created_at: '2026-04-01', notes: null },
      ]))
      .mockResolvedValueOnce(qr([
        { id: 'line-1', snapshot_id: SNAPSHOT_ID, period_id: PERIOD_2, node_ref_id: NODE_ID, node_ref_type: 'ACTIVITY', economic_category: 'EXPENSE', forecast_amount: 10500, budget_amount: 10000, adjustment_reason: null },
      ]));

    const result = await getForecastSnapshot(SNAPSHOT_ID);
    expect(result).not.toBeNull();
    expect(result!.snapshot.name).toBe('Q1');
    expect(result!.lines).toHaveLength(1);
    expect(result!.lines[0].forecast_amount).toBe(10500);
  });

  it('returns null for non-existent snapshot', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));
    const result = await getForecastSnapshot('nonexistent');
    expect(result).toBeNull();
  });
});

// ============================================================
// Delete Snapshot
// ============================================================

describe('deleteForecastSnapshot', () => {
  it('deletes an existing snapshot', async () => {
    mockQuery.mockResolvedValueOnce(qr([{ id: SNAPSHOT_ID }]));
    await expect(deleteForecastSnapshot(SNAPSHOT_ID)).resolves.toBeUndefined();
  });

  it('throws if snapshot not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'DELETE' as any, oid: 0, fields: [] });
    await expect(deleteForecastSnapshot('nonexistent')).rejects.toThrow(/not found/);
  });
});

// ============================================================
// Forecast vs Actual Report
// ============================================================

describe('getForecastVsActualReport', () => {
  const snapshotRow = {
    id: SNAPSHOT_ID, budget_id: BUDGET_ID, entity_id: ENTITY_ID,
    name: 'Q1 Forecast', fiscal_year: 2026, currency: 'CAD',
    snapshot_type: 'ROLLING', created_by: 'admin', created_at: '2026-04-01T00:00:00Z', notes: null,
  };

  const snapshotLines = [
    { id: 'l1', snapshot_id: SNAPSHOT_ID, period_id: PERIOD_2, node_ref_id: NODE_ID, node_ref_type: 'ACTIVITY', economic_category: 'EXPENSE', forecast_amount: 10000, budget_amount: 10000, adjustment_reason: null },
    { id: 'l2', snapshot_id: SNAPSHOT_ID, period_id: PERIOD_2, node_ref_id: NODE_ID, node_ref_type: 'ACTIVITY', economic_category: 'REVENUE', forecast_amount: 25000, budget_amount: 25000, adjustment_reason: null },
  ];

  it('generates forecast vs actual report', async () => {
    // getForecastSnapshot calls
    mockQuery
      .mockResolvedValueOnce(qr([snapshotRow]))
      .mockResolvedValueOnce(qr(snapshotLines))
      // gl_period_balances actuals
      .mockResolvedValueOnce(qr([
        { period_id: PERIOD_2, node_ref_id: NODE_ID, economic_category: 'EXPENSE', net: '9500' },
        { period_id: PERIOD_2, node_ref_id: NODE_ID, economic_category: 'REVENUE', net: '26000' },
      ]));

    const report = await getForecastVsActualReport(SNAPSHOT_ID);
    expect(report.snapshotId).toBe(SNAPSHOT_ID);
    expect(report.snapshotName).toBe('Q1 Forecast');
    expect(report.items).toHaveLength(2);

    // Expense: actual 9500 vs forecast 10000 → -500 variance (FAVORABLE for expense)
    const expense = report.items.find(i => i.economicCategory === 'EXPENSE')!;
    expect(expense.forecastVariance).toBe(-500);
    expect(expense.varianceType).toBe('FAVORABLE');

    // Revenue: actual 26000 vs forecast 25000 → +1000 variance (FAVORABLE for revenue)
    const revenue = report.items.find(i => i.economicCategory === 'REVENUE')!;
    expect(revenue.forecastVariance).toBe(1000);
    expect(revenue.varianceType).toBe('FAVORABLE');

    expect(report.totalForecast).toBe(35000);
    expect(report.totalActual).toBe(35500);
  });

  it('marks ON_TARGET when variance is near zero', async () => {
    mockQuery
      .mockResolvedValueOnce(qr([snapshotRow]))
      .mockResolvedValueOnce(qr([snapshotLines[0]]))
      .mockResolvedValueOnce(qr([
        { period_id: PERIOD_2, node_ref_id: NODE_ID, economic_category: 'EXPENSE', net: '10000' },
      ]));

    const report = await getForecastVsActualReport(SNAPSHOT_ID);
    expect(report.items[0].varianceType).toBe('ON_TARGET');
  });

  it('marks UNFAVORABLE when expense exceeds forecast', async () => {
    mockQuery
      .mockResolvedValueOnce(qr([snapshotRow]))
      .mockResolvedValueOnce(qr([snapshotLines[0]]))
      .mockResolvedValueOnce(qr([
        { period_id: PERIOD_2, node_ref_id: NODE_ID, economic_category: 'EXPENSE', net: '12000' },
      ]));

    const report = await getForecastVsActualReport(SNAPSHOT_ID);
    expect(report.items[0].varianceType).toBe('UNFAVORABLE');
    expect(report.items[0].forecastVariance).toBe(2000);
  });

  it('marks UNFAVORABLE when revenue is below forecast', async () => {
    mockQuery
      .mockResolvedValueOnce(qr([snapshotRow]))
      .mockResolvedValueOnce(qr([snapshotLines[1]]))
      .mockResolvedValueOnce(qr([
        { period_id: PERIOD_2, node_ref_id: NODE_ID, economic_category: 'REVENUE', net: '20000' },
      ]));

    const report = await getForecastVsActualReport(SNAPSHOT_ID);
    expect(report.items[0].varianceType).toBe('UNFAVORABLE');
  });

  it('filters by periodIds when provided', async () => {
    mockQuery
      .mockResolvedValueOnce(qr([snapshotRow]))
      .mockResolvedValueOnce(qr([
        ...snapshotLines,
        { id: 'l3', snapshot_id: SNAPSHOT_ID, period_id: PERIOD_3, node_ref_id: NODE_ID, node_ref_type: 'ACTIVITY', economic_category: 'EXPENSE', forecast_amount: 11000, budget_amount: 10000, adjustment_reason: null },
      ]))
      .mockResolvedValueOnce(qr([]));

    const report = await getForecastVsActualReport(SNAPSHOT_ID, [PERIOD_2]);
    // Should only include lines for PERIOD_2 (2 items), not PERIOD_3
    expect(report.items).toHaveLength(2);
    expect(report.items.every(i => i.periodId === PERIOD_2)).toBe(true);
  });

  it('throws if snapshot not found', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));
    await expect(getForecastVsActualReport('nonexistent')).rejects.toThrow(/not found/);
  });

  it('computes variance percent correctly', async () => {
    mockQuery
      .mockResolvedValueOnce(qr([snapshotRow]))
      .mockResolvedValueOnce(qr([snapshotLines[0]])) // forecast_amount = 10000
      .mockResolvedValueOnce(qr([
        { period_id: PERIOD_2, node_ref_id: NODE_ID, economic_category: 'EXPENSE', net: '11500' },
      ]));

    const report = await getForecastVsActualReport(SNAPSHOT_ID);
    // (11500 - 10000) / 10000 = 15%
    expect(report.items[0].forecastVariancePercent).toBe(15);
  });

  it('handles zero actual as missing data', async () => {
    mockQuery
      .mockResolvedValueOnce(qr([snapshotRow]))
      .mockResolvedValueOnce(qr([snapshotLines[0]]))
      .mockResolvedValueOnce(qr([])); // no actuals in gl_period_balances

    const report = await getForecastVsActualReport(SNAPSHOT_ID);
    expect(report.items[0].actualAmount).toBe(0);
    expect(report.items[0].forecastVariance).toBe(-10000);
  });
});
