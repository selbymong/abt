/**
 * Pension Service (IAS 19 — Employee Benefits)
 *
 * Implements defined benefit pension accounting:
 * - DefinedBenefitObligation (DBO) node: present value of obligation
 * - Plan assets tracking
 * - Net defined benefit liability/asset = DBO - plan assets
 * - Current service cost → P&L (operating expense)
 * - Net interest on net DB liability → P&L (finance cost)
 * - Remeasurements → OCI (DB_PENSION component, never recycled to P&L)
 *   - Actuarial gains/losses on DBO
 *   - Return on plan assets (excluding interest income)
 *
 * Actuarial inputs: discount rate, salary growth rate, mortality assumptions.
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { postJournalEntry } from './journal-posting-service.js';
import { recordOCI } from './equity-close-service.js';

// ============================================================
// Types
// ============================================================

export interface CreatePensionPlanInput {
  entityId: string;
  label: string;
  currency: string;
  discountRate: number;
  salaryGrowthRate: number;
  expectedReturnOnAssets: number;
  dboOpening: number;
  planAssetsOpening: number;
  mortalityTable?: string;
  valuationDate: string;
}

export interface PensionPlan {
  id: string;
  entity_id: string;
  label: string;
  currency: string;
  discount_rate: number;
  salary_growth_rate: number;
  expected_return_on_assets: number;
  dbo_opening: number;
  dbo_closing: number;
  plan_assets_opening: number;
  plan_assets_closing: number;
  net_liability: number;
  mortality_table?: string;
  valuation_date: string;
  created_at: string;
  updated_at: string;
}

export interface PensionPeriodInput {
  pensionPlanId: string;
  entityId: string;
  periodId: string;
  currency: string;
  currentServiceCost: number;
  employerContributions: number;
  benefitsPaid: number;
  actuarialGainLossOnDBO: number;
  actualReturnOnAssets: number;
  periodStartDate: string;
  periodEndDate: string;
  fundId?: string;
}

export interface PensionPeriodResult {
  currentServiceCost: number;
  netInterestCost: number;
  remeasurementOCI: number;
  employerContributions: number;
  benefitsPaid: number;
  dboClosing: number;
  planAssetsClosing: number;
  netLiability: number;
  journalEntryIds: string[];
  ociId: string;
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Create a defined benefit pension plan.
 */
