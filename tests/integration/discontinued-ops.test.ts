/**
 * Discontinued Operations (IFRS 5) — Integration Tests
 *
 * Tests held-for-sale classification, impairment on reclassification,
 * disposal, declassification, and continuing vs discontinued P&L split.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/neo4j.js', () => ({ runCypher: vi.fn() }));
vi.mock('../../src/lib/pg.js', () => ({ query: vi.fn() }));
vi.mock('../../src/lib/kafka.js', () => ({ sendEvent: vi.fn() }));
vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn() },
}));
vi.mock('../../src/services/gl/journal-posting-service.js', () => ({
  postJournalEntry: vi.fn(),
}));

import { runCypher } from '../../src/lib/neo4j.js';
import { query } from '../../src/lib/pg.js';
import { postJournalEntry } from '../../src/services/gl/journal-posting-service.js';
import {
  classifyAsHeldForSale,
  declassifyHeldForSale,
  recordDisposal,
  getDiscontinuedOpsPnL,
  listHeldForSaleInitiatives,
} from '../../src/services/gl/discontinued-ops-service.js';

const mockRunCypher = vi.mocked(runCypher);
const mockQuery = vi.mocked(query);
const mockPostJE = vi.mocked(postJournalEntry);

const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const PERIOD_ID = '22222222-2222-2222-2222-222222222222';
const INIT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

describe('P7-DISCONTINUED-OPS', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRunCypher.mockResolvedValue([]);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);
    mockPostJE.mockResolvedValue('mock-je-id');
  });

  // ========== Classification ==========

  it('should classify initiative as held-for-sale with impairment', async () => {
    // Fetch initiative
    mockRunCypher.mockResolvedValueOnce([{
      id: INIT_ID, status: 'IN_PROGRESS', held_for_sale_status: null,
    }]);

    // Get child nodes for carrying amount
    mockRunCypher.mockResolvedValueOnce([{ id: INIT_ID }, { id: 'child-1' }]);

    // PG: carrying amount query
    mockQuery.mockResolvedValueOnce({
      rows: [{ net_assets: '500000' }], rowCount: 1,
    } as any);

    // Update initiative
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await classifyAsHeldForSale({
      initiativeId: INIT_ID,
      entityId: ENTITY_ID,
      classificationDate: '2026-03-01',
      fairValueLessCostsToSell: 400000,
      expectedDisposalDate: '2026-09-01',
      buyer: 'Acme Corp',
      periodId: PERIOD_ID,
      currency: 'CAD',
    });

    expect(result.newStatus).toBe('HELD_FOR_SALE');
    expect(result.carryingAmount).toBe(500000);
    expect(result.fairValueLessCostsToSell).toBe(400000);
    expect(result.impairmentLoss).toBe(100000); // 500k - 400k
    expect(result.journalEntryId).toBe('mock-je-id');

    // Verify impairment JE was posted
    expect(mockPostJE).toHaveBeenCalledWith(
      expect.objectContaining({
        entryType: 'IMPAIRMENT',
      }),
    );
  });

  it('should classify without impairment when FVLCTS >= carrying', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      id: INIT_ID, status: 'IN_PROGRESS', held_for_sale_status: null,
    }]);
    mockRunCypher.mockResolvedValueOnce([{ id: INIT_ID }]);
    mockQuery.mockResolvedValueOnce({ rows: [{ net_assets: '300000' }], rowCount: 1 } as any);
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await classifyAsHeldForSale({
      initiativeId: INIT_ID,
      entityId: ENTITY_ID,
      classificationDate: '2026-03-01',
      fairValueLessCostsToSell: 350000, // Higher than carrying
      periodId: PERIOD_ID,
      currency: 'CAD',
    });

    expect(result.impairmentLoss).toBe(0);
    expect(result.journalEntryId).toBeUndefined();
    expect(mockPostJE).not.toHaveBeenCalled();
  });

  it('should reject classification if already held-for-sale', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      id: INIT_ID, status: 'IN_PROGRESS', held_for_sale_status: 'HELD_FOR_SALE',
    }]);

    await expect(classifyAsHeldForSale({
      initiativeId: INIT_ID,
      entityId: ENTITY_ID,
      classificationDate: '2026-03-01',
      fairValueLessCostsToSell: 100000,
      periodId: PERIOD_ID,
      currency: 'CAD',
    })).rejects.toThrow('already classified');
  });

  it('should reject classification if initiative not found', async () => {
    mockRunCypher.mockResolvedValueOnce([]);

    await expect(classifyAsHeldForSale({
      initiativeId: 'nonexistent',
      entityId: ENTITY_ID,
      classificationDate: '2026-03-01',
      fairValueLessCostsToSell: 100000,
      periodId: PERIOD_ID,
      currency: 'CAD',
    })).rejects.toThrow('not found');
  });

  // ========== Declassification ==========

  it('should declassify held-for-sale initiative', async () => {
    mockRunCypher.mockResolvedValueOnce([{ held_for_sale_status: 'HELD_FOR_SALE' }]);
    mockRunCypher.mockResolvedValueOnce([]);

    await declassifyHeldForSale(INIT_ID, ENTITY_ID);

    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining("held_for_sale_status = 'CONTINUING'"),
      expect.objectContaining({ id: INIT_ID }),
    );
  });

  it('should reject declassification if not held-for-sale', async () => {
    mockRunCypher.mockResolvedValueOnce([{ held_for_sale_status: 'CONTINUING' }]);

    await expect(
      declassifyHeldForSale(INIT_ID, ENTITY_ID),
    ).rejects.toThrow('not currently held-for-sale');
  });

  // ========== Disposal ==========

  it('should record disposal with gain', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      held_for_sale_status: 'HELD_FOR_SALE',
      fair_value_less_costs_to_sell: 400000,
    }]);
    mockRunCypher.mockResolvedValueOnce([]); // Update

    const result = await recordDisposal(
      INIT_ID, ENTITY_ID, '2026-06-30', 450000, PERIOD_ID, 'CAD',
    );

    expect(result.gainLoss).toBe(50000); // 450k - 400k = 50k gain
    expect(result.journalEntryId).toBe('mock-je-id');
  });

  it('should record disposal with loss', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      held_for_sale_status: 'HELD_FOR_SALE',
      fair_value_less_costs_to_sell: 400000,
    }]);
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await recordDisposal(
      INIT_ID, ENTITY_ID, '2026-06-30', 350000, PERIOD_ID, 'CAD',
    );

    expect(result.gainLoss).toBe(-50000); // 350k - 400k = 50k loss
  });

  it('should reject disposal if not held-for-sale', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      held_for_sale_status: 'CONTINUING',
      fair_value_less_costs_to_sell: 0,
    }]);

    await expect(
      recordDisposal(INIT_ID, ENTITY_ID, '2026-06-30', 100000, PERIOD_ID, 'CAD'),
    ).rejects.toThrow('must be held-for-sale');
  });

  // ========== P&L Presentation ==========

  it('should split P&L between continuing and discontinued', async () => {
    const DISC_INIT = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    const CONT_NODE = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    const DISC_NODE = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

    // Discontinued initiatives
    mockRunCypher.mockResolvedValueOnce([
      { id: DISC_INIT, impairment: 20000, gain_loss: 0 },
    ]);

    // Children of discontinued initiatives
    mockRunCypher.mockResolvedValueOnce([{ id: DISC_NODE }]);

    // PG: all P&L balances
    mockQuery.mockResolvedValueOnce({
      rows: [
        { node_ref_id: CONT_NODE, economic_category: 'REVENUE', debit_total: '0', credit_total: '200000' },
        { node_ref_id: CONT_NODE, economic_category: 'EXPENSE', debit_total: '150000', credit_total: '0' },
        { node_ref_id: DISC_NODE, economic_category: 'REVENUE', debit_total: '0', credit_total: '80000' },
        { node_ref_id: DISC_NODE, economic_category: 'EXPENSE', debit_total: '60000', credit_total: '0' },
        { node_ref_id: DISC_INIT, economic_category: 'REVENUE', debit_total: '0', credit_total: '10000' },
      ],
      rowCount: 5,
    } as any);

    const result = await getDiscontinuedOpsPnL(ENTITY_ID, PERIOD_ID);

    // Continuing: 200k rev, 150k exp
    expect(result.continuing.revenue).toBe(200000);
    expect(result.continuing.expenses).toBe(150000);
    expect(result.continuing.profit).toBe(50000);

    // Discontinued: 90k rev (80k + 10k), 60k exp, 20k impairment
    expect(result.discontinued.revenue).toBe(90000);
    expect(result.discontinued.expenses).toBe(60000);
    expect(result.discontinued.operating_profit).toBe(30000);
    expect(result.discontinued.impairment_loss).toBe(20000);
    expect(result.discontinued.profit).toBe(10000); // 30k - 20k + 0 gain/loss

    // Total
    expect(result.total_profit).toBe(60000); // 50k + 10k
  });

  it('should return all continuing when no discontinued ops exist', async () => {
    mockRunCypher.mockResolvedValueOnce([]); // No discontinued initiatives

    mockQuery.mockResolvedValueOnce({
      rows: [
        { node_ref_id: 'node-1', economic_category: 'REVENUE', debit_total: '0', credit_total: '100000' },
        { node_ref_id: 'node-1', economic_category: 'EXPENSE', debit_total: '70000', credit_total: '0' },
      ],
      rowCount: 2,
    } as any);

    const result = await getDiscontinuedOpsPnL(ENTITY_ID, PERIOD_ID);

    expect(result.continuing.revenue).toBe(100000);
    expect(result.continuing.profit).toBe(30000);
    expect(result.discontinued.revenue).toBe(0);
    expect(result.discontinued.profit).toBe(0);
  });

  // ========== Listing ==========

  it('should list held-for-sale initiatives', async () => {
    mockRunCypher.mockResolvedValueOnce([
      {
        id: INIT_ID, label: 'Legacy Division', entity_id: ENTITY_ID,
        status: 'IN_PROGRESS', held_for_sale_status: 'HELD_FOR_SALE',
        classification_date: '2026-03-01', expected_disposal_date: '2026-09-01',
        disposal_date: null, fair_value_less_costs_to_sell: 400000,
        impairment_on_classification: 100000, gain_loss_on_disposal: null,
        buyer: 'Acme Corp',
      },
    ]);

    const result = await listHeldForSaleInitiatives(ENTITY_ID);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Legacy Division');
    expect(result[0].held_for_sale_status).toBe('HELD_FOR_SALE');
    expect(result[0].buyer).toBe('Acme Corp');
  });

  // ========== Result Shape ==========

  it('should return correct DiscontinuedOpsPnL shape', async () => {
    mockRunCypher.mockResolvedValueOnce([]); // No discontinued
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const result = await getDiscontinuedOpsPnL(ENTITY_ID, PERIOD_ID);

    expect(result).toHaveProperty('entity_id');
    expect(result).toHaveProperty('period_id');
    expect(result).toHaveProperty('continuing');
    expect(result.continuing).toHaveProperty('revenue');
    expect(result.continuing).toHaveProperty('expenses');
    expect(result.continuing).toHaveProperty('profit');
    expect(result).toHaveProperty('discontinued');
    expect(result.discontinued).toHaveProperty('revenue');
    expect(result.discontinued).toHaveProperty('expenses');
    expect(result.discontinued).toHaveProperty('operating_profit');
    expect(result.discontinued).toHaveProperty('impairment_loss');
    expect(result.discontinued).toHaveProperty('gain_loss_on_disposal');
    expect(result.discontinued).toHaveProperty('profit');
    expect(result).toHaveProperty('total_profit');
  });
});
