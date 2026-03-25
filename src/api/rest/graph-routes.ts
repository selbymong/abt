import { Router, Request, Response } from 'express';
import {
  checkProhibitions,
  filterProhibitedActivities,
  getObligationAlerts,
  getEntityObligations,
} from '../../services/graph/social-control-service.js';
import {
  getAllEntities,
  getEntity,
  // Outcome
  createOutcome,
  getOutcome,
  listOutcomes,
  updateOutcome,
  // Resource
  createResource,
  getResource,
  listResources,
  updateResource,
  deleteResource,
  // Activity
  createActivity,
  getActivity,
  listActivities,
  updateActivity,
  deleteActivity,
  // Project
  createProject,
  getProject,
  listProjects,
  updateProject,
  deleteProject,
  // Initiative
  createInitiative,
  getInitiative,
  listInitiatives,
  updateInitiative,
  deleteInitiative,
  // Metric
  createMetric,
  getMetric,
  listMetrics,
  updateMetric,
  deleteMetric,
  // Capability
  createCapability,
  getCapability,
  listCapabilities,
  updateCapability,
  deleteCapability,
  // Asset
  createAsset,
  getAsset,
  listAssets,
  updateAsset,
  deleteAsset,
  // CustomerRelationshipAsset
  createCustomerRelationshipAsset,
  getCustomerRelationshipAsset,
  listCustomerRelationshipAssets,
  updateCustomerRelationshipAsset,
  deleteCustomerRelationshipAsset,
  // WorkforceAsset
  createWorkforceAsset,
  getWorkforceAsset,
  listWorkforceAssets,
  updateWorkforceAsset,
  deleteWorkforceAsset,
  // StakeholderAsset
  createStakeholderAsset,
  getStakeholderAsset,
  listStakeholderAssets,
  updateStakeholderAsset,
  deleteStakeholderAsset,
  // SocialConstraint
  createSocialConstraint,
  getSocialConstraint,
  listSocialConstraints,
  updateSocialConstraint,
  deleteSocialConstraint,
  // Obligation
  createObligation,
  getObligation,
  listObligations,
  updateObligation,
  deleteObligation,
  // CashFlowEvent
  createCashFlowEvent,
  getCashFlowEvent,
  listCashFlowEvents,
  updateCashFlowEvent,
  deleteCashFlowEvent,
  // AccountingPeriod
  createAccountingPeriod,
  getAccountingPeriod,
  listAccountingPeriods,
  updateAccountingPeriod,
  // Fund
  createFund,
  getFund,
  listFunds,
  updateFund,
  deleteFund,
  // Edges
  createContributesToEdge,
  getContributesToEdges,
  getIncomingContributesToEdges,
  updateContributesToEdge,
  deleteContributesToEdge,
  createDependsOnEdge,
  getDependsOnEdges,
  updateDependsOnEdge,
  deleteDependsOnEdge,
  createDelegatesToEdge,
  getDelegatesToEdges,
  updateDelegatesToEdge,
  deleteDelegatesToEdge,
  createProhibitsEdge,
  getProhibitsEdges,
  deleteProhibitsEdge,
} from '../../services/graph/graph-crud-service.js';
import { runCypher } from '../../lib/neo4j.js';

export const graphRouter = Router();

// Helper to build standard CRUD routes for a node type
function addCrudRoutes(
  path: string,
  create: (body: any) => Promise<string>,
  get: (id: string) => Promise<any>,
  list: (entityId: string) => Promise<any[]>,
  update: (id: string, u: Record<string, unknown>) => Promise<boolean>,
  del?: (id: string) => Promise<boolean>,
) {
  graphRouter.post(path, async (req: Request, res: Response) => {
    const id = await create(req.body);
    res.status(201).json({ id });
  });

  graphRouter.get(`${path}/:id`, async (req: Request, res: Response) => {
    const node = await get(req.params.id as string);
    if (!node) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(node);
  });

  graphRouter.get(`${path}/by-entity/:entityId`, async (req: Request, res: Response) => {
    const nodes = await list(req.params.entityId as string);
    res.json({ items: nodes });
  });

  graphRouter.patch(`${path}/:id`, async (req: Request, res: Response) => {
    const updated = await update(req.params.id as string, req.body);
    if (!updated) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  });

  if (del) {
    graphRouter.delete(`${path}/:id`, async (req: Request, res: Response) => {
      const deleted = await del(req.params.id as string);
      if (!deleted) { res.status(404).json({ error: 'Not found' }); return; }
      res.json({ success: true });
    });
  }
}

