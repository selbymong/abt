/**
 * ASPE Operating Lease Treatment — Integration Tests
 *
 * Tests that ASPE entities use TemporalClaim-only path (no ROU/liability),
 * straight-line expense recognition, and framework-aware routing.
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
import { postJournalEntry } from '../../src/services/gl/journal-posting-service.js';
import {
  createAspeOperatingLease,
  processAspeLeasePayment,
  getAspeOperatingLease,
  listAspeOperatingLeases,
  createLeaseFrameworkAware,
} from '../../src/services/gl/lease-service.js';

const mockRunCypher = vi.mocked(runCypher);
const mockPostJE = vi.mocked(postJournalEntry);

const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const PERIOD_1 = '22222222-2222-2222-2222-222222222222';
const PERIOD_2 = '33333333-3333-3333-3333-333333333333';
const PERIOD_3 = '44444444-4444-4444-4444-444444444444';

describe('P7-ASPE-LEASES', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRunCypher.mockResolvedValue([]);
    mockPostJE.mockResolvedValue('mock-je-id');
  });

  // ========== ASPE Lease Creation ==========

  it('should create an ASPE operating lease as TemporalClaim', async () => {
    const result = await createAspeOperatingLease({
      entityId: ENTITY_ID,
      label: 'Office Lease',
      totalLeasePayments: 36000,
      leaseTermMonths: 12,
      monthlyPayment: 3000,
      commencementDate: '2026-01-01',
      leaseEndDate: '2026-12-31',
      periodSchedule: [
        { periodId: PERIOD_1, paymentDate: '2026-01-31' },
        { periodId: PERIOD_2, paymentDate: '2026-02-28' },
        { periodId: PERIOD_3, paymentDate: '2026-03-31' },
      ],
      currency: 'CAD',
    });

    expect(result.temporalClaimId).toBeDefined();
    expect(result.totalExpense).toBe(36000);
    expect(result.monthlyExpense).toBe(3000); // 36000 / 12

    // Verify TemporalClaim was created (not ROU or LeaseLiability)
    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining('CREATE (t:TemporalClaim'),
      expect.objectContaining({
        entityId: ENTITY_ID,
        totalPayments: 36000,
      }),
    );

    // Should NOT create ROU or LeaseLiability
    const allCalls = mockRunCypher.mock.calls.map((c) => c[0]);
    expect(allCalls.some((q) => q.includes('RightOfUseAsset'))).toBe(false);
    expect(allCalls.some((q) => q.includes('LeaseLiability'))).toBe(false);
  });

  it('should set aspe_lease flag on TemporalClaim', async () => {
    await createAspeOperatingLease({
      entityId: ENTITY_ID,
      label: 'Equipment Lease',
      totalLeasePayments: 12000,
      leaseTermMonths: 6,
      monthlyPayment: 2000,
      commencementDate: '2026-01-01',
      leaseEndDate: '2026-06-30',
      periodSchedule: [{ periodId: PERIOD_1, paymentDate: '2026-01-31' }],
      currency: 'CAD',
    });

    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining('aspe_lease: true'),
      expect.any(Object),
    );
  });

  it('should use PREPAID_EXPENSE claim type', async () => {
    await createAspeOperatingLease({
      entityId: ENTITY_ID,
      label: 'Vehicle Lease',
      totalLeasePayments: 24000,
      leaseTermMonths: 24,
      monthlyPayment: 1000,
      commencementDate: '2026-01-01',
      leaseEndDate: '2027-12-31',
      periodSchedule: [{ periodId: PERIOD_1, paymentDate: '2026-01-31' }],
      currency: 'CAD',
    });

    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining("claim_type: 'PREPAID_EXPENSE'"),
      expect.any(Object),
    );
  });

  // ========== ASPE Lease Payment ==========

  it('should process ASPE lease payment as straight-line expense', async () => {
    // Return claim with schedule
    mockRunCypher.mockResolvedValueOnce([{
      t: {
        id: 'claim-1',
        entity_id: ENTITY_ID,
        aspe_lease: true,
        lease_label: 'Office Lease',
        currency: 'CAD',
        source_node_id: ENTITY_ID,
        recognized_to_date: 0,
        original_amount: 36000,
        recognition_schedule: JSON.stringify([
          { period_id: PERIOD_1, amount: 3000 },
          { period_id: PERIOD_2, amount: 3000 },
        ]),
      },
    }]);

    // Update claim after payment
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await processAspeLeasePayment('claim-1', PERIOD_1);

    expect(result.expenseAmount).toBe(3000);
    expect(result.journalEntryId).toBe('mock-je-id');

    // Verify JE: DR Expense / CR Asset (Cash)
    expect(mockPostJE).toHaveBeenCalledWith(
      expect.objectContaining({
        entryType: 'OPERATIONAL',
        lines: expect.arrayContaining([
          expect.objectContaining({ side: 'DEBIT', amount: 3000, economicCategory: 'EXPENSE' }),
          expect.objectContaining({ side: 'CREDIT', amount: 3000, economicCategory: 'ASSET' }),
        ]),
      }),
    );
  });

  it('should update claim balances after payment', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      t: {
        id: 'claim-1',
        entity_id: ENTITY_ID,
        aspe_lease: true,
        lease_label: 'Lease',
        currency: 'CAD',
        source_node_id: ENTITY_ID,
        recognized_to_date: 3000,
        original_amount: 6000,
        recognition_schedule: JSON.stringify([
          { period_id: PERIOD_2, amount: 3000 },
        ]),
      },
    }]);
    mockRunCypher.mockResolvedValueOnce([]);

    await processAspeLeasePayment('claim-1', PERIOD_2);

    // Should update claim: recognized = 6000, remaining = 0, status = FULLY_RECOGNIZED
    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining('recognized_to_date'),
      expect.objectContaining({
        recognized: 6000,
        remaining: 0,
        status: 'FULLY_RECOGNIZED',
      }),
    );
  });

  it('should return no-op for period not in schedule', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      t: {
        id: 'claim-1',
        entity_id: ENTITY_ID,
        aspe_lease: true,
        lease_label: 'Lease',
        currency: 'CAD',
        source_node_id: ENTITY_ID,
        recognized_to_date: 0,
        original_amount: 12000,
        recognition_schedule: JSON.stringify([
          { period_id: PERIOD_1, amount: 1000 },
        ]),
      },
    }]);

    const result = await processAspeLeasePayment('claim-1', 'nonexistent-period');

    expect(result.expenseAmount).toBe(0);
    expect(result.journalEntryId).toBeNull();
    expect(mockPostJE).not.toHaveBeenCalled();
  });

  it('should reject payment on non-ASPE claim', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      t: {
        id: 'claim-1',
        entity_id: ENTITY_ID,
        aspe_lease: false,
      },
    }]);

    await expect(
      processAspeLeasePayment('claim-1', PERIOD_1),
    ).rejects.toThrow('not an ASPE lease');
  });

  it('should reject payment if claim not found', async () => {
    mockRunCypher.mockResolvedValueOnce([]);

    await expect(
      processAspeLeasePayment('nonexistent', PERIOD_1),
    ).rejects.toThrow('not found');
  });

  // ========== CRUD ==========

  it('should get ASPE operating lease', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      t: {
        id: 'claim-1',
        entity_id: ENTITY_ID,
        aspe_lease: true,
        lease_label: 'Office Lease',
        recognition_schedule: JSON.stringify([{ period_id: PERIOD_1, amount: 1000 }]),
      },
    }]);

    const result = await getAspeOperatingLease('claim-1');
    expect(result).toBeDefined();
    expect(result!.lease_label).toBe('Office Lease');
    expect(Array.isArray(result!.recognition_schedule)).toBe(true);
  });

  it('should list ASPE operating leases by entity', async () => {
    mockRunCypher.mockResolvedValueOnce([
      { t: { id: 'claim-1', aspe_lease: true, lease_label: 'Lease A', recognition_schedule: '[]' } },
      { t: { id: 'claim-2', aspe_lease: true, lease_label: 'Lease B', recognition_schedule: '[]' } },
    ]);

    const result = await listAspeOperatingLeases(ENTITY_ID);
    expect(result).toHaveLength(2);
  });

  // ========== Framework-Aware Routing ==========

  it('should route ASPE entity to TemporalClaim path', async () => {
    // Entity lookup returns ASPE
    mockRunCypher.mockResolvedValueOnce([{ reporting_framework: 'ASPE' }]);

    // TemporalClaim creation
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await createLeaseFrameworkAware({
      entityId: ENTITY_ID,
      label: 'ASPE Lease',
      leaseClassification: 'OPERATING',
      totalLeasePayments: 12000,
      leaseTermMonths: 12,
      monthlyPayment: 1000,
      incrementalBorrowingRate: 0.05,
      commencementDate: '2026-01-01',
      leaseEndDate: '2026-12-31',
      periodSchedule: [{ periodId: PERIOD_1, paymentDate: '2026-01-31' }],
      currency: 'CAD',
    });

    expect(result.framework).toBe('ASPE');
    expect('temporalClaimId' in result).toBe(true);
    expect('rouAssetId' in result).toBe(false);
  });

  it('should route IFRS entity to ROU + LeaseLiability path', async () => {
    // Entity lookup returns IFRS
    mockRunCypher.mockResolvedValueOnce([{ reporting_framework: 'IFRS' }]);

    // ROU creation
    mockRunCypher.mockResolvedValueOnce([]);
    // LeaseLiability creation
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await createLeaseFrameworkAware({
      entityId: ENTITY_ID,
      label: 'IFRS Lease',
      leaseClassification: 'FINANCE',
      totalLeasePayments: 12000,
      leaseTermMonths: 12,
      monthlyPayment: 1000,
      incrementalBorrowingRate: 0.05,
      commencementDate: '2026-01-01',
      leaseEndDate: '2026-12-31',
      periodSchedule: [{ periodId: PERIOD_1, paymentDate: '2026-01-31' }],
    });

    expect(result.framework).toBe('IFRS');
    expect('rouAssetId' in result).toBe(true);
    expect('leaseLiabilityId' in result).toBe(true);
  });

  it('should route US_GAAP entity to ROU + LeaseLiability path', async () => {
    mockRunCypher.mockResolvedValueOnce([{ reporting_framework: 'US_GAAP' }]);
    mockRunCypher.mockResolvedValueOnce([]);
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await createLeaseFrameworkAware({
      entityId: ENTITY_ID,
      label: 'US GAAP Lease',
      leaseClassification: 'FINANCE',
      totalLeasePayments: 12000,
      leaseTermMonths: 12,
      monthlyPayment: 1000,
      incrementalBorrowingRate: 0.05,
      commencementDate: '2026-01-01',
      leaseEndDate: '2026-12-31',
      periodSchedule: [{ periodId: PERIOD_1, paymentDate: '2026-01-31' }],
    });

    expect(result.framework).toBe('US_GAAP');
    expect('rouAssetId' in result).toBe(true);
  });

  it('should reject if entity not found in framework-aware', async () => {
    mockRunCypher.mockResolvedValueOnce([]);

    await expect(createLeaseFrameworkAware({
      entityId: 'nonexistent',
      label: 'Test',
      leaseClassification: 'OPERATING',
      totalLeasePayments: 1000,
      leaseTermMonths: 1,
      monthlyPayment: 1000,
      incrementalBorrowingRate: 0.05,
      commencementDate: '2026-01-01',
      leaseEndDate: '2026-01-31',
      periodSchedule: [{ periodId: PERIOD_1, paymentDate: '2026-01-31' }],
    })).rejects.toThrow('not found');
  });
});
