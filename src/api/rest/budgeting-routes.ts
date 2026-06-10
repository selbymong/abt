import { Router, Request, Response, NextFunction } from 'express';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  createBudget, getBudget, listBudgets, listScenarios, approveBudget, lockBudget,
  addBudgetLine, getBudgetLines, updateBudgetLine, deleteBudgetLine, deleteBudget,
  getVarianceReport, generateRollingForecast, getProjectionTimeSeries,
} from '../../services/gl/budgeting-service.js';
import {
  validateBody,
  createBudgetSchema, addBudgetLineSchema, updateBudgetLineSchema,
  rollingForecastSchema,
} from './validation.js';

export const budgetingRouter = Router();

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// --- Budgets ---
budgetingRouter.post('/budgets', validateBody(createBudgetSchema), wrap(async (req, res) => {
  const id = await createBudget(req.body);
  const budget = await getBudget(id);
  res.status(201).json(budget);
}));

budgetingRouter.get('/budgets/:id', wrap(async (req, res) => {
  const budget = await getBudget(req.params.id as string);
  if (!budget) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(budget);
}));

budgetingRouter.get('/budgets/by-entity/:entityId', wrap(async (req, res) => {
  const fiscalYear = req.query.fiscalYear ? Number(req.query.fiscalYear) : undefined;
  const status = req.query.status as string | undefined;
  const scenario = req.query.scenario as string | undefined;
  const budgets = await listBudgets(req.params.entityId as string, fiscalYear, status as any, scenario);
  res.json({ budgets });
}));

budgetingRouter.get('/scenarios/by-entity/:entityId', wrap(async (req, res) => {
  const scenarios = await listScenarios(req.params.entityId as string);
  res.json({ scenarios });
}));

budgetingRouter.post('/budgets/:id/approve', wrap(async (req, res) => {
  const { approvedBy } = req.body;
  const budget = await approveBudget(req.params.id as string, approvedBy);
  res.json(budget);
}));

budgetingRouter.post('/budgets/:id/lock', wrap(async (req, res) => {
  const budget = await lockBudget(req.params.id as string);
  res.json(budget);
}));

// --- Budget Lines ---
budgetingRouter.post('/lines', validateBody(addBudgetLineSchema), wrap(async (req, res) => {
  const id = await addBudgetLine(req.body);
  res.status(201).json({ id });
}));

budgetingRouter.get('/lines/:budgetId', wrap(async (req, res) => {
  const periodId = req.query.periodId as string | undefined;
  const lines = await getBudgetLines(req.params.budgetId as string, periodId);
  res.json({ lines });
}));

budgetingRouter.patch('/lines/:id', validateBody(updateBudgetLineSchema), wrap(async (req, res) => {
  await updateBudgetLine(req.params.id as string, req.body.amount, req.body.notes);
  res.json({ status: 'updated' });
}));

budgetingRouter.delete('/lines/:id', wrap(async (req, res) => {
  await deleteBudgetLine(req.params.id as string);
  res.json({ status: 'deleted' });
}));

budgetingRouter.delete('/budgets/:id', wrap(async (req, res) => {
  await deleteBudget(req.params.id as string);
  res.json({ status: 'deleted' });
}));

// --- Projection Time-Series ---
budgetingRouter.get('/projections/:entityId', wrap(async (req, res) => {
  const budgetIds = req.query.budgetIds
    ? (req.query.budgetIds as string).split(',')
    : undefined;
  const scenarios = req.query.scenarios
    ? (req.query.scenarios as string).split(',')
    : undefined;
  const economicCategory = req.query.economicCategory as 'REVENUE' | 'EXPENSE' | undefined;
  const result = await getProjectionTimeSeries(
    req.params.entityId as string,
    budgetIds,
    economicCategory,
    scenarios,
  );
  res.json(result);
}));

// --- Projection Assumptions ---
budgetingRouter.get('/assumptions', (_req: Request, res: Response) => {
  try {
    const dir = dirname(fileURLToPath(import.meta.url));
    const mdPath = resolve(dir, '../../../docs/projection-assumptions.md');
    const content = readFileSync(mdPath, 'utf-8');
    res.type('text/markdown').send(content);
  } catch {
    res.status(404).json({ error: 'Assumptions document not found' });
  }
});

// --- Variance Report ---
budgetingRouter.get('/variance/:budgetId', wrap(async (req, res) => {
  const periodIds = req.query.periodIds
    ? (req.query.periodIds as string).split(',')
    : undefined;
  const report = await getVarianceReport(req.params.budgetId as string, periodIds);
  res.json(report);
}));

// --- Rolling Forecast ---
budgetingRouter.post('/forecast/:budgetId', validateBody(rollingForecastSchema), wrap(async (req, res) => {
  const { completedPeriodIds, remainingPeriodIds } = req.body;
  const forecast = await generateRollingForecast(
    req.params.budgetId as string,
    completedPeriodIds,
    remainingPeriodIds,
  );
  res.json({ forecast });
}));