export async function createPensionPlan(
  input: CreatePensionPlanInput,
): Promise<string> {
  const id = uuid();
  const netLiability = input.dboOpening - input.planAssetsOpening;

  await runCypher(
    `CREATE (p:DefinedBenefitObligation {
      id: $id, entity_id: $entityId, label: $label,
      currency: $currency,
      discount_rate: $discountRate,
      salary_growth_rate: $salaryGrowthRate,
      expected_return_on_assets: $expectedReturn,
      dbo_opening: $dboOpening,
      dbo_closing: $dboOpening,
      plan_assets_opening: $planAssetsOpening,
      plan_assets_closing: $planAssetsOpening,
      net_liability: $netLiability,
      mortality_table: $mortalityTable,
      valuation_date: $valuationDate,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      label: input.label,
      currency: input.currency,
      discountRate: input.discountRate,
      salaryGrowthRate: input.salaryGrowthRate,
      expectedReturn: input.expectedReturnOnAssets,
      dboOpening: input.dboOpening,
      planAssetsOpening: input.planAssetsOpening,
      netLiability,
      mortalityTable: input.mortalityTable ?? null,
      valuationDate: input.valuationDate,
    },
  );

  return id;
}

/**
 * Get a pension plan by ID.
 */
export async function getPensionPlan(id: string): Promise<PensionPlan | null> {
  const results = await runCypher<{ p: PensionPlan }>(
    `MATCH (p:DefinedBenefitObligation {id: $id})
     RETURN properties(p) AS p`,
    { id },
  );
  return results[0]?.p ?? null;
}

/**
 * List pension plans for an entity.
 */
export async function listPensionPlans(entityId: string): Promise<PensionPlan[]> {
  const results = await runCypher<{ p: PensionPlan }>(
    `MATCH (p:DefinedBenefitObligation {entity_id: $entityId})
     RETURN properties(p) AS p ORDER BY p.label`,
    { entityId },
  );
  return results.map((r) => r.p);
}

/**
 * Process pension for a period. IAS 19 requires three components:
 *
 * 1. **Current service cost** → P&L (operating expense)
 *    DR Employee Benefits Expense / CR Pension Liability
 *
 * 2. **Net interest cost** = DBO × discount_rate - plan_assets × discount_rate
 *    DR Finance Cost / CR Pension Liability (or inverse if plan has surplus)
 *
 * 3. **Remeasurements** → OCI (DB_PENSION, never recycled)
 *    = actuarial gain/loss on DBO + (actual return on assets - interest income on assets)
 *
 * Also processes: employer contributions (increase plan assets),
 * benefits paid (decrease both DBO and plan assets).
 */
export async function processPensionPeriod(
  input: PensionPeriodInput,
): Promise<PensionPeriodResult> {
  const plan = await getPensionPlan(input.pensionPlanId);
  if (!plan) {
    throw new Error(`Pension plan ${input.pensionPlanId} not found`);
  }

  const discountRate = Number(plan.discount_rate);
  const dboOpening = Number(plan.dbo_closing);
  const planAssetsOpening = Number(plan.plan_assets_closing);

  // Calculate net interest
  const interestOnDBO = dboOpening * discountRate;
  const interestOnAssets = planAssetsOpening * discountRate;
  const netInterestCost = Math.round((interestOnDBO - interestOnAssets) * 100) / 100;

  // Calculate remeasurement to OCI
  // Remeasurement = actuarial gain/loss on DBO + (actual return - interest income on assets)
  const assetRemeasurement = input.actualReturnOnAssets - interestOnAssets;
  // Actuarial loss (positive = loss, increases DBO) goes to OCI as negative (debit OCI)
  // Asset outperformance (positive) goes to OCI as positive (credit OCI)
  const remeasurementOCI = Math.round((assetRemeasurement - input.actuarialGainLossOnDBO) * 100) / 100;

  // Roll forward DBO
  const dboClosing = Math.round((
    dboOpening
    + input.currentServiceCost
    + interestOnDBO
    + input.actuarialGainLossOnDBO
    - input.benefitsPaid
  ) * 100) / 100;

  // Roll forward plan assets
  const planAssetsClosing = Math.round((
    planAssetsOpening
    + input.actualReturnOnAssets
    + input.employerContributions
    - input.benefitsPaid
  ) * 100) / 100;

  const netLiability = Math.round((dboClosing - planAssetsClosing) * 100) / 100;

  const journalEntryIds: string[] = [];

  // 1. Current service cost JE: DR Expense / CR Liability
  if (input.currentServiceCost > 0.001) {
    const jeId = await postJournalEntry({
      entityId: input.entityId,
      periodId: input.periodId,
      entryType: 'OPERATIONAL',
      reference: `PENSION-SVC-${input.pensionPlanId.slice(0, 8)}`,
      narrative: `Pension current service cost — ${plan.label}`,
      currency: input.currency,
      validDate: input.periodEndDate,
      sourceSystem: 'pension-engine',
      lines: [
        {
          side: 'DEBIT',
          amount: input.currentServiceCost,
          nodeRefId: input.pensionPlanId,
          nodeRefType: 'PROVISION' as any,
          economicCategory: 'EXPENSE',
          fundId: input.fundId,
        },
        {
          side: 'CREDIT',
          amount: input.currentServiceCost,
          nodeRefId: input.pensionPlanId,
          nodeRefType: 'PROVISION' as any,
          economicCategory: 'LIABILITY',
          fundId: input.fundId,
        },
      ],
    });
    journalEntryIds.push(jeId);
  }

  // 2. Net interest cost JE: DR Finance Cost / CR Liability (or inverse)
  if (Math.abs(netInterestCost) > 0.001) {
    const isNetCost = netInterestCost > 0;
    const jeId = await postJournalEntry({
      entityId: input.entityId,
      periodId: input.periodId,
      entryType: 'OPERATIONAL',
      reference: `PENSION-INT-${input.pensionPlanId.slice(0, 8)}`,
      narrative: `Pension net interest ${isNetCost ? 'cost' : 'income'} — ${plan.label}`,
      currency: input.currency,
      validDate: input.periodEndDate,
      sourceSystem: 'pension-engine',
      lines: [
        {
          side: isNetCost ? 'DEBIT' : 'CREDIT',
          amount: Math.abs(netInterestCost),
          nodeRefId: input.pensionPlanId,
          nodeRefType: 'PROVISION' as any,
          economicCategory: 'EXPENSE',
          fundId: input.fundId,
        },
        {
          side: isNetCost ? 'CREDIT' : 'DEBIT',
          amount: Math.abs(netInterestCost),
          nodeRefId: input.pensionPlanId,
          nodeRefType: 'PROVISION' as any,
          economicCategory: 'LIABILITY',
          fundId: input.fundId,
        },
      ],
    });
    journalEntryIds.push(jeId);
  }

  // 3. Employer contributions JE: DR Liability (plan assets increase) / CR Cash
  if (input.employerContributions > 0.001) {
    const jeId = await postJournalEntry({
      entityId: input.entityId,
      periodId: input.periodId,
      entryType: 'OPERATIONAL',
      reference: `PENSION-CONTRIB-${input.pensionPlanId.slice(0, 8)}`,
      narrative: `Pension employer contribution — ${plan.label}`,
      currency: input.currency,
      validDate: input.periodEndDate,
      sourceSystem: 'pension-engine',
      lines: [
        {
          side: 'DEBIT',
          amount: input.employerContributions,
          nodeRefId: input.pensionPlanId,
          nodeRefType: 'PROVISION' as any,
          economicCategory: 'LIABILITY',
          fundId: input.fundId,
        },
        {
          side: 'CREDIT',
          amount: input.employerContributions,
          nodeRefId: input.entityId,
          nodeRefType: 'ACTIVITY',
          economicCategory: 'ASSET',
          fundId: input.fundId,
        },
      ],
    });
    journalEntryIds.push(jeId);
  }

  // 4. Record remeasurement to OCI (DB_PENSION — never recycled to P&L)
  const ociId = await recordOCI({
    entityId: input.entityId,
    periodId: input.periodId,
    component: 'DB_PENSION',
    currentPeriod: remeasurementOCI,
    sourceNodeId: input.pensionPlanId,
    sourceNodeType: 'PENSION',
  });

  // 5. Update pension plan node
  await runCypher(
    `MATCH (p:DefinedBenefitObligation {id: $id})
     SET p.dbo_closing = $dboClosing,
         p.plan_assets_closing = $planAssetsClosing,
         p.net_liability = $netLiability,
         p.dbo_opening = $dboClosing,
         p.plan_assets_opening = $planAssetsClosing,
         p.updated_at = datetime()`,
    {
      id: input.pensionPlanId,
      dboClosing,
      planAssetsClosing,
      netLiability,
    },
  );

  return {
    currentServiceCost: input.currentServiceCost,
    netInterestCost,
    remeasurementOCI,
    employerContributions: input.employerContributions,
    benefitsPaid: input.benefitsPaid,
    dboClosing,
    planAssetsClosing,
    netLiability,
    journalEntryIds,
    ociId,
  };
}

/**
 * Update actuarial assumptions for a pension plan.
 */
export async function updateActuarialAssumptions(
  pensionPlanId: string,
  updates: {
    discountRate?: number;
    salaryGrowthRate?: number;
    expectedReturnOnAssets?: number;
    mortalityTable?: string;
  },
): Promise<PensionPlan> {
  const setClauses: string[] = [];
  const params: Record<string, unknown> = { id: pensionPlanId };

  if (updates.discountRate !== undefined) {
    setClauses.push('p.discount_rate = $discountRate');
    params.discountRate = updates.discountRate;
  }
  if (updates.salaryGrowthRate !== undefined) {
    setClauses.push('p.salary_growth_rate = $salaryGrowthRate');
    params.salaryGrowthRate = updates.salaryGrowthRate;
  }
  if (updates.expectedReturnOnAssets !== undefined) {
    setClauses.push('p.expected_return_on_assets = $expectedReturn');
    params.expectedReturn = updates.expectedReturnOnAssets;
  }
  if (updates.mortalityTable !== undefined) {
    setClauses.push('p.mortality_table = $mortalityTable');
    params.mortalityTable = updates.mortalityTable;
  }

  if (setClauses.length === 0) {
    const plan = await getPensionPlan(pensionPlanId);
    if (!plan) throw new Error(`Pension plan ${pensionPlanId} not found`);
    return plan;
  }

  setClauses.push('p.updated_at = datetime()');

  const results = await runCypher<{ p: PensionPlan }>(
    `MATCH (p:DefinedBenefitObligation {id: $id})
     SET ${setClauses.join(', ')}
     RETURN properties(p) AS p`,
    params,
  );

  if (results.length === 0) {
    throw new Error(`Pension plan ${pensionPlanId} not found`);
  }
  return results[0].p;
}

/**
 * Get pension summary for an entity across all plans.
 */
export async function getPensionSummary(
  entityId: string,
): Promise<{
  entityId: string;
  plans: PensionPlan[];
  totalDBO: number;
  totalPlanAssets: number;
  totalNetLiability: number;
}> {
  const plans = await listPensionPlans(entityId);

  let totalDBO = 0;
  let totalPlanAssets = 0;
  for (const plan of plans) {
    totalDBO += Number(plan.dbo_closing);
    totalPlanAssets += Number(plan.plan_assets_closing);
  }

  return {
    entityId,
    plans,
    totalDBO: Math.round(totalDBO * 100) / 100,
    totalPlanAssets: Math.round(totalPlanAssets * 100) / 100,
    totalNetLiability: Math.round((totalDBO - totalPlanAssets) * 100) / 100,
  };
}
