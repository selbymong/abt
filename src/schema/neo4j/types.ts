// ============================================================
// Neo4j Node and Edge TypeScript types
// Canonical type definitions matching docs/04-data-model-reference.md
// ============================================================

// --- Enums ---

export type EntityType = 'FOR_PROFIT' | 'NOT_FOR_PROFIT';
export type TaxStatus = 'TAXABLE' | 'EXEMPT';
export type ReportingFramework = 'IFRS' | 'ASPE' | 'US_GAAP' | 'ASNFPO' | 'ASC_958';
export type OutcomeOntology = 'FINANCIAL' | 'MISSION';
export type OutcomeType =
  | 'IMPROVE_REVENUE' | 'NEW_REVENUE' | 'MITIGATE_EXPENSE'
  | 'DELIVER_MISSION' | 'SUSTAIN_FUNDING' | 'STEWARD_RESOURCES';
export type ValueState = 'FORECASTED' | 'ESTIMATED' | 'VALIDATED' | 'REALIZED' | 'STALE_ESTIMATED';
export type UncertaintyType = 'ALEATORY' | 'EPISTEMIC' | 'MIXED';
export type ControlClass = 'DIRECT' | 'DELEGATED' | 'PROXIMATE_EXT' | 'DISTAL_EXT' | 'FORCE_MAJEURE';
export type NodeStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ResourceType = 'CASH' | 'PEOPLE' | 'TIME' | 'EQUIPMENT' | 'EXTERNAL_SERVICE';
export type MetricType = 'LEADING' | 'COINCIDENT' | 'LAGGING';
export type CapabilityLevel = 'NASCENT' | 'DEVELOPING' | 'ESTABLISHED' | 'MATURE';
export type AssetType = 'PRODUCT' | 'BRAND' | 'IP' | 'INFRASTRUCTURE' | 'DATA';
export type ContributionFunction = 'LINEAR' | 'LOGARITHMIC' | 'EXPONENTIAL' | 'THRESHOLD' | 'BIMODAL' | 'S_CURVE';
export type DependencyClass = 'HARD_BLOCK' | 'SOFT_DEPENDENCY' | 'ENABLES';
export type EconomicCategory = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type Side = 'DEBIT' | 'CREDIT';
export type EntryType = 'OPERATIONAL' | 'ACCRUAL' | 'DEFERRAL' | 'REVERSAL' | 'ADJUSTMENT' | 'ELIMINATION' | 'IMPAIRMENT';
export type PeriodStatus = 'OPEN' | 'SOFT_CLOSED' | 'HARD_CLOSED';
export type ClaimType = 'ACCRUED_REVENUE' | 'DEFERRED_REVENUE' | 'PREPAID_EXPENSE' | 'ACCRUED_LIABILITY';
export type ClaimDirection = 'RECEIVABLE' | 'PAYABLE';
export type TemporalClaimStatus = 'OPEN' | 'PARTIALLY_RECOGNIZED' | 'FULLY_RECOGNIZED' | 'WRITTEN_OFF';
export type RecognitionMethod = 'STRAIGHT_LINE' | 'PERCENTAGE_COMPLETE' | 'MILESTONE' | 'USAGE_BASED';
export type ECLStage = 'STAGE_1' | 'STAGE_2' | 'STAGE_3';
export type TaxRecognitionBasis = 'CASH_BASIS' | 'ACCRUAL_BASIS';
export type ObligationStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE';
export type CashFlowDirection = 'INFLOW' | 'OUTFLOW';
export type CashFlowStatus = 'PENDING' | 'SETTLED' | 'CANCELLED';
export type ConsolidationMethod = 'FULL' | 'EQUITY' | 'PROPORTIONATE' | 'EXCLUDED';
export type FundType = 'UNRESTRICTED' | 'TEMPORARILY_RESTRICTED' | 'PERMANENTLY_RESTRICTED' | 'ENDOWMENT';
export type ClassSystem = 'CCA' | 'MACRS' | 'ACCOUNTING';
export type DepreciationMethod = 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'DOUBLE_DECLINING' | 'UNITS_OF_PRODUCTION' | 'SUM_OF_YEARS' | 'GDS_TABLE' | 'ADS_TABLE';
export type FirstYearRule = 'HALF_YEAR' | 'MID_QUARTER' | 'MID_MONTH' | 'FULL_YEAR' | 'NONE';
export type CreditType = 'REFUNDABLE' | 'NON_REFUNDABLE' | 'PARTIALLY_REFUNDABLE' | 'DIRECT_PAY';
export type ClaimStatus = 'DRAFT' | 'AI_IDENTIFIED' | 'REVIEWED' | 'APPROVED' | 'FILED' | 'ASSESSED' | 'ADJUSTED' | 'CLOSED';
export type OciComponent = 'CTA_COMPONENT' | 'CASHFLOW_HEDGE' | 'NET_INVESTMENT_HEDGE' | 'FVOCI_DEBT' | 'FVOCI_EQUITY' | 'DB_PENSION' | 'REVALUATION_SURPLUS';
export type IFRS9Classification = 'AMORTISED_COST' | 'FVOCI_DEBT' | 'FVOCI_EQUITY' | 'FVTPL';
export type NodeRefType =
  | 'ACTIVITY' | 'PROJECT' | 'INITIATIVE' | 'OUTCOME'
  | 'CASHFLOWEVENT' | 'TEMPORAL_CLAIM' | 'FIXED_ASSET'
  | 'GOODWILL' | 'PROVISION' | 'WORKFORCE_ASSET'
  | 'CUSTOMER_RELATIONSHIP_ASSET' | 'FUND' | 'TAX_CREDIT_CLAIM' | 'OCI'
  | 'RIGHT_OF_USE_ASSET' | 'LEASE_LIABILITY'
  | 'REVENUE_CONTRACT' | 'PERFORMANCE_OBLIGATION'
  | 'INVENTORY_ITEM';

