import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { postJournalEntry } from './journal-posting-service.js';
import type {
  LeaseClassification, LeasePaymentScheduleEntry, ReportingFramework,
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

// ============================================================
// ASPE Operating Lease (P7-ASPE-LEASES)
// ============================================================

/**
 * ASPE operating lease: no ROU asset or lease liability.
 * Creates a TemporalClaim (PREPAID_EXPENSE) for straight-line expense recognition.
 * Per ASPE Section 3065, operating leases are expensed on a straight-line basis.
 */
export interface CreateAspeLeaseInput {
  entityId: string;
  label: string;
  totalLeasePayments: number;
  leaseTermMonths: number;
  monthlyPayment: number;
  commencementDate: string;
  leaseEndDate: string;
  periodSchedule: { periodId: string; paymentDate: string }[];
  activityRefId?: string;
  currency: string;
  fundId?: string;
}

export interface AspeLeaseResult {
  temporalClaimId: string;
  totalExpense: number;
  monthlyExpense: number;
}

export async function createAspeOperatingLease(
  input: CreateAspeLeaseInput,
): Promise<AspeLeaseResult> {
  const id = uuid();
  const monthlyExpense = Math.round((input.totalLeasePayments / input.leaseTermMonths) * 100) / 100;

  // Build straight-line recognition schedule
  const schedule = input.periodSchedule.map((p) => ({
    period_id: p.periodId,
    amount: monthlyExpense,
  }));

  await runCypher(
    `CREATE (t:TemporalClaim {
      id: $id, entity_id: $entityId,
      claim_type: 'PREPAID_EXPENSE', direction: 'PAYABLE',
      original_amount: $totalPayments,
      recognized_to_date: 0, remaining: $totalPayments,
      currency: $currency,
      recognition_method: 'STRAIGHT_LINE',
      recognition_schedule: $schedule,
      source_node_id: $activityRefId, source_node_type: 'ACTIVITY',
      period_id_opened: $firstPeriodId, period_id_closed: null,
      status: 'OPEN',
      auto_reverse: false,
      collectability_score: 1.0, ecl_allowance: 0, ecl_stage: 'STAGE_1',
      tax_recognition_basis: 'ACCRUAL_BASIS',
      materiality_flag: false,
      aspe_lease: true,
      lease_label: $label,
      lease_commencement_date: $commencementDate,
      lease_end_date: $leaseEndDate,
      lease_term_months: $leaseTermMonths,
      monthly_payment: $monthlyPayment,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      totalPayments: input.totalLeasePayments,
      currency: input.currency,
      schedule: JSON.stringify(schedule),
      activityRefId: input.activityRefId ?? input.entityId,
      firstPeriodId: input.periodSchedule[0]?.periodId ?? null,
      label: input.label,
      commencementDate: input.commencementDate,
      leaseEndDate: input.leaseEndDate,
      leaseTermMonths: input.leaseTermMonths,
      monthlyPayment: input.monthlyPayment,
    },
  );

  return {
    temporalClaimId: id,
    totalExpense: input.totalLeasePayments,
    monthlyExpense,
  };
}

/**
 * Process an ASPE operating lease payment for a given period.
 * Posts a simple expense JE: DR Lease Expense / CR Cash.
 */
export async function processAspeLeasePayment(
  temporalClaimId: string,
  periodId: string,
): Promise<{
  expenseAmount: number;
  journalEntryId: string | null;
}> {
  const claims = await runCypher<Record<string, unknown>>(
    `MATCH (t:TemporalClaim {id: $id})
     RETURN properties(t) AS t`,
    { id: temporalClaimId },
  );

  if (claims.length === 0) {
    throw new Error(`TemporalClaim ${temporalClaimId} not found`);
  }

  const claim = claims[0].t as Record<string, unknown>;
  if (!claim.aspe_lease) {
    throw new Error(`TemporalClaim ${temporalClaimId} is not an ASPE lease`);
  }

  const schedule = typeof claim.recognition_schedule === 'string'
    ? JSON.parse(claim.recognition_schedule)
    : claim.recognition_schedule;

  const entry = (schedule as Array<{ period_id: string; amount: number }>)
    .find((e) => e.period_id === periodId);

  if (!entry) {
    return { expenseAmount: 0, journalEntryId: null };
  }

  const entityId = claim.entity_id as string;
  const currency = claim.currency as string;
  const sourceNodeId = claim.source_node_id as string;

  // Post straight-line lease expense: DR Expense / CR Asset (Cash)
  const jeId = await postJournalEntry({
    entityId,
    periodId,
    entryType: 'OPERATIONAL',
    reference: `ASPE-LEASE-${temporalClaimId.slice(0, 8)}`,
    narrative: `ASPE operating lease expense — ${claim.lease_label}`,
    currency,
    validDate: new Date().toISOString().slice(0, 10),
    sourceSystem: 'lease-engine',
    lines: [
      {
        side: 'DEBIT',
        amount: entry.amount,
        nodeRefId: temporalClaimId,
        nodeRefType: 'TEMPORAL_CLAIM',
        economicCategory: 'EXPENSE',
        fundId: undefined,
      },
      {
        side: 'CREDIT',
        amount: entry.amount,
        nodeRefId: sourceNodeId,
        nodeRefType: 'ACTIVITY',
        economicCategory: 'ASSET',
        fundId: undefined,
      },
    ],
  });

  // Update claim balances
  const newRecognized = Number(claim.recognized_to_date) + entry.amount;
  const newRemaining = Number(claim.original_amount) - newRecognized;
  const newStatus = newRemaining <= 0.01 ? 'FULLY_RECOGNIZED' : 'PARTIALLY_RECOGNIZED';

  await runCypher(
    `MATCH (t:TemporalClaim {id: $id})
     SET t.recognized_to_date = $recognized,
         t.remaining = $remaining,
         t.status = $status,
         t.updated_at = datetime()`,
    {
      id: temporalClaimId,
      recognized: Math.round(newRecognized * 100) / 100,
      remaining: Math.round(Math.max(0, newRemaining) * 100) / 100,
      status: newStatus,
    },
  );

  return { expenseAmount: entry.amount, journalEntryId: jeId };
}

/**
 * Get an ASPE operating lease claim.
 */
export async function getAspeOperatingLease(id: string) {
  const results = await runCypher<{ t: Record<string, unknown> }>(
    `MATCH (t:TemporalClaim {id: $id, aspe_lease: true})
     RETURN properties(t) AS t`,
    { id },
  );
  if (results.length === 0) return null;
  const t = results[0].t;
  if (typeof t.recognition_schedule === 'string') {
    t.recognition_schedule = JSON.parse(t.recognition_schedule);
  }
  return t;
}

/**
 * List ASPE operating leases for an entity.
 */
export async function listAspeOperatingLeases(entityId: string) {
  const results = await runCypher<{ t: Record<string, unknown> }>(
    `MATCH (t:TemporalClaim {entity_id: $entityId, aspe_lease: true})
     RETURN properties(t) AS t ORDER BY t.lease_label`,
    { entityId },
  );
  return results.map((row) => {
    if (typeof row.t.recognition_schedule === 'string') {
      row.t.recognition_schedule = JSON.parse(row.t.recognition_schedule);
    }
    return row.t;
  });
}

/**
 * Framework-aware lease creation.
 * Checks the entity's reporting_framework and routes to the appropriate path:
 * - ASPE → createAspeOperatingLease (TemporalClaim, straight-line)
 * - IFRS / US_GAAP / others → createLease (ROU + LeaseLiability, IFRS 16)
 *
 * Returns a discriminated result indicating which path was taken.
 */
export async function createLeaseFrameworkAware(
  input: CreateLeaseInput & { currency?: string; fundId?: string },
): Promise<
  | { framework: 'ASPE'; temporalClaimId: string; totalExpense: number; monthlyExpense: number }
  | { framework: Exclude<ReportingFramework, 'ASPE'>; rouAssetId: string; leaseLiabilityId: string }
> {
  // Look up entity's reporting framework
  const entities = await runCypher<{ reporting_framework: ReportingFramework }>(
    `MATCH (e:Entity {id: $entityId})
     RETURN e.reporting_framework AS reporting_framework`,
    { entityId: input.entityId },
  );

  if (entities.length === 0) {
    throw new Error(`Entity ${input.entityId} not found`);
  }

  const framework = entities[0].reporting_framework;

  if (framework === 'ASPE') {
    // ASPE: all leases are operating (no ROU/liability)
    const result = await createAspeOperatingLease({
      entityId: input.entityId,
      label: input.label,
      totalLeasePayments: input.totalLeasePayments,
      leaseTermMonths: input.leaseTermMonths,
      monthlyPayment: input.monthlyPayment,
      commencementDate: input.commencementDate,
      leaseEndDate: input.leaseEndDate,
      periodSchedule: input.periodSchedule,
      activityRefId: input.activityRefId,
      currency: input.currency ?? 'CAD',
    });
    return { framework: 'ASPE', ...result };
  }

  // IFRS / US_GAAP / ASNFPO / ASC_958: standard IFRS 16 path
  const result = await createLease(input);
  return { framework: framework as Exclude<ReportingFramework, 'ASPE'>, ...result };
}
