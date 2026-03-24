/**
 * Neo4j initialization script.
 * Applies all Cypher DDL files in order (01–08).
 * Run: npx tsx scripts/neo4j-init.ts
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getSession, closeNeo4j } from '../src/lib/neo4j.js';

const CYPHER_DIR = join(import.meta.dirname, '..', 'cypher');

const FILES = [
  '01-constraints-indexes.cypher',
  '02-business-graph-nodes.cypher',
  '03-gl-nodes.cypher',
  '04-workforce-customer-nodes.cypher',
  '05-edges.cypher',
  '06-traversal-queries.cypher',
  '07-v1.2-constraints-indexes.cypher',
  '08-v1.2-seed-data.cypher',
];

async function main() {
  console.log('=== Neo4j Schema Initialization ===\n');

  for (const file of FILES) {
    const path = join(CYPHER_DIR, file);
    const content = readFileSync(path, 'utf-8');

    // Split on semicolons, skip comments and empty statements
    const statements = content
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .filter((s) => !s.startsWith('//'))
      // Remove inline comments from statements
      .map((s) =>
        s
          .split('\n')
          .filter((line) => !line.trim().startsWith('//'))
          .join('\n')
          .trim(),
      )
      .filter((s) => s.length > 0);

    // Files 02, 04, 05 contain only commented templates — skip execution
    if (statements.length === 0) {
      console.log(`  [skip] ${file} (templates only)`);
      continue;
    }

    console.log(`  [exec] ${file} (${statements.length} statements)`);

    const session = getSession();
    try {
      for (const stmt of statements) {
        try {
          await session.run(stmt);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          // Skip "already exists" errors for constraints/indexes
          if (msg.includes('already exists')) {
            continue;
          }
          console.error(`    ERROR in ${file}: ${msg}`);
          console.error(`    Statement: ${stmt.slice(0, 120)}...`);
        }
      }
    } finally {
      await session.close();
    }
  }

  console.log('\n=== Neo4j initialization complete ===');
  await closeNeo4j();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
