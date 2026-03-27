/**
 * GL Reporting Service
 *
 * CQRS read side: all queries hit TimescaleDB, never Neo4j.
 * Provides P&L, Balance Sheet, fund-level reporting, and outcome attribution.
 */
import { query } from '../../lib/pg.js';
import { runCypher } from '../../lib/neo4j.js';

const NULL_FUND = '00000000-0000-0000-0000-000000000000';

export interface PnLResult {
  revenue: number;
  expenses: number;
  netIncome: number;
  byCategory: { economic_category: string; debit_total: number; credit_total: number; net_balance: number }[];
}

export interface BalanceSheetResult {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  byCategory: { economic_category: string; debit_total: number; credit_total: number; net_balance: number }[];
}

export interface FundBalanceResult {
  fundId: string;
  revenue: number;
  expenses: number;
  netBalance: number;
}

/**
 * Profit & Loss statement for an entity/period.
 * Revenue = credit_total for REVENUE category
 * Expenses = debit_total for EXPENSE category
 */
export async function getProfitAndLoss(
  entityId: string,
  periodId: string,
  fundId?: string,
): Promise<PnLResult> {
  const fundFilter = fundId ? fundId : NULL_FUND;

  const result = await query<{
    economic_category: string;
    debit_total: string;
    credit_total: string;
    net_balance: string;
  }>(
    `SELECT economic_category,
            SUM(debit_total) AS debit_total,
            SUM(credit_total) AS credit_total,
            SUM(net_balance) AS net_balance
     FROM gl_period_balances
     WHERE entity_id = $1::uuid AND period_id = $2::uuid
       AND COALESCE(fund_id, '00000000-0000-0000-0000-000000000000'::uuid) = $3::uuid
       AND economic_category IN ('REVENUE', 'EXPENSE', 'COST_OF_GOODS_SOLD', 'OTHER_INCOME', 'OTHER_EXPENSE')
     GROUP BY economic_category
     ORDER BY economic_category`,
    [entityId, periodId, fundFilter],
  );

  const byCategory = result.rows.map((r) => ({
    economic_category: r.economic_category,
    debit_total: Number(r.debit_total),
    credit_total: Number(r.credit_total),
    net_balance: Number(r.net_balance),
  }));

  const revenue = byCategory
    .filter((r) => r.economic_category === 'REVENUE' || r.economic_category === 'OTHER_INCOME')
    .reduce((sum, r) => sum + r.credit_total, 0);

  const expenses = byCategory
    .filter((r) => r.economic_category === 'EXPENSE' || r.economic_category === 'COST_OF_GOODS_SOLD' || r.economic_category === 'OTHER_EXPENSE')
    .reduce((sum, r) => sum + r.debit_total, 0);

  return {
    revenue,
    expenses,
    netIncome: revenue - expenses,
    byCategory,
  };
}

/**
 * Balance Sheet for an entity/period.
 * Assets = debit_total for ASSET category
 * Liabilities = credit_total for LIABILITY category
 * Equity = Assets - Liabilities (derived)
 */
export async function getBalanceSheet(
  entityId: string,
  periodId: string,
  fundId?: string,
): Promise<BalanceSheetResult> {
  const fundFilter = fundId ? fundId : NULL_FUND;

  const result = await query<{
    economic_category: string;
    debit_total: string;
    credit_total: string;
    net_balance: string;
  }>(
    `SELECT economic_category,
            SUM(debit_total) AS debit_total,
            SUM(credit_total) AS credit_total,
            SUM(net_balance) AS net_balance
     FROM gl_period_balances
     WHERE entity_id = $1::uuid AND period_id = $2::uuid
       AND COALESCE(fund_id, '00000000-0000-0000-0000-000000000000'::uuid) = $3::uuid
       AND economic_category IN ('ASSET', 'LIABILITY', 'EQUITY')
     GROUP BY economic_category
     ORDER BY economic_category`,
    [entityId, periodId, fundFilter],
  );

  const byCategory = result.rows.map((r) => ({
    economic_category: r.economic_category,
    debit_total: Number(r.debit_total),
    credit_total: Number(r.credit_total),
    net_balance: Number(r.net_balance),
  }));

  const totalAssets = byCategory
    .filter((r) => r.economic_category === 'ASSET')
    .reduce((sum, r) => sum + r.debit_total, 0);

  const totalLiabilities = byCategory
    .filter((r) => r.economic_category === 'LIABILITY')
    .reduce((sum, r) => sum + r.credit_total, 0);

  return {
    totalAssets,
    totalLiabilities,
    totalEquity: totalAssets - totalLiabilities,
    byCategory,
  };
}

/**
 * Fund-level balance summary for NFP entities.
 * Returns one row per fund with revenue, expenses, and net balance.
 */
