# Enterprise Business Graph — Build Instructions (v1.2)

## What This Is

A ground-up AI-native enterprise management platform built on a **Labeled Property Graph**
(Neo4j). The graph is the semantic integration layer for all business management: every
activity, investment, metric, asset, and cashflow node is connected to terminal outcome
nodes through weighted, learnable CONTRIBUTES_TO edges. A graph-native General Ledger sits
on top of this same model — journal entries post to graph nodes rather than COA codes.

### v1.2 Additions
- **Four-entity group**: CA for-profit (ASPE), CA not-for-profit (ASNFPO), US for-profit
  (US GAAP), US not-for-profit (ASC 958). Independent entities with related party framework.
- **Polymorphic outcomes**: FOR_PROFIT entities use IMPROVE_REVENUE / NEW_REVENUE /
  MITIGATE_EXPENSE. NOT_FOR_PROFIT entities use DELIVER_MISSION / SUSTAIN_FUNDING /
  STEWARD_RESOURCES. Hard learning boundary between ontologies.
- **Fund accounting**: Fund node partitions NFP entity ledgers by restriction class.
- **Tax credit management**: TaxCreditProgram, TaxCreditClaim, TaxCreditBalance nodes.
  AI auto-identifies eligible expenditures from graph traversal patterns.
- **Asset class depreciation**: AssetClass reference node with CCA/MACRS/accounting rates.
  UCCPool for CCA pooled depreciation. Two-pass depreciation engine.
- **OCI & equity structure**: RetainedEarnings, OtherComprehensiveIncome with 7 component
  types and recycling rules. EquitySection presentation node.
- **Configuration management**: All former "open decisions" reclassified as configurable
  settings in bi-temporal PostgreSQL table. Zero schema-blocking decisions.

## Documentation Map

Read these files in order before writing any code:

| File | Covers | Read before |
|------|--------|-------------|
| `docs/01-architecture.md` | System tiers, CQRS, saga, tech stack | Everything |
| `docs/02-core-graph-model.md` | Business graph nodes, epistemic model, control model | All graph code |
| `docs/03-gl-specification.md` | Graph-native GL: journal entries, accruals, period close | All GL code |
| `docs/04-data-model-reference.md` | **CANONICAL** node/edge property schemas (v1.2 complete) | Any node/edge creation |
| `docs/05-cypher-patterns.md` | The 20 most important traversal queries | Any query code |
| `docs/06-build-plan.md` | Integrated v1.2 build plan with all phases | Sprint planning |
| `docs/07-accounting-standards.md` | IFRS/GAAP/ASPE/ASNFPO coverage and gaps | GL financial features |
| `docs/08-configuration-management.md` | All configurable settings, reference data, onboarding | Any service that reads config |
| `docs/09-oci-equity-structure.md` | OCI components, recycling rules, equity nodes | Equity/OCI code |

### Formal Specification Documents (docx)
| File | Contents |
|------|----------|
| `spec/enterprise-business-graph-spec.docx` | Complete v1.1 base specification |
| `spec/business_graph_model.docx` | Core graph model narrative |
| `spec/business_graph_v1_1_addendum.docx` | WorkforceAsset addition |
| `spec/multi-entity-addendum-v1.2.docx` | Addendum A: four-entity group, polymorphic outcomes, fund accounting |
| `spec/tax-credit-addendum-v1.2b.docx` | Addendum B: tax credit management |
| `spec/asset-class-addendum-v1.2c.docx` | Addendum C: asset classes, depreciation rates |
| `spec/config-management-addendum-v1.2d.docx` | Addendum D: configuration management |

**When the markdown docs and docx specs conflict, the markdown docs are canonical for
implementation.** The docx files are the formal spec record; the markdown files are the
working reference optimized for developers.

## Critical Design Principles

These are non-negotiable:

1. **Append-only ledger.** JournalEntry and LedgerLine are NEVER updated or deleted.
   Corrections are REVERSAL entries. Enforced at Neo4j permission level.

