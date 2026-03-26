import { Router, Request, Response } from 'express';
import {
  recordRealization,
  computeEffectiveStake,
  computeEntityEffectiveStakes,
  computeEffectiveContributions,
  transitionValueState,
  getCalibrationHistory,
  getCurrentCalibration,
} from '../../services/ai/weight-learner-service.js';
import {
  computeEVOI,
  computeEntityEVOIs,
  updateEpistemicPriorities,
  computeEpistemicROI,
  findStaleEstimates,
  downgradeStaleEstimates,
} from '../../services/ai/epistemic-scorer-service.js';
import {
  createScenarioSet,
  getScenarioSet,
  getScenarioSetsForNode,
  runMonteCarlo,
  computeEntityRiskProfiles,
  fireScenario,
} from '../../services/ai/scenario-engine-service.js';
import {
  findPathsToOutcomes,
  findTopContributors,
  parseQuery,
  executeQuery,
  getEntityGraphSummary,
} from '../../services/ai/graph-query-service.js';
import {
  generateAndStoreEmbedding,
  getEmbedding,
  deleteEmbedding,
  countEmbeddings,
  embedEntityNodes,
  findSimilarNodes,
  discoverEdgeCandidates,
  createInferredEdges,
  runEdgeDiscoveryPipeline,
} from '../../services/ai/vector-embedder-service.js';
import {
  validateBody,
  recordRealizationSchema,
  valueStateTransitionSchema,
  createScenarioSetSchema,
  runMonteCarloSchema,
  fireScenarioSchema,
  epistemicROISchema,
  aiQuerySchema,
  generateEmbeddingSchema,
  discoverEdgeCandidatesSchema,
  createInferredEdgesSchema,
  edgeDiscoveryPipelineSchema,
} from './validation.js';

export const aiRouter = Router();

// --- Weight Learner ---

