/**
 * COA Migration — Integration Tests
 *
 * Tests COA mapping, validation, import, auto-node creation,
 * idempotency, and trial balance verification.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll, beforeEach } from 'vitest';
import { v4 as uuid } from 'uuid';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { closePg, query } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities } from '../../src/services/graph/graph-crud-service.js';
import {
  registerCOAMapping,
  registerCOAMappings,
  getCOAMapping,
  listCOAMappings,
  clearCOAMappings,
  validateImport,
  importLegacyGL,
  createNodesForUnmappedCodes,
  getMigrationSummary,
  type LegacyGLEntry,
} from '../../src/services/gl/coa-migration-service.js';

let testEntityId: string;
let testPeriodId: string;
const cleanupNodeIds: string[] = [];
const cleanupJEIds: string[] = [];

function trackNode(id: string) {
  cleanupNodeIds.push(id);
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  const fpEntity = entities.find((e) => e.entity_type === 'FOR_PROFIT');
  testEntityId = fpEntity!.id;

  const periods = await runCypher<{ id: string }>(
    `MATCH (p:AccountingPeriod {entity_id: $entityId, status: 'OPEN'})
     RETURN p.id AS id LIMIT 1`,
    { entityId: testEntityId },
  );
  testPeriodId = periods[0].id;
});

afterAll(async () => {
  // Clean up migration JEs and lines
  for (const id of cleanupJEIds) {
    await runCypher(`MATCH (je:JournalEntry {id: $id})<-[:BELONGS_TO]-(ll:LedgerLine) DETACH DELETE ll`, { id });
    await runCypher(`MATCH (je:JournalEntry {id: $id}) DETACH DELETE je`, { id });
    await query(`DELETE FROM gl_period_balances WHERE node_ref_id = $1`, [id]);
  }
  // Clean up test nodes
  for (const id of cleanupNodeIds) {
    await runCypher(`MATCH (n {id: $id}) DETACH DELETE n`, { id });
  }
  // Clean up migration JEs by reference pattern
  const migrationJEs = await runCypher<{ id: string }>(
    `MATCH (je:JournalEntry {entity_id: $entityId})
     WHERE je.reference STARTS WITH 'MIGRATION-TEST'
     RETURN je.id AS id`,
    { entityId: testEntityId },
  );
  for (const row of migrationJEs) {
    await runCypher(`MATCH (je:JournalEntry {id: $id})<-[:BELONGS_TO]-(ll:LedgerLine) DETACH DELETE ll`, { id: row.id });
    await runCypher(`MATCH (je:JournalEntry {id: $id}) DETACH DELETE je`, { id: row.id });
  }
  // Clean up legacy nodes
  await runCypher(
    `MATCH (n {entity_id: $entityId})
     WHERE n.migration_source_code IS NOT NULL
     DETACH DELETE n`,
    { entityId: testEntityId },
  );
  // Clean up TimescaleDB
  await query(
    `DELETE FROM gl_period_balances WHERE entity_id = $1 AND period_id = $2`,
    [testEntityId, testPeriodId],
  );

  clearCOAMappings();
  await closeNeo4j();
  await closePg();
  await closeKafka();
});

// ============================================================
// COA Mapping CRUD
// ============================================================

describe('COA Mapping', () => {
  beforeEach(() => {
    clearCOAMappings();
  });

  it('registers a single COA mapping', () => {
    registerCOAMapping({
      coaCode: '4100',
      coaLabel: 'Sales Revenue',
      nodeRefId: uuid(),
      nodeRefType: 'ACTIVITY',
      economicCategory: 'REVENUE',
    });

    const mapping = getCOAMapping('4100');
    expect(mapping).toBeDefined();
    expect(mapping!.coaLabel).toBe('Sales Revenue');
  });

  it('registers bulk mappings', () => {
    const count = registerCOAMappings([
      { coaCode: '5210', coaLabel: 'Advertising', nodeRefId: uuid(), nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE' },
      { coaCode: '2000', coaLabel: 'Accounts Payable', nodeRefId: uuid(), nodeRefType: 'CASHFLOWEVENT', economicCategory: 'LIABILITY' },
    ]);
    expect(count).toBe(2);
    expect(listCOAMappings().length).toBe(2);
  });

  it('clears all mappings', () => {
    registerCOAMapping({
      coaCode: '1000',
      coaLabel: 'Cash',
      nodeRefId: uuid(),
      nodeRefType: 'CASHFLOWEVENT',
      economicCategory: 'ASSET',
    });
    clearCOAMappings();
    expect(listCOAMappings().length).toBe(0);
  });
});

// ============================================================
// Validation
// ============================================================

describe('Import Validation', () => {
  beforeEach(() => {
    clearCOAMappings();
  });

  it('validates balanced entries', () => {
    const nodeId = uuid();
    registerCOAMappings([
      { coaCode: '5210', coaLabel: 'Ad Expense', nodeRefId: nodeId, nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE' },
      { coaCode: '2000', coaLabel: 'AP', nodeRefId: nodeId, nodeRefType: 'CASHFLOWEVENT', economicCategory: 'LIABILITY' },
    ]);

    const result = validateImport([{
      legacyId: 'JE-001',
      entryDate: '2025-01-15',
      narrative: 'Ad spend',
      sourceSystem: 'TEST',
      lines: [
        { coaCode: '5210', side: 'DEBIT', amount: 1000 },
        { coaCode: '2000', side: 'CREDIT', amount: 1000 },
      ],
    }]);

    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.entryCount).toBe(1);
    expect(result.lineCount).toBe(2);
  });

  it('rejects unbalanced entries', () => {
    registerCOAMapping({ coaCode: '5210', coaLabel: 'X', nodeRefId: uuid(), nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE' });
    registerCOAMapping({ coaCode: '2000', coaLabel: 'Y', nodeRefId: uuid(), nodeRefType: 'CASHFLOWEVENT', economicCategory: 'LIABILITY' });

    const result = validateImport([{
      legacyId: 'JE-BAD',
      entryDate: '2025-01-15',
      narrative: 'Unbalanced',
      sourceSystem: 'TEST',
      lines: [
        { coaCode: '5210', side: 'DEBIT', amount: 1000 },
        { coaCode: '2000', side: 'CREDIT', amount: 500 },
      ],
    }]);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('debits'))).toBe(true);
  });

  it('warns about unmapped COA codes', () => {
    const result = validateImport([{
      legacyId: 'JE-UNMAPPED',
      entryDate: '2025-01-15',
      narrative: 'Unknown codes',
      sourceSystem: 'TEST',
      lines: [
        { coaCode: '9999', side: 'DEBIT', amount: 100 },
        { coaCode: '8888', side: 'CREDIT', amount: 100 },
      ],
    }]);

    expect(result.valid).toBe(false);
    expect(result.unmappedCodes).toContain('9999');
    expect(result.unmappedCodes).toContain('8888');
  });
});

// ============================================================
// Import with posting
// ============================================================

describe('Legacy GL Import', () => {
  const activityId = uuid();
  const cfeId = uuid();

  beforeAll(async () => {
    clearCOAMappings();

    // Create graph nodes for mapping targets
    await runCypher(
      `CREATE (a:Activity {
        id: $id, entity_id: $entityId, label: 'Migration Test Revenue',
        status: 'IN_PROGRESS', created_at: datetime(), updated_at: datetime()
      })`,
      { id: activityId, entityId: testEntityId },
    );
    trackNode(activityId);

    await runCypher(
      `CREATE (c:CashFlowEvent {
        id: $id, entity_id: $entityId, label: 'Migration Test Cash',
        direction: 'INFLOW', status: 'SETTLED',
        created_at: datetime(), updated_at: datetime()
      })`,
      { id: cfeId, entityId: testEntityId },
    );
    trackNode(cfeId);

    registerCOAMappings([
      { coaCode: '4100', coaLabel: 'Revenue', nodeRefId: activityId, nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE' },
      { coaCode: '1000', coaLabel: 'Cash', nodeRefId: cfeId, nodeRefType: 'CASHFLOWEVENT', economicCategory: 'ASSET' },
    ]);
  });

  it('imports legacy GL entries as journal entries', async () => {
    const entries: LegacyGLEntry[] = [{
      legacyId: 'LEGACY-001',
      entryDate: '2025-06-15',
      narrative: 'Cash sale import',
      sourceSystem: 'TEST-SAP',
      lines: [
        { coaCode: '1000', side: 'DEBIT', amount: 5000 },
        { coaCode: '4100', side: 'CREDIT', amount: 5000 },
      ],
    }];

    const result = await importLegacyGL(testEntityId, testPeriodId, entries, 'CAD');
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.journalEntryIds.length).toBe(1);
    expect(result.errors.length).toBe(0);

    cleanupJEIds.push(...result.journalEntryIds);

    // Verify JE exists with migration reference
    const je = await runCypher<Record<string, any>>(
      `MATCH (je:JournalEntry {id: $id}) RETURN properties(je) AS je`,
      { id: result.journalEntryIds[0] },
    );
    expect(je[0].je.reference).toBe('MIGRATION-TEST-SAP-LEGACY-001');
  });

  it('skips already-imported entries (idempotency)', async () => {
    const entries: LegacyGLEntry[] = [{
      legacyId: 'LEGACY-001', // same as above
      entryDate: '2025-06-15',
      narrative: 'Cash sale import',
      sourceSystem: 'TEST-SAP',
      lines: [
        { coaCode: '1000', side: 'DEBIT', amount: 5000 },
        { coaCode: '4100', side: 'CREDIT', amount: 5000 },
      ],
    }];

    const result = await importLegacyGL(testEntityId, testPeriodId, entries, 'CAD');
    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('imports multiple entries in batch', async () => {
    const entries: LegacyGLEntry[] = [
      {
        legacyId: 'LEGACY-002',
        entryDate: '2025-06-20',
        narrative: 'Second sale',
        sourceSystem: 'TEST-SAP',
        lines: [
          { coaCode: '1000', side: 'DEBIT', amount: 3000 },
          { coaCode: '4100', side: 'CREDIT', amount: 3000 },
        ],
      },
      {
        legacyId: 'LEGACY-003',
        entryDate: '2025-06-25',
        narrative: 'Third sale',
        sourceSystem: 'TEST-SAP',
        lines: [
          { coaCode: '1000', side: 'DEBIT', amount: 2000 },
          { coaCode: '4100', side: 'CREDIT', amount: 2000 },
        ],
      },
    ];

    const result = await importLegacyGL(testEntityId, testPeriodId, entries, 'CAD');
    expect(result.imported).toBe(2);
    expect(result.journalEntryIds.length).toBe(2);

    cleanupJEIds.push(...result.journalEntryIds);
  });
});

// ============================================================
// Auto-create nodes for unmapped codes
// ============================================================

describe('Auto-create Nodes', () => {
  beforeEach(() => {
    clearCOAMappings();
  });

  it('creates graph nodes for unmapped COA codes', async () => {
    const mappings = await createNodesForUnmappedCodes(testEntityId, [
      { coaCode: '6100', coaLabel: 'Utilities Expense', economicCategory: 'EXPENSE' },
      { coaCode: '1200', coaLabel: 'Inventory', economicCategory: 'ASSET' },
    ]);

    expect(mappings.length).toBe(2);
    expect(mappings[0].nodeRefType).toBe('ACTIVITY'); // EXPENSE → Activity
    expect(mappings[1].nodeRefType).toBe('CASHFLOWEVENT'); // ASSET → CashFlowEvent

    // Should auto-register mappings
    expect(getCOAMapping('6100')).toBeDefined();
    expect(getCOAMapping('1200')).toBeDefined();

    // Clean up
    for (const m of mappings) {
      cleanupNodeIds.push(m.nodeRefId);
    }
  });
});

// ============================================================
// Migration Summary
// ============================================================

describe('Migration Summary', () => {
  it('returns summary of imported entries', async () => {
    const summary = await getMigrationSummary(testEntityId, 'TEST-SAP');
    expect(summary.totalEntries).toBeGreaterThanOrEqual(1);
    expect(typeof summary.totalDebits).toBe('number');
    expect(typeof summary.totalCredits).toBe('number');
  });
});
