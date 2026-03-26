import { Router, Request, Response } from 'express';
import {
  createRevenueContract,
  getRevenueContract,
  listRevenueContracts,
  activateContract,
  completeContract,
  createPerformanceObligation,
  getPerformanceObligation,
  listPerformanceObligations,
  allocateTransactionPrice,
  createVariableConsideration,
  getVariableConsideration,
  listVariableConsiderations,
  resolveVariableConsideration,
  recognizePointInTime,
  recognizeOverTime,
  getContractSummary,
} from '../../services/gl/revenue-recognition-service.js';

export const revenueRouter = Router();

// --- Revenue Contracts ---

revenueRouter.post('/contracts', async (req: Request, res: Response) => {
  try {
    const id = await createRevenueContract(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

revenueRouter.get('/contracts/:id', async (req: Request, res: Response) => {
  try {
    const rc = await getRevenueContract(req.params.id as string);
    if (!rc) return res.status(404).json({ error: 'Contract not found' });
    res.json(rc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

revenueRouter.get('/contracts/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const contracts = await listRevenueContracts(req.params.entityId as string, status as any);
    res.json(contracts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

revenueRouter.post('/contracts/:id/activate', async (req: Request, res: Response) => {
  try {
    const result = await activateContract(req.params.id as string);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

revenueRouter.post('/contracts/:id/complete', async (req: Request, res: Response) => {
  try {
    const result = await completeContract(req.params.id as string);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

revenueRouter.get('/contracts/:id/summary', async (req: Request, res: Response) => {
  try {
    const summary = await getContractSummary(req.params.id as string);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Performance Obligations ---

revenueRouter.post('/obligations', async (req: Request, res: Response) => {
  try {
    const id = await createPerformanceObligation(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

revenueRouter.get('/obligations/:id', async (req: Request, res: Response) => {
  try {
    const po = await getPerformanceObligation(req.params.id as string);
    if (!po) return res.status(404).json({ error: 'PerformanceObligation not found' });
    res.json(po);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

revenueRouter.get('/obligations/by-contract/:contractId', async (req: Request, res: Response) => {
  try {
    const pos = await listPerformanceObligations(req.params.contractId as string);
    res.json(pos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Allocation ---

revenueRouter.post('/contracts/:id/allocate', async (req: Request, res: Response) => {
  try {
    const result = await allocateTransactionPrice(req.params.id as string);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Variable Consideration ---

revenueRouter.post('/variable-consideration', async (req: Request, res: Response) => {
  try {
    const id = await createVariableConsideration(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

revenueRouter.get('/variable-consideration/:id', async (req: Request, res: Response) => {
  try {
    const vc = await getVariableConsideration(req.params.id as string);
    if (!vc) return res.status(404).json({ error: 'VariableConsideration not found' });
    res.json(vc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

revenueRouter.get('/variable-consideration/by-contract/:contractId', async (req: Request, res: Response) => {
  try {
    const vcs = await listVariableConsiderations(req.params.contractId as string);
    res.json(vcs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

revenueRouter.post('/variable-consideration/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { resolvedAmount } = req.body;
    if (resolvedAmount === undefined) return res.status(400).json({ error: 'resolvedAmount required' });
    const result = await resolveVariableConsideration(req.params.id as string, resolvedAmount);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Revenue Recognition ---

revenueRouter.post('/recognize/point-in-time', async (req: Request, res: Response) => {
  try {
    const { poId, periodId, satisfiedDate } = req.body;
    if (!poId || !periodId || !satisfiedDate) {
      return res.status(400).json({ error: 'poId, periodId, satisfiedDate required' });
    }
    const result = await recognizePointInTime(poId, periodId, satisfiedDate);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

revenueRouter.post('/recognize/over-time', async (req: Request, res: Response) => {
  try {
    const { poId, periodId, progressPct, validDate } = req.body;
    if (!poId || !periodId || progressPct === undefined || !validDate) {
      return res.status(400).json({ error: 'poId, periodId, progressPct, validDate required' });
    }
    const result = await recognizeOverTime(poId, periodId, progressPct, validDate);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
