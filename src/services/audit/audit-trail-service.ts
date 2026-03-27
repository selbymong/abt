/**
 * Audit Trail Service
 *
 * Tracks non-GL graph node changes with before/after snapshots.
 * Stores audit entries in PostgreSQL audit_log table.
 * Complements the append-only GL (JournalEntry/LedgerLine are immutable).
 *
 * Features:
 * - Record node create/update/delete with before/after snapshots
 * - Query audit history by node, entity, user, action, date range
 * - Diff computation between before/after states
 */
import { v4 as uuid, v7 as uuidv7 } from 'uuid';
import { query } from '../../lib/pg.js';
import { emit } from '../../lib/kafka.js';

// ============================================================
// Types
// ============================================================

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT';

export interface AuditEntry {
  id: string;
  entityId: string | null;
  action: AuditAction;
  nodeType: string;
  nodeId: string;
  userId: string;
  timestamp: string;
  reason?: string;
  beforeSnapshot: Record<string, unknown> | null;
  afterSnapshot: Record<string, unknown> | null;
  changes: AuditChange[];
  sensitivity: number;
}

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface RecordAuditInput {
  entityId?: string;
  action: AuditAction;
  nodeType: string;
  nodeId: string;
  userId: string;
  reason?: string;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
  sensitivity?: number;
}

// ============================================================
// Record Audit Entry
// ============================================================

export async function recordAuditEntry(input: RecordAuditInput): Promise<AuditEntry> {
  const id = uuidv7();
  const before = input.beforeSnapshot ?? null;
  const after = input.afterSnapshot ?? null;
  const changes = computeChanges(before, after);
  const sensitivity = input.sensitivity ?? 0;

  const details = {
    reason: input.reason,
    beforeSnapshot: before,
    afterSnapshot: after,
    changes,
  };

  await query(
    `INSERT INTO audit_log (id, entity_id, action, node_type, node_id, user_id, details, sensitivity)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, input.entityId ?? null, input.action, input.nodeType, input.nodeId,
     input.userId, JSON.stringify(details), sensitivity],
  );

  await emit('ebg.graph', {
    event_id: uuid(),
    event_type: 'NODE_AUDIT_RECORDED',
    sequence_number: Date.now(),
    idempotency_key: `audit-${id}`,
    entity_id: input.entityId ?? '',
    timestamp: new Date().toISOString(),
    payload: { id, action: input.action, nodeType: input.nodeType, nodeId: input.nodeId, userId: input.userId },
  });

  return {
    id,
    entityId: input.entityId ?? null,
    action: input.action,
    nodeType: input.nodeType,
    nodeId: input.nodeId,
    userId: input.userId,
    timestamp: new Date().toISOString(),
    reason: input.reason,
    beforeSnapshot: before,
    afterSnapshot: after,
    changes,
    sensitivity,
  };
}

// ============================================================
// Query Audit History
// ============================================================

export async function getAuditEntry(id: string): Promise<AuditEntry | null> {
  const result = await query(
    'SELECT * FROM audit_log WHERE id = $1',
    [id],
  );
  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}

export async function getNodeHistory(
  nodeId: string,
  limit = 50,
  offset = 0,
): Promise<AuditEntry[]> {
  const result = await query(
    `SELECT * FROM audit_log WHERE node_id = $1
     ORDER BY timestamp DESC LIMIT $2 OFFSET $3`,
    [nodeId, limit, offset],
  );
  return result.rows.map(mapRow);
}

export async function getEntityAuditLog(
  entityId: string,
  options?: {
    action?: AuditAction;
    nodeType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  },
): Promise<AuditEntry[]> {
  const conditions: string[] = ['entity_id = $1'];
  const params: unknown[] = [entityId];
  let paramIdx = 2;

  if (options?.action) {
    conditions.push(`action = $${paramIdx++}`);
    params.push(options.action);
  }
  if (options?.nodeType) {
    conditions.push(`node_type = $${paramIdx++}`);
    params.push(options.nodeType);
  }
  if (options?.userId) {
    conditions.push(`user_id = $${paramIdx++}`);
    params.push(options.userId);
  }
  if (options?.startDate) {
    conditions.push(`timestamp >= $${paramIdx++}`);
    params.push(options.startDate);
  }
  if (options?.endDate) {
    conditions.push(`timestamp <= $${paramIdx++}`);
    params.push(options.endDate);
  }

  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  const result = await query(
    `SELECT * FROM audit_log WHERE ${conditions.join(' AND ')}
     ORDER BY timestamp DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset],
  );
  return result.rows.map(mapRow);
}

