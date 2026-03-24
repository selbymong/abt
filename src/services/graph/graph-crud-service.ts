import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { OntologyBoundaryViolation } from '../../lib/errors.js';
import type {
  Entity, Outcome, OutcomeOntology, OutcomeType,
  NodeStatus, ResourceType, MetricType, CapabilityLevel, AssetType,
} from '../../schema/neo4j/types.js';

// --- Entity CRUD ---

export async function getEntity(id: string): Promise<Entity | null> {
  const results = await runCypher<{ e: Entity }>(
    'MATCH (e:Entity {id: $id}) RETURN e',
    { id },
  );
  return results[0]?.e ?? null;
}

export async function getAllEntities(): Promise<Entity[]> {
  const results = await runCypher<{ e: Entity }>(
    'MATCH (e:Entity) RETURN e ORDER BY e.label',
  );
  return results.map((r) => r.e);
}

// --- Outcome CRUD with ontology validation ---

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
  // Validate ontology matches entity
  const entity = await getEntity(params.entityId);
  if (entity && entity.outcome_ontology !== params.ontology) {
    throw new OntologyBoundaryViolation(entity.outcome_ontology, params.ontology);
  }

  // Validate outcome_type matches ontology
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
      control_class: 'PROXIMATE_EXT', control_score: 0.6,
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

// --- Activity CRUD ---

export async function createActivity(params: {
  entityId: string;
  label: string;
  projectId?: string;
  initiativeId?: string;
}): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (a:Activity {
      id: $id, label: $label, entity_id: $entityId,
      status: 'PLANNED', cost_monetary: 0, cost_time_hours: null,
      start_date: null, end_date: null,
      project_id: $projectId, initiative_id: $initiativeId,
      value_state: 'FORECASTED', uncertainty_type: 'EPISTEMIC',
      uncertainty_score: 0.7, calibration_factor: 1.0,
      control_class: 'DIRECT', control_score: 1.0,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      label: params.label,
      entityId: params.entityId,
      projectId: params.projectId ?? null,
      initiativeId: params.initiativeId ?? null,
    },
  );
  return id;
}

// --- CONTRIBUTES_TO edge ---

export async function createContributesToEdge(params: {
  sourceId: string;
  targetId: string;
  weight: number;
  confidence: number;
  lagDays?: number;
  contributionFunction?: string;
}): Promise<void> {
  await runCypher(
    `MATCH (source {id: $sourceId})
     MATCH (target {id: $targetId})
     CREATE (source)-[:CONTRIBUTES_TO {
       weight: $weight, confidence: $confidence,
       lag_days: $lagDays, temporal_value_pct: 1.0,
       ai_inferred: false,
       contribution_function: $contributionFunction,
       is_cross_asset_edge: false, ontology_bridge: false
     }]->(target)`,
    {
      sourceId: params.sourceId,
      targetId: params.targetId,
      weight: params.weight,
      confidence: params.confidence,
      lagDays: params.lagDays ?? 0,
      contributionFunction: params.contributionFunction ?? 'LINEAR',
    },
  );
}

// --- AccountingPeriod CRUD ---

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
    {
      id,
      entityId: params.entityId,
      label: params.label,
      startDate: params.startDate,
      endDate: params.endDate,
    },
  );
  return id;
}

// --- Fund CRUD ---

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
    {
      id,
      entityId: params.entityId,
      fundType: params.fundType,
      label: params.label,
      restrictionDescription: params.restrictionDescription ?? null,
    },
  );
  return id;
}
