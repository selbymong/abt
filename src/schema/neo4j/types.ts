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
  | 'CUSTOMER_RELATIONSHIP_ASSET' | 'FUND' | 'TAX_CREDIT_CLAIM' | 'OCI';

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
