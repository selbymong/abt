import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { postJournalEntry } from './journal-posting-service.js';
import type { InventoryCostMethod, InventoryCategory } from '../../schema/neo4j/types.js';

// ============================================================
// InventoryItem CRUD
// ============================================================

export interface CreateInventoryItemInput {
  entityId: string;
  label: string;
  sku: string;
  category: InventoryCategory;
  unitOfMeasure: string;
  costMethod: InventoryCostMethod;
  currency: string;
  reorderPoint?: number;
}

export async function createInventoryItem(input: CreateInventoryItemInput): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (i:InventoryItem {
      id: $id, entity_id: $entityId, label: $label,
      sku: $sku, category: $category,
      unit_of_measure: $unitOfMeasure,
      quantity_on_hand: 0, unit_cost: 0, total_cost: 0,
      nrv_per_unit: null, nrv_total: null, nrv_writedown: 0,
      carrying_amount: 0,
      cost_method: $costMethod, currency: $currency,
      reorder_point: $reorderPoint,
      is_active: true,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      label: input.label,
      sku: input.sku,
      category: input.category,
      unitOfMeasure: input.unitOfMeasure,
      costMethod: input.costMethod,
      currency: input.currency,
      reorderPoint: input.reorderPoint ?? null,
    },
  );
  return id;
}

export async function getInventoryItem(id: string) {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (i:InventoryItem {id: $id}) RETURN properties(i) AS i`,
    { id },
  );
  return rows.length > 0 ? rows[0].i : null;
}

export async function listInventoryItems(entityId: string, category?: InventoryCategory) {
  const catClause = category ? ' AND i.category = $category' : '';
  return runCypher<Record<string, any>>(
    `MATCH (i:InventoryItem {entity_id: $entityId})
     WHERE i.is_active = true ${catClause}
     RETURN properties(i) AS i ORDER BY i.sku`,
    { entityId, category: category ?? null },
  ).then(rows => rows.map(r => r.i));
}

// ============================================================
// InventoryLot CRUD
// ============================================================

export interface CreateInventoryLotInput {
  entityId: string;
  itemId: string;
  lotNumber: string;
  quantity: number;
  unitCost: number;
  acquisitionDate: string;
}

export async function createInventoryLot(input: CreateInventoryLotInput): Promise<string> {
  const id = uuid();
  const totalCost = Math.round(input.quantity * input.unitCost * 100) / 100;

  await runCypher(
    `CREATE (l:InventoryLot {
      id: $id, entity_id: $entityId, item_id: $itemId,
      lot_number: $lotNumber,
      quantity: $quantity, unit_cost: $unitCost, total_cost: $totalCost,
      acquisition_date: $acquisitionDate,
      remaining_quantity: $quantity,
      is_depleted: false,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      itemId: input.itemId,
      lotNumber: input.lotNumber,
      quantity: input.quantity,
      unitCost: input.unitCost,
      totalCost: totalCost,
      acquisitionDate: input.acquisitionDate,
    },
  );

  // Update inventory item totals
  await recalculateItemTotals(input.itemId);

  return id;
}

