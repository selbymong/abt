import { Router, Request, Response, NextFunction } from 'express';
import {
  createIntercoLoan, getIntercoLoan, listIntercoLoans,
  activateLoan, accrueInterest, recordRepayment,
  getAmortizationSchedule, generateEliminationEntries,
} from '../../services/gl/interco-loan-service.js';
import { validateBody, createIntercoLoanSchema, accrueInterestSchema, recordRepaymentSchema } from './validation.js';

export const intercoLoanRouter = Router();

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// --- Loans ---
intercoLoanRouter.post('/loans', validateBody(createIntercoLoanSchema), wrap(async (req, res) => {
  const id = await createIntercoLoan(req.body);
  const loan = await getIntercoLoan(id);
  res.status(201).json(loan);
}));

intercoLoanRouter.get('/loans/:id', wrap(async (req, res) => {
  const loan = await getIntercoLoan(req.params.id as string);
  if (!loan) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(loan);
}));

intercoLoanRouter.get('/loans/by-entity/:entityId', wrap(async (req, res) => {
  const role = req.query.role as 'lender' | 'borrower' | undefined;
  const loans = await listIntercoLoans(req.params.entityId as string, role);
  res.json({ loans });
}));

// --- Lifecycle ---
intercoLoanRouter.post('/loans/:id/activate', wrap(async (req, res) => {
  const schedule = await activateLoan(req.params.id as string);
  res.json({ status: 'ACTIVE', schedule });
}));

intercoLoanRouter.post('/loans/:id/accrue', validateBody(accrueInterestSchema), wrap(async (req, res) => {
  const { periodId, accrualDate } = req.body;
  const result = await accrueInterest(req.params.id as string, periodId, accrualDate);
  res.json(result);
}));

intercoLoanRouter.post('/loans/:id/repay', validateBody(recordRepaymentSchema), wrap(async (req, res) => {
  const { periodId, paymentDate } = req.body;
  const result = await recordRepayment(req.params.id as string, periodId, paymentDate);
  res.json(result);
}));

// --- Schedule ---
intercoLoanRouter.get('/loans/:id/schedule', wrap(async (req, res) => {
  const schedule = await getAmortizationSchedule(req.params.id as string);
  res.json({ schedule });
}));

// --- Elimination ---
intercoLoanRouter.post('/loans/:id/eliminate', wrap(async (req, res) => {
  const { periodId, asOfDate } = req.body;
  const jeId = await generateEliminationEntries(req.params.id as string, periodId, asOfDate);
  res.json({ journalEntryId: jeId });
}));
