export const borrowingCostsTypeDefs = `
  type QualifyingAssetSummary {
    id: ID!
    label: String!
    entity_id: String!
    qualifying_asset: Boolean!
    capitalization_status: String!
    capitalization_start_date: String
    capitalization_end_date: String
    borrowing_costs_capitalized: Float!
    weighted_average_rate: Float!
    cost_at_acquisition: Float!
    carrying_amount: Float!
  }

  type CapitalizationResult {
    assetId: String!
    periodId: String!
    generalBorrowingCost: Float!
    specificBorrowingCost: Float!
    investmentIncomeDeduction: Float!
    netCapitalizedAmount: Float!
    journalEntryId: String!
    cumulativeCapitalized: Float!
  }

  input DesignateQualifyingAssetInput {
    assetId: String!
    entityId: String!
    weightedAverageRate: Float!
    capitalizationStartDate: String!
  }

  input CapitalizeBorrowingCostsInput {
    assetId: String!
    entityId: String!
    periodId: String!
    expenditureAmount: Float!
    daysInPeriod: Int!
    specificBorrowingRate: Float
    specificBorrowingAmount: Float
    investmentIncome: Float
    currency: String!
    fundId: String
  }

  extend type Query {
    qualifyingAssets(entityId: String!, status: String): [QualifyingAssetSummary!]!
    qualifyingAsset(assetId: String!): QualifyingAssetSummary
  }

  extend type Mutation {
    designateQualifyingAsset(input: DesignateQualifyingAssetInput!): Boolean!
    capitalizeBorrowingCosts(input: CapitalizeBorrowingCostsInput!): CapitalizationResult!
    suspendCapitalization(assetId: String!, entityId: String!): Boolean!
    resumeCapitalization(assetId: String!, entityId: String!): Boolean!
    ceaseCapitalization(assetId: String!, entityId: String!, cessationDate: String!): Boolean!
  }
`;
