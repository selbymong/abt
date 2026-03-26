-- ============================================================
-- 03-access-audit-log.sql
-- Enterprise Business Graph v1.2
-- Access audit logging for compliance
-- ============================================================

CREATE TABLE IF NOT EXISTS access_audit_log (
  id                UUID PRIMARY KEY,
  entity_id         UUID NOT NULL,
  user_id           UUID NOT NULL,
  action            TEXT NOT NULL CHECK (action IN ('READ','WRITE','DELETE','EXPORT')),
  resource_type     TEXT NOT NULL,
  resource_id       TEXT NOT NULL,
  sensitivity_level TEXT NOT NULL DEFAULT 'LOW' CHECK (sensitivity_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  ip_address        TEXT,
  details           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON access_audit_log (entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON access_audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_sensitivity ON access_audit_log (sensitivity_level, created_at DESC);

COMMENT ON TABLE access_audit_log IS 'Compliance audit log for tracking access to sensitive resources';
