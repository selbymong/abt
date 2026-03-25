import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { OntologyBoundaryViolation } from '../../lib/errors.js';
import type {
  Entity, Outcome, OutcomeOntology, OutcomeType,
  NodeStatus, ResourceType, MetricType, CapabilityLevel, AssetType,
  ControlClass, ValueState,
} from '../../schema/neo4j/types.js';

// --- Default epistemic + control property block ---

const EPISTEMIC_DEFAULTS = {
  value_state: 'FORECASTED' as ValueState,
  uncertainty_type: 'EPISTEMIC',
  uncertainty_score: 0.7,
  ci_point_estimate: 0,
  ci_lower_bound: 0,
  ci_upper_bound: 0,
  ci_confidence_pct: 0.8,
  ci_distribution: 'NORMAL',
  ci_estimation_method: 'ANALOGICAL',
  calibration_factor: 1.0,
  epistemic_priority: 0,
};

const CONTROL_DEFAULTS = {
  control_class: 'DIRECT' as ControlClass,
  control_score: 1.0,
  effective_control: 1.0,
  observability_score: 0.8,
  response_window_days: 30,
  volatility: 0.5,
};

/**
 * Generic node creation helper. Builds a CREATE statement with
 * user-supplied properties + epistemic + control defaults + timestamps.
 */
async function createNode(
  label: string,
  props: Record<string, unknown>,
  epistemicOverrides: Partial<typeof EPISTEMIC_DEFAULTS> = {},
  controlOverrides: Partial<typeof CONTROL_DEFAULTS> = {},
): Promise<string> {
  const id = uuid();
  const allProps: Record<string, unknown> = {
    id,
    ...props,
    ...EPISTEMIC_DEFAULTS,
    ...epistemicOverrides,
    ...CONTROL_DEFAULTS,
    ...controlOverrides,
    created_at: null, // set via datetime() in Cypher
    updated_at: null,
  };

  // Build property assignment string and params
  const paramKeys = Object.keys(allProps).filter((k) => k !== 'created_at' && k !== 'updated_at');
  const setParts = paramKeys.map((k) => `${k}: $${k}`);
  setParts.push('created_at: datetime()', 'updated_at: datetime()');

  const params = Object.fromEntries(paramKeys.map((k) => [k, allProps[k]]));

  await runCypher(
    `CREATE (n:${label} {${setParts.join(', ')}})`,
    params,
  );

  return id;
}

/**
 * Generic get-by-id for any node label.
 */
async function getNode<T>(label: string, id: string): Promise<T | null> {
  const results = await runCypher<{ n: T }>(
    `MATCH (n:${label} {id: $id}) RETURN properties(n) AS n`,
    { id },
  );
  return results[0]?.n ?? null;
}

/**
 * Generic list nodes by entity_id.
 */
async function listNodesByEntity<T>(label: string, entityId: string): Promise<T[]> {
  const results = await runCypher<{ n: T }>(
    `MATCH (n:${label} {entity_id: $entityId}) RETURN properties(n) AS n ORDER BY n.label`,
    { entityId },
  );
  return results.map((r) => r.n);
}

/**
 * Generic update: SET properties on a node.
 */
async function updateNode(
  label: string,
  id: string,
  updates: Record<string, unknown>,
): Promise<boolean> {
  const keys = Object.keys(updates);
  if (keys.length === 0) return false;

  const setParts = keys.map((k) => `n.${k} = $${k}`);
  setParts.push('n.updated_at = datetime()');

  const result = await runCypher<{ id: string }>(
    `MATCH (n:${label} {id: $id}) SET ${setParts.join(', ')} RETURN n.id AS id`,
    { id, ...updates },
  );

  return result.length > 0;
}

/**
 * Generic delete (non-GL nodes only — JournalEntry/LedgerLine are immutable).
 */
