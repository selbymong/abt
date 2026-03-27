import { GraphQLError } from 'graphql';
import {
  createBankStatement,
  getBankStatement,
  listBankStatements,
  addStatementLine,
  getBankStatementLine,
  listStatementLines,
  importStatementLines,
  matchLineToEvent,
  manualClearLine,
  autoMatch,
  finalizeReconciliation,
  generateReconciliationReport,
} from '../../../services/reconciliation/bank-reconciliation-service.js';
import type { BankStatementLineStatus } from '../../../schema/neo4j/types.js';

export const bankRecResolvers = {
  Query: {
    bankStatement: async (_: unknown, { id }: { id: string }) => {
      const bs = await getBankStatement(id);
      if (!bs) throw new GraphQLError('BankStatement not found', { extensions: { code: 'NOT_FOUND' } });
      return bs;
    },
    bankStatements: async (_: unknown, { entityId, bankAccountId }: { entityId: string; bankAccountId?: string }) => {
      return listBankStatements(entityId, bankAccountId);
    },
    bankStatementLine: async (_: unknown, { id }: { id: string }) => {
      const line = await getBankStatementLine(id);
      if (!line) throw new GraphQLError('BankStatementLine not found', { extensions: { code: 'NOT_FOUND' } });
      return line;
    },
    bankStatementLines: async (_: unknown, { statementId, status }: { statementId: string; status?: BankStatementLineStatus }) => {
      return listStatementLines(statementId, status);
    },
    reconciliationReport: async (_: unknown, { statementId }: { statementId: string }) => {
      const bs = await getBankStatement(statementId);
      if (!bs) throw new GraphQLError('BankStatement not found', { extensions: { code: 'NOT_FOUND' } });
      return generateReconciliationReport(bs.bank_account_id as string, statementId);
    },
  },
  Mutation: {
    createBankStatement: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      return createBankStatement(input as unknown as Parameters<typeof createBankStatement>[0]);
    },
    addStatementLine: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      return addStatementLine(input as unknown as Parameters<typeof addStatementLine>[0]);
    },
    importStatementLines: async (_: unknown, { entityId, statementId, bankAccountId, lines }: { entityId: string; statementId: string; bankAccountId: string; lines: Array<Record<string, unknown>> }) => {
      return importStatementLines(entityId, statementId, bankAccountId, lines as unknown as Parameters<typeof importStatementLines>[3]);
    },
    matchLineToEvent: async (_: unknown, { lineId, cashFlowEventId }: { lineId: string; cashFlowEventId: string }) => {
      await matchLineToEvent(lineId, cashFlowEventId);
      return true;
    },
    clearLine: async (_: unknown, { lineId }: { lineId: string }) => {
      await manualClearLine(lineId);
      return true;
    },
    autoMatch: async (_: unknown, { statementId, dateTolerance }: { statementId: string; dateTolerance?: number }) => {
      return autoMatch(statementId, dateTolerance ?? 3);
    },
    finalizeReconciliation: async (_: unknown, { statementId }: { statementId: string }) => {
      return finalizeReconciliation(statementId);
    },
  },
};
