/**
 * Tax Credit AI Feedback Loop — Integration Tests
 *
 * Tests QUALIFIES_FOR edge CRUD, reviewer feedback (accept/reject),
 * feedback aggregation, model refinement, re-identification, and accuracy metrics.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { v4 as uuid } from 'uuid';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities } from '../../src/services/graph/graph-crud-service.js';
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
} from '../../src/services/tax/tax-credit-ai-service.js';

let testEntityId: string;
let testPeriodId: string;
let claimId: string;
let programId: string;
const activityIds: string[] = [];

beforeAll(async () => {
  const entities = await getAllEntities();
  const fpEntity = entities.find((e) => e.entity_type === 'FOR_PROFIT');
  testEntityId = fpEntity!.id;

  const periods = await runCypher<{ id: string }>(
    `MATCH (p:AccountingPeriod {entity_id: $entityId, status: 'OPEN'})
     RETURN p.id AS id LIMIT 1`,
    { entityId: testEntityId },
  );
  testPeriodId = periods[0].id;

  // Get SR&ED program id
  const programs = await runCypher<{ id: string }>(
    `MATCH (p:TaxCreditProgram {program_code: 'CA-SRED'})
     RETURN p.id AS id`,
    {},
  );
  programId = programs[0].id;

  // Create test activities with varying labels
  const activities = [
    { label: 'Advanced Research Lab Equipment', cost: 50000 },
    { label: 'Experimental Prototype Development', cost: 30000 },
    { label: 'Office Furniture Purchase', cost: 5000 },
    { label: 'Marketing Campaign Design', cost: 15000 },
    { label: 'Scientific Data Analysis Tool', cost: 25000 },
  ];

  for (const act of activities) {
    const id = uuid();
    activityIds.push(id);
    await runCypher(
      `CREATE (a:Activity {
        id: $id, entity_id: $entityId, label: $label,
        cost_monetary: $cost, status: 'IN_PROGRESS',
        created_at: datetime(), updated_at: datetime()
      })`,
      { id, entityId: testEntityId, label: act.label, cost: act.cost },
    );
  }

  // Create a test TaxCreditClaim
  claimId = uuid();
  await runCypher(
    `MATCH (prog:TaxCreditProgram {program_code: 'CA-SRED'})
     CREATE (c:TaxCreditClaim {
       id: $id, entity_id: $entityId, program_id: $programId,
       period_id: $periodId, fiscal_year: '2025',
       claim_status: 'DRAFT',
       eligible_expenditure_total: 125000,
       credit_amount_claimed: 18750,
       refundable_portion: 7500, non_refundable_portion: 11250,
       applied_to_tax: 0, carried_forward: 0, carried_back: 0, cash_received: 0,
       eligible_node_ids: $nodeIds,
       ai_confidence: 0.75,
       created_at: datetime(), updated_at: datetime()
     })
     CREATE (c)-[:CLAIMED_UNDER]->(prog)`,
    {
      id: claimId,
      entityId: testEntityId,
      programId,
      periodId: testPeriodId,
      nodeIds: activityIds,
    },
  );
});

afterAll(async () => {
  // Clean up QUALIFIES_FOR edges
  await runCypher(
    `MATCH ()-[r:QUALIFIES_FOR]->(c:TaxCreditClaim {id: $claimId}) DELETE r`,
    { claimId },
  );
  // Clean up claim
  await runCypher(
    `MATCH (c:TaxCreditClaim {id: $claimId})-[r:CLAIMED_UNDER]->() DELETE r`,
    { claimId },
  );
  await runCypher(`MATCH (c:TaxCreditClaim {id: $claimId}) DELETE c`, { claimId });
  // Clean up activities
  for (const id of activityIds) {
    await runCypher(`MATCH (a:Activity {id: $id}) DETACH DELETE a`, { id });
  }

  clearRefinedModel('CA-SRED');
  await closeNeo4j();
  await closePg();
  await closeKafka();
});

// ============================================================
// QUALIFIES_FOR Edge CRUD
// ============================================================

describe('QUALIFIES_FOR Edge', () => {
  it('creates a QUALIFIES_FOR edge', async () => {
    await createQualifiesForEdge({
      sourceNodeId: activityIds[0],
      claimId,
      qualificationBasis: 'AI_INFERRED',
      eligibleAmount: 50000,
      eligibilityConfidence: 0.85,
      expenditureCategory: 'CAPITAL',
    });

    const edges = await listQualifiesForEdges(claimId);
    expect(edges.length).toBe(1);
    expect(edges[0].sourceNodeId).toBe(activityIds[0]);
    expect(edges[0].eligibleAmount).toBe(50000);
    expect(edges[0].eligibilityConfidence).toBe(0.85);
    expect(edges[0].reviewerAccepted).toBeNull();
  });

  it('creates multiple QUALIFIES_FOR edges for same claim', async () => {
    for (let i = 1; i < activityIds.length; i++) {
      await createQualifiesForEdge({
        sourceNodeId: activityIds[i],
        claimId,
        qualificationBasis: 'AI_INFERRED',
        eligibleAmount: i * 10000,
        eligibilityConfidence: 0.75 - i * 0.05,
        expenditureCategory: i % 2 === 0 ? 'SALARY' : 'MATERIALS',
      });
    }

    const edges = await listQualifiesForEdges(claimId);
    expect(edges.length).toBe(5);
  });
});

// ============================================================
// Reviewer Feedback
// ============================================================

describe('Reviewer Feedback', () => {
  it('accepts a qualification', async () => {
    await acceptQualification(activityIds[0], claimId);

    const edges = await listQualifiesForEdges(claimId);
    const edge = edges.find((e) => e.sourceNodeId === activityIds[0]);
    expect(edge!.reviewerAccepted).toBe(true);
    expect(edge!.rejectionReason).toBeNull();
  });

  it('rejects a qualification with reason', async () => {
    await rejectQualification(
      activityIds[2], // "Office Furniture Purchase"
      claimId,
      'Not R&D related - standard office equipment',
    );

    const edges = await listQualifiesForEdges(claimId);
    const edge = edges.find((e) => e.sourceNodeId === activityIds[2]);
    expect(edge!.reviewerAccepted).toBe(false);
    expect(edge!.rejectionReason).toBe('Not R&D related - standard office equipment');
  });

  it('rejects another non-qualifying expenditure', async () => {
    await rejectQualification(
      activityIds[3], // "Marketing Campaign Design"
      claimId,
      'Marketing is not eligible for SR&ED',
    );

    const edges = await listQualifiesForEdges(claimId);
    const rejected = edges.filter((e) => e.reviewerAccepted === false);
    expect(rejected.length).toBe(2);
  });

  it('batch reviews remaining qualifications', async () => {
    const result = await batchReview([
      { sourceNodeId: activityIds[1], claimId, accepted: true },
      { sourceNodeId: activityIds[4], claimId, accepted: true },
    ]);

    expect(result.accepted).toBe(2);
    expect(result.rejected).toBe(0);
  });
});

// ============================================================
// Feedback Aggregation
// ============================================================

describe('Feedback Aggregation', () => {
  it('computes feedback summary for program', async () => {
    const summary = await getFeedbackSummary('CA-SRED');

    expect(summary.programCode).toBe('CA-SRED');
    expect(summary.totalReviewed).toBe(5);
    expect(summary.totalAccepted).toBe(3);
    expect(summary.totalRejected).toBe(2);
    expect(summary.precision).toBe(0.6);
    expect(summary.rejectionReasons.length).toBe(2);
    expect(summary.rejectedLabels).toContain('Office Furniture Purchase');
    expect(summary.rejectedLabels).toContain('Marketing Campaign Design');
  });
});

// ============================================================
// Model Refinement
// ============================================================

describe('Model Refinement', () => {
  it('refines eligibility model based on feedback', async () => {
    const result = await refineEligibilityModel('CA-SRED');

    expect(result.programCode).toBe('CA-SRED');
    // "office", "furniture", "marketing", "campaign" should be negative
    expect(result.negativeKeywords.length).toBeGreaterThan(0);
    expect(result.feedbackSummary.precision).toBe(0.6);
  });

  it('stores refined model in memory', () => {
    const model = getRefinedModel('CA-SRED');
    expect(model).not.toBeNull();
    expect(model!.negative.length).toBeGreaterThan(0);
    expect(model!.baseKeywords).toContain('research');
  });

  it('clears refined model', () => {
    clearRefinedModel('CA-SRED');
    expect(getRefinedModel('CA-SRED')).toBeNull();
  });
});

// ============================================================
// Re-Identification with Refined Model
// ============================================================

describe('Re-Identification', () => {
  it('returns base results when no refined model exists', async () => {
    clearRefinedModel('CA-SRED');
    const results = await reidentifyWithRefinedModel(testEntityId, 'CA-SRED', testPeriodId);
    // Returns whatever the base identification finds
    expect(Array.isArray(results)).toBe(true);
  });

  it('filters out negative keywords after refinement', async () => {
    // Re-refine the model
    await refineEligibilityModel('CA-SRED');
    const model = getRefinedModel('CA-SRED');
    expect(model).not.toBeNull();

    const results = await reidentifyWithRefinedModel(testEntityId, 'CA-SRED', testPeriodId);

    // Should not include nodes matching negative keywords from rejected labels
    for (const r of results) {
      const label = r.nodeLabel.toLowerCase();
      for (const neg of model!.negative) {
        expect(label).not.toContain(neg);
      }
    }
  });
});

// ============================================================
// Accuracy Metrics
// ============================================================

describe('Accuracy Metrics', () => {
  it('computes accuracy metrics for program', async () => {
    const metrics = await computeAccuracyMetrics('CA-SRED');

    expect(metrics.programCode).toBe('CA-SRED');
    expect(metrics.totalIdentified).toBe(5);
    expect(metrics.totalReviewed).toBe(5);
    expect(metrics.truePositives).toBe(3);
    expect(metrics.falsePositives).toBe(2);
    expect(metrics.precision).toBe(0.6);
    expect(metrics.reviewCoverage).toBe(1.0);
    expect(metrics.averageConfidence).toBeGreaterThan(0);
    expect(metrics.averageAcceptedConfidence).toBeGreaterThan(0);
    expect(metrics.averageRejectedConfidence).toBeGreaterThan(0);
  });
});