async function deleteNode(label: string, id: string): Promise<boolean> {
  // Check existence first, then delete
  const exists = await runCypher<{ id: string }>(
    `MATCH (n:${label} {id: $id}) RETURN n.id AS id`,
    { id },
  );
  if (exists.length === 0) return false;
  await runCypher(
    `MATCH (n:${label} {id: $id}) DETACH DELETE n`,
    { id },
  );
  return true;
}

// ============================================================
// Entity CRUD
// ============================================================

export async function getEntity(id: string): Promise<Entity | null> {
  return getNode<Entity>('Entity', id);
}

export async function getAllEntities(): Promise<Entity[]> {
  const results = await runCypher<{ e: Entity }>(
    'MATCH (e:Entity) RETURN properties(e) AS e ORDER BY e.label',
  );
  return results.map((r) => r.e);
}

// ============================================================
// Outcome CRUD (with ontology validation)
// ============================================================

export async function createOutcome(params: {
  entityId: string;
  label: string;
  ontology: OutcomeOntology;
  outcomeType: OutcomeType;
  targetDelta: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  measurementUnit?: string;
  streamId?: string;
}): Promise<string> {
  const entity = await getEntity(params.entityId);
  if (entity && entity.outcome_ontology !== params.ontology) {
    throw new OntologyBoundaryViolation(entity.outcome_ontology, params.ontology);
  }

  const financialTypes: OutcomeType[] = ['IMPROVE_REVENUE', 'NEW_REVENUE', 'MITIGATE_EXPENSE'];
  const missionTypes: OutcomeType[] = ['DELIVER_MISSION', 'SUSTAIN_FUNDING', 'STEWARD_RESOURCES'];
  const validTypes = params.ontology === 'FINANCIAL' ? financialTypes : missionTypes;

  if (!validTypes.includes(params.outcomeType)) {
    throw new OntologyBoundaryViolation(
      `${params.ontology} ontology`,
      `${params.outcomeType} outcome type`,
    );
  }

  const id = uuid();
  await runCypher(
    `CREATE (o:Outcome {
      id: $id, label: $label, entity_id: $entityId,
      ontology: $ontology, outcome_type: $outcomeType,
      measurement_unit: $measurementUnit, stream_id: $streamId,
      target_delta: $targetDelta, realized_delta: 0,
      currency: $currency,
      period_start: date($periodStart), period_end: date($periodEnd),
      value_state: 'FORECASTED', uncertainty_type: 'EPISTEMIC',
      uncertainty_score: 0.7, calibration_factor: 1.0,
      ci_point_estimate: 0, ci_lower_bound: 0, ci_upper_bound: 0,
      ci_confidence_pct: 0.8, ci_distribution: 'NORMAL',
      ci_estimation_method: 'ANALOGICAL', epistemic_priority: 0,
      control_class: 'PROXIMATE_EXT', control_score: 0.6,
      effective_control: 0.6, observability_score: 0.7,
      response_window_days: 30, volatility: 0.5,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      label: params.label,
      entityId: params.entityId,
      ontology: params.ontology,
      outcomeType: params.outcomeType,
      measurementUnit: params.measurementUnit ?? null,
      streamId: params.streamId ?? null,
      targetDelta: params.targetDelta,
      currency: params.currency,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
    },
  );

  return id;
}

export async function getOutcome(id: string): Promise<Outcome | null> {
  return getNode<Outcome>('Outcome', id);
}

export async function listOutcomes(entityId: string): Promise<Outcome[]> {
  return listNodesByEntity<Outcome>('Outcome', entityId);
}

export async function updateOutcome(id: string, updates: Record<string, unknown>): Promise<boolean> {
  return updateNode('Outcome', id, updates);
}

// ============================================================
// Resource CRUD
// ============================================================

export async function createResource(params: {
  entityId: string;
  label: string;
  resourceType: ResourceType;
  allocationPct: number;
  costMonetary: number;
  currency: string;
  costTimeHours?: number;
}): Promise<string> {
  return createNode('Resource', {
    entity_id: params.entityId,
    label: params.label,
    resource_type: params.resourceType,
    allocation_pct: params.allocationPct,
    cost_monetary: params.costMonetary,
    currency: params.currency,
    cost_time_hours: params.costTimeHours ?? null,
  });
}

export async function getResource(id: string) { return getNode('Resource', id); }
export async function listResources(entityId: string) { return listNodesByEntity('Resource', entityId); }
export async function updateResource(id: string, u: Record<string, unknown>) { return updateNode('Resource', id, u); }
export async function deleteResource(id: string) { return deleteNode('Resource', id); }

// ============================================================
// Activity CRUD
// ============================================================

export async function createActivity(params: {
  entityId: string;
  label: string;
  costMonetary?: number;
  costTimeHours?: number;
  startDate?: string;
  endDate?: string;
  projectId?: string;
  initiativeId?: string;
  status?: NodeStatus;
}): Promise<string> {
  return createNode('Activity', {
    entity_id: params.entityId,
    label: params.label,
    status: params.status ?? 'PLANNED',
    cost_monetary: params.costMonetary ?? 0,
    cost_time_hours: params.costTimeHours ?? null,
    start_date: params.startDate ?? null,
    end_date: params.endDate ?? null,
    project_id: params.projectId ?? null,
    initiative_id: params.initiativeId ?? null,
  });
}

export async function getActivity(id: string) { return getNode('Activity', id); }
export async function listActivities(entityId: string) { return listNodesByEntity('Activity', entityId); }
export async function updateActivity(id: string, u: Record<string, unknown>) { return updateNode('Activity', id, u); }
export async function deleteActivity(id: string) { return deleteNode('Activity', id); }

// ============================================================
// Project CRUD
// ============================================================

export async function createProject(params: {
  entityId: string;
  label: string;
  budget: number;
  initiativeId?: string;
  status?: NodeStatus;
}): Promise<string> {
  return createNode('Project', {
    entity_id: params.entityId,
    label: params.label,
    status: params.status ?? 'PLANNED',
    budget: params.budget,
    spent_to_date: 0,
    initiative_id: params.initiativeId ?? null,
  });
}

export async function getProject(id: string) { return getNode('Project', id); }
export async function listProjects(entityId: string) { return listNodesByEntity('Project', entityId); }
export async function updateProject(id: string, u: Record<string, unknown>) { return updateNode('Project', id, u); }
export async function deleteProject(id: string) { return deleteNode('Project', id); }

// ============================================================
// Initiative CRUD
// ============================================================

export async function createInitiative(params: {
  entityId: string;
  label: string;
  budget: number;
  timeHorizonMonths: number;
  status?: NodeStatus;
}): Promise<string> {
  return createNode('Initiative', {
    entity_id: params.entityId,
    label: params.label,
    status: params.status ?? 'PLANNED',
    budget: params.budget,
    time_horizon_months: params.timeHorizonMonths,
  });
}

export async function getInitiative(id: string) { return getNode('Initiative', id); }
export async function listInitiatives(entityId: string) { return listNodesByEntity('Initiative', entityId); }
export async function updateInitiative(id: string, u: Record<string, unknown>) { return updateNode('Initiative', id, u); }
export async function deleteInitiative(id: string) { return deleteNode('Initiative', id); }

// ============================================================
// Metric CRUD
// ============================================================

export async function createMetric(params: {
  entityId: string;
  label: string;
  metricType: MetricType;
  currentValue: number;
  targetValue: number;
  unit: string;
}): Promise<string> {
  return createNode('Metric', {
    entity_id: params.entityId,
    label: params.label,
    metric_type: params.metricType,
    current_value: params.currentValue,
    target_value: params.targetValue,
    unit: params.unit,
    mc_validity: 0.8,
    mc_precision: 0.8,
    mc_coverage: 0.8,
    mc_freshness: 0.8,
    mc_composite: 0.8,
  });
}

export async function getMetric(id: string) { return getNode('Metric', id); }
export async function listMetrics(entityId: string) { return listNodesByEntity('Metric', entityId); }
export async function updateMetric(id: string, u: Record<string, unknown>) { return updateNode('Metric', id, u); }
export async function deleteMetric(id: string) { return deleteNode('Metric', id); }

// ============================================================
// Capability CRUD
// ============================================================

export async function createCapability(params: {
  entityId: string;
  label: string;
  capabilityLevel: CapabilityLevel;
  buildCost: number;
  capacityThreshold?: number;
}): Promise<string> {
  return createNode('Capability', {
    entity_id: params.entityId,
    label: params.label,
    capability_level: params.capabilityLevel,
    build_cost: params.buildCost,
    capacity_threshold: params.capacityThreshold ?? null,
  });
}

export async function getCapability(id: string) { return getNode('Capability', id); }
export async function listCapabilities(entityId: string) { return listNodesByEntity('Capability', entityId); }
export async function updateCapability(id: string, u: Record<string, unknown>) { return updateNode('Capability', id, u); }
export async function deleteCapability(id: string) { return deleteNode('Capability', id); }

// ============================================================
// Asset CRUD
// ============================================================

export async function createAsset(params: {
  entityId: string;
  label: string;
  assetType: AssetType;
  bookValue: number;
  depreciationRate?: number;
  growthRate?: number;
}): Promise<string> {
  return createNode('Asset', {
    entity_id: params.entityId,
    label: params.label,
    asset_type: params.assetType,
    book_value: params.bookValue,
    depreciation_rate: params.depreciationRate ?? null,
    growth_rate: params.growthRate ?? null,
    fair_value: null,
    fair_value_hierarchy: null,
  });
}

export async function getAsset(id: string) { return getNode('Asset', id); }
export async function listAssets(entityId: string) { return listNodesByEntity('Asset', entityId); }
export async function updateAsset(id: string, u: Record<string, unknown>) { return updateNode('Asset', id, u); }
export async function deleteAsset(id: string) { return deleteNode('Asset', id); }

// ============================================================
// CustomerRelationshipAsset CRUD
// ============================================================

export async function createCustomerRelationshipAsset(params: {
  entityId: string;
  label: string;
  nps?: number;
  csat?: number;
  churnRate?: number;
  retentionRate?: number;
  expansionRate?: number;
}): Promise<string> {
  return createNode(
    'CustomerRelationshipAsset',
    {
      entity_id: params.entityId,
      label: params.label,
      nps: params.nps ?? null,
      csat: params.csat ?? null,
      churn_rate: params.churnRate ?? null,
      retention_rate: params.retentionRate ?? null,
      expansion_rate: params.expansionRate ?? null,
      mc_validity: 0.8, mc_precision: 0.7, mc_coverage: 0.7,
      mc_freshness: 0.8, mc_composite: 0.75,
    },
    {},
    { control_class: 'PROXIMATE_EXT', control_score: 0.6, effective_control: 0.6, observability_score: 0.8, response_window_days: 30 },
  );
}

export async function getCustomerRelationshipAsset(id: string) { return getNode('CustomerRelationshipAsset', id); }
export async function listCustomerRelationshipAssets(entityId: string) { return listNodesByEntity('CustomerRelationshipAsset', entityId); }
export async function updateCustomerRelationshipAsset(id: string, u: Record<string, unknown>) { return updateNode('CustomerRelationshipAsset', id, u); }
export async function deleteCustomerRelationshipAsset(id: string) { return deleteNode('CustomerRelationshipAsset', id); }

// ============================================================
// WorkforceAsset CRUD
// ============================================================

export async function createWorkforceAsset(params: {
  entityId: string;
  label: string;
  enps?: number;
  engagementScore?: number;
  turnoverRate?: number;
  absenteeismRate?: number;
  internalFillRate?: number;
}): Promise<string> {
  return createNode(
    'WorkforceAsset',
    {
      entity_id: params.entityId,
      label: params.label,
      enps: params.enps ?? null,
      engagement_score: params.engagementScore ?? null,
      turnover_rate: params.turnoverRate ?? null,
      absenteeism_rate: params.absenteeismRate ?? null,
      internal_fill_rate: params.internalFillRate ?? null,
      mc_validity: 0.7, mc_precision: 0.7, mc_coverage: 0.6,
      mc_freshness: 0.7, mc_composite: 0.675,
    },
    {},
    { control_class: 'DELEGATED', control_score: 0.7, effective_control: 0.7, observability_score: 0.7, response_window_days: 60 },
  );
}

export async function getWorkforceAsset(id: string) { return getNode('WorkforceAsset', id); }
export async function listWorkforceAssets(entityId: string) { return listNodesByEntity('WorkforceAsset', entityId); }
export async function updateWorkforceAsset(id: string, u: Record<string, unknown>) { return updateNode('WorkforceAsset', id, u); }
export async function deleteWorkforceAsset(id: string) { return deleteNode('WorkforceAsset', id); }

// ============================================================
// StakeholderAsset CRUD
// ============================================================

export async function createStakeholderAsset(params: {
  entityId: string;
  label: string;
  stakeholderType: string;
  toleranceBandPct: number;
}): Promise<string> {
  return createNode('StakeholderAsset', {
    entity_id: params.entityId,
    label: params.label,
    stakeholder_type: params.stakeholderType,
    tolerance_band_pct: params.toleranceBandPct,
  }, {}, { control_class: 'PROXIMATE_EXT', control_score: 0.5, effective_control: 0.5, observability_score: 0.6, response_window_days: 14 });
}

export async function getStakeholderAsset(id: string) { return getNode('StakeholderAsset', id); }
export async function listStakeholderAssets(entityId: string) { return listNodesByEntity('StakeholderAsset', entityId); }
export async function updateStakeholderAsset(id: string, u: Record<string, unknown>) { return updateNode('StakeholderAsset', id, u); }
export async function deleteStakeholderAsset(id: string) { return deleteNode('StakeholderAsset', id); }

// ============================================================
// SocialConstraint CRUD
// ============================================================

export async function createSocialConstraint(params: {
  entityId: string;
  label: string;
  constraintType: string;
  violationRiskScore: number;
  rationale: string;
}): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (n:SocialConstraint {
      id: $id, entity_id: $entityId, label: $label,
      constraint_type: $constraintType,
      violation_risk_score: $violationRiskScore,
      rationale: $rationale,
      created_at: datetime(), updated_at: datetime()
    })`,
    { id, entityId: params.entityId, label: params.label, constraintType: params.constraintType, violationRiskScore: params.violationRiskScore, rationale: params.rationale },
  );
  return id;
}

