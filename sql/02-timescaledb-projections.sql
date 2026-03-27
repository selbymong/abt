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

-- --- NFP Reclassification History ---

CREATE TABLE IF NOT EXISTS nfp_reclassifications (
  id                    UUID PRIMARY KEY,
  fund_id               UUID NOT NULL,
  entity_id             UUID NOT NULL,
  from_class            TEXT NOT NULL,
  to_class              TEXT NOT NULL,
  amount                NUMERIC NOT NULL,
  reason                TEXT NOT NULL,
  reclassification_date DATE NOT NULL,
  journal_entry_id      UUID NOT NULL,
  approved_by           UUID,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nfp_reclass_entity ON nfp_reclassifications (entity_id);
CREATE INDEX idx_nfp_reclass_fund ON nfp_reclassifications (fund_id);
CREATE INDEX idx_nfp_reclass_date ON nfp_reclassifications (reclassification_date DESC);

COMMENT ON TABLE nfp_reclassifications IS
  'Tracks NFP net asset reclassifications when fund restrictions are met/expire.
   Added in P7-NFP-RECLASSIFICATION.';

-- --- AP Payment Runs ---

CREATE TABLE IF NOT EXISTS ap_payment_runs (
  id                UUID PRIMARY KEY,
  entity_id         UUID NOT NULL,
  period_id         UUID NOT NULL,
  payment_date      DATE NOT NULL,
  invoices_paid     INT NOT NULL DEFAULT 0,
  total_amount      NUMERIC NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'COMPLETED',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ap_payment_runs_entity ON ap_payment_runs (entity_id);
CREATE INDEX idx_ap_payment_runs_date ON ap_payment_runs (payment_date DESC);

COMMENT ON TABLE ap_payment_runs IS
  'Tracks AP payment run executions. Added in P8-AP-SUBLEDGER.';

-- --- Procurement 3-Way Matches ---

CREATE TABLE IF NOT EXISTS procurement_matches (
  id                UUID PRIMARY KEY,
  po_id             UUID NOT NULL,
  invoice_id        UUID NOT NULL,
  receipt_id        UUID NOT NULL,
  po_amount         NUMERIC NOT NULL,
  receipt_amount    NUMERIC NOT NULL,
  invoice_amount    NUMERIC NOT NULL,
  match_status      TEXT NOT NULL DEFAULT 'UNMATCHED',
  variance_amount   NUMERIC NOT NULL DEFAULT 0,
  variance_percent  NUMERIC NOT NULL DEFAULT 0,
  tolerance_percent NUMERIC NOT NULL DEFAULT 2,
  within_tolerance  BOOLEAN NOT NULL DEFAULT false,
  matched_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_procurement_matches_po ON procurement_matches (po_id);
CREATE INDEX idx_procurement_matches_invoice ON procurement_matches (invoice_id);
CREATE INDEX idx_procurement_matches_status ON procurement_matches (match_status);

COMMENT ON TABLE procurement_matches IS
  'Records 3-way match results between PO, goods receipt, and AP invoice.
   Added in P8-PROCUREMENT.';

-- --- Budget Lines ---

CREATE TABLE IF NOT EXISTS budget_lines (
  id                UUID PRIMARY KEY,
  budget_id         UUID NOT NULL,
  period_id         UUID NOT NULL,
  node_ref_id       UUID NOT NULL,
  node_ref_type     TEXT NOT NULL,
  economic_category TEXT NOT NULL,
  amount            NUMERIC NOT NULL DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_budget_lines_budget ON budget_lines (budget_id);
CREATE INDEX idx_budget_lines_period ON budget_lines (period_id);
CREATE INDEX idx_budget_lines_node ON budget_lines (node_ref_id);

COMMENT ON TABLE budget_lines IS
  'Stores budget amounts by period, node, and economic category.
   Budget header is a Neo4j node; lines are in PG for efficient variance queries.
   Added in P8-BUDGETING.';

-- --- FX Rates ---

CREATE TABLE IF NOT EXISTS fx_rates (
  id                UUID PRIMARY KEY,
  from_currency     TEXT NOT NULL,
  to_currency       TEXT NOT NULL,
  rate              NUMERIC NOT NULL,
  rate_date         DATE NOT NULL,
  source            TEXT NOT NULL DEFAULT 'MANUAL',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_currency, to_currency, rate_date)
);

CREATE INDEX idx_fx_rates_pair ON fx_rates (from_currency, to_currency, rate_date DESC);

COMMENT ON TABLE fx_rates IS
  'Exchange rates by currency pair and date for multi-currency transactions.
   Added in P8-MULTI-CURRENCY.';

-- --- FX Revaluation Runs ---

CREATE TABLE IF NOT EXISTS fx_revaluation_runs (
  id                  UUID PRIMARY KEY,
  entity_id           UUID NOT NULL,
  period_id           UUID NOT NULL,
  functional_currency TEXT NOT NULL,
  as_of_date          DATE NOT NULL,
  items_count         INT NOT NULL DEFAULT 0,
  total_gain_loss     NUMERIC NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fx_reval_runs_entity ON fx_revaluation_runs (entity_id);
CREATE INDEX idx_fx_reval_runs_period ON fx_revaluation_runs (period_id);

COMMENT ON TABLE fx_revaluation_runs IS
  'Audit trail for month-end FX revaluation runs.
   Added in P8-MULTI-CURRENCY.';

-- --- Intercompany Amortization Schedule ---

CREATE TABLE IF NOT EXISTS interco_amortization (
  id                  UUID PRIMARY KEY,
  loan_id             UUID NOT NULL,
  period_number       INT NOT NULL,
  payment_date        DATE NOT NULL,
  principal_payment   NUMERIC NOT NULL DEFAULT 0,
  interest_payment    NUMERIC NOT NULL DEFAULT 0,
  total_payment       NUMERIC NOT NULL DEFAULT 0,
  principal_remaining NUMERIC NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'PENDING',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interco_amort_loan ON interco_amortization (loan_id, period_number);
CREATE INDEX idx_interco_amort_status ON interco_amortization (loan_id, status);

COMMENT ON TABLE interco_amortization IS
  'Amortization schedule entries for intercompany loans.
   Added in P8-INTERCO-LOANS.';

-- --- Pay Runs ---

CREATE TABLE IF NOT EXISTS pay_runs (
  id                UUID PRIMARY KEY,
  entity_id         UUID NOT NULL,
  period_id         UUID NOT NULL,
  pay_date          DATE NOT NULL,
  pay_period_start  DATE NOT NULL,
  pay_period_end    DATE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'DRAFT',
  total_gross       NUMERIC NOT NULL DEFAULT 0,
  total_deductions  NUMERIC NOT NULL DEFAULT 0,
  total_net         NUMERIC NOT NULL DEFAULT 0,
  employee_count    INT NOT NULL DEFAULT 0,
  journal_entry_id  UUID,
  description       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pay_runs_entity ON pay_runs (entity_id);
CREATE INDEX idx_pay_runs_date ON pay_runs (pay_date DESC);

-- --- Pay Stubs ---

CREATE TABLE IF NOT EXISTS pay_stubs (
  id                UUID PRIMARY KEY,
  pay_run_id        UUID NOT NULL REFERENCES pay_runs(id),
  employee_id       UUID NOT NULL,
  employee_name     TEXT NOT NULL,
  gross_pay         NUMERIC NOT NULL DEFAULT 0,
  deductions        JSONB NOT NULL DEFAULT '[]',
  total_deductions  NUMERIC NOT NULL DEFAULT 0,
  net_pay           NUMERIC NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pay_stubs_run ON pay_stubs (pay_run_id);
CREATE INDEX idx_pay_stubs_employee ON pay_stubs (employee_id);

-- --- Payroll Remittances ---

CREATE TABLE IF NOT EXISTS payroll_remittances (
  id                UUID PRIMARY KEY,
  entity_id         UUID NOT NULL,
  remittance_type   TEXT NOT NULL,
  amount            NUMERIC NOT NULL,
  period_id         UUID NOT NULL,
  due_date          DATE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'PENDING',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payroll_remit_entity ON payroll_remittances (entity_id);
CREATE INDEX idx_payroll_remit_status ON payroll_remittances (status);

COMMENT ON TABLE pay_runs IS 'Payroll run headers. Added in P8-PAYROLL.';
COMMENT ON TABLE pay_stubs IS 'Individual employee pay stubs per run. Added in P8-PAYROLL.';
COMMENT ON TABLE payroll_remittances IS 'Statutory remittance tracking (CRA, IRS). Added in P8-PAYROLL.';

-- --- Users (Auth & RBAC) ---

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'VIEWER',
  status          TEXT NOT NULL DEFAULT 'ACTIVE',
  entity_ids      JSONB NOT NULL DEFAULT '[]',
  password_hash   TEXT NOT NULL,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_status ON users (status);

COMMENT ON TABLE users IS
  'Application users with role-based access control and entity-scoped permissions.
   Added in P8-AUTH-RBAC.';