// --- Common property blocks ---

export interface EpistemicProperties {
  value_state: ValueState;
  uncertainty_type: UncertaintyType;
  uncertainty_score: number;
  ci_point_estimate: number;
  ci_lower_bound: number;
  ci_upper_bound: number;
  ci_confidence_pct: number;
  ci_distribution: 'NORMAL' | 'SKEWED_HIGH' | 'SKEWED_LOW' | 'BIMODAL';
  ci_estimation_method: 'ANALOGICAL' | 'DELPHI' | 'PARAMETRIC' | 'BOTTOM_UP';
  calibration_factor: number;
  epistemic_priority: number;
  expires_at?: string;
}

export interface ControlProperties {
  control_class: ControlClass;
  control_score: number;
  effective_control: number;
  observability_score: number;
  response_window_days: number;
  volatility: number;
  scenario_set_id?: string[];
}

export interface TimestampedNode {
  id: string;
  created_at: string;
  updated_at: string;
}

// --- Core nodes ---

export interface Entity extends TimestampedNode {
  label: string;
  entity_type: EntityType;
  tax_status: TaxStatus;
  reporting_framework: ReportingFramework;
  jurisdiction: string;
  functional_currency: string;
  outcome_ontology: OutcomeOntology;
  fund_accounting_enabled: boolean;
  registration_number?: string;
  fiscal_year_end: string;
  consolidation_method: ConsolidationMethod;
  ownership_pct: number;
  nci_pct: number;
  is_parent: boolean;
  consolidation_group_id?: string;
  acquisition_date?: string;
  reporting_lag_days: number;
}

// --- Consolidation nodes ---

