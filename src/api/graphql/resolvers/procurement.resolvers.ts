import {
  createPurchaseOrder, getPurchaseOrder, listPurchaseOrders,
  submitForApproval, approvePurchaseOrder, issuePurchaseOrder, cancelPurchaseOrder,
  createGoodsReceipt, getGoodsReceipt, listGoodsReceipts,
  performThreeWayMatch, closePurchaseOrder, getPOSummary,
} from '../../../services/gl/procurement-service.js';

export const procurementResolvers = {
  Query: {
    purchaseOrder: async (_: unknown, { id }: { id: string }) => getPurchaseOrder(id),
    purchaseOrders: async (_: unknown, { entityId, status, vendorId }: { entityId: string; status?: string; vendorId?: string }) =>
      listPurchaseOrders(entityId, status as any, vendorId),
    goodsReceipt: async (_: unknown, { id }: { id: string }) => getGoodsReceipt(id),
    goodsReceipts: async (_: unknown, { poId }: { poId: string }) => listGoodsReceipts(poId),
    poSummary: async (_: unknown, { entityId }: { entityId: string }) => getPOSummary(entityId),
  },

  Mutation: {
    createPurchaseOrder: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const id = await createPurchaseOrder(input as any);
      return getPurchaseOrder(id);
    },
    submitPOForApproval: async (_: unknown, { poId }: { poId: string }) =>
      submitForApproval(poId),
    approvePurchaseOrder: async (_: unknown, { poId, approvedBy }: { poId: string; approvedBy: string }) =>
      approvePurchaseOrder(poId, approvedBy),
    issuePurchaseOrder: async (_: unknown, { poId }: { poId: string }) =>
      issuePurchaseOrder(poId),
    cancelPurchaseOrder: async (_: unknown, { poId, reason }: { poId: string; reason: string }) =>
      cancelPurchaseOrder(poId, reason),
    closePurchaseOrder: async (_: unknown, { poId }: { poId: string }) =>
      closePurchaseOrder(poId),
    createGoodsReceipt: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const { poId, receivedBy, receiptDate, lines, notes } = input as any;
      const id = await createGoodsReceipt(poId, receivedBy, receiptDate, lines, notes);
      return getGoodsReceipt(id);
    },
    performThreeWayMatch: async (_: unknown, { poId, invoiceId, tolerancePercent }: { poId: string; invoiceId: string; tolerancePercent?: number }) =>
      performThreeWayMatch(poId, invoiceId, tolerancePercent),
  },
};
