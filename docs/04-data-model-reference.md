# 04 — Data Model Reference (v1.2 — Complete)

All node and edge property schemas. This is the canonical reference.
Supersedes v1.0 data model for any property that has been revised.

Changes from v1.0 marked with: [v1.2-A] multi-entity, [v1.2-B] tax credits,
[v1.2-C] asset classes, [v1.2-D] configuration, [v1.2-E] OCI/equity.

---

## Investment Layer Nodes

### Resource
```
id, label, entity_id,
resource_type (CASH|PEOPLE|TIME|EQUIPMENT|EXTERNAL_SERVICE),
allocation_pct: float, cost_monetary: numeric, cost_time_hours: float?,
currency: string,
[+ Epistemic properties]
[+ Control properties]
created_at, updated_at
```

### Activity
```
id, label, entity_id,
status (PLANNED|IN_PROGRESS|COMPLETED|CANCELLED),
cost_monetary: numeric, cost_time_hours: float?,
start_date: date?, end_date: date?,
project_id: UUID?, initiative_id: UUID?,
[+ Epistemic properties]
[+ Control properties]
created_at, updated_at
```

### Project
```
id, label, entity_id,
status (PLANNED|IN_PROGRESS|COMPLETED|CANCELLED),
budget: numeric, spent_to_date: numeric,
initiative_id: UUID?,
[+ Epistemic properties]
[+ Control properties]
created_at, updated_at
```

### Initiative
```
id, label, entity_id,
status (PLANNED|IN_PROGRESS|COMPLETED|CANCELLED),
budget: numeric, time_horizon_months: int,
[+ Epistemic properties]
[+ Control properties]
created_at, updated_at
```

---

## Intermediary Layer Nodes

### Metric
```
id, label, entity_id,
metric_type (LEADING|COINCIDENT|LAGGING),
current_value: float, target_value: float, unit: string,
measurement_confidence: {
  validity: float, precision: float,
  coverage: float, freshness: float, composite: float
},
[+ Epistemic properties]
created_at, updated_at
```

### Capability
```
id, label, entity_id,
capability_level (NASCENT|DEVELOPING|ESTABLISHED|MATURE),
capacity_threshold: float?,
build_cost: numeric,
[+ Epistemic properties]
[+ Control properties]
created_at, updated_at
```

### Asset / Product
```
id, label, entity_id,
asset_type (PRODUCT|BRAND|IP|INFRASTRUCTURE|DATA),
book_value: numeric, depreciation_rate: float?, growth_rate: float?,
fair_value: numeric?,
fair_value_hierarchy (LEVEL_1|LEVEL_2|LEVEL_3)?,
[+ Epistemic properties]
[+ Control properties]
created_at, updated_at
```

### CustomerRelationshipAsset
```
id, label, entity_id,
nps: float?, csat: float?, churn_rate: float?,
retention_rate: float?, expansion_rate: float?,
mc_validity, mc_precision, mc_coverage, mc_freshness, mc_composite,
[+ Epistemic properties — value_state typically REALIZED]
control_class: PROXIMATE_EXT, control_score: 0.6,
observability_score: 0.8, response_window_days: 30,
created_at, updated_at
```

### WorkforceAsset (v1.1)
```
id, label, entity_id,
enps: float?,              LEADING — intent-to-stay
engagement_score: float?,  COINCIDENT
turnover_rate: float?,     LAGGING — 50–150% salary to replace
absenteeism_rate: float?,  COINCIDENT — early warning
internal_fill_rate: float?, LEADING — career health
mc_validity, mc_precision, mc_coverage, mc_freshness, mc_composite,
[+ Epistemic properties]
control_class: DELEGATED, control_score: 0.7,
observability_score: 0.7, response_window_days: 60,
created_at, updated_at
```

---

## Outcome Layer Nodes

