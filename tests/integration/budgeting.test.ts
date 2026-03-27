/**
 * Budgeting & Variance Analysis — Integration Tests
 *
 * Tests budget CRUD, budget lines, approval workflow,
 * variance analysis, and rolling forecast.
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
  createBudget,
  getBudget,
  listBudgets,
  approveBudget,
  lockBudget,
  addBudgetLine,
  getBudgetLines,
  updateBudgetLine,
  deleteBudgetLine,
  getVarianceReport,
  generateRollingForecast,
} from '../../src/services/gl/budgeting-service.js';

const mockRunCypher = vi.mocked(runCypher);
const mockQuery = vi.mocked(query);

const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const BUDGET_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PERIOD_ID = '22222222-2222-2222-2222-222222222222';
const NODE_ID = '33333333-3333-3333-3333-333333333333';
const LINE_ID = '44444444-4444-4444-4444-444444444444';

const SAMPLE_BUDGET = {
  id: BUDGET_ID,
  entity_id: ENTITY_ID,
  name: 'FY2026 Operating Budget',
  fiscal_year: 2026,
  currency: 'CAD',
  status: 'DRAFT' as const,
  created_by: 'user-1',
  description: 'Annual operating budget',
  total_amount: 0,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

const qr = (rows: any[]) => ({ rows, rowCount: rows.length, command: 'SELECT' as any, oid: 0, fields: [] });

beforeEach(() => {
  vi.resetAllMocks();
});

// ============================================================
// Budget CRUD
// ============================================================

describe('Budget CRUD', () => {
  it('createBudget — creates budget node', async () => {
    mockRunCypher.mockResolvedValueOnce([]);
    const id = await createBudget({
      entityId: ENTITY_ID,
      name: 'FY2026 Operating Budget',
      fiscalYear: 2026,
      currency: 'CAD',
      createdBy: 'user-1',
    });
    expect(id).toBeDefined();
    const cypher = mockRunCypher.mock.calls[0][0];
    expect(cypher).toContain('CREATE (b:Budget');
  });

  it('getBudget — returns budget by id', async () => {
    mockRunCypher.mockResolvedValueOnce([{ b: SAMPLE_BUDGET }]);
    const result = await getBudget(BUDGET_ID);
    expect(result).toEqual(SAMPLE_BUDGET);
  });

  it('listBudgets — filters by entity, year, status', async () => {
    mockRunCypher.mockResolvedValueOnce([{ b: SAMPLE_BUDGET }]);
    const result = await listBudgets(ENTITY_ID, 2026, 'DRAFT');
    expect(result).toHaveLength(1);
    const cypher = mockRunCypher.mock.calls[0][0];
    expect(cypher).toContain('b.fiscal_year = $fiscalYear');
    expect(cypher).toContain('b.status = $status');
  });
});

// ============================================================
// Budget Approval
// ============================================================

describe('Budget Approval Workflow', () => {
  it('approveBudget — DRAFT → APPROVED', async () => {
    mockRunCypher.mockResolvedValueOnce([{ b: SAMPLE_BUDGET }]);
    mockRunCypher.mockResolvedValueOnce([{ b: { ...SAMPLE_BUDGET, status: 'APPROVED', approved_by: 'mgr-1' } }]);
    const result = await approveBudget(BUDGET_ID, 'mgr-1');
    expect(result.status).toBe('APPROVED');
  });

  it('approveBudget — rejects non-DRAFT', async () => {
    mockRunCypher.mockResolvedValueOnce([{ b: { ...SAMPLE_BUDGET, status: 'LOCKED' } }]);
    await expect(approveBudget(BUDGET_ID, 'mgr-1')).rejects.toThrow('must be DRAFT');
  });

  it('lockBudget — APPROVED → LOCKED', async () => {
    mockRunCypher.mockResolvedValueOnce([{ b: { ...SAMPLE_BUDGET, status: 'APPROVED' } }]);
    mockRunCypher.mockResolvedValueOnce([{ b: { ...SAMPLE_BUDGET, status: 'LOCKED' } }]);
    const result = await lockBudget(BUDGET_ID);
    expect(result.status).toBe('LOCKED');
  });

  it('lockBudget — rejects non-APPROVED', async () => {
    mockRunCypher.mockResolvedValueOnce([{ b: SAMPLE_BUDGET }]); // DRAFT
    await expect(lockBudget(BUDGET_ID)).rejects.toThrow('must be APPROVED');
  });
});

// ============================================================
// Budget Lines
// ============================================================

describe('Budget Lines', () => {
  it('addBudgetLine — inserts PG row and updates total', async () => {
    // getBudget
    mockRunCypher.mockResolvedValueOnce([{ b: SAMPLE_BUDGET }]);
    // INSERT line
    mockQuery.mockResolvedValueOnce(qr([]));
    // Update budget total
    mockRunCypher.mockResolvedValueOnce([]);

    const id = await addBudgetLine({
      budgetId: BUDGET_ID,
      periodId: PERIOD_ID,
      nodeRefId: NODE_ID,
      nodeRefType: 'ACTIVITY',
      economicCategory: 'EXPENSE',
      amount: 5000,
    });
    expect(id).toBeDefined();
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('INSERT INTO budget_lines');
  });

  it('addBudgetLine — rejects LOCKED budget', async () => {
    mockRunCypher.mockResolvedValueOnce([{ b: { ...SAMPLE_BUDGET, status: 'LOCKED' } }]);
    await expect(
      addBudgetLine({
        budgetId: BUDGET_ID,
        periodId: PERIOD_ID,
        nodeRefId: NODE_ID,
        nodeRefType: 'ACTIVITY',
        economicCategory: 'EXPENSE',
        amount: 5000,
      }),
    ).rejects.toThrow('LOCKED');
  });

  it('getBudgetLines — returns lines from PG', async () => {
    const sampleLine = { id: LINE_ID, budget_id: BUDGET_ID, period_id: PERIOD_ID, node_ref_id: NODE_ID, node_ref_type: 'ACTIVITY', economic_category: 'EXPENSE', amount: 5000 };
    mockQuery.mockResolvedValueOnce(qr([sampleLine]));
    const lines = await getBudgetLines(BUDGET_ID);
    expect(lines).toHaveLength(1);
    expect(lines[0].amount).toBe(5000);
  });

  it('updateBudgetLine — updates amount and adjusts total', async () => {
    // Get old line
    mockQuery.mockResolvedValueOnce(qr([{ budget_id: BUDGET_ID, amount: 5000 }]));
    // getBudget
    mockRunCypher.mockResolvedValueOnce([{ b: SAMPLE_BUDGET }]);
    // UPDATE line
    mockQuery.mockResolvedValueOnce(qr([]));
    // Adjust total (diff = 7000 - 5000 = 2000)
    mockRunCypher.mockResolvedValueOnce([]);

    await updateBudgetLine(LINE_ID, 7000, 'Revised estimate');
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('deleteBudgetLine — removes line and adjusts total', async () => {
    mockQuery.mockResolvedValueOnce(qr([{ budget_id: BUDGET_ID, amount: 5000 }]));
    mockRunCypher.mockResolvedValueOnce([{ b: SAMPLE_BUDGET }]);
    mockQuery.mockResolvedValueOnce(qr([]));
    mockRunCypher.mockResolvedValueOnce([]);

    await deleteBudgetLine(LINE_ID);
    const deleteSql = mockQuery.mock.calls[1][0] as string;
    expect(deleteSql).toContain('DELETE FROM budget_lines');
  });
});

// ============================================================
// Variance Report
// ============================================================

describe('Variance Report', () => {
  it('getVarianceReport — calculates variance with favorable/unfavorable', async () => {
    // getBudget
    mockRunCypher.mockResolvedValueOnce([{ b: SAMPLE_BUDGET }]);
    // Get budget lines
    mockQuery.mockResolvedValueOnce(qr([
      { id: '1', budget_id: BUDGET_ID, period_id: PERIOD_ID, node_ref_id: NODE_ID, node_ref_type: 'ACTIVITY', economic_category: 'EXPENSE', amount: 10000 },
      { id: '2', budget_id: BUDGET_ID, period_id: PERIOD_ID, node_ref_id: 'node-2', node_ref_type: 'ACTIVITY', economic_category: 'REVENUE', amount: 50000 },
    ]));
    // Get actuals from TimescaleDB
    mockQuery.mockResolvedValueOnce(qr([
      { period_id: PERIOD_ID, node_ref_id: NODE_ID, economic_category: 'EXPENSE', net_amount: 8000 },
      { period_id: PERIOD_ID, node_ref_id: 'node-2', economic_category: 'REVENUE', net_amount: 55000 },
    ]));

    const report = await getVarianceReport(BUDGET_ID);
    expect(report.budgetName).toBe('FY2026 Operating Budget');
    expect(report.items).toHaveLength(2);

    // Expense: budget 10000, actual 8000, variance 2000 → FAVORABLE (under budget on expense)
    const expenseItem = report.items.find((i) => i.economicCategory === 'EXPENSE')!;
    expect(expenseItem.varianceAmount).toBe(2000);
    expect(expenseItem.varianceType).toBe('FAVORABLE');

    // Revenue: budget 50000, actual 55000, variance -5000 → FAVORABLE (over budget on revenue)
    const revenueItem = report.items.find((i) => i.economicCategory === 'REVENUE')!;
    expect(revenueItem.varianceAmount).toBe(-5000);
    expect(revenueItem.varianceType).toBe('FAVORABLE');

    expect(report.totalBudget).toBe(60000);
    expect(report.totalActual).toBe(63000);
  });

  it('getVarianceReport — ON_TARGET when amounts match', async () => {
    mockRunCypher.mockResolvedValueOnce([{ b: SAMPLE_BUDGET }]);
    mockQuery.mockResolvedValueOnce(qr([
      { id: '1', budget_id: BUDGET_ID, period_id: PERIOD_ID, node_ref_id: NODE_ID, node_ref_type: 'ACTIVITY', economic_category: 'EXPENSE', amount: 5000 },
    ]));
    mockQuery.mockResolvedValueOnce(qr([
      { period_id: PERIOD_ID, node_ref_id: NODE_ID, economic_category: 'EXPENSE', net_amount: 5000 },
    ]));

    const report = await getVarianceReport(BUDGET_ID);
    expect(report.items[0].varianceType).toBe('ON_TARGET');
  });
});

// ============================================================
// Rolling Forecast
// ============================================================

describe('Rolling Forecast', () => {
  const PERIOD_1 = '11111111-0000-0000-0000-000000000001';
  const PERIOD_2 = '11111111-0000-0000-0000-000000000002';
  const PERIOD_3 = '11111111-0000-0000-0000-000000000003';

  it('generateRollingForecast — adjusts remaining periods by run-rate', async () => {
    // getBudget
    mockRunCypher.mockResolvedValueOnce([{ b: SAMPLE_BUDGET }]);
    // Get all budget lines
    mockQuery.mockResolvedValueOnce(qr([
      { id: '1', budget_id: BUDGET_ID, period_id: PERIOD_1, node_ref_id: NODE_ID, node_ref_type: 'ACTIVITY', economic_category: 'EXPENSE', amount: 5000 },
      { id: '2', budget_id: BUDGET_ID, period_id: PERIOD_2, node_ref_id: NODE_ID, node_ref_type: 'ACTIVITY', economic_category: 'EXPENSE', amount: 5000 },
      { id: '3', budget_id: BUDGET_ID, period_id: PERIOD_3, node_ref_id: NODE_ID, node_ref_type: 'ACTIVITY', economic_category: 'EXPENSE', amount: 5000 },
    ]));
    // Get actuals for completed period (PERIOD_1)
    mockQuery.mockResolvedValueOnce(qr([
      { period_id: PERIOD_1, node_ref_id: NODE_ID, economic_category: 'EXPENSE', net_amount: 6000 },
    ]));

    const forecast = await generateRollingForecast(
      BUDGET_ID,
      [PERIOD_1],
      [PERIOD_2, PERIOD_3],
    );

    expect(forecast).toHaveLength(2);
    // Forecast uses run-rate: 6000/1 = 6000 per period
    expect(forecast[0].forecastAmount).toBe(6000);
    expect(forecast[0].adjustmentReason).toContain('Run-rate');
    expect(forecast[1].forecastAmount).toBe(6000);
  });

  it('generateRollingForecast — uses budget when no actuals', async () => {
    mockRunCypher.mockResolvedValueOnce([{ b: SAMPLE_BUDGET }]);
    mockQuery.mockResolvedValueOnce(qr([
      { id: '1', budget_id: BUDGET_ID, period_id: PERIOD_2, node_ref_id: NODE_ID, node_ref_type: 'ACTIVITY', economic_category: 'EXPENSE', amount: 5000 },
    ]));
    // No completed periods → no actuals query
    mockQuery.mockResolvedValueOnce(qr([]));

    const forecast = await generateRollingForecast(BUDGET_ID, [], [PERIOD_2]);
    expect(forecast).toHaveLength(1);
    expect(forecast[0].forecastAmount).toBe(5000);
    expect(forecast[0].adjustmentReason).toContain('original budget');
  });
});
