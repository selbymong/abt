export const forecastSnapshotTypeDefs = `
  type ForecastSnapshot {
    id: String!
    budget_id: String!
    entity_id: String!
    name: String!
    fiscal_year: Int!
    currency: String!
    snapshot_type: String!
    created_by: String!
    created_at: String!
    notes: String
    line_count: Int
  }

  type ForecastSnapshotLine {
    id: String!
    snapshot_id: String!
    period_id: String!
    node_ref_id: String!
    node_ref_type: String!
    economic_category: String!
    forecast_amount: Float!
    budget_amount: Float!
    adjustment_reason: String
  }

  type ForecastSnapshotDetail {
    snapshot: ForecastSnapshot!
    lines: [ForecastSnapshotLine!]!
  }

  type ForecastVsActualItem {
    periodId: String!
    nodeRefId: String!
    nodeRefType: String!
    economicCategory: String!
    budgetAmount: Float!
    forecastAmount: Float!
    actualAmount: Float!
    forecastVariance: Float!
    forecastVariancePercent: Float!
    varianceType: String!
  }

  type ForecastVsActualReport {
    snapshotId: String!
    snapshotName: String!
    entityId: String!
    fiscalYear: Int!
    currency: String!
    snapshotDate: String!
    items: [ForecastVsActualItem!]!
    totalBudget: Float!
    totalForecast: Float!
    totalActual: Float!
    totalForecastVariance: Float!
  }

  input CreateForecastSnapshotInput {
    budgetId: String!
    name: String!
    createdBy: String!
    completedPeriodIds: [String!]!
    remainingPeriodIds: [String!]!
    snapshotType: String
    notes: String
  }

  extend type Query {
    forecastSnapshots(entityId: String!, budgetId: String, fiscalYear: Int): [ForecastSnapshot!]!
    forecastSnapshot(id: String!): ForecastSnapshotDetail
    forecastVsActualReport(snapshotId: String!, periodIds: [String!]): ForecastVsActualReport!
  }

  extend type Mutation {
    createForecastSnapshot(input: CreateForecastSnapshotInput!): ForecastSnapshotDetail!
    deleteForecastSnapshot(id: String!): String!
  }
`;
