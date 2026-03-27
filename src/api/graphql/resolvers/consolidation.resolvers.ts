// Consolidation domain GraphQL resolvers
// Delegates to consolidation-service

import { GraphQLError } from 'graphql';
import {
  createConsolidationGroup,
  getConsolidationGroup,
  getConsolidationGroupForEntity,
  createOwnershipInterest,
  getOwnershipInterest,
  listOwnershipInterests,
  createIntercompanyMatch,
  createGoodwill,
  getGoodwill,
  impairGoodwill,
  translateCurrency,
  getCurrencyTranslation,
  getConsolidatedPnL,
  getConsolidatedBalanceSheet,
} from '../../../services/consolidation/consolidation-service.js';
import {
  createBusinessCombination,
  getBusinessCombination,
  listBusinessCombinations,
  completePPA,
  createPPA,
  getPPA,
  listPPAs,
  amortizePPA,
  createCGU,
  getCGU,
  listCGUs,
  runImpairmentTest,
  getImpairmentTest,
  listImpairmentTests,
} from '../../../services/consolidation/business-combination-service.js';

export const consolidationResolvers = {
  Query: {
    consolidationGroup: async (
      _: unknown,
      args: { id: string },
    ) => {
      try {
        return await getConsolidationGroup(args.id);
      } catch (err) {
        throw new GraphQLError(`Failed to get consolidation group: ${(err as Error).message}`);
      }
    },

    consolidationGroupForEntity: async (
      _: unknown,
      args: { entityId: string },
    ) => {
      try {
        return await getConsolidationGroupForEntity(args.entityId);
      } catch (err) {
        throw new GraphQLError(`Failed to get consolidation group for entity: ${(err as Error).message}`);
      }
    },

    ownershipInterest: async (
      _: unknown,
      args: { id: string },
    ) => {
      try {
        return await getOwnershipInterest(args.id);
      } catch (err) {
        throw new GraphQLError(`Failed to get ownership interest: ${(err as Error).message}`);
      }
    },

    ownershipInterests: async (
      _: unknown,
      args: { entityId: string },
    ) => {
      try {
        return await listOwnershipInterests(args.entityId);
      } catch (err) {
        throw new GraphQLError(`Failed to list ownership interests: ${(err as Error).message}`);
      }
    },

    goodwill: async (
      _: unknown,
      args: { id: string },
    ) => {
      try {
        return await getGoodwill(args.id);
      } catch (err) {
        throw new GraphQLError(`Failed to get goodwill: ${(err as Error).message}`);
      }
    },

    currencyTranslation: async (
      _: unknown,
      args: { entityId: string; periodId: string },
    ) => {
      try {
        return await getCurrencyTranslation(args.entityId, args.periodId);
      } catch (err) {
        throw new GraphQLError(`Failed to get currency translation: ${(err as Error).message}`);
      }
    },

    consolidatedPnL: async (
      _: unknown,
      args: { groupId: string; periodId: string },
    ) => {
      try {
        return await getConsolidatedPnL(args.groupId, args.periodId);
      } catch (err) {
        throw new GraphQLError(`Failed to get consolidated P&L: ${(err as Error).message}`);
      }
    },

    consolidatedBalanceSheet: async (
      _: unknown,
      args: { groupId: string; periodId: string },
    ) => {
      try {
        return await getConsolidatedBalanceSheet(args.groupId, args.periodId);
      } catch (err) {
        throw new GraphQLError(`Failed to get consolidated balance sheet: ${(err as Error).message}`);
      }
    },

    businessCombination: async (_: unknown, args: { id: string }) => {
      try { return await getBusinessCombination(args.id); }
      catch (err) { throw new GraphQLError(`Failed to get business combination: ${(err as Error).message}`); }
    },

    businessCombinations: async (_: unknown, args: { acquirerEntityId: string }) => {
      try { return await listBusinessCombinations(args.acquirerEntityId); }
      catch (err) { throw new GraphQLError(`Failed to list business combinations: ${(err as Error).message}`); }
    },

    purchasePriceAdjustment: async (_: unknown, args: { id: string }) => {
      try { return await getPPA(args.id); }
      catch (err) { throw new GraphQLError(`Failed to get PPA: ${(err as Error).message}`); }
    },

    purchasePriceAdjustments: async (_: unknown, args: { businessCombinationId: string }) => {
      try { return await listPPAs(args.businessCombinationId); }
      catch (err) { throw new GraphQLError(`Failed to list PPAs: ${(err as Error).message}`); }
    },

    cashGeneratingUnit: async (_: unknown, args: { id: string }) => {
      try { return await getCGU(args.id); }
      catch (err) { throw new GraphQLError(`Failed to get CGU: ${(err as Error).message}`); }
    },

    cashGeneratingUnits: async (_: unknown, args: { entityId: string }) => {
      try { return await listCGUs(args.entityId); }
      catch (err) { throw new GraphQLError(`Failed to list CGUs: ${(err as Error).message}`); }
    },

    impairmentTest: async (_: unknown, args: { id: string }) => {
      try { return await getImpairmentTest(args.id); }
      catch (err) { throw new GraphQLError(`Failed to get impairment test: ${(err as Error).message}`); }
    },

    impairmentTests: async (_: unknown, args: { cguId: string }) => {
      try { return await listImpairmentTests(args.cguId); }
      catch (err) { throw new GraphQLError(`Failed to list impairment tests: ${(err as Error).message}`); }
    },
  },

  Mutation: {
    createConsolidationGroup: async (
      _: unknown,
      args: {
        input: {
          label: string;
          parentEntityId: string;
          functionalCurrency: string;
          entityIds: string[];
          minorityInterestMethod: string;
          intercompanyThreshold?: number;
        };
      },
    ) => {
      try {
        const id = await createConsolidationGroup(args.input as any);
        return await getConsolidationGroup(id);
      } catch (err) {
        throw new GraphQLError(`Failed to create consolidation group: ${(err as Error).message}`);
      }
    },

    createOwnershipInterest: async (
      _: unknown,
      args: {
        input: {
          investorEntityId: string;
          investeeEntityId: string;
          ownershipPct: number;
          acquisitionCost: number;
          netAssetsAtAcquisition: number;
          acquisitionDate: string;
        };
      },
    ) => {
      try {
        const id = await createOwnershipInterest(args.input);
        return await getOwnershipInterest(id);
      } catch (err) {
        throw new GraphQLError(`Failed to create ownership interest: ${(err as Error).message}`);
      }
    },

    createIntercompanyMatch: async (
      _: unknown,
      args: {
        input: {
          sourceLedgerLineId: string;
          targetLedgerLineId: string;
          sourceEntityId: string;
          targetEntityId: string;
          eliminationAmount: number;
          transactionType: string;
          amountSellerCurrency: number;
          amountBuyerCurrency: number;
          unrealizedProfitPct?: number;
        };
      },
    ) => {
      try {
        return await createIntercompanyMatch(args.input as any);
      } catch (err) {
        throw new GraphQLError(`Failed to create intercompany match: ${(err as Error).message}`);
      }
    },

    createGoodwill: async (
      _: unknown,
      args: {
        input: {
          acquireeEntityId: string;
          grossAmount: number;
          currency: string;
          isFullGoodwill: boolean;
          nciGoodwillPct?: number;
          taxDeductible?: boolean;
        };
      },
    ) => {
      try {
        const id = await createGoodwill(args.input);
        return await getGoodwill(id);
      } catch (err) {
        throw new GraphQLError(`Failed to create goodwill: ${(err as Error).message}`);
      }
    },

    impairGoodwill: async (
      _: unknown,
      args: { input: { goodwillId: string; impairmentLoss: number; testDate: string } },
    ) => {
      try {
        return await impairGoodwill(
          args.input.goodwillId,
          args.input.impairmentLoss,
          args.input.testDate,
        );
      } catch (err) {
        throw new GraphQLError(`Failed to impair goodwill: ${(err as Error).message}`);
      }
    },

    translateCurrency: async (
      _: unknown,
      args: {
        input: {
          entityId: string;
          periodId: string;
          functionalCurrency: string;
          presentationCurrency: string;
          averageRate: number;
          closingRate: number;
        };
      },
    ) => {
      try {
        return await translateCurrency(args.input);
      } catch (err) {
        throw new GraphQLError(`Failed to translate currency: ${(err as Error).message}`);
      }
    },

    createBusinessCombination: async (_: unknown, args: { input: any }) => {
      try { return await createBusinessCombination(args.input); }
      catch (err) { throw new GraphQLError(`Failed to create business combination: ${(err as Error).message}`); }
    },

    completePPA: async (_: unknown, args: { businessCombinationId: string }) => {
      try { return await completePPA(args.businessCombinationId); }
      catch (err) { throw new GraphQLError(`Failed to complete PPA: ${(err as Error).message}`); }
    },

    createPurchasePriceAdjustment: async (_: unknown, args: { input: any }) => {
      try {
        const id = await createPPA(args.input);
        return await getPPA(id);
      }
      catch (err) { throw new GraphQLError(`Failed to create PPA: ${(err as Error).message}`); }
    },

    amortizePPA: async (_: unknown, args: { input: { ppaId: string; periodCharge: number } }) => {
      try { return await amortizePPA(args.input.ppaId, args.input.periodCharge); }
      catch (err) { throw new GraphQLError(`Failed to amortize PPA: ${(err as Error).message}`); }
    },

    createCashGeneratingUnit: async (_: unknown, args: { input: any }) => {
      try {
        const id = await createCGU(args.input);
        return await getCGU(id);
      }
      catch (err) { throw new GraphQLError(`Failed to create CGU: ${(err as Error).message}`); }
    },

    runImpairmentTest: async (_: unknown, args: { input: any }) => {
      try { return await runImpairmentTest(args.input); }
      catch (err) { throw new GraphQLError(`Failed to run impairment test: ${(err as Error).message}`); }
    },
  },
};
