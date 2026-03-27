/**
 * Kafka Consumer Manager
 *
 * Manages long-running Kafka consumers with:
 * - Auto-restart on failure with exponential backoff
 * - Health monitoring with per-consumer status
 * - Graceful shutdown
 * - Message count and error tracking
 */
import { Consumer } from 'kafkajs';
import { createConsumer, type EBGTopic } from '../lib/kafka.js';
import { logger } from '../lib/logger.js';

export interface ConsumerConfig {
  name: string;
  groupId: string;
  topics: EBGTopic[];
  handler: (payload: any) => Promise<void>;
}

export interface ConsumerStatus {
  name: string;
  status: 'running' | 'stopped' | 'error' | 'restarting';
  messagesProcessed: number;
  errorsCount: number;
  lastMessageAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  restartCount: number;
  startedAt: string | null;
}

interface ManagedConsumer {
  config: ConsumerConfig;
  consumer: Consumer | null;
  status: ConsumerStatus;
  stopRequested: boolean;
}

const MAX_RESTART_DELAY_MS = 60_000;  // 1 minute max backoff
const INITIAL_RESTART_DELAY_MS = 1_000; // 1 second initial

export class ConsumerManager {
  private consumers: Map<string, ManagedConsumer> = new Map();
  private running = false;

  /**
   * Register a consumer configuration. Does not start it yet.
   */
  register(config: ConsumerConfig): void {
    if (this.consumers.has(config.name)) {
      throw new Error(`Consumer "${config.name}" already registered`);
    }
    this.consumers.set(config.name, {
      config,
      consumer: null,
      status: {
        name: config.name,
        status: 'stopped',
        messagesProcessed: 0,
        errorsCount: 0,
        lastMessageAt: null,
        lastErrorAt: null,
        lastError: null,
        restartCount: 0,
        startedAt: null,
      },
      stopRequested: false,
    });
  }

  /**
   * Start all registered consumers.
   */
  async startAll(): Promise<void> {
    this.running = true;
    const startPromises: Promise<void>[] = [];
    for (const [name] of this.consumers) {
      startPromises.push(this.startConsumer(name));
    }
    await Promise.allSettled(startPromises);
    logger.info({ consumers: Array.from(this.consumers.keys()) }, 'All Kafka consumers started');
  }

  /**
   * Start a single consumer with error handling and auto-restart.
   */
  private async startConsumer(name: string): Promise<void> {
    const managed = this.consumers.get(name);
    if (!managed) return;
    if (managed.stopRequested) return;

    const { config, status } = managed;

    try {
      // Wrap the handler to track messages and errors
      const wrappedHandler = async (payload: any) => {
        try {
          await config.handler(payload);
          status.messagesProcessed++;
          status.lastMessageAt = new Date().toISOString();
        } catch (err) {
          status.errorsCount++;
          status.lastErrorAt = new Date().toISOString();
          status.lastError = (err as Error).message;
          logger.error(
            { consumer: name, err: (err as Error).message },
            'Consumer handler error',
          );
          // Don't rethrow — let the consumer continue processing
        }
      };

      managed.consumer = await createConsumer(config.groupId, config.topics, wrappedHandler);
      status.status = 'running';
      status.startedAt = new Date().toISOString();

      // Set up crash handler for consumer-level errors
      managed.consumer.on('consumer.crash', async (event) => {
        const error = event.payload.error;
        logger.error(
          { consumer: name, err: error.message },
          'Consumer crashed, scheduling restart',
        );
        status.status = 'error';
        status.lastError = error.message;
        status.lastErrorAt = new Date().toISOString();

        if (!managed.stopRequested && this.running) {
          await this.scheduleRestart(name);
        }
      });

      logger.info({ consumer: name, topics: config.topics }, 'Consumer started');
    } catch (err) {
      status.status = 'error';
      status.lastError = (err as Error).message;
      status.lastErrorAt = new Date().toISOString();
      logger.error(
        { consumer: name, err: (err as Error).message },
        'Failed to start consumer',
      );

      if (!managed.stopRequested && this.running) {
        await this.scheduleRestart(name);
      }
    }
  }

  /**
   * Restart a consumer with exponential backoff.
   */
  private async scheduleRestart(name: string): Promise<void> {
    const managed = this.consumers.get(name);
    if (!managed || managed.stopRequested || !this.running) return;

    managed.status.restartCount++;
    managed.status.status = 'restarting';

    const delay = Math.min(
      INITIAL_RESTART_DELAY_MS * Math.pow(2, managed.status.restartCount - 1),
      MAX_RESTART_DELAY_MS,
    );

    logger.info(
      { consumer: name, restartCount: managed.status.restartCount, delayMs: delay },
      'Scheduling consumer restart',
    );

    // Disconnect old consumer if it exists
    if (managed.consumer) {
      try {
        await managed.consumer.disconnect();
      } catch { /* ignore disconnect errors */ }
      managed.consumer = null;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));

    if (!managed.stopRequested && this.running) {
      await this.startConsumer(name);
    }
  }

  /**
   * Stop all consumers gracefully.
   */
  async stopAll(): Promise<void> {
    this.running = false;
    logger.info('Stopping all Kafka consumers...');

    const stopPromises: Promise<void>[] = [];
    for (const [, managed] of this.consumers) {
      managed.stopRequested = true;
      if (managed.consumer) {
        stopPromises.push(
          managed.consumer.disconnect()
            .then(() => {
              managed.status.status = 'stopped';
              managed.consumer = null;
            })
            .catch((err) => {
              logger.error({ consumer: managed.config.name, err: (err as Error).message }, 'Error stopping consumer');
              managed.status.status = 'stopped';
              managed.consumer = null;
            }),
        );
      }
    }

    await Promise.allSettled(stopPromises);
    logger.info('All Kafka consumers stopped');
  }

  /**
   * Get health status of all consumers.
   */
  getStatus(): ConsumerStatus[] {
    return Array.from(this.consumers.values()).map((m) => ({ ...m.status }));
  }

  /**
   * Check if all consumers are healthy (running with recent activity).
   */
  isHealthy(): boolean {
    if (!this.running) return false;
    for (const [, managed] of this.consumers) {
      if (managed.status.status !== 'running') return false;
    }
    return true;
  }
}

// Singleton instance
let _manager: ConsumerManager | null = null;

export function getConsumerManager(): ConsumerManager {
  if (!_manager) {
    _manager = new ConsumerManager();
  }
  return _manager;
}
