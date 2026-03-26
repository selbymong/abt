/**
 * Tax Modules — Integration Tests
 *
 * Tests 7 jurisdiction-specific tax modules:
 * CRA Corporate, GST/HST, IRS Corporate, CRA Charity,
 * IRS Exempt, State Tax, Withholding Tax.
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
  computeCRACorporate,
  computeGSTHST,
  computeIRSCorporate,
  computeCRACharity,
  computeIRSExempt,
  computeStateTax,
  computeWithholdingTax,
  getTaxModuleResults,
  getTaxModuleResult,
  computeAllModules,
} from '../../src/services/tax/tax-modules-service.js';

let caFpEntityId: string;
let caNfpEntityId: string;
let usFpEntityId: string;
let usNfpEntityId: string;
let periodId: string;
const cleanupIds: { label: string; id: string }[] = [];

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  caFpEntityId = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'CA')!.id;
  caNfpEntityId = entities.find((e) => e.entity_type === 'NOT_FOR_PROFIT' && e.jurisdiction === 'CA')!.id;
  usFpEntityId = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'US')!.id;
  usNfpEntityId = entities.find((e) => e.entity_type === 'NOT_FOR_PROFIT' && e.jurisdiction === 'US')!.id;

  // Create accounting period
  periodId = track('AccountingPeriod', await createAccountingPeriod({
    entityId: caFpEntityId,
    label: 'Tax Modules Q4 2026',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
  }));

  // Post P&L data for CA FP entity
  await postJournalEntry({
    entityId: caFpEntityId,
    periodId,
    entryType: 'OPERATIONAL',
    reference: 'TAX-MOD-REVENUE',
    narrative: 'Revenue for tax module tests',
    currency: 'CAD',
    validDate: '2026-11-01',
    sourceSystem: 'test',
    lines: [
      { side: 'DEBIT', amount: 400000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
      { side: 'CREDIT', amount: 400000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE' },
    ],
  });

  await postJournalEntry({
    entityId: caFpEntityId,
    periodId,
    entryType: 'OPERATIONAL',
    reference: 'TAX-MOD-EXPENSE',
    narrative: 'Expenses for tax module tests',
    currency: 'CAD',
    validDate: '2026-11-15',
    sourceSystem: 'test',
    lines: [
      { side: 'DEBIT', amount: 200000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE' },
      { side: 'CREDIT', amount: 200000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
    ],
  });
});

afterAll(async () => {
  // Clean up TaxModuleResult nodes
  await runCypher(`MATCH (tm:TaxModuleResult) WHERE tm.period_id = $periodId DETACH DELETE tm`, { periodId });

  for (const { label, id } of cleanupIds.reverse()) {
    if (label === 'AccountingPeriod') {
      await runCypher(`MATCH (je:JournalEntry {period_id: $id})-[:HAS_LINE]->(ll:LedgerLine) DETACH DELETE ll`, { id });
      await runCypher(`MATCH (je:JournalEntry {period_id: $id}) DETACH DELETE je`, { id });
    }
    await runCypher(`MATCH (n:${label} {id: $id}) DETACH DELETE n`, { id });
  }

  await query(`DELETE FROM gl_period_balances WHERE period_id = $1`, [periodId]);

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

describe('CRA Corporate (T2)', () => {
  it('computes federal corporate tax with small business deduction', async () => {
    const result = await computeCRACorporate({
      entityId: caFpEntityId,
      periodId,
    });

    expect(result.moduleName).toBe('CRA_CORPORATE');
    expect(result.jurisdiction).toBe('CA');
    expect(result.filingReference).toBe('T2');
    expect(result.taxRate).toBe(0.15);
    // 200000 income × 15% = 30000, less SBD on first $200K (200000 × 6% = 12000)
    // Tax = 30000 - 12000 = 18000
    expect(result.taxAmount).toBe(18000);
    expect(result.adjustments.length).toBeGreaterThanOrEqual(1);
    expect(result.adjustments.some((a) => a.description.includes('Small business'))).toBe(true);
  });

  it('stores result as TaxModuleResult node', async () => {
    const stored = await getTaxModuleResult(
      (await computeCRACorporate({ entityId: caFpEntityId, periodId })).moduleId,
    );
    expect(stored).not.toBeNull();
    expect((stored as any).module_name).toBe('CRA_CORPORATE');
  });
});

describe('GST/HST', () => {
  it('computes net GST for for-profit entity with ITCs', async () => {
    const result = await computeGSTHST({
      entityId: caFpEntityId,
      periodId,
      salesAmount: 100000,
      purchasesAmount: 60000,
      gstRate: 0.05,
    });

    expect(result.moduleName).toBe('GST_HST');
    expect(result.filingReference).toBe('GST34');
    // GST collected: 100000 × 5% = 5000
    // ITCs: 60000 × 5% = 3000
    // Net: 2000
    expect(result.taxAmount).toBe(2000);
  });

  it('applies 50% public service bodies rebate for NFP', async () => {
    const result = await computeGSTHST({
      entityId: caNfpEntityId,
      periodId,
      salesAmount: 50000,
      purchasesAmount: 30000,
      gstRate: 0.05,
      isNFP: true,
    });

    // GST collected: 2500, ITCs: 1500, Net before rebate: 1000
    // 50% rebate: 500, Net: 500
    expect(result.taxAmount).toBe(500);
    expect(result.adjustments.some((a) => a.description.includes('rebate'))).toBe(true);
  });

  it('supports HST rates', async () => {
    const result = await computeGSTHST({
      entityId: caFpEntityId,
      periodId,
      salesAmount: 100000,
      purchasesAmount: 40000,
      hstRate: 0.13, // Ontario HST
    });

    // HST collected: 13000, ITCs: 5200, Net: 7800
    expect(result.taxAmount).toBe(7800);
    expect(result.taxRate).toBe(0.13);
  });
});

describe('IRS Corporate (Form 1120)', () => {
  it('computes US federal corporate tax at 21%', async () => {
    // US FP entity needs P&L data — create period and JEs for it
    const usPeriodId = track('AccountingPeriod', await createAccountingPeriod({
      entityId: usFpEntityId,
      label: 'US Tax Test Q4 2026',
      startDate: '2026-10-01',
      endDate: '2026-12-31',
    }));

    await postJournalEntry({
      entityId: usFpEntityId,
      periodId: usPeriodId,
      entryType: 'OPERATIONAL',
      reference: 'US-TAX-REVENUE',
      narrative: 'US revenue',
      currency: 'USD',
      validDate: '2026-11-01',
      sourceSystem: 'test',
      lines: [
        { side: 'DEBIT', amount: 1000000, nodeRefId: usFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
        { side: 'CREDIT', amount: 1000000, nodeRefId: usFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE' },
      ],
    });

    await postJournalEntry({
      entityId: usFpEntityId,
      periodId: usPeriodId,
      entryType: 'OPERATIONAL',
      reference: 'US-TAX-EXPENSE',
      narrative: 'US expenses',
      currency: 'USD',
      validDate: '2026-11-15',
      sourceSystem: 'test',
      lines: [
        { side: 'DEBIT', amount: 600000, nodeRefId: usFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE' },
        { side: 'CREDIT', amount: 600000, nodeRefId: usFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
      ],
    });

    const result = await computeIRSCorporate({
      entityId: usFpEntityId,
      periodId: usPeriodId,
    });

    expect(result.moduleName).toBe('IRS_CORPORATE');
    expect(result.filingReference).toBe('Form 1120');
    expect(result.taxRate).toBe(0.21);
    // 400000 × 21% = 84000
    expect(result.taxAmount).toBe(84000);

    // Clean up US period data
    await query(`DELETE FROM gl_period_balances WHERE period_id = $1`, [usPeriodId]);
    await runCypher(`MATCH (tm:TaxModuleResult {period_id: $periodId}) DETACH DELETE tm`, { periodId: usPeriodId });
  });

  it('applies §179 deduction', async () => {
    const result = await computeIRSCorporate({
      entityId: caFpEntityId, // Uses CA entity with existing P&L for simplicity
      periodId,
      section179Deduction: 50000,
    });

    expect(result.adjustments.some((a) => a.description.includes('§179'))).toBe(true);
  });
});

describe('CRA Charity (T3010)', () => {
  it('computes zero tax for registered charity', async () => {
    const result = await computeCRACharity({
      entityId: caNfpEntityId,
      periodId,
      totalRevenue: 100000,
      charitableExpenditures: 80000,
      managementExpenses: 20000,
    });

    expect(result.moduleName).toBe('CRA_CHARITY');
    expect(result.filingReference).toBe('T3010');
    expect(result.taxAmount).toBe(0);
    expect(result.adjustments.some((a) => a.description.includes('exemption'))).toBe(true);
  });

  it('checks disbursement quota', async () => {
    const result = await computeCRACharity({
      entityId: caNfpEntityId,
      periodId,
      totalRevenue: 100000,
      charitableExpenditures: 2000, // below 3.5%
      managementExpenses: 98000,
    });

    expect(result.adjustments.some((a) => a.description.includes('Disbursement'))).toBe(true);
  });
});

describe('IRS Exempt (Form 990)', () => {
  it('computes UBIT on unrelated business income', async () => {
    const result = await computeIRSExempt({
      entityId: usNfpEntityId,
      periodId,
      totalRevenue: 500000,
      publicSupportRevenue: 200000,
      unrelatedBusinessIncome: 50000,
    });

    expect(result.moduleName).toBe('IRS_EXEMPT');
    expect(result.filingReference).toBe('Form 990');
    // UBIT: (50000 - 1000) × 21% = 10290
    expect(result.taxAmount).toBe(10290);
  });

  it('computes zero UBIT below $1000 threshold', async () => {
    const result = await computeIRSExempt({
      entityId: usNfpEntityId,
      periodId,
      totalRevenue: 100000,
      publicSupportRevenue: 50000,
      unrelatedBusinessIncome: 800,
    });

    expect(result.taxAmount).toBe(0);
  });

  it('checks public support test', async () => {
    const result = await computeIRSExempt({
      entityId: usNfpEntityId,
      periodId,
      totalRevenue: 100000,
      publicSupportRevenue: 40000, // 40% > 33% → passes
    });

    expect(result.adjustments.some((a) =>
      a.description.includes('Public support') && a.adjustmentType === 'EXEMPTION',
    )).toBe(true);
  });
});

describe('State Tax', () => {
  it('computes state tax with nexus', async () => {
    const result = await computeStateTax({
      entityId: caFpEntityId,
      periodId,
      stateCode: 'CA-ON',
      stateRate: 0.115,
      nexusEstablished: true,
    });

    expect(result.moduleName).toBe('STATE_TAX');
    expect(result.jurisdiction).toBe('CA-ON');
    // 200000 × 11.5% = 23000
    expect(result.taxAmount).toBe(23000);
  });

  it('returns zero tax when no nexus', async () => {
    const result = await computeStateTax({
      entityId: caFpEntityId,
      periodId,
      stateCode: 'US-NY',
      stateRate: 0.065,
      nexusEstablished: false,
    });

    expect(result.taxAmount).toBe(0);
    expect(result.adjustments.some((a) => a.description.includes('No nexus'))).toBe(true);
  });

  it('applies apportionment factor', async () => {
    const result = await computeStateTax({
      entityId: caFpEntityId,
      periodId,
      stateCode: 'CA-ON',
      stateRate: 0.115,
      nexusEstablished: true,
      apportionmentFactor: 0.5,
    });

    // 200000 × 0.5 = 100000 apportioned income × 11.5% = 11500
    expect(result.taxAmount).toBe(11500);
    expect(result.taxableIncome).toBe(100000);
  });
});

describe('Withholding Tax', () => {
  it('computes dividend withholding at treaty rate', async () => {
    const result = await computeWithholdingTax({
      entityId: caFpEntityId,
      periodId,
      sourceEntityId: caFpEntityId,
      targetEntityId: usFpEntityId,
      paymentType: 'DIVIDEND',
      grossAmount: 100000,
    });

    expect(result.moduleName).toBe('WITHHOLDING_TAX');
    expect(result.jurisdiction).toBe('CROSS_BORDER');
    // Default dividend treaty rate: 5%
    expect(result.taxRate).toBe(0.05);
    expect(result.taxAmount).toBe(5000);
  });

  it('applies zero rate for interest under treaty', async () => {
    const result = await computeWithholdingTax({
      entityId: caFpEntityId,
      periodId,
      sourceEntityId: caFpEntityId,
      targetEntityId: usFpEntityId,
      paymentType: 'INTEREST',
      grossAmount: 50000,
    });

    expect(result.taxRate).toBe(0);
    expect(result.taxAmount).toBe(0);
  });

  it('supports custom treaty rate override', async () => {
    const result = await computeWithholdingTax({
      entityId: caFpEntityId,
      periodId,
      sourceEntityId: caFpEntityId,
      targetEntityId: usFpEntityId,
      paymentType: 'ROYALTY',
      grossAmount: 200000,
      treatyRate: 0.15,
    });

    expect(result.taxRate).toBe(0.15);
    expect(result.taxAmount).toBe(30000);
  });
});

describe('Module Results', () => {
  it('retrieves all module results for entity/period', async () => {
    const results = await getTaxModuleResults(caFpEntityId, periodId);
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('computes all applicable modules for CA FP entity', async () => {
    const results = await computeAllModules(caFpEntityId, periodId);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.moduleName === 'CRA_CORPORATE')).toBe(true);
  });
});
