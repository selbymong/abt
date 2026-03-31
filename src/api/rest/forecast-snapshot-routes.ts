import { Router, Request, Response, NextFunction } from 'express';
import {
  createForecastSnapshot,
  listForecastSnapshots,
  getForecastSnapshot,
  deleteForecastSnapshot,
  getForecastVsActualReport,
} from '../../services/gl/forecast-snapshot-service.js';
import { validateBody, createForecastSnapshotSchema } from './validation.js';

export const forecastSnapshotRouter = Router();

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// Create snapshot
forecastSnapshotRouter.post('/', validateBody(createForecastSnapshotSchema), wrap(async (req, res) => {
  const id = await createForecastSnapshot(req.body);
  const data = await getForecastSnapshot(id);
  res.status(201).json(data);
}));

// List snapshots for entity
forecastSnapshotRouter.get('/by-entity/:entityId', wrap(async (req, res) => {
  const budgetId = req.query.budgetId as string | undefined;
  const fiscalYear = req.query.fiscalYear ? Number(req.query.fiscalYear) : undefined;
  const snapshots = await listForecastSnapshots(
    req.params.entityId as string, budgetId, fiscalYear,
  );
  res.json({ snapshots });
}));

// Get snapshot with lines
forecastSnapshotRouter.get('/:id', wrap(async (req, res) => {
  const data = await getForecastSnapshot(req.params.id as string);
  if (!data) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(data);
}));

// Delete snapshot
forecastSnapshotRouter.delete('/:id', wrap(async (req, res) => {
  await deleteForecastSnapshot(req.params.id as string);
  res.json({ status: 'deleted' });
}));

// Forecast vs actual report
forecastSnapshotRouter.get('/:id/vs-actual', wrap(async (req, res) => {
  const periodIds = req.query.periodIds
    ? (req.query.periodIds as string).split(',')
    : undefined;
  const report = await getForecastVsActualReport(req.params.id as string, periodIds);
  res.json(report);
}));
