-- ============================================================
-- 01-configuration-settings.sql
-- Enterprise Business Graph v1.2
-- Configuration management table (Addendum D)
-- Run in PostgreSQL BEFORE any feature code
-- ============================================================

CREATE TABLE configuration_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key           TEXT NOT NULL,
  scope_type            TEXT NOT NULL CHECK (scope_type IN ('SYSTEM','ENTITY','ENTITY_PAIR','PROGRAM','OUTCOME')),
  scope_id              UUID,
  scope_id_2            UUID,
  value_type            TEXT NOT NULL CHECK (value_type IN ('STRING','NUMERIC','BOOLEAN','JSON','ENUM')),
  value_string          TEXT,
  value_numeric         NUMERIC,
  value_boolean         BOOLEAN,
  value_json            JSONB,
  valid_from            DATE NOT NULL,
  valid_until           DATE,
  transaction_time      TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by            UUID NOT NULL,
  change_reason         TEXT,
  requires_restatement  BOOLEAN DEFAULT false,
  UNIQUE (setting_key, scope_type, scope_id, scope_id_2, valid_from)
);

CREATE INDEX idx_config_lookup ON configuration_settings
  (setting_key, scope_type, scope_id, valid_from DESC);

CREATE INDEX idx_config_scope ON configuration_settings
  (scope_type, scope_id);

COMMENT ON TABLE configuration_settings IS
  'Bi-temporal configuration store. All system/entity/policy settings.
   Replaces hardcoded values and "open decisions" from v1.0 spec.';
