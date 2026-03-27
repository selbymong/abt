import { Router, Request, Response, NextFunction } from 'express';
import {
  createCustomer, getCustomer, listCustomers, updateCustomer,
  createARInvoice, getARInvoice, listARInvoices,
  postARInvoice, recordARPayment, writeOffARInvoice,
  getARAgingReport, getCollectionsList,
} from '../../services/gl/ar-subledger-service.js';
import {
  validateBody,
  createCustomerSchema, createARInvoiceSchema, recordARPaymentSchema,
} from './validation.js';

export const arRouter = Router();

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// --- Customers ---
arRouter.post('/customers', validateBody(createCustomerSchema), wrap(async (req, res) => {
  const id = await createCustomer(req.body);
  res.status(201).json({ id });
}));

arRouter.get('/customers/:id', wrap(async (req, res) => {
  const customer = await getCustomer(req.params.id as string);
  if (!customer) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(customer);
}));

arRouter.get('/customers/by-entity/:entityId', wrap(async (req, res) => {
  const status = req.query.status as string | undefined;
  const customers = await listCustomers(req.params.entityId as string, status as any);
  res.json({ customers });
}));

arRouter.patch('/customers/:id', wrap(async (req, res) => {
  const customer = await updateCustomer(req.params.id as string, req.body);
  res.json(customer);
}));

// --- Invoices ---
arRouter.post('/invoices', validateBody(createARInvoiceSchema), wrap(async (req, res) => {
  const id = await createARInvoice(req.body);
  res.status(201).json({ id });
}));

arRouter.get('/invoices/:id', wrap(async (req, res) => {
  const invoice = await getARInvoice(req.params.id as string);
  if (!invoice) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(invoice);
}));

arRouter.get('/invoices/by-entity/:entityId', wrap(async (req, res) => {
  const customerId = req.query.customerId as string | undefined;
  const status = req.query.status as string | undefined;
  const invoices = await listARInvoices(req.params.entityId as string, customerId, status as any);
  res.json({ invoices });
}));

arRouter.post('/invoices/:id/post', wrap(async (req, res) => {
  const jeId = await postARInvoice(req.params.id as string);
  res.json({ journalEntryId: jeId, status: 'POSTED' });
}));

arRouter.post('/invoices/:id/payment', validateBody(recordARPaymentSchema), wrap(async (req, res) => {
  const { paymentAmount, periodId, paymentDate, currency } = req.body;
  const result = await recordARPayment(req.params.id as string, paymentAmount, periodId, paymentDate, currency);
  res.json(result);
}));

arRouter.post('/invoices/:id/write-off', wrap(async (req, res) => {
  const { periodId, currency } = req.body;
  const jeId = await writeOffARInvoice(req.params.id as string, periodId, currency);
  res.json({ journalEntryId: jeId, status: 'WRITTEN_OFF' });
}));

// --- Aging ---
arRouter.get('/aging/:entityId', wrap(async (req, res) => {
  const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().slice(0, 10);
  const report = await getARAgingReport(req.params.entityId as string, asOfDate);
  res.json(report);
}));

// --- Collections ---
arRouter.get('/collections/:entityId', wrap(async (req, res) => {
  const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().slice(0, 10);
  const list = await getCollectionsList(req.params.entityId as string, asOfDate);
  res.json({ overdue: list });
}));