export type MinorityInterestMethod = 'PROPORTIONATE' | 'FULL_GOODWILL';
export type IntercompanyTransactionType = 'SALE' | 'LOAN' | 'DIVIDEND' | 'SERVICE' | 'MANAGEMENT_FEE' | 'RENTAL' | 'GUARANTEE';
export type ImpairmentTestResult = 'PASS' | 'IMPAIRED';

export interface ConsolidationGroup extends TimestampedNode {
  label: string;
  parent_entity_id: string;
  functional_currency: string;
  entity_ids: string[];
  minority_interest_method: MinorityInterestMethod;
  intercompany_threshold: number;
}

export interface OwnershipInterest extends TimestampedNode {
  investor_entity_id: string;
  investee_entity_id: string;
  ownership_pct: number;
  acquisition_cost: number;
  net_assets_at_acquisition: number;
  goodwill: number;
  carrying_value: number;
  acquisition_date: string;
  disposal_date?: string;
}

export interface CurrencyTranslation extends TimestampedNode {
  entity_id: string;
  period_id: string;
  functional_currency: string;
  presentation_currency: string;
  average_rate: number;
  closing_rate: number;
  revenue_translated: number;
  expense_translated: number;
  asset_translated: number;
  liability_translated: number;
  cta_current_period: number;
  cumulative_cta: number;
}

export interface Goodwill extends TimestampedNode {
  business_combination_id?: string;
  acquiree_entity_id: string;
  cgu_id?: string;
  gross_amount: number;
  accumulated_impairment: number;
  carrying_amount: number;
  currency: string;
  is_full_goodwill: boolean;
  nci_goodwill_pct?: number;
  last_test_date?: string;
  last_test_result?: ImpairmentTestResult;
  tax_deductible: boolean;
  tax_base: number;
  disposal_date?: string;
}

export interface IntercompanyMatchEdge {
  source_entity_id: string;
  target_entity_id: string;
  source_ledger_line_id: string;
  target_ledger_line_id: string;
  elimination_amount: number;
  transaction_type: IntercompanyTransactionType;
  amount_seller_currency: number;
  amount_buyer_currency: number;
  unrealized_profit_pct?: number;
}

// --- Equity close nodes ---

export type OciSourceNodeType = 'CURRENCY_TRANSLATION' | 'HEDGE' | 'FINANCIAL_INSTRUMENT' | 'PENSION';

export interface RetainedEarnings extends TimestampedNode {
  entity_id: string;
  fund_id?: string;
  period_id: string;
  opening_balance: number;
  net_income: number;
  dividends_declared: number;
  other_adjustments: number;
  closing_balance: number;
}

export interface OtherComprehensiveIncome extends TimestampedNode {
  entity_id: string;
  period_id: string;
  component: OciComponent;
  opening_balance: number;
  current_period: number;
  recycled_to_pnl: number;
  closing_balance: number;
  source_node_id?: string;
  source_node_type?: OciSourceNodeType;
}

export interface EquitySection extends TimestampedNode {
  entity_id: string;
  period_id: string;
  share_capital: number;
  retained_earnings: number;
  accumulated_oci: number;
  total_equity: number;
  nci_equity?: number;
  total_equity_and_nci: number;
}

export interface Outcome extends TimestampedNode, Partial<EpistemicProperties>, Partial<ControlProperties> {
  label: string;
  entity_id: string;
  ontology: OutcomeOntology;
  outcome_type: OutcomeType;
  measurement_unit?: string;
  stream_id?: string;
  target_delta: number;
  realized_delta: number;
  currency: string;
  period_start: string;
  period_end: string;
}

export interface JournalEntry {
  id: string;
  entity_id: string;
  period_id: string;
  entry_type: EntryType;
  reference: string;
  narrative: string;
  total_debit: number;
  total_credit: number;
  currency: string;
  valid_time_start: string;
  valid_time_end?: string;
  transaction_time_start: string;
  transaction_time_end?: string;
  approval_status: string;
  approved_by?: string;
  idempotency_key: string;
  source_system?: string;
  created_at: string;
}

