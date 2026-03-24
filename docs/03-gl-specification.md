# 03 — Graph-Native GL Specification

## Core Innovation: Node References Replace COA Codes

Traditional journal entry:
```
DR 5210 (Advertising Expense)  $50,000
CR 2000 (Accounts Payable)     $50,000
```

Graph-native journal entry:
```
DR Activity("Q3 Google Campaign")  $50,000
CR CashFlowEvent("Google Invoice") $50,000
```

The Activity node already has CONTRIBUTES_TO edges to CustomerRelationshipAsset → Outcomes.
Attribution is structural, not an allocation rule. The COA code (5210) is a derived
property populated by StatutoryMapping rules for regulatory reporting.

## JournalEntry Node

```
id:                UUID        immutable
entry_date:        date        when the economic event occurred (valid_time_start)
posting_date:      date        when posted (may differ for accruals)
valid_time_start:  date        = entry_date (REQUIRED — bi-temporal)
valid_time_end:    date?       null = open-ended; set for reversals
transaction_time_start: timestamp  = DB insertion time (REQUIRED — bi-temporal, immutable)
transaction_time_end:   timestamp? set when superseded by correction (never deleted)
period_id:         UUID        AccountingPeriod reference
entity_id:         UUID        which legal entity
entry_type:        enum        OPERATIONAL | ACCRUAL | DEFERRAL | REVERSAL |
                               ADJUSTMENT | ELIMINATION | IMPAIRMENT
reference:         string      source document reference
narrative:         string      description (AI generates from node context if blank)
total_debit:       numeric     MUST EQUAL total_credit — enforced before write
total_credit:      numeric
posted_by:         UUID        user ID
approved_by:       UUID?       required above materiality threshold
ai_generated:      bool
reversal_of:       UUID?       for REVERSAL type
sequence_number:   int         monotonic within period×entity
idempotency_key:   UUID        prevents duplicate posting on retry
```

## LedgerLine Node

```
id:                UUID
journal_entry_id:  UUID        parent entry
side:              enum        DEBIT | CREDIT
amount:            numeric     ALWAYS POSITIVE — side determines direction
currency:          string      ISO 4217
functional_amount: numeric     in entity functional currency
fx_rate:           float?      if currency ≠ functional currency
node_ref_id:       UUID        THE KEY FIELD — the graph node this posts to
node_ref_label:    string      denormalized label for query speed
node_ref_type:     enum        ACTIVITY | PROJECT | INITIATIVE | OUTCOME |
                               RESOURCE | CASHFLOWEVENT | WORKFORCE_ASSET |
                               CUSTOMER_RELATIONSHIP_ASSET | CAPABILITY | ASSET |
                               OBLIGATION | TEMPORAL_CLAIM | PROVISION |
                               FIXED_ASSET | GOODWILL | OWNERSHIP_INTEREST |
                               EQUITY | FINANCIAL_INSTRUMENT | PURCHASE_PRICE_ADJUSTMENT
economic_category: enum        ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE
statutory_code:    string?     populated by StatutoryMapping (the old COA code)
entity_id:         UUID        denormalized for query partitioning
period_id:         UUID        denormalized
```

## TemporalClaim Node — Accrual Accounting

Represents a right to receive or obligation to deliver that is economically established
but not yet cash-settled. One node type handles all four accrual cases.

```
id:                    UUID
claim_type:            enum    ACCRUED_REVENUE | DEFERRED_REVENUE |
                               PREPAID_EXPENSE | ACCRUED_LIABILITY
direction:             enum    RECEIVABLE | PAYABLE
original_amount:       numeric never changes after creation
recognized_to_date:    numeric cumulative recognized
remaining:             numeric original − recognized_to_date
currency:              string
recognition_method:    enum    STRAIGHT_LINE | PERCENTAGE_COMPLETE |
                               MILESTONE | USAGE_BASED
recognition_schedule:  [{period_id, amount, recognized_at}]
source_node_id:        UUID    the economic node this arises from
source_node_type:      enum
settlement_node_id:    UUID?   the CashFlowEvent that settles this (set when cash moves)
outcome_node_id:       UUID?   for revenue claims: Outcome that receives realized_delta
period_id_opened:      UUID
period_id_closed:      UUID?   null until fully unwound
status:                enum    OPEN | PARTIALLY_RECOGNIZED | FULLY_RECOGNIZED | WRITTEN_OFF
auto_reverse:          bool    true for pure timing accruals (wages at month-end)
collectability_score:  float   0–1 (IFRS 9 proxy — see FinancialInstrument for full ECL)
ecl_allowance:         float   expected credit loss provision (REQUIRED — see IFRS 9)
ecl_stage:             enum    STAGE_1 | STAGE_2 | STAGE_3
tax_recognition_basis: enum    CASH_BASIS | ACCRUAL_BASIS
materiality_flag:      bool    AI sets when remaining > org materiality threshold
```

