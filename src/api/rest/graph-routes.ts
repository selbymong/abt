import { Router, Request, Response } from 'express';
import {
  getAllEntities,
  getEntity,
  createOutcome,
  createActivity,
  createContributesToEdge,
  createAccountingPeriod,
  createFund,
} from '../../services/graph/graph-crud-service.js';
import { runCypher } from '../../lib/neo4j.js';

export const graphRouter = Router();

// --- Entity routes ---
graphRouter.get('/entities', async (_req: Request, res: Response) => {
  const entities = await getAllEntities();
  res.json({ entities });
});

graphRouter.get('/entities/:id', async (req: Request, res: Response) => {
  const entity = await getEntity(req.params.id as string);
  if (!entity) {
    res.status(404).json({ error: 'Entity not found' });
    return;
  }
  res.json(entity);
});

// --- Outcome routes ---
graphRouter.post('/outcomes', async (req: Request, res: Response) => {
  const id = await createOutcome(req.body);
  res.status(201).json({ id });
});

// --- Activity routes ---
graphRouter.post('/activities', async (req: Request, res: Response) => {
  const id = await createActivity(req.body);
  res.status(201).json({ id });
});

// --- CONTRIBUTES_TO edge ---
graphRouter.post('/edges/contributes-to', async (req: Request, res: Response) => {
  await createContributesToEdge(req.body);
  res.status(201).json({ success: true });
});

// --- AccountingPeriod routes ---
graphRouter.post('/periods', async (req: Request, res: Response) => {
  const id = await createAccountingPeriod(req.body);
  res.status(201).json({ id });
});

// --- Fund routes ---
graphRouter.post('/funds', async (req: Request, res: Response) => {
  const id = await createFund(req.body);
  res.status(201).json({ id });
});

// --- Traversal queries ---
graphRouter.get('/impact-paths/:entityId', async (req: Request, res: Response) => {
  const results = await runCypher(
    `MATCH path = (a:Activity)-[:CONTRIBUTES_TO*1..6]->(o:Outcome)
     WHERE a.entity_id = $entityId
       AND a.status IN ['IN_PROGRESS', 'PLANNED']
     WITH a, o, path,
       reduce(w = 1.0, r IN relationships(path) | w * r.weight) AS path_weight,
       reduce(d = 0, r IN relationships(path) | d + r.lag_days) AS total_lag
     RETURN a.id AS activity_id, a.label AS activity,
       o.id AS outcome_id, o.label AS outcome,
       o.outcome_type, o.ontology,
       path_weight AS path_contribution, total_lag,
       length(path) AS path_length
     ORDER BY path_weight DESC`,
    { entityId: req.params.entityId },
  );
  res.json({ paths: results });
});

graphRouter.get('/orphaned-activities/:entityId', async (req: Request, res: Response) => {
  const results = await runCypher(
    `MATCH (a:Activity)
     WHERE a.entity_id = $entityId
       AND a.status IN ['IN_PROGRESS', 'PLANNED']
       AND a.cost_monetary > 0
       AND NOT EXISTS { MATCH (a)-[:CONTRIBUTES_TO*1..6]->(:Outcome) }
     RETURN a.id, a.label, a.cost_monetary, a.status
     ORDER BY a.cost_monetary DESC`,
    { entityId: req.params.entityId },
  );
  res.json({ orphanedActivities: results });
});
