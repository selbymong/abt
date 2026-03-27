/**
 * Pension (IAS 19) — Integration Tests
 *
 * Tests DefinedBenefitObligation CRUD, pension period processing
 * (service cost, net interest, remeasurements to OCI), actuarial
 * assumption updates, and pension summary.
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
vi.mock('../../src/services/gl/equity-close-service.js', () => ({
  recordOCI: vi.fn(),
}));

import { runCypher } from '../../src/lib/neo4j.js';
import { query } from '../../src/lib/pg.js';
import { postJournalEntry } from '../../src/services/gl/journal-posting-service.js';
import { recordOCI } from '../../src/services/gl/equity-close-service.js';
import {
  createPensionPlan,
  getPensionPlan,
  listPensionPlans,
  processPensionPeriod,
  updateActuarialAssumptions,
  getPensionSummary,
} from '../../src/services/gl/pension-service.js';

const mockRunCypher = vi.mocked(runCypher);
const mockPostJE = vi.mocked(postJournalEntry);
const mockRecordOCI = vi.mocked(recordOCI);

const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const PERIOD_ID = '22222222-2222-2222-2222-222222222222';
const PLAN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const SAMPLE_PLAN = {
  id: PLAN_ID,
  entity_id: ENTITY_ID,
  label: 'Employee Pension Plan',
  currency: 'CAD',
  discount_rate: 0.05,
  salary_growth_rate: 0.03,
  expected_return_on_assets: 0.06,
  dbo_opening: 1000000,
  dbo_closing: 1000000,
  plan_assets_opening: 800000,
  plan_assets_closing: 800000,
  net_liability: 200000,
  mortality_table: 'CAN-2014',
  valuation_date: '2026-01-01',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('P7-PENSION', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRunCypher.mockResolvedValue([]);
    mockPostJE.mockResolvedValue('mock-je-id');
    mockRecordOCI.mockResolvedValue('mock-oci-id');
  });

  // ========== Pension Plan Creation ==========

  it('should create a pension plan', async () => {
    const id = await createPensionPlan({
      entityId: ENTITY_ID,
      label: 'Employee Pension Plan',
      currency: 'CAD',
      discountRate: 0.05,
      salaryGrowthRate: 0.03,
      expectedReturnOnAssets: 0.06,
      dboOpening: 1000000,
      planAssetsOpening: 800000,
      mortalityTable: 'CAN-2014',
      valuationDate: '2026-01-01',
    });

    expect(id).toBeDefined();
    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining('CREATE (p:DefinedBenefitObligation'),
      expect.objectContaining({
        entityId: ENTITY_ID,
        dboOpening: 1000000,
        planAssetsOpening: 800000,
        netLiability: 200000, // 1M - 800K
      }),
    );
  });

  // ========== Get / List ==========

  it('should get a pension plan by ID', async () => {
    mockRunCypher.mockResolvedValueOnce([{ p: SAMPLE_PLAN }]);

    const plan = await getPensionPlan(PLAN_ID);
    expect(plan).toBeDefined();
    expect(plan!.label).toBe('Employee Pension Plan');
    expect(plan!.net_liability).toBe(200000);
  });

  it('should return null for nonexistent plan', async () => {
    mockRunCypher.mockResolvedValueOnce([]);
    const plan = await getPensionPlan('nonexistent');
    expect(plan).toBeNull();
  });

  it('should list pension plans by entity', async () => {
    mockRunCypher.mockResolvedValueOnce([
      { p: { ...SAMPLE_PLAN, id: 'plan-1', label: 'Plan A' } },
      { p: { ...SAMPLE_PLAN, id: 'plan-2', label: 'Plan B' } },
    ]);

    const plans = await listPensionPlans(ENTITY_ID);
    expect(plans).toHaveLength(2);
  });

  // ========== Period Processing ==========

  it('should process pension period with all components', async () => {
    // getPensionPlan
    mockRunCypher.mockResolvedValueOnce([{ p: SAMPLE_PLAN }]);
    // Update plan node
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await processPensionPeriod({
      pensionPlanId: PLAN_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      currency: 'CAD',
      currentServiceCost: 50000,
      employerContributions: 60000,
      benefitsPaid: 40000,
      actuarialGainLossOnDBO: 15000, // Actuarial loss (increases DBO)
      actualReturnOnAssets: 55000,
      periodStartDate: '2026-01-01',
      periodEndDate: '2026-12-31',
    });

    // Net interest = DBO × rate - Assets × rate = 1M×5% - 800K×5% = 50K - 40K = 10K
    expect(result.netInterestCost).toBe(10000);
    expect(result.currentServiceCost).toBe(50000);

    // Remeasurement = (actual return - interest on assets) - actuarial loss
    // = (55000 - 40000) - 15000 = 15000 - 15000 = 0
    expect(result.remeasurementOCI).toBe(0);

    // DBO closing = 1M + 50K service + 50K interest + 15K actuarial loss - 40K benefits = 1,075,000
    expect(result.dboClosing).toBe(1075000);

    // Plan assets closing = 800K + 55K actual return + 60K contributions - 40K benefits = 875,000
    expect(result.planAssetsClosing).toBe(875000);

    // Net liability = 1,075,000 - 875,000 = 200,000
    expect(result.netLiability).toBe(200000);

    // JEs: service cost + net interest + contributions = 3
    expect(result.journalEntryIds).toHaveLength(3);
    expect(mockPostJE).toHaveBeenCalledTimes(3);

    // OCI was recorded
    expect(result.ociId).toBe('mock-oci-id');
    expect(mockRecordOCI).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'DB_PENSION',
        currentPeriod: 0,
        sourceNodeType: 'PENSION',
      }),
    );
  });

  it('should compute net interest correctly', async () => {
    mockRunCypher.mockResolvedValueOnce([{ p: SAMPLE_PLAN }]);
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await processPensionPeriod({
      pensionPlanId: PLAN_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      currency: 'CAD',
      currentServiceCost: 0,
      employerContributions: 0,
      benefitsPaid: 0,
      actuarialGainLossOnDBO: 0,
      actualReturnOnAssets: 40000, // exactly matches interest on assets
      periodStartDate: '2026-01-01',
      periodEndDate: '2026-12-31',
    });

    // DBO × 5% = 50,000; Assets × 5% = 40,000; net = 10,000
    expect(result.netInterestCost).toBe(10000);
  });

  it('should compute positive remeasurement when assets outperform', async () => {
    mockRunCypher.mockResolvedValueOnce([{ p: SAMPLE_PLAN }]);
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await processPensionPeriod({
      pensionPlanId: PLAN_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      currency: 'CAD',
      currentServiceCost: 0,
      employerContributions: 0,
      benefitsPaid: 0,
      actuarialGainLossOnDBO: 0, // No actuarial loss
      actualReturnOnAssets: 80000, // 80K actual vs 40K expected
      periodStartDate: '2026-01-01',
      periodEndDate: '2026-12-31',
    });

    // Remeasurement = (80K - 40K interest on assets) - 0 actuarial loss = 40K gain
    expect(result.remeasurementOCI).toBe(40000);
  });

  it('should compute negative remeasurement on actuarial loss', async () => {
    mockRunCypher.mockResolvedValueOnce([{ p: SAMPLE_PLAN }]);
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await processPensionPeriod({
      pensionPlanId: PLAN_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      currency: 'CAD',
      currentServiceCost: 0,
      employerContributions: 0,
      benefitsPaid: 0,
      actuarialGainLossOnDBO: 30000, // 30K actuarial loss
      actualReturnOnAssets: 40000, // Matches expected
      periodStartDate: '2026-01-01',
      periodEndDate: '2026-12-31',
    });

    // Remeasurement = (40K - 40K) - 30K = -30K
    expect(result.remeasurementOCI).toBe(-30000);
  });

  it('should skip JE for zero service cost', async () => {
    mockRunCypher.mockResolvedValueOnce([{ p: SAMPLE_PLAN }]);
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await processPensionPeriod({
      pensionPlanId: PLAN_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      currency: 'CAD',
      currentServiceCost: 0,
      employerContributions: 0,
      benefitsPaid: 0,
      actuarialGainLossOnDBO: 0,
      actualReturnOnAssets: 40000,
      periodStartDate: '2026-01-01',
      periodEndDate: '2026-12-31',
    });

    // Only net interest JE (no service cost, no contributions)
    expect(result.journalEntryIds).toHaveLength(1);
  });

  it('should post service cost JE with correct structure', async () => {
    mockRunCypher.mockResolvedValueOnce([{ p: SAMPLE_PLAN }]);
    mockRunCypher.mockResolvedValueOnce([]);

    await processPensionPeriod({
      pensionPlanId: PLAN_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      currency: 'CAD',
      currentServiceCost: 50000,
      employerContributions: 0,
      benefitsPaid: 0,
      actuarialGainLossOnDBO: 0,
      actualReturnOnAssets: 40000,
      periodStartDate: '2026-01-01',
      periodEndDate: '2026-12-31',
    });

    // First call should be service cost JE
    expect(mockPostJE).toHaveBeenCalledWith(
      expect.objectContaining({
        entryType: 'OPERATIONAL',
        narrative: expect.stringContaining('service cost'),
        lines: expect.arrayContaining([
          expect.objectContaining({ side: 'DEBIT', amount: 50000, economicCategory: 'EXPENSE' }),
          expect.objectContaining({ side: 'CREDIT', amount: 50000, economicCategory: 'LIABILITY' }),
        ]),
      }),
    );
  });

  it('should reject if plan not found', async () => {
    mockRunCypher.mockResolvedValueOnce([]);

    await expect(processPensionPeriod({
      pensionPlanId: 'nonexistent',
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      currency: 'CAD',
      currentServiceCost: 0,
      employerContributions: 0,
      benefitsPaid: 0,
      actuarialGainLossOnDBO: 0,
      actualReturnOnAssets: 0,
      periodStartDate: '2026-01-01',
      periodEndDate: '2026-12-31',
    })).rejects.toThrow('not found');
  });

  // ========== Actuarial Assumptions ==========

  it('should update actuarial assumptions', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      p: { ...SAMPLE_PLAN, discount_rate: 0.04 },
    }]);

    const result = await updateActuarialAssumptions(PLAN_ID, {
      discountRate: 0.04,
      salaryGrowthRate: 0.025,
    });

    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining('discount_rate'),
      expect.objectContaining({ discountRate: 0.04, salaryGrowthRate: 0.025 }),
    );
    expect(result.discount_rate).toBe(0.04);
  });

  it('should reject update if plan not found', async () => {
    mockRunCypher.mockResolvedValueOnce([]);

    await expect(
      updateActuarialAssumptions('nonexistent', { discountRate: 0.04 }),
    ).rejects.toThrow('not found');
  });

  // ========== Pension Summary ==========

  it('should return pension summary with totals', async () => {
    mockRunCypher.mockResolvedValueOnce([
      { p: { ...SAMPLE_PLAN, dbo_closing: 1000000, plan_assets_closing: 800000 } },
      { p: { ...SAMPLE_PLAN, id: 'plan-2', dbo_closing: 500000, plan_assets_closing: 450000 } },
    ]);

    const summary = await getPensionSummary(ENTITY_ID);

    expect(summary.entityId).toBe(ENTITY_ID);
    expect(summary.plans).toHaveLength(2);
    expect(summary.totalDBO).toBe(1500000);
    expect(summary.totalPlanAssets).toBe(1250000);
    expect(summary.totalNetLiability).toBe(250000);
  });

  // ========== Result Shape ==========

  it('should return correct PensionPeriodResult shape', async () => {
    mockRunCypher.mockResolvedValueOnce([{ p: SAMPLE_PLAN }]);
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await processPensionPeriod({
      pensionPlanId: PLAN_ID,
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      currency: 'CAD',
      currentServiceCost: 10000,
      employerContributions: 20000,
      benefitsPaid: 5000,
      actuarialGainLossOnDBO: 3000,
      actualReturnOnAssets: 45000,
      periodStartDate: '2026-01-01',
      periodEndDate: '2026-12-31',
    });

    expect(result).toHaveProperty('currentServiceCost');
    expect(result).toHaveProperty('netInterestCost');
    expect(result).toHaveProperty('remeasurementOCI');
    expect(result).toHaveProperty('employerContributions');
    expect(result).toHaveProperty('benefitsPaid');
    expect(result).toHaveProperty('dboClosing');
    expect(result).toHaveProperty('planAssetsClosing');
    expect(result).toHaveProperty('netLiability');
    expect(result).toHaveProperty('journalEntryIds');
    expect(result).toHaveProperty('ociId');
  });
});
