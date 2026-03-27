/**
 * Financial Statement Generator Service
 *
 * Generates templated financial statements from TimescaleDB GL projections:
 * - Income Statement (P&L)
 * - Balance Sheet
 * - Cash Flow Statement (indirect method)
 * - Statement of Changes in Equity
 * - Comparative periods (current vs prior year)
 * - Auto-generated notes
 */
import { query } from '../../lib/pg.js';

// ============================================================
// Types
// ============================================================

export type StatementType = 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'EQUITY_CHANGES';

export interface StatementLineItem {
  label: string;
  category: string;
  currentPeriod: number;
  priorPeriod: number;
  variance: number;
  variancePercent: number;
}

export interface FinancialStatement {
  type: StatementType;
  entityId: string;
  entityName: string;
  periodId: string;
  periodLabel: string;
  priorPeriodId?: string;
  priorPeriodLabel?: string;
  currency: string;
  generatedAt: string;
  sections: StatementSection[];
  totals: Record<string, number>;
  notes: StatementNote[];
}

export interface StatementSection {
  title: string;
  items: StatementLineItem[];
  subtotal: number;
  priorSubtotal: number;
}

export interface StatementNote {
  number: number;
  title: string;
  content: string;
}

// ============================================================
// Income Statement
// ============================================================

export async function generateIncomeStatement(
  entityId: string,
  periodId: string,
  priorPeriodId?: string,
  currency?: string,
): Promise<FinancialStatement> {
  const cur = currency ?? 'CAD';

  // Get current period balances by economic category
  const currentResult = await query(
    `SELECT economic_category, SUM(CASE WHEN side = 'CREDIT' THEN amount ELSE -amount END) AS net
     FROM gl_period_balances
     WHERE entity_id = $1 AND period_id = $2
     GROUP BY economic_category`,
    [entityId, periodId],
  );

  const current = mapBalances(currentResult.rows);

  let prior: Record<string, number> = {};
  if (priorPeriodId) {
    const priorResult = await query(
      `SELECT economic_category, SUM(CASE WHEN side = 'CREDIT' THEN amount ELSE -amount END) AS net
       FROM gl_period_balances
       WHERE entity_id = $1 AND period_id = $2
       GROUP BY economic_category`,
      [entityId, priorPeriodId],
    );
    prior = mapBalances(priorResult.rows);
  }

  const revenue = current.REVENUE ?? 0;
  const priorRevenue = prior.REVENUE ?? 0;
  const expense = Math.abs(current.EXPENSE ?? 0);
  const priorExpense = Math.abs(prior.EXPENSE ?? 0);
  const operatingIncome = revenue - expense;
  const priorOperatingIncome = priorRevenue - priorExpense;

  const sections: StatementSection[] = [
    {
      title: 'Revenue',
      items: [buildLineItem('Total Revenue', 'REVENUE', revenue, priorRevenue)],
      subtotal: revenue,
      priorSubtotal: priorRevenue,
    },
    {
      title: 'Expenses',
      items: [buildLineItem('Total Expenses', 'EXPENSE', expense, priorExpense)],
      subtotal: expense,
      priorSubtotal: priorExpense,
    },
    {
      title: 'Operating Income',
      items: [buildLineItem('Operating Income', 'OPERATING', operatingIncome, priorOperatingIncome)],
      subtotal: operatingIncome,
      priorSubtotal: priorOperatingIncome,
    },
  ];

  const notes = generateIncomeNotes(revenue, expense, priorRevenue, priorExpense);

  return buildStatement('INCOME_STATEMENT', entityId, periodId, priorPeriodId, cur, sections,
    { totalRevenue: revenue, totalExpenses: expense, netIncome: operatingIncome }, notes);
}

// ============================================================
// Balance Sheet
// ============================================================

