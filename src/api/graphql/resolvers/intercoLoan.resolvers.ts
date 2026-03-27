import {
  createIntercoLoan, getIntercoLoan, listIntercoLoans,
  activateLoan, accrueInterest, recordRepayment,
  getAmortizationSchedule, generateEliminationEntries,
} from '../../../services/gl/interco-loan-service.js';

export const intercoLoanResolvers = {
  Query: {
    intercoLoan: async (_: unknown, { id }: { id: string }) => getIntercoLoan(id),
    intercoLoans: async (_: unknown, { entityId, role }: { entityId: string; role?: string }) =>
      listIntercoLoans(entityId, role as any),
    amortizationSchedule: async (_: unknown, { loanId }: { loanId: string }) =>
      getAmortizationSchedule(loanId),
  },

  Mutation: {
    createIntercoLoan: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const id = await createIntercoLoan(input as any);
      return getIntercoLoan(id);
    },
    activateIntercoLoan: async (_: unknown, { loanId }: { loanId: string }) =>
      activateLoan(loanId),
    accrueIntercoInterest: async (_: unknown, { loanId, periodId, accrualDate }: { loanId: string; periodId: string; accrualDate: string }) =>
      accrueInterest(loanId, periodId, accrualDate),
    recordIntercoRepayment: async (_: unknown, { loanId, periodId, paymentDate }: { loanId: string; periodId: string; paymentDate: string }) =>
      recordRepayment(loanId, periodId, paymentDate),
    eliminateIntercoLoan: async (_: unknown, { loanId, periodId, asOfDate }: { loanId: string; periodId: string; asOfDate: string }) =>
      generateEliminationEntries(loanId, periodId, asOfDate),
  },
};
