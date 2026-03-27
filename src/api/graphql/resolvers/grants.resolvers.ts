import {
  createGrant,
  getGrant,
  listGrants,
  recognizeGrantIncome,
  markConditionMet,
  assessClawback,
} from '../../../services/gl/government-grants-service.js';

export const grantsResolvers = {
  Query: {
    grant: async (_: unknown, args: { id: string }) =>
      getGrant(args.id),

    grants: async (_: unknown, args: { entityId: string; status?: string }) =>
      listGrants(args.entityId, args.status),
  },

  Mutation: {
    createGrant: async (_: unknown, { input }: { input: Record<string, unknown> }) =>
      createGrant(input as any),

    recognizeGrantIncome: async (_: unknown, args: { grantId: string; periodId: string }) =>
      recognizeGrantIncome(args.grantId, args.periodId),

    markGrantConditionMet: async (_: unknown, args: { grantId: string }) => {
      await markConditionMet(args.grantId);
      return true;
    },

    assessGrantClawback: async (_: unknown, args: { grantId: string; probability: number; amount: number }) =>
      assessClawback(args.grantId, args.probability, args.amount),
  },
};
