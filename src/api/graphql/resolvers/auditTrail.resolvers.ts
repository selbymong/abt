import {
  recordAuditEntry,
  getAuditEntry,
  getNodeHistory,
  getEntityAuditLog,
  getUserAuditLog,
  getAuditStats,
} from '../../../services/audit/audit-trail-service.js';

export const auditTrailResolvers = {
  Query: {
    auditEntry: async (_: unknown, { id }: { id: string }) =>
      getAuditEntry(id),

    nodeAuditHistory: async (_: unknown, { nodeId, limit, offset }: {
      nodeId: string; limit?: number; offset?: number;
    }) => getNodeHistory(nodeId, limit ?? 50, offset ?? 0),

    entityAuditLog: async (_: unknown, args: {
      entityId: string; action?: string; nodeType?: string; userId?: string;
      startDate?: string; endDate?: string; limit?: number; offset?: number;
    }) => getEntityAuditLog(args.entityId, {
      action: args.action as any,
      nodeType: args.nodeType,
      userId: args.userId,
      startDate: args.startDate,
      endDate: args.endDate,
      limit: args.limit,
      offset: args.offset,
    }),

    userAuditLog: async (_: unknown, { userId, limit, offset }: {
      userId: string; limit?: number; offset?: number;
    }) => getUserAuditLog(userId, limit ?? 50, offset ?? 0),

    auditStats: async (_: unknown, { entityId, startDate, endDate }: {
      entityId: string; startDate?: string; endDate?: string;
    }) => getAuditStats(entityId, startDate, endDate),
  },

  Mutation: {
    recordAudit: async (_: unknown, { input }: { input: Record<string, unknown> }) =>
      recordAuditEntry(input as any),
  },
};
