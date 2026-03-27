/**
 * NFP Net Asset Reclassification — Integration Tests
 *
 * Tests auto-reclassification of fund balances when time/purpose restrictions
 * are met or expire (TEMPORARILY_RESTRICTED → UNRESTRICTED).
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
  scanExpiredRestrictions,
  reclassifyFund,
  autoReclassifyExpired,
  fulfillPurposeRestriction,
  getReclassificationHistory,
  getFundRestrictionSummary,
} from '../../src/services/gl/nfp-reclassification-service.js';

const mockRunCypher = vi.mocked(runCypher);
const mockQuery = vi.mocked(query);
const mockPostJE = vi.mocked(postJournalEntry);

const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const PERIOD_ID = '22222222-2222-2222-2222-222222222222';
const FUND_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const FUND_ID_2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

describe('P7-NFP-RECLASSIFICATION', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRunCypher.mockResolvedValue([]);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);
    mockPostJE.mockResolvedValue('mock-je-id');
  });

  // ========== Scan Expired Restrictions ==========

  it('should find funds with expired time restrictions', async () => {
    mockRunCypher.mockResolvedValueOnce([
      {
        id: FUND_ID,
        label: 'Capital Campaign 2025',
        entity_id: ENTITY_ID,
        fund_type: 'TEMPORARILY_RESTRICTED',
        restriction_expiry: '2026-01-01',
        restriction_purpose: 'Building renovation',
      },
    ]);

    mockQuery.mockResolvedValueOnce({
      rows: [{ fund_id: FUND_ID, net_balance: '50000' }],
      rowCount: 1,
    } as any);

    const result = await scanExpiredRestrictions(ENTITY_ID, '2026-03-26');

    expect(result).toHaveLength(1);
    expect(result[0].fundId).toBe(FUND_ID);
    expect(result[0].netBalance).toBe(50000);
    expect(result[0].fundType).toBe('TEMPORARILY_RESTRICTED');
  });

  it('should return empty when no expired restrictions', async () => {
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await scanExpiredRestrictions(ENTITY_ID, '2026-03-26');
    expect(result).toHaveLength(0);
  });

  // ========== Manual Reclassification ==========

  it('should reclassify fund from TEMPORARILY_RESTRICTED to UNRESTRICTED', async () => {
    // Fund lookup
    mockRunCypher.mockResolvedValueOnce([{
      id: FUND_ID, fund_type: 'TEMPORARILY_RESTRICTED', entity_id: ENTITY_ID,
    }]);

    // Balance check after JE (remaining > 0, so don't change fund_type)
    mockQuery.mockResolvedValueOnce({ rows: [{ remaining: '30000' }], rowCount: 1 } as any);

    // Insert reclassification history
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const result = await reclassifyFund({
      fundId: FUND_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      currency: 'CAD',
      amount: 20000,
      fromClass: 'TEMPORARILY_RESTRICTED',
      toClass: 'UNRESTRICTED',
      reason: 'Time restriction expired',
      reclassificationDate: '2026-03-26',
    });

    expect(result.fromClass).toBe('TEMPORARILY_RESTRICTED');
    expect(result.toClass).toBe('UNRESTRICTED');
    expect(result.amount).toBe(20000);
    expect(result.journalEntryId).toBe('mock-je-id');

    // Verify JE was posted
    expect(mockPostJE).toHaveBeenCalledWith(
      expect.objectContaining({
        entryType: 'ADJUSTMENT',
        entityId: ENTITY_ID,
      }),
    );
  });

  it('should update fund_type when fully reclassified', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      id: FUND_ID, fund_type: 'TEMPORARILY_RESTRICTED', entity_id: ENTITY_ID,
    }]);

    // Balance check shows 0 remaining after reclassification
    mockQuery.mockResolvedValueOnce({ rows: [{ remaining: '50000' }], rowCount: 1 } as any);

    // Update fund_type
    mockRunCypher.mockResolvedValueOnce([]);

    // Insert history
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const result = await reclassifyFund({
      fundId: FUND_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      currency: 'CAD',
      amount: 50000,
      fromClass: 'TEMPORARILY_RESTRICTED',
      toClass: 'UNRESTRICTED',
      reason: 'Full reclassification',
      reclassificationDate: '2026-03-26',
    });

    expect(result.amount).toBe(50000);
    // Fund_type update was called
    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining("fund_type = 'UNRESTRICTED'"),
      expect.objectContaining({ fundId: FUND_ID }),
    );
  });

  it('should reject reclassification if fund not found', async () => {
    mockRunCypher.mockResolvedValueOnce([]);

    await expect(reclassifyFund({
      fundId: 'nonexistent',
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      currency: 'CAD',
      amount: 10000,
      fromClass: 'TEMPORARILY_RESTRICTED',
      toClass: 'UNRESTRICTED',
      reason: 'test',
      reclassificationDate: '2026-03-26',
    })).rejects.toThrow('not found');
  });

  it('should reject reclassification if fund type mismatch', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      id: FUND_ID, fund_type: 'UNRESTRICTED', entity_id: ENTITY_ID,
    }]);

    await expect(reclassifyFund({
      fundId: FUND_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      currency: 'CAD',
      amount: 10000,
      fromClass: 'TEMPORARILY_RESTRICTED',
      toClass: 'UNRESTRICTED',
      reason: 'test',
      reclassificationDate: '2026-03-26',
    })).rejects.toThrow('expected TEMPORARILY_RESTRICTED');
  });

  it('should reject reclassification from UNRESTRICTED', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      id: FUND_ID, fund_type: 'UNRESTRICTED', entity_id: ENTITY_ID,
    }]);

    await expect(reclassifyFund({
      fundId: FUND_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      currency: 'CAD',
      amount: 10000,
      fromClass: 'UNRESTRICTED',
      toClass: 'TEMPORARILY_RESTRICTED',
      reason: 'test',
      reclassificationDate: '2026-03-26',
    })).rejects.toThrow('Cannot reclassify from UNRESTRICTED');
  });

  it('should reject same fromClass and toClass', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      id: FUND_ID, fund_type: 'TEMPORARILY_RESTRICTED', entity_id: ENTITY_ID,
    }]);

    await expect(reclassifyFund({
      fundId: FUND_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      currency: 'CAD',
      amount: 10000,
      fromClass: 'TEMPORARILY_RESTRICTED',
      toClass: 'TEMPORARILY_RESTRICTED',
      reason: 'test',
      reclassificationDate: '2026-03-26',
    })).rejects.toThrow('must be different');
  });

  // ========== Auto-Reclassify ==========

  it('should auto-reclassify all expired restrictions', async () => {
    // scanExpiredRestrictions: find funds
    mockRunCypher.mockResolvedValueOnce([
      {
        id: FUND_ID,
        label: 'Fund A',
        entity_id: ENTITY_ID,
        fund_type: 'TEMPORARILY_RESTRICTED',
        restriction_expiry: '2025-12-31',
      },
      {
        id: FUND_ID_2,
        label: 'Fund B',
        entity_id: ENTITY_ID,
        fund_type: 'TEMPORARILY_RESTRICTED',
        restriction_expiry: '2026-01-15',
      },
    ]);

    // scanExpiredRestrictions: balances
    mockQuery.mockResolvedValueOnce({
      rows: [
        { fund_id: FUND_ID, net_balance: '25000' },
        { fund_id: FUND_ID_2, net_balance: '15000' },
      ],
      rowCount: 2,
    } as any);

    // reclassifyFund for Fund A: lookup
    mockRunCypher.mockResolvedValueOnce([{
      id: FUND_ID, fund_type: 'TEMPORARILY_RESTRICTED', entity_id: ENTITY_ID,
    }]);
    // Fund A: balance check
    mockQuery.mockResolvedValueOnce({ rows: [{ remaining: '25000' }], rowCount: 1 } as any);
    // Fund A: update fund_type (fully reclassified)
    mockRunCypher.mockResolvedValueOnce([]);
    // Fund A: insert history
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    // reclassifyFund for Fund B: lookup
    mockRunCypher.mockResolvedValueOnce([{
      id: FUND_ID_2, fund_type: 'TEMPORARILY_RESTRICTED', entity_id: ENTITY_ID,
    }]);
    // Fund B: balance check
    mockQuery.mockResolvedValueOnce({ rows: [{ remaining: '15000' }], rowCount: 1 } as any);
    // Fund B: update fund_type
    mockRunCypher.mockResolvedValueOnce([]);
    // Fund B: insert history
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const results = await autoReclassifyExpired(ENTITY_ID, PERIOD_ID, 'CAD', '2026-03-26');

    expect(results).toHaveLength(2);
    expect(results[0].amount).toBe(25000);
    expect(results[1].amount).toBe(15000);
    expect(mockPostJE).toHaveBeenCalledTimes(2);
  });

  it('should skip funds with zero or negative balance in auto-reclassify', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      id: FUND_ID,
      label: 'Empty Fund',
      entity_id: ENTITY_ID,
      fund_type: 'TEMPORARILY_RESTRICTED',
      restriction_expiry: '2025-12-31',
    }]);

    mockQuery.mockResolvedValueOnce({
      rows: [{ fund_id: FUND_ID, net_balance: '0' }],
      rowCount: 1,
    } as any);

    const results = await autoReclassifyExpired(ENTITY_ID, PERIOD_ID, 'CAD', '2026-03-26');

    expect(results).toHaveLength(0);
    expect(mockPostJE).not.toHaveBeenCalled();
  });

  // ========== Fulfill Purpose Restriction ==========

  it('should fulfill a purpose restriction', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      id: FUND_ID, fund_type: 'TEMPORARILY_RESTRICTED', entity_id: ENTITY_ID,
    }]);

    mockQuery.mockResolvedValueOnce({ rows: [{ remaining: '10000' }], rowCount: 1 } as any);
    mockRunCypher.mockResolvedValueOnce([]); // update fund_type
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // insert history

    const result = await fulfillPurposeRestriction(
      FUND_ID, ENTITY_ID, PERIOD_ID, 'CAD', 10000,
      '2026-03-26', 'Scholarship funds fully disbursed',
    );

    expect(result.fromClass).toBe('TEMPORARILY_RESTRICTED');
    expect(result.toClass).toBe('UNRESTRICTED');
    expect(result.amount).toBe(10000);
    expect(mockPostJE).toHaveBeenCalledWith(
      expect.objectContaining({
        narrative: expect.stringContaining('Purpose restriction fulfilled'),
      }),
    );
  });

  // ========== History ==========

  it('should return reclassification history', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'reclass-1', fund_id: FUND_ID, entity_id: ENTITY_ID,
          from_class: 'TEMPORARILY_RESTRICTED', to_class: 'UNRESTRICTED',
          amount: 50000, reason: 'Expired',
          reclassification_date: '2026-03-01',
          journal_entry_id: 'je-1', approved_by: null,
          created_at: '2026-03-01T12:00:00Z',
        },
      ],
      rowCount: 1,
    } as any);

    const history = await getReclassificationHistory(ENTITY_ID);

    expect(history).toHaveLength(1);
    expect(history[0].from_class).toBe('TEMPORARILY_RESTRICTED');
    expect(history[0].amount).toBe(50000);
  });

  // ========== Fund Restriction Summary ==========

  it('should return fund restriction summary with totals', async () => {
    mockRunCypher.mockResolvedValueOnce([
      { id: FUND_ID, label: 'General', fund_type: 'UNRESTRICTED' },
      {
        id: FUND_ID_2, label: 'Building Fund', fund_type: 'TEMPORARILY_RESTRICTED',
        restriction_expiry: '2025-12-31', restriction_purpose: 'Building',
      },
    ]);

    mockQuery.mockResolvedValueOnce({
      rows: [
        { fund_id: FUND_ID, net_balance: '100000' },
        { fund_id: FUND_ID_2, net_balance: '50000' },
      ],
      rowCount: 2,
    } as any);

    const summary = await getFundRestrictionSummary(ENTITY_ID);

    expect(summary.entityId).toBe(ENTITY_ID);
    expect(summary.funds).toHaveLength(2);
    expect(summary.totalUnrestricted).toBe(100000);
    expect(summary.totalTemporarilyRestricted).toBe(50000);
    expect(summary.funds[1].isExpired).toBe(true); // expiry 2025-12-31 < now
  });

  // ========== Result Shape ==========

  it('should return correct ReclassificationResult shape', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      id: FUND_ID, fund_type: 'TEMPORARILY_RESTRICTED', entity_id: ENTITY_ID,
    }]);
    mockQuery.mockResolvedValueOnce({ rows: [{ remaining: '50000' }], rowCount: 1 } as any);
    mockRunCypher.mockResolvedValueOnce([]);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const result = await reclassifyFund({
      fundId: FUND_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      currency: 'CAD',
      amount: 50000,
      fromClass: 'TEMPORARILY_RESTRICTED',
      toClass: 'UNRESTRICTED',
      reason: 'Expired',
      reclassificationDate: '2026-03-26',
    });

    expect(result).toHaveProperty('reclassificationId');
    expect(result).toHaveProperty('fundId');
    expect(result).toHaveProperty('fromClass');
    expect(result).toHaveProperty('toClass');
    expect(result).toHaveProperty('amount');
    expect(result).toHaveProperty('journalEntryId');
    expect(result).toHaveProperty('reclassificationDate');
  });
});
