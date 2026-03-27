/**
 * Business Combinations — Integration Tests
 *
 * Tests BusinessCombination CRUD, PurchasePriceAdjustment, CashGeneratingUnit,
 * ImpairmentTest (IAS 36), and acquisition accounting (IFRS 3).
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { query, closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities, createAccountingPeriod } from '../../src/services/graph/graph-crud-service.js';
import {
  createBusinessCombination,
  getBusinessCombination,
  listBusinessCombinations,
  completePPA,
  createPPA,
  getPPA,
  listPPAs,
  amortizePPA,
  createCGU,
  getCGU,
  listCGUs,
  runImpairmentTest,
  getImpairmentTest,
  listImpairmentTests,
} from '../../src/services/consolidation/business-combination-service.js';
import { getGoodwill } from '../../src/services/consolidation/consolidation-service.js';

let caFpEntityId: string;   // CA for-profit (acquirer)
let usFpEntityId: string;   // US for-profit (acquiree)
let periodId: string;
const cleanupIds: { label: string; id: string }[] = [];

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  caFpEntityId = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'CA')!.id;
  usFpEntityId = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'US')!.id;

  periodId = track('AccountingPeriod', await createAccountingPeriod({
    entityId: caFpEntityId,
    label: 'BC Test Period',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
  }));

  // Seed some asset balances for impairment test VIU computation
  await query(
    `INSERT INTO gl_period_balances (id, entity_id, period_id, node_ref_id, node_ref_type, economic_category, debit_total, credit_total, net_balance, updated_at)
     VALUES (gen_random_uuid(), $1, $2, gen_random_uuid(), 'ACTIVITY', 'ASSET', 500000, 0, 500000, NOW())
     ON CONFLICT DO NOTHING`,
    [caFpEntityId, periodId],
  );
});

afterAll(async () => {
  // Cleanup in reverse order
  for (const { label, id } of [...cleanupIds].reverse()) {
    try {
      await runCypher(`MATCH (n {id: $id}) DETACH DELETE n`, { id });
    } catch { /* ignore cleanup errors */ }
  }
  // Clean up test period balance
  await query(`DELETE FROM gl_period_balances WHERE period_id = $1`, [periodId]).catch(() => {});
  await Promise.all([closeNeo4j(), closePg(), closeKafka()]);
});

