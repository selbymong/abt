# 09 — OCI & Equity Structure

## Design Rationale

The v1.0 spec creates OCI amounts (CurrencyTranslation adjustments, hedge reserves)
but has no destination node to receive them. With four entities and two currencies
(CAD/USD), every combined report generates CTA amounts that need somewhere to land.

This section defines the minimal viable equity structure needed for Phase 0/1:
RetainedEarnings, OtherComprehensiveIncome with component tracking, and the
recycling rules that govern when OCI amounts move to P&L.

## Equity Nodes

### RetainedEarnings

```
id:                 UUID
entity_id:          UUID
fund_id:            UUID?           null for FOR_PROFIT; required for NFP
period_id:          UUID            AccountingPeriod this balance applies to
opening_balance:    numeric
net_income:         numeric         from P&L close (revenue - expenses)
dividends_declared: numeric         FOR_PROFIT only; 0 for NFP
other_adjustments:  numeric         prior period adjustments, error corrections
closing_balance:    numeric         opening + net_income - dividends + adjustments
created_at:         timestamp
```

RetainedEarnings is a period-end snapshot. The closing_balance of period N
becomes the opening_balance of period N+1. For NFP entities, this is
"Net assets — unrestricted" (or the applicable fund's net asset balance).

### OtherComprehensiveIncome

```
id:                 UUID
entity_id:          UUID
period_id:          UUID
component:          enum            see component list below
opening_balance:    numeric         accumulated OCI in this component
current_period:     numeric         OCI recognized this period
recycled_to_pnl:    numeric         amount reclassified to P&L this period
closing_balance:    numeric         opening + current_period - recycled_to_pnl
source_node_id:     UUID?           CurrencyTranslation, HedgeRelationship, etc.
source_node_type:   enum?           CURRENCY_TRANSLATION | HEDGE | FINANCIAL_INSTRUMENT | PENSION
created_at:         timestamp
```

### OCI Components (closed enum)

```
CTA_COMPONENT           CurrencyTranslation adjustments
                        Recycles: YES — on disposal of foreign operation
                        Source: CurrencyTranslation node

CASHFLOW_HEDGE          Effective portion of cash flow hedge gains/losses
                        Recycles: YES — when hedged transaction affects P&L
                        Source: HedgeRelationship (hedge_type = CASH_FLOW)

NET_INVESTMENT_HEDGE    Effective portion of net investment hedge
                        Recycles: YES — on disposal of foreign operation
                        Source: HedgeRelationship (hedge_type = NET_INVESTMENT)

FVOCI_DEBT              Fair value changes on FVOCI debt instruments
                        Recycles: YES — on derecognition of the instrument
                        Source: FinancialInstrument (ifrs9_classification = FVOCI_DEBT)

FVOCI_EQUITY            Fair value changes on FVOCI equity instruments
                        Recycles: NEVER — permanently in equity
                        Source: FinancialInstrument (ifrs9_classification = FVOCI_EQUITY)

DB_PENSION              Remeasurements of defined benefit obligation
                        Recycles: NEVER
                        Source: DefinedBenefitObligation (Phase 3+)

REVALUATION_SURPLUS     Property/equipment revaluation (IAS 16 revaluation model)
                        Recycles: NEVER (transferred to retained earnings on disposal)
                        Source: FixedAsset (if revaluation model elected)
```

### Recycling Rules

Recycling is the reclassification of accumulated OCI to P&L when the
triggering event occurs. The system must enforce:

1. Components marked "Recycles: NEVER" must never have recycled_to_pnl > 0.
   Enforce structurally: the posting service rejects any JournalEntry that
   debits a non-recycling OCI component with a credit to a P&L account.

2. Recycling creates a JournalEntry:
   DR  OtherComprehensiveIncome (the component being recycled)
   CR  Revenue or Expense (P&L line per StatutoryMapping)
   entry_type: RECLASSIFICATION

3. CTA recycling occurs on disposal of foreign operation. The entire
   accumulated CTA for that entity recycles to P&L in one entry.
   This links to Entity.disposal_date — when set, the consolidation
   engine must generate the CTA recycling entry.

4. Hedge recycling occurs when the hedged forecast transaction
   affects P&L. The HedgeRelationship.oci_balance is transferred.

## EquitySection Node (Presentation)

For balance sheet presentation, equity components are grouped:

```
id:                 UUID
entity_id:          UUID
period_id:          UUID
share_capital:      numeric         Phase 2+ (ShareClass nodes)
retained_earnings:  numeric         from RetainedEarnings.closing_balance
accumulated_oci:    numeric         SUM of all OCI component closing_balances
total_equity:       numeric         share_capital + retained_earnings + accumulated_oci
nci_equity:         numeric?        non-controlling interest (if consolidated)
total_equity_and_nci: numeric
created_at:         timestamp
```

For NFP entities, this maps to the Statement of Financial Position:
- retained_earnings → Net assets (by restriction class, per Fund)
- accumulated_oci → Accumulated remeasurements
- share_capital → not applicable (NFPs have no share capital)

## ASPE Simplification

Under ASPE (Canadian for-profit entity), OCI does not exist as a separate
concept. Items that would be OCI under IFRS are either:
- Recognized directly in P&L (e.g., FX gains/losses)
- Not applicable (ASPE has no FVOCI classification)
- Recognized in equity directly (revaluation surplus, if elected)

The OCI node still exists for the ASPE entity but will typically have
zero balances in most components. The reporting_framework drives which
StatutoryMapping rules present OCI as a separate statement (IFRS, US GAAP)
versus folding it into the income statement or equity note (ASPE).

## Period Close Integration

OCI processing occurs at period close step 9 (statutory mapping run):

1. For each entity, compute current_period OCI for each component:
   - CTA: from CurrencyTranslation.period_adjustment
   - Hedge: from HedgeRelationship.oci_balance changes
   - FVOCI: from FinancialInstrument fair value changes

2. Check for recycling triggers:
   - Entity disposal → recycle all CTA
   - Hedge maturity → recycle hedge OCI
   - Instrument derecognition → recycle FVOCI_DEBT

3. Create/update OtherComprehensiveIncome nodes for the period.

4. Create/update RetainedEarnings node (net income from P&L close).

5. Create EquitySection presentation node for balance sheet.

## GL Invariant Addition

```
EQUITY_INVARIANT_1: For any HARD_CLOSED period, for each entity:
  RetainedEarnings.closing_balance +
  SUM(OtherComprehensiveIncome.closing_balance for all components) +
  ShareCapital (when implemented) =
  SUM(LedgerLine.functional_amount WHERE economic_category = EQUITY)
```

## TimescaleDB Projection

The EquitySection data is projected to TimescaleDB for fast balance sheet queries:

```sql
-- Add to gl_period_balances or create separate equity projection
CREATE TABLE equity_period_balances (
  entity_id       UUID NOT NULL,
  period_id       UUID NOT NULL,
  fund_id         UUID,
  component       TEXT NOT NULL,  -- 'RETAINED_EARNINGS', 'OCI_CTA', 'OCI_HEDGE', etc.
  opening_balance NUMERIC NOT NULL,
  movement        NUMERIC NOT NULL,
  closing_balance NUMERIC NOT NULL,
  PRIMARY KEY (entity_id, period_id, fund_id, component)
);

SELECT create_hypertable('equity_period_balances', 'period_id',
  chunk_time_interval => INTERVAL '1 year');
```
