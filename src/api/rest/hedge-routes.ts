import { Router, Request, Response } from 'express';
import {
  createFinancialInstrument,
  getFinancialInstrument,
  listFinancialInstruments,
  updateFairValue,
  createHedgeRelationship,
  getHedgeRelationship,
  listHedgeRelationships,
  runProspectiveTest,
  runRetrospectiveTest,
  processFairValueHedge,
  processCashFlowHedge,
  processNetInvestmentHedge,
  dedesignateHedge,
  recycleOciToP_L,
  getHedgeAccountingSummary,
} from '../../services/gl/hedge-accounting-service.js';

export const hedgeRouter = Router();

// --- Financial Instruments ---

hedgeRouter.post('/instruments', async (req: Request, res: Response) => {
  try {
    const id = await createFinancialInstrument(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

hedgeRouter.get('/instruments/:id', async (req: Request, res: Response) => {
  try {
    const fi = await getFinancialInstrument(req.params.id as string);
    if (!fi) return res.status(404).json({ error: 'FinancialInstrument not found' });
    res.json(fi);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

hedgeRouter.get('/instruments/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const instrumentType = req.query.instrumentType as string | undefined;
    const instruments = await listFinancialInstruments(
      req.params.entityId as string, instrumentType as any,
    );
    res.json(instruments);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

hedgeRouter.post('/instruments/:id/fair-value', async (req: Request, res: Response) => {
  try {
    const result = await updateFairValue(req.params.id as string, req.body.fairValue);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Hedge Relationships ---

hedgeRouter.post('/hedges', async (req: Request, res: Response) => {
  try {
    const id = await createHedgeRelationship(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

hedgeRouter.get('/hedges/:id', async (req: Request, res: Response) => {
  try {
    const hr = await getHedgeRelationship(req.params.id as string);
    if (!hr) return res.status(404).json({ error: 'HedgeRelationship not found' });
    res.json(hr);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

hedgeRouter.get('/hedges/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const hedgeType = req.query.hedgeType as string | undefined;
    const hedges = await listHedgeRelationships(
      req.params.entityId as string, hedgeType as any,
    );
    res.json(hedges);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Effectiveness Testing ---

hedgeRouter.post('/hedges/:id/prospective-test', async (req: Request, res: Response) => {
  try {
    const result = await runProspectiveTest(req.params.id as string);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

hedgeRouter.post('/hedges/:id/retrospective-test', async (req: Request, res: Response) => {
  try {
    const { hedgingInstrumentChange, hedgedItemChange } = req.body;
    const result = await runRetrospectiveTest(
      req.params.id as string, hedgingInstrumentChange, hedgedItemChange,
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Hedge Processing ---

hedgeRouter.post('/hedges/:id/process-fair-value', async (req: Request, res: Response) => {
  try {
    const { instrumentFVChange, hedgedItemFVChange } = req.body;
    const result = await processFairValueHedge(
      req.params.id as string, instrumentFVChange, hedgedItemFVChange,
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

hedgeRouter.post('/hedges/:id/process-cash-flow', async (req: Request, res: Response) => {
  try {
    const { instrumentFVChange, hedgedItemFVChange } = req.body;
    const result = await processCashFlowHedge(
      req.params.id as string, instrumentFVChange, hedgedItemFVChange,
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

hedgeRouter.post('/hedges/:id/process-net-investment', async (req: Request, res: Response) => {
  try {
    const { instrumentFVChange, netInvestmentChange } = req.body;
    const result = await processNetInvestmentHedge(
      req.params.id as string, instrumentFVChange, netInvestmentChange,
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- De-designation & Recycling ---

hedgeRouter.post('/hedges/:id/dedesignate', async (req: Request, res: Response) => {
  try {
    const result = await dedesignateHedge(req.params.id as string);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

hedgeRouter.post('/hedges/:id/recycle-oci', async (req: Request, res: Response) => {
  try {
    const result = await recycleOciToP_L(req.params.id as string);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Summary ---

hedgeRouter.get('/summary/:entityId', async (req: Request, res: Response) => {
  try {
    const summary = await getHedgeAccountingSummary(req.params.entityId as string);
    res.json(summary);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