2. **Double-entry integrity.** Every JournalEntry: total_debit == total_credit.
   Enforced in posting service before write.

3. **CQRS mandatory.** Financial reporting reads TimescaleDB. Graph traversals read Neo4j.
   Never mix.

4. **Bi-temporal from day one.** valid_time (economic date) + transaction_time (system date)
   on every JournalEntry. Cannot retrofit.

5. **Cross-store saga.** Journal posting touches Neo4j + PostgreSQL + TimescaleDB + Kafka.
   Any failure → compensating transactions roll back all stores.

6. **Ontology boundary.** FOR_PROFIT and NOT_FOR_PROFIT entities have different terminal
   outcomes. The AI weight learner NEVER propagates gradients across this boundary.

7. **Configuration over code.** All policy values read from ConfigurationService.
   Never hardcode thresholds, rates, methods, or approval levels.

8. **Social constraints are pre-filters.** PROHIBITS edges checked before optimization.

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Graph database | Neo4j 5.x (Enterprise) | Primary semantic store |
| Time-series DB | TimescaleDB | GL projection + metric observations |
| Relational DB | PostgreSQL 16 | Config, audit, calibration, statutory mappings |
| Vector DB | pgvector | Node embeddings for AI edge discovery |
| Event bus | Apache Kafka | All graph mutations, CQRS projections |
| API layer | GraphQL + REST | Client interface |
| AI assistant | Anthropic Claude API | Natural language → graph traversal |
| Weight learner | Python service | Edge weight updates on realization |
| Tax engine | Python service | DeferredTax, TaxProvision, tax credits |
| Depreciation engine | Python service | Two-pass: accounting + tax (CCA/MACRS) |
| Frontend | React + TypeScript | Dashboards, admin UI, reporting |

## Repository Structure

```
ebg-project/
├── CLAUDE.md                       ← You are here
├── docs/
│   ├── 01-architecture.md
│   ├── 02-core-graph-model.md
│   ├── 03-gl-specification.md
│   ├── 04-data-model-reference.md  ← CANONICAL property reference (v1.2)
│   ├── 05-cypher-patterns.md
│   ├── 06-build-plan.md            ← Integrated v1.2 timeline
│   ├── 07-accounting-standards.md
│   ├── 08-configuration-management.md  ← Replaces "open decisions"
│   └── 09-oci-equity-structure.md
├── spec/                           ← Formal specification documents (docx)
│   ├── enterprise-business-graph-spec.docx
│   ├── business_graph_model.docx
│   ├── business_graph_v1_1_addendum.docx
│   ├── multi-entity-addendum-v1.2.docx
│   ├── tax-credit-addendum-v1.2b.docx
│   ├── asset-class-addendum-v1.2c.docx
│   └── config-management-addendum-v1.2d.docx
├── cypher/
│   ├── 01-constraints-indexes.cypher    ← (to be written Phase 0)
│   ├── 02-business-graph-nodes.cypher   ← (to be written Phase 0)
│   ├── 03-gl-nodes.cypher              ← (to be written Phase 0)
│   ├── 04-workforce-customer-nodes.cypher
│   ├── 05-edges.cypher
│   ├── 06-traversal-queries.cypher
│   ├── 07-v1.2-constraints-indexes.cypher  ← v1.2 nodes + edges
│   └── 08-v1.2-seed-data.cypher            ← entities, asset classes, credit programs
├── sql/
│   ├── 01-configuration-settings.sql    ← ConfigurationSetting table
│   └── 02-timescaledb-projections.sql   ← gl_period_balances, equity, metrics, audit
├── src/
│   ├── api/                        ← GraphQL + REST
│   ├── services/
│   │   ├── config/                 ← ConfigurationService (resolveConfig)
│   │   ├── gl/                     ← Journal entry, period close, accruals
│   │   ├── graph/                  ← Node/edge CRUD, path traversal
│   │   ├── ai/                     ← Weight learner, epistemic scorer, Claude
│   │   ├── depreciation/           ← Two-pass engine (accounting + CCA/MACRS)
│   │   ├── cashflow/               ← FloatWindow optimizer
│   │   ├── tax/                    ← DeferredTax, TaxProvision, credit identification
│   │   ├── consolidation/          ← Multi-entity, related party disclosure
│   │   └── reconciliation/         ← Bank reconciliation
│   ├── projectors/                 ← Kafka → TimescaleDB/PostgreSQL
│   ├── saga/                       ← Cross-store consistency coordinator
│   └── schema/
│       ├── neo4j/                  ← Node/edge TypeScript types
│       ├── timescale/              ← TimescaleDB migrations
│       └── postgres/               ← PostgreSQL migrations
├── tests/
│   ├── invariants/                 ← All 11 invariant tests
│   ├── integration/
│   └── unit/
└── spec/
```

