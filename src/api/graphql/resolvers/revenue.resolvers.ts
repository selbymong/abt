import { GraphQLError } from 'graphql';
import {
  createRevenueContract,
  getRevenueContract,
  listRevenueContracts,
  activateContract,
  createPerformanceObligation,
  getPerformanceObligation,
  listPerformanceObligations,
  allocateTransactionPrice,
  createVariableConsideration,
  resolveVariableConsideration,
  recognizePointInTime,
  recognizeOverTime,
  getContractSummary,
} from '../../../services/gl/revenue-recognition-service.js';
import type { ContractStatus } from '../../../schema/neo4j/types.js';

export const revenueResolvers = {
  Query: {
    revenueContract: async (_: unknown, { id }: { id: string }) => {
      const rc = await getRevenueContract(id);
      if (!rc) throw new GraphQLError('RevenueContract not found', { extensions: { code: 'NOT_FOUND' } });
      return rc;
    },
    revenueContracts: async (_: unknown, { entityId, status }: { entityId: string; status?: ContractStatus }) => {
      return listRevenueContracts(entityId, status);
    },
    performanceObligation: async (_: unknown, { id }: { id: string }) => {
      const po = await getPerformanceObligation(id);
      if (!po) throw new GraphQLError('PerformanceObligation not found', { extensions: { code: 'NOT_FOUND' } });
      return po;
    },
    performanceObligations: async (_: unknown, { contractId }: { contractId: string }) => {
      return listPerformanceObligations(contractId);
    },
    contractSummary: async (_: unknown, { contractId }: { contractId: string }) => {
      return getContractSummary(contractId);
    },
  },
  Mutation: {
    createRevenueContract: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      return createRevenueContract(input as unknown as Parameters<typeof createRevenueContract>[0]);
    },
    activateContract: async (_: unknown, { id }: { id: string }) => {
      return activateContract(id);
    },
    createPerformanceObligation: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      return createPerformanceObligation(input as unknown as Parameters<typeof createPerformanceObligation>[0]);
    },
    recognizePointInTime: async (_: unknown, { poId, periodId, satisfiedDate }: { poId: string; periodId: string; satisfiedDate: string }) => {
      return recognizePointInTime(poId, periodId, satisfiedDate);
    },
    recognizeOverTime: async (_: unknown, { poId, periodId, progressPct, validDate }: { poId: string; periodId: string; progressPct: number; validDate: string }) => {
      return recognizeOverTime(poId, periodId, progressPct, validDate);
    },
    allocateTransactionPrice: async (_: unknown, { contractId }: { contractId: string }) => {
      return allocateTransactionPrice(contractId);
    },
    createVariableConsideration: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      return createVariableConsideration(input as unknown as Parameters<typeof createVariableConsideration>[0]);
    },
    resolveVariableConsideration: async (_: unknown, { id, resolvedAmount }: { id: string; resolvedAmount: number }) => {
      return resolveVariableConsideration(id, resolvedAmount);
    },
  },
};