### Outcome
```
id, label, entity_id,
ontology:          enum    FINANCIAL | MISSION                          [v1.2-A]
outcome_type:      enum    IMPROVE_REVENUE | NEW_REVENUE | MITIGATE_EXPENSE |
                           DELIVER_MISSION | SUSTAIN_FUNDING | STEWARD_RESOURCES  [v1.2-A]
measurement_unit:  string? 'beneficiaries', 'program_hours', etc. for mission [v1.2-A]
stream_id: string?,
target_delta: numeric, realized_delta: numeric,
currency: string,
period_start: date, period_end: date,
[+ all Epistemic properties]
[+ Control properties]
created_at, updated_at
```

Financial ontology (FOR_PROFIT): IMPROVE_REVENUE, NEW_REVENUE, MITIGATE_EXPENSE
Mission ontology (NOT_FOR_PROFIT): DELIVER_MISSION, SUSTAIN_FUNDING, STEWARD_RESOURCES
Ontology boundary is a hard partition for the weight learner — no cross-ontology gradient propagation.

---

## Social Layer Nodes

### SocialConstraint
```
id, label, entity_id,
constraint_type: string,
violation_risk_score: float,
rationale: string,
created_at, updated_at
```

### StakeholderAsset
```
id, label, entity_id,
stakeholder_type: string,
tolerance_band_pct: float,
created_at, updated_at
```

---

## Obligation Nodes

### Obligation
```
id, label, entity_id,
must_do: true (always),
obligation_type: string,
due_date: date, recurrence: string?,
non_compliance_risk: float,
penalty_exposure: numeric,
status (PENDING|COMPLETED|OVERDUE),
created_at, updated_at
```

---

## Epistemic Nodes

### EpistemicActivity
```
id, label, entity_id,
activity_type (RESEARCH|PILOT|AB_TEST|AUDIT|SURVEY|BENCHMARK),
cost: numeric,
target_node_id: UUID,
target_property: string,
expected_uncertainty_delta: float,
actual_uncertainty_delta: float?,
status (PLANNED|IN_PROGRESS|COMPLETED),
created_at, updated_at
```

---

## Cashflow Nodes

### CashFlowEvent
```
id, label, entity_id,
direction (INFLOW|OUTFLOW),
amount: numeric, currency: string, functional_amount: numeric,
scheduled_date: date, earliest_date: date, latest_date: date,
discount_offered_pct: float?, penalty_rate_daily: float?,
counterparty_id: UUID, relationship_sensitivity: float,
transaction_currency: string,
transaction_currency_amount: numeric?,
fx_gain_loss_to_date: numeric?,
bank_account_id: UUID?,
reconciliation_status (UNRECONCILED|RECONCILED|MANUALLY_CLEARED)?,
status (PENDING|SETTLED|CANCELLED),
created_at, updated_at
```

### FloatWindow (AI-computed)
```
id,
opportunity_type (DELAY_PAYABLE|ACCELERATE_RECEIVABLE|INVEST_SURPLUS),
window_days: int, float_amount: numeric,
opportunity_value: numeric,
discount_cost: numeric?, net_value: numeric,
annualized_discount_rate: float?,
created_at
```

### PaymentTerm
```
id, label,
net_days: int, discount_days: int?, discount_pct: float?,
penalty_rate_daily: float?,
created_at
```

### CreditFacility
```
id, label, entity_id,
facility_type (REVOLVER|LINE_OF_CREDIT|TERM_LOAN),
limit: numeric, drawn: numeric, available: numeric,
interest_rate: float, rate_type (FIXED|VARIABLE),
maturity_date: date,
created_at, updated_at
```

---

## Multi-Entity Nodes

### Entity [v1.2-A — REVISED]
```
id, label,
entity_type:             enum    FOR_PROFIT | NOT_FOR_PROFIT               [v1.2-A]
tax_status:              enum    TAXABLE | EXEMPT                           [v1.2-A]
reporting_framework:     enum    IFRS | ASPE | US_GAAP | ASNFPO | ASC_958  [v1.2-A]
jurisdiction:            string  ISO 3166-1 alpha-2 (CA, US, etc.)         [v1.2-A]
functional_currency:     string  ISO 4217
outcome_ontology:        enum    FINANCIAL | MISSION                        [v1.2-A]
fund_accounting_enabled: bool    true for NOT_FOR_PROFIT                    [v1.2-A]
registration_number:     string  CRA BN, IRS EIN, etc.                     [v1.2-A]
fiscal_year_end:         string  MM-DD format                               [v1.2-A]
consolidation_method:    enum    FULL | EQUITY | PROPORTIONATE | EXCLUDED
ownership_pct:           float
nci_pct:                 float
is_parent:               bool
consolidation_group_id:  UUID?
acquisition_date:        date?
reporting_lag_days:      int,
created_at, updated_at
```

