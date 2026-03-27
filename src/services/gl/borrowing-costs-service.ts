/**
 * Borrowing Costs Service (IAS 23)
 *
 * Implements IAS 23 borrowing cost capitalization:
 * - Qualifying assets: assets that necessarily take a substantial period
 *   of time to get ready for their intended use or sale
 * - Capitalization start: when expenditures are incurred, borrowing costs
 *   are being incurred, and activities necessary to prepare the asset are in progress
 * - Suspension: when active development is interrupted for extended periods
 * - Cessation: when substantially all activities to prepare the asset are complete
 * - Interest computation: weighted average rate on general borrowings,
 *   or specific borrowing rate for purpose-built debt
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { postJournalEntry } from './journal-posting-service.js';
import type { CapitalizationStatus, NodeRefType } from '../../schema/neo4j/types.js';

// ============================================================
// Types
// ============================================================

export interface DesignateQualifyingAssetInput {
  assetId: string;
  entityId: string;
  weightedAverageRate: number; // annual rate as decimal (e.g. 0.05 = 5%)
  capitalizationStartDate: string;
}

export interface BorrowingCostCapitalizationInput {
  assetId: string;
  entityId: string;
  periodId: string;
  expenditureAmount: number; // cumulative eligible expenditure for the period
  daysInPeriod: number;
  specificBorrowingRate?: number; // if a specific borrowing, overrides weighted average
  specificBorrowingAmount?: number; // amount of specific borrowing
  investmentIncome?: number; // income earned on temporary investment of specific borrowings
  currency: string;
  fundId?: string;
}

export interface CapitalizationResult {
  assetId: string;
  periodId: string;
  generalBorrowingCost: number;
  specificBorrowingCost: number;
  investmentIncomeDeduction: number;
  netCapitalizedAmount: number;
  journalEntryId: string;
  cumulativeCapitalized: number;
}

export interface QualifyingAssetSummary {
  id: string;
  label: string;
  entity_id: string;
  qualifying_asset: boolean;
  capitalization_status: CapitalizationStatus;
  capitalization_start_date?: string;
  capitalization_end_date?: string;
  borrowing_costs_capitalized: number;
  weighted_average_rate: number;
  cost_at_acquisition: number;
  carrying_amount: number;
}

// ============================================================
// Designate / Update Qualifying Assets
// ============================================================

/**
 * Designate a FixedAsset as a qualifying asset under IAS 23.
 * Begins capitalization tracking.
 */
export async function designateQualifyingAsset(
  input: DesignateQualifyingAssetInput,
): Promise<void> {
  const result = await runCypher<{ count: number }>(
    `MATCH (f:FixedAsset {id: $assetId, entity_id: $entityId})
     SET f.qualifying_asset = true,
         f.capitalization_status = 'ACTIVE',
         f.capitalization_start_date = $startDate,
         f.borrowing_costs_capitalized = COALESCE(f.borrowing_costs_capitalized, 0),
         f.weighted_average_rate = $rate,
         f.updated_at = datetime()
     RETURN count(f) AS count`,
    {
      assetId: input.assetId,
      entityId: input.entityId,
      startDate: input.capitalizationStartDate,
      rate: input.weightedAverageRate,
    },
  );

  if (result[0]?.count === 0) {
    throw new Error(`FixedAsset ${input.assetId} not found`);
  }
}

/**
 * Suspend capitalization (IAS 23.20-21).
 * Capitalization is suspended during extended periods when active
 * development is interrupted.
 */
export async function suspendCapitalization(
  assetId: string,
  entityId: string,
): Promise<void> {
  const result = await runCypher<{ status: CapitalizationStatus }>(
    `MATCH (f:FixedAsset {id: $assetId, entity_id: $entityId, qualifying_asset: true})
     RETURN f.capitalization_status AS status`,
    { assetId, entityId },
  );

  if (result.length === 0) {
    throw new Error(`Qualifying asset ${assetId} not found`);
  }

  if (result[0].status !== 'ACTIVE') {
    throw new Error(`Cannot suspend: asset is ${result[0].status}`);
  }

  await runCypher(
    `MATCH (f:FixedAsset {id: $assetId})
     SET f.capitalization_status = 'SUSPENDED', f.updated_at = datetime()`,
    { assetId },
  );
}

/**
 * Resume capitalization after suspension.
 */
export async function resumeCapitalization(
  assetId: string,
  entityId: string,
): Promise<void> {
  const result = await runCypher<{ status: CapitalizationStatus }>(
    `MATCH (f:FixedAsset {id: $assetId, entity_id: $entityId, qualifying_asset: true})
     RETURN f.capitalization_status AS status`,
    { assetId, entityId },
  );

  if (result.length === 0) {
    throw new Error(`Qualifying asset ${assetId} not found`);
  }

  if (result[0].status !== 'SUSPENDED') {
    throw new Error(`Cannot resume: asset is ${result[0].status}`);
  }

  await runCypher(
    `MATCH (f:FixedAsset {id: $assetId})
     SET f.capitalization_status = 'ACTIVE', f.updated_at = datetime()`,
    { assetId },
  );
}

