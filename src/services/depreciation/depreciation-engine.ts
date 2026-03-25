import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { postJournalEntry } from '../gl/journal-posting-service.js';
import {
  getFixedAsset,
  updateFixedAsset,
  getAssetClassesForAsset,
} from './fixed-asset-service.js';
import type { DepreciationMethod } from '../../schema/neo4j/types.js';

// ============================================================
// Two-Pass Depreciation Engine
// ============================================================

export interface DepreciationResult {
  accountingCharge: number;
  taxCharge: number;
  temporaryDifference: number;
  journalEntryId?: string;
}

/**
 * Calculate depreciation charge for a single period using the specified method.
 */
export function calculateCharge(
  cost: number,
  accumulatedDep: number,
  method: DepreciationMethod,
  usefulLifeYears: number | null,
  ratePct: number | null,
  salvageValue: number,
  isFirstYear: boolean,
  firstYearRule: string,
): number {
  const depreciableBase = cost - salvageValue;
  const remaining = depreciableBase - accumulatedDep;
  if (remaining <= 0.01) return 0;

  let charge = 0;

  switch (method) {
    case 'STRAIGHT_LINE': {
      if (!usefulLifeYears || usefulLifeYears <= 0) return 0;
      // Monthly charge = (cost - salvage) / (life × 12)
      charge = depreciableBase / (usefulLifeYears * 12);
      break;
    }
    case 'DECLINING_BALANCE': {
      if (!ratePct) return 0;
      const bookValue = cost - accumulatedDep;
      // Monthly = (bookValue × rate) / 12 — rate_pct is already a fraction (e.g. 0.55)
      charge = (bookValue * ratePct) / 12;
      break;
    }
    case 'DOUBLE_DECLINING': {
      if (!usefulLifeYears || usefulLifeYears <= 0) return 0;
      const bookValue2 = cost - accumulatedDep;
      const rate = (2 / usefulLifeYears) / 12;
      charge = bookValue2 * rate;
      // Don't depreciate below salvage
      if (cost - accumulatedDep - charge < salvageValue) {
        charge = Math.max(0, cost - accumulatedDep - salvageValue);
      }
      break;
    }
    default:
      // UNITS_OF_PRODUCTION, SUM_OF_YEARS, GDS_TABLE, ADS_TABLE — not yet implemented
      return 0;
  }

  // Apply first-year rule
  if (isFirstYear) {
    switch (firstYearRule) {
      case 'HALF_YEAR':
        charge *= 0.5;
        break;
      case 'MID_QUARTER':
        charge *= 0.375; // approximate mid-quarter
        break;
      case 'MID_MONTH':
        charge *= 0.5; // approximate mid-month
        break;
      // FULL_YEAR and NONE — no adjustment
    }
  }

  // Cap at remaining depreciable amount
  return Math.min(charge, remaining);
}

/**
 * Run the two-pass depreciation for a single FixedAsset in a given period.
 *
 * Pass 1 (Accounting): Uses ACCOUNTING AssetClass (or asset-level overrides)
 * Pass 2 (Tax): Uses CCA or MACRS AssetClass (based on entity jurisdiction)
 *
 * Returns charges and temporary difference, optionally posts JournalEntry.
 */
