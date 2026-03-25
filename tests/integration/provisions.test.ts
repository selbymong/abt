/**
 * Provision (IAS 37) — Integration Tests
 *
 * Tests Provision CRUD, recognition criteria enforcement,
 * discount unwinding, settlement with gain/loss, and period-end review.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { query, closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities, createAccountingPeriod } from '../../src/services/graph/graph-crud-service.js';
import {
  createProvision,
  getProvision,
  listProvisions,
  updateProvision,
  deleteProvision,
  recognizeProvision,
  unwindProvisionDiscount,
  settleProvision,
  getProvisionsNeedingReview,
} from '../../src/services/gl/provision-service.js';

let testEntityId: string;
let periodId: string;
const cleanupIds: { label: string; id: string }[] = [];

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  const fpEntity = entities.find((e) => e.entity_type === 'FOR_PROFIT');
  testEntityId = fpEntity!.id;

  periodId = track('AccountingPeriod', await createAccountingPeriod({
    entityId: testEntityId,
    label: 'Provision Test Period',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  }));
});

afterAll(async () => {
  // Clean up TimescaleDB
  const periodIds = [periodId,
    ...cleanupIds.filter(c => c.label === 'AccountingPeriod').map(c => c.id)];
  const placeholders = periodIds.map((_, i) => `$${i + 1}`).join(', ');
  await query(`DELETE FROM gl_period_balances WHERE period_id IN (${placeholders})`, periodIds);

  // Clean up JEs and provisions from Neo4j
  for (const { label, id } of cleanupIds) {
    if (label === 'Provision') {
      const jeIds = await runCypher<{ id: string }>(
        `MATCH (j:JournalEntry) WHERE j.reference CONTAINS $nodeId RETURN j.id AS id`,
        { nodeId: id },
      );
      for (const je of jeIds) {
        await runCypher('MATCH (l:LedgerLine {journal_entry_id: $jeId}) DELETE l', { jeId: je.id });
        await runCypher('MATCH (j:JournalEntry {id: $id}) DELETE j', { id: je.id });
      }
    }
    await runCypher(`MATCH (n:${label} {id: $id}) DETACH DELETE n`, { id });
  }
  await closeNeo4j();
  await closePg();
  await closeKafka();
});

describe('Provision CRUD', () => {
  let provisionId: string;

  it('creates a PROBABLE provision', async () => {
    provisionId = track('Provision', await createProvision({
      entityId: testEntityId,
      label: 'Warranty Provision',
      provisionType: 'WARRANTY',
      presentObligationBasis: 'Warranty obligations from product sales in 2025',
      probabilityOfOutflow: 'PROBABLE',
      bestEstimate: 50000,
      rangeLow: 30000,
      rangeHigh: 80000,
    }));
    expect(provisionId).toBeDefined();
  });

  it('retrieves provision with correct properties', async () => {
    const p = await getProvision(provisionId);
    expect(p).toBeDefined();
    expect(p!.provision_type).toBe('WARRANTY');
    expect(p!.probability_of_outflow).toBe('PROBABLE');
    expect(p!.recognition_criteria_met).toBe(true);
    expect(Number(p!.best_estimate)).toBe(50000);
    expect(Number(p!.carrying_amount)).toBe(50000);
    expect(Number(p!.range_low)).toBe(30000);
    expect(Number(p!.range_high)).toBe(80000);
    expect(Number(p!.unwinding_to_date)).toBe(0);
  });

  it('creates a POSSIBLE provision (not recognized)', async () => {
    const possibleId = track('Provision', await createProvision({
      entityId: testEntityId,
      label: 'Legal Claim — Possible',
      provisionType: 'LEGAL_CLAIM',
      presentObligationBasis: 'Pending lawsuit from competitor',
      probabilityOfOutflow: 'POSSIBLE',
      bestEstimate: 200000,
    }));

    const p = await getProvision(possibleId);
    expect(p!.recognition_criteria_met).toBe(false);
    expect(p!.probability_of_outflow).toBe('POSSIBLE');
  });

  it('creates a REMOTE provision (not recognized)', async () => {
    const remoteId = track('Provision', await createProvision({
      entityId: testEntityId,
      label: 'Environmental — Remote',
      provisionType: 'ENVIRONMENTAL',
      presentObligationBasis: 'Hypothetical contamination risk',
      probabilityOfOutflow: 'REMOTE',
      bestEstimate: 500000,
    }));

    const p = await getProvision(remoteId);
    expect(p!.recognition_criteria_met).toBe(false);
  });

  it('lists provisions by entity', async () => {
    const provisions = await listProvisions(testEntityId);
    expect(provisions.length).toBeGreaterThanOrEqual(3);
  });

  it('filters provisions by probability', async () => {
    const probable = await listProvisions(testEntityId, 'PROBABLE');
    expect(probable.every((p: any) => p.probability_of_outflow === 'PROBABLE')).toBe(true);
    expect(probable.length).toBeGreaterThanOrEqual(1);
  });

  it('updates provision estimate and probability', async () => {
    const updated = await updateProvision(provisionId, {
      bestEstimate: 60000,
      rangeLow: 40000,
      rangeHigh: 90000,
    });
    expect(updated).toBe(true);

    const p = await getProvision(provisionId);
    expect(Number(p!.best_estimate)).toBe(60000);
    expect(Number(p!.carrying_amount)).toBe(60000);
    expect(Number(p!.range_low)).toBe(40000);
  });

  it('changes probability from PROBABLE to POSSIBLE', async () => {
    const possibleProvId = track('Provision', await createProvision({
      entityId: testEntityId,
      label: 'Downgraded Provision',
      provisionType: 'RESTRUCTURING',
      presentObligationBasis: 'Planned restructuring that may not proceed',
      probabilityOfOutflow: 'PROBABLE',
      bestEstimate: 100000,
    }));

    await updateProvision(possibleProvId, { probabilityOfOutflow: 'POSSIBLE' });
    const p = await getProvision(possibleProvId);
    expect(p!.recognition_criteria_met).toBe(false);
    expect(p!.probability_of_outflow).toBe('POSSIBLE');
  });

  it('deletes a provision', async () => {
    const tempId = await createProvision({
      entityId: testEntityId,
      label: 'Temporary Provision',
      provisionType: 'ONEROUS_CONTRACT',
      presentObligationBasis: 'Test deletion',
      probabilityOfOutflow: 'PROBABLE',
      bestEstimate: 5000,
    });

    const deleted = await deleteProvision(tempId);
    expect(deleted).toBe(true);

    const p = await getProvision(tempId);
    expect(p).toBeNull();
  });
});

describe('Provision Recognition', () => {
  it('recognizes PROBABLE provision with JE', async () => {
    const provId = track('Provision', await createProvision({
      entityId: testEntityId,
      label: 'Recognized Warranty',
      provisionType: 'WARRANTY',
      presentObligationBasis: 'Product warranty claims',
      probabilityOfOutflow: 'PROBABLE',
      bestEstimate: 25000,
    }));

    const result = await recognizeProvision(provId, periodId);
    expect(result.recognized).toBe(true);
    expect(result.journalEntryId).toBeDefined();

    // Verify JE balances
    const je = await runCypher<{ total_debit: number; total_credit: number }>(
      `MATCH (j:JournalEntry {id: $id})
       RETURN j.total_debit AS total_debit, j.total_credit AS total_credit`,
      { id: result.journalEntryId! },
    );
    expect(Number(je[0].total_debit)).toBeCloseTo(Number(je[0].total_credit), 2);
    expect(Number(je[0].total_debit)).toBe(25000);
  });

  it('does not recognize POSSIBLE provision', async () => {
    const possId = track('Provision', await createProvision({
      entityId: testEntityId,
      label: 'Possible — No Recognition',
      provisionType: 'LEGAL_CLAIM',
      presentObligationBasis: 'Lawsuit with uncertain outcome',
      probabilityOfOutflow: 'POSSIBLE',
      bestEstimate: 100000,
    }));

    const result = await recognizeProvision(possId, periodId);
    expect(result.recognized).toBe(false);
    expect(result.journalEntryId).toBeNull();
  });

  it('does not recognize REMOTE provision', async () => {
    const remoteId = track('Provision', await createProvision({
      entityId: testEntityId,
      label: 'Remote — No Recognition',
      provisionType: 'ENVIRONMENTAL',
      presentObligationBasis: 'Very unlikely event',
      probabilityOfOutflow: 'REMOTE',
      bestEstimate: 1000000,
    }));

    const result = await recognizeProvision(remoteId, periodId);
    expect(result.recognized).toBe(false);
    expect(result.journalEntryId).toBeNull();
  });
});

describe('Discount Unwinding', () => {
  it('unwinds discount on discounted provision', async () => {
    // Create a provision with a discount rate (settlement > 1 year away)
    const provId = track('Provision', await createProvision({
      entityId: testEntityId,
      label: 'Decommissioning Obligation',
      provisionType: 'DECOMMISSIONING',
      presentObligationBasis: 'Plant decommissioning required by regulation',
      probabilityOfOutflow: 'PROBABLE',
      bestEstimate: 1000000,
      discountRate: 0.05, // 5% annual
      expectedSettlementDate: '2031-01-01', // ~5 years away
    }));

    const pBefore = await getProvision(provId);
    const carryingBefore = Number(pBefore!.carrying_amount);
    // Discounted: 1M / (1.05^5) ≈ 783,526
    expect(carryingBefore).toBeLessThan(1000000);
    expect(carryingBefore).toBeGreaterThan(700000);

    const result = await unwindProvisionDiscount(provId, periodId);
    expect(result.unwindingAmount).toBeGreaterThan(0);
    expect(result.journalEntryId).toBeDefined();

    const pAfter = await getProvision(provId);
    expect(Number(pAfter!.carrying_amount)).toBeGreaterThan(carryingBefore);
    expect(Number(pAfter!.unwinding_to_date)).toBe(result.unwindingAmount);
  });

  it('no-op for provision without discount rate', async () => {
    const provId = track('Provision', await createProvision({
      entityId: testEntityId,
      label: 'No Discount Provision',
      provisionType: 'WARRANTY',
      presentObligationBasis: 'Short-term warranty',
      probabilityOfOutflow: 'PROBABLE',
      bestEstimate: 10000,
    }));

    const result = await unwindProvisionDiscount(provId, periodId);
    expect(result.unwindingAmount).toBe(0);
    expect(result.journalEntryId).toBeNull();
  });
});

describe('Provision Settlement', () => {
  it('settles provision at exact carrying amount (no gain/loss)', async () => {
    const provId = track('Provision', await createProvision({
      entityId: testEntityId,
      label: 'Exact Settlement',
      provisionType: 'WARRANTY',
      presentObligationBasis: 'Known warranty claim',
      probabilityOfOutflow: 'PROBABLE',
      bestEstimate: 15000,
    }));

    const result = await settleProvision(provId, periodId, 15000);
    expect(result.gainOrLoss).toBe(0);
    expect(result.journalEntryId).toBeDefined();

    const pAfter = await getProvision(provId);
    expect(Number(pAfter!.carrying_amount)).toBe(0);
  });

  it('settles over-provisioned amount (gain)', async () => {
    const provId = track('Provision', await createProvision({
      entityId: testEntityId,
      label: 'Over-Provisioned',
      provisionType: 'RESTRUCTURING',
      presentObligationBasis: 'Restructuring costs',
      probabilityOfOutflow: 'PROBABLE',
      bestEstimate: 50000,
    }));

    const result = await settleProvision(provId, periodId, 40000);
    expect(result.gainOrLoss).toBe(10000); // Over-provisioned by 10k
    expect(result.journalEntryId).toBeDefined();

    // JE should balance
    const je = await runCypher<{ total_debit: number; total_credit: number }>(
      `MATCH (j:JournalEntry {id: $id})
       RETURN j.total_debit AS total_debit, j.total_credit AS total_credit`,
      { id: result.journalEntryId },
    );
    expect(Number(je[0].total_debit)).toBeCloseTo(Number(je[0].total_credit), 2);
  });

  it('settles under-provisioned amount (loss)', async () => {
    const provId = track('Provision', await createProvision({
      entityId: testEntityId,
      label: 'Under-Provisioned',
      provisionType: 'LEGAL_CLAIM',
      presentObligationBasis: 'Legal settlement costs',
      probabilityOfOutflow: 'PROBABLE',
      bestEstimate: 30000,
    }));

    const result = await settleProvision(provId, periodId, 45000);
    expect(result.gainOrLoss).toBe(-15000); // Under-provisioned by 15k
    expect(result.journalEntryId).toBeDefined();

    // JE should balance
    const je = await runCypher<{ total_debit: number; total_credit: number }>(
      `MATCH (j:JournalEntry {id: $id})
       RETURN j.total_debit AS total_debit, j.total_credit AS total_credit`,
      { id: result.journalEntryId },
    );
    expect(Number(je[0].total_debit)).toBeCloseTo(Number(je[0].total_credit), 2);
  });
});

describe('Period-End Review', () => {
  it('identifies provisions needing review', async () => {
    // Create provision with old review date
    const provId = track('Provision', await createProvision({
      entityId: testEntityId,
      label: 'Needs Review',
      provisionType: 'WARRANTY',
      presentObligationBasis: 'Product warranties',
      probabilityOfOutflow: 'PROBABLE',
      bestEstimate: 20000,
    }));

    // Set last_reviewed_date to the past
    await runCypher(
      `MATCH (p:Provision {id: $id}) SET p.last_reviewed_date = date('2025-12-01')`,
      { id: provId },
    );

    const needsReview = await getProvisionsNeedingReview(testEntityId, '2026-01-31');
    expect(needsReview.some((p: any) => p.id === provId)).toBe(true);
  });

  it('excludes recently reviewed provisions', async () => {
    const provId = track('Provision', await createProvision({
      entityId: testEntityId,
      label: 'Recently Reviewed',
      provisionType: 'WARRANTY',
      presentObligationBasis: 'Product warranties',
      probabilityOfOutflow: 'PROBABLE',
      bestEstimate: 10000,
    }));

    // Set last_reviewed_date to today (after period end)
    await runCypher(
      `MATCH (p:Provision {id: $id}) SET p.last_reviewed_date = date('2026-02-15')`,
      { id: provId },
    );

    const needsReview = await getProvisionsNeedingReview(testEntityId, '2026-01-31');
    expect(needsReview.some((p: any) => p.id === provId)).toBe(false);
  });
});
