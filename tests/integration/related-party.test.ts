/**
 * Related Party (IAS 24) — Integration Tests
 *
 * Tests RELATED_PARTY edge CRUD, RELATED_PARTY_TRANSACTION edge creation,
 * arm's length validation, and disclosure schedule generation.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { query, closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities, createAccountingPeriod, listFunds, createFund } from '../../src/services/graph/graph-crud-service.js';
import { postJournalEntry } from '../../src/services/gl/journal-posting-service.js';
import {
  createRelatedParty,
  getRelatedParties,
  getRelatedPartyBetween,
  updateRelatedParty,
  deleteRelatedParty,
  createRelatedPartyTransaction,
  getRelatedPartyTransactions,
  validateArmsLength,
  generateDisclosureSchedule,
} from '../../src/services/gl/related-party-service.js';

let fpEntityId: string;  // CA for-profit
let nfpEntityId: string; // CA not-for-profit
let usFpEntityId: string; // US for-profit
let nfpFundId: string;   // Fund for NFP entity JEs
let periodId: string;
const cleanupIds: { label: string; id: string }[] = [];
const cleanupJeIds: string[] = [];

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  fpEntityId = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'CA')!.id;
  nfpEntityId = entities.find((e) => e.entity_type === 'NOT_FOR_PROFIT' && e.jurisdiction === 'CA')!.id;
  usFpEntityId = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'US')!.id;

  // Get or create a fund for NFP entity (required for JE posting)
  const funds = await listFunds(nfpEntityId);
  if (funds.length > 0) {
    nfpFundId = (funds[0] as any).id;
  } else {
    nfpFundId = track('Fund', await createFund({
      entityId: nfpEntityId,
      fundType: 'UNRESTRICTED',
      label: 'General Fund (RP Test)',
    }));
  }

  periodId = track('AccountingPeriod', await createAccountingPeriod({
    entityId: fpEntityId,
    label: 'Related Party Test Period',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  }));
});

afterAll(async () => {
  // Clean up TimescaleDB
  await query('DELETE FROM gl_period_balances WHERE period_id = $1', [periodId]);

  // Clean up RELATED_PARTY_TRANSACTION edges
  for (const jeId of cleanupJeIds) {
    await runCypher(
      `MATCH (je:JournalEntry {id: $id})-[r:RELATED_PARTY_TRANSACTION]-() DELETE r`,
      { id: jeId },
    );
    await runCypher(
      `MATCH ()-[r:RELATED_PARTY_TRANSACTION]->(je:JournalEntry {id: $id}) DELETE r`,
      { id: jeId },
    );
  }

  // Clean up JEs and LedgerLines
  for (const jeId of cleanupJeIds) {
    await runCypher('MATCH (l:LedgerLine {journal_entry_id: $id}) DELETE l', { id: jeId });
    await runCypher('MATCH (j:JournalEntry {id: $id}) DELETE j', { id: jeId });
  }

  // Clean up RELATED_PARTY edges
  await runCypher(
    `MATCH (e1:Entity {id: $id1})-[r:RELATED_PARTY]->() DELETE r`,
    { id1: fpEntityId },
  );
  await runCypher(
    `MATCH (e1:Entity {id: $id1})-[r:RELATED_PARTY]->() DELETE r`,
    { id1: usFpEntityId },
  );

  // Clean up test nodes
  for (const { label, id } of cleanupIds) {
    await runCypher(`MATCH (n:${label} {id: $id}) DETACH DELETE n`, { id });
  }

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

describe('RELATED_PARTY Edge CRUD', () => {
  it('creates a SHARED_BOARD relationship between entities', async () => {
    const result = await createRelatedParty({
      sourceEntityId: fpEntityId,
      targetEntityId: nfpEntityId,
      relationshipType: 'SHARED_BOARD',
      individualsInCommon: ['Jane Smith', 'John Doe'],
      effectiveFrom: '2025-01-01',
      disclosureRequired: true,
    });
    expect(result).toBe(true);
  });

  it('creates ECONOMIC_DEPENDENCE relationship', async () => {
    const result = await createRelatedParty({
      sourceEntityId: fpEntityId,
      targetEntityId: usFpEntityId,
      relationshipType: 'ECONOMIC_DEPENDENCE',
      individualsInCommon: [],
      effectiveFrom: '2025-06-01',
      disclosureRequired: true,
    });
    expect(result).toBe(true);
  });

  it('retrieves related parties for an entity', async () => {
    const parties = await getRelatedParties(fpEntityId);
    expect(parties.length).toBeGreaterThanOrEqual(2);
    const boardRel = parties.find((p: any) => p.relationship_type === 'SHARED_BOARD');
    expect(boardRel).toBeDefined();
    expect(boardRel!.relatedEntityId).toBe(nfpEntityId);
  });

  it('retrieves related party between two specific entities', async () => {
    const rel = await getRelatedPartyBetween(fpEntityId, nfpEntityId);
    expect(rel).toBeDefined();
    expect(rel!.relationship_type).toBe('SHARED_BOARD');
    expect(rel!.disclosure_required).toBe(true);
  });

  it('returns null for unrelated entities', async () => {
    const rel = await getRelatedPartyBetween(nfpEntityId, usFpEntityId);
    expect(rel).toBeNull();
  });

  it('updates related party edge', async () => {
    const updated = await updateRelatedParty(fpEntityId, nfpEntityId, {
      individualsInCommon: ['Jane Smith', 'John Doe', 'Alice Johnson'],
      effectiveUntil: '2027-12-31',
    });
    expect(updated).toBe(true);

    const rel = await getRelatedPartyBetween(fpEntityId, nfpEntityId);
    expect((rel!.individuals_in_common as string[]).length).toBe(3);
  });

  it('deletes related party edge', async () => {
    // Create a temporary relationship to delete
    await createRelatedParty({
      sourceEntityId: usFpEntityId,
      targetEntityId: nfpEntityId,
      relationshipType: 'FAMILY',
      individualsInCommon: ['Bob Owner'],
      effectiveFrom: '2026-01-01',
    });

    const deleted = await deleteRelatedParty(usFpEntityId, nfpEntityId);
    expect(deleted).toBe(true);

    const rel = await getRelatedPartyBetween(usFpEntityId, nfpEntityId);
    expect(rel).toBeNull();
  });
});

describe('RELATED_PARTY_TRANSACTION Edge', () => {
  let sourceJeId: string;
  let targetJeId: string;

  beforeAll(async () => {
    // Create a matching pair of journal entries (intercompany transaction)
    // Source entity: FP posts a management fee expense
    sourceJeId = await postJournalEntry({
      entityId: fpEntityId,
      periodId,
      entryType: 'OPERATIONAL',
      reference: 'RP-MGMT-FEE-SOURCE',
      narrative: 'Management fee paid to NFP',
      currency: 'CAD',
      validDate: '2026-01-15',
      sourceSystem: 'test',
      lines: [
        { side: 'DEBIT', amount: 10000, nodeRefId: fpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE' },
        { side: 'CREDIT', amount: 10000, nodeRefId: fpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
      ],
    });
    cleanupJeIds.push(sourceJeId);

    // Target entity: NFP posts a management fee income (requires fundId)
    targetJeId = await postJournalEntry({
      entityId: nfpEntityId,
      periodId,
      entryType: 'OPERATIONAL',
      reference: 'RP-MGMT-FEE-TARGET',
      narrative: 'Management fee received from FP',
      currency: 'CAD',
      validDate: '2026-01-15',
      sourceSystem: 'test',
      lines: [
        { side: 'DEBIT', amount: 10000, nodeRefId: nfpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET', fundId: nfpFundId },
        { side: 'CREDIT', amount: 10000, nodeRefId: nfpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE', fundId: nfpFundId },
      ],
    });
    cleanupJeIds.push(targetJeId);
  });

  it('creates a related party transaction edge', async () => {
    const result = await createRelatedPartyTransaction({
      sourceJournalEntryId: sourceJeId,
      targetJournalEntryId: targetJeId,
      transactionNature: 'MANAGEMENT_FEE',
      sourceEntityId: fpEntityId,
      targetEntityId: nfpEntityId,
      taxDeductibleForSource: true,
    });
    expect(result).toBe(true);
  });

  it('retrieves related party transactions for entity', async () => {
    const transactions = await getRelatedPartyTransactions(fpEntityId, periodId);
    expect(transactions.length).toBeGreaterThanOrEqual(1);

    const mgmtFee = transactions.find((t: any) => t.transaction_nature === 'MANAGEMENT_FEE');
    expect(mgmtFee).toBeDefined();
    expect(mgmtFee!.source_entity_id).toBe(fpEntityId);
    expect(mgmtFee!.target_entity_id).toBe(nfpEntityId);
    expect(mgmtFee!.arms_length_validated).toBe(false);
    expect(mgmtFee!.tax_deductible_for_source).toBe(true);
  });

  it('retrieves transactions from target entity perspective', async () => {
    const transactions = await getRelatedPartyTransactions(nfpEntityId, periodId);
    expect(transactions.some((t: any) => t.transaction_nature === 'MANAGEMENT_FEE')).toBe(true);
  });
});

describe('Arm\'s Length Validation', () => {
  it('validates matching transactions as arm\'s length', async () => {
    const results = await validateArmsLength(fpEntityId, periodId, 'CUP', 0.05);
    expect(results.length).toBeGreaterThanOrEqual(1);

    const mgmtFee = results.find((r) => r.transactionNature === 'MANAGEMENT_FEE');
    expect(mgmtFee).toBeDefined();
    expect(mgmtFee!.validated).toBe(true); // Source and target amounts match
    expect(mgmtFee!.method).toBe('CUP');
    expect(mgmtFee!.variance).toBe(0); // Exact match
  });

  it('marks already-validated transactions as validated', async () => {
    // Second call should find no unvalidated transactions
    const results = await validateArmsLength(fpEntityId, periodId, 'CUP', 0.05);
    expect(results.length).toBe(0); // All already validated
  });

  it('flags mismatched amounts', async () => {
    // Create a mismatched transaction pair
    const srcJeId = await postJournalEntry({
      entityId: fpEntityId,
      periodId,
      entryType: 'OPERATIONAL',
      reference: 'RP-MISMATCH-SRC',
      narrative: 'Trade with US entity at non-arm\'s length price',
      currency: 'CAD',
      validDate: '2026-01-20',
      sourceSystem: 'test',
      lines: [
        { side: 'DEBIT', amount: 50000, nodeRefId: fpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE' },
        { side: 'CREDIT', amount: 50000, nodeRefId: fpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
      ],
    });
    cleanupJeIds.push(srcJeId);

    const tgtJeId = await postJournalEntry({
      entityId: usFpEntityId,
      periodId,
      entryType: 'OPERATIONAL',
      reference: 'RP-MISMATCH-TGT',
      narrative: 'Trade with CA entity — discounted price',
      currency: 'CAD',
      validDate: '2026-01-20',
      sourceSystem: 'test',
      lines: [
        { side: 'DEBIT', amount: 30000, nodeRefId: usFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
        { side: 'CREDIT', amount: 30000, nodeRefId: usFpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE' },
      ],
    });
    cleanupJeIds.push(tgtJeId);

    await createRelatedPartyTransaction({
      sourceJournalEntryId: srcJeId,
      targetJournalEntryId: tgtJeId,
      transactionNature: 'TRADE',
      sourceEntityId: fpEntityId,
      targetEntityId: usFpEntityId,
      taxDeductibleForSource: true,
    });

    const results = await validateArmsLength(fpEntityId, periodId, 'CUP', 0.05);
    const trade = results.find((r) => r.transactionNature === 'TRADE');
    expect(trade).toBeDefined();
    expect(trade!.validated).toBe(false); // 50k vs 30k = 40% variance > 5% tolerance
    expect(trade!.variance).toBeGreaterThan(0.05);
  });
});

describe('Disclosure Schedule', () => {
  it('generates disclosure schedule for entity', async () => {
    // Verify prerequisite: RELATED_PARTY edge exists
    const relParties = await getRelatedParties(fpEntityId);
    const boardRel = relParties.find((p: any) => p.relationship_type === 'SHARED_BOARD');
    expect(boardRel).toBeDefined();

    // Verify prerequisite: transaction edge exists
    const txns = await getRelatedPartyTransactions(fpEntityId, periodId);
    const mgmtFeeTxn = txns.find((t: any) => t.transaction_nature === 'MANAGEMENT_FEE');
    expect(mgmtFeeTxn).toBeDefined();

    const schedule = await generateDisclosureSchedule(fpEntityId, periodId);

    // Should include the management fee transaction
    const mgmtFee = schedule.find((d) => d.transactionNature === 'MANAGEMENT_FEE');
    expect(mgmtFee).toBeDefined();
    expect(mgmtFee!.relatedEntityId).toBe(nfpEntityId);
    expect(mgmtFee!.relationshipType).toBe('SHARED_BOARD');
    expect(mgmtFee!.amount).toBe(10000);
    expect(mgmtFee!.armsLengthValidated).toBe(true);
  });

  it('returns empty schedule for entity with no disclosable transactions', async () => {
    // US NFP has no related party edges with disclosure_required
    const entities = await getAllEntities();
    const usNfpId = entities.find((e) => e.entity_type === 'NOT_FOR_PROFIT' && e.jurisdiction === 'US')!.id;
    const schedule = await generateDisclosureSchedule(usNfpId, periodId);
    expect(schedule).toHaveLength(0);
  });
});

describe('Donation Flow Tracking', () => {
  it('tracks donation from FP to NFP with receipt', async () => {
    const donorJeId = await postJournalEntry({
      entityId: fpEntityId,
      periodId,
      entryType: 'OPERATIONAL',
      reference: 'RP-DONATION-DONOR',
      narrative: 'Charitable donation to NFP',
      currency: 'CAD',
      validDate: '2026-01-25',
      sourceSystem: 'test',
      lines: [
        { side: 'DEBIT', amount: 5000, nodeRefId: fpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE' },
        { side: 'CREDIT', amount: 5000, nodeRefId: fpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET' },
      ],
    });
    cleanupJeIds.push(donorJeId);

    const recipientJeId = await postJournalEntry({
      entityId: nfpEntityId,
      periodId,
      entryType: 'OPERATIONAL',
      reference: 'RP-DONATION-RECIPIENT',
      narrative: 'Donation received from FP',
      currency: 'CAD',
      validDate: '2026-01-25',
      sourceSystem: 'test',
      lines: [
        { side: 'DEBIT', amount: 5000, nodeRefId: nfpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'ASSET', fundId: nfpFundId },
        { side: 'CREDIT', amount: 5000, nodeRefId: nfpEntityId, nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE', fundId: nfpFundId },
      ],
    });
    cleanupJeIds.push(recipientJeId);

    await createRelatedPartyTransaction({
      sourceJournalEntryId: donorJeId,
      targetJournalEntryId: recipientJeId,
      transactionNature: 'DONATION',
      sourceEntityId: fpEntityId,
      targetEntityId: nfpEntityId,
      taxDeductibleForSource: true,
      donationReceiptIssued: true,
    });

    const transactions = await getRelatedPartyTransactions(fpEntityId, periodId);
    const donation = transactions.find((t: any) => t.transaction_nature === 'DONATION');
    expect(donation).toBeDefined();
    expect(donation!.donation_receipt_issued).toBe(true);
    expect(donation!.tax_deductible_for_source).toBe(true);
  });
});