### ConsolidationGroup
```
id, label, parent_entity_id: UUID,
functional_currency: string, entity_ids: UUID[],
minority_interest_method (PROPORTIONATE|FULL_GOODWILL),
intercompany_threshold: numeric,
created_at, updated_at
```

### OwnershipInterest
```
id, investor_entity_id: UUID, investee_entity_id: UUID,
ownership_pct: float, acquisition_cost: numeric,
net_assets_at_acquisition: numeric,
goodwill: numeric,
carrying_value: numeric,
acquisition_date: date, disposal_date: date?,
created_at, updated_at
```

### CurrencyTranslation
```
id, entity_id: UUID, period_id: UUID,
functional_currency: string, presentation_currency: string,
average_rate: float, closing_rate: float,
revenue_translated: numeric, expense_translated: numeric,
asset_translated: numeric, liability_translated: numeric,
cta_current_period: numeric,
cumulative_cta: numeric,
created_at
```

### Fund [v1.2-A — NEW]
```
id:                     UUID
entity_id:              UUID        must reference NOT_FOR_PROFIT entity
fund_type:              enum        UNRESTRICTED | TEMPORARILY_RESTRICTED |
                                    PERMANENTLY_RESTRICTED | ENDOWMENT
label:                  string      e.g., 'General Operations', 'Youth Program Grant 2026'
restriction_description: string?    donor-imposed terms; null for UNRESTRICTED
restriction_expiry:     date?       for time-restricted funds
restriction_purpose:    string?     for purpose-restricted funds
created_at, updated_at
```

---

## GL Nodes

### JournalEntry — see docs/03-gl-specification.md for full schema

### LedgerLine [v1.2-A — REVISED]
```
id:                UUID
journal_entry_id:  UUID
side:              enum        DEBIT | CREDIT
amount:            numeric     ALWAYS POSITIVE
currency:          string      ISO 4217
functional_amount: numeric     in entity functional currency
fx_rate:           float?
node_ref_id:       UUID        THE KEY FIELD — graph node this posts to
node_ref_type:     enum        ACTIVITY | PROJECT | INITIATIVE | OUTCOME |
                               CASHFLOWEVENT | TEMPORAL_CLAIM | FIXED_ASSET |
                               GOODWILL | PROVISION | WORKFORCE_ASSET |
                               CUSTOMER_RELATIONSHIP_ASSET | FUND |
                               TAX_CREDIT_CLAIM | OCI                       [v1.2 expanded]
economic_category: enum        ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE
statutory_code:    string?     from StatutoryMapping
fund_id:           UUID?       required when entity.fund_accounting_enabled = true  [v1.2-A]
created_at
```

### AccountingPeriod — see docs/03-gl-specification.md for full schema

### TemporalClaim — see docs/03-gl-specification.md for full schema

### Provision — see docs/03-gl-specification.md for full schema

### FixedAsset [v1.2-C — REVISED]
```
id, label, entity_id,
cost_at_acquisition:         numeric    never changes
accumulated_depreciation:    numeric
accumulated_impairment:      numeric    separate from depreciation
carrying_amount:             numeric    computed
depreciation_method:         enum?      nullable — inherits from AssetClass if null   [v1.2-C]
useful_life_years:           float?     nullable — inherits from AssetClass if null   [v1.2-C]
salvage_value:               numeric?   nullable — inherits from AssetClass if null   [v1.2-C]
acquisition_date:            date
disposal_date:               date?
cgu_id:                      UUID?
tax_base:                    numeric    tax depreciation base
tax_accumulated_dep:         numeric    tax depreciation taken to date
activity_ref_id:             UUID       Activity this asset supports
created_at, updated_at
```
REMOVED in v1.2-C: asset_class (enum), tax_base_method, tax_class
REPLACED BY: BELONGS_TO edges to AssetClass nodes (up to 3: ACCOUNTING, CCA, MACRS)

