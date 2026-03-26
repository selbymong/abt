import { Router, Request, Response } from 'express';
import {
  getTemporaryDifferences,
  computeDeferredTax,
  getDeferredTaxPositions,
  computeCurrentTax,
  createTaxProvision,
  getTaxProvision,
  listTaxProvisions,
  approveTaxProvision,
  postTaxProvision,
  getApplicableTaxRate,
  getDeferredTaxSummary,
} from '../../services/tax/tax-engine-service.js';

export const taxRouter = Router();

// --- Temporary Differences ---

taxRouter.get('/temporary-differences/:entityId', async (req: Request, res: Response) => {
  try {
    const diffs = await getTemporaryDifferences(req.params.entityId as string);
    res.json(diffs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Deferred Tax ---

taxRouter.post('/deferred-tax', async (req: Request, res: Response) => {
  try {
    const result = await computeDeferredTax(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/deferred-tax/:entityId/:periodId', async (req: Request, res: Response) => {
  try {
    const positions = await getDeferredTaxPositions(
      req.params.entityId as string,
      req.params.periodId as string,
    );
    res.json(positions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/deferred-tax-summary/:entityId', async (req: Request, res: Response) => {
  try {
    const summary = await getDeferredTaxSummary(req.params.entityId as string);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Current Tax ---

taxRouter.post('/current-tax', async (req: Request, res: Response) => {
  try {
    const result = await computeCurrentTax(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Tax Rate ---

taxRouter.get('/tax-rate/:entityId', async (req: Request, res: Response) => {
  try {
    const rate = await getApplicableTaxRate(req.params.entityId as string);
    res.json(rate);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Tax Provision ---

taxRouter.post('/provisions', async (req: Request, res: Response) => {
  try {
    const result = await createTaxProvision(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/provisions/:id', async (req: Request, res: Response) => {
  try {
    const provision = await getTaxProvision(req.params.id as string);
    if (!provision) return res.status(404).json({ error: 'TaxProvision not found' });
    res.json(provision);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/provisions/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const provisions = await listTaxProvisions(req.params.entityId as string);
    res.json(provisions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.post('/provisions/:id/approve', async (req: Request, res: Response) => {
  try {
    const result = await approveTaxProvision(req.params.id as string);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

taxRouter.post('/provisions/:id/post', async (req: Request, res: Response) => {
  try {
    const { journalEntryId } = req.body;
    if (!journalEntryId) return res.status(400).json({ error: 'journalEntryId required' });
    const result = await postTaxProvision(req.params.id as string, journalEntryId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