export interface LedgerLine {
  id: string;
  journal_entry_id: string;
  side: Side;
  amount: number;
  currency: string;
  functional_amount: number;
  fx_rate?: number;
  node_ref_id: string;
  node_ref_type: NodeRefType;
  economic_category: EconomicCategory;
  statutory_code?: string;
  fund_id?: string;
  created_at: string;
}

export interface AccountingPeriod extends TimestampedNode {
  entity_id: string;
  label: string;
  start_date: string;
  end_date: string;
  status: PeriodStatus;
  soft_closed_at?: string;
  hard_closed_at?: string;
  closed_by?: string;
}

export interface Fund extends TimestampedNode {
  entity_id: string;
  fund_type: FundType;
  label: string;
  restriction_description?: string;
  restriction_expiry?: string;
  restriction_purpose?: string;
}

export interface RecognitionScheduleEntry {
  period_id: string;
  amount: number;
  recognized_at?: string;
}

export interface TemporalClaim extends TimestampedNode {
  entity_id: string;
  claim_type: ClaimType;
  direction: ClaimDirection;
  original_amount: number;
  recognized_to_date: number;
  remaining: number;
  currency: string;
  recognition_method: RecognitionMethod;
  recognition_schedule: RecognitionScheduleEntry[];
  source_node_id: string;
  source_node_type: NodeRefType;
  settlement_node_id?: string;
  outcome_node_id?: string;
  period_id_opened: string;
  period_id_closed?: string;
  status: TemporalClaimStatus;
  auto_reverse: boolean;
  collectability_score: number;
  ecl_allowance: number;
  ecl_stage: ECLStage;
  tax_recognition_basis: TaxRecognitionBasis;
  materiality_flag: boolean;
}

// --- Provision nodes (IAS 37 / ASC 450) ---

export type ProvisionType = 'WARRANTY' | 'RESTRUCTURING' | 'LEGAL_CLAIM' | 'ENVIRONMENTAL' | 'ONEROUS_CONTRACT' | 'DECOMMISSIONING';
export type ProbabilityOfOutflow = 'PROBABLE' | 'POSSIBLE' | 'REMOTE';

export interface Provision extends TimestampedNode {
  entity_id: string;
  label: string;
  provision_type: ProvisionType;
  present_obligation_basis: string;
  recognition_criteria_met: boolean;
  probability_of_outflow: ProbabilityOfOutflow;
  best_estimate: number;
  range_low?: number;
  range_high?: number;
  discount_rate?: number;
  carrying_amount: number;
  unwinding_to_date: number;
  expected_settlement_date?: string;
  reimbursement_asset_id?: string;
  last_reviewed_date: string;
}

// --- Fixed Asset + Depreciation nodes ---

// --- Lease accounting nodes ---

export type LeaseClassification = 'FINANCE' | 'OPERATING';

export interface LeasePaymentScheduleEntry {
  period_id: string;
  payment_date: string;
  lease_payment_amount: number;
  interest_portion: number;
  principal_portion: number;
  carrying_amount_after: number;
}

export interface RightOfUseAsset extends TimestampedNode {
  entity_id: string;
  label: string;
  lease_classification: LeaseClassification;
  cost_at_initial_recognition: number;
  accumulated_amortization: number;
  accumulated_impairment: number;
  carrying_amount: number;
  lease_term_months: number;
  incremental_borrowing_rate: number;
  acquisition_date: string;
  lease_end_date: string;
  tax_base: number;
  activity_ref_id?: string;
}

export interface LeaseLiability extends TimestampedNode {
  entity_id: string;
  label: string;
  initial_measurement: number;
  accumulated_interest: number;
  accumulated_payments: number;
  remaining_liability: number;
  lease_term_months: number;
  incremental_borrowing_rate: number;
  payment_schedule: LeasePaymentScheduleEntry[];
  tax_base: number;
}

// --- Fixed Asset + Depreciation nodes ---