export async function getSocialConstraint(id: string) { return getNode('SocialConstraint', id); }
export async function listSocialConstraints(entityId: string) { return listNodesByEntity('SocialConstraint', entityId); }
export async function updateSocialConstraint(id: string, u: Record<string, unknown>) { return updateNode('SocialConstraint', id, u); }
export async function deleteSocialConstraint(id: string) { return deleteNode('SocialConstraint', id); }

// ============================================================
// Obligation CRUD
// ============================================================

export async function createObligation(params: {
  entityId: string;
  label: string;
  obligationType: string;
  dueDate: string;
  nonComplianceRisk: number;
  penaltyExposure: number;
  recurrence?: string;
}): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (n:Obligation {
      id: $id, entity_id: $entityId, label: $label,
      must_do: true,
      obligation_type: $obligationType,
      due_date: date($dueDate),
      recurrence: $recurrence,
      non_compliance_risk: $nonComplianceRisk,
      penalty_exposure: $penaltyExposure,
      status: 'PENDING',
      created_at: datetime(), updated_at: datetime()
    })`,
    { id, entityId: params.entityId, label: params.label, obligationType: params.obligationType, dueDate: params.dueDate, recurrence: params.recurrence ?? null, nonComplianceRisk: params.nonComplianceRisk, penaltyExposure: params.penaltyExposure },
  );
  return id;
}

export async function getObligation(id: string) { return getNode('Obligation', id); }
export async function listObligations(entityId: string) { return listNodesByEntity('Obligation', entityId); }
export async function updateObligation(id: string, u: Record<string, unknown>) { return updateNode('Obligation', id, u); }
export async function deleteObligation(id: string) { return deleteNode('Obligation', id); }

// ============================================================
// CashFlowEvent CRUD
// ============================================================

export async function createCashFlowEvent(params: {
  entityId: string;
  label: string;
  direction: 'INFLOW' | 'OUTFLOW';
  amount: number;
  currency: string;
  scheduledDate: string;
  earliestDate: string;
  latestDate: string;
  counterpartyId: string;
  relationshipSensitivity: number;
}): Promise<string> {
  return createNode('CashFlowEvent', {
    entity_id: params.entityId,
    label: params.label,
    direction: params.direction,
    amount: params.amount,
    currency: params.currency,
    functional_amount: params.amount,
    scheduled_date: params.scheduledDate,
    earliest_date: params.earliestDate,
    latest_date: params.latestDate,
    counterparty_id: params.counterpartyId,
    relationship_sensitivity: params.relationshipSensitivity,
    transaction_currency: params.currency,
    status: 'PENDING',
  });
}

export async function getCashFlowEvent(id: string) { return getNode('CashFlowEvent', id); }
export async function listCashFlowEvents(entityId: string) { return listNodesByEntity('CashFlowEvent', entityId); }
export async function updateCashFlowEvent(id: string, u: Record<string, unknown>) { return updateNode('CashFlowEvent', id, u); }
export async function deleteCashFlowEvent(id: string) { return deleteNode('CashFlowEvent', id); }

// ============================================================
// Generic edge helpers
// ============================================================

export interface EdgeRecord {
  sourceId: string;
  targetId: string;
  sourceLabel: string;
  targetLabel: string;
  [key: string]: unknown;
}

async function getEdges<T extends EdgeRecord>(
  edgeType: string,
  sourceId: string,
): Promise<T[]> {
  const results = await runCypher<T>(
    `MATCH (s {id: $sourceId})-[r:${edgeType}]->(t)
     RETURN s.id AS sourceId, labels(s)[0] AS sourceLabel,
            t.id AS targetId, labels(t)[0] AS targetLabel,
            properties(r) AS props`,
    { sourceId },
  );
  return results.map((r: any) => ({ ...r.props, sourceId: r.sourceId, targetId: r.targetId, sourceLabel: r.sourceLabel, targetLabel: r.targetLabel })) as T[];
}

async function getIncomingEdges<T extends EdgeRecord>(
  edgeType: string,
  targetId: string,
): Promise<T[]> {
  const results = await runCypher<T>(
    `MATCH (s)-[r:${edgeType}]->(t {id: $targetId})
     RETURN s.id AS sourceId, labels(s)[0] AS sourceLabel,
            t.id AS targetId, labels(t)[0] AS targetLabel,
            properties(r) AS props`,
    { targetId },
  );
  return results.map((r: any) => ({ ...r.props, sourceId: r.sourceId, targetId: r.targetId, sourceLabel: r.sourceLabel, targetLabel: r.targetLabel })) as T[];
}

async function updateEdge(
  edgeType: string,
  sourceId: string,
  targetId: string,
  updates: Record<string, unknown>,
): Promise<boolean> {
  const keys = Object.keys(updates);
  if (keys.length === 0) return false;
  const setParts = keys.map((k) => `r.${k} = $${k}`);

  const result = await runCypher<{ sid: string }>(
    `MATCH (s {id: $sourceId})-[r:${edgeType}]->(t {id: $targetId})
     SET ${setParts.join(', ')}
     RETURN s.id AS sid`,
    { sourceId, targetId, ...updates },
  );
  return result.length > 0;
}

async function deleteEdge(
  edgeType: string,
  sourceId: string,
  targetId: string,
): Promise<boolean> {
  const exists = await runCypher<{ sid: string }>(
    `MATCH (s {id: $sourceId})-[r:${edgeType}]->(t {id: $targetId})
     RETURN s.id AS sid`,
    { sourceId, targetId },
  );
  if (exists.length === 0) return false;
  await runCypher(
    `MATCH (s {id: $sourceId})-[r:${edgeType}]->(t {id: $targetId})
     DELETE r`,
    { sourceId, targetId },
  );
  return true;
}

// ============================================================
// CONTRIBUTES_TO edge (full property support)
// ============================================================

export async function createContributesToEdge(params: {
  sourceId: string;
  targetId: string;
  weight: number;
  confidence: number;
  lagDays?: number;
  contributionFunction?: string;
  thresholdValue?: number;
  elasticity?: number;
  isCrossAssetEdge?: boolean;
  aiInferred?: boolean;
}): Promise<void> {
  const lagDays = params.lagDays ?? 0;
  // DCF-like temporal discount: 1 - rate × lag_days / 365
  const temporalValuePct = Math.max(0, 1 - 0.1 * lagDays / 365);

  await runCypher(
    `MATCH (source {id: $sourceId})
     MATCH (target {id: $targetId})
     CREATE (source)-[:CONTRIBUTES_TO {
       weight: $weight, confidence: $confidence,
       lag_days: $lagDays,
       temporal_value_pct: $temporalValuePct,
       ai_inferred: $aiInferred,
       contribution_function: $contributionFunction,
       threshold_value: $thresholdValue,
       elasticity: $elasticity,
       is_cross_asset_edge: $isCrossAssetEdge,
       ontology_bridge: false
     }]->(target)`,
    {
      sourceId: params.sourceId,
      targetId: params.targetId,
      weight: params.weight,
      confidence: params.confidence,
      lagDays,
      temporalValuePct,
      aiInferred: params.aiInferred ?? false,
      contributionFunction: params.contributionFunction ?? 'LINEAR',
      thresholdValue: params.thresholdValue ?? null,
      elasticity: params.elasticity ?? null,
      isCrossAssetEdge: params.isCrossAssetEdge ?? false,
    },
  );
}

export async function getContributesToEdges(sourceId: string) {
  return getEdges('CONTRIBUTES_TO', sourceId);
}

export async function getIncomingContributesToEdges(targetId: string) {
  return getIncomingEdges('CONTRIBUTES_TO', targetId);
}

export async function updateContributesToEdge(
  sourceId: string,
  targetId: string,
  updates: Record<string, unknown>,
): Promise<boolean> {
  return updateEdge('CONTRIBUTES_TO', sourceId, targetId, updates);
}

export async function deleteContributesToEdge(
  sourceId: string,
  targetId: string,
): Promise<boolean> {
  return deleteEdge('CONTRIBUTES_TO', sourceId, targetId);
}

// ============================================================
// DEPENDS_ON edge
// ============================================================

export async function createDependsOnEdge(params: {
  sourceId: string;
  targetId: string;
  dependencyClass: string;
  description: string;
}): Promise<void> {
  await runCypher(
    `MATCH (source {id: $sourceId})
     MATCH (target {id: $targetId})
     CREATE (source)-[:DEPENDS_ON {
       dependency_class: $dependencyClass,
       dependency_description: $description
     }]->(target)`,
    { sourceId: params.sourceId, targetId: params.targetId, dependencyClass: params.dependencyClass, description: params.description },
  );
}

export async function getDependsOnEdges(sourceId: string) {
  return getEdges('DEPENDS_ON', sourceId);
}

export async function updateDependsOnEdge(
  sourceId: string, targetId: string, updates: Record<string, unknown>,
): Promise<boolean> {
  return updateEdge('DEPENDS_ON', sourceId, targetId, updates);
}

export async function deleteDependsOnEdge(sourceId: string, targetId: string): Promise<boolean> {
  return deleteEdge('DEPENDS_ON', sourceId, targetId);
}

// ============================================================
// DELEGATES_TO edge
// ============================================================

export async function createDelegatesToEdge(params: {
  sourceId: string;
  targetId: string;
  controlAttenuation: number;
  slaReference?: string;
}): Promise<void> {
  await runCypher(
    `MATCH (source {id: $sourceId})
     MATCH (target {id: $targetId})
     CREATE (source)-[:DELEGATES_TO {
       control_attenuation: $controlAttenuation,
       sla_reference: $slaReference
     }]->(target)`,
    { sourceId: params.sourceId, targetId: params.targetId, controlAttenuation: params.controlAttenuation, slaReference: params.slaReference ?? null },
  );
}

export async function getDelegatesToEdges(sourceId: string) {
  return getEdges('DELEGATES_TO', sourceId);
}

export async function updateDelegatesToEdge(
  sourceId: string, targetId: string, updates: Record<string, unknown>,
): Promise<boolean> {
  return updateEdge('DELEGATES_TO', sourceId, targetId, updates);
}

export async function deleteDelegatesToEdge(sourceId: string, targetId: string): Promise<boolean> {
  return deleteEdge('DELEGATES_TO', sourceId, targetId);
}

// ============================================================
// PROHIBITS edge (SocialConstraint → Activity)
// ============================================================

export async function createProhibitsEdge(params: {
  constraintId: string;
  activityId: string;
  severity: number;
}): Promise<void> {
  await runCypher(
    `MATCH (sc:SocialConstraint {id: $constraintId})
     MATCH (a:Activity {id: $activityId})
     CREATE (sc)-[:PROHIBITS {severity: $severity}]->(a)`,
    { constraintId: params.constraintId, activityId: params.activityId, severity: params.severity },
  );
}

export async function getProhibitsEdges(constraintId: string) {
  return getEdges('PROHIBITS', constraintId);
}

export async function deleteProhibitsEdge(constraintId: string, activityId: string): Promise<boolean> {
  return deleteEdge('PROHIBITS', constraintId, activityId);
}

// ============================================================
// AccountingPeriod CRUD
// ============================================================

export async function createAccountingPeriod(params: {
  entityId: string;
  label: string;
  startDate: string;
  endDate: string;
}): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (p:AccountingPeriod {
      id: $id, entity_id: $entityId, label: $label,
      start_date: date($startDate), end_date: date($endDate),
      status: 'OPEN',
      created_at: datetime(), updated_at: datetime()
    })`,
    { id, entityId: params.entityId, label: params.label, startDate: params.startDate, endDate: params.endDate },
  );
  return id;
}

export async function getAccountingPeriod(id: string) { return getNode('AccountingPeriod', id); }
export async function listAccountingPeriods(entityId: string) { return listNodesByEntity('AccountingPeriod', entityId); }
export async function updateAccountingPeriod(id: string, u: Record<string, unknown>) { return updateNode('AccountingPeriod', id, u); }

// ============================================================
// Fund CRUD
// ============================================================

export async function createFund(params: {
  entityId: string;
  fundType: string;
  label: string;
  restrictionDescription?: string;
}): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (f:Fund {
      id: $id, entity_id: $entityId,
      fund_type: $fundType, label: $label,
      restriction_description: $restrictionDescription,
      created_at: datetime(), updated_at: datetime()
    })`,
    { id, entityId: params.entityId, fundType: params.fundType, label: params.label, restrictionDescription: params.restrictionDescription ?? null },
  );
  return id;
}

export async function getFund(id: string) { return getNode('Fund', id); }
export async function listFunds(entityId: string) { return listNodesByEntity('Fund', entityId); }
export async function updateFund(id: string, u: Record<string, unknown>) { return updateNode('Fund', id, u); }
export async function deleteFund(id: string) { return deleteNode('Fund', id); }