// --- Entity routes (read-only — entities are seeded, not created via API) ---
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

// --- Node CRUD routes ---
addCrudRoutes('/outcomes', createOutcome, getOutcome, listOutcomes, updateOutcome);
addCrudRoutes('/resources', createResource, getResource, listResources, updateResource, deleteResource);
addCrudRoutes('/activities', createActivity, getActivity, listActivities, updateActivity, deleteActivity);
addCrudRoutes('/projects', createProject, getProject, listProjects, updateProject, deleteProject);
addCrudRoutes('/initiatives', createInitiative, getInitiative, listInitiatives, updateInitiative, deleteInitiative);
addCrudRoutes('/metrics', createMetric, getMetric, listMetrics, updateMetric, deleteMetric);
addCrudRoutes('/capabilities', createCapability, getCapability, listCapabilities, updateCapability, deleteCapability);
addCrudRoutes('/assets', createAsset, getAsset, listAssets, updateAsset, deleteAsset);
addCrudRoutes('/customer-relationship-assets', createCustomerRelationshipAsset, getCustomerRelationshipAsset, listCustomerRelationshipAssets, updateCustomerRelationshipAsset, deleteCustomerRelationshipAsset);
addCrudRoutes('/workforce-assets', createWorkforceAsset, getWorkforceAsset, listWorkforceAssets, updateWorkforceAsset, deleteWorkforceAsset);
addCrudRoutes('/stakeholder-assets', createStakeholderAsset, getStakeholderAsset, listStakeholderAssets, updateStakeholderAsset, deleteStakeholderAsset);
addCrudRoutes('/social-constraints', createSocialConstraint, getSocialConstraint, listSocialConstraints, updateSocialConstraint, deleteSocialConstraint);
addCrudRoutes('/obligations', createObligation, getObligation, listObligations, updateObligation, deleteObligation);
addCrudRoutes('/cash-flow-events', createCashFlowEvent, getCashFlowEvent, listCashFlowEvents, updateCashFlowEvent, deleteCashFlowEvent);
addCrudRoutes('/periods', createAccountingPeriod, getAccountingPeriod, listAccountingPeriods, updateAccountingPeriod);
addCrudRoutes('/funds', createFund, getFund, listFunds, updateFund, deleteFund);

// --- Edge routes: CONTRIBUTES_TO ---
graphRouter.post('/edges/contributes-to', async (req: Request, res: Response) => {
  await createContributesToEdge(req.body);
  res.status(201).json({ success: true });
});

graphRouter.get('/edges/contributes-to/from/:sourceId', async (req: Request, res: Response) => {
  const edges = await getContributesToEdges(req.params.sourceId as string);
  res.json({ edges });
});

graphRouter.get('/edges/contributes-to/to/:targetId', async (req: Request, res: Response) => {
  const edges = await getIncomingContributesToEdges(req.params.targetId as string);
  res.json({ edges });
});

graphRouter.patch('/edges/contributes-to', async (req: Request, res: Response) => {
  const { sourceId, targetId, ...updates } = req.body;
  const updated = await updateContributesToEdge(sourceId, targetId, updates);
  if (!updated) { res.status(404).json({ error: 'Edge not found' }); return; }
  res.json({ success: true });
});

graphRouter.delete('/edges/contributes-to', async (req: Request, res: Response) => {
  const { sourceId, targetId } = req.body;
  const deleted = await deleteContributesToEdge(sourceId, targetId);
  if (!deleted) { res.status(404).json({ error: 'Edge not found' }); return; }
  res.json({ success: true });
});

