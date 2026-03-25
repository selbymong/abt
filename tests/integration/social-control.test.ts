/**
 * Social Control Service — Integration Tests
 *
 * Tests PROHIBITS pre-filter and obligation alert system.
 *
 * Requires: Neo4j running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import {
  getAllEntities,
  createActivity,
  createSocialConstraint,
  createObligation,
  createProhibitsEdge,
} from '../../src/services/graph/graph-crud-service.js';
import {
  checkProhibitions,
  filterProhibitedActivities,
  getObligationAlerts,
  getEntityObligations,
} from '../../src/services/graph/social-control-service.js';

let testEntityId: string;
const cleanupIds: { label: string; id: string }[] = [];

beforeAll(async () => {
  const entities = await getAllEntities();
  testEntityId = entities[0].id;
});

afterAll(async () => {
  for (const { label, id } of cleanupIds) {
    await runCypher(`MATCH (n:${label} {id: $id}) DETACH DELETE n`, { id });
  }
  await closeNeo4j();
});

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

describe('Social Control — PROHIBITS Pre-filter', () => {
  let freeActivityId: string;
  let blockedActivityId: string;
  let constraintId: string;

  beforeAll(async () => {
    freeActivityId = track('Activity', await createActivity({
      entityId: testEntityId,
      label: 'Allowed Activity',
      costMonetary: 5000,
    }));

    blockedActivityId = track('Activity', await createActivity({
      entityId: testEntityId,
      label: 'Blocked Activity',
      costMonetary: 10000,
    }));

    constraintId = track('SocialConstraint', await createSocialConstraint({
      entityId: testEntityId,
      label: 'Environmental Regulation',
      constraintType: 'REGULATORY',
      violationRiskScore: 0.8,
      rationale: 'Activity violates environmental policy',
    }));

    await createProhibitsEdge({
      constraintId,
      activityId: blockedActivityId,
      severity: 0.9,
    });
  });

  it('returns no prohibitions for an unrestricted activity', async () => {
    const result = await checkProhibitions(freeActivityId);
    expect(result.isProhibited).toBe(false);
    expect(result.prohibitions).toHaveLength(0);
  });

  it('returns prohibition details for a blocked activity', async () => {
    const result = await checkProhibitions(blockedActivityId);
    expect(result.isProhibited).toBe(true);
    expect(result.prohibitions).toHaveLength(1);
    expect(result.prohibitions[0].constraintLabel).toBe('Environmental Regulation');
    expect(result.prohibitions[0].severity).toBe(0.9);
    expect(result.prohibitions[0].rationale).toContain('environmental');
  });

  it('batch filters allowed vs prohibited activities', async () => {
    const result = await filterProhibitedActivities([freeActivityId, blockedActivityId]);
    expect(result.allowed).toContain(freeActivityId);
    expect(result.allowed).not.toContain(blockedActivityId);
    expect(result.prohibited).toContain(blockedActivityId);
    expect(result.prohibited).not.toContain(freeActivityId);
  });

  it('handles empty activity list', async () => {
    const result = await filterProhibitedActivities([]);
    expect(result.allowed).toHaveLength(0);
    expect(result.prohibited).toHaveLength(0);
  });

  it('handles multiple constraints on same activity', async () => {
    const constraint2Id = track('SocialConstraint', await createSocialConstraint({
      entityId: testEntityId,
      label: 'Safety Policy',
      constraintType: 'POLICY',
      violationRiskScore: 0.6,
      rationale: 'Safety concern',
    }));

    await createProhibitsEdge({
      constraintId: constraint2Id,
      activityId: blockedActivityId,
      severity: 0.7,
    });

    const result = await checkProhibitions(blockedActivityId);
    expect(result.isProhibited).toBe(true);
    expect(result.prohibitions.length).toBeGreaterThanOrEqual(2);
    // Should be sorted by severity DESC
    expect(result.prohibitions[0].severity).toBeGreaterThanOrEqual(result.prohibitions[1].severity);
  });
});

describe('Social Control — Obligation Alerts', () => {
  let nearDueObligationId: string;

  beforeAll(async () => {
    // Create an obligation due in 15 days
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const dateStr = futureDate.toISOString().split('T')[0];

    nearDueObligationId = track('Obligation', await createObligation({
      entityId: testEntityId,
      label: 'Q2 Tax Filing',
      obligationType: 'TAX',
      dueDate: dateStr,
      nonComplianceRisk: 0.9,
      penaltyExposure: 25000,
    }));

    // Create an obligation due in 90 days (outside default 30-day horizon)
    const farDate = new Date();
    farDate.setDate(farDate.getDate() + 90);
    const farDateStr = farDate.toISOString().split('T')[0];

    track('Obligation', await createObligation({
      entityId: testEntityId,
      label: 'Annual Audit Submission',
      obligationType: 'REGULATORY',
      dueDate: farDateStr,
      nonComplianceRisk: 0.7,
      penaltyExposure: 50000,
    }));
  });

  it('returns alerts for obligations within horizon', async () => {
    const alerts = await getObligationAlerts(testEntityId, 30);
    const taxAlert = alerts.find((a) => a.label === 'Q2 Tax Filing');
    expect(taxAlert).toBeDefined();
    expect(Number(taxAlert!.daysUntilDue)).toBeLessThanOrEqual(30);
    expect(taxAlert!.nonComplianceRisk).toBe(0.9);
  });

  it('excludes obligations beyond horizon', async () => {
    const alerts = await getObligationAlerts(testEntityId, 30);
    const auditAlert = alerts.find((a) => a.label === 'Annual Audit Submission');
    expect(auditAlert).toBeUndefined();
  });

  it('includes far obligations with larger horizon', async () => {
    const alerts = await getObligationAlerts(testEntityId, 120);
    const auditAlert = alerts.find((a) => a.label === 'Annual Audit Submission');
    expect(auditAlert).toBeDefined();
  });

  it('lists all entity obligations', async () => {
    const obligations = await getEntityObligations(testEntityId);
    expect(obligations.length).toBeGreaterThanOrEqual(2);
  });
});
