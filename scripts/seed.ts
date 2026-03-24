/**
 * Seed script — creates initial configuration settings.
 * Run AFTER pg-migrate.ts and neo4j-init.ts.
 * Run: npx tsx scripts/seed.ts
 */
import 'dotenv/config';
import { v4 as uuid } from 'uuid';
import { query, closePg } from '../src/lib/pg.js';
import { runCypher, closeNeo4j } from '../src/lib/neo4j.js';

const SYSTEM_USER = '00000000-0000-0000-0000-000000000001';

async function seedConfig() {
  console.log('Seeding default configuration settings...');

  const settings = [
    // System-scoped defaults
    { key: 'combined_report_currency', type: 'STRING', str: 'CAD' },
    { key: 'combined_report_fx_method', type: 'ENUM', str: 'CLOSING_RATE' },
    { key: 'allocation_block_threshold', type: 'NUMERIC', num: 0.3 },
    { key: 'ai_confidence_discount_claimed_credits', type: 'NUMERIC', num: 0.1 },
    { key: 'default_materiality_threshold', type: 'NUMERIC', num: 50000 },
  ];

  for (const s of settings) {
    try {
      await query(
        `INSERT INTO configuration_settings
           (setting_key, scope_type, value_type,
            value_string, value_numeric,
            valid_from, changed_by, change_reason)
         VALUES ($1, 'SYSTEM', $2, $3, $4, '2024-01-01', $5, 'Initial seed')
         ON CONFLICT DO NOTHING`,
        [s.key, s.type, s.str ?? null, s.num ?? null, SYSTEM_USER],
      );
    } catch {
      // Ignore duplicates
    }
  }

  console.log(`  Seeded ${settings.length} system settings`);
}

async function seedEntityConfig() {
  console.log('Seeding entity-scoped configuration...');

  // Get entities from Neo4j
  const entities = await runCypher<{
    id: string; label: string; entity_type: string;
    reporting_framework: string; jurisdiction: string; functional_currency: string;
  }>(
    `MATCH (e:Entity)
     RETURN e.id AS id, e.label AS label, e.entity_type AS entity_type,
       e.reporting_framework AS reporting_framework,
       e.jurisdiction AS jurisdiction,
       e.functional_currency AS functional_currency`,
  );

  for (const entity of entities) {
    const entitySettings = [
      { key: 'reporting_framework', type: 'ENUM', str: entity.reporting_framework },
      { key: 'functional_currency', type: 'STRING', str: entity.functional_currency },
      {
        key: 'approval_thresholds', type: 'JSON',
        json: {
          tiers: [
            { role: 'MANAGER', max_amount: 10000 },
            { role: 'DIRECTOR', max_amount: 100000 },
            { role: 'VP_FINANCE', max_amount: 1000000 },
            { role: 'CFO', max_amount: null },
          ],
        },
      },
      { key: 'materiality_threshold', type: 'NUMERIC', num: 50000 },
    ];

    for (const s of entitySettings) {
      try {
        await query(
          `INSERT INTO configuration_settings
             (setting_key, scope_type, scope_id, value_type,
              value_string, value_numeric, value_json,
              valid_from, changed_by, change_reason)
           VALUES ($1, 'ENTITY', $2, $3, $4, $5, $6::jsonb, '2024-01-01', $7, 'Initial seed')
           ON CONFLICT DO NOTHING`,
          [
            s.key, entity.id, s.type,
            s.str ?? null, s.num ?? null,
            s.json ? JSON.stringify(s.json) : null,
            SYSTEM_USER,
          ],
        );
      } catch {
        // Ignore duplicates
      }
    }

    console.log(`  Seeded config for entity: ${entity.label}`);
  }
}

async function main() {
  console.log('=== EBG Seed Data ===\n');
  await seedConfig();
  await seedEntityConfig();
  console.log('\n=== Seed complete ===');
  await closePg();
  await closeNeo4j();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
