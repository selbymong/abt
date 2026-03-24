/**
 * PostgreSQL / TimescaleDB migration script.
 * Applies all SQL files and creates pgvector tables.
 * Run: npx tsx scripts/pg-migrate.ts
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getPool, closePg } from '../src/lib/pg.js';

const SQL_DIR = join(import.meta.dirname, '..', 'sql');

const FILES = [
  '01-configuration-settings.sql',
  '02-timescaledb-projections.sql',
];

async function main() {
  console.log('=== PostgreSQL Migration ===\n');
  const pool = getPool();

  for (const file of FILES) {
    const path = join(SQL_DIR, file);
    const content = readFileSync(path, 'utf-8');

    console.log(`  [exec] ${file}`);
    try {
      await pool.query(content);
      console.log(`  [done] ${file}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Skip "already exists" errors
      if (msg.includes('already exists')) {
        console.log(`  [skip] ${file} (already exists)`);
      } else {
        console.error(`  [FAIL] ${file}: ${msg}`);
      }
    }
  }

  // Create pgvector table
  console.log('\n  [exec] pgvector node_embeddings');
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS node_embeddings (
        node_id     UUID PRIMARY KEY,
        entity_id   UUID,
        node_label  TEXT,
        embedding   vector(1536),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_node_embeddings_cosine
      ON node_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
    `).catch(() => {
      // IVFFlat index requires data; skip if table is empty
      console.log('  [skip] IVFFlat index (requires data)');
    });
    console.log('  [done] pgvector');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('could not open extension')) {
      console.log('  [skip] pgvector extension not available (install separately)');
    } else {
      console.error(`  [FAIL] pgvector: ${msg}`);
    }
  }

  console.log('\n=== PostgreSQL migration complete ===');
  await closePg();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
