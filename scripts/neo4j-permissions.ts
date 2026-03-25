/**
 * Neo4j permission setup — creates an application user with
 * controlled access to enforce the append-only ledger invariant.
 *
 * Strategy: The ebg_app user can read/create everything, and
 * modify (SET PROPERTY) on most nodes. JournalEntry and LedgerLine
 * nodes are protected by DENY DELETE — the application layer
 * (journal-posting-service) enforces full immutability. An APOC
 * trigger provides a defense-in-depth check against property mutation.
 *
 * Run: npx tsx scripts/neo4j-permissions.ts
 */
import 'dotenv/config';
import { getSession, closeNeo4j } from '../src/lib/neo4j.js';

async function main() {
  console.log('=== Neo4j Permission Setup ===\n');

  const session = getSession('system');
  const appPass = process.env.NEO4J_APP_PASSWORD ?? 'ebg_app_dev_password';

  const commands: Array<{ cypher: string; label: string; skipErrors?: string[] }> = [
    {
      cypher: `CREATE USER ebg_app SET PASSWORD '${appPass}' SET PASSWORD CHANGE NOT REQUIRED`,
      label: 'Create user ebg_app',
      skipErrors: ['already exists'],
    },
    {
      cypher: `CREATE ROLE ebg_writer`,
      label: 'Create role ebg_writer',
      skipErrors: ['already exists'],
    },
    {
      cypher: `GRANT ROLE ebg_writer TO ebg_app`,
      label: 'Grant ebg_writer to ebg_app',
      skipErrors: ['already exists', 'already has'],
    },
    // Full database access
    { cypher: `GRANT ACCESS ON DATABASE neo4j TO ebg_writer`, label: 'Grant DB access' },
    { cypher: `GRANT MATCH {*} ON GRAPH neo4j TO ebg_writer`, label: 'Grant MATCH' },
    { cypher: `GRANT WRITE ON GRAPH neo4j TO ebg_writer`, label: 'Grant WRITE' },
    { cypher: `GRANT CREATE NEW PROPERTY NAME ON DATABASE neo4j TO ebg_writer`, label: 'Grant CREATE NEW PROPERTY NAME' },
    { cypher: `GRANT CREATE NEW NODE LABEL ON DATABASE neo4j TO ebg_writer`, label: 'Grant CREATE NEW NODE LABEL' },
    { cypher: `GRANT CREATE NEW RELATIONSHIP TYPE ON DATABASE neo4j TO ebg_writer`, label: 'Grant CREATE NEW RELATIONSHIP TYPE' },
    // Revoke any prior DENY SET PROPERTY (from earlier misconfiguration)
    { cypher: `REVOKE DENY SET PROPERTY {*} ON GRAPH neo4j NODES JournalEntry FROM ebg_writer`, label: 'Revoke old DENY SET PROPERTY on JournalEntry', skipErrors: ['not have'] },
    { cypher: `REVOKE DENY SET PROPERTY {*} ON GRAPH neo4j NODES LedgerLine FROM ebg_writer`, label: 'Revoke old DENY SET PROPERTY on LedgerLine', skipErrors: ['not have'] },
    // DENY DELETE on JournalEntry and LedgerLine (append-only)
    { cypher: `DENY DELETE ON GRAPH neo4j NODES JournalEntry TO ebg_writer`, label: 'DENY DELETE on JournalEntry' },
    { cypher: `DENY DELETE ON GRAPH neo4j NODES LedgerLine TO ebg_writer`, label: 'DENY DELETE on LedgerLine' },
  ];

  for (const cmd of commands) {
    try {
      await session.run(cmd.cypher);
      console.log(`  [ok] ${cmd.label}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const skip = cmd.skipErrors?.some((s) => msg.includes(s));
      if (skip) {
        console.log(`  [skip] ${cmd.label} (already exists)`);
      } else {
        console.error(`  [FAIL] ${cmd.label}: ${msg}`);
      }
    }
  }

  await session.close();

  // Set up APOC trigger for immutability enforcement (defense in depth)
  console.log('\n  Setting up APOC trigger for JournalEntry/LedgerLine immutability...');
  const dbSession = getSession('neo4j');
  try {
    // Remove existing trigger if present, then recreate
    try {
      await dbSession.run(`CALL apoc.trigger.remove('enforce_ledger_immutability')`);
    } catch {
      // Trigger doesn't exist yet, that's fine
    }

    await dbSession.run(`
      CALL apoc.trigger.add('enforce_ledger_immutability',
        "UNWIND $assignedNodeProperties AS prop
         WITH prop
         WHERE prop.label IN ['JournalEntry', 'LedgerLine']
           AND prop.node.transaction_time_start IS NOT NULL
         CALL apoc.util.validate(true, 'Cannot modify immutable %s node %s', [prop.label, prop.node.id])
         RETURN null",
        {phase: 'before'})
    `);
    console.log('  [ok] APOC trigger installed');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('apoc') || msg.includes('Unknown function') || msg.includes('procedure')) {
      console.log('  [skip] APOC triggers not available — relying on RBAC + application layer');
    } else {
      console.error(`  [WARN] Trigger setup: ${msg}`);
    }
  }
  await dbSession.close();

  // Verify: create and attempt to delete a JournalEntry as ebg_app
  console.log('\n  Verifying deny rules...');
  const { default: neo4j } = await import('neo4j-driver');
  const testDriver = neo4j.driver(
    process.env.NEO4J_URI ?? 'bolt://localhost:7687',
    neo4j.auth.basic('ebg_app', appPass),
  );
  const testSession = testDriver.session({ database: 'neo4j' });

  try {
    // Create a test JournalEntry
    await testSession.run(
      `CREATE (j:JournalEntry {id: 'test-perm-check', total_debit: 100, total_credit: 100}) RETURN j`,
    );
    console.log('  [ok] ebg_app CAN create JournalEntry');

    // Try to delete it (should be denied)
    try {
      await testSession.run(
        `MATCH (j:JournalEntry {id: 'test-perm-check'}) DELETE j`,
      );
      console.log('  [FAIL] ebg_app was able to delete JournalEntry — DENY rule not working!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('denied') || msg.includes('not allowed') || msg.includes('Delete')) {
        console.log('  [ok] ebg_app CANNOT delete JournalEntry (correctly denied)');
      } else {
        console.log(`  [FAIL] Unexpected error: ${msg}`);
      }
    }

    // Clean up test node using admin session
    const adminSession = getSession('neo4j');
    await adminSession.run(`MATCH (j:JournalEntry {id: 'test-perm-check'}) DELETE j`);
    await adminSession.close();
    console.log('  [ok] Test node cleaned up via admin');
  } finally {
    await testSession.close();
    await testDriver.close();
  }

  console.log('\n=== Permission setup complete ===');
  console.log('  ebg_app: CAN create, CAN read, CANNOT delete JournalEntry/LedgerLine');
  console.log('  Property immutability enforced at application layer (journal-posting-service)');
  await closeNeo4j();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
