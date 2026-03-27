/**
 * Kafka Consumer Registration
 *
 * Registers all projector consumers with the ConsumerManager.
 * Called from the main server to start event-driven projections.
 */
import { getConsumerManager } from './consumer-manager.js';
import { handleGLEvent } from './gl-projector.js';
import { handleEquityEvent } from './equity-projector.js';
import { logger } from '../lib/logger.js';

/**
 * Register and start all Kafka consumers.
 * Call this after the server is listening.
 */
export async function startConsumers(): Promise<void> {
  const manager = getConsumerManager();

  // GL Projector: maintains gl_period_balances from journal line events
  manager.register({
    name: 'gl-projector',
    groupId: 'ebg-gl-projector',
    topics: ['ebg.gl'],
    handler: handleGLEvent,
  });

  // Equity Projector: maintains equity_period_balances from equity events
  manager.register({
    name: 'equity-projector',
    groupId: 'ebg-equity-projector',
    topics: ['ebg.gl'],
    handler: handleEquityEvent,
  });

  try {
    await manager.startAll();
  } catch (err) {
    logger.error({ err: (err as Error).message }, 'Failed to start Kafka consumers');
    // Don't crash the server — consumers will retry
  }
}

/**
 * Stop all Kafka consumers gracefully.
 */
export async function stopConsumers(): Promise<void> {
  const manager = getConsumerManager();
  await manager.stopAll();
}
