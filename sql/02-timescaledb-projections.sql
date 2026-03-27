-- ============================================================
-- 02-timescaledb-projections.sql
-- Enterprise Business Graph v1.2
-- Complete GL + equity projection tables
-- Run in TimescaleDB (PostgreSQL with extension)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- --- GL Period Balances (CQRS read model) ---
-- Primary financial reporting table. All P&L and balance sheet
-- queries read from here, never from Neo4j LedgerLines directly.

CREATE TABLE gl_period_balances (
  entity_id           UUID NOT NULL,
  period_id           UUID NOT NULL,
  fund_id             UUID,                  -- [v1.2-A] null for FOR_PROFIT, non-null for NFP
  node_ref_type       TEXT NOT NULL,         -- ACTIVITY, OUTCOME, CASHFLOWEVENT, etc.
  node_ref_id         UUID NOT NULL,         -- the specific graph node
  economic_category   TEXT NOT NULL,         -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  statutory_code      TEXT,                  -- from StatutoryMapping (traditional COA code)
  debit_total         NUMERIC NOT NULL DEFAULT 0,
  credit_total        NUMERIC NOT NULL DEFAULT 0,
  net_balance         NUMERIC NOT NULL DEFAULT 0,  -- debit_total - credit_total
  transaction_count   INT NOT NULL DEFAULT 0,
  last_updated        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_id, period_id, fund_id, node_ref_id, economic_category)
);

SELECT create_hypertable('gl_period_balances', 'period_id',
  chunk_time_interval => INTERVAL '3 months',
  if_not_exists => TRUE);

CREATE INDEX idx_glpb_entity_period ON gl_period_balances (entity_id, period_id);
CREATE INDEX idx_glpb_statutory ON gl_period_balances (entity_id, period_id, statutory_code);
CREATE INDEX idx_glpb_category ON gl_period_balances (entity_id, period_id, economic_category);
CREATE INDEX idx_glpb_fund ON gl_period_balances (entity_id, period_id, fund_id)
  WHERE fund_id IS NOT NULL;

COMMENT ON TABLE gl_period_balances IS
  'CQRS read model for all financial reporting. Projected from Neo4j LedgerLine
   events via Kafka consumer. Millisecond P&L/BS queries regardless of ledger size.
   fund_id added in v1.2-A for NFP fund accounting.';

-- --- Equity Period Balances [v1.2-E] ---
-- Separate projection for equity components (retained earnings + OCI)

CREATE TABLE equity_period_balances (
  entity_id       UUID NOT NULL,
  period_id       UUID NOT NULL,
  fund_id         UUID,                    -- for NFP net asset tracking
  component       TEXT NOT NULL,           -- RETAINED_EARNINGS, OCI_CTA, OCI_HEDGE, etc.
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  movement        NUMERIC NOT NULL DEFAULT 0,
  recycled_to_pnl NUMERIC NOT NULL DEFAULT 0,  -- OCI recycling only
  closing_balance NUMERIC NOT NULL DEFAULT 0,
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_id, period_id, fund_id, component)
);

SELECT create_hypertable('equity_period_balances', 'period_id',
  chunk_time_interval => INTERVAL '1 year',
  if_not_exists => TRUE);

CREATE INDEX idx_eqpb_entity_period ON equity_period_balances (entity_id, period_id);

COMMENT ON TABLE equity_period_balances IS
  'Equity component tracking: retained earnings, OCI by component,
   with recycling amounts. Enables fast balance sheet equity section queries.
   Added in v1.2-E.';

-- --- Metric Observations (unchanged from v1.0) ---

CREATE TABLE metric_observations (
  metric_id       UUID NOT NULL,
  entity_id       UUID NOT NULL,
  observed_at     TIMESTAMPTZ NOT NULL,
  value           NUMERIC NOT NULL,
  source          TEXT,
  PRIMARY KEY (metric_id, observed_at)
);

