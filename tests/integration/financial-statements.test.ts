/**
 * Financial Statements Service — Integration Tests
 *
 * Tests generation of Income Statement, Balance Sheet,
 * Cash Flow Statement, and Statement of Changes in Equity.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/pg.js', () => ({ query: vi.fn() }));
vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn() },
}));

import { query } from '../../src/lib/pg.js';
import {
  generateIncomeStatement,
  generateBalanceSheet,
  generateCashFlowStatement,
  generateEquityChanges,
} from '../../src/services/gl/financial-statements-service.js';

const mockQuery = vi.mocked(query);

const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const PERIOD_ID = '22222222-2222-2222-2222-222222222222';
const PRIOR_PERIOD_ID = '33333333-3333-3333-3333-333333333333';

const qr = (rows: any[]) => ({ rows, rowCount: rows.length, command: 'SELECT' as any, oid: 0, fields: [] });

beforeEach(() => {
  vi.resetAllMocks();
});

// ============================================================
// Income Statement
// ============================================================

describe('Income Statement', () => {
  it('generates income statement with revenue and expenses', async () => {
    mockQuery.mockResolvedValueOnce(qr([
      { economic_category: 'REVENUE', net: '100000' },
      { economic_category: 'EXPENSE', net: '-75000' },
    ]));

    const stmt = await generateIncomeStatement(ENTITY_ID, PERIOD_ID);
    expect(stmt.type).toBe('INCOME_STATEMENT');
    expect(stmt.entityId).toBe(ENTITY_ID);
    expect(stmt.periodId).toBe(PERIOD_ID);
    expect(stmt.currency).toBe('CAD');
    expect(stmt.sections).toHaveLength(3);
    expect(stmt.sections[0].title).toBe('Revenue');
    expect(stmt.sections[0].subtotal).toBe(100000);
    expect(stmt.sections[1].title).toBe('Expenses');
    expect(stmt.sections[1].subtotal).toBe(75000);
    expect(stmt.sections[2].title).toBe('Operating Income');
    expect(stmt.sections[2].subtotal).toBe(25000);
    expect(stmt.totals.netIncome).toBe(25000);
  });

  it('generates comparative income statement with prior period', async () => {
    // Current period
    mockQuery.mockResolvedValueOnce(qr([
      { economic_category: 'REVENUE', net: '120000' },
      { economic_category: 'EXPENSE', net: '-80000' },
    ]));
    // Prior period
    mockQuery.mockResolvedValueOnce(qr([
      { economic_category: 'REVENUE', net: '100000' },
      { economic_category: 'EXPENSE', net: '-70000' },
    ]));

    const stmt = await generateIncomeStatement(ENTITY_ID, PERIOD_ID, PRIOR_PERIOD_ID);
    expect(stmt.priorPeriodId).toBe(PRIOR_PERIOD_ID);
    expect(stmt.sections[0].items[0].currentPeriod).toBe(120000);
    expect(stmt.sections[0].items[0].priorPeriod).toBe(100000);
    expect(stmt.sections[0].items[0].variance).toBe(20000);
    expect(stmt.sections[0].items[0].variancePercent).toBe(20);
  });

  it('generates income notes with operating margin', async () => {
    mockQuery.mockResolvedValueOnce(qr([
      { economic_category: 'REVENUE', net: '200000' },
      { economic_category: 'EXPENSE', net: '-150000' },
    ]));

    const stmt = await generateIncomeStatement(ENTITY_ID, PERIOD_ID);
    expect(stmt.notes.length).toBeGreaterThan(0);
    const marginNote = stmt.notes.find(n => n.title === 'Operating Margin');
    expect(marginNote).toBeDefined();
    expect(marginNote!.content).toContain('25');
  });

  it('includes revenue growth note with prior period', async () => {
    mockQuery.mockResolvedValueOnce(qr([
      { economic_category: 'REVENUE', net: '120000' },
      { economic_category: 'EXPENSE', net: '-80000' },
    ]));
    mockQuery.mockResolvedValueOnce(qr([
      { economic_category: 'REVENUE', net: '100000' },
      { economic_category: 'EXPENSE', net: '-70000' },
    ]));

    const stmt = await generateIncomeStatement(ENTITY_ID, PERIOD_ID, PRIOR_PERIOD_ID);
    const revenueNote = stmt.notes.find(n => n.title === 'Revenue');
    expect(revenueNote).toBeDefined();
    expect(revenueNote!.content).toContain('increased');
    expect(revenueNote!.content).toContain('20');
  });

  it('uses specified currency', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));

    const stmt = await generateIncomeStatement(ENTITY_ID, PERIOD_ID, undefined, 'USD');
    expect(stmt.currency).toBe('USD');
  });
});

// ============================================================
// Balance Sheet
// ============================================================

describe('Balance Sheet', () => {
  it('generates balance sheet with assets, liabilities, equity', async () => {
    mockQuery.mockResolvedValueOnce(qr([
      { economic_category: 'ASSET', net: '500000' },
      { economic_category: 'LIABILITY', net: '-200000' },
      { economic_category: 'EQUITY', net: '-300000' },
    ]));

    const stmt = await generateBalanceSheet(ENTITY_ID, PERIOD_ID);
    expect(stmt.type).toBe('BALANCE_SHEET');
    expect(stmt.sections).toHaveLength(3);
    expect(stmt.sections[0].title).toBe('Assets');
    expect(stmt.sections[0].subtotal).toBe(500000);
    expect(stmt.sections[1].title).toBe('Liabilities');
    expect(stmt.sections[1].subtotal).toBe(200000);
    expect(stmt.sections[2].title).toBe('Equity');
    expect(stmt.sections[2].subtotal).toBe(300000);
    expect(stmt.totals.totalAssets).toBe(500000);
    expect(stmt.totals.liabilitiesAndEquity).toBe(500000);
  });

  it('generates comparative balance sheet', async () => {
    mockQuery.mockResolvedValueOnce(qr([
      { economic_category: 'ASSET', net: '600000' },
      { economic_category: 'LIABILITY', net: '-250000' },
      { economic_category: 'EQUITY', net: '-350000' },
    ]));
    mockQuery.mockResolvedValueOnce(qr([
      { economic_category: 'ASSET', net: '500000' },
      { economic_category: 'LIABILITY', net: '-200000' },
      { economic_category: 'EQUITY', net: '-300000' },
    ]));

    const stmt = await generateBalanceSheet(ENTITY_ID, PERIOD_ID, PRIOR_PERIOD_ID);
    expect(stmt.sections[0].items[0].variance).toBe(100000);
    expect(stmt.sections[0].items[0].variancePercent).toBe(20);
  });

  it('generates debt ratio note', async () => {
    mockQuery.mockResolvedValueOnce(qr([
      { economic_category: 'ASSET', net: '1000000' },
      { economic_category: 'LIABILITY', net: '-400000' },
      { economic_category: 'EQUITY', net: '-600000' },
    ]));

    const stmt = await generateBalanceSheet(ENTITY_ID, PERIOD_ID);
    const debtNote = stmt.notes.find(n => n.title === 'Debt Ratio');
    expect(debtNote).toBeDefined();
    expect(debtNote!.content).toContain('40');
  });
});

// ============================================================
// Cash Flow Statement
// ============================================================

describe('Cash Flow Statement', () => {
  it('generates cash flow with operating, investing, financing', async () => {
    mockQuery.mockResolvedValueOnce(qr([
      { economic_category: 'REVENUE', entry_type: 'OPERATIONAL', net: '100000' },
      { economic_category: 'EXPENSE', entry_type: 'OPERATIONAL', net: '-60000' },
      { economic_category: 'ASSET', entry_type: 'ADJUSTMENT', net: '-30000' },
      { economic_category: 'EQUITY', entry_type: 'OPERATIONAL', net: '-5000' },
    ]));

    const stmt = await generateCashFlowStatement(ENTITY_ID, PERIOD_ID);
    expect(stmt.type).toBe('CASH_FLOW');
    expect(stmt.sections).toHaveLength(3);
    expect(stmt.sections[0].title).toBe('Operating Activities');
    expect(stmt.sections[0].subtotal).toBe(40000); // 100000 - 60000
    expect(stmt.sections[1].title).toBe('Investing Activities');
    expect(stmt.sections[1].subtotal).toBe(-30000);
    expect(stmt.sections[2].title).toBe('Financing Activities');
    expect(stmt.sections[2].subtotal).toBe(-5000);
    expect(stmt.totals.netChange).toBe(5000);
  });

  it('generates comparative cash flow', async () => {
    mockQuery.mockResolvedValueOnce(qr([
      { economic_category: 'REVENUE', entry_type: 'OPERATIONAL', net: '100000' },
    ]));
    mockQuery.mockResolvedValueOnce(qr([
      { economic_category: 'REVENUE', entry_type: 'OPERATIONAL', net: '80000' },
    ]));

    const stmt = await generateCashFlowStatement(ENTITY_ID, PERIOD_ID, PRIOR_PERIOD_ID);
    expect(stmt.sections[0].items[0].currentPeriod).toBe(100000);
    expect(stmt.sections[0].items[0].priorPeriod).toBe(80000);
  });

  it('handles empty cash flow', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));

    const stmt = await generateCashFlowStatement(ENTITY_ID, PERIOD_ID);
    expect(stmt.totals.netChange).toBe(0);
  });
});

// ============================================================
// Statement of Changes in Equity
// ============================================================

describe('Statement of Changes in Equity', () => {
  it('generates equity changes by entry type', async () => {
    mockQuery.mockResolvedValueOnce(qr([
      { entry_type: 'OPERATIONAL', net: '50000' },
      { entry_type: 'ADJUSTMENT', net: '-10000' },
    ]));

    const stmt = await generateEquityChanges(ENTITY_ID, PERIOD_ID);
    expect(stmt.type).toBe('EQUITY_CHANGES');
    expect(stmt.sections).toHaveLength(1);
    expect(stmt.sections[0].title).toBe('Changes in Equity');
    expect(stmt.sections[0].items).toHaveLength(2);
    expect(stmt.totals.totalEquityChange).toBe(40000);
  });

  it('shows "No equity changes" when empty', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));

    const stmt = await generateEquityChanges(ENTITY_ID, PERIOD_ID);
    expect(stmt.sections[0].items[0].label).toBe('No equity changes');
    expect(stmt.totals.totalEquityChange).toBe(0);
  });

  it('generates comparative equity changes', async () => {
    mockQuery.mockResolvedValueOnce(qr([
      { entry_type: 'OPERATIONAL', net: '60000' },
    ]));
    mockQuery.mockResolvedValueOnce(qr([
      { entry_type: 'OPERATIONAL', net: '40000' },
    ]));

    const stmt = await generateEquityChanges(ENTITY_ID, PERIOD_ID, PRIOR_PERIOD_ID);
    expect(stmt.sections[0].subtotal).toBe(60000);
    expect(stmt.sections[0].priorSubtotal).toBe(40000);
  });
});

// ============================================================
// Common behavior
// ============================================================

describe('Common statement behavior', () => {
  it('defaults currency to CAD', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));
    const stmt = await generateIncomeStatement(ENTITY_ID, PERIOD_ID);
    expect(stmt.currency).toBe('CAD');
  });

  it('rounds amounts to 2 decimal places', async () => {
    mockQuery.mockResolvedValueOnce(qr([
      { economic_category: 'REVENUE', net: '100000.555' },
      { economic_category: 'EXPENSE', net: '-75000.444' },
    ]));

    const stmt = await generateIncomeStatement(ENTITY_ID, PERIOD_ID);
    expect(stmt.sections[0].items[0].currentPeriod).toBe(100000.56);
    expect(stmt.totals.totalRevenue).toBe(100000.56);
  });

  it('includes generatedAt timestamp', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));
    const before = new Date().toISOString();
    const stmt = await generateBalanceSheet(ENTITY_ID, PERIOD_ID);
    expect(stmt.generatedAt).toBeDefined();
    expect(new Date(stmt.generatedAt).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime() - 1000);
  });
});
