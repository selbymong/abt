import { GraphQLError } from 'graphql';
import {
  createShareClass,
  getShareClass,
  listShareClasses,
  issueShares,
  getTotalShareCapital,
  createEquityAward,
  getEquityAward,
  listEquityAwards,
  recognizeVestingCompensation,
  forfeitAward,
  computeEPS,
} from '../../../services/gl/equity-expansion-service.js';

export const equityResolvers = {
  Query: {
    shareClass: async (_: unknown, { id }: { id: string }) => {
      const sc = await getShareClass(id);
      if (!sc) throw new GraphQLError('ShareClass not found', { extensions: { code: 'NOT_FOUND' } });
      return sc;
    },
    shareClasses: async (_: unknown, { entityId }: { entityId: string }) => {
      return listShareClasses(entityId);
    },
    equityAward: async (_: unknown, { id }: { id: string }) => {
      const award = await getEquityAward(id);
      if (!award) throw new GraphQLError('EquityAward not found', { extensions: { code: 'NOT_FOUND' } });
      return award;
    },
    equityAwards: async (_: unknown, { entityId }: { entityId: string }) => {
      return listEquityAwards(entityId);
    },
    eps: async (_: unknown, { entityId, periodId, netIncome }: { entityId: string; periodId: string; netIncome: number }) => {
      return computeEPS(entityId, periodId, netIncome);
    },
    totalShareCapital: async (_: unknown, { entityId }: { entityId: string }) => {
      return getTotalShareCapital(entityId);
    },
  },
  Mutation: {
    createShareClass: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      return createShareClass(input as unknown as Parameters<typeof createShareClass>[0]);
    },
    issueShares: async (_: unknown, { shareClassId, additionalShares, pricePerShare }: { shareClassId: string; additionalShares: number; pricePerShare: number }) => {
      return issueShares(shareClassId, additionalShares, pricePerShare);
    },
    createEquityAward: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      return createEquityAward(input as unknown as Parameters<typeof createEquityAward>[0]);
    },
    recognizeVesting: async (_: unknown, args: { awardId: string; periodId: string; monthsElapsed: number; validDate: string; currency: string }) => {
      return recognizeVestingCompensation(args.awardId, args.periodId, args.monthsElapsed, args.validDate, args.currency);
    },
    forfeitAward: async (_: unknown, { awardId }: { awardId: string }) => {
      await forfeitAward(awardId);
      return true;
    },
    computeEPS: async (_: unknown, { entityId, periodId, netIncome }: { entityId: string; periodId: string; netIncome: number }) => {
      return computeEPS(entityId, periodId, netIncome);
    },
  },
};