/**
 * Cease capitalization (IAS 23.22-25).
 * Capitalization ceases when substantially all the activities necessary
 * to prepare the qualifying asset for its intended use or sale are complete.
 */
export async function ceaseCapitalization(
  assetId: string,
  entityId: string,
  cessationDate: string,
): Promise<void> {
  const result = await runCypher<{ status: CapitalizationStatus }>(
    `MATCH (f:FixedAsset {id: $assetId, entity_id: $entityId, qualifying_asset: true})
     RETURN f.capitalization_status AS status`,
    { assetId, entityId },
  );

  if (result.length === 0) {
    throw new Error(`Qualifying asset ${assetId} not found`);
  }

  if (result[0].status === 'CEASED') {
    throw new Error('Capitalization already ceased');
  }

  await runCypher(
    `MATCH (f:FixedAsset {id: $assetId})
     SET f.capitalization_status = 'CEASED',
         f.capitalization_end_date = $cessationDate,
         f.updated_at = datetime()`,
    { assetId, cessationDate },
  );
}

// ============================================================
// Interest Capitalization
// ============================================================

/**
 * Capitalize borrowing costs for a period (IAS 23.10-15).
 *
 * Two types of borrowing costs:
 * 1. Specific borrowings: actual borrowing costs less investment income
 * 2. General borrowings: weighted average capitalization rate × expenditure
 *
 * Posts journal entry: DR FixedAsset (increase cost), CR Interest Payable (or Expense reversal)
 */
export async function capitalizeBorrowingCosts(
  input: BorrowingCostCapitalizationInput,
): Promise<CapitalizationResult> {
  // Verify asset is qualifying and ACTIVE
  const assets = await runCypher<{
    qualifying_asset: boolean;
    capitalization_status: CapitalizationStatus;
    weighted_average_rate: number;
    borrowing_costs_capitalized: number;
  }>(
    `MATCH (f:FixedAsset {id: $assetId, entity_id: $entityId})
     RETURN f.qualifying_asset AS qualifying_asset,
            f.capitalization_status AS capitalization_status,
            f.weighted_average_rate AS weighted_average_rate,
            COALESCE(f.borrowing_costs_capitalized, 0) AS borrowing_costs_capitalized`,
    { assetId: input.assetId, entityId: input.entityId },
  );

  if (assets.length === 0) {
    throw new Error(`FixedAsset ${input.assetId} not found`);
  }

  const asset = assets[0];
  if (!asset.qualifying_asset) {
    throw new Error(`FixedAsset ${input.assetId} is not a qualifying asset`);
  }
  if (asset.capitalization_status !== 'ACTIVE') {
    throw new Error(`Capitalization is ${asset.capitalization_status}, not ACTIVE`);
  }

  // Compute borrowing costs
  const annualDays = 365;
  const periodFraction = input.daysInPeriod / annualDays;

  // Specific borrowing costs (IAS 23.12)
  let specificCost = 0;
  let investmentDeduction = input.investmentIncome ?? 0;
  if (input.specificBorrowingRate !== undefined && input.specificBorrowingAmount !== undefined) {
    specificCost = input.specificBorrowingAmount * input.specificBorrowingRate * periodFraction;
  }

  // General borrowing costs (IAS 23.14)
  // Apply weighted average rate to expenditures not covered by specific borrowings
  const generalExpenditures = input.expenditureAmount - (input.specificBorrowingAmount ?? 0);
  const generalCost = generalExpenditures > 0
    ? generalExpenditures * asset.weighted_average_rate * periodFraction
    : 0;

  const netCapitalized = Math.max(0, specificCost - investmentDeduction + generalCost);

  if (netCapitalized <= 0) {
    // Nothing to capitalize — still return result
    return {
      assetId: input.assetId,
      periodId: input.periodId,
      generalBorrowingCost: generalCost,
      specificBorrowingCost: specificCost,
      investmentIncomeDeduction: investmentDeduction,
      netCapitalizedAmount: 0,
      journalEntryId: '',
      cumulativeCapitalized: asset.borrowing_costs_capitalized,
    };
  }

  // Post journal entry: DR Asset (capitalize), CR Interest Expense
  const journalEntryId = await postJournalEntry({
    entityId: input.entityId,
    periodId: input.periodId,
    entryType: 'ADJUSTMENT',
    reference: `BORCOST-${input.assetId.slice(0, 8)}`,
    narrative: `IAS 23 borrowing cost capitalization`,
    currency: input.currency,
    validDate: new Date().toISOString().slice(0, 10),
    lines: [
      {
        side: 'DEBIT' as const,
        amount: netCapitalized,
        nodeRefId: input.assetId,
        nodeRefType: 'FIXED_ASSET' as NodeRefType,
        economicCategory: 'ASSET',
        fundId: input.fundId,
      },
      {
        side: 'CREDIT' as const,
        amount: netCapitalized,
        nodeRefId: input.assetId,
        nodeRefType: 'FIXED_ASSET' as NodeRefType,
        economicCategory: 'EXPENSE',
        fundId: input.fundId,
      },
    ],
  });

  // Update asset: increase cost and track cumulative capitalized
  const newCumulative = asset.borrowing_costs_capitalized + netCapitalized;
  await runCypher(
    `MATCH (f:FixedAsset {id: $assetId})
     SET f.cost_at_acquisition = f.cost_at_acquisition + $amount,
         f.carrying_amount = f.carrying_amount + $amount,
         f.borrowing_costs_capitalized = $cumulative,
         f.updated_at = datetime()`,
    { assetId: input.assetId, amount: netCapitalized, cumulative: newCumulative },
  );

  return {
    assetId: input.assetId,
    periodId: input.periodId,
    generalBorrowingCost: generalCost,
    specificBorrowingCost: specificCost,
    investmentIncomeDeduction: investmentDeduction,
    netCapitalizedAmount: netCapitalized,
    journalEntryId,
    cumulativeCapitalized: newCumulative,
  };
}

