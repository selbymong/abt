import { GraphQLError } from 'graphql';
import {
  createCashFlowEvent,
  getCashFlowEvent,
  listCashFlowEvents,
  settleCashFlowEvent,
  createCreditFacility,
  getCreditFacility,
  listCreditFacilities,
  scoreFloatWindow,
  scoreEntityFloatWindows,
  getFloatWindows,
  analyzeDiscount,
} from '../../../services/cashflow/cashflow-optimizer-service.js';

export const cashflowResolvers = {
  Query: {
    async cashFlowEvent(_: unknown, args: { id: string }) {
      return getCashFlowEvent(args.id);
    },

    async cashFlowEvents(_: unknown, args: { entityId: string; status?: string }) {
      return listCashFlowEvents(args.entityId, args.status);
    },

    async creditFacility(_: unknown, args: { id: string }) {
      return getCreditFacility(args.id);
    },

    async creditFacilities(_: unknown, args: { entityId: string }) {
      return listCreditFacilities(args.entityId);
    },

    async floatWindows(_: unknown, args: { entityId: string }) {
      return getFloatWindows(args.entityId);
    },

    async discountAnalysis(_: unknown, args: { cfeId: string }) {
      return analyzeDiscount(args.cfeId);
    },
  },

  Mutation: {
    async createCashFlowEvent(_: unknown, args: { input: any }) {
      try {
        return await createCashFlowEvent(args.input);
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'BAD_USER_INPUT' } });
      }
    },

    async settleCashFlowEvent(_: unknown, args: { id: string }) {
      const settled = await settleCashFlowEvent(args.id);
      if (!settled) {
        throw new GraphQLError('CashFlowEvent not found or already settled', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      return true;
    },

    async createCreditFacility(_: unknown, args: { input: any }) {
      try {
        return await createCreditFacility(args.input);
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'BAD_USER_INPUT' } });
      }
    },

    async scoreFloatWindow(_: unknown, args: { cfeId: string }) {
      try {
        return await scoreFloatWindow(args.cfeId);
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },

    async scoreEntityFloatWindows(_: unknown, args: { entityId: string }) {
      try {
        return await scoreEntityFloatWindows(args.entityId);
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },
  },
};
