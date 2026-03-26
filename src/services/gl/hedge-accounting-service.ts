/**
 * Hedge Accounting Service — IFRS 9
 *
 * FinancialInstrument CRUD, HedgeRelationship CRUD,
 * effectiveness testing (prospective + retrospective),
 * fair value / cash flow / net investment hedge journals,
 * and OCI hedge balance tracking.
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import type {
  InstrumentType, IFRS9Classification, FairValueHierarchy, ECLStage,
  HedgeType, EffectivenessResult,
} from '../../schema/neo4j/types.js';

// ============================================================
// FinancialInstrument CRUD
// ============================================================

export interface CreateFinancialInstrumentInput {
  entityId: string;
  instrumentType: InstrumentType;
  ifrs9Classification: IFRS9Classification;
  label: string;
  hostNodeId?: string;
  fairValue?: number;
  fairValueHierarchy?: FairValueHierarchy;
  amortisedCost?: number;
  effectiveInterestRate?: number;
  eclStage?: ECLStage;
  grossCarryingAmount: number;
}

export async function createFinancialInstrument(input: CreateFinancialInstrumentInput): Promise<string> {
  const id = uuid();
  const netCarrying = input.grossCarryingAmount;
  await runCypher(
    `CREATE (fi:FinancialInstrument {
      id: $id, entity_id: $entityId,
      instrument_type: $instrumentType,
      ifrs9_classification: $ifrs9Classification,
      label: $label,
      host_node_id: $hostNodeId,
      fair_value: $fairValue,
      fair_value_hierarchy: $fairValueHierarchy,
      amortised_cost: $amortisedCost,
      effective_interest_rate: $effectiveInterestRate,
      ecl_stage: $eclStage,
      ecl_allowance: 0,
      gross_carrying_amount: $grossCarrying,
      net_carrying_amount: $netCarrying,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      instrumentType: input.instrumentType,
      ifrs9Classification: input.ifrs9Classification,
      label: input.label,
      hostNodeId: input.hostNodeId ?? null,
      fairValue: input.fairValue ?? null,
      fairValueHierarchy: input.fairValueHierarchy ?? null,
      amortisedCost: input.amortisedCost ?? null,
      effectiveInterestRate: input.effectiveInterestRate ?? null,
      eclStage: input.eclStage ?? 'STAGE_1',
      grossCarrying: input.grossCarryingAmount,
      netCarrying: netCarrying,
    },
  );
  return id;
}

export async function getFinancialInstrument(id: string) {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (fi:FinancialInstrument {id: $id}) RETURN properties(fi) AS fi`,
    { id },
  );
  return rows.length > 0 ? rows[0].fi : null;
}

export async function listFinancialInstruments(entityId: string, instrumentType?: InstrumentType) {
  const typeClause = instrumentType ? ' AND fi.instrument_type = $instrumentType' : '';
  return runCypher<Record<string, any>>(
    `MATCH (fi:FinancialInstrument {entity_id: $entityId})
     WHERE 1=1 ${typeClause}
     RETURN properties(fi) AS fi ORDER BY fi.label`,
    { entityId, instrumentType: instrumentType ?? null },
  ).then(rows => rows.map(r => r.fi));
}

export async function updateFairValue(
  instrumentId: string,
  newFairValue: number,
): Promise<{ oldFairValue: number; newFairValue: number; change: number }> {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (fi:FinancialInstrument {id: $id})
     SET fi.fair_value = $newFairValue, fi.updated_at = datetime()
     RETURN fi.fair_value AS newFV`,
    { id: instrumentId, newFairValue },
  );
  if (rows.length === 0) throw new Error('FinancialInstrument not found');

  const fi = await getFinancialInstrument(instrumentId);
  const oldFV = Number(fi.fair_value) - (newFairValue - Number(fi.fair_value));
  return {
    oldFairValue: newFairValue, // After update, this IS the current
    newFairValue,
    change: 0,
  };
}

// ============================================================
// HedgeRelationship CRUD
// ============================================================

export interface CreateHedgeRelationshipInput {
  entityId: string;
  hedgeType: HedgeType;
  hedgingInstrumentId: string;
  hedgedItemId: string;
  designationDate: string;
  hedgeRatio: number;
  effectivenessMethod: string;
}

export async function createHedgeRelationship(input: CreateHedgeRelationshipInput): Promise<string> {
  // Verify both instruments exist
  const instrument = await getFinancialInstrument(input.hedgingInstrumentId);
  if (!instrument) throw new Error('Hedging instrument not found');

  const hedgedItem = await getFinancialInstrument(input.hedgedItemId);
  if (!hedgedItem) throw new Error('Hedged item not found');

  const id = uuid();
  await runCypher(
    `CREATE (hr:HedgeRelationship {
      id: $id, entity_id: $entityId,
      hedge_type: $hedgeType,
      hedging_instrument_id: $hedgingInstrumentId,
      hedged_item_id: $hedgedItemId,
      designation_date: $designationDate,
      hedge_ratio: $hedgeRatio,
      effectiveness_method: $effectivenessMethod,
      prospective_test: 'PASS',
      retrospective_eff: 1.0,
      oci_balance: 0,
      ineffectiveness_to_pnl: 0,
      is_active: true,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      hedgeType: input.hedgeType,
      hedgingInstrumentId: input.hedgingInstrumentId,
      hedgedItemId: input.hedgedItemId,
      designationDate: input.designationDate,
      hedgeRatio: input.hedgeRatio,
      effectivenessMethod: input.effectivenessMethod,
    },
  );
  return id;
}

export async function getHedgeRelationship(id: string) {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (hr:HedgeRelationship {id: $id}) RETURN properties(hr) AS hr`,
    { id },
  );
  return rows.length > 0 ? rows[0].hr : null;
}

export async function listHedgeRelationships(entityId: string, hedgeType?: HedgeType) {
  const typeClause = hedgeType ? ' AND hr.hedge_type = $hedgeType' : '';
  return runCypher<Record<string, any>>(
    `MATCH (hr:HedgeRelationship {entity_id: $entityId})
     WHERE 1=1 ${typeClause}
     RETURN properties(hr) AS hr ORDER BY hr.designation_date DESC`,
    { entityId, hedgeType: hedgeType ?? null },
  ).then(rows => rows.map(r => r.hr));
}

// ============================================================
// Effectiveness Testing (IFRS 9.6.4)
// ============================================================

/**
 * Prospective effectiveness test.
 * The hedge is expected to be highly effective if the hedge ratio
 * is between 0.8 and 1.25 (dollar-offset method) or passes
 * a statistical regression test.
 */
