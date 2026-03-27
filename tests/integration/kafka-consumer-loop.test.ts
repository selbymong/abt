/**
 * Kafka Consumer Loop — Integration Tests
 *
 * Tests the ConsumerManager lifecycle, health monitoring, and
 * projector handler registration.
 *
 * Note: These tests verify the consumer manager logic without
 * requiring a running Kafka instance. Full end-to-end consumer
 * tests require Docker infrastructure.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ConsumerManager, type ConsumerStatus } from '../../src/projectors/consumer-manager.js';

describe('P7-KAFKA-CONSUMER-LOOP', () => {
  let manager: ConsumerManager;

  beforeEach(() => {
    manager = new ConsumerManager();
  });

  // ========== Registration ==========

  it('should register consumers', () => {
    manager.register({
      name: 'test-consumer',
      groupId: 'test-group',
      topics: ['ebg.gl'],
      handler: async () => {},
    });

    const statuses = manager.getStatus();
    expect(statuses.length).toBe(1);
    expect(statuses[0].name).toBe('test-consumer');
    expect(statuses[0].status).toBe('stopped');
    expect(statuses[0].messagesProcessed).toBe(0);
    expect(statuses[0].errorsCount).toBe(0);
  });

  it('should reject duplicate consumer names', () => {
    manager.register({
      name: 'dup-consumer',
      groupId: 'group-1',
      topics: ['ebg.gl'],
      handler: async () => {},
    });

    expect(() =>
      manager.register({
        name: 'dup-consumer',
        groupId: 'group-2',
        topics: ['ebg.graph'],
        handler: async () => {},
      }),
    ).toThrow('already registered');
  });

  it('should register multiple consumers', () => {
    manager.register({
      name: 'gl-projector',
      groupId: 'ebg-gl-projector',
      topics: ['ebg.gl'],
      handler: async () => {},
    });

    manager.register({
      name: 'equity-projector',
      groupId: 'ebg-equity-projector',
      topics: ['ebg.gl'],
      handler: async () => {},
    });

    const statuses = manager.getStatus();
    expect(statuses.length).toBe(2);
    expect(statuses.map((s) => s.name)).toContain('gl-projector');
    expect(statuses.map((s) => s.name)).toContain('equity-projector');
  });

  // ========== Health Status ==========

  it('should report unhealthy when not running', () => {
    expect(manager.isHealthy()).toBe(false);
  });

  it('should return initial status with zero counts', () => {
    manager.register({
      name: 'test-consumer',
      groupId: 'test-group',
      topics: ['ebg.gl'],
      handler: async () => {},
    });

    const statuses = manager.getStatus();
    const status = statuses[0];

    expect(status.messagesProcessed).toBe(0);
    expect(status.errorsCount).toBe(0);
    expect(status.lastMessageAt).toBeNull();
    expect(status.lastErrorAt).toBeNull();
    expect(status.lastError).toBeNull();
    expect(status.restartCount).toBe(0);
    expect(status.startedAt).toBeNull();
  });

  // ========== Status Shape ==========

  it('should return ConsumerStatus with correct shape', () => {
    manager.register({
      name: 'shape-test',
      groupId: 'test-group',
      topics: ['ebg.gl'],
      handler: async () => {},
    });

    const status = manager.getStatus()[0] as ConsumerStatus;
    expect(status).toHaveProperty('name');
    expect(status).toHaveProperty('status');
    expect(status).toHaveProperty('messagesProcessed');
    expect(status).toHaveProperty('errorsCount');
    expect(status).toHaveProperty('lastMessageAt');
    expect(status).toHaveProperty('lastErrorAt');
    expect(status).toHaveProperty('lastError');
    expect(status).toHaveProperty('restartCount');
    expect(status).toHaveProperty('startedAt');
  });

  // ========== Stop without start ==========

  it('should handle stopAll gracefully when no consumers started', async () => {
    manager.register({
      name: 'not-started',
      groupId: 'test-group',
      topics: ['ebg.gl'],
      handler: async () => {},
    });

    // Should not throw
    await manager.stopAll();
    const status = manager.getStatus()[0];
    expect(status.status).toBe('stopped');
  });

  // ========== Projector Handler Exports ==========

  it('should import GL projector handler', async () => {
    const { handleGLEvent } = await import('../../src/projectors/gl-projector.js');
    expect(typeof handleGLEvent).toBe('function');
  });

  it('should import equity projector handler', async () => {
    const { handleEquityEvent } = await import('../../src/projectors/equity-projector.js');
    expect(typeof handleEquityEvent).toBe('function');
  });

  it('should import consumer registration module', async () => {
    const { startConsumers, stopConsumers } = await import('../../src/projectors/index.js');
    expect(typeof startConsumers).toBe('function');
    expect(typeof stopConsumers).toBe('function');
  });
});
