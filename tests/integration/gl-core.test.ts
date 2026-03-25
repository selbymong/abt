/**
 * GL Core — Integration Tests
 *
 * Tests AccountingPeriod lifecycle, P&L/Balance Sheet reporting,
 * and StatutoryMapping CRUD.
 *
 * Requires: Neo4j + TimescaleDB running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { v4 as uuid, v7 as uuidv7 } from 'uuid';
import { closeNeo4j } from '../../src/lib/neo4j.js';
import { query, closePg } from '../../src/lib/pg.js';
import {
  createAccountingPeriod,
  getAccountingPeriod,
  getAllEntities,
} from '../../src/services/graph/graph-crud-service.js';
import { softClosePeriod, hardClosePeriod, reopenPeriod } from '../../src/services/gl/period-service.js';
import { getProfitAndLoss, getBalanceSheet } from '../../src/services/gl/reporting-service.js';
import {
  createStatutoryMapping,
  getStatutoryMapping,
  listStatutoryMappings,
  updateStatutoryMapping,
  deleteStatutoryMapping,
  resolveStatutoryCode,
} from '../../src/services/gl/statutory-mapping-service.js';
import { handleGLEvent } from '../../src/projectors/gl-projector.js';
import type { EBGEvent } from '../../src/lib/kafka.js';
import type { EachMessagePayload } from 'kafkajs';

let testEntityId: string;
let testPeriodId: string;
const cleanupPeriodIds: string[] = [];
const cleanupMappingIds: string[] = [];

function makePayload(event: EBGEvent): EachMessagePayload {
  return {
    topic: 'ebg.gl',
    partition: 0,
    message: {
      key: null,
      value: Buffer.from(JSON.stringify(event)),
      timestamp: Date.now().toString(),
      attributes: 0,
      offset: '0',
      size: 0,
      headers: {},
    },
    heartbeat: async () => {},
    pause: () => () => {},
  } as unknown as EachMessagePayload;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  testEntityId = entities[0].id;
});

afterAll(async () => {
  // Clean up test periods from Neo4j
  for (const id of cleanupPeriodIds) {
    const { runCypher } = await import('../../src/lib/neo4j.js');
    await runCypher(`MATCH (p:AccountingPeriod {id: $id}) DETACH DELETE p`, { id });
  }
  // Clean up statutory mappings
  for (const id of cleanupMappingIds) {
    await query(`DELETE FROM statutory_mappings WHERE id = $1::uuid`, [id]);
  }
  // Clean up test GL data
  await query(`DELETE FROM gl_period_balances WHERE entity_id = $1::uuid`, [testEntityId]);
  await closeNeo4j();
  await closePg();
});

// ============================================================
// AccountingPeriod Lifecycle
// ============================================================

describe('GL Core — Period Lifecycle', () => {
  let periodId: string;

  beforeAll(async () => {
    periodId = await createAccountingPeriod({
      entityId: testEntityId,
      label: 'Test Q2 2026',
      startDate: '2026-04-01',
      endDate: '2026-06-30',
    });
    cleanupPeriodIds.push(periodId);
  });

  it('creates period in OPEN status', async () => {
    const period = await getAccountingPeriod(periodId) as any;
    expect(period).not.toBeNull();
    expect(period.status).toBe('OPEN');
  });

  it('soft-closes an OPEN period', async () => {
    const result = await softClosePeriod(periodId, 'controller@test.com');
    expect(result.previousStatus).toBe('OPEN');
    expect(result.newStatus).toBe('SOFT_CLOSED');

    const period = await getAccountingPeriod(periodId) as any;
    expect(period.status).toBe('SOFT_CLOSED');
    expect(period.closed_by).toBe('controller@test.com');
  });

  it('rejects soft-close on already soft-closed period', async () => {
    await expect(
      softClosePeriod(periodId, 'controller@test.com'),
    ).rejects.toThrow();
  });

  it('re-opens a soft-closed period', async () => {
    const result = await reopenPeriod(periodId, 'controller@test.com');
    expect(result.previousStatus).toBe('SOFT_CLOSED');
    expect(result.newStatus).toBe('OPEN');

    const period = await getAccountingPeriod(periodId) as any;
    expect(period.status).toBe('OPEN');
  });

  it('transitions OPEN → SOFT_CLOSED → HARD_CLOSED', async () => {
    await softClosePeriod(periodId, 'controller@test.com');
    const result = await hardClosePeriod(periodId, 'controller@test.com');
    expect(result.previousStatus).toBe('SOFT_CLOSED');
    expect(result.newStatus).toBe('HARD_CLOSED');

    const period = await getAccountingPeriod(periodId) as any;
    expect(period.status).toBe('HARD_CLOSED');
  });

  it('rejects hard-close on OPEN period (must soft-close first)', async () => {
    const newPeriodId = await createAccountingPeriod({
      entityId: testEntityId,
      label: 'Test Skip Period',
      startDate: '2026-07-01',
      endDate: '2026-09-30',
    });
    cleanupPeriodIds.push(newPeriodId);

    await expect(
      hardClosePeriod(newPeriodId, 'controller@test.com'),
    ).rejects.toThrow();
  });

  it('rejects re-open on hard-closed period', async () => {
    await expect(
      reopenPeriod(periodId, 'controller@test.com'),
    ).rejects.toThrow();
  });
});

// ============================================================
// P&L and Balance Sheet Reporting
// ============================================================

describe('GL Core — Financial Reporting', () => {
  const reportPeriodId = uuidv7();
  const nodeRefId = uuid();

  beforeAll(async () => {
    // Seed gl_period_balances with test data via GL projector
    const events: EBGEvent[] = [
      // Revenue: $50,000 credit
      {
        event_id: uuid(), event_type: 'JOURNAL_LINE_POSTED', sequence_number: 0,
        idempotency_key: uuid(), entity_id: testEntityId, period_id: reportPeriodId,
        timestamp: new Date().toISOString(),
        payload: {
          journal_entry_id: uuid(), ledger_line_id: uuid(),
          entity_id: testEntityId, period_id: reportPeriodId,
          fund_id: null, node_ref_id: nodeRefId, node_ref_type: 'Activity',
          economic_category: 'REVENUE', statutory_code: null,
          side: 'CREDIT', functional_amount: 50000,
        },
      },
      // Expense: $30,000 debit
      {
        event_id: uuid(), event_type: 'JOURNAL_LINE_POSTED', sequence_number: 0,
        idempotency_key: uuid(), entity_id: testEntityId, period_id: reportPeriodId,
        timestamp: new Date().toISOString(),
        payload: {
          journal_entry_id: uuid(), ledger_line_id: uuid(),
          entity_id: testEntityId, period_id: reportPeriodId,
          fund_id: null, node_ref_id: nodeRefId, node_ref_type: 'Activity',
          economic_category: 'EXPENSE', statutory_code: null,
          side: 'DEBIT', functional_amount: 30000,
        },
      },
      // Asset: $100,000 debit
      {
        event_id: uuid(), event_type: 'JOURNAL_LINE_POSTED', sequence_number: 0,
        idempotency_key: uuid(), entity_id: testEntityId, period_id: reportPeriodId,
        timestamp: new Date().toISOString(),
        payload: {
          journal_entry_id: uuid(), ledger_line_id: uuid(),
          entity_id: testEntityId, period_id: reportPeriodId,
          fund_id: null, node_ref_id: nodeRefId, node_ref_type: 'Asset',
          economic_category: 'ASSET', statutory_code: null,
          side: 'DEBIT', functional_amount: 100000,
        },
      },
      // Liability: $40,000 credit
      {
        event_id: uuid(), event_type: 'JOURNAL_LINE_POSTED', sequence_number: 0,
        idempotency_key: uuid(), entity_id: testEntityId, period_id: reportPeriodId,
        timestamp: new Date().toISOString(),
        payload: {
          journal_entry_id: uuid(), ledger_line_id: uuid(),
          entity_id: testEntityId, period_id: reportPeriodId,
          fund_id: null, node_ref_id: nodeRefId, node_ref_type: 'Activity',
          economic_category: 'LIABILITY', statutory_code: null,
          side: 'CREDIT', functional_amount: 40000,
        },
      },
    ];

    for (const event of events) {
      await handleGLEvent(makePayload(event));
    }
  });

  it('generates P&L with correct revenue, expenses, and net income', async () => {
    const pnl = await getProfitAndLoss(testEntityId, reportPeriodId);
    expect(pnl.revenue).toBe(50000);
    expect(pnl.expenses).toBe(30000);
    expect(pnl.netIncome).toBe(20000);
  });

  it('generates Balance Sheet with correct totals', async () => {
    const bs = await getBalanceSheet(testEntityId, reportPeriodId);
    expect(bs.totalAssets).toBe(100000);
    expect(bs.totalLiabilities).toBe(40000);
    expect(bs.totalEquity).toBe(60000);
  });

  it('P&L includes category breakdown', async () => {
    const pnl = await getProfitAndLoss(testEntityId, reportPeriodId);
    expect(pnl.byCategory.length).toBeGreaterThanOrEqual(2);
    const revCat = pnl.byCategory.find((c) => c.economic_category === 'REVENUE');
    expect(revCat).toBeDefined();
    expect(revCat!.credit_total).toBe(50000);
  });
});

// ============================================================
// Statutory Mapping CRUD
// ============================================================

describe('GL Core — Statutory Mappings', () => {
  let mappingId: string;

  it('creates a statutory mapping', async () => {
    mappingId = await createStatutoryMapping({
      jurisdiction: 'CA-ASPE',
      nodeRefType: 'Activity',
      economicCategory: 'EXPENSE',
      statutoryAccountCode: '5210',
      statutoryAccountLabel: 'Advertising Expense',
      appliesFrom: '2025-01-01',
      xbrlElement: 'IE000024',
      xbrlTaxonomy: 'IFRS-GL-2024',
    });
    cleanupMappingIds.push(mappingId);

    const mapping = await getStatutoryMapping(mappingId);
    expect(mapping).not.toBeNull();
    expect(mapping!.statutory_account_code).toBe('5210');
    expect(mapping!.jurisdiction).toBe('CA-ASPE');
  });

  it('lists mappings by jurisdiction', async () => {
    // Create a second mapping
    const id2 = await createStatutoryMapping({
      jurisdiction: 'CA-ASPE',
      nodeRefType: 'Activity',
      economicCategory: 'REVENUE',
      statutoryAccountCode: '4110',
      statutoryAccountLabel: 'Service Revenue',
      appliesFrom: '2025-01-01',
    });
    cleanupMappingIds.push(id2);

    const mappings = await listStatutoryMappings('CA-ASPE');
    expect(mappings.length).toBeGreaterThanOrEqual(2);
  });

  it('resolves statutory code for a given context', async () => {
    const result = await resolveStatutoryCode(
      'CA-ASPE', 'Activity', 'EXPENSE', '2026-03-15',
    );
    expect(result).not.toBeNull();
    expect(result!.statutoryAccountCode).toBe('5210');
    expect(result!.statutoryAccountLabel).toBe('Advertising Expense');
  });

  it('returns null for unmatched resolution', async () => {
    const result = await resolveStatutoryCode(
      'JP-GAAP', 'Activity', 'EXPENSE', '2026-03-15',
    );
    expect(result).toBeNull();
  });

  it('updates a statutory mapping', async () => {
    const updated = await updateStatutoryMapping(mappingId, {
      statutoryAccountLabel: 'Marketing & Advertising Expense',
    });
    expect(updated).toBe(true);

    const mapping = await getStatutoryMapping(mappingId);
    expect(mapping!.statutory_account_label).toBe('Marketing & Advertising Expense');
  });

  it('deletes a statutory mapping', async () => {
    const tempId = await createStatutoryMapping({
      jurisdiction: 'US-GAAP',
      nodeRefType: 'Activity',
      economicCategory: 'EXPENSE',
      statutoryAccountCode: '6100',
      statutoryAccountLabel: 'Temp Mapping',
      appliesFrom: '2025-01-01',
    });

    const deleted = await deleteStatutoryMapping(tempId);
    expect(deleted).toBe(true);

    const mapping = await getStatutoryMapping(tempId);
    expect(mapping).toBeNull();
  });
});
