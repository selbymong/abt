import { Router, Request, Response } from 'express';
import {
  validateBody, createFixedAssetSchema, disposeFixedAssetSchema,
  createBelongsToSchema, createUCCPoolSchema, calculateCCASchema,
  depreciateAssetSchema, depreciateAllAssetsSchema,
} from './validation.js';
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

depreciationRouter.post('/fixed-assets', validateBody(createFixedAssetSchema), async (req: Request, res: Response) => {
  try {
    const id = await createFixedAsset(req.body);
    res.status(201).json({ id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

depreciationRouter.get('/fixed-assets/:id', async (req: Request, res: Response) => {
  try {
    const asset = await getFixedAsset(req.params.id as string);
    if (!asset) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(asset);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

depreciationRouter.get('/fixed-assets/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const assets = await listFixedAssets(req.params.entityId as string);
    res.json({ assets });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

depreciationRouter.patch('/fixed-assets/:id', async (req: Request, res: Response) => {
  try {
    const updated = await updateFixedAsset(req.params.id as string, req.body);
    if (!updated) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

depreciationRouter.post('/fixed-assets/:id/dispose', validateBody(disposeFixedAssetSchema), async (req: Request, res: Response) => {
  try {
    const { disposalDate, proceedsAmount } = req.body;
    const result = await disposeFixedAsset(req.params.id as string, disposalDate, proceedsAmount);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- AssetClass lookups ---

depreciationRouter.get('/asset-classes', async (req: Request, res: Response) => {
  try {
    const classSystem = req.query.classSystem as string | undefined;
    const jurisdiction = req.query.jurisdiction as string | undefined;
    const classes = await listAssetClasses(classSystem as any, jurisdiction);
    res.json({ assetClasses: classes });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

depreciationRouter.get('/asset-classes/by-code/:code', async (req: Request, res: Response) => {
  try {
    const ac = await getAssetClassByCode(req.params.code as string);
    if (!ac) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(ac);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- BELONGS_TO edges ---

depreciationRouter.post('/fixed-assets/:id/belongs-to', validateBody(createBelongsToSchema), async (req: Request, res: Response) => {
  try {
    await createBelongsToEdge({
      fixedAssetId: req.params.id as string,
      ...req.body,
    });
    res.status(201).json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

depreciationRouter.get('/fixed-assets/:id/asset-classes', async (req: Request, res: Response) => {
  try {
    const classes = await getAssetClassesForAsset(req.params.id as string);
    res.json({ assetClasses: classes });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- UCCPool ---

depreciationRouter.post('/ucc-pools', validateBody(createUCCPoolSchema), async (req: Request, res: Response) => {
  try {
    const id = await createUCCPool(req.body);
    res.status(201).json({ id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

depreciationRouter.get('/ucc-pools/:id', async (req: Request, res: Response) => {
  try {
    const pool = await getUCCPool(req.params.id as string);
    if (!pool) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(pool);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

depreciationRouter.get('/ucc-pools/by-class', async (req: Request, res: Response) => {
  try {
    const { entityId, assetClassId, fiscalYear } = req.query;
    const pool = await getUCCPoolForClass(
      entityId as string, assetClassId as string, fiscalYear as string,
    );
    if (!pool) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(pool);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

depreciationRouter.post('/ucc-pools/:id/calculate-cca', validateBody(calculateCCASchema), async (req: Request, res: Response) => {
  try {
    const { claimAmount } = req.body;
    const result = await calculateCCA(req.params.id as string, claimAmount);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Depreciation Engine ---

depreciationRouter.post('/depreciate/:fixedAssetId', validateBody(depreciateAssetSchema), async (req: Request, res: Response) => {
  try {
    const { periodId } = req.body;
    const result = await depreciateAsset(req.params.fixedAssetId as string, periodId);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

depreciationRouter.post('/depreciate-all', validateBody(depreciateAllAssetsSchema), async (req: Request, res: Response) => {
  try {
    const { entityId, periodId } = req.body;
    const result = await depreciateAllAssets(entityId, periodId);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

depreciationRouter.get('/depreciation-schedule/:fixedAssetId', async (req: Request, res: Response) => {
  try {
    const schedule = await getDepreciationSchedule(req.params.fixedAssetId as string);
    if (!schedule) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(schedule);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
