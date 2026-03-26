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
import {
  computeCRACorporate,
  computeGSTHST,
  computeIRSCorporate,
  computeCRACharity,
  computeIRSExempt,
  computeStateTax,
  computeWithholdingTax,
  getTaxModuleResults,
  getTaxModuleResult,
  computeAllModules,
} from '../../services/tax/tax-modules-service.js';

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

// --- Tax Modules ---

taxRouter.post('/modules/cra-corporate', async (req: Request, res: Response) => {
  try {
    const result = await computeCRACorporate(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.post('/modules/gst-hst', async (req: Request, res: Response) => {
  try {
    const result = await computeGSTHST(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.post('/modules/irs-corporate', async (req: Request, res: Response) => {
  try {
    const result = await computeIRSCorporate(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.post('/modules/cra-charity', async (req: Request, res: Response) => {
  try {
    const result = await computeCRACharity(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.post('/modules/irs-exempt', async (req: Request, res: Response) => {
  try {
    const result = await computeIRSExempt(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.post('/modules/state-tax', async (req: Request, res: Response) => {
  try {
    const result = await computeStateTax(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.post('/modules/withholding', async (req: Request, res: Response) => {
  try {
    const result = await computeWithholdingTax(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.post('/modules/compute-all', async (req: Request, res: Response) => {
  try {
    const { entityId, periodId } = req.body;
    const results = await computeAllModules(entityId, periodId);
    res.status(201).json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/modules/results/:entityId', async (req: Request, res: Response) => {
  try {
    const periodId = req.query.periodId as string | undefined;
    const results = await getTaxModuleResults(req.params.entityId as string, periodId);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/modules/result/:id', async (req: Request, res: Response) => {
  try {
    const result = await getTaxModuleResult(req.params.id as string);
    if (!result) return res.status(404).json({ error: 'TaxModuleResult not found' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