### AssetClass [v1.2-C — NEW]
```
id:                          UUID
class_code:                  string     e.g., CA-CCA-50, US-MACRS-5, ACCT-IT-EQUIP
label:                       string
class_system:                enum       CCA | MACRS | ACCOUNTING
jurisdiction:                string     CA, US, CA-ON, etc.
depreciation_method:         enum       STRAIGHT_LINE | DECLINING_BALANCE |
                                        DOUBLE_DECLINING | UNITS_OF_PRODUCTION |
                                        SUM_OF_YEARS | GDS_TABLE | ADS_TABLE
rate_pct:                    float?     for declining balance; null for SL/table
useful_life_years:           float?     for SL methods; null for DB
salvage_value_pct:           float      default 0.0 for CCA/MACRS
first_year_rule:             enum       HALF_YEAR | MID_QUARTER | MID_MONTH |
                                        FULL_YEAR | NONE
pool_method:                 enum       INDIVIDUAL | POOLED
disposal_rule:               enum       RECAPTURE_AND_TERMINAL_LOSS |
                                        GAIN_LOSS_ON_DISPOSAL | HALF_YEAR_DISPOSAL
accelerated_incentive_rate:  float?     enhanced first-year rate (AIIP, §168(k))
accelerated_incentive_expiry: date?
eligible_entity_types:       [enum]     [FOR_PROFIT] | [NOT_FOR_PROFIT] | both
asset_examples:              [string]   guidance for classification
legislation_reference:       string
effective_from:              date
effective_until:             date?
created_at
```

### UCCPool [v1.2-C — NEW, CCA-specific]
```
id:                 UUID
entity_id:          UUID        Canadian entity only
asset_class_id:     UUID        references CCA AssetClass
fiscal_year:        string
opening_ucc:        numeric
additions:          numeric
disposals_proceeds: numeric
adjustments:        numeric     gov't assistance, ITC reductions
base_for_cca:       numeric     computed; half-year rule applied
cca_claimed:        numeric     actual claim (≤ cca_maximum)
cca_maximum:        numeric     base × rate
closing_ucc:        numeric
recapture:          numeric     if closing < 0 after disposals
terminal_loss:      numeric     if pool empty with positive UCC
created_at
```

### DepreciationSchedule
```
id, fixed_asset_id: UUID,
schedule: [{period_id, charge, accumulated, carrying_remaining}],
last_charge_period_id: UUID?,
revision_history: [{revised_at, old_life, new_life, reason}]
```

---

## Business Combination Nodes

### BusinessCombination
```
id, label,
acquirer_entity_id: UUID, acquiree_entity_id: UUID,
acquisition_date: date,
total_consideration: numeric,
consideration_cash: numeric, consideration_shares: numeric,
consideration_contingent: numeric,
fair_value_net_assets: numeric,
ownership_pct_acquired: float,
goodwill_arising: numeric,
nci_fair_value: numeric?,
full_goodwill: numeric?,
ppa_complete: bool,
functional_currency: string,
created_at
```

### Goodwill
```
id, business_combination_id: UUID,
acquiree_entity_id: UUID, cgu_id: UUID,
gross_amount: numeric (immutable),
accumulated_impairment: numeric (only increases),
carrying_amount: numeric (computed),
currency: string,
is_full_goodwill: bool, nci_goodwill_pct: float?,
last_impairment_test_id: UUID?,
last_test_date: date?, last_test_result (PASS|IMPAIRED)?,
tax_deductible: bool, tax_base: numeric,
disposal_date: date?,
created_at
```

### CashGeneratingUnit
```
id, label, entity_ids: UUID[],
goodwill_ids: UUID[],
allocated_goodwill_carrying: numeric,
last_impairment_test_date: date?,
last_recoverable_amount: numeric?,
viu_discount_rate: float,
viu_horizon_years: int,
viu_terminal_growth_rate: float,
created_at, updated_at
```

