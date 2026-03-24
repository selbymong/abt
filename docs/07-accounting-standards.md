# 07 — Accounting Standards Coverage

## Fully Modeled

| Standard | Coverage | Notes |
|----------|---------|-------|
| Basic double-entry | Complete | JournalEntry + LedgerLine, append-only, bi-temporal |
| Accrual accounting | Complete | TemporalClaim (4 types), recognition engine, auto-reversal |
| Cash flow statement | Complete | CashFlowEvent nodes, direction, bank account reference |
| Multi-entity consolidation | Complete | Entity + ConsolidationGroup, FULL/EQUITY/PROPORTIONATE |
| Intercompany elimination | Complete | INTERCOMPANY_MATCH edges, query-time elimination |
| Foreign currency (IAS 21) | Complete | CurrencyTranslation node, average/closing rate methodology |
| Business combinations (IFRS 3) | Complete | BusinessCombination + Goodwill + PPA nodes |
| Goodwill impairment (IAS 36) | Complete | ImpairmentTest + CGU, VIU from contribution path traversal |
| Provisions (IAS 37) | Schema done | Provision node distinct from TemporalClaim |
| Revenue recognition - basic | Complete | TemporalClaim.DEFERRED_REVENUE, recognition_schedule |
| Fixed assets | Schema done | FixedAsset + DepreciationSchedule, all depreciation methods |
| Leases (IFRS 16) | Schema done | RightOfUseAsset + LeaseLiability |

## Partially Modeled — Needs Completion

| Standard | Status | What's Missing |
|----------|--------|---------------|
| IFRS 9 Financial Instruments | Properties only | ECL computation service, hedge accounting effectiveness testing |
| IFRS 15 Revenue | Simple contracts only | ContractAsset, PerformanceObligation, VariableConsideration for multi-element |
| IAS 12 Deferred Tax | Properties only | DeferredTaxPosition computation service, TaxProvision generation |
| IFRS 16 Leases | Schema only | Payment unwinding computation, lease modification handling |
| Share-based comp (IFRS 2) | Not started | EquityAward node, Black-Scholes, vesting schedule amortization |

## Not Yet Modeled

| Standard | Priority | Coupling | Notes |
|----------|---------|---------|-------|
| Inventory (IAS 2 / ASC 330) | High | High | InventoryItem, InventoryLot, FIFO/WA, NRV testing |
| Equity structure | High | Medium | ShareClass, RetainedEarnings, OCI components |
| EPS (IAS 33) | Medium | Low | ShareCapital node + diluted EPS query |
| Segment reporting (IFRS 8) | Low | Low | Largely a reporting view on existing Initiative/entity hierarchy |
| Government grants (IAS 20) | Low | Low | DEFERRED_REVENUE TemporalClaim with grant flag |
| Pension (IAS 19) | Medium | Medium | DefinedBenefitObligation node, actuarial valuation inputs |
| Borrowing costs (IAS 23) | Low | Low | qualifying_asset flag on FixedAsset |
| Related parties (IAS 24) | Medium | Low | Traversal of OWNED_BY edges — largely already available |
| Discontinued ops (IFRS 5) | Low | Low | HELD_FOR_SALE status on Initiative nodes |
| Hyperinflation (IAS 29) | Niche | Low | Only if operating in hyperinflationary economy |

## Key Design Distinctions

### TemporalClaim vs Provision (CRITICAL)
```
TemporalClaim:  certain amount, certain counterparty, timing difference only
                → Use for: accrued wages, deferred revenue, prepaid insurance

Provision:      uncertain amount, may never materialise, requires probability assessment
                → Use for: warranties, restructuring, legal claims, environmental
```

### Current Tax vs Deferred Tax
```
Current tax:    cash owed to tax authority for THIS period
                → Posts to CashFlowEvent (payable) + Outcome node (Mitigate Expense)

Deferred tax:   future tax consequence of today's temporary differences
                → Posts to DeferredTaxPosition node (ASSET or LIABILITY on balance sheet)
                → NOT a cash obligation today
```

### Revenue Recognition Stages (IFRS 15 five-step model)
```
Step 1: Identify the contract with the customer
        → RevenueContract node

Step 2: Identify performance obligations
        → PerformanceObligation nodes (one per distinct good/service)

Step 3: Determine transaction price
        → RevenueContract.transaction_price (including VariableConsideration estimate)

Step 4: Allocate to performance obligations
        → PerformanceObligation.allocated_transaction_price (relative SSP basis)

Step 5: Recognize revenue as each PO is satisfied
        → POINT_IN_TIME: full credit to Outcome when delivered
        → OVER_TIME: pro-rata to Outcome as performance progresses
```

### OtherComprehensiveIncome Components (track separately for recycling)
```
CTA_COMPONENT:          CurrencyTranslation adjustments (recycles on subsidiary disposal)
CASHFLOW_HEDGE:         Effective portion of cash flow hedge gains/losses (recycles when hedged transaction affects P&L)
NET_INVESTMENT_HEDGE:   Effective portion of net investment hedge (recycles on disposal)
FVOCI_DEBT:             Fair value changes on FVOCI debt instruments (recycles on derecognition)
FVOCI_EQUITY:           Fair value changes on FVOCI equity instruments (NEVER recycles — permanently in equity)
DB_PENSION:             Remeasurements of defined benefit obligation (NEVER recycles)
```

## Tax Engine Design (Separate Service)

The tax computation engine is a separate Python microservice. It:
1. Subscribes to `PERIOD_SOFT_CLOSED` Kafka events
2. Reads from Neo4j: all nodes with `temporary_difference_flag = true`
3. Reads from Neo4j: Entity.jurisdiction → TaxJurisdiction rules
4. Computes `DeferredTaxPosition` nodes and `TaxProvision` node
5. Generates draft `TaxProvision` JournalEntry (status=DRAFT, awaiting approval)
6. Emits `TAX_PROVISION_COMPUTED` Kafka event

**It does NOT post entries automatically.** The CFO/controller reviews and approves.

The engine is jurisdiction-specific. Build order:
1. Federal corporate income tax for primary operating jurisdiction
2. Provincial/state tax
3. GST/VAT (transactional, simpler computation)
4. Withholding tax on intercompany flows
5. Transfer pricing adjustments

Each jurisdiction is a separate module implementing a common interface:
```python
class TaxJurisdictionEngine(Protocol):
    def compute_current_tax(self, entity_id, period_id) -> TaxProvision
    def compute_deferred_tax(self, entity_id, period_id) -> list[DeferredTaxPosition]
    def get_temporary_differences(self, entity_id) -> list[TemporaryDifference]
```
