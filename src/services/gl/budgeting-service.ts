/**
 * Budgeting & Variance Analysis Service
 *
 * Implements:
 * - Budget entry by node (Activity, Project, Product, Fund) per period
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
  scenario?: string;
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
  scenario?: string;
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
  seasonalityProfile?: string;
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
  seasonality_profile?: string;
  created_at: string;
}

// ============================================================
// Seasonality Profiles
// ============================================================
// Monthly weights by calendar month (1=Jan, 12=Dec). Must sum to 1.0.
// Sources: Blackbaud Institute "Charitable Giving Report" (2023),
// M+R Benchmarks 2024, Network for Good "Digital Giving Trends".

export const SEASONALITY_PROFILES: Record<string, Record<number, number>> = {
  // Giving season: ~31% in Dec, ~13% in Nov, ~9% in Oct, ~8% in Jan
  GIVING_SEASON: {
    1: 0.08, 2: 0.05, 3: 0.06, 4: 0.05, 5: 0.05, 6: 0.05,
    7: 0.04, 8: 0.04, 9: 0.05, 10: 0.09, 11: 0.13, 12: 0.31,
  },
  // Marketing spend leads donations — ramp up Sep/Oct to capture Nov/Dec intent
  GIVING_SEASON_MARKETING: {
    1: 0.06, 2: 0.04, 3: 0.05, 4: 0.04, 5: 0.04, 6: 0.05,
    7: 0.05, 8: 0.06, 9: 0.11, 10: 0.15, 11: 0.18, 12: 0.17,
  },
};

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

  const result = await runCypher<{ bid: string }>(
    `MERGE (b:Budget {entity_id: $entityId, name: $name, scenario: $scenario, fiscal_year: $fiscalYear})
     ON CREATE SET
      b.id = $id, b.currency = $currency,
      b.status = 'DRAFT', b.created_by = $createdBy,
      b.description = $description, b.total_amount = 0,
      b.created_at = datetime(), b.updated_at = datetime()
     ON MATCH SET b.updated_at = datetime()
     RETURN b.id AS bid`,
    {
      id,
      entityId: input.entityId,
      name: input.name,
      fiscalYear: input.fiscalYear,
      currency: input.currency,
      createdBy: input.createdBy,
      description: input.description ?? null,
      scenario: input.scenario ?? null,
    },
  );

  return result[0]?.bid ?? id;
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
  scenario?: string,
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
  if (scenario) {
    where += ' AND b.scenario = $scenario';
    params.scenario = scenario;
  }

  const results = await runCypher<{ b: Budget }>(
    `MATCH (b:Budget) WHERE ${where}
     RETURN properties(b) AS b ORDER BY b.fiscal_year DESC, b.name`,
    params,
  );
  return results.map((r) => r.b);
}

export async function listScenarios(entityId: string): Promise<string[]> {
  const results = await runCypher<{ scenario: string }>(
    `MATCH (b:Budget {entity_id: $entityId})
     WHERE b.scenario IS NOT NULL
     RETURN DISTINCT b.scenario AS scenario ORDER BY scenario`,
    { entityId },
  );
  return results.map((r) => r.scenario);
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

  // Check for existing line with same business key
  const existing = await query(
    `SELECT id FROM budget_lines
     WHERE budget_id = $1 AND period_id = $2
       AND economic_category = $3 AND COALESCE(notes, '') = COALESCE($4, '')`,
    [input.budgetId, input.periodId, input.economicCategory, input.notes ?? null],
  );

  if (existing.rows.length > 0) {
    return (existing.rows[0] as any).id;
  }

  const id = uuid();

  await query(
    `INSERT INTO budget_lines (id, budget_id, period_id, node_ref_id, node_ref_type,
      economic_category, amount, notes, seasonality_profile, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
    [id, input.budgetId, input.periodId, input.nodeRefId, input.nodeRefType,
     input.economicCategory, input.amount, input.notes ?? null,
     input.seasonalityProfile ?? null],
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

export interface ScenarioSeries {
  scenario: string;
  rows: ProjectionRow[];
  categories: string[];
  totals: { revenue: number; expense: number; net: number };
}

export interface MultiScenarioResult {
  entityId: string;
  currency: string;
  groupBy: 'MONTH' | 'YEAR';
  series: ScenarioSeries[];
}

// ── Shared helpers ──────────────────────────────────────────

function enumerateMonths(startDate: string, endDate: string): string[] {
  const months: string[] = [];
  const [sy, sm] = startDate.split('-').map(Number);
  const [ey, em] = endDate.split('-').map(Number);
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

function parsePeriodDate(d: any): string {
  if (typeof d === 'string') return d;
  if (d.year != null) {
    return `${d.year.low ?? d.year}-${String(d.month.low ?? d.month).padStart(2, '0')}-${String(d.day.low ?? d.day).padStart(2, '0')}`;
  }
  return String(d);
}

async function fetchPeriodMap(entityId: string): Promise<Map<string, { label: string; startDate: string; endDate: string }>> {
  const periodResults = await runCypher<{
    p: { id: string; label: string; start_date: any; end_date: any };
  }>(
    `MATCH (p:AccountingPeriod {entity_id: $entityId})
     RETURN properties(p) AS p ORDER BY p.start_date`,
    { entityId },
  );
  const periodMap = new Map<string, { label: string; startDate: string; endDate: string }>();
  for (const r of periodResults) {
    periodMap.set(r.p.id, {
      label: r.p.label,
      startDate: parsePeriodDate(r.p.start_date),
      endDate: parsePeriodDate(r.p.end_date),
    });
  }
  return periodMap;
}

function aggregateLinesToRows(
  lines: BudgetLine[],
  periodMap: Map<string, { label: string; startDate: string; endDate: string }>,
): { rows: ProjectionRow[]; categories: string[]; totals: { revenue: number; expense: number; net: number } } {
  const monthAgg = new Map<string, {
    startDate: string; endDate: string; label: string;
    revenue: number; expense: number; breakdown: Record<string, number>;
  }>();
  const categorySet = new Set<string>();

  function ensureMonth(monthKey: string) {
    if (!monthAgg.has(monthKey)) {
      const [y, m] = monthKey.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const lastDay = new Date(y, m, 0).getDate();
      monthAgg.set(monthKey, {
        startDate: `${monthKey}-01`,
        endDate: `${monthKey}-${String(lastDay).padStart(2, '0')}`,
        label, revenue: 0, expense: 0, breakdown: {},
      });
    }
  }

  for (const line of lines) {
    const period = periodMap.get(line.period_id);
    if (!period) continue;

    const amount = Number(line.amount);
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

    const months = enumerateMonths(period.startDate, period.endDate);
    const profile = line.seasonality_profile
      ? SEASONALITY_PROFILES[line.seasonality_profile]
      : null;

    // If a seasonality profile exists, distribute by calendar-month weights;
    // otherwise spread uniformly.
    let monthWeights: number[];
    if (profile) {
      const rawWeights = months.map((mk) => {
        const calMonth = Number(mk.split('-')[1]);
        return profile[calMonth] ?? (1 / 12);
      });
      // Normalise so the subset of months in this period sums to 1.0
      const wSum = rawWeights.reduce((s, w) => s + w, 0);
      monthWeights = rawWeights.map((w) => w / wSum);
    } else {
      monthWeights = months.map(() => 1 / months.length);
    }

    for (let mi = 0; mi < months.length; mi++) {
      const monthKey = months[mi];
      const monthlyAmount = amount * monthWeights[mi];
      ensureMonth(monthKey);
      const agg = monthAgg.get(monthKey)!;
      if (line.economic_category === 'REVENUE') {
        agg.revenue += monthlyAmount;
      } else {
        agg.expense += monthlyAmount;
      }
      agg.breakdown[cat] = (agg.breakdown[cat] || 0) + monthlyAmount;
    }
  }

  const rows: ProjectionRow[] = [];
  for (const [, agg] of monthAgg.entries()) {
    rows.push({
      periodId: agg.startDate.slice(0, 7),
      periodLabel: agg.label,
      startDate: agg.startDate,
      endDate: agg.endDate,
      revenue: agg.revenue,
      expense: agg.expense,
      net: agg.revenue - agg.expense,
      breakdown: agg.breakdown,
    });
  }
  rows.sort((a, b) => a.startDate.localeCompare(b.startDate));

  const totals = rows.reduce(
    (acc, r) => ({ revenue: acc.revenue + r.revenue, expense: acc.expense + r.expense, net: acc.net + r.net }),
    { revenue: 0, expense: 0, net: 0 },
  );
  totals.revenue = Math.round(totals.revenue);
  totals.expense = Math.round(totals.expense);
  totals.net = Math.round(totals.net);

  return { rows, categories: [...categorySet].sort(), totals };
}

/**
 * Returns per-scenario projection series. Each selected scenario is its own
 * independent data set — they are never summed together.
 */
