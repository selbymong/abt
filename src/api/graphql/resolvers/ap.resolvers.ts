import {
  createVendor,
  getVendor,
  listVendors,
  createInvoice,
  getInvoice,
  listInvoices,
  approveInvoice,
  postInvoice,
  voidInvoice,
  getAgingReport,
  executePaymentRun,
  listPaymentRuns,
  getDunningList,
} from '../../../services/gl/ap-subledger-service.js';

export const apResolvers = {
  Query: {
    vendor: async (_: unknown, { id }: { id: string }) => getVendor(id),
    vendors: async (_: unknown, { entityId, status }: { entityId: string; status?: string }) =>
      listVendors(entityId, status as any),
    apInvoice: async (_: unknown, { id }: { id: string }) => getInvoice(id),
    apInvoices: async (_: unknown, { entityId, vendorId, status }: { entityId: string; vendorId?: string; status?: string }) =>
      listInvoices(entityId, vendorId, status as any),
    apAgingReport: async (_: unknown, { entityId, asOfDate }: { entityId: string; asOfDate?: string }) =>
      getAgingReport(entityId, asOfDate ?? new Date().toISOString().slice(0, 10)),
    apPaymentRuns: async (_: unknown, { entityId }: { entityId: string }) =>
      listPaymentRuns(entityId),
    apDunningList: async (_: unknown, { entityId, asOfDate }: { entityId: string; asOfDate?: string }) =>
      getDunningList(entityId, asOfDate ?? new Date().toISOString().slice(0, 10)),
  },

  Mutation: {
    createVendor: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const id = await createVendor(input as any);
      return getVendor(id);
    },
    createAPInvoice: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const id = await createInvoice(input as any);
      return getInvoice(id);
    },
    approveAPInvoice: async (_: unknown, { invoiceId }: { invoiceId: string }) => {
      await approveInvoice(invoiceId);
      return true;
    },
    postAPInvoice: async (_: unknown, { invoiceId }: { invoiceId: string }) =>
      postInvoice(invoiceId),
    voidAPInvoice: async (_: unknown, { invoiceId }: { invoiceId: string }) => {
      await voidInvoice(invoiceId);
      return true;
    },
    executePaymentRun: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const { entityId, periodId, paymentDate, currency, maxDueDate, vendorId } = input as any;
      return executePaymentRun(entityId, periodId, paymentDate, currency, maxDueDate, vendorId);
    },
  },
};