### ImpairmentTest
```
id, goodwill_id: UUID, cgu_id: UUID, period_id: UUID,
test_date: date,
carrying_amount_tested: numeric,
viu_computed: numeric,
viu_discount_rate: float, viu_horizon_years: int,
fvlcod: numeric?,
recoverable_amount: numeric,
impairment_loss: numeric,
result (PASS|IMPAIRED),
headroom: numeric,
approved_by: UUID,
created_at
```

### PurchasePriceAdjustment
```
id, business_combination_id: UUID,
target_node_id: UUID, target_node_type: enum,
book_value_at_acquisition: numeric,
fair_value_at_acquisition: numeric,
adjustment_amount: numeric,
intangible_category (CUSTOMER_LIST|TECHNOLOGY|BRAND|NONCOMPETE|
                     CONTRACT_BACKLOG|IN_PROCESS_RD|NONE),
useful_life_years: float?,
amortization_method (STRAIGHT_LINE|ACCELERATED)?,
amortized_to_date: numeric,
remaining_book_value: numeric,
tax_basis_adjustment: numeric?,
provisional: bool
```

---

## Financial Instrument Nodes

### FinancialInstrument
```
id, entity_id,
instrument_type (CASH|RECEIVABLE|PAYABLE|LOAN|BOND|
                 EQUITY_INVESTMENT|DERIVATIVE|HEDGE_INSTRUMENT),
ifrs9_classification (AMORTISED_COST|FVOCI_DEBT|FVOCI_EQUITY|FVTPL),
host_node_id: UUID,
fair_value: numeric?, fair_value_hierarchy (LEVEL_1|LEVEL_2|LEVEL_3)?,
amortised_cost: numeric?, effective_interest_rate: float?,
ecl_stage (STAGE_1|STAGE_2|STAGE_3),
ecl_allowance: numeric,
gross_carrying_amount: numeric,
net_carrying_amount: numeric,
created_at, updated_at
```

### HedgeRelationship
```
id, entity_id,
hedge_type (FAIR_VALUE|CASH_FLOW|NET_INVESTMENT),
hedging_instrument_id: UUID,
hedged_item_id: UUID,
designation_date: date,
hedge_ratio: float,
effectiveness_method: string,
prospective_test (PASS|FAIL),
retrospective_eff: float,
oci_balance: numeric,
ineffectiveness_to_pnl: numeric,
created_at, updated_at
```

---

## Tax Credit Nodes [v1.2-B — ALL NEW]

### TaxCreditProgram
```
id:                      UUID
program_code:            string     CA-SRED, US-IRC41-RD, CA-GST-REBATE, etc.
label:                   string
jurisdiction:            string     CA, US, CA-ON, US-CA
authority:               enum       CRA | IRS | PROVINCIAL | STATE
credit_type:             enum       REFUNDABLE | NON_REFUNDABLE |
                                    PARTIALLY_REFUNDABLE | DIRECT_PAY
credit_rate:             float      base rate (e.g., 0.35)
credit_rate_enhanced:    float?     enhanced rate if applicable
expenditure_limit:       numeric?   max eligible spend for enhanced rate
annual_cap:              numeric?
carryforward_years:      int?       20 for SR&ED, 20 for IRC §41
carryback_years:         int?       3 for SR&ED, 1 for IRC §41
eligible_entity_types:   [enum]
eligibility_criteria:    JSON       machine-readable rules for AI identification
accounting_treatment:    enum       COST_REDUCTION | INCOME_APPROACH | ITC_METHOD
legislation_reference:   string
effective_from:          date
effective_until:         date?
filing_form:             string     T661, Form 6765, etc.
created_at
```

