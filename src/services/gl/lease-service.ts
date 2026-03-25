import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { postJournalEntry } from './journal-posting-service.js';
import type {
  LeaseClassification, LeasePaymentScheduleEntry,
} from '../../schema/neo4j/types.js';

// ============================================================
// Lease Initialization
// ============================================================

export interface CreateLeaseInput {
  entityId: string;
  label: string;
  leaseClassification: LeaseClassification;
  totalLeasePayments: number;
  leaseTermMonths: number;
  monthlyPayment: number;
  incrementalBorrowingRate: number;
  commencementDate: string;
  leaseEndDate: string;
  periodSchedule: { periodId: string; paymentDate: string }[];
  activityRefId?: string;
}

/**
 * Create a lease: RightOfUseAsset + LeaseLiability + payment schedule.
 *
 * Initial measurement:
 * - LeaseLiability = PV of future lease payments
 * - RightOfUseAsset = LeaseLiability (simplified, no prepayments/incentives)
 */
export async function createLease(input: CreateLeaseInput): Promise<{
  rouAssetId: string;
  leaseLiabilityId: string;
}> {
  const monthlyRate = input.incrementalBorrowingRate / 12;

  // Calculate PV of lease payments (annuity present value)
  let pvTotal = 0;
  for (let i = 1; i <= input.leaseTermMonths; i++) {
    pvTotal += input.monthlyPayment / Math.pow(1 + monthlyRate, i);
  }

  // Build payment schedule with interest/principal split
  const schedule: LeasePaymentScheduleEntry[] = [];
  let remainingLiability = pvTotal;

  for (let i = 0; i < input.periodSchedule.length && i < input.leaseTermMonths; i++) {
    const interestPortion = remainingLiability * monthlyRate;
    const principalPortion = input.monthlyPayment - interestPortion;
    remainingLiability -= principalPortion;

    schedule.push({
      period_id: input.periodSchedule[i].periodId,
      payment_date: input.periodSchedule[i].paymentDate,
      lease_payment_amount: input.monthlyPayment,
      interest_portion: Math.round(interestPortion * 100) / 100,
      principal_portion: Math.round(principalPortion * 100) / 100,
      carrying_amount_after: Math.max(0, Math.round(remainingLiability * 100) / 100),
    });
  }

  // Create RightOfUseAsset
  const rouAssetId = uuid();
  await runCypher(
    `CREATE (r:RightOfUseAsset {
      id: $id, entity_id: $entityId, label: $label,
      lease_classification: $leaseClassification,
      cost_at_initial_recognition: $pvTotal,
      accumulated_amortization: 0,
      accumulated_impairment: 0,
      carrying_amount: $pvTotal,
      lease_term_months: $leaseTermMonths,
      incremental_borrowing_rate: $ibr,
      acquisition_date: date($commencementDate),
      lease_end_date: date($leaseEndDate),
      tax_base: 0,
      activity_ref_id: $activityRefId,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id: rouAssetId,
      entityId: input.entityId,
      label: `ROU — ${input.label}`,
      leaseClassification: input.leaseClassification,
      pvTotal: Math.round(pvTotal * 100) / 100,
      leaseTermMonths: input.leaseTermMonths,
      ibr: input.incrementalBorrowingRate,
      commencementDate: input.commencementDate,
      leaseEndDate: input.leaseEndDate,
      activityRefId: input.activityRefId ?? null,
    },
  );

  // Create LeaseLiability
  const leaseLiabilityId = uuid();
  await runCypher(
    `CREATE (l:LeaseLiability {
      id: $id, entity_id: $entityId, label: $label,
      initial_measurement: $pvTotal,
      accumulated_interest: 0,
      accumulated_payments: 0,
      remaining_liability: $pvTotal,
      lease_term_months: $leaseTermMonths,
      incremental_borrowing_rate: $ibr,
      payment_schedule: $paymentSchedule,
      tax_base: 0,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id: leaseLiabilityId,
      entityId: input.entityId,
      label: `Lease Liability — ${input.label}`,
      pvTotal: Math.round(pvTotal * 100) / 100,
      leaseTermMonths: input.leaseTermMonths,
      ibr: input.incrementalBorrowingRate,
      paymentSchedule: JSON.stringify(schedule),
    },
  );

  return { rouAssetId, leaseLiabilityId };
}

// ============================================================
// RightOfUseAsset CRUD
// ============================================================

export async function getRightOfUseAsset(id: string) {
  const results = await runCypher<{ r: Record<string, unknown> }>(
    `MATCH (r:RightOfUseAsset {id: $id}) RETURN properties(r) AS r`,
    { id },
  );
  return results[0]?.r ?? null;
}

export async function listRightOfUseAssets(entityId: string) {
  const results = await runCypher<{ r: Record<string, unknown> }>(
    `MATCH (r:RightOfUseAsset {entity_id: $entityId})
     RETURN properties(r) AS r ORDER BY r.label`,
    { entityId },
  );
  return results.map((row) => row.r);
}

// ============================================================
// LeaseLiability CRUD
// ============================================================

export async function getLeaseLiability(id: string) {
  const results = await runCypher<{ l: Record<string, unknown> }>(
    `MATCH (l:LeaseLiability {id: $id}) RETURN properties(l) AS l`,
    { id },
  );
  if (results.length === 0) return null;
  const l = results[0].l;
  if (typeof l.payment_schedule === 'string') {
    l.payment_schedule = JSON.parse(l.payment_schedule);
  }
  return l;
}

export async function listLeaseLiabilities(entityId: string) {
  const results = await runCypher<{ l: Record<string, unknown> }>(
    `MATCH (l:LeaseLiability {entity_id: $entityId})
     RETURN properties(l) AS l ORDER BY l.label`,
    { entityId },
  );
  return results.map((row) => {
    if (typeof row.l.payment_schedule === 'string') {
      row.l.payment_schedule = JSON.parse(row.l.payment_schedule);
    }
    return row.l;
  });
}

// ============================================================
// Lease Payment Unwinding
// ============================================================

/**
 * Process a lease payment for a given period.
 *
 * 1. Find schedule entry for this period
 * 2. Post interest expense JE: DR Finance Cost / CR Lease Liability
 * 3. Post principal payment JE: DR Lease Liability / CR Cash (via ASSET)
 * 4. Amortize ROU asset: DR Amortization Expense / CR ROU Asset
 * 5. Update balances
 */
export async function processLeasePayment(
  leaseLiabilityId: string,
  rouAssetId: string,
  periodId: string,
): Promise<{
  interestExpense: number;
  principalPayment: number;
  amortizationCharge: number;
  journalEntryIds: string[];
}> {
  const liability = await getLeaseLiability(leaseLiabilityId);
  if (!liability) throw new Error(`LeaseLiability ${leaseLiabilityId} not found`);

  const rouAsset = await getRightOfUseAsset(rouAssetId);
  if (!rouAsset) throw new Error(`RightOfUseAsset ${rouAssetId} not found`);

  const schedule = liability.payment_schedule as LeasePaymentScheduleEntry[];
  const entry = schedule.find((e) => e.period_id === periodId);
  if (!entry) {
    return { interestExpense: 0, principalPayment: 0, amortizationCharge: 0, journalEntryIds: [] };
  }

  const journalEntryIds: string[] = [];
  const entityId = liability.entity_id as string;

  // 1. Interest expense + principal reduction (combined payment JE)
  if (entry.lease_payment_amount > 0.001) {
    const jeId = await postJournalEntry({
      entityId,
      periodId,
      entryType: 'OPERATIONAL',
      reference: `LEASE-PAYMENT-${leaseLiabilityId}`,
      narrative: `Lease payment — interest ${entry.interest_portion}, principal ${entry.principal_portion}`,
      currency: 'CAD',
      validDate: entry.payment_date,
      sourceSystem: 'lease-engine',
      lines: [
        // DR Interest Expense
        {
          side: 'DEBIT',
          amount: entry.interest_portion,
          nodeRefId: leaseLiabilityId,
          nodeRefType: 'LEASE_LIABILITY',
          economicCategory: 'EXPENSE',
        },
        // DR Lease Liability (principal reduction)
        {
          side: 'DEBIT',
          amount: entry.principal_portion,
          nodeRefId: leaseLiabilityId,
          nodeRefType: 'LEASE_LIABILITY',
          economicCategory: 'LIABILITY',
        },
        // CR Cash/Bank (total payment)
        {
          side: 'CREDIT',
          amount: entry.lease_payment_amount,
          nodeRefId: entityId,
          nodeRefType: 'ACTIVITY',
          economicCategory: 'ASSET',
        },
      ],
    });
    journalEntryIds.push(jeId);
  }

  // 2. ROU asset amortization (straight-line)
  const rouCost = Number(rouAsset.cost_at_initial_recognition);
  const leaseTermMonths = Number(rouAsset.lease_term_months);
  const amortizationCharge = rouCost / leaseTermMonths;

  if (amortizationCharge > 0.001) {
    const amortJeId = await postJournalEntry({
      entityId,
      periodId,
      entryType: 'OPERATIONAL',
      reference: `LEASE-AMORT-${rouAssetId}`,
      narrative: `ROU asset amortization for ${rouAsset.label}`,
      currency: 'CAD',
      validDate: entry.payment_date,
      sourceSystem: 'lease-engine',
      lines: [
        {
          side: 'DEBIT',
          amount: Math.round(amortizationCharge * 100) / 100,
          nodeRefId: rouAssetId,
          nodeRefType: 'RIGHT_OF_USE_ASSET',
          economicCategory: 'EXPENSE',
        },
        {
          side: 'CREDIT',
          amount: Math.round(amortizationCharge * 100) / 100,
          nodeRefId: rouAssetId,
          nodeRefType: 'RIGHT_OF_USE_ASSET',
          economicCategory: 'ASSET',
        },
      ],
    });
    journalEntryIds.push(amortJeId);
  }

  // 3. Update LeaseLiability
  const newAccumInterest = Number(liability.accumulated_interest) + entry.interest_portion;
  const newAccumPayments = Number(liability.accumulated_payments) + entry.lease_payment_amount;
  const newRemainingLiability = entry.carrying_amount_after;

  await runCypher(
    `MATCH (l:LeaseLiability {id: $id})
     SET l.accumulated_interest = $accumInterest,
         l.accumulated_payments = $accumPayments,
         l.remaining_liability = $remaining,
         l.updated_at = datetime()`,
    {
      id: leaseLiabilityId,
      accumInterest: newAccumInterest,
      accumPayments: newAccumPayments,
      remaining: newRemainingLiability,
    },
  );

  // 4. Update ROU asset
  const newAccumAmort = Number(rouAsset.accumulated_amortization) + amortizationCharge;
  const newCarrying = rouCost - newAccumAmort - Number(rouAsset.accumulated_impairment);

  await runCypher(
    `MATCH (r:RightOfUseAsset {id: $id})
     SET r.accumulated_amortization = $accumAmort,
         r.carrying_amount = $carrying,
         r.updated_at = datetime()`,
    {
      id: rouAssetId,
      accumAmort: Math.round(newAccumAmort * 100) / 100,
      carrying: Math.round(Math.max(0, newCarrying) * 100) / 100,
    },
  );

  return {
    interestExpense: entry.interest_portion,
    principalPayment: entry.principal_portion,
    amortizationCharge: Math.round(amortizationCharge * 100) / 100,
    journalEntryIds,
  };
}
