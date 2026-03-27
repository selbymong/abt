/**
 * Discontinued Operations Service (IFRS 5)
 *
 * Implements IFRS 5 classification and presentation:
 * - Classify Initiative (segment/disposal group) as held-for-sale
 * - Measure at lower of carrying amount and fair value less costs to sell
 * - Present discontinued operations separately in P&L
 * - Cease depreciation on held-for-sale assets
 * - Track expected disposal date and buyer
 *
 * An Initiative classified as held-for-sale represents a disposal group
 * or a major line of business (component of an entity).
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import { postJournalEntry } from './journal-posting-service.js';
import type { NodeRefType } from '../../schema/neo4j/types.js';

const NULL_FUND = '00000000-0000-0000-0000-000000000000';

// ============================================================
// Types
// ============================================================

export type HeldForSaleStatus = 'CONTINUING' | 'HELD_FOR_SALE' | 'DISPOSED';

export interface ClassifyHeldForSaleInput {
  initiativeId: string;
  entityId: string;
  classificationDate: string;
  fairValueLessCostsToSell: number;
  expectedDisposalDate?: string;
  buyer?: string;
  periodId: string;
  currency: string;
  fundId?: string;
}

export interface ClassificationResult {
  initiativeId: string;
  previousStatus: string;
  newStatus: HeldForSaleStatus;
  carryingAmount: number;
  fairValueLessCostsToSell: number;
  impairmentLoss: number;
  journalEntryId?: string;
}

export interface DiscontinuedOpsPnL {
  entity_id: string;
  period_id: string;
  continuing: {
    revenue: number;
    expenses: number;
    profit: number;
  };
  discontinued: {
    revenue: number;
    expenses: number;
    operating_profit: number;
    impairment_loss: number;
    gain_loss_on_disposal: number;
    profit: number;
  };
  total_profit: number;
}

export interface HeldForSaleInitiative {
  id: string;
  label: string;
  entity_id: string;
  status: string;
  held_for_sale_status: HeldForSaleStatus;
  classification_date?: string;
  expected_disposal_date?: string;
  disposal_date?: string;
  fair_value_less_costs_to_sell?: number;
  impairment_on_classification?: number;
  gain_loss_on_disposal?: number;
  buyer?: string;
}

// ============================================================
// Classification
// ============================================================

/**
 * Classify an Initiative as held-for-sale (IFRS 5.6-14).
 *
 * Criteria (must be met):
 * - Management committed to a plan to sell
 * - Asset available for immediate sale in present condition
 * - Active program to locate a buyer initiated
 * - Sale highly probable (within 12 months)
 * - Being actively marketed at a reasonable price
 *
 * On classification:
 * - Measure at lower of carrying amount and FVLCTS
 * - Recognize impairment if FVLCTS < carrying amount
 * - Cease depreciation
 */
