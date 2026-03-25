/**
 * Accruals Engine — Integration Tests
 *
 * Tests TemporalClaim CRUD, recognition engine, auto-reversal, and ECL.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { query, closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities, createAccountingPeriod } from '../../src/services/graph/graph-crud-service.js';
import {
  createTemporalClaim,
  getTemporalClaim,
  listTemporalClaims,
  updateTemporalClaim,
  recognizeClaim,
  recognizeAllClaims,
  autoReverseClaims,
  updateECL,
  writeOffClaim,
} from '../../src/services/gl/accruals-service.js';

let testEntityId: string;
let period1Id: string;
let period2Id: string;
const cleanupIds: { label: string; id: string }[] = [];

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  // Use a FP entity (no fund_id required for journal entries)
  const fpEntity = entities.find((e) => e.entity_type === 'FOR_PROFIT');
  testEntityId = fpEntity!.id;

  // Create two accounting periods for recognition and reversal tests
  period1Id = track('AccountingPeriod', await createAccountingPeriod({
    entityId: testEntityId,
    label: 'Accrual Test Period 1',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
  }));

  period2Id = track('AccountingPeriod', await createAccountingPeriod({
    entityId: testEntityId,
    label: 'Accrual Test Period 2',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
  }));
});

afterAll(async () => {
  // Clean up TimescaleDB projections for test periods
  await query('DELETE FROM gl_period_balances WHERE period_id = $1 OR period_id = $2',
    [period1Id, period2Id]);

  // Clean up test JournalEntries and LedgerLines created by recognition
  for (const { label, id } of cleanupIds) {
    if (label === 'TemporalClaim') {
      // Clean up any JEs generated from this claim
      const jeIds = await runCypher<{ id: string }>(
        `MATCH (j:JournalEntry) WHERE j.reference CONTAINS $claimId RETURN j.id AS id`,
        { claimId: id },
      );
      for (const je of jeIds) {
        await runCypher('MATCH (l:LedgerLine {journal_entry_id: $jeId}) DELETE l', { jeId: je.id });
        await runCypher('MATCH (j:JournalEntry {id: $id}) DELETE j', { id: je.id });
      }
    }
    await runCypher(`MATCH (n:${label} {id: $id}) DETACH DELETE n`, { id });
  }
  await closeNeo4j();
  await closePg();
  await closeKafka();
});

describe('TemporalClaim CRUD', () => {
  let claimId: string;

  it('creates a TemporalClaim (ACCRUED_REVENUE)', async () => {
    claimId = track('TemporalClaim', await createTemporalClaim({
      entityId: testEntityId,
      claimType: 'ACCRUED_REVENUE',
      direction: 'RECEIVABLE',
      originalAmount: 12000,
      currency: 'CAD',
      recognitionMethod: 'STRAIGHT_LINE',
      recognitionSchedule: [
        { period_id: period1Id, amount: 4000 },
        { period_id: period2Id, amount: 4000 },
      ],
      sourceNodeId: testEntityId,
      sourceNodeType: 'ACTIVITY',
      periodIdOpened: period1Id,
      autoReverse: false,
    }));
    expect(claimId).toBeDefined();
  });

  it('retrieves the claim with correct properties', async () => {
    const claim = await getTemporalClaim(claimId);
    expect(claim).toBeDefined();
    expect(claim!.claim_type).toBe('ACCRUED_REVENUE');
    expect(claim!.direction).toBe('RECEIVABLE');
    expect(Number(claim!.original_amount)).toBe(12000);
    expect(Number(claim!.recognized_to_date)).toBe(0);
    expect(Number(claim!.remaining)).toBe(12000);
    expect(claim!.status).toBe('OPEN');
    expect(claim!.auto_reverse).toBe(false);
    expect(claim!.ecl_stage).toBe('STAGE_1');
    expect(Number(claim!.ecl_allowance)).toBe(0);
    expect(claim!.collectability_score).toBe(1.0);
  });

  it('lists claims by entity', async () => {
    const claims = await listTemporalClaims(testEntityId);
    expect(claims.length).toBeGreaterThanOrEqual(1);
    const found = claims.find((c: any) => c.id === claimId);
    expect(found).toBeDefined();
  });

  it('lists claims with status filter', async () => {
    const openClaims = await listTemporalClaims(testEntityId, 'OPEN');
    expect(openClaims.some((c: any) => c.id === claimId)).toBe(true);

    const fullyClaims = await listTemporalClaims(testEntityId, 'FULLY_RECOGNIZED');
    expect(fullyClaims.some((c: any) => c.id === claimId)).toBe(false);
  });

  it('updates claim properties', async () => {
    const updated = await updateTemporalClaim(claimId, {
      materiality_flag: true,
    });
    expect(updated).toBe(true);
    const claim = await getTemporalClaim(claimId);
    expect(claim!.materiality_flag).toBe(true);
  });

  it('parses recognition_schedule as array', async () => {
    const claim = await getTemporalClaim(claimId);
    expect(Array.isArray(claim!.recognition_schedule)).toBe(true);
    expect((claim!.recognition_schedule as any[]).length).toBe(2);
    expect((claim!.recognition_schedule as any[])[0].amount).toBe(4000);
  });
});

describe('Recognition Engine', () => {
  let recognitionClaimId: string;

  beforeAll(async () => {
    recognitionClaimId = track('TemporalClaim', await createTemporalClaim({
      entityId: testEntityId,
      claimType: 'ACCRUED_LIABILITY',
      direction: 'PAYABLE',
      originalAmount: 6000,
      currency: 'CAD',
      recognitionMethod: 'STRAIGHT_LINE',
      recognitionSchedule: [
        { period_id: period1Id, amount: 3000 },
        { period_id: period2Id, amount: 3000 },
      ],
      sourceNodeId: testEntityId,
      sourceNodeType: 'ACTIVITY',
      periodIdOpened: period1Id,
      autoReverse: false,
    }));
  });

  it('recognizes claim for period 1 (partial)', async () => {
    const result = await recognizeClaim(recognitionClaimId, period1Id);
    expect(result.amountRecognized).toBe(3000);
    expect(result.journalEntryIds).toHaveLength(1);

    const claim = await getTemporalClaim(recognitionClaimId);
    expect(claim!.recognized_to_date).toBe(3000);
    expect(claim!.remaining).toBe(3000);
    expect(claim!.status).toBe('PARTIALLY_RECOGNIZED');
  });

  it('does not re-recognize already-recognized entries', async () => {
    const result = await recognizeClaim(recognitionClaimId, period1Id);
    expect(result.amountRecognized).toBe(0);
    expect(result.journalEntryIds).toHaveLength(0);
  });

  it('recognizes claim for period 2 (fully recognized)', async () => {
    const result = await recognizeClaim(recognitionClaimId, period2Id);
    expect(result.amountRecognized).toBe(3000);
    expect(result.journalEntryIds).toHaveLength(1);

    const claim = await getTemporalClaim(recognitionClaimId);
    expect(claim!.recognized_to_date).toBe(6000);
    expect(claim!.remaining).toBe(0);
    expect(claim!.status).toBe('FULLY_RECOGNIZED');
    expect(claim!.period_id_closed).toBe(period2Id);
  });

  it('rejects recognition on fully recognized claim', async () => {
    await expect(recognizeClaim(recognitionClaimId, period2Id))
      .rejects.toThrow('already fully recognized');
  });
});

describe('Batch Recognition', () => {
  beforeAll(async () => {
    // Create two more claims for batch testing
    track('TemporalClaim', await createTemporalClaim({
      entityId: testEntityId,
      claimType: 'PREPAID_EXPENSE',
      direction: 'RECEIVABLE',
      originalAmount: 2400,
      currency: 'CAD',
      recognitionMethod: 'STRAIGHT_LINE',
      recognitionSchedule: [
        { period_id: period1Id, amount: 1200 },
        { period_id: period2Id, amount: 1200 },
      ],
      sourceNodeId: testEntityId,
      sourceNodeType: 'ACTIVITY',
      periodIdOpened: period1Id,
      autoReverse: false,
    }));

    track('TemporalClaim', await createTemporalClaim({
      entityId: testEntityId,
      claimType: 'DEFERRED_REVENUE',
      direction: 'PAYABLE',
      originalAmount: 9000,
      currency: 'CAD',
      recognitionMethod: 'STRAIGHT_LINE',
      recognitionSchedule: [
        { period_id: period2Id, amount: 9000 },
      ],
      sourceNodeId: testEntityId,
      sourceNodeType: 'ACTIVITY',
      periodIdOpened: period1Id,
      autoReverse: false,
    }));
  });

  it('recognizes all open claims for period 1', async () => {
    const result = await recognizeAllClaims(testEntityId, period1Id);
    // Should pick up the PREPAID_EXPENSE claim (1200) — DEFERRED_REVENUE has no period1 entries
    expect(result.claimCount).toBeGreaterThanOrEqual(1);
    expect(result.totalRecognized).toBeGreaterThanOrEqual(1200);
    expect(result.journalEntryIds.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Auto-Reversal', () => {
  let autoReverseClaimId: string;

  beforeAll(async () => {
    autoReverseClaimId = track('TemporalClaim', await createTemporalClaim({
      entityId: testEntityId,
      claimType: 'ACCRUED_LIABILITY',
      direction: 'PAYABLE',
      originalAmount: 5000,
      currency: 'CAD',
      recognitionMethod: 'STRAIGHT_LINE',
      recognitionSchedule: [
        { period_id: period1Id, amount: 5000 },
      ],
      sourceNodeId: testEntityId,
      sourceNodeType: 'ACTIVITY',
      periodIdOpened: period1Id,
      autoReverse: true,
    }));

    // Recognize in period 1
    await recognizeClaim(autoReverseClaimId, period1Id);
  });

  it('generates reversal entries in next period', async () => {
    const result = await autoReverseClaims(testEntityId, period2Id, period1Id);
    expect(result.reversalCount).toBeGreaterThanOrEqual(1);
    expect(result.journalEntryIds.length).toBeGreaterThanOrEqual(1);

    // Verify the reversal JE has entry_type REVERSAL
    const jeId = result.journalEntryIds[0];
    const je = await runCypher<{ entry_type: string }>(
      `MATCH (j:JournalEntry {id: $id}) RETURN j.entry_type AS entry_type`,
      { id: jeId },
    );
    expect(je[0].entry_type).toBe('REVERSAL');
  });
});

describe('ECL Management', () => {
  let eclClaimId: string;

  beforeAll(async () => {
    eclClaimId = track('TemporalClaim', await createTemporalClaim({
      entityId: testEntityId,
      claimType: 'ACCRUED_REVENUE',
      direction: 'RECEIVABLE',
      originalAmount: 10000,
      currency: 'CAD',
      recognitionMethod: 'STRAIGHT_LINE',
      recognitionSchedule: [],
      sourceNodeId: testEntityId,
      sourceNodeType: 'ACTIVITY',
      periodIdOpened: period1Id,
      autoReverse: false,
      collectabilityScore: 1.0,
      eclAllowance: 0,
      eclStage: 'STAGE_1',
    }));
  });

  it('updates ECL stage based on collectability score', async () => {
    // High score → STAGE_1
    let result = await updateECL(eclClaimId, 0.9, 500);
    expect(result.newStage).toBe('STAGE_1');

    // Medium score → STAGE_2
    result = await updateECL(eclClaimId, 0.6, 2000);
    expect(result.previousStage).toBe('STAGE_1');
    expect(result.newStage).toBe('STAGE_2');

    // Low score → STAGE_3
    result = await updateECL(eclClaimId, 0.3, 5000);
    expect(result.previousStage).toBe('STAGE_2');
    expect(result.newStage).toBe('STAGE_3');

    const claim = await getTemporalClaim(eclClaimId);
    expect(claim!.ecl_stage).toBe('STAGE_3');
    expect(claim!.ecl_allowance).toBe(5000);
    expect(claim!.collectability_score).toBe(0.3);
  });

  it('writes off a claim', async () => {
    const result = await writeOffClaim(eclClaimId);
    expect(result).toBe(true);

    const claim = await getTemporalClaim(eclClaimId);
    expect(claim!.status).toBe('WRITTEN_OFF');
    expect(claim!.remaining).toBe(0);
  });

  it('rejects recognition on written-off claim', async () => {
    await expect(recognizeClaim(eclClaimId, period1Id))
      .rejects.toThrow('written off');
  });
});

describe('Claim Types — Journal Entry Categories', () => {
  it('ACCRUED_REVENUE: DR Asset, CR Revenue', async () => {
    const claimId = track('TemporalClaim', await createTemporalClaim({
      entityId: testEntityId,
      claimType: 'ACCRUED_REVENUE',
      direction: 'RECEIVABLE',
      originalAmount: 1000,
      currency: 'CAD',
      recognitionMethod: 'STRAIGHT_LINE',
      recognitionSchedule: [{ period_id: period1Id, amount: 1000 }],
      sourceNodeId: testEntityId,
      sourceNodeType: 'ACTIVITY',
      periodIdOpened: period1Id,
      autoReverse: false,
    }));

    const result = await recognizeClaim(claimId, period1Id);
    const lines = await runCypher<{ side: string; economic_category: string }>(
      `MATCH (l:LedgerLine {journal_entry_id: $jeId})
       RETURN l.side AS side, l.economic_category AS economic_category`,
      { jeId: result.journalEntryIds[0] },
    );
    const debit = lines.find((l) => l.side === 'DEBIT');
    const credit = lines.find((l) => l.side === 'CREDIT');
    expect(debit!.economic_category).toBe('ASSET');
    expect(credit!.economic_category).toBe('REVENUE');
  });

  it('PREPAID_EXPENSE: DR Expense, CR Asset', async () => {
    const claimId = track('TemporalClaim', await createTemporalClaim({
      entityId: testEntityId,
      claimType: 'PREPAID_EXPENSE',
      direction: 'RECEIVABLE',
      originalAmount: 800,
      currency: 'CAD',
      recognitionMethod: 'STRAIGHT_LINE',
      recognitionSchedule: [{ period_id: period2Id, amount: 800 }],
      sourceNodeId: testEntityId,
      sourceNodeType: 'ACTIVITY',
      periodIdOpened: period1Id,
      autoReverse: false,
    }));

    const result = await recognizeClaim(claimId, period2Id);
    const lines = await runCypher<{ side: string; economic_category: string }>(
      `MATCH (l:LedgerLine {journal_entry_id: $jeId})
       RETURN l.side AS side, l.economic_category AS economic_category`,
      { jeId: result.journalEntryIds[0] },
    );
    const debit = lines.find((l) => l.side === 'DEBIT');
    const credit = lines.find((l) => l.side === 'CREDIT');
    expect(debit!.economic_category).toBe('EXPENSE');
    expect(credit!.economic_category).toBe('ASSET');
  });
});
