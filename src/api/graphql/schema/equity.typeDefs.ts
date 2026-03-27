export const equityTypeDefs = `
  type ShareClass {
    id: ID!
    entity_id: String!
    label: String!
    share_class_type: ShareClassType!
    par_value: Float!
    authorized_shares: Int!
    issued_shares: Int!
    outstanding_shares: Int!
    treasury_shares: Int!
    share_capital_amount: Float!
    currency: String!
    is_voting: Boolean!
    dividend_rate: Float
    is_cumulative_dividend: Boolean!
    liquidation_preference: Float
    conversion_ratio: Float
    is_participating: Boolean!
    created_at: DateTime
    updated_at: DateTime
  }

  type EquityAward {
    id: ID!
    entity_id: String!
    share_class_id: String!
    label: String!
    award_type: AwardType!
    award_status: AwardStatus!
    grant_date: String!
    vesting_type: VestingType!
    vesting_period_months: Int!
    cliff_months: Int
    shares_granted: Int!
    shares_vested: Int!
    shares_forfeited: Int!
    exercise_price: Float
    fair_value_at_grant: Float!
    total_compensation_cost: Float!
    recognized_compensation: Float!
    remaining_compensation: Float!
    expiry_date: String
    created_at: DateTime
    updated_at: DateTime
  }

  type EPSResult {
    entityId: String!
    periodId: String!
    netIncome: Float!
    preferredDividends: Float!
    incomeAvailableToCommon: Float!
    weightedAvgSharesBasic: Int!
    basicEPS: Float!
    dilutiveShares: Int!
    weightedAvgSharesDiluted: Int!
    dilutedEPS: Float!
    isAntidilutive: Boolean!
  }

  type IssueSharesResult {
    newIssued: Int!
    newShareCapital: Float!
  }

  type VestingResult {
    compensationExpense: Float!
    journalEntryId: String
    sharesVested: Int!
  }

  input CreateShareClassInput {
    entityId: String!
    label: String!
    shareClassType: ShareClassType!
    parValue: Float!
    authorizedShares: Int!
    issuedShares: Int
    currency: String!
    isVoting: Boolean
    dividendRate: Float
    isCumulativeDividend: Boolean
    liquidationPreference: Float
    conversionRatio: Float
    isParticipating: Boolean
  }

  input CreateEquityAwardInput {
    entityId: String!
    shareClassId: String!
    label: String!
    awardType: AwardType!
    grantDate: String!
    vestingType: VestingType!
    vestingPeriodMonths: Int!
    cliffMonths: Int
    sharesGranted: Int!
    exercisePrice: Float
    fairValueAtGrant: Float!
    expiryDate: String
  }

  extend type Query {
    shareClass(id: ID!): ShareClass
    shareClasses(entityId: String!): [ShareClass!]!
    equityAward(id: ID!): EquityAward
    equityAwards(entityId: String!): [EquityAward!]!
    eps(entityId: String!, periodId: String!, netIncome: Float!): EPSResult!
    totalShareCapital(entityId: String!): Float!
  }

  extend type Mutation {
    createShareClass(input: CreateShareClassInput!): ID!
    issueShares(shareClassId: ID!, additionalShares: Int!, pricePerShare: Float!): IssueSharesResult!
    createEquityAward(input: CreateEquityAwardInput!): ID!
    recognizeVesting(awardId: ID!, periodId: String!, monthsElapsed: Int!, validDate: String!, currency: String!): VestingResult!
    forfeitAward(awardId: ID!): Boolean!
    computeEPS(entityId: String!, periodId: String!, netIncome: Float!): EPSResult!
  }
`;
