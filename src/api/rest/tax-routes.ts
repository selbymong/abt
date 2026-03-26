import { Router, Request, Response } from 'express';
import type { ClaimStatus } from '../../schema/neo4j/types.js';
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
  listTaxCreditPrograms,
  getTaxCreditProgram,
  identifyEligibleExpenditures,
  createTaxCreditClaim,
  getTaxCreditClaim,
  listTaxCreditClaims,
  updateClaimStatus,
  updateCreditBalance,
  getCreditBalance,
  listCreditBalances,
  createReducesCostEdge,
  computeEffectiveCost,
  generateT661Data,
  generateForm6765Data,
} from '../../services/tax/tax-credits-service.js';
import {
  createQualifiesForEdge,
  listQualifiesForEdges,
  acceptQualification,
  rejectQualification,
  batchReview,
  getFeedbackSummary,
  refineEligibilityModel,
  getRefinedModel,
  clearRefinedModel,
  reidentifyWithRefinedModel,
  computeAccuracyMetrics,
} from '../../services/tax/tax-credit-ai-service.js';
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

// --- Tax Credits ---

taxRouter.get('/credits/programs', async (req: Request, res: Response) => {
  try {
    const jurisdiction = req.query.jurisdiction as string | undefined;
    const programs = await listTaxCreditPrograms(jurisdiction);
    res.json(programs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/credits/programs/:code', async (req: Request, res: Response) => {
  try {
    const program = await getTaxCreditProgram(req.params.code as string);
    if (!program) return res.status(404).json({ error: 'Program not found' });
    res.json(program);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.post('/credits/identify', async (req: Request, res: Response) => {
  try {
    const result = await identifyEligibleExpenditures(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.post('/credits/claims', async (req: Request, res: Response) => {
  try {
    const id = await createTaxCreditClaim(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/credits/claims/:id', async (req: Request, res: Response) => {
  try {
    const claim = await getTaxCreditClaim(req.params.id as string);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json(claim);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/credits/claims/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const claims = await listTaxCreditClaims(
      req.params.entityId as string,
      status as ClaimStatus | undefined,
    );
    res.json(claims);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.post('/credits/claims/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, assessedAmount } = req.body;
    const result = await updateClaimStatus(req.params.id as string, status, assessedAmount);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

taxRouter.post('/credits/balances', async (req: Request, res: Response) => {
  try {
    const id = await updateCreditBalance(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/credits/balances/:entityId/:programCode', async (req: Request, res: Response) => {
  try {
    const balance = await getCreditBalance(
      req.params.entityId as string,
      req.params.programCode as string,
    );
    if (!balance) return res.status(404).json({ error: 'Balance not found' });
    res.json(balance);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/credits/balances/:entityId', async (req: Request, res: Response) => {
  try {
    const balances = await listCreditBalances(req.params.entityId as string);
    res.json(balances);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.post('/credits/reduces-cost', async (req: Request, res: Response) => {
  try {
    const { claimId, targetNodeId, costReductionAmount, certainty } = req.body;
    await createReducesCostEdge(claimId, targetNodeId, costReductionAmount, certainty);
    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/credits/effective-cost/:nodeId', async (req: Request, res: Response) => {
  try {
    const result = await computeEffectiveCost(req.params.nodeId as string);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/credits/filing/t661/:entityId/:fiscalYear', async (req: Request, res: Response) => {
  try {
    const data = await generateT661Data(
      req.params.entityId as string,
      req.params.fiscalYear as string,
    );
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/credits/filing/form6765/:entityId/:fiscalYear', async (req: Request, res: Response) => {
  try {
    const data = await generateForm6765Data(
      req.params.entityId as string,
      req.params.fiscalYear as string,
    );
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Tax Credit AI Feedback Loop ---

taxRouter.post('/credits/qualifies-for', async (req: Request, res: Response) => {
  try {
    await createQualifiesForEdge(req.body);
    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/credits/qualifies-for/:claimId', async (req: Request, res: Response) => {
  try {
    const edges = await listQualifiesForEdges(req.params.claimId as string);
    res.json(edges);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.post('/credits/qualifies-for/accept', async (req: Request, res: Response) => {
  try {
    const { sourceNodeId, claimId } = req.body;
    await acceptQualification(sourceNodeId, claimId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

taxRouter.post('/credits/qualifies-for/reject', async (req: Request, res: Response) => {
  try {
    const { sourceNodeId, claimId, rejectionReason } = req.body;
    if (!rejectionReason) return res.status(400).json({ error: 'rejectionReason required' });
    await rejectQualification(sourceNodeId, claimId, rejectionReason);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

taxRouter.post('/credits/qualifies-for/batch-review', async (req: Request, res: Response) => {
  try {
    const result = await batchReview(req.body.reviews ?? []);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/credits/feedback/:programCode', async (req: Request, res: Response) => {
  try {
    const summary = await getFeedbackSummary(req.params.programCode as string);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.post('/credits/refine-model/:programCode', async (req: Request, res: Response) => {
  try {
    const result = await refineEligibilityModel(req.params.programCode as string);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/credits/refined-model/:programCode', async (req: Request, res: Response) => {
  try {
    const model = getRefinedModel(req.params.programCode as string);
    if (!model) return res.status(404).json({ error: 'No refined model found' });
    res.json(model);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.delete('/credits/refined-model/:programCode', async (req: Request, res: Response) => {
  try {
    clearRefinedModel(req.params.programCode as string);
    res.json({ cleared: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.post('/credits/reidentify', async (req: Request, res: Response) => {
  try {
    const { entityId, programCode, periodId } = req.body;
    if (!entityId || !programCode || !periodId) {
      return res.status(400).json({ error: 'Required: entityId, programCode, periodId' });
    }
    const results = await reidentifyWithRefinedModel(entityId, programCode, periodId);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

taxRouter.get('/credits/accuracy/:programCode', async (req: Request, res: Response) => {
  try {
    const metrics = await computeAccuracyMetrics(req.params.programCode as string);
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
