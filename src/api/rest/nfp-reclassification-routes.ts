import { Router, Request, Response, NextFunction } from 'express';
import {
  scanExpiredRestrictions,
  reclassifyFund,
  autoReclassifyExpired,
  fulfillPurposeRestriction,
  getReclassificationHistory,
  getFundRestrictionSummary,
} from '../../services/gl/nfp-reclassification-service.js';
import {
  validateBody,
  reclassifyFundSchema,
  autoReclassifySchema,
  fulfillPurposeSchema,
} from './validation.js';

export const nfpReclassificationRouter = Router();

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// Scan for expired restrictions
nfpReclassificationRouter.get('/expired/:entityId', wrap(async (req, res) => {
  const entityId = req.params.entityId as string;
  const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().slice(0, 10);
  const result = await scanExpiredRestrictions(entityId, asOfDate);
  res.json(result);
}));

// Reclassify a fund
nfpReclassificationRouter.post('/reclassify', validateBody(reclassifyFundSchema), wrap(async (req, res) => {
  const result = await reclassifyFund(req.body);
  res.status(201).json(result);
}));

// Auto-reclassify all expired restrictions
nfpReclassificationRouter.post('/auto-reclassify', validateBody(autoReclassifySchema), wrap(async (req, res) => {
  const { entityId, periodId, currency, asOfDate, approvedBy } = req.body;
  const results = await autoReclassifyExpired(entityId, periodId, currency, asOfDate, approvedBy);
  res.status(201).json(results);
}));

// Fulfill a purpose restriction
nfpReclassificationRouter.post('/fulfill-purpose', validateBody(fulfillPurposeSchema), wrap(async (req, res) => {
  const { fundId, entityId, periodId, currency, amount, fulfillmentDate, fulfillmentDescription, approvedBy } = req.body;
  const result = await fulfillPurposeRestriction(
    fundId, entityId, periodId, currency, amount, fulfillmentDate, fulfillmentDescription, approvedBy,
  );
  res.status(201).json(result);
}));

// Get reclassification history
nfpReclassificationRouter.get('/history/:entityId', wrap(async (req, res) => {
  const entityId = req.params.entityId as string;
  const fundId = req.query.fundId as string | undefined;
  const result = await getReclassificationHistory(entityId, fundId);
  res.json(result);
}));

// Get fund restriction summary
nfpReclassificationRouter.get('/summary/:entityId', wrap(async (req, res) => {
  const entityId = req.params.entityId as string;
  const periodId = req.query.periodId as string | undefined;
  const result = await getFundRestrictionSummary(entityId, periodId);
  res.json(result);
}));
