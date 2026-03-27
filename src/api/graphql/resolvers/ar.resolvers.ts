import {
  createCustomer, getCustomer, listCustomers,
  createARInvoice, getARInvoice, listARInvoices,
  postARInvoice, recordARPayment, writeOffARInvoice,
  getARAgingReport, getCollectionsList,
} from '../../../services/gl/ar-subledger-service.js';

export const arResolvers = {
  Query: {
    customer: async (_: unknown, { id }: { id: string }) => getCustomer(id),
    customers: async (_: unknown, { entityId, status }: { entityId: string; status?: string }) =>
      listCustomers(entityId, status as any),
    arInvoice: async (_: unknown, { id }: { id: string }) => getARInvoice(id),
    arInvoices: async (_: unknown, { entityId, customerId, status }: { entityId: string; customerId?: string; status?: string }) =>
      listARInvoices(entityId, customerId, status as any),
    arAgingReport: async (_: unknown, { entityId, asOfDate }: { entityId: string; asOfDate?: string }) =>
      getARAgingReport(entityId, asOfDate ?? new Date().toISOString().slice(0, 10)),
    arCollectionsList: async (_: unknown, { entityId, asOfDate }: { entityId: string; asOfDate?: string }) =>
      getCollectionsList(entityId, asOfDate ?? new Date().toISOString().slice(0, 10)),
  },

  Mutation: {
    createCustomer: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const id = await createCustomer(input as any);
      return getCustomer(id);
    },
    createARInvoice: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const id = await createARInvoice(input as any);
      return getARInvoice(id);
    },
    postARInvoice: async (_: unknown, { invoiceId }: { invoiceId: string }) =>
      postARInvoice(invoiceId),
    recordARPayment: async (_: unknown, args: { invoiceId: string; paymentAmount: number; periodId: string; paymentDate: string; currency: string }) =>
      recordARPayment(args.invoiceId, args.paymentAmount, args.periodId, args.paymentDate, args.currency),
    writeOffARInvoice: async (_: unknown, { invoiceId, periodId, currency }: { invoiceId: string; periodId: string; currency: string }) =>
      writeOffARInvoice(invoiceId, periodId, currency),
  },
};