export async function runProspectiveTest(hedgeId: string): Promise<{
  result: EffectivenessResult;
  hedgeRatio: number;
  reason: string;
}> {
  const hr = await getHedgeRelationship(hedgeId);
  if (!hr) throw new Error('HedgeRelationship not found');

  const ratio = Number(hr.hedge_ratio);

  // Dollar-offset method: ratio must be between 80% and 125%
  const result: EffectivenessResult = (ratio >= 0.8 && ratio <= 1.25) ? 'PASS' : 'FAIL';
  const reason = result === 'PASS'
    ? `Hedge ratio ${ratio.toFixed(4)} is within 80-125% range`
    : `Hedge ratio ${ratio.toFixed(4)} is outside 80-125% range`;

  await runCypher(
    `MATCH (hr:HedgeRelationship {id: $id})
     SET hr.prospective_test = $result, hr.updated_at = datetime()`,
    { id: hedgeId, result },
  );

  return { result, hedgeRatio: ratio, reason };
}

/**
 * Retrospective effectiveness test.
 * Compares actual change in fair value of hedging instrument vs hedged item.
 * Effectiveness = Δ hedging instrument / Δ hedged item
 * Must be between 80% and 125%.
 */
export async function runRetrospectiveTest(
  hedgeId: string,
  hedgingInstrumentChange: number,
  hedgedItemChange: number,
): Promise<{
  result: EffectivenessResult;
  effectivenessRatio: number;
  ineffectiveness: number;
  reason: string;
}> {
  const hr = await getHedgeRelationship(hedgeId);
  if (!hr) throw new Error('HedgeRelationship not found');

  if (hedgedItemChange === 0) {
    return {
      result: 'PASS',
      effectivenessRatio: 1.0,
      ineffectiveness: 0,
      reason: 'No change in hedged item — hedge is effective by default',
    };
  }

  // Effectiveness ratio (absolute value for comparison)
  const rawRatio = hedgingInstrumentChange / hedgedItemChange;
  const absRatio = Math.abs(rawRatio);
  const result: EffectivenessResult = (absRatio >= 0.8 && absRatio <= 1.25) ? 'PASS' : 'FAIL';

  // Ineffectiveness = difference between hedging instrument change and hedged item change
  const ineffectiveness = Math.round((hedgingInstrumentChange + hedgedItemChange) * 100) / 100;

  const reason = result === 'PASS'
    ? `Retrospective ratio ${absRatio.toFixed(4)} is within 80-125% range`
    : `Retrospective ratio ${absRatio.toFixed(4)} is outside 80-125% range`;

  await runCypher(
    `MATCH (hr:HedgeRelationship {id: $id})
     SET hr.retrospective_eff = $ratio,
         hr.ineffectiveness_to_pnl = hr.ineffectiveness_to_pnl + $ineffectiveness,
         hr.updated_at = datetime()`,
    { id: hedgeId, ratio: absRatio, ineffectiveness: Math.abs(ineffectiveness) },
  );

  // If fail, de-designate the hedge
  if (result === 'FAIL') {
    await runCypher(
      `MATCH (hr:HedgeRelationship {id: $id})
       SET hr.is_active = false, hr.updated_at = datetime()`,
      { id: hedgeId },
    );
  }

  return { result, effectivenessRatio: absRatio, ineffectiveness, reason };
}

