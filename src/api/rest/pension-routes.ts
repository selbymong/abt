import { Router, Request, Response, NextFunction } from 'express';
import {
  createPensionPlan,
  getPensionPlan,
  listPensionPlans,
  processPensionPeriod,
  updateActuarialAssumptions,
  getPensionSummary,
} from '../../services/gl/pension-service.js';
import {
  validateBody,
  createPensionPlanSchema,
  processPensionPeriodSchema,
  updateActuarialAssumptionsSchema,
} from './validation.js';

export const pensionRouter = Router();

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// Create pension plan
pensionRouter.post('/', validateBody(createPensionPlanSchema), wrap(async (req, res) => {
  const id = await createPensionPlan(req.body);
  res.status(201).json({ id });
}));

// Get pension plan
pensionRouter.get('/:id', wrap(async (req, res) => {
  const plan = await getPensionPlan(req.params.id as string);
  if (!plan) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(plan);
}));

// List pension plans by entity
pensionRouter.get('/by-entity/:entityId', wrap(async (req, res) => {
  const plans = await listPensionPlans(req.params.entityId as string);
  res.json({ plans });
}));

// Process pension for a period
pensionRouter.post('/process-period', validateBody(processPensionPeriodSchema), wrap(async (req, res) => {
  const result = await processPensionPeriod(req.body);
  res.status(201).json(result);
}));

// Update actuarial assumptions
pensionRouter.patch('/:id/assumptions', validateBody(updateActuarialAssumptionsSchema), wrap(async (req, res) => {
  const plan = await updateActuarialAssumptions(req.params.id as string, req.body);
  res.json(plan);
}));

// Get pension summary for entity
pensionRouter.get('/summary/:entityId', wrap(async (req, res) => {
  const summary = await getPensionSummary(req.params.entityId as string);
  res.json(summary);
}));
