# 06 — Build Plan (v1.2 — Integrated)

All addenda timelines merged into a single plan. Supersedes v1.0 build plan.
Total estimated duration: 40–46 sprints (~80–92 weeks).

## Coupling Map (v1.2 updated)

| Component | Coupling | Action |
|-----------|---------|--------|
| Bi-temporal schema | 95% | Phase 0 — before any GL code |
| CQRS (TimescaleDB projection) | 90% | Phase 0 — before any GL code |
| Cross-store saga | 88% | Phase 0 — before any GL code |
| Configuration management [v1.2-D] | 88% | Phase 0 — all services read from ConfigurationService |
| Entity v1.2 properties [v1.2-A] | 85% | Phase 0 — entity_type, outcome_ontology, fund_accounting_enabled |
| Polymorphic outcomes [v1.2-A] | 82% | Phase 0 — Outcome.ontology, ontology invariants |
| OCI/equity destination [v1.2-E] | 75% | Phase 0 — RetainedEarnings, OCI nodes |
| Financial instruments (IFRS 9) | 88% | Phase 0 — add properties to existing nodes |
| Tax base properties | 82% | Phase 0 — add to FixedAsset, Goodwill, etc. |
| AssetClass node [v1.2-C] | 78% | Phase 0 DDL + seed data |
| Fund node [v1.2-A] | 72% | Phase 0 DDL; Phase 1 fund_id on LedgerLine |
| Tax credit nodes [v1.2-B] | 40% | Phase 0 DDL + seed programs; Phase 5 services |
| Related party framework [v1.2-A] | 35% | Phase 3 — new edges only, no core node changes |

---

## Phase 0 — Foundation (Sprint 1–3, ~6 weeks)

**Do not write any feature code until Phase 0 is complete.**

### Schema (Neo4j)
- [ ] Apply cypher/01-constraints-indexes.cypher through 06-traversal-queries.cypher (base)
- [ ] Apply cypher/07-v1.2-constraints-indexes.cypher (new nodes/edges)
- [ ] Apply cypher/08-v1.2-seed-data.cypher (entities, asset classes, credit programs)
- [ ] Add bi-temporal properties to JournalEntry + LedgerLine
- [ ] Configure Neo4j users: deny UPDATE/DELETE on JournalEntry, LedgerLine labels

### Schema (PostgreSQL + TimescaleDB)
- [ ] Run sql/01-configuration-settings.sql
- [ ] Run sql/02-timescaledb-projections.sql (gl_period_balances, equity_period_balances, metric_observations, calibration_history, audit_log, statutory_mappings)
- [ ] Seed default configuration_settings rows (system + entity scoped)
- [ ] Create pgvector node_embeddings table

### Infrastructure
- [ ] Configure Kafka topics (ebg.gl, ebg.graph, ebg.outcomes, ebg.cashflow, ebg.obligations, ebg.scenarios, ebg.tax)
- [ ] Implement cross-store saga coordinator (src/saga/)
- [ ] Implement Kafka consumer → TimescaleDB projector (src/projectors/)
- [ ] Build ConfigurationService with resolveConfig() [v1.2-D]
- [ ] Build config admin API: GET/PUT /config/{key}

### Invariant Tests
- [ ] GL_INVARIANT_1 through GL_INVARIANT_5
- [ ] GRAPH_INVARIANT_1, GRAPH_INVARIANT_2
- [ ] ONTOLOGY_INVARIANT_1, _2, _3 [v1.2-A]
- [ ] EQUITY_INVARIANT_1 [v1.2-E]
- [ ] All 11 invariants must pass against empty database

**Definition of done for Phase 0:**
- All 11 invariants pass
- Kafka consumer projects a test LedgerLine to TimescaleDB
- Saga coordinator rolls back partial write on simulated failure
- Neo4j app user cannot UPDATE/DELETE JournalEntry or LedgerLine
- ConfigurationService resolves entity-scoped settings with cascade fallback
- Four Entity nodes exist with all v1.2 properties

---

## Phase 1 — Core Graph + Basic GL (Sprint 4–8, ~10 weeks)

### Graph API
- [ ] CRUD: Resource, Activity, Project, Initiative nodes
- [ ] CRUD: Metric, Capability, Asset nodes
- [ ] CRUD: CustomerRelationshipAsset, WorkforceAsset nodes
- [ ] CRUD: Outcome nodes (both FINANCIAL and MISSION ontologies) [v1.2-A]
- [ ] CRUD: Fund nodes for NFP entities [v1.2-A]
- [ ] CONTRIBUTES_TO edge management (all contribution_function types)
- [ ] DEPENDS_ON, DELEGATES_TO edge management
- [ ] Ontology validation: Outcome.ontology must match entity.outcome_ontology [v1.2-A]
- [ ] RELATED_PARTY edge creation for entity pairs with shared board [v1.2-A]

