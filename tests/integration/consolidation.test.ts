/**
 * Consolidation — Integration Tests
 *
 * Tests ConsolidationGroup, OwnershipInterest, intercompany matching,
 * FX translation, goodwill, and consolidated financial reporting.
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
  createConsolidationGroup,
  getConsolidationGroup,
  getConsolidationGroupForEntity,
  createOwnershipInterest,
  getOwnershipInterest,
  listOwnershipInterests,
  createIntercompanyMatch,
  createGoodwill,
  getGoodwill,
  impairGoodwill,
  translateCurrency,
  getCurrencyTranslation,
  getConsolidatedPnL,
  getConsolidatedBalanceSheet,
} from '../../src/services/consolidation/consolidation-service.js';

let caFpEntityId: string;   // CA for-profit (parent)
let usFpEntityId: string;   // US for-profit (subsidiary)
let periodId: string;
let groupId: string;
const cleanupIds: { label: string; id: string }[] = [];
const cleanupJeIds: string[] = [];

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
    label: 'Consolidation Test Period',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  }));

  // Post some transactions to each entity for reporting tests
  const caJeId = await postJournalEntry({
    entityId: caFpEntityId,
    periodId,
    entryType: 'OPERATIONAL',
    reference: 'CONSOL-TEST-CA-REVENUE',
    narrative: 'CA entity revenue',
    currency: 'CAD',
    validDate: '2026-01-15',
    sourceSystem: 'test',
    lines: [
      { side: 'DEBIT', amount: 100000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
      { side: 'CREDIT', amount: 100000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE' },
    ],
  });
  cleanupJeIds.push(caJeId);

  const usJeId = await postJournalEntry({
    entityId: usFpEntityId,
    periodId,
    entryType: 'OPERATIONAL',
    reference: 'CONSOL-TEST-US-REVENUE',
    narrative: 'US entity revenue',
    currency: 'USD',
    validDate: '2026-01-15',
    sourceSystem: 'test',
    lines: [
      { side: 'DEBIT', amount: 80000, nodeRefId: usFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
      { side: 'CREDIT', amount: 80000, nodeRefId: usFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE' },
    ],
  });
  cleanupJeIds.push(usJeId);
});

afterAll(async () => {
  // Clean up TimescaleDB
  await query('DELETE FROM gl_period_balances WHERE period_id = $1', [periodId]);

  // Clean up intercompany match edges
  await runCypher(`MATCH ()-[r:INTERCOMPANY_MATCH]->() DELETE r`);

  // Clean up JEs
  for (const jeId of cleanupJeIds) {
    await runCypher('MATCH (l:LedgerLine {journal_entry_id: $id}) DELETE l', { id: jeId });
    await runCypher('MATCH (j:JournalEntry {id: $id}) DELETE j', { id: jeId });
  }

  // Clean up consolidation entities
  for (const { label, id } of cleanupIds) {
    await runCypher(`MATCH (n:${label} {id: $id}) DETACH DELETE n`, { id });
  }

  // Reset entity consolidation_group_id
  await runCypher(
    `MATCH (e:Entity) WHERE e.id IN [$caId, $usId]
     REMOVE e.consolidation_group_id`,
    { caId: caFpEntityId, usId: usFpEntityId },
  );

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

describe('ConsolidationGroup', () => {
  it('creates a consolidation group', async () => {
    groupId = track('ConsolidationGroup', await createConsolidationGroup({
      label: 'Test Consolidation Group',
      parentEntityId: caFpEntityId,
      functionalCurrency: 'CAD',
      entityIds: [caFpEntityId, usFpEntityId],
      minorityInterestMethod: 'PROPORTIONATE',
      intercompanyThreshold: 1000,
    }));
    expect(groupId).toBeDefined();
  });

  it('retrieves consolidation group', async () => {
    const group = await getConsolidationGroup(groupId);
    expect(group).toBeDefined();
    expect(group!.parent_entity_id).toBe(caFpEntityId);
    expect(group!.functional_currency).toBe('CAD');
    expect((group!.entity_ids as string[])).toHaveLength(2);
    expect(group!.minority_interest_method).toBe('PROPORTIONATE');
    expect(Number(group!.intercompany_threshold)).toBe(1000);
  });

  it('retrieves group for entity', async () => {
    const group = await getConsolidationGroupForEntity(caFpEntityId);
    expect(group).toBeDefined();
    expect(group!.id).toBe(groupId);
  });
});

describe('OwnershipInterest', () => {
  let ownershipId: string;

  it('creates ownership interest with goodwill calculation', async () => {
    ownershipId = track('OwnershipInterest', await createOwnershipInterest({
      investorEntityId: caFpEntityId,
      investeeEntityId: usFpEntityId,
      ownershipPct: 0.80,
      acquisitionCost: 500000,
      netAssetsAtAcquisition: 400000,
      acquisitionDate: '2025-01-01',
    }));
    expect(ownershipId).toBeDefined();
  });

  it('calculates goodwill correctly', async () => {
    const oi = await getOwnershipInterest(ownershipId);
    expect(oi).toBeDefined();
    expect(Number(oi!.ownership_pct)).toBe(0.80);
    // Goodwill = 500000 - (0.80 × 400000) = 500000 - 320000 = 180000
    expect(Number(oi!.goodwill)).toBe(180000);
    expect(Number(oi!.carrying_value)).toBe(500000);
  });

  it('lists ownership interests by investor', async () => {
    const interests = await listOwnershipInterests(caFpEntityId);
    expect(interests.length).toBeGreaterThanOrEqual(1);
    expect(interests.some((oi: any) => oi.id === ownershipId)).toBe(true);
  });
});

describe('Goodwill', () => {
  let goodwillId: string;

  it('creates goodwill node', async () => {
    goodwillId = track('Goodwill', await createGoodwill({
      acquireeEntityId: usFpEntityId,
      grossAmount: 180000,
      currency: 'CAD',
      isFullGoodwill: false,
      taxDeductible: false,
    }));
    expect(goodwillId).toBeDefined();
  });

  it('goodwill has correct initial values', async () => {
    const gw = await getGoodwill(goodwillId);
    expect(Number(gw!.gross_amount)).toBe(180000);
    expect(Number(gw!.accumulated_impairment)).toBe(0);
    expect(Number(gw!.carrying_amount)).toBe(180000);
    expect(gw!.is_full_goodwill).toBe(false);
    expect(gw!.tax_deductible).toBe(false);
    expect(Number(gw!.tax_base)).toBe(0);
  });

  it('impairs goodwill (never reverses)', async () => {
    const result = await impairGoodwill(goodwillId, 30000, '2026-01-31');
    expect(result).toBe(true);

    const gw = await getGoodwill(goodwillId);
    expect(Number(gw!.accumulated_impairment)).toBe(30000);
    expect(Number(gw!.carrying_amount)).toBe(150000);
    expect(gw!.last_test_result).toBe('IMPAIRED');
  });
});

describe('Intercompany Matching', () => {
  it('creates intercompany match between ledger lines', async () => {
    // Create intercompany sale: CA sells to US
    const sellerJeId = await postJournalEntry({
      entityId: caFpEntityId,
      periodId,
      entryType: 'OPERATIONAL',
      reference: 'IC-SALE-SELLER',
      narrative: 'Intercompany sale to US subsidiary',
      currency: 'CAD',
      validDate: '2026-01-20',
      sourceSystem: 'test',
      lines: [
        { side: 'DEBIT', amount: 25000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
        { side: 'CREDIT', amount: 25000, nodeRefId: caFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE' },
      ],
    });
    cleanupJeIds.push(sellerJeId);

    const buyerJeId = await postJournalEntry({
      entityId: usFpEntityId,
      periodId,
      entryType: 'OPERATIONAL',
      reference: 'IC-SALE-BUYER',
      narrative: 'Intercompany purchase from CA parent',
      currency: 'USD',
      validDate: '2026-01-20',
      sourceSystem: 'test',
      lines: [
        { side: 'DEBIT', amount: 25000, nodeRefId: usFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE' },
        { side: 'CREDIT', amount: 25000, nodeRefId: usFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
      ],
    });
    cleanupJeIds.push(buyerJeId);

    // Get ledger line IDs
    const sellerLines = await runCypher<{ id: string }>(
      `MATCH (l:LedgerLine {journal_entry_id: $jeId})
       WHERE l.economic_category = 'REVENUE'
       RETURN l.id AS id`,
      { jeId: sellerJeId },
    );
    const buyerLines = await runCypher<{ id: string }>(
      `MATCH (l:LedgerLine {journal_entry_id: $jeId})
       WHERE l.economic_category = 'EXPENSE'
       RETURN l.id AS id`,
      { jeId: buyerJeId },
    );

    const result = await createIntercompanyMatch({
      sourceLedgerLineId: sellerLines[0].id,
      targetLedgerLineId: buyerLines[0].id,
      sourceEntityId: caFpEntityId,
      targetEntityId: usFpEntityId,
      eliminationAmount: 25000,
      transactionType: 'SALE',
      amountSellerCurrency: 25000,
      amountBuyerCurrency: 25000,
    });
    expect(result).toBe(true);
  });

  it('intercompany match edge exists', async () => {
    const matches = await runCypher<{ count: number }>(
      `MATCH ()-[r:INTERCOMPANY_MATCH]->() RETURN count(r) AS count`,
    );
    expect(Number(matches[0].count)).toBeGreaterThanOrEqual(1);
  });
});

describe('Currency Translation', () => {
  it('translates US subsidiary financials to CAD', async () => {
    const result = await translateCurrency({
      entityId: usFpEntityId,
      periodId,
      functionalCurrency: 'USD',
      presentationCurrency: 'CAD',
      averageRate: 1.35,  // 1 USD = 1.35 CAD (average)
      closingRate: 1.37,  // 1 USD = 1.37 CAD (period end)
    });

    expect(result.translationId).toBeDefined();
    track('CurrencyTranslation', result.translationId);

    // US entity has 80000 revenue, 25000 expense (intercompany)
    // Revenue at average rate: 80000 * 1.35 = 108000 (before elimination)
    expect(result.revenueTranslated).toBeGreaterThan(0);
    expect(result.assetTranslated).toBeGreaterThan(0);
  });

  it('retrieves currency translation', async () => {
    const ct = await getCurrencyTranslation(usFpEntityId, periodId);
    expect(ct).toBeDefined();
    expect(ct!.functional_currency).toBe('USD');
    expect(ct!.presentation_currency).toBe('CAD');
    expect(Number(ct!.average_rate)).toBe(1.35);
    expect(Number(ct!.closing_rate)).toBe(1.37);
  });

  it('CTA is computed', async () => {
    const ct = await getCurrencyTranslation(usFpEntityId, periodId);
    // CTA arises from using different rates for BS vs P&L
    expect(ct!.cta_current_period).toBeDefined();
    expect(Number(ct!.cumulative_cta)).toBe(Number(ct!.cta_current_period));
  });
});

describe('Consolidated Reporting', () => {
  it('generates consolidated P&L', async () => {
    const pnl = await getConsolidatedPnL(groupId, periodId);

    // CA: 100000 revenue + 25000 intercompany revenue (eliminated) = net 100000
    // US: 80000 revenue, 25000 expense
    // Intercompany elimination: 25000 revenue
    expect(pnl.revenue).toBeGreaterThan(0);
    expect(pnl.netIncome).toBeDefined();
    expect(pnl.entityBreakdown).toHaveLength(2);
  });

  it('entity breakdown includes all group members', async () => {
    const pnl = await getConsolidatedPnL(groupId, periodId);
    const caEntity = pnl.entityBreakdown.find((e) => e.entityId === caFpEntityId);
    const usEntity = pnl.entityBreakdown.find((e) => e.entityId === usFpEntityId);
    expect(caEntity).toBeDefined();
    expect(usEntity).toBeDefined();
    expect(caEntity!.revenue).toBeGreaterThan(0);
    expect(usEntity!.revenue).toBeGreaterThan(0);
  });

  it('generates consolidated balance sheet with goodwill', async () => {
    const bs = await getConsolidatedBalanceSheet(groupId, periodId);
    expect(bs.assets).toBeGreaterThan(0);
    // Goodwill should be 150000 (180000 - 30000 impairment)
    expect(bs.goodwill).toBe(150000);
  });
});