export async function generateBalanceSheet(
  entityId: string,
  periodId: string,
  priorPeriodId?: string,
  currency?: string,
): Promise<FinancialStatement> {
  const cur = currency ?? 'CAD';

  const currentResult = await query(
    `SELECT economic_category, SUM(CASE WHEN side = 'DEBIT' THEN amount ELSE -amount END) AS net
     FROM gl_period_balances
     WHERE entity_id = $1 AND period_id = $2
     GROUP BY economic_category`,
    [entityId, periodId],
  );
  const current = mapBalances(currentResult.rows);

  let prior: Record<string, number> = {};
  if (priorPeriodId) {
    const priorResult = await query(
      `SELECT economic_category, SUM(CASE WHEN side = 'DEBIT' THEN amount ELSE -amount END) AS net
       FROM gl_period_balances
       WHERE entity_id = $1 AND period_id = $2
       GROUP BY economic_category`,
      [entityId, priorPeriodId],
    );
    prior = mapBalances(priorResult.rows);
  }

  const assets = current.ASSET ?? 0;
  const priorAssets = prior.ASSET ?? 0;
  const liabilities = Math.abs(current.LIABILITY ?? 0);
  const priorLiabilities = Math.abs(prior.LIABILITY ?? 0);
  const equity = Math.abs(current.EQUITY ?? 0);
  const priorEquity = Math.abs(prior.EQUITY ?? 0);

  const sections: StatementSection[] = [
    {
      title: 'Assets',
      items: [buildLineItem('Total Assets', 'ASSET', assets, priorAssets)],
      subtotal: assets,
      priorSubtotal: priorAssets,
    },
    {
      title: 'Liabilities',
      items: [buildLineItem('Total Liabilities', 'LIABILITY', liabilities, priorLiabilities)],
      subtotal: liabilities,
      priorSubtotal: priorLiabilities,
    },
    {
      title: 'Equity',
      items: [buildLineItem('Total Equity', 'EQUITY', equity, priorEquity)],
      subtotal: equity,
      priorSubtotal: priorEquity,
    },
  ];

  const notes = generateBalanceNotes(assets, liabilities, equity);

  return buildStatement('BALANCE_SHEET', entityId, periodId, priorPeriodId, cur, sections,
    { totalAssets: assets, totalLiabilities: liabilities, totalEquity: equity,
      liabilitiesAndEquity: liabilities + equity }, notes);
}

// ============================================================
// Cash Flow Statement (Indirect Method)
// ============================================================

export async function generateCashFlowStatement(
  entityId: string,
  periodId: string,
  priorPeriodId?: string,
  currency?: string,
): Promise<FinancialStatement> {
  const cur = currency ?? 'CAD';

  const result = await query(
    `SELECT economic_category, entry_type,
            SUM(CASE WHEN side = 'DEBIT' THEN amount ELSE -amount END) AS net
     FROM gl_period_balances
     WHERE entity_id = $1 AND period_id = $2
     GROUP BY economic_category, entry_type`,
    [entityId, periodId],
  );

  let priorResult = { rows: [] as any[] };
  if (priorPeriodId) {
    priorResult = await query(
      `SELECT economic_category, entry_type,
              SUM(CASE WHEN side = 'DEBIT' THEN amount ELSE -amount END) AS net
       FROM gl_period_balances
       WHERE entity_id = $1 AND period_id = $2
       GROUP BY economic_category, entry_type`,
      [entityId, priorPeriodId],
    );
  }

  const current = mapCashFlowBalances(result.rows);
  const prior = mapCashFlowBalances(priorResult.rows);

  const operatingCash = current.operating ?? 0;
  const priorOperating = prior.operating ?? 0;
  const investingCash = current.investing ?? 0;
  const priorInvesting = prior.investing ?? 0;
  const financingCash = current.financing ?? 0;
  const priorFinancing = prior.financing ?? 0;

  const sections: StatementSection[] = [
    {
      title: 'Operating Activities',
      items: [buildLineItem('Net Cash from Operations', 'OPERATING', operatingCash, priorOperating)],
      subtotal: operatingCash,
      priorSubtotal: priorOperating,
    },
    {
      title: 'Investing Activities',
      items: [buildLineItem('Net Cash from Investing', 'INVESTING', investingCash, priorInvesting)],
      subtotal: investingCash,
      priorSubtotal: priorInvesting,
    },
    {
      title: 'Financing Activities',
      items: [buildLineItem('Net Cash from Financing', 'FINANCING', financingCash, priorFinancing)],
      subtotal: financingCash,
      priorSubtotal: priorFinancing,
    },
  ];

  const netChange = operatingCash + investingCash + financingCash;
  const notes: StatementNote[] = [];

  return buildStatement('CASH_FLOW', entityId, periodId, priorPeriodId, cur, sections,
    { operatingCash, investingCash, financingCash, netChange }, notes);
}

// ============================================================
// Statement of Changes in Equity
// ============================================================