### TaxCreditClaim
```
id:                          UUID
entity_id:                   UUID
program_id:                  UUID        references TaxCreditProgram
period_id:                   UUID
fiscal_year:                 string
claim_status:                enum        DRAFT | AI_IDENTIFIED | REVIEWED |
                                         APPROVED | FILED | ASSESSED | ADJUSTED | CLOSED
eligible_expenditure_total:  numeric
credit_amount_claimed:       numeric
credit_amount_assessed:      numeric?
refundable_portion:          numeric
non_refundable_portion:      numeric
applied_to_tax:              numeric
carried_forward:             numeric
carried_back:                numeric
cash_received:               numeric
eligible_node_ids:           [UUID]
ai_confidence:               float?
reviewed_by:                 UUID?
filed_date:                  date?
assessment_date:             date?
adjustment_reason:           string?
journal_entry_id:            UUID?
cashflow_event_id:           UUID?
created_at, updated_at
```

### TaxCreditBalance
```
id:                UUID
entity_id:         UUID
program_id:        UUID
balance_as_of:     date
opening_balance:   numeric
credits_earned:    numeric
credits_applied:   numeric
credits_expired:   numeric
credits_carried_back: numeric
closing_balance:   numeric
vintages:          JSON       [{year, amount, expires_at}] FIFO expiry
created_at
```

---

## Tax Engine Nodes

### DeferredTaxPosition
```
source_node_id:           UUID
accounting_carrying_amt:  float
tax_base:                 float
temporary_difference:     float
direction:                enum    TAXABLE (DTL) | DEDUCTIBLE (DTA)
tax_rate_applicable:      float
deferred_tax_amount:      float
recognition_criteria_met: bool
```

### TaxProvision
```
id, entity_id, period_id,
current_tax_expense:     numeric
deferred_tax_movement:   numeric
total_tax_expense:       numeric
credit_amount:           numeric     [v1.2-B] credits applied
effective_tax_rate:      float
status:                  enum    DRAFT | APPROVED | POSTED
journal_entry_id:        UUID?
created_at
```

---

## Equity Nodes [v1.2-E — ALL NEW]

### RetainedEarnings
```
id:                 UUID
entity_id:          UUID
fund_id:            UUID?       null for FOR_PROFIT; required for NFP
period_id:          UUID
opening_balance:    numeric
net_income:         numeric
dividends_declared: numeric     FOR_PROFIT only
other_adjustments:  numeric
closing_balance:    numeric
created_at
```

### OtherComprehensiveIncome
```
id:                 UUID
entity_id:          UUID
period_id:          UUID
component:          enum    CTA_COMPONENT | CASHFLOW_HEDGE |
                            NET_INVESTMENT_HEDGE | FVOCI_DEBT |
                            FVOCI_EQUITY | DB_PENSION | REVALUATION_SURPLUS
opening_balance:    numeric
current_period:     numeric
recycled_to_pnl:    numeric
closing_balance:    numeric
source_node_id:     UUID?
source_node_type:   enum?   CURRENCY_TRANSLATION | HEDGE | FINANCIAL_INSTRUMENT | PENSION
created_at
```

### EquitySection (presentation)
```
id:                    UUID
entity_id:             UUID
period_id:             UUID
share_capital:         numeric     Phase 2+ (ShareClass nodes)
retained_earnings:     numeric
accumulated_oci:       numeric
total_equity:          numeric
nci_equity:            numeric?
total_equity_and_nci:  numeric
created_at
```

---

## Related Party Nodes [v1.2-A — ALL NEW]

RELATED_PARTY and RELATED_PARTY_TRANSACTION are edges, not nodes.
See Edge Reference below.

---

## Epistemic Properties (on every node)

```
value_state:            FORECASTED | ESTIMATED | VALIDATED | REALIZED | STALE_ESTIMATED
uncertainty_type:       ALEATORY | EPISTEMIC | MIXED
uncertainty_score:      float 0–1
ci_point_estimate:      numeric
ci_lower_bound:         numeric
ci_upper_bound:         numeric
ci_confidence_pct:      float
ci_distribution:        NORMAL | SKEWED_HIGH | SKEWED_LOW | BIMODAL
ci_estimation_method:   ANALOGICAL | DELPHI | PARAMETRIC | BOTTOM_UP
calibration_factor:     float (starts 1.0)
epistemic_priority:     float (AI-computed EVOI)
expires_at:             timestamp?
```

## Control Properties (on controllable nodes)

