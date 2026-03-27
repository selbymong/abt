import { Router, Request, Response } from 'express';
import {
  classifyAsHeldForSale,
  declassifyHeldForSale,
  recordDisposal,
  getDiscontinuedOpsPnL,
  listHeldForSaleInitiatives,
} from '../../services/gl/discontinued-ops-service.js';
import {
  validateBody,
  classifyHeldForSaleSchema,
  recordDisposalSchema,
} from './validation.js';

export const discontinuedOpsRouter = Router();

// POST /api/discontinued-ops/classify — classify as held-for-sale
discontinuedOpsRouter.post('/classify', validateBody(classifyHeldForSaleSchema), async (req: Request, res: Response) => {
  try {
    const result = await classifyAsHeldForSale(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/discontinued-ops/:id/declassify — remove held-for-sale status
discontinuedOpsRouter.post('/:id/declassify', async (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId as string;
    if (!entityId) return res.status(400).json({ error: 'Required: entityId query param' });
    await declassifyHeldForSale(req.params.id as string, entityId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/discontinued-ops/:id/dispose — record disposal
discontinuedOpsRouter.post('/:id/dispose', validateBody(recordDisposalSchema), async (req: Request, res: Response) => {
  try {
    const result = await recordDisposal(
      req.params.id as string,
      req.body.entityId,
      req.body.disposalDate,
      req.body.proceedsAmount,
      req.body.periodId,
      req.body.currency,
      req.body.fundId,
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/discontinued-ops/pnl — P&L with continuing vs discontinued split
discontinuedOpsRouter.get('/pnl', async (req: Request, res: Response) => {
  try {
    const { entityId, periodId, fundId } = req.query;
    if (!entityId || !periodId) return res.status(400).json({ error: 'Required: entityId, periodId' });
    const result = await getDiscontinuedOpsPnL(entityId as string, periodId as string, fundId as string | undefined);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/discontinued-ops/initiatives — list held-for-sale initiatives
discontinuedOpsRouter.get('/initiatives', async (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId as string;
    if (!entityId) return res.status(400).json({ error: 'Required: entityId' });
    const result = await listHeldForSaleInitiatives(entityId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