aiRouter.post('/realizations', validateBody(recordRealizationSchema), async (req: Request, res: Response) => {
  try {
    const { outcomeId, realizedDelta, periodId } = req.body;
    if (!outcomeId || realizedDelta === undefined || !periodId) {
      res.status(400).json({ error: 'Required: outcomeId, realizedDelta, periodId' });
      return;
    }
    const result = await recordRealization({ outcomeId, realizedDelta, periodId });
    res.status(201).json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Effective Stake ---

aiRouter.get('/effective-stake/:nodeId', async (req: Request, res: Response) => {
  try {
    const stake = await computeEffectiveStake(req.params.nodeId as string);
    if (!stake) { res.status(404).json({ error: 'Not found or no ci_point_estimate' }); return; }
    res.json(stake);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.get('/effective-stakes/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const stakes = await computeEntityEffectiveStakes(req.params.entityId as string);
    res.json({ stakes });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Effective Contribution ---

aiRouter.get('/effective-contributions/:sourceId', async (req: Request, res: Response) => {
  try {
    const contributions = await computeEffectiveContributions(req.params.sourceId as string);
    res.json({ contributions });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Value State Transitions ---

aiRouter.post('/value-state-transition', validateBody(valueStateTransitionSchema), async (req: Request, res: Response) => {
  try {
    const { nodeId, newState, epistemicActivityId } = req.body;
    if (!nodeId || !newState) {
      res.status(400).json({ error: 'Required: nodeId, newState' });
      return;
    }
    const result = await transitionValueState({ nodeId, newState, epistemicActivityId });
    if (!result) { res.status(404).json({ error: 'Node not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Calibration ---

aiRouter.get('/calibration/:entityId', async (req: Request, res: Response) => {
  try {
    const outcomeType = req.query.outcomeType as string | undefined;
    const history = await getCalibrationHistory(req.params.entityId as string, outcomeType);
    res.json({ history });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.get('/calibration/:entityId/:outcomeType/current', async (req: Request, res: Response) => {
  try {
    const factor = await getCurrentCalibration(
      req.params.entityId as string,
      req.params.outcomeType as string,
    );
    res.json({ calibrationFactor: factor });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Epistemic Scorer ---

aiRouter.get('/evoi/:nodeId', async (req: Request, res: Response) => {
  try {
    const result = await computeEVOI(req.params.nodeId as string);
    if (!result) { res.status(404).json({ error: 'Not found or no ci_point_estimate' }); return; }
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.get('/evoi/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const minEvoi = req.query.minEvoi ? Number(req.query.minEvoi) : undefined;
    const evois = await computeEntityEVOIs(req.params.entityId as string, minEvoi);
    res.json({ evois });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.post('/epistemic-priorities/:entityId', async (req: Request, res: Response) => {
  try {
    const updated = await updateEpistemicPriorities(req.params.entityId as string);
    res.json({ updated });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.post('/epistemic-roi', validateBody(epistemicROISchema), async (req: Request, res: Response) => {
  try {
    const { nodeId, activityCost } = req.body;
    if (!nodeId || activityCost === undefined) {
      res.status(400).json({ error: 'Required: nodeId, activityCost' }); return;
    }
    const result = await computeEpistemicROI(nodeId, activityCost);
    if (!result) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.get('/stale-estimates/:entityId', async (req: Request, res: Response) => {
  try {
    const stale = await findStaleEstimates(req.params.entityId as string);
    res.json({ staleEstimates: stale });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.post('/stale-estimates/:entityId/downgrade', async (req: Request, res: Response) => {
  try {
    const count = await downgradeStaleEstimates(req.params.entityId as string);
    res.json({ downgraded: count });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Scenario Engine ---

aiRouter.post('/scenario-sets', validateBody(createScenarioSetSchema), async (req: Request, res: Response) => {
  try {
    const id = await createScenarioSet(req.body);
    res.status(201).json({ id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.get('/scenario-sets/:id', async (req: Request, res: Response) => {
  try {
    const ss = await getScenarioSet(req.params.id as string);
    if (!ss) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(ss);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.get('/scenario-sets/by-node/:nodeId', async (req: Request, res: Response) => {
  try {
    const sets = await getScenarioSetsForNode(req.params.nodeId as string);
    res.json({ scenarioSets: sets });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.post('/monte-carlo/:scenarioSetId', validateBody(runMonteCarloSchema), async (req: Request, res: Response) => {
  try {
    const simulations = req.body.simulations ?? 10000;
    const result = await runMonteCarlo(req.params.scenarioSetId as string, simulations);
    if (!result) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.get('/risk-profiles/:entityId', async (req: Request, res: Response) => {
  try {
    const profiles = await computeEntityRiskProfiles(req.params.entityId as string);
    res.json({ profiles });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.post('/scenarios/fire', validateBody(fireScenarioSchema), async (req: Request, res: Response) => {
  try {
    const { scenarioSetId, scenarioLabel, actualImpact } = req.body;
    if (!scenarioSetId || !scenarioLabel || actualImpact === undefined) {
      res.status(400).json({ error: 'Required: scenarioSetId, scenarioLabel, actualImpact' }); return;
    }
    const result = await fireScenario(scenarioSetId, scenarioLabel, actualImpact);
    if (!result) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Graph Query (Claude Integration) ---

aiRouter.get('/paths/:nodeId', async (req: Request, res: Response) => {
  try {
    const maxHops = req.query.maxHops ? Number(req.query.maxHops) : 6;
    const paths = await findPathsToOutcomes(req.params.nodeId as string, maxHops);
    res.json({ paths });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.get('/top-contributors/:outcomeId', async (req: Request, res: Response) => {
  try {
    const maxHops = req.query.maxHops ? Number(req.query.maxHops) : 6;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const contributors = await findTopContributors(req.params.outcomeId as string, maxHops, limit);
    res.json({ contributors });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.post('/query', validateBody(aiQuerySchema), async (req: Request, res: Response) => {
  try {
    const { query: queryText, entityId, nodeId, outcomeId } = req.body;
    if (!queryText) { res.status(400).json({ error: 'Required: query' }); return; }
    const intent = parseQuery(queryText);
    if (entityId) intent.entityId = entityId;
    const result = await executeQuery(intent, { entityId, nodeId, outcomeId });
    res.json({ intent: intent.type, result });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.get('/graph-summary/:entityId', async (req: Request, res: Response) => {
  try {
    const summary = await getEntityGraphSummary(req.params.entityId as string);
    res.json(summary);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Vector Embedder ---

aiRouter.post('/embeddings', validateBody(generateEmbeddingSchema), async (req: Request, res: Response) => {
  try {
    const { nodeId, entityId, nodeLabel, properties } = req.body;
    if (!nodeId || !entityId || !nodeLabel) {
      res.status(400).json({ error: 'Required: nodeId, entityId, nodeLabel' }); return;
    }
    const result = await generateAndStoreEmbedding(nodeId, entityId, nodeLabel, properties ?? {});
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

aiRouter.get('/embeddings/:nodeId', async (req: Request, res: Response) => {
  try {
    const emb = await getEmbedding(req.params.nodeId as string);
    if (!emb) { res.status(404).json({ error: 'Embedding not found' }); return; }
    res.json(emb);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.delete('/embeddings/:nodeId', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteEmbedding(req.params.nodeId as string);
    res.json({ deleted });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.get('/embeddings/count/:entityId', async (req: Request, res: Response) => {
  try {
    const count = await countEmbeddings(req.params.entityId as string);
    res.json({ count });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.post('/embeddings/embed-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const result = await embedEntityNodes(req.params.entityId as string);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

aiRouter.get('/embeddings/similar/:nodeId', async (req: Request, res: Response) => {
  try {
    const threshold = req.query.threshold ? Number(req.query.threshold) : 0.82;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const candidates = await findSimilarNodes(req.params.nodeId as string, threshold, limit);
    res.json({ candidates });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

aiRouter.post('/embeddings/discover/:entityId', validateBody(discoverEdgeCandidatesSchema), async (req: Request, res: Response) => {
  try {
    const threshold = req.body.threshold ?? 0.82;
    const limit = req.body.limit ?? 50;
    const candidates = await discoverEdgeCandidates(req.params.entityId as string, threshold, limit);
    res.json({ candidates });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

aiRouter.post('/embeddings/create-edges', validateBody(createInferredEdgesSchema), async (req: Request, res: Response) => {
  try {
    const { candidates, entityId } = req.body;
    if (!candidates || !entityId) {
      res.status(400).json({ error: 'Required: candidates, entityId' }); return;
    }
    const result = await createInferredEdges(candidates, entityId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

aiRouter.post('/embeddings/pipeline/:entityId', validateBody(edgeDiscoveryPipelineSchema), async (req: Request, res: Response) => {
  try {
    const result = await runEdgeDiscoveryPipeline(req.params.entityId as string, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
