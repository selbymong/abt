import { Router, Request, Response, NextFunction } from 'express';
import {
  recordAuditEntry,
  getAuditEntry,
  getNodeHistory,
  getEntityAuditLog,
  getUserAuditLog,
  getAuditStats,
} from '../../services/audit/audit-trail-service.js';

export const auditTrailRouter = Router();

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// POST /api/audit — record an audit entry
auditTrailRouter.post('/', wrap(async (req, res) => {
  const entry = await recordAuditEntry(req.body);
  res.status(201).json(entry);
}));

// GET /api/audit/:id — get a single audit entry
auditTrailRouter.get('/:id', wrap(async (req, res) => {
  const entry = await getAuditEntry(req.params.id as string);
  if (!entry) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(entry);
}));

// GET /api/audit/node/:nodeId — get audit history for a node
auditTrailRouter.get('/node/:nodeId', wrap(async (req, res) => {
  const limit = Number(req.query.limit ?? 50);
  const offset = Number(req.query.offset ?? 0);
  const entries = await getNodeHistory(req.params.nodeId as string, limit, offset);
  res.json({ entries });
}));

// GET /api/audit/entity/:entityId — get entity audit log with filters
auditTrailRouter.get('/entity/:entityId', wrap(async (req, res) => {
  const entries = await getEntityAuditLog(req.params.entityId as string, {
    action: req.query.action as any,
    nodeType: req.query.nodeType as string | undefined,
    userId: req.query.userId as string | undefined,
    startDate: req.query.startDate as string | undefined,
    endDate: req.query.endDate as string | undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    offset: req.query.offset ? Number(req.query.offset) : undefined,
  });
  res.json({ entries });
}));

// GET /api/audit/user/:userId — get user's audit trail
auditTrailRouter.get('/user/:userId', wrap(async (req, res) => {
  const limit = Number(req.query.limit ?? 50);
  const offset = Number(req.query.offset ?? 0);
  const entries = await getUserAuditLog(req.params.userId as string, limit, offset);
  res.json({ entries });
}));

// GET /api/audit/stats/:entityId — get audit statistics
auditTrailRouter.get('/stats/:entityId', wrap(async (req, res) => {
  const stats = await getAuditStats(
    req.params.entityId as string,
    req.query.startDate as string | undefined,
    req.query.endDate as string | undefined,
  );
  res.json(stats);
}));
