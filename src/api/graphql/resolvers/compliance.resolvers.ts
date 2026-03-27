import { GraphQLError } from 'graphql';
import { v4 as uuid } from 'uuid';
import { query } from '../../../lib/pg.js';

export const complianceResolvers = {
  Query: {
    approvalWorkflow: async (_: unknown, { id }: { id: string }) => {
      const result = await query(
        `SELECT * FROM approval_workflows WHERE id = $1::uuid`,
        [id],
      );
      if (result.rows.length === 0) throw new GraphQLError('ApprovalWorkflow not found', { extensions: { code: 'NOT_FOUND' } });
      return result.rows[0];
    },
    pendingApprovals: async (_: unknown, { targetNodeType }: { targetNodeType?: string }) => {
      const typeClause = targetNodeType ? ' AND target_node_type = $1' : '';
      const params = targetNodeType ? [targetNodeType] : [];
      const result = await query(
        `SELECT * FROM approval_workflows WHERE workflow_status = 'PENDING'${typeClause} ORDER BY requested_at DESC`,
        params,
      );
      return result.rows;
    },
    sourceDocument: async (_: unknown, { id }: { id: string }) => {
      const result = await query(
        `SELECT * FROM source_documents WHERE id = $1::uuid`,
        [id],
      );
      if (result.rows.length === 0) throw new GraphQLError('SourceDocument not found', { extensions: { code: 'NOT_FOUND' } });
      return result.rows[0];
    },
    accessLogs: async (_: unknown, { filters }: { filters?: Record<string, unknown> }) => {
      let sql = 'SELECT * FROM access_logs WHERE 1=1';
      const params: unknown[] = [];
      let idx = 1;

      if (filters?.userId) { sql += ` AND user_id = $${idx++}`; params.push(filters.userId); }
      if (filters?.action) { sql += ` AND action = $${idx++}`; params.push(filters.action); }
      if (filters?.resourceType) { sql += ` AND resource_type = $${idx++}`; params.push(filters.resourceType); }
      if (filters?.resourceId) { sql += ` AND resource_id = $${idx++}`; params.push(filters.resourceId); }
      if (filters?.since) { sql += ` AND timestamp >= $${idx++}::timestamptz`; params.push(filters.since); }
      if (filters?.until) { sql += ` AND timestamp <= $${idx++}::timestamptz`; params.push(filters.until); }

      sql += ' ORDER BY timestamp DESC';
      const limit = typeof filters?.limit === 'number' ? filters.limit : 100;
      sql += ` LIMIT $${idx++}`;
      params.push(limit);

      const result = await query(sql, params);
      return result.rows;
    },
    highSensitivityAccess: async (_: unknown, { since }: { since: string }) => {
      const result = await query(
        `SELECT * FROM access_logs WHERE sensitivity_level = 'HIGH' AND timestamp >= $1::timestamptz ORDER BY timestamp DESC`,
        [since],
      );
      return result.rows;
    },
  },
  Mutation: {
    createApprovalWorkflow: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const id = uuid();
      await query(
        `INSERT INTO approval_workflows (id, entity_id, target_node_id, target_node_type, workflow_status, requested_by, requested_at, approval_level, required_level, narrative)
         VALUES ($1::uuid, $2, $3, $4, 'PENDING', $5, NOW(), 0, $6, $7)`,
        [id, input.entityId, input.targetNodeId, input.targetNodeType, input.requestedBy, input.requiredLevel, input.narrative ?? null],
      );
      return id;
    },
    approveWorkflow: async (_: unknown, { id, approvedBy }: { id: string; approvedBy: string }) => {
      const result = await query(
        `UPDATE approval_workflows
         SET workflow_status = 'APPROVED', approved_by = $2, approved_at = NOW(),
             approval_level = required_level, updated_at = NOW()
         WHERE id = $1::uuid AND workflow_status = 'PENDING'
         RETURNING *`,
        [id, approvedBy],
      );
      if (result.rows.length === 0) throw new GraphQLError('Workflow not found or not pending', { extensions: { code: 'BAD_REQUEST' } });
      return result.rows[0];
    },
    rejectWorkflow: async (_: unknown, { id, rejectedBy, reason }: { id: string; rejectedBy: string; reason: string }) => {
      const result = await query(
        `UPDATE approval_workflows
         SET workflow_status = 'REJECTED', rejected_by = $2, rejected_at = NOW(), rejection_reason = $3, updated_at = NOW()
         WHERE id = $1::uuid AND workflow_status = 'PENDING'
         RETURNING *`,
        [id, rejectedBy, reason],
      );
      if (result.rows.length === 0) throw new GraphQLError('Workflow not found or not pending', { extensions: { code: 'BAD_REQUEST' } });
      return result.rows[0];
    },
    createSourceDocument: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const id = uuid();
      await query(
        `INSERT INTO source_documents (id, entity_id, document_type, reference, file_path, hash, verified, linked_node_id, linked_node_type, narrative)
         VALUES ($1::uuid, $2, $3, $4, $5, $6, false, $7, $8, $9)`,
        [id, input.entityId, input.documentType, input.reference, input.filePath ?? null, input.hash ?? null, input.linkedNodeId ?? null, input.linkedNodeType ?? null, input.narrative ?? null],
      );
      return id;
    },
    verifyDocument: async (_: unknown, { id, verifiedBy }: { id: string; verifiedBy: string }) => {
      const result = await query(
        `UPDATE source_documents
         SET verified = true, verified_at = NOW(), verified_by = $2, updated_at = NOW()
         WHERE id = $1::uuid
         RETURNING *`,
        [id, verifiedBy],
      );
      if (result.rows.length === 0) throw new GraphQLError('SourceDocument not found', { extensions: { code: 'NOT_FOUND' } });
      return result.rows[0];
    },
    logAccess: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const id = uuid();
      await query(
        `INSERT INTO access_logs (id, user_id, action, resource_type, resource_id, sensitivity_level, ip_address, timestamp, metadata)
         VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, NOW(), $8::jsonb)`,
        [id, input.userId, input.action, input.resourceType, input.resourceId, input.sensitivityLevel, input.ipAddress ?? null, input.metadata ? JSON.stringify(input.metadata) : null],
      );
      return id;
    },
  },
};
