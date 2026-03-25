import { Router, Request, Response } from 'express';
import {
  createFixedAsset,
  getFixedAsset,
  listFixedAssets,
  updateFixedAsset,
  disposeFixedAsset,
  listAssetClasses,
  getAssetClassByCode,
  createBelongsToEdge,
  getAssetClassesForAsset,
  createUCCPool,
  getUCCPool,
  getUCCPoolForClass,
  calculateCCA,
} from '../../services/depreciation/fixed-asset-service.js';
import {
  depreciateAsset,
  depreciateAllAssets,
  getDepreciationSchedule,
} from '../../services/depreciation/depreciation-engine.js';

export const depreciationRouter = Router();

// --- FixedAsset CRUD ---

depreciationRouter.post('/fixed-assets', async (req: Request, res: Response) => {
  const id = await createFixedAsset(req.body);
  res.status(201).json({ id });
});

depreciationRouter.get('/fixed-assets/:id', async (req: Request, res: Response) => {
  const asset = await getFixedAsset(req.params.id as string);
  if (!asset) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(asset);
});

depreciationRouter.get('/fixed-assets/by-entity/:entityId', async (req: Request, res: Response) => {
  const assets = await listFixedAssets(req.params.entityId as string);
  res.json({ assets });
});

depreciationRouter.patch('/fixed-assets/:id', async (req: Request, res: Response) => {
  const updated = await updateFixedAsset(req.params.id as string, req.body);
  if (!updated) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ success: true });
});

depreciationRouter.post('/fixed-assets/:id/dispose', async (req: Request, res: Response) => {
  const { disposalDate, proceedsAmount } = req.body;
  const result = await disposeFixedAsset(req.params.id as string, disposalDate, proceedsAmount);
  res.json(result);
});

// --- AssetClass lookups ---

depreciationRouter.get('/asset-classes', async (req: Request, res: Response) => {
  const classSystem = req.query.classSystem as string | undefined;
  const jurisdiction = req.query.jurisdiction as string | undefined;
  const classes = await listAssetClasses(classSystem as any, jurisdiction);
  res.json({ assetClasses: classes });
});

depreciationRouter.get('/asset-classes/by-code/:code', async (req: Request, res: Response) => {
  const ac = await getAssetClassByCode(req.params.code as string);
  if (!ac) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(ac);
});

// --- BELONGS_TO edges ---

depreciationRouter.post('/fixed-assets/:id/belongs-to', async (req: Request, res: Response) => {
  await createBelongsToEdge({
    fixedAssetId: req.params.id as string,
    ...req.body,
  });
  res.status(201).json({ success: true });
});

depreciationRouter.get('/fixed-assets/:id/asset-classes', async (req: Request, res: Response) => {
  const classes = await getAssetClassesForAsset(req.params.id as string);
  res.json({ assetClasses: classes });
});

// --- UCCPool ---

depreciationRouter.post('/ucc-pools', async (req: Request, res: Response) => {
  const id = await createUCCPool(req.body);
  res.status(201).json({ id });
});

depreciationRouter.get('/ucc-pools/:id', async (req: Request, res: Response) => {
  const pool = await getUCCPool(req.params.id as string);
  if (!pool) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(pool);
});

depreciationRouter.get('/ucc-pools/by-class', async (req: Request, res: Response) => {
  const { entityId, assetClassId, fiscalYear } = req.query;
  const pool = await getUCCPoolForClass(
    entityId as string, assetClassId as string, fiscalYear as string,
  );
  if (!pool) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(pool);
});

depreciationRouter.post('/ucc-pools/:id/calculate-cca', async (req: Request, res: Response) => {
  const { claimAmount } = req.body;
  const result = await calculateCCA(req.params.id as string, claimAmount);
  res.json(result);
});

// --- Depreciation Engine ---

depreciationRouter.post('/depreciate/:fixedAssetId', async (req: Request, res: Response) => {
  const { periodId } = req.body;
  if (!periodId) { res.status(400).json({ error: 'Required: periodId' }); return; }
  const result = await depreciateAsset(req.params.fixedAssetId as string, periodId);
  res.json(result);
});

depreciationRouter.post('/depreciate-all', async (req: Request, res: Response) => {
  const { entityId, periodId } = req.body;
  if (!entityId || !periodId) {
    res.status(400).json({ error: 'Required: entityId, periodId' }); return;
  }
  const result = await depreciateAllAssets(entityId, periodId);
  res.json(result);
});

depreciationRouter.get('/depreciation-schedule/:fixedAssetId', async (req: Request, res: Response) => {
  const schedule = await getDepreciationSchedule(req.params.fixedAssetId as string);
  if (!schedule) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(schedule);
});