### GL Core
- [ ] Journal entry posting service (double-entry validation + saga)
- [ ] fund_id validation: required when entity.fund_accounting_enabled = true [v1.2-A]
- [ ] AccountingPeriod management (open/soft-close/hard-close)
- [ ] LedgerLine posting with node_ref validation
- [ ] StatutoryMapping rules engine (all 9 jurisdiction codes) [v1.2-A]
- [ ] P&L query from TimescaleDB
- [ ] Balance sheet query from TimescaleDB (with equity section) [v1.2-E]
- [ ] Outcome attribution P&L (Neo4j traversal)

### Social + Control
- [ ] SocialConstraint + PROHIBITS pre-filter
- [ ] StakeholderAsset management
- [ ] Obligation scheduling + alert cascade

### Admin UI
- [ ] Entity settings page (all entity-scoped config) [v1.2-D]
- [ ] Approval threshold configuration [v1.2-D]
- [ ] Fund management (CRUD) for NFP entities [v1.2-A]
- [ ] Reference data management screens [v1.2-D]

**Definition of done for Phase 1:**
- Can post journal entries per entity with correct fund_id
- P&L and balance sheet render from TimescaleDB
- Social constraint pre-filter blocks prohibited activities
- Obligation alerts fire at 30/14/7 days
- Admin can change approval thresholds at runtime
- All 11 invariants still pass

---

## Phase 2 — Accruals + Advanced GL (Sprint 9–15, ~14 weeks)

### Accruals Engine
- [ ] TemporalClaim CRUD (all 4 types)
- [ ] Recognition engine (reads schedules, generates JEs at period close)
- [ ] Auto-reversal mechanism
- [ ] ECL allowance computation (incurred loss for ASPE, ECL staging for US GAAP) [v1.2-A]
- [ ] Net asset reclassification automation for NFP funds [v1.2-A]

### Fixed Assets + Depreciation [v1.2-C integrated]
- [ ] FixedAsset node + lifecycle (acquisition, depreciation, disposal)
- [ ] AssetClass BELONGS_TO edge management with override cascade [v1.2-C]
- [ ] Two-pass depreciation engine: accounting pass + tax pass [v1.2-C]
- [ ] UCCPool annual rollover (CCA) [v1.2-C]
- [ ] CCA discretionary claim election UI [v1.2-C]
- [ ] MACRS percentage table lookup (IRS Pub 946 embedded) [v1.2-C]
- [ ] Automated monthly depreciation journal entries
- [ ] Temporary difference computation (accounting vs tax basis) [v1.2-C]

### Leases
- [ ] RightOfUseAsset + LeaseLiability (for US GAAP / IFRS entities)
- [ ] Operating lease treatment for ASPE entity (TemporalClaim only) [v1.2-A]
- [ ] Lease payment unwinding (interest + principal split)

### Provisions
- [ ] Provision node CRUD (IAS 37 — distinct from TemporalClaim)
- [ ] Recognition criteria enforcement (only PROBABLE recognized)

### Admin UI
- [ ] ECL rate matrix editor with versioning [v1.2-D]
- [ ] AssetClass management + reclassification workflow [v1.2-C]
- [ ] Restatement workflow (for retroactive config changes) [v1.2-D]

---

## Phase 3 — Multi-Entity + Related Party (Sprint 16–21, ~12 weeks)

### Related Party Framework [v1.2-A]
- [ ] RELATED_PARTY_TRANSACTION edge management
- [ ] Arm's length validation service
- [ ] Donation flow templates (FP→NFP, cross-border) [v1.2-A]
- [ ] Related party disclosure schedule generation at period close [v1.2-A]
- [ ] Transfer pricing policy per entity pair [v1.2-D]

### Consolidation Infrastructure (for future subsidiaries)
- [ ] ConsolidationGroup, OwnershipInterest, BusinessCombination nodes
- [ ] INTERCOMPANY_MATCH edge creation at transaction origination
- [ ] Consolidated P&L and BS traversal queries
- [ ] CurrencyTranslation node + FX translation (CAD↔USD) [v1.2-E]
- [ ] CTA posting to OCI [v1.2-E]
- [ ] Goodwill + ImpairmentTest + CashGeneratingUnit nodes

### Equity Close
- [ ] RetainedEarnings period-end computation [v1.2-E]
- [ ] OCI component tracking (all 7 components) [v1.2-E]
- [ ] OCI recycling enforcement (NEVER recycle for FVOCI_EQUITY, DB_PENSION) [v1.2-E]
- [ ] EquitySection presentation node generation [v1.2-E]
- [ ] equity_period_balances Kafka projection [v1.2-E]

---

## Phase 4 — AI Engine Services (Sprint 22–27, ~12 weeks)