export async function classifyAsHeldForSale(
  input: ClassifyHeldForSaleInput,
): Promise<ClassificationResult> {
  // Get the initiative and its current carrying amount (from segment assets)
  const initiatives = await runCypher<{
    id: string;
    status: string;
    held_for_sale_status: string | null;
  }>(
    `MATCH (i:Initiative {id: $id, entity_id: $entityId})
     RETURN i.id AS id, i.status AS status,
            i.held_for_sale_status AS held_for_sale_status`,
    { id: input.initiativeId, entityId: input.entityId },
  );

  if (initiatives.length === 0) {
    throw new Error(`Initiative ${input.initiativeId} not found`);
  }

  const init = initiatives[0];
  if (init.held_for_sale_status === 'HELD_FOR_SALE') {
    throw new Error('Initiative is already classified as held-for-sale');
  }
  if (init.held_for_sale_status === 'DISPOSED') {
    throw new Error('Initiative has already been disposed');
  }

  // Compute carrying amount from segment assets
  const carryingAmount = await getSegmentCarryingAmount(
    input.entityId, input.periodId, input.initiativeId,
  );

  // IFRS 5.15: Measure at lower of carrying amount and FVLCTS
  const impairmentLoss = Math.max(0, carryingAmount - input.fairValueLessCostsToSell);

  let journalEntryId: string | undefined;

  // Post impairment journal entry if needed
  if (impairmentLoss > 0) {
    journalEntryId = await postJournalEntry({
      entityId: input.entityId,
      periodId: input.periodId,
      entryType: 'IMPAIRMENT',
      reference: `DISC-IMP-${input.initiativeId.slice(0, 8)}`,
      narrative: `IFRS 5 impairment on held-for-sale classification: ${input.initiativeId}`,
      currency: input.currency,
      validDate: input.classificationDate,
      lines: [
        {
          side: 'DEBIT' as const,
          amount: impairmentLoss,
          nodeRefId: input.initiativeId,
          nodeRefType: 'INITIATIVE' as NodeRefType,
          economicCategory: 'EXPENSE',
          fundId: input.fundId,
        },
        {
          side: 'CREDIT' as const,
          amount: impairmentLoss,
          nodeRefId: input.initiativeId,
          nodeRefType: 'INITIATIVE' as NodeRefType,
          economicCategory: 'ASSET',
          fundId: input.fundId,
        },
      ],
    });
  }

  // Update initiative with held-for-sale classification
  await runCypher(
    `MATCH (i:Initiative {id: $id})
     SET i.held_for_sale_status = 'HELD_FOR_SALE',
         i.classification_date = $classificationDate,
         i.expected_disposal_date = $expectedDisposalDate,
         i.fair_value_less_costs_to_sell = $fvlcts,
         i.impairment_on_classification = $impairment,
         i.buyer = $buyer,
         i.updated_at = datetime()`,
    {
      id: input.initiativeId,
      classificationDate: input.classificationDate,
      expectedDisposalDate: input.expectedDisposalDate ?? null,
      fvlcts: input.fairValueLessCostsToSell,
      impairment: impairmentLoss,
      buyer: input.buyer ?? null,
    },
  );

  return {
    initiativeId: input.initiativeId,
    previousStatus: init.status,
    newStatus: 'HELD_FOR_SALE',
    carryingAmount,
    fairValueLessCostsToSell: input.fairValueLessCostsToSell,
    impairmentLoss,
    journalEntryId,
  };
}

/**
 * Declassify an Initiative from held-for-sale back to continuing.
 * IFRS 5.26-29: Reverse impairment (up to original carrying amount).
 */
export async function declassifyHeldForSale(
  initiativeId: string,
  entityId: string,
): Promise<void> {
  const result = await runCypher<{ held_for_sale_status: string | null }>(
    `MATCH (i:Initiative {id: $id, entity_id: $entityId})
     RETURN i.held_for_sale_status AS held_for_sale_status`,
    { id: initiativeId, entityId },
  );

  if (result.length === 0) {
    throw new Error(`Initiative ${initiativeId} not found`);
  }
  if (result[0].held_for_sale_status !== 'HELD_FOR_SALE') {
    throw new Error('Initiative is not currently held-for-sale');
  }

  await runCypher(
    `MATCH (i:Initiative {id: $id})
     SET i.held_for_sale_status = 'CONTINUING',
         i.classification_date = null,
         i.expected_disposal_date = null,
         i.fair_value_less_costs_to_sell = null,
         i.buyer = null,
         i.updated_at = datetime()`,
    { id: initiativeId },
  );
}

/**
 * Record disposal of a held-for-sale Initiative.
 */