export async function getFundBalances(
  entityId: string,
  periodId: string,
): Promise<FundBalanceResult[]> {
  const result = await query<{
    fund_id: string;
    economic_category: string;
    debit_total: string;
    credit_total: string;
  }>(
    `SELECT fund_id, economic_category,
            SUM(debit_total) AS debit_total,
            SUM(credit_total) AS credit_total
     FROM gl_period_balances
     WHERE entity_id = $1::uuid AND period_id = $2::uuid
       AND fund_id IS NOT NULL
       AND fund_id <> '00000000-0000-0000-0000-000000000000'::uuid
     GROUP BY fund_id, economic_category
     ORDER BY fund_id, economic_category`,
    [entityId, periodId],
  );

  // Aggregate by fund
  const fundMap = new Map<string, FundBalanceResult>();
  for (const row of result.rows) {
    let fund = fundMap.get(row.fund_id);
    if (!fund) {
      fund = { fundId: row.fund_id, revenue: 0, expenses: 0, netBalance: 0 };
      fundMap.set(row.fund_id, fund);
    }
    if (row.economic_category === 'REVENUE') {
      fund.revenue += Number(row.credit_total);
    } else if (row.economic_category === 'EXPENSE') {
      fund.expenses += Number(row.debit_total);
    }
  }

  for (const fund of fundMap.values()) {
    fund.netBalance = fund.revenue - fund.expenses;
  }

  return Array.from(fundMap.values());
}

// ============================================================
// Outcome Attribution P&L
// ============================================================

export interface OutcomeAttribution {
  outcomeId: string;
  outcomeLabel: string;
  outcomeType: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  attributionPct: number;
  nodeBreakdown: Array<{
    nodeRefId: string;
    nodeRefType: string;
    revenue: number;
    expenses: number;
    weight: number;
  }>;
}

export interface OutcomeAttributedPnLResult {
  entityId: string;
  periodId: string;
  totalRevenue: number;
  totalExpenses: number;
  totalNetIncome: number;
  attributedToOutcomes: OutcomeAttribution[];
  unattributed: {
    revenue: number;
    expenses: number;
    netIncome: number;
  };
}

/**
 * Break down P&L by Outcome via CONTRIBUTES_TO graph traversal.
 *
 * For each P&L line in gl_period_balances, finds paths from the node_ref_id
 * to Outcome nodes via CONTRIBUTES_TO edges. Attributes revenue/expense
 * proportionally based on effective contribution weights.
 *
 * Approach:
 * 1. Get all P&L balances from TimescaleDB (CQRS read side)
 * 2. For each node_ref_id, traverse CONTRIBUTES_TO paths to Outcomes in Neo4j
 * 3. Distribute amounts across outcomes by normalized effective contribution
 */