export type PoolMethod = 'INDIVIDUAL' | 'POOLED';
export type DisposalRule = 'RECAPTURE_AND_TERMINAL_LOSS' | 'GAIN_LOSS_ON_DISPOSAL' | 'HALF_YEAR_DISPOSAL';

export interface FixedAsset extends TimestampedNode {
  entity_id: string;
  label: string;
  cost_at_acquisition: number;
  accumulated_depreciation: number;
  accumulated_impairment: number;
  carrying_amount: number;
  depreciation_method?: DepreciationMethod;
  useful_life_years?: number;
  salvage_value?: number;
  acquisition_date: string;
  disposal_date?: string;
  cgu_id?: string;
  tax_base: number;
  tax_accumulated_dep: number;
  activity_ref_id: string;
}

export interface AssetClassNode extends TimestampedNode {
  class_code: string;
  label: string;
  class_system: ClassSystem;
  jurisdiction: string;
  depreciation_method: DepreciationMethod;
  rate_pct?: number;
  useful_life_years?: number;
  salvage_value_pct: number;
  first_year_rule: FirstYearRule;
  pool_method: PoolMethod;
  disposal_rule: DisposalRule;
  accelerated_incentive_rate?: number;
  accelerated_incentive_expiry?: string;
  eligible_entity_types: string[];
  asset_examples: string[];
  legislation_reference: string;
  effective_from: string;
  effective_until?: string;
}

export interface UCCPool extends TimestampedNode {
  entity_id: string;
  asset_class_id: string;
  fiscal_year: string;
  opening_ucc: number;
  additions: number;
  disposals_proceeds: number;
  adjustments: number;
  base_for_cca: number;
  cca_claimed: number;
  cca_maximum: number;
  closing_ucc: number;
  recapture: number;
  terminal_loss: number;
}

export interface DepreciationScheduleEntry {
  period_id: string;
  charge: number;
  accumulated: number;
  carrying_remaining: number;
}

export interface DepreciationSchedule extends TimestampedNode {
  fixed_asset_id: string;
  schedule: DepreciationScheduleEntry[];
  last_charge_period_id?: string;
  revision_history: { revised_at: string; old_life: number; new_life: number; reason: string }[];
}

// --- Edge types ---

export interface ContributesToEdge {
  weight: number;
  confidence: number;
  lag_days: number;
  temporal_value_pct: number;
  ai_inferred: boolean;
  contribution_function: ContributionFunction;
  threshold_value?: number;
  elasticity?: number;
  is_cross_asset_edge: boolean;
  ontology_bridge: boolean;
}

export interface DependsOnEdge {
  dependency_class: DependencyClass;
  dependency_description: string;
}

export interface DelegatesToEdge {
  control_attenuation: number;
  sla_reference?: string;
}

// --- Related Party edge types (IAS 24) ---

export type RelatedPartyRelationshipType =
  | 'SHARED_BOARD' | 'SHARED_MANAGEMENT' | 'ECONOMIC_DEPENDENCE'
  | 'FAMILY' | 'SIGNIFICANT_INFLUENCE';

export type TransactionNature =
  | 'TRADE' | 'SERVICE' | 'DONATION' | 'GRANT'
  | 'MANAGEMENT_FEE' | 'SHARED_COST_ALLOCATION'
  | 'LICENSING' | 'LOAN';

export type ArmsLengthMethod = 'CUP' | 'COST_PLUS' | 'RESALE_MINUS' | 'TNMM' | 'PROFIT_SPLIT';

export interface RelatedPartyEdge {
  relationship_type: RelatedPartyRelationshipType;
  individuals_in_common: string[];
  effective_from: string;
  effective_until?: string;
  disclosure_required: boolean;
}

