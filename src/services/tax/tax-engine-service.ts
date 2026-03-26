import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import { emit } from '../../lib/kafka.js';
import type {
  TaxProvisionStatus,
  TempDiffDirection,
} from '../../schema/neo4j/types.js';

// ============================================================
// Temporary Difference Scanning
// ============================================================

export interface TemporaryDifference {
  sourceNodeId: string;
  sourceNodeType: string;
  accountingCarryingAmt: number;
  taxBase: number;
  temporaryDifference: number;
  direction: TempDiffDirection;
}

/**
 * Scan all nodes for an entity that have both accounting carrying amounts
 * and tax bases, computing temporary differences (IAS 12 / ASC 740).
 * Sources: FixedAsset, RightOfUseAsset, LeaseLiability, Goodwill, TemporalClaim.
 */
export async function getTemporaryDifferences(
  entityId: string,
): Promise<TemporaryDifference[]> {
  const diffs: TemporaryDifference[] = [];

  // FixedAssets: carrying_amount vs tax_base
  const fixedAssets = await runCypher<{
    id: string;
    carrying_amount: number;
    tax_base: number;
  }>(
    `MATCH (fa:FixedAsset {entity_id: $entityId})
     WHERE fa.disposal_date IS NULL
     RETURN fa.id AS id,
            fa.carrying_amount AS carrying_amount,
            COALESCE(fa.tax_base, 0) AS tax_base`,
    { entityId },
  );

  for (const fa of fixedAssets) {
    const accounting = Number(fa.carrying_amount);
    const tax = Number(fa.tax_base);
    const diff = accounting - tax;
    if (Math.abs(diff) > 0.01) {
      diffs.push({
        sourceNodeId: fa.id,
        sourceNodeType: 'FIXED_ASSET',
        accountingCarryingAmt: accounting,
        taxBase: tax,
        temporaryDifference: Math.abs(diff),
        direction: diff > 0 ? 'TAXABLE' : 'DEDUCTIBLE',
      });
    }
  }

  // RightOfUseAssets: carrying_amount vs tax_base (usually 0)
  const rouAssets = await runCypher<{
    id: string;
    carrying_amount: number;
    tax_base: number;
  }>(
    `MATCH (rou:RightOfUseAsset {entity_id: $entityId})
     RETURN rou.id AS id,
            rou.carrying_amount AS carrying_amount,
            COALESCE(rou.tax_base, 0) AS tax_base`,
    { entityId },
  );

  for (const rou of rouAssets) {
    const accounting = Number(rou.carrying_amount);
    const tax = Number(rou.tax_base);
    const diff = accounting - tax;
    if (Math.abs(diff) > 0.01) {
      diffs.push({
        sourceNodeId: rou.id,
        sourceNodeType: 'RIGHT_OF_USE_ASSET',
        accountingCarryingAmt: accounting,
        taxBase: tax,
        temporaryDifference: Math.abs(diff),
        direction: diff > 0 ? 'TAXABLE' : 'DEDUCTIBLE',
      });
    }
  }

  // LeaseLiabilities: carrying_amount vs tax_base (usually 0)
  const leaseLiabs = await runCypher<{
    id: string;
    remaining: number;
    tax_base: number;
  }>(
    `MATCH (ll:LeaseLiability {entity_id: $entityId})
     RETURN ll.id AS id,
            ll.remaining_liability AS remaining,
            COALESCE(ll.tax_base, 0) AS tax_base`,
    { entityId },
  );

  for (const ll of leaseLiabs) {
    const accounting = Number(ll.remaining);
    const tax = Number(ll.tax_base);
    const diff = accounting - tax;
    if (Math.abs(diff) > 0.01) {
      diffs.push({
        sourceNodeId: ll.id,
        sourceNodeType: 'LEASE_LIABILITY',
        accountingCarryingAmt: accounting,
        taxBase: tax,
        temporaryDifference: Math.abs(diff),
        // Liability: higher accounting = deductible (DTA)
        direction: diff > 0 ? 'DEDUCTIBLE' : 'TAXABLE',
      });
    }
  }

  // Goodwill: carrying_amount vs tax_base
  const goodwill = await runCypher<{
    id: string;
    carrying_amount: number;
    tax_base: number;
  }>(
    `MATCH (g:Goodwill {entity_id: $entityId})
     RETURN g.id AS id,
            (g.gross_amount - g.accumulated_impairment) AS carrying_amount,
            COALESCE(g.tax_base, 0) AS tax_base`,
    { entityId },
  );

  for (const g of goodwill) {
    const accounting = Number(g.carrying_amount);
    const tax = Number(g.tax_base);
    const diff = accounting - tax;
    if (Math.abs(diff) > 0.01) {
      diffs.push({
        sourceNodeId: g.id,
        sourceNodeType: 'GOODWILL',
        accountingCarryingAmt: accounting,
        taxBase: tax,
        temporaryDifference: Math.abs(diff),
        direction: diff > 0 ? 'TAXABLE' : 'DEDUCTIBLE',
      });
    }
  }

  return diffs;
}

