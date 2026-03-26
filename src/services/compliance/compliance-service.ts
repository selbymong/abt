import { v4 as uuid } from 'uuid';
import { createHash } from 'crypto';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';

// ============================================================
// ApprovalWorkflow
// ============================================================

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
export type ApprovalType = 'JOURNAL_ENTRY' | 'TAX_PROVISION' | 'PERIOD_CLOSE' | 'CREDIT_CLAIM' | 'GENERAL';

export interface CreateApprovalWorkflowInput {
  entityId: string;
  approvalType: ApprovalType;
  targetNodeId: string;
  targetNodeType: string;
  requestedBy: string;
  requiredApprovers: string[];
  thresholdAmount?: number;
  description?: string;
}

/**
 * Create an ApprovalWorkflow node for an action requiring approval.
 */
export async function createApprovalWorkflow(
  input: CreateApprovalWorkflowInput,
): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (aw:ApprovalWorkflow {
       id: $id,
       entity_id: $entityId,
       approval_type: $approvalType,
       target_node_id: $targetNodeId,
       target_node_type: $targetNodeType,
       status: 'PENDING',
       requested_by: $requestedBy,
       required_approvers: $requiredApprovers,
       current_approvals: [],
       threshold_amount: $thresholdAmount,
       description: $description,
       created_at: datetime(), updated_at: datetime()
     })`,
    {
      id,
      entityId: input.entityId,
      approvalType: input.approvalType,
      targetNodeId: input.targetNodeId,
      targetNodeType: input.targetNodeType,
      requestedBy: input.requestedBy,
      requiredApprovers: input.requiredApprovers,
      thresholdAmount: input.thresholdAmount ?? null,
      description: input.description ?? null,
    },
  );
  return id;
}

/**
 * Get an ApprovalWorkflow by ID.
 */
export async function getApprovalWorkflow(
  id: string,
): Promise<Record<string, unknown> | null> {
  const results = await runCypher<Record<string, unknown>>(
    `MATCH (aw:ApprovalWorkflow {id: $id})
     RETURN properties(aw) AS aw`,
    { id },
  );
  return results.length > 0 ? results[0].aw as Record<string, unknown> : null;
}

/**
 * List pending approvals for an entity.
 */
export async function listPendingApprovals(
  entityId: string,
  approverUserId?: string,
): Promise<Array<Record<string, unknown>>> {
  const approverFilter = approverUserId
    ? `AND $approverUserId IN aw.required_approvers`
    : '';
  const results = await runCypher<Record<string, unknown>>(
    `MATCH (aw:ApprovalWorkflow {entity_id: $entityId, status: 'PENDING'})
     WHERE true ${approverFilter}
     RETURN properties(aw) AS aw
     ORDER BY aw.created_at DESC`,
    { entityId, approverUserId },
  );
  return results.map((r) => r.aw as Record<string, unknown>);
}

/**
 * Approve a workflow step. When all required approvers have approved,
 * status transitions to APPROVED.
 */
export async function approveWorkflow(
  id: string,
  approverId: string,
): Promise<Record<string, unknown>> {
  // Add to current_approvals if not already present
  const results = await runCypher<Record<string, unknown>>(
    `MATCH (aw:ApprovalWorkflow {id: $id})
     WHERE aw.status = 'PENDING'
     WITH aw,
       CASE WHEN NOT $approverId IN aw.current_approvals
            THEN aw.current_approvals + $approverId
            ELSE aw.current_approvals END AS newApprovals
     SET aw.current_approvals = newApprovals,
         aw.status = CASE
           WHEN SIZE(newApprovals) >= SIZE(aw.required_approvers) THEN 'APPROVED'
           ELSE 'PENDING' END,
         aw.updated_at = datetime()
     RETURN properties(aw) AS aw`,
    { id, approverId },
  );

  if (results.length === 0) {
    throw new Error(`ApprovalWorkflow ${id} not found or not PENDING`);
  }

  return results[0].aw as Record<string, unknown>;
}

/**
 * Reject a workflow.
 */
export async function rejectWorkflow(
  id: string,
  rejectedBy: string,
  reason: string,
): Promise<Record<string, unknown>> {
  const results = await runCypher<Record<string, unknown>>(
    `MATCH (aw:ApprovalWorkflow {id: $id})
     WHERE aw.status = 'PENDING'
     SET aw.status = 'REJECTED',
         aw.rejected_by = $rejectedBy,
         aw.rejection_reason = $reason,
         aw.updated_at = datetime()
     RETURN properties(aw) AS aw`,
    { id, rejectedBy, reason },
  );
  if (results.length === 0) {
    throw new Error(`ApprovalWorkflow ${id} not found or not PENDING`);
  }
  return results[0].aw as Record<string, unknown>;
}

/**
 * Check if a target node has been approved.
 */
export async function isApproved(
  targetNodeId: string,
): Promise<boolean> {
  const results = await runCypher<{ status: string }>(
    `MATCH (aw:ApprovalWorkflow {target_node_id: $targetNodeId})
     RETURN aw.status AS status
     ORDER BY aw.created_at DESC LIMIT 1`,
    { targetNodeId },
  );
  return results.length > 0 && results[0].status === 'APPROVED';
}

// ============================================================
// SourceDocument (Tamper Detection)
// ============================================================

/**
 * Create a SourceDocument node with SHA-256 hash for tamper detection.
 */
export async function createSourceDocument(
  input: {
    entityId: string;
    documentType: string;
    filename: string;
    content: string;
    uploadedBy: string;
    linkedNodeId?: string;
    linkedNodeType?: string;
  },
): Promise<string> {
  const id = uuid();
  const documentHash = createHash('sha256').update(input.content).digest('hex');

  await runCypher(
    `CREATE (sd:SourceDocument {
       id: $id,
       entity_id: $entityId,
       document_type: $documentType,
       filename: $filename,
       document_hash: $documentHash,
       hash_algorithm: 'SHA-256',
       file_size_bytes: $fileSize,
       uploaded_by: $uploadedBy,
       linked_node_id: $linkedNodeId,
       linked_node_type: $linkedNodeType,
       verified: true,
       created_at: datetime()
     })`,
    {
      id,
      entityId: input.entityId,
      documentType: input.documentType,
      filename: input.filename,
      documentHash,
      fileSize: Buffer.byteLength(input.content, 'utf-8'),
      uploadedBy: input.uploadedBy,
      linkedNodeId: input.linkedNodeId ?? null,
      linkedNodeType: input.linkedNodeType ?? null,
    },
  );

  return id;
}

/**
 * Get a SourceDocument by ID.
 */
export async function getSourceDocument(
  id: string,
): Promise<Record<string, unknown> | null> {
  const results = await runCypher<Record<string, unknown>>(
    `MATCH (sd:SourceDocument {id: $id})
     RETURN properties(sd) AS sd`,
    { id },
  );
  return results.length > 0 ? results[0].sd as Record<string, unknown> : null;
}

/**
 * List SourceDocuments for an entity.
 */
export async function listSourceDocuments(
  entityId: string,
  linkedNodeId?: string,
): Promise<Array<Record<string, unknown>>> {
  const filter = linkedNodeId ? 'AND sd.linked_node_id = $linkedNodeId' : '';
  const results = await runCypher<Record<string, unknown>>(
    `MATCH (sd:SourceDocument {entity_id: $entityId})
     WHERE true ${filter}
     RETURN properties(sd) AS sd
     ORDER BY sd.created_at DESC`,
    { entityId, linkedNodeId },
  );
  return results.map((r) => r.sd as Record<string, unknown>);
}

/**
 * Verify a SourceDocument against its stored hash.
 * Returns whether the document content matches the original hash.
 */
export async function verifyDocument(
  id: string,
  content: string,
): Promise<{ verified: boolean; storedHash: string; computedHash: string }> {
  const doc = await getSourceDocument(id);
  if (!doc) throw new Error(`SourceDocument ${id} not found`);

  const computedHash = createHash('sha256').update(content).digest('hex');
  const storedHash = doc.document_hash as string;
  const verified = computedHash === storedHash;

  // Update verification status
  await runCypher(
    `MATCH (sd:SourceDocument {id: $id})
     SET sd.verified = $verified, sd.last_verified_at = datetime()`,
    { id, verified },
  );

  return { verified, storedHash, computedHash };
}

// ============================================================
// Access Audit Logging
// ============================================================

/**
 * Log an access event to the audit table in PostgreSQL.
 */
export async function logAccess(
  input: {
    entityId: string;
    userId: string;
    action: 'READ' | 'WRITE' | 'DELETE' | 'EXPORT';
    resourceType: string;
    resourceId: string;
    sensitivityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    ipAddress?: string;
    details?: string;
  },
): Promise<string> {
  const id = uuid();
  await query(
    `INSERT INTO access_audit_log (id, entity_id, user_id, action, resource_type,
       resource_id, sensitivity_level, ip_address, details, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
    [
      id,
      input.entityId,
      input.userId,
      input.action,
      input.resourceType,
      input.resourceId,
      input.sensitivityLevel ?? 'LOW',
      input.ipAddress ?? null,
      input.details ?? null,
    ],
  );
  return id;
}

