import { Router, Request, Response, NextFunction } from 'express';
import {
  setFXRate, setFXRatesBatch, getFXRate, listFXRates,
  convertCurrency, performRevaluation, getRevaluationHistory,
} from '../../services/gl/multi-currency-service.js';
import {
  validateBody,
  setFXRateSchema, setFXRatesBatchSchema, convertCurrencySchema, performRevaluationSchema,
} from './validation.js';

export const multiCurrencyRouter = Router();

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// --- FX Rates ---
multiCurrencyRouter.post('/rates', validateBody(setFXRateSchema), wrap(async (req, res) => {
  const id = await setFXRate(req.body);
  res.status(201).json({ id });
}));

multiCurrencyRouter.post('/rates/batch', validateBody(setFXRatesBatchSchema), wrap(async (req, res) => {
  const count = await setFXRatesBatch(req.body.rates);
  res.json({ imported: count });
}));

multiCurrencyRouter.get('/rates', wrap(async (req, res) => {
  const rates = await listFXRates(
    req.query.fromCurrency as string | undefined,
    req.query.toCurrency as string | undefined,
    req.query.startDate as string | undefined,
    req.query.endDate as string | undefined,
  );
  res.json({ rates });
}));

multiCurrencyRouter.get('/rates/:from/:to/:date', wrap(async (req, res) => {
  const rate = await getFXRate(
    req.params.from as string,
    req.params.to as string,
    req.params.date as string,
  );
  if (!rate) { res.status(404).json({ error: 'Rate not found' }); return; }
  res.json(rate);
}));

// --- Conversion ---
multiCurrencyRouter.post('/convert', validateBody(convertCurrencySchema), wrap(async (req, res) => {
  const result = await convertCurrency(
    req.body.fromCurrency,
    req.body.toCurrency,
    req.body.amount,
    req.body.rateDate,
  );
  res.json(result);
}));

// --- Revaluation ---
multiCurrencyRouter.post('/revaluation', validateBody(performRevaluationSchema), wrap(async (req, res) => {
  const report = await performRevaluation(
    req.body.entityId,
    req.body.periodId,
    req.body.functionalCurrency,
    req.body.asOfDate,
  );
  res.json(report);
}));

multiCurrencyRouter.get('/revaluation/history/:entityId', wrap(async (req, res) => {
  const history = await getRevaluationHistory(req.params.entityId as string);
  res.json({ runs: history });
}));
