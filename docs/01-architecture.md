# 01 — System Architecture

## Overview

The Enterprise Business Graph is a six-tier system. The graph is the semantic integration
layer — not a data warehouse fed by other systems, but the layer that gives every business
event its meaning. Traditional operational systems (ERP, CRM, HRIS) become feed sources and
write targets. The graph owns the semantic model.

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT TIER                                                │
│  Web/Mobile UI · Claude AI Assistant · Admin/Reporting     │
└────────────────────────────┬────────────────────────────────┘
                             │ GraphQL / REST
┌────────────────────────────▼────────────────────────────────┐
│  API + ORCHESTRATION                                        │
│  API Gateway · Session context · Workflow routing          │
└──────────────┬─────────────────────────────┬───────────────┘
               │                             │
┌──────────────▼─────────────┐  ┌────────────▼───────────────┐
│  AI ENGINE SERVICES        │  │  GL SERVICES               │
│  Weight learner            │  │  Journal entry posting     │
│  Path traversal            │  │  Period close              │
│  Epistemic scorer          │  │  Recognition engine        │
│  Scenario engine (MC)      │  │  Tax computation           │
│  Cashflow optimizer        │  │  Bank reconciliation       │
│  Claude assistant          │  │  Consolidation engine      │
└──────────────┬─────────────┘  └────────────┬───────────────┘
               │                             │
┌──────────────▼─────────────────────────────▼───────────────┐
│  EVENT BUS — Apache Kafka                                   │
│  All graph mutations · GL events · Outcome realizations    │
└──┬──────────────┬────────────────┬───────────────┬─────────┘
   │              │                │               │
┌──▼──┐      ┌───▼──┐        ┌────▼───┐      ┌────▼────┐
│Neo4j│      │ Time │        │  PG    │      │pgvector │
│Graph│      │scale │        │Audit/  │      │Node     │
│Store│      │GL    │        │Config  │      │Embed.   │
│     │      │Proj. │        │        │      │         │
└─────┘      └──────┘        └────────┘      └─────────┘
```

## CQRS Pattern — Mandatory

**Write model:** Neo4j. Every mutation goes here first. Full semantic context preserved.
Optimized for graph traversal — impact paths, control attenuation, consolidation.

**Read model:** TimescaleDB `gl_period_balances` table. Pre-aggregated by
(entity_id, period_id, node_ref_type, economic_category, statutory_code).
All financial reporting queries read from here. Millisecond response regardless of ledger size.

**Why this is non-negotiable:** At 500k LedgerLines/year (mid-market), you have 5M+ nodes
in 10 years. Traversing these live for every P&L request is O(n). The TimescaleDB projection
makes P&L queries O(1) in the number of distinct account groups per period.

**Projection function:** Kafka consumer subscribes to `ebg.gl.journal` topic.
On `JOURNAL_LINE_POSTED` event:
```sql
INSERT INTO gl_period_balances (entity_id, period_id, node_ref_type, economic_category,
  statutory_code, debit_total, credit_total)
VALUES (...)
ON CONFLICT (...) DO UPDATE SET
  debit_total  = gl_period_balances.debit_total  + EXCLUDED.debit_total,
  credit_total = gl_period_balances.credit_total + EXCLUDED.credit_total,
  net_balance  = (updated_debit) - (updated_credit),
  updated_at   = NOW();
```

**Consistency guarantee:** Nightly reconciliation job compares TimescaleDB totals to
Neo4j LedgerLine sums per (entity_id, period_id). Discrepancies trigger an alert and
halt the next period close until resolved.

## Bi-Temporal Data Model

Every JournalEntry and LedgerLine carries two independent time axes:

```
valid_time_start:       date    # When the economic event occurred (accounting date)
valid_time_end:         date?   # Null for open-ended; set for reversals
transaction_time_start: timestamp  # When recorded in system — IMMUTABLE, set by DB
transaction_time_end:   timestamp? # Set when superseded by correction; never deleted
```

**Why this is non-negotiable:** Auditors require the balance sheet "as it was known on
December 31" — excluding late-posted entries even if they relate to that date.
Without transaction_time, you can only produce the current view of the past, not the
view that existed at the time. This is a regulatory requirement in most jurisdictions.

## Cross-Store Saga Pattern

Every journal entry posting must atomically update four stores. Failure in any step
requires compensating rollback of all prior steps.

```
Step 1: Write JournalEntry + LedgerLine nodes to Neo4j
        COMPENSATING: DELETE the just-created nodes (by immutability_token)

Step 2: Write audit_log row to PostgreSQL
        COMPENSATING: DELETE the audit row

Step 3: Update gl_period_balances in TimescaleDB
        COMPENSATING: SUBTRACT the amounts that were added

Step 4: Emit JOURNAL_LINE_POSTED event to Kafka
        COMPENSATING: Cannot un-emit; instead emit JOURNAL_ENTRY_CANCELLED event
        NOTE: Kafka emission is the LAST step — if everything else succeeded,
              Kafka emission failure is retried until success (idempotency key prevents
              duplicate processing by consumers)