export async function getInventoryLot(id: string) {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (l:InventoryLot {id: $id}) RETURN properties(l) AS l`,
    { id },
  );
  return rows.length > 0 ? rows[0].l : null;
}

export async function listInventoryLots(itemId: string, includeDepletedLots?: boolean) {
  const depletedClause = includeDepletedLots ? '' : ' AND l.is_depleted = false';
  return runCypher<Record<string, any>>(
    `MATCH (l:InventoryLot {item_id: $itemId})
     WHERE 1=1 ${depletedClause}
     RETURN properties(l) AS l ORDER BY l.acquisition_date`,
    { itemId },
  ).then(rows => rows.map(r => r.l));
}

// ============================================================
// Receive Inventory (purchase)
// ============================================================

export interface ReceiveInventoryInput {
  entityId: string;
  itemId: string;
  quantity: number;
  unitCost: number;
  acquisitionDate: string;
  periodId: string;
  currency: string;
}

export async function receiveInventory(input: ReceiveInventoryInput): Promise<{
  lotId: string;
  journalEntryId: string;
}> {
  const lotNumber = `LOT-${Date.now()}`;
  const totalCost = Math.round(input.quantity * input.unitCost * 100) / 100;

  const lotId = await createInventoryLot({
    entityId: input.entityId,
    itemId: input.itemId,
    lotNumber,
    quantity: input.quantity,
    unitCost: input.unitCost,
    acquisitionDate: input.acquisitionDate,
  });

  // Post journal entry: DR Inventory (Asset), CR Accounts Payable (Liability)
  const journalEntryId = await postJournalEntry({
    entityId: input.entityId,
    periodId: input.periodId,
    entryType: 'OPERATIONAL',
    reference: `INV-RCV-${input.itemId}`,
    narrative: `Inventory receipt: ${input.quantity} units @ ${input.unitCost}`,
    currency: input.currency,
    validDate: input.acquisitionDate,
    sourceSystem: 'INVENTORY',
    lines: [
      {
        side: 'DEBIT',
        amount: totalCost,
        nodeRefId: input.itemId,
        nodeRefType: 'INVENTORY_ITEM',
        economicCategory: 'ASSET',
      },
      {
        side: 'CREDIT',
        amount: totalCost,
        nodeRefId: input.itemId,
        nodeRefType: 'INVENTORY_ITEM',
        economicCategory: 'LIABILITY',
      },
    ],
  });

  return { lotId, journalEntryId };
}

// ============================================================
// Issue Inventory (COGS recognition)
// ============================================================

export interface IssueInventoryInput {
  entityId: string;
  itemId: string;
  quantity: number;
  periodId: string;
  validDate: string;
  currency: string;
}

/**
 * Issue inventory using the item's configured cost method.
 * Returns COGS amount and posts journal entry.
 */
export async function issueInventory(input: IssueInventoryInput): Promise<{
  cogsAmount: number;
  journalEntryId: string;
  lotsConsumed: { lotId: string; quantity: number; unitCost: number }[];
}> {
  const item = await getInventoryItem(input.itemId);
  if (!item) throw new Error('InventoryItem not found');
  if (Number(item.quantity_on_hand) < input.quantity) {
    throw new Error(`Insufficient inventory: have ${item.quantity_on_hand}, need ${input.quantity}`);
  }

  const costMethod = item.cost_method as InventoryCostMethod;
  let cogsAmount: number;
  let lotsConsumed: { lotId: string; quantity: number; unitCost: number }[];

  if (costMethod === 'WEIGHTED_AVG') {
    const avgCost = Number(item.unit_cost);
    cogsAmount = Math.round(input.quantity * avgCost * 100) / 100;
    lotsConsumed = await consumeLotsWeightedAvg(input.itemId, input.quantity, avgCost);
  } else if (costMethod === 'LIFO') {
    const result = await consumeLotsLIFO(input.itemId, input.quantity);
    cogsAmount = result.totalCost;
    lotsConsumed = result.consumed;
  } else {
    // FIFO (default)
    const result = await consumeLotsFIFO(input.itemId, input.quantity);
    cogsAmount = result.totalCost;
    lotsConsumed = result.consumed;
  }

  // Post journal entry: DR COGS (Expense), CR Inventory (Asset)
  const journalEntryId = await postJournalEntry({
    entityId: input.entityId,
    periodId: input.periodId,
    entryType: 'OPERATIONAL',
    reference: `INV-ISS-${input.itemId}`,
    narrative: `Inventory issuance (${costMethod}): ${input.quantity} units, COGS ${cogsAmount}`,
    currency: input.currency,
    validDate: input.validDate,
    sourceSystem: 'INVENTORY',
    lines: [
      {
        side: 'DEBIT',
        amount: cogsAmount,
        nodeRefId: input.itemId,
        nodeRefType: 'INVENTORY_ITEM',
        economicCategory: 'EXPENSE',
      },
      {
        side: 'CREDIT',
        amount: cogsAmount,
        nodeRefId: input.itemId,
        nodeRefType: 'INVENTORY_ITEM',
        economicCategory: 'ASSET',
      },
    ],
  });

  // Recalculate item totals
  await recalculateItemTotals(input.itemId);

  return { cogsAmount, journalEntryId, lotsConsumed };
}

// ============================================================
// Cost Flow Methods (internal)
// ============================================================

async function consumeLotsFIFO(itemId: string, quantityNeeded: number) {
  const lots = await runCypher<Record<string, any>>(
    `MATCH (l:InventoryLot {item_id: $itemId})
     WHERE l.is_depleted = false AND l.remaining_quantity > 0
     RETURN properties(l) AS l ORDER BY l.acquisition_date ASC`,
    { itemId },
  ).then(rows => rows.map(r => r.l));

  return consumeFromLots(lots, quantityNeeded);
}

async function consumeLotsLIFO(itemId: string, quantityNeeded: number) {
  const lots = await runCypher<Record<string, any>>(
    `MATCH (l:InventoryLot {item_id: $itemId})
     WHERE l.is_depleted = false AND l.remaining_quantity > 0
     RETURN properties(l) AS l ORDER BY l.acquisition_date DESC`,
    { itemId },
  ).then(rows => rows.map(r => r.l));

  return consumeFromLots(lots, quantityNeeded);
}

async function consumeFromLots(lots: any[], quantityNeeded: number) {
  let remaining = quantityNeeded;
  let totalCost = 0;
  const consumed: { lotId: string; quantity: number; unitCost: number }[] = [];

  for (const lot of lots) {
    if (remaining <= 0) break;
    const available = Number(lot.remaining_quantity);
    const take = Math.min(remaining, available);
    const lotUnitCost = Number(lot.unit_cost);
    const cost = Math.round(take * lotUnitCost * 100) / 100;

    totalCost += cost;
    consumed.push({ lotId: lot.id, quantity: take, unitCost: lotUnitCost });

    const newRemaining = available - take;
    const isDepleted = newRemaining <= 0;

    await runCypher(
      `MATCH (l:InventoryLot {id: $lotId})
       SET l.remaining_quantity = $remaining,
           l.is_depleted = $depleted,
           l.updated_at = datetime()`,
      { lotId: lot.id, remaining: newRemaining, depleted: isDepleted },
    );

    remaining -= take;
  }

  return { totalCost: Math.round(totalCost * 100) / 100, consumed };
}

async function consumeLotsWeightedAvg(itemId: string, quantityNeeded: number, avgCost: number) {
  // For weighted average, consume lots proportionally (oldest first for tracking)
  const lots = await runCypher<Record<string, any>>(
    `MATCH (l:InventoryLot {item_id: $itemId})
     WHERE l.is_depleted = false AND l.remaining_quantity > 0
     RETURN properties(l) AS l ORDER BY l.acquisition_date ASC`,
    { itemId },
  ).then(rows => rows.map(r => r.l));

  let remaining = quantityNeeded;
  const consumed: { lotId: string; quantity: number; unitCost: number }[] = [];

  for (const lot of lots) {
    if (remaining <= 0) break;
    const available = Number(lot.remaining_quantity);
    const take = Math.min(remaining, available);

    consumed.push({ lotId: lot.id, quantity: take, unitCost: avgCost });

    const newRemaining = available - take;
    await runCypher(
      `MATCH (l:InventoryLot {id: $lotId})
       SET l.remaining_quantity = $remaining,
           l.is_depleted = $depleted,
           l.updated_at = datetime()`,
      { lotId: lot.id, remaining: newRemaining, depleted: newRemaining <= 0 },
    );

    remaining -= take;
  }

  return consumed;
}

// ============================================================
// Recalculate Item Totals
// ============================================================

async function recalculateItemTotals(itemId: string): Promise<void> {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (l:InventoryLot {item_id: $itemId})
     WHERE l.is_depleted = false AND l.remaining_quantity > 0
     RETURN SUM(l.remaining_quantity) AS totalQty,
            SUM(l.remaining_quantity * l.unit_cost) AS totalCost`,
    { itemId },
  );

  const totalQty = Number(rows[0].totalQty ?? 0);
  const totalCost = Math.round(Number(rows[0].totalCost ?? 0) * 100) / 100;
  const unitCost = totalQty > 0 ? Math.round((totalCost / totalQty) * 100) / 100 : 0;

  // Get current NRV writedown
  const itemRows = await runCypher<Record<string, any>>(
    `MATCH (i:InventoryItem {id: $itemId}) RETURN i.nrv_writedown AS wd`,
    { itemId },
  );
  const nrvWritedown = Number(itemRows[0]?.wd ?? 0);
  const carryingAmount = Math.round((totalCost - nrvWritedown) * 100) / 100;

  await runCypher(
    `MATCH (i:InventoryItem {id: $itemId})
     SET i.quantity_on_hand = $qty,
         i.unit_cost = $unitCost,
         i.total_cost = $totalCost,
         i.carrying_amount = $carrying,
         i.updated_at = datetime()`,
    { itemId, qty: totalQty, unitCost, totalCost, carrying: carryingAmount },
  );
}

