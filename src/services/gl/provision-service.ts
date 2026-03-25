import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { postJournalEntry } from './journal-posting-service.js';
import type {
  ProvisionType, ProbabilityOfOutflow, NodeRefType, EconomicCategory,
} from '../../schema/neo4j/types.js';

// ============================================================
// Provision CRUD (IAS 37 / ASC 450)
// ============================================================

export interface CreateProvisionInput {
  entityId: string;
  label: string;
  provisionType: ProvisionType;
  presentObligationBasis: string;
  probabilityOfOutflow: ProbabilityOfOutflow;
  bestEstimate: number;
  rangeLow?: number;
  rangeHigh?: number;
  discountRate?: number;
  expectedSettlementDate?: string;
  reimbursementAssetId?: string;
}

/**
 * Create a provision. Recognition criteria are enforced:
 * - recognition_criteria_met = true only when probability = PROBABLE
 * - carrying_amount = best_estimate (or discounted PV if discount_rate provided)
 */
export async function createProvision(input: CreateProvisionInput): Promise<string> {
  const id = uuid();
  const recognitionMet = input.probabilityOfOutflow === 'PROBABLE';

  // If discount rate provided and > 0, carrying amount = discounted PV
  let carryingAmount = input.bestEstimate;
  if (input.discountRate && input.discountRate > 0 && input.expectedSettlementDate) {
    const yearsToSettlement = getYearsToSettlement(input.expectedSettlementDate);
    if (yearsToSettlement > 0) {
      carryingAmount = input.bestEstimate / Math.pow(1 + input.discountRate, yearsToSettlement);
      carryingAmount = Math.round(carryingAmount * 100) / 100;
    }
  }

  await runCypher(
    `CREATE (p:Provision {
      id: $id, entity_id: $entityId, label: $label,
      provision_type: $provisionType,
      present_obligation_basis: $presentObligationBasis,
      recognition_criteria_met: $recognitionMet,
      probability_of_outflow: $probability,
      best_estimate: $bestEstimate,
      range_low: $rangeLow,
      range_high: $rangeHigh,
      discount_rate: $discountRate,
      carrying_amount: $carryingAmount,
      unwinding_to_date: 0,
      expected_settlement_date: $expectedSettlementDate,
      reimbursement_asset_id: $reimbursementAssetId,
      last_reviewed_date: date(),
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      label: input.label,
      provisionType: input.provisionType,
      presentObligationBasis: input.presentObligationBasis,
      recognitionMet,
      probability: input.probabilityOfOutflow,
      bestEstimate: input.bestEstimate,
      rangeLow: input.rangeLow ?? null,
      rangeHigh: input.rangeHigh ?? null,
      discountRate: input.discountRate ?? null,
      carryingAmount,
      expectedSettlementDate: input.expectedSettlementDate ?? null,
      reimbursementAssetId: input.reimbursementAssetId ?? null,
    },
  );

  return id;
}

export async function getProvision(id: string) {
  const results = await runCypher<{ p: Record<string, unknown> }>(
    `MATCH (p:Provision {id: $id}) RETURN properties(p) AS p`,
    { id },
  );
  return results[0]?.p ?? null;
}

export async function listProvisions(entityId: string, probabilityFilter?: ProbabilityOfOutflow) {
  let query = `MATCH (p:Provision {entity_id: $entityId})`;
  const params: Record<string, unknown> = { entityId };

  if (probabilityFilter) {
    query += ` WHERE p.probability_of_outflow = $probability`;
    params.probability = probabilityFilter;
  }

  query += ` RETURN properties(p) AS p ORDER BY p.provision_type, p.label`;

  const results = await runCypher<{ p: Record<string, unknown> }>(query, params);
  return results.map((row) => row.p);
}

export interface UpdateProvisionInput {
  bestEstimate?: number;
  rangeLow?: number;
  rangeHigh?: number;
  probabilityOfOutflow?: ProbabilityOfOutflow;
  discountRate?: number;
  expectedSettlementDate?: string;
  presentObligationBasis?: string;
}

/**
 * Update a provision at period-end review. Recalculates carrying amount
 * and updates recognition_criteria_met based on probability.
 */
export async function updateProvision(id: string, updates: UpdateProvisionInput): Promise<boolean> {
  const existing = await getProvision(id);
  if (!existing) return false;

  const bestEstimate = updates.bestEstimate ?? Number(existing.best_estimate);
  const probability = updates.probabilityOfOutflow ?? (existing.probability_of_outflow as ProbabilityOfOutflow);
  const discountRate = updates.discountRate ?? (existing.discount_rate as number | null);
  const expectedSettlement = updates.expectedSettlementDate ?? (existing.expected_settlement_date as string | null);
  const recognitionMet = probability === 'PROBABLE';

  let carryingAmount = bestEstimate;
  if (discountRate && discountRate > 0 && expectedSettlement) {
    const yearsToSettlement = getYearsToSettlement(expectedSettlement);
    if (yearsToSettlement > 0) {
      carryingAmount = bestEstimate / Math.pow(1 + discountRate, yearsToSettlement);
      carryingAmount = Math.round(carryingAmount * 100) / 100;
    }
  }

  const setClauses: string[] = [
    'p.best_estimate = $bestEstimate',
    'p.carrying_amount = $carryingAmount',
    'p.probability_of_outflow = $probability',
    'p.recognition_criteria_met = $recognitionMet',
    'p.last_reviewed_date = date()',
    'p.updated_at = datetime()',
  ];
  const params: Record<string, unknown> = {
    id,
    bestEstimate,
    carryingAmount,
    probability,
    recognitionMet,
  };

  if (updates.rangeLow !== undefined) {
    setClauses.push('p.range_low = $rangeLow');
    params.rangeLow = updates.rangeLow;
  }
  if (updates.rangeHigh !== undefined) {
    setClauses.push('p.range_high = $rangeHigh');
    params.rangeHigh = updates.rangeHigh;
  }
  if (updates.discountRate !== undefined) {
    setClauses.push('p.discount_rate = $discountRate');
    params.discountRate = updates.discountRate;
  }
  if (updates.expectedSettlementDate !== undefined) {
    setClauses.push('p.expected_settlement_date = $expectedSettlementDate');
    params.expectedSettlementDate = updates.expectedSettlementDate;
  }
  if (updates.presentObligationBasis !== undefined) {
    setClauses.push('p.present_obligation_basis = $presentObligationBasis');
    params.presentObligationBasis = updates.presentObligationBasis;
  }

  await runCypher(
    `MATCH (p:Provision {id: $id}) SET ${setClauses.join(', ')}`,
    params,
  );

  return true;
}

/**
 * Delete a provision (e.g., obligation no longer exists).
 */
export async function deleteProvision(id: string): Promise<boolean> {
  const result = await runCypher<{ count: number }>(
    `MATCH (p:Provision {id: $id}) DELETE p RETURN count(p) AS count`,
    { id },
  );
  return (result[0]?.count ?? 0) > 0;
}

// ============================================================
// Provision Recognition (balance sheet posting)
// ============================================================

/**
 * Recognize a PROBABLE provision on the balance sheet by posting a JE.
 * DR Expense (provision expense) / CR Liability (provision)
 *
 * Only posts if recognition_criteria_met = true (PROBABLE).
 * Returns the JE ID or null if not recognized.
 */
export async function recognizeProvision(
  provisionId: string,
  periodId: string,
): Promise<{ journalEntryId: string | null; recognized: boolean }> {
  const provision = await getProvision(provisionId);
  if (!provision) throw new Error(`Provision ${provisionId} not found`);

  if (!provision.recognition_criteria_met) {
    return { journalEntryId: null, recognized: false };
  }

  const carryingAmount = Number(provision.carrying_amount);
  if (carryingAmount < 0.01) {
    return { journalEntryId: null, recognized: false };
  }

  const entityId = provision.entity_id as string;

  const jeId = await postJournalEntry({
    entityId,
    periodId,
    entryType: 'OPERATIONAL',
    reference: `PROVISION-RECOGNIZE-${provisionId}`,
    narrative: `Provision recognition: ${provision.label} (${provision.provision_type})`,
    currency: 'CAD',
    validDate: new Date().toISOString().slice(0, 10),
    sourceSystem: 'provision-engine',
    lines: [
      {
        side: 'DEBIT',
        amount: carryingAmount,
        nodeRefId: provisionId,
        nodeRefType: 'PROVISION',
        economicCategory: 'EXPENSE',
      },
      {
        side: 'CREDIT',
        amount: carryingAmount,
        nodeRefId: provisionId,
        nodeRefType: 'PROVISION',
        economicCategory: 'LIABILITY',
      },
    ],
  });

  return { journalEntryId: jeId, recognized: true };
}

// ============================================================
// Discount Unwinding
// ============================================================

/**
 * Unwind discount on a provision for a period.
 * Posts: DR Finance Cost / CR Provision (liability increase)
 *
 * The unwinding amount = carrying_amount * discount_rate / 12
 * (monthly approximation of continuous unwinding)
 */
export async function unwindProvisionDiscount(
  provisionId: string,
  periodId: string,
): Promise<{ unwindingAmount: number; journalEntryId: string | null }> {
  const provision = await getProvision(provisionId);
  if (!provision) throw new Error(`Provision ${provisionId} not found`);

  const discountRate = Number(provision.discount_rate ?? 0);
  if (discountRate <= 0) {
    return { unwindingAmount: 0, journalEntryId: null };
  }

  const carryingAmount = Number(provision.carrying_amount);
  const monthlyRate = discountRate / 12;
  const unwindingAmount = Math.round(carryingAmount * monthlyRate * 100) / 100;

  if (unwindingAmount < 0.01) {
    return { unwindingAmount: 0, journalEntryId: null };
  }

  const entityId = provision.entity_id as string;

  const jeId = await postJournalEntry({
    entityId,
    periodId,
    entryType: 'OPERATIONAL',
    reference: `PROVISION-UNWIND-${provisionId}`,
    narrative: `Provision discount unwinding: ${provision.label}`,
    currency: 'CAD',
    validDate: new Date().toISOString().slice(0, 10),
    sourceSystem: 'provision-engine',
    lines: [
      {
        side: 'DEBIT',
        amount: unwindingAmount,
        nodeRefId: provisionId,
        nodeRefType: 'PROVISION',
        economicCategory: 'EXPENSE',
      },
      {
        side: 'CREDIT',
        amount: unwindingAmount,
        nodeRefId: provisionId,
        nodeRefType: 'PROVISION',
        economicCategory: 'LIABILITY',
      },
    ],
  });

  // Update carrying amount and unwinding total
  const newCarrying = Math.round((carryingAmount + unwindingAmount) * 100) / 100;
  const newUnwinding = Math.round((Number(provision.unwinding_to_date) + unwindingAmount) * 100) / 100;

  await runCypher(
    `MATCH (p:Provision {id: $id})
     SET p.carrying_amount = $carrying,
         p.unwinding_to_date = $unwinding,
         p.updated_at = datetime()`,
    { id: provisionId, carrying: newCarrying, unwinding: newUnwinding },
  );

  return { unwindingAmount, journalEntryId: jeId };
}

// ============================================================
// Provision Settlement
// ============================================================

/**
 * Settle (use) a provision when the obligation is discharged.
 * Posts: DR Provision (liability) / CR Cash (asset)
 * Any difference between carrying amount and actual settlement is gain/loss.
 */
export async function settleProvision(
  provisionId: string,
  periodId: string,
  actualAmount: number,
): Promise<{ journalEntryId: string; gainOrLoss: number }> {
  const provision = await getProvision(provisionId);
  if (!provision) throw new Error(`Provision ${provisionId} not found`);

  const carryingAmount = Number(provision.carrying_amount);
  const entityId = provision.entity_id as string;

  const lines: Array<{
    side: 'DEBIT' | 'CREDIT';
    amount: number;
    nodeRefId: string;
    nodeRefType: NodeRefType;
    economicCategory: EconomicCategory;
  }> = [];

  // DR Provision (reduce liability by carrying amount)
  lines.push({
    side: 'DEBIT',
    amount: carryingAmount,
    nodeRefId: provisionId,
    nodeRefType: 'PROVISION',
    economicCategory: 'LIABILITY',
  });

  // CR Cash (actual payment)
  lines.push({
    side: 'CREDIT',
    amount: actualAmount,
    nodeRefId: entityId,
    nodeRefType: 'ACTIVITY',
    economicCategory: 'ASSET',
  });

  const gainOrLoss = carryingAmount - actualAmount;

  if (Math.abs(gainOrLoss) >= 0.01) {
    if (gainOrLoss > 0) {
      // Over-provisioned: CR gain (revenue)
      lines.push({
        side: 'CREDIT',
        amount: Math.round(gainOrLoss * 100) / 100,
        nodeRefId: provisionId,
        nodeRefType: 'PROVISION',
        economicCategory: 'REVENUE',
      });
    } else {
      // Under-provisioned: DR additional expense
      lines.push({
        side: 'DEBIT',
        amount: Math.round(Math.abs(gainOrLoss) * 100) / 100,
        nodeRefId: provisionId,
        nodeRefType: 'PROVISION',
        economicCategory: 'EXPENSE',
      });
    }
  }

  const jeId = await postJournalEntry({
    entityId,
    periodId,
    entryType: 'OPERATIONAL',
    reference: `PROVISION-SETTLE-${provisionId}`,
    narrative: `Provision settlement: ${provision.label} — actual ${actualAmount}, carrying ${carryingAmount}`,
    currency: 'CAD',
    validDate: new Date().toISOString().slice(0, 10),
    sourceSystem: 'provision-engine',
    lines,
  });

  // Set carrying to zero
  await runCypher(
    `MATCH (p:Provision {id: $id})
     SET p.carrying_amount = 0,
         p.updated_at = datetime()`,
    { id: provisionId },
  );

  return { journalEntryId: jeId, gainOrLoss: Math.round(gainOrLoss * 100) / 100 };
}

// ============================================================
// Period-End Review
// ============================================================

/**
 * Get all provisions that need review (last_reviewed_date before the period end).
 */
export async function getProvisionsNeedingReview(
  entityId: string,
  periodEndDate: string,
): Promise<Array<Record<string, unknown>>> {
  const results = await runCypher<{ p: Record<string, unknown> }>(
    `MATCH (p:Provision {entity_id: $entityId})
     WHERE p.last_reviewed_date < date($periodEndDate)
       AND p.carrying_amount > 0
     RETURN properties(p) AS p
     ORDER BY p.provision_type, p.label`,
    { entityId, periodEndDate },
  );
  return results.map((row) => row.p);
}

// ============================================================
// Helpers
// ============================================================

function getYearsToSettlement(expectedSettlementDate: string): number {
  const now = new Date();
  const settlement = new Date(expectedSettlementDate);
  const diffMs = settlement.getTime() - now.getTime();
  return Math.max(0, diffMs / (365.25 * 24 * 60 * 60 * 1000));
}