export interface RelatedPartyTransactionEdge {
  transaction_nature: TransactionNature;
  source_entity_id: string;
  target_entity_id: string;
  arms_length_validated: boolean;
  arms_length_method?: ArmsLengthMethod;
  source_journal_entry_id: string;
  target_journal_entry_id: string;
  tax_deductible_for_source: boolean;
  donation_receipt_issued?: boolean;
}

// --- Tax engine nodes ---

export type TaxProvisionStatus = 'DRAFT' | 'APPROVED' | 'POSTED';
export type TempDiffDirection = 'TAXABLE' | 'DEDUCTIBLE';
export type TaxAuthority = 'CRA' | 'IRS' | 'PROVINCIAL' | 'STATE';
export type AccountingTreatment = 'COST_REDUCTION' | 'INCOME_APPROACH' | 'ITC_METHOD';
export type QualificationBasis = 'AI_INFERRED' | 'MANUALLY_TAGGED' | 'RULE_MATCHED';
export type CreditCertainty = 'CLAIMED' | 'ASSESSED' | 'REALIZED';

export interface DeferredTaxPosition extends TimestampedNode {
  entity_id: string;
  period_id: string;
  source_node_id: string;
  source_node_type: string;
  accounting_carrying_amt: number;
  tax_base: number;
  temporary_difference: number;
  direction: TempDiffDirection;
  tax_rate_applicable: number;
  deferred_tax_amount: number;
  recognition_criteria_met: boolean;
}

export interface TaxProvision extends TimestampedNode {
  entity_id: string;
  period_id: string;
  current_tax_expense: number;
  deferred_tax_movement: number;
  total_tax_expense: number;
  credit_amount: number;
  effective_tax_rate: number;
  status: TaxProvisionStatus;
  journal_entry_id?: string;
}

export interface TaxCreditProgram extends TimestampedNode {
  program_code: string;
  label: string;
  jurisdiction: string;
  authority: TaxAuthority;
  credit_type: CreditType;
  credit_rate: number;
  credit_rate_enhanced?: number;
  expenditure_limit?: number;
  annual_cap?: number;
  carryforward_years?: number;
  carryback_years?: number;
  eligible_entity_types: string[];
  eligibility_criteria?: string;
  accounting_treatment: AccountingTreatment;
  legislation_reference: string;
  effective_from: string;
  effective_until?: string;
  filing_form?: string;
}

export interface TaxCreditClaim extends TimestampedNode {
  entity_id: string;
  program_id: string;
  period_id: string;
  fiscal_year: string;
  claim_status: ClaimStatus;
  eligible_expenditure_total: number;
  credit_amount_claimed: number;
  credit_amount_assessed?: number;
  refundable_portion: number;
  non_refundable_portion: number;
  applied_to_tax: number;
  carried_forward: number;
  carried_back: number;
  cash_received: number;
  eligible_node_ids: string[];
  ai_confidence?: number;
  journal_entry_id?: string;
}

// --- Equity expansion nodes (ShareClass, EquityAward, EPS) ---

export type ShareClassType = 'COMMON' | 'PREFERRED' | 'CLASS_A' | 'CLASS_B';
export type AwardType = 'STOCK_OPTION' | 'RSU' | 'PERFORMANCE_SHARE' | 'PHANTOM_STOCK' | 'SAR';
export type AwardStatus = 'GRANTED' | 'VESTING' | 'VESTED' | 'EXERCISED' | 'FORFEITED' | 'EXPIRED';
export type VestingType = 'TIME_BASED' | 'PERFORMANCE_BASED' | 'CLIFF' | 'GRADED';

export interface ShareClass extends TimestampedNode {
  entity_id: string;
  label: string;
  share_class_type: ShareClassType;
  par_value: number;
  authorized_shares: number;
  issued_shares: number;
  outstanding_shares: number;
  treasury_shares: number;
  share_capital_amount: number;
  currency: string;
  is_voting: boolean;
  dividend_rate?: number;
  is_cumulative_dividend: boolean;
  liquidation_preference?: number;
  conversion_ratio?: number;
  is_participating: boolean;
}

