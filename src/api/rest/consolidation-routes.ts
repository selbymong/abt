import { Router, Request, Response } from 'express';
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

consolidationRouter.post('/groups', async (req: Request, res: Response) => {
  const id = await createConsolidationGroup(req.body);
  res.status(201).json({ id });
});

consolidationRouter.get('/groups/:id', async (req: Request, res: Response) => {
  const group = await getConsolidationGroup(req.params.id as string);
  if (!group) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(group);
});

consolidationRouter.get('/groups/by-entity/:entityId', async (req: Request, res: Response) => {
  const group = await getConsolidationGroupForEntity(req.params.entityId as string);
  if (!group) { res.status(404).json({ error: 'No consolidation group' }); return; }
  res.json(group);
});

// --- OwnershipInterest ---

consolidationRouter.post('/ownership-interests', async (req: Request, res: Response) => {
  const id = await createOwnershipInterest(req.body);
  res.status(201).json({ id });
});

consolidationRouter.get('/ownership-interests/:id', async (req: Request, res: Response) => {
  const oi = await getOwnershipInterest(req.params.id as string);
  if (!oi) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(oi);
});

consolidationRouter.get('/ownership-interests/by-investor/:entityId', async (req: Request, res: Response) => {
  const interests = await listOwnershipInterests(req.params.entityId as string);
  res.json({ ownershipInterests: interests });
});

// --- Intercompany Matching ---

consolidationRouter.post('/intercompany-match', async (req: Request, res: Response) => {
  await createIntercompanyMatch(req.body);
  res.status(201).json({ success: true });
});

// --- Goodwill ---

consolidationRouter.post('/goodwill', async (req: Request, res: Response) => {
  const id = await createGoodwill(req.body);
  res.status(201).json({ id });
});

consolidationRouter.get('/goodwill/:id', async (req: Request, res: Response) => {
  const gw = await getGoodwill(req.params.id as string);
  if (!gw) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(gw);
});

consolidationRouter.post('/goodwill/:id/impair', async (req: Request, res: Response) => {
  const { impairmentLoss, testDate } = req.body;
  if (!impairmentLoss || !testDate) {
    res.status(400).json({ error: 'Required: impairmentLoss, testDate' }); return;
  }
  const result = await impairGoodwill(req.params.id as string, impairmentLoss, testDate);
  if (!result) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ success: true });
});

// --- Currency Translation ---

consolidationRouter.post('/currency-translation', async (req: Request, res: Response) => {
  const result = await translateCurrency(req.body);
  res.status(201).json(result);
});

consolidationRouter.get('/currency-translation/:entityId/:periodId', async (req: Request, res: Response) => {
  const ct = await getCurrencyTranslation(
    req.params.entityId as string,
    req.params.periodId as string,
  );
  if (!ct) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(ct);
});

// --- Consolidated Reporting ---

consolidationRouter.get('/consolidated-pnl/:groupId', async (req: Request, res: Response) => {
  const periodId = req.query.periodId as string;
  if (!periodId) { res.status(400).json({ error: 'Required: periodId' }); return; }
  const pnl = await getConsolidatedPnL(req.params.groupId as string, periodId);
  res.json(pnl);
});

consolidationRouter.get('/consolidated-balance-sheet/:groupId', async (req: Request, res: Response) => {
  const periodId = req.query.periodId as string;
  if (!periodId) { res.status(400).json({ error: 'Required: periodId' }); return; }
  const bs = await getConsolidatedBalanceSheet(req.params.groupId as string, periodId);
  res.json(bs);
});
