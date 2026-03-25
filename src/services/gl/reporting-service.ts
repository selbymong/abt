/**
 * GL Reporting Service
 *
 * CQRS read side: all queries hit TimescaleDB, never Neo4j.
 * Provides P&L, Balance Sheet, and fund-level reporting.
 */
import { query } from '../../lib/pg.js';

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
