import { Router, Request, Response, NextFunction } from 'express';
import {
  createBudget, getBudget, listBudgets, approveBudget, lockBudget,
  addBudgetLine, getBudgetLines, updateBudgetLine, deleteBudgetLine,
  getVarianceReport, generateRollingForecast,
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
  const budgets = await listBudgets(req.params.entityId as string, fiscalYear, status as any);
  res.json({ budgets });
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