```

**Idempotency keys:** Every write carries a UUID idempotency_key. If the same key is
received twice (network retry), the second is a no-op. Prevents duplicate entries.

## Immutability Enforcement

```sql
-- Neo4j database-level enforcement
-- Create a restricted user for the application that cannot modify ledger nodes
CREATE USER ebg_app SET PASSWORD '...'
DENY WRITE ON GRAPH ebg TO ebg_app  -- start with deny all writes
GRANT WRITE ON GRAPH ebg NODES Activity, Project, Initiative,
  Outcome, Metric, Capability, Asset, CashFlowEvent,
  WorkforceAsset, CustomerRelationshipAsset, FloatWindow,
  TemporalClaim, Provision, Obligation, EpistemicActivity,
  SocialConstraint, StakeholderAsset, Entity, ConsolidationGroup,
  Goodwill, CashGeneratingUnit, ImpairmentTest, FixedAsset,
  FinancialInstrument, HedgeRelationship TO ebg_app

-- Ledger nodes: INSERT only, no UPDATE/DELETE
GRANT CREATE ON GRAPH ebg NODES JournalEntry, LedgerLine TO ebg_app
-- No GRANT for SET PROPERTY or DELETE on these labels
```

## Event Schema

All Kafka events follow this envelope:

```json
{
  "event_id": "uuid",
  "event_type": "JOURNAL_LINE_POSTED",
  "sequence_number": 12345,
  "idempotency_key": "uuid",
  "entity_id": "uuid",
  "period_id": "uuid",
  "timestamp": "2025-10-31T23:59:00Z",
  "payload": { ... event-specific fields ... }
}
```

Sequence numbers are monotonically increasing within a Kafka partition, keyed by entity_id.
Consumers must process events in sequence order and detect gaps.

## Data Store Responsibilities

### Neo4j — semantic truth
- All node types and their properties
- All relationship types and their properties
- Graph traversal queries (impact paths, consolidation, attenuation)
- Append-only ledger (JournalEntry, LedgerLine)
- No financial aggregation queries — those go to TimescaleDB

### TimescaleDB — reporting model
```sql
-- Primary GL projection table
CREATE TABLE gl_period_balances (
  entity_id       UUID NOT NULL,
  period_id       UUID NOT NULL,
  node_ref_type   TEXT NOT NULL,
  economic_category TEXT NOT NULL,
  statutory_code  TEXT,
  debit_total     NUMERIC(20,6) NOT NULL DEFAULT 0,
  credit_total    NUMERIC(20,6) NOT NULL DEFAULT 0,
  net_balance     NUMERIC(20,6) GENERATED ALWAYS AS (debit_total - credit_total) STORED,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (entity_id, period_id, node_ref_type, economic_category, COALESCE(statutory_code,''))
);

-- Metric observations (for KPI time-series)
CREATE TABLE metric_observations (
  time        TIMESTAMPTZ NOT NULL,
  node_id     UUID NOT NULL,
  value       FLOAT NOT NULL,
  unit        TEXT
);
SELECT create_hypertable('metric_observations', 'time', partitioning_column => 'node_id');
```

### PostgreSQL — operational data
```sql
-- Core tables
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID,
  event_type TEXT NOT NULL,
  node_id UUID,
  node_label TEXT,
  entity_id UUID,
  mutation_type TEXT,
  old_value JSONB,
  new_value JSONB,
  idempotency_key UUID UNIQUE,
  ip_address INET
);

CREATE TABLE calibration_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outcome_type TEXT NOT NULL,
  entity_id UUID,
  estimated_value NUMERIC(20,6),
  realized_value NUMERIC(20,6),
  accuracy_ratio NUMERIC(10,6) GENERATED ALWAYS AS (realized_value / NULLIF(estimated_value,0)) STORED,
  period_end DATE NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE statutory_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction TEXT NOT NULL,
  node_ref_type TEXT NOT NULL,
  economic_category TEXT NOT NULL,
  node_tags_match TEXT[],
  statutory_account_code TEXT NOT NULL,
  statutory_account_label TEXT NOT NULL,
  applies_from DATE NOT NULL,
  applies_until DATE,
  xbrl_element TEXT,
  xbrl_taxonomy TEXT
);
```

### pgvector — AI edge discovery
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE node_embeddings (
  node_id     UUID PRIMARY KEY,
  entity_id   UUID,
  node_label  TEXT,
  embedding   vector(1536),  -- OpenAI/Anthropic embedding dimension
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON node_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

AI-inferred edge discovery query:
```sql
SELECT a.node_id AS source, b.node_id AS target,
  1 - (a.embedding <=> b.embedding) AS cosine_similarity
FROM node_embeddings a, node_embeddings b
WHERE a.node_id <> b.node_id
  AND 1 - (a.embedding <=> b.embedding) > 0.82
  AND NOT EXISTS (
    SELECT 1 FROM contributes_to_cache
    WHERE source_id = a.node_id AND target_id = b.node_id
  )
ORDER BY cosine_similarity DESC
LIMIT 50;
```