describe('P7-BUSINESS-COMBINATIONS', () => {
  let bcId: string;
  let goodwillId: string;

  // ========== BusinessCombination CRUD ==========

  it('should create a business combination with auto-computed goodwill', async () => {
    const result = await createBusinessCombination({
      label: 'Test Acquisition of US Sub',
      acquirerEntityId: caFpEntityId,
      acquireeEntityId: usFpEntityId,
      acquisitionDate: '2026-01-15',
      totalConsideration: 1_000_000,
      considerationCash: 600_000,
      considerationShares: 300_000,
      considerationContingent: 100_000,
      fairValueNetAssets: 800_000,
      ownershipPctAcquired: 1.0,
      functionalCurrency: 'CAD',
    });

    bcId = track('BusinessCombination', result.id);
    goodwillId = track('Goodwill', result.goodwillId);

    expect(result.id).toBeTruthy();
    expect(result.goodwillId).toBeTruthy();

    // Goodwill = 1M - (1.0 * 800K) = 200K
    const bc = await getBusinessCombination(bcId);
    expect(bc).toBeTruthy();
    expect(Number(bc!.goodwill_arising)).toBe(200_000);
    expect(bc!.ppa_complete).toBe(false);
  });

  it('should list business combinations by acquirer', async () => {
    const combos = await listBusinessCombinations(caFpEntityId);
    expect(combos.length).toBeGreaterThanOrEqual(1);
    expect(combos.some((c) => c.id === bcId)).toBe(true);
  });

  it('should auto-create goodwill node linked to combination', async () => {
    const gw = await getGoodwill(goodwillId);
    expect(gw).toBeTruthy();
    expect(Number(gw!.gross_amount)).toBe(200_000);
    expect(Number(gw!.carrying_amount)).toBe(200_000);
    expect(gw!.business_combination_id).toBe(bcId);
  });

  // ========== Purchase Price Adjustment ==========

  let ppaId: string;

  it('should create a PPA for an intangible asset', async () => {
    ppaId = track('PurchasePriceAdjustment', await createPPA({
      businessCombinationId: bcId,
      targetNodeId: usFpEntityId, // using entity as placeholder target
      targetNodeType: 'FIXED_ASSET',
      bookValueAtAcquisition: 50_000,
      fairValueAtAcquisition: 120_000,
      intangibleCategory: 'CUSTOMER_LIST',
      usefulLifeYears: 10,
      amortizationMethod: 'STRAIGHT_LINE',
      provisional: true,
    }));

    const ppa = await getPPA(ppaId);
    expect(ppa).toBeTruthy();
    expect(Number(ppa!.adjustment_amount)).toBe(70_000); // 120K - 50K
    expect(Number(ppa!.remaining_book_value)).toBe(120_000);
    expect(Number(ppa!.amortized_to_date)).toBe(0);
    expect(ppa!.provisional).toBe(true);
  });

  it('should list PPAs by business combination', async () => {
    const ppas = await listPPAs(bcId);
    expect(ppas.length).toBe(1);
    expect(ppas[0].id).toBe(ppaId);
  });

  it('should amortize a PPA', async () => {
    // 120K / 10 years / 4 quarters = 3,000 per quarter
    const result = await amortizePPA(ppaId, 3_000);
    expect(result).toBe(true);

    const ppa = await getPPA(ppaId);
    expect(Number(ppa!.amortized_to_date)).toBe(3_000);
    expect(Number(ppa!.remaining_book_value)).toBe(117_000);
  });

  it('should complete PPA', async () => {
    const result = await completePPA(bcId);
    expect(result).toBe(true);

    const bc = await getBusinessCombination(bcId);
    expect(bc!.ppa_complete).toBe(true);
  });

  // ========== Cash Generating Unit ==========

  let cguId: string;

  it('should create a CGU with goodwill allocation', async () => {
    cguId = track('CashGeneratingUnit', await createCGU({
      label: 'North America Operations',
      entityIds: [caFpEntityId],
      goodwillIds: [goodwillId],
      viuDiscountRate: 0.10,
      viuHorizonYears: 5,
      viuTerminalGrowthRate: 0.02,
    }));

    const cgu = await getCGU(cguId);
    expect(cgu).toBeTruthy();
    expect(Number(cgu!.allocated_goodwill_carrying)).toBe(200_000);
    expect(Number(cgu!.viu_discount_rate)).toBe(0.10);
    expect(Number(cgu!.viu_horizon_years)).toBe(5);

    // Verify goodwill linked to CGU
    const gw = await getGoodwill(goodwillId);
    expect(gw!.cgu_id).toBe(cguId);
  });

  it('should list CGUs by entity', async () => {
    const cgus = await listCGUs(caFpEntityId);
    expect(cgus.length).toBeGreaterThanOrEqual(1);
    expect(cgus.some((c) => c.id === cguId)).toBe(true);
  });

  // ========== Impairment Test (IAS 36) ==========

  it('should run an impairment test and compute VIU', async () => {
    const result = await runImpairmentTest({
      goodwillId,
      cguId,
      periodId,
      testDate: '2026-03-31',
    });

    track('ImpairmentTest', result.impairmentTestId);

    expect(result.impairmentTestId).toBeTruthy();
    expect(result.viuComputed).toBeGreaterThan(0);
    expect(result.carryingAmountTested).toBeGreaterThan(0);
    expect(result.recoverableAmount).toBeGreaterThan(0);
    expect(['PASS', 'IMPAIRED']).toContain(result.result);
    expect(typeof result.headroom).toBe('number');
    expect(typeof result.impairmentLoss).toBe('number');
    expect(result.impairmentLoss).toBeGreaterThanOrEqual(0);
  });

  it('should retrieve impairment test by id', async () => {
    const tests = await listImpairmentTests(cguId);
    expect(tests.length).toBeGreaterThanOrEqual(1);

    const test = await getImpairmentTest(tests[0].id as string);
    expect(test).toBeTruthy();
    expect(test!.cgu_id).toBe(cguId);
    expect(test!.goodwill_id).toBe(goodwillId);
  });

  it('should update CGU with last test info', async () => {
    const cgu = await getCGU(cguId);
    expect(cgu!.last_impairment_test_date).toBeTruthy();
    expect(cgu!.last_recoverable_amount).toBeTruthy();
  });

  // ========== Full Goodwill Method ==========

  it('should compute full goodwill with NCI fair value', async () => {
    const result = await createBusinessCombination({
      label: 'Full Goodwill Acquisition',
      acquirerEntityId: caFpEntityId,
      acquireeEntityId: usFpEntityId,
      acquisitionDate: '2026-02-01',
      totalConsideration: 500_000,
      considerationCash: 500_000,
      considerationShares: 0,
      considerationContingent: 0,
      fairValueNetAssets: 400_000,
      ownershipPctAcquired: 0.80,
      nciFairValue: 120_000,
      functionalCurrency: 'CAD',
      minorityInterestMethod: 'FULL_GOODWILL',
    });

    track('BusinessCombination', result.id);
    track('Goodwill', result.goodwillId);

    const bc = await getBusinessCombination(result.id);
    // Full goodwill = 500K + 120K - 400K = 220K
    expect(Number(bc!.goodwill_arising)).toBe(220_000);
    expect(Number(bc!.full_goodwill)).toBe(220_000);

    const gw = await getGoodwill(result.goodwillId);
    expect(gw!.is_full_goodwill).toBe(true);
    expect(Number(gw!.gross_amount)).toBe(220_000);
  });
});
