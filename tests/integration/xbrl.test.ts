/**
 * XBRL Tagging — Integration Tests
 *
 * Tests XBRL taxonomy lookup, tagging on StatutoryMapping,
 * bulk auto-tagging, validation, and fact generation.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j } from '../../src/lib/neo4j.js';
import { query, closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities, createAccountingPeriod } from '../../src/services/graph/graph-crud-service.js';
import {
  createStatutoryMapping,
  getStatutoryMapping,
  listStatutoryMappings,
} from '../../src/services/gl/statutory-mapping-service.js';
import {
  getAvailableTags,
  lookupTag,
  tagMapping,
  bulkAutoTag,
  validateXBRLTagging,
  generateXBRLFacts,
  generateIXBRL,
} from '../../src/services/gl/xbrl-service.js';

let testEntityId: string;
let periodId: string;
const cleanupMappingIds: string[] = [];
const testJurisdiction = 'XBRL-TEST';

beforeAll(async () => {
  const entities = await getAllEntities();
  const fpEntity = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'CA');
  testEntityId = fpEntity!.id;

  // Create test period via graph-crud (Neo4j)
  periodId = await createAccountingPeriod({
    entityId: testEntityId,
    label: 'XBRL Test Period',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  });

  // Create test statutory mappings
  const mappings = [
    { nodeRefType: 'OUTCOME', economicCategory: 'REVENUE', code: 'REV-001', label: 'Sales Revenue' },
    { nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE', code: 'EXP-001', label: 'Cost of Sales' },
    { nodeRefType: 'FIXED_ASSET', economicCategory: 'ASSET', code: 'AST-001', label: 'Property Plant Equipment' },
    { nodeRefType: 'PROVISION', economicCategory: 'LIABILITY', code: 'LIA-001', label: 'Provisions for claims' },
    { nodeRefType: 'GOODWILL', economicCategory: 'ASSET', code: 'AST-002', label: 'Goodwill' },
    { nodeRefType: 'INVENTORY_ITEM', economicCategory: 'ASSET', code: 'AST-003', label: 'Inventories' },
    { nodeRefType: 'LEASE_LIABILITY', economicCategory: 'LIABILITY', code: 'LIA-002', label: 'Lease liabilities' },
    { nodeRefType: 'RIGHT_OF_USE_ASSET', economicCategory: 'ASSET', code: 'AST-004', label: 'Right-of-use assets' },
  ];

  for (const m of mappings) {
    const id = await createStatutoryMapping({
      jurisdiction: testJurisdiction,
      nodeRefType: m.nodeRefType,
      economicCategory: m.economicCategory,
      statutoryAccountCode: m.code,
      statutoryAccountLabel: m.label,
      appliesFrom: '2026-01-01',
    });
    cleanupMappingIds.push(id);
  }
});

afterAll(async () => {
  // Clean up test mappings
  for (const id of cleanupMappingIds) {
    await query(`DELETE FROM statutory_mappings WHERE id = $1::uuid`, [id]);
  }
  // Clean up test period from Neo4j
  const { runCypher } = await import('../../src/lib/neo4j.js');
  await runCypher(`MATCH (p:AccountingPeriod {id: $id}) DETACH DELETE p`, { id: periodId });

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

// ============================================================
// Taxonomy Catalog
// ============================================================

describe('XBRL Taxonomy Catalog', () => {
  it('returns IFRS taxonomy tags', () => {
    const tags = getAvailableTags('ifrs-full');
    expect(tags.length).toBeGreaterThan(10);
    expect(tags.some(t => t.element === 'ifrs-full:Revenue')).toBe(true);
    expect(tags.some(t => t.element === 'ifrs-full:Assets')).toBe(true);
  });

  it('returns US-GAAP taxonomy tags', () => {
    const tags = getAvailableTags('us-gaap');
    expect(tags.length).toBeGreaterThan(5);
    expect(tags.some(t => t.element === 'us-gaap:Revenues')).toBe(true);
  });

  it('looks up a specific tag', () => {
    const tag = lookupTag('Revenue', 'ifrs-full');
    expect(tag).not.toBeNull();
    expect(tag!.element).toBe('ifrs-full:Revenue');
    expect(tag!.dataType).toBe('monetary');
    expect(tag!.periodType).toBe('duration');
    expect(tag!.balance).toBe('credit');
  });

  it('returns null for unknown tag', () => {
    const tag = lookupTag('NonexistentTag', 'ifrs-full');
    expect(tag).toBeNull();
  });
});

// ============================================================
// Manual Tagging
// ============================================================

describe('Manual XBRL Tagging', () => {
  it('tags a mapping with an XBRL element', async () => {
    const mappingId = cleanupMappingIds[0]; // REV-001
    const success = await tagMapping(mappingId, 'ifrs-full:Revenue', 'ifrs-full');
    expect(success).toBe(true);

    const mapping = await getStatutoryMapping(mappingId);
    expect(mapping).not.toBeNull();
    expect(mapping!.xbrl_element).toBe('ifrs-full:Revenue');
    expect(mapping!.xbrl_taxonomy).toBe('ifrs-full');
  });

  it('overwrites existing tag', async () => {
    const mappingId = cleanupMappingIds[0];
    const success = await tagMapping(mappingId, 'ifrs-full:OtherRevenue', 'ifrs-full');
    expect(success).toBe(true);

    const mapping = await getStatutoryMapping(mappingId);
    expect(mapping!.xbrl_element).toBe('ifrs-full:OtherRevenue');

    // Restore correct tag
    await tagMapping(mappingId, 'ifrs-full:Revenue', 'ifrs-full');
  });
});

// ============================================================
// Bulk Auto-Tagging
// ============================================================

describe('Bulk Auto-Tagging', () => {
  it('auto-tags untagged mappings by node type', async () => {
    // Remove the manual tag from REV-001 so auto-tag can find it
    await tagMapping(cleanupMappingIds[0], '', 'ifrs-full');
    // Clear the tag properly
    await query(
      `UPDATE statutory_mappings SET xbrl_element = NULL, xbrl_taxonomy = NULL WHERE id = $1::uuid`,
      [cleanupMappingIds[0]],
    );

    const result = await bulkAutoTag(testJurisdiction);
    expect(result.tagged).toBeGreaterThanOrEqual(5);
    expect(result.mappings.length).toBeGreaterThanOrEqual(5);

    // Verify specific auto-mappings
    const fixedAssetMapping = result.mappings.find(m => m.code === 'AST-001');
    expect(fixedAssetMapping).toBeDefined();
    expect(fixedAssetMapping!.element).toBe('ifrs-full:PropertyPlantAndEquipment');

    const goodwillMapping = result.mappings.find(m => m.code === 'AST-002');
    expect(goodwillMapping).toBeDefined();
    expect(goodwillMapping!.element).toBe('ifrs-full:Goodwill');

    const inventoryMapping = result.mappings.find(m => m.code === 'AST-003');
    expect(inventoryMapping).toBeDefined();
    expect(inventoryMapping!.element).toBe('ifrs-full:Inventories');
  });
});

// ============================================================
// Validation
// ============================================================

describe('XBRL Validation', () => {
  it('validates tagging completeness', async () => {
    const result = await validateXBRLTagging(testJurisdiction);

    expect(result.jurisdiction).toBe(testJurisdiction);
    expect(result.totalMappings).toBe(8);
    expect(result.taggedMappings).toBeGreaterThanOrEqual(5);
    expect(result.coveragePct).toBeGreaterThan(50);
  });

  it('detects balance direction mismatches', async () => {
    // Tag a revenue mapping with a debit-balance element (intentional mismatch)
    const revId = cleanupMappingIds[0]; // REV-001 is REVENUE
    await tagMapping(revId, 'ifrs-full:Assets', 'ifrs-full'); // Assets is debit balance

    const result = await validateXBRLTagging(testJurisdiction);
    const mismatch = result.invalidTags.find(t => t.code === 'REV-001');
    expect(mismatch).toBeDefined();
    expect(mismatch!.reason).toContain('Balance mismatch');

    // Restore correct tag
    await tagMapping(revId, 'ifrs-full:Revenue', 'ifrs-full');
  });
});

// ============================================================
// XBRL Fact Generation
// ============================================================

describe('XBRL Fact Generation', () => {
  it('generates XBRL facts from period balances', async () => {
    const result = await generateXBRLFacts(testJurisdiction, testEntityId, periodId, 'CAD');

    expect(result.entityId).toBe(testEntityId);
    expect(result.periodId).toBe(periodId);
    expect(result.taxonomy).toBe('ifrs-full');
    expect(Array.isArray(result.facts)).toBe(true);
    expect(result.factCount).toBe(result.facts.length);
  });

  it('generates iXBRL tagged values', async () => {
    const result = await generateIXBRL(testJurisdiction, testEntityId, periodId, 'CAD');

    expect(result.entityId).toBe(testEntityId);
    expect(result.taxonomy).toBe('ifrs-full');
    expect(Array.isArray(result.taggedValues)).toBe(true);

    // Any facts with values should have proper iXBRL tags
    for (const tv of result.taggedValues) {
      expect(tv.tag).toContain('<ix:nonFraction');
      expect(tv.tag).toContain('name=');
      expect(tv.tag).toContain('contextRef=');
    }
  });
});
