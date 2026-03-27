// GraphQL type definitions for Hedge Accounting domain (IFRS 9)
// FinancialInstrument, HedgeRelationship, effectiveness testing, and hedge processing

export const hedgeTypeDefs = `
  type FinancialInstrument {
    id: ID!
    entity_id: String!
    instrument_type: InstrumentType!
    ifrs9_classification: IFRS9Classification!
    label: String!
    host_node_id: String
    fair_value: Float
    fair_value_hierarchy: FairValueHierarchy
    amortised_cost: Float
    effective_interest_rate: Float
    ecl_stage: ECLStage!
    ecl_allowance: Float!
    gross_carrying_amount: Float!
    net_carrying_amount: Float!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type HedgeRelationship {
    id: ID!
    entity_id: String!
    hedge_type: HedgeType!
    hedging_instrument_id: String!
    hedged_item_id: String!
    designation_date: String!
    hedge_ratio: Float!
    effectiveness_method: String!
    prospective_test: EffectivenessResult!
    retrospective_eff: Float!
    oci_balance: Float!
    ineffectiveness_to_pnl: Float!
    is_active: Boolean!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type EffectivenessTestResult {
    result: EffectivenessResult!
    hedgeRatio: Float
    effectivenessRatio: Float
    ineffectiveness: Float
    reason: String!
  }

  type FairValueUpdateResult {
    oldFairValue: Float!
    newFairValue: Float!
    change: Float!
  }

  type FairValueHedgeResult {
    instrumentPnL: Float!
    hedgedItemPnL: Float!
    netPnL: Float!
  }

  type CashFlowHedgeResult {
    effectivePortion: Float!
    ineffectivePortion: Float!
    ociBalance: Float!
  }

  type NetInvestmentHedgeResult {
    effectivePortion: Float!
    ineffectivePortion: Float!
    ociBalance: Float!
  }

  type DedesignationResult {
    hedgeType: HedgeType!
    ociBalance: Float!
  }

  type HedgeSummary {
    totalHedges: Int!
    activeHedges: Int!
    byType: JSON!
    totalOciBalance: Float!
    totalIneffectiveness: Float!
  }

  input CreateFinancialInstrumentInput {
    entityId: String!
    instrumentType: InstrumentType!
    ifrs9Classification: IFRS9Classification!
    label: String!
    hostNodeId: String
    fairValue: Float
    fairValueHierarchy: FairValueHierarchy
    amortisedCost: Float
    effectiveInterestRate: Float
    eclStage: ECLStage
    grossCarryingAmount: Float!
  }

  input CreateHedgeRelationshipInput {
    entityId: String!
    hedgeType: HedgeType!
    hedgingInstrumentId: String!
    hedgedItemId: String!
    designationDate: String!
    hedgeRatio: Float!
    effectivenessMethod: String!
  }

  extend type Query {
    financialInstrument(id: ID!): FinancialInstrument
    financialInstruments(entityId: String!): [FinancialInstrument!]!
    hedgeRelationship(id: ID!): HedgeRelationship
    hedgeRelationships(entityId: String!): [HedgeRelationship!]!
    hedgeSummary(entityId: String!): HedgeSummary!
  }

  extend type Mutation {
    createFinancialInstrument(input: CreateFinancialInstrumentInput!): ID!
    updateFairValue(instrumentId: ID!, newFairValue: Float!): FairValueUpdateResult!
    createHedgeRelationship(input: CreateHedgeRelationshipInput!): ID!
    prospectiveTest(hedgeId: ID!): EffectivenessTestResult!
    retrospectiveTest(hedgeId: ID!, hedgingInstrumentChange: Float!, hedgedItemChange: Float!): EffectivenessTestResult!
    processFairValueHedge(hedgeId: ID!, instrumentFVChange: Float!, hedgedItemFVChange: Float!): FairValueHedgeResult!
    processCashFlowHedge(hedgeId: ID!, instrumentFVChange: Float!, hedgedItemFVChange: Float!): CashFlowHedgeResult!
    processNetInvestmentHedge(hedgeId: ID!, instrumentFVChange: Float!, netInvestmentChange: Float!): NetInvestmentHedgeResult!
    dedesignateHedge(hedgeId: ID!): DedesignationResult!
  }
`;
