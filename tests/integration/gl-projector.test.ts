/**
 * GL Projector — Integration Test
 *
 * Verifies that JOURNAL_LINE_POSTED events are correctly projected
 * into the TimescaleDB gl_period_balances read model.
 *
 * Requires: PostgreSQL/TimescaleDB running with gl_period_balances table.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { v4 as uuid, v7 as uuidv7 } from 'uuid';
import { handleGLEvent } from '../../src/projectors/gl-projector.js';
import { query, closePg } from '../../src/lib/pg.js';
import type { EBGEvent } from '../../src/lib/kafka.js';
import type { EachMessagePayload } from 'kafkajs';

const TEST_ENTITY_ID = uuid();
const TEST_PERIOD_ID = uuidv7();  // Must be UUIDv7 for TimescaleDB hypertable
const TEST_NODE_REF_ID = uuid();
const NULL_FUND = '00000000-0000-0000-0000-000000000000';

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

afterAll(async () => {
  // Clean up test data
  await query(
    `DELETE FROM gl_period_balances WHERE entity_id = $1`,
    [TEST_ENTITY_ID],
  );
  await closePg();
});

beforeAll(async () => {
  // Clean any leftover test data
  await query(
    `DELETE FROM gl_period_balances WHERE entity_id = $1`,
    [TEST_ENTITY_ID],
  );
});

describe('GL Projector — Kafka → TimescaleDB', () => {
  it('projects a DEBIT JOURNAL_LINE_POSTED event to gl_period_balances', async () => {
    const event: EBGEvent = {
      event_id: uuid(),
      event_type: 'JOURNAL_LINE_POSTED',
      sequence_number: 0,
      idempotency_key: uuid(),
      entity_id: TEST_ENTITY_ID,
      period_id: TEST_PERIOD_ID,
      timestamp: new Date().toISOString(),
      payload: {
        journal_entry_id: uuid(),
        ledger_line_id: uuid(),
        entity_id: TEST_ENTITY_ID,
        period_id: TEST_PERIOD_ID,
        fund_id: null,
        node_ref_id: TEST_NODE_REF_ID,
        node_ref_type: 'Activity',
        economic_category: 'OPERATING_EXPENSE',
        statutory_code: null,
        side: 'DEBIT',
        functional_amount: 1000,
      },
    };

    await handleGLEvent(makePayload(event));

    const result = await query<{
      debit_total: string;
      credit_total: string;
      net_balance: string;
      transaction_count: string;
    }>(
      `SELECT debit_total, credit_total, net_balance, transaction_count
       FROM gl_period_balances
       WHERE entity_id = $1 AND period_id = $2 AND node_ref_id = $3`,
      [TEST_ENTITY_ID, TEST_PERIOD_ID, TEST_NODE_REF_ID],
    );

    expect(result.rows).toHaveLength(1);
    expect(Number(result.rows[0].debit_total)).toBe(1000);
    expect(Number(result.rows[0].credit_total)).toBe(0);
    expect(Number(result.rows[0].net_balance)).toBe(1000);
    expect(Number(result.rows[0].transaction_count)).toBe(1);
  });

  it('projects a CREDIT event and accumulates with existing balance', async () => {
    const event: EBGEvent = {
      event_id: uuid(),
      event_type: 'JOURNAL_LINE_POSTED',
      sequence_number: 0,
      idempotency_key: uuid(),
      entity_id: TEST_ENTITY_ID,
      period_id: TEST_PERIOD_ID,
      timestamp: new Date().toISOString(),
      payload: {
        journal_entry_id: uuid(),
        ledger_line_id: uuid(),
        entity_id: TEST_ENTITY_ID,
        period_id: TEST_PERIOD_ID,
        fund_id: null,
        node_ref_id: TEST_NODE_REF_ID,
        node_ref_type: 'Activity',
        economic_category: 'OPERATING_EXPENSE',
        statutory_code: null,
        side: 'CREDIT',
        functional_amount: 400,
      },
    };

    await handleGLEvent(makePayload(event));

    const result = await query<{
      debit_total: string;
      credit_total: string;
      net_balance: string;
      transaction_count: string;
    }>(
      `SELECT debit_total, credit_total, net_balance, transaction_count
       FROM gl_period_balances
       WHERE entity_id = $1 AND period_id = $2 AND node_ref_id = $3`,
      [TEST_ENTITY_ID, TEST_PERIOD_ID, TEST_NODE_REF_ID],
    );

    expect(result.rows).toHaveLength(1);
    expect(Number(result.rows[0].debit_total)).toBe(1000);
    expect(Number(result.rows[0].credit_total)).toBe(400);
    expect(Number(result.rows[0].net_balance)).toBe(600);
    expect(Number(result.rows[0].transaction_count)).toBe(2);
  });

  it('ignores non-JOURNAL_LINE_POSTED events', async () => {
    const event: EBGEvent = {
      event_id: uuid(),
      event_type: 'PERIOD_SOFT_CLOSED',
      sequence_number: 0,
      idempotency_key: uuid(),
      entity_id: TEST_ENTITY_ID,
      period_id: TEST_PERIOD_ID,
      timestamp: new Date().toISOString(),
      payload: {},
    };

    // Should not throw and should not change any data
    await handleGLEvent(makePayload(event));

    const result = await query<{ transaction_count: string }>(
      `SELECT transaction_count FROM gl_period_balances
       WHERE entity_id = $1 AND period_id = $2 AND node_ref_id = $3`,
      [TEST_ENTITY_ID, TEST_PERIOD_ID, TEST_NODE_REF_ID],
    );

    // Count unchanged from previous test
    expect(Number(result.rows[0].transaction_count)).toBe(2);
  });

  it('projects events with fund_id into separate rows', async () => {
    const fundId = uuid();
    const nodeRefId = uuid();

    const event: EBGEvent = {
      event_id: uuid(),
      event_type: 'JOURNAL_LINE_POSTED',
      sequence_number: 0,
      idempotency_key: uuid(),
      entity_id: TEST_ENTITY_ID,
      period_id: TEST_PERIOD_ID,
      timestamp: new Date().toISOString(),
      payload: {
        journal_entry_id: uuid(),
        ledger_line_id: uuid(),
        entity_id: TEST_ENTITY_ID,
        period_id: TEST_PERIOD_ID,
        fund_id: fundId,
        node_ref_id: nodeRefId,
        node_ref_type: 'Fund',
        economic_category: 'REVENUE',
        statutory_code: null,
        side: 'CREDIT',
        functional_amount: 5000,
      },
    };

    await handleGLEvent(makePayload(event));

    const result = await query<{
      fund_id: string;
      credit_total: string;
    }>(
      `SELECT fund_id, credit_total FROM gl_period_balances
       WHERE entity_id = $1 AND period_id = $2 AND node_ref_id = $3`,
      [TEST_ENTITY_ID, TEST_PERIOD_ID, nodeRefId],
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].fund_id).toBe(fundId);
    expect(Number(result.rows[0].credit_total)).toBe(5000);
  });
});
