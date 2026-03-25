import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import type {
  DepreciationMethod, ClassSystem, FixedAsset, AssetClassNode,
} from '../../schema/neo4j/types.js';

// ============================================================
// FixedAsset CRUD
// ============================================================

export interface CreateFixedAssetInput {
  entityId: string;
  label: string;
  costAtAcquisition: number;
  acquisitionDate: string;
  activityRefId: string;
  depreciationMethod?: DepreciationMethod;
  usefulLifeYears?: number;
  salvageValue?: number;
  cguId?: string;
}

export async function createFixedAsset(input: CreateFixedAssetInput): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (f:FixedAsset {
      id: $id, entity_id: $entityId, label: $label,
      cost_at_acquisition: $costAtAcquisition,
      accumulated_depreciation: 0,
      accumulated_impairment: 0,
      carrying_amount: $costAtAcquisition,
      depreciation_method: $depreciationMethod,
      useful_life_years: $usefulLifeYears,
      salvage_value: $salvageValue,
      acquisition_date: date($acquisitionDate),
      disposal_date: null,
      cgu_id: $cguId,
      tax_base: $costAtAcquisition,
      tax_accumulated_dep: 0,
      activity_ref_id: $activityRefId,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      label: input.label,
      costAtAcquisition: input.costAtAcquisition,
      depreciationMethod: input.depreciationMethod ?? null,
      usefulLifeYears: input.usefulLifeYears ?? null,
      salvageValue: input.salvageValue ?? null,
      acquisitionDate: input.acquisitionDate,
      cguId: input.cguId ?? null,
      activityRefId: input.activityRefId,
    },
  );
  return id;
}

export async function getFixedAsset(id: string): Promise<FixedAsset | null> {
  const results = await runCypher<{ f: FixedAsset }>(
    `MATCH (f:FixedAsset {id: $id}) RETURN properties(f) AS f`,
    { id },
  );
  return results[0]?.f ?? null;
}

export async function listFixedAssets(entityId: string): Promise<FixedAsset[]> {
  const results = await runCypher<{ f: FixedAsset }>(
    `MATCH (f:FixedAsset {entity_id: $entityId})
     WHERE f.disposal_date IS NULL
     RETURN properties(f) AS f ORDER BY f.label`,
    { entityId },
  );
  return results.map((r) => r.f);
}

export async function updateFixedAsset(
  id: string,
  updates: Record<string, unknown>,
): Promise<boolean> {
  const keys = Object.keys(updates);
  if (keys.length === 0) return false;
  const setParts = keys.map((k) => `f.${k} = $${k}`);
  setParts.push('f.updated_at = datetime()');

  const result = await runCypher<{ id: string }>(
    `MATCH (f:FixedAsset {id: $id}) SET ${setParts.join(', ')} RETURN f.id AS id`,
    { id, ...updates },
  );
  return result.length > 0;
}

export async function disposeFixedAsset(
  id: string,
  disposalDate: string,
  proceedsAmount: number,
): Promise<{ gainLoss: number }> {
  const asset = await getFixedAsset(id);
  if (!asset) throw new Error(`FixedAsset ${id} not found`);

  const carryingAmount = Number(asset.cost_at_acquisition)
    - Number(asset.accumulated_depreciation)
    - Number(asset.accumulated_impairment);
  const gainLoss = proceedsAmount - carryingAmount;

  await runCypher(
    `MATCH (f:FixedAsset {id: $id})
     SET f.disposal_date = date($disposalDate),
         f.carrying_amount = 0,
         f.updated_at = datetime()`,
    { id, disposalDate },
  );

  return { gainLoss };
}

// ============================================================
// AssetClass lookups (reference data — already seeded)
// ============================================================

export async function getAssetClass(id: string): Promise<AssetClassNode | null> {
  const results = await runCypher<{ ac: AssetClassNode }>(
    `MATCH (ac:AssetClass {id: $id}) RETURN properties(ac) AS ac`,
    { id },
  );
  return results[0]?.ac ?? null;
}

export async function getAssetClassByCode(classCode: string): Promise<AssetClassNode | null> {
  const results = await runCypher<{ ac: AssetClassNode }>(
    `MATCH (ac:AssetClass {class_code: $classCode}) RETURN properties(ac) AS ac`,
    { classCode },
  );
  return results[0]?.ac ?? null;
}

