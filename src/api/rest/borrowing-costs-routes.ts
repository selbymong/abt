import { Router, Request, Response } from 'express';
import {
  designateQualifyingAsset,
  suspendCapitalization,
  resumeCapitalization,
  ceaseCapitalization,
  capitalizeBorrowingCosts,
  listQualifyingAssets,
  getQualifyingAsset,
} from '../../services/gl/borrowing-costs-service.js';
import {
  validateBody,
  designateQualifyingAssetSchema,
  capitalizeBorrowingCostsSchema,
  ceaseCapitalizationSchema,
} from './validation.js';

export const borrowingCostsRouter = Router();

// POST /api/borrowing-costs/designate — designate qualifying asset
borrowingCostsRouter.post('/designate', validateBody(designateQualifyingAssetSchema), async (req: Request, res: Response) => {
  try {
    await designateQualifyingAsset(req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/borrowing-costs/capitalize — capitalize borrowing costs for a period
borrowingCostsRouter.post('/capitalize', validateBody(capitalizeBorrowingCostsSchema), async (req: Request, res: Response) => {
  try {
    const result = await capitalizeBorrowingCosts(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/borrowing-costs/:id/suspend — suspend capitalization
borrowingCostsRouter.post('/:id/suspend', async (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId as string;
    if (!entityId) return res.status(400).json({ error: 'Required: entityId query param' });
    await suspendCapitalization(req.params.id as string, entityId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/borrowing-costs/:id/resume — resume capitalization
borrowingCostsRouter.post('/:id/resume', async (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId as string;
    if (!entityId) return res.status(400).json({ error: 'Required: entityId query param' });
    await resumeCapitalization(req.params.id as string, entityId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/borrowing-costs/:id/cease — cease capitalization
borrowingCostsRouter.post('/:id/cease', validateBody(ceaseCapitalizationSchema), async (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId as string;
    if (!entityId) return res.status(400).json({ error: 'Required: entityId query param' });
    await ceaseCapitalization(req.params.id as string, entityId, req.body.cessationDate);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/borrowing-costs/qualifying-assets — list qualifying assets
borrowingCostsRouter.get('/qualifying-assets', async (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId as string;
    if (!entityId) return res.status(400).json({ error: 'Required: entityId' });
    const status = req.query.status as string | undefined;
    const assets = await listQualifyingAssets(entityId, status as any);
    res.json(assets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/borrowing-costs/qualifying-assets/:id — get single qualifying asset
borrowingCostsRouter.get('/qualifying-assets/:id', async (req: Request, res: Response) => {
  try {
    const asset = await getQualifyingAsset(req.params.id as string);
    if (!asset) return res.status(404).json({ error: 'Qualifying asset not found' });
    res.json(asset);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
