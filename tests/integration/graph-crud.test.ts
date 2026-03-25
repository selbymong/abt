/**
 * Graph CRUD Service — Integration Test
 *
 * Verifies full CRUD lifecycle for all business graph node types
 * and edge creation against a live Neo4j instance.
 *
 * Requires: Neo4j running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import {
  getAllEntities,
  getEntity,
  createOutcome,
  getOutcome,
  listOutcomes,
  updateOutcome,
  createResource,
  getResource,
  listResources,
  updateResource,
  deleteResource,
  createActivity,
  getActivity,
  listActivities,
  updateActivity,
  deleteActivity,
  createProject,
  getProject,
  listProjects,
  updateProject,
  deleteProject,
  createInitiative,
  getInitiative,
  createMetric,
  getMetric,
  createCapability,
  getCapability,
  createAsset,
  getAsset,
  createCustomerRelationshipAsset,
  getCustomerRelationshipAsset,
  createWorkforceAsset,
  getWorkforceAsset,
  createStakeholderAsset,
  getStakeholderAsset,
  createSocialConstraint,
  getSocialConstraint,
  createObligation,
  getObligation,
  createCashFlowEvent,
  getCashFlowEvent,
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
  deleteDelegatesToEdge,
  createProhibitsEdge,
  getProhibitsEdges,
  deleteProhibitsEdge,
  createAccountingPeriod,
  getAccountingPeriod,
  createFund,
  getFund,
} from '../../src/services/graph/graph-crud-service.js';

let testEntityId: string;
const createdNodeIds: { label: string; id: string }[] = [];

beforeAll(async () => {
  // Get a real entity from the seeded data
  const entities = await getAllEntities();
  expect(entities.length).toBeGreaterThan(0);
  testEntityId = entities[0].id;
});

afterAll(async () => {
  // Clean up all test-created nodes
  for (const { label, id } of createdNodeIds) {
    await runCypher(`MATCH (n:${label} {id: $id}) DETACH DELETE n`, { id });
  }
  await closeNeo4j();
});

function track(label: string, id: string) {
  createdNodeIds.push({ label, id });
  return id;
}

describe('Graph CRUD — Entities (read-only)', () => {
  it('lists all seeded entities', async () => {
    const entities = await getAllEntities();
    expect(entities.length).toBe(4); // 4 seeded entities
  });

  it('gets a single entity by id', async () => {
    const entity = await getEntity(testEntityId);
    expect(entity).not.toBeNull();
    expect(entity!.id).toBe(testEntityId);
    expect(entity!.entity_type).toBeDefined();
  });

  it('returns null for non-existent entity', async () => {
    const entity = await getEntity('00000000-0000-0000-0000-000000000000');
    expect(entity).toBeNull();
  });
});

describe('Graph CRUD — Outcome (with ontology validation)', () => {
  it('creates an Outcome matching entity ontology', async () => {
    const entity = await getEntity(testEntityId);
    const ontology = entity!.outcome_ontology;
    const outcomeType = ontology === 'FINANCIAL' ? 'IMPROVE_REVENUE' : 'DELIVER_MISSION';

    const id = await createOutcome({
      entityId: testEntityId,
      label: 'Test Outcome',
      ontology: ontology as any,
      outcomeType: outcomeType as any,
      targetDelta: 100000,
      currency: 'CAD',
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
    });
    track('Outcome', id);

    const outcome = await getOutcome(id);
    expect(outcome).not.toBeNull();
    expect(outcome!.label).toBe('Test Outcome');
    expect(outcome!.ontology).toBe(ontology);
  });

  it('rejects Outcome with mismatched ontology', async () => {
    const entity = await getEntity(testEntityId);
    const wrongOntology = entity!.outcome_ontology === 'FINANCIAL' ? 'MISSION' : 'FINANCIAL';

    await expect(
      createOutcome({
        entityId: testEntityId,
        label: 'Bad Outcome',
        ontology: wrongOntology as any,
        outcomeType: 'IMPROVE_REVENUE' as any,
        targetDelta: 100,
        currency: 'CAD',
        periodStart: '2026-01-01',
        periodEnd: '2026-12-31',
      }),
    ).rejects.toThrow();
  });

  it('lists Outcomes by entity and updates them', async () => {
    const outcomes = await listOutcomes(testEntityId);
    expect(outcomes.length).toBeGreaterThan(0);

    const id = outcomes[0].id;
    const updated = await updateOutcome(id, { target_delta: 200000 });
    expect(updated).toBe(true);

    const refreshed = await getOutcome(id);
    expect(refreshed!.target_delta).toBe(200000);
  });
});

describe('Graph CRUD — Resource', () => {
  it('creates, reads, updates, deletes a Resource', async () => {
    const id = track('Resource', await createResource({
      entityId: testEntityId,
      label: 'Test Resource',
      resourceType: 'OPEX' as any,
      allocationPct: 0.5,
      costMonetary: 50000,
      currency: 'CAD',
    }));

    const resource = await getResource(id);
    expect(resource).not.toBeNull();

    const updated = await updateResource(id, { allocation_pct: 0.8 });
    expect(updated).toBe(true);

    const deleted = await deleteResource(id);
    expect(deleted).toBe(true);

    // Remove from cleanup since already deleted
    createdNodeIds.pop();
  });
});

describe('Graph CRUD — Activity', () => {
  it('creates and lists Activities', async () => {
    const id = track('Activity', await createActivity({
      entityId: testEntityId,
      label: 'Test Activity',
      costMonetary: 10000,
      status: 'PLANNED' as any,
    }));

    const activity = await getActivity(id);
    expect(activity).not.toBeNull();

    const activities = await listActivities(testEntityId);
    const found = activities.find((a: any) => a.id === id);
    expect(found).toBeDefined();
  });
});

describe('Graph CRUD — Project & Initiative', () => {
  it('creates Project and Initiative', async () => {
    const initId = track('Initiative', await createInitiative({
      entityId: testEntityId,
      label: 'Test Initiative',
      budget: 500000,
      timeHorizonMonths: 12,
    }));

    const projId = track('Project', await createProject({
      entityId: testEntityId,
      label: 'Test Project',
      budget: 100000,
      initiativeId: initId,
    }));

    const initiative = await getInitiative(initId);
    expect(initiative).not.toBeNull();

    const project = await getProject(projId);
    expect(project).not.toBeNull();
  });
});

describe('Graph CRUD — Metric, Capability, Asset', () => {
  it('creates a Metric with measurement quality scores', async () => {
    const id = track('Metric', await createMetric({
      entityId: testEntityId,
      label: 'Revenue Growth Rate',
      metricType: 'RATIO' as any,
      currentValue: 0.15,
      targetValue: 0.25,
      unit: 'pct',
    }));

    const metric = await getMetric(id);
    expect(metric).not.toBeNull();
  });

  it('creates a Capability', async () => {
    const id = track('Capability', await createCapability({
      entityId: testEntityId,
      label: 'Data Analytics',
      capabilityLevel: 'ADVANCED' as any,
      buildCost: 75000,
    }));

    const cap = await getCapability(id);
    expect(cap).not.toBeNull();
  });

  it('creates an Asset', async () => {
    const id = track('Asset', await createAsset({
      entityId: testEntityId,
      label: 'Office Building',
      assetType: 'TANGIBLE' as any,
      bookValue: 2000000,
      depreciationRate: 0.04,
    }));

    const asset = await getAsset(id);
    expect(asset).not.toBeNull();
  });
});

describe('Graph CRUD — Intangible Assets', () => {
  it('creates CustomerRelationshipAsset with control defaults', async () => {
    const id = track('CustomerRelationshipAsset', await createCustomerRelationshipAsset({
      entityId: testEntityId,
      label: 'Enterprise Clients',
      nps: 72,
      churnRate: 0.05,
    }));

    const cra = await getCustomerRelationshipAsset(id);
    expect(cra).not.toBeNull();
  });

  it('creates WorkforceAsset with delegated control', async () => {
    const id = track('WorkforceAsset', await createWorkforceAsset({
      entityId: testEntityId,
      label: 'Engineering Team',
      enps: 45,
      engagementScore: 0.82,
      turnoverRate: 0.12,
    }));

    const wa = await getWorkforceAsset(id);
    expect(wa).not.toBeNull();
  });

  it('creates StakeholderAsset', async () => {
    const id = track('StakeholderAsset', await createStakeholderAsset({
      entityId: testEntityId,
      label: 'Board of Directors',
      stakeholderType: 'GOVERNANCE',
      toleranceBandPct: 0.1,
    }));

    const sa = await getStakeholderAsset(id);
    expect(sa).not.toBeNull();
  });
});

describe('Graph CRUD — SocialConstraint & Obligation', () => {
  it('creates a SocialConstraint', async () => {
    const id = track('SocialConstraint', await createSocialConstraint({
      entityId: testEntityId,
      label: 'Environmental Policy',
      constraintType: 'REGULATORY',
      violationRiskScore: 0.3,
      rationale: 'Environmental compliance requirement',
    }));

    const sc = await getSocialConstraint(id);
    expect(sc).not.toBeNull();
  });

  it('creates an Obligation', async () => {
    const id = track('Obligation', await createObligation({
      entityId: testEntityId,
      label: 'Q1 Tax Filing',
      obligationType: 'TAX',
      dueDate: '2026-04-30',
      nonComplianceRisk: 0.8,
      penaltyExposure: 50000,
    }));

    const ob = await getObligation(id);
    expect(ob).not.toBeNull();
  });
});

describe('Graph CRUD — CashFlowEvent', () => {
  it('creates a CashFlowEvent', async () => {
    const id = track('CashFlowEvent', await createCashFlowEvent({
      entityId: testEntityId,
      label: 'Client Invoice Payment',
      direction: 'INFLOW',
      amount: 25000,
      currency: 'CAD',
      scheduledDate: '2026-04-15',
      earliestDate: '2026-04-10',
      latestDate: '2026-04-30',
      counterpartyId: testEntityId,
      relationshipSensitivity: 0.6,
    }));

    const cfe = await getCashFlowEvent(id);
    expect(cfe).not.toBeNull();
  });
});

describe('Graph CRUD — AccountingPeriod & Fund', () => {
  it('creates an AccountingPeriod', async () => {
    const id = track('AccountingPeriod', await createAccountingPeriod({
      entityId: testEntityId,
      label: 'Q1 2026',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    }));

    const period = await getAccountingPeriod(id);
    expect(period).not.toBeNull();
  });

  it('creates a Fund', async () => {
    const id = track('Fund', await createFund({
      entityId: testEntityId,
      fundType: 'UNRESTRICTED',
      label: 'General Fund',
    }));

    const fund = await getFund(id);
    expect(fund).not.toBeNull();
  });
});

describe('Graph CRUD — Edge Management', () => {
  let activityId: string;
  let activity2Id: string;
  let activity3Id: string;
  let outcomeId: string;
  let constraintId: string;

  beforeAll(async () => {
    const entity = await getEntity(testEntityId);
    const ontology = entity!.outcome_ontology;
    const outcomeType = ontology === 'FINANCIAL' ? 'IMPROVE_REVENUE' : 'DELIVER_MISSION';

    activityId = track('Activity', await createActivity({
      entityId: testEntityId,
      label: 'Edge Test Activity',
      costMonetary: 5000,
    }));

    activity2Id = track('Activity', await createActivity({
      entityId: testEntityId,
      label: 'Dependent Activity',
      costMonetary: 3000,
    }));

    activity3Id = track('Activity', await createActivity({
      entityId: testEntityId,
      label: 'Delegated Activity',
    }));

    outcomeId = track('Outcome', await createOutcome({
      entityId: testEntityId,
      label: 'Edge Test Outcome',
      ontology: ontology as any,
      outcomeType: outcomeType as any,
      targetDelta: 50000,
      currency: 'CAD',
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
    }));

    constraintId = track('SocialConstraint', await createSocialConstraint({
      entityId: testEntityId,
      label: 'Edge Test Constraint',
      constraintType: 'POLICY',
      violationRiskScore: 0.5,
      rationale: 'Test policy',
    }));
  });

  // --- CONTRIBUTES_TO full lifecycle ---

  it('creates CONTRIBUTES_TO with full properties (threshold, elasticity)', async () => {
    await createContributesToEdge({
      sourceId: activityId,
      targetId: outcomeId,
      weight: 0.8,
      confidence: 0.9,
      lagDays: 30,
      contributionFunction: 'THRESHOLD',
      thresholdValue: 0.55,
      elasticity: 1.2,
    });

    const edges = await runCypher<{ w: number; cf: string; tv: number; el: number }>(
      `MATCH (:Activity {id: $aId})-[r:CONTRIBUTES_TO]->(:Outcome {id: $oId})
       RETURN r.weight AS w, r.contribution_function AS cf,
              r.threshold_value AS tv, r.elasticity AS el`,
      { aId: activityId, oId: outcomeId },
    );
    expect(edges).toHaveLength(1);
    expect(edges[0].w).toBe(0.8);
    expect(edges[0].cf).toBe('THRESHOLD');
    expect(edges[0].tv).toBe(0.55);
    expect(edges[0].el).toBe(1.2);
  });

  it('computes temporal_value_pct from lag_days', async () => {
    const edges = await runCypher<{ tvp: number; ld: number }>(
      `MATCH (:Activity {id: $aId})-[r:CONTRIBUTES_TO]->(:Outcome {id: $oId})
       RETURN r.temporal_value_pct AS tvp, r.lag_days AS ld`,
      { aId: activityId, oId: outcomeId },
    );
    // temporal_value_pct = max(0, 1 - 0.1 * 30 / 365) ≈ 0.9918
    expect(edges[0].ld).toBe(30);
    expect(edges[0].tvp).toBeCloseTo(1 - 0.1 * 30 / 365, 4);
  });

  it('lists outgoing CONTRIBUTES_TO edges from a source', async () => {
    const edges = await getContributesToEdges(activityId);
    expect(edges.length).toBeGreaterThanOrEqual(1);
    const toOutcome = edges.find((e: any) => e.targetId === outcomeId);
    expect(toOutcome).toBeDefined();
    expect(toOutcome!.weight).toBe(0.8);
  });

  it('lists incoming CONTRIBUTES_TO edges to a target', async () => {
    const edges = await getIncomingContributesToEdges(outcomeId);
    expect(edges.length).toBeGreaterThanOrEqual(1);
    const fromActivity = edges.find((e: any) => e.sourceId === activityId);
    expect(fromActivity).toBeDefined();
  });

  it('updates CONTRIBUTES_TO edge weight and confidence', async () => {
    const updated = await updateContributesToEdge(activityId, outcomeId, {
      weight: 0.6,
      confidence: 0.95,
    });
    expect(updated).toBe(true);

    const edges = await runCypher<{ w: number; c: number }>(
      `MATCH (:Activity {id: $aId})-[r:CONTRIBUTES_TO]->(:Outcome {id: $oId})
       RETURN r.weight AS w, r.confidence AS c`,
      { aId: activityId, oId: outcomeId },
    );
    expect(edges[0].w).toBe(0.6);
    expect(edges[0].c).toBe(0.95);
  });

  it('deletes CONTRIBUTES_TO edge', async () => {
    const deleted = await deleteContributesToEdge(activityId, outcomeId);
    expect(deleted).toBe(true);

    const edges = await runCypher(
      `MATCH (:Activity {id: $aId})-[r:CONTRIBUTES_TO]->(:Outcome {id: $oId}) RETURN r`,
      { aId: activityId, oId: outcomeId },
    );
    expect(edges).toHaveLength(0);
  });

  it('returns false when deleting non-existent CONTRIBUTES_TO edge', async () => {
    const deleted = await deleteContributesToEdge(activityId, outcomeId);
    expect(deleted).toBe(false);
  });

  // --- DEPENDS_ON lifecycle ---

  it('creates and lists DEPENDS_ON edges', async () => {
    await createDependsOnEdge({
      sourceId: activity2Id,
      targetId: activityId,
      dependencyClass: 'BLOCKING',
      description: 'Must complete first activity',
    });

    const edges = await getDependsOnEdges(activity2Id);
    expect(edges.length).toBeGreaterThanOrEqual(1);
    const dep = edges.find((e: any) => e.targetId === activityId);
    expect(dep).toBeDefined();
    expect(dep!.dependency_class).toBe('BLOCKING');
  });

  it('updates DEPENDS_ON edge', async () => {
    const updated = await updateDependsOnEdge(activity2Id, activityId, {
      dependency_class: 'SOFT',
    });
    expect(updated).toBe(true);
  });

  it('deletes DEPENDS_ON edge', async () => {
    const deleted = await deleteDependsOnEdge(activity2Id, activityId);
    expect(deleted).toBe(true);

    const edges = await getDependsOnEdges(activity2Id);
    const dep = edges.find((e: any) => e.targetId === activityId);
    expect(dep).toBeUndefined();
  });

  // --- DELEGATES_TO lifecycle ---

  it('creates and lists DELEGATES_TO edges', async () => {
    await createDelegatesToEdge({
      sourceId: activityId,
      targetId: activity3Id,
      controlAttenuation: 0.7,
      slaReference: 'SLA-001',
    });

    const edges = await getDelegatesToEdges(activityId);
    expect(edges.length).toBeGreaterThanOrEqual(1);
    const del = edges.find((e: any) => e.targetId === activity3Id);
    expect(del).toBeDefined();
    expect(del!.control_attenuation).toBe(0.7);
    expect(del!.sla_reference).toBe('SLA-001');
  });

  it('deletes DELEGATES_TO edge', async () => {
    const deleted = await deleteDelegatesToEdge(activityId, activity3Id);
    expect(deleted).toBe(true);
  });

  // --- PROHIBITS lifecycle ---

  it('creates and lists PROHIBITS edges', async () => {
    await createProhibitsEdge({
      constraintId,
      activityId,
      severity: 0.9,
    });

    const edges = await getProhibitsEdges(constraintId);
    expect(edges.length).toBeGreaterThanOrEqual(1);
    const p = edges.find((e: any) => e.targetId === activityId);
    expect(p).toBeDefined();
    expect(p!.severity).toBe(0.9);
  });

  it('deletes PROHIBITS edge', async () => {
    const deleted = await deleteProhibitsEdge(constraintId, activityId);
    expect(deleted).toBe(true);
  });
});
