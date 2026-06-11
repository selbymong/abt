pg_dump: warning: there are circular foreign-key constraints on this table:
pg_dump: detail: hypertable
pg_dump: hint: You might not be able to restore the dump without using --disable-triggers or temporarily dropping the constraints.
pg_dump: hint: Consider using a full dump instead of a --data-only dump to avoid this problem.
pg_dump: warning: there are circular foreign-key constraints on this table:
pg_dump: detail: chunk
pg_dump: hint: You might not be able to restore the dump without using --disable-triggers or temporarily dropping the constraints.
pg_dump: hint: Consider using a full dump instead of a --data-only dump to avoid this problem.
pg_dump: warning: there are circular foreign-key constraints on this table:
pg_dump: detail: continuous_agg
pg_dump: hint: You might not be able to restore the dump without using --disable-triggers or temporarily dropping the constraints.
pg_dump: hint: Consider using a full dump instead of a --data-only dump to avoid this problem.
--
-- PostgreSQL database dump
--

\restrict VdsiYNrefNJ3rPHfjd3eqFIe9fqofKRwm4bPcOjOetphtnCJwqDT7gmRQA3gsbk

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.pay_stubs DROP CONSTRAINT IF EXISTS pay_stubs_pay_run_id_fkey;
ALTER TABLE IF EXISTS ONLY public.forecast_snapshot_lines DROP CONSTRAINT IF EXISTS forecast_snapshot_lines_snapshot_id_fkey;
DROP INDEX IF EXISTS public.metric_observations_observed_at_idx;
DROP INDEX IF EXISTS public.idx_users_status;
DROP INDEX IF EXISTS public.idx_users_role;
DROP INDEX IF EXISTS public.idx_users_email;
DROP INDEX IF EXISTS public.idx_sm_jurisdiction;
DROP INDEX IF EXISTS public.idx_recon_runs_entity;
DROP INDEX IF EXISTS public.idx_recon_runs_date;
DROP INDEX IF EXISTS public.idx_procurement_matches_status;
DROP INDEX IF EXISTS public.idx_procurement_matches_po;
DROP INDEX IF EXISTS public.idx_procurement_matches_invoice;
DROP INDEX IF EXISTS public.idx_payroll_remit_status;
DROP INDEX IF EXISTS public.idx_payroll_remit_entity;
DROP INDEX IF EXISTS public.idx_pay_stubs_run;
DROP INDEX IF EXISTS public.idx_pay_stubs_employee;
DROP INDEX IF EXISTS public.idx_pay_runs_entity;
DROP INDEX IF EXISTS public.idx_pay_runs_date;
DROP INDEX IF EXISTS public.idx_node_embeddings_cosine;
DROP INDEX IF EXISTS public.idx_nfp_reclass_fund;
DROP INDEX IF EXISTS public.idx_nfp_reclass_entity;
DROP INDEX IF EXISTS public.idx_nfp_reclass_date;
DROP INDEX IF EXISTS public.idx_interco_amort_status;
DROP INDEX IF EXISTS public.idx_interco_amort_loan;
DROP INDEX IF EXISTS public.idx_glpb_statutory;
DROP INDEX IF EXISTS public.idx_glpb_fund;
DROP INDEX IF EXISTS public.idx_glpb_entity_period;
DROP INDEX IF EXISTS public.idx_glpb_category;
DROP INDEX IF EXISTS public.idx_fx_reval_runs_period;
DROP INDEX IF EXISTS public.idx_fx_reval_runs_entity;
DROP INDEX IF EXISTS public.idx_fx_rates_pair;
DROP INDEX IF EXISTS public.idx_forecast_snap_year;
DROP INDEX IF EXISTS public.idx_forecast_snap_lines_snap;
DROP INDEX IF EXISTS public.idx_forecast_snap_lines_period;
DROP INDEX IF EXISTS public.idx_forecast_snap_entity;
DROP INDEX IF EXISTS public.idx_forecast_snap_budget;
DROP INDEX IF EXISTS public.idx_float_sync_runs_entity;
DROP INDEX IF EXISTS public.idx_float_mapping_ebg;
DROP INDEX IF EXISTS public.idx_eqpb_entity_period;
DROP INDEX IF EXISTS public.idx_config_scope;
DROP INDEX IF EXISTS public.idx_config_lookup;
DROP INDEX IF EXISTS public.idx_cal_entity_outcome;
DROP INDEX IF EXISTS public.idx_budget_lines_period;
DROP INDEX IF EXISTS public.idx_budget_lines_node;
DROP INDEX IF EXISTS public.idx_budget_lines_budget;
DROP INDEX IF EXISTS public.idx_audit_user;
DROP INDEX IF EXISTS public.idx_audit_sensitivity;
DROP INDEX IF EXISTS public.idx_audit_node;
DROP INDEX IF EXISTS public.idx_audit_entity;
DROP INDEX IF EXISTS public.idx_ap_payment_runs_entity;
DROP INDEX IF EXISTS public.idx_ap_payment_runs_date;
DROP INDEX IF EXISTS public.gl_period_balances_period_id_idx;
DROP INDEX IF EXISTS public.equity_period_balances_period_id_idx;
DROP INDEX IF EXISTS _timescaledb_internal._hyper_2_2_chunk_idx_eqpb_entity_period;
DROP INDEX IF EXISTS _timescaledb_internal._hyper_2_2_chunk_equity_period_balances_period_id_idx;
DROP INDEX IF EXISTS _timescaledb_internal._hyper_1_1_chunk_idx_glpb_statutory;
DROP INDEX IF EXISTS _timescaledb_internal._hyper_1_1_chunk_idx_glpb_fund;
DROP INDEX IF EXISTS _timescaledb_internal._hyper_1_1_chunk_idx_glpb_entity_period;
DROP INDEX IF EXISTS _timescaledb_internal._hyper_1_1_chunk_idx_glpb_category;
DROP INDEX IF EXISTS _timescaledb_internal._hyper_1_1_chunk_gl_period_balances_period_id_idx;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.statutory_mappings DROP CONSTRAINT IF EXISTS statutory_mappings_pkey;
ALTER TABLE IF EXISTS ONLY public.reconciliation_runs DROP CONSTRAINT IF EXISTS reconciliation_runs_pkey;
ALTER TABLE IF EXISTS ONLY public.procurement_matches DROP CONSTRAINT IF EXISTS procurement_matches_pkey;
ALTER TABLE IF EXISTS ONLY public.payroll_remittances DROP CONSTRAINT IF EXISTS payroll_remittances_pkey;
ALTER TABLE IF EXISTS ONLY public.pay_stubs DROP CONSTRAINT IF EXISTS pay_stubs_pkey;
ALTER TABLE IF EXISTS ONLY public.pay_runs DROP CONSTRAINT IF EXISTS pay_runs_pkey;
ALTER TABLE IF EXISTS ONLY public.node_embeddings DROP CONSTRAINT IF EXISTS node_embeddings_pkey;
ALTER TABLE IF EXISTS ONLY public.nfp_reclassifications DROP CONSTRAINT IF EXISTS nfp_reclassifications_pkey;
ALTER TABLE IF EXISTS ONLY public.metric_observations DROP CONSTRAINT IF EXISTS metric_observations_pkey;
ALTER TABLE IF EXISTS ONLY public.interco_amortization DROP CONSTRAINT IF EXISTS interco_amortization_pkey;
ALTER TABLE IF EXISTS ONLY public.gl_period_balances DROP CONSTRAINT IF EXISTS gl_period_balances_pkey;
ALTER TABLE IF EXISTS ONLY public.fx_revaluation_runs DROP CONSTRAINT IF EXISTS fx_revaluation_runs_pkey;
ALTER TABLE IF EXISTS ONLY public.fx_rates DROP CONSTRAINT IF EXISTS fx_rates_pkey;
ALTER TABLE IF EXISTS ONLY public.fx_rates DROP CONSTRAINT IF EXISTS fx_rates_from_currency_to_currency_rate_date_key;
ALTER TABLE IF EXISTS ONLY public.forecast_snapshots DROP CONSTRAINT IF EXISTS forecast_snapshots_pkey;
ALTER TABLE IF EXISTS ONLY public.forecast_snapshot_lines DROP CONSTRAINT IF EXISTS forecast_snapshot_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.float_sync_state DROP CONSTRAINT IF EXISTS float_sync_state_pkey;
ALTER TABLE IF EXISTS ONLY public.float_sync_runs DROP CONSTRAINT IF EXISTS float_sync_runs_pkey;
ALTER TABLE IF EXISTS ONLY public.float_id_mapping DROP CONSTRAINT IF EXISTS float_id_mapping_pkey;
ALTER TABLE IF EXISTS ONLY public.float_id_mapping DROP CONSTRAINT IF EXISTS float_id_mapping_entity_id_float_type_float_id_key;
ALTER TABLE IF EXISTS ONLY public.equity_period_balances DROP CONSTRAINT IF EXISTS equity_period_balances_pkey;
ALTER TABLE IF EXISTS ONLY public.configuration_settings DROP CONSTRAINT IF EXISTS configuration_settings_setting_key_scope_type_scope_id_scop_key;
ALTER TABLE IF EXISTS ONLY public.configuration_settings DROP CONSTRAINT IF EXISTS configuration_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.calibration_history DROP CONSTRAINT IF EXISTS calibration_history_pkey;
ALTER TABLE IF EXISTS ONLY public.budget_lines DROP CONSTRAINT IF EXISTS budget_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_log DROP CONSTRAINT IF EXISTS audit_log_pkey;
ALTER TABLE IF EXISTS ONLY public.ap_payment_runs DROP CONSTRAINT IF EXISTS ap_payment_runs_pkey;
ALTER TABLE IF EXISTS ONLY public.access_audit_log DROP CONSTRAINT IF EXISTS access_audit_log_pkey;
ALTER TABLE IF EXISTS ONLY _timescaledb_internal._hyper_2_2_chunk DROP CONSTRAINT IF EXISTS "2_2_equity_period_balances_pkey";
ALTER TABLE IF EXISTS ONLY _timescaledb_internal._hyper_1_1_chunk DROP CONSTRAINT IF EXISTS "1_1_gl_period_balances_pkey";
ALTER TABLE IF EXISTS _timescaledb_internal._hyper_2_2_chunk ALTER COLUMN last_updated DROP DEFAULT;
ALTER TABLE IF EXISTS _timescaledb_internal._hyper_2_2_chunk ALTER COLUMN closing_balance DROP DEFAULT;
ALTER TABLE IF EXISTS _timescaledb_internal._hyper_2_2_chunk ALTER COLUMN recycled_to_pnl DROP DEFAULT;
ALTER TABLE IF EXISTS _timescaledb_internal._hyper_2_2_chunk ALTER COLUMN movement DROP DEFAULT;
ALTER TABLE IF EXISTS _timescaledb_internal._hyper_2_2_chunk ALTER COLUMN opening_balance DROP DEFAULT;
ALTER TABLE IF EXISTS _timescaledb_internal._hyper_1_1_chunk ALTER COLUMN last_updated DROP DEFAULT;
ALTER TABLE IF EXISTS _timescaledb_internal._hyper_1_1_chunk ALTER COLUMN transaction_count DROP DEFAULT;
ALTER TABLE IF EXISTS _timescaledb_internal._hyper_1_1_chunk ALTER COLUMN net_balance DROP DEFAULT;
ALTER TABLE IF EXISTS _timescaledb_internal._hyper_1_1_chunk ALTER COLUMN credit_total DROP DEFAULT;
ALTER TABLE IF EXISTS _timescaledb_internal._hyper_1_1_chunk ALTER COLUMN debit_total DROP DEFAULT;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.statutory_mappings;
DROP TABLE IF EXISTS public.reconciliation_runs;
DROP TABLE IF EXISTS public.procurement_matches;
DROP TABLE IF EXISTS public.payroll_remittances;
DROP TABLE IF EXISTS public.pay_stubs;
DROP TABLE IF EXISTS public.pay_runs;
DROP TABLE IF EXISTS public.node_embeddings;
DROP TABLE IF EXISTS public.nfp_reclassifications;
DROP TABLE IF EXISTS public.metric_observations;
DROP TABLE IF EXISTS public.interco_amortization;
DROP TABLE IF EXISTS public.fx_revaluation_runs;
DROP TABLE IF EXISTS public.fx_rates;
DROP TABLE IF EXISTS public.forecast_snapshots;
DROP TABLE IF EXISTS public.forecast_snapshot_lines;
DROP TABLE IF EXISTS public.float_sync_state;
DROP TABLE IF EXISTS public.float_sync_runs;
DROP TABLE IF EXISTS public.float_id_mapping;
DROP TABLE IF EXISTS public.configuration_settings;
DROP TABLE IF EXISTS public.calibration_history;
DROP TABLE IF EXISTS public.budget_lines;
DROP TABLE IF EXISTS public.audit_log;
DROP TABLE IF EXISTS public.ap_payment_runs;
DROP TABLE IF EXISTS public.access_audit_log;
DROP TABLE IF EXISTS _timescaledb_internal._hyper_2_2_chunk;
DROP TABLE IF EXISTS public.equity_period_balances;
DROP TABLE IF EXISTS _timescaledb_internal._hyper_1_1_chunk;
DROP TABLE IF EXISTS public.gl_period_balances;
DROP EXTENSION IF EXISTS vector;
DROP EXTENSION IF EXISTS timescaledb;
--
-- Name: timescaledb; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS timescaledb WITH SCHEMA public;


--
-- Name: EXTENSION timescaledb; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION timescaledb IS 'Enables scalable inserts and complex queries for time-series data (Community Edition)';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: gl_period_balances; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.gl_period_balances (
    entity_id uuid NOT NULL,
    period_id uuid NOT NULL,
    fund_id uuid NOT NULL,
    node_ref_type text NOT NULL,
    node_ref_id uuid NOT NULL,
    economic_category text NOT NULL,
    statutory_code text,
    debit_total numeric DEFAULT 0 NOT NULL,
    credit_total numeric DEFAULT 0 NOT NULL,
    net_balance numeric DEFAULT 0 NOT NULL,
    transaction_count integer DEFAULT 0 NOT NULL,
    last_updated timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.gl_period_balances OWNER TO ebg;

--
-- Name: TABLE gl_period_balances; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.gl_period_balances IS 'CQRS read model for all financial reporting. Projected from Neo4j LedgerLine
   events via Kafka consumer. Millisecond P&L/BS queries regardless of ledger size.
   fund_id added in v1.2-A for NFP fund accounting.';


--
-- Name: _hyper_1_1_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: ebg
--

CREATE TABLE _timescaledb_internal._hyper_1_1_chunk (
    CONSTRAINT constraint_1 CHECK (((period_id >= '019ccabe-6000-0000-0000-000000000000'::uuid) AND (period_id < '019e9a3a-b800-0000-0000-000000000000'::uuid)))
)
INHERITS (public.gl_period_balances);


ALTER TABLE _timescaledb_internal._hyper_1_1_chunk OWNER TO ebg;

--
-- Name: equity_period_balances; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.equity_period_balances (
    entity_id uuid NOT NULL,
    period_id uuid NOT NULL,
    fund_id uuid NOT NULL,
    component text NOT NULL,
    opening_balance numeric DEFAULT 0 NOT NULL,
    movement numeric DEFAULT 0 NOT NULL,
    recycled_to_pnl numeric DEFAULT 0 NOT NULL,
    closing_balance numeric DEFAULT 0 NOT NULL,
    last_updated timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.equity_period_balances OWNER TO ebg;

--
-- Name: TABLE equity_period_balances; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.equity_period_balances IS 'Equity component tracking: retained earnings, OCI by component,
   with recycling amounts. Enables fast balance sheet equity section queries.
   Added in v1.2-E.';


--
-- Name: _hyper_2_2_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: ebg
--

CREATE TABLE _timescaledb_internal._hyper_2_2_chunk (
    CONSTRAINT constraint_2 CHECK (((period_id >= '019ccabe-6000-0000-0000-000000000000'::uuid) AND (period_id < '01a408af-c000-0000-0000-000000000000'::uuid)))
)
INHERITS (public.equity_period_balances);


ALTER TABLE _timescaledb_internal._hyper_2_2_chunk OWNER TO ebg;

--
-- Name: access_audit_log; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.access_audit_log (
    id uuid NOT NULL,
    entity_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text NOT NULL,
    sensitivity_level text DEFAULT 'LOW'::text NOT NULL,
    ip_address text,
    details text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT access_audit_log_action_check CHECK ((action = ANY (ARRAY['READ'::text, 'WRITE'::text, 'DELETE'::text, 'EXPORT'::text]))),
    CONSTRAINT access_audit_log_sensitivity_level_check CHECK ((sensitivity_level = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text, 'CRITICAL'::text])))
);


ALTER TABLE public.access_audit_log OWNER TO ebg;

--
-- Name: TABLE access_audit_log; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.access_audit_log IS 'Compliance audit log for tracking access to sensitive resources';


--
-- Name: ap_payment_runs; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.ap_payment_runs (
    id uuid NOT NULL,
    entity_id uuid NOT NULL,
    period_id uuid NOT NULL,
    payment_date date NOT NULL,
    invoices_paid integer DEFAULT 0 NOT NULL,
    total_amount numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'COMPLETED'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ap_payment_runs OWNER TO ebg;

--
-- Name: TABLE ap_payment_runs; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.ap_payment_runs IS 'Tracks AP payment run executions. Added in P8-AP-SUBLEDGER.';


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_id uuid,
    action text NOT NULL,
    node_type text NOT NULL,
    node_id uuid NOT NULL,
    user_id uuid NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    details jsonb,
    sensitivity integer DEFAULT 0
);


ALTER TABLE public.audit_log OWNER TO ebg;

--
-- Name: budget_lines; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.budget_lines (
    id uuid NOT NULL,
    budget_id uuid NOT NULL,
    period_id uuid NOT NULL,
    node_ref_id uuid NOT NULL,
    node_ref_type text NOT NULL,
    economic_category text NOT NULL,
    amount numeric(20,4) DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    seasonality_profile text
);


ALTER TABLE public.budget_lines OWNER TO ebg;

--
-- Name: TABLE budget_lines; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.budget_lines IS 'Stores budget amounts by period, node, and economic category.
   Budget header is a Neo4j node; lines are in PG for efficient variance queries.
   Added in P8-BUDGETING.';


--
-- Name: calibration_history; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.calibration_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_id uuid NOT NULL,
    outcome_type text NOT NULL,
    period_id uuid NOT NULL,
    realized_delta numeric NOT NULL,
    ci_point_estimate numeric NOT NULL,
    accuracy numeric NOT NULL,
    calibration_factor_before numeric NOT NULL,
    calibration_factor_after numeric NOT NULL,
    computed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.calibration_history OWNER TO ebg;

--
-- Name: configuration_settings; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.configuration_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key text NOT NULL,
    scope_type text NOT NULL,
    scope_id uuid,
    scope_id_2 uuid,
    value_type text NOT NULL,
    value_string text,
    value_numeric numeric,
    value_boolean boolean,
    value_json jsonb,
    valid_from date NOT NULL,
    valid_until date,
    transaction_time timestamp with time zone DEFAULT now() NOT NULL,
    changed_by uuid NOT NULL,
    change_reason text,
    requires_restatement boolean DEFAULT false,
    CONSTRAINT configuration_settings_scope_type_check CHECK ((scope_type = ANY (ARRAY['SYSTEM'::text, 'ENTITY'::text, 'ENTITY_PAIR'::text, 'PROGRAM'::text, 'OUTCOME'::text]))),
    CONSTRAINT configuration_settings_value_type_check CHECK ((value_type = ANY (ARRAY['STRING'::text, 'NUMERIC'::text, 'BOOLEAN'::text, 'JSON'::text, 'ENUM'::text])))
);


ALTER TABLE public.configuration_settings OWNER TO ebg;

--
-- Name: TABLE configuration_settings; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.configuration_settings IS 'Bi-temporal configuration store. All system/entity/policy settings.
   Replaces hardcoded values and "open decisions" from v1.0 spec.';


--
-- Name: float_id_mapping; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.float_id_mapping (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_id uuid NOT NULL,
    float_type text NOT NULL,
    float_id text NOT NULL,
    ebg_id uuid NOT NULL,
    ebg_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT float_id_mapping_float_type_check CHECK ((float_type = ANY (ARRAY['TRANSACTION'::text, 'BILL'::text, 'REIMBURSEMENT'::text, 'GL_CODE'::text, 'VENDOR'::text, 'TAX_CODE'::text, 'PAYMENT'::text])))
);


ALTER TABLE public.float_id_mapping OWNER TO ebg;

--
-- Name: float_sync_runs; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.float_sync_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_id uuid NOT NULL,
    sync_type text NOT NULL,
    direction text NOT NULL,
    items_fetched integer DEFAULT 0 NOT NULL,
    items_imported integer DEFAULT 0 NOT NULL,
    items_skipped integer DEFAULT 0 NOT NULL,
    items_failed integer DEFAULT 0 NOT NULL,
    errors jsonb,
    duration_ms integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT float_sync_runs_direction_check CHECK ((direction = ANY (ARRAY['INBOUND'::text, 'OUTBOUND'::text])))
);


ALTER TABLE public.float_sync_runs OWNER TO ebg;

--
-- Name: float_sync_state; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.float_sync_state (
    entity_id uuid NOT NULL,
    sync_type text NOT NULL,
    last_synced_at timestamp with time zone,
    last_cursor text,
    last_run_id uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT float_sync_state_sync_type_check CHECK ((sync_type = ANY (ARRAY['TRANSACTIONS'::text, 'BILLS'::text, 'REIMBURSEMENTS'::text, 'GL_CODES'::text, 'VENDORS'::text, 'TAX_CODES'::text])))
);


ALTER TABLE public.float_sync_state OWNER TO ebg;

--
-- Name: forecast_snapshot_lines; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.forecast_snapshot_lines (
    id uuid NOT NULL,
    snapshot_id uuid NOT NULL,
    period_id uuid NOT NULL,
    node_ref_id uuid NOT NULL,
    node_ref_type text NOT NULL,
    economic_category text NOT NULL,
    forecast_amount numeric NOT NULL,
    budget_amount numeric NOT NULL,
    adjustment_reason text
);


ALTER TABLE public.forecast_snapshot_lines OWNER TO ebg;

--
-- Name: TABLE forecast_snapshot_lines; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.forecast_snapshot_lines IS 'Individual forecast line items frozen at snapshot time. Includes both
   the forecasted amount and original budget for three-way comparison
   (budget vs forecast vs actual). Added in P8-FORECAST-SNAPSHOTS.';


--
-- Name: forecast_snapshots; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.forecast_snapshots (
    id uuid NOT NULL,
    budget_id uuid NOT NULL,
    entity_id uuid NOT NULL,
    name text NOT NULL,
    fiscal_year integer NOT NULL,
    currency text NOT NULL,
    snapshot_type text DEFAULT 'ROLLING'::text NOT NULL,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text
);


ALTER TABLE public.forecast_snapshots OWNER TO ebg;

--
-- Name: TABLE forecast_snapshots; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.forecast_snapshots IS 'Point-in-time capture of forecast values during a budgetary cycle.
   Preserves forecast assumptions so they can be compared against actuals
   after the fact. Added in P8-FORECAST-SNAPSHOTS.';


--
-- Name: fx_rates; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.fx_rates (
    id uuid NOT NULL,
    from_currency text NOT NULL,
    to_currency text NOT NULL,
    rate numeric NOT NULL,
    rate_date date NOT NULL,
    source text DEFAULT 'MANUAL'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fx_rates OWNER TO ebg;

--
-- Name: TABLE fx_rates; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.fx_rates IS 'Exchange rates by currency pair and date for multi-currency transactions.
   Added in P8-MULTI-CURRENCY.';


--
-- Name: fx_revaluation_runs; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.fx_revaluation_runs (
    id uuid NOT NULL,
    entity_id uuid NOT NULL,
    period_id uuid NOT NULL,
    functional_currency text NOT NULL,
    as_of_date date NOT NULL,
    items_count integer DEFAULT 0 NOT NULL,
    total_gain_loss numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fx_revaluation_runs OWNER TO ebg;

--
-- Name: TABLE fx_revaluation_runs; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.fx_revaluation_runs IS 'Audit trail for month-end FX revaluation runs.
   Added in P8-MULTI-CURRENCY.';


--
-- Name: interco_amortization; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.interco_amortization (
    id uuid NOT NULL,
    loan_id uuid NOT NULL,
    period_number integer NOT NULL,
    payment_date date NOT NULL,
    principal_payment numeric DEFAULT 0 NOT NULL,
    interest_payment numeric DEFAULT 0 NOT NULL,
    total_payment numeric DEFAULT 0 NOT NULL,
    principal_remaining numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.interco_amortization OWNER TO ebg;

--
-- Name: TABLE interco_amortization; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.interco_amortization IS 'Amortization schedule entries for intercompany loans.
   Added in P8-INTERCO-LOANS.';


--
-- Name: metric_observations; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.metric_observations (
    metric_id uuid NOT NULL,
    entity_id uuid NOT NULL,
    observed_at timestamp with time zone NOT NULL,
    value numeric NOT NULL,
    source text
);


ALTER TABLE public.metric_observations OWNER TO ebg;

--
-- Name: nfp_reclassifications; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.nfp_reclassifications (
    id uuid NOT NULL,
    fund_id uuid NOT NULL,
    entity_id uuid NOT NULL,
    from_class text NOT NULL,
    to_class text NOT NULL,
    amount numeric NOT NULL,
    reason text NOT NULL,
    reclassification_date date NOT NULL,
    journal_entry_id uuid NOT NULL,
    approved_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.nfp_reclassifications OWNER TO ebg;

--
-- Name: TABLE nfp_reclassifications; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.nfp_reclassifications IS 'Tracks NFP net asset reclassifications when fund restrictions are met/expire.
   Added in P7-NFP-RECLASSIFICATION.';


--
-- Name: node_embeddings; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.node_embeddings (
    node_id uuid NOT NULL,
    entity_id uuid,
    node_label text,
    embedding public.vector(1536),
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.node_embeddings OWNER TO ebg;

--
-- Name: pay_runs; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.pay_runs (
    id uuid NOT NULL,
    entity_id uuid NOT NULL,
    period_id uuid NOT NULL,
    pay_date date NOT NULL,
    pay_period_start date NOT NULL,
    pay_period_end date NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    total_gross numeric DEFAULT 0 NOT NULL,
    total_deductions numeric DEFAULT 0 NOT NULL,
    total_net numeric DEFAULT 0 NOT NULL,
    employee_count integer DEFAULT 0 NOT NULL,
    journal_entry_id uuid,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pay_runs OWNER TO ebg;

--
-- Name: TABLE pay_runs; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.pay_runs IS 'Payroll run headers. Added in P8-PAYROLL.';


--
-- Name: pay_stubs; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.pay_stubs (
    id uuid NOT NULL,
    pay_run_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    employee_name text NOT NULL,
    gross_pay numeric DEFAULT 0 NOT NULL,
    deductions jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_deductions numeric DEFAULT 0 NOT NULL,
    net_pay numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pay_stubs OWNER TO ebg;

--
-- Name: TABLE pay_stubs; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.pay_stubs IS 'Individual employee pay stubs per run. Added in P8-PAYROLL.';


--
-- Name: payroll_remittances; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.payroll_remittances (
    id uuid NOT NULL,
    entity_id uuid NOT NULL,
    remittance_type text NOT NULL,
    amount numeric NOT NULL,
    period_id uuid NOT NULL,
    due_date date NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payroll_remittances OWNER TO ebg;

--
-- Name: TABLE payroll_remittances; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.payroll_remittances IS 'Statutory remittance tracking (CRA, IRS). Added in P8-PAYROLL.';


--
-- Name: procurement_matches; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.procurement_matches (
    id uuid NOT NULL,
    po_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    receipt_id uuid NOT NULL,
    po_amount numeric NOT NULL,
    receipt_amount numeric NOT NULL,
    invoice_amount numeric NOT NULL,
    match_status text DEFAULT 'UNMATCHED'::text NOT NULL,
    variance_amount numeric DEFAULT 0 NOT NULL,
    variance_percent numeric DEFAULT 0 NOT NULL,
    tolerance_percent numeric DEFAULT 2 NOT NULL,
    within_tolerance boolean DEFAULT false NOT NULL,
    matched_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.procurement_matches OWNER TO ebg;

--
-- Name: TABLE procurement_matches; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.procurement_matches IS 'Records 3-way match results between PO, goods receipt, and AP invoice.
   Added in P8-PROCUREMENT.';


--
-- Name: reconciliation_runs; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.reconciliation_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    run_date timestamp with time zone NOT NULL,
    status text NOT NULL,
    entity_id_filter uuid,
    period_id_filter uuid,
    total_pairs_checked integer DEFAULT 0 NOT NULL,
    balanced_count integer DEFAULT 0 NOT NULL,
    discrepancy_count integer DEFAULT 0 NOT NULL,
    tolerance numeric DEFAULT 0.01 NOT NULL,
    discrepancies jsonb DEFAULT '[]'::jsonb NOT NULL,
    duration_ms integer DEFAULT 0 NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.reconciliation_runs OWNER TO ebg;

--
-- Name: TABLE reconciliation_runs; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.reconciliation_runs IS 'Stores nightly reconciliation results comparing Neo4j LedgerLine sums
   against TimescaleDB gl_period_balances per (entity_id, period_id).
   Added in P7-NIGHTLY-RECONCILIATION.';


--
-- Name: statutory_mappings; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.statutory_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    jurisdiction text NOT NULL,
    node_ref_type text NOT NULL,
    economic_category text NOT NULL,
    node_tags_match text[],
    statutory_account_code text NOT NULL,
    statutory_account_label text NOT NULL,
    applies_from date NOT NULL,
    applies_until date,
    xbrl_element text,
    xbrl_taxonomy text
);


ALTER TABLE public.statutory_mappings OWNER TO ebg;

--
-- Name: TABLE statutory_mappings; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.statutory_mappings IS 'Maps graph node_ref_type × economic_category to traditional COA codes.
   Jurisdiction values expanded in v1.2-A: CA-ASPE, CA-ASNFPO, US-GAAP, US-ASC958
   plus tax variants CA-TAX-CORP, CA-TAX-EXEMPT, US-TAX-1120, US-TAX-990.';


--
-- Name: users; Type: TABLE; Schema: public; Owner: ebg
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    role text DEFAULT 'VIEWER'::text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    entity_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    password_hash text NOT NULL,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO ebg;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: ebg
--

COMMENT ON TABLE public.users IS 'Application users with role-based access control and entity-scoped permissions.
   Added in P8-AUTH-RBAC.';


--
-- Name: _hyper_1_1_chunk debit_total; Type: DEFAULT; Schema: _timescaledb_internal; Owner: ebg
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_1_chunk ALTER COLUMN debit_total SET DEFAULT 0;


--
-- Name: _hyper_1_1_chunk credit_total; Type: DEFAULT; Schema: _timescaledb_internal; Owner: ebg
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_1_chunk ALTER COLUMN credit_total SET DEFAULT 0;


--
-- Name: _hyper_1_1_chunk net_balance; Type: DEFAULT; Schema: _timescaledb_internal; Owner: ebg
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_1_chunk ALTER COLUMN net_balance SET DEFAULT 0;


--
-- Name: _hyper_1_1_chunk transaction_count; Type: DEFAULT; Schema: _timescaledb_internal; Owner: ebg
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_1_chunk ALTER COLUMN transaction_count SET DEFAULT 0;


--
-- Name: _hyper_1_1_chunk last_updated; Type: DEFAULT; Schema: _timescaledb_internal; Owner: ebg
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_1_chunk ALTER COLUMN last_updated SET DEFAULT now();


--
-- Name: _hyper_2_2_chunk opening_balance; Type: DEFAULT; Schema: _timescaledb_internal; Owner: ebg
--

ALTER TABLE ONLY _timescaledb_internal._hyper_2_2_chunk ALTER COLUMN opening_balance SET DEFAULT 0;


--
-- Name: _hyper_2_2_chunk movement; Type: DEFAULT; Schema: _timescaledb_internal; Owner: ebg
--

ALTER TABLE ONLY _timescaledb_internal._hyper_2_2_chunk ALTER COLUMN movement SET DEFAULT 0;


--
-- Name: _hyper_2_2_chunk recycled_to_pnl; Type: DEFAULT; Schema: _timescaledb_internal; Owner: ebg
--

ALTER TABLE ONLY _timescaledb_internal._hyper_2_2_chunk ALTER COLUMN recycled_to_pnl SET DEFAULT 0;


--
-- Name: _hyper_2_2_chunk closing_balance; Type: DEFAULT; Schema: _timescaledb_internal; Owner: ebg
--

ALTER TABLE ONLY _timescaledb_internal._hyper_2_2_chunk ALTER COLUMN closing_balance SET DEFAULT 0;


--
-- Name: _hyper_2_2_chunk last_updated; Type: DEFAULT; Schema: _timescaledb_internal; Owner: ebg
--

ALTER TABLE ONLY _timescaledb_internal._hyper_2_2_chunk ALTER COLUMN last_updated SET DEFAULT now();


--
-- Data for Name: hypertable; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.hypertable (id, schema_name, table_name, associated_schema_name, associated_table_prefix, num_dimensions, chunk_sizing_func_schema, chunk_sizing_func_name, chunk_target_size, compression_state, compressed_hypertable_id, status) FROM stdin;
1	public	gl_period_balances	_timescaledb_internal	_hyper_1	1	_timescaledb_functions	calculate_chunk_interval	0	0	\N	0
2	public	equity_period_balances	_timescaledb_internal	_hyper_2	1	_timescaledb_functions	calculate_chunk_interval	0	0	\N	0
3	public	metric_observations	_timescaledb_internal	_hyper_3	1	_timescaledb_functions	calculate_chunk_interval	0	0	\N	0
\.


--
-- Data for Name: bgw_job; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.bgw_job (id, application_name, schedule_interval, max_runtime, max_retries, retry_period, proc_schema, proc_name, owner, scheduled, fixed_schedule, initial_start, hypertable_id, config, check_schema, check_name, timezone) FROM stdin;
\.


--
-- Data for Name: chunk; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.chunk (id, hypertable_id, schema_name, table_name, compressed_chunk_id, status, osm_chunk, creation_time) FROM stdin;
1	1	_timescaledb_internal	_hyper_1_1_chunk	\N	0	f	2026-03-25 03:06:19.490901+00
2	2	_timescaledb_internal	_hyper_2_2_chunk	\N	0	f	2026-03-25 22:18:17.949278+00
\.


--
-- Data for Name: chunk_column_stats; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.chunk_column_stats (id, hypertable_id, chunk_id, column_name, range_start, range_end, valid) FROM stdin;
\.


--
-- Data for Name: dimension; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.dimension (id, hypertable_id, column_name, column_type, aligned, num_slices, partitioning_func_schema, partitioning_func, interval_length, compress_interval_length, integer_now_func_schema, integer_now_func) FROM stdin;
1	1	period_id	uuid	t	\N	\N	\N	7776000000000	\N	\N	\N
2	2	period_id	uuid	t	\N	\N	\N	31104000000000	\N	\N	\N
3	3	observed_at	timestamp with time zone	t	\N	\N	\N	2592000000000	\N	\N	\N
\.


--
-- Data for Name: dimension_slice; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.dimension_slice (id, dimension_id, range_start, range_end) FROM stdin;
1	1	1772928000000000	1780704000000000
2	2	1772928000000000	1804032000000000
\.


--
-- Data for Name: chunk_constraint; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.chunk_constraint (chunk_id, dimension_slice_id, constraint_name, hypertable_constraint_name) FROM stdin;
1	1	constraint_1	\N
1	\N	1_1_gl_period_balances_pkey	gl_period_balances_pkey
2	2	constraint_2	\N
2	\N	2_2_equity_period_balances_pkey	equity_period_balances_pkey
\.


--
-- Data for Name: compression_chunk_size; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.compression_chunk_size (chunk_id, compressed_chunk_id, uncompressed_heap_size, uncompressed_toast_size, uncompressed_index_size, compressed_heap_size, compressed_toast_size, compressed_index_size, numrows_pre_compression, numrows_post_compression, numrows_frozen_immediately) FROM stdin;
\.


--
-- Data for Name: compression_settings; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.compression_settings (relid, compress_relid, segmentby, orderby, orderby_desc, orderby_nullsfirst, index) FROM stdin;
\.


--
-- Data for Name: continuous_agg; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.continuous_agg (mat_hypertable_id, raw_hypertable_id, parent_mat_hypertable_id, user_view_schema, user_view_name, partial_view_schema, partial_view_name, direct_view_schema, direct_view_name, materialized_only) FROM stdin;
\.


--
-- Data for Name: continuous_aggs_bucket_function; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.continuous_aggs_bucket_function (mat_hypertable_id, bucket_func, bucket_width, bucket_origin, bucket_offset, bucket_timezone, bucket_fixed_width) FROM stdin;
\.


--
-- Data for Name: continuous_aggs_hypertable_invalidation_log; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.continuous_aggs_hypertable_invalidation_log (hypertable_id, lowest_modified_value, greatest_modified_value) FROM stdin;
\.


--
-- Data for Name: continuous_aggs_invalidation_threshold; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.continuous_aggs_invalidation_threshold (hypertable_id, watermark) FROM stdin;
\.


--
-- Data for Name: continuous_aggs_materialization_invalidation_log; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.continuous_aggs_materialization_invalidation_log (materialization_id, lowest_modified_value, greatest_modified_value) FROM stdin;
\.


--
-- Data for Name: continuous_aggs_materialization_ranges; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.continuous_aggs_materialization_ranges (materialization_id, lowest_modified_value, greatest_modified_value) FROM stdin;
\.


--
-- Data for Name: continuous_aggs_watermark; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.continuous_aggs_watermark (mat_hypertable_id, watermark) FROM stdin;
\.


--
-- Data for Name: metadata; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.metadata (key, value, include_in_telemetry) FROM stdin;
install_timestamp	2026-03-25 01:40:09.499337+00	t
timescaledb_version	2.26.0	f
\.


--
-- Data for Name: tablespace; Type: TABLE DATA; Schema: _timescaledb_catalog; Owner: ebg
--

COPY _timescaledb_catalog.tablespace (id, hypertable_id, tablespace_name) FROM stdin;
\.


--
-- Data for Name: _hyper_1_1_chunk; Type: TABLE DATA; Schema: _timescaledb_internal; Owner: ebg
--

COPY _timescaledb_internal._hyper_1_1_chunk (entity_id, period_id, fund_id, node_ref_type, node_ref_id, economic_category, statutory_code, debit_total, credit_total, net_balance, transaction_count, last_updated) FROM stdin;
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4c8f-7262-9856-48b5daebfd1a	00000000-0000-0000-0000-000000000000	ACTIVITY	f4a8514d-92ce-4151-bb56-11cfaba62261	EXPENSE	\N	420.0000	0	420.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4c8f-7262-9856-48b5daebfd1a	00000000-0000-0000-0000-000000000000	ACTIVITY	32b9287c-e3d5-4dc7-bf04-f2207685ee87	EXPENSE	\N	216.0000	0	216.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4c8f-7262-9856-48b5daebfd1a	00000000-0000-0000-0000-000000000000	ACTIVITY	d97120a3-56de-485a-a36c-e31823453dd1	EXPENSE	\N	60.0000	0	60.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4c8f-7262-9856-48b5daebfd1a	00000000-0000-0000-0000-000000000000	ACTIVITY	578c417a-55df-4870-a9ac-16eb6284b795	EXPENSE	\N	120.0000	0	120.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4c8f-7262-9856-48b5daebfd1a	00000000-0000-0000-0000-000000000000	ACTIVITY	e971a6cd-073e-4525-a2e2-a8da870ce527	EXPENSE	\N	24.0000	0	24.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4c8f-7262-9856-48b5daebfd1a	00000000-0000-0000-0000-000000000000	ACTIVITY	72692a21-cec7-48a9-8c88-5ccb68219613	EXPENSE	\N	72.0000	0	72.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4c8f-7262-9856-48b5daebfd1a	00000000-0000-0000-0000-000000000000	ACTIVITY	15a10f16-6c53-4d56-b6cf-f4d2b512caf2	EXPENSE	\N	180.0000	0	180.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4c8f-7262-9856-48b5daebfd1a	00000000-0000-0000-0000-000000000000	ACTIVITY	23f5e7d1-daf2-415f-8f84-d46fa4f4eb6a	EXPENSE	\N	250.0000	0	250.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4c8f-7262-9856-48b5daebfd1a	00000000-0000-0000-0000-000000000000	ACTIVITY	3994e1af-4705-444f-be4b-8d9002857f02	EXPENSE	\N	5000.0000	0	5000.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4c8f-7262-9856-48b5daebfd1a	00000000-0000-0000-0000-000000000000	ACTIVITY	65992400-69eb-417c-a374-90ce7868902c	EXPENSE	\N	99.0000	0	99.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	f4a8514d-92ce-4151-bb56-11cfaba62261	EXPENSE	\N	1020.0000	0	1020.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	32b9287c-e3d5-4dc7-bf04-f2207685ee87	EXPENSE	\N	1200.0000	0	1200.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	d97120a3-56de-485a-a36c-e31823453dd1	EXPENSE	\N	420.0000	0	420.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	1f08727b-beb3-41c0-9ef7-939a009e470c	EXPENSE	\N	660.0000	0	660.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	578c417a-55df-4870-a9ac-16eb6284b795	EXPENSE	\N	1200.0000	0	1200.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	021f1e9a-8031-43df-8e7b-db5fa43d6228	EXPENSE	\N	360.0000	0	360.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	e971a6cd-073e-4525-a2e2-a8da870ce527	EXPENSE	\N	300.0000	0	300.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	72692a21-cec7-48a9-8c88-5ccb68219613	EXPENSE	\N	420.0000	0	420.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	b6f2d2a2-5f3c-4ab8-9aa6-4630d6934590	EXPENSE	\N	360.0000	0	360.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	da5b48c4-e352-4072-b253-8d882cd4ee2b	EXPENSE	\N	900.0000	0	900.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	15a10f16-6c53-4d56-b6cf-f4d2b512caf2	EXPENSE	\N	180.0000	0	180.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	23f5e7d1-daf2-415f-8f84-d46fa4f4eb6a	EXPENSE	\N	250.0000	0	250.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	3994e1af-4705-444f-be4b-8d9002857f02	EXPENSE	\N	5000.0000	0	5000.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	3702abb4-5761-42c8-b59d-7fe6d507b7c5	EXPENSE	\N	25000.0000	0	25000.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	65992400-69eb-417c-a374-90ce7868902c	EXPENSE	\N	99.0000	0	99.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	f4a8514d-92ce-4151-bb56-11cfaba62261	EXPENSE	\N	2436.0000	0	2436.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	32b9287c-e3d5-4dc7-bf04-f2207685ee87	EXPENSE	\N	2436.0000	0	2436.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	d97120a3-56de-485a-a36c-e31823453dd1	EXPENSE	\N	936.0000	0	936.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	1f08727b-beb3-41c0-9ef7-939a009e470c	EXPENSE	\N	1308.0000	0	1308.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	578c417a-55df-4870-a9ac-16eb6284b795	EXPENSE	\N	2892.0000	0	2892.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	021f1e9a-8031-43df-8e7b-db5fa43d6228	EXPENSE	\N	564.0000	0	564.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	e971a6cd-073e-4525-a2e2-a8da870ce527	EXPENSE	\N	588.0000	0	588.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	72692a21-cec7-48a9-8c88-5ccb68219613	EXPENSE	\N	1032.0000	0	1032.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	b6f2d2a2-5f3c-4ab8-9aa6-4630d6934590	EXPENSE	\N	588.0000	0	588.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	da5b48c4-e352-4072-b253-8d882cd4ee2b	EXPENSE	\N	1908.0000	0	1908.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	15a10f16-6c53-4d56-b6cf-f4d2b512caf2	EXPENSE	\N	180.0000	0	180.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	23f5e7d1-daf2-415f-8f84-d46fa4f4eb6a	EXPENSE	\N	500.0000	0	500.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	3994e1af-4705-444f-be4b-8d9002857f02	EXPENSE	\N	10000.0000	0	10000.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	3702abb4-5761-42c8-b59d-7fe6d507b7c5	EXPENSE	\N	30000.0000	0	30000.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	65992400-69eb-417c-a374-90ce7868902c	EXPENSE	\N	99.0000	0	99.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	f4a8514d-92ce-4151-bb56-11cfaba62261	EXPENSE	\N	4800.0000	0	4800.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	32b9287c-e3d5-4dc7-bf04-f2207685ee87	EXPENSE	\N	4500.0000	0	4500.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	d97120a3-56de-485a-a36c-e31823453dd1	EXPENSE	\N	1800.0000	0	1800.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	1f08727b-beb3-41c0-9ef7-939a009e470c	EXPENSE	\N	2400.0000	0	2400.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	578c417a-55df-4870-a9ac-16eb6284b795	EXPENSE	\N	5700.0000	0	5700.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	021f1e9a-8031-43df-8e7b-db5fa43d6228	EXPENSE	\N	900.0000	0	900.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	e971a6cd-073e-4525-a2e2-a8da870ce527	EXPENSE	\N	1080.0000	0	1080.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	72692a21-cec7-48a9-8c88-5ccb68219613	EXPENSE	\N	2040.0000	0	2040.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	b6f2d2a2-5f3c-4ab8-9aa6-4630d6934590	EXPENSE	\N	960.0000	0	960.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	da5b48c4-e352-4072-b253-8d882cd4ee2b	EXPENSE	\N	3600.0000	0	3600.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	15a10f16-6c53-4d56-b6cf-f4d2b512caf2	EXPENSE	\N	180.0000	0	180.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	23f5e7d1-daf2-415f-8f84-d46fa4f4eb6a	EXPENSE	\N	500.0000	0	500.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	3994e1af-4705-444f-be4b-8d9002857f02	EXPENSE	\N	10000.0000	0	10000.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	3702abb4-5761-42c8-b59d-7fe6d507b7c5	EXPENSE	\N	35000.0000	0	35000.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	65992400-69eb-417c-a374-90ce7868902c	EXPENSE	\N	99.0000	0	99.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	f4a8514d-92ce-4151-bb56-11cfaba62261	EXPENSE	\N	6756.0000	0	6756.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	32b9287c-e3d5-4dc7-bf04-f2207685ee87	EXPENSE	\N	7572.0000	0	7572.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	d97120a3-56de-485a-a36c-e31823453dd1	EXPENSE	\N	2256.0000	0	2256.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	1f08727b-beb3-41c0-9ef7-939a009e470c	EXPENSE	\N	4800.0000	0	4800.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	578c417a-55df-4870-a9ac-16eb6284b795	EXPENSE	\N	11328.0000	0	11328.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	021f1e9a-8031-43df-8e7b-db5fa43d6228	EXPENSE	\N	1572.0000	0	1572.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	e971a6cd-073e-4525-a2e2-a8da870ce527	EXPENSE	\N	2160.0000	0	2160.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	72692a21-cec7-48a9-8c88-5ccb68219613	EXPENSE	\N	3036.0000	0	3036.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	b6f2d2a2-5f3c-4ab8-9aa6-4630d6934590	EXPENSE	\N	1320.0000	0	1320.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	da5b48c4-e352-4072-b253-8d882cd4ee2b	EXPENSE	\N	4800.0000	0	4800.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	15a10f16-6c53-4d56-b6cf-f4d2b512caf2	EXPENSE	\N	180.0000	0	180.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	23f5e7d1-daf2-415f-8f84-d46fa4f4eb6a	EXPENSE	\N	500.0000	0	500.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	3994e1af-4705-444f-be4b-8d9002857f02	EXPENSE	\N	15000.0000	0	15000.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	3702abb4-5761-42c8-b59d-7fe6d507b7c5	EXPENSE	\N	40000.0000	0	40000.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	65992400-69eb-417c-a374-90ce7868902c	EXPENSE	\N	99.0000	0	99.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4c8f-7262-9856-48b5daebfd1a	00000000-0000-0000-0000-000000000000	ACTIVITY	baf63e93-e117-47de-b3a9-8c1140c48a64	REVENUE	\N	0	4410.0000	4410.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4c8f-7262-9856-48b5daebfd1a	00000000-0000-0000-0000-000000000000	ACTIVITY	692fda8f-4036-4529-bb83-2d8ee00d1a38	REVENUE	\N	0	3000.0000	3000.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	baf63e93-e117-47de-b3a9-8c1140c48a64	REVENUE	\N	0	87248.0000	87248.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1	00000000-0000-0000-0000-000000000000	ACTIVITY	692fda8f-4036-4529-bb83-2d8ee00d1a38	REVENUE	\N	0	31500.0000	31500.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	baf63e93-e117-47de-b3a9-8c1140c48a64	REVENUE	\N	0	282744.0000	282744.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cad-7499-887d-7d2a1d8441f3	00000000-0000-0000-0000-000000000000	ACTIVITY	692fda8f-4036-4529-bb83-2d8ee00d1a38	REVENUE	\N	0	96000.0000	96000.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	baf63e93-e117-47de-b3a9-8c1140c48a64	REVENUE	\N	0	697950.0000	697950.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cb8-74ac-9d55-4fd443572d58	00000000-0000-0000-0000-000000000000	ACTIVITY	692fda8f-4036-4529-bb83-2d8ee00d1a38	REVENUE	\N	0	225000.0000	225000.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	baf63e93-e117-47de-b3a9-8c1140c48a64	REVENUE	\N	0	1760000.0000	1760000.0000	1	2026-03-28 21:50:37.971135+00
14f8f707-8a84-40df-8bda-399cf12eb33d	019d366d-4cc2-7429-a601-4ef3590d4948	00000000-0000-0000-0000-000000000000	ACTIVITY	692fda8f-4036-4529-bb83-2d8ee00d1a38	REVENUE	\N	0	504000.0000	504000.0000	1	2026-03-28 21:50:37.971135+00
\.


--
-- Data for Name: _hyper_2_2_chunk; Type: TABLE DATA; Schema: _timescaledb_internal; Owner: ebg
--

COPY _timescaledb_internal._hyper_2_2_chunk (entity_id, period_id, fund_id, component, opening_balance, movement, recycled_to_pnl, closing_balance, last_updated) FROM stdin;
\.


--
-- Data for Name: access_audit_log; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.access_audit_log (id, entity_id, user_id, action, resource_type, resource_id, sensitivity_level, ip_address, details, created_at) FROM stdin;
\.


--
-- Data for Name: ap_payment_runs; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.ap_payment_runs (id, entity_id, period_id, payment_date, invoices_paid, total_amount, status, created_at) FROM stdin;
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.audit_log (id, entity_id, action, node_type, node_id, user_id, "timestamp", details, sensitivity) FROM stdin;
474c90f8-f015-4b74-8502-acd64f8c975a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6fee59fd-d338-4fbc-8eb4-93989fa74843	00000000-0000-0000-0000-000000000000	2026-03-25 15:32:49.082595+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
0a3790ad-a85d-48ac-8110-7ec70cc9abbf	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	75232233-3b77-4b21-9031-585c9480709c	00000000-0000-0000-0000-000000000000	2026-03-25 15:32:50.380231+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
ab7e07e2-882d-4377-bbd6-99e7c78254f9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	48bbe89d-952a-4724-bc0f-9a46dcf86c79	00000000-0000-0000-0000-000000000000	2026-03-25 15:32:50.420792+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
8a62e508-7fe0-445b-8c58-3429b9469f6b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a568ec54-15c0-4d6f-91db-0625121dbefd	00000000-0000-0000-0000-000000000000	2026-03-25 15:32:50.477328+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
6e0e31b8-119d-4c67-9981-6d237b5f189e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5f4c648c-2075-41e7-bb0d-a6ec4f28e9b2	00000000-0000-0000-0000-000000000000	2026-03-25 15:32:50.619331+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
d8f56017-071d-407f-8fdd-a6f324c98a2e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	12dc771e-13d9-4b25-957d-4122d0bafc3f	00000000-0000-0000-0000-000000000000	2026-03-25 15:32:50.698321+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
329a5264-f234-4db2-95f7-c16b6634b2ba	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	20947c5f-4477-4d47-b0b8-4287a1b7888f	00000000-0000-0000-0000-000000000000	2026-03-25 15:32:50.839652+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
accd99fb-608e-4324-9092-da8a513d4fdb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	81f36621-6ed6-4f58-b790-6058f9182b7a	00000000-0000-0000-0000-000000000000	2026-03-25 15:32:50.937546+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
b6b33a5b-0276-4255-84d2-1ac27166f70f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0385db71-3a86-417d-bca8-5d20bd61ba81	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:06.452682+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
a764a42e-fc8b-4796-b402-9c966d9fd944	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	555a6fa9-b9d0-44e2-92cb-a59eb055e7b7	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:06.600669+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
20702eeb-5840-4140-a5fc-e1077ffc1faa	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	01649e1e-2388-4fdc-8349-1183bfaf71d9	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:06.790425+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
1c986960-d78a-431f-8f3d-d7505209905b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	cdd26ee7-23ce-4ce5-a139-614bed5d4bd4	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:06.832095+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
ed8e9d6c-7c4b-453c-8613-617d0e958a81	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	78cd03a8-e55c-4923-8a67-28e9f1dee0ea	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:06.919627+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
42bad972-04f3-49e1-8122-71771939b5b8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fbff4693-2985-43f6-8c38-821b4b5dd645	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:07.024141+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
118cd3f4-0232-49ae-8e74-3fe40b7ba4e4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	845c1c2c-5aa0-465f-91c8-5e797650721d	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:07.188074+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
8972a7b3-7396-42df-8cb6-00fdfe5b8a32	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	44c96d4f-dedb-4e26-9100-96fd87ff5ff0	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:07.31011+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
52f44188-12af-4449-91ad-7c353f57d871	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8750af53-a489-44df-af34-6e5fb70b84d3	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:20.561033+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
fcced533-e3a4-4713-ae63-0ddf5354e6e6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b3318e4c-1c2e-4440-9afb-ea19932c27d0	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:20.651095+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
0c6107de-7109-4c62-964f-fc534f887df9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	dd44e0ac-35f7-4aca-b7f4-698133b0eae6	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:20.837876+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
c6638c50-cfd2-4930-ad0d-ba81a919300b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f5c9eec1-492e-4da2-8b71-ac108921b974	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:20.885442+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
ff8c4c11-d8ed-4301-94b7-a67cbd149b99	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e288ed5f-87c5-4746-b407-0eeeb97524fd	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:21.007237+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
51fd5359-0e26-424c-bfa3-570ded09fd06	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	17e37c33-728f-4d7e-9712-96ef58d6d640	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:21.048655+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
96a912a7-3b1f-49d8-ab77-47cd1a4973aa	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0efcfd1f-d90f-4504-96ed-f92ee021def4	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:21.245697+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
afd95d6e-a5ad-4228-9085-7f0fd10b8290	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c02257f5-8e79-4850-8262-eeaf77066d15	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:21.35254+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
69b72ae1-e0bf-43bd-b9ae-c84a9c9bb8f4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f773a6dc-9bf0-4903-a7be-feba7ec992aa	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:32.105351+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
8b748426-a3c9-4f1e-8c74-6fc26a707511	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a2ea5228-059c-4642-8e43-e67472147c84	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:32.547374+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
96d543d1-4419-4e83-8b5b-a0fba2fbd27e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2fcaf550-d90c-46b0-9f37-fc0f84cce0be	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:32.781521+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
d2e33785-381c-49f2-9e25-0cc96dbcc919	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9f21377b-d1a1-4857-9879-0fb38f0372d4	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:32.907323+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
85273ac5-2566-4a8c-9d82-d20ab95043cf	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8ae7748d-b044-4302-b6cc-1f81573d24b9	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:33.029329+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
c3eaeeb8-3b3e-4fc1-9677-2fbbd6963b47	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	28f61a91-33ce-4880-abb4-0872ea0d7967	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:33.163364+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
e7fdd0fb-6105-4902-a1ff-cbfc3d9388d3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	23fc0674-5819-4305-bb88-61ae89843538	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:33.476843+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
5e0cf673-644f-4036-a4e7-174cd3a95eb6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1ab4a829-3118-49f7-87d1-7fbff5830ef4	00000000-0000-0000-0000-000000000000	2026-03-25 15:33:33.833224+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
52d2fe66-131a-43c9-83a2-05059b4cc7a2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	87f679f9-e7aa-49fb-87fb-365dc6c26e44	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:12.898136+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
75bc135b-09f4-46b2-a398-540b447b632d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ca217f8e-279c-4d62-85bf-2740efdcc20d	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:13.585059+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
c3cd6b3d-42cd-4c57-9335-501d16128106	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b05934e2-3746-4a25-9464-3598f4b5a865	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:13.829293+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
805ed11b-6827-4d16-8b96-796479ce999d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	64d9c59d-840a-45ac-938a-f477057f4c7f	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:15.045662+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
2e1c11f2-35d3-4aee-965f-90ba75096e67	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fbd852ae-0d65-4d90-a2da-29ed33554ee7	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:15.190649+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
49627d31-e7af-497e-a5ee-f24592cc0e7f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	079b7ebc-4748-44ca-b3cb-4d0d9f09dabd	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:15.293185+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
f3bbb9e6-d71a-4b68-8513-97630173f458	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e935677b-acb5-4354-bedb-38ce5f97a975	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:15.686541+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
e19a2e80-79cc-44df-83f6-9013f475e12c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c01e9e73-cc66-4fb7-b121-9f9ed0ce3108	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:15.818122+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
5c783025-88dd-4090-85bf-d16a1b1f5ebe	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	48f4dcf4-e50b-439f-a554-bf3a929cb803	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:35.568948+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
e1f8e100-0ada-47d1-ace7-f22914662b20	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	11d3c781-75f1-4771-a99a-95afa300f737	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:36.579606+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
e1a12686-22d7-4b5c-baed-f48fd213843b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7b30b8ff-c51d-4511-90c7-96bfa6c38a01	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:37.253145+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
ddeeef97-5c57-469d-b750-026f9fd4f00c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1a3b1f05-5711-4557-87ab-997b329fdd55	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:37.319607+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
b6c54daa-b50c-4de1-b817-f5927e22a77c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4830719e-0c88-4e12-961e-2d4410b63b3e	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:37.415445+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
4fd1f78f-b080-4b94-85b4-7a7d29bc02e3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2a41af1e-c1c9-47d9-8659-2e7f58695b1b	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:37.469961+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
d8c39425-c4b3-46e7-9551-4bb60bad3645	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	94ebb463-280a-4eae-8692-6dd0769fd167	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:37.643352+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
fa4ffa5f-58dc-405e-94f3-afab2b6b1618	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a1ff066c-6e6f-4cde-82be-99cb98d0772e	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:37.739678+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
b9b61212-4a55-4f67-b307-42483ad42370	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9df2e6e7-bc57-49c2-8e27-c70d6687eede	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:43.831976+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
28c2031a-8b37-4fa6-a3dd-31a6965671ce	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	40732e07-0f02-4e78-9ea5-b9265f11dc50	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:43.932618+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
76d6bf85-1385-4ce7-b32e-cacca6387b73	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1a9893c0-241d-49a5-b80e-ea8e4481e974	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:44.111201+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
93d956f7-0ecb-4711-be28-d707a9eb7c1d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	41f81e5b-e374-43a2-8329-0e8b124a9ab2	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:44.159305+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
b1bf87db-f27c-4f23-a346-29a98f25cea5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	088bed57-7896-48ff-baa9-b46774809209	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:44.408367+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
7a494d27-0b87-47d5-868e-cdd5da5befc1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a3ed33b4-b53c-499d-bf85-a78573e615a0	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:44.447895+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
073441fe-bc35-4d44-97e8-36906c51a967	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	21392616-5ad5-44ec-97b9-dd5d052359ff	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:44.625796+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
32f60c18-5176-4109-9126-0d81f207cc87	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a9d3f94c-c244-46ff-b794-a4188d5ab4da	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:44.759038+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
ca5523f5-e9f9-463c-8502-3552bc4aaeec	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8b381fdb-f16b-4d80-baa7-eb213020cd8f	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:53.252424+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
0cce0eeb-3cac-4ca1-971e-d9949b8d9b87	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e92abf47-7850-4a5a-823a-9a1b4e7f18ef	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:53.369508+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
90e5727f-be58-4c56-962c-949260d05666	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9f52f5b4-3e74-4a46-bdcb-b8fe06d97285	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:54.358783+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
cfe3962b-95d7-40a6-944d-84d75a5fda96	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	59928faf-a401-4095-b7e5-4d4c3401b861	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:55.434823+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
81a46ae4-e5a1-47f3-ab0f-7b21f8915aac	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	25951010-49d3-4246-87bc-672c259cb90d	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:55.52108+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
cefd9e26-13a0-46a4-b4cd-cc5f4470865d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	05ad6e34-f13c-408f-9871-6c81645aeff0	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:55.561228+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
3787aa5b-984a-4193-940b-7934468d91ca	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4728bdc7-e172-482b-aeb4-4245ebd664d2	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:55.697638+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
a970a5c8-5c0e-4410-ad86-1e08e66a16db	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	66037660-9340-4510-a9e9-603b0244fd1a	00000000-0000-0000-0000-000000000000	2026-03-25 15:59:56.167809+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
e2d68199-bc9d-4170-8772-6305881b314d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	aec24324-55dc-4766-beea-356bc479e63e	00000000-0000-0000-0000-000000000000	2026-03-25 16:00:06.483164+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
e6211b95-cbdf-4c2e-929c-153e93442a37	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1800a047-52a5-48c4-97bc-fd0b2b1d4918	00000000-0000-0000-0000-000000000000	2026-03-25 16:00:06.600135+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
5eb9be3d-66f5-4e8a-8c17-d9fb923d42f4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	83c57a26-5da8-479c-a730-154c82306099	00000000-0000-0000-0000-000000000000	2026-03-25 16:00:06.776008+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
6da4a60d-d9a7-4438-ae5d-0eb87338c7ad	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	edec388a-2a06-4dbf-86ad-65dbe7185be5	00000000-0000-0000-0000-000000000000	2026-03-25 16:00:06.836301+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
a8b5e7f5-6185-4264-b511-f87100dbdf3d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1c890da5-ab4a-4826-b4fc-73e175275151	00000000-0000-0000-0000-000000000000	2026-03-25 16:00:06.932184+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
08051047-28e1-4739-aa60-31c844f1962c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0e6a67dd-0131-4907-a0fd-f1606dbd8c53	00000000-0000-0000-0000-000000000000	2026-03-25 16:00:06.995759+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
db691303-cec5-4129-9e1a-60641a4019a4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	415b6f7c-1862-41de-92d8-710d64447eb5	00000000-0000-0000-0000-000000000000	2026-03-25 16:00:07.167817+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
35f68189-2e1f-4340-a0b0-0f9764af0890	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7b63866f-a7e3-4b19-9140-b1289073d6cc	00000000-0000-0000-0000-000000000000	2026-03-25 16:00:07.269847+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
5019da00-ad2c-4c87-ac83-d83e9255a75c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8f971c00-ea75-4e6b-9dcd-ee903e06efb1	00000000-0000-0000-0000-000000000000	2026-03-25 16:00:13.815439+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
03f978b8-9f13-400d-a1d4-cfd440cedc6d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	dfb32a40-3208-433e-8ace-d7e913424722	00000000-0000-0000-0000-000000000000	2026-03-25 16:00:14.949645+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
2134c3e6-147a-4d82-b029-3edc5da86985	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6a515730-2601-457f-b3b0-07b9ca5956a4	00000000-0000-0000-0000-000000000000	2026-03-25 16:00:15.789505+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
09b1682a-7d81-48dc-b418-8e70950002b9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f1006bf3-aa70-4682-95a2-2b4c35ad0d19	00000000-0000-0000-0000-000000000000	2026-03-25 16:00:16.298257+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
4d9713cb-07c7-4ea3-aa77-fafd521003f4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a8032672-efdc-4b7a-b771-7d833c36e810	00000000-0000-0000-0000-000000000000	2026-03-25 16:00:17.031305+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
ae72a471-26f1-45ad-94bb-9816482f0979	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8da8b7a8-4e0c-4209-a0d2-553923cf8b02	00000000-0000-0000-0000-000000000000	2026-03-25 16:00:17.651907+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
16084e70-3276-4aad-a0d0-eea7650fb84e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	834462f4-075c-4fbb-985b-4b58fd371ced	00000000-0000-0000-0000-000000000000	2026-03-25 16:00:18.481866+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
31f53a7d-8904-42a9-9637-6b53f41b9146	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9ae4e8d1-2f52-4bba-8b7b-8d70eb561bfd	00000000-0000-0000-0000-000000000000	2026-03-25 16:00:18.603578+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
2423dc46-19a7-40bc-93a1-1f281ada25dc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3703741e-743e-4bd3-a1a6-6654d9a04635	00000000-0000-0000-0000-000000000000	2026-03-25 16:12:56.626878+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
9b3db45e-d6f4-489e-af85-254067a9b17e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5637d80f-e21d-4c2d-92a4-313c8807cf6a	00000000-0000-0000-0000-000000000000	2026-03-25 16:12:57.032213+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
c73ba697-9f28-4e58-928a-61f0d59336d2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2b879145-18c0-4d15-9f1e-a0474152faa4	00000000-0000-0000-0000-000000000000	2026-03-25 16:12:57.076775+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
aa247ccb-48a8-46ef-a09f-6ccb3113d211	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8cd895f5-1e74-4b92-acc3-29c380548bfa	00000000-0000-0000-0000-000000000000	2026-03-25 16:12:57.136136+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
681e97a5-3ab4-4c65-bbba-f15f966766a2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	17ecca2b-4a0a-493e-b2e6-3d4e159a6f7c	00000000-0000-0000-0000-000000000000	2026-03-25 16:12:57.220518+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
6b6ab2a9-d034-429f-ab92-c6cac36e3e19	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	61eea957-115b-4dd6-abb4-9c8aab404195	00000000-0000-0000-0000-000000000000	2026-03-25 16:12:57.266453+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
b5d7aacc-fc8e-44be-870c-e89532509760	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	abcb5c2b-2776-48c1-9c4a-cbd8ba62d8cf	00000000-0000-0000-0000-000000000000	2026-03-25 16:13:58.728184+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
40e742a1-7c4c-43e0-bc24-5d663da84c3f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b5cf2577-5df8-4770-ad16-f3b8e5c82df2	00000000-0000-0000-0000-000000000000	2026-03-25 16:13:59.392717+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
1f43a6a5-d530-47b8-869a-e9ed2ccb710d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	df3ad215-1971-4947-ba14-c3c5e5f55c38	00000000-0000-0000-0000-000000000000	2026-03-25 16:13:59.456422+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
cadcf8ec-b29f-41f0-a4cb-706f49090d99	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e851e4ae-af65-43b0-9022-3cc016ab91fc	00000000-0000-0000-0000-000000000000	2026-03-25 16:13:59.520319+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
574694a2-8baa-4a31-bcf4-2158f249113d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a7b8dcfe-c695-46b6-bf5c-4f3b895614ef	00000000-0000-0000-0000-000000000000	2026-03-25 16:13:59.58661+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
308fedfe-1ab9-4eee-bfa4-be7d7abeda67	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2c97c9d4-956f-4476-9bf9-30b8b609926e	00000000-0000-0000-0000-000000000000	2026-03-25 16:13:59.626898+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
b9f554b5-7a99-4cb9-96cf-623f63db1ef7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	999ebb6a-878e-4674-a000-1fad4e09adc0	00000000-0000-0000-0000-000000000000	2026-03-25 16:14:06.034871+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
8a5f978e-8944-4891-a790-f4e130a5d325	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	246c95c8-4b8b-4c7e-9a69-7dd7c6c86e30	00000000-0000-0000-0000-000000000000	2026-03-25 16:14:06.142087+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
4d803f96-2659-465d-8351-ddca16429a4c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ae44dcf1-c3fc-42e2-887b-e559bef7f66c	00000000-0000-0000-0000-000000000000	2026-03-25 16:14:06.167033+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
5288e02a-7e7b-4ba1-b509-6268b4c59ba8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9600f585-14a7-4298-91e0-ff2c14627957	00000000-0000-0000-0000-000000000000	2026-03-25 16:14:06.277423+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
e4893843-119e-4d21-8e0e-2de916152e55	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9a3779e1-5ceb-4f8b-a7f1-378d2fd97f4c	00000000-0000-0000-0000-000000000000	2026-03-25 16:14:06.299878+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
b907dad2-51f1-4b33-afd4-00189db9dbf3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d307571a-87d1-450a-8f38-e17f13639032	00000000-0000-0000-0000-000000000000	2026-03-25 16:14:06.336329+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
f48ef93a-ece6-41ca-85ad-f4e8007f303e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4b92a7c7-053b-4ae0-a321-73ca358ea10e	00000000-0000-0000-0000-000000000000	2026-03-25 16:14:06.34002+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
800831c1-2558-48b4-a33e-e47ea4ec2dae	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	93ecc1dc-bee2-4e3b-9f5c-e46041924bb0	00000000-0000-0000-0000-000000000000	2026-03-25 16:14:06.398787+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
887382ff-57ff-4bce-aeb8-fde75d48019d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	02fd9b3d-aaee-454a-a59b-e929e88bc85e	00000000-0000-0000-0000-000000000000	2026-03-25 16:14:06.429796+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
8c4c362c-fae5-4a3f-a9cd-edc17bfdf870	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9688c119-3ddd-4ee0-aec2-fd12d089a434	00000000-0000-0000-0000-000000000000	2026-03-25 16:14:06.441359+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
5f8d6d26-33f0-4b76-84fd-62d4b636e5c8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	36298d04-744b-4b65-a880-be9b212ef7d4	00000000-0000-0000-0000-000000000000	2026-03-25 16:14:06.48436+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
f1b94d67-b7a5-49be-be4f-dc989e157ef9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0c329888-1f09-47d3-9577-74029e8b02b6	00000000-0000-0000-0000-000000000000	2026-03-25 16:14:06.487337+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
173e6e65-615d-4da7-9cb4-f37142f36f1a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	72351536-bc51-4792-a852-727bde3ca5d3	00000000-0000-0000-0000-000000000000	2026-03-25 16:14:06.659446+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
2ff1e681-9f91-4efe-b62b-878b11214a1c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4cf9546b-9547-4056-9d69-11f424ccccf2	00000000-0000-0000-0000-000000000000	2026-03-25 16:14:06.741123+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
d58a15ba-fcc9-4c5d-a2ff-c6e6ea519a89	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e3dbcfa2-35c6-4069-abd6-08887e40464e	00000000-0000-0000-0000-000000000000	2026-03-25 18:39:32.688857+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
7be6657f-ea33-4e54-935a-9e65189220de	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	27511acf-389a-406f-84ed-e7b8675e89cd	00000000-0000-0000-0000-000000000000	2026-03-25 18:39:33.546038+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
939e0a69-6fc9-4ca6-8dac-50a32bf8f2ef	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8e1c94b1-454d-40d4-bbb6-b5f595af1ff5	00000000-0000-0000-0000-000000000000	2026-03-25 18:39:34.575718+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
f54673c7-37c9-4e07-a0d9-1524507c2bcc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	555b1f16-c18a-4ed3-9b08-9e246eac46fd	00000000-0000-0000-0000-000000000000	2026-03-25 18:39:34.647675+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
4beccfd2-153c-42d5-8a57-b30b23748552	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9d898801-f9fa-4300-86ff-0fcbe5bdf17c	00000000-0000-0000-0000-000000000000	2026-03-25 18:39:34.839157+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
17368fec-60f7-4e7f-b129-a471a1a2c026	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ac9b1f5b-be35-4cc7-841b-40387973924b	00000000-0000-0000-0000-000000000000	2026-03-25 18:39:34.896595+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
601e1fb4-3af0-4170-85f9-72becfe05cdd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f54e1ada-8ffd-4538-827f-382ffec330d3	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:00.447309+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
6aebc5f2-8031-496a-8c87-0daad7bd6d70	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	238b1750-1d12-4af8-958a-43a2abff8369	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:01.689204+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
2dddcef9-0c09-46e1-b61b-df096faed93d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	55930c17-5aef-448d-ba9a-809a48c5b2b3	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:01.688919+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
d61eac64-287c-492a-a6c6-3857b0f18b27	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	178efb58-bb1e-488e-8d1e-d86d5b974d99	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:01.80091+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
f069d4db-36fb-42a4-ad0e-b36fdd07b70e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	eb302867-e278-4917-9451-1c4d4cfdceb9	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:01.898026+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
cd264130-09fc-42ff-88c6-286cb3ef7632	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f1d15eb4-ff59-449b-a775-dd0b1c562777	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:01.982103+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
e75a9a55-c60e-4f77-966e-1ad6bc884d9e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1701805a-2c48-4dee-ab0c-5b91b3054cf5	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:02.083736+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
fd5aa8c9-f302-459d-abf2-f8466999fd6d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b589d4a2-47d5-4fd7-9302-f6dc60e81597	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:02.160105+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
d45bce3e-a2db-4862-8ae4-bb7d451dbbe3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c64763b3-d1c1-4c26-90bf-e70eaaaa5b1a	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:02.079211+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
7a2e86e9-8cc2-4e5a-a50a-64312a89ba91	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f4fb9082-90d4-4b75-a047-316d4d251e6e	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:02.18216+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
a981a6a4-0a9a-4436-a050-92e86bc8bb51	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b5778abf-fca4-4ec7-8501-deb6c76a365e	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:02.282284+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
91480c48-afd9-4387-b34e-cef9efbd56d7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	cc85bfab-fc6a-4716-b00b-397312a0ba7f	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:02.388229+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
c75ee7d9-7c7b-44b2-bb9b-c076940398b1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	359b1989-44bb-483e-8236-0cb751085629	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:02.549024+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
4887b884-626f-4714-8e76-9d7884e1c457	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7766f415-06ad-4bc9-8c4a-61fd1239fc81	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:02.576462+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
e01885fc-74c8-4bc2-8b5f-1ea194460c8e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	47f4eba1-f41d-49f2-99e6-1f4fb37ebaba	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:02.794216+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
b4c5754f-bb6f-4492-8aad-47bd619ed96d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	226e8694-b156-4931-956e-670e3a2d9c15	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:02.806692+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
f0a12e71-f3f4-45bc-b863-c91906db5fc9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a97d4e6f-52e3-454c-b2cc-3583753a9b0b	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:02.832837+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
5f5f28f6-38de-4cba-b67a-c2062a57f5c6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	86fd3d1b-18cf-4afb-ab12-c5ac16b44be9	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:02.98144+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
30837ef8-a300-4bf9-9705-a279c6d8b4ad	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6a82cd85-ccac-4efa-8b9f-e3924587c713	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:03.047121+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
ae704ef5-a5bb-47a1-afa8-562f04042de3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	68278702-53f2-4116-a248-958e03e8e45f	00000000-0000-0000-0000-000000000000	2026-03-25 18:41:03.105345+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
0701f4e3-5b78-4613-8d33-a3ab723da1e2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e6212f1d-af07-42be-97f9-6d8f14491105	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:25.223994+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
1315dad6-3ccf-4495-be19-5fbc725631eb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	94f3dcc7-333d-4d23-8309-476f976a404f	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:25.337601+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
f0de3438-1aac-4af6-b66b-d3293f24c835	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	00ccb720-3b1b-478e-9697-78d0ff5f2a6f	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:25.522162+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
81b46284-a058-4971-9fc0-2d8561cd6ad2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3e76fa4e-0d7b-4eef-8df1-b8ed88757a2d	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:25.537599+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
cf397190-a12d-469e-a993-0c665e4c8acc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3a1dbcc5-ab02-4793-a46a-616d4c984e14	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:25.59209+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
c04342e7-516f-4896-a8ff-ec028aa3d644	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	428571a4-98a9-4d44-9540-93cf57507b34	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:25.600958+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
c512753d-0570-4144-a2f1-6b524ff0590f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a150f861-026b-4bd3-ab30-fa519a431d67	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:25.674353+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
b1555b9b-706d-4efa-9cfb-81b99127f884	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7c39a3e5-24af-4310-912f-4c308b73757e	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:25.690243+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
511668b5-501a-40ae-92f8-891f6f4cbcd7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	06fdcde1-5446-4a5e-8908-2b325590a7fe	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:25.700113+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
9afd5a4e-14bf-4e84-9ddd-08c710f1d92d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	268be2d3-d193-4468-9679-e43d6e8a0e66	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:25.741608+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
7b398943-2466-49a4-9c22-9931749443d2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ac03c2ec-7055-4021-9c05-1842c9c3753f	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:25.783344+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
f7107003-544b-45c3-968d-4fabdbe07542	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d335ee88-196e-4b5f-b859-8a969a19baa3	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:26.681818+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
8911d960-8824-4169-b1c1-4d1fc578697c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7e6ed94e-cf3c-4372-a44e-327c62871677	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:26.708686+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
53787fc7-30b1-415e-aac2-4432ac1a10bf	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4b75ad7c-cb88-4944-a0b0-459769c589fe	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:26.708971+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
d0208653-8b41-42e3-9f62-f3c763333ace	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9a5331c6-4e8a-4393-a313-00ed5a24bf87	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:27.89839+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
ee6744c9-3a48-4408-a068-9775d0f18f25	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2c10e41e-72b9-4110-bb7a-38942ede5f2a	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:27.926611+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
9c844a68-8be9-4d04-a4bd-0bd55268cbe7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	95746331-6745-475f-9cfb-bceb19927e7e	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:28.051433+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
fe1c6a8f-d899-41e4-8f7b-81c8e01e537e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4779eb5a-925f-4670-ad6b-32504b5d5bb0	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:28.226155+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
d3bfde13-f57c-4df4-aa79-7654a331276b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d29a7a6c-ede1-410c-8b7b-a6a832134a7a	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:28.469631+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
25a0ca26-32fc-4ca9-8732-8362eea69dc0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8c98ef84-a25d-421a-9f19-43e398775753	00000000-0000-0000-0000-000000000000	2026-03-25 18:43:28.587135+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
fda09cf0-405d-4c1f-acc3-a7de1ba2c6eb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b6d846e7-9da9-4a9b-8a96-ac25a63d50a5	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:30.754856+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
31c670f8-6e44-4ff9-9093-3e5f319de0f3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f1bf721c-88c4-4832-86d9-82f019552435	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:31.268074+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
9e38fc6d-1bf2-42da-9488-3bd0709245ad	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	83c60cb9-f1bb-44d6-8acf-c70b66a675a5	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:31.421678+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
e6479886-fb04-4af7-8e85-f9d7c7f91be6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	977a098c-2fdf-49bb-aee8-f03ac019eddd	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:31.458773+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
22f7ce6f-40cb-430b-a6b0-2c74c7eed09b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a0de75af-fb65-46af-bf96-d5c3958792d2	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:31.543406+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
a8c3e22a-bd4f-4039-9022-1e8c838fb751	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0c5b4571-68ba-4732-9d49-d3d565efec70	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:31.585174+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
c85e7393-adf8-45cc-b4e5-bb0fc45cb769	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5dce7a6c-d4fb-4155-9ade-773721b4990c	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:31.731138+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
9ed59ce3-eecf-483f-ae11-cbd4273ba73b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7421c547-3d25-4bb1-8c64-40a824aadc5e	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:31.818268+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
f63922c0-c69f-4c73-bc28-6f0a0dfe0afb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7f836820-89cd-46cc-b852-d9d1e1bf733f	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:32.631965+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
a04a3472-7055-41d7-b5ca-51a3dfcd705c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	048d7324-57ec-4512-a8e1-cf9682f2c70d	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:32.729946+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
8720c854-c1a4-4534-aa99-2c4c4f0a769c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	44b0ccdc-0ed2-4d30-9dd9-eef3524642b3	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:32.780005+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
dad06c94-e08b-40ee-9c12-98fec7070f4e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	405c01a4-4320-4d0f-8758-b338acb40e09	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:32.826361+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
975e431a-639e-445f-b160-a9cc27775800	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c4e6dcd7-1aaf-4493-bfde-87ac412ea71c	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:32.876475+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
2314d53b-5c57-4699-b8a3-99dd090cfd38	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	059bfc2b-3e29-458b-b92f-5b8b9fd9eb28	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:32.9242+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
91b8c0be-a876-40e0-ad62-a69f4d22b73f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	69a18a1e-8fb9-4b24-9773-265be13d7e58	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:33.655243+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
a80caba2-fb2b-46ac-9258-88a1ec074399	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	94b04ef0-c634-4dbd-9227-7b0fb576e5d8	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:33.722499+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
4b24bf5b-641a-45c1-8756-38d81481aec8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3509d0f6-8dd6-4920-ad07-e737f97a0560	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:33.772913+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
83da9301-b923-423e-998b-b1a8dc71abd0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	def4feda-0eb1-460f-b9ba-13f2f5f85755	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:33.800337+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
2d72e8d3-6e8c-413e-a97e-4e5ee517fd94	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7dea963c-f7cb-4be9-94d0-a0272b07c083	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:33.918799+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
25f2df4a-73e7-4344-9c4f-a481fafdf728	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fc1e09f7-4372-4b88-97d8-fc54e61387bb	00000000-0000-0000-0000-000000000000	2026-03-25 18:55:33.950204+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
20c5bbfa-4d46-4895-a9ba-c1c1d5187006	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8d772d5d-d41c-4d10-a80d-80984ca1cbbf	00000000-0000-0000-0000-000000000000	2026-03-25 19:05:36.187915+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
7ea3a399-ca2a-4b0e-bcc8-c015b41b9f26	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	758c9d4f-e656-43c8-bb8d-e8ced2e1a45d	00000000-0000-0000-0000-000000000000	2026-03-25 19:05:36.978296+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.55, "total_credit": 3301.55}	0
afe2e345-dba9-4ac2-b0d3-7553dc73eadc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	52ab2d84-c38d-4653-8ad6-f1de7256cded	00000000-0000-0000-0000-000000000000	2026-03-25 19:05:37.183394+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
ea9d5431-ced8-4588-ba91-015ec2477e73	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	cef5250f-d381-4d6c-9e64-42a4d7de5a18	00000000-0000-0000-0000-000000000000	2026-03-25 19:05:37.351752+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
3ff5e712-8e51-4cf1-9e24-44a97b0c6687	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b099fa38-5fa8-4aaf-a681-744f153d9a1c	00000000-0000-0000-0000-000000000000	2026-03-25 19:05:37.44235+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
b5939156-7a49-406a-abdf-4450bc02682c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0d4c4d57-19b7-4252-adb5-6987fd269205	00000000-0000-0000-0000-000000000000	2026-03-25 19:05:58.271883+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
fbce6d92-12d2-43dc-a587-34a53999207d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bb7f0c06-6db8-4b04-972b-0b3ed403464c	00000000-0000-0000-0000-000000000000	2026-03-25 19:05:58.878889+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.55, "total_credit": 3301.55}	0
a5c26b03-9649-4a20-8f10-e58542e617eb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9db97a0b-ec2f-4e63-acdf-ccb8112213cd	00000000-0000-0000-0000-000000000000	2026-03-25 19:05:59.405029+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
c9d5ea32-7dde-4fd5-996e-73b22af226b7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c143d2f4-f8c9-47c1-ba71-e2a90c658e62	00000000-0000-0000-0000-000000000000	2026-03-25 19:05:59.923391+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
a3359b40-9555-447b-93d1-75118cd08b99	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	621e6f46-7b09-4e23-904e-cc9844f5693a	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:00.718982+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
2bb199ab-d7a5-44df-8a6d-fabfaf7fc8d8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f8c634d5-eca5-4bc6-927c-1c5035302b93	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:21.45599+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
9331ab4a-7276-4a38-9e76-1c24dfaeb028	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	80dda8ca-6932-4ea5-ac67-e8f0998f77a5	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:22.523999+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
96f3de1e-2ebd-490d-9799-aeea1f6487cd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	842c88be-f224-49ee-ace4-fd72e5dde226	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:22.764122+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
4e673f70-b6c9-4993-ba95-238272d1565a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2d524252-da28-44ff-a906-3cb78b2cac07	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:22.883378+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
ec210d6a-5030-41a5-b2af-12d799895714	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	50ed2fba-e9b0-4bfa-8a20-be7ee80873a2	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:22.991081+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
098f7c6a-7085-429d-ab9b-c3b5143ad31a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	391a333b-6dda-48b3-ba0f-f30846635f7c	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:23.041906+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
d58694ca-358f-4784-ad2b-f27cb78d1aba	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	70bf580a-e479-4156-8ddd-059d4ccd6b7c	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:23.318932+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
b551352a-43fe-4b11-a71c-eed70e3adf3c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	84a74365-c1a3-4c93-8025-4f43986ec7d5	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:23.466772+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
95ca0083-a50b-431e-9c29-25d7814e34fa	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2af451b8-ddb3-4f05-8ea4-19a28edcdf82	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:25.343863+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
0c899723-6ea9-4133-ae7b-9c8a4e532347	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9816859e-fba9-4937-9130-d37f8d44d4ba	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:25.507881+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
53fca4c1-c1e8-4c6d-9ca7-bd0fe9f8b723	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	944c81ad-8605-4980-83a2-a5947498f825	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:25.56321+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
58898df3-d261-4021-85a4-03d579e888ee	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	158bda4c-dc10-4b04-b50a-fcf5e272c4c9	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:25.627945+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
e0a1c54b-8085-4a08-8fe9-b407cde385d1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f7016356-25f9-447e-b92f-e85d84b9b7e3	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:25.721192+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
198580af-f625-4abc-898d-770a03a5f8a2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	23977c79-3030-49bb-b25d-1d6463a36ed7	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:25.776515+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
5e56542a-90ef-446c-bf3e-6ed1cc585757	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	53121d55-993e-4a13-86c6-a620a93d160b	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:29.080483+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
eaa803a3-8271-44a6-be89-38f8f47fd950	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	60a01b15-0c70-4d1d-834d-81c486050321	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:29.152916+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
da5bb5d0-6ba6-4a8e-aeae-1b2d17c7e535	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1507be22-0100-4c9a-abf4-2ab03737bb4e	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:29.211827+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
bd94facf-da43-49fa-b0d6-e6b79960dade	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f9032996-f699-4bea-8be5-d8bbe708efd5	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:29.248138+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
2a9c692b-ae35-4b9e-867b-6ef3b866be9c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b137ee13-4e6c-453e-91ff-e279816641b8	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:29.321663+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
4267fe53-87bd-42f4-a6f1-a53e7e391b0b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4b56b82a-e74b-4701-9187-4621db6aa017	00000000-0000-0000-0000-000000000000	2026-03-25 19:06:29.351983+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
04e9fb0e-6e0f-415a-b163-479a40d4f2e5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0d52858d-7525-4e9f-a619-8b2ad8b953f3	00000000-0000-0000-0000-000000000000	2026-03-25 19:51:51.420118+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
aa1665aa-c2bd-4c4e-99b1-fc14aa136c76	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	dc7eff1c-f37f-463d-b04c-03812ff98bb0	00000000-0000-0000-0000-000000000000	2026-03-25 19:51:53.856537+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
6a0eda73-85b6-49a9-87c4-4257b22af101	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	fdea86b0-36d1-4ce3-92de-c03980cb81d4	00000000-0000-0000-0000-000000000000	2026-03-25 19:51:53.894254+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
a362700d-8391-4f54-8e42-f73de75f1cc9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a80a5179-03e8-43b1-a44f-0c3c8db255ed	00000000-0000-0000-0000-000000000000	2026-03-25 19:51:55.478293+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
1622dd89-ac57-424b-9b30-f5e86b8f9bfe	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6afb6128-90ca-4908-b77c-589fb074b84a	00000000-0000-0000-0000-000000000000	2026-03-25 19:55:11.694406+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
3e0276a3-7490-4b7c-aec0-9ae3cf72c5fd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	70b1ff10-13ae-41de-a959-a975a18ba5ed	00000000-0000-0000-0000-000000000000	2026-03-25 19:55:12.950837+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
70f2142e-81af-4ee6-a4ed-7b2012a249aa	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	c15e3e1d-9bc2-414d-a463-00e5a0fb5156	00000000-0000-0000-0000-000000000000	2026-03-25 19:55:13.064259+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
6e8251ec-8df4-4be0-a517-cb866930ff5b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6f901ce8-c48d-447d-9709-de395c3fc5aa	00000000-0000-0000-0000-000000000000	2026-03-25 19:55:14.610819+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
5bae7e47-52f1-467d-ad21-81d2c5e93536	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	600d9ee9-bc42-4175-bdc0-9d1ef0e768cf	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:01.41026+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
d82d1ce6-8378-4eee-bec8-ba30d3ba4108	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	fd8866d5-aa74-49ac-b51c-cc23177b0964	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:01.834495+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
88a3b7bf-e691-407d-9fe5-f71c2af447ba	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2f2cd9a8-422f-4620-959f-ef4603ec5c48	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:02.569047+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
b3b29562-3ad4-4e77-98ef-4d0d2f3e4036	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	80d9f44f-29ef-43c6-af22-938f7605bc8a	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:02.602335+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
449a2657-b72b-42bd-a980-ab814434020c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	259e0ec7-4a81-4db9-88bb-89887e8005ec	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:02.76232+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
c08bf662-7302-4127-b624-5fce98ae9c22	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	8f160c40-2389-4159-a25f-973264aea51c	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:02.791135+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
85dafa50-3b96-4260-bbc8-d2c60f4e989e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c85f2c79-96c3-48b6-b36e-166f16d1cd7e	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:18.963977+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
9de72789-361a-4288-b11d-f48340c468f1	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	9793b5c0-7a57-4dca-ac6b-bc09100410e6	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:19.023341+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
0b8a2f97-eca7-4dcf-9e95-d38a957a473e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a55a39ab-3193-4e54-84a7-4d3a7296e9db	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:19.068146+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
04ba6134-4dd8-4fdb-bd79-3e043d1a22a1	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	a0471784-bd47-4fec-9680-7788d12e2422	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:19.090954+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
5ef06a13-3bee-42f1-b81e-f51c28e9ddea	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	793de23f-9073-42ca-9d96-8e95fab8ebba	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:19.192604+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
1c1782cd-4206-4c49-b084-3d5bac86ecaa	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	f6aa51cf-5cf7-4e23-b238-b8aa9f752d60	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:19.219063+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
3b360383-8b6a-4b3f-b302-29ce0eb76892	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4c8b64ff-6219-4317-a422-174bb40ae520	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:41.432881+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
002b795b-b4c2-4b03-b0a4-217c5ece2a56	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ae2ceb95-58a8-416b-939c-402b292602ad	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:41.549242+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.59, "total_credit": 3301.59}	0
e01e4d95-07b7-4ccb-b4a5-4422cb1f34b5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c0d1efca-8474-4edf-af3c-bee3930bdecd	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:41.615016+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
479a8c51-9a30-4f9d-8ee4-8e70f0871c9b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	421db89e-0cde-4d0f-bbc3-7ce07d202226	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:41.671799+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
2616cff9-48e7-49ca-a417-e771b790ee9e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0494b31d-2413-4609-86a2-8aa1d9d0cd89	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:41.718053+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
1640cc03-a041-4f8c-8768-8a83656eb940	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5f4cfc69-f1be-4bc2-8414-9227979ae0d8	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:43.661685+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
d1e31515-b469-4171-8a3b-b90fe6d0571d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4dae5144-f853-4668-be7b-6cfb83ed3654	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:43.785203+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
8d43fc68-217b-40e9-9008-0c09e98f73a6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8ce1c206-b8ab-4f83-944f-4b6e6379d682	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:43.974394+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
3eac2dd1-e71e-47fb-b7c3-d317056a9198	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c0204730-d345-49c7-a22c-ad3b4083e015	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:44.013384+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
fa16ded4-1e94-4a64-90b2-63e694133b36	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6a93d9b3-4fd6-49a2-b57c-2d6f07713881	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:44.155229+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
5c0c028f-a2f7-40c0-819c-3a76c7238a23	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0df91861-1fcb-40f5-bc3d-08ead71a81b8	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:44.318011+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
4d4c1593-1f94-4bc4-961a-2612344e2864	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f2e7ec6a-ab82-45b7-a696-8d87ec063d1f	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:44.501444+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
1d103376-93f0-4f74-b552-192fd6fe75c8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d141d393-b696-46fc-940c-a67534efb1ab	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:44.677904+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
b9fb5501-7616-4a41-94f8-9e0a2a5b45dc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	55c595d6-47d3-4ef0-bb00-6059f3f5dd6e	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:45.8943+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
5f39fd1d-1b66-4963-965c-1e76fedde576	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	db31fa1f-00e9-41d7-a99f-0768e8cd5d00	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:45.988814+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
51dbe681-3c39-42b4-b5ce-74587f956527	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	64c7eb61-0c02-40a4-9157-ce28a48b80f3	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:46.045595+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
56d8a544-bdb5-4844-b1a1-042dd5a980c2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b6bd2859-6f71-4116-992f-e6cbaa249ebf	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:46.091393+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
fd41e36b-4ed3-4192-888d-9326a42403d4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	cb2432db-ad14-413b-aaa9-1272d0a349bc	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:46.136863+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
84079ead-abd6-40de-8bd7-1d88a6936d9a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b610b752-70c6-492a-9289-4aade03be4ad	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:46.188543+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
c0d1b53a-09ce-47dc-871b-ed2b8670f170	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fbd39c34-4500-4f1e-a020-6abc3edc4382	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:46.979407+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
718c3cb9-3c78-4a4a-ac51-c8c7f9149b59	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1118df5f-b780-4550-a11c-80e7f2a26f4e	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:47.040617+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
6048cebd-a72c-4fcb-8a5c-8e37b703cf5b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	cb975ed3-83f2-4c27-9716-fd08a3b56414	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:47.087024+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
3cfcc2c3-07ee-4a06-a3b7-d89b6e306273	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3d403fcd-92f8-4d7e-8fb4-77ec70a2eeda	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:47.128335+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
ab85688e-a114-4f01-a301-d92e7437e8ed	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9367fb65-6f2b-4593-b073-49a0a92b5882	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:47.196704+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
54abb35f-134c-48b5-963d-3e123f9fddd7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c76408e9-a6c7-42b0-a502-7f9ba36133d9	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:47.232323+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
efb198eb-b7ba-4b3b-847e-c0abc8834ee4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7dd71141-2710-46ae-8279-0db4370360b3	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:48.431918+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
cb391bf6-55e2-4ca3-ba4e-9321715d8b68	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	89186304-ea53-4cc3-a08a-44f8d098c57e	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:48.487184+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
621e120b-3e5c-4ce8-b2ba-c2429a8233cf	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	879fc39b-e8f9-4d33-b39c-5b6e0a7dde16	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:48.537796+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
f5c41300-d15e-4fa0-86f4-61e38a3363f7	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	c61fbf35-c395-43e1-9655-d6d4855df77e	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:48.566382+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
b8ca8c65-22f7-4dc8-8c06-df18eef57410	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b41fa924-69f1-4e64-8084-e645dab18cf5	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:48.642337+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
49210cad-c119-4573-8c3d-abafc5f85b9c	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	69149051-b0eb-4e6d-9b5a-4fda190e9474	00000000-0000-0000-0000-000000000000	2026-03-25 21:25:48.664865+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
82c80bf0-7ddf-4464-a60c-fe8799cedb20	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	57f4362e-b0ca-43c8-9e86-a61c51252544	00000000-0000-0000-0000-000000000000	2026-03-25 21:52:08.391306+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
3804d3a1-8084-4f0d-9301-824044659b6e	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	7dca6c03-8b41-453d-bceb-00530ab2dd83	00000000-0000-0000-0000-000000000000	2026-03-25 21:52:08.701907+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
6bf5ef4a-167d-4a4e-b317-3432067632c8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	458c634e-5adb-458f-9060-03cbad4195ad	00000000-0000-0000-0000-000000000000	2026-03-25 21:52:11.005083+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
63179c9a-2c80-485e-8b37-d6e21b35b184	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	ba186cd9-7aaf-48d6-98f6-1dad98494855	00000000-0000-0000-0000-000000000000	2026-03-25 21:52:11.035694+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
6ccaa50f-1dc1-4ba0-b0e0-8cbd85a8c61b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f73c261c-6cae-43ef-b18b-b7a9e2881631	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:21.44252+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
d9da4268-374e-4031-9f5e-c273aa57f837	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	dc1cd395-c0ef-490b-8d9e-d6b7344f54e4	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:21.857699+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
0a39ef55-affd-4b7f-b5ac-e534091f1a91	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5f96875d-ccf0-43c2-88e3-88e3266acc01	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:22.040995+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
69926eab-3acf-4318-afea-1c6da9a28fd4	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	32732d30-d8c3-4a30-beb9-fe8139404392	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:22.074765+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
a3539831-71d9-409e-b7e4-1e8a0397075a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4b534c73-bd4b-4c2a-9d84-a5c849e9cfca	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:27.215727+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
8a7d716d-d2b2-4a61-aa88-bf3b9f8c682f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ec2c85d0-12ff-4c39-89d6-6f5ecabe295e	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:27.299666+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
ffe3d332-a9b2-4bda-becd-00a35988a76d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8c75e7cf-7848-4a76-84a6-4b1a5e541d66	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:27.457155+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
b7825c6e-4d53-4dc3-b096-b035f1c3f13e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1fd1f94d-ed4e-4ab8-a2b3-58538d8aceb6	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:27.500746+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
168e984e-3e18-41fa-b5e8-8cd296969ea3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	42039803-a520-4da9-8b8e-91c9e8da9b63	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:27.600624+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
5d304fa0-78b2-4caf-a204-6c1eec097258	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7d8cb9b1-4497-48a4-8d4c-aebeab12cda7	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:27.653097+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
ebeb3896-3ad2-4582-830e-f19aa578636d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	cf9ae222-6718-4cda-b07a-8a0be67c97a1	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:27.839825+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
02502027-8818-41bb-9aad-38777dd27abb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b5153ed2-6e3d-4134-aa2a-1bbda56d45db	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:27.953964+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
f736e87a-9241-4d42-9a32-9e791f40247d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c6905243-dc75-433c-a95e-80797ce400df	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:29.493186+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
41dff3ff-06f7-4545-971c-f030205d402f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1db14323-b676-4d93-ba26-14fee486abc4	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:29.610088+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
51420123-5cdf-4ac4-9554-bf7c7dd020ac	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	19f3f00a-cba9-458f-a4af-5b716c37fcd5	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:29.661219+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
ec1a42a6-4120-4f1d-8a56-0a4040909c67	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	935cc45e-6e3e-4f8b-9bfc-2ce305427727	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:29.715002+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
b7062958-6d03-4111-901d-9b163177c523	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ada425b2-2fa1-4495-8a1e-a5eec247cba5	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:29.758272+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
9fd326b7-a3f1-46a2-a2aa-eeaa8a38f070	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2efe1d17-b9ed-45d1-92e9-1b200e0e04f1	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:29.80096+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
230f30cb-bee2-43a3-9b5d-4f2518d11f96	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	225ddb65-aaed-475b-b6f6-ea606f26250a	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:30.678787+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
fcd5aecb-0e5e-4ae7-89f1-8f77f765a44d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	94ef5a09-d8cc-47b1-b28e-7c8807451f10	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:30.797951+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.61, "total_credit": 3301.61}	0
6b9dc622-791c-4e18-9cf1-2c49834b8ed7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1886e50d-e181-4630-a0d3-1cbedb1e0e4c	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:30.849616+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
4ca1ee43-76da-48f8-966e-725992ff2b72	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a18acc30-925c-451c-95d0-2a0f803b201e	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:30.895704+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
55aeb3dd-22b9-433e-bfdd-57da885d9400	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	de3331eb-ed21-45d7-b781-14223c468328	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:30.959936+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
9e9175ab-fc0e-4b97-8f6b-4cbeb74a5ce0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0ba946b9-1904-4156-907e-acb689c50cb2	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:31.702301+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
40eb1093-4c66-44de-98ba-78c92e59fd15	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1f92f143-c69f-496d-9a76-ac69ba6bc96a	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:31.785085+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
ad09f715-d990-4e69-afe3-2e2678b060ee	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a20e295d-c042-4b89-9b5f-0f04b6e9138b	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:31.846681+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
e7790c6e-760f-4116-b471-390f22175cf0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	281b4c33-4ac9-47b0-b854-8f3cba239a28	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:31.886054+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
0fdc4b52-71e6-4418-994b-e8d8050b02e1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	61573735-a815-4890-a81c-61a4b3e599c3	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:31.97518+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
4dfc00ed-0d6e-45f1-832d-75e3a8c3cb95	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0fa7180b-1997-4bba-a358-1bd553185bb9	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:32.005294+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
2dc0e69e-67b4-4423-b32f-eecd53151681	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a32e5bcf-e5ac-46dc-8052-22a88b9e496d	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:32.681598+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
8eafc03c-c8ff-46e2-9e0c-12a4a6a4f12a	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	dfc00dc9-d41b-410b-ad86-6828a58148ca	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:32.743758+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
c1723698-5655-4b37-9e8d-591381a75995	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3b877c94-fd27-4701-9889-503959183561	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:32.825306+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
753be29f-4aa2-4b17-88f7-a7564d7c5aaf	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	8da05e28-184b-4c11-abd9-a54c22cbac94	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:32.853739+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
a6a46486-1846-40ba-a158-f246395c5fce	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	de35d8af-7189-41f4-a31c-50a9c62ba234	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:32.919358+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
0483749b-cbf1-495d-a99f-54d468e83f8b	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	76175c7e-87a7-4a4b-a152-8c924890d9d6	00000000-0000-0000-0000-000000000000	2026-03-25 22:05:32.958994+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
b21a0036-a9f1-4f16-aca9-85d92c2ffded	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	76faf930-d915-4bcd-b07e-020738641c80	00000000-0000-0000-0000-000000000000	2026-03-25 22:18:15.146576+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
2c065daa-d133-4b70-bdc7-31f3f12b3646	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	538a3006-5195-4793-a91a-fa09bf6f975c	00000000-0000-0000-0000-000000000000	2026-03-25 22:18:15.45514+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
b3ffda10-e586-4ed8-9484-d1d06c6d14a0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6f506c02-a4f9-4246-a478-3250b44cb5b2	00000000-0000-0000-0000-000000000000	2026-03-25 22:18:18.259047+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
b65ebf28-c99b-4f18-8090-0b5d568568aa	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e6d7af09-1415-4cc2-92a1-99a6f6d7697d	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:32.018826+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
58f8f47b-ea57-4853-8dab-4d33fda81925	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	972897dd-968a-42c1-978f-d8ea11e1a0a6	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:32.079188+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
9a34c57a-b8fb-4080-a55e-316f41a01c47	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a68cadb7-3996-42ba-83d7-aa1722942d0f	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:32.153237+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
8211dd00-cd79-4f13-bc72-afd76207eaa0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	04e7f4e5-2d95-4934-a26a-066e154d374e	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:32.716087+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
8c3c1bf3-2427-4fd0-8c77-a20c31088e8c	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	69cc365c-44b0-45e7-ba18-1c4ef8763488	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:32.774612+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
b6fc8094-fcf7-4b9c-b02b-83bb29239293	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6f347105-1cdc-44d6-aeff-ec315fb63ecc	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:32.858648+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
fcbabd62-738c-46d9-a4bd-bf81b5396107	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	639587f3-01d9-4b18-9d55-e20ad114c1ae	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:32.884424+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
c798dfec-55ac-47bd-ab03-59cc577e67c3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f82b55c5-b657-4dba-8bb5-2d2bb5399f4a	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:35.109667+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
759c8b98-7292-4254-82f0-80457c5440f3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9008b64c-1b6d-4859-b4a5-bed07d39e4cb	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:35.187357+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
7c3f104d-fec8-448f-a22d-93c839595752	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d8a3503d-e1e1-456e-a65a-6abf569b52f0	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:35.225627+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
455eab81-b048-4969-839b-1e7e52ab6baf	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fd5aff25-aa0b-4b66-9897-89ed4b291571	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:35.267221+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
afbdd0cb-275a-4e6d-b1d7-1608af0093e7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3483ad66-abe2-4055-9c5c-3ce0929c2f50	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:35.307171+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
637af62a-2fc6-4377-afef-3ec7d717ad51	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fc9358f9-3fb2-4dc3-b0c5-748b038f2c9f	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:35.347477+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
4026bd02-aa62-4120-8937-53b37f182e07	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	43ffd31a-a4e6-4c63-9bf3-ea1c3bf8f1ea	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:36.109396+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
9ab3d758-b309-4e13-a6f6-d93b4d2ff3d8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ba933246-8111-4ba2-8a3d-858dcb0a6cb2	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:36.181459+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
d73e08ef-ea52-4725-9012-fab9385c1b23	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	03b8f8b2-dbfe-4b81-9fcc-469b3de8f822	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:36.319588+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
6d01c533-6905-4f94-b9af-f6d7eb948698	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	28173477-33a9-4fdc-9e0a-9e621af28da7	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:36.348985+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
c9c9b6d2-1453-4a57-b6f5-ff57b1fd059c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e68907f4-1c94-40d8-9e4a-d232134569cf	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:36.438157+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
019c3bb3-d656-43a9-8eee-ca3e0310ad53	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	83441f60-62f6-40c2-a051-2198a843cba9	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:36.466296+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
36c77a48-5127-4757-b006-5496ece88a2d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	23139ae9-3e9e-46da-8f53-d919ebf81715	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:36.58117+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
7f04ab64-fe92-4f9f-985b-044ac969e1d9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	490d476e-28af-4bf5-9b01-74203ef0046b	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:36.665573+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
4401c6fc-2994-41ca-9677-ad478fd0a85e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c78e9a3c-25b3-4bfd-ab91-0a046dbd1fe8	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:37.238605+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
e99a1f0b-91d2-484f-bffe-f93c79d60fc5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5cd8a9f3-476c-4927-b7a8-e8d0b079b51c	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:37.318053+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.61, "total_credit": 3301.61}	0
a9edce44-eb36-4e32-b902-cb0a3576102c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1cd0601a-5d68-4229-b89d-c38371696a09	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:37.362802+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
23c1b05e-a718-4b0b-9a6c-96d1e066e687	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	06bca2c3-a070-491e-bd2b-fa5d3785e009	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:37.401596+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
98660922-6f3f-4058-9dd2-3170592ad3fd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fb459ab0-6125-4d24-9a92-640ca29b48e2	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:37.440457+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
3735db1d-7964-438d-bde9-cfeca448e75b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	53afd7a4-6a9e-4dce-90db-2e339a8a457b	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:38.057207+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
bf6234bc-a789-4eb4-be2a-6347f618795c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ba1fcd7a-ec0e-4cd0-93fe-99ae8a6ebd96	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:38.120013+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
6d4212d4-c823-41b7-a7ee-72c7ff304216	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5b721b68-5844-4de0-9fbd-eb95e19423b5	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:38.167004+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
049c92d2-a544-49dc-8c89-6aedab185f1a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	49080877-3cac-4dd4-a491-e903e978cdb9	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:38.198146+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
e8e1e643-f7a6-4276-86e3-464e405a9366	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	23d10b04-a184-4bca-80ad-92bd4092d6af	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:38.258794+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
8b369d4a-c140-40f8-ac7c-49137842c9d4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ae5ac833-d2dc-4ed2-9301-00fc625e4804	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:38.283009+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
90264ca2-cfd2-4a5b-84c4-607b1f2ace31	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	06285f18-e388-46f8-bae3-54c2a01b9a5b	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:38.888855+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
05f8d10e-a782-496d-9cc6-3b98e46e3992	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	eb062777-a2cf-4443-b059-d5bdfe2a6c1f	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:38.94449+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
89868db4-2800-4a36-b656-b34debf26882	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f2d75ed2-9262-482d-a4a0-ce8c9abae738	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:38.995094+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
6d1a2c40-53ff-4004-87a1-978468e52b2f	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	5bac49c4-f1af-4add-967b-c1ba4a4c22bf	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:39.015347+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
d41a61fb-d12f-40cc-a69f-298a66a2baa9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	63b1e14a-1d93-4f57-97a1-12524da02f0a	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:39.066933+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
c1acab82-95ac-4b8e-9185-1910e9ee837a	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	7f9b492c-8cc2-4851-8302-a93dace8114e	00000000-0000-0000-0000-000000000000	2026-03-25 22:21:39.091601+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
88a00495-1f8e-4ea6-b03a-0a4e6190b67f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	799c876f-750b-4fd5-8a54-8da257ba4123	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:56.040497+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
992aead4-253d-4d5e-acd2-65d63929ec04	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	adc762b2-c9e3-4371-b281-61696325c91a	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:56.136428+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
92ab2d79-c145-45de-b1cc-8c3598bbaee4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	58c59d12-4dc9-45ca-b966-880527f68863	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:56.274577+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
96b537c8-d6ac-4714-937f-72771f7e4e17	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c9f364ca-564d-4242-9bb2-728a7a0ae9e6	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:56.304199+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
0f53095e-f418-49a8-a5fc-b8ef1faaec39	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1387cea8-ea86-40ae-b62a-72047e420b74	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:56.388052+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
e375854a-6770-4a2d-86f6-bcd26e0a896c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8ef7e524-4eaf-4cda-8bfa-457fe77bbe6d	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:56.41823+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
34c3509f-c3fa-4c98-80de-2230f1e7d307	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c88eb672-52d6-422f-9e42-1179ad70515b	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:56.531976+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
fe161c8d-de50-421c-b59f-77d62b600fd1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1e623f2c-1f0b-4cb0-a8e7-1e470b47507f	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:56.625556+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
c94ed7d4-18cc-4024-91fa-10d8ac6df9aa	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e5369d0d-9da7-47da-af8e-34eec0808bc6	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:57.411325+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
84768612-9fb4-43ef-af6d-4e71a032e157	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b06b041b-163f-43ee-b5bb-43ad718bce7b	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:57.541895+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
a7252dc6-7c5e-4b34-a01d-128c9143896f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	cc3997ef-d581-4d3d-b972-908ad528d71b	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:57.584408+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
fd3a8db3-5920-4a9b-af6b-b6f1b67fc811	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0eb4866e-0036-4670-991e-0d9756e72a9b	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:57.620098+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
b1cd05e9-43dc-4906-928d-57af838d5062	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5b1f35d9-16de-4bbb-be0d-c7733a56b12d	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:57.657724+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
7d06c294-e0a1-4b30-9c28-972982cd9f28	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	534c81dc-9ed7-4f0c-b457-3acea86d9711	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:57.692538+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
881288e0-e438-4ffe-b601-b6f21470cd96	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ce17630a-1bc5-4733-99a1-6306e14a807d	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:58.328732+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
abda5a4e-cf7b-4c01-a41a-d2c7f8657ab3	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	568d78ac-3dd7-4c6a-87c6-82548451b1f5	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:58.38131+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
7b3e19d6-5a07-4943-8195-7c47289ee10c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	76f3951d-c36f-4521-b82f-7e78126b968c	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:58.439456+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
6c29b88e-6063-4b1d-98b0-9b559fafbeac	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	5e65f7f0-f3d0-491e-8105-93dc0f20bf75	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:58.460449+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
5159ee1b-ecf9-4ee2-9ee9-965f5b17417b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4bb3643e-37e4-4b4f-bd9b-a614ae70e790	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:58.538798+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
d3053330-2caf-44d4-9c91-4ac75ab0070f	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	87e4e960-475e-456a-88fc-79a61dc3a645	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:58.563466+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
23efd4dc-e66e-4104-93b0-9951fe8f6c49	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	44158ee5-7afe-43aa-a2e6-21c707e4efd2	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:59.247743+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
32bbcff2-76d9-4615-bb74-028ee8c35556	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1ea91df4-0f2d-4995-a24b-f3126a5cb67b	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:59.329629+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.61, "total_credit": 3301.61}	0
566112ca-b775-4284-928e-e006dcf36444	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	76a01be6-a488-4130-80d5-cd0d938c82a3	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:59.376308+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
4b486acc-876f-49c9-95e6-c1a611081b22	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	33b67ef6-c24d-40f0-ac87-b2c1d6dd82cf	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:59.417152+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
d55994a1-333b-4d1e-837d-2bd07e483e3b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e218ecdd-d89b-4d78-8440-6451cc6cf4c3	00000000-0000-0000-0000-000000000000	2026-03-25 22:32:59.469919+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
424286dc-8ba8-4804-b4bf-9fe646b9d584	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a7c9043f-0784-4387-aaf9-83042a44945f	00000000-0000-0000-0000-000000000000	2026-03-25 22:33:00.121735+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
05c74af1-98a2-4b14-92d5-e7915d4e7413	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4c9b5a5f-95a3-467a-8f55-0e6bac2b50ef	00000000-0000-0000-0000-000000000000	2026-03-25 22:33:00.186368+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
92ea5359-434d-4049-bd5b-e2f8c0455f1b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a6287300-b85e-4d29-b4bc-c70cf50cdcfa	00000000-0000-0000-0000-000000000000	2026-03-25 22:33:00.237654+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
7464af28-4763-4e09-b7ae-00a8c3185ea4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7cee9196-df8f-406d-8b52-aa560f2da651	00000000-0000-0000-0000-000000000000	2026-03-25 22:33:00.266985+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
9f0bd109-1f83-4d16-8c15-154d3eef795b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ee6a8515-2484-4d06-beca-d87792b79672	00000000-0000-0000-0000-000000000000	2026-03-25 22:33:00.333775+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
1383d881-90f7-4ffa-85ae-9cf5307b5c27	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bf33a765-50a9-40ff-bff0-337c4d00c358	00000000-0000-0000-0000-000000000000	2026-03-25 22:33:00.361587+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
954b40a5-8451-4037-8724-d448074c4ad9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f05572b4-d847-48dd-aa4d-b6d1fbd9fce3	00000000-0000-0000-0000-000000000000	2026-03-25 22:33:00.864852+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
5db90eaf-033e-4aee-a025-a14074312a47	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	87acfb87-fca5-4411-9ca2-e201a44d187f	00000000-0000-0000-0000-000000000000	2026-03-25 22:33:00.921234+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
2ed9e66a-4caf-4df1-b6d4-a5226d590975	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d816ff1a-0a5d-485f-9fda-e5393b6f17df	00000000-0000-0000-0000-000000000000	2026-03-25 22:33:01.00643+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
d87f45d8-b295-4cea-bbe8-670e15a10402	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	065ee103-eb8a-4ec4-bc4a-d50c6b1a3326	00000000-0000-0000-0000-000000000000	2026-03-25 22:33:01.034452+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
2dccf63d-78ac-48bf-b769-966ac765ec22	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	652d2d33-c49d-43e9-9dcb-fc0bd347a789	00000000-0000-0000-0000-000000000000	2026-03-25 22:33:01.553016+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
173887f1-d0f5-4838-987e-b6490b0517af	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	876578c6-bf79-4db0-a0e6-6d399fe1e38d	00000000-0000-0000-0000-000000000000	2026-03-25 22:33:01.606894+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
6418e2b6-0618-4a3d-a9ba-d9ac4e36595d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1ae5dab9-76c3-44bb-912f-54afb7715ca8	00000000-0000-0000-0000-000000000000	2026-03-25 22:33:01.66248+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
87adeae9-aea5-440a-ac52-cad66fbdac10	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	aaf33480-adf7-4375-ade2-430bee5d8f73	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:51.843646+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
170d9137-59d2-4000-b436-3effb82a020c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7fd83cfb-a0a9-4684-8a43-0f76efd9b60f	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:51.90998+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
3a1ea035-6fac-4703-9172-730ac8971a0d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8556ca78-314f-43bd-a3d4-8eec39555ae4	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:52.047708+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
6f7e8b85-251a-466a-9ae1-d5d616d2c50d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6c8c5d3b-fbfd-481a-960e-be7ea7587a2c	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:52.071404+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
3413d3c2-b7f3-43cd-ad28-cd6226f47cac	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3e70b6d8-a0c5-4d91-b2e1-d8c8cb8e4f9c	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:52.149767+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
d218d825-ecb5-4a98-9740-0715db8e634e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9e419594-4f41-4843-8370-cdcc28c4240e	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:52.178898+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
92b7b9e2-3846-46ff-b99f-4989fd17dc7a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	04cbcaeb-44eb-49d4-831e-2680e8218b6c	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:52.291702+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
b5427844-bfbd-42b4-b0ea-e4098bd09a82	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	58362a59-c6e8-4cf7-b9be-87b86e05aa38	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:52.375758+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
bfbdde9a-916e-4a47-bd6c-df40848c1481	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2851d81d-bab7-43e2-8372-e8c0d172269e	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:53.052151+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
8235c696-435f-49b4-abbd-2fc65ee60af5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4e3c71e7-69de-4342-9323-7e6922023107	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:53.151076+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
1f9030ff-bf98-4617-824a-7d07fc703f79	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a59b7997-8d9b-46b2-a29e-e72032433032	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:53.192837+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
b502b4cc-ed40-4b3d-9608-c46d2c666e58	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	02f75717-bbc6-48c5-a962-838a3ee0d247	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:53.23495+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
333a734a-fece-4186-bef6-9c38365a0081	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	125be020-e439-4ee1-8b6a-858d9f57c835	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:53.277768+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
6de7aaba-2b3d-4b12-a90c-4838ff11c09a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fedff689-39aa-4d64-ae4c-bff81eed9c9e	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:53.319427+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
89039522-c587-4a1f-a0e5-fe1717c24a12	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b98dcb3f-09e7-4c4d-9fcc-17398d531d2f	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:57.096206+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
0ed62f18-d237-4568-8eb6-ea1b5cd75d25	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	43aec37f-0b21-42ae-bd3f-7f320c05d423	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:57.152301+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
acf9501b-b0e9-45ba-873d-77124449fd58	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	989815f7-2272-4e2f-9659-d2edc75dc0a8	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:57.199966+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
5b10a9ee-c8e8-401d-a272-8ef0c3b03e7f	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	46b53758-a3f0-42dc-8d45-11d9eb1fd093	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:57.225125+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
ffb63076-c088-4f09-8899-927e0b720ced	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0a2e8698-b403-4281-9f38-267f5573c100	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:57.290422+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
326e880a-f1a4-4fac-8fa0-65127d465380	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	1a139cf4-e937-4d5e-b954-5ba055f226f3	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:57.314091+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
0f5a1ccd-6c80-48a2-a1fb-f533ff19856d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	64d763ac-26cf-40f6-8779-06d506aba79a	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:57.913868+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
1216aee9-cec8-46b6-9f50-6017e7af8ed3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ad77693b-8f67-454e-bad3-9a727a7f31ae	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:57.993586+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.62, "total_credit": 3301.62}	0
fea58709-c6f9-4e96-b3d3-ac65306ea107	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	35ac4f81-883e-4265-92c8-66b207c2c6a2	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:58.033304+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
b6261675-1a2e-433a-9f7e-13177a1abf42	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2d7afda8-2fcd-4d96-beac-706ff20a782c	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:58.066318+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
c977bbb6-602e-4553-b2b2-90ef850309e8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3cecf940-9f90-43c2-a6f8-096e5caea003	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:58.106943+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
1338832f-a12f-444b-b14c-0e006e373a39	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b8d6f294-4a92-460e-814a-b8f0ed12b54a	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:59.325549+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
d6a91cbb-9ac5-4397-9272-a91569da5995	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e62701bc-468c-4130-ad62-19bcaf11cba7	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:59.380638+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
60dd6077-0754-4d0d-b275-01ebac5d2f2c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6cfaa4cb-0188-4dbe-bda9-a4a7a7ea0182	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:59.424806+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
c8ee259f-e72f-45f7-961c-76850bb25a28	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	417403d3-298a-4bd9-90ca-3a85ac26d895	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:59.450591+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
a0596111-70a1-4330-816b-24e10e434f79	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	76f6e97c-0a08-4a2c-8a09-97a408bbaa35	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:59.495125+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
41c7f28a-e5f6-4d71-8f4a-a09835dce5f2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	21c7f9c8-1edd-46e3-a33b-9bc851d06231	00000000-0000-0000-0000-000000000000	2026-03-25 22:35:59.518205+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
a9b60e27-e22a-4877-bb8a-cd52c912cf27	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1cdf4671-3cb8-41c5-b89f-4c6f26494899	00000000-0000-0000-0000-000000000000	2026-03-25 22:36:00.019726+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
9ad511c5-f063-49e3-8d9b-a4917e771f81	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	8664f3d6-9445-4cc7-aece-47f2523d789c	00000000-0000-0000-0000-000000000000	2026-03-25 22:36:00.078261+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
b736b9e7-c70c-48fd-92b5-3cac9eb4d648	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4ba2978b-5319-4384-a945-4007adccac04	00000000-0000-0000-0000-000000000000	2026-03-25 22:36:00.146841+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
f87b6c20-6e28-4838-aa53-ae618433b9c9	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	72c28472-0268-44ae-a45d-97ac47e73b19	00000000-0000-0000-0000-000000000000	2026-03-25 22:36:00.167633+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
58abc201-fdab-4e78-ab57-6ccee8c7581f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	120454c4-4e42-43da-9e43-a82f514a50c5	00000000-0000-0000-0000-000000000000	2026-03-25 22:36:00.66609+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
ea1b6c6c-f9f1-4755-9b33-f6177c50fd6c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	cf40f8b7-e3d3-496c-b1e4-8a969973bf8f	00000000-0000-0000-0000-000000000000	2026-03-25 22:36:00.724688+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
6268c708-08b2-4f26-9fa5-905ef362913b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e1963507-d9fa-473a-9d0d-271f13bb3a00	00000000-0000-0000-0000-000000000000	2026-03-25 22:36:00.772228+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
744eaad2-2263-4c77-93b4-b936babb936f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	32620e5b-2a70-4757-9886-ed03233ffdae	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:07.063437+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
6192afeb-6e4f-43f5-b2eb-0d4c9b77594c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2ba4383a-08ae-4d59-94f3-a7beb18d8477	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:07.251612+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
ca6da051-441b-45d8-a88f-3c5026bb253e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e3d012c7-7c49-471a-837f-0c088d1e7817	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:07.414352+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
26408935-4834-4817-a601-2ed44fb718c4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4b9f2c2a-f822-4ce0-9c37-202b2894805a	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:07.448297+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
a227352b-653e-4b6c-b367-a5bee6bfb109	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0b0aac24-1509-4ab7-a99d-86522bd0c9cf	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:07.540496+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
2977e5d9-231d-4194-9699-a7b22f78e930	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	85c70e09-08dc-4307-b5a4-2704ead19af9	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:07.57772+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
6c02cc49-d3b0-4474-97d0-6f428949a76a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b0c0fc19-702f-47da-a85e-697f21f3ef58	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:07.705483+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
9bf7c8af-9eec-44d1-9b3c-5c53f327b5d0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	99f90539-62b5-4e19-9277-41d194b4d4d4	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:07.79843+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
afe775b0-0fe7-43e2-a100-4f43ffd62bb6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7c54d2e6-cc46-445d-8f7c-420cae4e9ef7	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:08.665638+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
1a27d41c-a10d-4b98-9018-82aa585768a6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	288cadd1-7257-4354-97e0-c1b8c527fede	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:08.828304+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
4969d3cf-cd53-4372-8ab7-0501c0724ad6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	41a8ec56-e6dc-4267-9a59-be0ba827ca4a	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:08.877708+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
0506ff1e-7585-43da-83aa-8b9c19bcb9c6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0bfdcf20-31e9-4bfe-b74f-60f5c31d3c44	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:08.926151+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
fed1061a-453e-454c-b402-8170e03dc2e8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0d7d7619-7eed-4748-bd84-f926cb71e97e	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:08.972986+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
ef514909-ccf4-4b09-8f9d-c709b324e6b6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	47ed6e84-01e4-41bc-b59d-ec935f871c72	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:09.024295+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
b20d5062-0b0d-4c53-a49d-8fc372974ac9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ce7c12f9-eae9-45cf-9639-8ee2e64faef6	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:11.014013+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
21ea33a3-7523-402e-9a57-10edaf4b490c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fa43e19b-b413-4dae-af5c-9659c4f706ae	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:11.102368+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.89, "total_credit": 3301.89}	0
3ec55f86-7a8d-468b-9e4f-efe64cd8a8c5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4b6fd84e-204d-4b29-9f0d-3e9424d0bd89	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:11.146699+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
62d33355-9397-43df-8695-61c0de8459e5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7f1d9c97-a36a-4721-a32a-3d539d0a6a33	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:11.189397+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
016ea2d9-47f1-4c98-ab07-048082d8550b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a2b8ca75-d201-46dc-a1b5-9d3cfe904750	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:11.23835+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
fa3aa5f4-a7e2-48f5-bf5c-789588dfaaf1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e3a62443-3112-4e6a-a424-553f5169c676	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:11.897725+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
f7aeae0c-dfb9-401f-8414-a250be552dc5	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	24f34e67-e729-43df-89bf-820ee9d61092	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:11.954308+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
8ddc089e-5083-4fb0-b3bd-63d344fca7f6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	cb745525-84e3-4b2c-8e27-0c5f35d57f07	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:12.01266+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
1f23dd11-291c-4bce-89a8-242a9e0c1dbd	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	a4413579-557a-45be-84be-c8e1b7d23517	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:12.037793+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
10620d14-095a-46c9-855a-6eff59d7073c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	08431538-4d69-464e-ba87-d428c6fe63c1	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:12.10727+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
dd63ecbc-94c3-40a0-bcbe-8ca9f95f3516	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	55234d79-0252-4a34-8634-8fe719b46d7f	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:12.131256+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
b9624f04-a4f5-43a1-ae8c-4f6b842ec374	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b7f6591e-735e-43a4-98dc-7dfb9b77c71e	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:12.791306+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
2d60839b-cde5-442e-bcde-d0c31446a42d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b7890caa-0131-4558-af62-c511bdc8260f	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:12.86279+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
c15942c0-81d5-4b01-b837-843ebf397a34	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0fd7ca53-3128-4687-aeae-379479e32999	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:12.910765+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
4540f023-eb11-4da3-bbbd-70c15a3e705d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0940dd0f-98e1-43a1-8bf9-d5206e3cc11a	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:12.940601+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
e70cced8-3766-43ad-8561-ad2b09514c21	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	691b19a5-c01c-42d1-9d7f-631638e5d6a9	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:13.006472+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
7b8445cd-b1ac-4fd5-83b3-d1f1cbb914ac	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f06b068c-8eba-423c-b512-ae4e16e61d0c	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:13.034543+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
ffc1c901-690e-4c0e-9a69-21b01c831198	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	40e77587-ef1e-418d-aec5-d00f9f983ddf	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:13.57999+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
b02b5b83-9082-480c-b0f3-93797c947c24	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9ca4a37c-f8ed-4373-b957-0e667941de25	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:13.648393+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
2b6c7d0d-b5e9-40b9-9425-ca05a1bfb1a1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8944c53d-3851-4502-9c44-8dc1e0d21364	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:13.725472+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
27736c2f-c2ae-40e8-8748-70cd97fc6357	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	738dca30-1de5-4c5d-9d0a-7b138690bbe8	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:14.511208+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
3fccf8bb-1fb9-4a5a-b555-7e416a189c8c	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	163f7d9f-3f74-49aa-ac78-e489f7115664	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:14.599467+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
16b7f39e-4e5c-4226-9786-2bafc2e9a7b8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8767c05d-af59-4768-b9d6-7c950028d033	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:14.868839+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
04b9e617-4787-42d8-ab9b-f3b01c532334	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	f977402c-0b1d-478e-bcc6-f77034c76bf5	00000000-0000-0000-0000-000000000000	2026-03-26 13:23:14.909639+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
0d1e265a-9ef0-448f-9eb3-7bee15142be2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	36b4079d-808a-4049-9008-b28124a5ffdc	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:21.873766+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
1c6d8d51-e1b2-497b-8dcc-66393a389ceb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	cfa43b2e-e9fa-443b-8843-7fda09a5d0c3	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:22.026232+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
ad346ad8-069f-47ce-851c-aadb4bf9fb34	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2af52a28-51a0-441c-b665-18d25f758e9f	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:22.16462+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
7865f780-45aa-439d-aa50-27057ff6df73	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	30a5c128-2058-4e7e-b445-ba22863299da	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:22.196025+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
b5d409f8-5201-428e-82e0-09190616fb49	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1795ba2b-f348-4dac-9222-3951a056a690	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:22.275791+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
8a0ebb6e-8075-4309-b9e5-5cfc7f4cb757	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2a175fb3-e1b2-47bc-9937-dcd1b4864cf0	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:22.310975+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
85099899-24af-4a54-abee-b59ee2ab589e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e8a1008f-24f3-4d6e-8319-00f917fa6b5c	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:22.433033+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
31b99513-dda8-4592-a2ec-360f17f43d7d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a1dcd670-e373-4d6d-baee-ba131e08b88c	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:22.522024+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
cb476d60-4331-4d5a-b9ef-ba1cb75880dd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1a147343-7203-4ea0-bc1f-1f4b791ff929	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:23.053351+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
afa161aa-c228-4fdf-97d1-d09303651517	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	b2d00d96-35ab-474c-91c5-60497ac92687	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:23.110722+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
9a82f58e-5c48-4c14-99ad-70e3ad9fd78d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c8910bc2-bcb8-45b1-acfb-9ded85e3851a	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:23.255204+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
1c89bd3e-db02-49d6-ad14-0ebe10084f16	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	48fb8008-0e9a-4811-9965-a33df66b58bd	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:23.28492+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
7e6a6608-68e5-4f43-bec7-081892d5b710	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9fc22de8-5ab8-4ecd-9ae0-b3113f930ea2	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:24.046354+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
febfbd00-e738-44e8-9237-708f21aa145e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	cc2d22f1-bd2d-4b92-998e-4a10124b5871	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:24.140899+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
0bbac2b3-7421-487a-9d0a-fd23cc98bb75	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6df07977-0289-40bd-81d2-c3eb135dda29	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:24.188437+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
e384326b-99dd-40ea-8499-4b0e9872e705	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	801ce384-c969-44c5-9f22-0c8fda637d93	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:24.230643+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
aaa67e14-a730-4fa0-8364-697abb6ce568	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c877c695-9201-4c4d-8b73-bef3c8dfbb45	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:24.272968+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
61930805-d510-470f-bd61-ea25aea4a3c9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6550b16c-1342-4329-aea4-d93a33ad893f	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:24.312134+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
65186605-b082-4be7-a747-ab041d092e44	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	da284b58-3edf-4754-a5f4-59ca84e36b7c	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:25.864345+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
49ec9e27-7c7f-4c5c-8cc6-19932eadb580	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4d953c6c-3517-42b5-8f14-3626683e440a	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:25.944837+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.89, "total_credit": 3301.89}	0
36b54b99-ed09-4a28-aaa3-755a1f841486	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5578347e-49ed-420a-a648-0cf9c0d7a6cf	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:25.989005+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
4f42b491-4987-4c80-9f0c-b2a0bc4c5693	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	254654d4-518a-4ed1-a412-49283cf35be7	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:26.031154+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
4b6943d4-80bc-4c19-a56e-dd6c5c5bd91e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	56744a0c-d2e2-4310-b545-3f96039705d3	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:26.076333+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
fcd9bb60-3e7f-4bb0-b351-785fb4569dc8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	230c553c-17ec-4794-8c1b-0112aec0ee4d	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:26.760739+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
ea4bf147-83d9-4fd9-8032-6200f49af013	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5cc17332-daf3-4a5e-bd1a-fa840089a260	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:26.82393+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
1f32accf-5b5f-42f4-ac90-eed8282e98aa	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1c31ca1d-5841-4b45-ab1c-c6ae708d3259	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:26.87113+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
94f09066-de7c-49ac-8b09-fb2346937933	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e3de4d45-88bc-4efd-acba-a489d9b2e620	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:26.900968+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
8dd699a8-ef3f-47e0-8d10-148ca701bac8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ee4e6590-9a29-4209-aab5-6f0e3b9279db	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:26.966588+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
97550355-0f20-4831-a107-d79d670726a5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6f24ad29-702c-41bb-9358-2cc299d9c9f5	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:26.992538+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
e2d0a2fb-99ad-449b-8e49-3fef7ea76796	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8238a15b-7a31-47e3-b1ad-99a08dce9d38	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:27.606148+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
e11a3312-c815-4a6b-a6bf-912ab0c40220	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	e9d2251d-afaf-45fb-8dc4-d8286c31ad29	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:27.661028+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
26b1098f-4f00-4a55-9d41-641f84df365b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8f9b0720-50ac-4a6e-8ca8-7a202122ac49	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:27.721153+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
0fa3e861-2fa1-4aa0-8bc7-cbb2dff14379	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	33959548-48d4-40ae-9ea5-477dfa5e2891	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:27.746719+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
25ff5085-c395-4ea3-be03-bb617a82d61e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f864bd97-66be-427d-b9bb-ebc176950604	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:27.806897+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
0b6ba577-067a-4a6d-8128-8a47450de712	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	bf81ba50-c01e-4535-9f17-3dc1a9f5845b	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:27.834733+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
7f7d21c7-78d8-472e-abea-bb727964c1a9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5adfc2d4-ecea-46d4-9221-eb098a06c7c9	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:29.567146+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
22f5e2b4-f953-497b-b651-b08088ebd813	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8644e45f-f961-4acc-bc14-d1477151e90d	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:29.622268+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
668a152d-efb2-48dd-b27a-27b63ac5aa40	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ee14664a-888f-4273-9188-dccda10687fd	00000000-0000-0000-0000-000000000000	2026-03-26 13:30:29.700705+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
fe9d503e-e895-4eb3-888a-1d4fab0dd0ea	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	14f571c0-44b6-46f6-a3af-be09929f8365	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:01.264263+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
da9d149d-d168-4f75-876f-df2f98df9a5a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0441c8ad-52c1-4675-981a-0a8a84d993d2	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:01.511404+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
cdd674ae-a459-4062-8cca-4db5b8df20ff	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	23a9cd23-c78c-4d76-a668-b555ea36e667	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:01.652601+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
edd6b233-2007-4adf-b369-58c36a310fa8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7e52d579-e00f-4d7d-86a9-8f5a6827b4f2	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:01.681625+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
f536d412-7c87-4e0e-9b81-66d0c21c3500	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1bf341d3-e3c2-4fb6-8822-c761ea310085	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:01.766908+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
45a0a3d8-0672-49c1-b258-01d3c73554d2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	dc36d0fb-b368-442d-b1ae-3642344afa5f	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:01.802768+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
d0d64ae1-822c-4035-9df5-64327d6bcccf	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d101fa0e-262f-42b4-a7ee-81999df2304e	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:01.915867+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
3c950121-0bd4-4111-bc85-a27f998deb9d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	eb06590d-b4fc-4dd6-abca-8036f32c0597	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:01.996771+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
5b5921a3-65f3-457b-979f-6f43c123f2a3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3f652d02-22ef-460a-9bb8-6e6f4c563b0f	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:02.719361+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
4b5bb3c2-78b1-42e1-b705-72cf34cebdb1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5866fb7f-db2f-42d8-b79d-79c668b6be55	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:02.807378+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
9ef92e79-5f97-408d-b01e-3df9f1e81c3d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	33268778-f811-409a-975a-561a558073ef	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:02.841501+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
4ad1cb64-e9da-4eab-b013-041008762456	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	283729a8-8f2f-4282-9689-5030977181ee	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:02.882915+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
1d30fcaa-fe68-466c-b6a2-fdd488985760	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f464320d-9a9c-49e3-b480-09d4d296e285	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:02.920495+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
268dc222-c90b-4074-8b80-6f55d7d7fcf8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7fb66000-c3f9-4fc5-b33b-82cfdc86c9d4	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:03.034705+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
556457d4-dad3-4790-a62e-38c5baaae3bd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	61b03d81-be2b-4c13-b268-a3ed8b82c395	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:04.680968+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
67fe0d1a-14e1-4044-922c-4e20054f6d5b	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	a9ac5d27-ad33-4d7a-b113-e358e0fe1598	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:04.740254+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
73d2ee52-26e9-49d0-94a3-fab14d8294c1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9d5ee258-7800-4040-ae1b-039fa5e8293e	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:04.801992+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
50bdc254-7f63-4c98-9a9a-1f829df6ce67	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	ecab520c-53fd-490f-bbfd-f88ef22e1a6d	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:04.828852+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
b45dd679-0c35-4456-9619-1516e32dee1d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7d42aa52-6e47-4eba-946f-db7aefabd19c	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:04.886937+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
7e61f98e-47e6-48d8-9eb5-140225633d10	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	29932d3b-62d7-492a-9aa3-9482da3b5743	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:04.908296+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
e45343ac-56af-4278-989a-0ca0074e28b6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5e6cd828-404e-420c-b228-163f84e5acda	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:05.480429+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
4747d9f5-f4d1-447f-8a19-bed8ef958a6e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	755eaff0-fb9b-4621-930f-d70efeb794f5	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:05.544618+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
f1144cb9-1cc7-497a-8792-ff348c9a0a5c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1448a5c7-cd26-4067-a731-1f29d6d89da0	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:05.590248+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
9c9a38c4-7c8e-4034-80f8-32d0a6f93b56	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8410a861-ff96-45aa-aaf3-68b109da4b02	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:05.620346+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
b6bc48d2-b04d-4b6a-9706-eb5797ee55e6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b254adf6-4ba5-4d6e-93b0-16ae608bebaf	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:05.679423+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
44bbe798-be34-438d-8b7f-0d32459c6d46	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a873b92b-b989-4fa8-8162-0f8646948b87	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:05.705706+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
4e9f68e5-1624-4b5e-b3c4-d4387e2d1582	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	574a735f-f8ed-4496-8235-bd94d13c4f0e	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:06.307002+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
64390033-b984-4f2e-9cb0-3c994ec488d3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d2577e37-5754-4a03-8c7c-4df17eaa520b	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:06.38312+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.89, "total_credit": 3301.89}	0
a0d42d30-4604-4a79-94da-3e1c93b90b94	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0bd59672-41c4-4e4e-b038-6d93ba24206b	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:06.424806+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
ae222250-8b35-4374-9eb4-447502b249b2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5d00a820-564d-4225-89a0-fefb23bd571b	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:06.471078+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
4c84463f-947d-4b28-b523-8430e7e6f9d2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3108e81f-ebf8-452b-b0b8-0eeff0aa6460	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:06.515517+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
976feba7-17df-4336-964e-a55b8f756fa9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e1ae35d1-c914-4359-99ca-121f213ce75c	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:07.069062+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
d9f4fc70-e4c1-47e0-b96d-efc5b03dc772	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	dc28a53a-e3fd-409b-8985-31a10af26848	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:07.125821+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
83593596-2a13-4444-89f4-8996ac548be2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	188e856d-edad-408c-b8d7-1db4e1b109b6	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:07.211278+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
a02d3dc7-5109-4624-9b56-54fa034e69b8	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	22b1b634-940d-4d49-afbb-9705554ed271	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:07.236943+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
e7567e61-d36f-4e32-a21d-938b734a7d69	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	924ff831-b20e-4ed6-b676-af7d78cba8fa	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:09.111846+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
4020d4b1-8a9c-454b-ad37-ce57718e260a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fb52f08e-f65e-499a-a90c-e2446b562d16	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:09.167893+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
f01bd2d2-bd37-483a-8df9-3f39c804c111	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	76ed6c1a-680c-41f0-9027-821028b2bd3d	00000000-0000-0000-0000-000000000000	2026-03-26 13:43:09.234902+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
71ecef12-92cd-44ce-88e0-fcf6a7e2069c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d286aab5-6599-4647-a01e-69bafecde064	00000000-0000-0000-0000-000000000000	2026-03-26 13:59:28.649531+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 500000, "total_credit": 500000}	0
844f0033-57ca-437e-a5e2-bde2773f719d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	10dbd8db-1a16-4038-913c-d4d6dd9d9c0c	00000000-0000-0000-0000-000000000000	2026-03-26 13:59:28.89378+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 300000, "total_credit": 300000}	0
b2e002fa-618e-4be1-b6de-713fe0472c33	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c57d3c1f-86df-4cb5-9a0b-97391897c8ec	00000000-0000-0000-0000-000000000000	2026-03-26 14:01:12.50179+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 500000, "total_credit": 500000}	0
df949684-065d-4948-aed3-8bf70149e3f5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ebbae328-e61c-4fd0-8879-41f1aa6506e1	00000000-0000-0000-0000-000000000000	2026-03-26 14:01:12.563879+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 300000, "total_credit": 300000}	0
1ceb5aaa-58b7-45d8-aa9e-a63400ae55d1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4e4a659d-ce67-4a88-9d79-8d13871bbfd7	00000000-0000-0000-0000-000000000000	2026-03-26 14:17:21.040215+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 500000, "total_credit": 500000}	0
b70c0432-a674-4c7c-9f62-1e40ce3fa3a5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	44ad3412-444c-46f3-b42d-c4a896d7835f	00000000-0000-0000-0000-000000000000	2026-03-26 14:17:21.280986+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 300000, "total_credit": 300000}	0
d09014e7-0b93-47e3-993d-f05df79782a5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	62c3702a-b51d-4000-8770-5881173eac0e	00000000-0000-0000-0000-000000000000	2026-03-26 14:17:53.878599+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 500000, "total_credit": 500000}	0
66df3670-0ab5-4cbc-9238-f9dd99d86975	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0f76c8cd-fcb0-4158-9f09-8736edbfd1e0	00000000-0000-0000-0000-000000000000	2026-03-26 14:17:54.157649+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 300000, "total_credit": 300000}	0
d63728d8-88a7-47da-b64f-a342ff4ddebc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b1b048e6-1cf3-4dde-baf1-65d7e0b8a3ce	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:01.623243+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
a5369873-5ca8-4a48-9749-5bae584b9477	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f26b1c54-fb56-4e26-8343-207ef3f90f9e	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:01.701575+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
b30f0b9e-5fd4-4b5b-885e-794d9529834a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b247735c-bcf4-4cb9-8af2-a70c6ae53965	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:01.854563+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
285d8669-9121-42e2-8762-fb57d85b6311	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	02b6dde3-258c-417f-a03f-7524e6726c1b	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:01.887242+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
abc732d4-625c-49a3-8c51-2c3ec412990d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	021bd428-701d-4892-9a3d-8d08c67a7e2c	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:01.969659+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
c6b11154-e7fa-41c1-8de2-50281cad35d2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d904a9a7-f37a-4b15-bc90-b75fb79d9bf9	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:02.034491+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
5a5df089-fb59-47fd-b58b-a197e5bb7005	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b5e25259-b7d1-4aa6-9c50-e9c08a49165f	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:02.174545+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
967ab620-a235-44fe-a175-f7f33eac140d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b8f002e0-04a7-40a3-a63d-bddf5d863bb9	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:02.263145+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
6d00c634-ccf9-4bfc-a0f9-083247360628	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b47cd7fb-ccdb-4a0f-a6bd-918c4d0c4730	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:03.26162+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
ba8d46ce-bba3-426c-8583-57d2a2439f01	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fba03e5b-d558-4d30-b5c7-5864eaaab00e	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:03.371842+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
8e512fa1-95a8-4b35-9147-0511fc2194fb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ca2b876b-9544-40d9-acd4-3b66d05f5296	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:03.42118+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
156a77b6-9b59-41d8-9464-b7ab53f10627	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	de4380e8-37b2-4d00-8b67-49da6cdd0a72	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:03.466994+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
7de5b12c-61c0-4b21-8578-5fa20087ef49	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2af181a7-a8b4-43b7-861b-b2d219ac368a	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:03.509938+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
76be020e-97c3-4cc5-8ac2-ade6247e216d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	996639e7-e22a-4a30-84a4-a93b963e0bca	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:03.549906+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
1c7194c5-0a01-4bb0-a17f-f9079ea11cf3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f8e7a521-95b7-40c8-af25-4a56190a2d51	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:05.592684+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
e5ce9f2a-bef5-4837-bcbf-6642627e8c65	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b3986613-7edd-4ff4-90e4-e9b2b6675630	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:05.6739+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.9, "total_credit": 3301.9}	0
fb431bae-8539-4bb7-804c-f116ab5bec2d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1d69672d-92de-4aee-979d-2e7b34384894	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:05.72367+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
0d0a8372-845c-4d83-bad8-97609f5da483	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d3ff9a47-5f98-4109-a1dc-e57b2cdd833a	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:05.768119+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
9c1782c7-a54f-47f7-95e1-60bd19ed45fd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d7d896c8-87a1-41b5-9f25-4f9d8aa509c2	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:05.814241+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
53f909df-42e8-4448-ab83-a43896caa7fd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	71bd17b7-ffcd-414d-b1a1-a6fb8c197d18	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:06.972558+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
f1395d4e-9908-49a2-94b0-29e843100756	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6d9904d6-104c-4fc7-a3cb-d7e9d4e8678d	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:07.032191+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
04154b3a-18e8-4813-888e-4d62d27cb192	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a51edfbf-e231-42dd-9a03-5714ed1576e3	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:07.093064+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
5c46c159-4953-4134-be7d-3da8c0fa0f81	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a89e3d32-de60-4a23-8262-a658c62e8882	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:07.118358+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
e6162335-7f3f-409e-84a1-8e6abe1e6610	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	07093d13-d054-408f-9471-8d1e0ba67a4f	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:07.176994+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
055fbc71-ff0b-44d4-a6bf-45a301387a31	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b64ea8db-f713-4302-b3d5-54574e7dc3d0	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:07.201525+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
b3f8e6c0-3712-4246-addc-7775b726d894	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c413359c-1fea-4fa1-b623-23c3caaa3ad5	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:07.928769+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
4f36bf47-4cd0-449d-8e5e-8d1260941ad1	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	f8affa08-062f-4c35-8156-7c0c0bf47f46	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:07.9982+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
de4a495c-0bcc-4c9d-9ee6-0f43aab4d5fc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a35c4e31-026e-4f60-9fb3-58e53fa6c33f	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:08.126653+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
b7e28baf-dc15-4263-afb0-81dbd9268370	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	8bb7a61c-4c3f-48fe-b8e0-a5a14843ce01	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:08.152715+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
f5a5bbc0-ed69-4fe6-a763-e5977e96750d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	073732ec-e40b-4171-b892-8bde9fbecc30	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:08.240028+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
7e916f87-1afb-4f8b-bed7-39fb8da43c88	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	49206a6f-1a0e-41e9-b371-bf800e65bf14	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:08.263351+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
c2632eff-740e-49a5-a09f-e2abbb4e21cf	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1191cd7c-5dcd-4125-8296-b98ddba02f36	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:08.789517+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
d3bb65c2-986d-498a-8e9d-e41d468e3367	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	7996c7d2-093d-463d-9db4-d21a9df742a7	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:08.846228+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
8d3ead3d-1871-45c7-aeb1-0ea69564186f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	587d724e-8713-4dad-8404-ceb05e6897ab	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:09.115084+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
82a93ade-353b-4eda-b71c-e36fa1a77679	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	e32e9036-b65b-4ee0-93a7-329e52fa49fc	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:09.139179+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
ee2f1ea4-e9c4-4fc9-81c7-4f5182e1997c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ec03fe06-f0a6-48cf-8b9e-b4f65c40e06c	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:09.794631+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
71865657-bd4b-45f0-bb73-1caa61b13c84	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7066e93c-66ca-4aa1-ba9d-1a84ae535240	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:09.849222+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
e68849af-31da-4dd5-a14d-948a44aa0821	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0100f952-aa4c-4848-8399-912e8a381c71	00000000-0000-0000-0000-000000000000	2026-03-26 14:18:09.933511+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
837c9812-ddc4-4b6d-bdbf-ea98c74cee08	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	72cced37-4eb7-491c-a88c-8f0b0ec95d3f	00000000-0000-0000-0000-000000000000	2026-03-26 14:25:25.571308+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 400000, "total_credit": 400000}	0
73d87f23-53dc-4bc5-8217-7687a4089648	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f8a1708a-65a1-441d-8457-261cc3057e44	00000000-0000-0000-0000-000000000000	2026-03-26 14:25:26.201137+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 200000, "total_credit": 200000}	0
f7fd3d17-f7d4-4b03-80e2-ea4f3f57ce4b	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	08c1fcc6-a15a-476b-a3a6-1bc553707024	00000000-0000-0000-0000-000000000000	2026-03-26 14:25:27.784424+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1000000, "total_credit": 1000000}	0
6ac1869f-3554-4c4a-a35d-0b24811f46a1	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	5e350e59-7671-4ed6-9b6f-a5af9cd8059d	00000000-0000-0000-0000-000000000000	2026-03-26 14:25:27.816038+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 600000, "total_credit": 600000}	0
ba0b4f4b-d1a2-44d6-af5b-67a590b91952	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	28d5b5b4-6027-4b0c-bf60-6b9a3f4d0be6	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:55.376505+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 400000, "total_credit": 400000}	0
5fa57c56-c2d8-418b-92f5-5c35388103d4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b56892f8-d6c6-4e1c-85d5-ea659303e7d7	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:55.435205+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 200000, "total_credit": 200000}	0
f677ecee-80c5-477b-990c-98cd41159f64	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	2b026034-7f77-470c-9c02-2fdc3d0384c7	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:55.510741+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1000000, "total_credit": 1000000}	0
49bd5d0e-862f-464e-86e6-9293719ab575	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	782b2d82-8778-438d-963e-5544e036798f	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:55.533536+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 600000, "total_credit": 600000}	0
f596eb71-4a88-4128-abfb-de32bbf605b3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8254011f-4dad-4392-9aa0-40a093c7865c	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:57.696875+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 500000, "total_credit": 500000}	0
091dbfa2-2b1e-4294-b14a-7c1ad1e388c7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a3404956-876f-4941-929d-ace0996b961f	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:57.754514+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 300000, "total_credit": 300000}	0
cf0a4b1b-4048-4396-9371-2875dce9e5da	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8c086ab0-4550-4ecb-aed7-50c854b79b38	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:58.482116+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
92ef5196-60bb-4e95-8b1c-a3e11cc06645	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2e62f327-5b2f-46bc-a3cf-988aadf439f3	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:58.546049+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
cad2060f-624b-4f6d-a0c3-41a4bf8dff08	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	940cb212-8f2d-43e2-88e4-8c0cddbde27b	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:58.691633+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
b897f426-6e92-4cf4-8eaf-dbf64a1adac4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5b42b467-f65e-40fa-a3d0-c763b544638b	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:58.722839+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
9a9faa78-07d7-4055-8e3e-3e767c41c953	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	08df4c15-ed65-4bb6-91b1-feb152eccd67	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:58.808323+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
9a85e2d8-219f-4b9d-bf33-254d5f0194a7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	724cf049-acf2-4771-92d4-d2830c29dd29	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:58.844449+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
f9c1715d-2e32-48b3-be59-bc513628d283	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	96de0b3b-67e4-4c62-a23e-eb90b8a5bd03	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:58.959671+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
5114033f-3dd1-44f7-8b45-2390955fb1cb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	10a58fd4-5fe6-42a1-a873-4e77aaa7fea3	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:59.042623+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
ec755c91-1a22-44fb-98e9-af00eb60401c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bb13b81f-c89d-46cd-9dc9-65653692bfe4	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:59.834473+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
df3f3f4b-f0f7-4fec-9a51-8e91a280b801	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c3c95dee-85be-4fd6-90d6-d81b131bb243	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:59.924394+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
82e495cb-b478-4a8f-84af-66911ea0294c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5e583f0c-1849-4da8-8019-271c4aded1c4	00000000-0000-0000-0000-000000000000	2026-03-26 14:27:59.964263+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
dfdab8d6-d7c6-4508-94c8-2bde89b152e5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e57d21eb-659c-4413-9a5d-f65b3d84fa9d	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:00.088962+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
6227af30-ce0d-40fb-bdd3-edc85cfe32e4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	38ee1883-08a9-4a38-b141-77261687aa71	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:00.130659+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
c092b9b8-276d-42b7-a05e-0ddf88c06120	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	321e9edc-dc37-4ccc-8172-c7d5a28b68f5	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:00.171791+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
e0c64b67-4f28-4896-86d1-8ee961d5f920	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5095bb3d-8d33-4b8d-8c67-f916c820d932	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:01.777032+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
34781476-07da-4be8-ab56-6b77b5e27104	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	fbde4101-d7b6-4f1e-b15d-1d7a39b9548c	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:01.827316+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
41a1aac7-a874-4284-91de-7968e44ec7a7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1abe4d68-4d31-4dc7-a566-9e99defcc29b	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:01.874181+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
ab1d60e3-310c-4fbc-a371-e5541293b3ee	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	42df8272-5508-479e-9760-304292773d18	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:01.895428+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
e6d841ef-ac25-488b-86fe-ac6c66372acc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ee1aa475-ff24-4347-909f-3c831c0e8b22	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:01.958564+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
0af76b19-8441-4e09-8c72-3c19794a0f44	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	04600564-088a-401d-a960-20b2cd8e5558	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:01.979829+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
90aca890-7478-43e3-b1fb-ad48dcb97af2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d6acfe94-9ad3-40ae-83f7-cbfd816050b0	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:02.530629+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
f71c2e96-d286-42c7-ae4d-3787751b78b3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3d7375f8-a914-430a-963f-f73d4dce4286	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:02.606144+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.91, "total_credit": 3301.91}	0
ff2adae0-6b45-43f0-bbbf-e7351280b530	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fe104ec0-77b5-4944-8da2-e18c9be690af	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:02.646359+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
19502650-a98d-4295-90a6-8a7317cdf3ef	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7b6c536f-16af-4a71-9d31-ff18ce9f1875	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:02.681531+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
1a520557-d19f-47b4-be4a-cc7af3054209	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7a58c907-43ff-46ce-b03b-587f696c5f4d	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:02.721896+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
1f9f39a8-23f5-497f-9301-c349e7ad913e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7b227c37-64a6-404f-9607-fa3b47eb3b67	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:03.259932+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
56607fa4-c433-4568-91d7-33a5958f8e8c	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	0b0ea6da-ffd3-4f87-bab9-2f8cb6dd3464	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:03.31704+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
10d491ae-18e5-4d04-9c17-b6b87754aabb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c0a51580-cf7a-4fa6-aaaa-20953b93ffbd	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:03.398486+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
4c9b677c-f3f5-4bfc-aaaf-281af6996881	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	53c15778-aa47-4623-98a7-85f0293f9d58	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:03.419716+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
22775ba5-6032-46bf-8f69-2277687dbf81	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	33eebd54-8882-49f0-ae76-824fe06491a9	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:03.992638+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
321a609b-30bf-4d10-b4f6-59b6d89d48b3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d417982f-7449-4ea2-9f9b-3089810a332f	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:04.048645+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
d55035d5-8695-43c6-9dc7-54430def993a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d4242bed-8916-47be-b43f-69961d777371	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:04.090763+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
887db6ee-b2c1-45b1-9759-eacc3fa09ed6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	999805db-d94c-4909-b5f6-a77f4c17cf28	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:04.117333+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
48ef76ac-9e45-4994-945d-a923d7171cf0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e46b832a-f083-49f1-a2be-27a14dbbebc5	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:04.17317+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
da637de8-12da-4b4e-bd78-1b7b4724ad72	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f47b4454-5b4f-4cc8-93b4-8c55838b2b93	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:04.198341+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
b2cc9fc9-27b1-4d2e-bc6b-249bd705a509	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e2d582b0-074a-4566-be2d-64dd8f1a97d0	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:04.694443+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
b7670dfe-73b0-4125-ba53-9a7872fc472f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c0b1d4d9-10ba-4e07-96bd-1005620046d2	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:04.755668+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
efb0aa12-ea3d-4d75-b0cd-7581de1c3de5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6a482d6d-9611-4cd9-a3b5-ff6a3dc739f3	00000000-0000-0000-0000-000000000000	2026-03-26 14:28:04.816745+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
80cbd719-0f50-4d9c-b2fe-31b7ce961a67	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4b2022b4-95ae-462a-b700-9dccb701a463	00000000-0000-0000-0000-000000000000	2026-03-26 15:36:56.974196+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
577cb93b-966c-4590-b540-1677ba9e1d7b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b1364411-7c1c-4284-bfbd-36063d317263	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:00.318693+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
f4d3d9fa-9d24-4396-bc77-4be62c8f7665	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fefce875-e6b2-4586-9364-821bdb2f2ec4	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:01.009029+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
cbaae467-773f-428c-aa4a-d4bc4e6bc216	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1c60ba1a-3f91-4244-94d9-2037419a90f8	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:01.121242+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
e115c2f9-9a6c-45b6-99cd-150c7694fe68	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	15c05121-b5b4-4f29-acba-42287aba029b	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:01.231259+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
9c39c871-fc04-44af-af57-704105b1846e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2ebc63a9-d1e5-4e3e-9e0e-15d339038ecf	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:01.356614+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
687edc23-0ca7-4954-af0b-0d1389a1176e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	de2c3be4-7e77-4fcc-b754-2ade0da6b120	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:01.601498+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
54674ece-eda0-4ea9-ad8e-2f1a7dec7cb4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4d2fe428-6b88-4639-9f47-93bf9be1ec35	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:01.854733+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
9dbe584f-8dd1-4dd8-a7eb-6c501f24d40b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a773d6bc-babf-4957-ae81-f9b09e2121bd	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:04.990499+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
d1a14746-5c48-46cb-971c-7ad343cfec1f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b49a1f88-c886-4d9c-8f7e-649a9448897d	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:05.654469+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
9f7783f1-da12-4161-9f7e-5c68dd1cf961	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c61207ad-885e-45c6-aea9-da488cc83cea	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:05.940654+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
5535efa8-253d-4718-8345-d15c1ca79d9a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4dfb19e3-d0cb-4b3f-bf84-88d0813af0e1	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:06.239052+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
a6b66534-7cbc-4a10-a113-5b73ba8266a2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	398dd422-2fd6-426c-b2ab-eb871852bfeb	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:06.768147+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
2f9f4b13-1121-4073-aaae-d4ee895db7ef	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ff6059db-32de-4e1c-ad62-ccce83639f37	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:07.049322+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
f631f3ad-ec25-4ea5-9a4c-90c489dd26e5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	14a44623-eace-4193-b5ee-17d1de6da4de	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:12.239099+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
fd5dbcf5-8664-47ad-a966-104d019ad91d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	cb62c1e6-e474-4a83-8206-fc934fa77871	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:12.455311+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.93, "total_credit": 3301.93}	0
ff0a0ae0-7532-43ef-8ef9-24beb92e3560	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e579b197-7805-4088-a265-d57e6601d2ed	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:12.585262+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
ea38da38-9b74-4e94-9327-965739ef1418	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0d459dc1-1414-403b-8aef-704b929cc614	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:12.657903+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
64188fb9-dcb8-4107-aba1-49e1019943b6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	584d0127-9fc4-484a-9844-4405d19dbe5d	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:12.754257+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
133328f2-8b90-492d-ae85-a25d3a788612	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0931446b-6f4d-4e2f-88a8-7d5c04ea393d	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:15.288823+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
45ddb242-5b60-43e9-a960-419f965a9f10	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	8c928713-1761-40b7-bff9-c6eb5c6035cd	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:15.374124+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
deea5a75-bd01-4cc1-8b25-e4c9d63fa708	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	99adc535-3dde-4cac-b216-2790fe35c564	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:16.493292+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
9d70e3b2-5f06-4c1f-b7d9-fd557d037757	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	7024a8ea-6fdc-46fd-8ea1-7512cc22e863	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:16.542139+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
664c0927-1632-418f-b8a6-62e4fd86bf23	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3a79acb5-44a4-4249-9e55-a21451f665a0	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:16.952159+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
8901529d-d4f2-4e1f-9843-6bb00c26dca7	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	de907252-2228-40f6-b427-455965f0804c	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:16.987331+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
38cf53c3-1844-483e-84e3-28bc9eaa3556	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bf1d6e6a-c2d0-4450-9152-f42cfe52500d	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:19.989961+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
38133760-b082-414d-ad26-d48a2ed10271	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d30805d1-3a3a-4020-8c2d-ba90ec0b7b2c	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:20.184117+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
22c77f93-1ae4-499c-8c37-03a4836411d5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ceab9189-2f2a-4dd0-8d82-ef0f16a162e8	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:20.283629+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
f88c22f5-1232-4b25-820d-02f7ea877cdc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	00d80e08-497c-4763-bf4f-eb2883a2b406	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:20.344261+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
fa38550f-a0fb-488d-bb60-bb22151d9574	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	94cdccbc-2d74-4e0d-a96e-7dda5859ccd9	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:20.46569+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
756a7a83-94ef-4656-8e3a-ef3d67fd12fc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	77f68c78-5018-41b9-80d8-2eb9471ab25c	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:20.517586+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
36fa1041-2de7-4531-980c-2134a073fc80	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5c8e0e68-e5a4-4231-ad05-8e07102d07e7	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:23.323244+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 400000, "total_credit": 400000}	0
7aafbe1c-d559-40ae-a392-3872cfa141fe	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	930e216d-5c11-4515-92fa-193681069f69	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:23.664686+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 200000, "total_credit": 200000}	0
586b4aeb-8fff-4d05-9ef9-34b002cd79b4	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	2871fef8-54ed-4eff-8bdb-ed210eebfecf	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:23.922113+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1000000, "total_credit": 1000000}	0
98638f41-91b7-494b-bc60-6eb817fa0615	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	6ef50653-ef09-4b99-a5da-d74fed95282f	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:23.967894+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 600000, "total_credit": 600000}	0
60ee6942-2478-434b-afd0-ffe5f347ec85	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	663cdf0c-f1d9-4f38-bd77-3646ef66a3ff	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:25.055484+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
63c0e1cf-8df1-4554-a5b7-4aecbccc2607	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	66a9b9c2-4ca5-4893-b397-aaea5be8abfe	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:25.144363+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
6ed4b61c-8167-446e-8a3f-1dde24353406	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	088bdc21-f5e3-44f5-a854-0a666d7034a9	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:25.250706+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
e70e3418-3ff9-4156-9795-228a2615063b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5c56ab39-4d3a-4a86-853b-6c9da40b498a	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:26.083501+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
ca2ca727-d8c5-4420-ab81-f2586da1cc68	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	3d2c398b-7b4f-47a0-8407-2d058c862711	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:26.159466+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
d49f2703-4138-47b6-a9d8-8f2e8446a944	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	221e8a2a-cd2d-44b4-b566-1506e52ed477	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:26.331146+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
64556951-fbf7-489a-85c1-f16cc9d60677	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	543455a2-2680-46ae-ac4e-c8060ffe7670	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:26.363484+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
77df1d47-5242-4c7c-a03a-560327a7abb8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c74cba78-390f-4e6c-a8f5-98149ee70ef5	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:29.511555+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 500000, "total_credit": 500000}	0
ce644153-cd93-4e07-897b-4c04a83e88a9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	49ceaba7-1a53-4e89-aa79-8aa0e9117a53	00000000-0000-0000-0000-000000000000	2026-03-26 15:37:29.707438+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 300000, "total_credit": 300000}	0
9661d360-8c7f-4207-b35c-021fa4a3acfd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8f89ca82-22d6-4a78-b97e-190cdda3c60e	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:05.729547+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
4d30ac2e-ece7-497c-973a-ce560691b624	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1f699155-3bb6-40cb-9f71-f863de590323	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:05.958131+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
18169393-0626-4a6e-adbe-a989251bc25a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	60839b66-e779-49f5-b6ad-0c3dcf8f8555	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:06.116456+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
08e887ee-886b-485d-8996-1b22d5e3c5c0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	48a9741e-cf34-4855-871a-f6443ef9442f	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:06.150133+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
b0cd195c-5347-4e96-8359-8adedf3a6cbf	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8c7ab340-20d0-4300-a8c8-ddc22d657643	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:06.237884+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
7e1ddbf7-cfd6-4578-8f3b-1644b772bcef	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d6050829-c686-4024-9db2-43ac5a0066b3	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:06.294843+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
f04c409e-3989-4d47-b8ed-73a7df3a6a93	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	de00ed0b-5ab3-44d1-bd06-53fd6705b450	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:06.444113+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
9c857b05-5c83-4d0a-8ff0-e17fb28f9042	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4c74cef8-01e7-4cfc-8da7-22dec16baa7e	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:06.525611+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
a5573133-1e01-4bec-bb32-7eb183dae631	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b0474786-253d-40e5-a832-80f8b8826b0e	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:10.020977+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
863b8859-af3e-4686-a90c-d02434907e6b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bc496fc1-bc60-4cee-b14b-eee6fb6621d2	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:10.109945+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
944bcb87-578b-42bb-b4c1-9ed43964ad34	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b3e86103-1640-4158-840d-fa575badd564	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:10.148527+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
e1d0223c-228b-434c-8a61-0c2050170bc6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	37ddc3de-3e47-4353-b030-c729a77b3d3a	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:10.188218+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
a00d103a-5709-4e5d-bc99-2427c07ebbad	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	da9e7b18-ba21-49a7-ac2e-6e46f3ca8ee8	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:10.223632+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
d0873988-03c2-4dbb-afd9-98d3f905d2e6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4cfbf195-eb76-4b40-8677-e62611baa184	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:10.26197+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
f1ec367d-c018-4120-a177-12111b3f6900	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b95b993c-907a-4bb0-8d68-d3253ce522fc	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:11.9651+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
3c751d08-ab3a-4568-a606-98d08a256c28	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	4732cd2c-22a6-4def-b696-50237b6c1899	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:12.028976+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
babc2681-c27f-4e71-b9bf-72d47253a319	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	196a9ebd-53c0-4ecb-b8b2-917b21c04e2e	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:12.153107+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
3695aa54-d544-4bef-adc0-d236f38d33ac	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	7317816e-041e-429c-98ae-e62ae5d10918	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:12.177191+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
4ce63506-1d19-49c7-913c-532a3a20bf01	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	be89f5a7-a12a-471e-aa0c-eafe084e2793	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:12.281836+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
f48b816e-d301-4858-9b80-7a82e27e0840	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	9425c753-1942-487a-a19c-4d8087fd6dc9	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:12.310581+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
ff78763f-333b-497e-b08f-bcc2f38bc647	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e85f9bdf-5951-42a1-9fa9-71fa644d7c6d	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:14.433864+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
59b02d16-fcb7-4838-bfca-e3482af10719	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	4f00afe6-9980-41ca-a880-f01589b18755	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:14.489072+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
0f2b0c38-ea89-4fa8-99f1-ee4fdebea471	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	af0e5f8b-af32-4c0b-9d4d-735c36ac928b	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:14.652306+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
cd6e04cb-d927-4101-b88f-8bf3b90d7f6f	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	22b2e018-35b2-412f-b158-480b56120ad9	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:14.676483+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
ee8ed8b0-7b3b-42fd-9e00-01ddf5dcbdfa	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d5f4d9e9-bad2-4aad-8f4c-be2ee768e915	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:15.350272+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 500000, "total_credit": 500000}	0
868f0ac2-0456-40aa-ae5b-d454bdd5e5ec	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c03404ce-cec8-4f53-be99-a95bbfab70d1	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:15.400936+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 300000, "total_credit": 300000}	0
9e03412a-f449-4fd0-9a4e-a2fe1277fbe4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	40728bba-b309-4816-a840-dc9f0efd0b0b	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:16.178682+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 400000, "total_credit": 400000}	0
1bcdc5ae-772e-4495-979e-ea212754fe0c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a3d08e8e-1bde-4085-abf0-f945143bf0a8	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:16.235056+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 200000, "total_credit": 200000}	0
77c19c50-e7b5-4826-aafc-6150dcdc7c4f	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	e139c54c-e279-4a67-80ab-eb569ad5ee2c	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:16.334048+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1000000, "total_credit": 1000000}	0
7f8c7d49-f435-4ad4-bf49-38d95a1a54f1	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	75782a54-37dd-4156-8d7a-f5627f79c675	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:16.355017+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 600000, "total_credit": 600000}	0
fdd2ac90-70ac-4438-b057-e3db0872b596	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	619d671b-e715-478d-8b01-6eb5d7327af9	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:17.097526+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
86433357-9bfe-4a7c-845a-09a2f85a27bd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b66839c8-3a91-4e5d-a3aa-5d9360527bc2	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:17.187182+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.94, "total_credit": 3301.94}	0
4398592e-6b52-45c5-87d4-6d83348ecdbc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c1eac1e8-5d16-4e16-809b-e34cf9d04455	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:17.233096+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
3a820059-16dc-4b96-8b78-8c93f6520112	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fa14ba71-21ff-4643-8743-70ed76e7347d	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:17.278037+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
4084402a-f032-4acc-8abe-a34bfb7e598d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e4381c91-bfa5-4143-a657-b74f6b35436c	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:17.323273+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
a6390bb1-6b4c-4cf8-8d0c-bc3974608483	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0cd70ae9-bcf1-460a-8481-e8f1f4617ff6	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:18.446401+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
a44c90d9-31c6-4bcb-baec-e73fe59b1b1e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0170e6d6-83ba-42e6-812f-8b0b25cd1d6c	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:18.501899+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
717f97f2-60b9-4740-934a-513f44dfc74c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4619c0d1-75fe-4a34-bb65-907acec4b483	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:18.555462+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
bf84b6c3-d9ea-46c7-8d20-2e5cb9bd2d75	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f8aee6ee-b5e0-4964-8f7c-02831503740b	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:18.584887+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
12204f3d-e95b-4e55-8547-f63ab4a24245	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7f75227c-4797-4d80-9e10-e3c25df912d8	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:18.634889+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
a510af1a-339a-4c4f-a36d-877f0e08975c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3ad25bba-983c-4b3a-a545-83f7f92c3f40	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:18.658609+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
367ff1f4-1f00-4c27-991e-bc3f23df6a93	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	68a9c90e-f127-47de-bf98-118879e83f01	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:21.609476+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
c08a6d71-9526-4d8f-8288-3846f64ef97e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3652da69-0ba6-46e3-8006-0f8d27eff670	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:21.667043+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
1d09b93d-d306-4471-a301-d16c2835b2f7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6ca06af2-a90b-440d-a3b7-9e76ba0c3068	00000000-0000-0000-0000-000000000000	2026-03-26 16:09:21.751615+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
aab4ad37-7cc9-4b5d-8a71-8d3a062c52dc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4587ad52-ca06-4cde-97f0-0134bf3d1d21	00000000-0000-0000-0000-000000000000	2026-03-26 16:27:13.830838+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 75000, "total_credit": 75000}	0
c967c22c-ab84-467a-8699-1a18b29e715a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	43708743-534f-412c-9231-8ef712958a2e	00000000-0000-0000-0000-000000000000	2026-03-26 16:27:14.355907+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
90cf74c5-4216-4eea-872d-e4ee99f7a7f0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1797ed15-cf7d-41e8-bcdc-b0c899515429	00000000-0000-0000-0000-000000000000	2026-03-26 16:27:14.490486+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 21000, "total_credit": 21000}	0
0ad896d8-eb08-4bba-8600-8beb405660ef	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	456c06a5-ae67-4eb6-9bdb-fa6b317f4d84	00000000-0000-0000-0000-000000000000	2026-03-26 16:27:14.531774+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 24000, "total_credit": 24000}	0
9bd45cdb-a361-41b5-bab2-fb77a0029b59	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5deff3d4-39d1-4604-9e74-03dc196a69b2	00000000-0000-0000-0000-000000000000	2026-03-26 16:27:14.803913+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 152000, "total_credit": 152000}	0
8a07e26c-625b-4c3a-a013-9fbc7e0d061e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8ff03795-097c-46b4-9b3f-8f5bf884223f	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:36.711251+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 75000, "total_credit": 75000}	0
965fd5be-0c2e-4416-9905-0c3321dc2231	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2cbeb00b-a29d-4591-a685-1e5d496dfe8d	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:36.96725+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
8967928e-d8ee-4652-b320-47626bc4ca65	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	72a9d402-1024-4c2c-9aa4-936944e8ea42	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:37.040516+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 21000, "total_credit": 21000}	0
a53d3848-567a-4ffb-bf98-a2bafdb57294	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	134c4ff3-8721-4253-ac9d-d86de4693dd3	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:37.097296+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 24000, "total_credit": 24000}	0
f7f77e72-7549-40a5-95df-dea4d7878cb0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e0b0790b-62b2-4da4-9d7a-86fa1badb840	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:37.316747+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 152000, "total_credit": 152000}	0
359c7de1-8c5d-47ec-95b1-578d6c832efe	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f1663cfd-945d-4437-9104-d7fb84b195fc	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:41.079616+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
01f13559-8161-4a92-a007-e91cc4d72356	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	90ee96e4-136e-4528-b13f-5256d7857afa	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:41.189551+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
3cf0c662-bfa6-4680-b46e-e8edd97e6eaa	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	053a445e-d91c-4f70-92d0-c7d8efdc17fc	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:41.360011+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
30f6ae2a-6a87-4b51-8dff-20a6ed03c873	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2c67ed8a-d25e-401e-b7bd-6a84638dfd4b	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:41.416945+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
cd9363d7-a557-4ca6-8ec1-00d9d6ed8b2a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d7b5e96a-fcba-46cd-a737-103875e32a11	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:41.522214+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
f7b49dd8-6385-46ec-a913-67efb147bf56	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3a40447a-8088-4853-844e-afa149ef3a10	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:41.573886+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
27137ea6-f2fd-4ed2-9f3e-5b33ae4c046b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1d5152d8-6db3-4317-a67c-a9f146cf99c3	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:41.72789+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
f8a51026-bc1a-40ee-98fb-48ee53c21c83	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2f83a242-7e80-4fd3-b258-6eba1eb14314	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:41.835391+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
94b7ac98-3553-4873-b282-cf9afc814671	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9b1caa89-5512-43bf-a87b-9f48db92ded4	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:42.798847+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
13d2ef47-2222-4c45-b6a3-62811e84f277	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f4c5bb3c-87fd-46be-858c-e093faf4e4bd	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:42.94623+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
e5e7208b-254e-4ccd-94d7-b9d5db7a6342	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	600f899e-b1ff-4149-bcbf-4e446cc6a2ec	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:43.016424+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
f8b1f586-ff5c-47f4-b16a-2f78c881d757	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a72e1532-fb79-42db-99dc-8d6003323d95	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:43.121858+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
b75b8008-fb6f-473d-8221-fb100ad42c79	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d5c2c3ee-85c2-4293-baac-074f394560ef	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:43.259172+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
c7492d33-842d-43c9-b75f-ca4f30d2a322	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d8915942-62bd-4cf4-a48a-7826b472f7cd	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:43.366019+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
34835807-39cd-453a-83c6-9bab6376fc3e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f3e196d9-28ef-4458-b880-db4290d20f08	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:44.274496+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
478315b3-0b26-414d-957f-9bda5cac88db	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	d755d727-01ed-4d4b-a431-88d1b09650c8	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:44.337334+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
dcea9d27-5049-43b9-900b-1b7e224c8cf0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5a34444e-6146-4f35-b357-bbe4e16ea4dd	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:44.6237+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
b9a90bc5-019d-42f4-b193-1a28257be4c7	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	035de80d-17e7-4545-a490-60c0f151145e	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:44.650336+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
974ac725-1fcc-4d4c-bc19-77217e0195cd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9350f191-83bd-47a8-a042-5c8e35e61d63	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:44.765038+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
5db69c33-f6c3-47e2-a133-8360ee6ddea7	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	cf9ac2f5-2c1f-4472-aa8d-1f13ffad5226	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:44.788732+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
23cbcfec-0c72-42fc-8ed8-afd8264c8d36	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9579ad1f-5ceb-442c-ab91-3c5325d9c09e	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:47.133468+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
34b72306-111a-4b2b-b6aa-e219b230ab6b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ed955110-5f87-4526-a8c4-18a0747eded9	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:48.278703+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.94, "total_credit": 3301.94}	0
f9134389-6b2b-4ff5-af1e-7c34b9f577ac	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	73d387b8-b6ca-4270-98cd-ba9c3bef167e	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:48.839532+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
b4a08a9b-be24-4a73-9f1a-125a85b242af	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0299ceb1-89da-4e13-a478-7d084384b611	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:49.098497+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
b37b6234-71c7-4a27-acb9-c931b2a5ea27	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ebc3f41d-decf-44f9-99be-3e1888ae665c	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:49.520108+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
f47040c8-20a4-4192-8ebf-8f6cb4c0f758	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	61a431ff-bd91-4ccf-a3f5-80bf45363c82	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:51.264569+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
0c5782cd-dc80-422e-88f5-eab64909bf8d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fe5ab508-248d-49ff-9d64-431ab2326545	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:51.449576+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
ce1d5b70-9175-49fc-81f8-15d1394afaa6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c194b0cc-6a24-45d4-a96e-f3271aa1d1a4	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:51.89918+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
0dda8c07-a018-47e8-8767-f8c4b8ae0839	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	54c77219-2c67-47fa-a7d6-72ab0ad92b35	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:52.601196+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
442c3e94-4917-4176-a51f-fbd5d787d186	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	5895387a-79ce-4488-bc06-b5268a294798	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:52.663348+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
79c30a4c-8de4-4709-b05e-04d190ca3c9c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	176731af-7bae-44f6-b393-dc7ffc5eb36e	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:52.758012+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
99962a02-3002-4ab0-bb0b-0135b13d9540	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	a493c684-200b-476d-8704-e377231b834b	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:52.784721+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
427bb670-a683-46c9-882d-35f2a9d5ef49	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8bc511dc-4917-4a6b-917a-899a38169a35	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:53.532394+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
272a8ee8-505c-4c68-a541-5c16f4b3a35e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c79ad84c-e95b-4e28-b064-d6cafe275360	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:53.600799+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
5a59f065-5dec-4a2f-b711-453bdee928cb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4453812c-adb2-41cc-a8a9-9d8390e51631	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:53.661876+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
41927003-a05a-439b-8a0c-0576bfa77122	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	108867ae-890c-4ba0-949d-8544a771e86d	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:53.699591+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
206cb55e-8d5e-4e9f-87c0-80a9c00b491f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9d903d54-cf30-48fc-b939-336db0122180	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:53.772883+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
2b25f00f-c7bf-4f25-a9cf-7dc041ff9c53	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d0240dad-68ed-4b98-a09a-d92b2b148a88	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:53.808883+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
13bda7ed-ea5a-4062-b647-21f871039bb9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a309917f-3b97-4f0b-9f7e-a2aeb986181e	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:55.38468+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 400000, "total_credit": 400000}	0
3614337a-c0a7-4401-8bd1-6c6dc0506ac0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d583a22c-7e59-4df8-909d-953da38280a4	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:55.445197+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 200000, "total_credit": 200000}	0
5b6c9fab-a241-43e4-8ff5-066131816ced	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	168d80d0-695b-405c-ba4b-3c0ab7309874	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:55.527146+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1000000, "total_credit": 1000000}	0
0d063c51-8dc8-47b0-b917-59e22be49025	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	b8be7f09-7788-45a9-90ca-85748fd099f5	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:55.551438+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 600000, "total_credit": 600000}	0
774c7402-993e-49f6-8e55-ff642d0a58ab	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	915a8174-9b36-42a5-8fe3-11b38ecb441a	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:57.395615+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 500000, "total_credit": 500000}	0
6852f666-3f4e-4831-b8d8-1133c3362e8c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fc89d625-5751-4399-8e67-fcb24fe61477	00000000-0000-0000-0000-000000000000	2026-03-26 16:29:57.468099+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 300000, "total_credit": 300000}	0
06df9ff5-1848-449d-9020-b384bc5dadb4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6d32a4e4-3316-490f-9fe0-f15c6ecb5ed5	00000000-0000-0000-0000-000000000000	2026-03-26 16:35:46.215656+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 75000, "total_credit": 75000}	0
f4a10286-6ca3-4e2b-b0cf-0ddbe093e0e1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0d42c5b7-df4f-4a81-b859-4e1b79db6cda	00000000-0000-0000-0000-000000000000	2026-03-26 16:35:46.566031+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
d3b42798-fc7d-449c-9040-7878c4e3db91	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fb10441a-473a-4dbd-8349-cc15e73da4d3	00000000-0000-0000-0000-000000000000	2026-03-26 16:35:46.648968+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 21000, "total_credit": 21000}	0
f1cec489-97ed-45be-a6a2-3159109c3ddb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b44fa722-bf3d-4462-8427-5bc50b1b68ed	00000000-0000-0000-0000-000000000000	2026-03-26 16:35:46.73195+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 24000, "total_credit": 24000}	0
c186a9d3-2dec-4063-9026-0605f6b48275	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3d69c8cd-cafb-4c62-b41d-98df014ce7e7	00000000-0000-0000-0000-000000000000	2026-03-26 16:35:47.178917+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 152000, "total_credit": 152000}	0
a30e3bb9-25f4-44de-bfcd-085020d436f9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c8c508c0-af9d-47bc-8beb-35c2ffe376f5	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:34.669085+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
c0bfcbe4-18a9-47bd-b64f-da30f3e2e464	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	64b3beb8-8f22-4ab2-8626-6326a2c258ed	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:34.855366+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.95, "total_credit": 3301.95}	0
85d85601-1d21-46b2-993f-0e93d5397f02	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	667fbd28-0271-4369-9845-43735c9e791d	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:34.945794+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
20781e7f-f718-43da-8e24-5af8ced81745	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	894f7e30-34d7-4d3c-a53e-49b8c1f9024c	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:35.027454+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
02163a34-f294-4684-94f4-dad438ee85a1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4f641085-8e94-43a1-b284-c21dc3f8573e	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:35.087511+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
60981ab3-b2d4-4dd4-8da9-e3fb441a90c2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	66447520-01aa-4620-8de9-442c625d148b	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:36.817752+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 75000, "total_credit": 75000}	0
d178a6c6-3fef-44ad-889e-d3616f9b6e71	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bde6fb31-5ea9-4f78-a154-741d1586f3b5	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:36.935534+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
d486398a-a3f3-406c-b959-4d5772fd1daf	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c4ba4d90-0c1a-49c4-b5ad-9219631f10bd	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:36.985842+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 21000, "total_credit": 21000}	0
0c3e7e6e-5fcc-4a9a-bc9d-7511f59030af	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3779dfe6-3fc8-49dd-8bff-27f37b3a3e92	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:37.057945+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 24000, "total_credit": 24000}	0
643fe001-f2a8-474f-b4ad-b8073fd8d059	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	205bfb73-bbbf-43c6-b9c7-796f4e2562c4	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:37.183134+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 152000, "total_credit": 152000}	0
bc7c0e80-754d-4e92-b885-2e8f136949be	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fe877ebf-82d9-43e0-aa61-18ceb363aa7a	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:39.388453+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
d904a6c2-6e6a-4e9c-909d-14af769fae93	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8950a06c-fc45-4ba7-8fd4-b45debc0a834	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:39.485274+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
1f2aeccc-9630-40ee-ad4d-508e8738dbe6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a99e4d90-cf9c-4f25-95cd-4887c4e6dd9f	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:39.52535+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
ac74767d-c891-47d6-afb3-8d4b7e38ddb5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f1d6f358-6798-40b6-ba65-89928f74ac6f	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:39.571944+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
8054ba56-6e03-4320-8c98-e9a64facb571	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	120b3df2-8ac6-4938-9a08-e1a5e4ed06e4	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:39.618207+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
78922265-ea03-43ee-aaf1-bc13a9e3c6b8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1e944137-5e85-4eb5-b100-56e352a482ab	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:39.666234+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
bfa47f4b-5159-4c0d-8816-c9919261eb21	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2a6112e3-7b54-4bf6-be9e-8e647765091f	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:40.44787+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
c97b0ef9-dab1-4bbc-9223-dbaf959f91d5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	11e4ef89-fd60-4161-9855-16a8e36fe95a	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:40.511481+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
2b39e3a0-aed9-4462-b810-c2309bed9dc8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	95df73c4-518a-458a-b59a-a5c54c03ef73	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:40.645156+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
2ff655db-db7e-4366-89fa-034499880dba	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1e8d7f50-1731-418b-a4f9-bcb26c11a3d8	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:40.675498+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
e0a9edc3-3ac3-4507-8063-02cd25d195aa	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	cd9352e4-8e08-4f63-bd47-55e741b4b699	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:40.754751+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
4c3437f1-c652-47c2-8cb7-0cbe254c6a22	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	33d8e3fe-b0ec-41ed-b1b8-8e262d183a2f	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:40.786008+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
331a701b-77bd-456e-9998-5ac5e40b39a8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	41065e26-4184-49bf-b380-c3894446d2a7	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:40.904448+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
33d7d00c-7f76-4f72-8d3d-66a0e24ea7e6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	99a1a979-d276-4034-b625-9e1db60570f5	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:40.98406+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
2a4bd3d4-00ed-4176-ac7a-e2030977cbe6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	32ce58c6-ee61-4c3b-b19c-2cc059a87346	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:41.484127+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
41b087c3-618d-4a11-91b5-1d1bd2d02ede	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0062204d-f55a-45b3-a19e-0fb23ac904fe	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:41.538812+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
7ae4c3b0-712d-42dc-a17d-847b59a32ba3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ded60614-1459-43c0-bdf6-860f97c73aa7	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:41.597889+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
7cec78a4-53f2-4743-915a-9414755698f7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ab0fa2a2-3986-4d8d-9051-e83c640daad2	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:42.217124+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
d9b2dc6e-9bb3-43cc-a551-1dad89e292c0	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	1c311473-44f5-4780-9f97-624329528796	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:42.272462+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
48fbbd04-105d-47cc-a4d8-69e82f3f5da0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4b682468-b9ec-4e04-b379-4490fe942672	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:42.397862+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
e2d93278-8039-43fb-b86b-1b5cac2b14cf	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	066aa740-9228-438c-8345-4e3904416e7c	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:42.422053+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
2fdaf8bf-b765-47ee-b798-a277f36246c8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5f3985cd-8453-4654-bdb0-e237ae222ad1	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:42.509437+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
0a76e856-4cd4-4758-abff-8de043e69ace	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	e69c3436-4ff6-47ce-938f-7bc23b55e371	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:42.531641+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
ac7f3eae-6148-4e87-90d7-8d4ff5a8bbea	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bf4c0e28-ef90-467d-9ec6-211996afc049	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:44.035554+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
7ac5fee2-b01a-4088-aa64-de51bda0fd65	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9aa340d5-ae5f-48a7-87a4-1844db5cad83	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:44.093355+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
b87eb90d-88d5-4f5c-a397-604181dcb98a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a74e485b-e9ce-47f6-bab0-b3e859d3fd4c	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:44.143942+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
26af4e18-ec0a-4d2d-a3e2-c9498d9e5884	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0bc6e481-2345-493f-8c1f-3efb506a0011	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:44.170713+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
2b28ef89-f333-4e8a-be9f-1c883c0de1c1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4a2804bf-78aa-48e4-be48-396fdd1e016b	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:44.228192+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
33c3392a-55fc-44bd-b33a-b8d989666901	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8dc73c6f-b074-4513-9a14-a73175757ab6	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:44.253159+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
f1b8a4b4-a6a7-449d-8e49-279278e84665	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	aa428974-a626-4806-bec6-4d40cca27969	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:46.218263+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 400000, "total_credit": 400000}	0
0dc65ef5-711b-4f08-b712-5da5116ef506	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a4718f30-5593-4a78-a60e-e52975e03ef9	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:46.278269+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 200000, "total_credit": 200000}	0
e0e7f378-b6c8-42c0-a587-cb05694f85f9	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	8d283ed4-d4d0-41b9-867c-3c65aaa3d15b	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:46.368889+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1000000, "total_credit": 1000000}	0
c2717be5-0e46-456a-81a7-1b03101c5d15	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	e0db92db-0e40-41ad-ab5b-4a234a99f2a2	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:46.390096+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 600000, "total_credit": 600000}	0
09a62a30-e0fc-4aa5-bc37-3576e43ccec6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	aff431cf-a576-46f2-85e6-f3afdff5d6bd	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:46.973558+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
08d62c31-9f75-4e5a-83e9-5f0c4e092a4b	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	6e8613f7-57d9-4c7d-ac51-afaf054ad7da	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:47.030783+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
3af84f16-f56b-4cf3-9cc0-a99f28ebe39f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2f2274bb-55a1-48b0-92cc-9552fb7af036	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:47.104098+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
9e47270a-192b-479d-9813-576bb5d17eb0	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	5c661377-9b9c-4460-9b45-c219908e52d5	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:47.12857+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
96a9f306-3069-4f14-be37-7673a0f45470	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	65ba7f9e-a1f5-4ee8-8cd5-1a6436979472	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:48.386595+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 500000, "total_credit": 500000}	0
abba3580-724e-4f2e-bb59-abd485999ec5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c0a1dadd-15e9-4f08-82ac-123086ac96ea	00000000-0000-0000-0000-000000000000	2026-03-26 16:50:48.442236+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 300000, "total_credit": 300000}	0
fc0d1e47-011c-4bf5-8641-a16eb541d949	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4eee2cd8-0045-4df7-a010-35493575c9e3	00000000-0000-0000-0000-000000000000	2026-03-26 17:04:07.943327+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 360, "total_credit": 360}	0
e642bb6c-006d-4226-a9d7-57adc6b851d7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c8af6a77-a428-4586-8457-d3433c0fc293	00000000-0000-0000-0000-000000000000	2026-03-26 17:04:08.452975+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 90, "total_credit": 90}	0
f6a5d04a-d5a5-4b10-bf11-5e80f778338a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0f1bd53a-1ca2-4900-95a1-5f469dc22cac	00000000-0000-0000-0000-000000000000	2026-03-26 17:04:08.564056+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 105, "total_credit": 105}	0
69a59352-a203-4765-993a-126c489615ff	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7c50a68d-7e3a-43ac-82da-75b5d9f615ba	00000000-0000-0000-0000-000000000000	2026-03-26 17:04:08.682073+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 60, "total_credit": 60}	0
b85caa0e-41bd-49e2-a681-c6abd5c9dba4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	584c6d8e-3886-4081-807a-1d906bbbb14e	00000000-0000-0000-0000-000000000000	2026-03-26 17:04:08.831144+00	{"entry_type": "ADJUSTMENT", "line_count": 2, "total_debit": 500, "total_credit": 500}	0
082c4679-1394-459a-a0d3-398b73befe54	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	aa0147e4-77d4-4c24-8313-fa809db37f4f	00000000-0000-0000-0000-000000000000	2026-03-26 17:04:08.900088+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 500, "total_credit": 500}	0
c32e7c43-54c6-4577-88c1-46b852741d19	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9086034f-2cb4-490d-85e1-7969f00d136e	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:01.440967+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 360, "total_credit": 360}	0
913d2c70-e35d-4ef6-b3d9-285b2cd394a5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4ae3894c-c29f-4d4e-bf28-384389427404	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:01.570568+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 90, "total_credit": 90}	0
9ee0839c-6e0a-4ad9-a5c0-0cd17afe5ce3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	36fd0dbd-ecb4-4950-beaf-aa04225a4a61	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:01.643221+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 105, "total_credit": 105}	0
4634a962-da92-45a3-bd60-2c08c32ef3c2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	47a4d1fc-0435-40fb-a571-bd47c4f13c34	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:01.722445+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 60, "total_credit": 60}	0
d4c5a069-c66d-449b-8e00-2909c530490a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	27d2e22c-7c7c-4cef-bb94-bbf33fd4fa88	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:01.789023+00	{"entry_type": "ADJUSTMENT", "line_count": 2, "total_debit": 500, "total_credit": 500}	0
56c240d0-94a6-4a81-89a0-f5c6936f728a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	969b4e70-f9fd-4bec-9925-16db36649500	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:01.840617+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 500, "total_credit": 500}	0
2c3fdf79-4e0c-41e3-b6ca-3b936043cb17	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f4882b7b-4e1c-46d4-91b4-7edf7cd05ba7	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:02.487767+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
5d1e7c7a-3c8e-4d66-bde1-af763b9b16b4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c4c28cf9-afdf-428a-9288-7b3dc4d4d1e7	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:02.566689+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.96, "total_credit": 3301.96}	0
998c032d-dd2b-4b6a-997a-b211a6f0a3d3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	77c06203-0b99-4473-82a2-63a996da309b	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:02.608422+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
bc131a5a-21b4-45f7-9dbc-08d5b2c487d2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	44e196e8-cdec-406f-8fe9-abed4cbd6eab	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:02.651749+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
cef12775-35e8-481c-9b90-6d607adc4e90	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2bc5f09f-44a2-4436-ba6f-8f3acebf1ec7	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:02.692906+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
72230760-16e3-4f49-b49a-24276b74b046	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bdfa1f4d-cc34-4691-adac-0025d9a037b7	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:05.872345+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 75000, "total_credit": 75000}	0
c390e89b-553c-4259-9886-2071489385ae	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f08121e1-f2ea-435a-8d33-1dd1393559bc	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:05.983729+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
c94c2fd4-f870-4d81-8599-f29110dfafa4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	45e291fb-210b-4841-a6da-73be1ee82426	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:06.045828+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 21000, "total_credit": 21000}	0
02f5ffb1-4471-4f7c-bccc-55624483ec04	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d125c67f-1e9c-4600-84d0-3d48dca56cb5	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:06.108938+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 24000, "total_credit": 24000}	0
8cd1acce-f9a1-4aaf-8069-9749fa86b0cd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f7cb1fec-c5cd-40cf-9db1-5dfc35ebfbae	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:06.256434+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 152000, "total_credit": 152000}	0
95869da8-fe5c-4f5c-899e-d8675a6865f6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	62221b95-b873-4487-b9d8-22d07debf585	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:07.053666+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
ac8ee3e8-4c30-45f2-89f3-619072eed8f4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	31bfe026-581e-4231-90c0-73fa77c7ea13	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:07.126869+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
70822153-e0ab-4d97-abc7-552361c2d72e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b1dea6da-b15f-4de9-8b6d-e6acb71cff7a	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:07.286886+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
25512317-4d68-41dc-950e-160b3a44949c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bd98916d-1492-4ac6-be12-b9ac3197268d	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:07.331566+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
ee3597f4-e5fd-40e9-a917-dab0ddd210f5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ef1ac9e6-4802-4c26-bdd8-c5a1597f269c	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:07.419111+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
f870d967-6650-4179-b082-819bf285187c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	00e4d6ed-a2e3-4307-8056-e7db220bf72e	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:07.451874+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
a017cbbb-1b8d-4a04-8e6e-7029914846df	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fd560695-a526-4226-aad0-27072e1d0215	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:07.575128+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
b61b56a8-a295-4744-88d3-0118dc75d181	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b541e727-2359-443b-b78f-f01d37f11d27	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:07.660074+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
eeaab71a-9738-4844-81bc-d7d9b4c997fd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c706dad9-f08c-461b-9525-b677d38c2070	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:08.404561+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
9d8d7dfa-71e0-4eb6-bac8-d8080c765c28	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7df8ea72-91a2-4303-a5eb-53496fbd298f	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:08.518231+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
012845ee-158a-4832-9ae2-da5197aae821	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3a5b953c-6e27-4df4-9c67-81a814d3af8d	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:08.568307+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
33a7e731-da05-4d7f-878d-a56a99304cdb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9805358b-1784-4896-a2ca-25eb8d4d85ee	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:08.626144+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
64733a87-bfa4-45bc-8c2a-d94edf7a40e8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	de7ae945-7534-4567-b7f5-bdaafb49091b	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:08.671745+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
21150772-e522-4066-a3f4-d0ed994ab11c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	085b3269-b1da-4ba4-993e-5f9950b7bb9f	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:08.714228+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
272ddb50-06a6-4fc8-b28a-ae62d2d8e31c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5c8f303f-a7d1-483b-8633-2c1189bb34fe	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:10.342145+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
7cfe51db-aea1-41f4-af85-b4fe8855c32c	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	42d8a4a9-b732-44bd-a754-a6468dcb6fd2	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:10.403412+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
a4f20e6b-1293-45c3-bde4-cd03b240ecda	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b5e6d82f-52e7-4d2c-beac-c199d1591823	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:10.456742+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
2617af97-72fe-4b5b-8321-dfecffea7eea	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	40da1337-a231-4cc5-b565-0e0e4d16012f	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:10.483676+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
f2e7f02d-8a77-4acc-a704-50f560b8abe1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	83285368-fed3-41ab-ad4a-a57ae987e4b5	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:10.543771+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
fa130aaa-aff6-4b79-a783-b9ee2f1b4f3d	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	d5afac9b-6fce-435e-a752-2091a340c717	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:10.571861+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
00b33906-c129-48c5-8887-55fedc1800f6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	51c74afc-f468-427e-84f4-5ac94257e46d	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:11.8403+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
26ec210d-7af2-4dad-9c79-9acd16ebe6cb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ffe20791-92ef-4bbc-88cd-5b8adf9a80d7	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:11.898783+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
2c951ae3-ec50-4f00-a17a-c04e2a4e0fae	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a5728910-08e4-46bb-add9-b33731b4036f	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:11.942829+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
65410f6e-f13a-4199-999d-bbe32165f804	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5c35b7d8-5506-4e39-8e33-1fa85a3e3a22	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:11.971914+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
16c85713-f1f7-4522-99a6-a3c10d778d73	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	800f718d-051e-441c-b63e-19fb6ab0927e	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:12.022059+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
c0851b37-b2e3-456c-8a48-da40f1acaf03	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	511c367a-6319-4b09-aa29-7e0e42d4d906	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:12.047718+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
0a2e003f-aa47-4d09-8ed5-83563e1c692f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	594e19f6-64f3-4e25-bb70-34361e6cc6b5	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:13.309499+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 400000, "total_credit": 400000}	0
90ca9977-23d7-43c7-9e25-ba4dcb427770	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	786ff4fa-16be-4b61-8d0d-ea9ec9d41635	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:13.367086+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 200000, "total_credit": 200000}	0
496faf3b-cb58-47f9-a410-eabc317e60b3	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	1b961ebb-c778-45d4-8d84-8404bf7542c5	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:13.448649+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1000000, "total_credit": 1000000}	0
3a6c7dea-345a-479d-b145-55c91640a488	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	a4c845ec-fc05-4eca-8988-0e1258f54800	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:13.472246+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 600000, "total_credit": 600000}	0
6b2f538b-055b-4758-9b41-7dae40adee5e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5fb42057-a3cc-4da8-a830-6c451541a7dd	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:13.99201+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
a12141f4-b9fa-41dd-9ac3-f2a288346a71	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	2ee510dc-4548-4bf9-ae41-23af427d5963	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:14.045202+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
d43476f4-5b7a-4014-864f-f56c539448f3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4b99e21f-9665-48c9-b174-ca15950ea314	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:14.115119+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
902553c0-0f5c-48f0-83a6-1316607e3f96	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	85a8b88b-2ee5-4d08-8b6e-0c28696b4c36	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:14.138951+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
b0fc07b1-46fb-4d1b-a31b-d1b44168684f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9ba79a25-8392-48c6-8c8c-fcd5fb17dc4e	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:14.631241+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
7a65b6aa-c403-46e0-8833-a56dc6dafde8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	be6b4ea6-7c61-48cf-a9f8-e4bdf1eff4e2	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:14.683641+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
dd42e4a9-0351-4752-bbba-381548efca0b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8f0723ad-7d38-4273-9c4c-41c12506e966	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:14.738458+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
e8392d7a-dd2d-4ce0-b55c-9876a4b3b532	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	81ac58e6-7caf-4ded-b66e-10beff123c9d	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:15.947646+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 500000, "total_credit": 500000}	0
de411603-b4d6-46ab-af9c-18736f3cbc9c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6e02f7fb-a681-4654-a590-b26ba6775aac	00000000-0000-0000-0000-000000000000	2026-03-26 17:07:16.010013+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 300000, "total_credit": 300000}	0
f40699a2-c031-4dd0-ab00-3cbf15adee8b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	da21dc91-79fa-46ca-a492-be783c23e6e5	00000000-0000-0000-0000-000000000000	2026-03-26 17:13:52.194048+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
069ff0e1-3287-4dff-866e-c309273f3dc8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5a3c62ab-6460-4775-a9a6-155bb45c750a	00000000-0000-0000-0000-000000000000	2026-03-26 17:13:52.344587+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
aca9bb0d-641c-4776-9d4f-0a2d2d612a23	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a54c9cd0-b64c-4768-b169-1d869db2da52	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:17.060281+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
5dd3ee7d-2856-4aaa-87a2-130384d9e1d3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bca83c88-304c-4f6b-ba5b-c9c7b78b8fb2	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:17.122167+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
de8dde4e-01db-4b4e-876f-79c93d078527	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bc343890-ec93-4105-97dd-74feb94dced2	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:17.735499+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
c6f68513-4455-4caa-aeea-687030226d0c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	53d896f7-e144-4bd8-882c-254b42f743e3	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:17.800772+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
9c685565-02fb-4fd4-975d-ff74f5e178ef	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fc99aefa-3bb7-4075-a729-eb8ab39f2843	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:17.938131+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
243bf480-6b6f-4e9a-b185-22c07fabd1e7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1dab8c74-87b8-4816-af3e-6cff83359cf2	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:17.974176+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
d263b4b2-d55c-4fe0-9c30-7932570f0825	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	45bb9115-5873-41d6-ab92-593d0ff7be90	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:18.055713+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
011adc29-4d25-4b43-8efc-0f2b259366e2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	64a18367-9aa7-4a9f-b87c-ea5ae151923d	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:18.092645+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
db5a211b-e215-44d3-a4cc-16f600e62840	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1c231292-5c7c-4cc1-86cd-2e4ef952a02d	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:18.204131+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
5a287391-c276-48ad-a478-3c608dbd7ed1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	75e5921c-86e6-4a23-8c4a-cbdd4d9b65d4	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:18.286789+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
79ddb946-e45e-4a26-88f6-9981869cbefb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d9db57b6-be16-4169-bf92-3b41a1689a5b	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:18.986891+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 75000, "total_credit": 75000}	0
0b4a41a3-4085-47d9-8a1e-23cd34e92ff2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b5396fbc-9211-436b-9a66-95557610f94e	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:19.092278+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
7a6a6c15-ba7a-4cca-8e18-011e3a8c7f44	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4798b734-afa3-4b06-8f1c-f068b82b2d35	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:19.13373+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 21000, "total_credit": 21000}	0
cbdf4d71-2630-4932-925d-8c9bf201b9b1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e8bbe882-7213-4ea0-9e5a-f2529beb33fd	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:19.17205+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 24000, "total_credit": 24000}	0
f8968984-d6bd-4546-bd0c-28e52e09f5af	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	aa215b79-18e6-4e9e-9561-02b4a3b76469	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:19.27388+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 152000, "total_credit": 152000}	0
7e7945c6-9fa8-4954-97be-d2b8ccf6370e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	99880ecc-34c2-48f8-87fe-16850ad6739e	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:19.975276+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
4618a62c-c134-4ead-bd05-bb729fb08c8a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3645f1ab-7b3e-4938-a2b5-173406dd63af	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:20.061328+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
5312aa07-c809-4afa-a227-f8d334ba344a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4e2eb73d-6913-4c60-bcbd-43fda8fe425d	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:20.098679+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
2a7ea984-bcfb-48e9-bc6d-c5efdccacae2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b64be108-567c-41f1-87fb-c709febcbadb	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:20.142847+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
7c6f92b1-19e3-421e-96d9-65006ea67e10	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	afefc4f5-2a73-44e0-94a7-79169117d1ce	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:20.178972+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
11e4d420-5dc4-4dcb-9693-fec94c437bb7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a9ef4713-b3de-48eb-ace6-c92ea447c102	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:20.220125+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
a3d59231-df3f-41c8-8ebd-b95b5e6c0815	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7c944c78-4f65-4211-8532-5a0c426a8f32	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:20.870978+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 360, "total_credit": 360}	0
1d5257ec-06c0-400b-84cb-f6268f564a6a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	baaa918e-6419-4cb4-99a4-42fbd005d401	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:20.980767+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 90, "total_credit": 90}	0
19719ac4-245b-482d-b2a3-70f8de2ce5ec	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	35308c77-a887-45ea-b467-6fd22d06046b	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:21.061906+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 105, "total_credit": 105}	0
b69f00cf-4c44-422f-8a85-2ac64587c152	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c945f43d-f45e-4614-bd67-a1da6795deaf	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:21.140701+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 60, "total_credit": 60}	0
1456360c-e5a6-4e0c-9ea4-592319268058	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c2637774-f063-4dd4-b522-7c06c3be71ab	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:21.206566+00	{"entry_type": "ADJUSTMENT", "line_count": 2, "total_debit": 500, "total_credit": 500}	0
384e75b9-e2d0-4505-8e9e-42b239cf2d0f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ffbc4679-d541-42c1-9aab-94bc14372429	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:21.261603+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 500, "total_credit": 500}	0
2cfce349-d708-4386-861d-67ce734db90f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f8217f20-4dca-4073-97ff-be5fe1df7d11	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:22.684194+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
80b50fa3-abc4-460e-baae-620cfbcd6d09	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	722670b2-e10f-4933-b1a5-fa5466ad6a11	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:22.767993+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.96, "total_credit": 3301.96}	0
03713caf-3442-4a1b-9ae5-b2034bfba054	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a29e5ea0-d63e-424e-bd76-06c320d2a67d	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:22.81458+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
35f67f07-a00d-47d1-87cc-eb311777387d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f3df9274-0b3f-40d6-a810-07e18621f98a	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:22.861335+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
89d55353-e864-4ada-bd9c-e1dc86d14284	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	78d23b90-d7cf-4034-b58c-9fc252f6ca5c	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:22.912331+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
96025120-7a5a-4c88-9917-368a4678ab0d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	13cd3e67-f977-4c1d-b75d-95e696c00113	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:23.514248+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 500000, "total_credit": 500000}	0
b1151d00-606d-4b17-959c-a153e55c6666	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ab139301-837c-4960-8a0b-4fd7af988190	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:23.569287+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 300000, "total_credit": 300000}	0
fcabbdaa-ba46-4f0a-be4e-c2e0a0e6cc75	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	64be7cfd-3a96-4458-836c-06f64087e416	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:24.316239+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
a8a60550-2d12-46da-923f-99cce5e17005	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	56e452be-c61b-4d76-823b-8dae7d320868	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:24.366013+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
543d7cc6-9ec9-4e34-b063-6213742ffe03	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bf9c081c-521f-494b-9c18-d062fecc7246	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:24.410761+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
8ce5e449-0a36-49fb-88ca-24e5318f5059	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	dba9b9ac-1a76-4c49-849f-d5aaf53aae53	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:24.433811+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
326e5be2-31ad-412d-9399-295a147667ec	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ba1fa6e0-834b-4a47-8eae-df992aea89b3	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:24.480901+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
5be9adc8-bd4f-474a-bf12-448677b17f1d	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	12b0228a-ac11-47c5-8586-8a4538f79742	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:24.505299+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
37ae6c59-3be4-464d-8d68-da954113aa5a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e271f1a6-3e91-49e3-9572-333e3448c753	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:25.050655+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
17ee69ad-34e7-4ba9-99db-5d3bb1c2d986	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a1cc75c3-cf25-470d-8f2d-e4e34f2a4773	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:25.105784+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
9d60fafe-be6d-41aa-807f-2f5b2b661c7a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bd5fa04f-cd82-4261-9e42-9bdeca5c3abb	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:25.151826+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
60095b9a-5bff-4b27-b374-8c3a06661857	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ab6c26ba-e2d1-4ab8-9e94-f55d07555cea	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:25.183922+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
69067ffe-d85f-4043-9ea5-3cfb35fd8409	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	83fef88f-ab8b-475a-bdee-e83c698dc3be	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:25.238103+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
6d12abdb-a7be-4817-b72c-421633cdd9ce	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2586408d-9f26-4371-b31b-49322aabd8d0	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:25.263286+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
a47ec9a9-c1e5-4965-af11-3c26c4b416fa	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f4a38bc1-2953-4c1a-b49d-1d47ac42ffc6	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:26.316015+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 400000, "total_credit": 400000}	0
9466b51a-7a5c-422b-b12c-22630cf955d2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bd5e14b0-1eab-4e0b-86f9-27ffe7dbd388	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:26.373023+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 200000, "total_credit": 200000}	0
66860fc1-c3e9-4510-979a-23d039220793	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	e077c479-bd1a-4374-a99a-33a4b53729ba	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:26.437227+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1000000, "total_credit": 1000000}	0
f0dcb6f3-908b-4007-a0e5-4186bfc92c98	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	31025224-5946-4521-83ec-f0e8662be705	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:26.460899+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 600000, "total_credit": 600000}	0
8062819f-1444-4981-82be-acfa9e1e52fb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2b0a4e2b-ef1a-40b7-a102-2925577415d4	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:27.57261+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
1209a1cc-f0bf-49b2-8852-5e1fcf052df2	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	aef1f61e-03b3-41ba-a0d7-4b63c5856b8b	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:27.622187+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
9aad08f4-bcf4-4ed5-97d8-a87339466b1c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	54cdb3d0-9c9b-40cd-bf1c-802199d26c65	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:27.800225+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
ec0afb26-fbb4-483f-bf37-938e1f6095c9	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	5cc04a2a-9d12-4c7f-84c4-ac4ffe19786a	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:27.820506+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
f2f799ff-1abd-4b47-99af-aaa42439ebc0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	408bcfeb-5de0-4eb7-bce5-26f859d7bccd	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:28.338461+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
ed40bb30-e952-4e01-b7ff-f66a30cf8204	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2c30e495-d5eb-4e27-84b0-e86f968d5c98	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:28.39298+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
ec9360e8-d88e-479c-b12d-f8cb0142e163	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e07cf91a-9bb2-46a3-b1a4-5ffbb1254408	00000000-0000-0000-0000-000000000000	2026-03-26 17:14:28.444133+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
92fa31c4-eedc-4217-bf1f-48306f44f065	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a5e8046d-8e30-421e-b041-e648e3c9e317	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:36.120535+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
2864772f-661d-4acc-8cae-3ab12e5db924	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f2e4e981-3ab5-4d74-9fa7-512e9b9816de	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:36.192933+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
cf30fed8-1865-4b3f-a9b0-73e0023eb571	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	dc4a8f7f-9b90-4a76-80a0-b7b7b1b5111b	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:36.344165+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
e7f06c25-76f9-4bdc-af49-c35f73cad63d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	27aab709-6ac3-4a46-895e-558737e699fd	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:36.370202+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
2bdd507a-4c76-4fe3-aed6-4dea136696d2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	90df8c2a-8352-4d62-babe-d20bc5c07689	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:36.444194+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
ff1eae69-087c-429f-998e-425611e71de7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9bd95f25-8f4d-4cd0-9c1d-6436671f24fa	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:36.469661+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
dbdcc769-05ec-46d9-bb36-2d71693c3a15	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d9eae16f-fdb5-4334-a833-ba43a6fa5cc4	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:36.583922+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
131e653c-5785-48c5-bce7-1e7d3b545d82	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	53dd6ed1-ecb1-4459-926a-fb670af29610	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:36.66053+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
75ddb8d1-f9ec-4986-80c2-4c1d6a5f4703	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ee8a4acc-9752-4622-b77c-83283778a3fa	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:37.33576+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 75000, "total_credit": 75000}	0
031eea2d-d850-4940-bfcd-6bac63f7fda4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8f7210b9-d004-4201-ae03-07129f0a83be	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:37.436745+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
df908995-86cd-4b53-8dda-fe8e8817a926	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	690b0aae-9a64-45b8-ab99-69f5508e68a7	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:37.470092+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 21000, "total_credit": 21000}	0
3fc60726-b8c0-4bff-8983-bddfbf8d3182	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1ff5eb1e-52d5-416f-ae6d-dd51598b9f51	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:37.508703+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 24000, "total_credit": 24000}	0
5cb9378f-a76c-4bee-89b6-7b2a5ee476ce	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	29fcfa4c-5961-4df9-b36e-3ded51250dd9	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:37.602384+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 152000, "total_credit": 152000}	0
d85f6d32-3e60-4228-b181-5da0517982a1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	76afe384-3d42-4bf6-b96d-5e091c197d19	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:38.507552+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
a5e4b830-2491-4283-bb3c-8fab6a637cef	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b73a8ede-33e6-480a-b5b5-e9acba2ccc67	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:38.602504+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
6f661c0d-39ee-4e84-9fef-7ea08d5108e9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fc1ccb52-3f62-4541-b3a7-5b23807f1c08	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:38.640813+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
99e2422b-af8a-4033-a225-9c84cd7a0ea3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b6e88849-7ad6-472d-8909-ec76cead3e59	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:38.683847+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
15e5a344-e9d4-49c6-a82b-8d3137963bd6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	64ae1601-d7c5-446e-94b9-b1fe16d43c3e	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:38.724706+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
1eb02a04-e24b-4719-9de4-553a7cf9c835	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	84b12fd5-1ee7-4e58-af96-12dc2ac5641c	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:38.774915+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
4b7d1097-b7ff-43db-b090-f55d6741bd71	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0a097b6a-ef61-4175-b96d-c04443a42b05	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:39.446217+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 360, "total_credit": 360}	0
39537fc4-ad7a-41f9-86d4-c74d7210a26f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3699f38a-eb16-4e4d-a703-76932f725562	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:39.530395+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 90, "total_credit": 90}	0
88b93e7c-237c-4ac1-90d2-184a2b4da61f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	be6ba6a3-5359-416e-9807-6f037d506002	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:39.600819+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 105, "total_credit": 105}	0
e9454276-5477-42df-9a34-02e0cc6b9590	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8758370e-0d84-42c1-88c6-1d0abc0877de	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:39.663478+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 60, "total_credit": 60}	0
b01d59eb-619b-451a-8e98-4a141d34812f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	891957db-926e-4bd5-a111-96f9838b93d2	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:39.7245+00	{"entry_type": "ADJUSTMENT", "line_count": 2, "total_debit": 500, "total_credit": 500}	0
c02623fd-878e-423b-aa45-5dd59c6dcf6d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5b257732-3213-4f42-a83c-4206207f3e0e	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:39.778385+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 500, "total_credit": 500}	0
b5ab156c-df95-4c25-832b-47e288dc55e9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	49a64894-6fcd-46a0-97fa-cc4547d238c1	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:40.335607+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
a899ff9c-9088-41ab-8283-4c7f1d1b39d4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8950e94b-b2ab-49e0-8af0-296b7397d77f	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:40.415335+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.96, "total_credit": 3301.96}	0
7483102d-32f3-4357-b592-b32e40b64395	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bbcedfbb-fa0d-43a0-b59c-b0c57df65b45	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:40.453836+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
ad4352a8-3534-4e2b-b1a5-b4f8c9b5a77a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2acf1228-19ce-41d2-9a82-d0fb00c00c67	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:40.490744+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
2d1706dc-c867-4dad-89fc-cc01a894ea47	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	325149f6-6d99-422e-bfe0-54491fc52a0d	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:40.532471+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
6ed421bf-981b-4577-93f7-fdfe99b6b96d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	15500b78-3d7e-4e10-9b94-18dde9267cea	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:42.016357+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
53e2d48f-b271-4f88-9e78-ace5e7184538	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	a7c4e83f-b6d3-4693-8c16-07781e1e0e6c	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:42.069008+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
6c190575-12b3-43b9-b7ac-8fc443bdfdc1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9153b318-1760-40be-a7b3-07710c90db23	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:42.14193+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
f7fd1234-9261-4e58-9321-8c7e50591e71	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	92d14907-45db-4f4b-a1dc-d9aa2e910f35	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:42.166532+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
960f7f48-3dd8-4c7a-af92-736a99440fab	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1333eace-640f-41f1-a917-020cd31e7f79	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:42.799286+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
608fd27d-f021-420e-aae0-3e852ff3c689	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	99e65c97-f119-46ea-96cd-1701045311a0	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:42.855075+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
643dc6a4-ecd2-49b8-ba52-04d32f74b989	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	67750e25-76ef-4fe4-9e33-77cf8f54039b	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:42.900889+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
d956d868-8fbc-486d-8f10-9e2ef8ca6416	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3eded74e-3f9e-487f-93bb-0964f08af221	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:42.926276+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
b89eef38-c09e-4a45-841d-ce083b11900d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	695e9587-6047-470d-b0e4-ef362a57479b	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:42.981992+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
17a273a3-d848-40c3-8eec-a372fdf48744	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	75b9cae1-b62e-4d0c-a68f-d3c3970091a1	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:43.004655+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
e57f39ca-cd61-4f06-b37a-de99b5a4fa64	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ab723e7a-433f-46d7-a24f-661cb1b7b7cb	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:43.745018+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
601b33e5-5534-4aff-bbd2-4351a000463c	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	9b3ecd88-7575-4349-8ed4-9fa95f78595b	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:43.811443+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
2982ef22-e08b-4f62-8934-b6403ee4d979	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5e0240eb-65e5-4a67-a6e6-28445b184194	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:43.959487+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
9ad212d2-008d-4682-8914-a67befe6d662	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	8456dad1-9542-40b1-9180-a280276c1b35	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:43.988587+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
7936d842-64ac-4491-b010-9792aa943f2c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ade0f20b-025f-4937-94c0-0d8e9aaefac4	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:44.098784+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
e1d6ae1b-2b1d-4f35-b755-3e96b44866ee	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	36347bfc-bd58-4a64-9961-d5f5b26137df	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:44.123704+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
2fb61a68-a63a-46f0-bf39-8123dbd6ec73	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e186ef3e-807d-46c0-8007-2391281a8a21	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:46.313764+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 500000, "total_credit": 500000}	0
6b474c32-ef83-41d2-b449-675ecbdf8fdc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3dff1400-37ea-4120-8694-531994289ad1	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:46.369766+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 300000, "total_credit": 300000}	0
52eb9cfd-a6ba-4327-8eca-a43b832f7cb0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	01ec86c8-88de-46a3-97ae-8ac62cd190e7	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:46.950051+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
3ee58ca2-22d0-4b29-aa0f-000fd8637d52	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	75d53891-23a6-43b1-8b52-a5677aff28b0	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:47.005374+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
739f28d4-e4f7-454a-b89a-4067a135ae2e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	07bf2d47-1afa-45e7-917a-d03351f26e86	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:47.051555+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
c801b8f1-54f5-4683-8fa2-8dc955ca0b5d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5a4745d5-ab14-44f7-b566-2520a3bf3757	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:47.594988+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 400000, "total_credit": 400000}	0
946e04af-34b1-4c36-90ef-6f23028912a3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7bd3fce6-326b-44e6-8a2a-07df6f55b80a	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:47.647008+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 200000, "total_credit": 200000}	0
4805c584-4054-4e24-8dce-a42c886062b8	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	57150620-c133-4fc6-9cde-868f89bcd8a1	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:47.74334+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1000000, "total_credit": 1000000}	0
6c48792c-5761-4502-9f55-3a89ad3b4016	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	f8accfa3-48a9-4876-a3ab-8f4fa33425c3	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:47.763724+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 600000, "total_credit": 600000}	0
e769122d-a5e6-4a29-8179-83dce2e49841	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3aa912f7-bd41-4bef-a5bb-459d620d21ba	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:49.015294+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
fb1a14f2-31cc-4ebe-b689-d83079939b44	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f626d460-b0d9-4c1c-876a-ce83a4958d6f	00000000-0000-0000-0000-000000000000	2026-03-26 17:19:49.072596+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
f6c3d234-77f5-4002-8ae7-49a9c26e8a25	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4b62331a-b792-4c7d-97a7-8eaabda66e47	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:37.603765+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
ff9075e0-eeb1-4e0a-a7d4-d13b93768ec1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6f4bb99c-5881-4eae-a8a5-917d09b91fa1	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:37.834658+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
f571cbe4-6e8f-45d4-9071-74077f8112bd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7d85416f-2f3d-4f06-9577-de09f883859c	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:37.984322+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
14ee1973-d925-483e-88c0-0d0721811084	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	85d21067-3df3-4b06-8f3b-d635d39acfb8	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:38.024772+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
af7ed2ed-2a65-40ec-9dc2-6a22e1fd38c1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7fc374cf-789b-4de6-a97a-780e0d576788	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:38.111224+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
2cf0d8f4-4aa8-48b1-8a0f-3b38e5674868	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	89771e38-dabf-446b-8236-f8c604d3e896	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:38.20513+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
e639c794-0afa-4545-9b6b-7a6bc1bc9836	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8b9384b2-9677-4c37-a4f7-cbb3245934cb	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:38.351594+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
75b3203f-cbf2-4777-8264-f6400b2ed2fb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	08e0b288-2f14-4d47-99ab-3d2011c1f5e8	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:38.441826+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
7f1e7217-4571-43f1-8e4b-54cb398fcccd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1500250b-6165-488e-8000-4445ad8603c7	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:39.157506+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
f2c68c23-8232-444b-be75-206d5db1c78b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a49c84c2-108e-41a2-ad5c-ab7e22b33560	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:39.238012+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
ae403b61-8114-4c81-8217-b4c3d466358e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e31f7392-6052-4a2e-badd-89b8024e86d2	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:39.273076+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
43662d02-f882-435b-97af-5c2c6e24abf1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9a291743-f73b-4f88-88b1-10baf9308476	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:39.311345+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
547938b8-e209-4858-bcf7-f93bdbe5bfb8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b35bbc3f-b9e2-4f6a-9433-bdd6aef303d1	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:39.347747+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
eadf14d9-a2ac-4ebf-baaa-2df3ee1d2b7e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	129d884d-7dab-4db6-91af-02e157a118a7	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:39.382618+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
ffc0234f-b8f2-4191-a1c6-4353c17e8870	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d6d76764-2668-49e2-bfa6-f1767b7986eb	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:40.037759+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
68e4ab3a-0833-4a3b-b4e5-1cdfb356011c	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	811e00df-4b28-45c4-ba15-c4b2fee2218b	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:40.095663+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
14b48a74-845e-413c-9453-5610088a8629	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	768b5579-9cf9-4faf-ac17-0e0f21776777	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:40.428965+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
4654855b-f3cc-4557-8f4c-afc497255dab	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	da8b2613-1e6b-4b26-8224-e14f294e571d	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:40.456991+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
f679b72c-19e2-4f1f-8200-ded65a11cdce	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c560926d-40a5-424b-8584-9c0dca226a1a	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:40.824938+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
9333ef66-e84a-4776-a5f1-a62967fa8cab	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	d3828cde-10b9-4ff5-81c9-26b28dc3817c	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:40.847406+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
3165a611-dd76-485e-9789-7dec8bb188f3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	61afc813-aa26-4187-b8e3-320aa0ce32c3	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:42.836145+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 75000, "total_credit": 75000}	0
51976b56-415b-4cea-b237-59dbaee4d539	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	49b9153f-8f28-4734-9dab-3831bdfb165b	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:42.942734+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
d9c760cd-cdbe-4981-b9c5-107d6e99882a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	77e960fd-98ab-4776-bd2b-62c5d41698bf	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:42.978365+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 21000, "total_credit": 21000}	0
fb8dc503-b4ea-41a5-b75e-695c5ab54e5c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5e445c8a-9565-4ea9-8dbb-e7f31b780f41	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:43.01546+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 24000, "total_credit": 24000}	0
ecebef1c-5062-4376-943b-4a8894ff8d75	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1b2d328f-5d7c-41a2-99bd-f7fef290c6dd	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:43.118577+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 152000, "total_credit": 152000}	0
cae91ee4-6405-410b-a22c-d20ab6c1c30d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bd2e351a-2698-4b37-a387-cebb6aef70a0	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:43.725809+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 360, "total_credit": 360}	0
f2a9d266-2605-4348-a733-6db62632852e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f89fbb07-f935-451b-b194-514181d5d283	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:43.824232+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 90, "total_credit": 90}	0
322835a7-abcb-4597-a2bb-be7ebdf7cfb3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	85dca3c8-14a9-4163-9538-4f3aea7d462e	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:43.891455+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 105, "total_credit": 105}	0
6d88a44a-d0b3-477e-968c-5eaf87da08b9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b94f0302-f32a-489c-a419-c73d98ec15cc	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:43.963478+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 60, "total_credit": 60}	0
cd5a2578-711c-426a-b187-d96fd7cadefb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7a7472c9-2cd3-4f15-a7ab-9b9540c4acf4	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:44.023521+00	{"entry_type": "ADJUSTMENT", "line_count": 2, "total_debit": 500, "total_credit": 500}	0
3c996a11-ed0c-4954-937c-2a124123c7e8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	627da548-0c14-4600-8188-49ccb2417432	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:44.088136+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 500, "total_credit": 500}	0
46a1dae0-dc56-492f-99f5-93bbf1ffed28	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	776d2819-5017-4903-b28b-fe88199fa2f3	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:44.787563+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
12376cf8-ade4-412a-8f00-1bd752d785f9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	74f52bcc-44db-406c-b27e-982195f514e2	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:44.886499+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.97, "total_credit": 3301.97}	0
fe946f08-ee83-47c3-bd68-68fdb34a4573	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ce2aaf63-9677-4f21-89be-122a8592c1a1	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:44.929264+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
9d557a87-e915-4bc6-a819-2441b7273de2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9bf59d0e-b6d2-40c2-a226-30c59d8ca48b	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:44.971397+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
ff00bdcb-b3d3-4f43-b43a-6b04cb7d08b3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	46e955ca-0259-4e82-8570-e33975fc23a4	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:45.013224+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
0268432c-47ef-4637-b241-bce32c963720	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9d054e54-f60b-4029-bd79-a1d29595b44c	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:45.761728+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
fb7ddc63-94c3-414e-96fb-c8a50d8beb08	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	095f1662-5249-4faf-86c2-5a5c734dfbe0	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:45.824256+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
a8094c72-05fa-4277-b351-a97d483a83b1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	169fb732-50fd-445c-92ef-26a84c17c639	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:45.893168+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
601c78aa-c183-4017-8f0a-83742bc0e486	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	62c2c071-de85-4f45-b52b-088617d44e9d	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:45.919373+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
894c6787-d671-4eab-aab4-edac72f16d61	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6c90efa4-3f00-4d4f-a0eb-8846c079b870	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:45.975503+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
7b3cd9bc-3a04-4807-9b7d-09c82191eee6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	751b6889-b122-4827-833e-b20768501180	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:46.002123+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
fbd3af8c-d4c2-4ddc-87a4-c8e7651121c0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	77d9f8c7-c368-4200-9518-56467f7d494d	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:46.489162+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
9eef3cce-458c-4331-9468-55b44e3c4084	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	3459c493-4568-4b9e-89c5-91e40cfd7dec	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:46.54119+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
fcb7f87b-89f9-4437-9832-d7f034c65d49	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fdb4ec09-3b1f-4a79-a510-2a84680e2b42	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:46.606545+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
21745302-9a05-4a7a-b83e-67587ae72eea	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	19e59120-5f29-43de-92bf-76ea838fb4e1	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:46.631678+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
ae37b0ce-66e7-4442-981b-f3d940aebacb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	796941a9-955c-49ed-b17c-c4560cfb3901	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:47.765922+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 400000, "total_credit": 400000}	0
0b6a05e8-c4cf-40c3-914c-9195abf35304	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3887e9e1-0218-4c2d-bace-ca165c7ddb09	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:47.819936+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 200000, "total_credit": 200000}	0
13c25f25-e892-4eb7-8dc9-d2f4400b34b9	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	a8c9e84b-337d-4b6a-8681-3523f61eb5bf	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:47.884379+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1000000, "total_credit": 1000000}	0
672258ac-93dd-4e88-8aa5-9f17301e83e2	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	6eae70bb-c83d-44d5-997d-fbdbbe88d9ed	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:47.903327+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 600000, "total_credit": 600000}	0
cb6ce5c4-d88d-4318-ba00-ee1b0ae2867c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a4153c3f-b582-448e-bd08-599ebc677f10	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:48.459089+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 500000, "total_credit": 500000}	0
4743815d-9092-4c3d-989d-a25f2b1b2605	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bacf2daf-56fc-43e4-8e0b-9560a1a1447d	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:48.516802+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 300000, "total_credit": 300000}	0
85888f3a-af63-4750-842b-1f236959c7fc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ad6cc63a-5980-4b9f-a52e-384ddf01c72b	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:49.07092+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
4faab73f-6eaf-4f80-a5c5-feebc10c40fd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5de82e2d-804a-4e10-8539-f5deec2f721d	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:49.130861+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
8056e5f4-20df-4335-9c55-06fd37674f48	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	93397b70-117d-4c22-b57d-3ca120102b88	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:49.22673+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
a4893415-1bff-4adb-9812-7c4f9e739c05	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1073732d-d92f-467d-9b0d-e3f7f44b306b	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:50.036527+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
bf5c2f55-7b4d-4638-b776-350fe4a94737	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	35af7d98-62c1-4b0d-8bbc-d26ded9f40ee	00000000-0000-0000-0000-000000000000	2026-03-26 17:42:50.103309+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
b21be7d6-6f73-4e3f-9bda-dc3527273a3b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2adb15ca-6ff5-46f2-8ff0-65f7a5fc80f0	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:18.938341+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
1235b709-dd0d-43f6-a962-0f990bc2b007	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6ed301eb-599e-46a1-998b-b3b19d617635	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:19.02195+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
a459a37a-460e-4e2b-8eb9-2956d0e02a3d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c74e7704-6724-4b1d-9be1-c8d6d4676986	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:19.159498+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
10f82d3c-9d61-4311-8f44-92fb675584cc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ed8d710e-3ebd-4d11-be37-deec845ef291	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:19.188498+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
eeb1d956-4932-4854-bab3-f3d778f2165f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	29a8b157-0c0f-4049-ad81-a22babe1da34	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:19.275737+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
6db9f239-b1eb-4e3a-9aa1-c35a2e00bf67	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	307690ea-1d9e-4c9e-999c-659871aa14d1	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:19.307144+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
5894ffd3-f0fb-463d-95bb-224ebe110f40	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c6ea18b9-91d3-41b4-8817-d5a8513d16ea	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:19.416504+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
2d5638fa-02d5-45f2-8977-0f97d2612d77	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a560d9f8-94fd-495a-a024-72997a573d7c	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:19.497055+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
97ac9057-5305-434c-aa28-ac26e32aad3a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8a0ec03a-3f4d-4953-bfe6-9990cb35c1b2	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:20.163481+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
62b9b341-383c-4e41-94a6-17a920329c69	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	6bfb0cf3-a952-4d3c-9425-26a9afca15ba	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:20.221589+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
b0881807-8850-41c5-9c52-09218a7cd29a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	66a481f4-e66c-4ccb-a873-dddf7bb35eff	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:20.272965+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
68c7e1e4-68f8-4d96-acea-c91ef19c25a1	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	e3aad07b-cb44-47dd-98a7-8a6fc430ba02	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:20.301652+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
d53c9274-f273-4a23-bad4-78c75563082e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	29ca3568-661b-47ee-8dac-583521936fdd	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:20.354911+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
4d12d6bc-0cc1-48df-9ca9-620b1ba7b2db	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	3f08301f-b037-4e17-b7ac-c68368bdc21a	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:20.379388+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
f0136707-9619-435f-9111-c752a7567df8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ad892d8a-117b-47ef-b787-1576ab2d4d3b	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:22.003514+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 75000, "total_credit": 75000}	0
edbd4796-a9a6-4411-8087-682262af347f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c659698a-ba3b-4c78-837f-242d0d32d763	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:22.168172+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
e8278832-3129-4290-9072-341d35311119	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f1941c89-d98d-4c3f-b443-378ff4a789c0	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:22.230877+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 21000, "total_credit": 21000}	0
c3ab85d3-8e4d-48b3-be66-f6427c8a10fd	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	de5fc87c-1cb8-4661-8454-41932bcd8614	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:22.276903+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 24000, "total_credit": 24000}	0
7e90bb82-b028-422c-b025-c5dc37681a4a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	20bdbcfd-eefc-4958-b7e4-de0f7ff1d643	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:22.407551+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 152000, "total_credit": 152000}	0
989a479c-1a78-441b-8df1-91c824e4ecc0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	239ab9a1-15d3-4780-9b09-bc0ec75e5f67	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:24.206993+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
2b6317d0-7b31-4f29-84b5-61cbc815f152	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	17e01150-ef3e-42af-9828-a56cebf6e694	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:24.294935+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
5912e0e6-daeb-4212-ad02-b10bd61bf868	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	648ef455-381a-4904-9f7a-03e7517f77a8	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:24.33207+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
0e047251-1a7c-48f8-9379-fbcbda550285	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8ab541c5-7e9b-4748-b646-dd41e4c017dd	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:24.371579+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
44cb04c3-552e-4d7b-ac87-6aa3952d76e2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a423696b-2fd6-4fa1-8aec-164823f5973e	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:24.407752+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
75a55d20-49c0-497e-af6a-9c6eddb86b2a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d79c74b9-cca4-4358-ad93-723d1c0eaa92	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:24.446594+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
38ce9238-bd24-484d-b89c-3e2a4261e6d6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2ddb9a5c-9cf1-47d3-b589-05d14d4b5a5a	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:25.063159+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
d5d816b3-e612-44b2-bda3-3a6eb13e6708	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	24bb4c3f-099c-4495-8f4d-e1250ba8c0c1	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:25.122768+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
353e41b0-701b-4760-b433-fe62709397b2	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e44e2ce6-7ec6-46f9-92a7-252a744b2600	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:25.171576+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
39642038-eb89-4ef1-846d-787e36c0467d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	fc13af91-3362-4b4b-950c-a26d7e7e7a55	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:25.199965+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
763ce4dd-9424-44c5-b392-0090d12bb475	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d3def656-3979-4663-bb85-5db7e16b093d	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:25.254641+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
c7780c46-52f2-48ad-bc28-948a15fbd6fb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	dfadbf96-3899-4a6d-af85-dabdcfb4f953	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:25.279256+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
045d37e6-c4bb-47a9-a60b-7889c7b63be7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4415466b-c756-486b-b862-ebfc91426cae	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:25.857557+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
42040abc-481b-42eb-b4ab-cef78ced4103	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ee3ecb9e-ed3e-4a74-ac44-99c9af647d8f	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:25.936964+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.97, "total_credit": 3301.97}	0
10789307-497e-480f-ae61-3bb597f2b483	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3a2c7086-fbfa-4bf6-a1b5-5b1eaa172953	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:25.979882+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
6de03d83-3f99-4b4b-8d37-1a1a0fbfa31b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	08a18ee8-b0bd-4f43-8b08-0272f7d40fb6	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:26.019037+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
268632d0-e064-41a2-9e33-41a49f655f10	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d88a583b-78b5-4af6-a426-28ae34ca9923	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:26.061713+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
c364cdcc-3d7e-4c67-8232-34bd4e27cb22	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	95bf150e-e189-40d4-bbb6-1767d77a11a4	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:26.658117+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 360, "total_credit": 360}	0
6539c083-1132-49ac-a02b-e5e697cef1a1	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b059d79d-52a6-4129-9d88-38c45f25e31e	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:26.758934+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 90, "total_credit": 90}	0
46789f64-2816-421b-9d8a-a4587ecdde2c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bc418fc7-61a1-4a84-92fc-4c2255d0a31c	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:26.824797+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 105, "total_credit": 105}	0
41fab515-48b4-4d45-b845-56a43ace3cd5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	76a0471f-b004-46aa-88b9-1c2de8f6c354	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:26.893033+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 60, "total_credit": 60}	0
adc6b98e-5377-4da8-a3ca-ea0a50e78f91	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3ee3a92a-4a9e-4a64-84ca-3b4e5b08c493	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:26.951237+00	{"entry_type": "ADJUSTMENT", "line_count": 2, "total_debit": 500, "total_credit": 500}	0
3ee5e3ec-b5fb-4b4e-ac2e-0b3c651d5aba	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	95f3aa8c-a803-487b-8518-1d6c0d7b56f8	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:27.005452+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 500, "total_credit": 500}	0
a3103628-01e0-4de9-8268-a307a533432e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a97e2d8e-ff7f-4618-aeed-df8c6a0dec5a	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:27.515298+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
34f09711-3e2f-426d-a02f-115508e66e9f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	32e6d317-46ff-4694-8439-34b845e73c3b	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:27.577903+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
012d71e9-b893-422f-88b3-2725b45101be	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	2c368cca-b5e6-4496-aa87-ab9a3cbe24a2	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:27.638697+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
580d3371-fa41-4d0a-95c4-c12bfc12a507	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0877d219-ff51-48f9-b90a-6ea1ac033f94	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:28.695279+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 400000, "total_credit": 400000}	0
bab4d45c-fcd3-4dd1-a6da-5f8e1678d66f	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ca1ca21c-499c-4548-809b-6527e1fccf42	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:29.68363+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 200000, "total_credit": 200000}	0
691da5d2-c326-46de-bc14-5684ab779978	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	15a836ec-2578-4e54-8998-046605082cc7	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:29.75791+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1000000, "total_credit": 1000000}	0
8df71c64-05dd-440a-b2c7-18657efcb83b	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	94a943af-43ca-4ed0-b69f-a33c7021413f	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:29.781034+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 600000, "total_credit": 600000}	0
2b23a3c1-11cf-444f-9b4e-17369f5b1085	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b6b001f1-b314-452d-84c7-caacb8602431	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:30.315572+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
1c38e4eb-3d19-49b2-87ad-5c676a7bac3d	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	4a845aa3-7539-497b-aea5-b08663c4722b	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:30.375565+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
9d363cb1-9e8c-4661-9551-564ae11ed424	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	0bd25553-e818-442e-a3f8-14420c71bd4f	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:30.448161+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
34da0cce-dca9-4484-b210-17b0c3213935	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	3c6ab9c2-3a9e-4d42-9b45-e71d9e2bd32f	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:30.471357+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
8e6f21b8-10f4-4eb3-ada3-199a0e305d60	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8002554e-3f8c-4151-be9b-b065539fbd06	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:31.761239+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
eab98065-1e9b-42f2-9a99-84505652cbfb	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	4307cd52-bca5-41bb-8f7a-e4104d306d7c	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:31.825082+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
6b606c27-fc25-487d-84dc-2e5379a00bac	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a2cfef76-60d7-4673-956a-19236271f81a	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:33.562+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 500000, "total_credit": 500000}	0
96c8c549-d671-4730-aedb-02d11e0a7acf	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	7828b805-231c-4989-a411-c8e108b775f9	00000000-0000-0000-0000-000000000000	2026-03-26 18:05:33.624274+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 300000, "total_credit": 300000}	0
31ea02bb-566f-41e5-a223-63a37004f5cc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	954ed70f-e25e-4130-9818-7f067bee62e7	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:08.35689+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 75000, "total_credit": 75000}	0
9d016c2c-cf0b-4887-94e9-5f90b9fbc765	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	20a2fd9e-57be-430f-bd2a-128e89557419	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:08.600019+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
ef390f5b-2103-4b8c-8bc8-4572ae2ad091	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1c02b4b3-5d40-47db-8cc5-36524c7dec0c	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:08.63924+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 21000, "total_credit": 21000}	0
ac5c2d98-a1fc-4101-a00e-618980ea3562	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c00f6387-8949-4652-9f16-c533fca6acfa	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:08.681334+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 24000, "total_credit": 24000}	0
f4803898-ff3f-4a22-ad88-5496a948ff7e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e1c322a2-3296-4963-be82-d7f4d1fb902c	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:08.788471+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 152000, "total_credit": 152000}	0
b239cacf-5541-458d-a6b3-3d03965b5843	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8cbdc612-8934-4d9b-a0af-9b581c56ec66	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:09.50909+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
7aa9ca4e-5958-4900-a8b8-0716b1757926	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	d83ba33a-3c07-4608-8725-65cb2a94a8bf	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:09.57515+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 3000, "total_credit": 3000}	0
668dd650-439c-4e2a-af63-a2d3598607e3	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	97e7a6dd-80ac-4fc0-982c-54cb888eed22	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:09.699324+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 4000, "total_credit": 4000}	0
295f1079-e28a-4163-ae7d-df5e42e63882	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	34ebf26b-9205-4e28-a2cd-4699b5cb8b9b	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:09.729811+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1200, "total_credit": 1200}	0
3f27006d-aa07-4a38-b662-69e7684dc924	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	c5ccda7c-61db-4f96-b727-fb19985b8290	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:09.813108+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
7621cf5c-e1d5-4662-b5ab-50e60a8edb0b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	eefd7f6e-c633-4651-9447-525d85958353	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:09.842816+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
872730ed-6d4b-4b6e-8c88-7da69bcc509b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	862846cf-801b-469e-96a3-2ce121d44e94	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:09.962257+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 1000, "total_credit": 1000}	0
1b05810a-6848-4d8a-a23f-cb9881bb3121	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a3ce82e3-4a7e-46a9-8082-339ddc683df5	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:10.046652+00	{"entry_type": "ACCRUAL", "line_count": 2, "total_debit": 800, "total_credit": 800}	0
b9d43b25-a567-4362-8dcb-995349c0bf9c	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	48bb9971-24c8-4032-954f-e2a372896a86	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:14.185284+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
c9fa06f4-7f3e-4f81-a515-250bf8d1d34b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5a30a553-b770-42e9-a591-6b7bd61065a1	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:14.265415+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 9.995, "total_credit": 9.995}	0
26fd2cdf-4222-4dd1-bd35-7286dd62b174	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3b4c3a76-aa33-4961-86cc-3795e01368c0	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:14.305737+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100, "total_credit": 100}	0
45e10457-8d6c-43cf-a2d0-d67f719a05e5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	9bc1360c-df1a-4291-82e8-512cb9cb600a	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:14.346412+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 138.88888888888889, "total_credit": 138.88888888888889}	0
a2462209-c865-4e7e-b995-bbc953e37255	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	89706e64-4e8a-40ef-a8e8-65fc8dc49a00	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:14.379873+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 312.5, "total_credit": 312.5}	0
3ec3e51a-30d3-4f29-a245-ae11a6ed02dc	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	567c7e45-8bd5-4f30-90b8-8a0007568372	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:14.413338+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50, "total_credit": 50}	0
cc077122-ecc2-46f8-a014-91ffdbee05d8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	dcc0c624-ac07-4688-af68-9bc9c1cadccb	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:14.998489+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 360, "total_credit": 360}	0
984cb212-ad59-47ac-90f1-1810fa7207d8	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e3fb9658-c6b9-4c8f-976a-f8619a980802	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:15.090456+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 90, "total_credit": 90}	0
e294f14f-27ba-46a4-b105-3fa12ab02ba0	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	69f6eed1-69e3-4eb5-a4db-10683275bbd2	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:15.160913+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 105, "total_credit": 105}	0
3b6faf83-2368-430a-b153-7b2499e67671	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5f2d8e48-ed80-4b8c-b9a4-6560b8f2667c	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:15.22482+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 60, "total_credit": 60}	0
bba530c1-7b3b-46d9-8d37-0ff05dee3372	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	06947db2-7063-4fe9-8d48-54364d519457	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:15.277021+00	{"entry_type": "ADJUSTMENT", "line_count": 2, "total_debit": 500, "total_credit": 500}	0
bf221014-4b61-46b2-b94c-d896a4cbe1e6	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	1396cd23-99c7-4af9-ad4b-38907698ad57	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:15.327406+00	{"entry_type": "REVERSAL", "line_count": 2, "total_debit": 500, "total_credit": 500}	0
d0a35ff0-f9c1-4e77-a895-b6eccd0cee83	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ab06dd17-2d89-417b-816b-7777b8093f74	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:15.864489+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
ffb3e9b7-f605-43f7-b512-471d69f76e3e	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	faf0acde-c9f5-4965-ac54-84611e36ead6	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:15.915174+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 10000, "total_credit": 10000}	0
bdd08305-47d0-41d1-a9ce-6aa5e5933a21	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	59ab1e8e-2a26-4ed5-9595-4ad1fb6153f1	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:15.959101+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
edc26496-4035-4c89-b6d3-b2a10fe0b82d	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	c8ae1d5f-4e32-4430-8f4a-26884914b1bb	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:15.979569+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 30000, "total_credit": 30000}	0
95cc95c0-1ab7-4a7c-958b-93ad73ae154b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f3bd69a6-09f7-4858-8a14-bf0662ab14a6	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:16.023531+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
2910c2a0-456b-4672-b3d4-3ae7db8a6309	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	CREATE	JournalEntry	44110a72-ff8e-4913-80e7-5e47d35c940f	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:16.045096+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 5000, "total_credit": 5000}	0
81b44189-0e59-4d5a-b95d-a9088ee7a5db	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	caffbe62-8c80-46ae-9cdc-33ddf189652e	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:16.59812+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
346b5ec1-1632-4d7c-a856-017d838d685e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b0cad4c0-dff6-4e86-9d29-af51383a94ce	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:16.677981+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 3301.98, "total_credit": 3301.98}	0
dfc3e0ae-aa1d-495e-875c-25da3dd10e3e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5383edec-0779-4140-94eb-946bc78ed46c	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:16.723911+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 15000, "total_credit": 15000}	0
f92a8cf1-4a45-434c-90ba-d8fa02550e57	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5b34f581-a02a-47d8-a858-6563a28fa29a	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:16.764906+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 50000, "total_credit": 50000}	0
517c9a56-1b32-435a-bd16-bc10fde0ddc5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	5149dc6d-03a4-4fa0-98df-d7c7dc67c636	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:16.805656+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 45000, "total_credit": 45000}	0
c3fe5582-8db7-466e-9646-6328705b93b9	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	6bb87d1f-8175-42eb-ae92-d8ec8b5671c6	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:17.434775+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
9badf82a-a1fd-439d-af35-b25273893268	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a89e172f-51c4-4897-bc7b-db9514b9361c	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:17.490358+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
35416eeb-a27e-47a9-9229-fa5510d87bab	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	cb7563dd-b393-4c1d-bd4d-ac9cb995362a	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:17.532488+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 2000, "total_credit": 2000}	0
34578721-cc16-42cc-9be3-b2533a3c1c25	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	58514931-4905-4905-a7e9-85379205274c	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:17.557435+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1960.66, "total_credit": 1960.66}	0
600d5d3a-0bca-4a13-a2b6-945839a61801	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	34bf9700-5ce2-4257-a609-b26ab40b3fc8	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:17.608857+00	{"entry_type": "OPERATIONAL", "line_count": 3, "total_debit": 3000, "total_credit": 3000}	0
0ac6ad36-08bd-4b6c-a2cd-3a753a072f2a	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e3ae74e7-8fe8-449c-97a1-bd4ea632a14e	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:17.634635+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 2970.3, "total_credit": 2970.3}	0
ccfb6d9b-c8ad-481d-9ac5-75f98eed0a57	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	48fac189-2ac1-440d-a790-c5019d2f3d41	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:18.734252+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 100000, "total_credit": 100000}	0
f038790f-c6d2-434b-b9ab-78c36b0d4ac6	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	d5a0ba7e-bf54-4a99-9f0e-a10818bf19c5	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:18.788413+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 80000, "total_credit": 80000}	0
77afc838-d36a-4a44-a837-f3cd334a8b33	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	67ccb252-ff71-455a-94fe-0e8f44814f05	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:18.860792+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
6c0bca52-cba4-4eaf-bdc2-63931d1ca18c	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	90f5e181-28e4-46b0-98d8-165f2f34bddb	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:18.885723+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 25000, "total_credit": 25000}	0
0eeadcb7-3c99-46c6-9913-869726c56492	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	a919b9ee-ca5a-4a05-b865-7b74d1b59efe	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:19.498938+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 400000, "total_credit": 400000}	0
c906ce58-550d-4a66-8ec5-f6db81a2d45e	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	b0c0baea-cb83-4493-8a8a-f43df746527d	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:19.569453+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 200000, "total_credit": 200000}	0
3b1a7c49-bf39-4921-a877-cc7b7dbc2345	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	047851f1-19e5-4bdd-8205-a54f46405001	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:19.652083+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 1000000, "total_credit": 1000000}	0
9666a153-6313-4908-8a9b-28b7e0082c07	52801138-0558-4427-8b84-f658c84b1cc8	CREATE	JournalEntry	90925b58-c6a3-4765-ab32-1cc6b78f621d	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:19.680338+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 600000, "total_credit": 600000}	0
757033cf-0ef0-4f0c-96ca-ed27c478ecf5	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	3ed8adc2-25be-44f5-9121-48ec650c5ceb	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:20.244446+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 50000, "total_credit": 50000}	0
b9b836a6-3014-4bb4-b13f-385ad52dfa0b	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	e3078a3d-7a4b-410f-8084-b68d7c718f56	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:20.302668+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 20000, "total_credit": 20000}	0
4fb7af12-d422-4d6c-a749-550538f212ca	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	f9f32cfa-5283-4189-97d0-beba030fbd85	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:20.353054+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
396c1a78-3b95-4384-8ed4-b9f4f75b4d63	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	ed42bffb-5a5a-4127-a1bf-c0aaed6d52f1	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:23.038527+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 500000, "total_credit": 500000}	0
87248a9e-80df-4b37-ac08-a9083c99434d	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	8550b11b-a1e4-4e21-9bfc-17f773529e52	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:23.097281+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 300000, "total_credit": 300000}	0
4cc2763a-b4ca-4c5d-bafe-facc18b0f3b4	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	586402e7-35f2-4c93-9e5e-511f2beb5918	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:23.744341+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
61e66173-3118-4b9f-85a1-f2e7615932e7	14f8f707-8a84-40df-8bda-399cf12eb33d	CREATE	JournalEntry	bfa0287d-4e5b-44b0-9e94-69741a6a2162	00000000-0000-0000-0000-000000000000	2026-03-26 18:31:23.808064+00	{"entry_type": "OPERATIONAL", "line_count": 2, "total_debit": 40000, "total_credit": 40000}	0
\.


--
-- Data for Name: budget_lines; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.budget_lines (id, budget_id, period_id, node_ref_id, node_ref_type, economic_category, amount, notes, created_at, seasonality_profile) FROM stdin;
0402f0cd-5ff0-4cf8-b098-130d5fae2a58	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	420.0000	Infrastructure > Compute & Hosting: $35/mo × 12 = $420/yr (1,000 users)	2026-04-07 22:06:01.500906+00	\N
68d5953d-2517-408e-b1f4-32b2a44b1dc9	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	216.0000	Infrastructure > PostgreSQL + pgvector: $18/mo × 12 = $216/yr (1,000 users)	2026-04-07 22:06:01.561288+00	\N
e4dd598d-5d1d-43e6-b003-334cb6c4d590	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	60.0000	Infrastructure > Redis Cache: $5/mo × 12 = $60/yr (1,000 users)	2026-04-07 22:06:01.571484+00	\N
faed4885-6c78-41ec-9f82-547458496cef	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	120.0000	Infrastructure > AI/LLM Tokens (Claude): $10/mo × 12 = $120/yr (1,000 users)	2026-04-07 22:06:01.582034+00	\N
36096fc1-28a3-42f2-ba02-a1e3012243b1	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	24.0000	Infrastructure > SMS (Twilio): $2/mo × 12 = $24/yr (1,000 users)	2026-04-07 22:06:01.592702+00	\N
34f8b975-14e4-4757-9106-4097c7b4147a	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	72.0000	Infrastructure > CDN + Storage (S3/CF): $6/mo × 12 = $72/yr (1,000 users)	2026-04-07 22:06:01.601815+00	\N
bd57bea8-4317-45d6-9ed3-e46b348dea73	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12 = $180/yr (1,000 users)	2026-04-07 22:06:01.61265+00	\N
686abc79-ec0f-4e81-ae47-2377c753db62	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	250.0000	Compliance & Security > PCI-DSS Compliance: $250/yr	2026-04-07 22:06:01.622681+00	\N
3ad1b8bf-aecd-4f3b-9104-ee3745e0b79c	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	5000.0000	Compliance & Security > Penetration Testing: $5,000/yr	2026-04-07 22:06:01.634642+00	\N
5520268f-fc85-4c86-84eb-47251860e58e	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:01.651637+00	\N
d62355b1-7049-4c5a-9a44-641df1cb9e7b	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	50.0000	Organizational > Annual filings & registrations: $50/yr	2026-04-07 22:06:01.664536+00	\N
7eee47f0-de5e-496b-9c80-64cef8ce3267	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	1200.0000	Organizational > Tax return preparation (T2): $1,200/yr	2026-04-07 22:06:01.674773+00	\N
0eeae2ec-371f-40ca-a134-b6eece10dd89	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	1200.0000	Organizational > HST/GST filing: $1,200/yr	2026-04-07 22:06:01.686128+00	\N
60123f54-f948-4446-86a0-2535233f8260	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	3600.0000	Organizational > Bookkeeping: $3,600/yr	2026-04-07 22:06:01.698032+00	\N
07892717-234f-4294-bc8f-de52fc9f0310	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	3000.0000	Organizational > D&O insurance: $3,000/yr	2026-04-07 22:06:01.709412+00	\N
3eb7fdab-924c-4877-975e-51260d8f6d3b	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	800.0000	Organizational > Commercial general liability: $800/yr	2026-04-07 22:06:01.724147+00	\N
cf401043-9d74-42b8-9a51-ae0f61578e6e	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	2000.0000	Organizational > Cyber / tech E&O insurance: $2,000/yr	2026-04-07 22:06:01.736758+00	\N
6ca3981b-3c69-4858-a462-8c1fd1c2934f	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	5000.0000	Organizational > Legal retainer: $5,000/yr	2026-04-07 22:06:01.748757+00	\N
d1ddbc5c-9ff7-41fb-aa7b-4c5df27533d5	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	500.0000	Organizational > Registered agent / corp secretary: $500/yr	2026-04-07 22:06:01.760441+00	\N
38db3176-3812-4d5e-963d-ba37bae756d8	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	1020.0000	Infrastructure > Compute & Hosting: $85/mo × 12 = $1020/yr (10,000 users)	2026-04-07 22:06:01.787737+00	\N
3017324f-6ced-468a-a10d-6126bc34875e	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	1200.0000	Infrastructure > PostgreSQL + pgvector: $100/mo × 12 = $1200/yr (10,000 users)	2026-04-07 22:06:01.803312+00	\N
2ad155a1-3e9f-4dbb-b89b-70c0eaf681f5	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	420.0000	Infrastructure > Redis Cache: $35/mo × 12 = $420/yr (10,000 users)	2026-04-07 22:06:01.816678+00	\N
e65768bf-e555-44bf-856c-b052ede47e48	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	660.0000	Infrastructure > Kafka / Event Streaming: $55/mo × 12 = $660/yr (10,000 users)	2026-04-07 22:06:01.827948+00	\N
f836fb8c-06c9-46e6-ba71-52607ec10c60	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	1200.0000	Infrastructure > AI/LLM Tokens (Claude): $100/mo × 12 = $1200/yr (10,000 users)	2026-04-07 22:06:01.83999+00	\N
c38d1bcb-ae31-4db8-b704-a3215bc93580	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	360.0000	Infrastructure > Email (Resend): $30/mo × 12 = $360/yr (10,000 users)	2026-04-07 22:06:01.851238+00	\N
7efcf4a1-b6e9-46fe-a5b7-674502ecfa6a	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	300.0000	Infrastructure > SMS (Twilio): $25/mo × 12 = $300/yr (10,000 users)	2026-04-07 22:06:01.863933+00	\N
cd6b3cfd-b61e-4105-bf5c-4bbb48559bdc	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	420.0000	Infrastructure > CDN + Storage (S3/CF): $35/mo × 12 = $420/yr (10,000 users)	2026-04-07 22:06:01.876822+00	\N
161f9a59-db71-4445-9934-9fd20ad6c76b	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	360.0000	Infrastructure > Monitoring & Observability: $30/mo × 12 = $360/yr (10,000 users)	2026-04-07 22:06:01.889748+00	\N
5877b708-260c-4877-ad27-f8c90bbf116d	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	900.0000	Infrastructure > Search (Elasticsearch): $75/mo × 12 = $900/yr (10,000 users)	2026-04-07 22:06:01.902778+00	\N
440908d5-864b-455c-9712-4bd308db075f	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12 = $180/yr (10,000 users)	2026-04-07 22:06:01.91874+00	\N
5d1ea5c1-adaf-4ee7-af53-e26eb971b421	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	250.0000	Compliance & Security > PCI-DSS Compliance: $250/yr	2026-04-07 22:06:01.934336+00	\N
fedb98aa-c23f-4a07-ac37-a7dbdd21703e	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	5000.0000	Compliance & Security > Penetration Testing: $5,000/yr	2026-04-07 22:06:01.94733+00	\N
966f0b17-15c2-480a-b40b-39c268af4867	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	25000.0000	Compliance & Security > SOC 2 Type II Audit: $25,000/yr	2026-04-07 22:06:01.959259+00	\N
c8abc297-4016-4f2e-a943-7c0f96cee423	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:01.972433+00	\N
1098ba4f-cc7b-4e9f-93e9-80aca1d77185	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	019d69fb-2604-726a-bb96-351a3f2c1bf5	ACTIVITY	EXPENSE	50.0000	Organizational > Annual filings & registrations: $50/yr	2026-04-07 22:06:01.985956+00	\N
287a2315-3813-457d-9461-ba05612d5b34	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	019d69fb-2604-726a-bb96-351a3f2c1bf5	ACTIVITY	EXPENSE	1500.0000	Organizational > Tax return preparation (T2): $1,500/yr	2026-04-07 22:06:01.997955+00	\N
d7e7f7fd-47c1-4a40-9e87-36bdde50953e	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	019d69fb-2604-726a-bb96-351a3f2c1bf5	ACTIVITY	EXPENSE	1200.0000	Organizational > HST/GST filing: $1,200/yr	2026-04-07 22:06:02.010871+00	\N
6458f556-5c3a-4c50-8d6a-b10f8c78044e	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	019d69fb-2604-726a-bb96-351a3f2c1bf5	ACTIVITY	EXPENSE	6000.0000	Organizational > Bookkeeping: $6,000/yr	2026-04-07 22:06:02.023363+00	\N
4c7fa1a3-63f7-4b4a-a060-7f8386bb5539	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	019d69fb-2604-726a-bb96-351a3f2c1bf5	ACTIVITY	EXPENSE	5000.0000	Organizational > Financial review/audit: $5,000/yr	2026-04-07 22:06:02.036219+00	\N
bb0165af-e761-45cd-9f3e-7ac1290eace9	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	019d69fb-2604-726a-bb96-351a3f2c1bf5	ACTIVITY	EXPENSE	3000.0000	Organizational > D&O insurance: $3,000/yr	2026-04-07 22:06:02.049815+00	\N
2afab938-3423-424b-a52e-8acb2f81d221	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	019d69fb-2604-726a-bb96-351a3f2c1bf5	ACTIVITY	EXPENSE	800.0000	Organizational > Commercial general liability: $800/yr	2026-04-07 22:06:02.061832+00	\N
5a3d56c1-612b-47ab-a812-e547269c51c4	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	019d69fb-2604-726a-bb96-351a3f2c1bf5	ACTIVITY	EXPENSE	3000.0000	Organizational > Cyber / tech E&O insurance: $3,000/yr	2026-04-07 22:06:02.074022+00	\N
78421b92-5fef-436b-9828-543204d02ce6	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	019d69fb-2604-726a-bb96-351a3f2c1bf5	ACTIVITY	EXPENSE	8000.0000	Organizational > Legal retainer: $8,000/yr	2026-04-07 22:06:02.08625+00	\N
00b18a54-31a5-4523-93de-e4661b82f005	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	019d69fb-2604-726a-bb96-351a3f2c1bf5	ACTIVITY	EXPENSE	500.0000	Organizational > Registered agent / corp secretary: $500/yr	2026-04-07 22:06:02.099374+00	\N
fa7754c0-c6bd-43f3-a67b-e4c8820bade7	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	019d69fb-2604-726a-bb96-351a3f2c1bf5	ACTIVITY	EXPENSE	600.0000	Organizational > Business banking fees: $600/yr	2026-04-07 22:06:02.111621+00	\N
9054a8d1-64b2-4f6d-9b8e-624c0a9ff032	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	2436.0000	Infrastructure > Compute & Hosting: $203/mo × 12 = $2436/yr (25,000 users)	2026-04-07 22:06:02.136715+00	\N
fb2d26df-014d-4073-a8ac-eca71c1d22b7	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	2436.0000	Infrastructure > PostgreSQL + pgvector: $203/mo × 12 = $2436/yr (25,000 users)	2026-04-07 22:06:02.147424+00	\N
73209a07-6d68-4b92-b54d-9354daf266be	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	936.0000	Infrastructure > Redis Cache: $78/mo × 12 = $936/yr (25,000 users)	2026-04-07 22:06:02.158055+00	\N
8fd5572c-c251-402a-acf1-74ba38de9cb9	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	1308.0000	Infrastructure > Kafka / Event Streaming: $109/mo × 12 = $1308/yr (25,000 users)	2026-04-07 22:06:02.170284+00	\N
08dd8f34-f981-43c9-9aa7-fa0797d270df	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	2892.0000	Infrastructure > AI/LLM Tokens (Claude): $241/mo × 12 = $2892/yr (25,000 users)	2026-04-07 22:06:02.180404+00	\N
82080c70-82fd-4fb8-a570-12c8c23af541	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	564.0000	Infrastructure > Email (Resend): $47/mo × 12 = $564/yr (25,000 users)	2026-04-07 22:06:02.191269+00	\N
6bcd5261-2ce6-403f-b536-7754335d74b5	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	588.0000	Infrastructure > SMS (Twilio): $49/mo × 12 = $588/yr (25,000 users)	2026-04-07 22:06:02.20221+00	\N
53f57090-3216-44f2-be9c-d4f9aa356957	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	1032.0000	Infrastructure > CDN + Storage (S3/CF): $86/mo × 12 = $1032/yr (25,000 users)	2026-04-07 22:06:02.21317+00	\N
29d1680d-8a79-41c6-974d-7b6487cb39a7	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	588.0000	Infrastructure > Monitoring & Observability: $49/mo × 12 = $588/yr (25,000 users)	2026-04-07 22:06:02.225471+00	\N
ac365179-067a-42ee-a9e3-9b8ff8cfc586	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	1908.0000	Infrastructure > Search (Elasticsearch): $159/mo × 12 = $1908/yr (25,000 users)	2026-04-07 22:06:02.236192+00	\N
4a6c17cd-c729-44a0-ba17-88adc9297c87	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12 = $180/yr (25,000 users)	2026-04-07 22:06:02.245849+00	\N
e811de74-13ed-4279-8f3e-114a38bac64d	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:02.255929+00	\N
cff0af75-0ef2-4fff-abed-b9523c909b13	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	10000.0000	Compliance & Security > Penetration Testing: $10,000/yr	2026-04-07 22:06:02.267571+00	\N
ddf04b61-06ff-4109-aefb-311410eb7158	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	30000.0000	Compliance & Security > SOC 2 Type II Audit: $30,000/yr	2026-04-07 22:06:02.278328+00	\N
b0969431-f3b9-4913-8dea-ccd4b6f77862	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:02.291965+00	\N
224f150c-a9d0-4b3e-a48c-fcc82a0bd2e5	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	50.0000	Organizational > Annual filings & registrations: $50/yr	2026-04-07 22:06:02.301708+00	\N
f05375f0-9e42-4d91-9188-0f77411adfbd	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	2000.0000	Organizational > Tax return preparation (T2): $2,000/yr	2026-04-07 22:06:02.312149+00	\N
02b2aea1-fa7a-4c3f-bdb6-a17047204b11	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	2000.0000	Organizational > HST/GST filing: $2,000/yr	2026-04-07 22:06:02.322749+00	\N
28a64612-eb83-4829-8711-f53610c7815d	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	9600.0000	Organizational > Bookkeeping: $9,600/yr	2026-04-07 22:06:02.332178+00	\N
63ac212b-e320-43e7-996f-be46a0cacf4f	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	10000.0000	Organizational > Financial review/audit: $10,000/yr	2026-04-07 22:06:02.343138+00	\N
d4f2f346-a348-46f7-945a-53d199196e3e	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	5000.0000	Organizational > D&O insurance: $5,000/yr	2026-04-07 22:06:02.353121+00	\N
3400a720-47f4-4fdd-9918-64b3f9d22686	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	1200.0000	Organizational > Commercial general liability: $1,200/yr	2026-04-07 22:06:02.363362+00	\N
ecd7eccb-114c-40bd-a136-ad1a26bc73ee	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	5000.0000	Organizational > Cyber / tech E&O insurance: $5,000/yr	2026-04-07 22:06:02.373269+00	\N
06ec62d9-9539-4311-987d-423d978a70f6	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	12000.0000	Organizational > Legal retainer: $12,000/yr	2026-04-07 22:06:02.383096+00	\N
6c5ccf7a-ed9f-4ac2-af95-23cbf1069577	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	5000.0000	Organizational > Board of Directors: $5,000/yr	2026-04-07 22:06:02.392391+00	\N
9e7c0c6f-af28-4e76-b478-867adc11f381	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	500.0000	Organizational > Registered agent / corp secretary: $500/yr	2026-04-07 22:06:02.40175+00	\N
0d88d73e-08f2-4317-b114-56aa98adebf0	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	1200.0000	Organizational > Business banking fees: $1,200/yr	2026-04-07 22:06:02.41388+00	\N
3b671eaa-de0f-4aff-8203-8ec039917492	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	4800.0000	Infrastructure > Compute & Hosting: $400/mo × 12 = $4800/yr (50,000 users)	2026-04-07 22:06:02.431938+00	\N
b9caaeab-d15e-42e5-b814-ebe55fa78dcf	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	4500.0000	Infrastructure > PostgreSQL + pgvector: $375/mo × 12 = $4500/yr (50,000 users)	2026-04-07 22:06:02.44244+00	\N
22334afa-1ee2-4caa-ad86-abed326ff12d	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	1800.0000	Infrastructure > Redis Cache: $150/mo × 12 = $1800/yr (50,000 users)	2026-04-07 22:06:02.454968+00	\N
9eed9fd8-c8ef-492a-9e16-09353e6683d2	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	2400.0000	Infrastructure > Kafka / Event Streaming: $200/mo × 12 = $2400/yr (50,000 users)	2026-04-07 22:06:02.464957+00	\N
86628f3f-dc34-4cd4-93a6-42228e43fcaa	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	5700.0000	Infrastructure > AI/LLM Tokens (Claude): $475/mo × 12 = $5700/yr (50,000 users)	2026-04-07 22:06:02.475235+00	\N
c899a56d-0244-42b2-b1c7-f5719a8e3642	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	900.0000	Infrastructure > Email (Resend): $75/mo × 12 = $900/yr (50,000 users)	2026-04-07 22:06:02.484587+00	\N
f0d38004-b354-4eb5-a5b1-5690f8b6e670	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	1080.0000	Infrastructure > SMS (Twilio): $90/mo × 12 = $1080/yr (50,000 users)	2026-04-07 22:06:02.493876+00	\N
0b7c7c9a-babe-4365-aa6c-130a3d968c67	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	2040.0000	Infrastructure > CDN + Storage (S3/CF): $170/mo × 12 = $2040/yr (50,000 users)	2026-04-07 22:06:02.503227+00	\N
37c1d20b-d12f-4127-8bce-c43ad6c15245	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	960.0000	Infrastructure > Monitoring & Observability: $80/mo × 12 = $960/yr (50,000 users)	2026-04-07 22:06:02.513536+00	\N
4b58d883-d51d-435a-8dc3-256eb51d9304	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	3600.0000	Infrastructure > Search (Elasticsearch): $300/mo × 12 = $3600/yr (50,000 users)	2026-04-07 22:06:02.523688+00	\N
9949719c-b66e-4b67-a002-3b270297819d	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12 = $180/yr (50,000 users)	2026-04-07 22:06:02.533071+00	\N
87f16ffe-a89d-4cd6-9ec8-7d1ad43805f7	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:02.542576+00	\N
99c6195a-ede3-4246-b04d-0d1ead5f9eaa	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	10000.0000	Compliance & Security > Penetration Testing: $10,000/yr	2026-04-07 22:06:02.551817+00	\N
7892bd91-518e-41b6-8ebc-60f1baecdd97	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	35000.0000	Compliance & Security > SOC 2 Type II Audit: $35,000/yr	2026-04-07 22:06:02.561214+00	\N
5d36412d-6fcd-4ca2-8af6-37e72da6cfb9	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:02.57061+00	\N
8313c38e-9376-4e4f-9b84-98f4f564b058	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	019d69fb-2616-756c-9a4f-a1112ea6d69d	ACTIVITY	EXPENSE	50.0000	Organizational > Annual filings & registrations: $50/yr	2026-04-07 22:06:02.581536+00	\N
cbadd5c3-08e5-4c49-9f0f-481d10ccbc63	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	019d69fb-2616-756c-9a4f-a1112ea6d69d	ACTIVITY	EXPENSE	2500.0000	Organizational > Tax return preparation (T2): $2,500/yr	2026-04-07 22:06:02.594528+00	\N
f26e73f3-8351-4f93-b7fd-b10d12cccb5d	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	019d69fb-2616-756c-9a4f-a1112ea6d69d	ACTIVITY	EXPENSE	2000.0000	Organizational > HST/GST filing: $2,000/yr	2026-04-07 22:06:02.607453+00	\N
d59ebf6f-32e9-46e7-8e79-9d9d348bab80	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	019d69fb-2616-756c-9a4f-a1112ea6d69d	ACTIVITY	EXPENSE	12000.0000	Organizational > Bookkeeping: $12,000/yr	2026-04-07 22:06:02.617744+00	\N
2bda424b-c41a-4365-9380-8a054544b79a	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	019d69fb-2616-756c-9a4f-a1112ea6d69d	ACTIVITY	EXPENSE	15000.0000	Organizational > Financial review/audit: $15,000/yr	2026-04-07 22:06:02.627216+00	\N
b7c7cd3a-52d2-4a91-ba7d-b1a5abe3d4fd	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	019d69fb-2616-756c-9a4f-a1112ea6d69d	ACTIVITY	EXPENSE	7000.0000	Organizational > D&O insurance: $7,000/yr	2026-04-07 22:06:02.636198+00	\N
c15a8ccb-5d2d-4d76-b16d-f83bfc3bb2b1	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	019d69fb-2616-756c-9a4f-a1112ea6d69d	ACTIVITY	EXPENSE	1500.0000	Organizational > Commercial general liability: $1,500/yr	2026-04-07 22:06:02.646155+00	\N
d88660e5-164b-4fa3-984f-d6973cdbe825	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	019d69fb-2616-756c-9a4f-a1112ea6d69d	ACTIVITY	EXPENSE	8000.0000	Organizational > Cyber / tech E&O insurance: $8,000/yr	2026-04-07 22:06:02.656607+00	\N
9da37000-24bc-471e-b2f2-5f70c3585c70	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	019d69fb-2616-756c-9a4f-a1112ea6d69d	ACTIVITY	EXPENSE	15000.0000	Organizational > Legal retainer: $15,000/yr	2026-04-07 22:06:02.667507+00	\N
cc49e7a3-d54d-43f0-99c1-54986f7c6c92	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	019d69fb-2616-756c-9a4f-a1112ea6d69d	ACTIVITY	EXPENSE	10000.0000	Organizational > Board of Directors: $10,000/yr	2026-04-07 22:06:02.67788+00	\N
35339794-e2e6-4a45-9aeb-9c9a78bbccb3	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	019d69fb-2616-756c-9a4f-a1112ea6d69d	ACTIVITY	EXPENSE	500.0000	Organizational > Registered agent / corp secretary: $500/yr	2026-04-07 22:06:02.687795+00	\N
0eefef02-4323-4456-9e85-5130c925f373	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	019d69fb-2616-756c-9a4f-a1112ea6d69d	ACTIVITY	EXPENSE	1500.0000	Organizational > Business banking fees: $1,500/yr	2026-04-07 22:06:02.697294+00	\N
af1539ce-cf22-435e-ad36-a804d12b72ee	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	6756.0000	Infrastructure > Compute & Hosting: $563/mo × 12 = $6756/yr (100,000 users)	2026-04-07 22:06:02.714989+00	\N
f4562a6c-5830-44dc-a056-1ce1e60b05eb	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	7572.0000	Infrastructure > PostgreSQL + pgvector: $631/mo × 12 = $7572/yr (100,000 users)	2026-04-07 22:06:02.724117+00	\N
d068a4da-edac-4eb5-9110-75b37e4b9170	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	2256.0000	Infrastructure > Redis Cache: $188/mo × 12 = $2256/yr (100,000 users)	2026-04-07 22:06:02.734613+00	\N
47ebc090-2b13-4c6b-bd80-cd1dbb8485aa	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	4800.0000	Infrastructure > Kafka / Event Streaming: $400/mo × 12 = $4800/yr (100,000 users)	2026-04-07 22:06:02.744588+00	\N
93555303-c3a2-42d8-8040-345254448e4f	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	11328.0000	Infrastructure > AI/LLM Tokens (Claude): $944/mo × 12 = $11328/yr (100,000 users)	2026-04-07 22:06:02.753623+00	\N
edb55067-2725-451a-8dad-c6a29b8f6d80	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	1572.0000	Infrastructure > Email (Resend): $131/mo × 12 = $1572/yr (100,000 users)	2026-04-07 22:06:02.766688+00	\N
672a9f45-2bc3-4703-89a8-fd161ff05891	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	2160.0000	Infrastructure > SMS (Twilio): $180/mo × 12 = $2160/yr (100,000 users)	2026-04-07 22:06:02.778891+00	\N
11d39072-77f2-4b91-a213-c6b19b38b641	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	3036.0000	Infrastructure > CDN + Storage (S3/CF): $253/mo × 12 = $3036/yr (100,000 users)	2026-04-07 22:06:02.789484+00	\N
94622048-746e-4af1-a056-16aefe0e8b18	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	1320.0000	Infrastructure > Monitoring & Observability: $110/mo × 12 = $1320/yr (100,000 users)	2026-04-07 22:06:02.799861+00	\N
e4b1fad6-d9a6-4fac-8a47-1f0c84264664	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	4800.0000	Infrastructure > Search (Elasticsearch): $400/mo × 12 = $4800/yr (100,000 users)	2026-04-07 22:06:02.810224+00	\N
c243ea3d-61b1-448f-8c56-91647807c61a	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12 = $180/yr (100,000 users)	2026-04-07 22:06:02.820477+00	\N
ea81651d-5b7b-49c4-9e79-976fee4ceadb	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:02.829546+00	\N
429aa5ad-21f2-49a9-9387-79a363bf48d0	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	15000.0000	Compliance & Security > Penetration Testing: $15,000/yr	2026-04-07 22:06:02.83944+00	\N
a26e6e8a-95db-4c55-b91b-6d003358ac3b	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	40000.0000	Compliance & Security > SOC 2 Type II Audit: $40,000/yr	2026-04-07 22:06:02.849982+00	\N
adccd454-301f-4ff6-a96c-463b02a6bc1f	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:02.861754+00	\N
2d7d46d2-09dc-4b08-af1a-0e8e3fc268da	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	019d69fb-261e-722c-91b1-ba488f80d85c	ACTIVITY	EXPENSE	50.0000	Organizational > Annual filings & registrations: $50/yr	2026-04-07 22:06:02.872121+00	\N
9de2e99e-d4fa-4609-bbaa-325c7c0c3cb4	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	019d69fb-261e-722c-91b1-ba488f80d85c	ACTIVITY	EXPENSE	3000.0000	Organizational > Tax return preparation (T2): $3,000/yr	2026-04-07 22:06:02.882584+00	\N
cdd57dbd-1021-4def-9aa8-e9125ee97658	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	019d69fb-261e-722c-91b1-ba488f80d85c	ACTIVITY	EXPENSE	2000.0000	Organizational > HST/GST filing: $2,000/yr	2026-04-07 22:06:02.893998+00	\N
7378a8c6-ec6d-4269-ac16-dad375e6b963	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	019d69fb-261e-722c-91b1-ba488f80d85c	ACTIVITY	EXPENSE	18000.0000	Organizational > Bookkeeping: $18,000/yr	2026-04-07 22:06:02.903852+00	\N
f7eae406-d20a-46ed-bf6d-c58a59f310a3	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	019d69fb-261e-722c-91b1-ba488f80d85c	ACTIVITY	EXPENSE	20000.0000	Organizational > Financial review/audit: $20,000/yr	2026-04-07 22:06:02.911884+00	\N
8716b875-680f-4ede-a23e-902f0277153d	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	019d69fb-261e-722c-91b1-ba488f80d85c	ACTIVITY	EXPENSE	10000.0000	Organizational > D&O insurance: $10,000/yr	2026-04-07 22:06:02.924031+00	\N
cf2f8548-38e5-465d-b57f-1da628b43c07	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	019d69fb-261e-722c-91b1-ba488f80d85c	ACTIVITY	EXPENSE	2000.0000	Organizational > Commercial general liability: $2,000/yr	2026-04-07 22:06:02.936665+00	\N
dd2d1f52-8738-497c-b62e-9b24c3e5df9d	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	019d69fb-261e-722c-91b1-ba488f80d85c	ACTIVITY	EXPENSE	12000.0000	Organizational > Cyber / tech E&O insurance: $12,000/yr	2026-04-07 22:06:02.947374+00	\N
5a9ac55c-a695-431a-9234-eafe7a52fe12	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	019d69fb-261e-722c-91b1-ba488f80d85c	ACTIVITY	EXPENSE	20000.0000	Organizational > Legal retainer: $20,000/yr	2026-04-07 22:06:02.956898+00	\N
f0d59560-65aa-4c65-b358-4853d26e771a	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	019d69fb-261e-722c-91b1-ba488f80d85c	ACTIVITY	EXPENSE	20000.0000	Organizational > Board of Directors: $20,000/yr	2026-04-07 22:06:02.967081+00	\N
c42a04d8-e068-4214-8746-9ebb7c935e30	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	019d69fb-261e-722c-91b1-ba488f80d85c	ACTIVITY	EXPENSE	500.0000	Organizational > Registered agent / corp secretary: $500/yr	2026-04-07 22:06:02.97708+00	\N
502a9356-9a40-4ffa-8176-e468bc6b4db6	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	019d69fb-261e-722c-91b1-ba488f80d85c	ACTIVITY	EXPENSE	1500.0000	Organizational > Business banking fees: $1,500/yr	2026-04-07 22:06:02.988596+00	\N
c7574a07-3b8b-4ba3-84f0-2e5d0d3c59fe	313fc329-b959-4369-a589-0f2f110a1765	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	4410.0000	120 donors × 3 txns × $350 avg × 3.5% fee	2026-04-07 22:06:03.260119+00	GIVING_SEASON
f840ec20-9a6f-45e2-8554-d2a676e0f423	313fc329-b959-4369-a589-0f2f110a1765	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	3000.0000	5 charity partners × $600/yr avg	2026-04-07 22:06:03.271002+00	\N
ada1d05a-d02b-404f-8589-c46dedabe770	f4ed1d44-3f18-4b0c-8186-f9b091eb4d38	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	2880.0000	Payment Processing > Stripe fees: 360 txns × (2.2% + $0.30) on $126,000 volume	2026-04-07 22:06:03.331982+00	GIVING_SEASON
9513552e-b3e9-4df6-91de-d2da8587a9c0	b7c31875-c3f4-4e8f-b5f4-b379c1d02306	019d69fb-2604-726a-bb96-351a3f2c1bf5	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	87248.0000	1,600 donors × 3.8 txns × $410 avg × 3.5% fee	2026-04-07 22:06:03.354568+00	GIVING_SEASON
29d0cd6a-2163-4b28-85dd-6f1ea51449ff	b7c31875-c3f4-4e8f-b5f4-b379c1d02306	019d69fb-2604-726a-bb96-351a3f2c1bf5	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	31500.0000	35 charity partners × $900/yr avg	2026-04-07 22:06:03.364053+00	\N
191f6cab-cc61-4cf7-bfe4-4799c6b683a9	a0cebfa9-4d4c-4f3b-a30a-6dfeebb1aea6	019d69fb-2604-726a-bb96-351a3f2c1bf5	019d69fb-2604-726a-bb96-351a3f2c1bf5	ACTIVITY	EXPENSE	56666.0000	Payment Processing > Stripe fees: 6,080 txns × (2.2% + $0.30) on $2,492,800 volume	2026-04-07 22:06:03.380066+00	GIVING_SEASON
c7ba16f9-05ef-4a91-a8b2-9982b4c5ca45	a89b9215-db59-4600-9c26-05da6c0a4917	019d69fb-260d-71df-abd1-028761d5e6c0	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	282744.0000	4,500 donors × 4.2 txns × $440 avg × 3.4% fee	2026-04-07 22:06:03.399932+00	GIVING_SEASON
f7c17399-8b98-494b-bb02-fa4f3d8cdc80	a89b9215-db59-4600-9c26-05da6c0a4917	019d69fb-260d-71df-abd1-028761d5e6c0	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	96000.0000	80 charity partners × $1,200/yr avg	2026-04-07 22:06:03.411249+00	\N
8bf1fd01-90b7-4a08-b0cd-c3fada8c36cd	7f579aed-5f8a-45c1-91a7-65ed8fcfadb0	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	188622.0000	Payment Processing > Stripe fees: 18,900 txns × (2.2% + $0.30) on $8,316,000 volume	2026-04-07 22:06:03.426607+00	GIVING_SEASON
110a37b8-0e14-4e71-a304-a6286d2ff849	8806bb79-1f87-4ed9-8447-9df4951c5c99	019d69fb-2616-756c-9a4f-a1112ea6d69d	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	697950.0000	10,000 donors × 4.5 txns × $470 avg × 3.3% fee	2026-04-07 22:06:03.448124+00	GIVING_SEASON
0abf6f8f-cc6e-4227-b68e-02f0ad5c2b54	8806bb79-1f87-4ed9-8447-9df4951c5c99	019d69fb-2616-756c-9a4f-a1112ea6d69d	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	225000.0000	150 charity partners × $1,500/yr avg	2026-04-07 22:06:03.458959+00	\N
d8d79911-2aa4-4c39-a87c-4911f7a458ae	6c77f6c6-32ba-4cec-8542-6ead5e0f726c	019d69fb-2616-756c-9a4f-a1112ea6d69d	019d69fb-2616-756c-9a4f-a1112ea6d69d	ACTIVITY	EXPENSE	478800.0000	Payment Processing > Stripe fees: 45,000 txns × (2.2% + $0.30) on $21,150,000 volume	2026-04-07 22:06:03.475173+00	GIVING_SEASON
a25bfe76-4b93-4e22-978f-6ebbcfe6460f	795d9337-dd8b-40ee-bef4-11d92fd2edc7	019d69fb-261e-722c-91b1-ba488f80d85c	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	1760000.0000	22,000 donors × 5 txns × $500 avg × 3.2% fee	2026-04-07 22:06:03.495725+00	GIVING_SEASON
7ba9de9b-5636-425e-ae6c-dee26b3b5295	795d9337-dd8b-40ee-bef4-11d92fd2edc7	019d69fb-261e-722c-91b1-ba488f80d85c	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	504000.0000	280 charity partners × $1,800/yr avg	2026-04-07 22:06:03.50536+00	\N
30570207-c88a-417a-b5ca-0682c8e459d8	2414e67d-3da6-4c8a-a49a-fae57f6a66f1	019d69fb-261e-722c-91b1-ba488f80d85c	019d69fb-261e-722c-91b1-ba488f80d85c	ACTIVITY	EXPENSE	1243000.0000	Payment Processing > Stripe fees: 110,000 txns × (2.2% + $0.30) on $55,000,000 volume	2026-04-07 22:06:03.518048+00	GIVING_SEASON
18f87c19-ac00-4b44-891f-964b36220c95	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	420.0000	Infrastructure > Compute & Hosting: $35/mo × 12	2026-04-07 22:06:07.893314+00	\N
252517a4-1d22-4d1e-85a5-5ece1ae25879	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	216.0000	Infrastructure > PostgreSQL + pgvector: $18/mo × 12	2026-04-07 22:06:07.913184+00	\N
574eedbb-c1e9-4af9-a639-07bd6719860b	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	60.0000	Infrastructure > Redis Cache: $5/mo × 12	2026-04-07 22:06:07.922841+00	\N
9740dca9-a532-49ce-afa8-7c8ae7ba1123	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	120.0000	Infrastructure > AI/LLM Tokens (Claude): $10/mo × 12	2026-04-07 22:06:07.931322+00	\N
1dd7be40-4752-420f-ae7f-5ce750bd9198	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	24.0000	Infrastructure > SMS (Twilio): $2/mo × 12	2026-04-07 22:06:07.940921+00	\N
06a0aaf8-a30b-4310-b000-e73cf975e125	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	72.0000	Infrastructure > CDN + Storage (S3/CF): $6/mo × 12	2026-04-07 22:06:07.950109+00	\N
1cb65a31-a351-4889-8cfc-ccc4037f5cbc	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:07.959681+00	\N
cc82b225-f5ed-4045-9b8a-894b09013c7e	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	250.0000	Compliance & Security > PCI-DSS Compliance: $250/yr	2026-04-07 22:06:07.969831+00	\N
c9b34493-c970-4d71-82bd-5095ea2eb20b	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	5000.0000	Compliance & Security > Penetration Testing: $5,000/yr	2026-04-07 22:06:07.978568+00	\N
6aede673-bad8-4382-befa-be32321a8a19	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:07.987261+00	\N
5ca448bc-040a-45d3-b701-42c18dd0831e	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:07.995835+00	\N
a2d0158d-89f4-480b-9a2d-a4adaa945a7b	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	1500.0000	Organizational > T3010 charity return: $1,500/yr	2026-04-07 22:06:08.004785+00	\N
3debd62a-47e3-41c8-92b6-c04c6cbf8b4b	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	2400.0000	Organizational > Bookkeeping: $2,400/yr	2026-04-07 22:06:08.013281+00	\N
dec62f9b-3be3-4ae4-b0f7-2f82c74775af	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	500.0000	Organizational > General liability insurance: $500/yr	2026-04-07 22:06:08.022136+00	\N
5f7a98bb-12bf-4ae3-be56-cbffb68dae2a	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	1500.0000	Organizational > Cyber insurance: $1,500/yr	2026-04-07 22:06:08.031234+00	\N
d754c8d6-129c-42b7-aec4-3d6c241ea40b	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	3000.0000	Organizational > Legal retainer: $3,000/yr	2026-04-07 22:06:08.042835+00	\N
33702ee2-de0e-407e-9c88-6f0894f56350	9503982f-9d2d-4fbc-b3e1-f410db50bd44	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	6000.0000	Marketing > Organic Marketing: $6,000/yr	2026-04-07 22:06:08.059237+00	GIVING_SEASON_MARKETING
80954280-7a9c-4f9a-898b-e9238c2033a5	9503982f-9d2d-4fbc-b3e1-f410db50bd44	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	1800.0000	Marketing > Paid Media: $1,800/yr	2026-04-07 22:06:08.068541+00	GIVING_SEASON_MARKETING
1f188d60-28ca-47fb-8fc9-42fb100dd955	5fa1a764-a762-4975-aeed-673eb1bc3c43	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	3981.0000	Txn fees: 130 donors × 2.5 txns × $350 × 3.5%	2026-04-07 22:06:08.086229+00	GIVING_SEASON
c35d0b6b-ba1b-46ec-a57c-867d6f7b568e	5fa1a764-a762-4975-aeed-673eb1bc3c43	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	1800.0000	SaaS: 3 partners × $600/yr	2026-04-07 22:06:08.095114+00	\N
67295548-b004-4ee2-beab-68af4ee5f3be	2fc3a2a0-ecfa-4c67-be5b-9edded5a21c2	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	2600.0000	Payment Processing > Stripe fees: 325 txns × (2.2% + $0.30) on $113,750 volume	2026-04-07 22:06:08.104769+00	GIVING_SEASON
fd9be6b7-b6c7-4b3c-94f7-6c3c5ca04778	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	684.0000	Infrastructure > Compute & Hosting: $57/mo × 12	2026-04-07 22:06:08.120628+00	\N
d0d46514-301f-45dd-8f53-e82a5d0debe8	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	648.0000	Infrastructure > PostgreSQL + pgvector: $54/mo × 12	2026-04-07 22:06:08.130116+00	\N
7cf68b54-df8e-4d5e-be8f-fce8686982c1	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	216.0000	Infrastructure > Redis Cache: $18/mo × 12	2026-04-07 22:06:08.140231+00	\N
99399691-2a6f-49af-ade3-7823867d7143	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	288.0000	Infrastructure > Kafka / Event Streaming: $24/mo × 12	2026-04-07 22:06:08.150161+00	\N
0635604c-77c7-4ec9-b18a-58b1607dca3e	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	600.0000	Infrastructure > AI/LLM Tokens (Claude): $50/mo × 12	2026-04-07 22:06:08.161216+00	\N
cf2375c5-4f62-483c-852f-fa4d5109e6a3	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	156.0000	Infrastructure > Email (Resend): $13/mo × 12	2026-04-07 22:06:08.172562+00	\N
8c54bfdb-7f91-4024-bb86-ee3612a78d18	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	144.0000	Infrastructure > SMS (Twilio): $12/mo × 12	2026-04-07 22:06:08.183439+00	\N
2185f86c-b1a7-42a3-9da2-fc0d3120cc51	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	228.0000	Infrastructure > CDN + Storage (S3/CF): $19/mo × 12	2026-04-07 22:06:08.193289+00	\N
14b01ff4-be8d-4603-9fba-d8f5e4ae3812	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	156.0000	Infrastructure > Monitoring & Observability: $13/mo × 12	2026-04-07 22:06:08.20307+00	\N
c7556be4-cd26-42c9-b7da-469ee3d5799d	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	396.0000	Infrastructure > Search (Elasticsearch): $33/mo × 12	2026-04-07 22:06:08.213539+00	\N
2d6a599f-8d0d-4da7-acce-a954fdb3594b	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:08.223682+00	\N
e59e8d82-026a-489a-a4eb-5634b67935dc	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	250.0000	Compliance & Security > PCI-DSS Compliance: $250/yr	2026-04-07 22:06:08.233417+00	\N
e1dae808-3ea6-4240-90c7-e54e3d4fa2c0	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	5000.0000	Compliance & Security > Penetration Testing: $5,000/yr	2026-04-07 22:06:08.243832+00	\N
80a8cd61-0277-4abb-a689-0f01450c1bf4	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	25000.0000	Compliance & Security > SOC 2 Type II Audit: $25,000/yr	2026-04-07 22:06:08.253629+00	\N
d412c59f-2cd0-438a-8395-4aec1e130189	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:08.262184+00	\N
7f3dd5eb-84f2-4f43-8af9-b888b6488081	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:08.271724+00	\N
cc9e170a-1345-4688-b057-0575e15c230f	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	2000.0000	Organizational > T3010 charity return: $2,000/yr	2026-04-07 22:06:08.281261+00	\N
d2e28a02-161e-4883-bdda-7f792660a094	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	3600.0000	Organizational > Bookkeeping: $3,600/yr	2026-04-07 22:06:08.29072+00	\N
6226b425-e91b-4d49-aa0f-07153bcb9d2f	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	8000.0000	Organizational > Financial audit: $8,000/yr	2026-04-07 22:06:08.300149+00	\N
55dc4d1d-72a5-4271-bd2d-8b48aa964fd7	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	500.0000	Organizational > General liability insurance: $500/yr	2026-04-07 22:06:08.310247+00	\N
9f1eb2a7-9061-416f-b775-33976711e973	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	2000.0000	Organizational > Cyber insurance: $2,000/yr	2026-04-07 22:06:08.319466+00	\N
5a50620d-5882-4d60-9201-4a1fe4699909	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	5000.0000	Organizational > Legal retainer: $5,000/yr	2026-04-07 22:06:09.329501+00	\N
58f8fc9c-e4ac-475a-94f5-9851d3d82ee2	09b79310-7b6d-45e4-9ca5-a7aa36ba078f	019d49be-61ff-77a0-b8d1-78ceed0afacd	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	12000.0000	Marketing > Organic Marketing: $12,000/yr	2026-04-07 22:06:09.349116+00	GIVING_SEASON_MARKETING
0ba60d2a-dba0-4451-89ef-f9e01be2a315	09b79310-7b6d-45e4-9ca5-a7aa36ba078f	019d49be-61ff-77a0-b8d1-78ceed0afacd	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	4600.0000	Marketing > Paid Media: $4,600/yr	2026-04-07 22:06:09.358554+00	GIVING_SEASON_MARKETING
9359ab38-520e-4ea2-9870-41ca552f4893	d8fdc78d-6901-467e-b623-97c5c386bf59	019d49be-61ff-77a0-b8d1-78ceed0afacd	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	30576.0000	Txn fees: 700 donors × 3.2 txns × $390 × 3.5%	2026-04-07 22:06:09.374589+00	GIVING_SEASON
142dee99-78e3-4ff3-9159-6f9b20084395	d8fdc78d-6901-467e-b623-97c5c386bf59	019d49be-61ff-77a0-b8d1-78ceed0afacd	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	13500.0000	SaaS: 15 partners × $900/yr	2026-04-07 22:06:09.383249+00	\N
209ce3ea-517f-43f1-a7ad-11a411134c36	163d6480-5967-43e4-9b3b-a26904f0453c	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	19891.0000	Payment Processing > Stripe fees: 2,240 txns × (2.2% + $0.30) on $873,600 volume	2026-04-07 22:06:09.393579+00	GIVING_SEASON
53d5d393-6234-4476-824e-670954b26e44	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	1404.0000	Infrastructure > Compute & Hosting: $117/mo × 12	2026-04-07 22:06:09.411504+00	\N
83b59d01-cdca-4b64-8634-2824b859cf2d	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	1536.0000	Infrastructure > PostgreSQL + pgvector: $128/mo × 12	2026-04-07 22:06:09.421871+00	\N
65528dff-13db-44e3-8672-d35d28251e93	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	564.0000	Infrastructure > Redis Cache: $47/mo × 12	2026-04-07 22:06:09.43094+00	\N
1c19c0f1-d3a1-46d4-8a8c-9c96e0ffdb8a	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	840.0000	Infrastructure > Kafka / Event Streaming: $70/mo × 12	2026-04-07 22:06:09.440581+00	\N
5c5f641c-c2c4-4774-b2f9-c330cb4a4181	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	1656.0000	Infrastructure > AI/LLM Tokens (Claude): $138/mo × 12	2026-04-07 22:06:09.450381+00	\N
231d614b-4711-461d-94ec-be60c90c48c7	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	420.0000	Infrastructure > Email (Resend): $35/mo × 12	2026-04-07 22:06:09.460009+00	\N
f298d79d-3a70-4d25-a12a-133f1a33427f	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	384.0000	Infrastructure > SMS (Twilio): $32/mo × 12	2026-04-07 22:06:09.469548+00	\N
831f292d-7dec-4837-8996-00687d2616e2	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	588.0000	Infrastructure > CDN + Storage (S3/CF): $49/mo × 12	2026-04-07 22:06:09.478757+00	\N
9cf9f8bf-9f17-469c-b044-6ccdc7026785	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	420.0000	Infrastructure > Monitoring & Observability: $35/mo × 12	2026-04-07 22:06:09.490239+00	\N
a81437bd-8265-4440-8af1-52567eab87e1	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	1176.0000	Infrastructure > Search (Elasticsearch): $98/mo × 12	2026-04-07 22:06:09.499593+00	\N
9cc95907-c0d4-422d-b96f-3259fcc99b38	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:09.508959+00	\N
930d6f02-a180-42b4-a847-0ebf77f107a6	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:09.518554+00	\N
ba5bd2c3-8f0b-4b61-a9e2-72d6c7b7dc94	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	10000.0000	Compliance & Security > Penetration Testing: $10,000/yr	2026-04-07 22:06:09.528213+00	\N
41198897-90d5-4b22-874a-bde0a3bb3b46	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	30000.0000	Compliance & Security > SOC 2 Type II Audit: $30,000/yr	2026-04-07 22:06:09.537827+00	\N
583d4686-4b66-4db6-bbe6-282fa95c9ee8	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:09.546829+00	\N
03edb915-e1ab-40af-bdb8-d4c251e548f1	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:09.556392+00	\N
f202eee9-7ead-41c6-a188-625726530bc0	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	2500.0000	Organizational > T3010 charity return: $2,500/yr	2026-04-07 22:06:09.565083+00	\N
4b45d1b4-39ff-47a5-9776-d6f1a0d765ec	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	6000.0000	Organizational > Bookkeeping: $6,000/yr	2026-04-07 22:06:09.573799+00	\N
e4e3bf9f-e3dd-43bc-97e1-1b6b4cc9cc51	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	10000.0000	Organizational > Financial audit: $10,000/yr	2026-04-07 22:06:09.582414+00	\N
dca05048-819e-45ac-b751-3465db8df091	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	800.0000	Organizational > General liability insurance: $800/yr	2026-04-07 22:06:09.591273+00	\N
c90dc9e7-1644-4016-b2c1-09e047198a15	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	3000.0000	Organizational > Cyber insurance: $3,000/yr	2026-04-07 22:06:09.599559+00	\N
203ea58a-b864-4507-9e92-f2250c3d82fb	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	8000.0000	Organizational > Legal retainer: $8,000/yr	2026-04-07 22:06:09.608827+00	\N
4cc09a6c-a86b-419f-8aba-3298a1921472	4646ec89-607a-438e-b4c8-4111ae53478a	019d69fb-260d-71df-abd1-028761d5e6c0	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	18000.0000	Marketing > Organic Marketing: $18,000/yr	2026-04-07 22:06:09.625638+00	GIVING_SEASON_MARKETING
41fe395d-9560-493a-b1f6-79ccd3433eeb	4646ec89-607a-438e-b4c8-4111ae53478a	019d69fb-260d-71df-abd1-028761d5e6c0	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	53000.0000	Marketing > Paid Media: $53,000/yr	2026-04-07 22:06:09.636791+00	GIVING_SEASON_MARKETING
6e3e015b-cfb6-4b79-9161-ed6e86cd9d32	1a4c6081-b77a-4ef8-aa9d-790c5eb8cb04	019d69fb-260d-71df-abd1-028761d5e6c0	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	129148.0000	Txn fees: 2380 donors × 3.8 txns × $420 × 3.4%	2026-04-07 22:06:09.654469+00	GIVING_SEASON
5ec50b6f-c46c-47b4-9acf-4f81f89f194e	1a4c6081-b77a-4ef8-aa9d-790c5eb8cb04	019d69fb-260d-71df-abd1-028761d5e6c0	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	60000.0000	SaaS: 50 partners × $1200/yr	2026-04-07 22:06:09.663117+00	\N
cbf832d6-e4be-4926-827b-50bf99211d56	cd5ce615-e23b-49c0-a94a-ddd8c582260c	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	86280.0000	Payment Processing > Stripe fees: 9,044 txns × (2.2% + $0.30) on $3,798,480 volume	2026-04-07 22:06:09.672514+00	GIVING_SEASON
53fe30a0-698b-453c-b246-2f370fe707f1	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	2916.0000	Infrastructure > Compute & Hosting: $243/mo × 12	2026-04-07 22:06:09.689411+00	\N
89e1400b-0088-4e81-b665-0abfe14b0a70	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	2856.0000	Infrastructure > PostgreSQL + pgvector: $238/mo × 12	2026-04-07 22:06:09.698031+00	\N
8bed222c-938d-4ddd-894e-e06219e51e29	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	1116.0000	Infrastructure > Redis Cache: $93/mo × 12	2026-04-07 22:06:09.706978+00	\N
23bfd256-f838-4de3-92fb-aa457ff29771	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	1536.0000	Infrastructure > Kafka / Event Streaming: $128/mo × 12	2026-04-07 22:06:09.715792+00	\N
8203ff22-1dce-4b7f-b245-a92c8fa6783c	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	3456.0000	Infrastructure > AI/LLM Tokens (Claude): $288/mo × 12	2026-04-07 22:06:09.725545+00	\N
59f96c1f-79d6-45e4-8a19-2db6a606074b	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	636.0000	Infrastructure > Email (Resend): $53/mo × 12	2026-04-07 22:06:09.734217+00	\N
46a5b77b-f4e6-4621-9586-b6c6a379e70c	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	696.0000	Infrastructure > SMS (Twilio): $58/mo × 12	2026-04-07 22:06:09.745456+00	\N
dae26277-47a2-49ab-b6e9-a77aa865d859	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	1236.0000	Infrastructure > CDN + Storage (S3/CF): $103/mo × 12	2026-04-07 22:06:09.755221+00	\N
1b917d46-2853-4702-aaa4-d497dabbc3f1	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	660.0000	Infrastructure > Monitoring & Observability: $55/mo × 12	2026-04-07 22:06:09.764721+00	\N
82b604c1-22a4-498e-a1a8-548fe293afa0	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	2256.0000	Infrastructure > Search (Elasticsearch): $188/mo × 12	2026-04-07 22:06:09.776258+00	\N
79cb5433-eccc-4abc-ae04-db8c48b9d839	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:09.785951+00	\N
06caf523-6aac-49a0-9931-898f33d6140d	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:10.796616+00	\N
095b1783-6750-4b0b-9ba9-422c217e2525	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	10000.0000	Compliance & Security > Penetration Testing: $10,000/yr	2026-04-07 22:06:10.808057+00	\N
587ed53d-1a5b-4395-9c06-da01aaac94ad	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	35000.0000	Compliance & Security > SOC 2 Type II Audit: $35,000/yr	2026-04-07 22:06:10.81785+00	\N
be254c75-1a33-4171-96be-48247951e72e	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:10.827743+00	\N
3e0600f1-9001-4eea-982a-639475fa5e0b	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:10.839431+00	\N
d8f5fc86-cdfe-4110-b8f7-1aa73b4c1634	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	3000.0000	Organizational > T3010 charity return: $3,000/yr	2026-04-07 22:06:10.851042+00	\N
0464b80c-35b2-413d-b16e-6a17fec8afc7	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	9600.0000	Organizational > Bookkeeping: $9,600/yr	2026-04-07 22:06:10.862388+00	\N
040fc417-4ed5-45ef-9573-aefbe0dd420e	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	15000.0000	Organizational > Financial audit: $15,000/yr	2026-04-07 22:06:10.872205+00	\N
62ec2819-1718-4d80-903e-154f9dc06563	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	1000.0000	Organizational > General liability insurance: $1,000/yr	2026-04-07 22:06:10.881247+00	\N
5f7c562c-604d-4eb9-ab8f-6c414c87363b	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	5000.0000	Organizational > Cyber insurance: $5,000/yr	2026-04-07 22:06:10.891127+00	\N
818e42a0-cf61-410b-9665-cec5cf514713	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	10000.0000	Organizational > Legal retainer: $10,000/yr	2026-04-07 22:06:10.899636+00	\N
c67e8bd5-67b1-4797-8236-aafcdcfb7d7c	493fc8e1-bf13-4726-8726-a0bd501ba8c7	019d49be-6213-75dc-9a73-ae7f08e23d71	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	24000.0000	Marketing > Organic Marketing: $24,000/yr	2026-04-07 22:06:10.918324+00	GIVING_SEASON_MARKETING
b3b39943-cd17-42f4-927c-d831567565f0	493fc8e1-bf13-4726-8726-a0bd501ba8c7	019d49be-6213-75dc-9a73-ae7f08e23d71	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	100400.0000	Marketing > Paid Media: $100,400/yr	2026-04-07 22:06:10.927453+00	GIVING_SEASON_MARKETING
1f84ec82-abe7-40eb-b265-01407a2658cb	5d0426a8-9c55-48ef-b4d0-e04cd99b5b65	019d49be-6213-75dc-9a73-ae7f08e23d71	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	363409.0000	Txn fees: 5700 donors × 4.2 txns × $460 × 3.3%	2026-04-07 22:06:10.947326+00	GIVING_SEASON
38674908-ac83-4102-8151-58827529bbd8	5d0426a8-9c55-48ef-b4d0-e04cd99b5b65	019d49be-6213-75dc-9a73-ae7f08e23d71	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	180000.0000	SaaS: 120 partners × $1500/yr	2026-04-07 22:06:10.957154+00	\N
ceccbef0-8eb1-4156-8192-217d5af3d991	baa5f546-0b32-450b-98b3-bb7fbb5116f1	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	249455.0000	Payment Processing > Stripe fees: 23,940 txns × (2.2% + $0.30) on $11,012,400 volume	2026-04-07 22:06:10.966385+00	GIVING_SEASON
7d7bc9e0-23ba-460d-94d6-67585075a577	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	4800.0000	Infrastructure > Compute & Hosting: $400/mo × 12	2026-04-07 22:06:10.984221+00	\N
e4b0d7c9-77f6-4a80-a1e2-6380538f566e	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	4500.0000	Infrastructure > PostgreSQL + pgvector: $375/mo × 12	2026-04-07 22:06:10.993542+00	\N
fd9f31ea-a3a8-47bf-9ab1-78ce4e05f762	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	1800.0000	Infrastructure > Redis Cache: $150/mo × 12	2026-04-07 22:06:11.003795+00	\N
63c002a0-ea42-4b83-b5e5-b250ee1c0d5e	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	2400.0000	Infrastructure > Kafka / Event Streaming: $200/mo × 12	2026-04-07 22:06:11.013576+00	\N
3f74ad52-bfa6-421c-bb20-f87439c47344	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	5700.0000	Infrastructure > AI/LLM Tokens (Claude): $475/mo × 12	2026-04-07 22:06:11.023484+00	\N
be633058-eeef-41d6-b2a9-8841098340fb	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	900.0000	Infrastructure > Email (Resend): $75/mo × 12	2026-04-07 22:06:11.032861+00	\N
8b1a4a6d-8d79-4e67-a2a9-f702fc190169	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	1080.0000	Infrastructure > SMS (Twilio): $90/mo × 12	2026-04-07 22:06:11.042902+00	\N
c22a1571-824a-426b-afe5-8614f2f5ddee	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	2040.0000	Infrastructure > CDN + Storage (S3/CF): $170/mo × 12	2026-04-07 22:06:11.052887+00	\N
515f515a-ac64-4543-875b-76a58fafa347	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	960.0000	Infrastructure > Monitoring & Observability: $80/mo × 12	2026-04-07 22:06:11.062999+00	\N
3753b49f-6bbc-4683-9142-82f2d1802590	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	3600.0000	Infrastructure > Search (Elasticsearch): $300/mo × 12	2026-04-07 22:06:11.073286+00	\N
bcf5c28d-4401-45fa-9c71-934fc76e95ba	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:11.083633+00	\N
5ab6e9f1-4a72-45d9-beff-fa443791c58d	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:11.095471+00	\N
a89c86c5-5409-4299-85df-7d573593dbb3	0d1a4f9e-ad20-44da-9231-51c7d94438e3	019d69fb-260d-71df-abd1-028761d5e6c0	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	48000.0000	SaaS: 40 partners × $1200/yr	2026-04-07 22:06:14.183256+00	\N
46039a5e-76e1-4da5-9b9c-3cf18db0345a	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	15000.0000	Compliance & Security > Penetration Testing: $15,000/yr	2026-04-07 22:06:11.105872+00	\N
92c75cfa-58fc-4fcc-ac6d-5246750c5dc1	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	40000.0000	Compliance & Security > SOC 2 Type II Audit: $40,000/yr	2026-04-07 22:06:11.119425+00	\N
7e58d545-e24e-462f-ab73-09c81b021ece	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:11.128632+00	\N
783b8afd-9f2b-4612-85dc-2981f450939d	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:11.138447+00	\N
648a7d30-b746-40ce-8290-6cccdfb89089	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	3500.0000	Organizational > T3010 charity return: $3,500/yr	2026-04-07 22:06:11.1497+00	\N
8a550821-5ed2-4e34-b996-7b49f400ed5c	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12000.0000	Organizational > Bookkeeping: $12,000/yr	2026-04-07 22:06:11.161426+00	\N
f6032838-1547-4de5-a12c-3cbe0be6257b	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	20000.0000	Organizational > Financial audit: $20,000/yr	2026-04-07 22:06:11.171416+00	\N
519f6a94-4221-4d0d-9b61-eefb380b75e7	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	1500.0000	Organizational > General liability insurance: $1,500/yr	2026-04-07 22:06:11.181031+00	\N
82378e32-928c-4b13-9d4b-679c7982ece6	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	8000.0000	Organizational > Cyber insurance: $8,000/yr	2026-04-07 22:06:11.190651+00	\N
3ef07f6e-5bba-4cb5-b57b-1ce3e694de8c	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12000.0000	Organizational > Legal retainer: $12,000/yr	2026-04-07 22:06:11.200058+00	\N
5ecd3c30-2b33-453a-b6cd-fcd2ff32b334	233e27b1-8210-4e97-84cb-8fc5cc24ded3	019d49be-621b-7306-bb7c-cc9d86263b46	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	30000.0000	Marketing > Organic Marketing: $30,000/yr	2026-04-07 22:06:11.220131+00	GIVING_SEASON_MARKETING
de28aabd-b6c2-4af1-bdd3-46a6f123f300	233e27b1-8210-4e97-84cb-8fc5cc24ded3	019d49be-621b-7306-bb7c-cc9d86263b46	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	148800.0000	Marketing > Paid Media: $148,800/yr	2026-04-07 22:06:11.229366+00	GIVING_SEASON_MARKETING
6a042e4f-09f0-4cd5-819c-0643d9e61eb0	757b67e3-36b1-401a-bdef-2c017ee0264d	019d49be-621b-7306-bb7c-cc9d86263b46	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	887040.0000	Txn fees: 11550 donors × 4.8 txns × $500 × 3.2%	2026-04-07 22:06:11.247339+00	GIVING_SEASON
68d05b7a-894a-400b-8bd6-693bf090ae10	757b67e3-36b1-401a-bdef-2c017ee0264d	019d49be-621b-7306-bb7c-cc9d86263b46	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	450000.0000	SaaS: 250 partners × $1800/yr	2026-04-07 22:06:11.258959+00	\N
89896cec-a252-407e-8956-b4ccb46cc9d9	4aa34a84-36e8-4434-aad4-248a5dba3821	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	626472.0000	Payment Processing > Stripe fees: 55,440 txns × (2.2% + $0.30) on $27,720,000 volume	2026-04-07 22:06:11.268711+00	GIVING_SEASON
1876df68-272a-4e7e-aaa3-e963e8c6af2b	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	420.0000	Infrastructure > Compute & Hosting: $35/mo × 12	2026-04-07 22:06:11.287351+00	\N
a2461872-7d00-4a90-93f8-dd2cba7cf492	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	216.0000	Infrastructure > PostgreSQL + pgvector: $18/mo × 12	2026-04-07 22:06:12.297981+00	\N
0b11e87d-d3d3-45d3-90b3-38bb530c4584	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	60.0000	Infrastructure > Redis Cache: $5/mo × 12	2026-04-07 22:06:12.308862+00	\N
25b1e477-1215-4458-8733-9c812d8dc4a5	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	120.0000	Infrastructure > AI/LLM Tokens (Claude): $10/mo × 12	2026-04-07 22:06:12.319221+00	\N
5ed42fe3-ad98-49fc-b8d7-b6bde539f1f9	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	24.0000	Infrastructure > SMS (Twilio): $2/mo × 12	2026-04-07 22:06:12.329339+00	\N
66954d46-3974-478f-b9ca-e6727e8bc979	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	72.0000	Infrastructure > CDN + Storage (S3/CF): $6/mo × 12	2026-04-07 22:06:12.340206+00	\N
9fb1c1eb-f9c5-486e-9051-60a3d9a58875	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:12.351509+00	\N
98c079fc-a0ac-45a8-bd07-ed2e4bfdcc7a	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	250.0000	Compliance & Security > PCI-DSS Compliance: $250/yr	2026-04-07 22:06:12.360836+00	\N
cf47418e-cadc-4443-99e9-7dcad7e93e7d	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	5000.0000	Compliance & Security > Penetration Testing: $5,000/yr	2026-04-07 22:06:12.370674+00	\N
bcf4c77d-c344-4729-8df9-300e05335c98	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:12.380484+00	\N
ad0e0fb9-4ff7-4056-a491-410cfefa3386	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:12.390146+00	\N
9f9bb4b9-4835-4894-a614-9d6cfd642617	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	1500.0000	Organizational > T3010 charity return: $1,500/yr	2026-04-07 22:06:12.401227+00	\N
75a1c4ab-9ae6-4c07-8d0b-4cf1b87d5fb6	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	2400.0000	Organizational > Bookkeeping: $2,400/yr	2026-04-07 22:06:12.413327+00	\N
f92ade1b-ba8f-47de-8e56-8cc3dff0c0ca	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	500.0000	Organizational > General liability insurance: $500/yr	2026-04-07 22:06:12.423103+00	\N
6fd5253b-d4cc-45ac-9c07-b2dc77c024cd	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	1500.0000	Organizational > Cyber insurance: $1,500/yr	2026-04-07 22:06:12.433277+00	\N
f94fd724-2e51-4fcf-8d0f-828234379d79	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	3000.0000	Organizational > Legal retainer: $3,000/yr	2026-04-07 22:06:12.444826+00	\N
7a1a02d6-456a-433a-b20f-4c157442dfa7	05373597-81a2-4039-98b3-4ea85fed7a8f	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	42000.0000	Marketing > Organic Marketing: $42,000/yr	2026-04-07 22:06:12.46813+00	GIVING_SEASON_MARKETING
79f09e7e-6fdd-4ea2-b509-af523ab64933	05373597-81a2-4039-98b3-4ea85fed7a8f	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	103200.0000	Marketing > Paid Media: $103,200/yr	2026-04-07 22:06:12.478257+00	GIVING_SEASON_MARKETING
3dd7e583-29e1-45ed-a6fa-5b0c79ddc34a	f730b1e4-adec-4575-88ab-f8b69834b255	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	896.0000	Txn fees: 40 donors × 2 txns × $320 × 3.5%	2026-04-07 22:06:12.496838+00	GIVING_SEASON
96428ebf-0519-4d62-81b7-aa23326d434e	f730b1e4-adec-4575-88ab-f8b69834b255	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	600.0000	SaaS: 1 partners × $600/yr	2026-04-07 22:06:12.510249+00	\N
31685813-5833-4784-b992-dacf99f98f40	9b621b87-3bb4-4a04-9f7c-e840d02b15f9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	587.0000	Payment Processing > Stripe fees: 80 txns × (2.2% + $0.30) on $25,600 volume	2026-04-07 22:06:12.521392+00	GIVING_SEASON
7121839a-4969-43e5-91e6-f300a31673b8	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	552.0000	Infrastructure > Compute & Hosting: $46/mo × 12	2026-04-07 22:06:12.537999+00	\N
d8e249bf-1df3-4371-91e0-518ed3deaeeb	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	432.0000	Infrastructure > PostgreSQL + pgvector: $36/mo × 12	2026-04-07 22:06:12.547815+00	\N
c632625f-27a2-4e63-a002-2fc1739da57b	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	144.0000	Infrastructure > Redis Cache: $12/mo × 12	2026-04-07 22:06:12.557588+00	\N
93857095-c4b8-4f3f-8c84-a650fde8d8fc	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	144.0000	Infrastructure > Kafka / Event Streaming: $12/mo × 12	2026-04-07 22:06:12.568724+00	\N
6eb79447-e03c-49c3-8f1f-73cf84af9f93	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	360.0000	Infrastructure > AI/LLM Tokens (Claude): $30/mo × 12	2026-04-07 22:06:12.579208+00	\N
165380de-195d-4735-9e18-0974603ea2d9	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	84.0000	Infrastructure > Email (Resend): $7/mo × 12	2026-04-07 22:06:12.589787+00	\N
ae6fea8d-c0be-4589-a2de-e9980c161b39	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	84.0000	Infrastructure > SMS (Twilio): $7/mo × 12	2026-04-07 22:06:12.599776+00	\N
7cb53c91-958b-48b1-8191-e5ccd9363d39	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	144.0000	Infrastructure > CDN + Storage (S3/CF): $12/mo × 12	2026-04-07 22:06:12.610828+00	\N
58336aa6-2de6-494c-adcc-83bef9390b1f	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	84.0000	Infrastructure > Monitoring & Observability: $7/mo × 12	2026-04-07 22:06:12.623051+00	\N
a54deaa5-79ca-430c-a337-a44b3afa41c3	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	204.0000	Infrastructure > Search (Elasticsearch): $17/mo × 12	2026-04-07 22:06:12.636054+00	\N
32d1aa25-fccb-4b95-a10c-595c487898f8	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:12.649083+00	\N
60ebe303-6799-492b-b9d1-61a42c3df2e2	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	250.0000	Compliance & Security > PCI-DSS Compliance: $250/yr	2026-04-07 22:06:12.660954+00	\N
5f7dc81f-fac4-4bb8-b6ee-3034750e8575	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	5000.0000	Compliance & Security > Penetration Testing: $5,000/yr	2026-04-07 22:06:12.672483+00	\N
114b75a1-3ea6-4824-86f0-7f6ba7ba302d	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	25000.0000	Compliance & Security > SOC 2 Type II Audit: $25,000/yr	2026-04-07 22:06:12.684363+00	\N
3d2ea470-be69-4f69-ade0-5cb752a92a26	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:12.696628+00	\N
e1d5c717-84b3-4527-b572-2cb11fed1cfd	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:12.711044+00	\N
b5d03942-5acf-49f0-a261-ed85a48a0c8a	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	2000.0000	Organizational > T3010 charity return: $2,000/yr	2026-04-07 22:06:12.724586+00	\N
4fc3ff97-846a-4439-a25e-29818cc65c89	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	3600.0000	Organizational > Bookkeeping: $3,600/yr	2026-04-07 22:06:12.738656+00	\N
9f0f186c-905e-475b-bf2b-21d94af6220e	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	8000.0000	Organizational > Financial audit: $8,000/yr	2026-04-07 22:06:12.751629+00	\N
82304e93-4106-4e7c-a779-a6770cf013df	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	500.0000	Organizational > General liability insurance: $500/yr	2026-04-07 22:06:12.763204+00	\N
36b96401-24f8-4159-a956-bf8cd2735622	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	2000.0000	Organizational > Cyber insurance: $2,000/yr	2026-04-07 22:06:12.775819+00	\N
f5cffdd9-ada0-4710-a981-1019b0524e1a	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	5000.0000	Organizational > Legal retainer: $5,000/yr	2026-04-07 22:06:12.786787+00	\N
2e481b0e-a706-4c54-919a-c4f7a833aeae	a60b8bdf-e311-4665-8ee1-ff5c3a1849dd	019d49be-61ff-77a0-b8d1-78ceed0afacd	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	72000.0000	Marketing > Organic Marketing: $72,000/yr	2026-04-07 22:06:12.808952+00	GIVING_SEASON_MARKETING
74b530f6-8c73-4f85-b45e-0f34577e8b87	a60b8bdf-e311-4665-8ee1-ff5c3a1849dd	019d49be-61ff-77a0-b8d1-78ceed0afacd	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	164400.0000	Marketing > Paid Media: $164,400/yr	2026-04-07 22:06:12.819338+00	GIVING_SEASON_MARKETING
c207a908-c6e0-4a98-b2c7-fc11f2a00d0a	88f0360f-d9a1-477a-9e63-bbdfc241ad8f	019d49be-61ff-77a0-b8d1-78ceed0afacd	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	13054.0000	Txn fees: 360 donors × 2.8 txns × $370 × 3.5%	2026-04-07 22:06:12.840994+00	GIVING_SEASON
8292adbc-dc47-4666-9cf2-e6ca9be973b2	88f0360f-d9a1-477a-9e63-bbdfc241ad8f	019d49be-61ff-77a0-b8d1-78ceed0afacd	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	9000.0000	SaaS: 10 partners × $900/yr	2026-04-07 22:06:13.858171+00	\N
239b4555-a92b-4e91-947b-0c7b0873ef7d	6fb6a813-f29e-4137-87b5-2fc58c4d2570	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	8508.0000	Payment Processing > Stripe fees: 1,008 txns × (2.2% + $0.30) on $372,960 volume	2026-04-07 22:06:13.873027+00	GIVING_SEASON
71b40316-722d-4d71-8fc7-2121d113aa31	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	1020.0000	Infrastructure > Compute & Hosting: $85/mo × 12	2026-04-07 22:06:13.894112+00	\N
175b4b57-21fd-4e04-bca6-76283ed208ff	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	1200.0000	Infrastructure > PostgreSQL + pgvector: $100/mo × 12	2026-04-07 22:06:13.907334+00	\N
49ceb225-dc9e-44f1-9222-fd70616fbd65	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	420.0000	Infrastructure > Redis Cache: $35/mo × 12	2026-04-07 22:06:13.91707+00	\N
b261dd4f-31a9-4552-8e10-161ee715e3ea	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	660.0000	Infrastructure > Kafka / Event Streaming: $55/mo × 12	2026-04-07 22:06:13.927387+00	\N
60138d9c-4cb4-4299-ae7d-d7ee737e48ec	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	1200.0000	Infrastructure > AI/LLM Tokens (Claude): $100/mo × 12	2026-04-07 22:06:13.93822+00	\N
3650cd8b-fe5c-43e5-a53b-a41097a674f7	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	360.0000	Infrastructure > Email (Resend): $30/mo × 12	2026-04-07 22:06:13.950872+00	\N
9de604b7-61f4-4610-b640-4c6f92e7cc40	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	300.0000	Infrastructure > SMS (Twilio): $25/mo × 12	2026-04-07 22:06:13.961666+00	\N
3e8d8c35-e24f-4a3e-a075-c0e2f33ba2ac	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	420.0000	Infrastructure > CDN + Storage (S3/CF): $35/mo × 12	2026-04-07 22:06:13.971801+00	\N
062a251e-1e40-45ba-8247-c146af689f96	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	360.0000	Infrastructure > Monitoring & Observability: $30/mo × 12	2026-04-07 22:06:13.983008+00	\N
91e39e13-4e56-4b68-8dff-68bda6761caa	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	900.0000	Infrastructure > Search (Elasticsearch): $75/mo × 12	2026-04-07 22:06:13.994452+00	\N
8e5e09e8-9d2e-40aa-98f7-ccde0553b593	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:14.004813+00	\N
7ff17610-d3d4-4a96-9cec-1bb6ba7ddf5e	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:14.01579+00	\N
fde4e433-0fa2-4ff6-97fb-1342d47ea7ef	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	10000.0000	Compliance & Security > Penetration Testing: $10,000/yr	2026-04-07 22:06:14.025926+00	\N
48982120-e2ea-47df-a79e-3251f8432626	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	30000.0000	Compliance & Security > SOC 2 Type II Audit: $30,000/yr	2026-04-07 22:06:14.036815+00	\N
db27f1c7-d455-4e02-8c3d-0ee96d2ae8cc	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:14.048058+00	\N
beacceb2-3757-4054-ac08-a891996c74a1	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:14.059528+00	\N
def6332f-46e5-4f98-88ae-102044ebff91	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	2500.0000	Organizational > T3010 charity return: $2,500/yr	2026-04-07 22:06:14.069587+00	\N
47f2c8c5-7351-4dee-98f1-ca1ff65cfb12	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	6000.0000	Organizational > Bookkeeping: $6,000/yr	2026-04-07 22:06:14.080172+00	\N
aede3bbe-6f10-4c8d-ae2e-4146b830f398	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	10000.0000	Organizational > Financial audit: $10,000/yr	2026-04-07 22:06:14.09036+00	\N
12932741-4039-48e3-b0e9-7cfc19395ac2	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	800.0000	Organizational > General liability insurance: $800/yr	2026-04-07 22:06:14.101345+00	\N
1013d278-8b7e-421f-8023-4ad9bb8df34d	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	3000.0000	Organizational > Cyber insurance: $3,000/yr	2026-04-07 22:06:14.112177+00	\N
5198a469-0544-4006-a82b-0793dff757a5	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	8000.0000	Organizational > Legal retainer: $8,000/yr	2026-04-07 22:06:14.125118+00	\N
76075057-f1b4-4d3d-9107-2d536bf301f6	9e87bcd2-a637-442f-8fa0-7e93175e7989	019d69fb-260d-71df-abd1-028761d5e6c0	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	96000.0000	Marketing > Organic Marketing: $96,000/yr	2026-04-07 22:06:14.145347+00	GIVING_SEASON_MARKETING
d34ef5fb-bcd8-4541-a7ff-e115b371a8c2	9e87bcd2-a637-442f-8fa0-7e93175e7989	019d69fb-260d-71df-abd1-028761d5e6c0	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	226800.0000	Marketing > Paid Media: $226,800/yr	2026-04-07 22:06:14.155606+00	GIVING_SEASON_MARKETING
a9cc5454-2b3c-4c3a-b452-0905f69addfb	0d1a4f9e-ad20-44da-9231-51c7d94438e3	019d69fb-260d-71df-abd1-028761d5e6c0	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	78064.0000	Txn fees: 1600 donors × 3.5 txns × $410 × 3.4%	2026-04-07 22:06:14.174132+00	GIVING_SEASON
12d7dcd6-a68a-4d26-815c-656fdd52fa1a	46bd1737-5291-457a-b448-8dc3c714304d	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	52192.0000	Payment Processing > Stripe fees: 5,600 txns × (2.2% + $0.30) on $2,296,000 volume	2026-04-07 22:06:14.192691+00	GIVING_SEASON
5a644abf-2e8b-4dd3-8446-1a0692cad54d	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	2436.0000	Infrastructure > Compute & Hosting: $203/mo × 12	2026-04-07 22:06:14.210724+00	\N
6aed8166-a4eb-4221-9c57-883bf4e81432	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	2436.0000	Infrastructure > PostgreSQL + pgvector: $203/mo × 12	2026-04-07 22:06:14.219713+00	\N
1104ddbe-b418-4077-a70b-edca1a08374c	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	936.0000	Infrastructure > Redis Cache: $78/mo × 12	2026-04-07 22:06:14.229285+00	\N
ef6aa240-ec9b-46f3-826a-73ddfa30b78f	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	1308.0000	Infrastructure > Kafka / Event Streaming: $109/mo × 12	2026-04-07 22:06:14.237923+00	\N
0de06135-cc2e-4bf9-b0a6-3ef6720df19a	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	2892.0000	Infrastructure > AI/LLM Tokens (Claude): $241/mo × 12	2026-04-07 22:06:14.248465+00	\N
3fda6612-59ad-431b-a553-b1a203e5c99a	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	564.0000	Infrastructure > Email (Resend): $47/mo × 12	2026-04-07 22:06:14.258191+00	\N
c9b8d550-aa31-4c91-85eb-c00faa79b1d9	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	588.0000	Infrastructure > SMS (Twilio): $49/mo × 12	2026-04-07 22:06:14.273203+00	\N
fb18d3ef-cdb7-4102-a003-383f244f1fb4	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	1032.0000	Infrastructure > CDN + Storage (S3/CF): $86/mo × 12	2026-04-07 22:06:14.283275+00	\N
929e45f2-e431-47ab-9532-a52f1741f0e6	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	588.0000	Infrastructure > Monitoring & Observability: $49/mo × 12	2026-04-07 22:06:14.292765+00	\N
cc8e3ab0-e9e7-450e-8ab7-8596f5e05202	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	1908.0000	Infrastructure > Search (Elasticsearch): $159/mo × 12	2026-04-07 22:06:14.305579+00	\N
13bf699a-83e6-407a-91b7-1deb96cce8a3	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:14.315786+00	\N
0e5543da-3a10-41a3-a7db-984b9a7261fc	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:14.325981+00	\N
385856c5-bd9c-44e1-bee9-76df394542dc	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	10000.0000	Compliance & Security > Penetration Testing: $10,000/yr	2026-04-07 22:06:14.335883+00	\N
b24770a2-3547-44bc-a3b5-22e367508641	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	35000.0000	Compliance & Security > SOC 2 Type II Audit: $35,000/yr	2026-04-07 22:06:14.345998+00	\N
ef097b21-3c75-4ace-85c7-c8270cef519d	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:14.356106+00	\N
8752b960-6b5e-41e6-a9d9-4fa4feb949e3	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:14.366773+00	\N
4238238d-2104-43aa-86d1-096f0af7b90a	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	3000.0000	Organizational > T3010 charity return: $3,000/yr	2026-04-07 22:06:14.377299+00	\N
14594985-c778-4bfa-94da-a7037b10501c	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	9600.0000	Organizational > Bookkeeping: $9,600/yr	2026-04-07 22:06:15.387525+00	\N
2e44a6ff-1e98-44b6-abb4-a2d4af6d3160	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	15000.0000	Organizational > Financial audit: $15,000/yr	2026-04-07 22:06:15.396528+00	\N
e9adae00-9f44-409b-8cd8-7e7fbd1c3dce	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	1000.0000	Organizational > General liability insurance: $1,000/yr	2026-04-07 22:06:15.40756+00	\N
158c8b9b-df04-4683-8c8e-1bfd377ba5f2	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	5000.0000	Organizational > Cyber insurance: $5,000/yr	2026-04-07 22:06:15.418151+00	\N
3ecc3851-c6c9-49bf-9d7e-80d6ce934a40	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	10000.0000	Organizational > Legal retainer: $10,000/yr	2026-04-07 22:06:15.428327+00	\N
3b3848ea-935f-4268-8005-20c948ae39f3	ed43bb33-0e5e-4004-8ff8-8f0225fe6ece	019d49be-6213-75dc-9a73-ae7f08e23d71	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	120000.0000	Marketing > Organic Marketing: $120,000/yr	2026-04-07 22:06:15.450518+00	GIVING_SEASON_MARKETING
7ae38a72-969e-4ef6-b358-8a758ed5cfef	ed43bb33-0e5e-4004-8ff8-8f0225fe6ece	019d49be-6213-75dc-9a73-ae7f08e23d71	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	277200.0000	Marketing > Paid Media: $277,200/yr	2026-04-07 22:06:15.460622+00	GIVING_SEASON_MARKETING
e310e66a-5202-442a-b7c7-e06c401d3a46	f16a473a-1566-4ee6-a958-0380cf2a3730	019d49be-6213-75dc-9a73-ae7f08e23d71	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	267300.0000	Txn fees: 4500 donors × 4 txns × $450 × 3.3%	2026-04-07 22:06:15.481039+00	GIVING_SEASON
1ff5c525-b85e-4da3-8dcb-dddef7cb173d	f16a473a-1566-4ee6-a958-0380cf2a3730	019d49be-6213-75dc-9a73-ae7f08e23d71	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	150000.0000	SaaS: 100 partners × $1500/yr	2026-04-07 22:06:15.493744+00	\N
bc5c8d96-884e-4fa9-9a5b-74f3ee514b86	5b6ba174-fadd-4b67-9fd2-f07c5da05379	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	183600.0000	Payment Processing > Stripe fees: 18,000 txns × (2.2% + $0.30) on $8,100,000 volume	2026-04-07 22:06:15.506175+00	GIVING_SEASON
d73ec29e-a030-47c4-befb-6dfc32a70d80	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	4800.0000	Infrastructure > Compute & Hosting: $400/mo × 12	2026-04-07 22:06:15.525707+00	\N
d5757f56-0aaf-4674-8811-bf00166b0532	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	4500.0000	Infrastructure > PostgreSQL + pgvector: $375/mo × 12	2026-04-07 22:06:15.537367+00	\N
975fd6a4-890f-48cf-bf19-2ff7ba3573c0	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	1800.0000	Infrastructure > Redis Cache: $150/mo × 12	2026-04-07 22:06:15.546632+00	\N
e7a4198e-7048-44e2-b415-8cd8411a4f5b	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	2400.0000	Infrastructure > Kafka / Event Streaming: $200/mo × 12	2026-04-07 22:06:15.556183+00	\N
5a4ecb4e-5bb0-4e1d-b73b-f41d3f194781	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	5700.0000	Infrastructure > AI/LLM Tokens (Claude): $475/mo × 12	2026-04-07 22:06:15.565474+00	\N
744baf08-82ce-4850-8af8-32c63c82da2c	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	900.0000	Infrastructure > Email (Resend): $75/mo × 12	2026-04-07 22:06:15.574882+00	\N
5d168e24-e75d-444c-af4f-e42c4451f68f	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	1080.0000	Infrastructure > SMS (Twilio): $90/mo × 12	2026-04-07 22:06:15.584236+00	\N
ee1f9811-cee7-4f03-9ef1-2a45ddbd7b35	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	2040.0000	Infrastructure > CDN + Storage (S3/CF): $170/mo × 12	2026-04-07 22:06:15.595097+00	\N
64614104-f151-45c7-ad28-69166144f17a	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	960.0000	Infrastructure > Monitoring & Observability: $80/mo × 12	2026-04-07 22:06:15.604699+00	\N
0426df85-c969-4314-91e2-8b4db1bae528	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	3600.0000	Infrastructure > Search (Elasticsearch): $300/mo × 12	2026-04-07 22:06:15.6142+00	\N
9292cbdd-daef-439a-a7c6-3afb86d6a77d	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:15.623741+00	\N
ed6d304d-fa06-4ce8-a1f8-0566f141451f	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:15.634793+00	\N
3a4920d6-5843-454a-9890-2af82e06ad7b	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	15000.0000	Compliance & Security > Penetration Testing: $15,000/yr	2026-04-07 22:06:15.644852+00	\N
ccd86220-af3c-4aab-8b6c-9e4a629a8867	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	40000.0000	Compliance & Security > SOC 2 Type II Audit: $40,000/yr	2026-04-07 22:06:15.655009+00	\N
0321ea97-fa5d-46e3-bcdf-3a1ef9840abc	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:15.665755+00	\N
a0498111-6e8b-41c9-ab1e-50cbcb9d7c02	ba325705-983f-4d8c-92c7-994dce1dc82a	019d69fb-260d-71df-abd1-028761d5e6c0	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	60000.0000	CA SaaS: 50 partners × $1200/yr	2026-04-07 22:06:37.234818+00	\N
f019d534-b173-42b9-abb9-07322e7c0e8e	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:15.677319+00	\N
1dffd311-f97d-42cb-8fa7-c1ea3e2aa4c3	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	3500.0000	Organizational > T3010 charity return: $3,500/yr	2026-04-07 22:06:15.689043+00	\N
1c9308c1-da04-4968-8e69-3867d67b1315	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12000.0000	Organizational > Bookkeeping: $12,000/yr	2026-04-07 22:06:15.699504+00	\N
78bb10f2-b19f-4768-9a17-5b5e9fa8d40e	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	20000.0000	Organizational > Financial audit: $20,000/yr	2026-04-07 22:06:15.708985+00	\N
ba47fc47-cb7b-42d1-8e59-31859e1921ff	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	1500.0000	Organizational > General liability insurance: $1,500/yr	2026-04-07 22:06:15.718861+00	\N
8ae0ee75-a38b-4813-a45a-ea8beeefd0f7	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	8000.0000	Organizational > Cyber insurance: $8,000/yr	2026-04-07 22:06:15.727849+00	\N
7c2bf7eb-5dd3-4eaa-a477-efe423faac48	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12000.0000	Organizational > Legal retainer: $12,000/yr	2026-04-07 22:06:15.7379+00	\N
f1ca950e-91c0-4d53-aefd-cc39dfda1e78	7dd829a6-bc91-4267-a7b3-6686294e7a29	019d49be-621b-7306-bb7c-cc9d86263b46	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	138000.0000	Marketing > Organic Marketing: $138,000/yr	2026-04-07 22:06:15.757126+00	GIVING_SEASON_MARKETING
2fc7e53d-c904-44a3-8a03-3027d515955c	7dd829a6-bc91-4267-a7b3-6686294e7a29	019d49be-621b-7306-bb7c-cc9d86263b46	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	333600.0000	Marketing > Paid Media: $333,600/yr	2026-04-07 22:06:15.770145+00	GIVING_SEASON_MARKETING
4c5c183a-d853-4882-a0e1-36a5ca2b681a	910649c3-e475-4883-91af-e4bf27ac759a	019d49be-621b-7306-bb7c-cc9d86263b46	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	887040.0000	Txn fees: 11550 donors × 4.8 txns × $500 × 3.2%	2026-04-07 22:06:15.789587+00	GIVING_SEASON
db52ed3b-b573-4381-af60-ca80cec3dd62	910649c3-e475-4883-91af-e4bf27ac759a	019d49be-621b-7306-bb7c-cc9d86263b46	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	450000.0000	SaaS: 250 partners × $1800/yr	2026-04-07 22:06:15.800805+00	\N
1db8adb6-9f4f-4f67-b208-505bd4640ccb	1f67adf1-dc30-4546-afab-023b6aa3d01a	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	626472.0000	Payment Processing > Stripe fees: 55,440 txns × (2.2% + $0.30) on $27,720,000 volume	2026-04-07 22:06:15.813038+00	GIVING_SEASON
8c7250ba-43b7-48d5-93ae-854c4413daa2	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	528.0000	Infrastructure > Compute & Hosting: $44/mo × 12 (CA+US combined)	2026-04-07 22:06:15.831023+00	\N
0d83c030-ae89-4ef1-9122-a051b82d3485	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	384.0000	Infrastructure > PostgreSQL + pgvector: $32/mo × 12 (CA+US combined)	2026-04-07 22:06:15.84032+00	\N
30b77f12-9df4-47fa-85bc-b8d28c37447e	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	120.0000	Infrastructure > Redis Cache: $10/mo × 12 (CA+US combined)	2026-04-07 22:06:15.849294+00	\N
aec8d0c1-3219-4ddc-9704-bc7685e47b73	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	108.0000	Infrastructure > Kafka / Event Streaming: $9/mo × 12 (CA+US combined)	2026-04-07 22:06:15.85804+00	\N
ea1b05ec-e6ef-4306-99e0-2a29029db285	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	300.0000	Infrastructure > AI/LLM Tokens (Claude): $25/mo × 12 (CA+US combined)	2026-04-07 22:06:15.867288+00	\N
1bd5d621-bec2-45d6-92b1-d79ad9968644	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	60.0000	Infrastructure > Email (Resend): $5/mo × 12 (CA+US combined)	2026-04-07 22:06:15.87595+00	\N
0617be0e-b569-444c-8422-c8f09c737e6c	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	72.0000	Infrastructure > SMS (Twilio): $6/mo × 12 (CA+US combined)	2026-04-07 22:06:15.88566+00	\N
e96608a9-cb4c-4b23-907e-b715fcaf9a8b	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	132.0000	Infrastructure > CDN + Storage (S3/CF): $11/mo × 12 (CA+US combined)	2026-04-07 22:06:16.896929+00	\N
c2c63bc5-5d13-48d4-a989-d3dc66530fa6	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	60.0000	Infrastructure > Monitoring & Observability: $5/mo × 12 (CA+US combined)	2026-04-07 22:06:16.907038+00	\N
2e9af20a-e088-4b1b-8bf4-0a5d8dd5975a	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	156.0000	Infrastructure > Search (Elasticsearch): $13/mo × 12 (CA+US combined)	2026-04-07 22:06:16.919554+00	\N
0cd75f0c-289d-42dc-82cb-037c1f53d1a3	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12 (CA+US combined)	2026-04-07 22:06:16.929401+00	\N
c3836883-5250-4017-8090-413574bb9078	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	250.0000	Compliance & Security > PCI-DSS Compliance: $250/yr	2026-04-07 22:06:16.9388+00	\N
5996a6fa-210d-4386-b7e4-3e45bee9668e	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	5000.0000	Compliance & Security > Penetration Testing: $5,000/yr	2026-04-07 22:06:16.949179+00	\N
5743415d-e482-47e1-8b70-0e87b66b8dc1	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:16.961418+00	\N
ffed24c3-3b50-436e-9469-fd2cd4fd6864	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	12.0000	Organizational (CA) > Annual return (federal): $12/yr	2026-04-07 22:06:16.970902+00	\N
5e8047ee-b2c9-44e3-a8f3-d0acbeccbb42	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	1500.0000	Organizational (CA) > T3010 charity return: $1,500/yr	2026-04-07 22:06:16.978983+00	\N
36d033b6-1abb-444b-aec9-bdae3c272e32	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	2400.0000	Organizational (CA) > Bookkeeping: $2,400/yr	2026-04-07 22:06:16.988106+00	\N
ace5ba7a-af45-4d54-a1c7-7d3353675610	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	500.0000	Organizational (CA) > General liability insurance: $500/yr	2026-04-07 22:06:16.99777+00	\N
162b7e40-55a3-444c-9e3b-89b0df54f3fb	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	1500.0000	Organizational (CA) > Cyber insurance: $1,500/yr	2026-04-07 22:06:17.006711+00	\N
1a9ac2d5-4066-4a67-a4e0-0b27aa9eff61	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	3000.0000	Organizational (CA) > Legal retainer: $3,000/yr	2026-04-07 22:06:17.015438+00	\N
ca3ada0a-804f-4372-bd7a-fad56c41454c	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	3333.0000	Organizational (US) > US state charity registrations: $3,333/yr (8mo)	2026-04-07 22:06:17.023745+00	\N
35f5bbed-b87d-42de-a5c5-ad89cc4db49d	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	6667.0000	Organizational (US) > US legal counsel: $6,667/yr (8mo)	2026-04-07 22:06:17.032062+00	\N
74652999-ebcf-4270-b6a3-a6cdcda35698	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	2000.0000	Organizational (US) > US bookkeeping: $2,000/yr (8mo)	2026-04-07 22:06:17.041138+00	\N
2438249d-417c-465a-b495-435b6eb83ceb	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	1333.0000	Organizational (US) > US D&O / liability insurance: $1,333/yr (8mo)	2026-04-07 22:06:17.04957+00	\N
d45948d4-ea23-4d09-930f-91cfab42e988	ded3baef-3e97-4315-9b3a-c06c7366c6e5	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	6000.0000	Marketing (CA) > Organic Marketing: $6,000/yr	2026-04-07 22:06:17.068915+00	GIVING_SEASON_MARKETING
9abee278-2f17-4449-888c-c0a84f592660	ded3baef-3e97-4315-9b3a-c06c7366c6e5	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	1800.0000	Marketing (CA) > Paid Media: $1,800/yr	2026-04-07 22:06:17.078128+00	GIVING_SEASON_MARKETING
c0001fec-fb33-4b79-94a1-6fb11ec3e217	7a0f7000-a04f-4f75-85d8-8b825fb8a3fe	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	10000.0000	Marketing (US) > Organic Marketing: $10,000/yr (8mo)	2026-04-07 22:06:17.095667+00	GIVING_SEASON_MARKETING
442a0595-7ae4-45d5-9df4-bab82a28befd	7a0f7000-a04f-4f75-85d8-8b825fb8a3fe	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	40000.0000	Marketing (US) > Paid Media: $40,000/yr (8mo)	2026-04-07 22:06:17.105079+00	GIVING_SEASON_MARKETING
0282423b-a5be-4931-8922-8c55016e0e81	65054744-51e6-45c8-8a7e-628ef5535ce0	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	3981.0000	CA Txn fees: 130 donors × 2.5 txns × $350 × 3.5%	2026-04-07 22:06:17.122456+00	GIVING_SEASON
bc681cbe-f08e-40e9-b197-54a587d3985b	65054744-51e6-45c8-8a7e-628ef5535ce0	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	1800.0000	CA SaaS: 3 partners × $600/yr	2026-04-07 22:06:17.131258+00	\N
1a4dc631-76a1-4224-8976-ffd6ae5cf66c	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	2600.0000	Payment Processing (CA) > Stripe fees: 325 txns × (2.2% + $0.30) on $113,750 volume	2026-04-07 22:06:17.140619+00	GIVING_SEASON
01b30b96-d93a-437a-82d9-814fb20408af	65054744-51e6-45c8-8a7e-628ef5535ce0	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	1120.0000	US Txn fees: 96 donors × 1.3 txns × $250 × 3.5% (8mo)	2026-04-07 22:06:17.149897+00	GIVING_SEASON
eb2ec7f4-84d6-4cb9-8875-a63525630a3d	65054744-51e6-45c8-8a7e-628ef5535ce0	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	1000.0000	US SaaS: 3 partners × $500/yr (8mo)	2026-04-07 22:06:17.159648+00	\N
13909dd4-57e9-4ab5-a697-754dee8272ed	0839489d-d4af-4246-8f35-d682bf57d21d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	742.0000	Payment Processing (US) > Stripe fees: 128 txns × (2.2% + $0.30) on $32,000 volume (8mo)	2026-04-07 22:06:17.169068+00	GIVING_SEASON
e9b165ad-9112-48de-8d7a-7f4410b6db9e	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	1680.0000	Infrastructure > Compute & Hosting: $140/mo × 12 (CA+US combined)	2026-04-07 22:06:17.189343+00	\N
03c1bc4b-9994-4f17-85a8-96a8f79e4483	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	1776.0000	Infrastructure > PostgreSQL + pgvector: $148/mo × 12 (CA+US combined)	2026-04-07 22:06:17.199051+00	\N
617319e1-25e1-4d4f-b898-1badfe637b42	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	660.0000	Infrastructure > Redis Cache: $55/mo × 12 (CA+US combined)	2026-04-07 22:06:17.211341+00	\N
74121df1-63a9-4ad2-bda1-58adc2aa4419	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	960.0000	Infrastructure > Kafka / Event Streaming: $80/mo × 12 (CA+US combined)	2026-04-07 22:06:17.223785+00	\N
159faaee-4be9-47db-bc5c-5079784567e8	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	1992.0000	Infrastructure > AI/LLM Tokens (Claude): $166/mo × 12 (CA+US combined)	2026-04-07 22:06:17.235286+00	\N
6760745c-7281-45e6-bed3-8c603c533697	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	456.0000	Infrastructure > Email (Resend): $38/mo × 12 (CA+US combined)	2026-04-07 22:06:17.246292+00	\N
ec9696c4-643b-4829-81f0-f12369625c30	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	432.0000	Infrastructure > SMS (Twilio): $36/mo × 12 (CA+US combined)	2026-04-07 22:06:17.257258+00	\N
51d080bd-8c65-4f14-89e1-8ae3f1a5255c	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	708.0000	Infrastructure > CDN + Storage (S3/CF): $59/mo × 12 (CA+US combined)	2026-04-07 22:06:17.26726+00	\N
92e2f077-4f18-41e9-a6fc-d051952181ca	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	468.0000	Infrastructure > Monitoring & Observability: $39/mo × 12 (CA+US combined)	2026-04-07 22:06:17.278389+00	\N
31e01111-9329-42f8-a272-5ea3d593aa74	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	1368.0000	Infrastructure > Search (Elasticsearch): $114/mo × 12 (CA+US combined)	2026-04-07 22:06:17.290277+00	\N
a5709a91-0398-4079-8d7e-0f168bc76c5c	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12 (CA+US combined)	2026-04-07 22:06:17.300226+00	\N
acbb71c7-cf91-4c0f-af3b-457f42362829	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	250.0000	Compliance & Security > PCI-DSS Compliance: $250/yr	2026-04-07 22:06:17.310076+00	\N
f40e068b-0913-41d6-9d1c-374ae410177c	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	5000.0000	Compliance & Security > Penetration Testing: $5,000/yr	2026-04-07 22:06:17.319509+00	\N
acd6ac14-4a25-457c-a4c7-f6f1c9e2a840	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	25000.0000	Compliance & Security > SOC 2 Type II Audit: $25,000/yr	2026-04-07 22:06:17.328663+00	\N
778e6011-f748-4266-bd2e-4e703185aed3	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:17.338167+00	\N
e7ab271b-2fd0-45d4-a273-ca286adbb4b9	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	12.0000	Organizational (CA) > Annual return (federal): $12/yr	2026-04-07 22:06:17.347289+00	\N
d291b4c9-8574-425a-a589-3a8276e4754d	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	2000.0000	Organizational (CA) > T3010 charity return: $2,000/yr	2026-04-07 22:06:17.357091+00	\N
b8f39e89-02e4-4c2a-8c75-38c25d49777a	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	3600.0000	Organizational (CA) > Bookkeeping: $3,600/yr	2026-04-07 22:06:17.365704+00	\N
67436fd0-c8b5-4965-bfc4-3944e8a9e0af	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	8000.0000	Organizational (CA) > Financial audit: $8,000/yr	2026-04-07 22:06:17.376675+00	\N
3765d1cb-3a0e-4b91-8777-6eef0ac91745	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	500.0000	Organizational (CA) > General liability insurance: $500/yr	2026-04-07 22:06:18.386705+00	\N
a87de1bc-186e-4232-8916-1b39f2284fdc	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	2000.0000	Organizational (CA) > Cyber insurance: $2,000/yr	2026-04-07 22:06:18.396561+00	\N
27e50dac-a1f2-4740-8372-f9a453f28eaf	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	5000.0000	Organizational (CA) > Legal retainer: $5,000/yr	2026-04-07 22:06:18.408443+00	\N
a3091987-5183-4688-a48c-436aef2de28d	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	8000.0000	Organizational (US) > US state charity registrations: $8,000/yr	2026-04-07 22:06:18.419216+00	\N
e289804f-fb17-4ee4-9d00-c7c9ffc818d6	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	15000.0000	Organizational (US) > US legal counsel: $15,000/yr	2026-04-07 22:06:18.428401+00	\N
137709bc-5dcf-4aa4-8ece-dc6fa5640323	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	3500.0000	Organizational (US) > Form 990 preparation: $3,500/yr	2026-04-07 22:06:18.437224+00	\N
93769b36-de87-47af-a2c1-489c7d8c1270	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	6000.0000	Organizational (US) > US bookkeeping: $6,000/yr	2026-04-07 22:06:18.446096+00	\N
77bf980b-b303-49f8-9b9b-58280dca7719	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	3000.0000	Organizational (US) > US D&O / liability insurance: $3,000/yr	2026-04-07 22:06:18.454497+00	\N
4f5edb57-a535-44ea-a717-3fafe8b265cd	57890d0c-ee1c-477f-bf47-4bd28bd3df4b	019d49be-61ff-77a0-b8d1-78ceed0afacd	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	12000.0000	Marketing (CA) > Organic Marketing: $12,000/yr	2026-04-07 22:06:18.470755+00	GIVING_SEASON_MARKETING
82adce29-02d1-466b-9dfc-35abf538f8db	57890d0c-ee1c-477f-bf47-4bd28bd3df4b	019d49be-61ff-77a0-b8d1-78ceed0afacd	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	4600.0000	Marketing (CA) > Paid Media: $4,600/yr	2026-04-07 22:06:18.479573+00	GIVING_SEASON_MARKETING
a032a150-3628-4e2c-8a9c-d4579551f977	87b2dc18-a533-4a9a-86b9-fa4076effae8	019d49be-61ff-77a0-b8d1-78ceed0afacd	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	36000.0000	Marketing (US) > Organic Marketing: $36,000/yr	2026-04-07 22:06:18.496545+00	GIVING_SEASON_MARKETING
7d02f2f2-6d19-4b5f-8a21-97d68fdc711a	87b2dc18-a533-4a9a-86b9-fa4076effae8	019d49be-61ff-77a0-b8d1-78ceed0afacd	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	150000.0000	Marketing (US) > Paid Media: $150,000/yr	2026-04-07 22:06:18.504823+00	GIVING_SEASON_MARKETING
47d028ed-cebd-41f7-9de1-974b8e8ef9c4	a3e3c7c2-176f-41a6-9d8f-732e2c85d1a3	019d49be-61ff-77a0-b8d1-78ceed0afacd	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	30576.0000	CA Txn fees: 700 donors × 3.2 txns × $390 × 3.5%	2026-04-07 22:06:18.521714+00	GIVING_SEASON
dce744e2-60bf-4a6a-921b-3dfcebcf9138	a3e3c7c2-176f-41a6-9d8f-732e2c85d1a3	019d49be-61ff-77a0-b8d1-78ceed0afacd	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	13500.0000	CA SaaS: 15 partners × $900/yr	2026-04-07 22:06:18.529953+00	\N
48340839-402d-4e3a-a0ef-12e1cc90aa88	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	19891.0000	Payment Processing (CA) > Stripe fees: 2,240 txns × (2.2% + $0.30) on $873,600 volume	2026-04-07 22:06:18.537804+00	GIVING_SEASON
f36b5085-8695-48d7-acf6-68ee300db180	a3e3c7c2-176f-41a6-9d8f-732e2c85d1a3	019d49be-61ff-77a0-b8d1-78ceed0afacd	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	36221.0000	US Txn fees: 1320 donors × 2.8 txns × $280 × 3.5%	2026-04-07 22:06:18.545648+00	GIVING_SEASON
078a0c82-5f1e-4190-af64-90d05b0b45a9	a3e3c7c2-176f-41a6-9d8f-732e2c85d1a3	019d49be-61ff-77a0-b8d1-78ceed0afacd	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	20000.0000	US SaaS: 25 partners × $800/yr	2026-04-07 22:06:18.553745+00	\N
1afc9988-821e-4beb-83ad-8e071594dcba	5a93c8a1-f363-4246-8d40-daee0a0c31e3	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	23876.0000	Payment Processing (US) > Stripe fees: 3,696 txns × (2.2% + $0.30) on $1,034,880 volume	2026-04-07 22:06:18.562489+00	GIVING_SEASON
9c4c9632-fe47-4c61-b76d-b96a9af5f7fe	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	4956.0000	Infrastructure > Compute & Hosting: $413/mo × 12 (CA+US combined)	2026-04-07 22:06:18.577864+00	\N
77d7a300-5264-4acf-b6ac-e60889ef1e5f	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	4752.0000	Infrastructure > PostgreSQL + pgvector: $396/mo × 12 (CA+US combined)	2026-04-07 22:06:18.586689+00	\N
cf375d55-f15a-4382-a233-424819d29efc	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	1836.0000	Infrastructure > Redis Cache: $153/mo × 12 (CA+US combined)	2026-04-07 22:06:18.596151+00	\N
97b544f0-6fd2-49d1-a877-c1fbc4ad0fc6	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	2592.0000	Infrastructure > Kafka / Event Streaming: $216/mo × 12 (CA+US combined)	2026-04-07 22:06:18.604593+00	\N
5ddcbdc2-e2b8-44d6-9ed4-3f20708669bb	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	6156.0000	Infrastructure > AI/LLM Tokens (Claude): $513/mo × 12 (CA+US combined)	2026-04-07 22:06:18.614684+00	\N
0b1a48cd-1d28-4944-8e60-fa5aa333e0bf	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	960.0000	Infrastructure > Email (Resend): $80/mo × 12 (CA+US combined)	2026-04-07 22:06:18.623789+00	\N
872d9413-159e-4713-af3c-d82cdff22bb6	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	1164.0000	Infrastructure > SMS (Twilio): $97/mo × 12 (CA+US combined)	2026-04-07 22:06:18.63346+00	\N
ae913186-7c0d-47c5-9d83-0bcc8a788ae3	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	2124.0000	Infrastructure > CDN + Storage (S3/CF): $177/mo × 12 (CA+US combined)	2026-04-07 22:06:18.6436+00	\N
116408d0-d766-4a55-874d-e79b8ce406b0	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	984.0000	Infrastructure > Monitoring & Observability: $82/mo × 12 (CA+US combined)	2026-04-07 22:06:18.653314+00	\N
ee5743be-804a-4822-9556-7ad0aebcf978	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	3696.0000	Infrastructure > Search (Elasticsearch): $308/mo × 12 (CA+US combined)	2026-04-07 22:06:18.661715+00	\N
d5b248f9-eeef-48c5-83a2-a30f2e06bb97	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12 (CA+US combined)	2026-04-07 22:06:18.672202+00	\N
ece94e73-ff08-4d99-b17f-1a26a6d37953	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:18.682836+00	\N
2e35e303-f0ae-4c73-b9ae-013652425404	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	10000.0000	Compliance & Security > Penetration Testing: $10,000/yr	2026-04-07 22:06:18.692854+00	\N
ab5dba49-8f40-4122-85b7-8fd09899e4a3	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	30000.0000	Compliance & Security > SOC 2 Type II Audit: $30,000/yr	2026-04-07 22:06:18.702254+00	\N
fffbc0a2-02bc-4737-980d-ceb0f2283cc5	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:18.711676+00	\N
a1dc61b5-05c3-4f9c-b278-e6dc57461c08	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	12.0000	Organizational (CA) > Annual return (federal): $12/yr	2026-04-07 22:06:18.721024+00	\N
21fa2bc6-f8ba-4d32-948f-419f3cb4b07c	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	2500.0000	Organizational (CA) > T3010 charity return: $2,500/yr	2026-04-07 22:06:18.731393+00	\N
e4214459-c9e8-4162-83e8-42d2cb651b37	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	6000.0000	Organizational (CA) > Bookkeeping: $6,000/yr	2026-04-07 22:06:18.74112+00	\N
6e77c87c-8b3f-48da-bc64-faf51484cc24	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	10000.0000	Organizational (CA) > Financial audit: $10,000/yr	2026-04-07 22:06:18.750164+00	\N
6531576b-c9b8-46fd-b6c7-aa3c790a8606	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	800.0000	Organizational (CA) > General liability insurance: $800/yr	2026-04-07 22:06:18.758196+00	\N
3911eb96-5999-45ca-95ff-f00b807c3ac4	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	3000.0000	Organizational (CA) > Cyber insurance: $3,000/yr	2026-04-07 22:06:18.766919+00	\N
2e0569f5-5b2c-4894-b479-d73bd013d648	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	8000.0000	Organizational (CA) > Legal retainer: $8,000/yr	2026-04-07 22:06:18.7766+00	\N
579b2e4b-9bfb-4323-9083-09cc1b0b1250	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	12000.0000	Organizational (US) > US state charity registrations: $12,000/yr	2026-04-07 22:06:18.784774+00	\N
e7397488-ccd1-486d-b115-81b47906203c	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	20000.0000	Organizational (US) > US legal counsel: $20,000/yr	2026-04-07 22:06:18.792681+00	\N
b6d0cfbe-888a-45f6-911e-f4244efa8cb7	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	5000.0000	Organizational (US) > Form 990 preparation: $5,000/yr	2026-04-07 22:06:18.802572+00	\N
91b03355-7b71-4281-8b79-57f652e08b82	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	9000.0000	Organizational (US) > US bookkeeping: $9,000/yr	2026-04-07 22:06:18.81098+00	\N
db119cc3-3269-43f0-8edb-791afa5a63de	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	5000.0000	Organizational (US) > US D&O / liability insurance: $5,000/yr	2026-04-07 22:06:18.81898+00	\N
73f2e64c-7ef4-4132-9c96-340ea5499069	a2374507-4809-4328-96ba-b68765fada0f	019d69fb-260d-71df-abd1-028761d5e6c0	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	18000.0000	Marketing (CA) > Organic Marketing: $18,000/yr	2026-04-07 22:06:19.837908+00	GIVING_SEASON_MARKETING
589e267f-7342-4409-985d-542f04206468	a2374507-4809-4328-96ba-b68765fada0f	019d69fb-260d-71df-abd1-028761d5e6c0	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	53000.0000	Marketing (CA) > Paid Media: $53,000/yr	2026-04-07 22:06:19.84998+00	GIVING_SEASON_MARKETING
0c06784f-374f-452b-be39-4a79ab5b31cc	f2f9ca06-65bb-43f8-8d12-3edccdbac204	019d69fb-260d-71df-abd1-028761d5e6c0	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	60000.0000	Marketing (US) > Organic Marketing: $60,000/yr	2026-04-07 22:06:19.886023+00	GIVING_SEASON_MARKETING
7daf8660-f8c6-4a4a-bb2e-75d0d3f6bea2	f2f9ca06-65bb-43f8-8d12-3edccdbac204	019d69fb-260d-71df-abd1-028761d5e6c0	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	240000.0000	Marketing (US) > Paid Media: $240,000/yr	2026-04-07 22:06:19.895571+00	GIVING_SEASON_MARKETING
d3c19ffe-7547-4f3d-9b6e-fe2501acca0d	cbc9a3c4-5ec2-4fa8-9b67-964a7a374dc5	019d69fb-260d-71df-abd1-028761d5e6c0	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	129148.0000	CA Txn fees: 2380 donors × 3.8 txns × $420 × 3.4%	2026-04-07 22:06:19.932551+00	GIVING_SEASON
9a493881-2ac5-4a4e-a134-d3414644ed80	cbc9a3c4-5ec2-4fa8-9b67-964a7a374dc5	019d69fb-260d-71df-abd1-028761d5e6c0	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	60000.0000	CA SaaS: 50 partners × $1200/yr	2026-04-07 22:06:19.942446+00	\N
4993f651-f898-403b-82cf-b85cde3e30f7	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	86280.0000	Payment Processing (CA) > Stripe fees: 9,044 txns × (2.2% + $0.30) on $3,798,480 volume	2026-04-07 22:06:19.951738+00	GIVING_SEASON
3a3b22d0-efbd-45fa-8dbb-8dcec211d1ae	cbc9a3c4-5ec2-4fa8-9b67-964a7a374dc5	019d69fb-260d-71df-abd1-028761d5e6c0	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	188877.0000	US Txn fees: 5600 donors × 3.2 txns × $310 × 3.4%	2026-04-07 22:06:19.960127+00	GIVING_SEASON
ab890664-090c-41a3-822d-513879e53ed0	cbc9a3c4-5ec2-4fa8-9b67-964a7a374dc5	019d69fb-260d-71df-abd1-028761d5e6c0	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	88000.0000	US SaaS: 80 partners × $1100/yr	2026-04-07 22:06:19.968789+00	\N
e86755a4-b175-4e98-b0cd-da38da7dbe4c	7e2e4620-0896-4371-96f1-84e63fae2253	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	127590.0000	Payment Processing (US) > Stripe fees: 17,920 txns × (2.2% + $0.30) on $5,555,200 volume	2026-04-07 22:06:19.978526+00	GIVING_SEASON
0fd6d33f-323a-49f3-bf28-918c47af09fc	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	7728.0000	Infrastructure > Compute & Hosting: $644/mo × 12 (CA+US combined)	2026-04-07 22:06:19.994904+00	\N
ba030cf9-3240-433e-a18a-49b609d39f2e	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	9108.0000	Infrastructure > PostgreSQL + pgvector: $759/mo × 12 (CA+US combined)	2026-04-07 22:06:20.003584+00	\N
dba3da4b-3f65-440e-965f-b2398d03b5cf	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	2472.0000	Infrastructure > Redis Cache: $206/mo × 12 (CA+US combined)	2026-04-07 22:06:20.012445+00	\N
ec5b15aa-4378-403b-8ce4-78f4f48d8729	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	6000.0000	Infrastructure > Kafka / Event Streaming: $500/mo × 12 (CA+US combined)	2026-04-07 22:06:20.021269+00	\N
8c559d02-7444-4bf9-a3c6-924260e86e1a	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	14136.0000	Infrastructure > AI/LLM Tokens (Claude): $1178/mo × 12 (CA+US combined)	2026-04-07 22:06:20.030226+00	\N
4f0ef461-a21d-456d-93f1-86787de1fbd7	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	1908.0000	Infrastructure > Email (Resend): $159/mo × 12 (CA+US combined)	2026-04-07 22:06:20.040068+00	\N
b53e3fa8-db6a-4c20-8cce-1594c38f381d	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	2700.0000	Infrastructure > SMS (Twilio): $225/mo × 12 (CA+US combined)	2026-04-07 22:06:20.04867+00	\N
9bbd36dc-aa80-4297-a5e0-d120bc2e12c9	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	3528.0000	Infrastructure > CDN + Storage (S3/CF): $294/mo × 12 (CA+US combined)	2026-04-07 22:06:20.057404+00	\N
9a8e2ce9-719c-4dba-b5ab-44a01c4b728b	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	1500.0000	Infrastructure > Monitoring & Observability: $125/mo × 12 (CA+US combined)	2026-04-07 22:06:20.066122+00	\N
07f8bfbf-07fb-4154-8ab5-8b39eddf6591	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	5400.0000	Infrastructure > Search (Elasticsearch): $450/mo × 12 (CA+US combined)	2026-04-07 22:06:20.074463+00	\N
9e881785-3853-4a82-9a35-f12268600719	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12 (CA+US combined)	2026-04-07 22:06:20.082537+00	\N
bbdb761a-7750-428a-9f01-7f0a03283173	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:20.090512+00	\N
e7a7fb0d-d3f2-4884-9f66-c83a0ea2abc7	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	10000.0000	Compliance & Security > Penetration Testing: $10,000/yr	2026-04-07 22:06:20.097748+00	\N
c572f0f7-dce6-4c9d-8c83-ccd69f2c54fc	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	35000.0000	Compliance & Security > SOC 2 Type II Audit: $35,000/yr	2026-04-07 22:06:20.106683+00	\N
8c918b5f-e6a0-4d4d-b830-8fdceb264f3b	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:20.117705+00	\N
2f6c2892-6514-435d-ba5c-52f80149fbd4	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	12.0000	Organizational (CA) > Annual return (federal): $12/yr	2026-04-07 22:06:20.126652+00	\N
c6167000-dbb5-4c5f-8ef5-ab348e6e5917	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	3000.0000	Organizational (CA) > T3010 charity return: $3,000/yr	2026-04-07 22:06:20.135507+00	\N
432bd027-8331-44df-b281-328f0a6db14d	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	9600.0000	Organizational (CA) > Bookkeeping: $9,600/yr	2026-04-07 22:06:20.144331+00	\N
d188bcb5-822c-4af9-8b7d-22fb223115b4	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	15000.0000	Organizational (CA) > Financial audit: $15,000/yr	2026-04-07 22:06:20.153926+00	\N
5a29d88f-c936-4074-b3dd-4dac49412ce7	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	1000.0000	Organizational (CA) > General liability insurance: $1,000/yr	2026-04-07 22:06:20.163656+00	\N
163892fc-8993-4425-b215-41fbc1a0f786	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	5000.0000	Organizational (CA) > Cyber insurance: $5,000/yr	2026-04-07 22:06:20.172814+00	\N
816fdc0d-a585-45f9-9649-9e1b288904a9	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	10000.0000	Organizational (CA) > Legal retainer: $10,000/yr	2026-04-07 22:06:20.180487+00	\N
c77cd292-63cc-4a1c-a0fe-d8f17d75e7f9	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	15000.0000	Organizational (US) > US state charity registrations: $15,000/yr	2026-04-07 22:06:20.189063+00	\N
5b4ccece-8646-445c-97f0-957d03913d97	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	25000.0000	Organizational (US) > US legal counsel: $25,000/yr	2026-04-07 22:06:20.196789+00	\N
cdf9194b-4497-42a2-8221-414d9bc57415	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	7500.0000	Organizational (US) > Form 990 preparation: $7,500/yr	2026-04-07 22:06:20.205436+00	\N
7a7f1b47-6e4e-47aa-a705-c0cbf2bb129a	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	12000.0000	Organizational (US) > US bookkeeping: $12,000/yr	2026-04-07 22:06:20.214511+00	\N
2fb26fa0-a770-4cf8-9d5b-0e55bd29a58f	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	8000.0000	Organizational (US) > US D&O / liability insurance: $8,000/yr	2026-04-07 22:06:20.223254+00	\N
1e133da9-fab3-47d0-84cf-918f8fb092c7	3aea5a9f-b919-4be9-a1cd-4988af10b7ae	019d49be-6213-75dc-9a73-ae7f08e23d71	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	24000.0000	Marketing (CA) > Organic Marketing: $24,000/yr	2026-04-07 22:06:20.241346+00	GIVING_SEASON_MARKETING
913cfe41-73b3-4cf0-a41e-4230b1b2169f	3aea5a9f-b919-4be9-a1cd-4988af10b7ae	019d49be-6213-75dc-9a73-ae7f08e23d71	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	100400.0000	Marketing (CA) > Paid Media: $100,400/yr	2026-04-07 22:06:20.251003+00	GIVING_SEASON_MARKETING
9fb94b4c-a591-469b-8acc-ed74076df970	8f4070a4-69fd-41b6-96cc-421ea745d789	019d49be-6213-75dc-9a73-ae7f08e23d71	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	84000.0000	Marketing (US) > Organic Marketing: $84,000/yr	2026-04-07 22:06:20.269612+00	GIVING_SEASON_MARKETING
40f57948-43b4-401b-a399-26a69d3f971a	8f4070a4-69fd-41b6-96cc-421ea745d789	019d49be-6213-75dc-9a73-ae7f08e23d71	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	320000.0000	Marketing (US) > Paid Media: $320,000/yr	2026-04-07 22:06:20.277405+00	GIVING_SEASON_MARKETING
8e2625b9-0ce3-4a55-9249-bec637d20d98	90dc6e87-1cd7-4371-bc8c-33f1ee3a4b53	019d49be-6213-75dc-9a73-ae7f08e23d71	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	363409.0000	CA Txn fees: 5700 donors × 4.2 txns × $460 × 3.3%	2026-04-07 22:06:20.292743+00	GIVING_SEASON
7c31277f-b373-4054-9fc2-705ee6754278	90dc6e87-1cd7-4371-bc8c-33f1ee3a4b53	019d49be-6213-75dc-9a73-ae7f08e23d71	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	180000.0000	CA SaaS: 120 partners × $1500/yr	2026-04-07 22:06:20.301864+00	\N
65266a91-c4f4-4f75-8ec2-947cbfa1e351	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	249455.0000	Payment Processing (CA) > Stripe fees: 23,940 txns × (2.2% + $0.30) on $11,012,400 volume	2026-04-07 22:06:20.310175+00	GIVING_SEASON
615935a6-f7f6-4db3-8080-e207ff552781	90dc6e87-1cd7-4371-bc8c-33f1ee3a4b53	019d49be-6213-75dc-9a73-ae7f08e23d71	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	708824.0000	US Txn fees: 16150 donors × 3.8 txns × $350 × 3.3%	2026-04-07 22:06:21.319877+00	GIVING_SEASON
ad9ed3aa-5d28-4aeb-9375-873110388e8f	90dc6e87-1cd7-4371-bc8c-33f1ee3a4b53	019d49be-6213-75dc-9a73-ae7f08e23d71	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	252000.0000	US SaaS: 180 partners × $1400/yr	2026-04-07 22:06:21.328629+00	\N
bd904eaf-33d5-42ef-a9b5-83027d302ae1	bc9cbd1e-9389-44c1-8888-fde537d34e0f	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	490960.0000	Payment Processing (US) > Stripe fees: 61,370 txns × (2.2% + $0.30) on $21,479,500 volume	2026-04-07 22:06:21.336548+00	GIVING_SEASON
70910765-ae83-43e0-8c12-78534acc2b18	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	12600.0000	Infrastructure > Compute & Hosting: $1050/mo × 12 (CA+US combined)	2026-04-07 22:06:21.358739+00	\N
83f99062-01c0-416e-b159-29d4a55c68dd	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	16800.0000	Infrastructure > PostgreSQL + pgvector: $1400/mo × 12 (CA+US combined)	2026-04-07 22:06:21.36967+00	\N
65b2ea92-509d-4f2c-8bee-8955429b4e5d	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	3600.0000	Infrastructure > Redis Cache: $300/mo × 12 (CA+US combined)	2026-04-07 22:06:21.380639+00	\N
e3337eab-48cc-4504-9881-8549fac47053	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	12000.0000	Infrastructure > Kafka / Event Streaming: $1000/mo × 12 (CA+US combined)	2026-04-07 22:06:21.390025+00	\N
586f4c50-eec5-4cd3-bbe8-87eea3fec037	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	28200.0000	Infrastructure > AI/LLM Tokens (Claude): $2350/mo × 12 (CA+US combined)	2026-04-07 22:06:21.399702+00	\N
1ddc5e91-672d-48fd-8d14-7788edf5d441	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	3600.0000	Infrastructure > Email (Resend): $300/mo × 12 (CA+US combined)	2026-04-07 22:06:21.409402+00	\N
7929c21f-5434-47bc-b1dc-611901339e4f	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	5400.0000	Infrastructure > SMS (Twilio): $450/mo × 12 (CA+US combined)	2026-04-07 22:06:21.418246+00	\N
5d2e0540-2689-4f91-8484-6460f6cf4f93	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	6000.0000	Infrastructure > CDN + Storage (S3/CF): $500/mo × 12 (CA+US combined)	2026-04-07 22:06:21.427472+00	\N
0a15176c-33cb-4926-8303-e7d3c465ed0c	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	2400.0000	Infrastructure > Monitoring & Observability: $200/mo × 12 (CA+US combined)	2026-04-07 22:06:21.435684+00	\N
f5d34435-1d74-4b67-94ba-cad71f188b5d	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	8400.0000	Infrastructure > Search (Elasticsearch): $700/mo × 12 (CA+US combined)	2026-04-07 22:06:21.444536+00	\N
26056d37-74eb-4132-8130-79f23c2d89f5	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12 (CA+US combined)	2026-04-07 22:06:21.452964+00	\N
23c165d1-f647-4630-a5ea-af19591353fc	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:21.462301+00	\N
5131ce88-f08b-41a4-a4ff-1c48afe2329c	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	15000.0000	Compliance & Security > Penetration Testing: $15,000/yr	2026-04-07 22:06:21.471631+00	\N
a5dca6de-64ed-45d7-8886-74f4e03f436c	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	40000.0000	Compliance & Security > SOC 2 Type II Audit: $40,000/yr	2026-04-07 22:06:21.481084+00	\N
60725b32-7193-4f47-90cb-82cd91d11db3	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:21.489595+00	\N
e29f0268-5dc3-40fd-b378-79823ddfa9de	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12.0000	Organizational (CA) > Annual return (federal): $12/yr	2026-04-07 22:06:21.49982+00	\N
333077e2-2f6d-4f15-86f6-a105c8c39bf3	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	3500.0000	Organizational (CA) > T3010 charity return: $3,500/yr	2026-04-07 22:06:21.509707+00	\N
c67c2aae-1f91-4a83-9c5c-3f920aba319e	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12000.0000	Organizational (CA) > Bookkeeping: $12,000/yr	2026-04-07 22:06:21.520333+00	\N
548e5f89-1f0e-4fb8-b7da-277f0de28324	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	20000.0000	Organizational (CA) > Financial audit: $20,000/yr	2026-04-07 22:06:21.530956+00	\N
809651c4-a0ba-49c7-a5ef-763a49bf0401	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	1500.0000	Organizational (CA) > General liability insurance: $1,500/yr	2026-04-07 22:06:21.541598+00	\N
d6873b52-acd8-425f-a99d-dca205e9ac42	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	8000.0000	Organizational (CA) > Cyber insurance: $8,000/yr	2026-04-07 22:06:21.554527+00	\N
5377524d-ee55-4385-a1d0-8c31aaf28e3e	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12000.0000	Organizational (CA) > Legal retainer: $12,000/yr	2026-04-07 22:06:21.563547+00	\N
3e0b614f-ac99-4596-851b-6dd52adf2213	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	18000.0000	Organizational (US) > US state charity registrations: $18,000/yr	2026-04-07 22:06:21.571973+00	\N
54ad872d-04ce-4b1b-80a8-e67eeb9dd593	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	30000.0000	Organizational (US) > US legal counsel: $30,000/yr	2026-04-07 22:06:21.57994+00	\N
2a204a45-8279-47b8-b5d9-dd0d1c2af34e	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	10000.0000	Organizational (US) > Form 990 preparation: $10,000/yr	2026-04-07 22:06:21.588901+00	\N
f7046f2c-5bd9-4221-8fb2-8dad94d7add9	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	15000.0000	Organizational (US) > US bookkeeping: $15,000/yr	2026-04-07 22:06:21.597436+00	\N
da9a3d6c-5f4f-44f2-805d-e1b6c8784839	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12000.0000	Organizational (US) > US D&O / liability insurance: $12,000/yr	2026-04-07 22:06:21.605378+00	\N
728179a4-c479-4064-90d7-14bf5da2951f	19b33e69-f820-4d02-bc4a-85f5de781f34	019d49be-621b-7306-bb7c-cc9d86263b46	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	30000.0000	Marketing (CA) > Organic Marketing: $30,000/yr	2026-04-07 22:06:21.619686+00	GIVING_SEASON_MARKETING
746ae1c9-e5f4-4140-8671-3ffc4a90390d	19b33e69-f820-4d02-bc4a-85f5de781f34	019d49be-621b-7306-bb7c-cc9d86263b46	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	148800.0000	Marketing (CA) > Paid Media: $148,800/yr	2026-04-07 22:06:21.627677+00	GIVING_SEASON_MARKETING
8833b445-4a8d-4689-9e8a-b04963935cf7	d5103797-fddd-4e71-b593-e7877c645a74	019d49be-621b-7306-bb7c-cc9d86263b46	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	108000.0000	Marketing (US) > Organic Marketing: $108,000/yr	2026-04-07 22:06:21.64306+00	GIVING_SEASON_MARKETING
2f31b292-56f9-4b06-a16f-3df047358153	d5103797-fddd-4e71-b593-e7877c645a74	019d49be-621b-7306-bb7c-cc9d86263b46	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	400000.0000	Marketing (US) > Paid Media: $400,000/yr	2026-04-07 22:06:21.650736+00	GIVING_SEASON_MARKETING
a9b57e80-2a80-4ba6-93ba-e75bae7d8411	942a9397-68db-47fa-a7c1-c4b28fb0fd19	019d49be-621b-7306-bb7c-cc9d86263b46	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	887040.0000	CA Txn fees: 11550 donors × 4.8 txns × $500 × 3.2%	2026-04-07 22:06:21.665818+00	GIVING_SEASON
ade2e774-e024-4712-a67f-a8433dc66887	942a9397-68db-47fa-a7c1-c4b28fb0fd19	019d49be-621b-7306-bb7c-cc9d86263b46	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	450000.0000	CA SaaS: 250 partners × $1800/yr	2026-04-07 22:06:21.676663+00	\N
df8df5af-385c-405b-aaab-5233c9ea1004	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	626472.0000	Payment Processing (CA) > Stripe fees: 55,440 txns × (2.2% + $0.30) on $27,720,000 volume	2026-04-07 22:06:21.684687+00	GIVING_SEASON
c3ad09c9-df14-43b1-82f0-cf2fc36aa89b	942a9397-68db-47fa-a7c1-c4b28fb0fd19	019d49be-621b-7306-bb7c-cc9d86263b46	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	2188800.0000	US Txn fees: 38000 donors × 4.5 txns × $400 × 3.2%	2026-04-07 22:06:21.693072+00	GIVING_SEASON
015c0020-bfc5-4d5a-bd9d-dfac743fed9a	942a9397-68db-47fa-a7c1-c4b28fb0fd19	019d49be-621b-7306-bb7c-cc9d86263b46	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	680000.0000	US SaaS: 400 partners × $1700/yr	2026-04-07 22:06:21.700834+00	\N
9d31d5bc-589e-49da-aee7-634938e4eb05	473c3a49-ecda-4879-9d3c-26425d568304	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	1556100.0000	Payment Processing (US) > Stripe fees: 171,000 txns × (2.2% + $0.30) on $68,400,000 volume	2026-04-07 22:06:21.708676+00	GIVING_SEASON
058999e1-72f5-4ae0-9d6f-01ea7dec7285	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	420.0000	Infrastructure > Compute & Hosting: $35/mo × 12	2026-04-07 22:06:25.361637+00	\N
581418cb-b167-4d87-957b-692413df93ea	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	216.0000	Infrastructure > PostgreSQL + pgvector: $18/mo × 12	2026-04-07 22:06:25.401697+00	\N
07ff9750-fad1-4f94-a48e-695efe363e49	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	60.0000	Infrastructure > Redis Cache: $5/mo × 12	2026-04-07 22:06:25.410977+00	\N
a122983d-0dfa-433a-84d3-50ca14dc1134	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	120.0000	Infrastructure > AI/LLM Tokens (Claude): $10/mo × 12	2026-04-07 22:06:25.42082+00	\N
37df7f54-8032-47bd-a315-545238172b28	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	24.0000	Infrastructure > SMS (Twilio): $2/mo × 12	2026-04-07 22:06:25.430214+00	\N
b4cb2a43-aeca-46d4-9e97-0d9667b002cc	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	72.0000	Infrastructure > CDN + Storage (S3/CF): $6/mo × 12	2026-04-07 22:06:25.442345+00	\N
e789da3f-b83a-40cd-9fb9-34bc54f401c0	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:25.45247+00	\N
24f78fbc-bfdd-4421-9f5f-e56b6216d7b2	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	250.0000	Compliance & Security > PCI-DSS Compliance: $250/yr	2026-04-07 22:06:25.465023+00	\N
428c24ed-d65c-4b5b-8d6e-c06887dfd415	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	5000.0000	Compliance & Security > Penetration Testing: $5,000/yr	2026-04-07 22:06:25.475983+00	\N
fa3d5ca2-f67b-476b-9e86-bec2a42742f9	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:25.48557+00	\N
84ac5d7f-79fd-4b95-ba48-89511d7cdd17	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:25.495286+00	\N
0b40cf9e-c180-46be-994c-95ceeb696825	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	1500.0000	Organizational > T3010 charity return: $1,500/yr	2026-04-07 22:06:25.505599+00	\N
bc7b7345-5b1d-4c3b-99ed-592845165350	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	2400.0000	Organizational > Bookkeeping: $2,400/yr	2026-04-07 22:06:25.514644+00	\N
4f0b0c2d-0ccf-4df2-8a2d-564b858ddaff	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	500.0000	Organizational > General liability insurance: $500/yr	2026-04-07 22:06:25.52413+00	\N
d76f3775-960a-4148-8469-fac108325ce0	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	1500.0000	Organizational > Cyber insurance: $1,500/yr	2026-04-07 22:06:25.532682+00	\N
8bb9c3a2-7472-47de-8737-e6c5c5af4e94	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	3000.0000	Organizational > Legal retainer: $3,000/yr	2026-04-07 22:06:25.541363+00	\N
f962d7e1-e6cc-442d-97ce-6bec5af7930b	6db2107f-0e9a-4647-8678-240339a26814	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	6000.0000	Marketing > Organic Marketing: $6,000/yr	2026-04-07 22:06:25.557483+00	GIVING_SEASON_MARKETING
5948e6ab-4661-4d9c-a73c-3110619acc8a	6db2107f-0e9a-4647-8678-240339a26814	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	1800.0000	Marketing > Paid Media: $1,800/yr	2026-04-07 22:06:25.565846+00	GIVING_SEASON_MARKETING
fbe980b5-223f-4ab6-b873-29fffd392cdf	cb4a3cc6-860e-4d6d-978f-b50eef4b3ea5	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	3981.0000	Txn fees: 130 donors × 2.5 txns × $350 × 3.5%	2026-04-07 22:06:25.582026+00	GIVING_SEASON
af6e7b5c-0a34-4816-a9a8-deebc8c74c34	cb4a3cc6-860e-4d6d-978f-b50eef4b3ea5	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	1800.0000	SaaS: 3 partners × $600/yr	2026-04-07 22:06:25.593097+00	\N
3c1a5585-bb7f-4822-8d72-82fec4cd037e	9a187630-70b8-4886-9a39-6108187599bf	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	2600.0000	Payment Processing > Stripe fees: 325 txns × (2.2% + $0.30) on $113,750 volume	2026-04-07 22:06:25.601779+00	GIVING_SEASON
6f6bfd7d-72ca-4794-b5cf-731a1153a550	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	684.0000	Infrastructure > Compute & Hosting: $57/mo × 12	2026-04-07 22:06:25.618531+00	\N
4cb9ff06-3757-4f4d-b8ba-e4c4d28a1674	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	648.0000	Infrastructure > PostgreSQL + pgvector: $54/mo × 12	2026-04-07 22:06:25.627602+00	\N
6e405a68-7ef3-48aa-8a75-00f15d27f93e	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	216.0000	Infrastructure > Redis Cache: $18/mo × 12	2026-04-07 22:06:25.636936+00	\N
000e895e-c0aa-4a22-8c74-9ce235dc2113	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	288.0000	Infrastructure > Kafka / Event Streaming: $24/mo × 12	2026-04-07 22:06:25.645138+00	\N
efdb3d4e-9606-4996-a38a-6be8df964db0	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	600.0000	Infrastructure > AI/LLM Tokens (Claude): $50/mo × 12	2026-04-07 22:06:25.653204+00	\N
f96a6817-bd09-48a8-9c28-d5fc99a842cf	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	156.0000	Infrastructure > Email (Resend): $13/mo × 12	2026-04-07 22:06:25.661154+00	\N
27d65460-57ce-46b5-8717-ad401b10702f	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	144.0000	Infrastructure > SMS (Twilio): $12/mo × 12	2026-04-07 22:06:25.669885+00	\N
ad463ba2-0e10-4c9a-8cdc-b0b32b115117	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	228.0000	Infrastructure > CDN + Storage (S3/CF): $19/mo × 12	2026-04-07 22:06:25.678452+00	\N
9d439840-3bd1-49d0-a4b8-809226556d26	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	156.0000	Infrastructure > Monitoring & Observability: $13/mo × 12	2026-04-07 22:06:25.687257+00	\N
5021502b-3892-4074-b590-1a32b72da2a7	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	396.0000	Infrastructure > Search (Elasticsearch): $33/mo × 12	2026-04-07 22:06:25.694828+00	\N
2d10f4ad-b0ed-4140-b7dc-ca744823c12b	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:25.703779+00	\N
e7800661-fd4d-4319-b054-cf80efb9b416	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	250.0000	Compliance & Security > PCI-DSS Compliance: $250/yr	2026-04-07 22:06:25.712129+00	\N
5bf90a07-0756-4b9b-a00f-83c9a5478feb	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	5000.0000	Compliance & Security > Penetration Testing: $5,000/yr	2026-04-07 22:06:25.720738+00	\N
07221408-0630-4738-9df8-86de6850f71a	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	25000.0000	Compliance & Security > SOC 2 Type II Audit: $25,000/yr	2026-04-07 22:06:25.730872+00	\N
4153b824-e0fb-4699-a7ac-cdf624b69346	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:25.739824+00	\N
8370900a-3c8e-48fe-bea9-9c9ab694360a	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:25.748483+00	\N
2c2ef329-f8ae-42ac-a6a1-af969f468477	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	2000.0000	Organizational > T3010 charity return: $2,000/yr	2026-04-07 22:06:25.756817+00	\N
279c5488-8d09-4c1d-a223-a3b4a53de45b	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	3600.0000	Organizational > Bookkeeping: $3,600/yr	2026-04-07 22:06:25.766104+00	\N
72cf98df-9992-42d4-949a-e24d00d30254	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	8000.0000	Organizational > Financial audit: $8,000/yr	2026-04-07 22:06:25.77471+00	\N
585c8f54-ab65-475d-8613-bb690ac1c47d	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	500.0000	Organizational > General liability insurance: $500/yr	2026-04-07 22:06:25.783658+00	\N
bc9c6c3e-5bf8-454e-90d0-a0ca70bcf177	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	2000.0000	Organizational > Cyber insurance: $2,000/yr	2026-04-07 22:06:25.79186+00	\N
dd1dc15d-196e-4ca9-81f9-4bd49f3cb43a	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	5000.0000	Organizational > Legal retainer: $5,000/yr	2026-04-07 22:06:26.801148+00	\N
5842f656-036c-40c2-bb79-75a01a1253b0	8843734c-df33-4306-8f3b-96a3507a046f	019d49be-61ff-77a0-b8d1-78ceed0afacd	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	12000.0000	Marketing > Organic Marketing: $12,000/yr	2026-04-07 22:06:26.818072+00	GIVING_SEASON_MARKETING
0ef8a46f-0153-4556-a612-fa621f89d92f	8843734c-df33-4306-8f3b-96a3507a046f	019d49be-61ff-77a0-b8d1-78ceed0afacd	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	4600.0000	Marketing > Paid Media: $4,600/yr	2026-04-07 22:06:26.826674+00	GIVING_SEASON_MARKETING
a4b670cb-adf5-4370-9afe-a3b6e63da0df	822fc5b7-73fb-475f-b80b-e98f81157b63	019d49be-61ff-77a0-b8d1-78ceed0afacd	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	30576.0000	Txn fees: 700 donors × 3.2 txns × $390 × 3.5%	2026-04-07 22:06:26.844468+00	GIVING_SEASON
37975cfe-6a89-4b21-a11f-9ffe6cbc951f	822fc5b7-73fb-475f-b80b-e98f81157b63	019d49be-61ff-77a0-b8d1-78ceed0afacd	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	13500.0000	SaaS: 15 partners × $900/yr	2026-04-07 22:06:26.853737+00	\N
942c5fe6-8df0-4f21-9d25-72fbba0667f9	7d7a2542-c22f-4c7a-99e4-c4bc9c0453c9	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	19891.0000	Payment Processing > Stripe fees: 2,240 txns × (2.2% + $0.30) on $873,600 volume	2026-04-07 22:06:26.865639+00	GIVING_SEASON
4e158bd0-2e6c-47ca-bba2-18f2588d3d03	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	1404.0000	Infrastructure > Compute & Hosting: $117/mo × 12	2026-04-07 22:06:26.882582+00	\N
2e66bfcb-804b-432e-a7b2-d4e0c1e5a424	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	1536.0000	Infrastructure > PostgreSQL + pgvector: $128/mo × 12	2026-04-07 22:06:26.892177+00	\N
f99dbb7c-aa94-4646-bb25-f4fa67404077	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	564.0000	Infrastructure > Redis Cache: $47/mo × 12	2026-04-07 22:06:26.900649+00	\N
4b2c320e-2d62-4602-a042-329e78d71f06	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	840.0000	Infrastructure > Kafka / Event Streaming: $70/mo × 12	2026-04-07 22:06:26.910586+00	\N
026ca7c6-7dce-4b78-8ade-c49eb6a598da	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	1656.0000	Infrastructure > AI/LLM Tokens (Claude): $138/mo × 12	2026-04-07 22:06:26.920566+00	\N
44deaeb9-3c6f-43c1-ae07-b045d37a69f8	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	420.0000	Infrastructure > Email (Resend): $35/mo × 12	2026-04-07 22:06:26.929464+00	\N
7aad5317-0f22-4ac3-adf0-5bea3175e19d	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	384.0000	Infrastructure > SMS (Twilio): $32/mo × 12	2026-04-07 22:06:26.939265+00	\N
7b977c45-9cb5-4c6e-8c18-c3846106352d	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	588.0000	Infrastructure > CDN + Storage (S3/CF): $49/mo × 12	2026-04-07 22:06:26.948778+00	\N
012c717d-eaf9-4b51-a6de-70b7dedc89d1	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	420.0000	Infrastructure > Monitoring & Observability: $35/mo × 12	2026-04-07 22:06:26.960495+00	\N
71811713-81a5-49c3-96f8-a98e027712fb	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	1176.0000	Infrastructure > Search (Elasticsearch): $98/mo × 12	2026-04-07 22:06:26.979715+00	\N
3295a31f-6a9d-414f-9ee2-662bb7e418b2	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:26.99129+00	\N
2d0ab4c0-3560-4325-9953-1c9638b2ce6e	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:27.002874+00	\N
c2ea6c4a-279e-4b00-a6c3-37b3fd5d7525	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	10000.0000	Compliance & Security > Penetration Testing: $10,000/yr	2026-04-07 22:06:27.013358+00	\N
dc6dce6d-6ed4-41cd-b8f3-fcdca2250527	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	30000.0000	Compliance & Security > SOC 2 Type II Audit: $30,000/yr	2026-04-07 22:06:27.023172+00	\N
f52412ff-5b94-4352-89bd-704910be09eb	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:27.032235+00	\N
6ca48470-7840-4357-b90f-4c2b17c3f346	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:27.043777+00	\N
af9e4c0f-021e-4708-bd82-38174e077d5b	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	2500.0000	Organizational > T3010 charity return: $2,500/yr	2026-04-07 22:06:27.053086+00	\N
01f9e718-06a1-4dd3-9e9d-37e307c708d3	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	6000.0000	Organizational > Bookkeeping: $6,000/yr	2026-04-07 22:06:27.062792+00	\N
5e9873d7-c9b0-4580-a9cc-0e177acdf328	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	10000.0000	Organizational > Financial audit: $10,000/yr	2026-04-07 22:06:27.072705+00	\N
0ce40523-1945-439e-8e88-e263c64c714a	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	800.0000	Organizational > General liability insurance: $800/yr	2026-04-07 22:06:27.081555+00	\N
09bd4972-9829-4b64-b6e9-5ca1decf8278	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	3000.0000	Organizational > Cyber insurance: $3,000/yr	2026-04-07 22:06:27.100722+00	\N
5f6db220-7f26-4ed4-8bf6-8021f7d8c7bf	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	8000.0000	Organizational > Legal retainer: $8,000/yr	2026-04-07 22:06:27.110089+00	\N
379ae70f-7f4b-46d4-994e-876508df387f	19575366-07b3-4f58-a37b-1a73d3c0dfc4	019d69fb-260d-71df-abd1-028761d5e6c0	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	18000.0000	Marketing > Organic Marketing: $18,000/yr	2026-04-07 22:06:27.130056+00	GIVING_SEASON_MARKETING
da965c1e-7a76-4cd3-865c-8cb77316832c	19575366-07b3-4f58-a37b-1a73d3c0dfc4	019d69fb-260d-71df-abd1-028761d5e6c0	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	53000.0000	Marketing > Paid Media: $53,000/yr	2026-04-07 22:06:27.141619+00	GIVING_SEASON_MARKETING
de4a7d76-8787-4409-9fc3-9c9954466cda	b6b65ead-c95d-4ff4-a149-8b09e7c17759	019d69fb-260d-71df-abd1-028761d5e6c0	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	129148.0000	Txn fees: 2380 donors × 3.8 txns × $420 × 3.4%	2026-04-07 22:06:27.161992+00	GIVING_SEASON
4b3f249a-7995-4535-ab09-393fa5fefc3b	b6b65ead-c95d-4ff4-a149-8b09e7c17759	019d69fb-260d-71df-abd1-028761d5e6c0	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	60000.0000	SaaS: 50 partners × $1200/yr	2026-04-07 22:06:27.172378+00	\N
8c5acb77-776f-473e-8c48-92eb4f8010f7	7b743513-2fb0-430b-9bf8-0f430011333b	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	86280.0000	Payment Processing > Stripe fees: 9,044 txns × (2.2% + $0.30) on $3,798,480 volume	2026-04-07 22:06:27.182681+00	GIVING_SEASON
940e2819-516e-4626-913e-ccef6d9e5f53	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	2916.0000	Infrastructure > Compute & Hosting: $243/mo × 12	2026-04-07 22:06:27.204143+00	\N
610a761f-85b3-4657-8c09-8e0a1a996c9b	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	2856.0000	Infrastructure > PostgreSQL + pgvector: $238/mo × 12	2026-04-07 22:06:27.214636+00	\N
54140d71-218b-4e6d-81ff-d02acd17cf70	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	1116.0000	Infrastructure > Redis Cache: $93/mo × 12	2026-04-07 22:06:27.224598+00	\N
181c2409-86b8-4a5f-8c3b-8b6e75e0a36f	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	1536.0000	Infrastructure > Kafka / Event Streaming: $128/mo × 12	2026-04-07 22:06:27.232406+00	\N
3525fc78-9a38-4c22-91b7-db8210f332f0	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	3456.0000	Infrastructure > AI/LLM Tokens (Claude): $288/mo × 12	2026-04-07 22:06:27.241713+00	\N
e94dd93f-8ec6-4be8-b3f2-57f503c5dc57	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	636.0000	Infrastructure > Email (Resend): $53/mo × 12	2026-04-07 22:06:27.250016+00	\N
8e13bbc2-173e-4267-a2f5-85f2e0c929d5	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	696.0000	Infrastructure > SMS (Twilio): $58/mo × 12	2026-04-07 22:06:27.259347+00	\N
b05c9e4c-8eae-4a31-b6cd-ca9da6525484	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	1236.0000	Infrastructure > CDN + Storage (S3/CF): $103/mo × 12	2026-04-07 22:06:27.26732+00	\N
8346f3e4-f77e-4907-8f89-058ed78d695d	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	660.0000	Infrastructure > Monitoring & Observability: $55/mo × 12	2026-04-07 22:06:27.27526+00	\N
aba051af-a23b-477e-8124-e6ba7dfa75c9	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	2256.0000	Infrastructure > Search (Elasticsearch): $188/mo × 12	2026-04-07 22:06:27.284857+00	\N
cb2b3557-5e91-4843-bc92-0839f48af4dd	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:27.293108+00	\N
e49a45f7-dedd-4d90-8c78-8bbe797fdc72	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:28.303785+00	\N
d37611fc-f090-4994-a0f8-eb8367a110db	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	10000.0000	Compliance & Security > Penetration Testing: $10,000/yr	2026-04-07 22:06:28.322628+00	\N
e85b4b22-4eeb-4713-ba6e-b899f150327a	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	35000.0000	Compliance & Security > SOC 2 Type II Audit: $35,000/yr	2026-04-07 22:06:28.332899+00	\N
27da50aa-dc87-4e5c-a4d2-bc7e8b4e1f2c	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:28.342156+00	\N
7edbcd53-a56c-4c0e-865c-7e793a8f359a	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:28.351706+00	\N
5fba29de-0a8b-4db6-a492-874dd35d8ecd	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	3000.0000	Organizational > T3010 charity return: $3,000/yr	2026-04-07 22:06:28.362029+00	\N
d944e4e0-ef26-4fff-a07e-c85e84deaa4c	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	9600.0000	Organizational > Bookkeeping: $9,600/yr	2026-04-07 22:06:28.372584+00	\N
5a50396f-7d12-46c2-8570-a3f06d9420b4	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	15000.0000	Organizational > Financial audit: $15,000/yr	2026-04-07 22:06:28.383444+00	\N
5d1b6b10-082a-4e2e-90fe-ed779eee28de	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	1000.0000	Organizational > General liability insurance: $1,000/yr	2026-04-07 22:06:28.392217+00	\N
de44a2b5-b9a5-4711-84b2-82699586a1b0	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	5000.0000	Organizational > Cyber insurance: $5,000/yr	2026-04-07 22:06:28.401238+00	\N
b66c0ce3-d26b-4938-a0b6-14ae7c7ad2be	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	10000.0000	Organizational > Legal retainer: $10,000/yr	2026-04-07 22:06:28.410807+00	\N
dda3a1ec-3f36-4719-ad26-80abfbafcfd2	b7c9fd0d-d271-4a5f-86df-5f8433a3baf7	019d49be-6213-75dc-9a73-ae7f08e23d71	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	24000.0000	Marketing > Organic Marketing: $24,000/yr	2026-04-07 22:06:28.431388+00	GIVING_SEASON_MARKETING
091565ff-ee4f-4b12-8024-4d03e77c8497	b7c9fd0d-d271-4a5f-86df-5f8433a3baf7	019d49be-6213-75dc-9a73-ae7f08e23d71	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	100400.0000	Marketing > Paid Media: $100,400/yr	2026-04-07 22:06:28.443539+00	GIVING_SEASON_MARKETING
05093360-b701-4570-94d4-55f00bc751e9	74d4679b-f9e2-40ad-b624-6fa856080ad8	019d49be-6213-75dc-9a73-ae7f08e23d71	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	363409.0000	Txn fees: 5700 donors × 4.2 txns × $460 × 3.3%	2026-04-07 22:06:28.462066+00	GIVING_SEASON
7737a95f-844e-4d10-b155-6b5ea8ab417c	74d4679b-f9e2-40ad-b624-6fa856080ad8	019d49be-6213-75dc-9a73-ae7f08e23d71	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	180000.0000	SaaS: 120 partners × $1500/yr	2026-04-07 22:06:28.472601+00	\N
828f6454-0b81-4749-923e-0394f59c834f	03d8558a-f072-4ef3-83c1-f9a29a0ad7c8	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	249455.0000	Payment Processing > Stripe fees: 23,940 txns × (2.2% + $0.30) on $11,012,400 volume	2026-04-07 22:06:28.481591+00	GIVING_SEASON
697c162c-79c9-4fd5-ba67-d68b2091bd37	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	4800.0000	Infrastructure > Compute & Hosting: $400/mo × 12	2026-04-07 22:06:28.4986+00	\N
608978a3-6e30-4b29-b3af-2bee6b991759	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	4500.0000	Infrastructure > PostgreSQL + pgvector: $375/mo × 12	2026-04-07 22:06:28.511499+00	\N
5f5ba98a-eb08-4288-a7d7-a2c5c7b1d904	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	1800.0000	Infrastructure > Redis Cache: $150/mo × 12	2026-04-07 22:06:28.521956+00	\N
56b331a9-c424-4599-8e16-59b66e170315	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	2400.0000	Infrastructure > Kafka / Event Streaming: $200/mo × 12	2026-04-07 22:06:28.531278+00	\N
8da99b26-6923-4274-bb58-d0a2e39e04d0	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	5700.0000	Infrastructure > AI/LLM Tokens (Claude): $475/mo × 12	2026-04-07 22:06:28.54086+00	\N
e3b30d8a-499b-4cb9-adca-db1a7ef8e561	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	900.0000	Infrastructure > Email (Resend): $75/mo × 12	2026-04-07 22:06:28.550126+00	\N
abf6a520-99a2-408f-bdb6-25fa097d2b25	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	1080.0000	Infrastructure > SMS (Twilio): $90/mo × 12	2026-04-07 22:06:28.560518+00	\N
2c798c54-fa4f-4bf2-89e3-9608d0a76f83	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	2040.0000	Infrastructure > CDN + Storage (S3/CF): $170/mo × 12	2026-04-07 22:06:28.570012+00	\N
412548bb-5144-4aaf-967d-5da19c55d52d	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	960.0000	Infrastructure > Monitoring & Observability: $80/mo × 12	2026-04-07 22:06:28.579986+00	\N
3e4611d3-69f5-45a6-98ff-7a8c1b0a9912	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	3600.0000	Infrastructure > Search (Elasticsearch): $300/mo × 12	2026-04-07 22:06:28.589727+00	\N
74808746-4973-4b3d-a233-0a06f1f7520b	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:28.599134+00	\N
6e367806-e387-43bc-beea-432e321be97a	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:28.608382+00	\N
eb3f15b6-553a-4929-8ed2-e39f647c929e	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	15000.0000	Compliance & Security > Penetration Testing: $15,000/yr	2026-04-07 22:06:28.616786+00	\N
b2d95418-3106-4804-af38-23afc4976416	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	40000.0000	Compliance & Security > SOC 2 Type II Audit: $40,000/yr	2026-04-07 22:06:28.625803+00	\N
45815811-124d-4614-a550-2f66595a4e66	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:28.634412+00	\N
4eb1c61b-fd7f-4248-9d52-2cc6db9b0d94	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:28.644211+00	\N
82bbf1b2-fc8f-4824-80da-b2663ef03681	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	3500.0000	Organizational > T3010 charity return: $3,500/yr	2026-04-07 22:06:28.652573+00	\N
10121804-92ff-4e6c-b32a-8e98313b1789	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12000.0000	Organizational > Bookkeeping: $12,000/yr	2026-04-07 22:06:28.661507+00	\N
1a020c5d-008b-420e-9531-373b07b990a8	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	20000.0000	Organizational > Financial audit: $20,000/yr	2026-04-07 22:06:28.671336+00	\N
e85355a0-1e02-4ddb-973c-74b8374b963b	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	1500.0000	Organizational > General liability insurance: $1,500/yr	2026-04-07 22:06:28.679793+00	\N
c3eb887e-1ea8-448c-9bb6-4cce853ca592	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	8000.0000	Organizational > Cyber insurance: $8,000/yr	2026-04-07 22:06:28.688765+00	\N
4758e258-f252-4ff5-a305-37f278b0d192	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12000.0000	Organizational > Legal retainer: $12,000/yr	2026-04-07 22:06:28.697132+00	\N
9a9c3bbc-26b0-4968-abb7-cf33cba92680	8e06a462-0d5a-4173-8255-78d7f644567e	019d49be-621b-7306-bb7c-cc9d86263b46	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	30000.0000	Marketing > Organic Marketing: $30,000/yr	2026-04-07 22:06:28.714405+00	GIVING_SEASON_MARKETING
7a4dfed5-bb34-4936-a3ca-039efc1c095c	8e06a462-0d5a-4173-8255-78d7f644567e	019d49be-621b-7306-bb7c-cc9d86263b46	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	148800.0000	Marketing > Paid Media: $148,800/yr	2026-04-07 22:06:28.724054+00	GIVING_SEASON_MARKETING
c87c6275-6019-436f-b13e-b534a8724f78	4e8360ea-0125-409d-a0ad-ea0d08cee1fb	019d49be-621b-7306-bb7c-cc9d86263b46	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	887040.0000	Txn fees: 11550 donors × 4.8 txns × $500 × 3.2%	2026-04-07 22:06:28.742496+00	GIVING_SEASON
a5dad180-79e1-41af-9cba-ccecfa31508b	4e8360ea-0125-409d-a0ad-ea0d08cee1fb	019d49be-621b-7306-bb7c-cc9d86263b46	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	450000.0000	SaaS: 250 partners × $1800/yr	2026-04-07 22:06:28.751014+00	\N
ec65a1ff-bab4-4f22-a5ff-2ba4fcef6621	7c108832-e970-4a8b-b47a-3f3ab234ae46	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	626472.0000	Payment Processing > Stripe fees: 55,440 txns × (2.2% + $0.30) on $27,720,000 volume	2026-04-07 22:06:28.760668+00	GIVING_SEASON
77191996-efbc-41e5-932f-0007fd8ac53e	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	420.0000	Infrastructure > Compute & Hosting: $35/mo × 12	2026-04-07 22:06:28.777093+00	\N
a030bb4c-04ce-4de5-acd3-13f970717f2d	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	216.0000	Infrastructure > PostgreSQL + pgvector: $18/mo × 12	2026-04-07 22:06:29.787372+00	\N
794fff65-8b4d-478c-9d70-c7291eccc562	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	60.0000	Infrastructure > Redis Cache: $5/mo × 12	2026-04-07 22:06:29.814021+00	\N
dc9b59e8-dfed-4a31-9e12-4c85c63f0431	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	120.0000	Infrastructure > AI/LLM Tokens (Claude): $10/mo × 12	2026-04-07 22:06:29.823061+00	\N
1b48c18e-31f2-48b5-a8de-f476ef9e33f1	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	24.0000	Infrastructure > SMS (Twilio): $2/mo × 12	2026-04-07 22:06:29.833619+00	\N
44c6fcd0-5fc2-4f1d-9e8c-475043a90403	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	72.0000	Infrastructure > CDN + Storage (S3/CF): $6/mo × 12	2026-04-07 22:06:29.842019+00	\N
49722780-1eb3-4869-8493-50ae17776082	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:29.850227+00	\N
36be6e5c-b833-4fcc-88a8-d30239ff83fd	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	250.0000	Compliance & Security > PCI-DSS Compliance: $250/yr	2026-04-07 22:06:29.85821+00	\N
4d987dc2-4b85-4b2b-8145-5a042669fed5	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	5000.0000	Compliance & Security > Penetration Testing: $5,000/yr	2026-04-07 22:06:29.866579+00	\N
237f0716-5141-4ad0-ba49-ec7c7dd27e3e	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:29.874328+00	\N
01ce552a-164e-4ede-842a-d0ad6f31ef7b	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:29.882626+00	\N
c77c74b9-71ef-44b7-8a5a-5cd3aa0137c1	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	1500.0000	Organizational > T3010 charity return: $1,500/yr	2026-04-07 22:06:29.891709+00	\N
f845b142-4f25-4e7f-95f3-2b093956a1d6	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	2400.0000	Organizational > Bookkeeping: $2,400/yr	2026-04-07 22:06:29.899829+00	\N
f14d286c-ec0f-430a-b0cb-65f822a66d39	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	500.0000	Organizational > General liability insurance: $500/yr	2026-04-07 22:06:29.90777+00	\N
6bfe7e6d-0286-4331-8939-8249555c5886	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	1500.0000	Organizational > Cyber insurance: $1,500/yr	2026-04-07 22:06:29.91592+00	\N
b15f0554-6c36-4a64-8146-347aa62abd37	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	3000.0000	Organizational > Legal retainer: $3,000/yr	2026-04-07 22:06:29.924858+00	\N
b0be5e55-f21a-4339-97a9-4f9a8a03c2d6	ecc7de6d-b31b-45b9-87d2-54ec743b97a5	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	42000.0000	Marketing > Organic Marketing: $42,000/yr	2026-04-07 22:06:29.939926+00	GIVING_SEASON_MARKETING
613ab4fa-b1ed-449c-9fbd-098975cf079d	ecc7de6d-b31b-45b9-87d2-54ec743b97a5	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	103200.0000	Marketing > Paid Media: $103,200/yr	2026-04-07 22:06:29.948254+00	GIVING_SEASON_MARKETING
75ba9021-393d-49f1-aa3b-b338c3d40660	ba2ee0d7-0994-4306-8a45-4935d40c86eb	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	896.0000	Txn fees: 40 donors × 2 txns × $320 × 3.5%	2026-04-07 22:06:29.9659+00	GIVING_SEASON
a04df661-6aad-4e3e-9962-594ac592698f	ba2ee0d7-0994-4306-8a45-4935d40c86eb	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	600.0000	SaaS: 1 partners × $600/yr	2026-04-07 22:06:29.972992+00	\N
a19fa5d6-16b5-4c26-ad1c-666e6dcc0e43	310a7968-7955-4206-9834-e2060c44ebf9	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	587.0000	Payment Processing > Stripe fees: 80 txns × (2.2% + $0.30) on $25,600 volume	2026-04-07 22:06:29.981008+00	GIVING_SEASON
f91be172-0f2b-464a-8d0f-9a2a52697c4e	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	552.0000	Infrastructure > Compute & Hosting: $46/mo × 12	2026-04-07 22:06:29.995894+00	\N
8cee65f2-dce7-45c2-8ddd-f875a18da041	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	432.0000	Infrastructure > PostgreSQL + pgvector: $36/mo × 12	2026-04-07 22:06:30.003478+00	\N
af6b891a-7f27-4f83-95c4-01e464e18d99	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	144.0000	Infrastructure > Redis Cache: $12/mo × 12	2026-04-07 22:06:30.011732+00	\N
cb6c0e82-5896-4320-9315-6a3c9c68497c	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	144.0000	Infrastructure > Kafka / Event Streaming: $12/mo × 12	2026-04-07 22:06:30.018774+00	\N
449d29a5-840e-4640-8609-ee92572f6a92	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	360.0000	Infrastructure > AI/LLM Tokens (Claude): $30/mo × 12	2026-04-07 22:06:30.026628+00	\N
cc924daa-7abf-46f3-a737-47b50f850876	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	84.0000	Infrastructure > Email (Resend): $7/mo × 12	2026-04-07 22:06:30.034963+00	\N
addb67b1-219f-4733-95e0-5092e011d6e5	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	84.0000	Infrastructure > SMS (Twilio): $7/mo × 12	2026-04-07 22:06:30.043544+00	\N
37ca3574-6fd2-4ada-b610-f40dcd36393d	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	144.0000	Infrastructure > CDN + Storage (S3/CF): $12/mo × 12	2026-04-07 22:06:30.051547+00	\N
2bab82b0-4bc9-4987-80ce-864830197f85	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	84.0000	Infrastructure > Monitoring & Observability: $7/mo × 12	2026-04-07 22:06:30.061597+00	\N
2e2599a7-dfa8-48f7-a9da-9a81a39bcfa0	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	204.0000	Infrastructure > Search (Elasticsearch): $17/mo × 12	2026-04-07 22:06:30.069352+00	\N
7157d98f-054a-476c-ae94-6b97a723cf85	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:30.078909+00	\N
a4f67f67-75d1-4769-999d-0eac8384ff02	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	250.0000	Compliance & Security > PCI-DSS Compliance: $250/yr	2026-04-07 22:06:30.085916+00	\N
1578551b-a482-42fd-be9a-c076fb5f5657	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	5000.0000	Compliance & Security > Penetration Testing: $5,000/yr	2026-04-07 22:06:30.095073+00	\N
9aee16ff-b1e5-4cb0-b6bc-dfe2c707119b	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	25000.0000	Compliance & Security > SOC 2 Type II Audit: $25,000/yr	2026-04-07 22:06:30.1019+00	\N
944dcc3e-dfef-41c8-b745-d7626d3b4186	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:30.110716+00	\N
657ca4a1-8552-491d-9dae-e429659b2ece	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:30.118092+00	\N
7dc868da-5287-4e8f-ae62-81d3477ff30b	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	2000.0000	Organizational > T3010 charity return: $2,000/yr	2026-04-07 22:06:30.127093+00	\N
89c04714-3d61-4429-922a-8b560a440f2b	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	3600.0000	Organizational > Bookkeeping: $3,600/yr	2026-04-07 22:06:30.233547+00	\N
d8843a4b-6bf6-4a7e-a9e3-2532551a1cb1	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	8000.0000	Organizational > Financial audit: $8,000/yr	2026-04-07 22:06:30.242086+00	\N
b005ce31-e2de-4db9-b7ff-16710b58d03d	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	500.0000	Organizational > General liability insurance: $500/yr	2026-04-07 22:06:30.250294+00	\N
966096f8-dd3c-4205-851c-8e4221cc774a	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	2000.0000	Organizational > Cyber insurance: $2,000/yr	2026-04-07 22:06:30.259273+00	\N
51598c5f-6fa6-4fb6-ae8e-fd45c18815dc	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	5000.0000	Organizational > Legal retainer: $5,000/yr	2026-04-07 22:06:30.266291+00	\N
b101f1c6-a1d1-4829-99b7-931768dae10e	f8a9f7a2-71ee-4ba6-9c83-1267c34acb62	019d49be-61ff-77a0-b8d1-78ceed0afacd	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	72000.0000	Marketing > Organic Marketing: $72,000/yr	2026-04-07 22:06:30.282196+00	GIVING_SEASON_MARKETING
212c3170-ab37-4942-87f0-2bd8d4585611	f8a9f7a2-71ee-4ba6-9c83-1267c34acb62	019d49be-61ff-77a0-b8d1-78ceed0afacd	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	164400.0000	Marketing > Paid Media: $164,400/yr	2026-04-07 22:06:30.290159+00	GIVING_SEASON_MARKETING
19776c67-6163-46dd-8a5d-c0360f483988	82f91af5-90a1-450e-a895-34807bcefb4a	019d49be-61ff-77a0-b8d1-78ceed0afacd	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	13054.0000	Txn fees: 360 donors × 2.8 txns × $370 × 3.5%	2026-04-07 22:06:30.306557+00	GIVING_SEASON
fad77934-b111-4bdd-8ef5-3f1e5b3c8543	82f91af5-90a1-450e-a895-34807bcefb4a	019d49be-61ff-77a0-b8d1-78ceed0afacd	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	9000.0000	SaaS: 10 partners × $900/yr	2026-04-07 22:06:31.31739+00	\N
952d5828-1398-4e42-9054-54998a16e19d	09a7ee06-67fc-4fa0-9091-e1a4efada5df	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	8508.0000	Payment Processing > Stripe fees: 1,008 txns × (2.2% + $0.30) on $372,960 volume	2026-04-07 22:06:31.345859+00	GIVING_SEASON
efd2d8c5-4aa7-417d-9895-0e18c3530010	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	1020.0000	Infrastructure > Compute & Hosting: $85/mo × 12	2026-04-07 22:06:31.363802+00	\N
fcb9a223-98de-46a7-8d50-fbc378c38588	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	1200.0000	Infrastructure > PostgreSQL + pgvector: $100/mo × 12	2026-04-07 22:06:31.373158+00	\N
e32896aa-5830-41a8-8380-536f07c3df72	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	420.0000	Infrastructure > Redis Cache: $35/mo × 12	2026-04-07 22:06:31.382221+00	\N
6d7f8ea0-414d-490b-b5c6-d6f395b34d19	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	660.0000	Infrastructure > Kafka / Event Streaming: $55/mo × 12	2026-04-07 22:06:31.391677+00	\N
16cd9921-acaf-480f-b789-3433859e0554	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	1200.0000	Infrastructure > AI/LLM Tokens (Claude): $100/mo × 12	2026-04-07 22:06:31.400241+00	\N
b385d6ad-b351-4d19-a1a3-8c8df33cf6fc	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	360.0000	Infrastructure > Email (Resend): $30/mo × 12	2026-04-07 22:06:31.410304+00	\N
28765e05-ce45-4b2a-b20d-a76fb85ab601	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	300.0000	Infrastructure > SMS (Twilio): $25/mo × 12	2026-04-07 22:06:31.419122+00	\N
27faac03-89a2-47b8-aa2d-60c870f46603	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	420.0000	Infrastructure > CDN + Storage (S3/CF): $35/mo × 12	2026-04-07 22:06:31.428774+00	\N
c2ff3c9e-ef0b-4eb2-9c0a-88ea1ac7ceaf	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	360.0000	Infrastructure > Monitoring & Observability: $30/mo × 12	2026-04-07 22:06:31.43806+00	\N
6e288384-ab12-46e7-9f9a-5ada68c873a4	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	900.0000	Infrastructure > Search (Elasticsearch): $75/mo × 12	2026-04-07 22:06:31.447352+00	\N
5c941fe2-94e9-441c-a723-22064156b3c6	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:31.457145+00	\N
57fe4989-38b1-4fb0-97f9-05374d4d58b9	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:31.468295+00	\N
5645764c-15ec-4765-a2e2-ef3239dbd01a	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	10000.0000	Compliance & Security > Penetration Testing: $10,000/yr	2026-04-07 22:06:31.478168+00	\N
4e0e2096-5a69-4f6b-a85c-45d4ae046b66	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	30000.0000	Compliance & Security > SOC 2 Type II Audit: $30,000/yr	2026-04-07 22:06:31.487404+00	\N
e50d8572-b3e2-4cf3-8c41-f92bbc593e60	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:31.496639+00	\N
10d88633-2095-4d61-a2c9-d883a84b046a	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:31.505679+00	\N
808a3a3f-f9c2-4395-bf58-7361f5d80d74	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	2500.0000	Organizational > T3010 charity return: $2,500/yr	2026-04-07 22:06:31.51532+00	\N
fc03c61c-1d83-443d-a65d-0893654ff40e	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	6000.0000	Organizational > Bookkeeping: $6,000/yr	2026-04-07 22:06:31.524829+00	\N
558d4444-b11f-4222-a70f-deec4667e59a	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	10000.0000	Organizational > Financial audit: $10,000/yr	2026-04-07 22:06:31.533631+00	\N
f35d18f0-8154-4306-a174-233ad53aef07	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	800.0000	Organizational > General liability insurance: $800/yr	2026-04-07 22:06:31.54203+00	\N
aa668064-e316-4f32-8dae-dbc102c28112	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	3000.0000	Organizational > Cyber insurance: $3,000/yr	2026-04-07 22:06:31.549786+00	\N
2154cbe6-f474-44c8-88b3-9fca1d48acb8	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	8000.0000	Organizational > Legal retainer: $8,000/yr	2026-04-07 22:06:31.560344+00	\N
10fb802a-ab56-4ab7-8514-a64404fcf67f	034b39b3-db14-42d4-86d8-25dd0122a1c1	019d69fb-260d-71df-abd1-028761d5e6c0	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	96000.0000	Marketing > Organic Marketing: $96,000/yr	2026-04-07 22:06:31.574879+00	GIVING_SEASON_MARKETING
b6cccb39-fc36-400c-9dc9-438732ff10ae	034b39b3-db14-42d4-86d8-25dd0122a1c1	019d69fb-260d-71df-abd1-028761d5e6c0	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	226800.0000	Marketing > Paid Media: $226,800/yr	2026-04-07 22:06:31.584407+00	GIVING_SEASON_MARKETING
1c8ea588-c45d-44be-a0c0-c2f1a62f0c11	f576bd7a-06d2-4bb3-947a-8bb04e824abb	019d69fb-260d-71df-abd1-028761d5e6c0	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	78064.0000	Txn fees: 1600 donors × 3.5 txns × $410 × 3.4%	2026-04-07 22:06:31.599986+00	GIVING_SEASON
325fe00c-2775-4a5c-8377-a7dc3c1f099e	f576bd7a-06d2-4bb3-947a-8bb04e824abb	019d69fb-260d-71df-abd1-028761d5e6c0	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	48000.0000	SaaS: 40 partners × $1200/yr	2026-04-07 22:06:31.612751+00	\N
808f2acd-db9b-4de0-9e48-281a8e3259ee	2b2c2f9e-5321-43e2-b81b-f3c220744307	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	52192.0000	Payment Processing > Stripe fees: 5,600 txns × (2.2% + $0.30) on $2,296,000 volume	2026-04-07 22:06:31.619886+00	GIVING_SEASON
9a8fcda3-9606-47ec-9d64-3a75914d9317	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	2436.0000	Infrastructure > Compute & Hosting: $203/mo × 12	2026-04-07 22:06:31.635303+00	\N
746b1ac8-3f16-47ec-a6b9-c5911a9c2812	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	2436.0000	Infrastructure > PostgreSQL + pgvector: $203/mo × 12	2026-04-07 22:06:31.644383+00	\N
a036f5a5-511b-49d4-a8d8-1ec7c3eba9ac	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	936.0000	Infrastructure > Redis Cache: $78/mo × 12	2026-04-07 22:06:31.652702+00	\N
37fb4a65-22ed-4f1c-b394-a73b18504bff	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	1308.0000	Infrastructure > Kafka / Event Streaming: $109/mo × 12	2026-04-07 22:06:31.662223+00	\N
f65cc776-f730-4e17-a43e-e98f8a7fb647	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	2892.0000	Infrastructure > AI/LLM Tokens (Claude): $241/mo × 12	2026-04-07 22:06:31.669912+00	\N
33e8fe38-e220-4324-b737-4c929b5669ce	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	564.0000	Infrastructure > Email (Resend): $47/mo × 12	2026-04-07 22:06:31.680688+00	\N
ea9e37ac-c4f9-48b1-ad50-0760f7a08d95	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	588.0000	Infrastructure > SMS (Twilio): $49/mo × 12	2026-04-07 22:06:31.688921+00	\N
3c690e02-b4e8-4829-bfb8-233ed8970e5e	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	1032.0000	Infrastructure > CDN + Storage (S3/CF): $86/mo × 12	2026-04-07 22:06:31.697968+00	\N
3131d3a0-493d-4116-8ba1-7db590e66d82	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	588.0000	Infrastructure > Monitoring & Observability: $49/mo × 12	2026-04-07 22:06:31.706655+00	\N
32c99f16-41c7-449d-a491-3cd7fe206ce3	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	1908.0000	Infrastructure > Search (Elasticsearch): $159/mo × 12	2026-04-07 22:06:31.71594+00	\N
588a3c7e-ef34-4897-ac75-3ebcb610eaaa	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:31.723882+00	\N
3ee7a728-72b7-4e29-9830-fb7dcd17aacc	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:31.733384+00	\N
fb491e79-a930-4302-b062-c037101a3619	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	10000.0000	Compliance & Security > Penetration Testing: $10,000/yr	2026-04-07 22:06:31.743879+00	\N
490c88ca-e5ec-462d-8609-edeaaf18dd3f	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	35000.0000	Compliance & Security > SOC 2 Type II Audit: $35,000/yr	2026-04-07 22:06:31.751853+00	\N
7ee5704a-a074-432d-8cae-58b4655b8913	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:31.760936+00	\N
056b10e4-e39d-4b11-ac0f-6a290b0a2f1d	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:31.768997+00	\N
31540f6c-0ffe-403f-8dee-44270742231d	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	3000.0000	Organizational > T3010 charity return: $3,000/yr	2026-04-07 22:06:31.776711+00	\N
8e6ce85c-6a85-47fc-8233-b374fdac7190	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	9600.0000	Organizational > Bookkeeping: $9,600/yr	2026-04-07 22:06:32.787624+00	\N
7d77260f-94de-44f3-992a-101f3ff0fe89	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	15000.0000	Organizational > Financial audit: $15,000/yr	2026-04-07 22:06:32.79623+00	\N
22ef5929-22df-474a-ae96-0d6ba7d10be7	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	1000.0000	Organizational > General liability insurance: $1,000/yr	2026-04-07 22:06:32.804407+00	\N
0134fdfd-c3ea-4ce9-9c4f-24d7399c0674	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	5000.0000	Organizational > Cyber insurance: $5,000/yr	2026-04-07 22:06:32.814608+00	\N
405604f8-7051-4302-9503-89e757b4cc1d	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	10000.0000	Organizational > Legal retainer: $10,000/yr	2026-04-07 22:06:32.825071+00	\N
4b1772af-1273-435a-ac7d-39bfaa163f5c	110d4f75-e149-41ee-b314-9691c27c8db5	019d49be-6213-75dc-9a73-ae7f08e23d71	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	120000.0000	Marketing > Organic Marketing: $120,000/yr	2026-04-07 22:06:32.843491+00	GIVING_SEASON_MARKETING
4976362c-386e-4662-bbb5-970be5e2e914	110d4f75-e149-41ee-b314-9691c27c8db5	019d49be-6213-75dc-9a73-ae7f08e23d71	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	277200.0000	Marketing > Paid Media: $277,200/yr	2026-04-07 22:06:32.854926+00	GIVING_SEASON_MARKETING
14c0a445-5c0a-4941-8ac2-ded8f4bec4a5	6f8a77a5-b3fb-4b36-979d-241c55ca566d	019d49be-6213-75dc-9a73-ae7f08e23d71	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	267300.0000	Txn fees: 4500 donors × 4 txns × $450 × 3.3%	2026-04-07 22:06:32.871992+00	GIVING_SEASON
a036354a-8c3d-403c-8be4-1de756ec2dd5	6f8a77a5-b3fb-4b36-979d-241c55ca566d	019d49be-6213-75dc-9a73-ae7f08e23d71	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	150000.0000	SaaS: 100 partners × $1500/yr	2026-04-07 22:06:32.88132+00	\N
c34126a1-ea4c-4564-b384-7bc43310acdc	57c5b897-93b3-40cf-a867-d56a14faff66	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	183600.0000	Payment Processing > Stripe fees: 18,000 txns × (2.2% + $0.30) on $8,100,000 volume	2026-04-07 22:06:32.891274+00	GIVING_SEASON
17b63c3e-d091-401d-b453-45b1b06d320e	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	4800.0000	Infrastructure > Compute & Hosting: $400/mo × 12	2026-04-07 22:06:32.908442+00	\N
8ac87ab6-e41f-436f-9eff-69c86e67a9a6	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	4500.0000	Infrastructure > PostgreSQL + pgvector: $375/mo × 12	2026-04-07 22:06:32.917161+00	\N
67ccd469-ce75-42b3-b603-5bc7f550fc4a	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	1800.0000	Infrastructure > Redis Cache: $150/mo × 12	2026-04-07 22:06:32.926151+00	\N
37f73f99-420d-4850-a1f1-3ef3d8f14a96	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	2400.0000	Infrastructure > Kafka / Event Streaming: $200/mo × 12	2026-04-07 22:06:32.936837+00	\N
d0f327c1-9f2e-4ce1-b0f0-4986b9257c5c	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	5700.0000	Infrastructure > AI/LLM Tokens (Claude): $475/mo × 12	2026-04-07 22:06:32.947293+00	\N
a465f5a5-30ec-4f38-b661-d66d60e5972e	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	900.0000	Infrastructure > Email (Resend): $75/mo × 12	2026-04-07 22:06:32.956358+00	\N
6b3e1e02-1547-4abd-ba90-f1ab40c2d2cb	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	1080.0000	Infrastructure > SMS (Twilio): $90/mo × 12	2026-04-07 22:06:32.965807+00	\N
19ab6a01-52b3-48e1-9a38-6aabe19b48a4	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	2040.0000	Infrastructure > CDN + Storage (S3/CF): $170/mo × 12	2026-04-07 22:06:32.974701+00	\N
92c99b98-9034-41ec-9484-d688e853f4ab	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	960.0000	Infrastructure > Monitoring & Observability: $80/mo × 12	2026-04-07 22:06:32.983647+00	\N
7b641849-f609-457b-b159-40893514956a	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	3600.0000	Infrastructure > Search (Elasticsearch): $300/mo × 12	2026-04-07 22:06:32.993884+00	\N
b5ad8b57-0a5a-44e5-8e5e-c9f61d07d245	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12	2026-04-07 22:06:33.002354+00	\N
78ed4085-708a-45b1-82de-9ace510ce3c3	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:33.009701+00	\N
d3cdc970-9f09-4438-9919-4bbaac850b26	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	15000.0000	Compliance & Security > Penetration Testing: $15,000/yr	2026-04-07 22:06:33.018538+00	\N
38173489-bc00-4252-8f49-ac94e1ff7cbe	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	40000.0000	Compliance & Security > SOC 2 Type II Audit: $40,000/yr	2026-04-07 22:06:33.026416+00	\N
6adac4bb-ec1b-4940-b48f-8c6c5dcb3566	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:33.035862+00	\N
d969031f-fd87-493d-8856-0de935a9481d	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12.0000	Organizational > Annual return (federal): $12/yr	2026-04-07 22:06:33.043128+00	\N
2d606a92-7b1b-450d-b9bf-b3936017e485	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	3500.0000	Organizational > T3010 charity return: $3,500/yr	2026-04-07 22:06:33.052259+00	\N
b737479c-cf97-45b5-8d23-cfaaa085a42c	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12000.0000	Organizational > Bookkeeping: $12,000/yr	2026-04-07 22:06:33.061736+00	\N
48f8391f-071e-4715-a8b5-5ee118773c09	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	20000.0000	Organizational > Financial audit: $20,000/yr	2026-04-07 22:06:33.072949+00	\N
09febc48-9501-44fe-b4a8-34fb53356c42	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	1500.0000	Organizational > General liability insurance: $1,500/yr	2026-04-07 22:06:33.082237+00	\N
d9ab1310-dd48-422a-aa34-3ebc720e815d	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	8000.0000	Organizational > Cyber insurance: $8,000/yr	2026-04-07 22:06:33.091207+00	\N
a30a989a-ee62-4b1c-b2a3-5a3aeca9cf22	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12000.0000	Organizational > Legal retainer: $12,000/yr	2026-04-07 22:06:33.100045+00	\N
c67b9c4b-63ed-46ec-8ccd-8e1b0b65f7e3	13735b22-be24-4725-9335-e2e606d89578	019d49be-621b-7306-bb7c-cc9d86263b46	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	138000.0000	Marketing > Organic Marketing: $138,000/yr	2026-04-07 22:06:33.115665+00	GIVING_SEASON_MARKETING
a3635e1b-b625-463b-a877-3686743babd3	13735b22-be24-4725-9335-e2e606d89578	019d49be-621b-7306-bb7c-cc9d86263b46	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	333600.0000	Marketing > Paid Media: $333,600/yr	2026-04-07 22:06:33.12496+00	GIVING_SEASON_MARKETING
72b1b52e-c113-4d00-9581-f34dcdc49201	1f0f530e-b8e5-43c4-b3ff-6c37ec5dd775	019d49be-621b-7306-bb7c-cc9d86263b46	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	887040.0000	Txn fees: 11550 donors × 4.8 txns × $500 × 3.2%	2026-04-07 22:06:33.14403+00	GIVING_SEASON
bca6cb73-7b1e-4b1d-ad7b-d38d68604725	1f0f530e-b8e5-43c4-b3ff-6c37ec5dd775	019d49be-621b-7306-bb7c-cc9d86263b46	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	450000.0000	SaaS: 250 partners × $1800/yr	2026-04-07 22:06:33.154915+00	\N
5a8b1e9f-19df-462c-8dd7-42188d380249	d34b84db-8968-4cc3-80a5-bd8e518cff26	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	626472.0000	Payment Processing > Stripe fees: 55,440 txns × (2.2% + $0.30) on $27,720,000 volume	2026-04-07 22:06:33.165092+00	GIVING_SEASON
6ac66848-3912-4b8e-91ff-e6acb14fce4e	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	528.0000	Infrastructure > Compute & Hosting: $44/mo × 12 (CA+US combined)	2026-04-07 22:06:33.18379+00	\N
78ef98ae-b95c-4d0f-bd1d-be7f75c4611d	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	384.0000	Infrastructure > PostgreSQL + pgvector: $32/mo × 12 (CA+US combined)	2026-04-07 22:06:33.193057+00	\N
59be54b8-39de-485a-9577-1daea70b9046	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	120.0000	Infrastructure > Redis Cache: $10/mo × 12 (CA+US combined)	2026-04-07 22:06:33.202032+00	\N
1e214d93-f3bf-4bfb-ba3a-e2f00d88803b	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	108.0000	Infrastructure > Kafka / Event Streaming: $9/mo × 12 (CA+US combined)	2026-04-07 22:06:33.210518+00	\N
8474cb31-3cf6-487e-9c69-9a1ee8adf34c	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	300.0000	Infrastructure > AI/LLM Tokens (Claude): $25/mo × 12 (CA+US combined)	2026-04-07 22:06:33.219874+00	\N
92459284-1d29-4dcb-a243-f4f393f8caa7	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	60.0000	Infrastructure > Email (Resend): $5/mo × 12 (CA+US combined)	2026-04-07 22:06:33.230334+00	\N
fdce508e-e7e6-4766-9995-ace1ba24d611	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	72.0000	Infrastructure > SMS (Twilio): $6/mo × 12 (CA+US combined)	2026-04-07 22:06:33.239058+00	\N
a9a3db0c-e3a2-4c8f-8db6-addaa4282f23	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	132.0000	Infrastructure > CDN + Storage (S3/CF): $11/mo × 12 (CA+US combined)	2026-04-07 22:06:34.24977+00	\N
964d4bc5-b285-4586-9ce0-285c4293561e	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	60.0000	Infrastructure > Monitoring & Observability: $5/mo × 12 (CA+US combined)	2026-04-07 22:06:34.272841+00	\N
52f38936-a6f5-4ecf-b66a-d0dffd8dca18	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	156.0000	Infrastructure > Search (Elasticsearch): $13/mo × 12 (CA+US combined)	2026-04-07 22:06:34.282902+00	\N
6774e21e-e0c6-4f35-aaf1-f46142b06ed0	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12 (CA+US combined)	2026-04-07 22:06:34.293078+00	\N
8cea3f83-d331-4b81-add8-5f804ffef86d	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	250.0000	Compliance & Security > PCI-DSS Compliance: $250/yr	2026-04-07 22:06:34.302139+00	\N
44aa6c25-72fd-4380-aade-badd77634025	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	5000.0000	Compliance & Security > Penetration Testing: $5,000/yr	2026-04-07 22:06:34.31156+00	\N
4e04b718-e1dd-4c44-8a36-62b41c9bcb57	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:34.32055+00	\N
f3688d66-81bd-4c62-85f7-b299525bfcc2	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	12.0000	Organizational (CA) > Annual return (federal): $12/yr	2026-04-07 22:06:34.329578+00	\N
b77ac014-2bcc-4791-9cc6-a125597e70ef	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	1500.0000	Organizational (CA) > T3010 charity return: $1,500/yr	2026-04-07 22:06:34.339352+00	\N
17f535aa-3ac4-4dcf-ac4e-87d95dcafd36	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	2400.0000	Organizational (CA) > Bookkeeping: $2,400/yr	2026-04-07 22:06:34.347957+00	\N
06997f45-9e29-448f-9c57-fbd4c225abfb	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	500.0000	Organizational (CA) > General liability insurance: $500/yr	2026-04-07 22:06:34.356522+00	\N
488973da-2903-42c5-99f8-8d286d13428b	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	1500.0000	Organizational (CA) > Cyber insurance: $1,500/yr	2026-04-07 22:06:34.365081+00	\N
90a2e047-c7f6-4569-b8a2-4ffc1a6327ff	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	3000.0000	Organizational (CA) > Legal retainer: $3,000/yr	2026-04-07 22:06:34.373338+00	\N
3c945ac3-89dc-4377-894b-4ac5b6453014	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	3333.0000	Organizational (US) > US state charity registrations: $3,333/yr (8mo)	2026-04-07 22:06:34.382259+00	\N
1371e731-9dc0-4ca6-9223-f8dd56164605	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	6667.0000	Organizational (US) > US legal counsel: $6,667/yr (8mo)	2026-04-07 22:06:34.391735+00	\N
e07ce89e-2d52-453f-b52b-704ea8aa50f8	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	2000.0000	Organizational (US) > US bookkeeping: $2,000/yr (8mo)	2026-04-07 22:06:34.400929+00	\N
dd3cb228-14f1-4ed4-b17a-b8b1775a382f	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	1333.0000	Organizational (US) > US D&O / liability insurance: $1,333/yr (8mo)	2026-04-07 22:06:34.409077+00	\N
2d3f24dc-fab7-4d31-ab70-21acf5660f69	7b0dcf33-caf1-4270-9c8b-1f78300f7591	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	6000.0000	Marketing (CA) > Organic Marketing: $6,000/yr	2026-04-07 22:06:34.425994+00	GIVING_SEASON_MARKETING
2b2b793c-fad7-4e19-be4b-3a310d66259e	7b0dcf33-caf1-4270-9c8b-1f78300f7591	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	1800.0000	Marketing (CA) > Paid Media: $1,800/yr	2026-04-07 22:06:34.43498+00	GIVING_SEASON_MARKETING
25b0f4cf-de46-46bb-b85c-18c284227fc3	e9c3de81-b8ea-446f-b73a-d735fb86101f	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	10000.0000	Marketing (US) > Organic Marketing: $10,000/yr (8mo)	2026-04-07 22:06:34.450691+00	GIVING_SEASON_MARKETING
20bc8ae3-3f35-4e13-abd4-d60e163e7876	e9c3de81-b8ea-446f-b73a-d735fb86101f	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	40000.0000	Marketing (US) > Paid Media: $40,000/yr (8mo)	2026-04-07 22:06:34.45893+00	GIVING_SEASON_MARKETING
bb89e293-2767-4bad-979b-5a1443825121	4d0d6ef9-fb98-48e8-a6ed-3dea860503e5	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	3981.0000	CA Txn fees: 130 donors × 2.5 txns × $350 × 3.5%	2026-04-07 22:06:34.478392+00	GIVING_SEASON
371c0258-c5d3-4f1d-bc1f-f6ba7c4edddc	4d0d6ef9-fb98-48e8-a6ed-3dea860503e5	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	1800.0000	CA SaaS: 3 partners × $600/yr	2026-04-07 22:06:34.487371+00	\N
aced2974-7158-4b6c-8d49-3f06c485716c	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	2600.0000	Payment Processing (CA) > Stripe fees: 325 txns × (2.2% + $0.30) on $113,750 volume	2026-04-07 22:06:34.495121+00	GIVING_SEASON
7ad3c3c0-5840-4397-927c-079aa9c4428d	4d0d6ef9-fb98-48e8-a6ed-3dea860503e5	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	1120.0000	US Txn fees: 96 donors × 1.3 txns × $250 × 3.5% (8mo)	2026-04-07 22:06:34.504149+00	GIVING_SEASON
1baffa83-a751-47e4-a601-350a80065edb	4d0d6ef9-fb98-48e8-a6ed-3dea860503e5	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	1000.0000	US SaaS: 3 partners × $500/yr (8mo)	2026-04-07 22:06:34.512809+00	\N
544d055f-0220-4181-a3eb-27d99d695e6f	2e798991-d233-462b-8bf0-416cfbcb129d	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	019d69fb-25d9-72b6-a7e6-615d9ef88bc3	ACTIVITY	EXPENSE	742.0000	Payment Processing (US) > Stripe fees: 128 txns × (2.2% + $0.30) on $32,000 volume (8mo)	2026-04-07 22:06:34.522702+00	GIVING_SEASON
222ea011-7d7a-441b-a49b-836c11728492	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	1680.0000	Infrastructure > Compute & Hosting: $140/mo × 12 (CA+US combined)	2026-04-07 22:06:34.54184+00	\N
caee2ce6-bb6b-4325-ac88-cb6ba37acb0b	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	1776.0000	Infrastructure > PostgreSQL + pgvector: $148/mo × 12 (CA+US combined)	2026-04-07 22:06:34.551464+00	\N
619ec57f-a3dd-406b-9fb4-b006b4546349	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	660.0000	Infrastructure > Redis Cache: $55/mo × 12 (CA+US combined)	2026-04-07 22:06:34.561692+00	\N
84e89974-4a5e-4d42-adf2-b52e8cde99d3	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	960.0000	Infrastructure > Kafka / Event Streaming: $80/mo × 12 (CA+US combined)	2026-04-07 22:06:34.571498+00	\N
c21a01ee-8531-4597-9bd1-647d0ddfea56	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	1992.0000	Infrastructure > AI/LLM Tokens (Claude): $166/mo × 12 (CA+US combined)	2026-04-07 22:06:34.580371+00	\N
10a9a0e7-ac35-415a-b844-68a1bff5acef	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	456.0000	Infrastructure > Email (Resend): $38/mo × 12 (CA+US combined)	2026-04-07 22:06:34.58979+00	\N
39828d50-cb14-448c-a866-d2c1a99027e2	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	432.0000	Infrastructure > SMS (Twilio): $36/mo × 12 (CA+US combined)	2026-04-07 22:06:34.59916+00	\N
aeef1e6a-eb33-4745-a42b-5b680d9ada1c	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	708.0000	Infrastructure > CDN + Storage (S3/CF): $59/mo × 12 (CA+US combined)	2026-04-07 22:06:34.607787+00	\N
6b5280a7-e5cf-4c1f-af63-57b24e6d0eb4	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	468.0000	Infrastructure > Monitoring & Observability: $39/mo × 12 (CA+US combined)	2026-04-07 22:06:34.618778+00	\N
4d55e23c-736b-459f-8f70-fc7f0a459bbe	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	1368.0000	Infrastructure > Search (Elasticsearch): $114/mo × 12 (CA+US combined)	2026-04-07 22:06:34.627022+00	\N
d973e973-74b9-43dc-bcc5-f72ce54b9c76	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12 (CA+US combined)	2026-04-07 22:06:34.636533+00	\N
b953a907-b0b8-46f7-88ec-c744470a4260	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	250.0000	Compliance & Security > PCI-DSS Compliance: $250/yr	2026-04-07 22:06:34.645131+00	\N
26b927b1-bbad-4d51-a686-d24bc8e2c8be	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	5000.0000	Compliance & Security > Penetration Testing: $5,000/yr	2026-04-07 22:06:34.654904+00	\N
2088ad22-7850-4cdd-b190-0484487ca88b	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	25000.0000	Compliance & Security > SOC 2 Type II Audit: $25,000/yr	2026-04-07 22:06:34.665105+00	\N
2e978a93-23fc-4892-9790-26dcf95c9b5b	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:34.674249+00	\N
46cc5ab3-24e9-458c-905e-f7c5c4784d9a	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	12.0000	Organizational (CA) > Annual return (federal): $12/yr	2026-04-07 22:06:34.683711+00	\N
28e69f1a-15a3-472c-89e1-0504a6b7a25f	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	2000.0000	Organizational (CA) > T3010 charity return: $2,000/yr	2026-04-07 22:06:34.691597+00	\N
1f6bbc45-0f24-4763-a097-40e0317d47ce	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	3600.0000	Organizational (CA) > Bookkeeping: $3,600/yr	2026-04-07 22:06:34.699915+00	\N
9f4030d0-86bc-4165-8bd7-73f0f873ba4c	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	8000.0000	Organizational (CA) > Financial audit: $8,000/yr	2026-04-07 22:06:34.708647+00	\N
13d3abc3-cc09-4372-bcd1-44a28bbc1d62	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	500.0000	Organizational (CA) > General liability insurance: $500/yr	2026-04-07 22:06:35.719813+00	\N
3d9c9127-24df-412a-966a-576ab1f79f15	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	2000.0000	Organizational (CA) > Cyber insurance: $2,000/yr	2026-04-07 22:06:35.729728+00	\N
5c68e902-365e-43a2-9967-b379848b39fc	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	5000.0000	Organizational (CA) > Legal retainer: $5,000/yr	2026-04-07 22:06:35.739282+00	\N
9b38cc26-41bb-42cf-a594-275e9439ea04	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	8000.0000	Organizational (US) > US state charity registrations: $8,000/yr	2026-04-07 22:06:35.747877+00	\N
efe7b82f-a36d-4696-9fd5-56492a0bbe29	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	15000.0000	Organizational (US) > US legal counsel: $15,000/yr	2026-04-07 22:06:35.756614+00	\N
916b77e2-40a7-4cc7-8b23-f322d9d5dd97	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	3500.0000	Organizational (US) > Form 990 preparation: $3,500/yr	2026-04-07 22:06:35.766713+00	\N
33993047-7f4d-45ce-82ed-9249c0a86e14	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	6000.0000	Organizational (US) > US bookkeeping: $6,000/yr	2026-04-07 22:06:35.775703+00	\N
a8f570f4-1407-4ef3-926c-1e355d85a3bb	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	3000.0000	Organizational (US) > US D&O / liability insurance: $3,000/yr	2026-04-07 22:06:35.784712+00	\N
ccbc9657-2040-4652-bad4-fd3c1c2b99d6	779a0448-f8b8-4500-b75e-328131937538	019d49be-61ff-77a0-b8d1-78ceed0afacd	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	12000.0000	Marketing (CA) > Organic Marketing: $12,000/yr	2026-04-07 22:06:35.800642+00	GIVING_SEASON_MARKETING
107872e4-b8e4-43ab-a72e-82fa48dd3871	779a0448-f8b8-4500-b75e-328131937538	019d49be-61ff-77a0-b8d1-78ceed0afacd	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	4600.0000	Marketing (CA) > Paid Media: $4,600/yr	2026-04-07 22:06:35.809369+00	GIVING_SEASON_MARKETING
727fdf5d-59f8-450e-9174-47bf2011399a	b7a05a86-dacb-456e-947f-062d8e3b2ce6	019d49be-61ff-77a0-b8d1-78ceed0afacd	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	36000.0000	Marketing (US) > Organic Marketing: $36,000/yr	2026-04-07 22:06:35.824962+00	GIVING_SEASON_MARKETING
68855c2f-445f-467e-a79c-ea4aeabea522	b7a05a86-dacb-456e-947f-062d8e3b2ce6	019d49be-61ff-77a0-b8d1-78ceed0afacd	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	150000.0000	Marketing (US) > Paid Media: $150,000/yr	2026-04-07 22:06:35.832922+00	GIVING_SEASON_MARKETING
e87133b1-01bd-4bca-855b-9e0917869865	0a4785ff-de04-4dc2-8941-37eb5e4186a7	019d49be-61ff-77a0-b8d1-78ceed0afacd	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	30576.0000	CA Txn fees: 700 donors × 3.2 txns × $390 × 3.5%	2026-04-07 22:06:35.847637+00	GIVING_SEASON
cde1a0f3-62a8-48c7-af60-9b8ce72451d8	0a4785ff-de04-4dc2-8941-37eb5e4186a7	019d49be-61ff-77a0-b8d1-78ceed0afacd	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	13500.0000	CA SaaS: 15 partners × $900/yr	2026-04-07 22:06:35.855725+00	\N
67a64298-8b44-453f-a4f1-0b9a10c3d40e	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	19891.0000	Payment Processing (CA) > Stripe fees: 2,240 txns × (2.2% + $0.30) on $873,600 volume	2026-04-07 22:06:35.863642+00	GIVING_SEASON
cbea97fb-0b2e-4136-85f4-277d2f5c32a3	0a4785ff-de04-4dc2-8941-37eb5e4186a7	019d49be-61ff-77a0-b8d1-78ceed0afacd	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	36221.0000	US Txn fees: 1320 donors × 2.8 txns × $280 × 3.5%	2026-04-07 22:06:35.872703+00	GIVING_SEASON
d0373e22-03f6-4573-b84f-95c85d0edbbe	0a4785ff-de04-4dc2-8941-37eb5e4186a7	019d49be-61ff-77a0-b8d1-78ceed0afacd	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	20000.0000	US SaaS: 25 partners × $800/yr	2026-04-07 22:06:35.880852+00	\N
473bcd08-a63c-4866-82ed-0e25b2cae1d0	f6667f38-5ae7-4ed2-a13f-d32ed37d2761	019d49be-61ff-77a0-b8d1-78ceed0afacd	019d49be-61ff-77a0-b8d1-78ceed0afacd	ACTIVITY	EXPENSE	23876.0000	Payment Processing (US) > Stripe fees: 3,696 txns × (2.2% + $0.30) on $1,034,880 volume	2026-04-07 22:06:35.89175+00	GIVING_SEASON
dd4690c2-b9ec-4563-aa4e-e700e084ec28	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	4956.0000	Infrastructure > Compute & Hosting: $413/mo × 12 (CA+US combined)	2026-04-07 22:06:35.907184+00	\N
5908e68d-0ef6-4084-be81-4aa92b44eec8	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	4752.0000	Infrastructure > PostgreSQL + pgvector: $396/mo × 12 (CA+US combined)	2026-04-07 22:06:35.915072+00	\N
c98dfe4f-04b5-45b3-92aa-77c614a88365	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	1836.0000	Infrastructure > Redis Cache: $153/mo × 12 (CA+US combined)	2026-04-07 22:06:35.925688+00	\N
96bcc848-52ff-4b8f-87ac-2f67b7f90f36	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	2592.0000	Infrastructure > Kafka / Event Streaming: $216/mo × 12 (CA+US combined)	2026-04-07 22:06:35.935017+00	\N
4ffcb07a-30c8-4cf9-b9b3-579f8977bb51	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	6156.0000	Infrastructure > AI/LLM Tokens (Claude): $513/mo × 12 (CA+US combined)	2026-04-07 22:06:35.945107+00	\N
2d424fb4-3520-4a48-b9d8-bcf777304054	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	960.0000	Infrastructure > Email (Resend): $80/mo × 12 (CA+US combined)	2026-04-07 22:06:35.953319+00	\N
7d139fb4-0f44-497a-9888-55dab17fece1	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	1164.0000	Infrastructure > SMS (Twilio): $97/mo × 12 (CA+US combined)	2026-04-07 22:06:35.962369+00	\N
ddc2fd63-21c5-4267-a26d-b897aab9b4bd	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	2124.0000	Infrastructure > CDN + Storage (S3/CF): $177/mo × 12 (CA+US combined)	2026-04-07 22:06:35.972225+00	\N
b48236aa-819e-45a7-ab04-458a2a68e433	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	984.0000	Infrastructure > Monitoring & Observability: $82/mo × 12 (CA+US combined)	2026-04-07 22:06:35.983526+00	\N
035c5c5c-e414-4239-a779-5d5ef000b43b	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	3696.0000	Infrastructure > Search (Elasticsearch): $308/mo × 12 (CA+US combined)	2026-04-07 22:06:35.992698+00	\N
f886d449-5249-4272-a1d0-e2aedddf0c3c	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12 (CA+US combined)	2026-04-07 22:06:36.002161+00	\N
12a53e5a-2160-45ec-a94b-bddcb3a63b83	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:36.010593+00	\N
fb872565-947f-44d0-827a-c1a72d6b93db	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	10000.0000	Compliance & Security > Penetration Testing: $10,000/yr	2026-04-07 22:06:36.020032+00	\N
d051a6a2-d1a0-42ae-a78b-14595b7f5751	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	30000.0000	Compliance & Security > SOC 2 Type II Audit: $30,000/yr	2026-04-07 22:06:36.029871+00	\N
26b72b62-6641-43eb-950d-f4ab2bcebaf2	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:36.041746+00	\N
00811b68-ff92-4f4b-8d92-4d186c4282dd	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	12.0000	Organizational (CA) > Annual return (federal): $12/yr	2026-04-07 22:06:36.050387+00	\N
5631154b-6fa7-40fd-a404-d75b00fa9bd0	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	2500.0000	Organizational (CA) > T3010 charity return: $2,500/yr	2026-04-07 22:06:36.059733+00	\N
5ab2b38f-08b5-4e16-b303-ba465ee04f48	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	6000.0000	Organizational (CA) > Bookkeeping: $6,000/yr	2026-04-07 22:06:36.068881+00	\N
0f3d9904-7233-419b-892e-f427b6109dae	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	10000.0000	Organizational (CA) > Financial audit: $10,000/yr	2026-04-07 22:06:36.078484+00	\N
5e5953a2-5f17-465f-8021-96c4ddfa9475	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	800.0000	Organizational (CA) > General liability insurance: $800/yr	2026-04-07 22:06:36.086327+00	\N
ca577b1e-d9a9-4ec9-a34b-85c62a10070b	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	3000.0000	Organizational (CA) > Cyber insurance: $3,000/yr	2026-04-07 22:06:36.094459+00	\N
a11cd7a6-1b78-4a07-a9d1-59e5a9913bae	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	8000.0000	Organizational (CA) > Legal retainer: $8,000/yr	2026-04-07 22:06:36.102606+00	\N
289a033d-0212-4679-94cd-68c3ada19c15	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	12000.0000	Organizational (US) > US state charity registrations: $12,000/yr	2026-04-07 22:06:36.1106+00	\N
986bad74-79db-42c3-b260-e09e0a35fa31	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	20000.0000	Organizational (US) > US legal counsel: $20,000/yr	2026-04-07 22:06:36.1188+00	\N
e42f089b-54ac-4a59-8018-c7e068e67a2b	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	5000.0000	Organizational (US) > Form 990 preparation: $5,000/yr	2026-04-07 22:06:36.126991+00	\N
6c210318-0da2-4fc8-a34f-f197094d91e2	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	9000.0000	Organizational (US) > US bookkeeping: $9,000/yr	2026-04-07 22:06:36.134371+00	\N
fb3e80b5-57e0-4664-ba5b-febc68752e76	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	5000.0000	Organizational (US) > US D&O / liability insurance: $5,000/yr	2026-04-07 22:06:36.14294+00	\N
53141969-4537-46c8-9c8e-39a58dd67e14	60fb9cd9-b059-4035-a263-fac6bda05ab7	019d69fb-260d-71df-abd1-028761d5e6c0	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	18000.0000	Marketing (CA) > Organic Marketing: $18,000/yr	2026-04-07 22:06:37.16034+00	GIVING_SEASON_MARKETING
f636e245-e557-4dc9-bd47-afecde2f3ff9	60fb9cd9-b059-4035-a263-fac6bda05ab7	019d69fb-260d-71df-abd1-028761d5e6c0	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	53000.0000	Marketing (CA) > Paid Media: $53,000/yr	2026-04-07 22:06:37.172159+00	GIVING_SEASON_MARKETING
03b5dd51-0b38-42c5-be66-4f799cbc6f8c	574cbbac-7cf6-46c9-a59a-a75747f8ab38	019d69fb-260d-71df-abd1-028761d5e6c0	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	60000.0000	Marketing (US) > Organic Marketing: $60,000/yr	2026-04-07 22:06:37.193408+00	GIVING_SEASON_MARKETING
5f243b4d-a4b5-4346-945f-384859618754	574cbbac-7cf6-46c9-a59a-a75747f8ab38	019d69fb-260d-71df-abd1-028761d5e6c0	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	240000.0000	Marketing (US) > Paid Media: $240,000/yr	2026-04-07 22:06:37.20515+00	GIVING_SEASON_MARKETING
d8d4f1e9-8b2f-40e8-9a0d-1c91c78aa4dd	ba325705-983f-4d8c-92c7-994dce1dc82a	019d69fb-260d-71df-abd1-028761d5e6c0	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	129148.0000	CA Txn fees: 2380 donors × 3.8 txns × $420 × 3.4%	2026-04-07 22:06:37.224267+00	GIVING_SEASON
c2d8bc57-6a3b-4204-9dc2-581655c7654d	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	86280.0000	Payment Processing (CA) > Stripe fees: 9,044 txns × (2.2% + $0.30) on $3,798,480 volume	2026-04-07 22:06:37.24388+00	GIVING_SEASON
82f47879-f3cb-430f-afbc-bf8239172bf3	ba325705-983f-4d8c-92c7-994dce1dc82a	019d69fb-260d-71df-abd1-028761d5e6c0	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	188877.0000	US Txn fees: 5600 donors × 3.2 txns × $310 × 3.4%	2026-04-07 22:06:37.255485+00	GIVING_SEASON
c3c268ff-59d5-485d-ac64-af8af93a3740	ba325705-983f-4d8c-92c7-994dce1dc82a	019d69fb-260d-71df-abd1-028761d5e6c0	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	88000.0000	US SaaS: 80 partners × $1100/yr	2026-04-07 22:06:37.268904+00	\N
26ab2d2b-14ae-407c-8bf1-bd3db376dee2	914686cc-7c59-45fb-b29f-fb052e13dda8	019d69fb-260d-71df-abd1-028761d5e6c0	019d69fb-260d-71df-abd1-028761d5e6c0	ACTIVITY	EXPENSE	127590.0000	Payment Processing (US) > Stripe fees: 17,920 txns × (2.2% + $0.30) on $5,555,200 volume	2026-04-07 22:06:37.278418+00	GIVING_SEASON
f92bb1e7-fd53-4512-a24e-cf570f21df77	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	7728.0000	Infrastructure > Compute & Hosting: $644/mo × 12 (CA+US combined)	2026-04-07 22:06:37.296139+00	\N
695d13fa-af32-48a2-9ca9-c8922c5b31ed	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	9108.0000	Infrastructure > PostgreSQL + pgvector: $759/mo × 12 (CA+US combined)	2026-04-07 22:06:37.306031+00	\N
6cf20c76-24ab-4022-acee-1777b66b8d88	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	2472.0000	Infrastructure > Redis Cache: $206/mo × 12 (CA+US combined)	2026-04-07 22:06:37.316333+00	\N
6802927a-1c84-4c5f-bbb4-c34df83e7efa	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	6000.0000	Infrastructure > Kafka / Event Streaming: $500/mo × 12 (CA+US combined)	2026-04-07 22:06:37.325964+00	\N
d64b3cc8-81da-406e-80d9-82ba5477d5b4	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	14136.0000	Infrastructure > AI/LLM Tokens (Claude): $1178/mo × 12 (CA+US combined)	2026-04-07 22:06:37.339258+00	\N
9624634b-eda4-4a5c-bd34-57e2505a88ec	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	1908.0000	Infrastructure > Email (Resend): $159/mo × 12 (CA+US combined)	2026-04-07 22:06:37.349736+00	\N
25101dc0-b15d-4dcf-bd0d-d42dd020aa59	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	2700.0000	Infrastructure > SMS (Twilio): $225/mo × 12 (CA+US combined)	2026-04-07 22:06:37.359089+00	\N
c1f2aca9-a8ad-4220-8359-3431b2fe5bec	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	3528.0000	Infrastructure > CDN + Storage (S3/CF): $294/mo × 12 (CA+US combined)	2026-04-07 22:06:37.368847+00	\N
3451d6bd-7646-42f0-a13f-140c39fda0e2	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	1500.0000	Infrastructure > Monitoring & Observability: $125/mo × 12 (CA+US combined)	2026-04-07 22:06:37.377875+00	\N
21a3170a-02b7-42f4-87cf-bacc17ba58be	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	5400.0000	Infrastructure > Search (Elasticsearch): $450/mo × 12 (CA+US combined)	2026-04-07 22:06:37.387568+00	\N
a3211ced-3fc4-4faf-9698-a0090d228673	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12 (CA+US combined)	2026-04-07 22:06:37.39539+00	\N
cdb1de6b-acbb-4914-b015-fc9242ba6749	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:37.404702+00	\N
e7dabc47-70d0-46f5-a025-eb253b07fac7	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	10000.0000	Compliance & Security > Penetration Testing: $10,000/yr	2026-04-07 22:06:37.4127+00	\N
6c3f786e-2835-47bb-a881-fb7fc1f8c9df	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	35000.0000	Compliance & Security > SOC 2 Type II Audit: $35,000/yr	2026-04-07 22:06:37.421591+00	\N
1aeaaec0-2f80-40c0-9818-95fbadfb6349	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:37.429949+00	\N
732c553f-95f7-497e-9717-8f6a29913972	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	12.0000	Organizational (CA) > Annual return (federal): $12/yr	2026-04-07 22:06:37.43916+00	\N
01d0068a-7a53-43ff-8cc5-ff0f4f4ebe7e	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	3000.0000	Organizational (CA) > T3010 charity return: $3,000/yr	2026-04-07 22:06:37.447365+00	\N
f8c48afa-2031-4c7b-bb7c-ce5581c4fd87	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	9600.0000	Organizational (CA) > Bookkeeping: $9,600/yr	2026-04-07 22:06:37.456212+00	\N
99facef2-97a8-4843-a7bf-c48069812288	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	15000.0000	Organizational (CA) > Financial audit: $15,000/yr	2026-04-07 22:06:37.465184+00	\N
5d0c2813-7041-4027-bf5d-43952989549b	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	1000.0000	Organizational (CA) > General liability insurance: $1,000/yr	2026-04-07 22:06:37.474493+00	\N
ef422e98-3451-4959-91d3-ccd8f1bc2d30	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	5000.0000	Organizational (CA) > Cyber insurance: $5,000/yr	2026-04-07 22:06:37.485982+00	\N
6665d14b-c81f-416d-9ae7-483246d2941b	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	10000.0000	Organizational (CA) > Legal retainer: $10,000/yr	2026-04-07 22:06:37.494383+00	\N
96085ea1-9d95-4143-ad72-0ae15190a3a1	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	15000.0000	Organizational (US) > US state charity registrations: $15,000/yr	2026-04-07 22:06:37.504137+00	\N
5cf59efc-cffe-46b5-8288-3618aa06cc68	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	25000.0000	Organizational (US) > US legal counsel: $25,000/yr	2026-04-07 22:06:37.5127+00	\N
626f166f-1eda-4776-a6bc-ad55f8a6a42e	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	7500.0000	Organizational (US) > Form 990 preparation: $7,500/yr	2026-04-07 22:06:37.521842+00	\N
9aabed3a-eb9f-48f7-b04a-d35e0224adfc	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	12000.0000	Organizational (US) > US bookkeeping: $12,000/yr	2026-04-07 22:06:37.530899+00	\N
d7771d41-a6c5-4235-9aa4-80111626e6cf	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	8000.0000	Organizational (US) > US D&O / liability insurance: $8,000/yr	2026-04-07 22:06:37.540624+00	\N
dff9a701-55e9-4325-8f02-9ff7bf69a2ac	6e8ac4cd-5936-4492-9162-9b6a6ca51ca0	019d49be-6213-75dc-9a73-ae7f08e23d71	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	24000.0000	Marketing (CA) > Organic Marketing: $24,000/yr	2026-04-07 22:06:37.557324+00	GIVING_SEASON_MARKETING
7b8da4e8-82dd-407c-b710-29aed403413d	6e8ac4cd-5936-4492-9162-9b6a6ca51ca0	019d49be-6213-75dc-9a73-ae7f08e23d71	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	100400.0000	Marketing (CA) > Paid Media: $100,400/yr	2026-04-07 22:06:37.568034+00	GIVING_SEASON_MARKETING
c6e23c19-79c6-47ef-926d-a5fa1872f9ec	b5f1e310-1daa-4a1e-b664-3635a0f8b648	019d49be-6213-75dc-9a73-ae7f08e23d71	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	84000.0000	Marketing (US) > Organic Marketing: $84,000/yr	2026-04-07 22:06:37.585286+00	GIVING_SEASON_MARKETING
85b4ce2e-e8bc-404e-a486-d28a4ea77701	b5f1e310-1daa-4a1e-b664-3635a0f8b648	019d49be-6213-75dc-9a73-ae7f08e23d71	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	320000.0000	Marketing (US) > Paid Media: $320,000/yr	2026-04-07 22:06:37.593905+00	GIVING_SEASON_MARKETING
559c6016-d4d0-4a55-ac57-ef8038107428	c77a5c5f-6d09-4484-925a-be67ff45b902	019d49be-6213-75dc-9a73-ae7f08e23d71	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	363409.0000	CA Txn fees: 5700 donors × 4.2 txns × $460 × 3.3%	2026-04-07 22:06:37.61048+00	GIVING_SEASON
d0dfc312-785e-43b5-936c-fbc01f1aadc9	c77a5c5f-6d09-4484-925a-be67ff45b902	019d49be-6213-75dc-9a73-ae7f08e23d71	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	180000.0000	CA SaaS: 120 partners × $1500/yr	2026-04-07 22:06:37.621527+00	\N
fbcf48f6-ebeb-44f9-8162-74e1c90f09ed	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	249455.0000	Payment Processing (CA) > Stripe fees: 23,940 txns × (2.2% + $0.30) on $11,012,400 volume	2026-04-07 22:06:37.630577+00	GIVING_SEASON
03008463-ff5c-4d35-a1c0-11a7b227f081	c77a5c5f-6d09-4484-925a-be67ff45b902	019d49be-6213-75dc-9a73-ae7f08e23d71	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	708824.0000	US Txn fees: 16150 donors × 3.8 txns × $350 × 3.3%	2026-04-07 22:06:38.641674+00	GIVING_SEASON
97ec1824-572e-4025-a63a-e8ae936e65b7	c77a5c5f-6d09-4484-925a-be67ff45b902	019d49be-6213-75dc-9a73-ae7f08e23d71	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	252000.0000	US SaaS: 180 partners × $1400/yr	2026-04-07 22:06:38.651985+00	\N
18d18816-7639-4817-a10a-91b161857048	405d3c62-7f1f-42dc-95c8-b01875f886fc	019d49be-6213-75dc-9a73-ae7f08e23d71	019d49be-6213-75dc-9a73-ae7f08e23d71	ACTIVITY	EXPENSE	490960.0000	Payment Processing (US) > Stripe fees: 61,370 txns × (2.2% + $0.30) on $21,479,500 volume	2026-04-07 22:06:38.661266+00	GIVING_SEASON
7717278f-7caa-478a-a03d-9e52902704d0	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	34433aa4-19de-421d-9a9b-2d667ad084c1	ACTIVITY	EXPENSE	12600.0000	Infrastructure > Compute & Hosting: $1050/mo × 12 (CA+US combined)	2026-04-07 22:06:38.679095+00	\N
9cb32b9b-f8fc-4ba4-a4c7-f1bdd325e8b9	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	8d0288d3-055f-4eaf-8652-42bb30fd5873	ACTIVITY	EXPENSE	16800.0000	Infrastructure > PostgreSQL + pgvector: $1400/mo × 12 (CA+US combined)	2026-04-07 22:06:38.68853+00	\N
d8303b62-aca4-45a5-b873-f0a16d6c41b4	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	7ba92191-518a-4174-bd8d-a23e0ee47a6d	ACTIVITY	EXPENSE	3600.0000	Infrastructure > Redis Cache: $300/mo × 12 (CA+US combined)	2026-04-07 22:06:38.69719+00	\N
7f54e577-80da-4f2d-9968-c6bbbcab5c6c	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	6e16c90b-4769-434e-8412-cc5c26594a71	ACTIVITY	EXPENSE	12000.0000	Infrastructure > Kafka / Event Streaming: $1000/mo × 12 (CA+US combined)	2026-04-07 22:06:38.705969+00	\N
454863b2-d8fc-4e6a-9950-6282cb4e470d	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	93c74bbd-8133-426e-9cac-abd8ced995d5	ACTIVITY	EXPENSE	28200.0000	Infrastructure > AI/LLM Tokens (Claude): $2350/mo × 12 (CA+US combined)	2026-04-07 22:06:38.714431+00	\N
afd7dc66-2fbf-418f-9934-7b80fcc4fa8e	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	43adf083-ea6d-4704-b398-9ed272a86b18	ACTIVITY	EXPENSE	3600.0000	Infrastructure > Email (Resend): $300/mo × 12 (CA+US combined)	2026-04-07 22:06:38.723653+00	\N
87e32307-be26-4fad-b3d5-96223078ca90	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	4eb8f415-eed5-4b43-bbd1-ef9b69ddbfa3	ACTIVITY	EXPENSE	5400.0000	Infrastructure > SMS (Twilio): $450/mo × 12 (CA+US combined)	2026-04-07 22:06:38.732078+00	\N
ebc2249b-5681-4af2-984b-b482cd240698	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	c668d0bf-c953-44f9-8104-adde26bedfc3	ACTIVITY	EXPENSE	6000.0000	Infrastructure > CDN + Storage (S3/CF): $500/mo × 12 (CA+US combined)	2026-04-07 22:06:38.742022+00	\N
6e2ab0c6-55c4-4fa2-8c1e-270315e37267	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	e47464be-136b-4946-8b51-7e006c51bac7	ACTIVITY	EXPENSE	2400.0000	Infrastructure > Monitoring & Observability: $200/mo × 12 (CA+US combined)	2026-04-07 22:06:38.751879+00	\N
5521e172-0468-4f55-ade0-3fbedaebc767	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	8d8587eb-2ee6-4813-9cc1-14236c1dbec3	ACTIVITY	EXPENSE	8400.0000	Infrastructure > Search (Elasticsearch): $700/mo × 12 (CA+US combined)	2026-04-07 22:06:38.760033+00	\N
2faaf22e-901a-405f-a966-38504f850195	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	0e4db64c-596d-4a5b-801e-47aecd224e94	ACTIVITY	EXPENSE	180.0000	Infrastructure > Domain + SSL: $15/mo × 12 (CA+US combined)	2026-04-07 22:06:38.771278+00	\N
d72da0d7-e98d-4959-9112-1aa87c0c4a17	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	7daafb34-dae0-43ca-ab4d-0794e95e2b78	ACTIVITY	EXPENSE	500.0000	Compliance & Security > PCI-DSS Compliance: $500/yr	2026-04-07 22:06:38.780517+00	\N
11e85202-b87c-4b6b-b9a3-a643d99f1332	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	84dc7560-979f-48cf-909e-d3c16474fdef	ACTIVITY	EXPENSE	15000.0000	Compliance & Security > Penetration Testing: $15,000/yr	2026-04-07 22:06:38.790748+00	\N
f9e47bed-f3cd-4db7-a672-686962e0e1f1	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	32834366-2861-4c43-8ee9-6b740c248a41	ACTIVITY	EXPENSE	40000.0000	Compliance & Security > SOC 2 Type II Audit: $40,000/yr	2026-04-07 22:06:38.801453+00	\N
3c1f6610-8344-4c5f-ad51-48fa763d4b51	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	b6846138-9d41-4e31-8217-5f49035cd871	ACTIVITY	EXPENSE	99.0000	Compliance & Security > Apple Developer: $99/yr	2026-04-07 22:06:38.812323+00	\N
d32bc9f0-6db9-4879-996b-503874bb26c2	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12.0000	Organizational (CA) > Annual return (federal): $12/yr	2026-04-07 22:06:38.822523+00	\N
bc1ba6cd-de2a-4c7e-a624-b79ed547bef0	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	3500.0000	Organizational (CA) > T3010 charity return: $3,500/yr	2026-04-07 22:06:38.832017+00	\N
e0442c3e-d9ee-40d8-bd93-982775b3aab3	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12000.0000	Organizational (CA) > Bookkeeping: $12,000/yr	2026-04-07 22:06:38.843124+00	\N
0fb0df7a-5a9e-410a-ae60-77e22de698d4	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	20000.0000	Organizational (CA) > Financial audit: $20,000/yr	2026-04-07 22:06:38.852777+00	\N
52b0810f-b5aa-4a1f-ac76-4e7391345152	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	1500.0000	Organizational (CA) > General liability insurance: $1,500/yr	2026-04-07 22:06:38.861269+00	\N
3a50ef36-168e-47e3-b307-091bf78900d9	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	8000.0000	Organizational (CA) > Cyber insurance: $8,000/yr	2026-04-07 22:06:38.871526+00	\N
0cf9c755-7494-4fb6-9d5b-255f0ecc1789	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12000.0000	Organizational (CA) > Legal retainer: $12,000/yr	2026-04-07 22:06:38.88015+00	\N
619c9326-fa23-4190-ba8c-2c7de2d1cfc6	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	18000.0000	Organizational (US) > US state charity registrations: $18,000/yr	2026-04-07 22:06:38.889673+00	\N
ab047912-568e-49c0-8b43-556acc1acc33	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	30000.0000	Organizational (US) > US legal counsel: $30,000/yr	2026-04-07 22:06:38.898292+00	\N
235234fe-f577-46d8-9255-e24b7b16a709	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	10000.0000	Organizational (US) > Form 990 preparation: $10,000/yr	2026-04-07 22:06:38.907404+00	\N
5a890e3b-133e-4e00-8ccb-5561eefb1eb0	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	15000.0000	Organizational (US) > US bookkeeping: $15,000/yr	2026-04-07 22:06:38.915739+00	\N
d3584708-0d71-4e6e-87c6-c87752bec1cb	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	12000.0000	Organizational (US) > US D&O / liability insurance: $12,000/yr	2026-04-07 22:06:38.924912+00	\N
e76bba80-d336-4fb0-96d4-1dce0ad1a985	7f36e757-55eb-4f31-9ea2-66eac610184f	019d49be-621b-7306-bb7c-cc9d86263b46	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	30000.0000	Marketing (CA) > Organic Marketing: $30,000/yr	2026-04-07 22:06:38.9427+00	GIVING_SEASON_MARKETING
65cd5f1c-e049-4b80-9e61-bb141169fe04	7f36e757-55eb-4f31-9ea2-66eac610184f	019d49be-621b-7306-bb7c-cc9d86263b46	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	148800.0000	Marketing (CA) > Paid Media: $148,800/yr	2026-04-07 22:06:38.951114+00	GIVING_SEASON_MARKETING
61eb730d-9f81-4b46-9232-7c1bafa84ee4	66e10dad-ac78-418a-9f82-b2b48a16f09b	019d49be-621b-7306-bb7c-cc9d86263b46	3ef5fb5a-91a0-4c45-85e4-ff56d32f9a10	ACTIVITY	EXPENSE	108000.0000	Marketing (US) > Organic Marketing: $108,000/yr	2026-04-07 22:06:38.967607+00	GIVING_SEASON_MARKETING
d9e8ed10-a892-458e-be41-37820d1f1af1	66e10dad-ac78-418a-9f82-b2b48a16f09b	019d49be-621b-7306-bb7c-cc9d86263b46	62fd3daf-9c85-4cd9-a0d2-78c94913a0a2	ACTIVITY	EXPENSE	400000.0000	Marketing (US) > Paid Media: $400,000/yr	2026-04-07 22:06:38.976476+00	GIVING_SEASON_MARKETING
ddc082a5-21fa-49a3-a2bb-db3efee307b6	a0b7badc-3405-4037-9044-2ed98db76bfc	019d49be-621b-7306-bb7c-cc9d86263b46	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	887040.0000	CA Txn fees: 11550 donors × 4.8 txns × $500 × 3.2%	2026-04-07 22:06:38.996867+00	GIVING_SEASON
84a5bcd5-3a48-4bc2-a856-b9b17f4f0e1f	a0b7badc-3405-4037-9044-2ed98db76bfc	019d49be-621b-7306-bb7c-cc9d86263b46	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	450000.0000	CA SaaS: 250 partners × $1800/yr	2026-04-07 22:06:39.008722+00	\N
b7ddd921-9cb3-4210-b624-f2fa7021f29d	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	626472.0000	Payment Processing (CA) > Stripe fees: 55,440 txns × (2.2% + $0.30) on $27,720,000 volume	2026-04-07 22:06:39.017225+00	GIVING_SEASON
b0418fec-fe3d-4814-a391-006145f84c1c	a0b7badc-3405-4037-9044-2ed98db76bfc	019d49be-621b-7306-bb7c-cc9d86263b46	e09957a0-00dc-4f3f-b00d-ceb5774a4f78	ACTIVITY	REVENUE	2188800.0000	US Txn fees: 38000 donors × 4.5 txns × $400 × 3.2%	2026-04-07 22:06:39.026113+00	GIVING_SEASON
051f7b17-1304-43eb-a617-71d8bce5599c	a0b7badc-3405-4037-9044-2ed98db76bfc	019d49be-621b-7306-bb7c-cc9d86263b46	5a484a32-7536-41a1-8784-f4fde31b2939	ACTIVITY	REVENUE	680000.0000	US SaaS: 400 partners × $1700/yr	2026-04-07 22:06:39.036067+00	\N
20d0ef16-d7f9-420d-960d-1e53e14da47c	b7dbf340-672c-409a-8f18-7a6ab451536c	019d49be-621b-7306-bb7c-cc9d86263b46	019d49be-621b-7306-bb7c-cc9d86263b46	ACTIVITY	EXPENSE	1556100.0000	Payment Processing (US) > Stripe fees: 171,000 txns × (2.2% + $0.30) on $68,400,000 volume	2026-04-07 22:06:39.044348+00	GIVING_SEASON
0e9d045d-ac94-40ed-be01-ca5ab82ccfb2	9caeecba-c33d-49bc-9d18-d137c0815394	019d9d02-44f4-779b-8b66-169da3ce54ad	d18456db-2927-4de5-9004-a128e6e8cd67	ACTIVITY	REVENUE	1669.0000	Admin fee: avg AUM $278K × 0.60% = $1,669 (30 accounts, end AUM $0.6M)	2026-04-17 19:54:25.396366+00	\N
32ae0a7c-d785-476f-b66d-943a4ec6c8d0	9caeecba-c33d-49bc-9d18-d137c0815394	019d9d02-44f4-779b-8b66-169da3ce54ad	7b142bfb-a7ee-403d-b8fb-960939aa2e7c	ACTIVITY	REVENUE	417.0000	Investment spread: avg AUM $278K × 0.15% = $417	2026-04-17 19:54:25.519784+00	\N
1da927a9-2d60-40f5-864d-b293c0ff3ec4	6dd01468-a988-4ade-9eab-0609a23f9157	019d9d02-44f4-779b-8b66-169da3ce54ad	b18cadfe-f1e2-449b-8e62-8444a869e91d	ACTIVITY	EXPENSE	15000.0000	DAF Operations > DAF Compliance Staff: $15,000/yr	2026-04-17 19:54:25.566603+00	\N
ace9f86c-1be0-41e5-96a4-e15c023dd20c	6dd01468-a988-4ade-9eab-0609a23f9157	019d9d02-44f4-779b-8b66-169da3ce54ad	33678e67-ce0c-4f74-9658-d94a0887206c	ACTIVITY	EXPENSE	10000.0000	DAF Operations > DAF Technology Platform: $10,000/yr	2026-04-17 19:54:25.587984+00	\N
51736e1f-41fa-447a-8172-9addd97a3a78	6dd01468-a988-4ade-9eab-0609a23f9157	019d9d02-44f4-779b-8b66-169da3ce54ad	453d2f0e-e56a-4b6a-8b7d-9d319343b5f3	ACTIVITY	EXPENSE	2000.0000	DAF Operations > Fidelity Bond & E&O Insurance: $2,000/yr	2026-04-17 19:54:25.612368+00	\N
d6c588f3-133f-46c9-b747-e191e556d828	6dd01468-a988-4ade-9eab-0609a23f9157	019d9d02-44f4-779b-8b66-169da3ce54ad	2b09d59d-d7a8-4490-ac43-f274d074e580	ACTIVITY	EXPENSE	3000.0000	DAF Operations > Investment Legal Counsel: $3,000/yr	2026-04-17 19:54:25.633356+00	\N
aa26e377-bc87-4026-9186-67a7a9690ef2	6dd01468-a988-4ade-9eab-0609a23f9157	019d9d02-44f4-779b-8b66-169da3ce54ad	899a1112-9e55-4fc6-a56b-42a1ac007bac	ACTIVITY	EXPENSE	2000.0000	DAF Operations > DAF Marketing & Acquisition: $2,000/yr	2026-04-17 19:54:25.651572+00	\N
b65185b5-9525-47e6-9ea3-7c36d973ad2b	f353cee7-b0e0-4740-8541-a926cb2fe55e	019d9d02-456e-7759-a25a-a2bdf8939b29	d18456db-2927-4de5-9004-a128e6e8cd67	ACTIVITY	REVENUE	9636.0000	Admin fee: avg AUM $1606K × 0.60% = $9,636 (110 accounts, end AUM $2.7M)	2026-04-17 19:54:25.697898+00	\N
c77ef059-355e-4dea-a823-5c738d8395f1	f353cee7-b0e0-4740-8541-a926cb2fe55e	019d9d02-456e-7759-a25a-a2bdf8939b29	7b142bfb-a7ee-403d-b8fb-960939aa2e7c	ACTIVITY	REVENUE	2409.0000	Investment spread: avg AUM $1606K × 0.15% = $2,409	2026-04-17 19:54:25.715471+00	\N
62a1ea08-ef4a-4704-8b09-0adf9d994cd2	305fbb47-a4fc-428d-87df-01f80c542144	019d9d02-456e-7759-a25a-a2bdf8939b29	b18cadfe-f1e2-449b-8e62-8444a869e91d	ACTIVITY	EXPENSE	20000.0000	DAF Operations > DAF Compliance Staff: $20,000/yr	2026-04-17 19:54:25.752047+00	\N
d6614da4-ce77-4c04-8ec2-6fee0b186c2f	305fbb47-a4fc-428d-87df-01f80c542144	019d9d02-456e-7759-a25a-a2bdf8939b29	33678e67-ce0c-4f74-9658-d94a0887206c	ACTIVITY	EXPENSE	15000.0000	DAF Operations > DAF Technology Platform: $15,000/yr	2026-04-17 19:54:25.772463+00	\N
5d88fb6b-bca7-4caa-a659-55b299ae30e5	305fbb47-a4fc-428d-87df-01f80c542144	019d9d02-456e-7759-a25a-a2bdf8939b29	453d2f0e-e56a-4b6a-8b7d-9d319343b5f3	ACTIVITY	EXPENSE	3000.0000	DAF Operations > Fidelity Bond & E&O Insurance: $3,000/yr	2026-04-17 19:54:25.802525+00	\N
cea235bc-15c7-40ae-9d3c-5aa63808a434	305fbb47-a4fc-428d-87df-01f80c542144	019d9d02-456e-7759-a25a-a2bdf8939b29	2b09d59d-d7a8-4490-ac43-f274d074e580	ACTIVITY	EXPENSE	5000.0000	DAF Operations > Investment Legal Counsel: $5,000/yr	2026-04-17 19:54:26.819672+00	\N
eefbebfc-2d4a-4863-ba4a-bd3371230ffe	305fbb47-a4fc-428d-87df-01f80c542144	019d9d02-456e-7759-a25a-a2bdf8939b29	899a1112-9e55-4fc6-a56b-42a1ac007bac	ACTIVITY	EXPENSE	5000.0000	DAF Operations > DAF Marketing & Acquisition: $5,000/yr	2026-04-17 19:54:26.836046+00	\N
96164a09-5e63-4c4a-9e8e-7a88442d31a6	bc780782-3bd5-48df-916d-96ff883b0b25	019d9d02-4580-707c-81d8-94600926add6	d18456db-2927-4de5-9004-a128e6e8cd67	ACTIVITY	REVENUE	37902.0000	Admin fee: avg AUM $6317K × 0.60% = $37,902 (310 accounts, end AUM $10.0M)	2026-04-17 19:54:26.867636+00	\N
ac2fa54a-c44e-4b47-99eb-812ebff17e9b	bc780782-3bd5-48df-916d-96ff883b0b25	019d9d02-4580-707c-81d8-94600926add6	7b142bfb-a7ee-403d-b8fb-960939aa2e7c	ACTIVITY	REVENUE	9476.0000	Investment spread: avg AUM $6317K × 0.15% = $9,476	2026-04-17 19:54:26.883157+00	\N
fd7d3f37-3251-48b8-a639-3ff1e6d96fc3	647de4c1-463a-4115-b948-97088be1732f	019d9d02-4580-707c-81d8-94600926add6	b18cadfe-f1e2-449b-8e62-8444a869e91d	ACTIVITY	EXPENSE	35000.0000	DAF Operations > DAF Compliance Staff: $35,000/yr	2026-04-17 19:54:26.91594+00	\N
819188cf-745d-4065-ba41-3247be7c2a8d	647de4c1-463a-4115-b948-97088be1732f	019d9d02-4580-707c-81d8-94600926add6	93587307-c8fc-4010-be99-d603a7b2b9dc	ACTIVITY	EXPENSE	5000.0000	DAF Operations > Investment Committee: $5,000/yr	2026-04-17 19:54:26.931342+00	\N
64c1c1a6-2c78-4a9a-a9d4-b12337963cbc	647de4c1-463a-4115-b948-97088be1732f	019d9d02-4580-707c-81d8-94600926add6	33678e67-ce0c-4f74-9658-d94a0887206c	ACTIVITY	EXPENSE	20000.0000	DAF Operations > DAF Technology Platform: $20,000/yr	2026-04-17 19:54:26.961125+00	\N
c176deb9-82e7-4084-8c64-0e5abaee65d6	647de4c1-463a-4115-b948-97088be1732f	019d9d02-4580-707c-81d8-94600926add6	453d2f0e-e56a-4b6a-8b7d-9d319343b5f3	ACTIVITY	EXPENSE	5000.0000	DAF Operations > Fidelity Bond & E&O Insurance: $5,000/yr	2026-04-17 19:54:26.977632+00	\N
5063aa46-8090-4b6a-9691-48351f18abb1	647de4c1-463a-4115-b948-97088be1732f	019d9d02-4580-707c-81d8-94600926add6	2b09d59d-d7a8-4490-ac43-f274d074e580	ACTIVITY	EXPENSE	8000.0000	DAF Operations > Investment Legal Counsel: $8,000/yr	2026-04-17 19:54:26.996472+00	\N
c21f43a0-efa3-4d8e-83a5-18ee4bdbdc8b	647de4c1-463a-4115-b948-97088be1732f	019d9d02-4580-707c-81d8-94600926add6	899a1112-9e55-4fc6-a56b-42a1ac007bac	ACTIVITY	EXPENSE	8000.0000	DAF Operations > DAF Marketing & Acquisition: $8,000/yr	2026-04-17 19:54:27.013345+00	\N
b3039337-f7d1-40bc-833f-0fcb1ebcdd85	d18b1dee-09f2-4739-95b3-743556123433	019d9d02-4593-72db-ab08-e0f8ead38a7f	d18456db-2927-4de5-9004-a128e6e8cd67	ACTIVITY	REVENUE	116855.0000	Admin fee: avg AUM $19476K × 0.60% = $116,855 (710 accounts, end AUM $29.0M)	2026-04-17 19:54:27.043453+00	\N
3a58c6a2-4c1c-41b7-a1b2-5c82a57360ee	d18b1dee-09f2-4739-95b3-743556123433	019d9d02-4593-72db-ab08-e0f8ead38a7f	7b142bfb-a7ee-403d-b8fb-960939aa2e7c	ACTIVITY	REVENUE	29214.0000	Investment spread: avg AUM $19476K × 0.15% = $29,214	2026-04-17 19:54:27.059356+00	\N
9dd68e74-6bb5-4231-bfa9-d103c9840c87	3de06e05-afee-49e6-8f88-f56cf0b34add	019d9d02-4593-72db-ab08-e0f8ead38a7f	b18cadfe-f1e2-449b-8e62-8444a869e91d	ACTIVITY	EXPENSE	55000.0000	DAF Operations > DAF Compliance Staff: $55,000/yr	2026-04-17 19:54:27.106451+00	\N
c0fb7c6d-4133-40e5-9968-5ec7324f7dec	3de06e05-afee-49e6-8f88-f56cf0b34add	019d9d02-4593-72db-ab08-e0f8ead38a7f	93587307-c8fc-4010-be99-d603a7b2b9dc	ACTIVITY	EXPENSE	10000.0000	DAF Operations > Investment Committee: $10,000/yr	2026-04-17 19:54:27.13424+00	\N
d4f6a45c-7a97-4f35-8b03-9c46e90a5db0	3de06e05-afee-49e6-8f88-f56cf0b34add	019d9d02-4593-72db-ab08-e0f8ead38a7f	33678e67-ce0c-4f74-9658-d94a0887206c	ACTIVITY	EXPENSE	30000.0000	DAF Operations > DAF Technology Platform: $30,000/yr	2026-04-17 19:54:27.155862+00	\N
19548a5c-2ec3-479e-91ab-67ca3fc040f1	3de06e05-afee-49e6-8f88-f56cf0b34add	019d9d02-4593-72db-ab08-e0f8ead38a7f	453d2f0e-e56a-4b6a-8b7d-9d319343b5f3	ACTIVITY	EXPENSE	8000.0000	DAF Operations > Fidelity Bond & E&O Insurance: $8,000/yr	2026-04-17 19:54:27.173514+00	\N
71bd0cfc-432d-4c26-abd1-30da1a75a7f3	3de06e05-afee-49e6-8f88-f56cf0b34add	019d9d02-4593-72db-ab08-e0f8ead38a7f	2b09d59d-d7a8-4490-ac43-f274d074e580	ACTIVITY	EXPENSE	12000.0000	DAF Operations > Investment Legal Counsel: $12,000/yr	2026-04-17 19:54:27.188738+00	\N
87b25c23-3918-4bf6-9aa5-0d9939d365db	3de06e05-afee-49e6-8f88-f56cf0b34add	019d9d02-4593-72db-ab08-e0f8ead38a7f	899a1112-9e55-4fc6-a56b-42a1ac007bac	ACTIVITY	EXPENSE	12000.0000	DAF Operations > DAF Marketing & Acquisition: $12,000/yr	2026-04-17 19:54:27.210388+00	\N
125c7617-ed73-462b-b461-c5613b07f2d0	80b60360-f979-496d-aab3-bd8bc003e4fa	019d9d02-45aa-779b-aee3-e341876c26fa	d18456db-2927-4de5-9004-a128e6e8cd67	ACTIVITY	REVENUE	297462.0000	Admin fee: avg AUM $49577K × 0.60% = $297,462 (1410 accounts, end AUM $70.2M)	2026-04-17 19:54:27.238949+00	\N
c541c5d7-a58f-4cf4-9836-520a047512e8	80b60360-f979-496d-aab3-bd8bc003e4fa	019d9d02-45aa-779b-aee3-e341876c26fa	7b142bfb-a7ee-403d-b8fb-960939aa2e7c	ACTIVITY	REVENUE	74366.0000	Investment spread: avg AUM $49577K × 0.15% = $74,366	2026-04-17 19:54:27.25301+00	\N
8fc5552e-9905-4908-a6c4-51724d191b82	c5852cf0-3922-4069-9862-84441380dc65	019d9d02-45aa-779b-aee3-e341876c26fa	b18cadfe-f1e2-449b-8e62-8444a869e91d	ACTIVITY	EXPENSE	80000.0000	DAF Operations > DAF Compliance Staff: $80,000/yr	2026-04-17 19:54:27.283868+00	\N
4ac70b71-0f36-41e1-a599-ff6baa1749fe	c5852cf0-3922-4069-9862-84441380dc65	019d9d02-45aa-779b-aee3-e341876c26fa	93587307-c8fc-4010-be99-d603a7b2b9dc	ACTIVITY	EXPENSE	15000.0000	DAF Operations > Investment Committee: $15,000/yr	2026-04-17 19:54:27.297832+00	\N
25081fba-617e-45a5-baa2-36a049de9961	c5852cf0-3922-4069-9862-84441380dc65	019d9d02-45aa-779b-aee3-e341876c26fa	33678e67-ce0c-4f74-9658-d94a0887206c	ACTIVITY	EXPENSE	40000.0000	DAF Operations > DAF Technology Platform: $40,000/yr	2026-04-17 19:54:27.31354+00	\N
9dad6609-3937-4b9b-97b5-6fe61414cb12	c5852cf0-3922-4069-9862-84441380dc65	019d9d02-45aa-779b-aee3-e341876c26fa	453d2f0e-e56a-4b6a-8b7d-9d319343b5f3	ACTIVITY	EXPENSE	12000.0000	DAF Operations > Fidelity Bond & E&O Insurance: $12,000/yr	2026-04-17 19:54:27.328611+00	\N
c5727a98-5733-41d6-82ef-c98085ef5390	c5852cf0-3922-4069-9862-84441380dc65	019d9d02-45aa-779b-aee3-e341876c26fa	2b09d59d-d7a8-4490-ac43-f274d074e580	ACTIVITY	EXPENSE	18000.0000	DAF Operations > Investment Legal Counsel: $18,000/yr	2026-04-17 19:54:27.342747+00	\N
a3670ff8-2dcf-4a4f-833d-bdd6ede3427c	c5852cf0-3922-4069-9862-84441380dc65	019d9d02-45aa-779b-aee3-e341876c26fa	899a1112-9e55-4fc6-a56b-42a1ac007bac	ACTIVITY	EXPENSE	18000.0000	DAF Operations > DAF Marketing & Acquisition: $18,000/yr	2026-04-17 19:54:27.357602+00	\N
f52a9c00-f42c-4a47-9226-01c9ee70e8e9	e409bd5d-a5a5-4bd2-8ba0-3eeea37bca79	019d9d02-44f4-779b-8b66-169da3ce54ad	d18456db-2927-4de5-9004-a128e6e8cd67	ACTIVITY	REVENUE	7416.0000	Admin fee: avg AUM $1236K × 0.60% = $7,416 (80 accounts, end AUM $2.5M)	2026-04-17 19:54:27.408105+00	\N
4b50818e-94a9-4641-80ed-2b85f48a22c3	e409bd5d-a5a5-4bd2-8ba0-3eeea37bca79	019d9d02-44f4-779b-8b66-169da3ce54ad	7b142bfb-a7ee-403d-b8fb-960939aa2e7c	ACTIVITY	REVENUE	1854.0000	Investment spread: avg AUM $1236K × 0.15% = $1,854	2026-04-17 19:54:27.422109+00	\N
05d6e124-c1ec-4dd9-a177-c6b6ce6ada96	b046cccb-2888-4947-bc5d-23121a1b5917	019d9d02-44f4-779b-8b66-169da3ce54ad	b18cadfe-f1e2-449b-8e62-8444a869e91d	ACTIVITY	EXPENSE	25000.0000	DAF Operations > DAF Compliance Staff: $25,000/yr	2026-04-17 19:54:27.451532+00	\N
ee95a834-9e6a-4fa0-b619-c0bd0348d623	b046cccb-2888-4947-bc5d-23121a1b5917	019d9d02-44f4-779b-8b66-169da3ce54ad	33678e67-ce0c-4f74-9658-d94a0887206c	ACTIVITY	EXPENSE	15000.0000	DAF Operations > DAF Technology Platform: $15,000/yr	2026-04-17 19:54:27.465019+00	\N
59fdbcef-eb22-425c-b87d-edaef3fbf644	b046cccb-2888-4947-bc5d-23121a1b5917	019d9d02-44f4-779b-8b66-169da3ce54ad	453d2f0e-e56a-4b6a-8b7d-9d319343b5f3	ACTIVITY	EXPENSE	3000.0000	DAF Operations > Fidelity Bond & E&O Insurance: $3,000/yr	2026-04-17 19:54:27.47828+00	\N
5c6cc4a9-fe76-4583-b05e-c74650da65f1	b046cccb-2888-4947-bc5d-23121a1b5917	019d9d02-44f4-779b-8b66-169da3ce54ad	2b09d59d-d7a8-4490-ac43-f274d074e580	ACTIVITY	EXPENSE	5000.0000	DAF Operations > Investment Legal Counsel: $5,000/yr	2026-04-17 19:54:27.491847+00	\N
8a88b556-a9a9-4922-a5f8-d98afe3f7e8a	b046cccb-2888-4947-bc5d-23121a1b5917	019d9d02-44f4-779b-8b66-169da3ce54ad	899a1112-9e55-4fc6-a56b-42a1ac007bac	ACTIVITY	EXPENSE	25000.0000	DAF Operations > DAF Marketing & Acquisition: $25,000/yr	2026-04-17 19:54:27.50638+00	\N
757d8c8a-b292-4b9e-baac-18e1b4b1377f	de3ae120-321f-4c36-a1b0-777a456c7c9f	019d9d02-456e-7759-a25a-a2bdf8939b29	d18456db-2927-4de5-9004-a128e6e8cd67	ACTIVITY	REVENUE	52820.0000	Admin fee: avg AUM $8803K × 0.60% = $52,820 (350 accounts, end AUM $15.1M)	2026-04-17 19:54:27.53553+00	\N
b6cefd00-1c3d-4e74-87fa-123e1b41e2a1	de3ae120-321f-4c36-a1b0-777a456c7c9f	019d9d02-456e-7759-a25a-a2bdf8939b29	7b142bfb-a7ee-403d-b8fb-960939aa2e7c	ACTIVITY	REVENUE	13205.0000	Investment spread: avg AUM $8803K × 0.15% = $13,205	2026-04-17 19:54:27.550239+00	\N
1c1f3662-9906-46d3-9162-0a05673c59da	3b128830-b9da-4365-9d47-07775d07e438	019d9d02-456e-7759-a25a-a2bdf8939b29	b18cadfe-f1e2-449b-8e62-8444a869e91d	ACTIVITY	EXPENSE	40000.0000	DAF Operations > DAF Compliance Staff: $40,000/yr	2026-04-17 19:54:27.577245+00	\N
52b98718-9eb0-46cb-ab6c-216cbafc7766	3b128830-b9da-4365-9d47-07775d07e438	019d9d02-456e-7759-a25a-a2bdf8939b29	93587307-c8fc-4010-be99-d603a7b2b9dc	ACTIVITY	EXPENSE	5000.0000	DAF Operations > Investment Committee: $5,000/yr	2026-04-17 19:54:27.591363+00	\N
3c5ed5b8-4d0f-444a-8381-e95c196e72ff	3b128830-b9da-4365-9d47-07775d07e438	019d9d02-456e-7759-a25a-a2bdf8939b29	33678e67-ce0c-4f74-9658-d94a0887206c	ACTIVITY	EXPENSE	25000.0000	DAF Operations > DAF Technology Platform: $25,000/yr	2026-04-17 19:54:27.60815+00	\N
d1bac4b7-6382-402e-8bc1-76f2f84b79c2	3b128830-b9da-4365-9d47-07775d07e438	019d9d02-456e-7759-a25a-a2bdf8939b29	453d2f0e-e56a-4b6a-8b7d-9d319343b5f3	ACTIVITY	EXPENSE	5000.0000	DAF Operations > Fidelity Bond & E&O Insurance: $5,000/yr	2026-04-17 19:54:27.622686+00	\N
8a64425f-10bd-40cf-933a-4d417460aaae	3b128830-b9da-4365-9d47-07775d07e438	019d9d02-456e-7759-a25a-a2bdf8939b29	2b09d59d-d7a8-4490-ac43-f274d074e580	ACTIVITY	EXPENSE	10000.0000	DAF Operations > Investment Legal Counsel: $10,000/yr	2026-04-17 19:54:27.63837+00	\N
b0351ad3-5d33-40a0-922a-4bd1d86669b3	3b128830-b9da-4365-9d47-07775d07e438	019d9d02-456e-7759-a25a-a2bdf8939b29	899a1112-9e55-4fc6-a56b-42a1ac007bac	ACTIVITY	EXPENSE	60000.0000	DAF Operations > DAF Marketing & Acquisition: $60,000/yr	2026-04-17 19:54:28.654635+00	\N
d5c5c3ec-21fc-4e8b-ba06-dcfa7256d6d4	676669a5-d73d-4db6-9af3-62f3f29f82e5	019d9d02-4580-707c-81d8-94600926add6	d18456db-2927-4de5-9004-a128e6e8cd67	ACTIVITY	REVENUE	213353.0000	Admin fee: avg AUM $35559K × 0.60% = $213,353 (1000 accounts, end AUM $56.0M)	2026-04-17 19:54:28.684383+00	\N
ee82b500-10f5-462b-ae6c-f7ceadd44cad	676669a5-d73d-4db6-9af3-62f3f29f82e5	019d9d02-4580-707c-81d8-94600926add6	7b142bfb-a7ee-403d-b8fb-960939aa2e7c	ACTIVITY	REVENUE	53338.0000	Investment spread: avg AUM $35559K × 0.15% = $53,338	2026-04-17 19:54:28.699358+00	\N
22c3f08e-e6c7-47de-a23d-d50e7e5ec29e	a6d88f4e-c727-4fd9-ab88-200ceab66325	019d9d02-4580-707c-81d8-94600926add6	b18cadfe-f1e2-449b-8e62-8444a869e91d	ACTIVITY	EXPENSE	70000.0000	DAF Operations > DAF Compliance Staff: $70,000/yr	2026-04-17 19:54:28.727516+00	\N
e9209c59-488d-4305-892d-c874a01aaf1b	a6d88f4e-c727-4fd9-ab88-200ceab66325	019d9d02-4580-707c-81d8-94600926add6	93587307-c8fc-4010-be99-d603a7b2b9dc	ACTIVITY	EXPENSE	10000.0000	DAF Operations > Investment Committee: $10,000/yr	2026-04-17 19:54:28.742688+00	\N
af5385cc-01aa-4e08-92c0-5fbe9560c803	a6d88f4e-c727-4fd9-ab88-200ceab66325	019d9d02-4580-707c-81d8-94600926add6	33678e67-ce0c-4f74-9658-d94a0887206c	ACTIVITY	EXPENSE	40000.0000	DAF Operations > DAF Technology Platform: $40,000/yr	2026-04-17 19:54:28.757467+00	\N
9ea52f46-5431-404d-93f1-a7f631a6ed37	a6d88f4e-c727-4fd9-ab88-200ceab66325	019d9d02-4580-707c-81d8-94600926add6	453d2f0e-e56a-4b6a-8b7d-9d319343b5f3	ACTIVITY	EXPENSE	10000.0000	DAF Operations > Fidelity Bond & E&O Insurance: $10,000/yr	2026-04-17 19:54:28.773495+00	\N
480a64de-3140-4776-add6-f242738c0243	a6d88f4e-c727-4fd9-ab88-200ceab66325	019d9d02-4580-707c-81d8-94600926add6	2b09d59d-d7a8-4490-ac43-f274d074e580	ACTIVITY	EXPENSE	15000.0000	DAF Operations > Investment Legal Counsel: $15,000/yr	2026-04-17 19:54:28.787215+00	\N
1972f1db-1b26-49e2-882b-849359498912	a6d88f4e-c727-4fd9-ab88-200ceab66325	019d9d02-4580-707c-81d8-94600926add6	899a1112-9e55-4fc6-a56b-42a1ac007bac	ACTIVITY	EXPENSE	120000.0000	DAF Operations > DAF Marketing & Acquisition: $120,000/yr	2026-04-17 19:54:28.802033+00	\N
8ae16ddd-e057-4b7d-ad53-feca5ad568cb	ed792d46-ba90-41b3-bfc9-383a68981beb	019d9d02-4593-72db-ab08-e0f8ead38a7f	d18456db-2927-4de5-9004-a128e6e8cd67	ACTIVITY	REVENUE	692758.0000	Admin fee: avg AUM $115460K × 0.60% = $692,758 (2500 accounts, end AUM $174.9M)	2026-04-17 19:54:28.827404+00	\N
fbcd793a-6421-469d-84da-c0b61effd84a	ed792d46-ba90-41b3-bfc9-383a68981beb	019d9d02-4593-72db-ab08-e0f8ead38a7f	7b142bfb-a7ee-403d-b8fb-960939aa2e7c	ACTIVITY	REVENUE	173190.0000	Investment spread: avg AUM $115460K × 0.15% = $173,190	2026-04-17 19:54:28.839634+00	\N
437d74c8-8ccd-45b4-a271-e3188c0ac4d7	05a12dfd-dfee-4f33-bd68-efe3f79c54a8	019d9d02-4593-72db-ab08-e0f8ead38a7f	b18cadfe-f1e2-449b-8e62-8444a869e91d	ACTIVITY	EXPENSE	120000.0000	DAF Operations > DAF Compliance Staff: $120,000/yr	2026-04-17 19:54:28.867565+00	\N
25339210-31e1-494e-8e8c-a48d23794827	05a12dfd-dfee-4f33-bd68-efe3f79c54a8	019d9d02-4593-72db-ab08-e0f8ead38a7f	93587307-c8fc-4010-be99-d603a7b2b9dc	ACTIVITY	EXPENSE	15000.0000	DAF Operations > Investment Committee: $15,000/yr	2026-04-17 19:54:28.881297+00	\N
b2d17ee4-3729-4d63-bf58-f09a142a0d75	05a12dfd-dfee-4f33-bd68-efe3f79c54a8	019d9d02-4593-72db-ab08-e0f8ead38a7f	33678e67-ce0c-4f74-9658-d94a0887206c	ACTIVITY	EXPENSE	60000.0000	DAF Operations > DAF Technology Platform: $60,000/yr	2026-04-17 19:54:28.894483+00	\N
09876994-4f7b-4bfa-90a7-a1c85e499298	05a12dfd-dfee-4f33-bd68-efe3f79c54a8	019d9d02-4593-72db-ab08-e0f8ead38a7f	453d2f0e-e56a-4b6a-8b7d-9d319343b5f3	ACTIVITY	EXPENSE	18000.0000	DAF Operations > Fidelity Bond & E&O Insurance: $18,000/yr	2026-04-17 19:54:28.90747+00	\N
18bc6e1e-b748-465d-b84f-f64ad773a376	05a12dfd-dfee-4f33-bd68-efe3f79c54a8	019d9d02-4593-72db-ab08-e0f8ead38a7f	2b09d59d-d7a8-4490-ac43-f274d074e580	ACTIVITY	EXPENSE	25000.0000	DAF Operations > Investment Legal Counsel: $25,000/yr	2026-04-17 19:54:28.921121+00	\N
65d5a673-ed3b-45c8-ba85-4f7a93990292	05a12dfd-dfee-4f33-bd68-efe3f79c54a8	019d9d02-4593-72db-ab08-e0f8ead38a7f	899a1112-9e55-4fc6-a56b-42a1ac007bac	ACTIVITY	EXPENSE	200000.0000	DAF Operations > DAF Marketing & Acquisition: $200,000/yr	2026-04-17 19:54:28.934776+00	\N
a3e29f4c-91cd-47a5-a45a-48631174bea8	a168f0ed-077f-41bf-ad7e-a44d5ea992a6	019d9d02-45aa-779b-aee3-e341876c26fa	d18456db-2927-4de5-9004-a128e6e8cd67	ACTIVITY	REVENUE	1771318.0000	Admin fee: avg AUM $295220K × 0.60% = $1,771,318 (5000 accounts, end AUM $415.5M)	2026-04-17 19:54:28.962329+00	\N
f8ce88b8-2a90-4c7a-af03-4f24076bdfbf	a168f0ed-077f-41bf-ad7e-a44d5ea992a6	019d9d02-45aa-779b-aee3-e341876c26fa	7b142bfb-a7ee-403d-b8fb-960939aa2e7c	ACTIVITY	REVENUE	442829.0000	Investment spread: avg AUM $295220K × 0.15% = $442,829	2026-04-17 19:54:28.97739+00	\N
2960507f-d4cf-4e76-96b1-326b3d80b343	5854f6a7-fff1-4941-8bf7-e7114b7eb808	019d9d02-45aa-779b-aee3-e341876c26fa	b18cadfe-f1e2-449b-8e62-8444a869e91d	ACTIVITY	EXPENSE	180000.0000	DAF Operations > DAF Compliance Staff: $180,000/yr	2026-04-17 19:54:29.00413+00	\N
b429a662-bb66-4321-a141-44b78a0d3091	5854f6a7-fff1-4941-8bf7-e7114b7eb808	019d9d02-45aa-779b-aee3-e341876c26fa	93587307-c8fc-4010-be99-d603a7b2b9dc	ACTIVITY	EXPENSE	20000.0000	DAF Operations > Investment Committee: $20,000/yr	2026-04-17 19:54:29.017731+00	\N
3c5c29f5-a5a9-4910-8267-bc39a872072a	5854f6a7-fff1-4941-8bf7-e7114b7eb808	019d9d02-45aa-779b-aee3-e341876c26fa	33678e67-ce0c-4f74-9658-d94a0887206c	ACTIVITY	EXPENSE	80000.0000	DAF Operations > DAF Technology Platform: $80,000/yr	2026-04-17 19:54:29.030277+00	\N
b623c031-3aec-47e3-943e-098dc1e0de6b	5854f6a7-fff1-4941-8bf7-e7114b7eb808	019d9d02-45aa-779b-aee3-e341876c26fa	453d2f0e-e56a-4b6a-8b7d-9d319343b5f3	ACTIVITY	EXPENSE	30000.0000	DAF Operations > Fidelity Bond & E&O Insurance: $30,000/yr	2026-04-17 19:54:29.043715+00	\N
d6421667-195c-4f9c-8829-d42331bd51a8	5854f6a7-fff1-4941-8bf7-e7114b7eb808	019d9d02-45aa-779b-aee3-e341876c26fa	2b09d59d-d7a8-4490-ac43-f274d074e580	ACTIVITY	EXPENSE	35000.0000	DAF Operations > Investment Legal Counsel: $35,000/yr	2026-04-17 19:54:29.069421+00	\N
e05d2beb-6afe-444e-bfc3-de9adc3c9762	5854f6a7-fff1-4941-8bf7-e7114b7eb808	019d9d02-45aa-779b-aee3-e341876c26fa	899a1112-9e55-4fc6-a56b-42a1ac007bac	ACTIVITY	EXPENSE	300000.0000	DAF Operations > DAF Marketing & Acquisition: $300,000/yr	2026-04-17 19:54:29.108207+00	\N
\.


--
-- Data for Name: calibration_history; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.calibration_history (id, entity_id, outcome_type, period_id, realized_delta, ci_point_estimate, accuracy, calibration_factor_before, calibration_factor_after, computed_at) FROM stdin;
d9d5a243-42d8-4fbb-940d-10d2b336e422	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2720-cc19-77a1-9ab1-7db4cc67ff1c	8000	10000	0.8	1	0.94	2026-03-25 22:32:34.329371+00
ce521d09-789c-485a-83bf-5e289439b978	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2721-17be-726d-b881-3d9a4a14d613	8000	10000	0.8	0.94	0.898	2026-03-25 22:32:53.512173+00
cface611-8c16-4f32-9945-48aff0cbc6bf	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2723-e2e0-7210-bd51-dff5c6fc7751	8000	10000	0.8	0.898	0.8686	2026-03-25 22:35:56.593183+00
534dd195-599d-406c-af19-b4991e99d498	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2a50-2b88-760b-a874-a5ec57f4c304	8000	10000	0.8	0.8686	0.848	2026-03-26 13:23:10.474377+00
db035253-6792-4041-a298-368095c02cac	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2a56-ce5a-762e-91d9-ada30338a5c9	8000	10000	0.8	0.848	0.8336	2026-03-26 13:30:25.345004+00
4942fed3-cc64-41d6-91c7-dc04e2626935	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2a62-624d-769c-8b40-7d8abd4be235	8000	10000	0.8	0.8336	0.8235	2026-03-26 13:43:04.094281+00
110ce286-0705-42f2-8c6c-e2410cbc527b	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2a82-70b1-7308-8d68-262c93a69bd7	8000	10000	0.8	0.8235	0.8165	2026-03-26 14:18:04.927426+00
53ba59ac-ff41-437b-a6ed-8934a347969c	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2a8b-89ca-72dc-8398-ceb094a6f053	8000	10000	0.8	0.8165	0.8116	2026-03-26 14:28:01.205097+00
1eca732f-b9ed-4636-9d92-98dc58dd0d6d	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2aca-dd3c-736a-99d5-961bd5f61fac	8000	10000	0.8	0.8116	0.8081	2026-03-26 15:37:11.468309+00
74d3262a-6a4e-48d6-a597-6dc9cc4b3958	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2ae8-33bf-74ab-a8d2-cebc8642e072	8000	10000	0.8	0.8081	0.8057	2026-03-26 16:09:13.996398+00
ef9d6484-6fd8-45da-868b-2e422f9334bf	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2afa-ffe6-75eb-bfae-d12daa8b7302	8000	10000	0.8	0.8057	0.804	2026-03-26 16:29:45.944167+00
15d9d6f2-8c23-4887-af71-a732217e20ae	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2b0e-3082-7471-8ce1-4724e7af39fb	8000	10000	0.8	0.804	0.8028	2026-03-26 16:50:43.533241+00
61cb8e42-97d0-468e-8801-065d2cbd7d40	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2b1d-3d14-75a3-9d00-334c08d12623	8000	10000	0.8	0.8028	0.802	2026-03-26 17:07:09.795633+00
ef8220ca-f8b4-47aa-bb0e-3ad477764a74	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2b23-d601-745f-913a-68e004750e3a	8000	10000	0.8	0.802	0.8014	2026-03-26 17:14:22.157909+00
61f80c40-9c2c-424f-9852-f11c8053ffbd	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2b28-b5be-71a8-9f4c-93e38155e781	8000	10000	0.8	0.8014	0.801	2026-03-26 17:19:41.581158+00
9a79f1ee-47da-4370-8d6b-841251a78904	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2b3d-c5cb-744e-a31a-635f0b262b6a	8000	10000	0.8	0.801	0.8007	2026-03-26 17:42:41.991747+00
f73fa299-4d31-48a0-a5f9-4470dafe31ae	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2b52-8c9e-76d9-b545-b77f8d223076	8000	10000	0.8	0.8007	0.8005	2026-03-26 18:05:23.586063+00
d258915a-e016-4c3b-aa71-cd25ce7bd7a4	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	DELIVER_MISSION	019d2b6a-2d0a-73e8-b25c-0868aed56940	8000	10000	0.8	0.8005	0.8003	2026-03-26 18:31:11.95657+00
\.


--
-- Data for Name: configuration_settings; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.configuration_settings (id, setting_key, scope_type, scope_id, scope_id_2, value_type, value_string, value_numeric, value_boolean, value_json, valid_from, valid_until, transaction_time, changed_by, change_reason, requires_restatement) FROM stdin;
13a57770-d874-40d9-ab00-b913d1e2486f	combined_report_currency	SYSTEM	\N	\N	STRING	CAD	\N	\N	\N	2024-01-01	\N	2026-03-25 01:51:01.01805+00	00000000-0000-0000-0000-000000000001	Initial seed	f
85330bb9-5a0f-4f0c-bef3-50b9e354a680	combined_report_fx_method	SYSTEM	\N	\N	ENUM	CLOSING_RATE	\N	\N	\N	2024-01-01	\N	2026-03-25 01:51:01.106319+00	00000000-0000-0000-0000-000000000001	Initial seed	f
0edfe8f0-2f07-4d46-bfba-215116b05b34	allocation_block_threshold	SYSTEM	\N	\N	NUMERIC	\N	0.3	\N	\N	2024-01-01	\N	2026-03-25 01:51:01.182449+00	00000000-0000-0000-0000-000000000001	Initial seed	f
d95deaa8-add0-446a-9a29-3dda0c8e7f6b	ai_confidence_discount_claimed_credits	SYSTEM	\N	\N	NUMERIC	\N	0.1	\N	\N	2024-01-01	\N	2026-03-25 01:51:01.248044+00	00000000-0000-0000-0000-000000000001	Initial seed	f
c23f1891-97b9-4d89-9ac3-3a11ab5664b1	default_materiality_threshold	SYSTEM	\N	\N	NUMERIC	\N	50000	\N	\N	2024-01-01	\N	2026-03-25 01:51:01.318383+00	00000000-0000-0000-0000-000000000001	Initial seed	f
9e8bc2cc-99e1-439e-92c5-166000132c81	reporting_framework	ENTITY	49bdfab7-acc1-4eb0-a11f-c4f79eb665a3	\N	ENUM	ASNFPO	\N	\N	\N	2024-01-01	\N	2026-03-25 01:51:13.071266+00	00000000-0000-0000-0000-000000000001	Initial seed	f
655c2e1c-4267-444f-bc36-08a74f274002	functional_currency	ENTITY	49bdfab7-acc1-4eb0-a11f-c4f79eb665a3	\N	STRING	CAD	\N	\N	\N	2024-01-01	\N	2026-03-25 01:51:13.211918+00	00000000-0000-0000-0000-000000000001	Initial seed	f
06ee1322-5013-44bd-bac9-131fb247136d	approval_thresholds	ENTITY	49bdfab7-acc1-4eb0-a11f-c4f79eb665a3	\N	JSON	\N	\N	\N	{"tiers": [{"role": "MANAGER", "max_amount": 10000}, {"role": "DIRECTOR", "max_amount": 100000}, {"role": "VP_FINANCE", "max_amount": 1000000}, {"role": "CFO", "max_amount": null}]}	2024-01-01	\N	2026-03-25 01:51:13.338955+00	00000000-0000-0000-0000-000000000001	Initial seed	f
23abc386-c16a-4382-81b0-c59ce720625c	materiality_threshold	ENTITY	49bdfab7-acc1-4eb0-a11f-c4f79eb665a3	\N	NUMERIC	\N	50000	\N	\N	2024-01-01	\N	2026-03-25 01:51:13.49306+00	00000000-0000-0000-0000-000000000001	Initial seed	f
31ab3bfd-413b-473e-b2af-c8252b7a00ce	reporting_framework	ENTITY	0b3b1c01-c88a-4f9e-af5a-cc1fcf4f96c4	\N	ENUM	US_GAAP	\N	\N	\N	2024-01-01	\N	2026-03-25 01:51:13.660632+00	00000000-0000-0000-0000-000000000001	Initial seed	f
c6b2ccdb-5b0b-46c8-af91-e99441a706f3	functional_currency	ENTITY	0b3b1c01-c88a-4f9e-af5a-cc1fcf4f96c4	\N	STRING	USD	\N	\N	\N	2024-01-01	\N	2026-03-25 01:51:13.816108+00	00000000-0000-0000-0000-000000000001	Initial seed	f
5e01fd78-146c-4989-96f7-a23c968a341a	approval_thresholds	ENTITY	0b3b1c01-c88a-4f9e-af5a-cc1fcf4f96c4	\N	JSON	\N	\N	\N	{"tiers": [{"role": "MANAGER", "max_amount": 10000}, {"role": "DIRECTOR", "max_amount": 100000}, {"role": "VP_FINANCE", "max_amount": 1000000}, {"role": "CFO", "max_amount": null}]}	2024-01-01	\N	2026-03-25 01:51:14.009595+00	00000000-0000-0000-0000-000000000001	Initial seed	f
c23b63ec-1e37-47d7-9bf6-0c333ed9ba9d	materiality_threshold	ENTITY	0b3b1c01-c88a-4f9e-af5a-cc1fcf4f96c4	\N	NUMERIC	\N	50000	\N	\N	2024-01-01	\N	2026-03-25 01:51:14.177752+00	00000000-0000-0000-0000-000000000001	Initial seed	f
685631be-7e21-4787-a079-5eb341d80823	reporting_framework	ENTITY	5775c3c9-ad16-45d0-ae9b-2c7462b903f8	\N	ENUM	ASC_958	\N	\N	\N	2024-01-01	\N	2026-03-25 01:51:14.334939+00	00000000-0000-0000-0000-000000000001	Initial seed	f
fa2194e3-42db-43bf-b1d1-607178f56a22	functional_currency	ENTITY	5775c3c9-ad16-45d0-ae9b-2c7462b903f8	\N	STRING	USD	\N	\N	\N	2024-01-01	\N	2026-03-25 01:51:14.494149+00	00000000-0000-0000-0000-000000000001	Initial seed	f
8fa7a54d-0311-4e5c-9e9d-4a290493664e	approval_thresholds	ENTITY	5775c3c9-ad16-45d0-ae9b-2c7462b903f8	\N	JSON	\N	\N	\N	{"tiers": [{"role": "MANAGER", "max_amount": 10000}, {"role": "DIRECTOR", "max_amount": 100000}, {"role": "VP_FINANCE", "max_amount": 1000000}, {"role": "CFO", "max_amount": null}]}	2024-01-01	\N	2026-03-25 01:51:14.642838+00	00000000-0000-0000-0000-000000000001	Initial seed	f
e94b15cd-4e5b-41ce-bb30-8fae50fe5b0f	materiality_threshold	ENTITY	5775c3c9-ad16-45d0-ae9b-2c7462b903f8	\N	NUMERIC	\N	50000	\N	\N	2024-01-01	\N	2026-03-25 01:51:14.828218+00	00000000-0000-0000-0000-000000000001	Initial seed	f
6700b6e7-0372-4d46-9edc-30911d2cbc65	reporting_framework	ENTITY	f4c47348-80e6-4c6e-80ef-f981830250da	\N	ENUM	ASNFPO	\N	\N	\N	2024-01-01	\N	2026-03-25 01:51:15.024875+00	00000000-0000-0000-0000-000000000001	Initial seed	f
9a5bbd5a-274f-4a2f-a791-c29bfac8c93c	functional_currency	ENTITY	f4c47348-80e6-4c6e-80ef-f981830250da	\N	STRING	CAD	\N	\N	\N	2024-01-01	\N	2026-03-25 01:51:15.206202+00	00000000-0000-0000-0000-000000000001	Initial seed	f
772a4306-e6d7-4c6b-9216-c35aea8454a1	approval_thresholds	ENTITY	f4c47348-80e6-4c6e-80ef-f981830250da	\N	JSON	\N	\N	\N	{"tiers": [{"role": "MANAGER", "max_amount": 10000}, {"role": "DIRECTOR", "max_amount": 100000}, {"role": "VP_FINANCE", "max_amount": 1000000}, {"role": "CFO", "max_amount": null}]}	2024-01-01	\N	2026-03-25 01:51:15.291488+00	00000000-0000-0000-0000-000000000001	Initial seed	f
6213a341-b87e-49bd-823d-2d2f671e71c1	materiality_threshold	ENTITY	f4c47348-80e6-4c6e-80ef-f981830250da	\N	NUMERIC	\N	50000	\N	\N	2024-01-01	\N	2026-03-25 01:51:15.363465+00	00000000-0000-0000-0000-000000000001	Initial seed	f
08487872-9cd3-404d-9091-115cc908bd4e	reporting_framework	ENTITY	d3fe3fe1-c2bc-4cf9-96b0-99c1c74e4259	\N	ENUM	US_GAAP	\N	\N	\N	2024-01-01	\N	2026-03-25 01:51:15.435741+00	00000000-0000-0000-0000-000000000001	Initial seed	f
e019b0af-7690-4c0a-a129-fbdcc3a55186	functional_currency	ENTITY	d3fe3fe1-c2bc-4cf9-96b0-99c1c74e4259	\N	STRING	USD	\N	\N	\N	2024-01-01	\N	2026-03-25 01:51:15.49245+00	00000000-0000-0000-0000-000000000001	Initial seed	f
03fc4db7-161b-4b82-8da9-fa350c28b7e2	approval_thresholds	ENTITY	d3fe3fe1-c2bc-4cf9-96b0-99c1c74e4259	\N	JSON	\N	\N	\N	{"tiers": [{"role": "MANAGER", "max_amount": 10000}, {"role": "DIRECTOR", "max_amount": 100000}, {"role": "VP_FINANCE", "max_amount": 1000000}, {"role": "CFO", "max_amount": null}]}	2024-01-01	\N	2026-03-25 01:51:15.539115+00	00000000-0000-0000-0000-000000000001	Initial seed	f
7405e51d-5887-49d8-acb9-60ddc06e09b0	materiality_threshold	ENTITY	d3fe3fe1-c2bc-4cf9-96b0-99c1c74e4259	\N	NUMERIC	\N	50000	\N	\N	2024-01-01	\N	2026-03-25 01:51:15.600789+00	00000000-0000-0000-0000-000000000001	Initial seed	f
5491fa7b-45ec-4b07-9434-4eb4c314c302	reporting_framework	ENTITY	1bf407e0-850d-4b63-8bb6-99ee467de131	\N	ENUM	ASC_958	\N	\N	\N	2024-01-01	\N	2026-03-25 01:51:15.671389+00	00000000-0000-0000-0000-000000000001	Initial seed	f
f7f4da63-4cec-4bad-ab2e-9c2c8a46cd34	functional_currency	ENTITY	1bf407e0-850d-4b63-8bb6-99ee467de131	\N	STRING	USD	\N	\N	\N	2024-01-01	\N	2026-03-25 01:51:15.73002+00	00000000-0000-0000-0000-000000000001	Initial seed	f
2d9a26f5-a929-4e29-a8d5-1503ddcb03ff	approval_thresholds	ENTITY	1bf407e0-850d-4b63-8bb6-99ee467de131	\N	JSON	\N	\N	\N	{"tiers": [{"role": "MANAGER", "max_amount": 10000}, {"role": "DIRECTOR", "max_amount": 100000}, {"role": "VP_FINANCE", "max_amount": 1000000}, {"role": "CFO", "max_amount": null}]}	2024-01-01	\N	2026-03-25 01:51:15.793967+00	00000000-0000-0000-0000-000000000001	Initial seed	f
c13d27b6-ebaa-41d8-bb5a-894f676107f0	materiality_threshold	ENTITY	1bf407e0-850d-4b63-8bb6-99ee467de131	\N	NUMERIC	\N	50000	\N	\N	2024-01-01	\N	2026-03-25 01:51:15.866088+00	00000000-0000-0000-0000-000000000001	Initial seed	f
9ac8a8f0-04cf-4c47-9bae-7e5dc9cd33c5	combined_report_currency	SYSTEM	\N	\N	STRING	CAD	\N	\N	\N	2024-01-01	\N	2026-03-25 01:55:36.573849+00	00000000-0000-0000-0000-000000000001	Initial seed	f
15142c00-ef8d-4b77-998d-cd93449e61c3	combined_report_fx_method	SYSTEM	\N	\N	ENUM	CLOSING_RATE	\N	\N	\N	2024-01-01	\N	2026-03-25 01:55:36.652089+00	00000000-0000-0000-0000-000000000001	Initial seed	f
b59572c1-f116-43b6-b1ff-f1dd93926fcc	allocation_block_threshold	SYSTEM	\N	\N	NUMERIC	\N	0.3	\N	\N	2024-01-01	\N	2026-03-25 01:55:36.653703+00	00000000-0000-0000-0000-000000000001	Initial seed	f
2361a0a3-9e07-40cc-a272-7dd3e9c5bf30	ai_confidence_discount_claimed_credits	SYSTEM	\N	\N	NUMERIC	\N	0.1	\N	\N	2024-01-01	\N	2026-03-25 01:55:36.656669+00	00000000-0000-0000-0000-000000000001	Initial seed	f
9d0a02d8-2c85-49fb-8a26-1c8ae2ab19e0	default_materiality_threshold	SYSTEM	\N	\N	NUMERIC	\N	50000	\N	\N	2024-01-01	\N	2026-03-25 01:55:36.659239+00	00000000-0000-0000-0000-000000000001	Initial seed	f
4ef93570-f56d-4760-9a0b-d21c87237fe7	reporting_framework	ENTITY	d2a7c7f4-b7ae-4989-9646-1e38ef4dc63e	\N	ENUM	ASNFPO	\N	\N	\N	2024-01-01	\N	2026-03-25 01:55:36.754431+00	00000000-0000-0000-0000-000000000001	Initial seed	f
daf17d01-8eb8-4c3a-ba8d-e14e57404d9c	functional_currency	ENTITY	d2a7c7f4-b7ae-4989-9646-1e38ef4dc63e	\N	STRING	CAD	\N	\N	\N	2024-01-01	\N	2026-03-25 01:55:36.758072+00	00000000-0000-0000-0000-000000000001	Initial seed	f
cffc28ff-f838-40af-a58b-3a1002523ea7	approval_thresholds	ENTITY	d2a7c7f4-b7ae-4989-9646-1e38ef4dc63e	\N	JSON	\N	\N	\N	{"tiers": [{"role": "MANAGER", "max_amount": 10000}, {"role": "DIRECTOR", "max_amount": 100000}, {"role": "VP_FINANCE", "max_amount": 1000000}, {"role": "CFO", "max_amount": null}]}	2024-01-01	\N	2026-03-25 01:55:36.760475+00	00000000-0000-0000-0000-000000000001	Initial seed	f
cfa8e7cc-80c3-4813-9a87-6b940e296697	materiality_threshold	ENTITY	d2a7c7f4-b7ae-4989-9646-1e38ef4dc63e	\N	NUMERIC	\N	50000	\N	\N	2024-01-01	\N	2026-03-25 01:55:36.764027+00	00000000-0000-0000-0000-000000000001	Initial seed	f
eb01f0d1-9691-41ab-b944-9ad73e326b68	reporting_framework	ENTITY	2b4a8dd2-7568-497b-9476-781de9ad1fb8	\N	ENUM	US_GAAP	\N	\N	\N	2024-01-01	\N	2026-03-25 01:55:36.76711+00	00000000-0000-0000-0000-000000000001	Initial seed	f
edc02649-3fe9-4152-a688-649417eacbe5	functional_currency	ENTITY	2b4a8dd2-7568-497b-9476-781de9ad1fb8	\N	STRING	USD	\N	\N	\N	2024-01-01	\N	2026-03-25 01:55:36.76961+00	00000000-0000-0000-0000-000000000001	Initial seed	f
00f711d3-1ad5-4a40-8d2d-c5f8f62a0ac5	approval_thresholds	ENTITY	2b4a8dd2-7568-497b-9476-781de9ad1fb8	\N	JSON	\N	\N	\N	{"tiers": [{"role": "MANAGER", "max_amount": 10000}, {"role": "DIRECTOR", "max_amount": 100000}, {"role": "VP_FINANCE", "max_amount": 1000000}, {"role": "CFO", "max_amount": null}]}	2024-01-01	\N	2026-03-25 01:55:36.771834+00	00000000-0000-0000-0000-000000000001	Initial seed	f
7ae1fcb4-44d2-401d-8e4b-1bfa89abcad4	materiality_threshold	ENTITY	2b4a8dd2-7568-497b-9476-781de9ad1fb8	\N	NUMERIC	\N	50000	\N	\N	2024-01-01	\N	2026-03-25 01:55:36.77647+00	00000000-0000-0000-0000-000000000001	Initial seed	f
624d0165-eb45-422d-9da0-b7abe510ca91	reporting_framework	ENTITY	89fb9b18-db6b-4500-9da3-d904aef1b402	\N	ENUM	ASC_958	\N	\N	\N	2024-01-01	\N	2026-03-25 01:55:36.779525+00	00000000-0000-0000-0000-000000000001	Initial seed	f
df67c473-dc01-49d7-8126-62e1c01d9cdd	functional_currency	ENTITY	89fb9b18-db6b-4500-9da3-d904aef1b402	\N	STRING	USD	\N	\N	\N	2024-01-01	\N	2026-03-25 01:55:36.782147+00	00000000-0000-0000-0000-000000000001	Initial seed	f
4dbefb5e-0d08-4954-a5b5-d4960a270bfe	approval_thresholds	ENTITY	89fb9b18-db6b-4500-9da3-d904aef1b402	\N	JSON	\N	\N	\N	{"tiers": [{"role": "MANAGER", "max_amount": 10000}, {"role": "DIRECTOR", "max_amount": 100000}, {"role": "VP_FINANCE", "max_amount": 1000000}, {"role": "CFO", "max_amount": null}]}	2024-01-01	\N	2026-03-25 01:55:36.785262+00	00000000-0000-0000-0000-000000000001	Initial seed	f
8c88d824-b6b8-4cb0-bb34-530402308c51	materiality_threshold	ENTITY	89fb9b18-db6b-4500-9da3-d904aef1b402	\N	NUMERIC	\N	50000	\N	\N	2024-01-01	\N	2026-03-25 01:55:36.788092+00	00000000-0000-0000-0000-000000000001	Initial seed	f
7da38f49-3f92-418d-ad6e-04469564026d	combined_report_currency	SYSTEM	\N	\N	STRING	CAD	\N	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.529963+00	00000000-0000-0000-0000-000000000001	Initial seed	f
6dc35167-0004-4415-8fd4-21c1e538dc99	combined_report_fx_method	SYSTEM	\N	\N	ENUM	CLOSING_RATE	\N	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.555122+00	00000000-0000-0000-0000-000000000001	Initial seed	f
b361f7e6-2df0-4750-8950-28c3250162e8	allocation_block_threshold	SYSTEM	\N	\N	NUMERIC	\N	0.3	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.556989+00	00000000-0000-0000-0000-000000000001	Initial seed	f
cd74d25c-9851-4661-bcae-3e42511b6252	ai_confidence_discount_claimed_credits	SYSTEM	\N	\N	NUMERIC	\N	0.1	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.558948+00	00000000-0000-0000-0000-000000000001	Initial seed	f
ad9a0b3f-bf58-4505-93b5-0e7a000d3f03	default_materiality_threshold	SYSTEM	\N	\N	NUMERIC	\N	50000	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.560137+00	00000000-0000-0000-0000-000000000001	Initial seed	f
6df54f2d-b806-4876-9bf6-b8402ae6802c	reporting_framework	ENTITY	93df1b6b-2387-4bd2-8fcd-c1466f8fc4d2	\N	ENUM	ASC_958	\N	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.659631+00	00000000-0000-0000-0000-000000000001	Initial seed	f
b0d2dee7-0bfe-4e32-8167-ce761bd43ae5	functional_currency	ENTITY	93df1b6b-2387-4bd2-8fcd-c1466f8fc4d2	\N	STRING	USD	\N	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.66159+00	00000000-0000-0000-0000-000000000001	Initial seed	f
4dfb2ece-9562-4d12-bd36-ca7a60a1ea12	approval_thresholds	ENTITY	93df1b6b-2387-4bd2-8fcd-c1466f8fc4d2	\N	JSON	\N	\N	\N	{"tiers": [{"role": "MANAGER", "max_amount": 10000}, {"role": "DIRECTOR", "max_amount": 100000}, {"role": "VP_FINANCE", "max_amount": 1000000}, {"role": "CFO", "max_amount": null}]}	2024-01-01	\N	2026-03-27 15:41:32.662984+00	00000000-0000-0000-0000-000000000001	Initial seed	f
8e408f6c-2708-47d7-8815-89c00eac01a2	materiality_threshold	ENTITY	93df1b6b-2387-4bd2-8fcd-c1466f8fc4d2	\N	NUMERIC	\N	50000	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.665667+00	00000000-0000-0000-0000-000000000001	Initial seed	f
f0ac4db0-cadc-41f1-9f03-5206dd5cb7ce	reporting_framework	ENTITY	14f8f707-8a84-40df-8bda-399cf12eb33d	\N	ENUM	ASPE	\N	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.667884+00	00000000-0000-0000-0000-000000000001	Initial seed	f
ea5207af-3a14-4427-867a-53d50bb07f2d	functional_currency	ENTITY	14f8f707-8a84-40df-8bda-399cf12eb33d	\N	STRING	CAD	\N	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.669353+00	00000000-0000-0000-0000-000000000001	Initial seed	f
46fc892c-a279-4013-b235-512573b3fb81	approval_thresholds	ENTITY	14f8f707-8a84-40df-8bda-399cf12eb33d	\N	JSON	\N	\N	\N	{"tiers": [{"role": "MANAGER", "max_amount": 10000}, {"role": "DIRECTOR", "max_amount": 100000}, {"role": "VP_FINANCE", "max_amount": 1000000}, {"role": "CFO", "max_amount": null}]}	2024-01-01	\N	2026-03-27 15:41:32.670448+00	00000000-0000-0000-0000-000000000001	Initial seed	f
668b93e5-e3b2-4ba0-aa58-6f029ecfb7e1	materiality_threshold	ENTITY	14f8f707-8a84-40df-8bda-399cf12eb33d	\N	NUMERIC	\N	50000	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.671878+00	00000000-0000-0000-0000-000000000001	Initial seed	f
d4cc2e15-e237-419a-85d5-d9b13fb0170e	reporting_framework	ENTITY	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	\N	ENUM	ASNFPO	\N	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.673166+00	00000000-0000-0000-0000-000000000001	Initial seed	f
85b0217c-63d0-4105-a5c3-4a0097112bb6	functional_currency	ENTITY	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	\N	STRING	CAD	\N	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.674701+00	00000000-0000-0000-0000-000000000001	Initial seed	f
07959220-ef74-475c-a972-c468b5aa5e3c	approval_thresholds	ENTITY	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	\N	JSON	\N	\N	\N	{"tiers": [{"role": "MANAGER", "max_amount": 10000}, {"role": "DIRECTOR", "max_amount": 100000}, {"role": "VP_FINANCE", "max_amount": 1000000}, {"role": "CFO", "max_amount": null}]}	2024-01-01	\N	2026-03-27 15:41:32.676243+00	00000000-0000-0000-0000-000000000001	Initial seed	f
b2987fa2-6b53-4157-9314-232d54a2d6e7	materiality_threshold	ENTITY	c0cb029e-1ada-4af5-ad2e-67c1d6c67bf7	\N	NUMERIC	\N	50000	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.680551+00	00000000-0000-0000-0000-000000000001	Initial seed	f
25fc56e1-2998-450f-8a9f-3b738709edcb	reporting_framework	ENTITY	52801138-0558-4427-8b84-f658c84b1cc8	\N	ENUM	US_GAAP	\N	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.6828+00	00000000-0000-0000-0000-000000000001	Initial seed	f
51722fd2-b1b1-4ff9-b845-93a5a6c13eb2	functional_currency	ENTITY	52801138-0558-4427-8b84-f658c84b1cc8	\N	STRING	USD	\N	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.6861+00	00000000-0000-0000-0000-000000000001	Initial seed	f
51d3fde8-d582-4c02-8e0b-c05a2c4f0446	fiscal_year_end	SYSTEM	\N	\N	STRING	03-31	\N	\N	\N	2026-01-01	\N	2026-04-01 15:17:48.562791+00	00000000-0000-0000-0000-000000000001	Default fiscal year end (April-March)	f
3cf5f28f-8ee2-4e53-9eb1-c5729656193f	fiscal_year_end	SYSTEM	\N	\N	STRING	09-30	\N	\N	\N	2026-04-01	\N	2026-04-01 15:28:54.10785+00	00000000-0000-0000-0000-000000000001	Set system-wide fiscal year end	f
6ae8bec6-2259-4066-b8a8-ebaad266b0cf	approval_thresholds	ENTITY	52801138-0558-4427-8b84-f658c84b1cc8	\N	JSON	\N	\N	\N	{"tiers": [{"role": "MANAGER", "max_amount": 10000}, {"role": "DIRECTOR", "max_amount": 100000}, {"role": "VP_FINANCE", "max_amount": 1000000}, {"role": "CFO", "max_amount": null}]}	2024-01-01	\N	2026-03-27 15:41:32.689705+00	00000000-0000-0000-0000-000000000001	Initial seed	f
0e27fc83-d156-4280-8407-584011c48bea	materiality_threshold	ENTITY	52801138-0558-4427-8b84-f658c84b1cc8	\N	NUMERIC	\N	50000	\N	\N	2024-01-01	\N	2026-03-27 15:41:32.693763+00	00000000-0000-0000-0000-000000000001	Initial seed	f
\.


--
-- Data for Name: equity_period_balances; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.equity_period_balances (entity_id, period_id, fund_id, component, opening_balance, movement, recycled_to_pnl, closing_balance, last_updated) FROM stdin;
\.


--
-- Data for Name: float_id_mapping; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.float_id_mapping (id, entity_id, float_type, float_id, ebg_id, ebg_type, created_at) FROM stdin;
\.


--
-- Data for Name: float_sync_runs; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.float_sync_runs (id, entity_id, sync_type, direction, items_fetched, items_imported, items_skipped, items_failed, errors, duration_ms, created_at) FROM stdin;
\.


--
-- Data for Name: float_sync_state; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.float_sync_state (entity_id, sync_type, last_synced_at, last_cursor, last_run_id, updated_at) FROM stdin;
\.


--
-- Data for Name: forecast_snapshot_lines; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.forecast_snapshot_lines (id, snapshot_id, period_id, node_ref_id, node_ref_type, economic_category, forecast_amount, budget_amount, adjustment_reason) FROM stdin;
\.


--
-- Data for Name: forecast_snapshots; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.forecast_snapshots (id, budget_id, entity_id, name, fiscal_year, currency, snapshot_type, created_by, created_at, notes) FROM stdin;
\.


--
-- Data for Name: fx_rates; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.fx_rates (id, from_currency, to_currency, rate, rate_date, source, created_at) FROM stdin;
\.


--
-- Data for Name: fx_revaluation_runs; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.fx_revaluation_runs (id, entity_id, period_id, functional_currency, as_of_date, items_count, total_gain_loss, created_at) FROM stdin;
\.


--
-- Data for Name: gl_period_balances; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.gl_period_balances (entity_id, period_id, fund_id, node_ref_type, node_ref_id, economic_category, statutory_code, debit_total, credit_total, net_balance, transaction_count, last_updated) FROM stdin;
\.


--
-- Data for Name: interco_amortization; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.interco_amortization (id, loan_id, period_number, payment_date, principal_payment, interest_payment, total_payment, principal_remaining, status, created_at) FROM stdin;
\.


--
-- Data for Name: metric_observations; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.metric_observations (metric_id, entity_id, observed_at, value, source) FROM stdin;
\.


--
-- Data for Name: nfp_reclassifications; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.nfp_reclassifications (id, fund_id, entity_id, from_class, to_class, amount, reason, reclassification_date, journal_entry_id, approved_by, created_at) FROM stdin;
\.


--
-- Data for Name: node_embeddings; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.node_embeddings (node_id, entity_id, node_label, embedding, updated_at) FROM stdin;
c01f4ebb-77e1-465b-86cb-52a7510d157c	14f8f707-8a84-40df-8bda-399cf12eb33d	Project	[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.9486833,0.31622776,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	2026-03-26 18:31:10.896047+00
ae6d69dd-6445-4a6f-aa7b-6a0cc989319b	14f8f707-8a84-40df-8bda-399cf12eb33d	Initiative	[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.9486833,0.31622776,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	2026-03-26 18:31:10.90143+00
3692ce81-deb1-4ae9-865a-579df47d676e	14f8f707-8a84-40df-8bda-399cf12eb33d	Outcome	[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.9486833,0.31622776,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	2026-03-26 18:31:10.91015+00
\.


--
-- Data for Name: pay_runs; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.pay_runs (id, entity_id, period_id, pay_date, pay_period_start, pay_period_end, status, total_gross, total_deductions, total_net, employee_count, journal_entry_id, description, created_at) FROM stdin;
\.


--
-- Data for Name: pay_stubs; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.pay_stubs (id, pay_run_id, employee_id, employee_name, gross_pay, deductions, total_deductions, net_pay, created_at) FROM stdin;
\.


--
-- Data for Name: payroll_remittances; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.payroll_remittances (id, entity_id, remittance_type, amount, period_id, due_date, status, created_at) FROM stdin;
\.


--
-- Data for Name: procurement_matches; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.procurement_matches (id, po_id, invoice_id, receipt_id, po_amount, receipt_amount, invoice_amount, match_status, variance_amount, variance_percent, tolerance_percent, within_tolerance, matched_at) FROM stdin;
\.


--
-- Data for Name: reconciliation_runs; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.reconciliation_runs (id, run_date, status, entity_id_filter, period_id_filter, total_pairs_checked, balanced_count, discrepancy_count, tolerance, discrepancies, duration_ms, error_message, created_at) FROM stdin;
ecbf8e5f-a03b-4be2-9e78-355775e1abe0	2026-04-05 04:36:53.159+00	DISCREPANCY	\N	\N	5	0	5	0.01	[{"pg_debit": 37369, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1", "pg_credit": 118748, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 37369, "credit_difference": 118748}, {"pg_debit": 101379, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cc2-7429-a601-4ef3590d4948", "pg_credit": 2264000, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 101379, "credit_difference": 2264000}, {"pg_debit": 6441, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4c8f-7262-9856-48b5daebfd1a", "pg_credit": 7410, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 6441, "credit_difference": 7410}, {"pg_debit": 55467, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cad-7499-887d-7d2a1d8441f3", "pg_credit": 378744, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 55467, "credit_difference": 378744}, {"pg_debit": 73559, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cb8-74ac-9d55-4fd443572d58", "pg_credit": 922950, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 73559, "credit_difference": 922950}]	2068	\N	2026-04-05 04:36:53.159+00
5466f948-b7ab-4707-a367-f55376927529	2026-04-07 23:15:26.65+00	DISCREPANCY	\N	\N	5	0	5	0.01	[{"pg_debit": 37369, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1", "pg_credit": 118748, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 37369, "credit_difference": 118748}, {"pg_debit": 101379, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cc2-7429-a601-4ef3590d4948", "pg_credit": 2264000, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 101379, "credit_difference": 2264000}, {"pg_debit": 6441, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4c8f-7262-9856-48b5daebfd1a", "pg_credit": 7410, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 6441, "credit_difference": 7410}, {"pg_debit": 55467, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cad-7499-887d-7d2a1d8441f3", "pg_credit": 378744, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 55467, "credit_difference": 378744}, {"pg_debit": 73559, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cb8-74ac-9d55-4fd443572d58", "pg_credit": 922950, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 73559, "credit_difference": 922950}]	464	\N	2026-04-07 23:15:26.651+00
573e1612-dfe7-4088-8dee-3ebea0772922	2026-04-11 20:20:46.685+00	DISCREPANCY	\N	\N	5	0	5	0.01	[{"pg_debit": 37369, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1", "pg_credit": 118748, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 37369, "credit_difference": 118748}, {"pg_debit": 101379, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cc2-7429-a601-4ef3590d4948", "pg_credit": 2264000, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 101379, "credit_difference": 2264000}, {"pg_debit": 6441, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4c8f-7262-9856-48b5daebfd1a", "pg_credit": 7410, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 6441, "credit_difference": 7410}, {"pg_debit": 55467, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cad-7499-887d-7d2a1d8441f3", "pg_credit": 378744, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 55467, "credit_difference": 378744}, {"pg_debit": 73559, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cb8-74ac-9d55-4fd443572d58", "pg_credit": 922950, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 73559, "credit_difference": 922950}]	1567	\N	2026-04-11 20:20:46.686+00
715fa295-a7ce-4d58-8fce-d4ceb3b25b59	2026-04-17 22:16:37.518+00	DISCREPANCY	\N	\N	5	0	5	0.01	[{"pg_debit": 37369, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1", "pg_credit": 118748, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 37369, "credit_difference": 118748}, {"pg_debit": 101379, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cc2-7429-a601-4ef3590d4948", "pg_credit": 2264000, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 101379, "credit_difference": 2264000}, {"pg_debit": 6441, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4c8f-7262-9856-48b5daebfd1a", "pg_credit": 7410, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 6441, "credit_difference": 7410}, {"pg_debit": 55467, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cad-7499-887d-7d2a1d8441f3", "pg_credit": 378744, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 55467, "credit_difference": 378744}, {"pg_debit": 73559, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cb8-74ac-9d55-4fd443572d58", "pg_credit": 922950, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 73559, "credit_difference": 922950}]	644	\N	2026-04-17 22:16:37.518+00
bd2a49c1-a862-4097-88c9-c768620c130a	2026-04-18 23:26:18.456+00	DISCREPANCY	\N	\N	5	0	5	0.01	[{"pg_debit": 37369, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1", "pg_credit": 118748, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 37369, "credit_difference": 118748}, {"pg_debit": 101379, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cc2-7429-a601-4ef3590d4948", "pg_credit": 2264000, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 101379, "credit_difference": 2264000}, {"pg_debit": 6441, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4c8f-7262-9856-48b5daebfd1a", "pg_credit": 7410, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 6441, "credit_difference": 7410}, {"pg_debit": 55467, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cad-7499-887d-7d2a1d8441f3", "pg_credit": 378744, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 55467, "credit_difference": 378744}, {"pg_debit": 73559, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cb8-74ac-9d55-4fd443572d58", "pg_credit": 922950, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 73559, "credit_difference": 922950}]	813	\N	2026-04-18 23:26:18.456+00
29c89b9f-12c2-4927-ad28-5253eb902499	2026-04-20 00:13:40.445+00	DISCREPANCY	\N	\N	5	0	5	0.01	[{"pg_debit": 37369, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4ca1-7577-bc7b-5f7c5ddc3fc1", "pg_credit": 118748, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 37369, "credit_difference": 118748}, {"pg_debit": 101379, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cc2-7429-a601-4ef3590d4948", "pg_credit": 2264000, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 101379, "credit_difference": 2264000}, {"pg_debit": 6441, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4c8f-7262-9856-48b5daebfd1a", "pg_credit": 7410, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 6441, "credit_difference": 7410}, {"pg_debit": 55467, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cad-7499-887d-7d2a1d8441f3", "pg_credit": 378744, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 55467, "credit_difference": 378744}, {"pg_debit": 73559, "entity_id": "14f8f707-8a84-40df-8bda-399cf12eb33d", "period_id": "019d366d-4cb8-74ac-9d55-4fd443572d58", "pg_credit": 922950, "neo4j_debit": 0, "neo4j_credit": 0, "debit_difference": 73559, "credit_difference": 922950}]	547	\N	2026-04-20 00:13:40.446+00
\.


--
-- Data for Name: statutory_mappings; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.statutory_mappings (id, jurisdiction, node_ref_type, economic_category, node_tags_match, statutory_account_code, statutory_account_label, applies_from, applies_until, xbrl_element, xbrl_taxonomy) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: ebg
--

COPY public.users (id, email, first_name, last_name, role, status, entity_ids, password_hash, last_login, created_at, updated_at) FROM stdin;
\.


--
-- Name: bgw_job_id_seq; Type: SEQUENCE SET; Schema: _timescaledb_catalog; Owner: ebg
--

SELECT pg_catalog.setval('_timescaledb_catalog.bgw_job_id_seq', 1000, false);


--
-- Name: chunk_column_stats_id_seq; Type: SEQUENCE SET; Schema: _timescaledb_catalog; Owner: ebg
--

SELECT pg_catalog.setval('_timescaledb_catalog.chunk_column_stats_id_seq', 1, false);


--
-- Name: chunk_constraint_name; Type: SEQUENCE SET; Schema: _timescaledb_catalog; Owner: ebg
--

SELECT pg_catalog.setval('_timescaledb_catalog.chunk_constraint_name', 2, true);


--
-- Name: chunk_id_seq; Type: SEQUENCE SET; Schema: _timescaledb_catalog; Owner: ebg
--

SELECT pg_catalog.setval('_timescaledb_catalog.chunk_id_seq', 2, true);


--
-- Name: dimension_id_seq; Type: SEQUENCE SET; Schema: _timescaledb_catalog; Owner: ebg
--

SELECT pg_catalog.setval('_timescaledb_catalog.dimension_id_seq', 3, true);


--
-- Name: dimension_slice_id_seq; Type: SEQUENCE SET; Schema: _timescaledb_catalog; Owner: ebg
--

SELECT pg_catalog.setval('_timescaledb_catalog.dimension_slice_id_seq', 2, true);


--
-- Name: hypertable_id_seq; Type: SEQUENCE SET; Schema: _timescaledb_catalog; Owner: ebg
--

SELECT pg_catalog.setval('_timescaledb_catalog.hypertable_id_seq', 3, true);


--
-- Name: _hyper_1_1_chunk 1_1_gl_period_balances_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: ebg
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_1_chunk
    ADD CONSTRAINT "1_1_gl_period_balances_pkey" PRIMARY KEY (entity_id, period_id, fund_id, node_ref_id, economic_category);


--
-- Name: _hyper_2_2_chunk 2_2_equity_period_balances_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: ebg
--

ALTER TABLE ONLY _timescaledb_internal._hyper_2_2_chunk
    ADD CONSTRAINT "2_2_equity_period_balances_pkey" PRIMARY KEY (entity_id, period_id, fund_id, component);


--
-- Name: access_audit_log access_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.access_audit_log
    ADD CONSTRAINT access_audit_log_pkey PRIMARY KEY (id);


--
-- Name: ap_payment_runs ap_payment_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.ap_payment_runs
    ADD CONSTRAINT ap_payment_runs_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: budget_lines budget_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.budget_lines
    ADD CONSTRAINT budget_lines_pkey PRIMARY KEY (id);


--
-- Name: calibration_history calibration_history_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.calibration_history
    ADD CONSTRAINT calibration_history_pkey PRIMARY KEY (id);


--
-- Name: configuration_settings configuration_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.configuration_settings
    ADD CONSTRAINT configuration_settings_pkey PRIMARY KEY (id);


--
-- Name: configuration_settings configuration_settings_setting_key_scope_type_scope_id_scop_key; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.configuration_settings
    ADD CONSTRAINT configuration_settings_setting_key_scope_type_scope_id_scop_key UNIQUE (setting_key, scope_type, scope_id, scope_id_2, valid_from);


--
-- Name: equity_period_balances equity_period_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.equity_period_balances
    ADD CONSTRAINT equity_period_balances_pkey PRIMARY KEY (entity_id, period_id, fund_id, component);


--
-- Name: float_id_mapping float_id_mapping_entity_id_float_type_float_id_key; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.float_id_mapping
    ADD CONSTRAINT float_id_mapping_entity_id_float_type_float_id_key UNIQUE (entity_id, float_type, float_id);


--
-- Name: float_id_mapping float_id_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.float_id_mapping
    ADD CONSTRAINT float_id_mapping_pkey PRIMARY KEY (id);


--
-- Name: float_sync_runs float_sync_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.float_sync_runs
    ADD CONSTRAINT float_sync_runs_pkey PRIMARY KEY (id);


--
-- Name: float_sync_state float_sync_state_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.float_sync_state
    ADD CONSTRAINT float_sync_state_pkey PRIMARY KEY (entity_id, sync_type);


--
-- Name: forecast_snapshot_lines forecast_snapshot_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.forecast_snapshot_lines
    ADD CONSTRAINT forecast_snapshot_lines_pkey PRIMARY KEY (id);


--
-- Name: forecast_snapshots forecast_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.forecast_snapshots
    ADD CONSTRAINT forecast_snapshots_pkey PRIMARY KEY (id);


--
-- Name: fx_rates fx_rates_from_currency_to_currency_rate_date_key; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.fx_rates
    ADD CONSTRAINT fx_rates_from_currency_to_currency_rate_date_key UNIQUE (from_currency, to_currency, rate_date);


--
-- Name: fx_rates fx_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.fx_rates
    ADD CONSTRAINT fx_rates_pkey PRIMARY KEY (id);


--
-- Name: fx_revaluation_runs fx_revaluation_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.fx_revaluation_runs
    ADD CONSTRAINT fx_revaluation_runs_pkey PRIMARY KEY (id);


--
-- Name: gl_period_balances gl_period_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.gl_period_balances
    ADD CONSTRAINT gl_period_balances_pkey PRIMARY KEY (entity_id, period_id, fund_id, node_ref_id, economic_category);


--
-- Name: interco_amortization interco_amortization_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.interco_amortization
    ADD CONSTRAINT interco_amortization_pkey PRIMARY KEY (id);


--
-- Name: metric_observations metric_observations_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.metric_observations
    ADD CONSTRAINT metric_observations_pkey PRIMARY KEY (metric_id, observed_at);


--
-- Name: nfp_reclassifications nfp_reclassifications_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.nfp_reclassifications
    ADD CONSTRAINT nfp_reclassifications_pkey PRIMARY KEY (id);


--
-- Name: node_embeddings node_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.node_embeddings
    ADD CONSTRAINT node_embeddings_pkey PRIMARY KEY (node_id);


--
-- Name: pay_runs pay_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.pay_runs
    ADD CONSTRAINT pay_runs_pkey PRIMARY KEY (id);


--
-- Name: pay_stubs pay_stubs_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.pay_stubs
    ADD CONSTRAINT pay_stubs_pkey PRIMARY KEY (id);


--
-- Name: payroll_remittances payroll_remittances_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.payroll_remittances
    ADD CONSTRAINT payroll_remittances_pkey PRIMARY KEY (id);


--
-- Name: procurement_matches procurement_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.procurement_matches
    ADD CONSTRAINT procurement_matches_pkey PRIMARY KEY (id);


--
-- Name: reconciliation_runs reconciliation_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.reconciliation_runs
    ADD CONSTRAINT reconciliation_runs_pkey PRIMARY KEY (id);


--
-- Name: statutory_mappings statutory_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.statutory_mappings
    ADD CONSTRAINT statutory_mappings_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: _hyper_1_1_chunk_gl_period_balances_period_id_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: ebg
--

CREATE INDEX _hyper_1_1_chunk_gl_period_balances_period_id_idx ON _timescaledb_internal._hyper_1_1_chunk USING btree (period_id DESC);


--
-- Name: _hyper_1_1_chunk_idx_glpb_category; Type: INDEX; Schema: _timescaledb_internal; Owner: ebg
--

CREATE INDEX _hyper_1_1_chunk_idx_glpb_category ON _timescaledb_internal._hyper_1_1_chunk USING btree (entity_id, period_id, economic_category);


--
-- Name: _hyper_1_1_chunk_idx_glpb_entity_period; Type: INDEX; Schema: _timescaledb_internal; Owner: ebg
--

CREATE INDEX _hyper_1_1_chunk_idx_glpb_entity_period ON _timescaledb_internal._hyper_1_1_chunk USING btree (entity_id, period_id);


--
-- Name: _hyper_1_1_chunk_idx_glpb_fund; Type: INDEX; Schema: _timescaledb_internal; Owner: ebg
--

CREATE INDEX _hyper_1_1_chunk_idx_glpb_fund ON _timescaledb_internal._hyper_1_1_chunk USING btree (entity_id, period_id, fund_id) WHERE (fund_id IS NOT NULL);


--
-- Name: _hyper_1_1_chunk_idx_glpb_statutory; Type: INDEX; Schema: _timescaledb_internal; Owner: ebg
--

CREATE INDEX _hyper_1_1_chunk_idx_glpb_statutory ON _timescaledb_internal._hyper_1_1_chunk USING btree (entity_id, period_id, statutory_code);


--
-- Name: _hyper_2_2_chunk_equity_period_balances_period_id_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: ebg
--

CREATE INDEX _hyper_2_2_chunk_equity_period_balances_period_id_idx ON _timescaledb_internal._hyper_2_2_chunk USING btree (period_id DESC);


--
-- Name: _hyper_2_2_chunk_idx_eqpb_entity_period; Type: INDEX; Schema: _timescaledb_internal; Owner: ebg
--

CREATE INDEX _hyper_2_2_chunk_idx_eqpb_entity_period ON _timescaledb_internal._hyper_2_2_chunk USING btree (entity_id, period_id);


--
-- Name: equity_period_balances_period_id_idx; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX equity_period_balances_period_id_idx ON public.equity_period_balances USING btree (period_id DESC);


--
-- Name: gl_period_balances_period_id_idx; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX gl_period_balances_period_id_idx ON public.gl_period_balances USING btree (period_id DESC);


--
-- Name: idx_ap_payment_runs_date; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_ap_payment_runs_date ON public.ap_payment_runs USING btree (payment_date DESC);


--
-- Name: idx_ap_payment_runs_entity; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_ap_payment_runs_entity ON public.ap_payment_runs USING btree (entity_id);


--
-- Name: idx_audit_entity; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_audit_entity ON public.audit_log USING btree (entity_id, "timestamp" DESC);


--
-- Name: idx_audit_node; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_audit_node ON public.audit_log USING btree (node_id);


--
-- Name: idx_audit_sensitivity; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_audit_sensitivity ON public.access_audit_log USING btree (sensitivity_level, created_at DESC);


--
-- Name: idx_audit_user; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_audit_user ON public.audit_log USING btree (user_id, "timestamp" DESC);


--
-- Name: idx_budget_lines_budget; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_budget_lines_budget ON public.budget_lines USING btree (budget_id);


--
-- Name: idx_budget_lines_node; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_budget_lines_node ON public.budget_lines USING btree (node_ref_id);


--
-- Name: idx_budget_lines_period; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_budget_lines_period ON public.budget_lines USING btree (period_id);


--
-- Name: idx_cal_entity_outcome; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_cal_entity_outcome ON public.calibration_history USING btree (entity_id, outcome_type);


--
-- Name: idx_config_lookup; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_config_lookup ON public.configuration_settings USING btree (setting_key, scope_type, scope_id, valid_from DESC);


--
-- Name: idx_config_scope; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_config_scope ON public.configuration_settings USING btree (scope_type, scope_id);


--
-- Name: idx_eqpb_entity_period; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_eqpb_entity_period ON public.equity_period_balances USING btree (entity_id, period_id);


--
-- Name: idx_float_mapping_ebg; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_float_mapping_ebg ON public.float_id_mapping USING btree (entity_id, ebg_type, ebg_id);


--
-- Name: idx_float_sync_runs_entity; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_float_sync_runs_entity ON public.float_sync_runs USING btree (entity_id, created_at DESC);


--
-- Name: idx_forecast_snap_budget; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_forecast_snap_budget ON public.forecast_snapshots USING btree (budget_id);


--
-- Name: idx_forecast_snap_entity; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_forecast_snap_entity ON public.forecast_snapshots USING btree (entity_id);


--
-- Name: idx_forecast_snap_lines_period; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_forecast_snap_lines_period ON public.forecast_snapshot_lines USING btree (snapshot_id, period_id);


--
-- Name: idx_forecast_snap_lines_snap; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_forecast_snap_lines_snap ON public.forecast_snapshot_lines USING btree (snapshot_id);


--
-- Name: idx_forecast_snap_year; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_forecast_snap_year ON public.forecast_snapshots USING btree (entity_id, fiscal_year);


--
-- Name: idx_fx_rates_pair; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_fx_rates_pair ON public.fx_rates USING btree (from_currency, to_currency, rate_date DESC);


--
-- Name: idx_fx_reval_runs_entity; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_fx_reval_runs_entity ON public.fx_revaluation_runs USING btree (entity_id);


--
-- Name: idx_fx_reval_runs_period; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_fx_reval_runs_period ON public.fx_revaluation_runs USING btree (period_id);


--
-- Name: idx_glpb_category; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_glpb_category ON public.gl_period_balances USING btree (entity_id, period_id, economic_category);


--
-- Name: idx_glpb_entity_period; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_glpb_entity_period ON public.gl_period_balances USING btree (entity_id, period_id);


--
-- Name: idx_glpb_fund; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_glpb_fund ON public.gl_period_balances USING btree (entity_id, period_id, fund_id) WHERE (fund_id IS NOT NULL);


--
-- Name: idx_glpb_statutory; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_glpb_statutory ON public.gl_period_balances USING btree (entity_id, period_id, statutory_code);


--
-- Name: idx_interco_amort_loan; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_interco_amort_loan ON public.interco_amortization USING btree (loan_id, period_number);


--
-- Name: idx_interco_amort_status; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_interco_amort_status ON public.interco_amortization USING btree (loan_id, status);


--
-- Name: idx_nfp_reclass_date; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_nfp_reclass_date ON public.nfp_reclassifications USING btree (reclassification_date DESC);


--
-- Name: idx_nfp_reclass_entity; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_nfp_reclass_entity ON public.nfp_reclassifications USING btree (entity_id);


--
-- Name: idx_nfp_reclass_fund; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_nfp_reclass_fund ON public.nfp_reclassifications USING btree (fund_id);


--
-- Name: idx_node_embeddings_cosine; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_node_embeddings_cosine ON public.node_embeddings USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: idx_pay_runs_date; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_pay_runs_date ON public.pay_runs USING btree (pay_date DESC);


--
-- Name: idx_pay_runs_entity; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_pay_runs_entity ON public.pay_runs USING btree (entity_id);


--
-- Name: idx_pay_stubs_employee; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_pay_stubs_employee ON public.pay_stubs USING btree (employee_id);


--
-- Name: idx_pay_stubs_run; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_pay_stubs_run ON public.pay_stubs USING btree (pay_run_id);


--
-- Name: idx_payroll_remit_entity; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_payroll_remit_entity ON public.payroll_remittances USING btree (entity_id);


--
-- Name: idx_payroll_remit_status; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_payroll_remit_status ON public.payroll_remittances USING btree (status);


--
-- Name: idx_procurement_matches_invoice; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_procurement_matches_invoice ON public.procurement_matches USING btree (invoice_id);


--
-- Name: idx_procurement_matches_po; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_procurement_matches_po ON public.procurement_matches USING btree (po_id);


--
-- Name: idx_procurement_matches_status; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_procurement_matches_status ON public.procurement_matches USING btree (match_status);


--
-- Name: idx_recon_runs_date; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_recon_runs_date ON public.reconciliation_runs USING btree (created_at DESC);


--
-- Name: idx_recon_runs_entity; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_recon_runs_entity ON public.reconciliation_runs USING btree (entity_id_filter) WHERE (entity_id_filter IS NOT NULL);


--
-- Name: idx_sm_jurisdiction; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_sm_jurisdiction ON public.statutory_mappings USING btree (jurisdiction, node_ref_type, economic_category);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: metric_observations_observed_at_idx; Type: INDEX; Schema: public; Owner: ebg
--

CREATE INDEX metric_observations_observed_at_idx ON public.metric_observations USING btree (observed_at DESC);


--
-- Name: forecast_snapshot_lines forecast_snapshot_lines_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.forecast_snapshot_lines
    ADD CONSTRAINT forecast_snapshot_lines_snapshot_id_fkey FOREIGN KEY (snapshot_id) REFERENCES public.forecast_snapshots(id) ON DELETE CASCADE;


--
-- Name: pay_stubs pay_stubs_pay_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ebg
--

ALTER TABLE ONLY public.pay_stubs
    ADD CONSTRAINT pay_stubs_pay_run_id_fkey FOREIGN KEY (pay_run_id) REFERENCES public.pay_runs(id);


--
-- PostgreSQL database dump complete
--

\unrestrict VdsiYNrefNJ3rPHfjd3eqFIe9fqofKRwm4bPcOjOetphtnCJwqDT7gmRQA3gsbk

