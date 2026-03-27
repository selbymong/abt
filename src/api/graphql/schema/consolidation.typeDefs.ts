// GraphQL type definitions for the Consolidation domain
// Covers: ConsolidationGroup, OwnershipInterest, Goodwill, CurrencyTranslation, consolidated reporting

export const consolidationTypeDefs = `
  # --- Consolidation Types ---

  type ConsolidationGroup {
    id: ID!
    label: String!
    parent_entity_id: String!
    functional_currency: String!
    entity_ids: [String!]!
    minority_interest_method: MinorityInterestMethod!
    intercompany_threshold: Float!
    created_at: DateTime
    updated_at: DateTime
  }

  type OwnershipInterest {
    id: ID!
    investor_entity_id: String!
    investee_entity_id: String!
    ownership_pct: Float!
    acquisition_cost: Float!
    net_assets_at_acquisition: Float!
    goodwill: Float!
    carrying_value: Float!
    acquisition_date: String!
    disposal_date: String
    created_at: DateTime
    updated_at: DateTime
  }

  type Goodwill {
    id: ID!
    business_combination_id: String
    acquiree_entity_id: String!
    cgu_id: String
    gross_amount: Float!
    accumulated_impairment: Float!
    carrying_amount: Float!
    currency: String!
    is_full_goodwill: Boolean!
    nci_goodwill_pct: Float
    last_test_date: String
    last_test_result: ImpairmentTestResult
    tax_deductible: Boolean!
    tax_base: Float!
    disposal_date: String
    created_at: DateTime
    updated_at: DateTime
  }

  type CurrencyTranslation {
    id: ID!
    entity_id: String!
    period_id: String!
    functional_currency: String!
    presentation_currency: String!
    average_rate: Float!
    closing_rate: Float!
    revenue_translated: Float!
    expense_translated: Float!
    asset_translated: Float!
    liability_translated: Float!
    cta_current_period: Float!
    cumulative_cta: Float!
    created_at: DateTime
    updated_at: DateTime
  }

  type EntityPnLBreakdown {
    entityId: String!
    revenue: Float!
    expenses: Float!
  }

  type ConsolidatedPnL {
    revenue: Float!
    expenses: Float!
    netIncome: Float!
    entityBreakdown: [EntityPnLBreakdown!]!
  }

  type ConsolidatedBalanceSheet {
    assets: Float!
    liabilities: Float!
    equity: Float!
    goodwill: Float!
  }

  type CurrencyTranslationResult {
    translationId: String!
    revenueTranslated: Float!
    expenseTranslated: Float!
    assetTranslated: Float!
    liabilityTranslated: Float!
    ctaCurrentPeriod: Float!
  }

  # --- Consolidation Inputs ---

  input CreateConsolidationGroupInput {
    label: String!
    parentEntityId: String!
    functionalCurrency: String!
    entityIds: [String!]!
    minorityInterestMethod: MinorityInterestMethod!
    intercompanyThreshold: Float
  }

  input CreateOwnershipInterestInput {
    investorEntityId: String!
    investeeEntityId: String!
    ownershipPct: Float!
    acquisitionCost: Float!
    netAssetsAtAcquisition: Float!
    acquisitionDate: String!
  }

  input CreateIntercompanyMatchInput {
    sourceLedgerLineId: String!
    targetLedgerLineId: String!
    sourceEntityId: String!
    targetEntityId: String!
    eliminationAmount: Float!
    transactionType: IntercompanyTransactionType!
    amountSellerCurrency: Float!
    amountBuyerCurrency: Float!
    unrealizedProfitPct: Float
  }

  input CreateGoodwillInput {
    acquireeEntityId: String!
    grossAmount: Float!
    currency: String!
    isFullGoodwill: Boolean!
    nciGoodwillPct: Float
    taxDeductible: Boolean
  }

  input ImpairGoodwillInput {
    goodwillId: String!
    impairmentLoss: Float!
    testDate: String!
  }

  input TranslateCurrencyInput {
    entityId: String!
    periodId: String!
    functionalCurrency: String!
    presentationCurrency: String!
    averageRate: Float!
    closingRate: Float!
  }

  # --- Consolidation Queries ---

  extend type Query {
    consolidationGroup(id: String!): ConsolidationGroup
    consolidationGroupForEntity(entityId: String!): ConsolidationGroup
    ownershipInterest(id: String!): OwnershipInterest
    ownershipInterests(entityId: String!): [OwnershipInterest!]!
    goodwill(id: String!): Goodwill
    currencyTranslation(entityId: String!, periodId: String!): CurrencyTranslation
    consolidatedPnL(groupId: String!, periodId: String!): ConsolidatedPnL!
    consolidatedBalanceSheet(groupId: String!, periodId: String!): ConsolidatedBalanceSheet!
  }

  # --- Consolidation Mutations ---

  extend type Mutation {
    createConsolidationGroup(input: CreateConsolidationGroupInput!): ConsolidationGroup!
    createOwnershipInterest(input: CreateOwnershipInterestInput!): OwnershipInterest!
    createIntercompanyMatch(input: CreateIntercompanyMatchInput!): Boolean!
    createGoodwill(input: CreateGoodwillInput!): Goodwill!
    impairGoodwill(input: ImpairGoodwillInput!): Boolean!
    translateCurrency(input: TranslateCurrencyInput!): CurrencyTranslationResult!
  }
`;
