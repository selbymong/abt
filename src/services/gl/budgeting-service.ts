/**
 * Budgeting & Variance Analysis Service
 *
 * Implements:
 * - Budget entry by node (Activity, Project, Initiative, Fund) per period
 * - Budget versioning (DRAFT → APPROVED → LOCKED)
 * - Actual vs budget comparison from TimescaleDB gl_period_balances
 * - Variance reports: favorable/unfavorable, amount and percentage
 * - Rolling forecast: adjust remaining periods based on actuals
 *
 * Budgets are stored as graph nodes linked to the target node.
 * Actuals are read from TimescaleDB (CQRS read model).
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';

// ============================================================
// Types
// ============================================================

export type BudgetStatus = 'DRAFT' | 'APPROVED' | 'LOCKED';
export type VarianceType = 'FAVORABLE' | 'UNFAVORABLE' | 'ON_TARGET';

export interface CreateBudgetInput {
  entityId: string;
  name: string;
  fiscalYear: number;
  currency: string;
  createdBy: string;
  description?: string;
}

export interface Budget {
  id: string;
  entity_id: string;
  name: string;
  fiscal_year: number;
  currency: string;
  status: BudgetStatus;
  created_by: string;
  approved_by?: string;
  description?: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetLineInput {
  budgetId: string;
  periodId: string;
  nodeRefId: string;
  nodeRefType: string;
  economicCategory: string;
  amount: number;
  notes?: string;
}

export interface BudgetLine {
  id: string;
  budget_id: string;
  period_id: string;
  node_ref_id: string;
  node_ref_type: string;
  economic_category: string;
  amount: number;
  notes?: string;
  created_at: string;
}

export interface VarianceItem {
  periodId: string;
  nodeRefId: string;
  nodeRefType: string;
  economicCategory: string;
  budgetAmount: number;
  actualAmount: number;
  varianceAmount: number;
  variancePercent: number;
  varianceType: VarianceType;
}

export interface VarianceReport {
  budgetId: string;
  budgetName: string;
  entityId: string;
  fiscalYear: number;
  currency: string;
  items: VarianceItem[];
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
}

export interface ForecastItem {
  periodId: string;
  nodeRefId: string;
  economicCategory: string;
  budgetAmount: number;
  actualAmount: number;
  forecastAmount: number;
  adjustmentReason: string;
}

// ============================================================
// Budget CRUD
// ============================================================

export async function createBudget(input: CreateBudgetInput): Promise<string> {
  const id = uuid();

  await runCypher(
    `CREATE (b:Budget {
      id: $id, entity_id: $entityId, name: $name,
      fiscal_year: $fiscalYear, currency: $currency,
      status: 'DRAFT', created_by: $createdBy,
      description: $description, total_amount: 0,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      name: input.name,
      fiscalYear: input.fiscalYear,
      currency: input.currency,
      createdBy: input.createdBy,
      description: input.description ?? null,
    },
  );

  return id;
}

export async function getBudget(id: string): Promise<Budget | null> {
  const results = await runCypher<{ b: Budget }>(
    `MATCH (b:Budget {id: $id}) RETURN properties(b) AS b`,
    { id },
  );
  return results[0]?.b ?? null;
}

export async function listBudgets(
  entityId: string,
  fiscalYear?: number,
  status?: BudgetStatus,
): Promise<Budget[]> {
  let where = 'b.entity_id = $entityId';
  const params: Record<string, unknown> = { entityId };

  if (fiscalYear) {
    where += ' AND b.fiscal_year = $fiscalYear';
    params.fiscalYear = fiscalYear;
  }
  if (status) {
    where += ' AND b.status = $status';
    params.status = status;
  }

  const results = await runCypher<{ b: Budget }>(
    `MATCH (b:Budget) WHERE ${where}
     RETURN properties(b) AS b ORDER BY b.fiscal_year DESC, b.name`,
    params,
  );
  return results.map((r) => r.b);
}

export async function approveBudget(budgetId: string, approvedBy: string): Promise<Budget> {
  const budget = await getBudget(budgetId);
  if (!budget) throw new Error(`Budget ${budgetId} not found`);
  if (budget.status !== 'DRAFT') throw new Error(`Budget ${budgetId} is ${budget.status}, must be DRAFT to approve`);

  const results = await runCypher<{ b: Budget }>(
    `MATCH (b:Budget {id: $id})
     SET b.status = 'APPROVED', b.approved_by = $approvedBy, b.updated_at = datetime()
     RETURN properties(b) AS b`,
    { id: budgetId, approvedBy },
  );
  return results[0].b;
}

export async function lockBudget(budgetId: string): Promise<Budget> {
  const budget = await getBudget(budgetId);
  if (!budget) throw new Error(`Budget ${budgetId} not found`);
  if (budget.status !== 'APPROVED') throw new Error(`Budget ${budgetId} is ${budget.status}, must be APPROVED to lock`);

  const results = await runCypher<{ b: Budget }>(
    `MATCH (b:Budget {id: $id})
     SET b.status = 'LOCKED', b.updated_at = datetime()
     RETURN properties(b) AS b`,
    { id: budgetId },
  );
  return results[0].b;
}

// ============================================================
// Budget Lines
// ============================================================

export async function addBudgetLine(input: BudgetLineInput): Promise<string> {
  const budget = await getBudget(input.budgetId);
  if (!budget) throw new Error(`Budget ${input.budgetId} not found`);
  if (budget.status === 'LOCKED') throw new Error(`Budget ${input.budgetId} is LOCKED, cannot modify`);

  const id = uuid();

  await query(
    `INSERT INTO budget_lines (id, budget_id, period_id, node_ref_id, node_ref_type,
      economic_category, amount, notes, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [id, input.budgetId, input.periodId, input.nodeRefId, input.nodeRefType,
     input.economicCategory, input.amount, input.notes ?? null],
  );

  // Update budget total
  await runCypher(
    `MATCH (b:Budget {id: $id})
     SET b.total_amount = b.total_amount + $amount, b.updated_at = datetime()`,
    { id: input.budgetId, amount: input.amount },
  );

  return id;
}

export async function getBudgetLines(budgetId: string, periodId?: string): Promise<BudgetLine[]> {
  let sql = 'SELECT * FROM budget_lines WHERE budget_id = $1';
  const params: unknown[] = [budgetId];

  if (periodId) {
    sql += ' AND period_id = $2';
    params.push(periodId);
  }

  sql += ' ORDER BY period_id, economic_category';
  const result = await query(sql, params);
  return result.rows as any;
}

export async function updateBudgetLine(lineId: string, amount: number, notes?: string): Promise<void> {
  // Get old amount to adjust total
  const oldResult = await query('SELECT budget_id, amount FROM budget_lines WHERE id = $1', [lineId]);
  if (oldResult.rows.length === 0) throw new Error(`Budget line ${lineId} not found`);

  const { budget_id, amount: oldAmount } = oldResult.rows[0] as any;

  const budget = await getBudget(budget_id);
  if (!budget) throw new Error(`Budget ${budget_id} not found`);
  if (budget.status === 'LOCKED') throw new Error(`Budget ${budget_id} is LOCKED, cannot modify`);

  await query(
    'UPDATE budget_lines SET amount = $1, notes = COALESCE($2, notes) WHERE id = $3',
    [amount, notes ?? null, lineId],
  );

  const diff = amount - Number(oldAmount);
  if (diff !== 0) {
    await runCypher(
      `MATCH (b:Budget {id: $id})
       SET b.total_amount = b.total_amount + $diff, b.updated_at = datetime()`,
      { id: budget_id, diff },
    );
  }
}

export async function deleteBudgetLine(lineId: string): Promise<void> {
  const oldResult = await query('SELECT budget_id, amount FROM budget_lines WHERE id = $1', [lineId]);
  if (oldResult.rows.length === 0) throw new Error(`Budget line ${lineId} not found`);

  const { budget_id, amount } = oldResult.rows[0] as any;

  const budget = await getBudget(budget_id);
  if (!budget) throw new Error(`Budget ${budget_id} not found`);
  if (budget.status === 'LOCKED') throw new Error(`Budget ${budget_id} is LOCKED, cannot modify`);

  await query('DELETE FROM budget_lines WHERE id = $1', [lineId]);

  await runCypher(
    `MATCH (b:Budget {id: $id})
     SET b.total_amount = b.total_amount - $amount, b.updated_at = datetime()`,
    { id: budget_id, amount: Number(amount) },
  );
}

export async function deleteBudget(budgetId: string): Promise<void> {
  // Delete all budget lines from PostgreSQL
  await query('DELETE FROM budget_lines WHERE budget_id = $1', [budgetId]);

  // Delete the Budget node from Neo4j
  await runCypher(
    `MATCH (b:Budget {id: $id}) DETACH DELETE b`,
    { id: budgetId },
  );
}

// ============================================================
// Variance Analysis
// ============================================================

export async function getVarianceReport(
  budgetId: string,
  periodIds?: string[],
): Promise<VarianceReport> {
  const budget = await getBudget(budgetId);
  if (!budget) throw new Error(`Budget ${budgetId} not found`);

  // Get budget lines
  let linesSql = 'SELECT * FROM budget_lines WHERE budget_id = $1';
  const linesParams: unknown[] = [budgetId];

  if (periodIds && periodIds.length > 0) {
    linesSql += ` AND period_id = ANY($2)`;
    linesParams.push(periodIds);
  }

  const linesResult = await query(linesSql, linesParams);
  const budgetLines = linesResult.rows as BudgetLine[];

  // Get actuals from TimescaleDB
  const periodFilter = periodIds && periodIds.length > 0
    ? periodIds
    : budgetLines.map((l) => l.period_id);

  const uniquePeriods = [...new Set(periodFilter)];

  let actuals: Map<string, number> = new Map();
  if (uniquePeriods.length > 0) {
    const actualsResult = await query(
      `SELECT period_id, node_ref_id, economic_category,
              SUM(CASE WHEN side = 'DEBIT' THEN amount ELSE -amount END) AS net_amount
       FROM gl_period_balances
       WHERE entity_id = $1 AND period_id = ANY($2)
       GROUP BY period_id, node_ref_id, economic_category`,
      [budget.entity_id, uniquePeriods],
    );

    for (const row of actualsResult.rows as any[]) {
      const key = `${row.period_id}:${row.node_ref_id}:${row.economic_category}`;
      actuals.set(key, Number(row.net_amount));
    }
  }

  // Build variance items
  const items: VarianceItem[] = budgetLines.map((line) => {
    const key = `${line.period_id}:${line.node_ref_id}:${line.economic_category}`;
    const budgetAmount = Number(line.amount);
    const actualAmount = actuals.get(key) ?? 0;
    const varianceAmount = budgetAmount - actualAmount;
    const variancePercent = budgetAmount !== 0
      ? Math.round((varianceAmount / budgetAmount) * 10000) / 100
      : 0;

    // For expenses: under-budget is favorable, over-budget is unfavorable
    // For revenue: over-budget is favorable, under-budget is unfavorable
    const isExpense = line.economic_category === 'EXPENSE';
    let varianceType: VarianceType;
    if (Math.abs(varianceAmount) < 0.01) {
      varianceType = 'ON_TARGET';
    } else if (isExpense) {
      varianceType = varianceAmount > 0 ? 'FAVORABLE' : 'UNFAVORABLE';
    } else {
      varianceType = varianceAmount < 0 ? 'FAVORABLE' : 'UNFAVORABLE';
    }

    return {
      periodId: line.period_id,
      nodeRefId: line.node_ref_id,
      nodeRefType: line.node_ref_type,
      economicCategory: line.economic_category,
      budgetAmount,
      actualAmount,
      varianceAmount: Math.round(varianceAmount * 100) / 100,
      variancePercent,
      varianceType,
    };
  });

  const totalBudget = items.reduce((s, i) => s + i.budgetAmount, 0);
  const totalActual = items.reduce((s, i) => s + i.actualAmount, 0);
  const totalVariance = Math.round((totalBudget - totalActual) * 100) / 100;

  return {
    budgetId,
    budgetName: budget.name,
    entityId: budget.entity_id,
    fiscalYear: budget.fiscal_year,
    currency: budget.currency,
    items,
    totalBudget,
    totalActual,
    totalVariance,
  };
}

// ============================================================
// Rolling Forecast
// ============================================================

export async function generateRollingForecast(
  budgetId: string,
  completedPeriodIds: string[],
  remainingPeriodIds: string[],
): Promise<ForecastItem[]> {
  const budget = await getBudget(budgetId);
  if (!budget) throw new Error(`Budget ${budgetId} not found`);

  // Get all budget lines
  const allLines = await query(
    'SELECT * FROM budget_lines WHERE budget_id = $1 ORDER BY period_id',
    [budgetId],
  );
  const budgetLines = allLines.rows as BudgetLine[];

  // Get actuals for completed periods
  const actualsResult = completedPeriodIds.length > 0
    ? await query(
        `SELECT period_id, node_ref_id, economic_category,
                SUM(CASE WHEN side = 'DEBIT' THEN amount ELSE -amount END) AS net_amount
         FROM gl_period_balances
         WHERE entity_id = $1 AND period_id = ANY($2)
         GROUP BY period_id, node_ref_id, economic_category`,
        [budget.entity_id, completedPeriodIds],
      )
    : { rows: [] };

  const actuals = new Map<string, number>();
  for (const row of actualsResult.rows as any[]) {
    const key = `${row.period_id}:${row.node_ref_id}:${row.economic_category}`;
    actuals.set(key, Number(row.net_amount));
  }

  // Calculate run-rate from completed periods
  const nodeRunRates = new Map<string, { totalActual: number; periods: number }>();
  for (const line of budgetLines) {
    if (completedPeriodIds.includes(line.period_id)) {
      const nodeKey = `${line.node_ref_id}:${line.economic_category}`;
      const key = `${line.period_id}:${line.node_ref_id}:${line.economic_category}`;
      const actual = actuals.get(key) ?? 0;

      if (!nodeRunRates.has(nodeKey)) {
        nodeRunRates.set(nodeKey, { totalActual: 0, periods: 0 });
      }
      const rr = nodeRunRates.get(nodeKey)!;
      rr.totalActual += actual;
      rr.periods += 1;
    }
  }

  // Build forecast for remaining periods
  const forecasts: ForecastItem[] = [];

  for (const line of budgetLines) {
    if (remainingPeriodIds.includes(line.period_id)) {
      const nodeKey = `${line.node_ref_id}:${line.economic_category}`;
      const runRate = nodeRunRates.get(nodeKey);
      const budgetAmount = Number(line.amount);

      let forecastAmount: number;
      let adjustmentReason: string;

      if (runRate && runRate.periods > 0) {
        const avgActual = runRate.totalActual / runRate.periods;
        forecastAmount = Math.round(avgActual * 100) / 100;
        adjustmentReason = `Run-rate based on ${runRate.periods} completed period(s), avg ${avgActual.toFixed(2)}`;
      } else {
        forecastAmount = budgetAmount;
        adjustmentReason = 'No actuals yet, using original budget';
      }

      forecasts.push({
        periodId: line.period_id,
        nodeRefId: line.node_ref_id,
        economicCategory: line.economic_category,
        budgetAmount,
        actualAmount: 0,
        forecastAmount,
        adjustmentReason,
      });
    }
  }

  return forecasts;
}

// ============================================================
// Projection Time-Series
// ============================================================

export interface ProjectionRow {
  periodId: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  revenue: number;
  expense: number;
  net: number;
  breakdown: Record<string, number>;   // notes-category → amount
}

export interface ProjectionResult {
  entityId: string;
  budgetIds: string[];
  groupBy: 'MONTH' | 'YEAR';
  currency: string;
  rows: ProjectionRow[];
  categories: string[];
  totals: { revenue: number; expense: number; net: number };
}

/**
 * Aggregate budget lines across multiple budgets into a time-series
 * suitable for charting revenue vs expenses over time.
 *
 * Joins PG budget_lines with Neo4j AccountingPeriod nodes to get dates.
 */
