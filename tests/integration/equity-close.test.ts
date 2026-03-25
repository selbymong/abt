/**
 * Equity Close — Integration Tests
 *
 * Tests RetainedEarnings computation, OCI recording, recycling enforcement,
 * EquitySection generation, and equity_period_balances projection.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { query, closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities, createAccountingPeriod } from '../../src/services/graph/graph-crud-service.js';
import { postJournalEntry } from '../../src/services/gl/journal-posting-service.js';
import {
  computeRetainedEarnings,
  getRetainedEarnings,
  recordOCI,
  recycleOCI,
  getOCIComponents,
  isRecyclable,
  generateEquitySection,
  getEquitySection,
  getEquityBreakdown,
} from '../../src/services/gl/equity-close-service.js';

let caFpEntityId: string;
let periodId: string;
const cleanupIds: { label: string; id: string }[] = [];
const cleanupJeIds: string[] = [];

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  caFpEntityId = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'CA')!.id;

  periodId = track('AccountingPeriod', await createAccountingPeriod({
    entityId: caFpEntityId,
    label: 'Equity Close Test Period',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
  }));

  // Post revenue and expense transactions
  const revenueJeId = await postJournalEntry({
    entityId: caFpEntityId,
    periodId,
    entryType: 'OPERATIONAL',
    reference: 'EQUITY-TEST-REVENUE',
    narrative: 'Test revenue for equity close',
    currency: 'CAD',
    validDate: '2026-02-15',
    sourceSystem: 'test',
    lines: [
      { side: 'DEBIT', amount: 50000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
      { side: 'CREDIT', amount: 50000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE' },
    ],
  });
  cleanupJeIds.push(revenueJeId);

  const expenseJeId = await postJournalEntry({
    entityId: caFpEntityId,
    periodId,
    entryType: 'OPERATIONAL',
    reference: 'EQUITY-TEST-EXPENSE',
    narrative: 'Test expense for equity close',
    currency: 'CAD',
    validDate: '2026-02-15',
    sourceSystem: 'test',
    lines: [
      { side: 'DEBIT', amount: 20000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE' },
      { side: 'CREDIT', amount: 20000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
    ],
  });
  cleanupJeIds.push(expenseJeId);
});

afterAll(async () => {
  // Clean up TimescaleDB
  await query('DELETE FROM gl_period_balances WHERE period_id = $1', [periodId]);
  await query('DELETE FROM equity_period_balances WHERE period_id = $1', [periodId]);

  // Clean up JEs
  for (const jeId of cleanupJeIds) {
    await runCypher('MATCH (l:LedgerLine {journal_entry_id: $id}) DELETE l', { id: jeId });
    await runCypher('MATCH (j:JournalEntry {id: $id}) DELETE j', { id: jeId });
  }

  // Clean up equity nodes
  for (const { label, id } of cleanupIds) {
    await runCypher(`MATCH (n:${label} {id: $id}) DETACH DELETE n`, { id });
  }

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

describe('RetainedEarnings', () => {
  let reId: string;

  it('computes retained earnings from P&L', async () => {
    reId = track('RetainedEarnings', await computeRetainedEarnings({
      entityId: caFpEntityId,
      periodId,
    }));
    expect(reId).toBeDefined();
  });

  it('has correct net income (revenue - expenses)', async () => {
    const re = await getRetainedEarnings(caFpEntityId, periodId);
    expect(re).toBeDefined();
    // Revenue: 50000, Expenses: 20000, Net Income: 30000
    expect(Number(re!.net_income)).toBe(30000);
    expect(Number(re!.opening_balance)).toBe(0); // no prior period
    expect(Number(re!.closing_balance)).toBe(30000);
  });

  it('applies dividends and adjustments', async () => {
    // Create a second period to test dividends
    const period2Id = track('AccountingPeriod', await createAccountingPeriod({
      entityId: caFpEntityId,
      label: 'Equity Close Test Period 2',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
    }));

    // Post some revenue in period 2
    const jeId = await postJournalEntry({
      entityId: caFpEntityId,
      periodId: period2Id,
      entryType: 'OPERATIONAL',
      reference: 'EQUITY-TEST-REV-P2',
      narrative: 'Period 2 revenue',
      currency: 'CAD',
      validDate: '2026-03-15',
      sourceSystem: 'test',
      lines: [
        { side: 'DEBIT', amount: 40000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
        { side: 'CREDIT', amount: 40000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE' },
      ],
    });
    cleanupJeIds.push(jeId);

    const re2Id = track('RetainedEarnings', await computeRetainedEarnings({
      entityId: caFpEntityId,
      periodId: period2Id,
      dividendsDeclared: 5000,
      otherAdjustments: 2000,
    }));

    const re2 = await getRetainedEarnings(caFpEntityId, period2Id);
    expect(Number(re2!.opening_balance)).toBe(30000); // from period 1
    expect(Number(re2!.net_income)).toBe(40000);
    expect(Number(re2!.dividends_declared)).toBe(5000);
    expect(Number(re2!.other_adjustments)).toBe(2000);
    // closing = 30000 + 40000 - 5000 + 2000 = 67000
    expect(Number(re2!.closing_balance)).toBe(67000);

    // Clean up period 2 TimescaleDB
    await query('DELETE FROM gl_period_balances WHERE period_id = $1', [period2Id]);
    await query('DELETE FROM equity_period_balances WHERE period_id = $1', [period2Id]);
  });

  it('projects to equity_period_balances', async () => {
    const breakdown = await getEquityBreakdown(caFpEntityId, periodId);
    const reRow = breakdown.find((r) => r.component === 'RETAINED_EARNINGS');
    expect(reRow).toBeDefined();
    expect(reRow!.openingBalance).toBe(0);
    expect(reRow!.closingBalance).toBe(30000);
  });
});

describe('OtherComprehensiveIncome', () => {
  let ctaId: string;
  let fvociEquityId: string;

  it('records CTA component', async () => {
    ctaId = track('OtherComprehensiveIncome', await recordOCI({
      entityId: caFpEntityId,
      periodId,
      component: 'CTA_COMPONENT',
      currentPeriod: 1500,
      sourceNodeType: 'CURRENCY_TRANSLATION',
    }));
    expect(ctaId).toBeDefined();
  });

  it('records FVOCI_EQUITY component', async () => {
    fvociEquityId = track('OtherComprehensiveIncome', await recordOCI({
      entityId: caFpEntityId,
      periodId,
      component: 'FVOCI_EQUITY',
      currentPeriod: 3000,
      sourceNodeType: 'FINANCIAL_INSTRUMENT',
    }));
    expect(fvociEquityId).toBeDefined();
  });

  it('retrieves OCI components for entity/period', async () => {
    const components = await getOCIComponents(caFpEntityId, periodId);
    expect(components.length).toBeGreaterThanOrEqual(2);
    const cta = components.find((c: any) => c.component === 'CTA_COMPONENT');
    expect(cta).toBeDefined();
    expect(Number(cta!.current_period)).toBe(1500);
    expect(Number(cta!.closing_balance)).toBe(1500);
  });

  it('projects OCI to equity_period_balances', async () => {
    const breakdown = await getEquityBreakdown(caFpEntityId, periodId);
    const ctaRow = breakdown.find((r) => r.component === 'OCI_CTA_COMPONENT');
    expect(ctaRow).toBeDefined();
    expect(ctaRow!.closingBalance).toBe(1500);
  });
});

describe('OCI Recycling', () => {
  it('isRecyclable returns true for recyclable components', () => {
    expect(isRecyclable('CTA_COMPONENT')).toBe(true);
    expect(isRecyclable('CASHFLOW_HEDGE')).toBe(true);
    expect(isRecyclable('NET_INVESTMENT_HEDGE')).toBe(true);
    expect(isRecyclable('FVOCI_DEBT')).toBe(true);
  });

  it('isRecyclable returns false for non-recycling components', () => {
    expect(isRecyclable('FVOCI_EQUITY')).toBe(false);
    expect(isRecyclable('DB_PENSION')).toBe(false);
    expect(isRecyclable('REVALUATION_SURPLUS')).toBe(false);
  });

  it('recycles CTA to P&L', async () => {
    // Find CTA OCI node
    const components = await getOCIComponents(caFpEntityId, periodId);
    const cta = components.find((c: any) => c.component === 'CTA_COMPONENT');
    expect(cta).toBeDefined();

    const result = await recycleOCI(cta!.id as string, 500);
    expect(result).toBe(true);

    // Verify updated values
    const updated = await getOCIComponents(caFpEntityId, periodId);
    const ctaUpdated = updated.find((c: any) => c.component === 'CTA_COMPONENT');
    expect(Number(ctaUpdated!.recycled_to_pnl)).toBe(500);
    // closing = opening(0) + current(1500) - recycled(500) = 1000
    expect(Number(ctaUpdated!.closing_balance)).toBe(1000);
  });

  it('throws when recycling non-recycling component (FVOCI_EQUITY)', async () => {
    const components = await getOCIComponents(caFpEntityId, periodId);
    const fvoci = components.find((c: any) => c.component === 'FVOCI_EQUITY');
    expect(fvoci).toBeDefined();

    await expect(
      recycleOCI(fvoci!.id as string, 1000),
    ).rejects.toThrow(/non-recycling OCI component/);
  });

  it('throws when recycling DB_PENSION', async () => {
    // Record a DB_PENSION component
    const pensionId = track('OtherComprehensiveIncome', await recordOCI({
      entityId: caFpEntityId,
      periodId,
      component: 'DB_PENSION',
      currentPeriod: 2000,
      sourceNodeType: 'PENSION',
    }));

    await expect(
      recycleOCI(pensionId, 500),
    ).rejects.toThrow(/non-recycling OCI component/);
  });
});

describe('EquitySection', () => {
  let esSectionId: string;

  it('generates equity section presentation node', async () => {
    esSectionId = track('EquitySection', await generateEquitySection(
      caFpEntityId,
      periodId,
      10000, // NCI equity
    ));
    expect(esSectionId).toBeDefined();
  });

  it('has correct aggregated values', async () => {
    const es = await getEquitySection(caFpEntityId, periodId);
    expect(es).toBeDefined();
    expect(Number(es!.retained_earnings)).toBe(30000);
    // OCI: CTA(1000 after recycle) + FVOCI_EQUITY(3000) + DB_PENSION(2000) = 6000
    expect(Number(es!.accumulated_oci)).toBe(6000);
    // Total equity = share_capital(0) + RE(30000) + OCI(6000) = 36000
    expect(Number(es!.total_equity)).toBe(36000);
    expect(Number(es!.nci_equity)).toBe(10000);
    // Total with NCI = 36000 + 10000 = 46000
    expect(Number(es!.total_equity_and_nci)).toBe(46000);
  });

  it('retrieves equity section by entity/period', async () => {
    const es = await getEquitySection(caFpEntityId, periodId);
    expect(es).toBeDefined();
    expect(es!.entity_id).toBe(caFpEntityId);
    expect(es!.period_id).toBe(periodId);
  });
});

describe('Equity Breakdown (CQRS)', () => {
  it('returns all equity components from TimescaleDB', async () => {
    const breakdown = await getEquityBreakdown(caFpEntityId, periodId);
    expect(breakdown.length).toBeGreaterThanOrEqual(3); // RE + OCI_CTA + OCI_FVOCI_EQUITY + OCI_DB_PENSION
    const components = breakdown.map((r) => r.component);
    expect(components).toContain('RETAINED_EARNINGS');
    expect(components).toContain('OCI_CTA_COMPONENT');
    expect(components).toContain('OCI_FVOCI_EQUITY');
  });

  it('recycled_to_pnl reflected in breakdown', async () => {
    const breakdown = await getEquityBreakdown(caFpEntityId, periodId);
    const ctaRow = breakdown.find((r) => r.component === 'OCI_CTA_COMPONENT');
    expect(ctaRow).toBeDefined();
    expect(ctaRow!.recycledToPnl).toBe(500);
    expect(ctaRow!.closingBalance).toBe(1000);
  });
});