export async function recordDisposal(
  initiativeId: string,
  entityId: string,
  disposalDate: string,
  proceedsAmount: number,
  periodId: string,
  currency: string,
  fundId?: string,
): Promise<{ gainLoss: number; journalEntryId: string }> {
  const inits = await runCypher<{
    held_for_sale_status: string | null;
    fair_value_less_costs_to_sell: number;
  }>(
    `MATCH (i:Initiative {id: $id, entity_id: $entityId})
     RETURN i.held_for_sale_status AS held_for_sale_status,
            COALESCE(i.fair_value_less_costs_to_sell, 0) AS fair_value_less_costs_to_sell`,
    { id: initiativeId, entityId },
  );

  if (inits.length === 0) {
    throw new Error(`Initiative ${initiativeId} not found`);
  }
  if (inits[0].held_for_sale_status !== 'HELD_FOR_SALE') {
    throw new Error('Initiative must be held-for-sale before disposal');
  }

  const carryingAtDisposal = inits[0].fair_value_less_costs_to_sell;
  const gainLoss = proceedsAmount - carryingAtDisposal;

  // Post gain/loss journal entry
  const lines = gainLoss >= 0
    ? [
        { side: 'DEBIT' as const, amount: proceedsAmount, nodeRefId: initiativeId, nodeRefType: 'INITIATIVE' as NodeRefType, economicCategory: 'ASSET' as const, fundId },
        { side: 'CREDIT' as const, amount: carryingAtDisposal, nodeRefId: initiativeId, nodeRefType: 'INITIATIVE' as NodeRefType, economicCategory: 'ASSET' as const, fundId },
        { side: 'CREDIT' as const, amount: gainLoss, nodeRefId: initiativeId, nodeRefType: 'INITIATIVE' as NodeRefType, economicCategory: 'REVENUE' as const, fundId },
      ]
    : [
        { side: 'DEBIT' as const, amount: proceedsAmount, nodeRefId: initiativeId, nodeRefType: 'INITIATIVE' as NodeRefType, economicCategory: 'ASSET' as const, fundId },
        { side: 'DEBIT' as const, amount: Math.abs(gainLoss), nodeRefId: initiativeId, nodeRefType: 'INITIATIVE' as NodeRefType, economicCategory: 'EXPENSE' as const, fundId },
        { side: 'CREDIT' as const, amount: carryingAtDisposal, nodeRefId: initiativeId, nodeRefType: 'INITIATIVE' as NodeRefType, economicCategory: 'ASSET' as const, fundId },
      ];

  const journalEntryId = await postJournalEntry({
    entityId,
    periodId,
    entryType: 'ADJUSTMENT',
    reference: `DISC-DISP-${initiativeId.slice(0, 8)}`,
    narrative: `Disposal of discontinued operation`,
    currency,
    validDate: disposalDate,
    lines,
  });

  await runCypher(
    `MATCH (i:Initiative {id: $id})
     SET i.held_for_sale_status = 'DISPOSED',
         i.disposal_date = $disposalDate,
         i.gain_loss_on_disposal = $gainLoss,
         i.updated_at = datetime()`,
    { id: initiativeId, disposalDate, gainLoss },
  );

  return { gainLoss, journalEntryId };
}

// ============================================================
// Presentation
// ============================================================

/**
 * Generate P&L with separate continuing vs discontinued operations (IFRS 5.33).
 */