/**
 * Get access audit logs with optional filters.
 */
export async function getAccessLogs(
  entityId: string,
  filters?: {
    userId?: string;
    action?: string;
    sensitivityLevel?: string;
    fromDate?: string;
    limit?: number;
  },
): Promise<Array<Record<string, unknown>>> {
  let whereClauses = ['entity_id = $1'];
  const params: unknown[] = [entityId];
  let paramIdx = 2;

  if (filters?.userId) {
    whereClauses.push(`user_id = $${paramIdx++}`);
    params.push(filters.userId);
  }
  if (filters?.action) {
    whereClauses.push(`action = $${paramIdx++}`);
    params.push(filters.action);
  }
  if (filters?.sensitivityLevel) {
    whereClauses.push(`sensitivity_level = $${paramIdx++}`);
    params.push(filters.sensitivityLevel);
  }
  if (filters?.fromDate) {
    whereClauses.push(`created_at >= $${paramIdx++}::timestamptz`);
    params.push(filters.fromDate);
  }

  const limit = filters?.limit ?? 100;

  const result = await query<Record<string, unknown>>(
    `SELECT * FROM access_audit_log
     WHERE ${whereClauses.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT ${limit}`,
    params,
  );

  return result.rows;
}

/**
 * Get high-sensitivity access events (above threshold).
 */
