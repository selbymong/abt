/**
 * Multi-Currency Service — Integration Tests
 *
 * Tests FX rate management, currency conversion,
 * month-end revaluation, and revaluation history.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/neo4j.js', () => ({ runCypher: vi.fn() }));
vi.mock('../../src/lib/pg.js', () => ({ query: vi.fn() }));
vi.mock('../../src/lib/kafka.js', () => ({ sendEvent: vi.fn() }));
vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn() },
}));
vi.mock('../../src/services/gl/journal-posting-service.js', () => ({
  postJournalEntry: vi.fn(),
}));

import { runCypher } from '../../src/lib/neo4j.js';
import { query } from '../../src/lib/pg.js';
import { postJournalEntry } from '../../src/services/gl/journal-posting-service.js';
import {
  setFXRate,
  setFXRatesBatch,
  getFXRate,
  listFXRates,
  convertCurrency,
  performRevaluation,
  getRevaluationHistory,
} from '../../src/services/gl/multi-currency-service.js';

const mockRunCypher = vi.mocked(runCypher);
const mockQuery = vi.mocked(query);
const mockPostJE = vi.mocked(postJournalEntry);

const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const PERIOD_ID = '22222222-2222-2222-2222-222222222222';

const qr = (rows: any[]) => ({ rows, rowCount: rows.length, command: 'SELECT' as any, oid: 0, fields: [] });

beforeEach(() => {
  vi.resetAllMocks();
});

// ============================================================
// FX Rate Management
// ============================================================

describe('FX Rate Management', () => {
  it('setFXRate — upserts rate in PG', async () => {
    mockQuery.mockResolvedValueOnce(qr([{ id: 'rate-1' }]));
    const id = await setFXRate({
      fromCurrency: 'USD',
      toCurrency: 'CAD',
      rate: 1.36,
      rateDate: '2026-03-26',
      source: 'BANK_OF_CANADA',
    });
    expect(id).toBeDefined();
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('INSERT INTO fx_rates');
    expect(sql).toContain('ON CONFLICT');
  });

  it('setFXRatesBatch — imports multiple rates', async () => {
    mockQuery.mockResolvedValue(qr([{ id: 'r1' }]));
    const count = await setFXRatesBatch([
      { fromCurrency: 'USD', toCurrency: 'CAD', rate: 1.36, rateDate: '2026-03-25' },
      { fromCurrency: 'EUR', toCurrency: 'CAD', rate: 1.48, rateDate: '2026-03-25' },
    ]);
    expect(count).toBe(2);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('getFXRate — returns identity rate for same currency', async () => {
    const rate = await getFXRate('CAD', 'CAD', '2026-03-26');
    expect(rate).not.toBeNull();
    expect(rate!.rate).toBe(1);
    expect(rate!.source).toBe('IDENTITY');
  });

  it('getFXRate — returns rate from PG', async () => {
    mockQuery.mockResolvedValueOnce(qr([{
      id: 'rate-1', from_currency: 'USD', to_currency: 'CAD',
      rate: 1.36, rate_date: '2026-03-26', source: 'BOC', created_at: '2026-03-26',
    }]));

    const rate = await getFXRate('USD', 'CAD', '2026-03-26');
    expect(rate).not.toBeNull();
    expect(rate!.rate).toBe(1.36);
  });

  it('getFXRate — calculates inverse rate', async () => {
    // Direct lookup fails
    mockQuery.mockResolvedValueOnce(qr([]));
    // Inverse lookup succeeds
    mockQuery.mockResolvedValueOnce(qr([{
      id: 'rate-1', from_currency: 'CAD', to_currency: 'USD',
      rate: 0.735, rate_date: '2026-03-26', source: 'BOC', created_at: '2026-03-26',
    }]));

    const rate = await getFXRate('USD', 'CAD', '2026-03-26');
    expect(rate).not.toBeNull();
    expect(rate!.rate).toBeCloseTo(1 / 0.735, 4);
    expect(rate!.source).toContain('INVERSE');
  });

  it('getFXRate — returns null when no rate found', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));
    mockQuery.mockResolvedValueOnce(qr([]));
    const rate = await getFXRate('USD', 'JPY', '2026-03-26');
    expect(rate).toBeNull();
  });

  it('listFXRates — filters by currency pair and date range', async () => {
    mockQuery.mockResolvedValueOnce(qr([
      { id: 'r1', from_currency: 'USD', to_currency: 'CAD', rate: 1.36, rate_date: '2026-03-26' },
    ]));
    const rates = await listFXRates('USD', 'CAD', '2026-03-01', '2026-03-31');
    expect(rates).toHaveLength(1);
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('from_currency');
    expect(sql).toContain('to_currency');
  });
});

// ============================================================
// Currency Conversion
// ============================================================

describe('Currency Conversion', () => {
  it('convertCurrency — converts using FX rate', async () => {
    mockQuery.mockResolvedValueOnce(qr([{
      id: 'r1', from_currency: 'USD', to_currency: 'CAD',
      rate: 1.36, rate_date: '2026-03-26', source: 'BOC', created_at: '2026-03-26',
    }]));

    const result = await convertCurrency('USD', 'CAD', 1000, '2026-03-26');
    expect(result.fromAmount).toBe(1000);
    expect(result.toAmount).toBe(1360);
    expect(result.rate).toBe(1.36);
  });

  it('convertCurrency — throws when no rate found', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));
    mockQuery.mockResolvedValueOnce(qr([]));
    await expect(
      convertCurrency('USD', 'XYZ', 1000, '2026-03-26'),
    ).rejects.toThrow('No FX rate found');
  });
});

// ============================================================
// Revaluation
// ============================================================

describe('Month-End Revaluation', () => {
  it('performRevaluation — posts unrealized gain/loss JEs', async () => {
    // Find monetary items
    mockRunCypher.mockResolvedValueOnce([
      {
        node_ref_id: 'inv-1', node_ref_type: 'AR_INVOICE',
        economic_category: 'ASSET', currency: 'USD',
        amount: 10000, original_rate: 1.30,
      },
    ]);

    // getFXRate for USD→CAD closing rate
    mockQuery.mockResolvedValueOnce(qr([{
      id: 'r1', from_currency: 'USD', to_currency: 'CAD',
      rate: 1.36, rate_date: '2026-03-31', source: 'BOC', created_at: '2026-03-31',
    }]));

    // postJournalEntry for revaluation
    mockPostJE.mockResolvedValueOnce('je-reval-1');

    // Record revaluation run
    mockQuery.mockResolvedValueOnce(qr([]));

    const report = await performRevaluation(ENTITY_ID, PERIOD_ID, 'CAD', '2026-03-31');

    expect(report.items).toHaveLength(1);
    const item = report.items[0];
    // Original: 10000 * 1.30 = 13000 CAD
    // Revalued: 10000 * 1.36 = 13600 CAD
    // Gain: 600 (asset increased in functional currency value)
    expect(item.originalAmount).toBe(10000);
    expect(item.closingRate).toBe(1.36);
    expect(item.revaluedAmount).toBe(13600);
    expect(item.unrealizedGainLoss).toBe(600);
    expect(item.journalEntryId).toBe('je-reval-1');
    expect(report.totalGainLoss).toBe(600);

    // Verify JE was posted
    expect(mockPostJE).toHaveBeenCalledTimes(1);
    const jeInput = mockPostJE.mock.calls[0][0] as any;
    expect(jeInput.entryType).toBe('ADJUSTMENT');
    expect(jeInput.reference).toContain('FX-REVAL');
  });

  it('performRevaluation — handles no monetary items', async () => {
    mockRunCypher.mockResolvedValueOnce([]);
    mockQuery.mockResolvedValueOnce(qr([]));

    const report = await performRevaluation(ENTITY_ID, PERIOD_ID, 'CAD', '2026-03-31');
    expect(report.items).toHaveLength(0);
    expect(report.totalGainLoss).toBe(0);
    expect(mockPostJE).not.toHaveBeenCalled();
  });

  it('performRevaluation — skips items with no FX rate', async () => {
    mockRunCypher.mockResolvedValueOnce([
      {
        node_ref_id: 'inv-1', node_ref_type: 'AR_INVOICE',
        economic_category: 'ASSET', currency: 'XYZ',
        amount: 5000, original_rate: 1.0,
      },
    ]);

    // No rate found for XYZ→CAD
    mockQuery.mockResolvedValueOnce(qr([]));
    mockQuery.mockResolvedValueOnce(qr([]));
    // Record run
    mockQuery.mockResolvedValueOnce(qr([]));

    const report = await performRevaluation(ENTITY_ID, PERIOD_ID, 'CAD', '2026-03-31');
    expect(report.items).toHaveLength(0);
  });
});

// ============================================================
// Revaluation History
// ============================================================

describe('Revaluation History', () => {
  it('getRevaluationHistory — returns past runs', async () => {
    mockQuery.mockResolvedValueOnce(qr([
      { id: 'run-1', period_id: PERIOD_ID, functional_currency: 'CAD', as_of_date: '2026-03-31', items_count: 3, total_gain_loss: 1500, created_at: '2026-03-31' },
    ]));

    const history = await getRevaluationHistory(ENTITY_ID);
    expect(history).toHaveLength(1);
    expect(history[0].totalGainLoss).toBe(1500);
    expect(history[0].itemsCount).toBe(3);
  });
});
