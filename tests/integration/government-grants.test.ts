/**
 * Government Grants (IAS 20) — Integration Tests
 *
 * Tests the government grants service: grant creation (income/asset approach),
 * recognition, condition management, and clawback assessment.
 *
 * Uses mocked database modules for isolation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/neo4j.js', () => ({
  runCypher: vi.fn(),
}));

vi.mock('../../src/lib/pg.js', () => ({
  query: vi.fn(),
}));

vi.mock('../../src/lib/kafka.js', () => ({
  sendEvent: vi.fn(),
}));

vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn() },
}));

// Mock postJournalEntry to avoid saga complexity
vi.mock('../../src/services/gl/journal-posting-service.js', () => ({
  postJournalEntry: vi.fn(),
}));

import { runCypher } from '../../src/lib/neo4j.js';
import { query } from '../../src/lib/pg.js';
import { postJournalEntry } from '../../src/services/gl/journal-posting-service.js';
import {
  createGrant,
  getGrant,
  listGrants,
  recognizeGrantIncome,
  markConditionMet,
  assessClawback,
} from '../../src/services/gl/government-grants-service.js';

const mockRunCypher = vi.mocked(runCypher);
const mockQuery = vi.mocked(query);
const mockPostJE = vi.mocked(postJournalEntry);

const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const PERIOD_ID = '22222222-2222-2222-2222-222222222222';
const ACTIVITY_ID = '33333333-3333-3333-3333-333333333333';
const ASSET_ID = '44444444-4444-4444-4444-444444444444';

describe('P7-GOVERNMENT-GRANTS', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Default: runCypher returns empty (for CREATE statements)
    mockRunCypher.mockResolvedValue([]);

    // Default: PG queries
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

    // Default: postJournalEntry returns a mock JE ID
    mockPostJE.mockResolvedValue('mock-je-id');
  });

  // ========== Grant Creation ==========

  it('should create an income approach grant', async () => {
    const id = await createGrant({
      entityId: ENTITY_ID,
      grantProgramName: 'IRAP Research Grant',
      amount: 100000,
      currency: 'CAD',
      approach: 'INCOME',
      recognitionMethod: 'STRAIGHT_LINE',
      recognitionSchedule: [
        { period_id: PERIOD_ID, amount: 50000 },
        { period_id: '55555555-5555-5555-5555-555555555555', amount: 50000 },
      ],
      sourceNodeId: ACTIVITY_ID,
      sourceNodeType: 'ACTIVITY',
      periodIdOpened: PERIOD_ID,
    });

    expect(id).toBeDefined();
    expect(typeof id).toBe('string');

    // Verify CREATE was called with grant_flag = true
    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining('grant_flag: true'),
      expect.objectContaining({
        approach: 'INCOME',
        grantProgramName: 'IRAP Research Grant',
        amount: 100000,
      }),
    );
  });

  it('should create an asset approach grant and reduce asset carrying amount', async () => {
    const id = await createGrant({
      entityId: ENTITY_ID,
      grantProgramName: 'Equipment Subsidy',
      amount: 50000,
      currency: 'USD',
      approach: 'ASSET',
      recognitionMethod: 'STRAIGHT_LINE',
      recognitionSchedule: [{ period_id: PERIOD_ID, amount: 50000 }],
      sourceNodeId: ACTIVITY_ID,
      sourceNodeType: 'ACTIVITY',
      periodIdOpened: PERIOD_ID,
      relatedAssetId: ASSET_ID,
    });

    expect(id).toBeDefined();

    // Verify asset carrying amount reduction
    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining('carrying_amount = a.carrying_amount - $amount'),
      expect.objectContaining({ assetId: ASSET_ID, amount: 50000 }),
    );
  });

  it('should set condition_met to false when conditionDescription provided', async () => {
    await createGrant({
      entityId: ENTITY_ID,
      grantProgramName: 'Conditional Grant',
      amount: 25000,
      currency: 'CAD',
      approach: 'INCOME',
      recognitionMethod: 'MILESTONE',
      recognitionSchedule: [{ period_id: PERIOD_ID, amount: 25000 }],
      sourceNodeId: ACTIVITY_ID,
      sourceNodeType: 'ACTIVITY',
      periodIdOpened: PERIOD_ID,
      conditionDescription: 'Must complete Phase 1 research',
    });

    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining('grant_condition_description'),
      expect.objectContaining({
        conditionMet: false,
        conditionDescription: 'Must complete Phase 1 research',
      }),
    );
  });

  // ========== Grant Retrieval ==========

  it('should get a grant by ID', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      t: {
        id: 'grant-1',
        entity_id: ENTITY_ID,
        grant_program_name: 'IRAP',
        grant_approach: 'INCOME',
        original_amount: 100000,
        recognized_to_date: 25000,
        remaining: 75000,
        condition_met: true,
        clawback_probability: 0,
        clawback_amount: 0,
        status: 'PARTIALLY_RECOGNIZED',
        created_at: '2026-01-01',
      },
    }]);

    const grant = await getGrant('grant-1');

    expect(grant).not.toBeNull();
    expect(grant!.grant_program_name).toBe('IRAP');
    expect(grant!.grant_approach).toBe('INCOME');
    expect(grant!.remaining).toBe(75000);
  });

  it('should return null for nonexistent grant', async () => {
    mockRunCypher.mockResolvedValueOnce([]);

    const grant = await getGrant('nonexistent');
    expect(grant).toBeNull();
  });

  it('should list grants for an entity', async () => {
    mockRunCypher.mockResolvedValueOnce([
      { t: { id: 'g1', entity_id: ENTITY_ID, grant_program_name: 'Grant A', grant_approach: 'INCOME', original_amount: 10000, recognized_to_date: 0, remaining: 10000, condition_met: true, clawback_probability: 0, clawback_amount: 0, status: 'OPEN', created_at: '2026-01-01' } },
      { t: { id: 'g2', entity_id: ENTITY_ID, grant_program_name: 'Grant B', grant_approach: 'ASSET', original_amount: 20000, recognized_to_date: 5000, remaining: 15000, condition_met: true, clawback_probability: 0, clawback_amount: 0, status: 'PARTIALLY_RECOGNIZED', created_at: '2026-02-01' } },
    ]);

    const grants = await listGrants(ENTITY_ID);
    expect(grants).toHaveLength(2);
    expect(grants[0].grant_program_name).toBe('Grant A');
    expect(grants[1].grant_program_name).toBe('Grant B');
  });

  // ========== Grant Recognition ==========

  it('should recognize grant income for income approach', async () => {
    // Fetch grant
    mockRunCypher.mockResolvedValueOnce([{
      t: {
        id: 'grant-1',
        entity_id: ENTITY_ID,
        grant_approach: 'INCOME',
        grant_program_name: 'IRAP',
        original_amount: 100000,
        recognized_to_date: 0,
        remaining: 100000,
        currency: 'CAD',
        status: 'OPEN',
        condition_met: true,
        source_node_id: ACTIVITY_ID,
        source_node_type: 'ACTIVITY',
        recognition_schedule: JSON.stringify([
          { period_id: PERIOD_ID, amount: 50000 },
        ]),
      },
    }]);

    // Update grant schedule + status (after postJournalEntry which is mocked)
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await recognizeGrantIncome('grant-1', PERIOD_ID);

    expect(result.grantId).toBe('grant-1');
    expect(result.periodId).toBe(PERIOD_ID);
    expect(result.amountRecognized).toBe(50000);
    expect(result.approach).toBe('INCOME');
    expect(result.journalEntryId).toBeDefined();
  });

  it('should reject recognition when condition not met', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      t: {
        id: 'grant-cond',
        entity_id: ENTITY_ID,
        grant_approach: 'INCOME',
        grant_program_name: 'Conditional',
        original_amount: 50000,
        recognized_to_date: 0,
        remaining: 50000,
        currency: 'CAD',
        status: 'OPEN',
        condition_met: false,
        grant_condition_description: 'Complete Phase 1',
        source_node_id: ACTIVITY_ID,
        source_node_type: 'ACTIVITY',
        recognition_schedule: JSON.stringify([
          { period_id: PERIOD_ID, amount: 50000 },
        ]),
      },
    }]);

    await expect(
      recognizeGrantIncome('grant-cond', PERIOD_ID),
    ).rejects.toThrow('condition not yet met');
  });

  it('should reject recognition for fully recognized grant', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      t: {
        id: 'grant-full',
        entity_id: ENTITY_ID,
        status: 'FULLY_RECOGNIZED',
        grant_flag: true,
      },
    }]);

    await expect(
      recognizeGrantIncome('grant-full', PERIOD_ID),
    ).rejects.toThrow('already FULLY_RECOGNIZED');
  });

  // ========== Condition Management ==========

  it('should mark condition as met', async () => {
    mockRunCypher.mockResolvedValueOnce([{ count: 1 }]);

    await markConditionMet('grant-1');

    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining('condition_met = true'),
      expect.objectContaining({ id: 'grant-1' }),
    );
  });

  it('should throw if grant not found when marking condition', async () => {
    mockRunCypher.mockResolvedValueOnce([{ count: 0 }]);

    await expect(markConditionMet('nonexistent')).rejects.toThrow('not found');
  });

  // ========== Clawback Assessment ==========

  it('should assess clawback with provision required (probability > 50%)', async () => {
    mockRunCypher.mockResolvedValueOnce([]); // SET query

    const result = await assessClawback('grant-1', 0.7, 30000);

    expect(result.clawbackProbability).toBe(0.7);
    expect(result.clawbackAmount).toBe(30000);
    expect(result.provisionRequired).toBe(true);
    expect(result.provisionAmount).toBe(30000);
  });

  it('should assess clawback without provision (probability <= 50%)', async () => {
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await assessClawback('grant-1', 0.2, 10000);

    expect(result.provisionRequired).toBe(false);
    expect(result.provisionAmount).toBe(0);
  });

  it('should reject invalid probability', async () => {
    await expect(assessClawback('grant-1', 1.5, 10000)).rejects.toThrow('between 0 and 1');
    await expect(assessClawback('grant-1', -0.1, 10000)).rejects.toThrow('between 0 and 1');
  });

  // ========== Result Shape ==========

  it('should return correct GrantSummary shape', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      t: {
        id: 'g1', entity_id: ENTITY_ID, grant_program_name: 'Test',
        grant_approach: 'INCOME', original_amount: 1000,
        recognized_to_date: 0, remaining: 1000,
        condition_met: true, clawback_probability: 0, clawback_amount: 0,
        status: 'OPEN', created_at: '2026-01-01',
      },
    }]);

    const grant = await getGrant('g1');

    expect(grant).toHaveProperty('id');
    expect(grant).toHaveProperty('entity_id');
    expect(grant).toHaveProperty('grant_program_name');
    expect(grant).toHaveProperty('grant_approach');
    expect(grant).toHaveProperty('original_amount');
    expect(grant).toHaveProperty('recognized_to_date');
    expect(grant).toHaveProperty('remaining');
    expect(grant).toHaveProperty('condition_met');
    expect(grant).toHaveProperty('clawback_probability');
    expect(grant).toHaveProperty('clawback_amount');
    expect(grant).toHaveProperty('status');
    expect(grant).toHaveProperty('created_at');
  });
});
