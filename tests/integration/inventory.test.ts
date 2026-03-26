/**
 * Inventory Accounting (IAS 2 / ASC 330) — Integration Tests
 *
 * Tests InventoryItem/Lot CRUD, FIFO/LIFO/WeightedAvg cost flow,
 * receive/issue transactions, NRV writedown, and valuation reporting.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { query, closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities, createAccountingPeriod } from '../../src/services/graph/graph-crud-service.js';
import {
  createInventoryItem,
  getInventoryItem,
  listInventoryItems,
  createInventoryLot,
  getInventoryLot,
  listInventoryLots,
  receiveInventory,
  issueInventory,
  testNRV,
  getInventoryValuation,
} from '../../src/services/gl/inventory-service.js';

let testEntityId: string;
let periodId: string;
const cleanupIds: { label: string; id: string }[] = [];

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  const fpEntity = entities.find((e) => e.entity_type === 'FOR_PROFIT');
  testEntityId = fpEntity!.id;

  periodId = track('AccountingPeriod', await createAccountingPeriod({
    entityId: testEntityId,
    label: 'Inventory Test Period',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  }));
});

afterAll(async () => {
  // Clean up TimescaleDB
  const periodIds = [periodId,
    ...cleanupIds.filter(c => c.label === 'AccountingPeriod').map(c => c.id)];
  const placeholders = periodIds.map((_, i) => `$${i + 1}`).join(', ');
  await query(`DELETE FROM gl_period_balances WHERE period_id IN (${placeholders})`, periodIds);

  // Clean up JEs
  const jeIds = await runCypher<{ id: string }>(
    `MATCH (j:JournalEntry) WHERE j.reference STARTS WITH 'INV-' RETURN j.id AS id`,
    {},
  );
  for (const je of jeIds) {
    await runCypher(`MATCH (ll:LedgerLine {journal_entry_id: $id}) DETACH DELETE ll`, { id: je.id });
    await runCypher(`MATCH (j:JournalEntry {id: $id}) DETACH DELETE j`, { id: je.id });
  }

  // Clean up inventory nodes
  for (const { label, id } of cleanupIds) {
    if (label === 'InventoryItem') {
      await runCypher(`MATCH (l:InventoryLot {item_id: $id}) DETACH DELETE l`, { id });
    }
    await runCypher(`MATCH (n {id: $id}) DETACH DELETE n`, { id });
  }

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

// ============================================================
// InventoryItem CRUD
// ============================================================

describe('InventoryItem CRUD', () => {
  let itemId: string;

  it('creates an inventory item', async () => {
    itemId = track('InventoryItem', await createInventoryItem({
      entityId: testEntityId,
      label: 'Widget A',
      sku: 'WGT-001',
      category: 'FINISHED_GOODS',
      unitOfMeasure: 'EACH',
      costMethod: 'FIFO',
      currency: 'CAD',
      reorderPoint: 100,
    }));

    const item = await getInventoryItem(itemId);
    expect(item).not.toBeNull();
    expect(item.sku).toBe('WGT-001');
    expect(item.category).toBe('FINISHED_GOODS');
    expect(item.cost_method).toBe('FIFO');
    expect(Number(item.quantity_on_hand)).toBe(0);
    expect(item.is_active).toBe(true);
  });

  it('lists items by entity', async () => {
    const items = await listInventoryItems(testEntityId);
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items.some((i: any) => i.id === itemId)).toBe(true);
  });

  it('filters items by category', async () => {
    const raw = await listInventoryItems(testEntityId, 'RAW_MATERIAL');
    expect(raw.every((i: any) => i.category === 'RAW_MATERIAL')).toBe(true);
  });
});

// ============================================================
// InventoryLot + Receive
// ============================================================

describe('Inventory Lots and Receiving', () => {
  let itemId: string;

  beforeAll(async () => {
    itemId = track('InventoryItem', await createInventoryItem({
      entityId: testEntityId,
      label: 'Widget B',
      sku: 'WGT-002',
      category: 'FINISHED_GOODS',
      unitOfMeasure: 'EACH',
      costMethod: 'FIFO',
      currency: 'CAD',
    }));
  });

  it('creates a lot and updates item totals', async () => {
    const lotId = track('Lot', await createInventoryLot({
      entityId: testEntityId,
      itemId,
      lotNumber: 'LOT-001',
      quantity: 50,
      unitCost: 10,
      acquisitionDate: '2026-01-01',
    }));

    const lot = await getInventoryLot(lotId);
    expect(lot).not.toBeNull();
    expect(Number(lot.quantity)).toBe(50);
    expect(Number(lot.unit_cost)).toBe(10);
    expect(Number(lot.remaining_quantity)).toBe(50);
    expect(lot.is_depleted).toBe(false);

    const item = await getInventoryItem(itemId);
    expect(Number(item.quantity_on_hand)).toBe(50);
    expect(Number(item.total_cost)).toBe(500);
  });

  it('receives inventory with journal entry', async () => {
    const result = await receiveInventory({
      entityId: testEntityId,
      itemId,
      quantity: 30,
      unitCost: 12,
      acquisitionDate: '2026-01-10',
      periodId,
      currency: 'CAD',
    });

    expect(result.lotId).toBeDefined();
    expect(result.journalEntryId).toBeDefined();

    const item = await getInventoryItem(itemId);
    expect(Number(item.quantity_on_hand)).toBe(80);
    expect(Number(item.total_cost)).toBe(860); // 500 + 360
  });

  it('lists lots for an item', async () => {
    const lots = await listInventoryLots(itemId);
    expect(lots.length).toBe(2);
  });
});

// ============================================================
// FIFO Cost Flow
// ============================================================

describe('FIFO Cost Flow', () => {
  let itemId: string;

  beforeAll(async () => {
    itemId = track('InventoryItem', await createInventoryItem({
      entityId: testEntityId,
      label: 'FIFO Widget',
      sku: 'FIFO-001',
      category: 'FINISHED_GOODS',
      unitOfMeasure: 'EACH',
      costMethod: 'FIFO',
      currency: 'CAD',
    }));

    // Lot 1: 10 units @ $5
    await createInventoryLot({
      entityId: testEntityId, itemId,
      lotNumber: 'FIFO-L1', quantity: 10, unitCost: 5,
      acquisitionDate: '2026-01-01',
    });
    // Lot 2: 10 units @ $8
    await createInventoryLot({
      entityId: testEntityId, itemId,
      lotNumber: 'FIFO-L2', quantity: 10, unitCost: 8,
      acquisitionDate: '2026-01-05',
    });
  });

  it('issues using oldest lots first (FIFO)', async () => {
    const result = await issueInventory({
      entityId: testEntityId,
      itemId,
      quantity: 15,
      periodId,
      validDate: '2026-01-15',
      currency: 'CAD',
    });

    // FIFO: 10 units @ $5 = $50, then 5 units @ $8 = $40
    expect(result.cogsAmount).toBe(90);
    expect(result.lotsConsumed.length).toBe(2);
    expect(result.lotsConsumed[0].unitCost).toBe(5);
    expect(result.lotsConsumed[0].quantity).toBe(10);
    expect(result.lotsConsumed[1].unitCost).toBe(8);
    expect(result.lotsConsumed[1].quantity).toBe(5);

    const item = await getInventoryItem(itemId);
    expect(Number(item.quantity_on_hand)).toBe(5);
    expect(Number(item.total_cost)).toBe(40); // 5 remaining @ $8
  });
});

// ============================================================
// LIFO Cost Flow
// ============================================================

describe('LIFO Cost Flow', () => {
  let itemId: string;

  beforeAll(async () => {
    itemId = track('InventoryItem', await createInventoryItem({
      entityId: testEntityId,
      label: 'LIFO Widget',
      sku: 'LIFO-001',
      category: 'FINISHED_GOODS',
      unitOfMeasure: 'EACH',
      costMethod: 'LIFO',
      currency: 'CAD',
    }));

    // Lot 1: 10 units @ $5
    await createInventoryLot({
      entityId: testEntityId, itemId,
      lotNumber: 'LIFO-L1', quantity: 10, unitCost: 5,
      acquisitionDate: '2026-01-01',
    });
    // Lot 2: 10 units @ $8
    await createInventoryLot({
      entityId: testEntityId, itemId,
      lotNumber: 'LIFO-L2', quantity: 10, unitCost: 8,
      acquisitionDate: '2026-01-05',
    });
  });

  it('issues using newest lots first (LIFO)', async () => {
    const result = await issueInventory({
      entityId: testEntityId,
      itemId,
      quantity: 15,
      periodId,
      validDate: '2026-01-15',
      currency: 'CAD',
    });

    // LIFO: 10 units @ $8 = $80, then 5 units @ $5 = $25
    expect(result.cogsAmount).toBe(105);
    expect(result.lotsConsumed[0].unitCost).toBe(8);
    expect(result.lotsConsumed[0].quantity).toBe(10);
    expect(result.lotsConsumed[1].unitCost).toBe(5);
    expect(result.lotsConsumed[1].quantity).toBe(5);

    const item = await getInventoryItem(itemId);
    expect(Number(item.quantity_on_hand)).toBe(5);
    expect(Number(item.total_cost)).toBe(25); // 5 remaining @ $5
  });
});

// ============================================================
// Weighted Average Cost Flow
// ============================================================

describe('Weighted Average Cost Flow', () => {
  let itemId: string;

  beforeAll(async () => {
    itemId = track('InventoryItem', await createInventoryItem({
      entityId: testEntityId,
      label: 'WA Widget',
      sku: 'WA-001',
      category: 'FINISHED_GOODS',
      unitOfMeasure: 'EACH',
      costMethod: 'WEIGHTED_AVG',
      currency: 'CAD',
    }));

    // Lot 1: 10 units @ $5 = $50
    await createInventoryLot({
      entityId: testEntityId, itemId,
      lotNumber: 'WA-L1', quantity: 10, unitCost: 5,
      acquisitionDate: '2026-01-01',
    });
    // Lot 2: 10 units @ $10 = $100
    await createInventoryLot({
      entityId: testEntityId, itemId,
      lotNumber: 'WA-L2', quantity: 10, unitCost: 10,
      acquisitionDate: '2026-01-05',
    });
  });

  it('issues using weighted average unit cost', async () => {
    // WA: (50 + 100) / 20 = $7.50
    const item = await getInventoryItem(itemId);
    expect(Number(item.unit_cost)).toBe(7.5);

    const result = await issueInventory({
      entityId: testEntityId,
      itemId,
      quantity: 8,
      periodId,
      validDate: '2026-01-15',
      currency: 'CAD',
    });

    // COGS = 8 × $7.50 = $60
    expect(result.cogsAmount).toBe(60);
  });

  it('throws when issuing more than available', async () => {
    await expect(issueInventory({
      entityId: testEntityId,
      itemId,
      quantity: 999,
      periodId,
      validDate: '2026-01-20',
      currency: 'CAD',
    })).rejects.toThrow('Insufficient inventory');
  });
});

// ============================================================
// NRV Testing
// ============================================================

describe('NRV Testing', () => {
  let itemId: string;

  beforeAll(async () => {
    itemId = track('InventoryItem', await createInventoryItem({
      entityId: testEntityId,
      label: 'NRV Widget',
      sku: 'NRV-001',
      category: 'FINISHED_GOODS',
      unitOfMeasure: 'EACH',
      costMethod: 'FIFO',
      currency: 'CAD',
    }));

    await createInventoryLot({
      entityId: testEntityId, itemId,
      lotNumber: 'NRV-L1', quantity: 100, unitCost: 20,
      acquisitionDate: '2026-01-01',
    });
  });

  it('detects NRV writedown when NRV < cost', async () => {
    // Cost = 100 × $20 = $2000, NRV = 100 × $15 = $1500
    const result = await testNRV({
      itemId,
      nrvPerUnit: 15,
      periodId,
      validDate: '2026-01-20',
      currency: 'CAD',
    });

    expect(result.writedownAmount).toBe(500);
    expect(result.journalEntryId).toBeDefined();
    expect(result.newCarryingAmount).toBe(1500);

    const item = await getInventoryItem(itemId);
    expect(Number(item.nrv_writedown)).toBe(500);
    expect(Number(item.carrying_amount)).toBe(1500);
  });

  it('no writedown when NRV >= cost', async () => {
    // Create new item with NRV above cost
    const item2Id = track('InventoryItem', await createInventoryItem({
      entityId: testEntityId,
      label: 'NRV Widget 2',
      sku: 'NRV-002',
      category: 'FINISHED_GOODS',
      unitOfMeasure: 'EACH',
      costMethod: 'FIFO',
      currency: 'CAD',
    }));
    await createInventoryLot({
      entityId: testEntityId, itemId: item2Id,
      lotNumber: 'NRV-L2', quantity: 50, unitCost: 10,
      acquisitionDate: '2026-01-01',
    });

    const result = await testNRV({
      itemId: item2Id,
      nrvPerUnit: 15, // NRV $750 > cost $500
      periodId,
      validDate: '2026-01-20',
      currency: 'CAD',
    });

    expect(result.writedownAmount).toBe(0);
    expect(result.journalEntryId).toBeNull();
    expect(result.newCarryingAmount).toBe(500);
  });

  it('reverses NRV writedown when NRV recovers', async () => {
    // NRV recovered from $15 to $22 (above original cost $20)
    const result = await testNRV({
      itemId,
      nrvPerUnit: 22,
      periodId,
      validDate: '2026-01-25',
      currency: 'CAD',
    });

    // Required writedown = 0 (NRV > cost), previous was 500
    expect(result.writedownAmount).toBe(0);
    expect(result.previousWritedown).toBe(500);
    expect(result.journalEntryId).toBeDefined(); // Reversal JE
    expect(result.newCarryingAmount).toBe(2000); // Back to full cost
  });
});

// ============================================================
// Inventory Valuation Report
// ============================================================

describe('Inventory Valuation Report', () => {
  it('returns entity-wide valuation summary', async () => {
    const report = await getInventoryValuation(testEntityId);
    expect(report.itemCount).toBeGreaterThanOrEqual(1);
    expect(typeof report.totalCost).toBe('number');
    expect(typeof report.totalNRVWritedown).toBe('number');
    expect(typeof report.totalCarryingAmount).toBe('number');
    expect(report.totalCarryingAmount).toBeLessThanOrEqual(report.totalCost);
  });
});