### Critical Distinction: TemporalClaim vs Provision
```
TemporalClaim: CERTAIN amount, CERTAIN counterparty, TIMING difference only
               "We owe Google $50k for October services — paid in November"

Provision:     UNCERTAIN amount, uncertain counterparty, may never occur
               "Estimated warranty claims on products sold — $45k expected"

DO NOT use TemporalClaim for warranties, restructuring, legal claims, or
environmental obligations. These are Provision nodes.
```

## Provision Node — IAS 37 / ASC 450

```
id:                       UUID
provision_type:           enum    WARRANTY | RESTRUCTURING | LEGAL_CLAIM |
                                  ENVIRONMENTAL | ONEROUS_CONTRACT | DECOMMISSIONING
present_obligation_basis: string  description of past event
recognition_criteria_met: bool    all three IAS 37 criteria satisfied
probability_of_outflow:   enum    PROBABLE (>50%) | POSSIBLE (5–50%) | REMOTE (<5%)
                                  ONLY PROBABLE is recognized on balance sheet
best_estimate:            numeric most likely outcome
range_low:                numeric? lower bound of range
range_high:               numeric?
discount_rate:            float?  if time value is material (pre-tax risk-free)
carrying_amount:          numeric updated at each reporting date
unwinding_to_date:        numeric cumulative interest (finance cost in P&L)
expected_settlement_date: date?
reimbursement_asset_id:   UUID?   separate asset if third-party reimbursement
last_reviewed_date:       date    MUST be reviewed at each reporting date
```

## AccountingPeriod Node

```
id:                        UUID
label:                     string  e.g. "2025-Q3"
period_type:               enum    MONTHLY | QUARTERLY | ANNUAL
start_date / end_date:     date
status:                    enum    OPEN | SOFT_CLOSED | HARD_CLOSED
closed_at:                 timestamp?
realized_delta_written:    bool    all Outcomes updated
back_propagation_run:      bool    weight learner completed
calibration_updated:       bool    calibration_factors updated
recognition_engine_run:    bool    all TemporalClaim schedules processed
tax_provision_computed:    bool    TaxProvision node created
statutory_reports_run:     bool    all jurisdiction reports generated
re_opened_count:           int     must be zero in a clean close
re_opened_reason:          string?
```

## Period Close Sequence (10 steps)

1. **Soft close** — set status = SOFT_CLOSED; new postings require controller approval
2. **Reconciliation scan** — find CashFlowEvents with no matching LedgerLine in period
3. **Recognition engine** — process all TemporalClaim.recognition_schedule due this period
4. **Obligation verification** — confirm all due Obligations have JournalEntry
5. **Realized delta writes** — sum all CREDIT LedgerLines posting to each Outcome node
6. **Back-propagation** — weight learner updates all ancestor CONTRIBUTES_TO edges
7. **Calibration update** — compare realized_delta to ci_point_estimate; update factors
8. **Effective stake recalculation** — recompute across all ESTIMATED/FORECASTED nodes
9. **Statutory mapping run** — generate trial balance per jurisdiction
10. **Hard close** — status = HARD_CLOSED; no further postings; immutable

## Multi-Entity Consolidation

### Entity node
```
id:                   UUID
functional_currency:  string
consolidation_method: enum    FULL | EQUITY | PROPORTIONATE | EXCLUDED
ownership_pct:        float   1.0 for wholly owned
nci_pct:              float   1.0 − ownership_pct
consolidation_group_id: UUID
acquisition_date:     date?
fiscal_year_end:      date
reporting_lag_days:   int
```

