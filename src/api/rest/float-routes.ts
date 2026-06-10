import { Router, Request, Response, NextFunction } from 'express';
import {
  syncFloatTransactions,
  syncFloatBills,
  syncFloatReimbursements,
  runFullFloatSync,
} from '../../services/float/float-sync-service.js';
import {
  pushGlCodesToFloat,
  pushVendorsToFloat,
} from '../../services/float/float-push-service.js';
import {
  listMappings,
  listSyncRuns,
  getSyncState,
  type SyncType,
} from '../../services/float/float-mapping-service.js';
import {
  validateBody,
  floatSyncSchema,
  floatFullSyncSchema,
  floatPushSchema,
} from './validation.js';

export const floatRouter = Router();

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// --- Inbound sync ---

floatRouter.post('/sync/transactions', validateBody(floatSyncSchema), wrap(async (req, res) => {
  const { entityId, periodId, fromDate, toDate } = req.body;
  const result = await syncFloatTransactions(entityId, periodId, { fromDate, toDate });
  res.json(result);
}));

floatRouter.post('/sync/bills', validateBody(floatSyncSchema), wrap(async (req, res) => {
  const { entityId, periodId, fromDate, toDate } = req.body;
  const result = await syncFloatBills(entityId, periodId, { fromDate, toDate });
  res.json(result);
}));

floatRouter.post('/sync/reimbursements', validateBody(floatSyncSchema), wrap(async (req, res) => {
  const { entityId, periodId, fromDate, toDate } = req.body;
  const result = await syncFloatReimbursements(entityId, periodId, { fromDate, toDate });
  res.json(result);
}));

floatRouter.post('/sync/full', validateBody(floatFullSyncSchema), wrap(async (req, res) => {
  const { entityId, periodId } = req.body;
  const results = await runFullFloatSync(entityId, periodId);
  res.json({ results });
}));

// --- Outbound push ---

floatRouter.post('/push/gl-codes', validateBody(floatPushSchema), wrap(async (req, res) => {
  const result = await pushGlCodesToFloat(req.body.entityId);
  res.json(result);
}));

floatRouter.post('/push/vendors', validateBody(floatPushSchema), wrap(async (req, res) => {
  const result = await pushVendorsToFloat(req.body.entityId);
  res.json(result);
}));

// --- Status & audit ---

floatRouter.get('/sync/status/:entityId', wrap(async (req, res) => {
  const entityId = req.params.entityId as string;
  const syncTypes: SyncType[] = ['TRANSACTIONS', 'BILLS', 'REIMBURSEMENTS', 'GL_CODES', 'VENDORS', 'TAX_CODES'];
  const states = await Promise.all(
    syncTypes.map(async (st) => ({ syncType: st, ...(await getSyncState(entityId, st)) })),
  );
  res.json({ entityId, syncStates: states.filter((s) => s.last_synced_at !== undefined) });
}));

floatRouter.get('/sync/runs/:entityId', wrap(async (req, res) => {
  const entityId = req.params.entityId as string;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const runs = await listSyncRuns(entityId, limit);
  res.json({ entityId, runs });
}));

floatRouter.get('/mappings/:entityId', wrap(async (req, res) => {
  const entityId = req.params.entityId as string;
  const floatType = req.query.type as string | undefined;
  const mappings = await listMappings(entityId, floatType as any);
  res.json({ entityId, mappings });
}));
