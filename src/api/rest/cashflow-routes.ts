import { Router, Request, Response } from 'express';
import {
  validateBody, createCashFlowEventSchema, createCreditFacilitySchema,
} from './validation.js';
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

cashflowRouter.post('/events', validateBody(createCashFlowEventSchema), async (req: Request, res: Response) => {
  try {
    const id = await createCashFlowEvent(req.body);
    res.status(201).json({ id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

cashflowRouter.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const cfe = await getCashFlowEvent(req.params.id as string);
    if (!cfe) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(cfe);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

cashflowRouter.get('/events/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const events = await listCashFlowEvents(req.params.entityId as string, status);
    res.json({ events });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

cashflowRouter.post('/events/:id/settle', async (req: Request, res: Response) => {
  try {
    const result = await settleCashFlowEvent(req.params.id as string);
    if (!result) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- CreditFacility ---

cashflowRouter.post('/facilities', validateBody(createCreditFacilitySchema), async (req: Request, res: Response) => {
  try {
    const id = await createCreditFacility(req.body);
    res.status(201).json({ id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

cashflowRouter.get('/facilities/:id', async (req: Request, res: Response) => {
  try {
    const cf = await getCreditFacility(req.params.id as string);
    if (!cf) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(cf);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

cashflowRouter.get('/facilities/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const facilities = await listCreditFacilities(req.params.entityId as string);
    res.json({ facilities });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- FloatWindow Scoring ---

cashflowRouter.post('/float-windows/score/:cfeId', async (req: Request, res: Response) => {
  try {
    const result = await scoreFloatWindow(req.params.cfeId as string);
    if (!result) { res.status(404).json({ error: 'Not found or not scorable' }); return; }
    res.status(201).json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

cashflowRouter.post('/float-windows/score-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const windows = await scoreEntityFloatWindows(req.params.entityId as string);
    res.json({ windows });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

cashflowRouter.get('/float-windows/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const windows = await getFloatWindows(req.params.entityId as string);
    res.json({ windows });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- AR Discount Analysis ---

cashflowRouter.get('/discount-analysis/:cfeId', async (req: Request, res: Response) => {
  try {
    const analysis = await analyzeDiscount(req.params.cfeId as string);
    if (!analysis) { res.status(404).json({ error: 'Not found or no discount' }); return; }
    res.json(analysis);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
