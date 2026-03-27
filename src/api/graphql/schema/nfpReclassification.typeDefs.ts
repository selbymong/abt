export const nfpReclassificationTypeDefs = `
  type ExpiredRestriction {
    fundId: String!
    fundLabel: String!
    entityId: String!
    fundType: String!
    restrictionExpiry: String!
    restrictionPurpose: String
    netBalance: Float!
  }

  type ReclassificationResult {
    reclassificationId: String!
    fundId: String!
    fromClass: String!
    toClass: String!
    amount: Float!
    journalEntryId: String!
    reclassificationDate: String!
  }

  type ReclassificationHistoryEntry {
    id: String!
    fund_id: String!
    entity_id: String!
    from_class: String!
    to_class: String!
    amount: Float!
    reason: String!
    reclassification_date: String!
    journal_entry_id: String!
    approved_by: String
    created_at: String!
  }

  type FundRestrictionInfo {
    fundId: String!
    label: String!
    fundType: String!
    restrictionExpiry: String
    restrictionPurpose: String
    netBalance: Float!
    isExpired: Boolean!
  }

  type FundRestrictionSummary {
    entityId: String!
    funds: [FundRestrictionInfo!]!
    totalUnrestricted: Float!
    totalTemporarilyRestricted: Float!
    totalPermanentlyRestricted: Float!
    totalEndowment: Float!
  }

  input ReclassifyFundInput {
    fundId: String!
    entityId: String!
    periodId: String!
    currency: String!
    amount: Float!
    fromClass: String!
    toClass: String!
    reason: String!
    reclassificationDate: String!
    approvedBy: String
  }

  input AutoReclassifyInput {
    entityId: String!
    periodId: String!
    currency: String!
    asOfDate: String!
    approvedBy: String
  }

  input FulfillPurposeInput {
    fundId: String!
    entityId: String!
    periodId: String!
    currency: String!
    amount: Float!
    fulfillmentDate: String!
    fulfillmentDescription: String!
    approvedBy: String
  }

  extend type Query {
    expiredRestrictions(entityId: String!, asOfDate: String): [ExpiredRestriction!]!
    reclassificationHistory(entityId: String!, fundId: String): [ReclassificationHistoryEntry!]!
    fundRestrictionSummary(entityId: String!, periodId: String): FundRestrictionSummary!
  }

  extend type Mutation {
    reclassifyFund(input: ReclassifyFundInput!): ReclassificationResult!
    autoReclassifyExpired(input: AutoReclassifyInput!): [ReclassificationResult!]!
    fulfillPurposeRestriction(input: FulfillPurposeInput!): ReclassificationResult!
  }
`;
