import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { emit } from '../../lib/kafka.js';

// ============================================================
// CashFlowEvent CRUD
// ============================================================

export interface CreateCashFlowEventInput {
  entityId: string;
  label: string;
  direction: 'INFLOW' | 'OUTFLOW';
  amount: number;
  currency: string;
  scheduledDate: string;
  earliestDate?: string;
  latestDate?: string;
  discountOfferedPct?: number;
  penaltyRateDaily?: number;
  counterpartyId?: string;
  relationshipSensitivity?: number;
  status?: 'PENDING' | 'SETTLED' | 'CANCELLED';
}

export async function createCashFlowEvent(
  input: CreateCashFlowEventInput,
): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (cfe:CashFlowEvent {
      id: $id, entity_id: $entityId, label: $label,
      direction: $direction, amount: $amount, currency: $currency,
      scheduled_date: date($scheduledDate),
      earliest_date: CASE WHEN $earliestDate IS NOT NULL THEN date($earliestDate) ELSE null END,
      latest_date: CASE WHEN $latestDate IS NOT NULL THEN date($latestDate) ELSE null END,
      discount_offered_pct: $discountPct,
      penalty_rate_daily: $penaltyRate,
      counterparty_id: $counterpartyId,
      relationship_sensitivity: $sensitivity,
      status: $status,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      label: input.label,
      direction: input.direction,
      amount: input.amount,
      currency: input.currency,
      scheduledDate: input.scheduledDate,
      earliestDate: input.earliestDate ?? null,
      latestDate: input.latestDate ?? null,
      discountPct: input.discountOfferedPct ?? null,
      penaltyRate: input.penaltyRateDaily ?? null,
      counterpartyId: input.counterpartyId ?? null,
      sensitivity: input.relationshipSensitivity ?? 0.5,
      status: input.status ?? 'PENDING',
    },
  );
  return id;
}

export async function getCashFlowEvent(id: string) {
  const results = await runCypher<{ cfe: Record<string, unknown> }>(
    `MATCH (cfe:CashFlowEvent {id: $id}) RETURN properties(cfe) AS cfe`,
    { id },
  );
  return results[0]?.cfe ?? null;
}

export async function listCashFlowEvents(entityId: string, status?: string) {
  const params: Record<string, unknown> = { entityId };
  let where = '{entity_id: $entityId}';
  if (status) {
    where = '{entity_id: $entityId, status: $status}';
    params.status = status;
  }
  const results = await runCypher<{ cfe: Record<string, unknown> }>(
    `MATCH (cfe:CashFlowEvent ${where})
     RETURN properties(cfe) AS cfe
     ORDER BY cfe.scheduled_date`,
    params,
  );
  return results.map((r) => r.cfe);
}

export async function settleCashFlowEvent(id: string): Promise<boolean> {
  const result = await runCypher<{ count: number }>(
    `MATCH (cfe:CashFlowEvent {id: $id})
     SET cfe.status = 'SETTLED', cfe.updated_at = datetime()
     RETURN count(cfe) AS count`,
    { id },
  );
  if (Number(result[0]?.count ?? 0) === 0) return false;

  const cfe = await getCashFlowEvent(id);
  if (cfe) {
    await emit('ebg.cashflow', {
      event_id: uuid(),
      event_type: 'CFE_SETTLED',
      sequence_number: Date.now(),
      idempotency_key: `cfe-settled-${id}`,
      entity_id: cfe.entity_id as string,
      timestamp: new Date().toISOString(),
      payload: { cashFlowEventId: id },
    });
  }
  return true;
}

// ============================================================
// CreditFacility CRUD
// ============================================================

export interface CreateCreditFacilityInput {
  entityId: string;
  label: string;
  facilityType: 'REVOLVER' | 'LINE_OF_CREDIT' | 'TERM_LOAN';
  limit: number;
  drawn?: number;
  interestRate: number;
  rateType: 'FIXED' | 'VARIABLE';
  maturityDate: string;
}