export interface EquityAward extends TimestampedNode {
  entity_id: string;
  share_class_id: string;
  label: string;
  award_type: AwardType;
  award_status: AwardStatus;
  grant_date: string;
  vesting_type: VestingType;
  vesting_period_months: number;
  cliff_months?: number;
  shares_granted: number;
  shares_vested: number;
  shares_forfeited: number;
  exercise_price?: number;
  fair_value_at_grant: number;
  total_compensation_cost: number;
  recognized_compensation: number;
  remaining_compensation: number;
  expiry_date?: string;
}

// --- IFRS 15 Revenue Recognition nodes ---

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'IMPAIRED';
export type POSatisfactionMethod = 'POINT_IN_TIME' | 'OVER_TIME';
export type OverTimeMeasure = 'INPUT' | 'OUTPUT' | 'STRAIGHT_LINE';
export type VariableConsiderationType = 'DISCOUNT' | 'REBATE' | 'PENALTY' | 'BONUS' | 'PRICE_CONCESSION' | 'RIGHT_OF_RETURN';
export type ConstraintEstimateMethod = 'EXPECTED_VALUE' | 'MOST_LIKELY_AMOUNT';

export interface RevenueContract extends TimestampedNode {
  entity_id: string;
  label: string;
  customer_name: string;
  customer_id?: string;
  contract_status: ContractStatus;
  inception_date: string;
  completion_date?: string;
  transaction_price: number;
  allocated_transaction_price: number;
  variable_consideration_estimate: number;
  constraint_applied: boolean;
  currency: string;
  period_id: string;
  total_revenue_recognized: number;
  contract_asset: number;
  contract_liability: number;
}

export interface PerformanceObligation extends TimestampedNode {
  entity_id: string;
  contract_id: string;
  label: string;
  standalone_selling_price: number;
  allocated_transaction_price: number;
  satisfaction_method: POSatisfactionMethod;
  over_time_measure?: OverTimeMeasure;
  progress_pct: number;
  revenue_recognized: number;
  is_distinct: boolean;
  is_satisfied: boolean;
  satisfied_date?: string;
}

export interface VariableConsideration extends TimestampedNode {
  entity_id: string;
  contract_id: string;
  consideration_type: VariableConsiderationType;
  estimate_method: ConstraintEstimateMethod;
  estimated_amount: number;
  constraint_adjusted_amount: number;
  constraint_reason?: string;
  is_constrained: boolean;
  resolved_amount?: number;
  resolved: boolean;
}

// --- Inventory nodes (IAS 2 / ASC 330) ---

export type InventoryCostMethod = 'FIFO' | 'WEIGHTED_AVG' | 'LIFO';
export type InventoryCategory = 'RAW_MATERIAL' | 'WORK_IN_PROGRESS' | 'FINISHED_GOODS' | 'MERCHANDISE';

export interface InventoryItem extends TimestampedNode {
  entity_id: string;
  label: string;
  sku: string;
  category: InventoryCategory;
  unit_of_measure: string;
  quantity_on_hand: number;
  unit_cost: number;
  total_cost: number;
  nrv_per_unit?: number;
  nrv_total?: number;
  nrv_writedown: number;
  carrying_amount: number;
  cost_method: InventoryCostMethod;
  currency: string;
  reorder_point?: number;
  is_active: boolean;
}

export interface InventoryLot extends TimestampedNode {
  entity_id: string;
  item_id: string;
  lot_number: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  acquisition_date: string;
  remaining_quantity: number;
  is_depleted: boolean;
}

export interface TaxCreditBalance extends TimestampedNode {
  entity_id: string;
  program_id: string;
  balance_as_of: string;
  opening_balance: number;
  credits_earned: number;
  credits_applied: number;
  credits_expired: number;
  credits_carried_back: number;
  closing_balance: number;
  vintages: string;
}
