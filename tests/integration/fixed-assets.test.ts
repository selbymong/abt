/**
 * Fixed Assets + Depreciation Engine — Integration Tests
 *
 * Tests FixedAsset CRUD, AssetClass lookups, BELONGS_TO edge management,
 * two-pass depreciation engine, UCCPool CCA calculation, and disposal.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied + seed data.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { query, closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities, createAccountingPeriod, createActivity } from '../../src/services/graph/graph-crud-service.js';
import {
  createFixedAsset,
  getFixedAsset,
  listFixedAssets,
  updateFixedAsset,
  disposeFixedAsset,
  listAssetClasses,
  getAssetClassByCode,
  createBelongsToEdge,
  getAssetClassesForAsset,
  createUCCPool,
  calculateCCA,
} from '../../src/services/depreciation/fixed-asset-service.js';
import {
  calculateCharge,
  depreciateAsset,
  depreciateAllAssets,
  getDepreciationSchedule,
} from '../../src/services/depreciation/depreciation-engine.js';

let testEntityId: string;
let testActivityId: string;
let testPeriodId: string;
const cleanupIds: { label: string; id: string }[] = [];

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  const fpEntity = entities.find((e) => e.entity_type === 'FOR_PROFIT');
  testEntityId = fpEntity!.id;

  testPeriodId = track('AccountingPeriod', await createAccountingPeriod({
    entityId: testEntityId,
    label: 'Depreciation Test Period',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
  }));

  testActivityId = track('Activity', await createActivity({
    entityId: testEntityId,
    label: 'Dep Test Activity',
    costMonetary: 100000,
    status: 'COMPLETED' as any,
  }));
});

afterAll(async () => {
  // Clean up TimescaleDB
  await query('DELETE FROM gl_period_balances WHERE period_id = $1', [testPeriodId]);

  // Clean up JEs from depreciation
  for (const { label, id } of cleanupIds) {
    if (label === 'FixedAsset') {
      const jeIds = await runCypher<{ id: string }>(
        `MATCH (j:JournalEntry) WHERE j.reference CONTAINS $assetId RETURN j.id AS id`,
        { assetId: id },
      );
      for (const je of jeIds) {
        await runCypher('MATCH (l:LedgerLine {journal_entry_id: $jeId}) DELETE l', { jeId: je.id });
        await runCypher('MATCH (j:JournalEntry {id: $id}) DELETE j', { id: je.id });
      }
      await runCypher('MATCH (s:DepreciationSchedule {fixed_asset_id: $id}) DELETE s', { id });
    }
    await runCypher(`MATCH (n:${label} {id: $id}) DETACH DELETE n`, { id });
  }
  await closeNeo4j();
  await closePg();
  await closeKafka();
});

describe('FixedAsset CRUD', () => {
  let assetId: string;

  it('creates a FixedAsset', async () => {
    assetId = track('FixedAsset', await createFixedAsset({
      entityId: testEntityId,
      label: 'Office Laptop',
      costAtAcquisition: 2400,
      acquisitionDate: '2026-01-15',
      activityRefId: testActivityId,
      depreciationMethod: 'STRAIGHT_LINE',
      usefulLifeYears: 4,
      salvageValue: 0,
    }));
    expect(assetId).toBeDefined();
  });

  it('retrieves with correct properties', async () => {
    const asset = await getFixedAsset(assetId);
    expect(asset).toBeDefined();
    expect(asset!.label).toBe('Office Laptop');
    expect(Number(asset!.cost_at_acquisition)).toBe(2400);
    expect(Number(asset!.accumulated_depreciation)).toBe(0);
    expect(Number(asset!.carrying_amount)).toBe(2400);
    expect(Number(asset!.tax_base)).toBe(2400);
    expect(Number(asset!.tax_accumulated_dep)).toBe(0);
  });

  it('lists assets by entity', async () => {
    const assets = await listFixedAssets(testEntityId);
    expect(assets.some((a) => a.id === assetId)).toBe(true);
  });

  it('updates asset properties', async () => {
    const updated = await updateFixedAsset(assetId, { cgu_id: 'test-cgu' });
    expect(updated).toBe(true);
    const asset = await getFixedAsset(assetId);
    expect(asset!.cgu_id).toBe('test-cgu');
  });
});

describe('AssetClass Lookups', () => {
  it('lists all CCA classes', async () => {
    const ccaClasses = await listAssetClasses('CCA');
    expect(ccaClasses.length).toBeGreaterThanOrEqual(14);
    expect(ccaClasses.every((c) => c.class_system === 'CCA')).toBe(true);
  });

  it('lists all MACRS classes', async () => {
    const macrsClasses = await listAssetClasses('MACRS');
    expect(macrsClasses.length).toBeGreaterThanOrEqual(8);
  });

  it('lists ACCOUNTING classes', async () => {
    const acctClasses = await listAssetClasses('ACCOUNTING');
    expect(acctClasses.length).toBeGreaterThanOrEqual(8);
  });

  it('gets asset class by code', async () => {
    const cca50 = await getAssetClassByCode('CA-CCA-50');
    expect(cca50).toBeDefined();
    expect(cca50!.label).toContain('Computer');
    expect(cca50!.rate_pct).toBe(0.55);
    expect(cca50!.depreciation_method).toBe('DECLINING_BALANCE');
    expect(cca50!.first_year_rule).toBe('HALF_YEAR');
    expect(cca50!.pool_method).toBe('POOLED');
  });

  it('filters by jurisdiction', async () => {
    const caClasses = await listAssetClasses('CCA', 'CA');
    expect(caClasses.length).toBeGreaterThanOrEqual(14);
    const usClasses = await listAssetClasses('MACRS', 'US');
    expect(usClasses.length).toBeGreaterThanOrEqual(8);
  });
});

describe('BELONGS_TO Edge Management', () => {
  let assetId: string;

  beforeAll(async () => {
    assetId = track('FixedAsset', await createFixedAsset({
      entityId: testEntityId,
      label: 'Server Rack',
      costAtAcquisition: 15000,
      acquisitionDate: '2026-02-01',
      activityRefId: testActivityId,
    }));

    // Assign to ACCOUNTING class (IT Equipment)
    const acctIT = await getAssetClassByCode('ACCT-IT-EQUIP');
    await createBelongsToEdge({
      fixedAssetId: assetId,
      assetClassId: acctIT!.id,
      classSystem: 'ACCOUNTING',
      effectiveFrom: '2026-02-01',
    });

    // Assign to CCA class (Computer Equipment - Class 50)
    const cca50 = await getAssetClassByCode('CA-CCA-50');
    await createBelongsToEdge({
      fixedAssetId: assetId,
      assetClassId: cca50!.id,
      classSystem: 'CCA',
      effectiveFrom: '2026-02-01',
    });
  });

  it('retrieves assigned asset classes', async () => {
    const classes = await getAssetClassesForAsset(assetId);
    expect(classes).toHaveLength(2);
    const systems = classes.map((c) => c.classSystem);
    expect(systems).toContain('ACCOUNTING');
    expect(systems).toContain('CCA');
  });

  it('supports override values on BELONGS_TO edge', async () => {
    const assetId2 = track('FixedAsset', await createFixedAsset({
      entityId: testEntityId,
      label: 'Custom Life Server',
      costAtAcquisition: 10000,
      acquisitionDate: '2026-03-01',
      activityRefId: testActivityId,
    }));

    const acctIT = await getAssetClassByCode('ACCT-IT-EQUIP');
    await createBelongsToEdge({
      fixedAssetId: assetId2,
      assetClassId: acctIT!.id,
      classSystem: 'ACCOUNTING',
      effectiveFrom: '2026-03-01',
      overrideUsefulLife: 6,
      overrideReason: 'Extended warranty covers 6 years',
    });

    const classes = await getAssetClassesForAsset(assetId2);
    const acctEdge = classes.find((c) => c.classSystem === 'ACCOUNTING');
    expect(Number(acctEdge!.overrides.override_useful_life)).toBe(6);
  });
});

describe('Depreciation Calculation (Unit)', () => {
  it('calculates straight-line depreciation', () => {
    // $12,000 asset, 4-year life, no salvage
    const charge = calculateCharge(12000, 0, 'STRAIGHT_LINE', 4, null, 0, false, 'FULL_YEAR');
    expect(charge).toBeCloseTo(250, 1); // $12,000 / (4 × 12) = $250/month
  });

  it('applies half-year rule on first year', () => {
    const charge = calculateCharge(12000, 0, 'STRAIGHT_LINE', 4, null, 0, true, 'HALF_YEAR');
    expect(charge).toBeCloseTo(125, 1); // $250 × 0.5 = $125
  });

  it('calculates declining balance depreciation', () => {
    // $10,000 asset, 20% rate (stored as 0.20)
    const charge = calculateCharge(10000, 0, 'DECLINING_BALANCE', null, 0.20, 0, false, 'FULL_YEAR');
    expect(charge).toBeCloseTo(166.67, 0); // (10000 × 0.20) / 12
  });

  it('calculates double declining balance', () => {
    // $10,000 asset, 5-year life → rate = 2/5 = 40%
    const charge = calculateCharge(10000, 0, 'DOUBLE_DECLINING', 5, null, 0, false, 'FULL_YEAR');
    expect(charge).toBeCloseTo(333.33, 0); // (10000 × 2/5) / 12
  });

  it('respects salvage value', () => {
    // $10,000 asset, $2,000 salvage, 4-year life
    const charge = calculateCharge(10000, 0, 'STRAIGHT_LINE', 4, null, 2000, false, 'FULL_YEAR');
    expect(charge).toBeCloseTo(166.67, 0); // (10000 - 2000) / (4 × 12)
  });

  it('stops at zero remaining', () => {
    // Already fully depreciated
    const charge = calculateCharge(10000, 10000, 'STRAIGHT_LINE', 4, null, 0, false, 'FULL_YEAR');
    expect(charge).toBe(0);
  });
});

describe('Two-Pass Depreciation Engine', () => {
  let depAssetId: string;

  beforeAll(async () => {
    depAssetId = track('FixedAsset', await createFixedAsset({
      entityId: testEntityId,
      label: 'Depreciating Laptop',
      costAtAcquisition: 4800,
      acquisitionDate: '2026-01-01',
      activityRefId: testActivityId,
    }));

    // ACCOUNTING: IT Equipment (SL, 4 years, 0% salvage)
    const acctIT = await getAssetClassByCode('ACCT-IT-EQUIP');
    await createBelongsToEdge({
      fixedAssetId: depAssetId,
      assetClassId: acctIT!.id,
      classSystem: 'ACCOUNTING',
      effectiveFrom: '2026-01-01',
    });

    // CCA: Class 50 (55% declining balance)
    const cca50 = await getAssetClassByCode('CA-CCA-50');
    await createBelongsToEdge({
      fixedAssetId: depAssetId,
      assetClassId: cca50!.id,
      classSystem: 'CCA',
      effectiveFrom: '2026-01-01',
    });
  });

  it('runs two-pass depreciation with JE posting', async () => {
    const result = await depreciateAsset(depAssetId, testPeriodId);

    // Accounting: SL, 4 years, first year → (4800 / 48) × 0.5 = 50 (half-year first year on ACCT class with FULL_YEAR rule)
    // ACCT-IT-EQUIP has first_year_rule = FULL_YEAR, so no half-year
    // Accounting charge = 4800 / (4 × 12) = 100/month
    expect(result.accountingCharge).toBeCloseTo(100, 0);

    // Tax: CCA 55% DB, first year half-year → (4800 × 0.55/12) × 0.5 = 110
    expect(result.taxCharge).toBeGreaterThan(0);

    // Journal entry posted
    expect(result.journalEntryId).toBeDefined();

    // Temporary difference = tax_base - carrying_amount
    expect(typeof result.temporaryDifference).toBe('number');
  });

  it('updates asset balances after depreciation', async () => {
    const asset = await getFixedAsset(depAssetId);
    expect(Number(asset!.accumulated_depreciation)).toBeGreaterThan(0);
    expect(Number(asset!.carrying_amount)).toBeLessThan(4800);
    expect(Number(asset!.tax_accumulated_dep)).toBeGreaterThan(0);
  });

  it('creates depreciation schedule', async () => {
    const schedule = await getDepreciationSchedule(depAssetId);
    expect(schedule).toBeDefined();
    expect(Array.isArray(schedule!.schedule)).toBe(true);
    expect((schedule!.schedule as any[]).length).toBe(1);
    expect((schedule!.schedule as any[])[0].period_id).toBe(testPeriodId);
  });
});

describe('Batch Depreciation', () => {
  beforeAll(async () => {
    // Create another asset for batch test
    const assetId = track('FixedAsset', await createFixedAsset({
      entityId: testEntityId,
      label: 'Batch Test Desk',
      costAtAcquisition: 960,
      acquisitionDate: '2026-01-01',
      activityRefId: testActivityId,
    }));

    const acctFurn = await getAssetClassByCode('ACCT-FURNITURE');
    await createBelongsToEdge({
      fixedAssetId: assetId,
      assetClassId: acctFurn!.id,
      classSystem: 'ACCOUNTING',
      effectiveFrom: '2026-01-01',
    });
  });

  it('depreciates all active assets for entity', async () => {
    const result = await depreciateAllAssets(testEntityId, testPeriodId);
    expect(result.assetCount).toBeGreaterThanOrEqual(1);
    expect(result.totalAccountingCharge).toBeGreaterThan(0);
    expect(result.journalEntryIds.length).toBeGreaterThanOrEqual(1);
  });
});

describe('UCCPool CCA Calculation', () => {
  let poolId: string;

  beforeAll(async () => {
    const cca50 = await getAssetClassByCode('CA-CCA-50');
    poolId = track('UCCPool', await createUCCPool({
      entityId: testEntityId,
      assetClassId: cca50!.id,
      fiscalYear: '2026',
      openingUcc: 20000,
    }));
  });

  it('calculates CCA with half-year rule', async () => {
    // First, add additions to the pool
    await runCypher(
      `MATCH (u:UCCPool {id: $id}) SET u.additions = 10000`,
      { id: poolId },
    );

    const result = await calculateCCA(poolId);

    // Rate for CCA-50 is 55%
    // Opening: 20000, Additions: 10000, Net additions: 10000
    // Half-year adjustment: 10000 × 0.5 = 5000
    // Base: 20000 + 10000 - 0 - 0 - 5000 = 25000
    // Maximum CCA: 25000 × 0.55 = 13750
    expect(result.ccaMaximum).toBeCloseTo(13750, 0);
    expect(result.ccaClaimed).toBeCloseTo(13750, 0);
    expect(result.closingUcc).toBeCloseTo(16250, 0); // 30000 - 13750
    expect(result.recapture).toBe(0);
    expect(result.terminalLoss).toBe(0);
  });

  it('supports partial CCA claim (discretionary)', async () => {
    // Reset pool
    const cca50 = await getAssetClassByCode('CA-CCA-50');
    const poolId2 = track('UCCPool', await createUCCPool({
      entityId: testEntityId,
      assetClassId: cca50!.id,
      fiscalYear: '2027',
      openingUcc: 15000,
    }));

    const result = await calculateCCA(poolId2, 5000);
    // Maximum would be 15000 × 0.55 = 8250
    expect(result.ccaMaximum).toBeCloseTo(8250, 0);
    expect(result.ccaClaimed).toBe(5000); // Discretionary claim
    expect(result.closingUcc).toBeCloseTo(10000, 0); // 15000 - 5000
  });
});

describe('Asset Disposal', () => {
  let disposalAssetId: string;

  beforeAll(async () => {
    disposalAssetId = track('FixedAsset', await createFixedAsset({
      entityId: testEntityId,
      label: 'To Be Disposed',
      costAtAcquisition: 5000,
      acquisitionDate: '2025-01-01',
      activityRefId: testActivityId,
    }));

    // Simulate some depreciation
    await updateFixedAsset(disposalAssetId, {
      accumulated_depreciation: 2000,
      carrying_amount: 3000,
    });
  });

  it('disposes asset and calculates gain/loss', async () => {
    const result = await disposeFixedAsset(disposalAssetId, '2026-03-15', 3500);
    // Carrying amount was 3000, proceeds 3500 → gain of 500
    expect(result.gainLoss).toBe(500);

    const asset = await getFixedAsset(disposalAssetId);
    expect(asset!.disposal_date).toBeDefined();
    expect(Number(asset!.carrying_amount)).toBe(0);
  });

  it('disposed assets excluded from list', async () => {
    const assets = await listFixedAssets(testEntityId);
    expect(assets.some((a) => a.id === disposalAssetId)).toBe(false);
  });
});
