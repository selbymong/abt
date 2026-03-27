import { Router, Request, Response, NextFunction } from 'express';
import {
  createPurchaseOrder, getPurchaseOrder, listPurchaseOrders,
  submitForApproval, approvePurchaseOrder, issuePurchaseOrder, cancelPurchaseOrder,
  createGoodsReceipt, getGoodsReceipt, listGoodsReceipts,
  performThreeWayMatch, closePurchaseOrder, getPOSummary,
} from '../../services/gl/procurement-service.js';
import {
  validateBody,
  createPurchaseOrderSchema, createGoodsReceiptSchema, threeWayMatchSchema,
} from './validation.js';

export const procurementRouter = Router();

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// --- Purchase Orders ---
procurementRouter.post('/purchase-orders', validateBody(createPurchaseOrderSchema), wrap(async (req, res) => {
  const id = await createPurchaseOrder(req.body);
  const po = await getPurchaseOrder(id);
  res.status(201).json(po);
}));

procurementRouter.get('/purchase-orders/:id', wrap(async (req, res) => {
  const po = await getPurchaseOrder(req.params.id as string);
  if (!po) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(po);
}));

procurementRouter.get('/purchase-orders/by-entity/:entityId', wrap(async (req, res) => {
  const status = req.query.status as string | undefined;
  const vendorId = req.query.vendorId as string | undefined;
  const pos = await listPurchaseOrders(req.params.entityId as string, status as any, vendorId);
  res.json({ purchaseOrders: pos });
}));

// --- Approval Workflow ---
procurementRouter.post('/purchase-orders/:id/submit', wrap(async (req, res) => {
  const po = await submitForApproval(req.params.id as string);
  res.json(po);
}));

procurementRouter.post('/purchase-orders/:id/approve', wrap(async (req, res) => {
  const { approvedBy } = req.body;
  const po = await approvePurchaseOrder(req.params.id as string, approvedBy);
  res.json(po);
}));

procurementRouter.post('/purchase-orders/:id/issue', wrap(async (req, res) => {
  const po = await issuePurchaseOrder(req.params.id as string);
  res.json(po);
}));

procurementRouter.post('/purchase-orders/:id/cancel', wrap(async (req, res) => {
  const { reason } = req.body;
  const po = await cancelPurchaseOrder(req.params.id as string, reason ?? 'Cancelled');
  res.json(po);
}));

procurementRouter.post('/purchase-orders/:id/close', wrap(async (req, res) => {
  const po = await closePurchaseOrder(req.params.id as string);
  res.json(po);
}));

// --- Goods Receipts ---
procurementRouter.post('/purchase-orders/:id/receipts', validateBody(createGoodsReceiptSchema), wrap(async (req, res) => {
  const { receivedBy, receiptDate, lines, notes } = req.body;
  const id = await createGoodsReceipt(req.params.id as string, receivedBy, receiptDate, lines, notes);
  const receipt = await getGoodsReceipt(id);
  res.status(201).json(receipt);
}));

procurementRouter.get('/receipts/:id', wrap(async (req, res) => {
  const receipt = await getGoodsReceipt(req.params.id as string);
  if (!receipt) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(receipt);
}));

procurementRouter.get('/purchase-orders/:id/receipts', wrap(async (req, res) => {
  const receipts = await listGoodsReceipts(req.params.id as string);
  res.json({ receipts });
}));

// --- 3-Way Matching ---
procurementRouter.post('/match', validateBody(threeWayMatchSchema), wrap(async (req, res) => {
  const { poId, invoiceId, tolerancePercent } = req.body;
  const result = await performThreeWayMatch(poId, invoiceId, tolerancePercent);
  res.json(result);
}));

// --- Summary ---
procurementRouter.get('/summary/:entityId', wrap(async (req, res) => {
  const summary = await getPOSummary(req.params.entityId as string);
  res.json(summary);
}));
