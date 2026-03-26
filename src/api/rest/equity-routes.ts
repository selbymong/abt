import { Router, Request, Response } from 'express';
import {
  createShareClass,
  getShareClass,
  listShareClasses,
  issueShares,
  getTotalShareCapital,
  createEquityAward,
  getEquityAward,
  listEquityAwards,
  recognizeVestingCompensation,
  forfeitAward,
  computeEPS,
} from '../../services/gl/equity-expansion-service.js';

export const equityRouter = Router();

// --- Share Classes ---

equityRouter.post('/share-classes', async (req: Request, res: Response) => {
  try {
    const id = await createShareClass(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

equityRouter.get('/share-classes/:id', async (req: Request, res: Response) => {
  try {
    const sc = await getShareClass(req.params.id as string);
    if (!sc) return res.status(404).json({ error: 'ShareClass not found' });
    res.json(sc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

equityRouter.get('/share-classes/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const classes = await listShareClasses(req.params.entityId as string);
    res.json(classes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

equityRouter.post('/share-classes/:id/issue', async (req: Request, res: Response) => {
  try {
    const { additionalShares, pricePerShare } = req.body;
    const result = await issueShares(req.params.id as string, additionalShares, pricePerShare);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

equityRouter.get('/share-capital/:entityId', async (req: Request, res: Response) => {
  try {
    const total = await getTotalShareCapital(req.params.entityId as string);
    res.json({ entityId: req.params.entityId, totalShareCapital: total });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Equity Awards ---

equityRouter.post('/awards', async (req: Request, res: Response) => {
  try {
    const id = await createEquityAward(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

equityRouter.get('/awards/:id', async (req: Request, res: Response) => {
  try {
    const ea = await getEquityAward(req.params.id as string);
    if (!ea) return res.status(404).json({ error: 'EquityAward not found' });
    res.json(ea);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

equityRouter.get('/awards/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const awards = await listEquityAwards(req.params.entityId as string, status as any);
    res.json(awards);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

equityRouter.post('/awards/:id/vest', async (req: Request, res: Response) => {
  try {
    const { periodId, monthsElapsed, validDate, currency } = req.body;
    const result = await recognizeVestingCompensation(
      req.params.id as string, periodId, monthsElapsed, validDate, currency,
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

equityRouter.post('/awards/:id/forfeit', async (req: Request, res: Response) => {
  try {
    await forfeitAward(req.params.id as string);
    res.json({ status: 'forfeited' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- EPS ---

equityRouter.post('/eps', async (req: Request, res: Response) => {
  try {
    const { entityId, periodId, netIncome } = req.body;
    const result = await computeEPS(entityId, periodId, netIncome);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