export async function listAssetClasses(
  classSystem?: ClassSystem,
  jurisdiction?: string,
): Promise<AssetClassNode[]> {
  let where = '';
  const params: Record<string, unknown> = {};

  if (classSystem && jurisdiction) {
    where = 'WHERE ac.class_system = $classSystem AND ac.jurisdiction = $jurisdiction';
    params.classSystem = classSystem;
    params.jurisdiction = jurisdiction;
  } else if (classSystem) {
    where = 'WHERE ac.class_system = $classSystem';
    params.classSystem = classSystem;
  } else if (jurisdiction) {
    where = 'WHERE ac.jurisdiction = $jurisdiction';
    params.jurisdiction = jurisdiction;
  }

  const results = await runCypher<{ ac: AssetClassNode }>(
    `MATCH (ac:AssetClass) ${where} RETURN properties(ac) AS ac ORDER BY ac.class_code`,
    params,
  );
  return results.map((r) => r.ac);
}

// ============================================================
// BELONGS_TO edge (FixedAsset → AssetClass)
// ============================================================

export interface CreateBelongsToInput {
  fixedAssetId: string;
  assetClassId: string;
  classSystem: ClassSystem;
  overrideRatePct?: number;
  overrideUsefulLife?: number;
  overrideSalvageValue?: number;
  overrideReason?: string;
  effectiveFrom: string;
}

export async function createBelongsToEdge(input: CreateBelongsToInput): Promise<void> {
  await runCypher(
    `MATCH (f:FixedAsset {id: $fixedAssetId})
     MATCH (ac:AssetClass {id: $assetClassId})
     CREATE (f)-[:BELONGS_TO {
       class_system: $classSystem,
       override_rate_pct: $overrideRatePct,
       override_useful_life: $overrideUsefulLife,
       override_salvage_value: $overrideSalvageValue,
       override_reason: $overrideReason,
       effective_from: date($effectiveFrom),
       reclassified_from: null
     }]->(ac)`,
    {
      fixedAssetId: input.fixedAssetId,
      assetClassId: input.assetClassId,
      classSystem: input.classSystem,
      overrideRatePct: input.overrideRatePct ?? null,
      overrideUsefulLife: input.overrideUsefulLife ?? null,
      overrideSalvageValue: input.overrideSalvageValue ?? null,
      overrideReason: input.overrideReason ?? null,
      effectiveFrom: input.effectiveFrom,
    },
  );
}

export async function getAssetClassesForAsset(
  fixedAssetId: string,
): Promise<{ classSystem: string; assetClass: AssetClassNode; overrides: Record<string, unknown> }[]> {
  const results = await runCypher<{
    classSystem: string;
    ac: AssetClassNode;
    overrideRatePct: number | null;
    overrideUsefulLife: number | null;
    overrideSalvageValue: number | null;
  }>(
    `MATCH (f:FixedAsset {id: $fixedAssetId})-[r:BELONGS_TO]->(ac:AssetClass)
     RETURN r.class_system AS classSystem,
            properties(ac) AS ac,
            r.override_rate_pct AS overrideRatePct,
            r.override_useful_life AS overrideUsefulLife,
            r.override_salvage_value AS overrideSalvageValue`,
    { fixedAssetId },
  );

  return results.map((r) => ({
    classSystem: r.classSystem,
    assetClass: r.ac,
    overrides: {
      override_rate_pct: r.overrideRatePct,
      override_useful_life: r.overrideUsefulLife,
      override_salvage_value: r.overrideSalvageValue,
    },
  }));
}

// ============================================================
// UCCPool management (CCA — Canada only)
// ============================================================

export interface CreateUCCPoolInput {
  entityId: string;
  assetClassId: string;
  fiscalYear: string;
  openingUcc: number;
}

export async function createUCCPool(input: CreateUCCPoolInput): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (u:UCCPool {
      id: $id, entity_id: $entityId,
      asset_class_id: $assetClassId,
      fiscal_year: $fiscalYear,
      opening_ucc: $openingUcc,
      additions: 0, disposals_proceeds: 0, adjustments: 0,
      base_for_cca: $openingUcc,
      cca_claimed: 0, cca_maximum: 0,
      closing_ucc: $openingUcc,
      recapture: 0, terminal_loss: 0,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      assetClassId: input.assetClassId,
      fiscalYear: input.fiscalYear,
      openingUcc: input.openingUcc,
    },
  );
  return id;
}