```
control_class:          DIRECT | DELEGATED | PROXIMATE_EXT | DISTAL_EXT | FORCE_MAJEURE
control_score:          float 0–1
effective_control:      float (computed: product along DELEGATES_TO chain)
observability_score:    float 0–1
response_window_days:   int
volatility:             float
scenario_set_id:        [UUID]
```

---

## Edge Reference

### CONTRIBUTES_TO (core)
```
weight: float 0–1, confidence: float 0–1,
lag_days: int, temporal_value_pct: float,
ai_inferred: bool,
contribution_function: LINEAR | LOGARITHMIC | EXPONENTIAL |
                       THRESHOLD | BIMODAL | S_CURVE,
threshold_value: float?, elasticity: float?,
is_cross_asset_edge: bool,
ontology_bridge: bool       [v1.2-A] true for cross-ontology edges
```

### DEPENDS_ON
```
dependency_class: HARD_BLOCK | SOFT_DEPENDENCY | ENABLES,
dependency_description: string
```

### DELEGATES_TO
```
control_attenuation: float 0–1,
sla_reference: string?
```

### INTERCOMPANY_MATCH (parent-subsidiary only)
```
source_entity_id: UUID, target_entity_id: UUID,
source_ledger_line_id: UUID, target_ledger_line_id: UUID,
elimination_amount: numeric
```

### RELATED_PARTY [v1.2-A — NEW]
```
relationship_type:      SHARED_BOARD | SHARED_MANAGEMENT | ECONOMIC_DEPENDENCE |
                        FAMILY | SIGNIFICANT_INFLUENCE
individuals_in_common:  [string]
effective_from:         date
effective_until:        date?
disclosure_required:    bool
```

### RELATED_PARTY_TRANSACTION [v1.2-A — NEW]
```
transaction_nature:       TRADE | SERVICE | DONATION | GRANT |
                          MANAGEMENT_FEE | SHARED_COST_ALLOCATION |
                          LICENSING | LOAN
source_entity_id:         UUID
target_entity_id:         UUID
arms_length_validated:    bool
arms_length_method:       CUP | COST_PLUS | RESALE_MINUS | TNMM | PROFIT_SPLIT
source_journal_entry_id:  UUID
target_journal_entry_id:  UUID
tax_deductible_for_source: bool
donation_receipt_issued:  bool?
```

### QUALIFIES_FOR [v1.2-B — NEW]
```
qualification_basis:     AI_INFERRED | MANUALLY_TAGGED | RULE_MATCHED
eligible_amount:         numeric
eligibility_confidence:  float
expenditure_category:    SALARY | MATERIALS | SUBCONTRACTOR |
                         OVERHEAD_PROXY | CAPITAL | OTHER
claim_id:                UUID?
reviewer_accepted:       bool?
rejection_reason:        string?
```

### REDUCES_COST_OF [v1.2-B — NEW]
```
cost_reduction_amount:   numeric
cost_reduction_pct:      float
certainty:               CLAIMED | ASSESSED | REALIZED
```

### BELONGS_TO [v1.2-C — NEW]
```
class_system:            CCA | MACRS | ACCOUNTING
override_rate_pct:       float?
override_useful_life:    float?
override_salvage_value:  float?
override_reason:         string?
effective_from:          date
reclassified_from:       UUID?
```

### Epistemic edges
```
REDUCES_UNCERTAINTY_OF:  expected_uncertainty_delta, actual_uncertainty_delta, target_property
VALIDATES:               new CI bounds
IMPROVES_COVERAGE_OF:    coverage_delta
CALIBRATES:              realized vs estimated comparison
```

### Cashflow edges
```
GENERATES:    Activity → CashFlowEvent
CREATES:      CashFlowEvent → FloatWindow
FINANCES:     CreditFacility → CashFlowEvent (draw_amount, rate, repayment_date)
GOVERNED_BY:  CashFlowEvent → PaymentTerm
```

### Social edges
```
PROHIBITS:    SocialConstraint → Activity (violation_risk_score, rationale)
PROTECTS:     Obligation → All outcomes (penalty_exposure, non_compliance_risk)
```
