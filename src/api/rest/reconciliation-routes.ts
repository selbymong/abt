import { Router, Request, Response } from 'express';
import {
  runReconciliation,
  getReconciliationRun,
  listReconciliationRuns,
  getLatestReconciliationRun,
} from '../../services/reconciliation/nightly-reconciliation-service.js';
import { validateBody, runReconciliationSchema } from './validation.js';

export const reconciliationRouter = Router();

// POST /api/reconciliation/run — trigger a reconciliation run
reconciliationRouter.post('/run', validateBody(runReconciliationSchema), async (req: Request, res: Response) => {
  try {
    const result = await runReconciliation(req.body);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reconciliation/runs — list past runs
reconciliationRouter.get('/runs', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const entityId = req.query.entityId as string | undefined;
    const runs = await listReconciliationRuns(limit, entityId);
    res.json(runs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reconciliation/runs/latest — get latest run
reconciliationRouter.get('/runs/latest', async (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId as string | undefined;
    const run = await getLatestReconciliationRun(entityId);
    if (!run) return res.status(404).json({ error: 'No reconciliation runs found' });
    res.json(run);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reconciliation/runs/:id — get a specific run
reconciliationRouter.get('/runs/:id', async (req: Request, res: Response) => {
  try {
    const run = await getReconciliationRun(req.params.id as string);
    if (!run) return res.status(404).json({ error: 'Reconciliation run not found' });
    res.json(run);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
