import { query } from '../../lib/pg.js';
import { logger } from '../../lib/logger.js';
import { ConfigNotFoundError } from '../../lib/errors.js';

export type ScopeType = 'SYSTEM' | 'ENTITY' | 'ENTITY_PAIR' | 'PROGRAM' | 'OUTCOME';

export interface ConfigValue {
  id: string;
  setting_key: string;
  scope_type: ScopeType;
  scope_id: string | null;
  value_string: string | null;
  value_numeric: number | null;
  value_boolean: boolean | null;
  value_json: unknown | null;
  valid_from: string;
  valid_until: string | null;
}

/**
 * resolveConfig — Configuration resolution with cascade fallback.
 *
 * Resolution order (first match wins):
 *   1. Entity-scoped setting for this entity (scope_type=ENTITY, scope_id=entityId)
 *   2. System-scoped setting (scope_type=SYSTEM, scope_id IS NULL)
 *   3. Hardcoded default (caller provides)
 *
 * For ENTITY_PAIR scope, pass both entity IDs.
 * All lookups are bi-temporal: only returns settings valid at the given date.
 */
export async function resolveConfig(
  key: string,
  options: {
    entityId?: string;
    entityId2?: string;
    programId?: string;
    asOfDate?: string;
  } = {},
): Promise<ConfigValue | null> {
  const asOf = options.asOfDate ?? new Date().toISOString().split('T')[0];

  // Try entity-pair scope first
  if (options.entityId && options.entityId2) {
    const result = await query<ConfigValue>(
      `SELECT * FROM configuration_settings
       WHERE setting_key = $1
         AND scope_type = 'ENTITY_PAIR'
         AND scope_id = $2 AND scope_id_2 = $3
         AND valid_from <= $4::date
         AND (valid_until IS NULL OR valid_until > $4::date)
       ORDER BY valid_from DESC LIMIT 1`,
      [key, options.entityId, options.entityId2, asOf],
    );
    if (result.rows.length > 0) return result.rows[0];
  }

  // Try program scope
  if (options.programId) {
    const result = await query<ConfigValue>(
      `SELECT * FROM configuration_settings
       WHERE setting_key = $1
         AND scope_type = 'PROGRAM'
         AND scope_id = $2
         AND valid_from <= $3::date
         AND (valid_until IS NULL OR valid_until > $3::date)
       ORDER BY valid_from DESC LIMIT 1`,
      [key, options.programId, asOf],
    );
    if (result.rows.length > 0) return result.rows[0];
  }

  // Try entity scope
  if (options.entityId) {
    const result = await query<ConfigValue>(
      `SELECT * FROM configuration_settings
       WHERE setting_key = $1
         AND scope_type = 'ENTITY'
         AND scope_id = $2
         AND valid_from <= $3::date
         AND (valid_until IS NULL OR valid_until > $3::date)
       ORDER BY valid_from DESC LIMIT 1`,
      [key, options.entityId, asOf],
    );
    if (result.rows.length > 0) return result.rows[0];
  }

  // Fall back to system scope
  const result = await query<ConfigValue>(
    `SELECT * FROM configuration_settings
     WHERE setting_key = $1
       AND scope_type = 'SYSTEM'
       AND scope_id IS NULL
       AND valid_from <= $2::date
       AND (valid_until IS NULL OR valid_until > $2::date)
     ORDER BY valid_from DESC LIMIT 1`,
    [key, asOf],
  );

  return result.rows[0] ?? null;
}

/**
 * resolveConfigRequired — Same as resolveConfig but throws if not found.
 */
export async function resolveConfigRequired(
  key: string,
  options: Parameters<typeof resolveConfig>[1] = {},
): Promise<ConfigValue> {
  const value = await resolveConfig(key, options);
  if (!value) {
    throw new ConfigNotFoundError(key, options.entityId ?? 'SYSTEM');
  }
  return value;
}

/**
 * setConfig — Insert or update a configuration setting.
 */
export async function setConfig(params: {
  key: string;
  scopeType: ScopeType;
  scopeId?: string;
  scopeId2?: string;
  valueType: 'STRING' | 'NUMERIC' | 'BOOLEAN' | 'JSON' | 'ENUM';
  valueString?: string;
  valueNumeric?: number;
  valueBoolean?: boolean;
  valueJson?: unknown;
  validFrom: string;
  validUntil?: string;
  changedBy: string;
  changeReason?: string;
  requiresRestatement?: boolean;
}): Promise<ConfigValue> {
  const result = await query<ConfigValue>(
    `INSERT INTO configuration_settings
       (setting_key, scope_type, scope_id, scope_id_2,
        value_type, value_string, value_numeric, value_boolean, value_json,
        valid_from, valid_until, changed_by, change_reason, requires_restatement)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::date, $11::date, $12, $13, $14)
     RETURNING *`,
    [
      params.key, params.scopeType, params.scopeId ?? null, params.scopeId2 ?? null,
      params.valueType, params.valueString ?? null, params.valueNumeric ?? null,
      params.valueBoolean ?? null,
      params.valueJson ? JSON.stringify(params.valueJson) : null,
      params.validFrom, params.validUntil ?? null,
      params.changedBy, params.changeReason ?? null,
      params.requiresRestatement ?? false,
    ],
  );

  logger.info({ key: params.key, scope: params.scopeType }, 'Configuration setting saved');
  return result.rows[0];
}

/**
 * getConfig — Get a config value, extracting the typed value.
 */
export async function getConfigValue<T = string>(
  key: string,
  options: Parameters<typeof resolveConfig>[1] = {},
): Promise<T | null> {
  const config = await resolveConfig(key, options);
  if (!config) return null;

  if (config.value_json !== null) return config.value_json as T;
  if (config.value_numeric !== null) return config.value_numeric as T;
  if (config.value_boolean !== null) return config.value_boolean as T;
  return config.value_string as T;
}
