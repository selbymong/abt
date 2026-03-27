// GraphQL type definitions for the GL (General Ledger) domain

export const glTypeDefs = `
  # ============================================================
  # Core GL Types
  # ============================================================

  type JournalEntry {
    id: ID!
    entity_id: String!
    period_id: String!
    entry_type: EntryType!
    reference: String!
    narrative: String!
    total_debit: Float!
    total_credit: Float!
    currency: String!
    valid_time_start: String!
    valid_time_end: String
    transaction_time_start: String!
    transaction_time_end: String
    approval_status: String!
    approved_by: String
    idempotency_key: String!
    source_system: String
    created_at: DateTime!
    lines: [LedgerLine!]!
  }

  type LedgerLine {
    id: ID!
    journal_entry_id: String!
    side: Side!
    amount: Float!
    currency: String!
    functional_amount: Float!
    fx_rate: Float
    node_ref_id: String!
    node_ref_type: NodeRefType!
    economic_category: EconomicCategory!
    statutory_code: String
    fund_id: String
    created_at: DateTime!
  }

  # ============================================================
  # Reporting Types
  # ============================================================

  type CategoryBreakdown {
    economic_category: String!
    debit_total: Float!
    credit_total: Float!
    net_balance: Float!
  }

  type ProfitAndLoss {
    revenue: Float!
    expenses: Float!
    netIncome: Float!
    byCategory: [CategoryBreakdown!]!
  }

  type BalanceSheet {
    totalAssets: Float!
    totalLiabilities: Float!
    totalEquity: Float!
    byCategory: [CategoryBreakdown!]!
  }

  type OutcomeAttributionNodeBreakdown {
    nodeRefId: String!
    nodeRefType: String!
    revenue: Float!
    expenses: Float!
    weight: Float!
  }

  type OutcomeAttribution {
    outcomeId: String!
    outcomeLabel: String!
    outcomeType: String!
    revenue: Float!
    expenses: Float!
    netIncome: Float!
    attributionPct: Float!
    nodeBreakdown: [OutcomeAttributionNodeBreakdown!]!
  }

  type UnattributedPnL {
    revenue: Float!
    expenses: Float!
    netIncome: Float!
  }

  type OutcomeAttributedPnL {
    entityId: String!
    periodId: String!
    totalRevenue: Float!
    totalExpenses: Float!
    totalNetIncome: Float!
    attributedToOutcomes: [OutcomeAttribution!]!
    unattributed: UnattributedPnL!
  }

  type TrialBalanceRow {
    economic_category: String!
    total_debit: Float!
    total_credit: Float!
    net_balance: Float!
  }

  type PeriodBalance {
    entity_id: String!
    period_id: String!
    fund_id: String
    node_ref_id: String!
    node_ref_type: String!
    economic_category: String!
    debit_total: Float!
    credit_total: Float!
    net_balance: Float!
    transaction_count: Int!
  }

  type FundBalance {
    fundId: String!
    revenue: Float!
    expenses: Float!
    netBalance: Float!
  }

  # ============================================================
  # Statutory Mapping
  # ============================================================

  type StatutoryMapping {
    id: ID!
    jurisdiction: String!
    node_ref_type: String!
    economic_category: String!
    node_tags_match: [String!]
    statutory_account_code: String!
    statutory_account_label: String!
    applies_from: String!
    applies_until: String
    xbrl_element: String
    xbrl_taxonomy: String
  }

  # ============================================================
  # Temporal Claims (Accruals)
  # ============================================================

  type RecognitionScheduleEntry {
    period_id: String!
    amount: Float!
    recognized_at: String
  }

  type TemporalClaim {
    id: ID!
    entity_id: String!
    claim_type: ClaimType!
    direction: ClaimDirection!
    original_amount: Float!
    recognized_to_date: Float!
    remaining: Float!
    currency: String!
    recognition_method: RecognitionMethod!
    recognition_schedule: [RecognitionScheduleEntry!]
    source_node_id: String!
    source_node_type: String!
    settlement_node_id: String
    outcome_node_id: String
    period_id_opened: String!
    period_id_closed: String
    status: TemporalClaimStatus!
    auto_reverse: Boolean!
    collectability_score: Float!
    ecl_allowance: Float!
    ecl_stage: ECLStage!
    tax_recognition_basis: TaxRecognitionBasis!
    materiality_flag: Boolean!
    created_at: DateTime
    updated_at: DateTime
  }

  type RecognitionResult {
    journalEntryIds: [String!]!
    amountRecognized: Float!
  }

  type BulkRecognitionResult {
    claimCount: Int!
    totalRecognized: Float!
    journalEntryIds: [String!]!
  }

  type ReversalResult {
    reversalCount: Int!
    journalEntryIds: [String!]!
  }

  type ECLUpdateResult {
    previousStage: String!
    newStage: ECLStage!
  }

  # ============================================================
  # Provisions (IAS 37 / ASC 450)
  # ============================================================

  type Provision {
    id: ID!
    entity_id: String!
    label: String!
    provision_type: ProvisionType!
    present_obligation_basis: String!
    recognition_criteria_met: Boolean!
    probability_of_outflow: ProbabilityOfOutflow!
    best_estimate: Float!
    range_low: Float
    range_high: Float
    discount_rate: Float
    carrying_amount: Float!
    unwinding_to_date: Float!
    expected_settlement_date: String
    reimbursement_asset_id: String
    last_reviewed_date: String!
    created_at: DateTime
    updated_at: DateTime
  }

  type ProvisionRecognitionResult {
    journalEntryId: String
    recognized: Boolean!
  }

  type ProvisionUnwindResult {
    unwindingAmount: Float!
    journalEntryId: String
  }

  type ProvisionSettlementResult {
    journalEntryId: String!
    gainOrLoss: Float!
  }

  # ============================================================
  # Lease Accounting (IFRS 16)
  # ============================================================

  type LeasePaymentScheduleEntry {
    period_id: String!
    payment_date: String!
    lease_payment_amount: Float!
    interest_portion: Float!
    principal_portion: Float!
    carrying_amount_after: Float!
  }

  type RightOfUseAsset {
    id: ID!
    entity_id: String!
    label: String!
    lease_classification: LeaseClassification!
    cost_at_initial_recognition: Float!
    accumulated_amortization: Float!
    accumulated_impairment: Float!
    carrying_amount: Float!
    lease_term_months: Int!
    incremental_borrowing_rate: Float!
    acquisition_date: String!
    lease_end_date: String!
    tax_base: Float!
    activity_ref_id: String
    created_at: DateTime
    updated_at: DateTime
  }

  type LeaseLiability {
    id: ID!
    entity_id: String!
    label: String!
    initial_measurement: Float!
    accumulated_interest: Float!
    accumulated_payments: Float!
    remaining_liability: Float!
    lease_term_months: Int!
    incremental_borrowing_rate: Float!
    payment_schedule: [LeasePaymentScheduleEntry!]
    tax_base: Float!
    created_at: DateTime
    updated_at: DateTime
  }

  type LeaseCreationResult {
    rouAssetId: String!
    leaseLiabilityId: String!
  }

  type LeasePaymentResult {
    interestExpense: Float!
    principalPayment: Float!
    amortizationCharge: Float!
    journalEntryIds: [String!]!
  }

  # ============================================================
  # Related Party (IAS 24)
  # ============================================================

  type RelatedPartyEdge {
    relatedEntityId: String!
    relatedEntityLabel: String!
    relationship_type: RelatedPartyRelationshipType!
    individuals_in_common: [String!]
    effective_from: String!
    effective_until: String
    disclosure_required: Boolean!
  }

  type RelatedPartyTransaction {
    transaction_nature: TransactionNature!
    source_entity_id: String!
    target_entity_id: String!
    arms_length_validated: Boolean!
    arms_length_method: ArmsLengthMethod
    source_journal_entry_id: String!
    target_journal_entry_id: String!
    tax_deductible_for_source: Boolean!
    donation_receipt_issued: Boolean
    source_amount: Float
    source_narrative: String
    target_amount: Float
    target_narrative: String
  }

  type ArmsLengthValidationResult {
    sourceJournalEntryId: String!
    targetJournalEntryId: String!
    transactionNature: String!
    sourceAmount: Float!
    targetAmount: Float!
    validated: Boolean!
    method: ArmsLengthMethod!
    variance: Float
  }

  # ============================================================
  # Equity Close
  # ============================================================

  type RetainedEarnings {
    id: ID!
    entity_id: String!
    fund_id: String
    period_id: String!
    opening_balance: Float!
    net_income: Float!
    dividends_declared: Float!
    other_adjustments: Float!
    closing_balance: Float!
    created_at: DateTime
    updated_at: DateTime
  }

  type OtherComprehensiveIncome {
    id: ID!
    entity_id: String!
    period_id: String!
    component: OciComponent!
    opening_balance: Float!
    current_period: Float!
    recycled_to_pnl: Float!
    closing_balance: Float!
    source_node_id: String
    source_node_type: OciSourceNodeType
    created_at: DateTime
    updated_at: DateTime
  }

  type EquitySection {
    id: ID!
    entity_id: String!
    period_id: String!
    share_capital: Float!
    retained_earnings: Float!
    accumulated_oci: Float!
    total_equity: Float!
    nci_equity: Float
    total_equity_and_nci: Float!
    created_at: DateTime
    updated_at: DateTime
  }

  type EquityBreakdownRow {
    component: String!
    openingBalance: Float!
    movement: Float!
    recycledToPnl: Float!
    closingBalance: Float!
  }

  type PeriodTransitionResult {
    periodId: String!
    previousStatus: PeriodStatus!
    newStatus: PeriodStatus!
  }

  # ============================================================
  # Input Types
  # ============================================================

  input LedgerLineInput {
    side: Side!
    amount: Float!
    nodeRefId: String!
    nodeRefType: NodeRefType!
    economicCategory: EconomicCategory!
    fundId: String
    fxRate: Float
  }

  input PostJournalEntryInput {
    entityId: String!
    periodId: String!
    entryType: EntryType!
    reference: String!
    narrative: String!
    currency: String!
    validDate: String!
    approvedBy: String
    sourceSystem: String
    lines: [LedgerLineInput!]!
  }

  input CreateStatutoryMappingInput {
    jurisdiction: String!
    nodeRefType: String!
    economicCategory: String!
    nodeTagsMatch: [String!]
    statutoryAccountCode: String!
    statutoryAccountLabel: String!
    appliesFrom: String!
    appliesUntil: String
    xbrlElement: String
    xbrlTaxonomy: String
  }

  input RecognitionScheduleEntryInput {
    period_id: String!
    amount: Float!
  }

  input CreateTemporalClaimInput {
    entityId: String!
    claimType: ClaimType!
    direction: ClaimDirection!
    originalAmount: Float!
    currency: String!
    recognitionMethod: RecognitionMethod!
    recognitionSchedule: [RecognitionScheduleEntryInput!]!
    sourceNodeId: String!
    sourceNodeType: NodeRefType!
    periodIdOpened: String!
    autoReverse: Boolean!
    collectabilityScore: Float
    eclAllowance: Float
    eclStage: ECLStage
    taxRecognitionBasis: TaxRecognitionBasis
    settlementNodeId: String
    outcomeNodeId: String
  }

  input PeriodScheduleEntryInput {
    periodId: String!
    paymentDate: String!
  }

  input CreateLeaseInput {
    entityId: String!
    label: String!
    leaseClassification: LeaseClassification!
    totalLeasePayments: Float!
    leaseTermMonths: Int!
    monthlyPayment: Float!
    incrementalBorrowingRate: Float!
    commencementDate: String!
    leaseEndDate: String!
    periodSchedule: [PeriodScheduleEntryInput!]!
    activityRefId: String
  }

  input CreateProvisionInput {
    entityId: String!
    label: String!
    provisionType: ProvisionType!
    presentObligationBasis: String!
    probabilityOfOutflow: ProbabilityOfOutflow!
    bestEstimate: Float!
    rangeLow: Float
    rangeHigh: Float
    discountRate: Float
    expectedSettlementDate: String
    reimbursementAssetId: String
  }

  input CreateRelatedPartyInput {
    sourceEntityId: String!
    targetEntityId: String!
    relationshipType: RelatedPartyRelationshipType!
    individualsInCommon: [String!]!
    effectiveFrom: String!
    effectiveUntil: String
    disclosureRequired: Boolean
  }

  input CreateRelatedPartyTransactionInput {
    sourceJournalEntryId: String!
    targetJournalEntryId: String!
    transactionNature: TransactionNature!
    sourceEntityId: String!
    targetEntityId: String!
    armsLengthValidated: Boolean
    armsLengthMethod: ArmsLengthMethod
    taxDeductibleForSource: Boolean
    donationReceiptIssued: Boolean
  }

  input ComputeRetainedEarningsInput {
    entityId: String!
    periodId: String!
    fundId: String
    dividendsDeclared: Float
    otherAdjustments: Float
  }

  input RecordOCIInput {
    entityId: String!
    periodId: String!
    component: OciComponent!
    currentPeriod: Float!
    sourceNodeId: String
    sourceNodeType: OciSourceNodeType
  }

  # ============================================================
  # Queries
  # ============================================================

  extend type Query {
    journalEntry(id: ID!): JournalEntry
    journalEntries(entityId: String!, periodId: String): [JournalEntry!]!
    profitAndLoss(entityId: String!, periodId: String!, fundId: String): ProfitAndLoss!
    balanceSheet(entityId: String!, periodId: String!, fundId: String): BalanceSheet!
    trialBalance(entityId: String!, periodId: String!): [TrialBalanceRow!]!
    periodBalances(entityId: String!, periodId: String!): [PeriodBalance!]!
    fundBalances(entityId: String!, periodId: String!): [FundBalance!]!
    outcomeAttributedPnL(entityId: String!, periodId: String!, maxHops: Int): OutcomeAttributedPnL!
    temporalClaim(id: ID!): TemporalClaim
    temporalClaims(entityId: String!, status: TemporalClaimStatus): [TemporalClaim!]!
    provision(id: ID!): Provision
    provisions(entityId: String!, probability: ProbabilityOfOutflow): [Provision!]!
    rouAsset(id: ID!): RightOfUseAsset
    rouAssets(entityId: String!): [RightOfUseAsset!]!
    leaseLiability(id: ID!): LeaseLiability
    leaseLiabilities(entityId: String!): [LeaseLiability!]!
    relatedParties(entityId: String!): [RelatedPartyEdge!]!
    retainedEarnings(entityId: String!, periodId: String!): RetainedEarnings
    ociComponents(entityId: String!, periodId: String!): [OtherComprehensiveIncome!]!
    equitySection(entityId: String!, periodId: String!): EquitySection
    equityBreakdown(entityId: String!, periodId: String!): [EquityBreakdownRow!]!
  }

  # ============================================================
  # Mutations
  # ============================================================

  extend type Mutation {
    postJournalEntry(input: PostJournalEntryInput!): JournalEntry!
    softClosePeriod(periodId: String!, closedBy: String!): PeriodTransitionResult!
    hardClosePeriod(periodId: String!, closedBy: String!): PeriodTransitionResult!
    reopenPeriod(periodId: String!, reopenedBy: String!): PeriodTransitionResult!
    createStatutoryMapping(input: CreateStatutoryMappingInput!): StatutoryMapping!
    createTemporalClaim(input: CreateTemporalClaimInput!): TemporalClaim!
    recognizeClaim(claimId: String!, periodId: String!): RecognitionResult!
    recognizeAllClaims(entityId: String!, periodId: String!): BulkRecognitionResult!
    autoReverseClaims(entityId: String!, currentPeriodId: String!, previousPeriodId: String!): ReversalResult!
    updateECL(claimId: String!, collectabilityScore: Float!, eclAllowance: Float!): ECLUpdateResult!
    writeOffClaim(claimId: String!): Boolean!
    createLease(input: CreateLeaseInput!): LeaseCreationResult!
    processLeasePayment(leaseLiabilityId: String!, rouAssetId: String!, periodId: String!): LeasePaymentResult!
    createProvision(input: CreateProvisionInput!): Provision!
    recognizeProvision(provisionId: String!, periodId: String!): ProvisionRecognitionResult!
    unwindProvisionDiscount(provisionId: String!, periodId: String!): ProvisionUnwindResult!
    settleProvision(provisionId: String!, periodId: String!, actualAmount: Float!): ProvisionSettlementResult!
    createRelatedParty(input: CreateRelatedPartyInput!): Boolean!
    createRelatedPartyTransaction(input: CreateRelatedPartyTransactionInput!): Boolean!
    validateArmsLength(entityId: String!, periodId: String!, method: ArmsLengthMethod!, tolerancePct: Float): [ArmsLengthValidationResult!]!
    computeRetainedEarnings(input: ComputeRetainedEarningsInput!): RetainedEarnings!
    recordOCI(input: RecordOCIInput!): OtherComprehensiveIncome!
    recycleOCI(ociId: String!, amount: Float!): Boolean!
    generateEquitySection(entityId: String!, periodId: String!, nciEquity: Float): EquitySection!
  }

  # ============================================================
  # Segment Reporting (IFRS 8)
  # ============================================================

  type SegmentInfo {
    id: ID!
    label: String!
    entity_id: String!
    status: String!
    budget: Float!
  }

  type SegmentCategoryBreakdown {
    economic_category: String!
    debit_total: Float!
    credit_total: Float!
    net_balance: Float!
  }

  type SegmentPnL {
    segment: SegmentInfo!
    revenue: Float!
    expenses: Float!
    segment_profit: Float!
    assets: Float!
    liabilities: Float!
    byCategory: [SegmentCategoryBreakdown!]!
  }

  type ConsolidatedSegmentTotals {
    revenue: Float!
    expenses: Float!
    segment_profit: Float!
    assets: Float!
    liabilities: Float!
  }

  type SegmentReportResult {
    entity_id: String!
    period_id: String!
    fund_id: String
    segments: [SegmentPnL!]!
    unallocated: SegmentPnL!
    consolidated: ConsolidatedSegmentTotals!
    inter_segment_eliminations: Float!
  }

  type SegmentNodeDetail {
    node_ref_id: String!
    node_ref_type: String!
    label: String!
    revenue: Float!
    expenses: Float!
    net: Float!
  }

  type SegmentPnLSummary {
    revenue: Float!
    expenses: Float!
    segment_profit: Float!
  }

  type SegmentDetailResult {
    segment: SegmentInfo!
    pnl: SegmentPnLSummary!
    nodes: [SegmentNodeDetail!]!
  }

  extend type Query {
    segmentReport(entityId: String!, periodId: String!, fundId: String): SegmentReportResult!
    segmentDetail(entityId: String!, periodId: String!, initiativeId: String!, fundId: String): SegmentDetailResult!
  }
`;
