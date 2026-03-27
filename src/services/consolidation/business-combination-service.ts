import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import type {
  ImpairmentTestResult,
  IntangibleCategory,
  AmortizationMethod,
  PPATargetNodeType,
} from '../../schema/neo4j/types.js';
import { createGoodwill, impairGoodwill } from './consolidation-service.js';

// ============================================================
// BusinessCombination CRUD
// ============================================================

export interface CreateBusinessCombinationInput {
  label: string;
  acquirerEntityId: string;
  acquireeEntityId: string;
  acquisitionDate: string;
  totalConsideration: number;
  considerationCash: number;
  considerationShares: number;
  considerationContingent: number;
  fairValueNetAssets: number;
  ownershipPctAcquired: number;
  nciFairValue?: number;
  functionalCurrency: string;
  minorityInterestMethod?: 'PROPORTIONATE' | 'FULL_GOODWILL';
}

export async function createBusinessCombination(
  input: CreateBusinessCombinationInput,
): Promise<{ id: string; goodwillId: string }> {
  const id = uuid();

  // Compute goodwill arising
  // IFRS 3: Goodwill = Consideration + NCI fair value - Fair value of net assets
  const nciFairValue = input.nciFairValue ?? 0;
  const isFullGoodwill = input.minorityInterestMethod === 'FULL_GOODWILL';
  const goodwillArising = isFullGoodwill
    ? Math.round((input.totalConsideration + nciFairValue - input.fairValueNetAssets) * 100) / 100
    : Math.round((input.totalConsideration - input.ownershipPctAcquired * input.fairValueNetAssets) * 100) / 100;

  const fullGoodwill = isFullGoodwill
    ? goodwillArising
    : undefined;

  await runCypher(
    `CREATE (bc:BusinessCombination {
      id: $id, label: $label,
      acquirer_entity_id: $acquirerId,
      acquiree_entity_id: $acquireeId,
      acquisition_date: date($acquisitionDate),
      total_consideration: $totalConsideration,
      consideration_cash: $cash,
      consideration_shares: $shares,
      consideration_contingent: $contingent,
      fair_value_net_assets: $fvNetAssets,
      ownership_pct_acquired: $pctAcquired,
      goodwill_arising: $goodwillArising,
      nci_fair_value: $nciFairValue,
      full_goodwill: $fullGoodwill,
      ppa_complete: false,
      functional_currency: $currency,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      label: input.label,
      acquirerId: input.acquirerEntityId,
      acquireeId: input.acquireeEntityId,
      acquisitionDate: input.acquisitionDate,
      totalConsideration: input.totalConsideration,
      cash: input.considerationCash,
      shares: input.considerationShares,
      contingent: input.considerationContingent,
      fvNetAssets: input.fairValueNetAssets,
      pctAcquired: input.ownershipPctAcquired,
      goodwillArising: Math.max(0, goodwillArising),
      nciFairValue: nciFairValue || null,
      fullGoodwill: fullGoodwill ?? null,
      currency: input.functionalCurrency,
    },
  );

  // Auto-create the Goodwill node linked to this combination
  const goodwillId = await createGoodwill({
    acquireeEntityId: input.acquireeEntityId,
    grossAmount: Math.max(0, goodwillArising),
    currency: input.functionalCurrency,
    isFullGoodwill,
    nciGoodwillPct: isFullGoodwill && nciFairValue > 0
      ? (nciFairValue / (input.totalConsideration + nciFairValue))
      : undefined,
    taxDeductible: false,
  });

  // Link goodwill to business combination
  await runCypher(
    `MATCH (g:Goodwill {id: $goodwillId})
     SET g.business_combination_id = $bcId`,
    { goodwillId, bcId: id },
  );

  return { id, goodwillId };
}

export async function getBusinessCombination(id: string) {
  const results = await runCypher<{ bc: Record<string, unknown> }>(
    `MATCH (bc:BusinessCombination {id: $id}) RETURN properties(bc) AS bc`,
    { id },
  );
  return results[0]?.bc ?? null;
}

export async function listBusinessCombinations(acquirerEntityId: string) {
  const results = await runCypher<{ bc: Record<string, unknown> }>(
    `MATCH (bc:BusinessCombination {acquirer_entity_id: $acquirerId})
     RETURN properties(bc) AS bc ORDER BY bc.acquisition_date`,
    { acquirerId: acquirerEntityId },
  );
  return results.map((r) => r.bc);
}

export async function completePPA(businessCombinationId: string): Promise<boolean> {
  const result = await runCypher<{ count: number }>(
    `MATCH (bc:BusinessCombination {id: $id})
     SET bc.ppa_complete = true, bc.updated_at = datetime()
     RETURN count(bc) AS count`,
    { id: businessCombinationId },
  );
  return (result[0]?.count ?? 0) > 0;
}

// ============================================================
// PurchasePriceAdjustment CRUD
// ============================================================

export interface CreatePPAInput {
  businessCombinationId: string;
  targetNodeId: string;
  targetNodeType: PPATargetNodeType;
  bookValueAtAcquisition: number;
  fairValueAtAcquisition: number;
  intangibleCategory: IntangibleCategory;
  usefulLifeYears?: number;
  amortizationMethod?: AmortizationMethod;
  taxBasisAdjustment?: number;
  provisional?: boolean;
}

export async function createPPA(input: CreatePPAInput): Promise<string> {
  const id = uuid();
  const adjustmentAmount = Math.round((input.fairValueAtAcquisition - input.bookValueAtAcquisition) * 100) / 100;

  await runCypher(
    `CREATE (ppa:PurchasePriceAdjustment {
      id: $id,
      business_combination_id: $bcId,
      target_node_id: $targetNodeId,
      target_node_type: $targetNodeType,
      book_value_at_acquisition: $bookValue,
      fair_value_at_acquisition: $fairValue,
      adjustment_amount: $adjustment,
      intangible_category: $intangibleCategory,
      useful_life_years: $usefulLife,
      amortization_method: $amortMethod,
      amortized_to_date: 0,
      remaining_book_value: $fairValue,
      tax_basis_adjustment: $taxBasis,
      provisional: $provisional,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      bcId: input.businessCombinationId,
      targetNodeId: input.targetNodeId,
      targetNodeType: input.targetNodeType,
      bookValue: input.bookValueAtAcquisition,
      fairValue: input.fairValueAtAcquisition,
      adjustment: adjustmentAmount,
      intangibleCategory: input.intangibleCategory,
      usefulLife: input.usefulLifeYears ?? null,
      amortMethod: input.amortizationMethod ?? null,
      taxBasis: input.taxBasisAdjustment ?? null,
      provisional: input.provisional ?? true,
    },
  );
  return id;
}

export async function getPPA(id: string) {
  const results = await runCypher<{ ppa: Record<string, unknown> }>(
    `MATCH (ppa:PurchasePriceAdjustment {id: $id}) RETURN properties(ppa) AS ppa`,
    { id },
  );
  return results[0]?.ppa ?? null;
}

export async function listPPAs(businessCombinationId: string) {
  const results = await runCypher<{ ppa: Record<string, unknown> }>(
    `MATCH (ppa:PurchasePriceAdjustment {business_combination_id: $bcId})
     RETURN properties(ppa) AS ppa ORDER BY ppa.created_at`,
    { bcId: businessCombinationId },
  );
  return results.map((r) => r.ppa);
}

/**
 * Amortize a PPA intangible for a period (straight-line or accelerated).
 */
export async function amortizePPA(
  ppaId: string,
  periodCharge: number,
): Promise<boolean> {
  const ppa = await getPPA(ppaId);
  if (!ppa) return false;

  const newAmortized = Math.round((Number(ppa.amortized_to_date) + periodCharge) * 100) / 100;
  const newRemaining = Math.round((Number(ppa.fair_value_at_acquisition) - newAmortized) * 100) / 100;

  await runCypher(
    `MATCH (ppa:PurchasePriceAdjustment {id: $id})
     SET ppa.amortized_to_date = $amortized,
         ppa.remaining_book_value = $remaining,
         ppa.updated_at = datetime()`,
    { id: ppaId, amortized: newAmortized, remaining: Math.max(0, newRemaining) },
  );
  return true;
}

// ============================================================
// CashGeneratingUnit CRUD
// ============================================================

export interface CreateCGUInput {
  label: string;
  entityIds: string[];
  goodwillIds?: string[];
  viuDiscountRate: number;
  viuHorizonYears: number;
  viuTerminalGrowthRate: number;
}

export async function createCGU(input: CreateCGUInput): Promise<string> {
  const id = uuid();

  // Calculate allocated goodwill from referenced goodwill nodes
  let allocatedGoodwill = 0;
  if (input.goodwillIds && input.goodwillIds.length > 0) {
    const gwResult = await runCypher<{ total: number }>(
      `MATCH (g:Goodwill)
       WHERE g.id IN $ids
       RETURN COALESCE(SUM(g.carrying_amount), 0) AS total`,
      { ids: input.goodwillIds },
    );
    allocatedGoodwill = Number(gwResult[0]?.total ?? 0);

    // Link goodwill nodes to this CGU
    await runCypher(
      `MATCH (g:Goodwill)
       WHERE g.id IN $ids
       SET g.cgu_id = $cguId`,
      { ids: input.goodwillIds, cguId: id },
    );
  }

  await runCypher(
    `CREATE (cgu:CashGeneratingUnit {
      id: $id, label: $label,
      entity_ids: $entityIds,
      goodwill_ids: $goodwillIds,
      allocated_goodwill_carrying: $allocatedGoodwill,
      viu_discount_rate: $discountRate,
      viu_horizon_years: $horizon,
      viu_terminal_growth_rate: $terminalGrowth,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      label: input.label,
      entityIds: input.entityIds,
      goodwillIds: input.goodwillIds ?? [],
      allocatedGoodwill: Math.round(allocatedGoodwill * 100) / 100,
      discountRate: input.viuDiscountRate,
      horizon: input.viuHorizonYears,
      terminalGrowth: input.viuTerminalGrowthRate,
    },
  );
  return id;
}

export async function getCGU(id: string) {
  const results = await runCypher<{ cgu: Record<string, unknown> }>(
    `MATCH (cgu:CashGeneratingUnit {id: $id}) RETURN properties(cgu) AS cgu`,
    { id },
  );
  return results[0]?.cgu ?? null;
}

export async function listCGUs(entityId: string) {
  const results = await runCypher<{ cgu: Record<string, unknown> }>(
    `MATCH (cgu:CashGeneratingUnit)
     WHERE $entityId IN cgu.entity_ids
     RETURN properties(cgu) AS cgu ORDER BY cgu.label`,
    { entityId },
  );
  return results.map((r) => r.cgu);
}

// ============================================================
// ImpairmentTest (IAS 36)
// ============================================================

export interface CreateImpairmentTestInput {
  goodwillId: string;
  cguId: string;
  periodId: string;
  testDate: string;
  fvlcod?: number;
  approvedBy?: string;
}

/**
 * Run an IAS 36 impairment test on a CGU.
 *
 * VIU is computed from the CGU's parameters: discount rate, horizon, terminal growth.
 * The carrying amount is the CGU's allocated goodwill + underlying asset carrying values.
 * Recoverable amount = max(VIU, FVLCOD).
 * If carrying > recoverable → impairment loss allocated first to goodwill.
 */
export async function runImpairmentTest(
  input: CreateImpairmentTestInput,
): Promise<{
  impairmentTestId: string;
  result: ImpairmentTestResult;
  impairmentLoss: number;
  headroom: number;
  viuComputed: number;
  recoverableAmount: number;
  carryingAmountTested: number;
}> {
  const id = uuid();

  // Get CGU parameters
  const cgu = await getCGU(input.cguId);
  if (!cgu) throw new Error(`CGU ${input.cguId} not found`);

  const discountRate = Number(cgu.viu_discount_rate);
  const horizon = Number(cgu.viu_horizon_years);
  const terminalGrowth = Number(cgu.viu_terminal_growth_rate);
  const allocatedGoodwill = Number(cgu.allocated_goodwill_carrying);

  // Get carrying amount of underlying assets for entities in this CGU
  const entityIds = cgu.entity_ids as string[];
  const assetResult = await query<{ total: string }>(
    `SELECT COALESCE(SUM(ABS(net_balance)), 0) AS total
     FROM gl_period_balances
     WHERE entity_id = ANY($1)
       AND period_id = $2
       AND economic_category = 'ASSET'`,
    [entityIds, input.periodId],
  );
  const underlyingAssets = Number(assetResult.rows[0]?.total ?? 0);
  const carryingAmountTested = Math.round((allocatedGoodwill + underlyingAssets) * 100) / 100;

  // Compute VIU using simple DCF
  // For a real implementation this would traverse CONTRIBUTES_TO paths;
  // here we use a simplified approach based on CGU parameters
  const projectedCashFlows = computeSimpleVIU(underlyingAssets, discountRate, horizon, terminalGrowth);
  const viuComputed = Math.round(projectedCashFlows * 100) / 100;

  const fvlcod = input.fvlcod ?? 0;
  const recoverableAmount = Math.max(viuComputed, fvlcod);
  const impairmentLoss = Math.max(0, Math.round((carryingAmountTested - recoverableAmount) * 100) / 100);
  const headroom = Math.round((recoverableAmount - carryingAmountTested) * 100) / 100;
  const result: ImpairmentTestResult = impairmentLoss > 0 ? 'IMPAIRED' : 'PASS';

  await runCypher(
    `CREATE (it:ImpairmentTest {
      id: $id, goodwill_id: $goodwillId, cgu_id: $cguId,
      period_id: $periodId, test_date: date($testDate),
      carrying_amount_tested: $carrying,
      viu_computed: $viu, viu_discount_rate: $discountRate,
      viu_horizon_years: $horizon,
      fvlcod: $fvlcod,
      recoverable_amount: $recoverable,
      impairment_loss: $loss,
      result: $result, headroom: $headroom,
      approved_by: $approvedBy,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      goodwillId: input.goodwillId,
      cguId: input.cguId,
      periodId: input.periodId,
      testDate: input.testDate,
      carrying: carryingAmountTested,
      viu: viuComputed,
      discountRate,
      horizon,
      fvlcod: fvlcod || null,
      recoverable: Math.round(recoverableAmount * 100) / 100,
      loss: impairmentLoss,
      result,
      headroom,
      approvedBy: input.approvedBy ?? null,
    },
  );

  // Update CGU with last test info
  await runCypher(
    `MATCH (cgu:CashGeneratingUnit {id: $cguId})
     SET cgu.last_impairment_test_date = date($testDate),
         cgu.last_recoverable_amount = $recoverable,
         cgu.updated_at = datetime()`,
    {
      cguId: input.cguId,
      testDate: input.testDate,
      recoverable: Math.round(recoverableAmount * 100) / 100,
    },
  );

  // If impaired, allocate loss to goodwill first (IAS 36.104)
  if (impairmentLoss > 0) {
    const goodwillImpairment = Math.min(impairmentLoss, allocatedGoodwill);
    if (goodwillImpairment > 0) {
      await impairGoodwill(input.goodwillId, goodwillImpairment, input.testDate);

      // Update CGU's allocated goodwill carrying
      await runCypher(
        `MATCH (cgu:CashGeneratingUnit {id: $cguId})
         SET cgu.allocated_goodwill_carrying = cgu.allocated_goodwill_carrying - $loss,
             cgu.updated_at = datetime()`,
        { cguId: input.cguId, loss: goodwillImpairment },
      );
    }
  }

  return {
    impairmentTestId: id,
    result,
    impairmentLoss,
    headroom,
    viuComputed,
    recoverableAmount: Math.round(recoverableAmount * 100) / 100,
    carryingAmountTested,
  };
}

export async function getImpairmentTest(id: string) {
  const results = await runCypher<{ it: Record<string, unknown> }>(
    `MATCH (it:ImpairmentTest {id: $id}) RETURN properties(it) AS it`,
    { id },
  );
  return results[0]?.it ?? null;
}

export async function listImpairmentTests(cguId: string) {
  const results = await runCypher<{ it: Record<string, unknown> }>(
    `MATCH (it:ImpairmentTest {cgu_id: $cguId})
     RETURN properties(it) AS it ORDER BY it.test_date DESC`,
    { cguId },
  );
  return results.map((r) => r.it);
}

/**
 * Simplified VIU computation using DCF.
 * In production, this would traverse CONTRIBUTES_TO paths from the CGU's entities
 * to compute projected cash flows from ci_point_estimate × path_contribution.
 */
function computeSimpleVIU(
  baseAssetValue: number,
  discountRate: number,
  horizonYears: number,
  terminalGrowthRate: number,
): number {
  if (discountRate <= 0 || horizonYears <= 0) return baseAssetValue;

  // Assume steady cash flow = ~10% of asset base per year as proxy
  const annualCashFlow = baseAssetValue * 0.10;
  let pvSum = 0;

  for (let y = 1; y <= horizonYears; y++) {
    pvSum += annualCashFlow / Math.pow(1 + discountRate, y);
  }

  // Terminal value using Gordon growth model
  if (discountRate > terminalGrowthRate) {
    const terminalCashFlow = annualCashFlow * (1 + terminalGrowthRate);
    const terminalValue = terminalCashFlow / (discountRate - terminalGrowthRate);
    pvSum += terminalValue / Math.pow(1 + discountRate, horizonYears);
  }

  return pvSum;
}
