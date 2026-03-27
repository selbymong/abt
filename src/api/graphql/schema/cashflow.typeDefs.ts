// GraphQL type definitions for Cashflow domain
// CashFlowEvent, CreditFacility, FloatWindow, and DiscountAnalysis

export const cashflowTypeDefs = `
  type CashFlowEvent {
    id: ID!
    entity_id: String!
    label: String!
    direction: CashFlowDirection!
    amount: Float!
    currency: String!
    scheduled_date: String!
    earliest_date: String
    latest_date: String
    discount_offered_pct: Float
    penalty_rate_daily: Float
    counterparty_id: String
    relationship_sensitivity: Float
    status: CashFlowStatus!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type CreditFacility {
    id: ID!
    entity_id: String!
    label: String!
    facility_type: String!
    facility_limit: Float!
    drawn: Float!
    available: Float!
    interest_rate: Float!
    rate_type: String!
    maturity_date: String!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type FloatWindow {
    id: ID!
    opportunityType: String!
    cashFlowEventId: String!
    windowDays: Int!
    floatAmount: Float!
    opportunityValue: Float!
    discountCost: Float!
    netValue: Float!
    annualizedDiscountRate: Float
    facilityRate: Float
    useDiscountOverFacility: Boolean
    recommendation: String!
  }

  type DiscountAnalysis {
    cashFlowEventId: String!
    amount: Float!
    discountPct: Float!
    discountAmount: Float!
    annualizedRate: Float!
    windowDays: Int!
    bestFacilityRate: Float
    facilityCheaper: Boolean!
    recommendation: String!
    savings: Float!
  }

  input CreateCashFlowEventInput {
    entityId: String!
    label: String!
    direction: CashFlowDirection!
    amount: Float!
    currency: String!
    scheduledDate: String!
    earliestDate: String
    latestDate: String
    discountOfferedPct: Float
    penaltyRateDaily: Float
    counterpartyId: String
    relationshipSensitivity: Float
    status: CashFlowStatus
  }

  input CreateCreditFacilityInput {
    entityId: String!
    label: String!
    facilityType: String!
    limit: Float!
    drawn: Float
    interestRate: Float!
    rateType: String!
    maturityDate: String!
  }

  extend type Query {
    cashFlowEvent(id: ID!): CashFlowEvent
    cashFlowEvents(entityId: String!, status: CashFlowStatus): [CashFlowEvent!]!
    creditFacility(id: ID!): CreditFacility
    creditFacilities(entityId: String!): [CreditFacility!]!
    floatWindows(entityId: String!): [FloatWindow!]!
    discountAnalysis(cfeId: ID!): DiscountAnalysis
  }

  extend type Mutation {
    createCashFlowEvent(input: CreateCashFlowEventInput!): ID!
    settleCashFlowEvent(id: ID!): Boolean!
    createCreditFacility(input: CreateCreditFacilityInput!): ID!
    scoreFloatWindow(cfeId: ID!): FloatWindow
    scoreEntityFloatWindows(entityId: String!): [FloatWindow!]!
  }
`;