export async function getHighSensitivityAccess(
  entityId: string,
  fromDate?: string,
): Promise<Array<Record<string, unknown>>> {
  return getAccessLogs(entityId, {
    sensitivityLevel: 'HIGH',
    fromDate,
  });
}

// ============================================================
// Related Party Disclosure Auto-Generation
// ============================================================

export interface DisclosureEntry {
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  transactionNature: string;
  amount: number;
  armsLengthValidated: boolean;
  periodId?: string;
}

/**
 * Auto-generate related party disclosures from RELATED_PARTY_TRANSACTION edges.
 * Per IAS 24 requirements.
 */
export async function generateRelatedPartyDisclosures(
  entityId: string,
  periodId?: string,
): Promise<{
  entityId: string;
  disclosureDate: string;
  entries: DisclosureEntry[];
  totalTransactionValue: number;
  armsLengthViolations: number;
}> {
  const periodFilter = periodId
    ? `AND je.period_id = $periodId`
    : '';

  const transactions = await runCypher<{
    sourceEntityId: string;
    targetEntityId: string;
    relationshipType: string;
    transactionNature: string;
    amount: number;
    armsLengthValidated: boolean;
    periodId: string;
  }>(
    `MATCH (e1:Entity {id: $entityId})-[rp:RELATED_PARTY]->(e2:Entity)
     OPTIONAL MATCH (je1:JournalEntry)-[rpt:RELATED_PARTY_TRANSACTION]->(je2:JournalEntry)
     WHERE rpt.source_entity_id = $entityId AND rpt.target_entity_id = e2.id
       ${periodFilter}
     RETURN $entityId AS sourceEntityId,
            e2.id AS targetEntityId,
            rp.relationship_type AS relationshipType,
            COALESCE(rpt.transaction_nature, 'TRADE') AS transactionNature,
            COALESCE(je1.total_debit, 0) AS amount,
            COALESCE(rpt.arms_length_validated, false) AS armsLengthValidated,
            je1.period_id AS periodId`,
    { entityId, periodId },
  );

  const entries: DisclosureEntry[] = transactions
    .filter((t) => t.targetEntityId)
    .map((t) => ({
      sourceEntityId: t.sourceEntityId,
      targetEntityId: t.targetEntityId,
      relationshipType: t.relationshipType,
      transactionNature: t.transactionNature,
      amount: Number(t.amount),
      armsLengthValidated: t.armsLengthValidated,
      periodId: t.periodId,
    }));

  const totalTransactionValue = entries.reduce((s, e) => s + e.amount, 0);
  const armsLengthViolations = entries.filter((e) => !e.armsLengthValidated && e.amount > 0).length;

  return {
    entityId,
    disclosureDate: new Date().toISOString().substring(0, 10),
    entries,
    totalTransactionValue: Math.round(totalTransactionValue * 100) / 100,
    armsLengthViolations,
  };
}
