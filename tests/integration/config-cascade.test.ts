/**
 * ConfigurationService Cascade Resolution — Integration Test
 *
 * Verifies the 4-level cascade: entity-pair → program → entity → system.
 * Tests bi-temporal validity (valid_from / valid_until).
 *
 * Requires: PostgreSQL running with configuration_settings table.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { resolveConfig, setConfig, getConfigValue } from '../../src/services/config/configuration-service.js';
import { query, closePg } from '../../src/lib/pg.js';

const TEST_ENTITY = '11111111-1111-1111-1111-111111111111';
const TEST_ENTITY_2 = '22222222-2222-2222-2222-222222222222';
const TEST_PROGRAM = '33333333-3333-3333-3333-333333333333';
const TEST_USER = '00000000-0000-0000-0000-000000000099';

afterAll(async () => {
  // Clean up test data
  await query(
    `DELETE FROM configuration_settings WHERE changed_by = $1`,
    [TEST_USER],
  );
  await closePg();
});

beforeAll(async () => {
  // Clean any leftover test data
  await query(
    `DELETE FROM configuration_settings WHERE changed_by = $1`,
    [TEST_USER],
  );

  // Seed test config at multiple scopes
  await setConfig({
    key: 'test_cascade_key',
    scopeType: 'SYSTEM',
    valueType: 'STRING',
    valueString: 'system_value',
    validFrom: '2024-01-01',
    changedBy: TEST_USER,
    changeReason: 'integration test',
  });

  await setConfig({
    key: 'test_cascade_key',
    scopeType: 'ENTITY',
    scopeId: TEST_ENTITY,
    valueType: 'STRING',
    valueString: 'entity_value',
    validFrom: '2024-01-01',
    changedBy: TEST_USER,
    changeReason: 'integration test',
  });

  await setConfig({
    key: 'test_cascade_key',
    scopeType: 'ENTITY_PAIR',
    scopeId: TEST_ENTITY,
    scopeId2: TEST_ENTITY_2,
    valueType: 'STRING',
    valueString: 'entity_pair_value',
    validFrom: '2024-01-01',
    changedBy: TEST_USER,
    changeReason: 'integration test',
  });

  // Temporal test: a config that expires
  await setConfig({
    key: 'test_temporal_key',
    scopeType: 'ENTITY',
    scopeId: TEST_ENTITY,
    valueType: 'NUMERIC',
    valueNumeric: 50000,
    validFrom: '2024-01-01',
    validUntil: '2024-06-30',
    changedBy: TEST_USER,
    changeReason: 'integration test — expires mid-year',
  });

  await setConfig({
    key: 'test_temporal_key',
    scopeType: 'ENTITY',
    scopeId: TEST_ENTITY,
    valueType: 'NUMERIC',
    valueNumeric: 75000,
    validFrom: '2024-07-01',
    changedBy: TEST_USER,
    changeReason: 'integration test — new value after mid-year',
  });

  // JSON value test
  await setConfig({
    key: 'test_json_key',
    scopeType: 'ENTITY',
    scopeId: TEST_ENTITY,
    valueType: 'JSON',
    valueJson: { tiers: [{ role: 'MANAGER', max: 10000 }] },
    validFrom: '2024-01-01',
    changedBy: TEST_USER,
    changeReason: 'integration test',
  });
});

describe('ConfigurationService — Cascade Resolution', () => {
  it('resolves entity-pair scope over entity and system', async () => {
    const result = await resolveConfig('test_cascade_key', {
      entityId: TEST_ENTITY,
      entityId2: TEST_ENTITY_2,
      asOfDate: '2024-03-15',
    });

    expect(result).not.toBeNull();
    expect(result!.value_string).toBe('entity_pair_value');
    expect(result!.scope_type).toBe('ENTITY_PAIR');
  });

  it('falls back to entity scope when no entity-pair match', async () => {
    const result = await resolveConfig('test_cascade_key', {
      entityId: TEST_ENTITY,
      asOfDate: '2024-03-15',
    });

    expect(result).not.toBeNull();
    expect(result!.value_string).toBe('entity_value');
    expect(result!.scope_type).toBe('ENTITY');
  });

  it('falls back to system scope when no entity match', async () => {
    const unknownEntity = '99999999-9999-9999-9999-999999999999';
    const result = await resolveConfig('test_cascade_key', {
      entityId: unknownEntity,
      asOfDate: '2024-03-15',
    });

    expect(result).not.toBeNull();
    expect(result!.value_string).toBe('system_value');
    expect(result!.scope_type).toBe('SYSTEM');
  });

  it('returns system scope when no entityId provided', async () => {
    const result = await resolveConfig('test_cascade_key', {
      asOfDate: '2024-03-15',
    });

    expect(result).not.toBeNull();
    expect(result!.value_string).toBe('system_value');
  });

  it('returns null for unknown key', async () => {
    const result = await resolveConfig('nonexistent_key_xyz', {
      asOfDate: '2024-03-15',
    });

    expect(result).toBeNull();
  });

  it('respects bi-temporal validity: returns first period value', async () => {
    const result = await resolveConfig('test_temporal_key', {
      entityId: TEST_ENTITY,
      asOfDate: '2024-03-15',
    });

    expect(result).not.toBeNull();
    expect(Number(result!.value_numeric)).toBe(50000);
  });

  it('respects bi-temporal validity: returns second period value', async () => {
    const result = await resolveConfig('test_temporal_key', {
      entityId: TEST_ENTITY,
      asOfDate: '2024-08-15',
    });

    expect(result).not.toBeNull();
    expect(Number(result!.value_numeric)).toBe(75000);
  });

  it('getConfigValue extracts JSON value correctly', async () => {
    const result = await getConfigValue<{ tiers: { role: string; max: number }[] }>(
      'test_json_key',
      { entityId: TEST_ENTITY, asOfDate: '2024-03-15' },
    );

    expect(result).not.toBeNull();
    expect(result!.tiers).toHaveLength(1);
    expect(result!.tiers[0].role).toBe('MANAGER');
    expect(result!.tiers[0].max).toBe(10000);
  });
});