export async function getOutcomeAttributedPnL(
  entityId: string,
  periodId: string,
  maxHops: number = 6,
): Promise<OutcomeAttributedPnLResult> {
  // Step 1: Get all P&L balances by node_ref
  const balances = await query<{
    node_ref_id: string;
    node_ref_type: string;
    economic_category: string;
    debit_total: string;
    credit_total: string;
    net_balance: string;
  }>(
    `SELECT node_ref_id, node_ref_type, economic_category,
            SUM(debit_total) AS debit_total,
            SUM(credit_total) AS credit_total,
            SUM(net_balance) AS net_balance
     FROM gl_period_balances
     WHERE entity_id = $1::uuid AND period_id = $2::uuid
       AND economic_category IN ('REVENUE', 'EXPENSE')
     GROUP BY node_ref_id, node_ref_type, economic_category`,
    [entityId, periodId],
  );

  // Build a map of node_ref_id → { revenue, expenses }
  const nodeAmounts = new Map<string, { nodeRefType: string; revenue: number; expenses: number }>();
  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const row of balances.rows) {
    const refId = row.node_ref_id;
    if (!nodeAmounts.has(refId)) {
      nodeAmounts.set(refId, { nodeRefType: row.node_ref_type, revenue: 0, expenses: 0 });
    }
    const entry = nodeAmounts.get(refId)!;
    if (row.economic_category === 'REVENUE') {
      const rev = Number(row.credit_total);
      entry.revenue += rev;
      totalRevenue += rev;
    } else if (row.economic_category === 'EXPENSE') {
      const exp = Number(row.debit_total);
      entry.expenses += exp;
      totalExpenses += exp;
    }
  }

  const totalNetIncome = totalRevenue - totalExpenses;

  // Step 2: For all node_ref_ids, batch-query CONTRIBUTES_TO paths to Outcomes
  const nodeRefIds = Array.from(nodeAmounts.keys());
  if (nodeRefIds.length === 0) {
    return {
      entityId,
      periodId,
      totalRevenue: 0,
      totalExpenses: 0,
      totalNetIncome: 0,
      attributedToOutcomes: [],
      unattributed: { revenue: 0, expenses: 0, netIncome: 0 },
    };
  }

  // Query all paths from any node_ref to outcomes in one batch
  const pathResults = await runCypher<{
    sourceId: string;
    outcomeId: string;
    outcomeLabel: string;
    outcomeType: string;
    weights: number[];
    tvps: number[];
    controlScores: number[];
  }>(
    `UNWIND $nodeRefIds AS refId
     MATCH (source {id: refId})
     MATCH path = (source)-[:CONTRIBUTES_TO*1..${Math.min(maxHops, 10)}]->(outcome:Outcome)
     WHERE outcome.entity_id = $entityId
     WITH source, outcome, relationships(path) AS rels, nodes(path) AS ns
     RETURN source.id AS sourceId,
            outcome.id AS outcomeId,
            outcome.label AS outcomeLabel,
            outcome.outcome_type AS outcomeType,
            [r IN rels | r.weight] AS weights,
            [r IN rels | COALESCE(r.temporal_value_pct, 1.0)] AS tvps,
            [n IN ns | COALESCE(n.control_score, 1.0)] AS controlScores`,
    { nodeRefIds, entityId },
  );

  // Step 3: Build node→outcome contribution map
  // For each (sourceId, outcomeId), compute effective contribution = product of (w × tvp × cs) along path
  const nodeOutcomeWeights = new Map<string, Map<string, number>>(); // nodeRefId → (outcomeId → effectiveContribution)
  const outcomeInfo = new Map<string, { label: string; type: string }>();

  for (const row of pathResults) {
    let ec = 1.0;
    for (let i = 0; i < row.weights.length; i++) {
      ec *= Number(row.weights[i]) * Number(row.tvps[i]) * Number(row.controlScores[i]);
    }
    if (ec <= 0) continue;

    if (!nodeOutcomeWeights.has(row.sourceId)) {
      nodeOutcomeWeights.set(row.sourceId, new Map());
    }
    const outcomeMap = nodeOutcomeWeights.get(row.sourceId)!;
    // If multiple paths, take the max contribution
    const existing = outcomeMap.get(row.outcomeId) ?? 0;
    outcomeMap.set(row.outcomeId, Math.max(existing, ec));

    outcomeInfo.set(row.outcomeId, { label: row.outcomeLabel, type: row.outcomeType });
  }

  // Step 4: Attribute amounts to outcomes
  const outcomeAttribution = new Map<string, OutcomeAttribution>();
  let attributedRevenue = 0;
  let attributedExpenses = 0;

  for (const [nodeRefId, amounts] of nodeAmounts) {
    const outcomeMap = nodeOutcomeWeights.get(nodeRefId);
    if (!outcomeMap || outcomeMap.size === 0) continue;

    // Normalize weights for this node's outcomes so they sum to 1
    const totalWeight = Array.from(outcomeMap.values()).reduce((s, w) => s + w, 0);
    if (totalWeight <= 0) continue;

    for (const [outcomeId, rawWeight] of outcomeMap) {
      const normalizedWeight = rawWeight / totalWeight;
      const attrRevenue = Math.round(amounts.revenue * normalizedWeight * 100) / 100;
      const attrExpenses = Math.round(amounts.expenses * normalizedWeight * 100) / 100;

      if (!outcomeAttribution.has(outcomeId)) {
        const info = outcomeInfo.get(outcomeId)!;
        outcomeAttribution.set(outcomeId, {
          outcomeId,
          outcomeLabel: info.label,
          outcomeType: info.type,
          revenue: 0,
          expenses: 0,
          netIncome: 0,
          attributionPct: 0,
          nodeBreakdown: [],
        });
      }

      const attr = outcomeAttribution.get(outcomeId)!;
      attr.revenue += attrRevenue;
      attr.expenses += attrExpenses;
      attr.nodeBreakdown.push({
        nodeRefId,
        nodeRefType: amounts.nodeRefType,
        revenue: attrRevenue,
        expenses: attrExpenses,
        weight: Math.round(normalizedWeight * 10000) / 10000,
      });

      attributedRevenue += attrRevenue;
      attributedExpenses += attrExpenses;
    }
  }

  // Finalize attribution percentages and net income
  const attributions = Array.from(outcomeAttribution.values()).map((attr) => {
    attr.netIncome = Math.round((attr.revenue - attr.expenses) * 100) / 100;
    attr.revenue = Math.round(attr.revenue * 100) / 100;
    attr.expenses = Math.round(attr.expenses * 100) / 100;
    attr.attributionPct = totalNetIncome !== 0
      ? Math.round((attr.netIncome / totalNetIncome) * 10000) / 10000
      : 0;
    return attr;
  }).sort((a, b) => b.netIncome - a.netIncome);

  return {
    entityId,
    periodId,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalNetIncome: Math.round(totalNetIncome * 100) / 100,
    attributedToOutcomes: attributions,
    unattributed: {
      revenue: Math.round((totalRevenue - attributedRevenue) * 100) / 100,
      expenses: Math.round((totalExpenses - attributedExpenses) * 100) / 100,
      netIncome: Math.round((totalNetIncome - (attributedRevenue - attributedExpenses)) * 100) / 100,
    },
  };
}