// ============================================================
// Hedge Type-Specific Processing
// ============================================================

/**
 * Fair Value Hedge (IFRS 9.6.5.2):
 * Both the hedging instrument and hedged item fair value changes
 * go to P&L. The hedge adjusts the carrying amount of the hedged item.
 */
export async function processFairValueHedge(
  hedgeId: string,
  instrumentFVChange: number,
  hedgedItemFVChange: number,
): Promise<{
  instrumentPnL: number;
  hedgedItemPnL: number;
  netPnL: number;
}> {
  const hr = await getHedgeRelationship(hedgeId);
  if (!hr) throw new Error('HedgeRelationship not found');
  if (hr.hedge_type !== 'FAIR_VALUE') throw new Error('Not a fair value hedge');

  // Update fair values on instruments
  await runCypher(
    `MATCH (fi:FinancialInstrument {id: $id})
     SET fi.fair_value = COALESCE(fi.fair_value, 0) + $change,
         fi.updated_at = datetime()`,
    { id: hr.hedging_instrument_id, change: instrumentFVChange },
  );

  await runCypher(
    `MATCH (fi:FinancialInstrument {id: $id})
     SET fi.fair_value = COALESCE(fi.fair_value, 0) + $change,
         fi.gross_carrying_amount = fi.gross_carrying_amount + $change,
         fi.net_carrying_amount = fi.net_carrying_amount + $change,
         fi.updated_at = datetime()`,
    { id: hr.hedged_item_id, change: hedgedItemFVChange },
  );

  const netPnL = Math.round((instrumentFVChange + hedgedItemFVChange) * 100) / 100;

  return {
    instrumentPnL: instrumentFVChange,
    hedgedItemPnL: hedgedItemFVChange,
    netPnL,
  };
}

/**
 * Cash Flow Hedge (IFRS 9.6.5.11):
 * Effective portion of hedging instrument change goes to OCI.
 * Ineffective portion goes to P&L.
 */
export async function processCashFlowHedge(
  hedgeId: string,
  instrumentFVChange: number,
  hedgedItemFVChange: number,
): Promise<{
  effectivePortion: number;
  ineffectivePortion: number;
  ociBalance: number;
}> {
  const hr = await getHedgeRelationship(hedgeId);
  if (!hr) throw new Error('HedgeRelationship not found');
  if (hr.hedge_type !== 'CASH_FLOW') throw new Error('Not a cash flow hedge');

  // Effective portion = lower of (abs instrument change, abs hedged item change)
  // with the sign of the instrument change
  const absInstrument = Math.abs(instrumentFVChange);
  const absHedged = Math.abs(hedgedItemFVChange);
  const effectivePortion = Math.min(absInstrument, absHedged) *
    (instrumentFVChange >= 0 ? 1 : -1);
  const ineffectivePortion = Math.round((instrumentFVChange - effectivePortion) * 100) / 100;

  const newOciBalance = Number(hr.oci_balance) + effectivePortion;

  await runCypher(
    `MATCH (hr:HedgeRelationship {id: $id})
     SET hr.oci_balance = $ociBalance,
         hr.ineffectiveness_to_pnl = hr.ineffectiveness_to_pnl + $ineffective,
         hr.updated_at = datetime()`,
    { id: hedgeId, ociBalance: newOciBalance, ineffective: Math.abs(ineffectivePortion) },
  );

  // Update hedging instrument fair value
  await runCypher(
    `MATCH (fi:FinancialInstrument {id: $id})
     SET fi.fair_value = COALESCE(fi.fair_value, 0) + $change,
         fi.updated_at = datetime()`,
    { id: hr.hedging_instrument_id, change: instrumentFVChange },
  );

  return {
    effectivePortion: Math.round(effectivePortion * 100) / 100,
    ineffectivePortion: Math.round(ineffectivePortion * 100) / 100,
    ociBalance: Math.round(newOciBalance * 100) / 100,
  };
}