// ============================================================
// DeferredTaxPosition Computation
// ============================================================

export interface ComputeDeferredTaxInput {
  entityId: string;
  periodId: string;
  taxRate: number; // e.g., 0.265 for 26.5%
}

export interface DeferredTaxResult {
  positions: Array<{
    id: string;
    sourceNodeId: string;
    sourceNodeType: string;
    temporaryDifference: number;
    direction: TempDiffDirection;
    deferredTaxAmount: number;
    recognitionCriteriaMet: boolean;
  }>;
  totalDTA: number;
  totalDTL: number;
  netDeferredTax: number; // positive = net DTL, negative = net DTA
}

/**
 * Compute DeferredTaxPosition nodes for an entity for a given period.
 * Creates/updates DeferredTaxPosition nodes in Neo4j.
 * IAS 12: deferred_tax_amount = temporary_difference × tax_rate
 */
export async function computeDeferredTax(
  input: ComputeDeferredTaxInput,
): Promise<DeferredTaxResult> {
  const diffs = await getTemporaryDifferences(input.entityId);

  const positions: DeferredTaxResult['positions'] = [];
  let totalDTA = 0;
  let totalDTL = 0;

  for (const diff of diffs) {
    const id = uuid();
    const deferredTaxAmount = diff.temporaryDifference * input.taxRate;
    // DTA recognition: assume criteria met for all deductible differences
    // (in production, management judgment required for DTA recognition)
    const recognitionCriteriaMet = true;

    await runCypher(
      `CREATE (dtp:DeferredTaxPosition {
         id: $id,
         entity_id: $entityId,
         period_id: $periodId,
         source_node_id: $sourceNodeId,
         source_node_type: $sourceNodeType,
         accounting_carrying_amt: $accountingCarryingAmt,
         tax_base: $taxBase,
         temporary_difference: $temporaryDifference,
         direction: $direction,
         tax_rate_applicable: $taxRate,
         deferred_tax_amount: $deferredTaxAmount,
         recognition_criteria_met: $recognitionCriteriaMet,
         created_at: datetime(), updated_at: datetime()
       })`,
      {
        id,
        entityId: input.entityId,
        periodId: input.periodId,
        sourceNodeId: diff.sourceNodeId,
        sourceNodeType: diff.sourceNodeType,
        accountingCarryingAmt: diff.accountingCarryingAmt,
        taxBase: diff.taxBase,
        temporaryDifference: diff.temporaryDifference,
        direction: diff.direction,
        taxRate: input.taxRate,
        deferredTaxAmount,
        recognitionCriteriaMet,
      },
    );

    if (diff.direction === 'DEDUCTIBLE' && recognitionCriteriaMet) {
      totalDTA += deferredTaxAmount;
    } else if (diff.direction === 'TAXABLE') {
      totalDTL += deferredTaxAmount;
    }

    positions.push({
      id,
      sourceNodeId: diff.sourceNodeId,
      sourceNodeType: diff.sourceNodeType,
      temporaryDifference: diff.temporaryDifference,
      direction: diff.direction,
      deferredTaxAmount: Math.round(deferredTaxAmount * 100) / 100,
      recognitionCriteriaMet,
    });
  }

  return {
    positions,
    totalDTA: Math.round(totalDTA * 100) / 100,
    totalDTL: Math.round(totalDTL * 100) / 100,
    netDeferredTax: Math.round((totalDTL - totalDTA) * 100) / 100,
  };
}

/**
 * Get all DeferredTaxPosition nodes for an entity/period.
 */