export async function depreciateAsset(
  fixedAssetId: string,
  periodId: string,
  postJE: boolean = true,
): Promise<DepreciationResult> {
  const asset = await getFixedAsset(fixedAssetId);
  if (!asset) throw new Error(`FixedAsset ${fixedAssetId} not found`);
  if (asset.disposal_date) throw new Error(`FixedAsset ${fixedAssetId} has been disposed`);

  const cost = Number(asset.cost_at_acquisition);
  const acctAccumDep = Number(asset.accumulated_depreciation);
  const taxAccumDep = Number(asset.tax_accumulated_dep);

  // Get asset classes via BELONGS_TO edges
  const assetClasses = await getAssetClassesForAsset(fixedAssetId);

  // Determine if first year (simplified: check accumulated_depreciation == 0)
  const isFirstYear = acctAccumDep < 0.01;

  // --- Pass 1: Accounting depreciation ---
  let accountingCharge = 0;
  const acctClass = assetClasses.find((ac) => ac.classSystem === 'ACCOUNTING');

  if (acctClass) {
    const ac = acctClass.assetClass;
    const overrides = acctClass.overrides;
    const method = (asset.depreciation_method ?? ac.depreciation_method) as DepreciationMethod;
    const usefulLife = (overrides.override_useful_life != null
      ? Number(overrides.override_useful_life)
      : ac.useful_life_years != null ? Number(ac.useful_life_years) : null) as number | null;
    const salvage = (overrides.override_salvage_value != null
      ? Number(overrides.override_salvage_value)
      : (Number(ac.salvage_value_pct ?? 0) / 100) * cost);
    const ratePct = (overrides.override_rate_pct != null
      ? Number(overrides.override_rate_pct)
      : ac.rate_pct != null ? Number(ac.rate_pct) : null) as number | null;

    accountingCharge = calculateCharge(
      cost, acctAccumDep, method, usefulLife, ratePct, salvage,
      isFirstYear, ac.first_year_rule as string,
    );
  } else if (asset.depreciation_method && asset.useful_life_years) {
    // Fallback to asset-level properties
    accountingCharge = calculateCharge(
      cost, acctAccumDep,
      asset.depreciation_method as DepreciationMethod,
      Number(asset.useful_life_years),
      null,
      Number(asset.salvage_value ?? 0),
      isFirstYear, 'FULL_YEAR',
    );
  }

  // --- Pass 2: Tax depreciation ---
  let taxCharge = 0;
  const taxClass = assetClasses.find(
    (ac) => ac.classSystem === 'CCA' || ac.classSystem === 'MACRS',
  );

  if (taxClass) {
    const tc = taxClass.assetClass;
    const overrides = taxClass.overrides;
    const method = tc.depreciation_method as DepreciationMethod;
    const usefulLife = (overrides.override_useful_life != null
      ? Number(overrides.override_useful_life)
      : tc.useful_life_years != null ? Number(tc.useful_life_years) : null) as number | null;
    const salvage = (Number(tc.salvage_value_pct ?? 0) / 100) * cost;
    const ratePct = (overrides.override_rate_pct != null
      ? Number(overrides.override_rate_pct)
      : tc.rate_pct != null ? Number(tc.rate_pct) : null) as number | null;

    const taxIsFirstYear = taxAccumDep < 0.01;

    taxCharge = calculateCharge(
      cost, taxAccumDep, method, usefulLife, ratePct, salvage,
      taxIsFirstYear, tc.first_year_rule as string,
    );
  }

  // --- Update asset ---
  const newAcctAccum = acctAccumDep + accountingCharge;
  const newTaxAccum = taxAccumDep + taxCharge;
  const newCarryingAmount = cost - newAcctAccum - Number(asset.accumulated_impairment);

  await updateFixedAsset(fixedAssetId, {
    accumulated_depreciation: newAcctAccum,
    carrying_amount: newCarryingAmount,
    tax_accumulated_dep: newTaxAccum,
  });

  // --- Update DepreciationSchedule ---
  await updateDepreciationSchedule(fixedAssetId, periodId, accountingCharge, newAcctAccum, newCarryingAmount);

  // --- Post journal entry ---
  let journalEntryId: string | undefined;
  if (postJE && accountingCharge > 0.001) {
    journalEntryId = await postJournalEntry({
      entityId: asset.entity_id as string,
      periodId,
      entryType: 'OPERATIONAL',
      reference: `DEPRECIATION-${fixedAssetId}`,
      narrative: `Monthly depreciation for ${asset.label}`,
      currency: 'CAD', // TODO: from entity
      validDate: new Date().toISOString().split('T')[0],
      sourceSystem: 'depreciation-engine',
      lines: [
        {
          side: 'DEBIT',
          amount: accountingCharge,
          nodeRefId: fixedAssetId,
          nodeRefType: 'FIXED_ASSET',
          economicCategory: 'EXPENSE',
        },
        {
          side: 'CREDIT',
          amount: accountingCharge,
          nodeRefId: fixedAssetId,
          nodeRefType: 'FIXED_ASSET',
          economicCategory: 'ASSET',
        },
      ],
    });
  }

  const temporaryDifference = (cost - newTaxAccum) - newCarryingAmount;

  return { accountingCharge, taxCharge, temporaryDifference, journalEntryId };
}

