/**
 * AccountingPeriod Lifecycle Service
 *
 * Manages period status transitions:
 *   OPEN → SOFT_CLOSED → HARD_CLOSED
 *
 * SOFT_CLOSED: New postings require controller approval
 * HARD_CLOSED: No further postings allowed; period is immutable
 */
import { runCypher } from '../../lib/neo4j.js';
import { PeriodClosedError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

export type PeriodStatus = 'OPEN' | 'SOFT_CLOSED' | 'HARD_CLOSED';

interface PeriodTransitionResult {
  periodId: string;
  previousStatus: PeriodStatus;
  newStatus: PeriodStatus;
}

/**
 * Soft-close a period. Prevents new unapproved postings.
 * Emits PERIOD_SOFT_CLOSED event to Kafka.
 */
export async function softClosePeriod(
  periodId: string,
  closedBy: string,
): Promise<PeriodTransitionResult> {
  const results = await runCypher<{ oldStatus: PeriodStatus }>(
    `MATCH (p:AccountingPeriod {id: $periodId})
     RETURN p.status AS oldStatus`,
    { periodId },
  );

  if (results.length === 0) {
    throw new PeriodClosedError(periodId, 'NOT_FOUND');
  }

  const { oldStatus } = results[0];
  if (oldStatus !== 'OPEN') {
    throw new PeriodClosedError(periodId, oldStatus);
  }

  await runCypher(
    `MATCH (p:AccountingPeriod {id: $periodId})
     SET p.status = 'SOFT_CLOSED',
         p.soft_closed_at = datetime(),
         p.closed_by = $closedBy,
         p.updated_at = datetime()`,
    { periodId, closedBy },
  );

  logger.info({ periodId, closedBy }, 'Period soft-closed');

  return { periodId, previousStatus: oldStatus, newStatus: 'SOFT_CLOSED' };
}

/**
 * Hard-close a period. No further modifications allowed.
 * Must already be SOFT_CLOSED.
 */
export async function hardClosePeriod(
  periodId: string,
  closedBy: string,
): Promise<PeriodTransitionResult> {
  const results = await runCypher<{ oldStatus: PeriodStatus }>(
    `MATCH (p:AccountingPeriod {id: $periodId})
     RETURN p.status AS oldStatus`,
    { periodId },
  );

  if (results.length === 0) {
    throw new PeriodClosedError(periodId, 'NOT_FOUND');
  }

  const { oldStatus } = results[0];
  if (oldStatus !== 'SOFT_CLOSED') {
    throw new PeriodClosedError(
      periodId,
      oldStatus === 'OPEN' ? 'Must soft-close before hard-closing' : oldStatus,
    );
  }

  await runCypher(
    `MATCH (p:AccountingPeriod {id: $periodId})
     SET p.status = 'HARD_CLOSED',
         p.hard_closed_at = datetime(),
         p.closed_by = $closedBy,
         p.updated_at = datetime()`,
    { periodId, closedBy },
  );

  logger.info({ periodId, closedBy }, 'Period hard-closed');

  return { periodId, previousStatus: oldStatus, newStatus: 'HARD_CLOSED' };
}

/**
 * Re-open a soft-closed period (only from SOFT_CLOSED, never from HARD_CLOSED).
 */
export async function reopenPeriod(
  periodId: string,
  reopenedBy: string,
): Promise<PeriodTransitionResult> {
  const results = await runCypher<{ oldStatus: PeriodStatus }>(
    `MATCH (p:AccountingPeriod {id: $periodId})
     RETURN p.status AS oldStatus`,
    { periodId },
  );

  if (results.length === 0) {
    throw new PeriodClosedError(periodId, 'NOT_FOUND');
  }

  const { oldStatus } = results[0];
  if (oldStatus !== 'SOFT_CLOSED') {
    throw new PeriodClosedError(
      periodId,
      oldStatus === 'HARD_CLOSED' ? 'Cannot reopen hard-closed period' : oldStatus,
    );
  }

  await runCypher(
    `MATCH (p:AccountingPeriod {id: $periodId})
     SET p.status = 'OPEN',
         p.soft_closed_at = null,
         p.closed_by = null,
         p.updated_at = datetime()`,
    { periodId, reopenedBy },
  );

  logger.info({ periodId, reopenedBy }, 'Period re-opened');

  return { periodId, previousStatus: oldStatus, newStatus: 'OPEN' };
}
