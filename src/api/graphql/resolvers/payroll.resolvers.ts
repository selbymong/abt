import {
  createEmployee, getEmployee, listEmployees,
  createPayRun, getPayRun, listPayRuns,
  calculatePayRun, approvePayRun, postPayRun,
  getPayStubs, generateTaxSlips,
} from '../../../services/gl/payroll-service.js';

export const payrollResolvers = {
  Query: {
    employee: async (_: unknown, { id }: { id: string }) => getEmployee(id),
    employees: async (_: unknown, { entityId, status }: { entityId: string; status?: string }) =>
      listEmployees(entityId, status as any),
    payRun: async (_: unknown, { id }: { id: string }) => getPayRun(id),
    payRuns: async (_: unknown, { entityId }: { entityId: string }) => listPayRuns(entityId),
    payStubs: async (_: unknown, { payRunId }: { payRunId: string }) => getPayStubs(payRunId),
    taxSlips: async (_: unknown, { entityId, year }: { entityId: string; year: number }) =>
      generateTaxSlips(entityId, year),
  },

  Mutation: {
    createEmployee: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const id = await createEmployee(input as any);
      return getEmployee(id);
    },
    createPayRun: async (_: unknown, { input }: { input: Record<string, unknown> }) =>
      createPayRun(input as any),
    calculatePayRun: async (_: unknown, { payRunId }: { payRunId: string }) =>
      calculatePayRun(payRunId),
    approvePayRun: async (_: unknown, { payRunId }: { payRunId: string }) => {
      await approvePayRun(payRunId);
      return payRunId;
    },
    postPayRun: async (_: unknown, { payRunId }: { payRunId: string }) =>
      postPayRun(payRunId),
  },
};
