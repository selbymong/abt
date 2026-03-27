// Tax domain GraphQL resolvers
// Delegates to tax-engine-service, tax-modules-service, tax-credits-service, tax-credit-ai-service

import { GraphQLError } from 'graphql';
import {
  computeDeferredTax,
  computeCurrentTax,
  getDeferredTaxPositions,
  getDeferredTaxSummary,
  createTaxProvision,
  listTaxProvisions,
  postTaxProvision,
} from '../../../services/tax/tax-engine-service.js';
import {
  computeCRACorporate,
  computeGSTHST,
  computeIRSCorporate,
  computeCRACharity,
  computeIRSExempt,
  computeStateTax,
  computeWithholdingTax,
  getTaxModuleResults,
} from '../../../services/tax/tax-modules-service.js';
import {
  listTaxCreditPrograms,
  getTaxCreditProgram,
  identifyEligibleExpenditures,
  createTaxCreditClaim,
  listTaxCreditClaims,
  updateClaimStatus,
  updateCreditBalance,
  getCreditBalance,
  getTaxCreditClaim,
} from '../../../services/tax/tax-credits-service.js';
import {
  createQualifiesForEdge,
  acceptQualification,
  rejectQualification,
  getFeedbackSummary,
  computeAccuracyMetrics,
  refineEligibilityModel,
  reidentifyWithRefinedModel,
} from '../../../services/tax/tax-credit-ai-service.js';

