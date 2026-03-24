import { v4 as uuid } from 'uuid';
import { logger } from '../lib/logger.js';
import { SagaRollbackError } from '../lib/errors.js';

export interface SagaStep<T = unknown> {
  name: string;
  execute: (context: SagaContext) => Promise<T>;
  compensate: (context: SagaContext) => Promise<void>;
}

export interface SagaContext {
  sagaId: string;
  data: Record<string, unknown>;
}

/**
 * Cross-store saga coordinator.
 *
 * Executes steps in order. If any step fails, compensating transactions
 * are run in reverse order for all previously completed steps.
 *
 * Steps for journal posting:
 *   1. Write JournalEntry + LedgerLines to Neo4j
 *   2. Write audit_log to PostgreSQL
 *   3. Update gl_period_balances in TimescaleDB
 *   4. Emit JOURNAL_LINE_POSTED to Kafka (last — non-compensable, retried)
 */
export async function executeSaga(
  steps: SagaStep[],
  initialData: Record<string, unknown> = {},
): Promise<SagaContext> {
  const sagaId = uuid();
  const context: SagaContext = { sagaId, data: { ...initialData } };
  const completed: SagaStep[] = [];

  logger.info({ sagaId, stepCount: steps.length }, 'Saga started');

  for (const step of steps) {
    try {
      logger.debug({ sagaId, step: step.name }, 'Executing saga step');
      const result = await step.execute(context);
      context.data[step.name] = result;
      completed.push(step);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error({ sagaId, step: step.name, error: errMsg }, 'Saga step failed, compensating');

      // Compensate in reverse order
      for (const completedStep of completed.reverse()) {
        try {
          logger.debug({ sagaId, step: completedStep.name }, 'Running compensation');
          await completedStep.compensate(context);
        } catch (compError) {
          const compMsg = compError instanceof Error ? compError.message : String(compError);
          logger.error(
            { sagaId, step: completedStep.name, error: compMsg },
            'CRITICAL: Compensation failed — manual intervention required',
          );
        }
      }

      throw new SagaRollbackError(sagaId, step.name, errMsg);
    }
  }

  logger.info({ sagaId }, 'Saga completed successfully');
  return context;
}