SELECT create_hypertable('metric_observations', 'observed_at',
  chunk_time_interval => INTERVAL '1 month',
  if_not_exists => TRUE);

-- --- Calibration History (PostgreSQL, not TimescaleDB) ---

CREATE TABLE calibration_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID NOT NULL,
  outcome_type    TEXT NOT NULL,
  period_id       UUID NOT NULL,
  realized_delta  NUMERIC NOT NULL,
  ci_point_estimate NUMERIC NOT NULL,
  accuracy        NUMERIC NOT NULL,        -- realized / estimated
  calibration_factor_before NUMERIC NOT NULL,
  calibration_factor_after  NUMERIC NOT NULL,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cal_entity_outcome ON calibration_history (entity_id, outcome_type);

-- --- Audit Log (PostgreSQL) ---

CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID,
  action          TEXT NOT NULL,           -- CREATE, UPDATE, DELETE, APPROVE, REJECT
  node_type       TEXT NOT NULL,
  node_id         UUID NOT NULL,
  user_id         UUID NOT NULL,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
  details         JSONB,
  sensitivity     INT DEFAULT 0            -- 0=normal, 1=financial, 2=PII, 3=restricted
);

CREATE INDEX idx_audit_entity ON audit_log (entity_id, timestamp DESC);
CREATE INDEX idx_audit_node ON audit_log (node_id);
CREATE INDEX idx_audit_user ON audit_log (user_id, timestamp DESC);

-- --- Statutory Mappings (PostgreSQL) ---

CREATE TABLE statutory_mappings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction          TEXT NOT NULL,       -- CA-ASPE, CA-ASNFPO, US-GAAP, US-ASC958,
                                             -- CA-TAX-CORP, CA-TAX-EXEMPT, US-TAX-1120, US-TAX-990
  node_ref_type         TEXT NOT NULL,
  economic_category     TEXT NOT NULL,
  node_tags_match       TEXT[],
  statutory_account_code TEXT NOT NULL,
  statutory_account_label TEXT NOT NULL,
  applies_from          DATE NOT NULL,
  applies_until         DATE,
  xbrl_element          TEXT,
  xbrl_taxonomy         TEXT
);

CREATE INDEX idx_sm_jurisdiction ON statutory_mappings (jurisdiction, node_ref_type, economic_category);

COMMENT ON TABLE statutory_mappings IS
  'Maps graph node_ref_type × economic_category to traditional COA codes.
   Jurisdiction values expanded in v1.2-A: CA-ASPE, CA-ASNFPO, US-GAAP, US-ASC958
   plus tax variants CA-TAX-CORP, CA-TAX-EXEMPT, US-TAX-1120, US-TAX-990.';

-- --- Reconciliation Runs (PostgreSQL) ---
-- Stores results of nightly Neo4j ↔ TimescaleDB reconciliation.

CREATE TABLE reconciliation_runs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date            TIMESTAMPTZ NOT NULL,
  status              TEXT NOT NULL,           -- BALANCED, DISCREPANCY, ERROR
  entity_id_filter    UUID,                    -- null = all entities
  period_id_filter    UUID,                    -- null = all periods
  total_pairs_checked INT NOT NULL DEFAULT 0,
  balanced_count      INT NOT NULL DEFAULT 0,
  discrepancy_count   INT NOT NULL DEFAULT 0,
  tolerance           NUMERIC NOT NULL DEFAULT 0.01,
  discrepancies       JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_ms         INT NOT NULL DEFAULT 0,
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recon_runs_date ON reconciliation_runs (created_at DESC);
CREATE INDEX idx_recon_runs_entity ON reconciliation_runs (entity_id_filter)
  WHERE entity_id_filter IS NOT NULL;

COMMENT ON TABLE reconciliation_runs IS
  'Stores nightly reconciliation results comparing Neo4j LedgerLine sums
   against TimescaleDB gl_period_balances per (entity_id, period_id).
   Added in P7-NIGHTLY-RECONCILIATION.';