export async function generateEquityChanges(
  entityId: string,
  periodId: string,
  priorPeriodId?: string,
  currency?: string,
): Promise<FinancialStatement> {
  const cur = currency ?? 'CAD';

  const result = await query(
    `SELECT entry_type, SUM(CASE WHEN side = 'CREDIT' THEN amount ELSE -amount END) AS net
     FROM gl_period_balances
     WHERE entity_id = $1 AND period_id = $2 AND economic_category = 'EQUITY'
     GROUP BY entry_type`,
    [entityId, periodId],
  );

  let priorResult = { rows: [] as any[] };
  if (priorPeriodId) {
    priorResult = await query(
      `SELECT entry_type, SUM(CASE WHEN side = 'CREDIT' THEN amount ELSE -amount END) AS net
       FROM gl_period_balances
       WHERE entity_id = $1 AND period_id = $2 AND economic_category = 'EQUITY'
       GROUP BY entry_type`,
      [entityId, priorPeriodId],
    );
  }

  const currentItems = result.rows.map((r: any) => buildLineItem(
    r.entry_type ?? 'Other', r.entry_type ?? 'OTHER', Number(r.net), 0,
  ));
  const totalEquityChange = result.rows.reduce((s: number, r: any) => s + Number(r.net), 0);

  const sections: StatementSection[] = [
    {
      title: 'Changes in Equity',
      items: currentItems.length > 0 ? currentItems : [buildLineItem('No equity changes', 'NONE', 0, 0)],
      subtotal: totalEquityChange,
      priorSubtotal: priorResult.rows.reduce((s: number, r: any) => s + Number(r.net), 0),
    },
  ];

  return buildStatement('EQUITY_CHANGES', entityId, periodId, priorPeriodId, cur, sections,
    { totalEquityChange }, []);
}

// ============================================================
// Helpers
// ============================================================

function mapBalances(rows: any[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of rows) {
    map[row.economic_category] = Number(row.net);
  }
  return map;
}

function mapCashFlowBalances(rows: any[]): Record<string, number> {
  let operating = 0;
  let investing = 0;
  let financing = 0;

  for (const row of rows) {
    const amount = Number(row.net);
    const category = row.economic_category;
    const entryType = row.entry_type;

    if (category === 'REVENUE' || category === 'EXPENSE') {
      operating += amount;
    } else if (entryType === 'ELIMINATION' || category === 'EQUITY') {
      financing += amount;
    } else {
      investing += amount;
    }
  }

  return { operating, investing, financing };
}

function buildLineItem(label: string, category: string, current: number, prior: number): StatementLineItem {
  const variance = Math.round((current - prior) * 100) / 100;
  const variancePercent = prior !== 0 ? Math.round((variance / Math.abs(prior)) * 10000) / 100 : 0;
  return { label, category, currentPeriod: Math.round(current * 100) / 100, priorPeriod: Math.round(prior * 100) / 100, variance, variancePercent };
}

function buildStatement(
  type: StatementType,
  entityId: string,
  periodId: string,
  priorPeriodId: string | undefined,
  currency: string,
  sections: StatementSection[],
  totals: Record<string, number>,
  notes: StatementNote[],
): FinancialStatement {
  return {
    type,
    entityId,
    entityName: '', // Would be resolved from entity lookup
    periodId,
    periodLabel: periodId,
    priorPeriodId,
    priorPeriodLabel: priorPeriodId,
    currency,
    generatedAt: new Date().toISOString(),
    sections,
    totals: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, Math.round(v * 100) / 100])),
    notes,
  };
}

function generateIncomeNotes(revenue: number, expense: number, priorRevenue: number, priorExpense: number): StatementNote[] {
  const notes: StatementNote[] = [];
  let noteNum = 1;

  if (priorRevenue > 0) {
    const revenueGrowth = ((revenue - priorRevenue) / priorRevenue) * 100;
    notes.push({
      number: noteNum++,
      title: 'Revenue',
      content: `Revenue ${revenueGrowth >= 0 ? 'increased' : 'decreased'} by ${Math.abs(Math.round(revenueGrowth * 10) / 10)}% compared to the prior period.`,
    });
  }

  const margin = revenue > 0 ? ((revenue - expense) / revenue) * 100 : 0;
  notes.push({
    number: noteNum++,
    title: 'Operating Margin',
    content: `Operating margin is ${Math.round(margin * 10) / 10}%.`,
  });

  return notes;
}

function generateBalanceNotes(assets: number, liabilities: number, equity: number): StatementNote[] {
  const notes: StatementNote[] = [];
  let noteNum = 1;

  const debtRatio = assets > 0 ? (liabilities / assets) * 100 : 0;
  notes.push({
    number: noteNum++,
    title: 'Debt Ratio',
    content: `Debt-to-asset ratio is ${Math.round(debtRatio * 10) / 10}%.`,
  });

  return notes;
}