export const taxResolvers = {
  Query: {
    deferredTaxPositions: async (
      _: unknown,
      args: { entityId: string; periodId: string },
    ) => {
      try {
        return await getDeferredTaxPositions(args.entityId, args.periodId);
      } catch (err) {
        throw new GraphQLError(`Failed to get deferred tax positions: ${(err as Error).message}`);
      }
    },

    deferredTaxSummary: async (
      _: unknown,
      args: { entityId: string; periodId?: string },
    ) => {
      try {
        return await getDeferredTaxSummary(args.entityId);
      } catch (err) {
        throw new GraphQLError(`Failed to get deferred tax summary: ${(err as Error).message}`);
      }
    },

    taxProvisions: async (
      _: unknown,
      args: { entityId: string },
    ) => {
      try {
        return await listTaxProvisions(args.entityId);
      } catch (err) {
        throw new GraphQLError(`Failed to list tax provisions: ${(err as Error).message}`);
      }
    },

    taxCreditPrograms: async (
      _: unknown,
      args: { jurisdiction?: string },
    ) => {
      try {
        return await listTaxCreditPrograms(args.jurisdiction);
      } catch (err) {
        throw new GraphQLError(`Failed to list tax credit programs: ${(err as Error).message}`);
      }
    },

    taxCreditProgram: async (
      _: unknown,
      args: { code: string },
    ) => {
      try {
        return await getTaxCreditProgram(args.code);
      } catch (err) {
        throw new GraphQLError(`Failed to get tax credit program: ${(err as Error).message}`);
      }
    },

    taxCreditClaims: async (
      _: unknown,
      args: { entityId: string },
    ) => {
      try {
        return await listTaxCreditClaims(args.entityId);
      } catch (err) {
        throw new GraphQLError(`Failed to list tax credit claims: ${(err as Error).message}`);
      }
    },

    taxCreditBalance: async (
      _: unknown,
      args: { entityId: string; programCode: string },
    ) => {
      try {
        return await getCreditBalance(args.entityId, args.programCode);
      } catch (err) {
        throw new GraphQLError(`Failed to get tax credit balance: ${(err as Error).message}`);
      }
    },

    taxModuleResults: async (
      _: unknown,
      args: { entityId: string; periodId?: string },
    ) => {
      try {
        return await getTaxModuleResults(args.entityId, args.periodId ?? undefined);
      } catch (err) {
        throw new GraphQLError(`Failed to get tax module results: ${(err as Error).message}`);
      }
    },

    feedbackSummary: async (
      _: unknown,
      args: { programCode: string },
    ) => {
      try {
        return await getFeedbackSummary(args.programCode);
      } catch (err) {
        throw new GraphQLError(`Failed to get feedback summary: ${(err as Error).message}`);
      }
    },

    accuracyMetrics: async (
      _: unknown,
      args: { programCode: string },
    ) => {
      try {
        return await computeAccuracyMetrics(args.programCode);
      } catch (err) {
        throw new GraphQLError(`Failed to compute accuracy metrics: ${(err as Error).message}`);
      }
    },
  },

  Mutation: {
    computeDeferredTax: async (
      _: unknown,
      args: { input: { entityId: string; periodId: string; taxRate: number } },
    ) => {
      try {
        return await computeDeferredTax(args.input);
      } catch (err) {
        throw new GraphQLError(`Failed to compute deferred tax: ${(err as Error).message}`);
      }
    },

    computeCurrentTax: async (
      _: unknown,
      args: { input: { entityId: string; periodId: string; taxRate: number; permanentDifferences?: number } },
    ) => {
      try {
        return await computeCurrentTax(args.input);
      } catch (err) {
        throw new GraphQLError(`Failed to compute current tax: ${(err as Error).message}`);
      }
    },

    createTaxProvision: async (
      _: unknown,
      args: { input: { entityId: string; periodId: string; taxRate: number; permanentDifferences?: number; creditAmount?: number } },
    ) => {
      try {
        return await createTaxProvision(args.input);
      } catch (err) {
        throw new GraphQLError(`Failed to create tax provision: ${(err as Error).message}`);
      }
    },

    postTaxProvision: async (
      _: unknown,
      args: { input: { id: string; journalEntryId: string } },
    ) => {
      try {
        return await postTaxProvision(args.input.id, args.input.journalEntryId);
      } catch (err) {
        throw new GraphQLError(`Failed to post tax provision: ${(err as Error).message}`);
      }
    },

    computeTaxModule: async (
      _: unknown,
      args: { module: string; input: Record<string, unknown> },
    ) => {
      try {
        const input = args.input;
        const entityId = input.entityId as string;
        const periodId = input.periodId as string;

        switch (args.module) {
          case 'CRA_CORPORATE':
            return await computeCRACorporate({
              entityId,
              periodId,
              activeBusinessIncome: input.activeBusinessIncome as number | undefined,
              smallBusinessLimit: input.smallBusinessLimit as number | undefined,
              gripBalance: input.gripBalance as number | undefined,
              lripBalance: input.lripBalance as number | undefined,
            });

          case 'GST_HST':
            return await computeGSTHST({
              entityId,
              periodId,
              gstRate: input.gstRate as number | undefined,
              hstRate: input.hstRate as number | undefined,
              salesAmount: input.salesAmount as number,
              purchasesAmount: input.purchasesAmount as number,
              isNFP: input.isNFP as boolean | undefined,
            });

          case 'IRS_CORPORATE':
            return await computeIRSCorporate({
              entityId,
              periodId,
              section179Deduction: input.section179Deduction as number | undefined,
            });

          case 'CRA_CHARITY':
            return await computeCRACharity({
              entityId,
              periodId,
              totalRevenue: input.totalRevenue as number,
              charitableExpenditures: input.charitableExpenditures as number,
              managementExpenses: input.managementExpenses as number,
            });

          case 'IRS_EXEMPT':
            return await computeIRSExempt({
              entityId,
              periodId,
              totalRevenue: input.totalRevenue as number,
              publicSupportRevenue: input.publicSupportRevenue as number,
              unrelatedBusinessIncome: input.unrelatedBusinessIncome as number | undefined,
            });

          case 'STATE_TAX':
            return await computeStateTax({
              entityId,
              periodId,
              stateCode: input.stateCode as string,
              stateRate: input.stateRate as number,
              nexusEstablished: input.nexusEstablished as boolean,
              apportionmentFactor: input.apportionmentFactor as number | undefined,
            });

          case 'WITHHOLDING_TAX':
            return await computeWithholdingTax({
              entityId,
              periodId,
              sourceEntityId: input.sourceEntityId as string,
              targetEntityId: input.targetEntityId as string,
              paymentType: input.paymentType as 'DIVIDEND' | 'INTEREST' | 'ROYALTY' | 'MANAGEMENT_FEE',
              grossAmount: input.grossAmount as number,
              treatyRate: input.treatyRate as number | undefined,
            });

          default:
            throw new Error(`Unknown tax module: ${args.module}`);
        }
      } catch (err) {
        throw new GraphQLError(`Failed to compute tax module: ${(err as Error).message}`);
      }
    },

    identifyEligibleExpenditures: async (
      _: unknown,
      args: { input: { entityId: string; programCode: string; periodId: string } },
    ) => {
      try {
        return await identifyEligibleExpenditures(args.input);
      } catch (err) {
        throw new GraphQLError(`Failed to identify eligible expenditures: ${(err as Error).message}`);
      }
    },

    createTaxCreditClaim: async (
      _: unknown,
      args: {
        input: {
          entityId: string;
          programCode: string;
          periodId: string;
          fiscalYear: string;
          eligibleExpenditureTotal: number;
          eligibleNodeIds: string[];
          aiConfidence?: number;
        };
      },
    ) => {
      try {
        const id = await createTaxCreditClaim(args.input);
        return await getTaxCreditClaim(id);
      } catch (err) {
        throw new GraphQLError(`Failed to create tax credit claim: ${(err as Error).message}`);
      }
    },

    updateClaimStatus: async (
      _: unknown,
      args: { input: { id: string; newStatus: string; assessedAmount?: number } },
    ) => {
      try {
        return await updateClaimStatus(
          args.input.id,
          args.input.newStatus as any,
          args.input.assessedAmount ?? undefined,
        );
      } catch (err) {
        throw new GraphQLError(`Failed to update claim status: ${(err as Error).message}`);
      }
    },

    updateCreditBalance: async (
      _: unknown,
      args: {
        input: {
          entityId: string;
          programCode: string;
          balanceAsOf: string;
          creditsEarned: number;
          creditsApplied?: number;
          creditsExpired?: number;
          creditsCarriedBack?: number;
        };
      },
    ) => {
      try {
        const id = await updateCreditBalance({
          entityId: args.input.entityId,
          programCode: args.input.programCode,
          balanceAsOf: args.input.balanceAsOf,
          creditsEarned: args.input.creditsEarned,
          creditsApplied: args.input.creditsApplied,
          creditsExpired: args.input.creditsExpired,
          creditsCarriedBack: args.input.creditsCarriedBack,
        });
        return await getCreditBalance(args.input.entityId, args.input.programCode) ?? { id };
      } catch (err) {
        throw new GraphQLError(`Failed to update credit balance: ${(err as Error).message}`);
      }
    },

    createQualifiesForEdge: async (
      _: unknown,
      args: {
        input: {
          sourceNodeId: string;
          claimId: string;
          qualificationBasis: string;
          eligibleAmount: number;
          eligibilityConfidence: number;
          expenditureCategory: string;
        };
      },
    ) => {
      try {
        await createQualifiesForEdge(args.input as any);
        return true;
      } catch (err) {
        throw new GraphQLError(`Failed to create QUALIFIES_FOR edge: ${(err as Error).message}`);
      }
    },

    acceptQualification: async (
      _: unknown,
      args: { sourceNodeId: string; claimId: string },
    ) => {
      try {
        await acceptQualification(args.sourceNodeId, args.claimId);
        return true;
      } catch (err) {
        throw new GraphQLError(`Failed to accept qualification: ${(err as Error).message}`);
      }
    },

    rejectQualification: async (
      _: unknown,
      args: { sourceNodeId: string; claimId: string; rejectionReason: string },
    ) => {
      try {
        await rejectQualification(args.sourceNodeId, args.claimId, args.rejectionReason);
        return true;
      } catch (err) {
        throw new GraphQLError(`Failed to reject qualification: ${(err as Error).message}`);
      }
    },

    refineEligibilityModel: async (
      _: unknown,
      args: { programCode: string },
    ) => {
      try {
        return await refineEligibilityModel(args.programCode);
      } catch (err) {
        throw new GraphQLError(`Failed to refine eligibility model: ${(err as Error).message}`);
      }
    },

    reidentifyWithRefinedModel: async (
      _: unknown,
      args: { entityId: string; programCode: string; periodId: string },
    ) => {
      try {
        return await reidentifyWithRefinedModel(args.entityId, args.programCode, args.periodId);
      } catch (err) {
        throw new GraphQLError(`Failed to re-identify with refined model: ${(err as Error).message}`);
      }
    },
  },
};
