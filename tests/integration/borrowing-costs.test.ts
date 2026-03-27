/**
 * Borrowing Costs (IAS 23) — Integration Tests
 *
 * Tests the borrowing costs service: qualifying asset designation,
 * capitalization lifecycle (start/suspend/resume/cease),
 * interest computation, and journal posting.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/neo4j.js', () => ({
  runCypher: vi.fn(),
}));

vi.mock('../../src/lib/pg.js', () => ({
  query: vi.fn(),
}));

vi.mock('../../src/lib/kafka.js', () => ({
  sendEvent: vi.fn(),
}));

vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn() },
}));

vi.mock('../../src/services/gl/journal-posting-service.js', () => ({
  postJournalEntry: vi.fn(),
}));

import { runCypher } from '../../src/lib/neo4j.js';
import { postJournalEntry } from '../../src/services/gl/journal-posting-service.js';
import {
  designateQualifyingAsset,
  suspendCapitalization,
  resumeCapitalization,
  ceaseCapitalization,
  capitalizeBorrowingCosts,
  listQualifyingAssets,
  getQualifyingAsset,
} from '../../src/services/gl/borrowing-costs-service.js';

const mockRunCypher = vi.mocked(runCypher);
const mockPostJE = vi.mocked(postJournalEntry);

const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const PERIOD_ID = '22222222-2222-2222-2222-222222222222';
const ASSET_ID = '33333333-3333-3333-3333-333333333333';

describe('P7-BORROWING-COSTS', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRunCypher.mockResolvedValue([]);
    mockPostJE.mockResolvedValue('mock-je-id');
  });

  // ========== Designate Qualifying Asset ==========

  it('should designate a fixed asset as qualifying', async () => {
    mockRunCypher.mockResolvedValueOnce([{ count: 1 }]);

    await designateQualifyingAsset({
      assetId: ASSET_ID,
      entityId: ENTITY_ID,
      weightedAverageRate: 0.05,
      capitalizationStartDate: '2026-01-15',
    });

    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining('qualifying_asset = true'),
      expect.objectContaining({
        assetId: ASSET_ID,
        rate: 0.05,
        startDate: '2026-01-15',
      }),
    );
  });

  it('should throw if asset not found during designation', async () => {
    mockRunCypher.mockResolvedValueOnce([{ count: 0 }]);

    await expect(
      designateQualifyingAsset({
        assetId: 'nonexistent',
        entityId: ENTITY_ID,
        weightedAverageRate: 0.05,
        capitalizationStartDate: '2026-01-15',
      }),
    ).rejects.toThrow('not found');
  });

  // ========== Capitalization Lifecycle ==========

  it('should suspend active capitalization', async () => {
    mockRunCypher.mockResolvedValueOnce([{ status: 'ACTIVE' }]);
    mockRunCypher.mockResolvedValueOnce([]); // SET query

    await suspendCapitalization(ASSET_ID, ENTITY_ID);

    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining("capitalization_status = 'SUSPENDED'"),
      expect.objectContaining({ assetId: ASSET_ID }),
    );
  });

  it('should reject suspend if not active', async () => {
    mockRunCypher.mockResolvedValueOnce([{ status: 'SUSPENDED' }]);

    await expect(
      suspendCapitalization(ASSET_ID, ENTITY_ID),
    ).rejects.toThrow('Cannot suspend');
  });

  it('should resume suspended capitalization', async () => {
    mockRunCypher.mockResolvedValueOnce([{ status: 'SUSPENDED' }]);
    mockRunCypher.mockResolvedValueOnce([]);

    await resumeCapitalization(ASSET_ID, ENTITY_ID);

    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining("capitalization_status = 'ACTIVE'"),
      expect.objectContaining({ assetId: ASSET_ID }),
    );
  });

  it('should reject resume if not suspended', async () => {
    mockRunCypher.mockResolvedValueOnce([{ status: 'ACTIVE' }]);

    await expect(
      resumeCapitalization(ASSET_ID, ENTITY_ID),
    ).rejects.toThrow('Cannot resume');
  });

  it('should cease capitalization', async () => {
    mockRunCypher.mockResolvedValueOnce([{ status: 'ACTIVE' }]);
    mockRunCypher.mockResolvedValueOnce([]);

    await ceaseCapitalization(ASSET_ID, ENTITY_ID, '2026-06-30');

    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining("capitalization_status = 'CEASED'"),
      expect.objectContaining({ assetId: ASSET_ID, cessationDate: '2026-06-30' }),
    );
  });

  it('should reject cease if already ceased', async () => {
    mockRunCypher.mockResolvedValueOnce([{ status: 'CEASED' }]);

    await expect(
      ceaseCapitalization(ASSET_ID, ENTITY_ID, '2026-06-30'),
    ).rejects.toThrow('already ceased');
  });

  // ========== Interest Capitalization ==========

  it('should capitalize general borrowing costs', async () => {
    // Fetch asset
    mockRunCypher.mockResolvedValueOnce([{
      qualifying_asset: true,
      capitalization_status: 'ACTIVE',
      weighted_average_rate: 0.06, // 6% annual
      borrowing_costs_capitalized: 0,
    }]);

    // Update asset after capitalization
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await capitalizeBorrowingCosts({
      assetId: ASSET_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      expenditureAmount: 1000000, // $1M in expenditures
      daysInPeriod: 90, // one quarter
      currency: 'CAD',
    });

    // Expected: 1,000,000 * 0.06 * (90/365) = ~14,794.52
    expect(result.generalBorrowingCost).toBeCloseTo(14794.52, 0);
    expect(result.specificBorrowingCost).toBe(0);
    expect(result.netCapitalizedAmount).toBeCloseTo(14794.52, 0);
    expect(result.journalEntryId).toBe('mock-je-id');
    expect(result.cumulativeCapitalized).toBeCloseTo(14794.52, 0);

    // Verify postJournalEntry was called with correct amounts
    expect(mockPostJE).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: ENTITY_ID,
        periodId: PERIOD_ID,
        entryType: 'ADJUSTMENT',
      }),
    );
  });

  it('should capitalize specific borrowing costs net of investment income', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      qualifying_asset: true,
      capitalization_status: 'ACTIVE',
      weighted_average_rate: 0.05,
      borrowing_costs_capitalized: 5000,
    }]);
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await capitalizeBorrowingCosts({
      assetId: ASSET_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      expenditureAmount: 500000,
      daysInPeriod: 30,
      specificBorrowingRate: 0.07, // 7% specific loan
      specificBorrowingAmount: 300000,
      investmentIncome: 500, // income from investing idle specific borrowings
      currency: 'CAD',
    });

    // Specific: 300,000 * 0.07 * (30/365) = ~1,726.03
    // General: (500,000 - 300,000) * 0.05 * (30/365) = ~821.92
    // Net: 1726.03 - 500 + 821.92 = ~2047.95
    expect(result.specificBorrowingCost).toBeCloseTo(1726.03, 0);
    expect(result.generalBorrowingCost).toBeCloseTo(821.92, 0);
    expect(result.investmentIncomeDeduction).toBe(500);
    expect(result.netCapitalizedAmount).toBeCloseTo(2047.95, 0);
    expect(result.cumulativeCapitalized).toBeCloseTo(7047.95, 0);
  });

  it('should return zero when net capitalization is zero', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      qualifying_asset: true,
      capitalization_status: 'ACTIVE',
      weighted_average_rate: 0.01,
      borrowing_costs_capitalized: 0,
    }]);

    const result = await capitalizeBorrowingCosts({
      assetId: ASSET_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      expenditureAmount: 100,
      daysInPeriod: 1,
      specificBorrowingRate: 0.01,
      specificBorrowingAmount: 100,
      investmentIncome: 10000, // Investment income exceeds borrowing cost
      currency: 'CAD',
    });

    expect(result.netCapitalizedAmount).toBe(0);
    expect(result.journalEntryId).toBe(''); // No JE posted
    expect(mockPostJE).not.toHaveBeenCalled();
  });

  it('should reject capitalization for non-qualifying asset', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      qualifying_asset: false,
      capitalization_status: 'NOT_STARTED',
      weighted_average_rate: 0,
      borrowing_costs_capitalized: 0,
    }]);

    await expect(
      capitalizeBorrowingCosts({
        assetId: ASSET_ID,
        entityId: ENTITY_ID,
        periodId: PERIOD_ID,
        expenditureAmount: 100000,
        daysInPeriod: 30,
        currency: 'CAD',
      }),
    ).rejects.toThrow('not a qualifying asset');
  });

  it('should reject capitalization when status is SUSPENDED', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      qualifying_asset: true,
      capitalization_status: 'SUSPENDED',
      weighted_average_rate: 0.05,
      borrowing_costs_capitalized: 0,
    }]);

    await expect(
      capitalizeBorrowingCosts({
        assetId: ASSET_ID,
        entityId: ENTITY_ID,
        periodId: PERIOD_ID,
        expenditureAmount: 100000,
        daysInPeriod: 30,
        currency: 'CAD',
      }),
    ).rejects.toThrow('SUSPENDED');
  });

  // ========== Queries ==========

  it('should list qualifying assets', async () => {
    mockRunCypher.mockResolvedValueOnce([
      {
        id: ASSET_ID, label: 'New Factory', entity_id: ENTITY_ID,
        qualifying_asset: true, capitalization_status: 'ACTIVE',
        capitalization_start_date: '2026-01-15', capitalization_end_date: null,
        borrowing_costs_capitalized: 25000, weighted_average_rate: 0.05,
        cost_at_acquisition: 2000000, carrying_amount: 1800000,
      },
    ]);

    const assets = await listQualifyingAssets(ENTITY_ID);

    expect(assets).toHaveLength(1);
    expect(assets[0].label).toBe('New Factory');
    expect(assets[0].borrowing_costs_capitalized).toBe(25000);
    expect(assets[0].capitalization_status).toBe('ACTIVE');
  });

  it('should get a single qualifying asset', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      id: ASSET_ID, label: 'Bridge Project', entity_id: ENTITY_ID,
      qualifying_asset: true, capitalization_status: 'CEASED',
      capitalization_start_date: '2025-06-01', capitalization_end_date: '2026-03-01',
      borrowing_costs_capitalized: 150000, weighted_average_rate: 0.045,
      cost_at_acquisition: 5000000, carrying_amount: 4700000,
    }]);

    const asset = await getQualifyingAsset(ASSET_ID);

    expect(asset).not.toBeNull();
    expect(asset!.capitalization_status).toBe('CEASED');
    expect(asset!.borrowing_costs_capitalized).toBe(150000);
  });

  it('should return null for non-qualifying asset', async () => {
    mockRunCypher.mockResolvedValueOnce([]);

    const asset = await getQualifyingAsset('nonexistent');
    expect(asset).toBeNull();
  });

  // ========== Result Shape ==========

  it('should return correct CapitalizationResult shape', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      qualifying_asset: true,
      capitalization_status: 'ACTIVE',
      weighted_average_rate: 0.05,
      borrowing_costs_capitalized: 0,
    }]);
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await capitalizeBorrowingCosts({
      assetId: ASSET_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      expenditureAmount: 100000,
      daysInPeriod: 30,
      currency: 'CAD',
    });

    expect(result).toHaveProperty('assetId');
    expect(result).toHaveProperty('periodId');
    expect(result).toHaveProperty('generalBorrowingCost');
    expect(result).toHaveProperty('specificBorrowingCost');
    expect(result).toHaveProperty('investmentIncomeDeduction');
    expect(result).toHaveProperty('netCapitalizedAmount');
    expect(result).toHaveProperty('journalEntryId');
    expect(result).toHaveProperty('cumulativeCapitalized');
  });
});
