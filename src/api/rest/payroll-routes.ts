import { Router, Request, Response, NextFunction } from 'express';
import {
  createEmployee, getEmployee, listEmployees,
  createPayRun, getPayRun, listPayRuns,
  calculatePayRun, approvePayRun, postPayRun,
  getPayStubs, createRemittance, listRemittances,
  generateTaxSlips,
} from '../../services/gl/payroll-service.js';
import { validateBody, createEmployeeSchema, createPayRunSchema, createRemittanceSchema } from './validation.js';

export const payrollRouter = Router();

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// --- Employees ---
payrollRouter.post('/employees', validateBody(createEmployeeSchema), wrap(async (req, res) => {
  const id = await createEmployee(req.body);
  const emp = await getEmployee(id);
  res.status(201).json(emp);
}));

payrollRouter.get('/employees/:id', wrap(async (req, res) => {
  const emp = await getEmployee(req.params.id as string);
  if (!emp) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(emp);
}));

payrollRouter.get('/employees/by-entity/:entityId', wrap(async (req, res) => {
  const status = req.query.status as string | undefined;
  const employees = await listEmployees(req.params.entityId as string, status as any);
  res.json({ employees });
}));

// --- Pay Runs ---
payrollRouter.post('/pay-runs', validateBody(createPayRunSchema), wrap(async (req, res) => {
  const id = await createPayRun(req.body);
  const run = await getPayRun(id);
  res.status(201).json(run);
}));

payrollRouter.get('/pay-runs/:id', wrap(async (req, res) => {
  const run = await getPayRun(req.params.id as string);
  if (!run) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(run);
}));

payrollRouter.get('/pay-runs/by-entity/:entityId', wrap(async (req, res) => {
  const runs = await listPayRuns(req.params.entityId as string);
  res.json({ payRuns: runs });
}));

payrollRouter.post('/pay-runs/:id/calculate', wrap(async (req, res) => {
  const stubs = await calculatePayRun(req.params.id as string);
  res.json({ stubs });
}));

payrollRouter.post('/pay-runs/:id/approve', wrap(async (req, res) => {
  await approvePayRun(req.params.id as string);
  res.json({ status: 'APPROVED' });
}));

payrollRouter.post('/pay-runs/:id/post', wrap(async (req, res) => {
  const jeId = await postPayRun(req.params.id as string);
  res.json({ journalEntryId: jeId, status: 'POSTED' });
}));

payrollRouter.get('/pay-runs/:id/stubs', wrap(async (req, res) => {
  const stubs = await getPayStubs(req.params.id as string);
  res.json({ stubs });
}));

// --- Remittances ---
payrollRouter.post('/remittances', validateBody(createRemittanceSchema), wrap(async (req, res) => {
  const { entityId, remittanceType, amount, periodId, dueDate } = req.body;
  const id = await createRemittance(entityId, remittanceType, amount, periodId, dueDate);
  res.status(201).json({ id });
}));

payrollRouter.get('/remittances/:entityId', wrap(async (req, res) => {
  const status = req.query.status as string | undefined;
  const remittances = await listRemittances(req.params.entityId as string, status as any);
  res.json({ remittances });
}));

// --- Tax Slips ---
payrollRouter.get('/tax-slips/:entityId/:year', wrap(async (req, res) => {
  const slips = await generateTaxSlips(req.params.entityId as string, Number(req.params.year));
  res.json({ slips });
}));
