/**
 * Tax Engine — Integration Tests
 *
 * Tests DeferredTaxPosition computation, current tax, TaxProvision
 * lifecycle (DRAFT → APPROVED → POSTED), tax rate lookup, and
 * deferred tax summary.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { closePg, query } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities, createAccountingPeriod } from '../../src/services/graph/graph-crud-service.js';
import { postJournalEntry } from '../../src/services/gl/journal-posting-service.js';
import {
  getTemporaryDifferences,
  computeDeferredTax,
  getDeferredTaxPositions,
  computeCurrentTax,
  createTaxProvision,
  getTaxProvision,
  listTaxProvisions,
  approveTaxProvision,
  postTaxProvision,
  getApplicableTaxRate,
  getDeferredTaxSummary,
} from '../../src/services/tax/tax-engine-service.js';

let caFpEntityId: string;
let periodId: string;
let fixedAssetId: string;
const cleanupIds: { label: string; id: string }[] = [];

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  caFpEntityId = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'CA')!.id;

  // Create an accounting period for tax computation
  periodId = track('AccountingPeriod', await createAccountingPeriod({
    entityId: caFpEntityId,
    label: 'Tax Test Q3 2026',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
  }));

  // Create a FixedAsset with different carrying_amount and tax_base
  const { v4: uuid } = await import('uuid');
  fixedAssetId = uuid();
  track('FixedAsset', fixedAssetId);

  await runCypher(
    `CREATE (fa:FixedAsset {
       id: $id,
       entity_id: $entityId,
       label: 'Tax Test Equipment',
       cost_at_acquisition: 100000,
       accumulated_depreciation: 20000,
       accumulated_impairment: 0,
       carrying_amount: 80000,
       tax_base: 65000,
       tax_accumulated_dep: 35000,
       acquisition_date: '2025-01-01',
       activity_ref_id: $entityId,
       created_at: datetime(), updated_at: datetime()
     })`,
    { id: fixedAssetId, entityId: caFpEntityId },
  );

  // Post some journal entries to create P&L data for current tax
  await postJournalEntry({
    entityId: caFpEntityId,
    periodId,
    entryType: 'OPERATIONAL',
    reference: 'TAX-TEST-REVENUE',
    narrative: 'Tax test revenue',
    currency: 'CAD',
    validDate: '2026-08-01',
    sourceSystem: 'test',
    lines: [
      { side: 'DEBIT', amount: 500000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
      { side: 'CREDIT', amount: 500000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE' },
    ],
  });

  await postJournalEntry({
    entityId: caFpEntityId,
    periodId,
    entryType: 'OPERATIONAL',
    reference: 'TAX-TEST-EXPENSES',
    narrative: 'Tax test expenses',
    currency: 'CAD',
    validDate: '2026-08-15',
    sourceSystem: 'test',
    lines: [
      { side: 'DEBIT', amount: 300000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE' },
      { side: 'CREDIT', amount: 300000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
    ],
  });
});

afterAll(async () => {
  // Clean up DeferredTaxPosition and TaxProvision nodes
  await runCypher(
    `MATCH (dtp:DeferredTaxPosition {entity_id: $entityId})
     DETACH DELETE dtp`,
    { entityId: caFpEntityId },
  );
  await runCypher(
    `MATCH (tp:TaxProvision {entity_id: $entityId})
     DETACH DELETE tp`,
    { entityId: caFpEntityId },
  );

  // Clean up test nodes
  for (const { label, id } of cleanupIds.reverse()) {
    if (label === 'AccountingPeriod') {
      await runCypher(
        `MATCH (je:JournalEntry {period_id: $id})-[:HAS_LINE]->(ll:LedgerLine)
         DETACH DELETE ll`,
        { id },
      );
      await runCypher(
        `MATCH (je:JournalEntry {period_id: $id})
         DETACH DELETE je`,
        { id },
      );
    }
    await runCypher(`MATCH (n:${label} {id: $id}) DETACH DELETE n`, { id });
  }

  // Clean up TimescaleDB entries
  await query(
    `DELETE FROM gl_period_balances WHERE period_id = $1`,
    [periodId],
  );

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

describe('Temporary Differences', () => {
  it('detects temporary differences on fixed assets', async () => {
    const diffs = await getTemporaryDifferences(caFpEntityId);
    const faDiff = diffs.find((d) => d.sourceNodeId === fixedAssetId);
    expect(faDiff).toBeDefined();
    // carrying_amount (80000) > tax_base (65000) → TAXABLE
    expect(faDiff!.direction).toBe('TAXABLE');
    expect(faDiff!.temporaryDifference).toBe(15000);
    expect(faDiff!.accountingCarryingAmt).toBe(80000);
    expect(faDiff!.taxBase).toBe(65000);
  });

  it('returns source node type for each difference', async () => {
    const diffs = await getTemporaryDifferences(caFpEntityId);
    const faDiff = diffs.find((d) => d.sourceNodeId === fixedAssetId);
    expect(faDiff!.sourceNodeType).toBe('FIXED_ASSET');
  });
});

describe('Deferred Tax Computation', () => {
  it('computes deferred tax positions at given tax rate', async () => {
    const result = await computeDeferredTax({
      entityId: caFpEntityId,
      periodId,
      taxRate: 0.265,
    });

    expect(result.positions.length).toBeGreaterThanOrEqual(1);
    const faPosition = result.positions.find((p) => p.sourceNodeId === fixedAssetId);
    expect(faPosition).toBeDefined();
    // 15000 × 0.265 = 3975
    expect(faPosition!.deferredTaxAmount).toBe(3975);
    expect(faPosition!.direction).toBe('TAXABLE');
  });

  it('creates DeferredTaxPosition nodes in Neo4j', async () => {
    const positions = await getDeferredTaxPositions(caFpEntityId, periodId);
    expect(positions.length).toBeGreaterThanOrEqual(1);
    const faPos = positions.find((p: any) => p.source_node_id === fixedAssetId);
    expect(faPos).toBeDefined();
  });

  it('reports totals for DTA and DTL', async () => {
    // Clean existing first
    await runCypher(
      `MATCH (dtp:DeferredTaxPosition {entity_id: $entityId, period_id: $periodId})
       DELETE dtp`,
      { entityId: caFpEntityId, periodId },
    );

    const result = await computeDeferredTax({
      entityId: caFpEntityId,
      periodId,
      taxRate: 0.265,
    });

    // Our fixed asset creates a DTL (carrying > tax base)
    expect(result.totalDTL).toBeGreaterThan(0);
    expect(result.netDeferredTax).toBeDefined();
  });
});

describe('Current Tax Computation', () => {
  it('computes current tax from P&L data', async () => {
    const result = await computeCurrentTax({
      entityId: caFpEntityId,
      periodId,
      taxRate: 0.265,
    });

    // Revenue 500000 - Expenses 300000 = 200000 accounting income
    expect(result.accountingIncome).toBe(200000);
    expect(result.taxableIncome).toBe(200000);
    // 200000 × 0.265 = 53000
    expect(result.currentTaxExpense).toBe(53000);
  });

  it('applies permanent differences to taxable income', async () => {
    const result = await computeCurrentTax({
      entityId: caFpEntityId,
      periodId,
      taxRate: 0.265,
      permanentDifferences: 10000,
    });

    // 200000 + 10000 = 210000 taxable income
    expect(result.taxableIncome).toBe(210000);
    expect(result.currentTaxExpense).toBe(55650); // 210000 × 0.265
  });

  it('floors taxable income at zero for losses', async () => {
    const result = await computeCurrentTax({
      entityId: caFpEntityId,
      periodId,
      taxRate: 0.265,
      permanentDifferences: -300000,
    });

    expect(result.taxableIncome).toBe(0);
    expect(result.currentTaxExpense).toBe(0);
  });
});

describe('Tax Provision', () => {
  let provisionId: string;

  it('creates a DRAFT TaxProvision combining current + deferred tax', async () => {
    // Clean up any prior DTP for this period
    await runCypher(
      `MATCH (dtp:DeferredTaxPosition {entity_id: $entityId, period_id: $periodId})
       DELETE dtp`,
      { entityId: caFpEntityId, periodId },
    );

    const result = await createTaxProvision({
      entityId: caFpEntityId,
      periodId,
      taxRate: 0.265,
    });

    provisionId = result.id;
    expect(result.status).toBe('DRAFT');
    expect(result.currentTaxExpense).toBeGreaterThan(0);
    expect(result.totalTaxExpense).toBeDefined();
    expect(result.effectiveTaxRate).toBeGreaterThan(0);
    expect(result.deferredTaxDetails).toBeDefined();
  });

  it('retrieves TaxProvision by ID', async () => {
    const provision = await getTaxProvision(provisionId);
    expect(provision).not.toBeNull();
    expect((provision as any).status).toBe('DRAFT');
    expect((provision as any).entity_id).toBe(caFpEntityId);
  });

  it('lists TaxProvisions for entity', async () => {
    const provisions = await listTaxProvisions(caFpEntityId);
    expect(provisions.length).toBeGreaterThanOrEqual(1);
    expect(provisions.some((p: any) => p.id === provisionId)).toBe(true);
  });

  it('applies tax credits to reduce total tax expense', async () => {
    await runCypher(
      `MATCH (dtp:DeferredTaxPosition {entity_id: $entityId, period_id: $periodId})
       DELETE dtp`,
      { entityId: caFpEntityId, periodId },
    );

    const withCredits = await createTaxProvision({
      entityId: caFpEntityId,
      periodId,
      taxRate: 0.265,
      creditAmount: 5000,
    });

    expect(withCredits.creditAmount).toBe(5000);
    const expectedTotal = withCredits.currentTaxExpense + withCredits.deferredTaxMovement - 5000;
    expect(withCredits.totalTaxExpense).toBeCloseTo(expectedTotal, 2);
  });

  it('approves a DRAFT provision (DRAFT → APPROVED)', async () => {
    const approved = await approveTaxProvision(provisionId);
    expect((approved as any).status).toBe('APPROVED');
  });

  it('rejects approval of non-DRAFT provision', async () => {
    await expect(approveTaxProvision(provisionId)).rejects.toThrow('not in DRAFT status');
  });

  it('posts an APPROVED provision (APPROVED → POSTED)', async () => {
    const { v4: uuid } = await import('uuid');
    const jeId = uuid();
    const posted = await postTaxProvision(provisionId, jeId);
    expect((posted as any).status).toBe('POSTED');
    expect((posted as any).journal_entry_id).toBe(jeId);
  });

  it('rejects posting of non-APPROVED provision', async () => {
    const { v4: uuid } = await import('uuid');
    await expect(postTaxProvision(provisionId, uuid())).rejects.toThrow('not in APPROVED status');
  });
});

describe('Tax Rate Lookup', () => {
  it('returns CA default rates for Canadian entity', async () => {
    const rate = await getApplicableTaxRate(caFpEntityId);
    expect(rate.federalRate).toBe(0.15);
    expect(rate.provincialRate).toBe(0.115);
    expect(rate.combinedRate).toBe(0.265);
  });

  it('throws for non-existent entity', async () => {
    await expect(getApplicableTaxRate('nonexistent-id')).rejects.toThrow('not found');
  });
});

describe('Deferred Tax Summary', () => {
  it('provides summary with DTA/DTL totals and breakdown by source type', async () => {
    const summary = await getDeferredTaxSummary(caFpEntityId);
    expect(summary.positionCount).toBeGreaterThanOrEqual(1);
    expect(summary.bySourceType.length).toBeGreaterThanOrEqual(1);
    expect(summary.bySourceType.some((s) => s.sourceType === 'FIXED_ASSET')).toBe(true);
  });
});
