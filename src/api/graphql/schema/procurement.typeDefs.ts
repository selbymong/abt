export const procurementTypeDefs = `
  type PurchaseOrder {
    id: String!
    entity_id: String!
    vendor_id: String!
    po_number: String!
    description: String!
    currency: String!
    total_amount: Float!
    status: String!
    requested_by: String!
    approved_by: String
    required_date: String!
    line_items: String!
    budget_node_id: String
    fund_id: String
    created_at: String
    updated_at: String
  }

  type GoodsReceipt {
    id: String!
    po_id: String!
    entity_id: String!
    receipt_number: String!
    receipt_date: String!
    received_by: String!
    status: String!
    line_items: String!
    notes: String
    created_at: String
  }

  type ThreeWayMatchResult {
    poId: String!
    invoiceId: String!
    receiptId: String!
    poAmount: Float!
    receiptAmount: Float!
    invoiceAmount: Float!
    matchStatus: String!
    varianceAmount: Float!
    variancePercent: Float!
    tolerancePercent: Float!
    withinTolerance: Boolean!
  }

  type POSummary {
    totalOpen: Int!
    totalAmount: Float!
    byStatus: JSON!
  }

  input POLineItemInput {
    description: String!
    quantity: Float!
    unitPrice: Float!
    accountId: String!
    fundId: String
  }

  input CreatePurchaseOrderInput {
    entityId: String!
    vendorId: String!
    description: String!
    currency: String!
    requestedBy: String!
    requiredDate: String!
    lineItems: [POLineItemInput!]!
    budgetNodeId: String
    fundId: String
  }

  input ReceiptLineInput {
    poLineId: String!
    quantityReceived: Float!
    notes: String
  }

  input CreateGoodsReceiptInput {
    poId: String!
    receivedBy: String!
    receiptDate: String!
    lines: [ReceiptLineInput!]!
    notes: String
  }

  extend type Query {
    purchaseOrder(id: ID!): PurchaseOrder
    purchaseOrders(entityId: String!, status: String, vendorId: String): [PurchaseOrder!]!
    goodsReceipt(id: ID!): GoodsReceipt
    goodsReceipts(poId: String!): [GoodsReceipt!]!
    poSummary(entityId: String!): POSummary!
  }

  extend type Mutation {
    createPurchaseOrder(input: CreatePurchaseOrderInput!): PurchaseOrder!
    submitPOForApproval(poId: String!): PurchaseOrder!
    approvePurchaseOrder(poId: String!, approvedBy: String!): PurchaseOrder!
    issuePurchaseOrder(poId: String!): PurchaseOrder!
    cancelPurchaseOrder(poId: String!, reason: String!): PurchaseOrder!
    closePurchaseOrder(poId: String!): PurchaseOrder!
    createGoodsReceipt(input: CreateGoodsReceiptInput!): GoodsReceipt!
    performThreeWayMatch(poId: String!, invoiceId: String!, tolerancePercent: Float): ThreeWayMatchResult!
  }
`;
