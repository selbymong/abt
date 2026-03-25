/**
 * Lease Accounting — Integration Tests
 *
 * Tests RightOfUseAsset + LeaseLiability creation, PV calculation,
 * payment schedule generation, and lease payment unwinding with JE posting.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { query, closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities, createAccountingPeriod } from '../../src/services/graph/graph-crud-service.js';
import {
  createLease,
  getRightOfUseAsset,
  listRightOfUseAssets,
  getLeaseLiability,
  listLeaseLiabilities,
  processLeasePayment,
} from '../../src/services/gl/lease-service.js';

let testEntityId: string;
let period1Id: string;
let period2Id: string;
let period3Id: string;
const cleanupIds: { label: string; id: string }[] = [];

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  const fpEntity = entities.find((e) => e.entity_type === 'FOR_PROFIT');
  testEntityId = fpEntity!.id;

  period1Id = track('AccountingPeriod', await createAccountingPeriod({
    entityId: testEntityId,
    label: 'Lease Test Period 1',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  }));

  period2Id = track('AccountingPeriod', await createAccountingPeriod({
    entityId: testEntityId,
    label: 'Lease Test Period 2',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
  }));

  period3Id = track('AccountingPeriod', await createAccountingPeriod({
    entityId: testEntityId,
    label: 'Lease Test Period 3',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
  }));
});

afterAll(async () => {
  // Clean up TimescaleDB — collect all period IDs (including extra test periods)
  const allPeriodIds = [period1Id, period2Id, period3Id,
    ...cleanupIds.filter(c => c.label === 'AccountingPeriod').map(c => c.id)];
  const placeholders = allPeriodIds.map((_, i) => `$${i + 1}`).join(', ');
  await query(`DELETE FROM gl_period_balances WHERE period_id IN (${placeholders})`,
    allPeriodIds);

  for (const { label, id } of cleanupIds) {
    if (label === 'RightOfUseAsset' || label === 'LeaseLiability') {
      // Clean up JEs
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

describe('Lease Creation', () => {
  let rouAssetId: string;
  let leaseLiabilityId: string;

  it('creates a lease with ROU asset and liability', async () => {
    const result = await createLease({
      entityId: testEntityId,
      label: 'Office Space Lease',
      leaseClassification: 'FINANCE',
      totalLeasePayments: 36000,
      leaseTermMonths: 3,
      monthlyPayment: 1000,
      incrementalBorrowingRate: 0.06, // 6% annual
      commencementDate: '2026-01-01',
      leaseEndDate: '2026-03-31',
      periodSchedule: [
        { periodId: period1Id, paymentDate: '2026-01-31' },
        { periodId: period2Id, paymentDate: '2026-02-28' },
        { periodId: period3Id, paymentDate: '2026-03-31' },
      ],
    });

    rouAssetId = track('RightOfUseAsset', result.rouAssetId);
    leaseLiabilityId = track('LeaseLiability', result.leaseLiabilityId);
    expect(rouAssetId).toBeDefined();
    expect(leaseLiabilityId).toBeDefined();
  });

  it('ROU asset has correct initial values', async () => {
    const rou = await getRightOfUseAsset(rouAssetId);
    expect(rou).toBeDefined();
    expect(rou!.lease_classification).toBe('FINANCE');
    // PV should be less than nominal total (3 × 1000 = 3000 nominal)
    const cost = Number(rou!.cost_at_initial_recognition);
    expect(cost).toBeGreaterThan(2900); // PV close to nominal for short-term
    expect(cost).toBeLessThan(3000);    // But discounted
    expect(Number(rou!.accumulated_amortization)).toBe(0);
    expect(Number(rou!.carrying_amount)).toBe(cost);
    expect(Number(rou!.lease_term_months)).toBe(3);
    expect(rou!.incremental_borrowing_rate).toBe(0.06);
  });

  it('lease liability matches ROU asset initial measurement', async () => {
    const ll = await getLeaseLiability(leaseLiabilityId);
    expect(ll).toBeDefined();
    const initialMeasurement = Number(ll!.initial_measurement);
    const rou = await getRightOfUseAsset(rouAssetId);
    expect(initialMeasurement).toBe(Number(rou!.cost_at_initial_recognition));
    expect(Number(ll!.remaining_liability)).toBe(initialMeasurement);
    expect(Number(ll!.accumulated_interest)).toBe(0);
    expect(Number(ll!.accumulated_payments)).toBe(0);
  });

  it('payment schedule has correct entries', async () => {
    const ll = await getLeaseLiability(leaseLiabilityId);
    const schedule = ll!.payment_schedule as any[];
    expect(schedule).toHaveLength(3);
    expect(schedule[0].period_id).toBe(period1Id);
    expect(schedule[0].lease_payment_amount).toBe(1000);
    // Interest portion should be small for first period
    expect(schedule[0].interest_portion).toBeGreaterThan(0);
    expect(schedule[0].principal_portion).toBeGreaterThan(0);
    // Interest + principal = total payment
    expect(schedule[0].interest_portion + schedule[0].principal_portion).toBeCloseTo(1000, 0);
    // Carrying amount decreases over time
    expect(schedule[1].carrying_amount_after).toBeLessThan(schedule[0].carrying_amount_after);
  });

  it('lists ROU assets by entity', async () => {
    const assets = await listRightOfUseAssets(testEntityId);
    expect(assets.some((a: any) => a.id === rouAssetId)).toBe(true);
  });

  it('lists lease liabilities by entity', async () => {
    const liabilities = await listLeaseLiabilities(testEntityId);
    expect(liabilities.some((l: any) => l.id === leaseLiabilityId)).toBe(true);
  });
});

describe('Lease Payment Unwinding', () => {
  let rouAssetId: string;
  let leaseLiabilityId: string;

  beforeAll(async () => {
    const result = await createLease({
      entityId: testEntityId,
      label: 'Equipment Lease',
      leaseClassification: 'FINANCE',
      totalLeasePayments: 6000,
      leaseTermMonths: 3,
      monthlyPayment: 2000,
      incrementalBorrowingRate: 0.12, // 12% annual (1% monthly) — makes math cleaner
      commencementDate: '2026-01-01',
      leaseEndDate: '2026-03-31',
      periodSchedule: [
        { periodId: period1Id, paymentDate: '2026-01-31' },
        { periodId: period2Id, paymentDate: '2026-02-28' },
        { periodId: period3Id, paymentDate: '2026-03-31' },
      ],
    });

    rouAssetId = track('RightOfUseAsset', result.rouAssetId);
    leaseLiabilityId = track('LeaseLiability', result.leaseLiabilityId);
  });

  it('processes first lease payment', async () => {
    const result = await processLeasePayment(leaseLiabilityId, rouAssetId, period1Id);

    expect(result.interestExpense).toBeGreaterThan(0);
    expect(result.principalPayment).toBeGreaterThan(0);
    expect(result.interestExpense + result.principalPayment).toBeCloseTo(2000, 0);
    expect(result.amortizationCharge).toBeGreaterThan(0);
    expect(result.journalEntryIds).toHaveLength(2); // payment JE + amortization JE
  });

  it('updates lease liability after payment', async () => {
    const ll = await getLeaseLiability(leaseLiabilityId);
    expect(Number(ll!.accumulated_interest)).toBeGreaterThan(0);
    expect(Number(ll!.accumulated_payments)).toBeCloseTo(2000, 0);
    expect(Number(ll!.remaining_liability)).toBeLessThan(Number(ll!.initial_measurement));
  });

  it('updates ROU asset after amortization', async () => {
    const rou = await getRightOfUseAsset(rouAssetId);
    expect(Number(rou!.accumulated_amortization)).toBeGreaterThan(0);
    expect(Number(rou!.carrying_amount)).toBeLessThan(Number(rou!.cost_at_initial_recognition));
  });

  it('processes subsequent payments with decreasing interest', async () => {
    const result1 = await processLeasePayment(leaseLiabilityId, rouAssetId, period2Id);
    const ll = await getLeaseLiability(leaseLiabilityId);
    const schedule = ll!.payment_schedule as any[];

    // Interest should decrease each period (declining balance on liability)
    expect(schedule[1].interest_portion).toBeLessThan(schedule[0].interest_portion);
    expect(result1.principalPayment).toBeGreaterThan(0);
  });

  it('returns no-op for period with no schedule entry', async () => {
    // Create a period not in the schedule
    const extraPeriodId = track('AccountingPeriod', await createAccountingPeriod({
      entityId: testEntityId,
      label: 'No Lease Payment Period',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
    }));

    const result = await processLeasePayment(leaseLiabilityId, rouAssetId, extraPeriodId);
    expect(result.interestExpense).toBe(0);
    expect(result.principalPayment).toBe(0);
    expect(result.amortizationCharge).toBe(0);
    expect(result.journalEntryIds).toHaveLength(0);
  });
});

describe('Lease JE Verification', () => {
  it('payment JE has correct debit/credit structure', async () => {
    const result = await createLease({
      entityId: testEntityId,
      label: 'JE Verification Lease',
      leaseClassification: 'FINANCE',
      totalLeasePayments: 3000,
      leaseTermMonths: 1,
      monthlyPayment: 3000,
      incrementalBorrowingRate: 0.12,
      commencementDate: '2026-01-01',
      leaseEndDate: '2026-01-31',
      periodSchedule: [
        { periodId: period1Id, paymentDate: '2026-01-31' },
      ],
    });

    track('RightOfUseAsset', result.rouAssetId);
    track('LeaseLiability', result.leaseLiabilityId);

    const paymentResult = await processLeasePayment(
      result.leaseLiabilityId, result.rouAssetId, period1Id,
    );

    // Payment JE: DR Expense (interest) + DR Liability (principal) = CR Asset (cash)
    const paymentJeId = paymentResult.journalEntryIds[0];
    const je = await runCypher<{ total_debit: number; total_credit: number }>(
      `MATCH (j:JournalEntry {id: $id})
       RETURN j.total_debit AS total_debit, j.total_credit AS total_credit`,
      { id: paymentJeId },
    );
    expect(Number(je[0].total_debit)).toBeCloseTo(Number(je[0].total_credit), 2);

    // Amortization JE: DR Expense = CR Asset
    const amortJeId = paymentResult.journalEntryIds[1];
    const amortJe = await runCypher<{ total_debit: number; total_credit: number }>(
      `MATCH (j:JournalEntry {id: $id})
       RETURN j.total_debit AS total_debit, j.total_credit AS total_credit`,
      { id: amortJeId },
    );
    expect(Number(amortJe[0].total_debit)).toBeCloseTo(Number(amortJe[0].total_credit), 2);
  });
});
