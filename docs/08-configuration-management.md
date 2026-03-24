# 08 — Configuration Management

Replaces "Open Design Decisions" from v1.0. All 24 former "decisions"
are now configurable settings, reference data, or seed data.
No feature is gated on a human decision.

## Architecture

All configurable values are stored in `configuration_settings` (PostgreSQL).
Services read from ConfigurationService — never from hardcoded values or env vars.

Resolution cascade: per-asset override → entity-scoped → system-scoped → hardcoded default.

All settings are bi-temporal (valid_from/valid_until + transaction_time) with
full audit trail (changed_by, change_reason).

## Entity-Scoped Settings

| Key | Type | Default | Restatement? | Notes |
|-----|------|---------|-------------|-------|
| functional_currency | STRING | (none) | Yes | ISO 4217. CAD or USD. |
| reporting_framework | ENUM | (none) | Yes | IFRS, ASPE, US_GAAP, ASNFPO, ASC_958 |
| inventory_cost_method | ENUM | FIFO | Yes | FIFO, WEIGHTED_AVG, LIFO |
| materiality_threshold | NUMERIC | 5000 | No | Prospective only |
| default_ibr | NUMERIC | 0.05 | No | For new leases only |
| is_ccpc | BOOLEAN | true | No | SR&ED enhanced rate eligibility |
| registration_type | ENUM | (none) | No | REGISTERED_CHARITY, 501C3, etc. |
| fiscal_year_end | STRING | 12-31 | Yes | MM-DD |
| cross_border_treaty_reg | BOOLEAN | false | No | NFP cross-border status |
| approval_thresholds | JSON | (see below) | No | Tiered by amount + entry type |
| ecl_rate_matrix | JSON | (see below) | No | Aging buckets → loss rates |

### approval_thresholds default
```json
{
  "tiers": [
    {"max_amount": 5000, "required_role": "BOOKKEEPER", "auto_approve": true},
    {"max_amount": 25000, "required_role": "CONTROLLER", "auto_approve": false},
    {"max_amount": 100000, "required_role": "CFO", "auto_approve": false},
    {"max_amount": null, "required_role": "BOARD", "auto_approve": false}
  ],
  "entry_type_overrides": {
    "ELIMINATION": {"always_requires": "CFO"},
    "IMPAIRMENT": {"always_requires": "BOARD"}
  }
}
```

### ecl_rate_matrix default
```json
{
  "buckets": [
    {"days_from": 0, "days_to": 30, "loss_rate": 0.001},
    {"days_from": 31, "days_to": 60, "loss_rate": 0.008},
    {"days_from": 61, "days_to": 90, "loss_rate": 0.025},
    {"days_from": 91, "days_to": null, "loss_rate": 0.20}
  ],
  "methodology": "historical_loss_rate"
}
```

## Entity-Pair Settings

| Key | Type | Default | Notes |
|-----|------|---------|-------|
| transfer_pricing_method | ENUM | CUP | Per entity pair. CUP, COST_PLUS, RESALE_MINUS, TNMM, PROFIT_SPLIT |
| arms_length_tolerance | NUMERIC | 0.15 | Variance threshold for AI flagging |

## Program-Scoped Settings

| Key | Type | Default | Notes |
|-----|------|---------|-------|
| credit_accounting_treatment | ENUM | (per program) | COST_REDUCTION, INCOME_APPROACH, ITC_METHOD |
| ira_election_type | ENUM | (none) | DIRECT_PAY, TRANSFER. Annual, irrevocable |

## System-Scoped Settings

| Key | Type | Default | Notes |
|-----|------|---------|-------|
| combined_report_currency | STRING | CAD | Presentation currency for combined view |
| combined_report_fx_method | ENUM | CLOSING_RATE | CLOSING_RATE, TEMPORAL |
| allocation_block_threshold | NUMERIC | 0.30 | AI blocks capital when effective_stake/ci < this |
| ai_confidence_discount_claimed_credits | NUMERIC | 0.70 | Discount for unassessed credits in ROI calc |

## Reference Data (managed via CRUD, not configuration)

| Data | Node/Table | Operation |
|------|-----------|-----------|
| Tax jurisdictions | TaxJurisdiction | Create node per jurisdiction |
| Chart of accounts | statutory_mappings (PG) | Add/edit mapping rows |
| NFP funds | Fund | Create node per grant/program |
| Credit programs | TaxCreditProgram | Create node per program |
| Asset classes | AssetClass | Create node per class |
| Mission outcome metrics | Outcome.measurement_unit | Edit property on node |

## Restatement Workflow

Settings with `requires_restatement = true` trigger a workflow when changed:
1. System computes financial impact across affected periods
2. Draft RestatementBatch created with adjustment JournalEntries
3. Controller/CFO reviews and approves
4. On approval: new setting takes effect, adjustment entries posted
5. Old setting gets valid_until set

Prospective changes (`requires_restatement = false`) take effect immediately.

## Onboarding Checklist

The admin UI presents a configuration checklist per entity:
- [ ] Functional currency set
- [ ] Reporting framework selected
- [ ] Fiscal year end confirmed
- [ ] Approval thresholds configured
- [ ] Materiality threshold reviewed
- [ ] ECL rate matrix loaded (if applicable)
- [ ] Tax registration details entered
- [ ] Asset classes assigned (ACCOUNTING + CCA/MACRS as applicable)
- [ ] StatutoryMapping rows loaded for entity's framework

Incomplete checklist does not block development — it blocks the admin
from activating that entity's GL (operational decision, not engineering).
