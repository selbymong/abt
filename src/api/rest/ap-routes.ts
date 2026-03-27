import { Router, Request, Response, NextFunction } from 'express';
import {
  createVendor,
  getVendor,
  listVendors,
  updateVendor,
  createInvoice,
  getInvoice,
  listInvoices,
  approveInvoice,
  postInvoice,
  voidInvoice,
  getAgingReport,
  executePaymentRun,
  listPaymentRuns,
  getDunningList,
} from '../../services/gl/ap-subledger-service.js';
import {
  validateBody,
  createVendorSchema,
  createAPInvoiceSchema,
  executePaymentRunSchema,
} from './validation.js';

export const apRouter = Router();

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// --- Vendors ---
apRouter.post('/vendors', validateBody(createVendorSchema), wrap(async (req, res) => {
  const id = await createVendor(req.body);
  res.status(201).json({ id });
}));

apRouter.get('/vendors/:id', wrap(async (req, res) => {
  const vendor = await getVendor(req.params.id as string);
  if (!vendor) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(vendor);
}));

apRouter.get('/vendors/by-entity/:entityId', wrap(async (req, res) => {
  const status = req.query.status as string | undefined;
  const vendors = await listVendors(req.params.entityId as string, status as any);
  res.json({ vendors });
}));

apRouter.patch('/vendors/:id', wrap(async (req, res) => {
  const vendor = await updateVendor(req.params.id as string, req.body);
  res.json(vendor);
}));

// --- Invoices ---
apRouter.post('/invoices', validateBody(createAPInvoiceSchema), wrap(async (req, res) => {
  const id = await createInvoice(req.body);
  res.status(201).json({ id });
}));

apRouter.get('/invoices/:id', wrap(async (req, res) => {
  const invoice = await getInvoice(req.params.id as string);
  if (!invoice) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(invoice);
}));

apRouter.get('/invoices/by-entity/:entityId', wrap(async (req, res) => {
  const vendorId = req.query.vendorId as string | undefined;
  const status = req.query.status as string | undefined;
  const invoices = await listInvoices(req.params.entityId as string, vendorId, status as any);
  res.json({ invoices });
}));

apRouter.post('/invoices/:id/approve', wrap(async (req, res) => {
  await approveInvoice(req.params.id as string);
  res.json({ status: 'APPROVED' });
}));

apRouter.post('/invoices/:id/post', wrap(async (req, res) => {
  const jeId = await postInvoice(req.params.id as string);
  res.json({ journalEntryId: jeId, status: 'POSTED' });
}));

apRouter.post('/invoices/:id/void', wrap(async (req, res) => {
  await voidInvoice(req.params.id as string);
  res.json({ status: 'VOID' });
}));

// --- Aging ---
apRouter.get('/aging/:entityId', wrap(async (req, res) => {
  const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().slice(0, 10);
  const report = await getAgingReport(req.params.entityId as string, asOfDate);
  res.json(report);
}));

// --- Payment Runs ---
apRouter.post('/payment-runs', validateBody(executePaymentRunSchema), wrap(async (req, res) => {
  const { entityId, periodId, paymentDate, currency, maxDueDate, vendorId } = req.body;
  const result = await executePaymentRun(entityId, periodId, paymentDate, currency, maxDueDate, vendorId);
  res.status(201).json(result);
}));

apRouter.get('/payment-runs/:entityId', wrap(async (req, res) => {
  const runs = await listPaymentRuns(req.params.entityId as string);
  res.json({ runs });
}));

// --- Dunning ---
apRouter.get('/dunning/:entityId', wrap(async (req, res) => {
  const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().slice(0, 10);
  const list = await getDunningList(req.params.entityId as string, asOfDate);
  res.json({ overdue: list });
}));
