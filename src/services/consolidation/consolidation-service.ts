import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import type {
  MinorityInterestMethod,
  IntercompanyTransactionType,
} from '../../schema/neo4j/types.js';

// ============================================================
// ConsolidationGroup CRUD
// ============================================================

export interface CreateConsolidationGroupInput {
  label: string;
  parentEntityId: string;
  functionalCurrency: string;
  entityIds: string[];
  minorityInterestMethod: MinorityInterestMethod;
  intercompanyThreshold?: number;
}

export async function createConsolidationGroup(input: CreateConsolidationGroupInput): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (cg:ConsolidationGroup {
      id: $id, label: $label,
      parent_entity_id: $parentEntityId,
      functional_currency: $currency,
      entity_ids: $entityIds,
      minority_interest_method: $method,
      intercompany_threshold: $threshold,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      label: input.label,
      parentEntityId: input.parentEntityId,
      currency: input.functionalCurrency,
      entityIds: input.entityIds,
      method: input.minorityInterestMethod,
      threshold: input.intercompanyThreshold ?? 0,
    },
  );

  // Update entities with consolidation_group_id
  for (const entityId of input.entityIds) {
    await runCypher(
      `MATCH (e:Entity {id: $entityId})
       SET e.consolidation_group_id = $groupId`,
      { entityId, groupId: id },
    );
  }

  return id;
}

export async function getConsolidationGroup(id: string) {
  const results = await runCypher<{ cg: Record<string, unknown> }>(
    `MATCH (cg:ConsolidationGroup {id: $id}) RETURN properties(cg) AS cg`,
    { id },
  );
  return results[0]?.cg ?? null;
}

export async function getConsolidationGroupForEntity(entityId: string) {
  const results = await runCypher<{ cg: Record<string, unknown> }>(
    `MATCH (e:Entity {id: $entityId})
     MATCH (cg:ConsolidationGroup {id: e.consolidation_group_id})
     RETURN properties(cg) AS cg`,
    { entityId },
  );
  return results[0]?.cg ?? null;
}

// ============================================================
// OwnershipInterest CRUD
// ============================================================

export interface CreateOwnershipInterestInput {
  investorEntityId: string;
  investeeEntityId: string;
  ownershipPct: number;
  acquisitionCost: number;
  netAssetsAtAcquisition: number;
  acquisitionDate: string;
}

