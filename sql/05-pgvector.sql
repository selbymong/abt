-- ============================================================
-- 05-pgvector.sql
-- Node embeddings for AI edge discovery
-- Requires pgvector extension
-- ============================================================

DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgvector extension not available — skipping';
END $$;

CREATE TABLE IF NOT EXISTS node_embeddings (
  node_id     UUID PRIMARY KEY,
  entity_id   UUID,
  node_label  TEXT,
  embedding   vector(1536),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
