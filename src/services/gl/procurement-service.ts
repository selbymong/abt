/**
 * Procurement Service
 *
 * Implements purchase order lifecycle:
 * - PO creation with budget check against Initiative/Project nodes
 * - PO approval workflow (DRAFT → APPROVED → ISSUED → RECEIVED → MATCHED → CLOSED)
 * - Goods receipt processing
 * - 3-way matching: PO amount vs receipt quantity vs AP invoice amount
 * - Integration with AP subledger for invoice matching
 *
 * PO does NOT post JEs directly — the AP invoice (once matched and posted) does.
 * PO is a commitment/encumbrance tracked in graph.
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';

// ============================================================
// Types
// ============================================================

export type POStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ISSUED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'MATCHED' | 'CLOSED' | 'CANCELLED';
export type ReceiptStatus = 'PENDING' | 'INSPECTED' | 'ACCEPTED' | 'REJECTED';
export type MatchStatus = 'UNMATCHED' | 'PARTIALLY_MATCHED' | 'MATCHED' | 'EXCEPTION';

export interface CreatePOInput {
  entityId: string;
  vendorId: string;
  description: string;
  currency: string;
  requestedBy: string;
  requiredDate: string;
  lineItems: POLineItemInput[];
  budgetNodeId?: string;
  fundId?: string;
}

export interface POLineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  accountId: string;
  fundId?: string;
}

export interface PurchaseOrder {
  id: string;
  entity_id: string;
  vendor_id: string;
  po_number: string;
  description: string;
  currency: string;
  total_amount: number;
  status: POStatus;
  requested_by: string;
  approved_by?: string;
  required_date: string;
  line_items: string;
  budget_node_id?: string;
  fund_id?: string;
  created_at: string;
  updated_at: string;
}

export interface POLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  quantityReceived: number;
  accountId: string;
  fundId?: string;
}

export interface GoodsReceipt {
  id: string;
  po_id: string;
  entity_id: string;
  receipt_number: string;
  receipt_date: string;
  received_by: string;
  status: ReceiptStatus;
  line_items: string;
  notes?: string;
  created_at: string;
}

export interface ReceiptLineItem {
  poLineId: string;
  quantityReceived: number;
  notes?: string;
}

export interface ThreeWayMatchResult {
  poId: string;
  invoiceId: string;
  receiptId: string;
  poAmount: number;
  receiptAmount: number;
  invoiceAmount: number;
  matchStatus: MatchStatus;
  varianceAmount: number;
  variancePercent: number;
  tolerancePercent: number;
  withinTolerance: boolean;
}

// ============================================================
// PO Number Generator
// ============================================================

async function generatePONumber(entityId: string): Promise<string> {
  const results = await runCypher<{ count: number }>(
    `MATCH (po:PurchaseOrder {entity_id: $entityId})
     RETURN count(po) AS count`,
    { entityId },
  );
  const seq = (results[0]?.count ?? 0) + 1;
  return `PO-${String(seq).padStart(5, '0')}`;
}

async function generateReceiptNumber(entityId: string): Promise<string> {
  const results = await runCypher<{ count: number }>(
    `MATCH (gr:GoodsReceipt {entity_id: $entityId})
     RETURN count(gr) AS count`,
    { entityId },
  );
  const seq = (results[0]?.count ?? 0) + 1;
  return `GR-${String(seq).padStart(5, '0')}`;
}

// ============================================================
// Purchase Order CRUD
// ============================================================

export async function createPurchaseOrder(input: CreatePOInput): Promise<string> {
  const id = uuid();
  const poNumber = await generatePONumber(input.entityId);

  const lineItems: POLineItem[] = input.lineItems.map((li) => ({
    id: uuid(),
    description: li.description,
    quantity: li.quantity,
    unitPrice: li.unitPrice,
    amount: Math.round(li.quantity * li.unitPrice * 100) / 100,
    quantityReceived: 0,
    accountId: li.accountId,
    fundId: li.fundId,
  }));

  const totalAmount = lineItems.reduce((sum, li) => sum + li.amount, 0);

  // Budget check if budgetNodeId provided
  if (input.budgetNodeId) {
    await checkBudget(input.budgetNodeId, totalAmount, input.currency);
  }

  await runCypher(
    `CREATE (po:PurchaseOrder {
      id: $id, entity_id: $entityId, vendor_id: $vendorId,
      po_number: $poNumber, description: $description,
      currency: $currency, total_amount: $totalAmount,
      status: 'DRAFT', requested_by: $requestedBy,
      required_date: $requiredDate,
      line_items: $lineItems,
      budget_node_id: $budgetNodeId,
      fund_id: $fundId,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      vendorId: input.vendorId,
      poNumber,
      description: input.description,
      currency: input.currency,
      totalAmount: Math.round(totalAmount * 100) / 100,
      requestedBy: input.requestedBy,
      requiredDate: input.requiredDate,
      lineItems: JSON.stringify(lineItems),
      budgetNodeId: input.budgetNodeId ?? null,
      fundId: input.fundId ?? null,
    },
  );

  return id;
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
  const results = await runCypher<{ po: PurchaseOrder }>(
    `MATCH (po:PurchaseOrder {id: $id}) RETURN properties(po) AS po`,
    { id },
  );
  return results[0]?.po ?? null;
}

export async function listPurchaseOrders(
  entityId: string,
  status?: POStatus,
  vendorId?: string,
): Promise<PurchaseOrder[]> {
  let where = 'po.entity_id = $entityId';
  const params: Record<string, unknown> = { entityId };

  if (status) {
    where += ' AND po.status = $status';
    params.status = status;
  }
  if (vendorId) {
    where += ' AND po.vendor_id = $vendorId';
    params.vendorId = vendorId;
  }

  const results = await runCypher<{ po: PurchaseOrder }>(
    `MATCH (po:PurchaseOrder) WHERE ${where}
     RETURN properties(po) AS po ORDER BY po.created_at DESC`,
    params,
  );
  return results.map((r) => r.po);
}

// ============================================================
// PO Approval Workflow
// ============================================================

export async function submitForApproval(poId: string): Promise<PurchaseOrder> {
  const po = await getPurchaseOrder(poId);
  if (!po) throw new Error(`PO ${poId} not found`);
  if (po.status !== 'DRAFT') throw new Error(`PO ${poId} is ${po.status}, must be DRAFT to submit`);

  const results = await runCypher<{ po: PurchaseOrder }>(
    `MATCH (po:PurchaseOrder {id: $id})
     SET po.status = 'PENDING_APPROVAL', po.updated_at = datetime()
     RETURN properties(po) AS po`,
    { id: poId },
  );
  return results[0].po;
}

export async function approvePurchaseOrder(poId: string, approvedBy: string): Promise<PurchaseOrder> {
  const po = await getPurchaseOrder(poId);
  if (!po) throw new Error(`PO ${poId} not found`);
  if (po.status !== 'PENDING_APPROVAL') throw new Error(`PO ${poId} is ${po.status}, must be PENDING_APPROVAL`);

  const results = await runCypher<{ po: PurchaseOrder }>(
    `MATCH (po:PurchaseOrder {id: $id})
     SET po.status = 'APPROVED', po.approved_by = $approvedBy, po.updated_at = datetime()
     RETURN properties(po) AS po`,
    { id: poId, approvedBy },
  );
  return results[0].po;
}

export async function issuePurchaseOrder(poId: string): Promise<PurchaseOrder> {
  const po = await getPurchaseOrder(poId);
  if (!po) throw new Error(`PO ${poId} not found`);
  if (po.status !== 'APPROVED') throw new Error(`PO ${poId} is ${po.status}, must be APPROVED to issue`);

  const results = await runCypher<{ po: PurchaseOrder }>(
    `MATCH (po:PurchaseOrder {id: $id})
     SET po.status = 'ISSUED', po.updated_at = datetime()
     RETURN properties(po) AS po`,
    { id: poId },
  );
  return results[0].po;
}

export async function cancelPurchaseOrder(poId: string, reason: string): Promise<PurchaseOrder> {
  const po = await getPurchaseOrder(poId);
  if (!po) throw new Error(`PO ${poId} not found`);
  if (po.status === 'MATCHED' || po.status === 'CLOSED') {
    throw new Error(`Cannot cancel PO in ${po.status} status`);
  }

  const results = await runCypher<{ po: PurchaseOrder }>(
    `MATCH (po:PurchaseOrder {id: $id})
     SET po.status = 'CANCELLED', po.cancel_reason = $reason, po.updated_at = datetime()
     RETURN properties(po) AS po`,
    { id: poId, reason },
  );
  return results[0].po;
}

// ============================================================
// Goods Receipt
// ============================================================

export async function createGoodsReceipt(
  poId: string,
  receivedBy: string,
  receiptDate: string,
  lines: ReceiptLineItem[],
  notes?: string,
): Promise<string> {
  const po = await getPurchaseOrder(poId);
  if (!po) throw new Error(`PO ${poId} not found`);
  if (po.status !== 'ISSUED' && po.status !== 'PARTIALLY_RECEIVED') {
    throw new Error(`PO ${poId} is ${po.status}, must be ISSUED or PARTIALLY_RECEIVED`);
  }

  const id = uuid();
  const receiptNumber = await generateReceiptNumber(po.entity_id);

  const poLines: POLineItem[] = typeof po.line_items === 'string'
    ? JSON.parse(po.line_items)
    : po.line_items as unknown as POLineItem[];

  // Validate receipt lines match PO lines
  for (const rl of lines) {
    const poLine = poLines.find((pl) => pl.id === rl.poLineId);
    if (!poLine) throw new Error(`PO line ${rl.poLineId} not found`);
    const totalReceived = poLine.quantityReceived + rl.quantityReceived;
    if (totalReceived > poLine.quantity) {
      throw new Error(`Receipt qty (${totalReceived}) exceeds PO qty (${poLine.quantity}) for line ${rl.poLineId}`);
    }
  }

  // Create receipt node
  await runCypher(
    `CREATE (gr:GoodsReceipt {
      id: $id, po_id: $poId, entity_id: $entityId,
      receipt_number: $receiptNumber, receipt_date: $receiptDate,
      received_by: $receivedBy, status: 'ACCEPTED',
      line_items: $lineItems, notes: $notes,
      created_at: datetime()
    })`,
    {
      id,
      poId,
      entityId: po.entity_id,
      receiptNumber,
      receiptDate,
      receivedBy,
      lineItems: JSON.stringify(lines),
      notes: notes ?? null,
    },
  );

  // Update PO line quantities
  for (const rl of lines) {
    const poLine = poLines.find((pl) => pl.id === rl.poLineId)!;
    poLine.quantityReceived += rl.quantityReceived;
  }

  const allFullyReceived = poLines.every((pl) => pl.quantityReceived >= pl.quantity);
  const anyReceived = poLines.some((pl) => pl.quantityReceived > 0);
  const newStatus: POStatus = allFullyReceived ? 'RECEIVED' : (anyReceived ? 'PARTIALLY_RECEIVED' : po.status);

  await runCypher(
    `MATCH (po:PurchaseOrder {id: $id})
     SET po.line_items = $lineItems, po.status = $status, po.updated_at = datetime()`,
    { id: poId, lineItems: JSON.stringify(poLines), status: newStatus },
  );

  return id;
}

export async function getGoodsReceipt(id: string): Promise<GoodsReceipt | null> {
  const results = await runCypher<{ gr: GoodsReceipt }>(
    `MATCH (gr:GoodsReceipt {id: $id}) RETURN properties(gr) AS gr`,
    { id },
  );
  return results[0]?.gr ?? null;
}

export async function listGoodsReceipts(poId: string): Promise<GoodsReceipt[]> {
  const results = await runCypher<{ gr: GoodsReceipt }>(
    `MATCH (gr:GoodsReceipt {po_id: $poId})
     RETURN properties(gr) AS gr ORDER BY gr.created_at`,
    { poId },
  );
  return results.map((r) => r.gr);
}

// ============================================================
// 3-Way Matching
// ============================================================

export async function performThreeWayMatch(
  poId: string,
  invoiceId: string,
  tolerancePercent: number = 2,
): Promise<ThreeWayMatchResult> {
  const po = await getPurchaseOrder(poId);
  if (!po) throw new Error(`PO ${poId} not found`);

  // Get receipts for this PO
  const receipts = await listGoodsReceipts(poId);
  if (receipts.length === 0) throw new Error(`No goods receipts found for PO ${poId}`);

  // Calculate total received amount
  const poLines: POLineItem[] = typeof po.line_items === 'string'
    ? JSON.parse(po.line_items)
    : po.line_items as unknown as POLineItem[];

  const receiptAmount = poLines.reduce((sum, pl) => {
    return sum + (pl.quantityReceived * pl.unitPrice);
  }, 0);

  // Get invoice from AP subledger (Neo4j node)
  const invoiceResults = await runCypher<{ i: { amount: number } }>(
    `MATCH (i {id: $invoiceId}) WHERE i:APInvoice OR i:ARInvoice
     RETURN properties(i) AS i`,
    { invoiceId },
  );
  if (invoiceResults.length === 0) throw new Error(`Invoice ${invoiceId} not found`);
  const invoiceAmount = Number(invoiceResults[0].i.amount);

  const poAmount = Number(po.total_amount);
  const varianceAmount = Math.abs(invoiceAmount - poAmount);
  const variancePercent = poAmount > 0 ? (varianceAmount / poAmount) * 100 : 0;
  const withinTolerance = variancePercent <= tolerancePercent;

  let matchStatus: MatchStatus;
  if (withinTolerance && receiptAmount >= poAmount * (1 - tolerancePercent / 100)) {
    matchStatus = 'MATCHED';
  } else if (variancePercent > tolerancePercent) {
    matchStatus = 'EXCEPTION';
  } else {
    matchStatus = 'PARTIALLY_MATCHED';
  }

  // If matched, update PO status
  if (matchStatus === 'MATCHED') {
    await runCypher(
      `MATCH (po:PurchaseOrder {id: $id})
       SET po.status = 'MATCHED', po.matched_invoice_id = $invoiceId, po.updated_at = datetime()`,
      { id: poId, invoiceId },
    );
  }

  // Record match result in PG
  await query(
    `INSERT INTO procurement_matches (id, po_id, invoice_id, receipt_id, po_amount, receipt_amount, invoice_amount,
      match_status, variance_amount, variance_percent, tolerance_percent, within_tolerance, matched_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
    [uuid(), poId, invoiceId, receipts[0].id, poAmount, Math.round(receiptAmount * 100) / 100,
     invoiceAmount, matchStatus, Math.round(varianceAmount * 100) / 100,
     Math.round(variancePercent * 100) / 100, tolerancePercent, withinTolerance],
  );

  return {
    poId,
    invoiceId,
    receiptId: receipts[0].id,
    poAmount,
    receiptAmount: Math.round(receiptAmount * 100) / 100,
    invoiceAmount,
    matchStatus,
    varianceAmount: Math.round(varianceAmount * 100) / 100,
    variancePercent: Math.round(variancePercent * 100) / 100,
    tolerancePercent,
    withinTolerance,
  };
}

// ============================================================
// Close PO
// ============================================================

export async function closePurchaseOrder(poId: string): Promise<PurchaseOrder> {
  const po = await getPurchaseOrder(poId);
  if (!po) throw new Error(`PO ${poId} not found`);
  if (po.status !== 'MATCHED' && po.status !== 'RECEIVED') {
    throw new Error(`PO ${poId} is ${po.status}, must be MATCHED or RECEIVED to close`);
  }

  const results = await runCypher<{ po: PurchaseOrder }>(
    `MATCH (po:PurchaseOrder {id: $id})
     SET po.status = 'CLOSED', po.updated_at = datetime()
     RETURN properties(po) AS po`,
    { id: poId },
  );
  return results[0].po;
}

// ============================================================
// Budget Check
// ============================================================

async function checkBudget(budgetNodeId: string, amount: number, currency: string): Promise<void> {
  const results = await runCypher<{ budget: number; spent: number }>(
    `MATCH (n {id: $nodeId})
     OPTIONAL MATCH (po:PurchaseOrder {budget_node_id: $nodeId})
     WHERE po.status IN ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ISSUED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'MATCHED']
       AND po.currency = $currency
     WITH n, COALESCE(SUM(po.total_amount), 0) AS committed
     RETURN COALESCE(n.budget_amount, 0) AS budget, committed AS spent`,
    { nodeId: budgetNodeId, currency },
  );

  if (results.length === 0) return; // No budget node — no check

  const budget = Number(results[0].budget);
  const spent = Number(results[0].spent);

  if (budget > 0 && spent + amount > budget) {
    throw new Error(`PO amount (${amount}) would exceed budget. Budget: ${budget}, Committed: ${spent}, Available: ${budget - spent}`);
  }
}

// ============================================================
// PO Summary / Reporting
// ============================================================

export async function getPOSummary(entityId: string): Promise<{
  totalOpen: number;
  totalAmount: number;
  byStatus: Record<string, number>;
}> {
  const results = await runCypher<{ status: string; count: number; total: number }>(
    `MATCH (po:PurchaseOrder {entity_id: $entityId})
     WHERE po.status <> 'CANCELLED'
     RETURN po.status AS status, count(po) AS count, SUM(po.total_amount) AS total`,
    { entityId },
  );

  const byStatus: Record<string, number> = {};
  let totalOpen = 0;
  let totalAmount = 0;

  for (const r of results) {
    byStatus[r.status] = Number(r.count);
    if (r.status !== 'CLOSED') {
      totalOpen += Number(r.count);
    }
    totalAmount += Number(r.total);
  }

  return { totalOpen, totalAmount, byStatus };
}