export async function getProjectionTimeSeries(
  entityId: string,
  budgetIds?: string[],
  economicCategory?: 'REVENUE' | 'EXPENSE',
  scenarios?: string[],
): Promise<MultiScenarioResult> {
  const allBudgets = await listBudgets(entityId);
  const currency = allBudgets[0]?.currency ?? 'CAD';

  // Determine which scenarios to include
  let targetScenarios: string[];
  if (scenarios && scenarios.length > 0) {
    targetScenarios = scenarios;
  } else if (budgetIds && budgetIds.length > 0) {
    // Legacy: group selected budgets by their scenario
    const selected = allBudgets.filter((b) => budgetIds.includes(b.id));
    const scenarioNames = [...new Set(selected.map((b) => b.scenario || 'Untagged'))];
    targetScenarios = scenarioNames;
  } else {
    // All distinct scenarios
    const scenarioNames = [...new Set(allBudgets.map((b) => b.scenario || 'Untagged'))];
    targetScenarios = scenarioNames;
  }

  if (allBudgets.length === 0) {
    return { entityId, currency, groupBy: 'MONTH', series: [] };
  }

  const periodMap = await fetchPeriodMap(entityId);

  // Build one series per scenario
  const series: ScenarioSeries[] = [];
  for (const scenarioName of targetScenarios) {
    const scenarioBudgets = allBudgets.filter((b) =>
      (b.scenario || 'Untagged') === scenarioName &&
      (!budgetIds || budgetIds.length === 0 || budgetIds.includes(b.id)),
    );
    if (scenarioBudgets.length === 0) continue;

    const ids = scenarioBudgets.map((b) => b.id);
    let linesSql = `SELECT * FROM budget_lines WHERE budget_id = ANY($1)`;
    const linesParams: unknown[] = [ids];
    if (economicCategory) {
      linesSql += ` AND economic_category = $2`;
      linesParams.push(economicCategory);
    }
    const linesResult = await query(linesSql, linesParams);
    const lines = linesResult.rows as BudgetLine[];

    const { rows, categories, totals } = aggregateLinesToRows(lines, periodMap);
    series.push({ scenario: scenarioName, rows, categories, totals });
  }

  return { entityId, currency, groupBy: 'MONTH', series };
}
