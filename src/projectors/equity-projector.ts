/**
 * Equity Projector — Kafka consumer that maintains the TimescaleDB
 * equity_period_balances read model.
 *
 * Subscribes to: ebg.gl
 * Handles: EQUITY_COMPONENT_UPDATED events
 *
 * Projects retained earnings, OCI components, and recycling amounts
 * into the equity_period_balances table for fast equity section queries.
 */
import { EachMessagePayload } from 'kafkajs';
import { query } from '../lib/pg.js';
import { logger } from '../lib/logger.js';
import type { EBGEvent } from '../lib/kafka.js';

interface EquityComponentPayload {
  entity_id: string;
  period_id: string;
  fund_id: string | null;
  component: string;  // RETAINED_EARNINGS, OCI_CTA_COMPONENT, OCI_CASHFLOW_HEDGE, etc.
  opening_balance: number;
  movement: number;
  recycled_to_pnl: number;
  closing_balance: number;
}

/**
 * Handle equity component update events.
 * Upserts into equity_period_balances on the natural key
 * (entity_id, period_id, fund_id, component).
 */
export async function handleEquityEvent(payload: EachMessagePayload): Promise<void> {
  const { message } = payload;
  if (!message.value) return;

  const event: EBGEvent<EquityComponentPayload> = JSON.parse(message.value.toString());

  if (event.event_type !== 'EQUITY_COMPONENT_UPDATED') {
    return;
  }

  const eq = event.payload;

  await query(
    `INSERT INTO equity_period_balances
       (entity_id, period_id, fund_id, component,
        opening_balance, movement, recycled_to_pnl, closing_balance)
     VALUES ($1::uuid, $2::uuid,
             COALESCE($3::uuid, '00000000-0000-0000-0000-000000000000'::uuid),
             $4, $5::numeric, $6::numeric, $7::numeric, $8::numeric)
     ON CONFLICT (entity_id, period_id, fund_id, component)
     DO UPDATE SET
       opening_balance = $5::numeric,
       movement = $6::numeric,
       recycled_to_pnl = $7::numeric,
       closing_balance = $8::numeric,
       last_updated = now()`,
    [
      eq.entity_id,
      eq.period_id,
      eq.fund_id,
      eq.component,
      eq.opening_balance,
      eq.movement,
      eq.recycled_to_pnl,
      eq.closing_balance,
    ],
  );

  logger.debug(
    { entityId: eq.entity_id, component: eq.component },
    'Equity projection updated',
  );
}
