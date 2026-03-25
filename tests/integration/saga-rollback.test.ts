/**
 * Saga Rollback Integration Test
 *
 * Verifies that the saga coordinator correctly compensates
 * completed steps when a later step fails.
 *
 * Does NOT require databases — uses in-memory mock steps.
 */
import { describe, it, expect } from 'vitest';
import { executeSaga, SagaStep } from '../../src/saga/saga-coordinator.js';
import { SagaRollbackError } from '../../src/lib/errors.js';

describe('Saga Coordinator — Rollback', () => {
  it('compensates completed steps in reverse order on failure', async () => {
    const log: string[] = [];

    const steps: SagaStep[] = [
      {
        name: 'step1_neo4j',
        execute: async () => { log.push('exec:1'); return 'neo4j_done'; },
        compensate: async () => { log.push('comp:1'); },
      },
      {
        name: 'step2_pg',
        execute: async () => { log.push('exec:2'); return 'pg_done'; },
        compensate: async () => { log.push('comp:2'); },
      },
      {
        name: 'step3_timescale',
        execute: async () => {
          log.push('exec:3');
          throw new Error('TimescaleDB connection lost');
        },
        compensate: async () => { log.push('comp:3'); },
      },
      {
        name: 'step4_kafka',
        execute: async () => { log.push('exec:4'); return 'kafka_done'; },
        compensate: async () => { log.push('comp:4'); },
      },
    ];

    await expect(executeSaga(steps)).rejects.toThrow(SagaRollbackError);

    // Steps 1 and 2 executed, step 3 failed, step 4 never ran
    expect(log).toContain('exec:1');
    expect(log).toContain('exec:2');
    expect(log).toContain('exec:3');
    expect(log).not.toContain('exec:4');

    // Compensation ran in reverse: step 2 then step 1
    // Step 3's compensate should NOT run (it never completed)
    expect(log).toContain('comp:2');
    expect(log).toContain('comp:1');
    expect(log).not.toContain('comp:3');
    expect(log).not.toContain('comp:4');

    // Verify reverse order: comp:2 before comp:1
    const comp2Idx = log.indexOf('comp:2');
    const comp1Idx = log.indexOf('comp:1');
    expect(comp2Idx).toBeLessThan(comp1Idx);
  });

  it('succeeds when all steps pass and returns context with results', async () => {
    const steps: SagaStep[] = [
      {
        name: 'write_neo4j',
        execute: async () => ({ nodeId: 'abc-123' }),
        compensate: async () => {},
      },
      {
        name: 'write_audit',
        execute: async (ctx) => {
          // Can access previous step result via context
          const prev = ctx.data['write_neo4j'] as { nodeId: string };
          return { auditId: `audit-${prev.nodeId}` };
        },
        compensate: async () => {},
      },
    ];

    const result = await executeSaga(steps);

    expect(result.sagaId).toBeDefined();
    expect(result.data['write_neo4j']).toEqual({ nodeId: 'abc-123' });
    expect(result.data['write_audit']).toEqual({ auditId: 'audit-abc-123' });
  });

  it('throws SagaRollbackError with correct details on failure', async () => {
    const steps: SagaStep[] = [
      {
        name: 'ok_step',
        execute: async () => 'ok',
        compensate: async () => {},
      },
      {
        name: 'failing_step',
        execute: async () => { throw new Error('disk full'); },
        compensate: async () => {},
      },
    ];

    try {
      await executeSaga(steps);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(SagaRollbackError);
      const sagaErr = err as SagaRollbackError;
      expect(sagaErr.message).toContain('failing_step');
      expect(sagaErr.message).toContain('disk full');
    }
  });

  it('logs critical error when compensation itself fails', async () => {
    const log: string[] = [];

    const steps: SagaStep[] = [
      {
        name: 'step_a',
        execute: async () => { log.push('exec:a'); return 'done'; },
        compensate: async () => {
          log.push('comp:a:fail');
          throw new Error('compensation also failed');
        },
      },
      {
        name: 'step_b',
        execute: async () => {
          log.push('exec:b');
          throw new Error('step b exploded');
        },
        compensate: async () => { log.push('comp:b'); },
      },
    ];

    // Should still throw the original SagaRollbackError even if compensation fails
    await expect(executeSaga(steps)).rejects.toThrow(SagaRollbackError);

    // Step a executed and its compensation was attempted (even though it failed)
    expect(log).toContain('exec:a');
    expect(log).toContain('comp:a:fail');
  });
});