- [ ] Weight learner service (REALIZATION_RECORDED → edge weight update)
- [ ] Ontology-aware back-propagation (hard boundary between FINANCIAL/MISSION) [v1.2-A]
- [ ] Epistemic priority scorer (EVOI computation)
- [ ] Calibration update (realized_delta → calibration_factor)
- [ ] Effective stake recomputation across ESTIMATED/FORECASTED nodes
- [ ] Cashflow optimizer (FloatWindow scoring, AR discount vs facility)
- [ ] Path traversal API (impact paths, orphans, HARD_BLOCK scan)
- [ ] Scenario engine (Monte Carlo on DISTAL_EXT/FORCE_MAJEURE nodes)
- [ ] Vector embedder (node embeddings + AI edge discovery)
- [ ] Claude AI assistant integration (natural language → graph traversal)

---

## Phase 5 — Tax + Credits + Compliance (Sprint 28–36, ~18 weeks)

### Tax Engine Core
- [ ] DeferredTaxPosition computation service
- [ ] TaxProvision node + period-close computation
- [ ] Current tax liability computation

### Tax Engine Modules [v1.2-A expanded]
- [ ] CRA Corporate (T2, CCA classes, small business deduction, GRIP/LRIP)
- [ ] GST/HST (input tax credits for FP, 50% rebate for NFP)
- [ ] IRS Corporate (Form 1120, MACRS, §179 expensing)
- [ ] CRA Charity (T3010, disbursement quota, UBIT equivalent) [v1.2-A]
- [ ] IRS Exempt (Form 990, UBIT, public support test) [v1.2-A]
- [ ] State sales/use tax (nexus-based) [v1.2-A]
- [ ] Cross-border withholding tax (Canada-US Tax Treaty) [v1.2-A]

### Tax Credit Management [v1.2-B]
- [ ] Eligible expenditure identification service (AI traversal + rule matching)
- [ ] Credit computation service per program
- [ ] Carryforward balance management (FIFO vintage tracking, expiry)
- [ ] Period close steps 14a/14b/14c (identification, application, carryforward)
- [ ] JournalEntry templates per accounting_treatment
- [ ] Credit-adjusted ROI (REDUCES_COST_OF edge, effective_cost computation)
- [ ] CRA filing integration (T661 SR&ED data export)
- [ ] IRS filing integration (Form 6765 R&D credit data export)

### Compliance
- [ ] ApprovalWorkflow node + approval enforcement
- [ ] SourceDocument + document_hash tamper detection
- [ ] Access logging (audit reads above sensitivity threshold)
- [ ] Related party disclosure framework (auto-generated from RELATED_PARTY_TRANSACTION)

---

## Phase 6 — Advanced Accounting (Sprint 37+)

- [ ] Full IFRS 15 revenue recognition (ContractAsset, PerformanceObligation, VariableConsideration)
- [ ] Inventory accounting (InventoryItem, InventoryLot, FIFO/WA/LIFO, NRV testing)
- [ ] Equity structure (ShareClass, RetainedEarnings expansion, OCI component expansion)
- [ ] EquityAward / share-based compensation (IFRS 2)
- [ ] HedgeRelationship effectiveness testing (IFRS 9 hedge accounting)
- [ ] EPS computation (basic + diluted)
- [ ] XBRL tagging on StatutoryMapping
- [ ] COA migration tooling (historical data import from traditional GL)
- [ ] Tax credit AI feedback loop (reviewer rejection → eligibility model refinement) [v1.2-B]
- [ ] Bank reconciliation service

---

## Invariant Summary (v1.2 — 11 total)

| ID | Condition |
|----|-----------|
| GL_INVARIANT_1 | Closed period: SUM(DEBIT) == SUM(CREDIT) |
| GL_INVARIANT_2 | Per JournalEntry: total_debit == total_credit |
| GL_INVARIANT_3 | Posted JournalEntry immutable (verify via hash/audit) |
| GL_INVARIANT_4 | TimescaleDB matches Neo4j for every (entity_id, period_id) |
| GL_INVARIANT_5 | Open TemporalClaim with remaining > 0 has unprocessed schedule entries |
| GRAPH_INVARIANT_1 | Every IN_PROGRESS/PLANNED Activity has CONTRIBUTES_TO path to Outcome |
| GRAPH_INVARIANT_2 | HARD_CLOSED period: back-propagation completed on all Outcomes |
| ONTOLOGY_INVARIANT_1 | Every Outcome.ontology matches owning entity.outcome_ontology |
| ONTOLOGY_INVARIANT_2 | Every CONTRIBUTES_TO path terminates at matching-ontology Outcome |
| ONTOLOGY_INVARIANT_3 | No back-propagation crosses ontology boundary |
| EQUITY_INVARIANT_1 | Equity node balances match LedgerLine equity totals per entity/period |