/**
 * Run depreciation for all active FixedAssets of an entity in a period.
 */
export async function depreciateAllAssets(
  entityId: string,
  periodId: string,
): Promise<{
  assetCount: number;
  totalAccountingCharge: number;
  totalTaxCharge: number;
  journalEntryIds: string[];
}> {
  const results = await runCypher<{ id: string }>(
    `MATCH (f:FixedAsset {entity_id: $entityId})
     WHERE f.disposal_date IS NULL
     RETURN f.id AS id`,
    { entityId },
  );

  let totalAccounting = 0;
  let totalTax = 0;
  const jeIds: string[] = [];
  let assetCount = 0;

  for (const row of results) {
    const result = await depreciateAsset(row.id, periodId);
    if (result.accountingCharge > 0.001 || result.taxCharge > 0.001) {
      assetCount++;
      totalAccounting += result.accountingCharge;
      totalTax += result.taxCharge;
      if (result.journalEntryId) jeIds.push(result.journalEntryId);
    }
  }

  return {
    assetCount,
    totalAccountingCharge: totalAccounting,
    totalTaxCharge: totalTax,
    journalEntryIds: jeIds,
  };
}

// ============================================================
// DepreciationSchedule helpers
// ============================================================

async function updateDepreciationSchedule(
  fixedAssetId: string,
  periodId: string,
  charge: number,
  accumulated: number,
  carryingRemaining: number,
): Promise<void> {
  // Check if schedule exists
  const existing = await runCypher<{ s: Record<string, unknown> }>(
    `MATCH (s:DepreciationSchedule {fixed_asset_id: $fixedAssetId})
     RETURN properties(s) AS s`,
    { fixedAssetId },
  );

  const entry = JSON.stringify({ period_id: periodId, charge, accumulated, carrying_remaining: carryingRemaining });

  if (existing.length === 0) {
    // Create new schedule
    await runCypher(
      `CREATE (s:DepreciationSchedule {
        id: $id, fixed_asset_id: $fixedAssetId,
        schedule: $schedule,
        last_charge_period_id: $periodId,
        revision_history: '[]',
        created_at: datetime(), updated_at: datetime()
      })`,
      {
        id: uuid(),
        fixedAssetId,
        schedule: `[${entry}]`,
        periodId,
      },
    );
  } else {
    // Append to existing schedule
    const currentSchedule: unknown[] = typeof existing[0].s.schedule === 'string'
      ? JSON.parse(existing[0].s.schedule)
      : (existing[0].s.schedule as unknown[]) ?? [];
    currentSchedule.push(JSON.parse(entry));

    await runCypher(
      `MATCH (s:DepreciationSchedule {fixed_asset_id: $fixedAssetId})
       SET s.schedule = $schedule,
           s.last_charge_period_id = $periodId,
           s.updated_at = datetime()`,
      {
        fixedAssetId,
        schedule: JSON.stringify(currentSchedule),
        periodId,
      },
    );
  }
}

export async function getDepreciationSchedule(fixedAssetId: string) {
  const results = await runCypher<{ s: Record<string, unknown> }>(
    `MATCH (s:DepreciationSchedule {fixed_asset_id: $fixedAssetId})
     RETURN properties(s) AS s`,
    { fixedAssetId },
  );
  if (results.length === 0) return null;
  const s = results[0].s;
  if (typeof s.schedule === 'string') s.schedule = JSON.parse(s.schedule);
  if (typeof s.revision_history === 'string') s.revision_history = JSON.parse(s.revision_history);
  return s;
}
