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

export const aiRouter = Router();

// --- Weight Learner ---

aiRouter.post('/realizations', async (req: Request, res: Response) => {
  const { outcomeId, realizedDelta, periodId } = req.body;
  if (!outcomeId || realizedDelta === undefined || !periodId) {
    res.status(400).json({ error: 'Required: outcomeId, realizedDelta, periodId' });
    return;
  }
  const result = await recordRealization({ outcomeId, realizedDelta, periodId });
  res.status(201).json(result);
});

// --- Effective Stake ---

aiRouter.get('/effective-stake/:nodeId', async (req: Request, res: Response) => {
  const stake = await computeEffectiveStake(req.params.nodeId as string);
  if (!stake) { res.status(404).json({ error: 'Not found or no ci_point_estimate' }); return; }
  res.json(stake);
});

aiRouter.get('/effective-stakes/by-entity/:entityId', async (req: Request, res: Response) => {
  const stakes = await computeEntityEffectiveStakes(req.params.entityId as string);
  res.json({ stakes });
});

// --- Effective Contribution ---

aiRouter.get('/effective-contributions/:sourceId', async (req: Request, res: Response) => {
  const contributions = await computeEffectiveContributions(req.params.sourceId as string);
  res.json({ contributions });
});

// --- Value State Transitions ---

aiRouter.post('/value-state-transition', async (req: Request, res: Response) => {
  const { nodeId, newState, epistemicActivityId } = req.body;
  if (!nodeId || !newState) {
    res.status(400).json({ error: 'Required: nodeId, newState' });
    return;
  }
  const result = await transitionValueState({ nodeId, newState, epistemicActivityId });
  if (!result) { res.status(404).json({ error: 'Node not found' }); return; }
  res.json({ success: true });
});

// --- Calibration ---

aiRouter.get('/calibration/:entityId', async (req: Request, res: Response) => {
  const outcomeType = req.query.outcomeType as string | undefined;
  const history = await getCalibrationHistory(req.params.entityId as string, outcomeType);
  res.json({ history });
});

aiRouter.get('/calibration/:entityId/:outcomeType/current', async (req: Request, res: Response) => {
  const factor = await getCurrentCalibration(
    req.params.entityId as string,
    req.params.outcomeType as string,
  );
  res.json({ calibrationFactor: factor });
});

// --- Epistemic Scorer ---

aiRouter.get('/evoi/:nodeId', async (req: Request, res: Response) => {
  const result = await computeEVOI(req.params.nodeId as string);
  if (!result) { res.status(404).json({ error: 'Not found or no ci_point_estimate' }); return; }
  res.json(result);
});

aiRouter.get('/evoi/by-entity/:entityId', async (req: Request, res: Response) => {
  const minEvoi = req.query.minEvoi ? Number(req.query.minEvoi) : undefined;
  const evois = await computeEntityEVOIs(req.params.entityId as string, minEvoi);
  res.json({ evois });
});

aiRouter.post('/epistemic-priorities/:entityId', async (req: Request, res: Response) => {
  const updated = await updateEpistemicPriorities(req.params.entityId as string);
  res.json({ updated });
});

aiRouter.post('/epistemic-roi', async (req: Request, res: Response) => {
  const { nodeId, activityCost } = req.body;
  if (!nodeId || activityCost === undefined) {
    res.status(400).json({ error: 'Required: nodeId, activityCost' }); return;
  }
  const result = await computeEpistemicROI(nodeId, activityCost);
  if (!result) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(result);
});

aiRouter.get('/stale-estimates/:entityId', async (req: Request, res: Response) => {
  const stale = await findStaleEstimates(req.params.entityId as string);
  res.json({ staleEstimates: stale });
});

aiRouter.post('/stale-estimates/:entityId/downgrade', async (req: Request, res: Response) => {
  const count = await downgradeStaleEstimates(req.params.entityId as string);
  res.json({ downgraded: count });
});

// --- Scenario Engine ---

aiRouter.post('/scenario-sets', async (req: Request, res: Response) => {
  const id = await createScenarioSet(req.body);
  res.status(201).json({ id });
});

aiRouter.get('/scenario-sets/:id', async (req: Request, res: Response) => {
  const ss = await getScenarioSet(req.params.id as string);
  if (!ss) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(ss);
});

aiRouter.get('/scenario-sets/by-node/:nodeId', async (req: Request, res: Response) => {
  const sets = await getScenarioSetsForNode(req.params.nodeId as string);
  res.json({ scenarioSets: sets });
});

aiRouter.post('/monte-carlo/:scenarioSetId', async (req: Request, res: Response) => {
  const simulations = req.body.simulations ?? 10000;
  const result = await runMonteCarlo(req.params.scenarioSetId as string, simulations);
  if (!result) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(result);
});

aiRouter.get('/risk-profiles/:entityId', async (req: Request, res: Response) => {
  const profiles = await computeEntityRiskProfiles(req.params.entityId as string);
  res.json({ profiles });
});

aiRouter.post('/scenarios/fire', async (req: Request, res: Response) => {
  const { scenarioSetId, scenarioLabel, actualImpact } = req.body;
  if (!scenarioSetId || !scenarioLabel || actualImpact === undefined) {
    res.status(400).json({ error: 'Required: scenarioSetId, scenarioLabel, actualImpact' }); return;
  }
  const result = await fireScenario(scenarioSetId, scenarioLabel, actualImpact);
  if (!result) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ success: true });
});