### INTERCOMPANY_MATCH edge (most important new edge in consolidation)
Created at transaction origination — NOT at period close. Both sides of any
intercompany transaction are linked immediately.

```
From:                   LedgerLine → LedgerLine
transaction_type:       enum    SALE | LOAN | DIVIDEND | SERVICE | MANAGEMENT_FEE |
                                RENTAL | GUARANTEE
seller_entity_id:       UUID
buyer_entity_id:        UUID
amount_seller_currency: numeric
amount_buyer_currency:  numeric
unrealized_profit_pct:  float?  for intercompany inventory sales
```

### Consolidation eliminates via WHERE clause, not journal entries
```cypher
// Exclude all INTERCOMPANY_MATCH-linked lines where both entities are in the group
WHERE NOT EXISTS {
  MATCH (ll)-[:INTERCOMPANY_MATCH]->(ll2:LedgerLine)
  MATCH (e2:Entity {id: ll2.entity_id})-[:REPORTS_TO_GROUP]->(cg)
}
```

## Goodwill Model

### BusinessCombination node
```
total_consideration:         numeric  cash + shares at FV + contingent at FV
fair_value_net_assets:       numeric  post-PPA
ownership_pct_acquired:      float
goodwill_arising:            numeric  consideration − (pct × FV_net_assets)
nci_fair_value:              numeric? for FULL_GOODWILL method
full_goodwill:               numeric? consideration + NCI_FV − FV_net_assets
ppa_complete:                bool     false during 12-month measurement period
```

### Goodwill node
```
gross_amount:              numeric  NEVER changes after initial recognition
accumulated_impairment:    numeric  only INCREASES — never reverses
carrying_amount:           numeric  gross − accumulated_impairment
cgu_id:                    UUID     required for impairment testing
is_full_goodwill:          bool
last_test_result:          enum?    PASS | IMPAIRED
```

### Value in Use = CONTRIBUTES_TO traversal
The IAS 36 value-in-use DCF calculation IS a graph traversal using
`temporal_value_pct` as the discount factor and `ci_point_estimate × path_contribution`
as projected cash flows. No separate DCF model required.

## StatutoryMapping — Regulatory Compliance as Derived View

```sql
-- PostgreSQL table
CREATE TABLE statutory_mappings (
  jurisdiction          TEXT NOT NULL,  -- 'IFRS', 'US-GAAP', 'CA-TAX'
  node_ref_type         TEXT NOT NULL,
  economic_category     TEXT NOT NULL,
  node_tags_match       TEXT[],
  statutory_account_code TEXT NOT NULL,
  statutory_account_label TEXT NOT NULL,
  applies_from          DATE NOT NULL,
  applies_until         DATE,
  xbrl_element          TEXT,           -- for public company filings
  xbrl_taxonomy         TEXT
);
```

A change in tax law = new StatutoryMapping row, not a ledger restructure.
IFRS, US GAAP, and tax all coexist as parallel mapping rule sets over the same data.

## Tax Data Model (Core Schema — Computation is a Separate Service)

These properties MUST be on existing nodes before the tax computation service is built:

```
FixedAsset.tax_base:                float  tax depreciation base
FixedAsset.tax_accumulated_dep:     float  tax depreciation taken to date
FixedAsset.tax_base_method:         enum   CCA_CLASS | MACRS_CLASS | STRAIGHT_LINE_TAX | POOLED
Goodwill.tax_deductible:            bool   false in most jurisdictions
Goodwill.tax_base:                  float  0 if not deductible
TemporalClaim.tax_recognition_basis: enum  CASH_BASIS | ACCRUAL_BASIS
RightOfUseAsset.tax_base:           float  usually 0
LeaseLiability.tax_base:            float  usually 0
Any node.temporary_difference_flag: bool   set by tax engine
```

### DeferredTaxPosition node (created by tax service)
```
source_node_id:           UUID    the graph node with the temp difference
accounting_carrying_amt:  float
tax_base:                 float
temporary_difference:     float   accounting − tax
direction:                enum    TAXABLE (DTL) | DEDUCTIBLE (DTA)
tax_rate_applicable:      float
deferred_tax_amount:      float   difference × rate
recognition_criteria_met: bool    future taxable profit probable (management judgment)
```
