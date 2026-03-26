/**
 * Compliance — Integration Tests
 *
 * Tests ApprovalWorkflow, SourceDocument tamper detection,
 * access audit logging, and related party disclosure generation.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { closePg, query } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities } from '../../src/services/graph/graph-crud-service.js';
import {
  createApprovalWorkflow,
  getApprovalWorkflow,
  listPendingApprovals,
  approveWorkflow,
  rejectWorkflow,
  isApproved,
  createSourceDocument,
  getSourceDocument,
  listSourceDocuments,
  verifyDocument,
  logAccess,
  getAccessLogs,
  getHighSensitivityAccess,
  generateRelatedPartyDisclosures,
} from '../../src/services/compliance/compliance-service.js';

let caFpEntityId: string;
const cleanupIds: string[] = [];

beforeAll(async () => {
  const entities = await getAllEntities();
  caFpEntityId = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'CA')!.id;
});

afterAll(async () => {
  // Clean up Neo4j nodes
  await runCypher(`MATCH (aw:ApprovalWorkflow {entity_id: $entityId}) DETACH DELETE aw`, { entityId: caFpEntityId });
  await runCypher(`MATCH (sd:SourceDocument {entity_id: $entityId}) DETACH DELETE sd`, { entityId: caFpEntityId });
  for (const id of cleanupIds) {
    await runCypher(`MATCH (n {id: $id}) DETACH DELETE n`, { id });
  }

  // Clean up audit logs
  await query(`DELETE FROM access_audit_log WHERE entity_id = $1`, [caFpEntityId]);

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

describe('ApprovalWorkflow', () => {
  let workflowId: string;
  const { v4: uuid } = require('uuid');
  const targetNodeId = uuid();

  it('creates a pending approval workflow', async () => {
    workflowId = await createApprovalWorkflow({
      entityId: caFpEntityId,
      approvalType: 'JOURNAL_ENTRY',
      targetNodeId,
      targetNodeType: 'JournalEntry',
      requestedBy: 'user-1',
      requiredApprovers: ['approver-1', 'approver-2'],
      thresholdAmount: 100000,
      description: 'Large journal entry approval',
    });

    expect(workflowId).toBeDefined();
    cleanupIds.push(workflowId);

    const wf = await getApprovalWorkflow(workflowId);
    expect(wf).not.toBeNull();
    expect((wf as any).status).toBe('PENDING');
    expect((wf as any).approval_type).toBe('JOURNAL_ENTRY');
  });

  it('lists pending approvals for entity', async () => {
    const pending = await listPendingApprovals(caFpEntityId);
    expect(pending.length).toBeGreaterThanOrEqual(1);
    expect(pending.some((p: any) => p.id === workflowId)).toBe(true);
  });

  it('first approval keeps status PENDING', async () => {
    const result = await approveWorkflow(workflowId, 'approver-1');
    // Need 2 approvers, only 1 approved
    expect((result as any).status).toBe('PENDING');
    expect((result as any).current_approvals).toContain('approver-1');
  });

  it('second approval transitions to APPROVED', async () => {
    const result = await approveWorkflow(workflowId, 'approver-2');
    expect((result as any).status).toBe('APPROVED');
  });

  it('isApproved returns true for approved target', async () => {
    const approved = await isApproved(targetNodeId);
    expect(approved).toBe(true);
  });

  it('isApproved returns false for unapproved target', async () => {
    const approved = await isApproved('nonexistent-node');
    expect(approved).toBe(false);
  });

  it('rejects a pending workflow', async () => {
    const rejectTarget = uuid();
    const rejectId = await createApprovalWorkflow({
      entityId: caFpEntityId,
      approvalType: 'TAX_PROVISION',
      targetNodeId: rejectTarget,
      targetNodeType: 'TaxProvision',
      requestedBy: 'user-1',
      requiredApprovers: ['cfo-1'],
    });
    cleanupIds.push(rejectId);

    const result = await rejectWorkflow(rejectId, 'cfo-1', 'Incorrect amounts');
    expect((result as any).status).toBe('REJECTED');
    expect((result as any).rejection_reason).toBe('Incorrect amounts');
  });

  it('throws when approving non-PENDING workflow', async () => {
    await expect(approveWorkflow(workflowId, 'approver-3')).rejects.toThrow('not PENDING');
  });
});

describe('SourceDocument (Tamper Detection)', () => {
  let docId: string;
  const testContent = 'Invoice #12345\nAmount: $50,000\nDate: 2026-03-15';

  it('creates a source document with hash', async () => {
    docId = await createSourceDocument({
      entityId: caFpEntityId,
      documentType: 'INVOICE',
      filename: 'invoice-12345.pdf',
      content: testContent,
      uploadedBy: 'user-1',
    });

    expect(docId).toBeDefined();
    cleanupIds.push(docId);

    const doc = await getSourceDocument(docId);
    expect(doc).not.toBeNull();
    expect((doc as any).document_hash).toBeDefined();
    expect((doc as any).hash_algorithm).toBe('SHA-256');
    expect((doc as any).verified).toBe(true);
  });

  it('verifies document integrity with matching content', async () => {
    const result = await verifyDocument(docId, testContent);
    expect(result.verified).toBe(true);
    expect(result.storedHash).toBe(result.computedHash);
  });

  it('detects tampered document', async () => {
    const result = await verifyDocument(docId, testContent + '\nTampered line');
    expect(result.verified).toBe(false);
    expect(result.storedHash).not.toBe(result.computedHash);
  });

  it('lists documents for entity', async () => {
    const docs = await listSourceDocuments(caFpEntityId);
    expect(docs.length).toBeGreaterThanOrEqual(1);
  });

  it('creates document linked to a node', async () => {
    const linkedDocId = await createSourceDocument({
      entityId: caFpEntityId,
      documentType: 'RECEIPT',
      filename: 'receipt-001.pdf',
      content: 'Receipt content here',
      uploadedBy: 'user-2',
      linkedNodeId: caFpEntityId,
      linkedNodeType: 'Entity',
    });
    cleanupIds.push(linkedDocId);

    const linkedDocs = await listSourceDocuments(caFpEntityId, caFpEntityId);
    expect(linkedDocs.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Access Audit Logging', () => {
  it('logs an access event', async () => {
    const { v4: uuid } = require('uuid');
    const id = await logAccess({
      entityId: caFpEntityId,
      userId: uuid(),
      action: 'READ',
      resourceType: 'JournalEntry',
      resourceId: uuid(),
      sensitivityLevel: 'MEDIUM',
    });

    expect(id).toBeDefined();
  });

  it('logs a high-sensitivity access', async () => {
    const { v4: uuid } = require('uuid');
    await logAccess({
      entityId: caFpEntityId,
      userId: uuid(),
      action: 'EXPORT',
      resourceType: 'TaxProvision',
      resourceId: uuid(),
      sensitivityLevel: 'HIGH',
      details: 'Exported tax provision data',
    });
  });

  it('retrieves access logs for entity', async () => {
    const logs = await getAccessLogs(caFpEntityId);
    expect(logs.length).toBeGreaterThanOrEqual(2);
  });

  it('filters access logs by action', async () => {
    const logs = await getAccessLogs(caFpEntityId, { action: 'EXPORT' });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs.every((l: any) => l.action === 'EXPORT')).toBe(true);
  });

  it('retrieves high-sensitivity access events', async () => {
    const logs = await getHighSensitivityAccess(caFpEntityId);
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs.every((l: any) => l.sensitivity_level === 'HIGH')).toBe(true);
  });
});

describe('Related Party Disclosures', () => {
  it('generates disclosure report for entity', async () => {
    const disclosures = await generateRelatedPartyDisclosures(caFpEntityId);
    expect(disclosures.entityId).toBe(caFpEntityId);
    expect(disclosures.disclosureDate).toBeDefined();
    expect(Array.isArray(disclosures.entries)).toBe(true);
    expect(typeof disclosures.totalTransactionValue).toBe('number');
    expect(typeof disclosures.armsLengthViolations).toBe('number');
  });
});
