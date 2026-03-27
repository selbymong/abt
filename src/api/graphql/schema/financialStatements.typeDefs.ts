export const financialStatementsTypeDefs = `
  type StatementLineItem {
    label: String!
    category: String!
    currentPeriod: Float!
    priorPeriod: Float!
    variance: Float!
    variancePercent: Float!
  }

  type StatementSection {
    title: String!
    items: [StatementLineItem!]!
    subtotal: Float!
    priorSubtotal: Float!
  }

  type StatementNote {
    number: Int!
    title: String!
    content: String!
  }

  type FinancialStatement {
    type: String!
    entityId: String!
    entityName: String!
    periodId: String!
    periodLabel: String!
    priorPeriodId: String
    priorPeriodLabel: String
    currency: String!
    generatedAt: String!
    sections: [StatementSection!]!
    totals: JSON!
    notes: [StatementNote!]!
  }

  type FullFinancialStatements {
    incomeStatement: FinancialStatement!
    balanceSheet: FinancialStatement!
    cashFlow: FinancialStatement!
    equityChanges: FinancialStatement!
  }

  extend type Query {
    financialStatement(
      type: String!
      entityId: String!
      periodId: String!
      priorPeriodId: String
      currency: String
    ): FinancialStatement!

    fullFinancialStatements(
      entityId: String!
      periodId: String!
      priorPeriodId: String
      currency: String
    ): FullFinancialStatements!
  }
`;