export async function getUCCPool(id: string) {
  const results = await runCypher<{ u: Record<string, unknown> }>(
    `MATCH (u:UCCPool {id: $id}) RETURN properties(u) AS u`,
    { id },
  );
  return results[0]?.u ?? null;
}

export async function getUCCPoolForClass(
  entityId: string,
  assetClassId: string,
  fiscalYear: string,
) {
  const results = await runCypher<{ u: Record<string, unknown> }>(
    `MATCH (u:UCCPool {entity_id: $entityId, asset_class_id: $assetClassId, fiscal_year: $fiscalYear})
     RETURN properties(u) AS u`,
    { entityId, assetClassId, fiscalYear },
  );
  return results[0]?.u ?? null;
}

export async function updateUCCPool(
  id: string,
  updates: Record<string, unknown>,
): Promise<boolean> {
  const keys = Object.keys(updates);
  if (keys.length === 0) return false;
  const setParts = keys.map((k) => `u.${k} = $${k}`);
  setParts.push('u.updated_at = datetime()');

  const result = await runCypher<{ id: string }>(
    `MATCH (u:UCCPool {id: $id}) SET ${setParts.join(', ')} RETURN u.id AS id`,
    { id, ...updates },
  );
  return result.length > 0;
}

/**
 * Calculate CCA for a UCCPool: applies half-year rule to additions,
 * computes maximum CCA, and optionally claims the full or partial amount.
 */
export async function calculateCCA(
  poolId: string,
  claimAmount?: number,
): Promise<{
  ccaMaximum: number;
  ccaClaimed: number;
  closingUcc: number;
  recapture: number;
  terminalLoss: number;
}> {
  const pool = await getUCCPool(poolId);
  if (!pool) throw new Error(`UCCPool ${poolId} not found`);

  // Get the CCA rate from the associated AssetClass
  const acResults = await runCypher<{ rate_pct: number }>(
    `MATCH (ac:AssetClass {id: $assetClassId})
     RETURN ac.rate_pct AS rate_pct`,
    { assetClassId: pool.asset_class_id },
  );
  const ratePct = acResults[0]?.rate_pct ?? 0;

  const openingUcc = Number(pool.opening_ucc);
  const additions = Number(pool.additions);
  const disposals = Number(pool.disposals_proceeds);
  const adjustments = Number(pool.adjustments);

  // Half-year rule: only 50% of net additions eligible in first year
  const netAdditions = additions - disposals;
  const halfYearAdjustment = netAdditions > 0 ? netAdditions * 0.5 : 0;
  const baseForCca = openingUcc + additions - disposals - adjustments - halfYearAdjustment;

  // CCA maximum = base × rate (rate_pct is already a fraction, e.g. 0.55 = 55%)
  const ccaMaximum = Math.max(0, baseForCca * ratePct);

  // Claim amount: default to maximum, can be reduced (CCA is discretionary)
  const ccaClaimed = claimAmount !== undefined
    ? Math.min(claimAmount, ccaMaximum)
    : ccaMaximum;

  // Closing UCC
  let closingUcc = openingUcc + additions - disposals - adjustments - ccaClaimed;

  // Recapture: if closing UCC < 0 (disposals exceed pool), recapture the deficit
  let recapture = 0;
  let terminalLoss = 0;

  if (closingUcc < 0) {
    recapture = Math.abs(closingUcc);
    closingUcc = 0;
  }

  // Terminal loss: if pool is empty (no assets remain) but UCC > 0
  // This would need asset count check — simplified: if disposals >= opening + additions and UCC > 0
  if (disposals >= openingUcc + additions && closingUcc > 0) {
    terminalLoss = closingUcc;
    closingUcc = 0;
  }

  await updateUCCPool(poolId, {
    base_for_cca: baseForCca,
    cca_maximum: ccaMaximum,
    cca_claimed: ccaClaimed,
    closing_ucc: closingUcc,
    recapture,
    terminal_loss: terminalLoss,
  });

  return { ccaMaximum, ccaClaimed, closingUcc, recapture, terminalLoss };
}