export async function createOwnershipInterest(input: CreateOwnershipInterestInput): Promise<string> {
  const id = uuid();
  const goodwill = input.acquisitionCost - (input.ownershipPct * input.netAssetsAtAcquisition);

  await runCypher(
    `CREATE (oi:OwnershipInterest {
      id: $id,
      investor_entity_id: $investorId,
      investee_entity_id: $investeeId,
      ownership_pct: $pct,
      acquisition_cost: $cost,
      net_assets_at_acquisition: $netAssets,
      goodwill: $goodwill,
      carrying_value: $cost,
      acquisition_date: date($acquisitionDate),
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      investorId: input.investorEntityId,
      investeeId: input.investeeEntityId,
      pct: input.ownershipPct,
      cost: Math.round(input.acquisitionCost * 100) / 100,
      netAssets: input.netAssetsAtAcquisition,
      goodwill: Math.round(Math.max(0, goodwill) * 100) / 100,
      acquisitionDate: input.acquisitionDate,
    },
  );

  return id;
}

export async function getOwnershipInterest(id: string) {
  const results = await runCypher<{ oi: Record<string, unknown> }>(
    `MATCH (oi:OwnershipInterest {id: $id}) RETURN properties(oi) AS oi`,
    { id },
  );
  return results[0]?.oi ?? null;
}

export async function listOwnershipInterests(investorEntityId: string) {
  const results = await runCypher<{ oi: Record<string, unknown> }>(
    `MATCH (oi:OwnershipInterest {investor_entity_id: $investorId})
     RETURN properties(oi) AS oi ORDER BY oi.acquisition_date`,
    { investorId: investorEntityId },
  );
  return results.map((r) => r.oi);
}

// ============================================================
// INTERCOMPANY_MATCH Edge Management
// ============================================================

export interface CreateIntercompanyMatchInput {
  sourceLedgerLineId: string;
  targetLedgerLineId: string;
  sourceEntityId: string;
  targetEntityId: string;
  eliminationAmount: number;
  transactionType: IntercompanyTransactionType;
  amountSellerCurrency: number;
  amountBuyerCurrency: number;
  unrealizedProfitPct?: number;
}

export async function createIntercompanyMatch(input: CreateIntercompanyMatchInput): Promise<boolean> {
  await runCypher(
    `MATCH (ll1:LedgerLine {id: $sourceId})
     MATCH (ll2:LedgerLine {id: $targetId})
     CREATE (ll1)-[:INTERCOMPANY_MATCH {
       source_entity_id: $sourceEntityId,
       target_entity_id: $targetEntityId,
       source_ledger_line_id: $sourceId,
       target_ledger_line_id: $targetId,
       elimination_amount: $amount,
       transaction_type: $txnType,
       amount_seller_currency: $sellerAmt,
       amount_buyer_currency: $buyerAmt,
       unrealized_profit_pct: $unrealizedPct,
       created_at: datetime()
     }]->(ll2)`,
    {
      sourceId: input.sourceLedgerLineId,
      targetId: input.targetLedgerLineId,
      sourceEntityId: input.sourceEntityId,
      targetEntityId: input.targetEntityId,
      amount: input.eliminationAmount,
      txnType: input.transactionType,
      sellerAmt: input.amountSellerCurrency,
      buyerAmt: input.amountBuyerCurrency,
      unrealizedPct: input.unrealizedProfitPct ?? null,
    },
  );
  return true;
}

/**
 * Find unmatched intercompany transactions for reconciliation.
 */
export async function getUnmatchedIntercompanyTransactions(
  groupId: string,
  periodId: string,
): Promise<Array<Record<string, unknown>>> {
  const results = await runCypher<{ ll: Record<string, unknown>; jeRef: string; entityId: string }>(
    `MATCH (cg:ConsolidationGroup {id: $groupId})
     WITH cg.entity_ids AS groupEntities
     MATCH (je:JournalEntry)-[:HAS_LINE]->(ll:LedgerLine)
     WHERE je.period_id = $periodId
       AND je.entity_id IN groupEntities
       AND NOT EXISTS {
         MATCH (ll)-[:INTERCOMPANY_MATCH]-()
       }
       AND EXISTS {
         MATCH (je2:JournalEntry)-[:HAS_LINE]->(ll2:LedgerLine)
         WHERE je2.entity_id IN groupEntities
           AND je2.entity_id <> je.entity_id
           AND je2.period_id = $periodId
           AND ll2.node_ref_id = ll.node_ref_id
       }
     RETURN properties(ll) AS ll, je.reference AS jeRef, je.entity_id AS entityId`,
    { groupId, periodId },
  );
  return results.map((r) => ({
    ...r.ll,
    journal_reference: r.jeRef,
    entity_id: r.entityId,
  }));
}

// ============================================================
// CurrencyTranslation
// ============================================================

export interface CreateCurrencyTranslationInput {
  entityId: string;
  periodId: string;
  functionalCurrency: string;
  presentationCurrency: string;
  averageRate: number;
  closingRate: number;
}

/**
 * Translate a foreign subsidiary's financials for a period.
 * Reads from TimescaleDB gl_period_balances, applies FX rates,
 * and creates a CurrencyTranslation node.
 */
export async function translateCurrency(
  input: CreateCurrencyTranslationInput,
): Promise<{
  translationId: string;
  revenueTranslated: number;
  expenseTranslated: number;
  assetTranslated: number;
  liabilityTranslated: number;
  ctaCurrentPeriod: number;
}> {
  // Read period balances from TimescaleDB
  const balances = await query<{
    economic_category: string;
    debit_total: string;
    credit_total: string;
    net_balance: string;
  }>(
    `SELECT economic_category,
            COALESCE(SUM(debit_total), 0) AS debit_total,
            COALESCE(SUM(credit_total), 0) AS credit_total,
            COALESCE(SUM(net_balance), 0) AS net_balance
     FROM gl_period_balances
     WHERE entity_id = $1 AND period_id = $2
     GROUP BY economic_category`,
    [input.entityId, input.periodId],
  );

  let revenue = 0, expense = 0, assets = 0, liabilities = 0;
  for (const row of balances.rows) {
    const net = Number(row.net_balance);
    switch (row.economic_category) {
      case 'REVENUE': revenue = Math.abs(net); break;
      case 'EXPENSE': expense = Math.abs(net); break;
      case 'ASSET': assets = Math.abs(net); break;
      case 'LIABILITY': liabilities = Math.abs(net); break;
    }
  }

  // P&L items translated at average rate
  const revenueTranslated = Math.round(revenue * input.averageRate * 100) / 100;
  const expenseTranslated = Math.round(expense * input.averageRate * 100) / 100;

  // Balance sheet items translated at closing rate
  const assetTranslated = Math.round(assets * input.closingRate * 100) / 100;
  const liabilityTranslated = Math.round(liabilities * input.closingRate * 100) / 100;

  // CTA = difference arising from using different rates for BS vs P&L
  const netIncomeAtAvg = revenueTranslated - expenseTranslated;
  const netAssetsAtClosing = assetTranslated - liabilityTranslated;
  const ctaCurrentPeriod = Math.round((netAssetsAtClosing - netIncomeAtAvg) * 100) / 100;

  // Get previous cumulative CTA
  const prevCta = await runCypher<{ cumulative: number }>(
    `MATCH (ct:CurrencyTranslation {entity_id: $entityId})
     RETURN ct.cumulative_cta AS cumulative
     ORDER BY ct.created_at DESC LIMIT 1`,
    { entityId: input.entityId },
  );
  const prevCumulativeCta = prevCta.length > 0 ? Number(prevCta[0].cumulative) : 0;
  const cumulativeCta = Math.round((prevCumulativeCta + ctaCurrentPeriod) * 100) / 100;

  const id = uuid();
  await runCypher(
    `CREATE (ct:CurrencyTranslation {
      id: $id, entity_id: $entityId, period_id: $periodId,
      functional_currency: $funcCurrency,
      presentation_currency: $presCurrency,
      average_rate: $avgRate, closing_rate: $closeRate,
      revenue_translated: $revenue, expense_translated: $expense,
      asset_translated: $assets, liability_translated: $liabilities,
      cta_current_period: $cta, cumulative_cta: $cumCta,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      periodId: input.periodId,
      funcCurrency: input.functionalCurrency,
      presCurrency: input.presentationCurrency,
      avgRate: input.averageRate,
      closeRate: input.closingRate,
      revenue: revenueTranslated,
      expense: expenseTranslated,
      assets: assetTranslated,
      liabilities: liabilityTranslated,
      cta: ctaCurrentPeriod,
      cumCta: cumulativeCta,
    },
  );

  return {
    translationId: id,
    revenueTranslated,
    expenseTranslated,
    assetTranslated,
    liabilityTranslated,
    ctaCurrentPeriod,
  };
}

export async function getCurrencyTranslation(entityId: string, periodId: string) {
  const results = await runCypher<{ ct: Record<string, unknown> }>(
    `MATCH (ct:CurrencyTranslation {entity_id: $entityId, period_id: $periodId})
     RETURN properties(ct) AS ct`,
    { entityId, periodId },
  );
  return results[0]?.ct ?? null;
}

// ============================================================
// Goodwill CRUD
// ============================================================

export interface CreateGoodwillInput {
  acquireeEntityId: string;
  grossAmount: number;
  currency: string;
  isFullGoodwill: boolean;
  nciGoodwillPct?: number;
  taxDeductible?: boolean;
}

export async function createGoodwill(input: CreateGoodwillInput): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (g:Goodwill {
      id: $id,
      acquiree_entity_id: $acquireeId,
      gross_amount: $grossAmount,
      accumulated_impairment: 0,
      carrying_amount: $grossAmount,
      currency: $currency,
      is_full_goodwill: $isFullGoodwill,
      nci_goodwill_pct: $nciPct,
      tax_deductible: $taxDeductible,
      tax_base: $taxBase,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      acquireeId: input.acquireeEntityId,
      grossAmount: input.grossAmount,
      isFullGoodwill: input.isFullGoodwill,
      currency: input.currency,
      nciPct: input.nciGoodwillPct ?? null,
      taxDeductible: input.taxDeductible ?? false,
      taxBase: input.taxDeductible ? input.grossAmount : 0,
    },
  );
  return id;
}

