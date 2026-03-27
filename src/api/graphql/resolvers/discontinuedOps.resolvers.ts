import {
  classifyAsHeldForSale,
  declassifyHeldForSale,
  recordDisposal,
  getDiscontinuedOpsPnL,
  listHeldForSaleInitiatives,
} from '../../../services/gl/discontinued-ops-service.js';

export const discontinuedOpsResolvers = {
  Query: {
    discontinuedOpsPnL: async (_: unknown, args: { entityId: string; periodId: string; fundId?: string }) =>
      getDiscontinuedOpsPnL(args.entityId, args.periodId, args.fundId),

    heldForSaleInitiatives: async (_: unknown, args: { entityId: string }) =>
      listHeldForSaleInitiatives(args.entityId),
  },

  Mutation: {
    classifyAsHeldForSale: async (_: unknown, { input }: { input: Record<string, unknown> }) =>
      classifyAsHeldForSale(input as any),

    declassifyHeldForSale: async (_: unknown, args: { initiativeId: string; entityId: string }) => {
      await declassifyHeldForSale(args.initiativeId, args.entityId);
      return true;
    },

    recordDisposal: async (_: unknown, args: {
      initiativeId: string; entityId: string; disposalDate: string;
      proceedsAmount: number; periodId: string; currency: string; fundId?: string;
    }) => recordDisposal(
      args.initiativeId, args.entityId, args.disposalDate,
      args.proceedsAmount, args.periodId, args.currency, args.fundId,
    ),
  },
};
