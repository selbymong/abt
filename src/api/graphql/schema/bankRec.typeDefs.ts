export const bankRecTypeDefs = `
  type BankStatement {
    id: ID!
    entity_id: String!
    bank_account_id: String!
    statement_date: String!
    opening_balance: Float!
    closing_balance: Float!
    currency: String!
    line_count: Int!
    matched_count: Int!
    is_reconciled: Boolean!
    created_at: DateTime
    updated_at: DateTime
  }

  type BankStatementLine {
    id: ID!
    entity_id: String!
    statement_id: String!
    bank_account_id: String!
    transaction_date: String!
    amount: Float!
    description: String!
    reference: String
    status: BankStatementLineStatus!
    matched_cfe_id: String
    created_at: DateTime
    updated_at: DateTime
  }

  type ReconciliationReport {
    bankAccountId: String!
    statementBalance: Float!
    ledgerBalance: Float!
    adjustedBankBalance: Float!
    adjustedLedgerBalance: Float!
    difference: Float!
    unmatchedBankLines: [BankStatementLine!]!
    unreconciledLedgerEntries: [JSON!]!
    outstandingDeposits: Float!
    outstandingChecks: Float!
  }

  type ImportStatementLinesResult {
    imported: Int!
    lineIds: [String!]!
  }

  type AutoMatchResult {
    matched: Int!
    matches: [AutoMatchEntry!]!
  }

  type AutoMatchEntry {
    lineId: String!
    cfeId: String!
    amount: Float!
  }

  type FinalizeReconciliationResult {
    isReconciled: Boolean!
    totalLines: Int!
    matchedLines: Int!
    unmatchedLines: Int!
  }

  input CreateBankStatementInput {
    entityId: String!
    bankAccountId: String!
    statementDate: String!
    openingBalance: Float!
    closingBalance: Float!
    currency: String!
  }

  input AddStatementLineInput {
    entityId: String!
    statementId: String!
    bankAccountId: String!
    transactionDate: String!
    amount: Float!
    description: String!
    reference: String
  }

  input BulkLineInput {
    transactionDate: String!
    amount: Float!
    description: String!
    reference: String
  }

  extend type Query {
    bankStatement(id: ID!): BankStatement
    bankStatements(entityId: String!, bankAccountId: String): [BankStatement!]!
    bankStatementLine(id: ID!): BankStatementLine
    bankStatementLines(statementId: String!, status: BankStatementLineStatus): [BankStatementLine!]!
    reconciliationReport(statementId: String!): ReconciliationReport!
  }

  extend type Mutation {
    createBankStatement(input: CreateBankStatementInput!): ID!
    addStatementLine(input: AddStatementLineInput!): ID!
    importStatementLines(entityId: String!, statementId: String!, bankAccountId: String!, lines: [BulkLineInput!]!): ImportStatementLinesResult!
    matchLineToEvent(lineId: ID!, cashFlowEventId: String!): Boolean!
    clearLine(lineId: ID!): Boolean!
    autoMatch(statementId: String!, dateTolerance: Int): AutoMatchResult!
    finalizeReconciliation(statementId: String!): FinalizeReconciliationResult!
  }
`;