export async function getGoodwill(id: string) {
  const results = await runCypher<{ g: Record<string, unknown> }>(
    `MATCH (g:Goodwill {id: $id}) RETURN properties(g) AS g`,
    { id },
  );
  return results[0]?.g ?? null;
}

/**
 * Record goodwill impairment (never reverses per IAS 36).
 */
export async function impairGoodwill(
  goodwillId: string,
  impairmentLoss: number,
  testDate: string,
): Promise<boolean> {
  const gw = await getGoodwill(goodwillId);
  if (!gw) return false;

  const newAccumImpairment = Number(gw.accumulated_impairment) + impairmentLoss;
  const newCarrying = Number(gw.gross_amount) - newAccumImpairment;

  await runCypher(
    `MATCH (g:Goodwill {id: $id})
     SET g.accumulated_impairment = $accumImpairment,
         g.carrying_amount = $carrying,
         g.last_test_date = date($testDate),
         g.last_test_result = 'IMPAIRED',
         g.updated_at = datetime()`,
    {
      id: goodwillId,
      accumImpairment: Math.round(newAccumImpairment * 100) / 100,
      carrying: Math.round(Math.max(0, newCarrying) * 100) / 100,
      testDate,
    },
  );
  return true;
}

// ============================================================
// Consolidated Financial Reporting
// ============================================================

