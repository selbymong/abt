import { Router, Request, Response } from 'express';
import {
  validateBody, createConsolidationGroupSchema, createOwnershipInterestSchema,
  createIntercompanyMatchSchema, createGoodwillSchema, impairGoodwillSchema,
  createCurrencyTranslationSchema,
} from './validation.js';
import {
  createConsolidationGroup,
  getConsolidationGroup,
  getConsolidationGroupForEntity,
  createOwnershipInterest,
  getOwnershipInterest,
  listOwnershipInterests,
  createIntercompanyMatch,
  createGoodwill,
  getGoodwill,
  impairGoodwill,
  translateCurrency,
  getCurrencyTranslation,
  getConsolidatedPnL,
  getConsolidatedBalanceSheet,
} from '../../services/consolidation/consolidation-service.js';

export const consolidationRouter = Router();

// --- ConsolidationGroup ---

consolidationRouter.post('/groups', validateBody(createConsolidationGroupSchema), async (req: Request, res: Response) => {
  try {
    const id = await createConsolidationGroup(req.body);
    res.status(201).json({ id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

consolidationRouter.get('/groups/:id', async (req: Request, res: Response) => {
  try {
    const group = await getConsolidationGroup(req.params.id as string);
    if (!group) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(group);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

consolidationRouter.get('/groups/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const group = await getConsolidationGroupForEntity(req.params.entityId as string);
    if (!group) { res.status(404).json({ error: 'No consolidation group' }); return; }
    res.json(group);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- OwnershipInterest ---

consolidationRouter.post('/ownership-interests', validateBody(createOwnershipInterestSchema), async (req: Request, res: Response) => {
  try {
    const id = await createOwnershipInterest(req.body);
    res.status(201).json({ id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

consolidationRouter.get('/ownership-interests/:id', async (req: Request, res: Response) => {
  try {
    const oi = await getOwnershipInterest(req.params.id as string);
    if (!oi) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(oi);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

consolidationRouter.get('/ownership-interests/by-investor/:entityId', async (req: Request, res: Response) => {
  try {
    const interests = await listOwnershipInterests(req.params.entityId as string);
    res.json({ ownershipInterests: interests });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Intercompany Matching ---

consolidationRouter.post('/intercompany-match', validateBody(createIntercompanyMatchSchema), async (req: Request, res: Response) => {
  try {
    await createIntercompanyMatch(req.body);
    res.status(201).json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Goodwill ---

consolidationRouter.post('/goodwill', validateBody(createGoodwillSchema), async (req: Request, res: Response) => {
  try {
    const id = await createGoodwill(req.body);
    res.status(201).json({ id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

consolidationRouter.get('/goodwill/:id', async (req: Request, res: Response) => {
  try {
    const gw = await getGoodwill(req.params.id as string);
    if (!gw) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(gw);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

consolidationRouter.post('/goodwill/:id/impair', validateBody(impairGoodwillSchema), async (req: Request, res: Response) => {
  try {
    const { impairmentLoss, testDate } = req.body;
    const result = await impairGoodwill(req.params.id as string, impairmentLoss, testDate);
    if (!result) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Currency Translation ---

consolidationRouter.post('/currency-translation', validateBody(createCurrencyTranslationSchema), async (req: Request, res: Response) => {
  try {
    const result = await translateCurrency(req.body);
    res.status(201).json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

consolidationRouter.get('/currency-translation/:entityId/:periodId', async (req: Request, res: Response) => {
  try {
    const ct = await getCurrencyTranslation(
      req.params.entityId as string,
      req.params.periodId as string,
    );
    if (!ct) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(ct);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Consolidated Reporting ---

consolidationRouter.get('/consolidated-pnl/:groupId', async (req: Request, res: Response) => {
  try {
    const periodId = req.query.periodId as string;
    if (!periodId) { res.status(400).json({ error: 'Required: periodId' }); return; }
    const pnl = await getConsolidatedPnL(req.params.groupId as string, periodId);
    res.json(pnl);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

consolidationRouter.get('/consolidated-balance-sheet/:groupId', async (req: Request, res: Response) => {
  try {
    const periodId = req.query.periodId as string;
    if (!periodId) { res.status(400).json({ error: 'Required: periodId' }); return; }
    const bs = await getConsolidatedBalanceSheet(req.params.groupId as string, periodId);
    res.json(bs);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
