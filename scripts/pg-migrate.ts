/**
 * PostgreSQL / TimescaleDB migration script.
 * Applies all SQL files and creates pgvector tables.
 * Run: npx tsx scripts/pg-migrate.ts
 */
import 'dotenv/config';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getPool, closePg } from '../src/lib/pg.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_DIR = join(__dirname, '..', 'sql');

const FILES = readdirSync(SQL_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort();

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

  console.log('\n=== PostgreSQL migration complete ===');
  await closePg();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