/**
 * Generate consolidated P&L for a group, eliminating intercompany transactions.
 * Uses query-time elimination via INTERCOMPANY_MATCH edges.
 */
export async function getConsolidatedPnL(
  groupId: string,
  periodId: string,
): Promise<{
  revenue: number;
  expenses: number;
  netIncome: number;
  entityBreakdown: Array<{ entityId: string; revenue: number; expenses: number }>;
}> {
  const group = await getConsolidationGroup(groupId);
  if (!group) throw new Error(`ConsolidationGroup ${groupId} not found`);

  const entityIds = group.entity_ids as string[];

  // Query each entity's P&L from TimescaleDB, then subtract eliminations
  let totalRevenue = 0;
  let totalExpenses = 0;
  const entityBreakdown: Array<{ entityId: string; revenue: number; expenses: number }> = [];

  for (const entityId of entityIds) {
    const result = await query<{ economic_category: string; net_balance: string }>(
      `SELECT economic_category,
              COALESCE(SUM(net_balance), 0) AS net_balance
       FROM gl_period_balances
       WHERE entity_id = $1 AND period_id = $2
         AND economic_category IN ('REVENUE', 'EXPENSE')
       GROUP BY economic_category`,
      [entityId, periodId],
    );

    let revenue = 0, expenses = 0;
    for (const row of result.rows) {
      const net = Number(row.net_balance);
      if (row.economic_category === 'REVENUE') revenue = Math.abs(net);
      if (row.economic_category === 'EXPENSE') expenses = Math.abs(net);
    }

    totalRevenue += revenue;
    totalExpenses += expenses;
    entityBreakdown.push({ entityId, revenue, expenses });
  }

  // Get intercompany elimination amounts
  const eliminations = await runCypher<{ amount: number; category: string }>(
    `MATCH (ll1:LedgerLine)-[m:INTERCOMPANY_MATCH]->(ll2:LedgerLine)
     WHERE m.source_entity_id IN $entityIds
       AND m.target_entity_id IN $entityIds
     MATCH (je:JournalEntry {id: ll1.journal_entry_id})
     WHERE je.period_id = $periodId
     RETURN m.elimination_amount AS amount,
            ll1.economic_category AS category`,
    { entityIds, periodId },
  );

  for (const elim of eliminations) {
    const amount = Number(elim.amount);
    if (elim.category === 'REVENUE') totalRevenue -= amount;
    if (elim.category === 'EXPENSE') totalExpenses -= amount;
  }

  return {
    revenue: Math.round(totalRevenue * 100) / 100,
    expenses: Math.round(totalExpenses * 100) / 100,
    netIncome: Math.round((totalRevenue - totalExpenses) * 100) / 100,
    entityBreakdown,
  };
}

/**
 * Generate consolidated balance sheet for a group.
 */
export async function getConsolidatedBalanceSheet(
  groupId: string,
  periodId: string,
): Promise<{
  assets: number;
  liabilities: number;
  equity: number;
  goodwill: number;
}> {
  const group = await getConsolidationGroup(groupId);
  if (!group) throw new Error(`ConsolidationGroup ${groupId} not found`);

  const entityIds = group.entity_ids as string[];

  let totalAssets = 0, totalLiabilities = 0, totalEquity = 0;

  for (const entityId of entityIds) {
    const result = await query<{ economic_category: string; net_balance: string }>(
      `SELECT economic_category,
              COALESCE(SUM(net_balance), 0) AS net_balance
       FROM gl_period_balances
       WHERE entity_id = $1 AND period_id = $2
         AND economic_category IN ('ASSET', 'LIABILITY', 'EQUITY')
       GROUP BY economic_category`,
      [entityId, periodId],
    );

    for (const row of result.rows) {
      const net = Number(row.net_balance);
      switch (row.economic_category) {
        case 'ASSET': totalAssets += Math.abs(net); break;
        case 'LIABILITY': totalLiabilities += Math.abs(net); break;
        case 'EQUITY': totalEquity += Math.abs(net); break;
      }
    }
  }

  // Get total goodwill for the group's entities
  const goodwillResults = await runCypher<{ total: number }>(
    `MATCH (g:Goodwill)
     WHERE g.acquiree_entity_id IN $entityIds
       AND g.disposal_date IS NULL
     RETURN COALESCE(SUM(g.carrying_amount), 0) AS total`,
    { entityIds },
  );
  const goodwillTotal = Number(goodwillResults[0]?.total ?? 0);

  return {
    assets: Math.round((totalAssets + goodwillTotal) * 100) / 100,
    liabilities: Math.round(totalLiabilities * 100) / 100,
    equity: Math.round(totalEquity * 100) / 100,
    goodwill: Math.round(goodwillTotal * 100) / 100,
  };
}
