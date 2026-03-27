import {
  generateIncomeStatement,
  generateBalanceSheet,
  generateCashFlowStatement,
  generateEquityChanges,
} from '../../../services/gl/financial-statements-service.js';
import type { StatementType } from '../../../services/gl/financial-statements-service.js';

const generators: Record<StatementType, typeof generateIncomeStatement> = {
  INCOME_STATEMENT: generateIncomeStatement,
  BALANCE_SHEET: generateBalanceSheet,
  CASH_FLOW: generateCashFlowStatement,
  EQUITY_CHANGES: generateEquityChanges,
};

export const financialStatementsResolvers = {
  Mutation: {},
  Query: {
    financialStatement: async (
      _: unknown,
      { type, entityId, periodId, priorPeriodId, currency }: {
        type: string; entityId: string; periodId: string;
        priorPeriodId?: string; currency?: string;
      },
    ) => {
      const generator = generators[type.toUpperCase() as StatementType];
      if (!generator) throw new Error(`Invalid statement type: ${type}`);
      return generator(entityId, periodId, priorPeriodId, currency);
    },

    fullFinancialStatements: async (
      _: unknown,
      { entityId, periodId, priorPeriodId, currency }: {
        entityId: string; periodId: string;
        priorPeriodId?: string; currency?: string;
      },
    ) => {
      const [incomeStatement, balanceSheet, cashFlow, equityChanges] = await Promise.all([
        generateIncomeStatement(entityId, periodId, priorPeriodId, currency),
        generateBalanceSheet(entityId, periodId, priorPeriodId, currency),
        generateCashFlowStatement(entityId, periodId, priorPeriodId, currency),
        generateEquityChanges(entityId, periodId, priorPeriodId, currency),
      ]);
      return { incomeStatement, balanceSheet, cashFlow, equityChanges };
    },
  },
};