export async function createCreditFacility(
  input: CreateCreditFacilityInput,
): Promise<string> {
  const id = uuid();
  const drawn = input.drawn ?? 0;
  await runCypher(
    `CREATE (cf:CreditFacility {
      id: $id, entity_id: $entityId, label: $label,
      facility_type: $facilityType,
      facility_limit: $limit, drawn: $drawn, available: $available,
      interest_rate: $interestRate, rate_type: $rateType,
      maturity_date: date($maturityDate),
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      label: input.label,
      facilityType: input.facilityType,
      limit: input.limit,
      drawn,
      available: input.limit - drawn,
      interestRate: input.interestRate,
      rateType: input.rateType,
      maturityDate: input.maturityDate,
    },
  );
  return id;
}

export async function getCreditFacility(id: string) {
  const results = await runCypher<{ cf: Record<string, unknown> }>(
    `MATCH (cf:CreditFacility {id: $id}) RETURN properties(cf) AS cf`,
    { id },
  );
  return results[0]?.cf ?? null;
}

export async function listCreditFacilities(entityId: string) {
  const results = await runCypher<{ cf: Record<string, unknown> }>(
    `MATCH (cf:CreditFacility {entity_id: $entityId})
     RETURN properties(cf) AS cf ORDER BY cf.label`,
    { entityId },
  );
  return results.map((r) => r.cf);
}

// ============================================================
// FloatWindow Scoring
// ============================================================

export interface FloatWindowResult {
  id: string;
  opportunityType: 'DELAY_PAYABLE' | 'ACCELERATE_RECEIVABLE' | 'INVEST_SURPLUS';
  cashFlowEventId: string;
  windowDays: number;
  floatAmount: number;
  opportunityValue: number;
  discountCost: number;
  netValue: number;
  annualizedDiscountRate: number | null;
  facilityRate: number | null;
  useDiscountOverFacility: boolean | null;
  recommendation: string;
}

/**
 * Score a CashFlowEvent and create a FloatWindow node.
 * Computes opportunity value, discount cost, and net value.
 * Compares to credit facility if available.
 */
export async function scoreFloatWindow(
  cfeId: string,
): Promise<FloatWindowResult | null> {
  const cfe = await getCashFlowEvent(cfeId);
  if (!cfe || cfe.status !== 'PENDING') return null;

  const entityId = cfe.entity_id as string;
  const amount = Number(cfe.amount);
  const direction = cfe.direction as string;
  const scheduledDate = cfe.scheduled_date as string;
  const earliestDate = cfe.earliest_date as string | null;
  const latestDate = cfe.latest_date as string | null;
  const discountPct = cfe.discount_offered_pct != null ? Number(cfe.discount_offered_pct) : null;
  const penaltyRate = cfe.penalty_rate_daily != null ? Number(cfe.penalty_rate_daily) : null;

  let opportunityType: FloatWindowResult['opportunityType'];
  let windowDays: number;
  let opportunityValue: number;
  let discountCost = 0;
  let annualizedRate: number | null = null;

  if (direction === 'OUTFLOW') {
    // DELAY_PAYABLE: opportunity to pay later
    opportunityType = 'DELAY_PAYABLE';
    // Window = latest_date - scheduled_date
    windowDays = latestDate ? dateDiffDays(scheduledDate, latestDate) : 0;

    if (windowDays <= 0) {
      return null; // No float window available
    }

    // Opportunity: keep cash for windowDays (assume money market rate ~4%)
    const investRate = 0.04;
    opportunityValue = Math.round(amount * investRate * (windowDays / 365) * 100) / 100;

    // Cost: penalty if paying late
    if (penaltyRate) {
      discountCost = Math.round(amount * penaltyRate * windowDays * 100) / 100;
    }
  } else {
    // INFLOW: ACCELERATE_RECEIVABLE
    opportunityType = 'ACCELERATE_RECEIVABLE';
    // Window = scheduled_date - earliest_date
    windowDays = earliestDate ? dateDiffDays(earliestDate, scheduledDate) : 0;

    if (windowDays <= 0 && !discountPct) {
      return null;
    }
    if (windowDays <= 0) windowDays = 1; // Prevent division by zero

    // Opportunity: receive cash early
    const investRate = 0.04;
    opportunityValue = Math.round(amount * investRate * (windowDays / 365) * 100) / 100;

    // Cost: discount offered to accelerate
    if (discountPct) {
      discountCost = Math.round(amount * discountPct * 100) / 100;
      // Annualized discount rate = (disc / (1 - disc)) * (365 / window_days)
      annualizedRate = Math.round(
        (discountPct / (1 - discountPct)) * (365 / windowDays) * 10000,
      ) / 10000;
    }
  }

  const netValue = Math.round((opportunityValue - discountCost) * 100) / 100;

  // Compare to credit facility
  const facilities = await listCreditFacilities(entityId);
  let facilityRate: number | null = null;
  let useDiscountOverFacility: boolean | null = null;
  let recommendation: string;

  if (annualizedRate != null && facilities.length > 0) {
    // Find best available facility
    const bestFacility = facilities
      .filter((f) => Number(f.available) >= amount)
      .sort((a, b) => Number(a.interest_rate) - Number(b.interest_rate))[0];

    if (bestFacility) {
      facilityRate = Number(bestFacility.interest_rate);
      useDiscountOverFacility = annualizedRate <= facilityRate;

      if (useDiscountOverFacility) {
        recommendation = `Take discount (${(annualizedRate * 100).toFixed(1)}% annualized) — cheaper than facility (${(facilityRate * 100).toFixed(1)}%)`;
      } else {
        recommendation = `Use credit facility (${(facilityRate * 100).toFixed(1)}%) — cheaper than discount (${(annualizedRate * 100).toFixed(1)}% annualized)`;
      }
    } else {
      recommendation = netValue > 0
        ? `Take opportunity — net value $${netValue.toFixed(2)}`
        : 'Skip — negative net value';
    }
  } else {
    recommendation = netValue > 0
      ? `Take opportunity — net value $${netValue.toFixed(2)}`
      : 'Skip — negative net value';
  }

  // Create FloatWindow node
  const id = uuid();
  await runCypher(
    `MATCH (cfe:CashFlowEvent {id: $cfeId})
     CREATE (fw:FloatWindow {
       id: $id,
       opportunity_type: $opportunityType,
       window_days: $windowDays,
       float_amount: $floatAmount,
       opportunity_value: $opportunityValue,
       discount_cost: $discountCost,
       net_value: $netValue,
       annualized_discount_rate: $annualizedRate,
       created_at: datetime()
     })
     CREATE (cfe)-[:CREATES]->(fw)`,
    {
      cfeId,
      id,
      opportunityType,
      windowDays,
      floatAmount: amount,
      opportunityValue,
      discountCost,
      netValue,
      annualizedRate,
    },
  );

  // Emit event
  await emit('ebg.cashflow', {
    event_id: uuid(),
    event_type: 'FLOAT_WINDOW_CREATED',
    sequence_number: Date.now(),
    idempotency_key: `float-window-${cfeId}`,
    entity_id: entityId,
    timestamp: new Date().toISOString(),
    payload: { floatWindowId: id, cfeId, netValue, opportunityType },
  });

  return {
    id,
    opportunityType,
    cashFlowEventId: cfeId,
    windowDays,
    floatAmount: amount,
    opportunityValue,
    discountCost,
    netValue,
    annualizedDiscountRate: annualizedRate,
    facilityRate,
    useDiscountOverFacility,
    recommendation,
  };
}

/**
 * Score all pending CashFlowEvents for an entity.
 * Returns FloatWindows sorted by net value descending.
 */
export async function scoreEntityFloatWindows(
  entityId: string,
): Promise<FloatWindowResult[]> {
  const events = await listCashFlowEvents(entityId, 'PENDING');
  const windows: FloatWindowResult[] = [];

  for (const cfe of events) {
    const result = await scoreFloatWindow(cfe.id as string);
    if (result) windows.push(result);
  }

  return windows.sort((a, b) => b.netValue - a.netValue);
}

/**
 * Get all FloatWindows for an entity with positive net value.
 */
export async function getFloatWindows(entityId: string) {
  const results = await runCypher<{
    fw: Record<string, unknown>;
    cfeId: string;
    sensitivity: number;
  }>(
    `MATCH (cfe:CashFlowEvent {entity_id: $entityId})-[:CREATES]->(fw:FloatWindow)
     WHERE fw.net_value > 0
     RETURN properties(fw) AS fw, cfe.id AS cfeId,
            COALESCE(cfe.relationship_sensitivity, 0.5) AS sensitivity
     ORDER BY fw.net_value DESC`,
    { entityId },
  );
  return results.map((r) => ({
    ...r.fw,
    cashFlowEventId: r.cfeId,
    relationshipSensitivity: Number(r.sensitivity),
  }));
}

// ============================================================
// AR Discount Analysis
// ============================================================

export interface DiscountAnalysis {
  cashFlowEventId: string;
  amount: number;
  discountPct: number;
  discountAmount: number;
  annualizedRate: number;
  windowDays: number;
  bestFacilityRate: number | null;
  facilityCheaper: boolean;
  recommendation: 'TAKE_DISCOUNT' | 'USE_FACILITY' | 'NO_FACILITY_AVAILABLE';
  savings: number;
}

/**
 * Analyze AR discount vs credit facility for a specific inflow event.
 */
export async function analyzeDiscount(
  cfeId: string,
): Promise<DiscountAnalysis | null> {
  const cfe = await getCashFlowEvent(cfeId);
  if (!cfe || cfe.direction !== 'INFLOW') return null;

  const discountPct = cfe.discount_offered_pct != null ? Number(cfe.discount_offered_pct) : null;
  if (!discountPct) return null;

  const amount = Number(cfe.amount);
  const entityId = cfe.entity_id as string;
  const scheduledDate = cfe.scheduled_date as string;
  const earliestDate = cfe.earliest_date as string | null;

  const windowDays = earliestDate ? dateDiffDays(earliestDate, scheduledDate) : 30;
  const discountAmount = Math.round(amount * discountPct * 100) / 100;
  const annualizedRate = Math.round(
    (discountPct / (1 - discountPct)) * (365 / Math.max(windowDays, 1)) * 10000,
  ) / 10000;

  // Find best credit facility
  const facilities = await listCreditFacilities(entityId);
  const bestFacility = facilities
    .filter((f) => Number(f.available) >= amount)
    .sort((a, b) => Number(a.interest_rate) - Number(b.interest_rate))[0];

  if (!bestFacility) {
    return {
      cashFlowEventId: cfeId,
      amount,
      discountPct,
      discountAmount,
      annualizedRate,
      windowDays,
      bestFacilityRate: null,
      facilityCheaper: false,
      recommendation: 'NO_FACILITY_AVAILABLE',
      savings: 0,
    };
  }

  const facilityRate = Number(bestFacility.interest_rate);
  const facilityCheaper = facilityRate < annualizedRate;

  // Cost of facility for the window
  const facilityCost = Math.round(amount * facilityRate * (windowDays / 365) * 100) / 100;
  const savings = facilityCheaper
    ? Math.round((discountAmount - facilityCost) * 100) / 100
    : 0;

  return {
    cashFlowEventId: cfeId,
    amount,
    discountPct,
    discountAmount,
    annualizedRate,
    windowDays,
    bestFacilityRate: facilityRate,
    facilityCheaper,
    recommendation: facilityCheaper ? 'USE_FACILITY' : 'TAKE_DISCOUNT',
    savings,
  };
}

// ============================================================
// Helpers
// ============================================================

function dateDiffDays(from: string, to: string): number {
  const f = new Date(from);
  const t = new Date(to);
  return Math.round((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24));
}
