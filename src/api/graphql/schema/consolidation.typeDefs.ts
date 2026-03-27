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

  # --- Business Combination Types ---

  type BusinessCombination {
    id: ID!
    label: String!
    acquirer_entity_id: String!
    acquiree_entity_id: String!
    acquisition_date: String!
    total_consideration: Float!
    consideration_cash: Float!
    consideration_shares: Float!
    consideration_contingent: Float!
    fair_value_net_assets: Float!
    ownership_pct_acquired: Float!
    goodwill_arising: Float!
    nci_fair_value: Float
    full_goodwill: Float
    ppa_complete: Boolean!
    functional_currency: String!
    created_at: DateTime
    updated_at: DateTime
  }

  type PurchasePriceAdjustment {
    id: ID!
    business_combination_id: String!
    target_node_id: String!
    target_node_type: String!
    book_value_at_acquisition: Float!
    fair_value_at_acquisition: Float!
    adjustment_amount: Float!
    intangible_category: String!
    useful_life_years: Float
    amortization_method: String
    amortized_to_date: Float!
    remaining_book_value: Float!
    tax_basis_adjustment: Float
    provisional: Boolean!
    created_at: DateTime
    updated_at: DateTime
  }

  type CashGeneratingUnit {
    id: ID!
    label: String!
    entity_ids: [String!]!
    goodwill_ids: [String!]!
    allocated_goodwill_carrying: Float!
    last_impairment_test_date: String
    last_recoverable_amount: Float
    viu_discount_rate: Float!
    viu_horizon_years: Int!
    viu_terminal_growth_rate: Float!
    created_at: DateTime
    updated_at: DateTime
  }

  type ImpairmentTest {
    id: ID!
    goodwill_id: String!
    cgu_id: String!
    period_id: String!
    test_date: String!
    carrying_amount_tested: Float!
    viu_computed: Float!
    viu_discount_rate: Float!
    viu_horizon_years: Int!
    fvlcod: Float
    recoverable_amount: Float!
    impairment_loss: Float!
    result: ImpairmentTestResult!
    headroom: Float!
    approved_by: String
    created_at: DateTime
    updated_at: DateTime
  }

  type ImpairmentTestResult_Output {
    impairmentTestId: String!
    result: ImpairmentTestResult!
    impairmentLoss: Float!
    headroom: Float!
    viuComputed: Float!
    recoverableAmount: Float!
    carryingAmountTested: Float!
  }

  type BusinessCombinationCreateResult {
    id: String!
    goodwillId: String!
  }

  # --- Business Combination Inputs ---

  input CreateBusinessCombinationInput {
    label: String!
    acquirerEntityId: String!
    acquireeEntityId: String!
    acquisitionDate: String!
    totalConsideration: Float!
    considerationCash: Float!
    considerationShares: Float!
    considerationContingent: Float!
    fairValueNetAssets: Float!
    ownershipPctAcquired: Float!
    nciFairValue: Float
    functionalCurrency: String!
    minorityInterestMethod: MinorityInterestMethod
  }

  input CreatePPAInput {
    businessCombinationId: String!
    targetNodeId: String!
    targetNodeType: String!
    bookValueAtAcquisition: Float!
    fairValueAtAcquisition: Float!
    intangibleCategory: String!
    usefulLifeYears: Float
    amortizationMethod: String
    taxBasisAdjustment: Float
    provisional: Boolean
  }

  input AmortizePPAInput {
    ppaId: String!
    periodCharge: Float!
  }

  input CreateCGUInput {
    label: String!
    entityIds: [String!]!
    goodwillIds: [String!]
    viuDiscountRate: Float!
    viuHorizonYears: Int!
    viuTerminalGrowthRate: Float!
  }

  input RunImpairmentTestInput {
    goodwillId: String!
    cguId: String!
    periodId: String!
    testDate: String!
    fvlcod: Float
    approvedBy: String
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
    businessCombination(id: String!): BusinessCombination
    businessCombinations(acquirerEntityId: String!): [BusinessCombination!]!
    purchasePriceAdjustment(id: String!): PurchasePriceAdjustment
    purchasePriceAdjustments(businessCombinationId: String!): [PurchasePriceAdjustment!]!
    cashGeneratingUnit(id: String!): CashGeneratingUnit
    cashGeneratingUnits(entityId: String!): [CashGeneratingUnit!]!
    impairmentTest(id: String!): ImpairmentTest
    impairmentTests(cguId: String!): [ImpairmentTest!]!
  }

  # --- Consolidation Mutations ---

  extend type Mutation {
    createConsolidationGroup(input: CreateConsolidationGroupInput!): ConsolidationGroup!
    createOwnershipInterest(input: CreateOwnershipInterestInput!): OwnershipInterest!
    createIntercompanyMatch(input: CreateIntercompanyMatchInput!): Boolean!
    createGoodwill(input: CreateGoodwillInput!): Goodwill!
    impairGoodwill(input: ImpairGoodwillInput!): Boolean!
    translateCurrency(input: TranslateCurrencyInput!): CurrencyTranslationResult!
    createBusinessCombination(input: CreateBusinessCombinationInput!): BusinessCombinationCreateResult!
    completePPA(businessCombinationId: String!): Boolean!
    createPurchasePriceAdjustment(input: CreatePPAInput!): PurchasePriceAdjustment!
    amortizePPA(input: AmortizePPAInput!): Boolean!
    createCashGeneratingUnit(input: CreateCGUInput!): CashGeneratingUnit!
    runImpairmentTest(input: RunImpairmentTestInput!): ImpairmentTestResult_Output!
  }
`;
