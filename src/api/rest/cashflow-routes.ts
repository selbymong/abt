import { Router, Request, Response } from 'express';
import {
  createCashFlowEvent,
  getCashFlowEvent,
  listCashFlowEvents,
  settleCashFlowEvent,
  createCreditFacility,
  getCreditFacility,
  listCreditFacilities,
  scoreFloatWindow,
  scoreEntityFloatWindows,
  getFloatWindows,
  analyzeDiscount,
} from '../../services/cashflow/cashflow-optimizer-service.js';

export const cashflowRouter = Router();

// --- CashFlowEvent ---

cashflowRouter.post('/events', async (req: Request, res: Response) => {
  const id = await createCashFlowEvent(req.body);
  res.status(201).json({ id });
});

cashflowRouter.get('/events/:id', async (req: Request, res: Response) => {
  const cfe = await getCashFlowEvent(req.params.id as string);
  if (!cfe) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(cfe);
});

cashflowRouter.get('/events/by-entity/:entityId', async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const events = await listCashFlowEvents(req.params.entityId as string, status);
  res.json({ events });
});

cashflowRouter.post('/events/:id/settle', async (req: Request, res: Response) => {
  const result = await settleCashFlowEvent(req.params.id as string);
  if (!result) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ success: true });
});

// --- CreditFacility ---

cashflowRouter.post('/facilities', async (req: Request, res: Response) => {
  const id = await createCreditFacility(req.body);
  res.status(201).json({ id });
});

cashflowRouter.get('/facilities/:id', async (req: Request, res: Response) => {
  const cf = await getCreditFacility(req.params.id as string);
  if (!cf) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(cf);
});

cashflowRouter.get('/facilities/by-entity/:entityId', async (req: Request, res: Response) => {
  const facilities = await listCreditFacilities(req.params.entityId as string);
  res.json({ facilities });
});

// --- FloatWindow Scoring ---

cashflowRouter.post('/float-windows/score/:cfeId', async (req: Request, res: Response) => {
  const result = await scoreFloatWindow(req.params.cfeId as string);
  if (!result) { res.status(404).json({ error: 'Not found or not scorable' }); return; }
  res.status(201).json(result);
});

cashflowRouter.post('/float-windows/score-entity/:entityId', async (req: Request, res: Response) => {
  const windows = await scoreEntityFloatWindows(req.params.entityId as string);
  res.json({ windows });
});

cashflowRouter.get('/float-windows/by-entity/:entityId', async (req: Request, res: Response) => {
  const windows = await getFloatWindows(req.params.entityId as string);
  res.json({ windows });
});

// --- AR Discount Analysis ---

cashflowRouter.get('/discount-analysis/:cfeId', async (req: Request, res: Response) => {
  const analysis = await analyzeDiscount(req.params.cfeId as string);
  if (!analysis) { res.status(404).json({ error: 'Not found or no discount' }); return; }
  res.json(analysis);
});
