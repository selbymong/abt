export const apTypeDefs = `
  type Vendor {
    id: String!
    entity_id: String!
    name: String!
    vendor_code: String!
    currency: String!
    payment_terms_days: Int!
    status: String!
    contact_email: String
    contact_phone: String
    address: String
    tax_id: String
    total_outstanding: Float!
    created_at: String
    updated_at: String
  }

  type APInvoice {
    id: String!
    entity_id: String!
    vendor_id: String!
    invoice_number: String!
    invoice_date: String!
    due_date: String!
    amount: Float!
    amount_paid: Float!
    amount_remaining: Float!
    currency: String!
    description: String!
    status: String!
    period_id: String!
    journal_entry_id: String
    payment_journal_entry_id: String
    fund_id: String
    created_at: String
    updated_at: String
  }

  type AgingBucket {
    current: Float!
    days30: Float!
    days60: Float!
    days90: Float!
    days120plus: Float!
    total: Float!
  }

  type VendorAging {
    vendorId: String!
    vendorName: String!
    vendorCode: String!
    aging: AgingBucket!
  }

  type AgingReport {
    entityId: String!
    asOfDate: String!
    vendors: [VendorAging!]!
    totals: AgingBucket!
  }

  type PaymentRunResult {
    paymentRunId: String!
    invoicesPaid: Int!
    totalAmount: Float!
    journalEntryIds: [String!]!
  }

  type DunningItem {
    invoiceId: String!
    invoiceNumber: String!
    vendorId: String!
    vendorName: String!
    dueDate: String!
    daysOverdue: Int!
    amountRemaining: Float!
  }

  input CreateVendorInput {
    entityId: String!
    name: String!
    vendorCode: String!
    currency: String!
    paymentTermsDays: Int!
    contactEmail: String
    contactPhone: String
    address: String
    taxId: String
    bankAccount: String
    bankRouting: String
  }

  input APInvoiceLineItemInput {
    description: String!
    amount: Float!
    nodeRefId: String!
    nodeRefType: String!
    economicCategory: String!
  }

  input CreateAPInvoiceInput {
    entityId: String!
    vendorId: String!
    invoiceNumber: String!
    invoiceDate: String!
    dueDate: String!
    amount: Float!
    currency: String!
    description: String!
    lineItems: [APInvoiceLineItemInput!]!
    periodId: String!
    fundId: String
  }

  input ExecutePaymentRunInput {
    entityId: String!
    periodId: String!
    paymentDate: String!
    currency: String!
    maxDueDate: String
    vendorId: String
  }

  extend type Query {
    vendor(id: ID!): Vendor
    vendors(entityId: String!, status: String): [Vendor!]!
    apInvoice(id: ID!): APInvoice
    apInvoices(entityId: String!, vendorId: String, status: String): [APInvoice!]!
    apAgingReport(entityId: String!, asOfDate: String): AgingReport!
    apPaymentRuns(entityId: String!): [JSON!]!
    apDunningList(entityId: String!, asOfDate: String): [DunningItem!]!
  }

  extend type Mutation {
    createVendor(input: CreateVendorInput!): Vendor!
    createAPInvoice(input: CreateAPInvoiceInput!): APInvoice!
    approveAPInvoice(invoiceId: String!): Boolean!
    postAPInvoice(invoiceId: String!): String!
    voidAPInvoice(invoiceId: String!): Boolean!
    executePaymentRun(input: ExecutePaymentRunInput!): PaymentRunResult!
  }
`;
