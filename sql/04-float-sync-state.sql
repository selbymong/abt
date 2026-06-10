-- ============================================================
-- 04-float-sync-state.sql
-- Float Financial Integration — sync state, ID mapping, audit
-- ============================================================

-- Sync cursor state per entity per sync type
CREATE TABLE IF NOT EXISTS float_sync_state (
  entity_id       UUID NOT NULL,
  sync_type       TEXT NOT NULL CHECK (sync_type IN (
    'TRANSACTIONS', 'BILLS', 'REIMBURSEMENTS',
    'GL_CODES', 'VENDORS', 'TAX_CODES'
  )),
  last_synced_at  TIMESTAMPTZ,
  last_cursor     TEXT,
  last_run_id     UUID,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_id, sync_type)
);

-- Bidirectional ID mapping between Float and EBG
CREATE TABLE IF NOT EXISTS float_id_mapping (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id   UUID NOT NULL,
  float_type  TEXT NOT NULL CHECK (float_type IN (
    'TRANSACTION', 'BILL', 'REIMBURSEMENT',
    'GL_CODE', 'VENDOR', 'TAX_CODE', 'PAYMENT'
  )),
  float_id    TEXT NOT NULL,
  ebg_id      UUID NOT NULL,
  ebg_type    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_id, float_type, float_id)
);

CREATE INDEX IF NOT EXISTS idx_float_mapping_ebg
  ON float_id_mapping (entity_id, ebg_type, ebg_id);

-- Sync run audit log
CREATE TABLE IF NOT EXISTS float_sync_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id       UUID NOT NULL,
  sync_type       TEXT NOT NULL,
  direction       TEXT NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
  items_fetched   INT NOT NULL DEFAULT 0,
  items_imported  INT NOT NULL DEFAULT 0,
  items_skipped   INT NOT NULL DEFAULT 0,
  items_failed    INT NOT NULL DEFAULT 0,
  errors          JSONB,
  duration_ms     INT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_float_sync_runs_entity
  ON float_sync_runs (entity_id, created_at DESC);
