// GraphQL enum type definitions
// Auto-mapped from src/schema/neo4j/types.ts TypeScript union types

export const enumTypeDefs = `
  enum EntityType {
    FOR_PROFIT
    NOT_FOR_PROFIT
  }

  enum TaxStatus {
    TAXABLE
    EXEMPT
  }

  enum ReportingFramework {
    IFRS
    ASPE
    US_GAAP
    ASNFPO
    ASC_958
  }

  enum OutcomeOntology {
    FINANCIAL
    MISSION
  }

  enum OutcomeType {
    IMPROVE_REVENUE
    NEW_REVENUE
    MITIGATE_EXPENSE
    DELIVER_MISSION
    SUSTAIN_FUNDING
    STEWARD_RESOURCES
  }

  enum ValueState {
    FORECASTED
    ESTIMATED
    VALIDATED
    REALIZED
    STALE_ESTIMATED
  }

  enum UncertaintyType {
    ALEATORY
    EPISTEMIC
    MIXED
  }

  enum ControlClass {
    DIRECT
    DELEGATED
    PROXIMATE_EXT
    DISTAL_EXT
    FORCE_MAJEURE
  }

  enum NodeStatus {
    PLANNED
    IN_PROGRESS
    COMPLETED
    CANCELLED
  }

  enum ResourceType {
    CASH
    PEOPLE
    TIME
    EQUIPMENT
    EXTERNAL_SERVICE
  }

  enum MetricType {
    LEADING
    COINCIDENT
    LAGGING
  }

  enum CapabilityLevel {
    NASCENT
    DEVELOPING
    ESTABLISHED
    MATURE
  }

  enum AssetType {
    PRODUCT
    BRAND
    IP
    INFRASTRUCTURE
    DATA
  }

  enum ContributionFunction {
    LINEAR
    LOGARITHMIC
    EXPONENTIAL
    THRESHOLD
    BIMODAL
    S_CURVE
  }

  enum DependencyClass {
    HARD_BLOCK
    SOFT_DEPENDENCY
    ENABLES
  }

  enum EconomicCategory {
    ASSET
    LIABILITY
    EQUITY
    REVENUE
    EXPENSE
  }

  enum Side {
    DEBIT
    CREDIT
  }

  enum EntryType {
    OPERATIONAL
    ACCRUAL
    DEFERRAL
    REVERSAL
    ADJUSTMENT
    ELIMINATION
    IMPAIRMENT
  }

  enum PeriodStatus {
    OPEN
    SOFT_CLOSED
    HARD_CLOSED
  }

  enum ClaimType {
    ACCRUED_REVENUE
    DEFERRED_REVENUE
    PREPAID_EXPENSE
    ACCRUED_LIABILITY
  }

  enum ClaimDirection {
    RECEIVABLE
    PAYABLE
  }

  enum TemporalClaimStatus {
    OPEN
    PARTIALLY_RECOGNIZED
    FULLY_RECOGNIZED
    WRITTEN_OFF
  }

  enum RecognitionMethod {
    STRAIGHT_LINE
    PERCENTAGE_COMPLETE
    MILESTONE
    USAGE_BASED
  }

  enum ECLStage {
    STAGE_1
    STAGE_2
    STAGE_3
  }

  enum TaxRecognitionBasis {
    CASH_BASIS
    ACCRUAL_BASIS
  }

  enum ObligationStatus {
    PENDING
    COMPLETED
    OVERDUE
  }

  enum CashFlowDirection {
    INFLOW
    OUTFLOW
  }

  enum CashFlowStatus {
    PENDING
    SETTLED
    CANCELLED
  }

  enum ConsolidationMethod {
    FULL
    EQUITY
    PROPORTIONATE
    EXCLUDED
  }

  enum FundType {
    UNRESTRICTED
    TEMPORARILY_RESTRICTED
    PERMANENTLY_RESTRICTED
    ENDOWMENT
  }

  enum ClassSystem {
    CCA
    MACRS
    ACCOUNTING
  }

  enum DepreciationMethod {
    STRAIGHT_LINE
    DECLINING_BALANCE
    DOUBLE_DECLINING
    UNITS_OF_PRODUCTION
    SUM_OF_YEARS
    GDS_TABLE
    ADS_TABLE
  }

  enum FirstYearRule {
    HALF_YEAR
    MID_QUARTER
    MID_MONTH
    FULL_YEAR
    NONE
  }

  enum CreditType {
    REFUNDABLE
    NON_REFUNDABLE
    PARTIALLY_REFUNDABLE
    DIRECT_PAY
  }

  enum ClaimStatus {
    DRAFT
    AI_IDENTIFIED
    REVIEWED
    APPROVED
    FILED
    ASSESSED
    ADJUSTED
    CLOSED
  }

  enum OciComponent {
    CTA_COMPONENT
    CASHFLOW_HEDGE
    NET_INVESTMENT_HEDGE
    FVOCI_DEBT
    FVOCI_EQUITY
    DB_PENSION
    REVALUATION_SURPLUS
  }

  enum IFRS9Classification {
    AMORTISED_COST
    FVOCI_DEBT
    FVOCI_EQUITY
    FVTPL
  }

  enum NodeRefType {
    ACTIVITY
    PROJECT
    INITIATIVE
    OUTCOME
    CASHFLOWEVENT
    TEMPORAL_CLAIM
    FIXED_ASSET
    GOODWILL
    PROVISION
    WORKFORCE_ASSET
    CUSTOMER_RELATIONSHIP_ASSET
    FUND
    TAX_CREDIT_CLAIM
    OCI
    RIGHT_OF_USE_ASSET
    LEASE_LIABILITY
    REVENUE_CONTRACT
    PERFORMANCE_OBLIGATION
    INVENTORY_ITEM
  }

  enum ProvisionType {
    WARRANTY
    RESTRUCTURING
    LEGAL_CLAIM
    ENVIRONMENTAL
    ONEROUS_CONTRACT
    DECOMMISSIONING
  }

  enum ProbabilityOfOutflow {
    PROBABLE
    POSSIBLE
    REMOTE
  }

  enum LeaseClassification {
    FINANCE
    OPERATING
  }

  enum PoolMethod {
    INDIVIDUAL
    POOLED
  }

  enum DisposalRule {
    RECAPTURE_AND_TERMINAL_LOSS
    GAIN_LOSS_ON_DISPOSAL
    HALF_YEAR_DISPOSAL
  }

  enum MinorityInterestMethod {
    PROPORTIONATE
    FULL_GOODWILL
  }

  enum IntercompanyTransactionType {
    SALE
    LOAN
    DIVIDEND
    SERVICE
    MANAGEMENT_FEE
    RENTAL
    GUARANTEE
  }

  enum ImpairmentTestResult {
    PASS
    IMPAIRED
  }

  enum OciSourceNodeType {
    CURRENCY_TRANSLATION
    HEDGE
    FINANCIAL_INSTRUMENT
    PENSION
  }

  enum TaxProvisionStatus {
    DRAFT
    APPROVED
    POSTED
  }

  enum TempDiffDirection {
    TAXABLE
    DEDUCTIBLE
  }

  enum TaxAuthority {
    CRA
    IRS
    PROVINCIAL
    STATE
  }

  enum AccountingTreatment {
    COST_REDUCTION
    INCOME_APPROACH
    ITC_METHOD
  }

  enum QualificationBasis {
    AI_INFERRED
    MANUALLY_TAGGED
    RULE_MATCHED
  }

  enum CreditCertainty {
    CLAIMED
    ASSESSED
    REALIZED
  }

  enum BankStatementLineStatus {
    UNMATCHED
    MATCHED
    MANUALLY_CLEARED
  }

  enum ReconciliationStatus {
    UNRECONCILED
    RECONCILED
    MANUALLY_CLEARED
  }

  enum ShareClassType {
    COMMON
    PREFERRED
    CLASS_A
    CLASS_B
  }

  enum AwardType {
    STOCK_OPTION
    RSU
    PERFORMANCE_SHARE
    PHANTOM_STOCK
    SAR
  }

  enum AwardStatus {
    GRANTED
    VESTING
    VESTED
    EXERCISED
    FORFEITED
    EXPIRED
  }

  enum VestingType {
    TIME_BASED
    PERFORMANCE_BASED
    CLIFF
    GRADED
  }

  enum ContractStatus {
    DRAFT
    ACTIVE
    COMPLETED
    CANCELLED
    IMPAIRED
  }

  enum POSatisfactionMethod {
    POINT_IN_TIME
    OVER_TIME
  }

  enum OverTimeMeasure {
    INPUT
    OUTPUT
    STRAIGHT_LINE
  }

  enum VariableConsiderationType {
    DISCOUNT
    REBATE
    PENALTY
    BONUS
    PRICE_CONCESSION
    RIGHT_OF_RETURN
  }

  enum ConstraintEstimateMethod {
    EXPECTED_VALUE
    MOST_LIKELY_AMOUNT
  }

  enum InventoryCostMethod {
    FIFO
    WEIGHTED_AVG
    LIFO
  }

  enum InventoryCategory {
    RAW_MATERIAL
    WORK_IN_PROGRESS
    FINISHED_GOODS
    MERCHANDISE
  }

  enum InstrumentType {
    CASH
    RECEIVABLE
    PAYABLE
    LOAN
    BOND
    EQUITY_INVESTMENT
    DERIVATIVE
    HEDGE_INSTRUMENT
  }

  enum FairValueHierarchy {
    LEVEL_1
    LEVEL_2
    LEVEL_3
  }

  enum HedgeType {
    FAIR_VALUE
    CASH_FLOW
    NET_INVESTMENT
  }

  enum EffectivenessResult {
    PASS
    FAIL
  }

  enum RelatedPartyRelationshipType {
    SHARED_BOARD
    SHARED_MANAGEMENT
    ECONOMIC_DEPENDENCE
    FAMILY
    SIGNIFICANT_INFLUENCE
  }

  enum TransactionNature {
    TRADE
    SERVICE
    DONATION
    GRANT
    MANAGEMENT_FEE
    SHARED_COST_ALLOCATION
    LICENSING
    LOAN
  }

  enum ArmsLengthMethod {
    CUP
    COST_PLUS
    RESALE_MINUS
    TNMM
    PROFIT_SPLIT
  }
`;
