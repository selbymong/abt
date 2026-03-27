import { GraphQLError } from 'graphql';
import {
  createFinancialInstrument,
  getFinancialInstrument,
  listFinancialInstruments,
  updateFairValue,
  createHedgeRelationship,
  getHedgeRelationship,
  listHedgeRelationships,
  runProspectiveTest,
  runRetrospectiveTest,
  processFairValueHedge,
  processCashFlowHedge,
  processNetInvestmentHedge,
  dedesignateHedge,
  getHedgeAccountingSummary,
} from '../../../services/gl/hedge-accounting-service.js';

export const hedgeResolvers = {
  Query: {
    async financialInstrument(_: unknown, args: { id: string }) {
      return getFinancialInstrument(args.id);
    },

    async financialInstruments(_: unknown, args: { entityId: string }) {
      return listFinancialInstruments(args.entityId);
    },

    async hedgeRelationship(_: unknown, args: { id: string }) {
      return getHedgeRelationship(args.id);
    },

    async hedgeRelationships(_: unknown, args: { entityId: string }) {
      return listHedgeRelationships(args.entityId);
    },

    async hedgeSummary(_: unknown, args: { entityId: string }) {
      return getHedgeAccountingSummary(args.entityId);
    },
  },

  Mutation: {
    async createFinancialInstrument(_: unknown, args: { input: any }) {
      try {
        return await createFinancialInstrument(args.input);
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'BAD_USER_INPUT' } });
      }
    },

    async updateFairValue(_: unknown, args: { instrumentId: string; newFairValue: number }) {
      try {
        return await updateFairValue(args.instrumentId, args.newFairValue);
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'NOT_FOUND' } });
      }
    },

    async createHedgeRelationship(_: unknown, args: { input: any }) {
      try {
        return await createHedgeRelationship(args.input);
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'BAD_USER_INPUT' } });
      }
    },

    async prospectiveTest(_: unknown, args: { hedgeId: string }) {
      try {
        return await runProspectiveTest(args.hedgeId);
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'NOT_FOUND' } });
      }
    },

    async retrospectiveTest(
      _: unknown,
      args: { hedgeId: string; hedgingInstrumentChange: number; hedgedItemChange: number },
    ) {
      try {
        return await runRetrospectiveTest(
          args.hedgeId,
          args.hedgingInstrumentChange,
          args.hedgedItemChange,
        );
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'NOT_FOUND' } });
      }
    },

    async processFairValueHedge(
      _: unknown,
      args: { hedgeId: string; instrumentFVChange: number; hedgedItemFVChange: number },
    ) {
      try {
        return await processFairValueHedge(
          args.hedgeId,
          args.instrumentFVChange,
          args.hedgedItemFVChange,
        );
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'BAD_USER_INPUT' } });
      }
    },

    async processCashFlowHedge(
      _: unknown,
      args: { hedgeId: string; instrumentFVChange: number; hedgedItemFVChange: number },
    ) {
      try {
        return await processCashFlowHedge(
          args.hedgeId,
          args.instrumentFVChange,
          args.hedgedItemFVChange,
        );
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'BAD_USER_INPUT' } });
      }
    },

    async processNetInvestmentHedge(
      _: unknown,
      args: { hedgeId: string; instrumentFVChange: number; netInvestmentChange: number },
    ) {
      try {
        return await processNetInvestmentHedge(
          args.hedgeId,
          args.instrumentFVChange,
          args.netInvestmentChange,
        );
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'BAD_USER_INPUT' } });
      }
    },

    async dedesignateHedge(_: unknown, args: { hedgeId: string }) {
      try {
        return await dedesignateHedge(args.hedgeId);
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'NOT_FOUND' } });
      }
    },
  },
};