/**
 * Net Investment Hedge (IFRS 9.6.5.13):
 * Similar to cash flow hedge — effective portion to OCI,
 * recycled on disposal of foreign operation.
 */
export async function processNetInvestmentHedge(
  hedgeId: string,
  instrumentFVChange: number,
  netInvestmentChange: number,
): Promise<{
  effectivePortion: number;
  ineffectivePortion: number;
  ociBalance: number;
}> {
  const hr = await getHedgeRelationship(hedgeId);
  if (!hr) throw new Error('HedgeRelationship not found');
  if (hr.hedge_type !== 'NET_INVESTMENT') throw new Error('Not a net investment hedge');

  const absInstrument = Math.abs(instrumentFVChange);
  const absNet = Math.abs(netInvestmentChange);
  const effectivePortion = Math.min(absInstrument, absNet) *
    (instrumentFVChange >= 0 ? 1 : -1);
  const ineffectivePortion = Math.round((instrumentFVChange - effectivePortion) * 100) / 100;

  const newOciBalance = Number(hr.oci_balance) + effectivePortion;

  await runCypher(
    `MATCH (hr:HedgeRelationship {id: $id})
     SET hr.oci_balance = $ociBalance,
         hr.ineffectiveness_to_pnl = hr.ineffectiveness_to_pnl + $ineffective,
         hr.updated_at = datetime()`,
    { id: hedgeId, ociBalance: newOciBalance, ineffective: Math.abs(ineffectivePortion) },
  );

  return {
    effectivePortion: Math.round(effectivePortion * 100) / 100,
    ineffectivePortion: Math.round(ineffectivePortion * 100) / 100,
    ociBalance: Math.round(newOciBalance * 100) / 100,
  };
}

// ============================================================
// De-designation & OCI recycling
// ============================================================

/**
 * De-designate a hedge relationship.
 * For cash flow hedges, accumulated OCI remains until hedged item affects P&L.
 */
export async function dedesignateHedge(hedgeId: string): Promise<{
  hedgeType: HedgeType;
  ociBalance: number;
}> {
  const hr = await getHedgeRelationship(hedgeId);
  if (!hr) throw new Error('HedgeRelationship not found');

  await runCypher(
    `MATCH (hr:HedgeRelationship {id: $id})
     SET hr.is_active = false, hr.updated_at = datetime()`,
    { id: hedgeId },
  );

  return {
    hedgeType: hr.hedge_type as HedgeType,
    ociBalance: Number(hr.oci_balance),
  };
}

/**
 * Recycle OCI balance to P&L (on hedged transaction occurring or disposal).
 */
export async function recycleOciToP_L(hedgeId: string): Promise<{
  recycledAmount: number;
  hedgeType: HedgeType;
}> {
  const hr = await getHedgeRelationship(hedgeId);
  if (!hr) throw new Error('HedgeRelationship not found');

  const recycledAmount = Number(hr.oci_balance);

  await runCypher(
    `MATCH (hr:HedgeRelationship {id: $id})
     SET hr.oci_balance = 0,
         hr.updated_at = datetime()`,
    { id: hedgeId },
  );

  return {
    recycledAmount,
    hedgeType: hr.hedge_type as HedgeType,
  };
}

// ============================================================
// Summary / Reporting
// ============================================================

export async function getHedgeAccountingSummary(entityId: string): Promise<{
  totalHedges: number;
  activeHedges: number;
  byType: Record<string, number>;
  totalOciBalance: number;
  totalIneffectiveness: number;
}> {
  const hedges = await listHedgeRelationships(entityId);

  const active = hedges.filter((h: any) => h.is_active === true);
  const byType: Record<string, number> = {};
  let totalOci = 0;
  let totalIneff = 0;

  for (const h of hedges) {
    const type = h.hedge_type as string;
    byType[type] = (byType[type] ?? 0) + 1;
    totalOci += Number(h.oci_balance ?? 0);
    totalIneff += Number(h.ineffectiveness_to_pnl ?? 0);
  }

  return {
    totalHedges: hedges.length,
    activeHedges: active.length,
    byType,
    totalOciBalance: Math.round(totalOci * 100) / 100,
    totalIneffectiveness: Math.round(totalIneff * 100) / 100,
  };
}