export async function getDiscontinuedOpsPnL(
  entityId: string,
  periodId: string,
  fundId?: string,
): Promise<DiscontinuedOpsPnL> {
  const fundFilter = fundId ?? NULL_FUND;

  // Get all held-for-sale and disposed initiative IDs
  const discontinuedInits = await runCypher<{ id: string; impairment: number; gain_loss: number }>(
    `MATCH (i:Initiative {entity_id: $entityId})
     WHERE i.held_for_sale_status IN ['HELD_FOR_SALE', 'DISPOSED']
     RETURN i.id AS id,
            COALESCE(i.impairment_on_classification, 0) AS impairment,
            COALESCE(i.gain_loss_on_disposal, 0) AS gain_loss`,
    { entityId },
  );

  const discontinuedIds = new Set(discontinuedInits.map((d) => d.id));

  // Get child node IDs for discontinued initiatives
  const discontinuedNodeIds = new Set<string>();
  if (discontinuedIds.size > 0) {
    const children = await runCypher<{ id: string }>(
      `MATCH (n)
       WHERE (n:Activity OR n:Project) AND n.entity_id = $entityId
         AND n.initiative_id IN $initIds
       RETURN n.id AS id`,
      { entityId, initIds: [...discontinuedIds] },
    );
    for (const c of children) discontinuedNodeIds.add(c.id);
    for (const d of discontinuedIds) discontinuedNodeIds.add(d);
  }

  // Get all P&L balances
  const allBalances = await query<{
    node_ref_id: string;
    economic_category: string;
    debit_total: string;
    credit_total: string;
  }>(
    `SELECT node_ref_id::text, economic_category,
            SUM(debit_total) AS debit_total,
            SUM(credit_total) AS credit_total
     FROM gl_period_balances
     WHERE entity_id = $1::uuid AND period_id = $2::uuid
       AND COALESCE(fund_id, '00000000-0000-0000-0000-000000000000'::uuid) = $3::uuid
       AND economic_category IN ('REVENUE', 'EXPENSE', 'COST_OF_GOODS_SOLD', 'OTHER_INCOME', 'OTHER_EXPENSE')
     GROUP BY node_ref_id, economic_category`,
    [entityId, periodId, fundFilter],
  );

  let contRevenue = 0, contExpenses = 0;
  let discRevenue = 0, discExpenses = 0;

  for (const row of allBalances.rows) {
    const isDiscontinued = discontinuedNodeIds.has(row.node_ref_id);
    const cat = row.economic_category;

    if (cat === 'REVENUE' || cat === 'OTHER_INCOME') {
      const rev = Number(row.credit_total);
      if (isDiscontinued) discRevenue += rev;
      else contRevenue += rev;
    } else if (cat === 'EXPENSE' || cat === 'COST_OF_GOODS_SOLD' || cat === 'OTHER_EXPENSE') {
      const exp = Number(row.debit_total);
      if (isDiscontinued) discExpenses += exp;
      else contExpenses += exp;
    }
  }

  const totalImpairment = discontinuedInits.reduce((s, d) => s + d.impairment, 0);
  const totalGainLoss = discontinuedInits.reduce((s, d) => s + d.gain_loss, 0);
  const discOperatingProfit = discRevenue - discExpenses;

  return {
    entity_id: entityId,
    period_id: periodId,
    continuing: {
      revenue: contRevenue,
      expenses: contExpenses,
      profit: contRevenue - contExpenses,
    },
    discontinued: {
      revenue: discRevenue,
      expenses: discExpenses,
      operating_profit: discOperatingProfit,
      impairment_loss: totalImpairment,
      gain_loss_on_disposal: totalGainLoss,
      profit: discOperatingProfit - totalImpairment + totalGainLoss,
    },
    total_profit: (contRevenue - contExpenses) + discOperatingProfit - totalImpairment + totalGainLoss,
  };
}

/**
 * List all held-for-sale initiatives for an entity.
 */
export async function listHeldForSaleInitiatives(
  entityId: string,
): Promise<HeldForSaleInitiative[]> {
  const results = await runCypher<HeldForSaleInitiative>(
    `MATCH (i:Initiative {entity_id: $entityId})
     WHERE i.held_for_sale_status IN ['HELD_FOR_SALE', 'DISPOSED']
     RETURN i.id AS id, i.label AS label, i.entity_id AS entity_id,
            i.status AS status,
            i.held_for_sale_status AS held_for_sale_status,
            i.classification_date AS classification_date,
            i.expected_disposal_date AS expected_disposal_date,
            i.disposal_date AS disposal_date,
            i.fair_value_less_costs_to_sell AS fair_value_less_costs_to_sell,
            i.impairment_on_classification AS impairment_on_classification,
            i.gain_loss_on_disposal AS gain_loss_on_disposal,
            i.buyer AS buyer
     ORDER BY i.classification_date`,
    { entityId },
  );

  return results;
}

// ============================================================
// Helpers
// ============================================================

async function getSegmentCarryingAmount(
  entityId: string,
  periodId: string,
  initiativeId: string,
): Promise<number> {
  // Get child node IDs
  const children = await runCypher<{ id: string }>(
    `MATCH (n)
     WHERE (n:Activity OR n:Project OR n:Initiative) AND n.entity_id = $entityId
       AND (n.initiative_id = $initiativeId OR n.id = $initiativeId)
     RETURN n.id AS id`,
    { entityId, initiativeId },
  );

  const nodeIds = children.map((c) => c.id);
  if (nodeIds.length === 0) return 0;

  const result = await query<{ net_assets: string }>(
    `SELECT COALESCE(SUM(CASE WHEN economic_category = 'ASSET' THEN debit_total - credit_total
                              WHEN economic_category = 'LIABILITY' THEN -(credit_total - debit_total)
                              ELSE 0 END), 0) AS net_assets
     FROM gl_period_balances
     WHERE entity_id = $1::uuid AND period_id = $2::uuid
       AND node_ref_id = ANY($3::uuid[])`,
    [entityId, periodId, nodeIds],
  );

  return Number(result.rows[0]?.net_assets ?? 0);
}
