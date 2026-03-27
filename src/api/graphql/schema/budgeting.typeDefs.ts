export const budgetingTypeDefs = `
  type Budget {
    id: String!
    entity_id: String!
    name: String!
    fiscal_year: Int!
    currency: String!
    status: String!
    created_by: String!
    approved_by: String
    description: String
    total_amount: Float!
    created_at: String
    updated_at: String
  }

  type BudgetLine {
    id: String!
    budget_id: String!
    period_id: String!
    node_ref_id: String!
    node_ref_type: String!
    economic_category: String!
    amount: Float!
    notes: String
    created_at: String
  }

  type VarianceItem {
    periodId: String!
    nodeRefId: String!
    nodeRefType: String!
    economicCategory: String!
    budgetAmount: Float!
    actualAmount: Float!
    varianceAmount: Float!
    variancePercent: Float!
    varianceType: String!
  }

  type VarianceReport {
    budgetId: String!
    budgetName: String!
    entityId: String!
    fiscalYear: Int!
    currency: String!
    items: [VarianceItem!]!
    totalBudget: Float!
    totalActual: Float!
    totalVariance: Float!
  }

  type ForecastItem {
    periodId: String!
    nodeRefId: String!
    economicCategory: String!
    budgetAmount: Float!
    actualAmount: Float!
    forecastAmount: Float!
    adjustmentReason: String!
  }

  input CreateBudgetInput {
    entityId: String!
    name: String!
    fiscalYear: Int!
    currency: String!
    createdBy: String!
    description: String
  }

  input AddBudgetLineInput {
    budgetId: String!
    periodId: String!
    nodeRefId: String!
    nodeRefType: String!
    economicCategory: String!
    amount: Float!
    notes: String
  }

  extend type Query {
    budget(id: ID!): Budget
    budgets(entityId: String!, fiscalYear: Int, status: String): [Budget!]!
    budgetLines(budgetId: String!, periodId: String): [BudgetLine!]!
    varianceReport(budgetId: String!, periodIds: [String!]): VarianceReport!
  }

  extend type Mutation {
    createBudget(input: CreateBudgetInput!): Budget!
    approveBudget(budgetId: String!, approvedBy: String!): Budget!
    lockBudget(budgetId: String!): Budget!
    addBudgetLine(input: AddBudgetLineInput!): String!
    updateBudgetLine(lineId: String!, amount: Float!, notes: String): String!
    deleteBudgetLine(lineId: String!): String!
    generateRollingForecast(budgetId: String!, completedPeriodIds: [String!]!, remainingPeriodIds: [String!]!): [ForecastItem!]!
  }
`;