export async function getUserAuditLog(
  userId: string,
  limit = 50,
  offset = 0,
): Promise<AuditEntry[]> {
  const result = await query(
    `SELECT * FROM audit_log WHERE user_id = $1
     ORDER BY timestamp DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return result.rows.map(mapRow);
}

// ============================================================
// Audit Statistics
// ============================================================

export async function getAuditStats(
  entityId: string,
  startDate?: string,
  endDate?: string,
): Promise<{
  totalEntries: number;
  byAction: Record<string, number>;
  byNodeType: Record<string, number>;
  byUser: Record<string, number>;
}> {
  const conditions: string[] = ['entity_id = $1'];
  const params: unknown[] = [entityId];
  let paramIdx = 2;

  if (startDate) {
    conditions.push(`timestamp >= $${paramIdx++}`);
    params.push(startDate);
  }
  if (endDate) {
    conditions.push(`timestamp <= $${paramIdx++}`);
    params.push(endDate);
  }

  const whereClause = conditions.join(' AND ');

  const [countResult, actionResult, nodeTypeResult, userResult] = await Promise.all([
    query(`SELECT COUNT(*) AS total FROM audit_log WHERE ${whereClause}`, params),
    query(`SELECT action, COUNT(*) AS count FROM audit_log WHERE ${whereClause} GROUP BY action`, params),
    query(`SELECT node_type, COUNT(*) AS count FROM audit_log WHERE ${whereClause} GROUP BY node_type`, params),
    query(`SELECT user_id, COUNT(*) AS count FROM audit_log WHERE ${whereClause} GROUP BY user_id`, params),
  ]);

  const byAction: Record<string, number> = {};
  for (const row of actionResult.rows) byAction[row.action] = Number(row.count);

  const byNodeType: Record<string, number> = {};
  for (const row of nodeTypeResult.rows) byNodeType[row.node_type] = Number(row.count);

  const byUser: Record<string, number> = {};
  for (const row of userResult.rows) byUser[row.user_id] = Number(row.count);

  return {
    totalEntries: Number(countResult.rows[0]?.total ?? 0),
    byAction,
    byNodeType,
    byUser,
  };
}

// ============================================================
// Helpers
// ============================================================

function computeChanges(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): AuditChange[] {
  if (!before && !after) return [];
  if (!before && after) {
    return Object.entries(after).map(([field, newValue]) => ({
      field, oldValue: null, newValue,
    }));
  }
  if (before && !after) {
    return Object.entries(before).map(([field, oldValue]) => ({
      field, oldValue, newValue: null,
    }));
  }

  const changes: AuditChange[] = [];
  const allKeys = new Set([...Object.keys(before!), ...Object.keys(after!)]);

  for (const field of allKeys) {
    const oldValue = before![field] ?? null;
    const newValue = after![field] ?? null;
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({ field, oldValue, newValue });
    }
  }

  return changes;
}

function mapRow(row: any): AuditEntry {
  const details = typeof row.details === 'string' ? JSON.parse(row.details) : (row.details ?? {});
  return {
    id: row.id,
    entityId: row.entity_id,
    action: row.action,
    nodeType: row.node_type,
    nodeId: row.node_id,
    userId: row.user_id,
    timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : String(row.timestamp),
    reason: details.reason ?? undefined,
    beforeSnapshot: details.beforeSnapshot ?? null,
    afterSnapshot: details.afterSnapshot ?? null,
    changes: details.changes ?? [],
    sensitivity: row.sensitivity ?? 0,
  };
}
