import { EachMessagePayload } from 'kafkajs';
import { query } from '../lib/pg.js';
import { logger } from '../lib/logger.js';
import type { EBGEvent } from '../lib/kafka.js';

interface JournalLinePayload {
  journal_entry_id: string;
  ledger_line_id: string;
  entity_id: string;
  period_id: string;
  fund_id: string | null;
  node_ref_id: string;
  node_ref_type: string;
  economic_category: string;
  statutory_code: string | null;
  side: 'DEBIT' | 'CREDIT';
  functional_amount: number;
}

/**
 * GL Projector — Kafka consumer that maintains the TimescaleDB
 * gl_period_balances read model.
 *
 * Subscribes to: ebg.gl
 * Handles: JOURNAL_LINE_POSTED events
 *
 * Upserts into gl_period_balances on the natural key
 * (entity_id, period_id, fund_id, node_ref_id, economic_category).
 */
export async function handleGLEvent(payload: EachMessagePayload): Promise<void> {
  const { message } = payload;
  if (!message.value) return;

  const event: EBGEvent<JournalLinePayload> = JSON.parse(message.value.toString());

  if (event.event_type !== 'JOURNAL_LINE_POSTED') {
    return;
  }

  const line = event.payload;
  const debit = line.side === 'DEBIT' ? line.functional_amount : 0;
  const credit = line.side === 'CREDIT' ? line.functional_amount : 0;

  await query(
    `INSERT INTO gl_period_balances
       (entity_id, period_id, fund_id, node_ref_id, node_ref_type,
        economic_category, statutory_code, debit_total, credit_total,
        net_balance, transaction_count)
     VALUES ($1::uuid, $2::uuid, COALESCE($3::uuid, '00000000-0000-0000-0000-000000000000'::uuid),
             $4::uuid, $5, $6, $7, $8::numeric, $9::numeric, $8::numeric - $9::numeric, 1)
     ON CONFLICT (entity_id, period_id, fund_id, node_ref_id, economic_category)
     DO UPDATE SET
       debit_total = gl_period_balances.debit_total + $8::numeric,
       credit_total = gl_period_balances.credit_total + $9::numeric,
       net_balance = (gl_period_balances.debit_total + $8::numeric) - (gl_period_balances.credit_total + $9::numeric),
       transaction_count = gl_period_balances.transaction_count + 1,
       last_updated = now()`,
    [
      line.entity_id,
      line.period_id,
      line.fund_id,
      line.node_ref_id,
      line.node_ref_type,
      line.economic_category,
      line.statutory_code,
      debit,
      credit,
    ],
  );

  logger.debug(
    { journalEntryId: line.journal_entry_id, ledgerLineId: line.ledger_line_id },
    'GL projection updated',
  );
}

/**
 * Handle cancelled journal entries — subtract previously added amounts.
 */
export async function handleJournalEntryCancelled(payload: EachMessagePayload): Promise<void> {
  const { message } = payload;
  if (!message.value) return;

  const event: EBGEvent<JournalLinePayload> = JSON.parse(message.value.toString());

  if (event.event_type !== 'JOURNAL_ENTRY_CANCELLED') {
    return;
  }

  const line = event.payload;
  const debit = line.side === 'DEBIT' ? line.functional_amount : 0;
  const credit = line.side === 'CREDIT' ? line.functional_amount : 0;

  await query(
    `UPDATE gl_period_balances SET
       debit_total = debit_total - $5,
       credit_total = credit_total - $6,
       net_balance = (debit_total - $5) - (credit_total - $6),
       transaction_count = transaction_count - 1,
       last_updated = now()
     WHERE entity_id = $1 AND period_id = $2
       AND fund_id = COALESCE($3, '00000000-0000-0000-0000-000000000000'::uuid)
       AND node_ref_id = $4`,
    [line.entity_id, line.period_id, line.fund_id, line.node_ref_id, debit, credit],
  );

  logger.info(
    { journalEntryId: line.journal_entry_id },
    'GL projection reversed (cancellation)',
  );
}
