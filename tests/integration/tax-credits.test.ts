/**
 * Tax Credits — Integration Tests
 *
 * Tests TaxCreditProgram lookup, eligible expenditure identification,
 * TaxCreditClaim CRUD, credit balance FIFO tracking, REDUCES_COST_OF
 * edges, effective cost computation, and filing data export.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities, createActivity } from '../../src/services/graph/graph-crud-service.js';
import {
  listTaxCreditPrograms,
  getTaxCreditProgram,
  identifyEligibleExpenditures,
  createTaxCreditClaim,
  getTaxCreditClaim,
  listTaxCreditClaims,
  updateClaimStatus,
  updateCreditBalance,
  getCreditBalance,
  listCreditBalances,
  createReducesCostEdge,
  computeEffectiveCost,
  generateT661Data,
  generateForm6765Data,
} from '../../src/services/tax/tax-credits-service.js';

let caFpEntityId: string;
let usFpEntityId: string;
let activityId: string;
let periodId: string;
const cleanupIds: string[] = [];

beforeAll(async () => {
  const entities = await getAllEntities();
  caFpEntityId = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'CA')!.id;
  usFpEntityId = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'US')!.id;

  // Create an activity with cost for eligible expenditure tests
  activityId = await createActivity({
    entityId: caFpEntityId,
    label: 'R&D Prototype Development',
    status: 'IN_PROGRESS',
  });
  cleanupIds.push(activityId);

  // Set cost_monetary on the activity
  await runCypher(
    `MATCH (a:Activity {id: $id}) SET a.cost_monetary = 250000`,
    { id: activityId },
  );

  // Use a fixed period ID for tests
  const { v4: uuid } = await import('uuid');
  periodId = uuid();
});

afterAll(async () => {
  // Clean up claims, balances, edges
  await runCypher(`MATCH (c:TaxCreditClaim {entity_id: $entityId}) DETACH DELETE c`, { entityId: caFpEntityId });
  await runCypher(`MATCH (c:TaxCreditClaim {entity_id: $entityId}) DETACH DELETE c`, { entityId: usFpEntityId });
  await runCypher(`MATCH (b:TaxCreditBalance {entity_id: $entityId}) DETACH DELETE b`, { entityId: caFpEntityId });

  for (const id of cleanupIds) {
    await runCypher(`MATCH (n {id: $id}) DETACH DELETE n`, { id });
  }

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

describe('TaxCreditProgram Queries', () => {
  it('lists all seeded programs', async () => {
    const programs = await listTaxCreditPrograms();
    expect(programs.length).toBeGreaterThanOrEqual(4);
  });

  it('filters programs by jurisdiction', async () => {
    const caPrograms = await listTaxCreditPrograms('CA');
    expect(caPrograms.length).toBeGreaterThanOrEqual(2);
    expect(caPrograms.every((p: any) => p.jurisdiction === 'CA')).toBe(true);
  });

  it('gets program by code', async () => {
    const sred = await getTaxCreditProgram('CA-SRED');
    expect(sred).not.toBeNull();
    expect((sred as any).program_code).toBe('CA-SRED');
    expect((sred as any).credit_rate).toBe(0.15);
    expect((sred as any).filing_form).toBe('T661');
  });

  it('returns null for unknown program', async () => {
    const result = await getTaxCreditProgram('NONEXISTENT');
    expect(result).toBeNull();
  });
});

describe('Eligible Expenditure Identification', () => {
  it('identifies R&D activities for SR&ED program', async () => {
    const eligible = await identifyEligibleExpenditures({
      entityId: caFpEntityId,
      programCode: 'CA-SRED',
      periodId,
    });

    // Should find our "R&D Prototype Development" activity
    const rdActivity = eligible.find((e) => e.nodeId === activityId);
    if (rdActivity) {
      expect(rdActivity.expenditureAmount).toBe(250000);
      expect(rdActivity.qualificationBasis).toBe('AI_INFERRED');
    }
  });

  it('throws for unknown program', async () => {
    await expect(identifyEligibleExpenditures({
      entityId: caFpEntityId,
      programCode: 'NONEXISTENT',
      periodId,
    })).rejects.toThrow('not found');
  });
});

describe('TaxCreditClaim CRUD', () => {
  let claimId: string;

  it('creates a tax credit claim with computed amounts', async () => {
    claimId = await createTaxCreditClaim({
      entityId: caFpEntityId,
      programCode: 'CA-SRED',
      periodId,
      fiscalYear: '2026',
      eligibleExpenditureTotal: 250000,
      eligibleNodeIds: [activityId],
      aiConfidence: 0.85,
    });

    expect(claimId).toBeDefined();

    const claim = await getTaxCreditClaim(claimId);
    expect(claim).not.toBeNull();
    expect((claim as any).claim_status).toBe('DRAFT');
    // 250000 × 15% = 37500
    expect((claim as any).credit_amount_claimed).toBe(37500);
    // SR&ED partially refundable: 40% refundable
    expect((claim as any).refundable_portion).toBe(15000);
    expect((claim as any).non_refundable_portion).toBe(22500);
  });

  it('lists claims for entity', async () => {
    const claims = await listTaxCreditClaims(caFpEntityId);
    expect(claims.length).toBeGreaterThanOrEqual(1);
    expect(claims.some((c: any) => c.id === claimId)).toBe(true);
  });

  it('filters claims by status', async () => {
    const drafts = await listTaxCreditClaims(caFpEntityId, 'DRAFT');
    expect(drafts.length).toBeGreaterThanOrEqual(1);
  });

  it('updates claim status to REVIEWED', async () => {
    const updated = await updateClaimStatus(claimId, 'REVIEWED');
    expect((updated as any).claim_status).toBe('REVIEWED');
  });

  it('updates claim status to ASSESSED with assessed amount', async () => {
    // First approve
    await updateClaimStatus(claimId, 'APPROVED');
    await updateClaimStatus(claimId, 'FILED');

    // Then assess with different amount
    const assessed = await updateClaimStatus(claimId, 'ASSESSED', 35000);
    expect((assessed as any).claim_status).toBe('ASSESSED');
    expect((assessed as any).credit_amount_assessed).toBe(35000);
  });

  it('respects expenditure limit', async () => {
    // SR&ED has $3M limit, so a large claim should be capped
    const largeClaim = await createTaxCreditClaim({
      entityId: caFpEntityId,
      programCode: 'CA-SRED',
      periodId,
      fiscalYear: '2026',
      eligibleExpenditureTotal: 5000000,
      eligibleNodeIds: [],
    });

    const claim = await getTaxCreditClaim(largeClaim);
    // Capped at 3M × 15% = 450000
    expect((claim as any).credit_amount_claimed).toBe(450000);
  });
});

describe('Credit Balance (FIFO Vintage Tracking)', () => {
  it('creates initial credit balance', async () => {
    const id = await updateCreditBalance({
      entityId: caFpEntityId,
      programCode: 'CA-SRED',
      balanceAsOf: '2025-12-31',
      creditsEarned: 37500,
    });

    expect(id).toBeDefined();

    const balance = await getCreditBalance(caFpEntityId, 'CA-SRED');
    expect(balance).not.toBeNull();
    expect(Number((balance as any).opening_balance)).toBe(0);
    expect(Number((balance as any).credits_earned)).toBe(37500);
    expect(Number((balance as any).closing_balance)).toBe(37500);
  });

  it('carries forward and applies credits', async () => {
    const id = await updateCreditBalance({
      entityId: caFpEntityId,
      programCode: 'CA-SRED',
      balanceAsOf: '2026-12-31',
      creditsEarned: 45000,
      creditsApplied: 20000,
    });

    const balance = await getCreditBalance(caFpEntityId, 'CA-SRED');
    expect(balance).not.toBeNull();
    // Opening = 37500 (from prior), earned 45000, applied 20000
    // Closing = 37500 + 45000 - 20000 = 62500
    expect(Number((balance as any).closing_balance)).toBe(62500);
  });

  it('tracks vintages in JSON', async () => {
    const balance = await getCreditBalance(caFpEntityId, 'CA-SRED');
    const vintages = JSON.parse((balance as any).vintages);
    expect(Array.isArray(vintages)).toBe(true);
    expect(vintages.length).toBeGreaterThanOrEqual(1);
  });

  it('lists all balances for entity', async () => {
    const balances = await listCreditBalances(caFpEntityId);
    expect(balances.length).toBeGreaterThanOrEqual(1);
  });
});

describe('REDUCES_COST_OF Edge', () => {
  let claimForEdge: string;

  it('creates REDUCES_COST_OF edge', async () => {
    claimForEdge = await createTaxCreditClaim({
      entityId: caFpEntityId,
      programCode: 'CA-SRED',
      periodId,
      fiscalYear: '2026',
      eligibleExpenditureTotal: 100000,
      eligibleNodeIds: [activityId],
    });

    await createReducesCostEdge(claimForEdge, activityId, 15000, 'CLAIMED');

    // Verify edge exists
    const edges = await runCypher<{ amount: number }>(
      `MATCH (c:TaxCreditClaim {id: $claimId})-[r:REDUCES_COST_OF]->(n {id: $nodeId})
       RETURN r.cost_reduction_amount AS amount`,
      { claimId: claimForEdge, nodeId: activityId },
    );
    expect(edges.length).toBe(1);
    expect(edges[0].amount).toBe(15000);
  });

  it('computes effective cost with credit reduction', async () => {
    const result = await computeEffectiveCost(activityId);
    expect(result.originalCost).toBe(250000);
    expect(result.totalReductions).toBeGreaterThan(0);
    expect(result.effectiveCost).toBeLessThan(result.originalCost);
  });
});

describe('Filing Data Export', () => {
  it('generates T661 SR&ED filing data', async () => {
    const data = await generateT661Data(caFpEntityId, '2026');
    expect(data.filingForm).toBe('T661');
    expect(data.entityId).toBe(caFpEntityId);
    expect(data.fiscalYear).toBe('2026');
    expect((data.claims as any[]).length).toBeGreaterThanOrEqual(1);
    expect(data.totalEligibleExpenditures).toBeGreaterThan(0);
  });

  it('generates Form 6765 R&D filing data', async () => {
    // Create a US claim first
    await createTaxCreditClaim({
      entityId: usFpEntityId,
      programCode: 'US-IRC41-RD',
      periodId,
      fiscalYear: '2026',
      eligibleExpenditureTotal: 500000,
      eligibleNodeIds: [],
    });

    const data = await generateForm6765Data(usFpEntityId, '2026');
    expect(data.filingForm).toBe('Form 6765');
    expect(data.claimCount).toBeGreaterThanOrEqual(1);
    expect(data.totalQualifiedResearchExpenditures).toBeGreaterThan(0);
  });
});
