export const arTypeDefs = `
  type Customer {
    id: String!
    entity_id: String!
    name: String!
    customer_code: String!
    currency: String!
    payment_terms_days: Int!
    credit_limit: Float!
    status: String!
    contact_email: String
    contact_phone: String
    address: String
    tax_id: String
    total_outstanding: Float!
    created_at: String
    updated_at: String
  }

  type ARInvoice {
    id: String!
    entity_id: String!
    customer_id: String!
    invoice_number: String!
    invoice_date: String!
    due_date: String!
    amount: Float!
    amount_received: Float!
    amount_remaining: Float!
    currency: String!
    description: String!
    status: String!
    period_id: String!
    journal_entry_id: String
    fund_id: String
  }

  type ARAgingBucket {
    current: Float!
    days30: Float!
    days60: Float!
    days90: Float!
    days120plus: Float!
    total: Float!
  }

  type CustomerAging {
    customerId: String!
    customerName: String!
    customerCode: String!
    aging: ARAgingBucket!
  }

  type ARAgingReport {
    entityId: String!
    asOfDate: String!
    customers: [CustomerAging!]!
    totals: ARAgingBucket!
  }

  type ARPaymentResult {
    journalEntryId: String!
    newStatus: String!
  }

  type CollectionsItem {
    invoiceId: String!
    invoiceNumber: String!
    customerId: String!
    customerName: String!
    dueDate: String!
    daysOverdue: Int!
    amountRemaining: Float!
  }

  input CreateCustomerInput {
    entityId: String!
    name: String!
    customerCode: String!
    currency: String!
    paymentTermsDays: Int!
    creditLimit: Float
    contactEmail: String
    contactPhone: String
    address: String
    taxId: String
  }

  input CreateARInvoiceInput {
    entityId: String!
    customerId: String!
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

  extend type Query {
    customer(id: ID!): Customer
    customers(entityId: String!, status: String): [Customer!]!
    arInvoice(id: ID!): ARInvoice
    arInvoices(entityId: String!, customerId: String, status: String): [ARInvoice!]!
    arAgingReport(entityId: String!, asOfDate: String): ARAgingReport!
    arCollectionsList(entityId: String!, asOfDate: String): [CollectionsItem!]!
  }

  extend type Mutation {
    createCustomer(input: CreateCustomerInput!): Customer!
    createARInvoice(input: CreateARInvoiceInput!): ARInvoice!
    postARInvoice(invoiceId: String!): String!
    recordARPayment(invoiceId: String!, paymentAmount: Float!, periodId: String!, paymentDate: String!, currency: String!): ARPaymentResult!
    writeOffARInvoice(invoiceId: String!, periodId: String!, currency: String!): String!
  }
`;