export async function getDeferredTaxPositions(
  entityId: string,
  periodId: string,
): Promise<Array<Record<string, unknown>>> {
  const results = await runCypher<Record<string, unknown>>(
    `MATCH (dtp:DeferredTaxPosition {entity_id: $entityId, period_id: $periodId})
     RETURN properties(dtp) AS dtp
     ORDER BY dtp.source_node_type, dtp.direction`,
    { entityId, periodId },
  );
  return results.map((r) => r.dtp as Record<string, unknown>);
}

// ============================================================
// Current Tax Computation
// ============================================================

export interface ComputeCurrentTaxInput {
  entityId: string;
  periodId: string;
  taxRate: number;
  permanentDifferences?: number; // non-deductible expenses, tax-exempt income
}

export interface CurrentTaxResult {
  accountingIncome: number;
  permanentDifferences: number;
  taxableIncome: number;
  currentTaxExpense: number;
}

/**
 * Compute current tax expense from accounting income.
 * Reads P&L from TimescaleDB, adjusts for permanent differences.
 */
export async function computeCurrentTax(
  input: ComputeCurrentTaxInput,
): Promise<CurrentTaxResult> {
  // Get net income from TimescaleDB
  const pnlResult = await query<{ economic_category: string; net_balance: string }>(
    `SELECT economic_category,
            COALESCE(SUM(net_balance), 0) AS net_balance
     FROM gl_period_balances
     WHERE entity_id = $1 AND period_id = $2
       AND economic_category IN ('REVENUE', 'EXPENSE')
     GROUP BY economic_category`,
    [input.entityId, input.periodId],
  );

  let revenue = 0, expenses = 0;
  for (const row of pnlResult.rows) {
    const net = Number(row.net_balance);
    if (row.economic_category === 'REVENUE') revenue = Math.abs(net);
    if (row.economic_category === 'EXPENSE') expenses = Math.abs(net);
  }
  const accountingIncome = revenue - expenses;

  const permanentDifferences = input.permanentDifferences ?? 0;
  const taxableIncome = Math.max(0, accountingIncome + permanentDifferences);
  const currentTaxExpense = Math.round(taxableIncome * input.taxRate * 100) / 100;

  return {
    accountingIncome: Math.round(accountingIncome * 100) / 100,
    permanentDifferences,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    currentTaxExpense,
  };
}

// ============================================================
// TaxProvision (combines current + deferred)
// ============================================================

export interface CreateTaxProvisionInput {
  entityId: string;
  periodId: string;
  taxRate: number;
  permanentDifferences?: number;
  creditAmount?: number;
}

export interface TaxProvisionResult {
  id: string;
  currentTaxExpense: number;
  deferredTaxMovement: number;
  creditAmount: number;
  totalTaxExpense: number;
  effectiveTaxRate: number;
  status: TaxProvisionStatus;
  deferredTaxDetails: DeferredTaxResult;
}

/**
 * Create a TaxProvision node for a period.
 * Computes current tax + deferred tax movement, applies credits.
 * Status starts as DRAFT (requires CFO/controller approval).
 */
