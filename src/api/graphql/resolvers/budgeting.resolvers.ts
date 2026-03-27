import {
  createBudget, getBudget, listBudgets, approveBudget, lockBudget,
  addBudgetLine, getBudgetLines, updateBudgetLine, deleteBudgetLine,
  getVarianceReport, generateRollingForecast,
} from '../../../services/gl/budgeting-service.js';

export const budgetingResolvers = {
  Query: {
    budget: async (_: unknown, { id }: { id: string }) => getBudget(id),
    budgets: async (_: unknown, { entityId, fiscalYear, status }: { entityId: string; fiscalYear?: number; status?: string }) =>
      listBudgets(entityId, fiscalYear, status as any),
    budgetLines: async (_: unknown, { budgetId, periodId }: { budgetId: string; periodId?: string }) =>
      getBudgetLines(budgetId, periodId),
    varianceReport: async (_: unknown, { budgetId, periodIds }: { budgetId: string; periodIds?: string[] }) =>
      getVarianceReport(budgetId, periodIds),
  },

  Mutation: {
    createBudget: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const id = await createBudget(input as any);
      return getBudget(id);
    },
    approveBudget: async (_: unknown, { budgetId, approvedBy }: { budgetId: string; approvedBy: string }) =>
      approveBudget(budgetId, approvedBy),
    lockBudget: async (_: unknown, { budgetId }: { budgetId: string }) =>
      lockBudget(budgetId),
    addBudgetLine: async (_: unknown, { input }: { input: Record<string, unknown> }) =>
      addBudgetLine(input as any),
    updateBudgetLine: async (_: unknown, { lineId, amount, notes }: { lineId: string; amount: number; notes?: string }) => {
      await updateBudgetLine(lineId, amount, notes);
      return lineId;
    },
    deleteBudgetLine: async (_: unknown, { lineId }: { lineId: string }) => {
      await deleteBudgetLine(lineId);
      return lineId;
    },
    generateRollingForecast: async (_: unknown, { budgetId, completedPeriodIds, remainingPeriodIds }: { budgetId: string; completedPeriodIds: string[]; remainingPeriodIds: string[] }) =>
      generateRollingForecast(budgetId, completedPeriodIds, remainingPeriodIds),
  },
};