// ============================================================
// Queries
// ============================================================

/**
 * List qualifying assets for an entity.
 */
export async function listQualifyingAssets(
  entityId: string,
  statusFilter?: CapitalizationStatus,
): Promise<QualifyingAssetSummary[]> {
  let where = 'WHERE f.entity_id = $entityId AND f.qualifying_asset = true';
  if (statusFilter) {
    where += ' AND f.capitalization_status = $statusFilter';
  }

  const results = await runCypher<{
    id: string; label: string; entity_id: string;
    qualifying_asset: boolean; capitalization_status: CapitalizationStatus;
    capitalization_start_date: string | null;
    capitalization_end_date: string | null;
    borrowing_costs_capitalized: number;
    weighted_average_rate: number;
    cost_at_acquisition: number; carrying_amount: number;
  }>(
    `MATCH (f:FixedAsset) ${where}
     RETURN f.id AS id, f.label AS label, f.entity_id AS entity_id,
            f.qualifying_asset AS qualifying_asset,
            f.capitalization_status AS capitalization_status,
            f.capitalization_start_date AS capitalization_start_date,
            f.capitalization_end_date AS capitalization_end_date,
            COALESCE(f.borrowing_costs_capitalized, 0) AS borrowing_costs_capitalized,
            COALESCE(f.weighted_average_rate, 0) AS weighted_average_rate,
            f.cost_at_acquisition AS cost_at_acquisition,
            f.carrying_amount AS carrying_amount
     ORDER BY f.label`,
    { entityId, statusFilter: statusFilter ?? null },
  );

  return results.map((r) => ({
    ...r,
    capitalization_start_date: r.capitalization_start_date ?? undefined,
    capitalization_end_date: r.capitalization_end_date ?? undefined,
  }));
}

/**
 * Get borrowing cost summary for a single qualifying asset.
 */
export async function getQualifyingAsset(
  assetId: string,
): Promise<QualifyingAssetSummary | null> {
  const results = await runCypher<{
    id: string; label: string; entity_id: string;
    qualifying_asset: boolean; capitalization_status: CapitalizationStatus;
    capitalization_start_date: string | null;
    capitalization_end_date: string | null;
    borrowing_costs_capitalized: number;
    weighted_average_rate: number;
    cost_at_acquisition: number; carrying_amount: number;
  }>(
    `MATCH (f:FixedAsset {id: $assetId, qualifying_asset: true})
     RETURN f.id AS id, f.label AS label, f.entity_id AS entity_id,
            f.qualifying_asset AS qualifying_asset,
            f.capitalization_status AS capitalization_status,
            f.capitalization_start_date AS capitalization_start_date,
            f.capitalization_end_date AS capitalization_end_date,
            COALESCE(f.borrowing_costs_capitalized, 0) AS borrowing_costs_capitalized,
            COALESCE(f.weighted_average_rate, 0) AS weighted_average_rate,
            f.cost_at_acquisition AS cost_at_acquisition,
            f.carrying_amount AS carrying_amount`,
    { assetId },
  );

  if (results.length === 0) return null;
  const r = results[0];
  return {
    ...r,
    capitalization_start_date: r.capitalization_start_date ?? undefined,
    capitalization_end_date: r.capitalization_end_date ?? undefined,
  };
}