export async function getProjectionTimeSeries(
  entityId: string,
  budgetIds?: string[],
  economicCategory?: 'REVENUE' | 'EXPENSE',
): Promise<ProjectionResult> {
  // 1. Resolve which budgets to include
  let budgets: Budget[];
  if (budgetIds && budgetIds.length > 0) {
    const all = await listBudgets(entityId);
    budgets = all.filter((b) => budgetIds.includes(b.id));
  } else {
    budgets = await listBudgets(entityId);
  }

  if (budgets.length === 0) {
    return {
      entityId,
      budgetIds: [],
      groupBy: 'MONTH',
      currency: 'CAD',
      rows: [],
      categories: [],
      totals: { revenue: 0, expense: 0, net: 0 },
    };
  }

  const ids = budgets.map((b) => b.id);
  const currency = budgets[0].currency;

  // 2. Fetch all budget lines for these budgets
  let linesSql = `SELECT * FROM budget_lines WHERE budget_id = ANY($1)`;
  const linesParams: unknown[] = [ids];
  if (economicCategory) {
    linesSql += ` AND economic_category = $2`;
    linesParams.push(economicCategory);
  }
  const linesResult = await query(linesSql, linesParams);
  const lines = linesResult.rows as BudgetLine[];

  // 3. Fetch all periods for this entity from Neo4j with dates
  const periodResults = await runCypher<{
    p: { id: string; label: string; start_date: any; end_date: any };
  }>(
    `MATCH (p:AccountingPeriod {entity_id: $entityId})
     RETURN properties(p) AS p ORDER BY p.start_date`,
    { entityId },
  );

  // Build period lookup: id → {label, startDate, endDate}
  const periodMap = new Map<string, { label: string; startDate: string; endDate: string }>();
  for (const r of periodResults) {
    const sd = r.p.start_date;
    const ed = r.p.end_date;
    const startDate = typeof sd === 'string' ? sd
      : sd.year != null ? `${sd.year.low ?? sd.year}-${String(sd.month.low ?? sd.month).padStart(2, '0')}-${String(sd.day.low ?? sd.day).padStart(2, '0')}`
      : String(sd);
    const endDate = typeof ed === 'string' ? ed
      : ed.year != null ? `${ed.year.low ?? ed.year}-${String(ed.month.low ?? ed.month).padStart(2, '0')}-${String(ed.day.low ?? ed.day).padStart(2, '0')}`
      : String(ed);
    periodMap.set(r.p.id, { label: r.p.label, startDate, endDate });
  }

  // 4. Aggregate lines by calendar month (startDate YYYY-MM)
  // Multiple period nodes may map to the same calendar month (per-budget periods).
  const monthAgg = new Map<string, {
    startDate: string; endDate: string; label: string;
    revenue: number; expense: number; breakdown: Record<string, number>;
  }>();
  const categorySet = new Set<string>();

  for (const line of lines) {
    const pid = line.period_id;
    const period = periodMap.get(pid);
    if (!period) continue;

    // Key by YYYY-MM to merge per-budget periods for the same month
    const monthKey = period.startDate.slice(0, 7); // "2026-04"
    if (!monthAgg.has(monthKey)) {
      // Generate clean label: "Apr 2026"
      const d = new Date(period.startDate + 'T00:00:00');
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthAgg.set(monthKey, {
        startDate: period.startDate,
        endDate: period.endDate,
        label,
        revenue: 0,
        expense: 0,
        breakdown: {},
      });
    }
    const agg = monthAgg.get(monthKey)!;
    const amount = Number(line.amount);

    if (line.economic_category === 'REVENUE') {
      agg.revenue += amount;
    } else {
      agg.expense += amount;
    }

    // Extract category: for expenses use note prefix; for revenue use generic label
    let cat: string;
    if (line.economic_category === 'REVENUE') {
      cat = 'Revenue';
    } else {
      const noteParts = line.notes?.split(':');
      cat = noteParts && noteParts[0] && !noteParts[0].startsWith('+')
        ? noteParts[0].trim()
        : 'Other Expense';
    }
    categorySet.add(cat);
    agg.breakdown[cat] = (agg.breakdown[cat] || 0) + amount;
  }

  // 5. Build sorted rows
  const rows: ProjectionRow[] = [];
  for (const [monthKey, agg] of monthAgg.entries()) {
    rows.push({
      periodId: monthKey,
      periodLabel: agg.label,
      startDate: agg.startDate,
      endDate: agg.endDate,
      revenue: Math.round(agg.revenue),
      expense: Math.round(agg.expense),
      net: Math.round(agg.revenue - agg.expense),
      breakdown: agg.breakdown,
    });
  }
  rows.sort((a, b) => a.startDate.localeCompare(b.startDate));

  const totals = rows.reduce(
    (acc, r) => ({ revenue: acc.revenue + r.revenue, expense: acc.expense + r.expense, net: acc.net + r.net }),
    { revenue: 0, expense: 0, net: 0 },
  );

  return {
    entityId,
    budgetIds: ids,
    groupBy: 'MONTH',
    currency,
    rows,
    categories: [...categorySet].sort(),
    totals,
  };
}
