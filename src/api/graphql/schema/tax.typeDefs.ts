// GraphQL type definitions for the Tax domain
// Covers: DeferredTax, TaxProvision, TaxCredits, TaxModules, AI feedback loop

export const taxTypeDefs = `
  # --- Tax Types ---

  type DeferredTaxPosition {
    id: ID!
    entity_id: String!
    period_id: String!
    source_node_id: String!
    source_node_type: String!
    accounting_carrying_amt: Float!
    tax_base: Float!
    temporary_difference: Float!
    direction: TempDiffDirection!
    tax_rate_applicable: Float!
    deferred_tax_amount: Float!
    recognition_criteria_met: Boolean!
    created_at: DateTime
    updated_at: DateTime
  }

  type TaxProvision {
    id: ID!
    entity_id: String!
    period_id: String!
    current_tax_expense: Float!
    deferred_tax_movement: Float!
    total_tax_expense: Float!
    credit_amount: Float!
    effective_tax_rate: Float!
    status: TaxProvisionStatus!
    journal_entry_id: String
    created_at: DateTime
    updated_at: DateTime
  }

  type TaxCreditProgram {
    id: ID!
    program_code: String!
    label: String!
    jurisdiction: String!
    authority: TaxAuthority!
    credit_type: CreditType!
    credit_rate: Float!
    credit_rate_enhanced: Float
    expenditure_limit: Float
    annual_cap: Float
    carryforward_years: Int
    carryback_years: Int
    eligible_entity_types: [String!]!
    eligibility_criteria: String
    accounting_treatment: AccountingTreatment!
    legislation_reference: String!
    effective_from: String!
    effective_until: String
    filing_form: String
    created_at: DateTime
    updated_at: DateTime
  }

  type TaxCreditClaim {
    id: ID!
    entity_id: String!
    program_id: String!
    period_id: String!
    fiscal_year: String!
    claim_status: ClaimStatus!
    eligible_expenditure_total: Float!
    credit_amount_claimed: Float!
    credit_amount_assessed: Float
    refundable_portion: Float!
    non_refundable_portion: Float!
    applied_to_tax: Float!
    carried_forward: Float!
    carried_back: Float!
    cash_received: Float!
    eligible_node_ids: [String!]!
    ai_confidence: Float
    journal_entry_id: String
    created_at: DateTime
    updated_at: DateTime
  }

  type TaxCreditBalance {
    id: ID!
    entity_id: String!
    program_id: String!
    balance_as_of: String!
    opening_balance: Float!
    credits_earned: Float!
    credits_applied: Float!
    credits_expired: Float!
    credits_carried_back: Float!
    closing_balance: Float!
    vintages: String
    created_at: DateTime
    updated_at: DateTime
  }

  type TaxAdjustment {
    description: String!
    amount: Float!
    adjustmentType: String!
  }

  type TaxModuleResult {
    moduleId: ID!
    moduleName: String!
    jurisdiction: String!
    entityId: String!
    periodId: String!
    taxableIncome: Float!
    taxRate: Float!
    taxAmount: Float!
    adjustments: [TaxAdjustment!]!
    filingReference: String
  }

  type DeferredTaxSummary {
    totalDTA: Float!
    totalDTL: Float!
    netPosition: Float!
    positionCount: Int!
    bySourceType: [DeferredTaxBySourceType!]!
  }

  type DeferredTaxBySourceType {
    sourceType: String!
    count: Int!
    netAmount: Float!
  }

  type DeferredTaxResult {
    positions: [DeferredTaxPositionResult!]!
    totalDTA: Float!
    totalDTL: Float!
    netDeferredTax: Float!
  }

  type DeferredTaxPositionResult {
    id: ID!
    sourceNodeId: String!
    sourceNodeType: String!
    temporaryDifference: Float!
    direction: TempDiffDirection!
    deferredTaxAmount: Float!
    recognitionCriteriaMet: Boolean!
  }

  type CurrentTaxResult {
    accountingIncome: Float!
    permanentDifferences: Float!
    taxableIncome: Float!
    currentTaxExpense: Float!
  }

  type TaxProvisionResult {
    id: ID!
    currentTaxExpense: Float!
    deferredTaxMovement: Float!
    creditAmount: Float!
    totalTaxExpense: Float!
    effectiveTaxRate: Float!
    status: TaxProvisionStatus!
    deferredTaxDetails: DeferredTaxResult!
  }

  type QualifiesForEdge {
    sourceNodeId: String!
    claimId: String!
    qualificationBasis: QualificationBasis!
    eligibleAmount: Float!
    eligibilityConfidence: Float!
    expenditureCategory: String!
    reviewerAccepted: Boolean
    rejectionReason: String
  }

  type EligibleExpenditure {
    nodeId: String!
    nodeLabel: String!
    nodeType: String!
    expenditureAmount: Float!
    qualificationBasis: QualificationBasis!
    confidence: Float!
  }

  type RejectionReasonCount {
    reason: String!
    count: Int!
  }

  type FeedbackSummary {
    programCode: String!
    totalReviewed: Int!
    totalAccepted: Int!
    totalRejected: Int!
    precision: Float!
    rejectionReasons: [RejectionReasonCount!]!
    rejectedLabels: [String!]!
    acceptedLabels: [String!]!
  }

  type AccuracyMetrics {
    programCode: String!
    totalIdentified: Int!
    totalReviewed: Int!
    truePositives: Int!
    falsePositives: Int!
    precision: Float!
    reviewCoverage: Float!
    averageConfidence: Float!
    averageAcceptedConfidence: Float!
    averageRejectedConfidence: Float!
  }

  type RefinedModelResult {
    programCode: String!
    positiveKeywords: [String!]!
    negativeKeywords: [String!]!
    feedbackSummary: FeedbackSummary!
  }

  # --- Tax Inputs ---

  input ComputeDeferredTaxInput {
    entityId: String!
    periodId: String!
    taxRate: Float!
  }

  input ComputeCurrentTaxInput {
    entityId: String!
    periodId: String!
    taxRate: Float!
    permanentDifferences: Float
  }

  input CreateTaxProvisionInput {
    entityId: String!
    periodId: String!
    taxRate: Float!
    permanentDifferences: Float
    creditAmount: Float
  }

  input PostTaxProvisionInput {
    id: String!
    journalEntryId: String!
  }

  input TaxModuleInput {
    entityId: String!
    periodId: String!
    # CRA Corporate
    activeBusinessIncome: Float
    smallBusinessLimit: Float
    gripBalance: Float
    lripBalance: Float
    # GST/HST
    gstRate: Float
    hstRate: Float
    salesAmount: Float
    purchasesAmount: Float
    isNFP: Boolean
    # IRS Corporate
    section179Deduction: Float
    # CRA Charity
    totalRevenue: Float
    charitableExpenditures: Float
    managementExpenses: Float
    # IRS Exempt
    publicSupportRevenue: Float
    unrelatedBusinessIncome: Float
    # State Tax
    stateCode: String
    stateRate: Float
    nexusEstablished: Boolean
    apportionmentFactor: Float
    # Withholding Tax
    sourceEntityId: String
    targetEntityId: String
    paymentType: String
    grossAmount: Float
    treatyRate: Float
  }

  input IdentifyEligibleInput {
    entityId: String!
    programCode: String!
    periodId: String!
  }

  input CreateTaxCreditClaimInput {
    entityId: String!
    programCode: String!
    periodId: String!
    fiscalYear: String!
    eligibleExpenditureTotal: Float!
    eligibleNodeIds: [String!]!
    aiConfidence: Float
  }

  input UpdateClaimStatusInput {
    id: String!
    newStatus: ClaimStatus!
    assessedAmount: Float
  }

  input UpdateCreditBalanceInput {
    entityId: String!
    programCode: String!
    balanceAsOf: String!
    creditsEarned: Float!
    creditsApplied: Float
    creditsExpired: Float
    creditsCarriedBack: Float
  }

  input CreateQualifiesForInput {
    sourceNodeId: String!
    claimId: String!
    qualificationBasis: QualificationBasis!
    eligibleAmount: Float!
    eligibilityConfidence: Float!
    expenditureCategory: String!
  }

  # --- Tax Queries ---

  extend type Query {
    deferredTaxPositions(entityId: String!, periodId: String!): [DeferredTaxPosition!]!
    deferredTaxSummary(entityId: String!, periodId: String): DeferredTaxSummary!
    taxProvisions(entityId: String!): [TaxProvision!]!
    taxCreditPrograms(jurisdiction: String): [TaxCreditProgram!]!
    taxCreditProgram(code: String!): TaxCreditProgram
    taxCreditClaims(entityId: String!): [TaxCreditClaim!]!
    taxCreditBalance(entityId: String!, programCode: String!): TaxCreditBalance
    taxModuleResults(entityId: String!, periodId: String): [JSON!]!
    feedbackSummary(programCode: String!): FeedbackSummary!
    accuracyMetrics(programCode: String!): AccuracyMetrics!
  }

  # --- Tax Mutations ---

  extend type Mutation {
    computeDeferredTax(input: ComputeDeferredTaxInput!): DeferredTaxResult!
    computeCurrentTax(input: ComputeCurrentTaxInput!): CurrentTaxResult!
    createTaxProvision(input: CreateTaxProvisionInput!): TaxProvisionResult!
    postTaxProvision(input: PostTaxProvisionInput!): TaxProvision!
    computeTaxModule(module: String!, input: TaxModuleInput!): TaxModuleResult!
    identifyEligibleExpenditures(input: IdentifyEligibleInput!): [EligibleExpenditure!]!
    createTaxCreditClaim(input: CreateTaxCreditClaimInput!): TaxCreditClaim!
    updateClaimStatus(input: UpdateClaimStatusInput!): TaxCreditClaim!
    updateCreditBalance(input: UpdateCreditBalanceInput!): TaxCreditBalance!
    createQualifiesForEdge(input: CreateQualifiesForInput!): Boolean!
    acceptQualification(sourceNodeId: String!, claimId: String!): Boolean!
    rejectQualification(sourceNodeId: String!, claimId: String!, rejectionReason: String!): Boolean!
    refineEligibilityModel(programCode: String!): RefinedModelResult!
    reidentifyWithRefinedModel(entityId: String!, programCode: String!, periodId: String!): [EligibleExpenditure!]!
  }
`;
