/**
 * Quick database verification script.
 * Run: npx tsx scripts/verify-db.ts
 */
import 'dotenv/config';
import { runCypher, closeNeo4j } from '../src/lib/neo4j.js';
import { query, closePg } from '../src/lib/pg.js';

async function main() {
  console.log('=== Neo4j Verification ===\n');

  const entities = await runCypher<Record<string, unknown>>(
    'MATCH (e:Entity) RETURN e.legal_name AS name, e.entity_type AS type, e.outcome_ontology AS ontology, e.fund_accounting_enabled AS fund_enabled ORDER BY e.legal_name'
  );
  console.log('Entity nodes:', entities.length);
  for (const e of entities) {
    console.log(`  - ${e.name} (${e.type}, ${e.ontology}, fund=${e.fund_enabled})`);
  }

  const nodeCount = await runCypher<{ label: string; count: number }>(
    'MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY count DESC'
  );
  console.log('\nNode counts:');
  for (const n of nodeCount) {
    console.log(`  ${n.label}: ${n.count}`);
  }

  console.log('\n=== PostgreSQL Verification ===\n');

  const configCount = await query<{ count: string }>('SELECT count(*) FROM configuration_settings');
  console.log(`Configuration settings: ${configCount.rows[0].count} rows`);

  const tables = await query<{ table_name: string }>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log(`Tables: ${tables.rows.map(r => r.table_name).join(', ')}`);

  const hypertables = await query<{ hypertable_name: string }>(
    'SELECT hypertable_name FROM timescaledb_information.hypertables'
  ).catch(() => ({ rows: [] as { hypertable_name: string }[] }));
  if (hypertables.rows.length > 0) {
    console.log(`Hypertables: ${hypertables.rows.map(r => r.hypertable_name).join(', ')}`);
  }

  console.log('\n=== All checks passed ===');

  await closeNeo4j();
  await closePg();
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
