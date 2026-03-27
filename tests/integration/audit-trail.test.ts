/**
 * Audit Trail Service — Integration Tests
 *
 * Tests audit entry recording, node history, entity/user audit logs,
 * change diff computation, and audit statistics.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/pg.js', () => ({ query: vi.fn() }));
vi.mock('../../src/lib/kafka.js', () => ({ emit: vi.fn() }));
vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn() },
}));

import { query } from '../../src/lib/pg.js';
import { emit } from '../../src/lib/kafka.js';
import {
  recordAuditEntry,
  getAuditEntry,
  getNodeHistory,
  getEntityAuditLog,
  getUserAuditLog,
  getAuditStats,
} from '../../src/services/audit/audit-trail-service.js';

const mockQuery = vi.mocked(query);
const mockEmit = vi.mocked(emit);

const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const NODE_ID = '22222222-2222-2222-2222-222222222222';
const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const qr = (rows: any[]) => ({ rows, rowCount: rows.length, command: 'SELECT' as any, oid: 0, fields: [] });

beforeEach(() => {
  vi.resetAllMocks();
});

// ============================================================
// Record Audit Entries
// ============================================================

describe('Record Audit Entry', () => {
  it('records a CREATE audit entry with after snapshot', async () => {
    mockQuery.mockResolvedValueOnce(qr([])); // INSERT
    mockEmit.mockResolvedValueOnce(undefined);

    const entry = await recordAuditEntry({
      entityId: ENTITY_ID,
      action: 'CREATE',
      nodeType: 'Activity',
      nodeId: NODE_ID,
      userId: USER_ID,
      reason: 'New activity created',
      afterSnapshot: { name: 'Marketing Campaign', status: 'ACTIVE', budget: 50000 },
    });

    expect(entry.id).toBeDefined();
    expect(entry.action).toBe('CREATE');
    expect(entry.nodeType).toBe('Activity');
    expect(entry.nodeId).toBe(NODE_ID);
    expect(entry.userId).toBe(USER_ID);
    expect(entry.reason).toBe('New activity created');
    expect(entry.beforeSnapshot).toBeNull();
    expect(entry.afterSnapshot).toEqual({ name: 'Marketing Campaign', status: 'ACTIVE', budget: 50000 });
    expect(entry.changes).toHaveLength(3);
    expect(entry.changes.find(c => c.field === 'name')?.newValue).toBe('Marketing Campaign');

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('INSERT INTO audit_log');
    expect(mockEmit).toHaveBeenCalledWith('ebg.graph', expect.objectContaining({
      event_type: 'NODE_AUDIT_RECORDED',
    }));
  });

  it('records an UPDATE with before/after snapshots and computes diff', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));
    mockEmit.mockResolvedValueOnce(undefined);

    const entry = await recordAuditEntry({
      entityId: ENTITY_ID,
      action: 'UPDATE',
      nodeType: 'Activity',
      nodeId: NODE_ID,
      userId: USER_ID,
      beforeSnapshot: { name: 'Marketing Campaign', status: 'ACTIVE', budget: 50000 },
      afterSnapshot: { name: 'Marketing Campaign', status: 'PAUSED', budget: 30000 },
    });

    expect(entry.changes).toHaveLength(2);
    const statusChange = entry.changes.find(c => c.field === 'status');
    expect(statusChange?.oldValue).toBe('ACTIVE');
    expect(statusChange?.newValue).toBe('PAUSED');
    const budgetChange = entry.changes.find(c => c.field === 'budget');
    expect(budgetChange?.oldValue).toBe(50000);
    expect(budgetChange?.newValue).toBe(30000);
  });

  it('records a DELETE with before snapshot only', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));
    mockEmit.mockResolvedValueOnce(undefined);

    const entry = await recordAuditEntry({
      entityId: ENTITY_ID,
      action: 'DELETE',
      nodeType: 'Resource',
      nodeId: NODE_ID,
      userId: USER_ID,
      beforeSnapshot: { name: 'Server A', type: 'INFRASTRUCTURE' },
    });

    expect(entry.action).toBe('DELETE');
    expect(entry.afterSnapshot).toBeNull();
    expect(entry.changes).toHaveLength(2);
    expect(entry.changes.every(c => c.newValue === null)).toBe(true);
  });

  it('records entry with custom sensitivity level', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));
    mockEmit.mockResolvedValueOnce(undefined);

    const entry = await recordAuditEntry({
      entityId: ENTITY_ID,
      action: 'UPDATE',
      nodeType: 'Entity',
      nodeId: NODE_ID,
      userId: USER_ID,
      sensitivity: 2,
      afterSnapshot: { pii_field: 'updated' },
    });

    expect(entry.sensitivity).toBe(2);
    const params = mockQuery.mock.calls[0][1] as any[];
    expect(params[7]).toBe(2); // sensitivity param
  });

  it('handles entry without entityId', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));
    mockEmit.mockResolvedValueOnce(undefined);

    const entry = await recordAuditEntry({
      action: 'CREATE',
      nodeType: 'SocialConstraint',
      nodeId: NODE_ID,
      userId: USER_ID,
    });

    expect(entry.entityId).toBeNull();
    expect(entry.changes).toHaveLength(0);
  });
});

// ============================================================
// Query Audit History
// ============================================================

describe('Query Audit History', () => {
  const sampleRow = {
    id: 'audit-1',
    entity_id: ENTITY_ID,
    action: 'UPDATE',
    node_type: 'Activity',
    node_id: NODE_ID,
    user_id: USER_ID,
    timestamp: new Date('2026-03-01T12:00:00Z'),
    details: JSON.stringify({
      reason: 'Budget revised',
      beforeSnapshot: { budget: 50000 },
      afterSnapshot: { budget: 30000 },
      changes: [{ field: 'budget', oldValue: 50000, newValue: 30000 }],
    }),
    sensitivity: 0,
  };

  it('getAuditEntry — returns single entry by ID', async () => {
    mockQuery.mockResolvedValueOnce(qr([sampleRow]));

    const entry = await getAuditEntry('audit-1');
    expect(entry).not.toBeNull();
    expect(entry!.id).toBe('audit-1');
    expect(entry!.reason).toBe('Budget revised');
    expect(entry!.changes).toHaveLength(1);
  });

  it('getAuditEntry — returns null for missing entry', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));

    const entry = await getAuditEntry('nonexistent');
    expect(entry).toBeNull();
  });

  it('getNodeHistory — returns ordered history for a node', async () => {
    mockQuery.mockResolvedValueOnce(qr([sampleRow, { ...sampleRow, id: 'audit-2', action: 'CREATE' }]));

    const history = await getNodeHistory(NODE_ID);
    expect(history).toHaveLength(2);
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('node_id = $1');
    expect(sql).toContain('ORDER BY timestamp DESC');
  });

  it('getEntityAuditLog — filters by action and nodeType', async () => {
    mockQuery.mockResolvedValueOnce(qr([sampleRow]));

    const entries = await getEntityAuditLog(ENTITY_ID, {
      action: 'UPDATE',
      nodeType: 'Activity',
    });
    expect(entries).toHaveLength(1);
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('entity_id = $1');
    expect(sql).toContain('action = $2');
    expect(sql).toContain('node_type = $3');
  });

  it('getEntityAuditLog — filters by date range', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));

    await getEntityAuditLog(ENTITY_ID, {
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    });
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('timestamp >= $2');
    expect(sql).toContain('timestamp <= $3');
  });

  it('getUserAuditLog — returns user activity', async () => {
    mockQuery.mockResolvedValueOnce(qr([sampleRow]));

    const entries = await getUserAuditLog(USER_ID, 10, 0);
    expect(entries).toHaveLength(1);
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('user_id = $1');
  });
});

// ============================================================
// Audit Statistics
// ============================================================

describe('Audit Statistics', () => {
  it('returns aggregated audit stats', async () => {
    mockQuery.mockResolvedValueOnce(qr([{ total: '42' }])); // count
    mockQuery.mockResolvedValueOnce(qr([
      { action: 'CREATE', count: '15' },
      { action: 'UPDATE', count: '25' },
      { action: 'DELETE', count: '2' },
    ]));
    mockQuery.mockResolvedValueOnce(qr([
      { node_type: 'Activity', count: '20' },
      { node_type: 'Resource', count: '22' },
    ]));
    mockQuery.mockResolvedValueOnce(qr([
      { user_id: USER_ID, count: '42' },
    ]));

    const stats = await getAuditStats(ENTITY_ID);
    expect(stats.totalEntries).toBe(42);
    expect(stats.byAction.CREATE).toBe(15);
    expect(stats.byAction.UPDATE).toBe(25);
    expect(stats.byAction.DELETE).toBe(2);
    expect(stats.byNodeType.Activity).toBe(20);
    expect(stats.byUser[USER_ID]).toBe(42);
  });

  it('filters stats by date range', async () => {
    mockQuery.mockResolvedValueOnce(qr([{ total: '5' }]));
    mockQuery.mockResolvedValueOnce(qr([]));
    mockQuery.mockResolvedValueOnce(qr([]));
    mockQuery.mockResolvedValueOnce(qr([]));

    const stats = await getAuditStats(ENTITY_ID, '2026-03-01', '2026-03-31');
    expect(stats.totalEntries).toBe(5);
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('timestamp >= $2');
    expect(sql).toContain('timestamp <= $3');
  });
});

// ============================================================
// Change Diff Computation
// ============================================================

describe('Change Diff', () => {
  it('detects added fields', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));
    mockEmit.mockResolvedValueOnce(undefined);

    const entry = await recordAuditEntry({
      action: 'UPDATE',
      nodeType: 'Activity',
      nodeId: NODE_ID,
      userId: USER_ID,
      beforeSnapshot: { name: 'Test' },
      afterSnapshot: { name: 'Test', tags: ['important'] },
    });

    const tagsChange = entry.changes.find(c => c.field === 'tags');
    expect(tagsChange).toBeDefined();
    expect(tagsChange!.oldValue).toBeNull();
    expect(tagsChange!.newValue).toEqual(['important']);
  });

  it('detects removed fields', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));
    mockEmit.mockResolvedValueOnce(undefined);

    const entry = await recordAuditEntry({
      action: 'UPDATE',
      nodeType: 'Activity',
      nodeId: NODE_ID,
      userId: USER_ID,
      beforeSnapshot: { name: 'Test', description: 'Old desc' },
      afterSnapshot: { name: 'Test' },
    });

    const descChange = entry.changes.find(c => c.field === 'description');
    expect(descChange).toBeDefined();
    expect(descChange!.oldValue).toBe('Old desc');
    expect(descChange!.newValue).toBeNull();
  });

  it('ignores unchanged fields', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));
    mockEmit.mockResolvedValueOnce(undefined);

    const entry = await recordAuditEntry({
      action: 'UPDATE',
      nodeType: 'Activity',
      nodeId: NODE_ID,
      userId: USER_ID,
      beforeSnapshot: { name: 'Test', status: 'ACTIVE' },
      afterSnapshot: { name: 'Test', status: 'PAUSED' },
    });

    expect(entry.changes).toHaveLength(1);
    expect(entry.changes[0].field).toBe('status');
  });
});
