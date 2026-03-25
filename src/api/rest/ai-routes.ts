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
