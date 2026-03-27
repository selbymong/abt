export const pensionTypeDefs = `
  type PensionPlan {
    id: String!
    entity_id: String!
    label: String!
    currency: String!
    discount_rate: Float!
    salary_growth_rate: Float!
    expected_return_on_assets: Float!
    dbo_opening: Float!
    dbo_closing: Float!
    plan_assets_opening: Float!
    plan_assets_closing: Float!
    net_liability: Float!
    mortality_table: String
    valuation_date: String!
    created_at: String
    updated_at: String
  }

  type PensionPeriodResult {
    currentServiceCost: Float!
    netInterestCost: Float!
    remeasurementOCI: Float!
    employerContributions: Float!
    benefitsPaid: Float!
    dboClosing: Float!
    planAssetsClosing: Float!
    netLiability: Float!
    journalEntryIds: [String!]!
    ociId: String!
  }

  type PensionSummary {
    entityId: String!
    plans: [PensionPlan!]!
    totalDBO: Float!
    totalPlanAssets: Float!
    totalNetLiability: Float!
  }

  input CreatePensionPlanInput {
    entityId: String!
    label: String!
    currency: String!
    discountRate: Float!
    salaryGrowthRate: Float!
    expectedReturnOnAssets: Float!
    dboOpening: Float!
    planAssetsOpening: Float!
    mortalityTable: String
    valuationDate: String!
  }

  input ProcessPensionPeriodInput {
    pensionPlanId: String!
    entityId: String!
    periodId: String!
    currency: String!
    currentServiceCost: Float!
    employerContributions: Float!
    benefitsPaid: Float!
    actuarialGainLossOnDBO: Float!
    actualReturnOnAssets: Float!
    periodStartDate: String!
    periodEndDate: String!
    fundId: String
  }

  input UpdateActuarialAssumptionsInput {
    discountRate: Float
    salaryGrowthRate: Float
    expectedReturnOnAssets: Float
    mortalityTable: String
  }

  extend type Query {
    pensionPlan(id: ID!): PensionPlan
    pensionPlans(entityId: String!): [PensionPlan!]!
    pensionSummary(entityId: String!): PensionSummary!
  }

  extend type Mutation {
    createPensionPlan(input: CreatePensionPlanInput!): PensionPlan!
    processPensionPeriod(input: ProcessPensionPeriodInput!): PensionPeriodResult!
    updateActuarialAssumptions(pensionPlanId: String!, input: UpdateActuarialAssumptionsInput!): PensionPlan!
  }
`;