export async function createTaxProvision(
  input: CreateTaxProvisionInput,
): Promise<TaxProvisionResult> {
  // Step 1: Compute current tax
  const currentTax = await computeCurrentTax({
    entityId: input.entityId,
    periodId: input.periodId,
    taxRate: input.taxRate,
    permanentDifferences: input.permanentDifferences,
  });

  // Step 2: Compute deferred tax positions
  const deferredTax = await computeDeferredTax({
    entityId: input.entityId,
    periodId: input.periodId,
    taxRate: input.taxRate,
  });

  // Step 3: Get prior period deferred tax for movement calculation
  const priorDtps = await runCypher<{ direction: string; amount: number }>(
    `MATCH (dtp:DeferredTaxPosition {entity_id: $entityId})
     WHERE dtp.period_id <> $periodId
     RETURN dtp.direction AS direction, dtp.deferred_tax_amount AS amount`,
    { entityId: input.entityId, periodId: input.periodId },
  );

  let priorDTL = 0, priorDTA = 0;
  for (const p of priorDtps) {
    if (p.direction === 'TAXABLE') priorDTL += Number(p.amount);
    else priorDTA += Number(p.amount);
  }
  const priorNetDeferred = priorDTL - priorDTA;

  // Deferred tax movement = current period net deferred - prior period net deferred
  const deferredTaxMovement = Math.round((deferredTax.netDeferredTax - priorNetDeferred) * 100) / 100;

  // Step 4: Apply credits
  const creditAmount = input.creditAmount ?? 0;

  // Step 5: Total tax expense
  const totalTaxExpense = Math.round(
    (currentTax.currentTaxExpense + deferredTaxMovement - creditAmount) * 100,
  ) / 100;

  // Step 6: Effective tax rate
  const effectiveTaxRate = currentTax.accountingIncome !== 0
    ? Math.round((totalTaxExpense / currentTax.accountingIncome) * 10000) / 10000
    : 0;

  // Step 7: Create TaxProvision node
  const id = uuid();
  await runCypher(
    `CREATE (tp:TaxProvision {
       id: $id,
       entity_id: $entityId,
       period_id: $periodId,
       current_tax_expense: $currentTaxExpense,
       deferred_tax_movement: $deferredTaxMovement,
       total_tax_expense: $totalTaxExpense,
       credit_amount: $creditAmount,
       effective_tax_rate: $effectiveTaxRate,
       status: 'DRAFT',
       created_at: datetime(), updated_at: datetime()
     })`,
    {
      id,
      entityId: input.entityId,
      periodId: input.periodId,
      currentTaxExpense: currentTax.currentTaxExpense,
      deferredTaxMovement,
      totalTaxExpense,
      creditAmount,
      effectiveTaxRate,
    },
  );

  // Emit event
  await emit('ebg.tax', {
    event_id: uuid(),
    event_type: 'TAX_PROVISION_COMPUTED',
    sequence_number: Date.now(),
    idempotency_key: `tax-provision-${input.entityId}-${input.periodId}`,
    entity_id: input.entityId,
    period_id: input.periodId,
    timestamp: new Date().toISOString(),
    payload: { provisionId: id, totalTaxExpense, status: 'DRAFT' },
  });

  return {
    id,
    currentTaxExpense: currentTax.currentTaxExpense,
    deferredTaxMovement,
    creditAmount,
    totalTaxExpense,
    effectiveTaxRate,
    status: 'DRAFT',
    deferredTaxDetails: deferredTax,
  };
}

/**
 * Get a TaxProvision by ID.
 */
export async function getTaxProvision(
  id: string,
): Promise<Record<string, unknown> | null> {
  const results = await runCypher<Record<string, unknown>>(
    `MATCH (tp:TaxProvision {id: $id})
     RETURN properties(tp) AS tp`,
    { id },
  );
  return results.length > 0 ? results[0].tp as Record<string, unknown> : null;
}

/**
 * List TaxProvisions for an entity.
 */
export async function listTaxProvisions(
  entityId: string,
): Promise<Array<Record<string, unknown>>> {
  const results = await runCypher<Record<string, unknown>>(
    `MATCH (tp:TaxProvision {entity_id: $entityId})
     RETURN properties(tp) AS tp
     ORDER BY tp.created_at DESC`,
    { entityId },
  );
  return results.map((r) => r.tp as Record<string, unknown>);
}

// ============================================================
// TaxProvision Status Transitions
// ============================================================

/**
 * Approve a draft TaxProvision (DRAFT → APPROVED).
 * CFO/controller reviews and approves before posting.
 */
export async function approveTaxProvision(
  id: string,
): Promise<Record<string, unknown>> {
  const results = await runCypher<Record<string, unknown>>(
    `MATCH (tp:TaxProvision {id: $id})
     WHERE tp.status = 'DRAFT'
     SET tp.status = 'APPROVED', tp.updated_at = datetime()
     RETURN properties(tp) AS tp`,
    { id },
  );
  if (results.length === 0) {
    throw new Error(`TaxProvision ${id} not found or not in DRAFT status`);
  }
  return results[0].tp as Record<string, unknown>;
}

/**
 * Post an approved TaxProvision (APPROVED → POSTED).
 * Creates journal entry for the tax expense.
 */
