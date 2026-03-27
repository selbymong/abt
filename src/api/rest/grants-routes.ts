import { Router, Request, Response } from 'express';
import {
  createGrant,
  getGrant,
  listGrants,
  recognizeGrantIncome,
  markConditionMet,
  assessClawback,
} from '../../services/gl/government-grants-service.js';
import {
  validateBody,
  createGrantSchema,
  recognizeGrantSchema,
  assessClawbackSchema,
} from './validation.js';

export const grantsRouter = Router();

// POST /api/grants — create a government grant
grantsRouter.post('/', validateBody(createGrantSchema), async (req: Request, res: Response) => {
  try {
    const id = await createGrant(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/grants/:id — get a grant
grantsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const grant = await getGrant(req.params.id as string);
    if (!grant) return res.status(404).json({ error: 'Grant not found' });
    res.json(grant);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/grants?entityId=...&status=... — list grants
grantsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId as string;
    if (!entityId) return res.status(400).json({ error: 'Required: entityId' });
    const status = req.query.status as string | undefined;
    const grants = await listGrants(entityId, status);
    res.json(grants);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/grants/:id/recognize — recognize grant income for a period
grantsRouter.post('/:id/recognize', validateBody(recognizeGrantSchema), async (req: Request, res: Response) => {
  try {
    const result = await recognizeGrantIncome(req.params.id as string, req.body.periodId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/grants/:id/condition-met — mark condition as satisfied
grantsRouter.post('/:id/condition-met', async (req: Request, res: Response) => {
  try {
    await markConditionMet(req.params.id as string);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/grants/:id/clawback — assess clawback risk
grantsRouter.post('/:id/clawback', validateBody(assessClawbackSchema), async (req: Request, res: Response) => {
  try {
    const result = await assessClawback(req.params.id as string, req.body.probability, req.body.amount);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
