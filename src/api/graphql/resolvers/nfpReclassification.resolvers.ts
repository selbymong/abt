import {
  scanExpiredRestrictions,
  reclassifyFund,
  autoReclassifyExpired,
  fulfillPurposeRestriction,
  getReclassificationHistory,
  getFundRestrictionSummary,
} from '../../../services/gl/nfp-reclassification-service.js';

export const nfpReclassificationResolvers = {
  Query: {
    expiredRestrictions: async (_: unknown, args: { entityId: string; asOfDate?: string }) =>
      scanExpiredRestrictions(args.entityId, args.asOfDate ?? new Date().toISOString().slice(0, 10)),

    reclassificationHistory: async (_: unknown, args: { entityId: string; fundId?: string }) =>
      getReclassificationHistory(args.entityId, args.fundId),

    fundRestrictionSummary: async (_: unknown, args: { entityId: string; periodId?: string }) =>
      getFundRestrictionSummary(args.entityId, args.periodId),
  },

  Mutation: {
    reclassifyFund: async (_: unknown, { input }: { input: Record<string, unknown> }) =>
      reclassifyFund(input as any),

    autoReclassifyExpired: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const { entityId, periodId, currency, asOfDate, approvedBy } = input as any;
      return autoReclassifyExpired(entityId, periodId, currency, asOfDate, approvedBy);
    },

    fulfillPurposeRestriction: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const { fundId, entityId, periodId, currency, amount, fulfillmentDate, fulfillmentDescription, approvedBy } = input as any;
      return fulfillPurposeRestriction(fundId, entityId, periodId, currency, amount, fulfillmentDate, fulfillmentDescription, approvedBy);
    },
  },
};