// ============================================================
// NRV Testing (IAS 2 / ASC 330)
// ============================================================

export interface NRVTestInput {
  itemId: string;
  nrvPerUnit: number;
  periodId: string;
  validDate: string;
  currency: string;
}

/**
 * Test inventory for NRV impairment.
 * If NRV < cost, writes down to NRV (lower of cost and NRV).
 * Returns writedown amount (0 if no impairment).
 */
export async function testNRV(input: NRVTestInput): Promise<{
  writedownAmount: number;
  journalEntryId: string | null;
  previousWritedown: number;
  newCarryingAmount: number;
}> {
  const item = await getInventoryItem(input.itemId);
  if (!item) throw new Error('InventoryItem not found');

  const qty = Number(item.quantity_on_hand);
  const totalCost = Number(item.total_cost);
  const nrvTotal = Math.round(qty * input.nrvPerUnit * 100) / 100;
  const previousWritedown = Number(item.nrv_writedown);

  // Required writedown = max(0, cost - NRV)
  const requiredWritedown = Math.max(0, Math.round((totalCost - nrvTotal) * 100) / 100);
  const incrementalWritedown = Math.round((requiredWritedown - previousWritedown) * 100) / 100;

  // Update NRV data on item
  const newCarryingAmount = Math.round((totalCost - requiredWritedown) * 100) / 100;
  await runCypher(
    `MATCH (i:InventoryItem {id: $itemId})
     SET i.nrv_per_unit = $nrvPerUnit,
         i.nrv_total = $nrvTotal,
         i.nrv_writedown = $writedown,
         i.carrying_amount = $carrying,
         i.updated_at = datetime()`,
    {
      itemId: input.itemId,
      nrvPerUnit: input.nrvPerUnit,
      nrvTotal,
      writedown: requiredWritedown,
      carrying: newCarryingAmount,
    },
  );

  let journalEntryId: string | null = null;

  if (incrementalWritedown > 0.001) {
    // Post writedown: DR Cost of Goods Sold (Expense), CR Inventory (Asset)
    journalEntryId = await postJournalEntry({
      entityId: item.entity_id as string,
      periodId: input.periodId,
      entryType: 'ADJUSTMENT',
      reference: `INV-NRV-${input.itemId}`,
      narrative: `NRV writedown: ${item.label} (${item.sku}) — ${incrementalWritedown}`,
      currency: input.currency,
      validDate: input.validDate,
      sourceSystem: 'INVENTORY',
      lines: [
        {
          side: 'DEBIT',
          amount: incrementalWritedown,
          nodeRefId: input.itemId,
          nodeRefType: 'INVENTORY_ITEM',
          economicCategory: 'EXPENSE',
        },
        {
          side: 'CREDIT',
          amount: incrementalWritedown,
          nodeRefId: input.itemId,
          nodeRefType: 'INVENTORY_ITEM',
          economicCategory: 'ASSET',
        },
      ],
    });
  } else if (incrementalWritedown < -0.001) {
    // NRV reversal (only under IFRS; capped at original cost)
    const reversalAmount = Math.abs(incrementalWritedown);
    journalEntryId = await postJournalEntry({
      entityId: item.entity_id as string,
      periodId: input.periodId,
      entryType: 'REVERSAL',
      reference: `INV-NRV-REV-${input.itemId}`,
      narrative: `NRV reversal: ${item.label} (${item.sku}) — ${reversalAmount}`,
      currency: input.currency,
      validDate: input.validDate,
      sourceSystem: 'INVENTORY',
      lines: [
        {
          side: 'DEBIT',
          amount: reversalAmount,
          nodeRefId: input.itemId,
          nodeRefType: 'INVENTORY_ITEM',
          economicCategory: 'ASSET',
        },
        {
          side: 'CREDIT',
          amount: reversalAmount,
          nodeRefId: input.itemId,
          nodeRefType: 'INVENTORY_ITEM',
          economicCategory: 'EXPENSE',
        },
      ],
    });
  }

  return {
    writedownAmount: requiredWritedown,
    journalEntryId,
    previousWritedown,
    newCarryingAmount,
  };
}

// ============================================================
// Inventory Valuation Report
// ============================================================

export async function getInventoryValuation(entityId: string): Promise<{
  items: Record<string, any>[];
  totalCost: number;
  totalNRVWritedown: number;
  totalCarryingAmount: number;
  itemCount: number;
}> {
  const items = await listInventoryItems(entityId);
  const totalCost = items.reduce((s: number, i: any) => s + Number(i.total_cost), 0);
  const totalNRVWritedown = items.reduce((s: number, i: any) => s + Number(i.nrv_writedown), 0);
  const totalCarryingAmount = items.reduce((s: number, i: any) => s + Number(i.carrying_amount), 0);

  return {
    items,
    totalCost: Math.round(totalCost * 100) / 100,
    totalNRVWritedown: Math.round(totalNRVWritedown * 100) / 100,
    totalCarryingAmount: Math.round(totalCarryingAmount * 100) / 100,
    itemCount: items.length,
  };
}
