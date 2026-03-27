export const discontinuedOpsTypeDefs = `
  type ClassificationResult {
    initiativeId: String!
    previousStatus: String!
    newStatus: String!
    carryingAmount: Float!
    fairValueLessCostsToSell: Float!
    impairmentLoss: Float!
    journalEntryId: String
  }

  type ContinuingPnL {
    revenue: Float!
    expenses: Float!
    profit: Float!
  }

  type DiscontinuedPnL {
    revenue: Float!
    expenses: Float!
    operating_profit: Float!
    impairment_loss: Float!
    gain_loss_on_disposal: Float!
    profit: Float!
  }

  type DiscontinuedOpsPnLResult {
    entity_id: String!
    period_id: String!
    continuing: ContinuingPnL!
    discontinued: DiscontinuedPnL!
    total_profit: Float!
  }

  type HeldForSaleInitiative {
    id: ID!
    label: String!
    entity_id: String!
    status: String!
    held_for_sale_status: String!
    classification_date: String
    expected_disposal_date: String
    disposal_date: String
    fair_value_less_costs_to_sell: Float
    impairment_on_classification: Float
    gain_loss_on_disposal: Float
    buyer: String
  }

  type DisposalResult {
    gainLoss: Float!
    journalEntryId: String!
  }

  input ClassifyHeldForSaleInput {
    initiativeId: String!
    entityId: String!
    classificationDate: String!
    fairValueLessCostsToSell: Float!
    expectedDisposalDate: String
    buyer: String
    periodId: String!
    currency: String!
    fundId: String
  }

  extend type Query {
    discontinuedOpsPnL(entityId: String!, periodId: String!, fundId: String): DiscontinuedOpsPnLResult!
    heldForSaleInitiatives(entityId: String!): [HeldForSaleInitiative!]!
  }

  extend type Mutation {
    classifyAsHeldForSale(input: ClassifyHeldForSaleInput!): ClassificationResult!
    declassifyHeldForSale(initiativeId: String!, entityId: String!): Boolean!
    recordDisposal(initiativeId: String!, entityId: String!, disposalDate: String!, proceedsAmount: Float!, periodId: String!, currency: String!, fundId: String): DisposalResult!
  }
`;