// --- Edge routes: DEPENDS_ON ---
graphRouter.post('/edges/depends-on', async (req: Request, res: Response) => {
  await createDependsOnEdge(req.body);
  res.status(201).json({ success: true });
});

graphRouter.get('/edges/depends-on/from/:sourceId', async (req: Request, res: Response) => {
  const edges = await getDependsOnEdges(req.params.sourceId as string);
  res.json({ edges });
});

graphRouter.patch('/edges/depends-on', async (req: Request, res: Response) => {
  const { sourceId, targetId, ...updates } = req.body;
  const updated = await updateDependsOnEdge(sourceId, targetId, updates);
  if (!updated) { res.status(404).json({ error: 'Edge not found' }); return; }
  res.json({ success: true });
});

graphRouter.delete('/edges/depends-on', async (req: Request, res: Response) => {
  const { sourceId, targetId } = req.body;
  const deleted = await deleteDependsOnEdge(sourceId, targetId);
  if (!deleted) { res.status(404).json({ error: 'Edge not found' }); return; }
  res.json({ success: true });
});

// --- Edge routes: DELEGATES_TO ---
graphRouter.post('/edges/delegates-to', async (req: Request, res: Response) => {
  await createDelegatesToEdge(req.body);
  res.status(201).json({ success: true });
});

graphRouter.get('/edges/delegates-to/from/:sourceId', async (req: Request, res: Response) => {
  const edges = await getDelegatesToEdges(req.params.sourceId as string);
  res.json({ edges });
});

graphRouter.patch('/edges/delegates-to', async (req: Request, res: Response) => {
  const { sourceId, targetId, ...updates } = req.body;
  const updated = await updateDelegatesToEdge(sourceId, targetId, updates);
  if (!updated) { res.status(404).json({ error: 'Edge not found' }); return; }
  res.json({ success: true });
});

graphRouter.delete('/edges/delegates-to', async (req: Request, res: Response) => {
  const { sourceId, targetId } = req.body;
  const deleted = await deleteDelegatesToEdge(sourceId, targetId);
  if (!deleted) { res.status(404).json({ error: 'Edge not found' }); return; }
  res.json({ success: true });
});

// --- Edge routes: PROHIBITS ---
graphRouter.post('/edges/prohibits', async (req: Request, res: Response) => {
  await createProhibitsEdge(req.body);
  res.status(201).json({ success: true });
});

graphRouter.get('/edges/prohibits/from/:constraintId', async (req: Request, res: Response) => {
  const edges = await getProhibitsEdges(req.params.constraintId as string);
  res.json({ edges });
});

graphRouter.delete('/edges/prohibits', async (req: Request, res: Response) => {
  const { constraintId, activityId } = req.body;
  const deleted = await deleteProhibitsEdge(constraintId, activityId);
  if (!deleted) { res.status(404).json({ error: 'Edge not found' }); return; }
  res.json({ success: true });
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

// --- Social Control: PROHIBITS pre-filter ---

graphRouter.get('/prohibitions/:activityId', async (req: Request, res: Response) => {
  const result = await checkProhibitions(req.params.activityId as string);
  res.json(result);
});

graphRouter.post('/prohibitions/filter', async (req: Request, res: Response) => {
  const { activityIds } = req.body;
  if (!Array.isArray(activityIds)) {
    res.status(400).json({ error: 'Required: activityIds[]' });
    return;
  }
  const result = await filterProhibitedActivities(activityIds);
  res.json(result);
});

// --- Obligation Alerts ---

graphRouter.get('/obligations/alerts/:entityId', async (req: Request, res: Response) => {
  const horizonDays = parseInt(req.query.horizonDays as string) || 30;
  const alerts = await getObligationAlerts(req.params.entityId as string, horizonDays);
  res.json({ alerts });
});

graphRouter.get('/obligations/by-entity/:entityId', async (req: Request, res: Response) => {
  const statusFilter = req.query.status as string | undefined;
  const obligations = await getEntityObligations(req.params.entityId as string, statusFilter);
  res.json({ obligations });
});
