/**
 * Float ID Mapping Service
 *
 * Manages bidirectional ID mapping between Float Financial and EBG,
 * sync cursor state, and GL code → Activity node resolution.
 */
import { v4 as uuid } from 'uuid';
import { query } from '../../lib/pg.js';

// ── Types ────────────────────────────────────────────────────

export type FloatType =
  | 'TRANSACTION' | 'BILL' | 'REIMBURSEMENT'
  | 'GL_CODE' | 'VENDOR' | 'TAX_CODE' | 'PAYMENT';

export type SyncType =
  | 'TRANSACTIONS' | 'BILLS' | 'REIMBURSEMENTS'
  | 'GL_CODES' | 'VENDORS' | 'TAX_CODES';

export interface FloatIdMapping {
  id: string;
  entity_id: string;
  float_type: FloatType;
  float_id: string;
  ebg_id: string;
  ebg_type: string;
  created_at: string;
}

export interface FloatSyncState {
  entity_id: string;
  sync_type: SyncType;
  last_synced_at: string | null;
  last_cursor: string | null;
  last_run_id: string | null;
  updated_at: string;
}

export interface FloatSyncRunInput {
  entityId: string;
  syncType: string;
  direction: 'INBOUND' | 'OUTBOUND';
  itemsFetched: number;
  itemsImported: number;
  itemsSkipped: number;
  itemsFailed: number;
  errors: Array<{ floatId: string; error: string }>;
  durationMs: number;
}

// ── ID Mapping CRUD ──────────────────────────────────────────

export async function getEbgIdForFloat(
  entityId: string,
  floatType: FloatType,
  floatId: string,
): Promise<string | null> {
  const result = await query<{ ebg_id: string }>(
    `SELECT ebg_id FROM float_id_mapping
     WHERE entity_id = $1 AND float_type = $2 AND float_id = $3`,
    [entityId, floatType, floatId],
  );
  return result.rows[0]?.ebg_id ?? null;
}

export async function getFloatIdForEbg(
  entityId: string,
  floatType: FloatType,
  ebgId: string,
): Promise<string | null> {
  const result = await query<{ float_id: string }>(
    `SELECT float_id FROM float_id_mapping
     WHERE entity_id = $1 AND float_type = $2 AND ebg_id = $3`,
    [entityId, floatType, ebgId],
  );
  return result.rows[0]?.float_id ?? null;
}

export async function setFloatMapping(
  entityId: string,
  floatType: FloatType,
  floatId: string,
  ebgId: string,
  ebgType: string,
): Promise<void> {
  await query(
    `INSERT INTO float_id_mapping (id, entity_id, float_type, float_id, ebg_id, ebg_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (entity_id, float_type, float_id) DO NOTHING`,
    [uuid(), entityId, floatType, floatId, ebgId, ebgType],
  );
}

export async function listMappings(
  entityId: string,
  floatType?: FloatType,
): Promise<FloatIdMapping[]> {
  if (floatType) {
    const result = await query<FloatIdMapping>(
      `SELECT * FROM float_id_mapping
       WHERE entity_id = $1 AND float_type = $2
       ORDER BY created_at DESC`,
      [entityId, floatType],
    );
    return result.rows;
  }
  const result = await query<FloatIdMapping>(
    `SELECT * FROM float_id_mapping WHERE entity_id = $1 ORDER BY created_at DESC`,
    [entityId],
  );
  return result.rows;
}

// ── GL Code → Activity Resolution ────────────────────────────

export async function resolveGlCodeToActivity(
  entityId: string,
  floatGlCodeId: string,
): Promise<string | null> {
  // First check float_id_mapping for a GL_CODE mapping
  return getEbgIdForFloat(entityId, 'GL_CODE', floatGlCodeId);
}

// ── Sync State ───────────────────────────────────────────────

export async function getSyncState(
  entityId: string,
  syncType: SyncType,
): Promise<FloatSyncState | null> {
  const result = await query<FloatSyncState>(
    `SELECT * FROM float_sync_state WHERE entity_id = $1 AND sync_type = $2`,
    [entityId, syncType],
  );
  return result.rows[0] ?? null;
}

export async function updateSyncState(
  entityId: string,
  syncType: SyncType,
  lastSyncedAt: string,
  runId?: string,
): Promise<void> {
  await query(
    `INSERT INTO float_sync_state (entity_id, sync_type, last_synced_at, last_run_id, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (entity_id, sync_type)
     DO UPDATE SET last_synced_at = $3, last_run_id = $4, updated_at = now()`,
    [entityId, syncType, lastSyncedAt, runId ?? null],
  );
}

// ── Sync Run Audit ───────────────────────────────────────────

export async function recordSyncRun(input: FloatSyncRunInput): Promise<string> {
  const id = uuid();
  await query(
    `INSERT INTO float_sync_runs
       (id, entity_id, sync_type, direction, items_fetched, items_imported,
        items_skipped, items_failed, errors, duration_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      id, input.entityId, input.syncType, input.direction,
      input.itemsFetched, input.itemsImported,
      input.itemsSkipped, input.itemsFailed,
      JSON.stringify(input.errors), input.durationMs,
    ],
  );
  return id;
}

export async function listSyncRuns(
  entityId: string,
  limit = 50,
): Promise<Array<FloatSyncRunInput & { id: string; created_at: string }>> {
  const result = await query<any>(
    `SELECT * FROM float_sync_runs
     WHERE entity_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [entityId, limit],
  );
  return result.rows;
}