export async function postTaxProvision(
  id: string,
  journalEntryId: string,
): Promise<Record<string, unknown>> {
  const results = await runCypher<Record<string, unknown>>(
    `MATCH (tp:TaxProvision {id: $id})
     WHERE tp.status = 'APPROVED'
     SET tp.status = 'POSTED',
         tp.journal_entry_id = $journalEntryId,
         tp.updated_at = datetime()
     RETURN properties(tp) AS tp`,
    { id, journalEntryId },
  );
  if (results.length === 0) {
    throw new Error(`TaxProvision ${id} not found or not in APPROVED status`);
  }
  return results[0].tp as Record<string, unknown>;
}

// ============================================================
// Tax Rate Lookup
// ============================================================

/**
 * Get the applicable tax rate for an entity from configuration.
 * Falls back to jurisdiction defaults.
 */
export async function getApplicableTaxRate(
  entityId: string,
): Promise<{ federalRate: number; provincialRate: number; combinedRate: number }> {
  // First verify entity exists
  const entityResult = await runCypher<{ jurisdiction: string }>(
    `MATCH (e:Entity {id: $entityId})
     RETURN e.jurisdiction AS jurisdiction`,
    { entityId },
  );

  if (entityResult.length === 0) {
    throw new Error(`Entity ${entityId} not found`);
  }

  // Try to get from configuration
  try {
    const configResult = await query<{ value_json: Record<string, unknown> }>(
      `SELECT value_json FROM configuration_settings
       WHERE setting_key = 'tax.corporate_rate'
         AND (scope_id = $1::uuid OR scope_id IS NULL)
       ORDER BY
         CASE WHEN scope_id IS NOT NULL THEN 0 ELSE 1 END
       LIMIT 1`,
      [entityId],
    );

    if (configResult.rows.length > 0 && configResult.rows[0].value_json) {
      const parsed = configResult.rows[0].value_json;
      return {
        federalRate: (parsed.federal as number) ?? 0.15,
        provincialRate: (parsed.provincial as number) ?? 0.115,
        combinedRate: ((parsed.federal as number) ?? 0.15) + ((parsed.provincial as number) ?? 0.115),
      };
    }
  } catch {
    // Config lookup failed, fall through to jurisdiction defaults
  }

  const jurisdiction = entityResult[0].jurisdiction;
  // Default rates by jurisdiction
  if (jurisdiction === 'CA') {
    return { federalRate: 0.15, provincialRate: 0.115, combinedRate: 0.265 };
  } else if (jurisdiction === 'US') {
    return { federalRate: 0.21, provincialRate: 0, combinedRate: 0.21 };
  }

  return { federalRate: 0.25, provincialRate: 0, combinedRate: 0.25 };
}

// ============================================================
// Deferred Tax Summary
// ============================================================

/**
 * Get a summary of deferred tax positions for an entity across periods.
 */
export async function getDeferredTaxSummary(
  entityId: string,
): Promise<{
  totalDTA: number;
  totalDTL: number;
  netPosition: number;
  positionCount: number;
  bySourceType: Array<{ sourceType: string; count: number; netAmount: number }>;
}> {
  const positions = await runCypher<{
    direction: string;
    source_node_type: string;
    deferred_tax_amount: number;
  }>(
    `MATCH (dtp:DeferredTaxPosition {entity_id: $entityId})
     RETURN dtp.direction AS direction,
            dtp.source_node_type AS source_node_type,
            dtp.deferred_tax_amount AS deferred_tax_amount`,
    { entityId },
  );

  let totalDTA = 0, totalDTL = 0;
  const byType = new Map<string, { count: number; netAmount: number }>();

  for (const p of positions) {
    const amt = Number(p.deferred_tax_amount);
    if (p.direction === 'DEDUCTIBLE') {
      totalDTA += amt;
    } else {
      totalDTL += amt;
    }

    const entry = byType.get(p.source_node_type) ?? { count: 0, netAmount: 0 };
    entry.count++;
    entry.netAmount += p.direction === 'TAXABLE' ? amt : -amt;
    byType.set(p.source_node_type, entry);
  }

  return {
    totalDTA: Math.round(totalDTA * 100) / 100,
    totalDTL: Math.round(totalDTL * 100) / 100,
    netPosition: Math.round((totalDTL - totalDTA) * 100) / 100,
    positionCount: positions.length,
    bySourceType: Array.from(byType.entries()).map(([sourceType, v]) => ({
      sourceType,
      count: v.count,
      netAmount: Math.round(v.netAmount * 100) / 100,
    })),
  };
}
