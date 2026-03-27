import {
  runReconciliation,
  getReconciliationRun,
  listReconciliationRuns,
  getLatestReconciliationRun,
} from '../../../services/reconciliation/nightly-reconciliation-service.js';

export const reconciliationResolvers = {
  Query: {
    reconciliationRun: async (_: unknown, args: { id: string }) =>
      getReconciliationRun(args.id),

    reconciliationRuns: async (_: unknown, args: { limit?: number; entityId?: string }) =>
      listReconciliationRuns(args.limit ?? 20, args.entityId),

    latestReconciliationRun: async (_: unknown, args: { entityId?: string }) =>
      getLatestReconciliationRun(args.entityId),
  },

  Mutation: {
    runReconciliation: async (
      _: unknown,
      args: { entityId?: string; periodId?: string; tolerance?: number },
    ) => runReconciliation({
      entityId: args.entityId,
      periodId: args.periodId,
      tolerance: args.tolerance,
    }),
  },
};
