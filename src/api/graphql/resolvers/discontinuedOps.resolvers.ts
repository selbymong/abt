import {
  classifyAsHeldForSale,
  declassifyHeldForSale,
  recordDisposal,
  getDiscontinuedOpsPnL,
  listHeldForSaleProducts,
} from '../../../services/gl/discontinued-ops-service.js';

export const discontinuedOpsResolvers = {
  Query: {
    discontinuedOpsPnL: async (_: unknown, args: { entityId: string; periodId: string; fundId?: string }) =>
      getDiscontinuedOpsPnL(args.entityId, args.periodId, args.fundId),

    heldForSaleProducts: async (_: unknown, args: { entityId: string }) =>
      listHeldForSaleProducts(args.entityId),
  },

  Mutation: {
    classifyAsHeldForSale: async (_: unknown, { input }: { input: Record<string, unknown> }) =>
      classifyAsHeldForSale(input as any),

    declassifyHeldForSale: async (_: unknown, args: { productId: string; entityId: string }) => {
      await declassifyHeldForSale(args.productId, args.entityId);
      return true;
    },

    recordDisposal: async (_: unknown, args: {
      productId: string; entityId: string; disposalDate: string;
      proceedsAmount: number; periodId: string; currency: string; fundId?: string;
    }) => recordDisposal(
      args.productId, args.entityId, args.disposalDate,
      args.proceedsAmount, args.periodId, args.currency, args.fundId,
    ),
  },
};