## Kafka Topics

| Topic | Events | Consumers |
|-------|--------|-----------|
| `ebg.gl` | JOURNAL_LINE_POSTED, PERIOD_SOFT_CLOSED, PERIOD_HARD_CLOSED | TimescaleDB projector, tax engine, recognition engine |
| `ebg.graph` | NODE_CREATED, EDGE_UPDATED, EDGE_WEIGHT_UPDATED | Weight learner, vector embedder |
| `ebg.outcomes` | REALIZATION_RECORDED, VALUE_STATE_TRANSITION | Weight learner, epistemic scorer |
| `ebg.cashflow` | FLOAT_WINDOW_CREATED, CFE_SETTLED | Cashflow optimizer, bank rec |
| `ebg.obligations` | OBLIGATION_DUE | Alert cascade |
| `ebg.scenarios` | SCENARIO_FIRED | Scenario engine |
| `ebg.tax` | TAX_PROVISION_COMPUTED, CREDIT_IDENTIFIED, CREDIT_ASSESSED | GL posting service, credit balance mgr |
| `ebg.config` | SETTING_CHANGED | All services (cache invalidation) |

## Build Phases (Summary)

| Phase | Sprints | Focus |
|-------|---------|-------|
| 0 | 1–3 | Foundation: schema, saga, Kafka, config, invariants |
| 1 | 4–8 | Core graph + basic GL + fund accounting + admin UI |
| 2 | 9–15 | Accruals + fixed assets + depreciation engine |
| 3 | 16–21 | Multi-entity + related party + equity close |
| 4 | 22–27 | AI engine services |
| 5 | 28–36 | Tax + credits + compliance (6 tax modules) |
| 6 | 37+ | Advanced accounting (IFRS 15, inventory, equity, XBRL) |

See `docs/06-build-plan.md` for the complete integrated timeline.

## 11 Invariants (must pass at all times)

| ID | Test |
|----|------|
| GL_INVARIANT_1 | Closed period: SUM(DEBIT) == SUM(CREDIT) |
| GL_INVARIANT_2 | Per JournalEntry: total_debit == total_credit |
| GL_INVARIANT_3 | Posted JE immutable (hash/audit verification) |
| GL_INVARIANT_4 | TimescaleDB totals match Neo4j per (entity, period) |
| GL_INVARIANT_5 | Open TemporalClaim has unprocessed schedule entries |
| GRAPH_INVARIANT_1 | Active Activity has path to Outcome |
| GRAPH_INVARIANT_2 | Hard-closed period: back-propagation complete |
| ONTOLOGY_INVARIANT_1 | Outcome.ontology matches entity.outcome_ontology |
| ONTOLOGY_INVARIANT_2 | CONTRIBUTES_TO paths terminate at matching ontology |
| ONTOLOGY_INVARIANT_3 | No back-propagation crosses ontology boundary |
| EQUITY_INVARIANT_1 | Equity nodes match LedgerLine equity totals |
