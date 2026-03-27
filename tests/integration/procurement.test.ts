/**
 * Procurement Service — Integration Tests
 *
 * Tests PO lifecycle (create → submit → approve → issue → receive → match → close),
 * goods receipts, 3-way matching, budget checks, and cancellation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/neo4j.js', () => ({ runCypher: vi.fn() }));
vi.mock('../../src/lib/pg.js', () => ({ query: vi.fn() }));
vi.mock('../../src/lib/kafka.js', () => ({ sendEvent: vi.fn() }));
vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn() },
}));

import { runCypher } from '../../src/lib/neo4j.js';
import { query } from '../../src/lib/pg.js';
import {
  createPurchaseOrder,
  getPurchaseOrder,
  listPurchaseOrders,
  submitForApproval,
  approvePurchaseOrder,
  issuePurchaseOrder,
  cancelPurchaseOrder,
  createGoodsReceipt,
  getGoodsReceipt,
  listGoodsReceipts,
  performThreeWayMatch,
  closePurchaseOrder,
  getPOSummary,
} from '../../src/services/gl/procurement-service.js';

const mockRunCypher = vi.mocked(runCypher);
const mockQuery = vi.mocked(query);

const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const VENDOR_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PO_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const ACCOUNT_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const RECEIPT_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const INVOICE_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

const PO_LINE_ID = 'ff000000-0000-0000-0000-000000000001';

const SAMPLE_PO_LINES = [
  {
    id: PO_LINE_ID,
    description: 'Office supplies',
    quantity: 100,
    unitPrice: 25,
    amount: 2500,
    quantityReceived: 0,
    accountId: ACCOUNT_ID,
  },
];

const SAMPLE_PO = {
  id: PO_ID,
  entity_id: ENTITY_ID,
  vendor_id: VENDOR_ID,
  po_number: 'PO-00001',
  description: 'Q1 Office Supplies',
  currency: 'CAD',
  total_amount: 2500,
  status: 'DRAFT' as const,
  requested_by: 'user-1',
  required_date: '2026-04-15',
  line_items: JSON.stringify(SAMPLE_PO_LINES),
  budget_node_id: null,
  fund_id: null,
  created_at: '2026-03-01',
  updated_at: '2026-03-01',
};

beforeEach(() => {
  vi.resetAllMocks();
});

// ============================================================
// PO CRUD
// ============================================================

describe('Purchase Order CRUD', () => {
  it('createPurchaseOrder — creates PO with line items', async () => {
    // generatePONumber
    mockRunCypher.mockResolvedValueOnce([{ count: 0 }]);
    // CREATE PO
    mockRunCypher.mockResolvedValueOnce([]);

    const id = await createPurchaseOrder({
      entityId: ENTITY_ID,
      vendorId: VENDOR_ID,
      description: 'Q1 Office Supplies',
      currency: 'CAD',
      requestedBy: 'user-1',
      requiredDate: '2026-04-15',
      lineItems: [{ description: 'Office supplies', quantity: 100, unitPrice: 25, accountId: ACCOUNT_ID }],
    });
    expect(id).toBeDefined();
    expect(mockRunCypher).toHaveBeenCalledTimes(2);
    const createCypher = mockRunCypher.mock.calls[1][0];
    expect(createCypher).toContain('CREATE (po:PurchaseOrder');
  });

  it('createPurchaseOrder — checks budget when budgetNodeId provided', async () => {
    // generatePONumber
    mockRunCypher.mockResolvedValueOnce([{ count: 0 }]);
    // checkBudget
    mockRunCypher.mockResolvedValueOnce([{ budget: 10000, spent: 5000 }]);
    // CREATE PO
    mockRunCypher.mockResolvedValueOnce([]);

    const id = await createPurchaseOrder({
      entityId: ENTITY_ID,
      vendorId: VENDOR_ID,
      description: 'Within budget',
      currency: 'CAD',
      requestedBy: 'user-1',
      requiredDate: '2026-04-15',
      lineItems: [{ description: 'Item', quantity: 10, unitPrice: 100, accountId: ACCOUNT_ID }],
      budgetNodeId: 'budget-node-1',
    });
    expect(id).toBeDefined();
  });

  it('createPurchaseOrder — rejects when exceeds budget', async () => {
    // generatePONumber
    mockRunCypher.mockResolvedValueOnce([{ count: 0 }]);
    // checkBudget — budget 5000, already spent 4500, trying to add 1000
    mockRunCypher.mockResolvedValueOnce([{ budget: 5000, spent: 4500 }]);

    await expect(
      createPurchaseOrder({
        entityId: ENTITY_ID,
        vendorId: VENDOR_ID,
        description: 'Over budget',
        currency: 'CAD',
        requestedBy: 'user-1',
        requiredDate: '2026-04-15',
        lineItems: [{ description: 'Item', quantity: 10, unitPrice: 100, accountId: ACCOUNT_ID }],
        budgetNodeId: 'budget-node-1',
      }),
    ).rejects.toThrow('exceed budget');
  });

  it('getPurchaseOrder — returns PO by id', async () => {
    mockRunCypher.mockResolvedValueOnce([{ po: SAMPLE_PO }]);
    const result = await getPurchaseOrder(PO_ID);
    expect(result).toEqual(SAMPLE_PO);
  });

  it('listPurchaseOrders — filters by entity and status', async () => {
    mockRunCypher.mockResolvedValueOnce([{ po: SAMPLE_PO }]);
    const result = await listPurchaseOrders(ENTITY_ID, 'DRAFT');
    expect(result).toHaveLength(1);
    const cypher = mockRunCypher.mock.calls[0][0];
    expect(cypher).toContain('po.status = $status');
  });
});

// ============================================================
// Approval Workflow
// ============================================================

describe('PO Approval Workflow', () => {
  it('submitForApproval — DRAFT → PENDING_APPROVAL', async () => {
    mockRunCypher.mockResolvedValueOnce([{ po: SAMPLE_PO }]);
    mockRunCypher.mockResolvedValueOnce([{ po: { ...SAMPLE_PO, status: 'PENDING_APPROVAL' } }]);

    const result = await submitForApproval(PO_ID);
    expect(result.status).toBe('PENDING_APPROVAL');
  });

  it('submitForApproval — rejects non-DRAFT', async () => {
    mockRunCypher.mockResolvedValueOnce([{ po: { ...SAMPLE_PO, status: 'APPROVED' } }]);
    await expect(submitForApproval(PO_ID)).rejects.toThrow('must be DRAFT');
  });

  it('approvePurchaseOrder — PENDING_APPROVAL → APPROVED', async () => {
    mockRunCypher.mockResolvedValueOnce([{ po: { ...SAMPLE_PO, status: 'PENDING_APPROVAL' } }]);
    mockRunCypher.mockResolvedValueOnce([{ po: { ...SAMPLE_PO, status: 'APPROVED', approved_by: 'mgr-1' } }]);

    const result = await approvePurchaseOrder(PO_ID, 'mgr-1');
    expect(result.status).toBe('APPROVED');
    expect(result.approved_by).toBe('mgr-1');
  });

  it('issuePurchaseOrder — APPROVED → ISSUED', async () => {
    mockRunCypher.mockResolvedValueOnce([{ po: { ...SAMPLE_PO, status: 'APPROVED' } }]);
    mockRunCypher.mockResolvedValueOnce([{ po: { ...SAMPLE_PO, status: 'ISSUED' } }]);

    const result = await issuePurchaseOrder(PO_ID);
    expect(result.status).toBe('ISSUED');
  });

  it('cancelPurchaseOrder — cancels with reason', async () => {
    mockRunCypher.mockResolvedValueOnce([{ po: SAMPLE_PO }]);
    mockRunCypher.mockResolvedValueOnce([{ po: { ...SAMPLE_PO, status: 'CANCELLED' } }]);

    const result = await cancelPurchaseOrder(PO_ID, 'No longer needed');
    expect(result.status).toBe('CANCELLED');
  });

  it('cancelPurchaseOrder — rejects MATCHED or CLOSED', async () => {
    mockRunCypher.mockResolvedValueOnce([{ po: { ...SAMPLE_PO, status: 'MATCHED' } }]);
    await expect(cancelPurchaseOrder(PO_ID, 'test')).rejects.toThrow('Cannot cancel');
  });
});

// ============================================================
// Goods Receipt
// ============================================================

describe('Goods Receipt', () => {
  it('createGoodsReceipt — creates receipt and updates PO quantities', async () => {
    // getPurchaseOrder
    mockRunCypher.mockResolvedValueOnce([{ po: { ...SAMPLE_PO, status: 'ISSUED' } }]);
    // generateReceiptNumber
    mockRunCypher.mockResolvedValueOnce([{ count: 0 }]);
    // CREATE receipt
    mockRunCypher.mockResolvedValueOnce([]);
    // UPDATE PO line_items + status
    mockRunCypher.mockResolvedValueOnce([]);

    const id = await createGoodsReceipt(
      PO_ID, 'receiver-1', '2026-03-20',
      [{ poLineId: PO_LINE_ID, quantityReceived: 100 }],
    );
    expect(id).toBeDefined();

    // Verify PO status updated to RECEIVED (all lines fully received)
    const updateCall = mockRunCypher.mock.calls[3];
    expect(updateCall[1]).toHaveProperty('status', 'RECEIVED');
  });

  it('createGoodsReceipt — partial receipt sets PARTIALLY_RECEIVED', async () => {
    mockRunCypher.mockResolvedValueOnce([{ po: { ...SAMPLE_PO, status: 'ISSUED' } }]);
    mockRunCypher.mockResolvedValueOnce([{ count: 0 }]);
    mockRunCypher.mockResolvedValueOnce([]);
    mockRunCypher.mockResolvedValueOnce([]);

    await createGoodsReceipt(
      PO_ID, 'receiver-1', '2026-03-20',
      [{ poLineId: PO_LINE_ID, quantityReceived: 50 }],
    );

    const updateCall = mockRunCypher.mock.calls[3];
    expect(updateCall[1]).toHaveProperty('status', 'PARTIALLY_RECEIVED');
  });

  it('createGoodsReceipt — rejects over-receipt', async () => {
    mockRunCypher.mockResolvedValueOnce([{ po: { ...SAMPLE_PO, status: 'ISSUED' } }]);
    // generateReceiptNumber
    mockRunCypher.mockResolvedValueOnce([{ count: 0 }]);

    await expect(
      createGoodsReceipt(
        PO_ID, 'receiver-1', '2026-03-20',
        [{ poLineId: PO_LINE_ID, quantityReceived: 200 }],
      ),
    ).rejects.toThrow('exceeds PO qty');
  });

  it('createGoodsReceipt — rejects for non-ISSUED PO', async () => {
    mockRunCypher.mockResolvedValueOnce([{ po: SAMPLE_PO }]); // status = DRAFT
    await expect(
      createGoodsReceipt(PO_ID, 'receiver-1', '2026-03-20', [{ poLineId: PO_LINE_ID, quantityReceived: 10 }]),
    ).rejects.toThrow('must be ISSUED');
  });

  it('listGoodsReceipts — returns receipts for PO', async () => {
    const sampleReceipt = { id: RECEIPT_ID, po_id: PO_ID, entity_id: ENTITY_ID, receipt_number: 'GR-00001', receipt_date: '2026-03-20', received_by: 'user-1', status: 'ACCEPTED', line_items: '[]', created_at: '2026-03-20' };
    mockRunCypher.mockResolvedValueOnce([{ gr: sampleReceipt }]);
    const receipts = await listGoodsReceipts(PO_ID);
    expect(receipts).toHaveLength(1);
    expect(receipts[0].receipt_number).toBe('GR-00001');
  });
});

// ============================================================
// 3-Way Matching
// ============================================================

describe('3-Way Matching', () => {
  it('performThreeWayMatch — MATCHED when within tolerance', async () => {
    const receivedLines = SAMPLE_PO_LINES.map((l) => ({ ...l, quantityReceived: 100 }));
    const receivedPO = { ...SAMPLE_PO, status: 'RECEIVED', line_items: JSON.stringify(receivedLines) };

    // getPurchaseOrder
    mockRunCypher.mockResolvedValueOnce([{ po: receivedPO }]);
    // listGoodsReceipts
    mockRunCypher.mockResolvedValueOnce([{ gr: { id: RECEIPT_ID } }]);
    // Get invoice
    mockRunCypher.mockResolvedValueOnce([{ i: { amount: 2500 } }]);
    // Update PO to MATCHED
    mockRunCypher.mockResolvedValueOnce([]);
    // Record match in PG
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] });

    const result = await performThreeWayMatch(PO_ID, INVOICE_ID);
    expect(result.matchStatus).toBe('MATCHED');
    expect(result.withinTolerance).toBe(true);
    expect(result.varianceAmount).toBe(0);
  });

  it('performThreeWayMatch — EXCEPTION when variance exceeds tolerance', async () => {
    const receivedLines = SAMPLE_PO_LINES.map((l) => ({ ...l, quantityReceived: 100 }));
    const receivedPO = { ...SAMPLE_PO, status: 'RECEIVED', line_items: JSON.stringify(receivedLines) };

    mockRunCypher.mockResolvedValueOnce([{ po: receivedPO }]);
    mockRunCypher.mockResolvedValueOnce([{ gr: { id: RECEIPT_ID } }]);
    // Invoice amount differs significantly from PO
    mockRunCypher.mockResolvedValueOnce([{ i: { amount: 3000 } }]);
    // Record match in PG (no MATCHED update since it's an exception)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] });

    const result = await performThreeWayMatch(PO_ID, INVOICE_ID, 2);
    expect(result.matchStatus).toBe('EXCEPTION');
    expect(result.withinTolerance).toBe(false);
    expect(result.varianceAmount).toBe(500);
    expect(result.variancePercent).toBe(20);
  });

  it('performThreeWayMatch — rejects when no receipts', async () => {
    mockRunCypher.mockResolvedValueOnce([{ po: { ...SAMPLE_PO, status: 'ISSUED' } }]);
    mockRunCypher.mockResolvedValueOnce([]); // no receipts

    await expect(performThreeWayMatch(PO_ID, INVOICE_ID)).rejects.toThrow('No goods receipts');
  });
});

// ============================================================
// Close PO
// ============================================================

describe('Close PO', () => {
  it('closePurchaseOrder — MATCHED → CLOSED', async () => {
    mockRunCypher.mockResolvedValueOnce([{ po: { ...SAMPLE_PO, status: 'MATCHED' } }]);
    mockRunCypher.mockResolvedValueOnce([{ po: { ...SAMPLE_PO, status: 'CLOSED' } }]);

    const result = await closePurchaseOrder(PO_ID);
    expect(result.status).toBe('CLOSED');
  });

  it('closePurchaseOrder — rejects DRAFT', async () => {
    mockRunCypher.mockResolvedValueOnce([{ po: SAMPLE_PO }]);
    await expect(closePurchaseOrder(PO_ID)).rejects.toThrow('must be MATCHED or RECEIVED');
  });
});

// ============================================================
// Summary
// ============================================================

describe('PO Summary', () => {
  it('getPOSummary — aggregates PO counts by status', async () => {
    mockRunCypher.mockResolvedValueOnce([
      { status: 'DRAFT', count: 3, total: 7500 },
      { status: 'ISSUED', count: 2, total: 5000 },
      { status: 'CLOSED', count: 5, total: 25000 },
    ]);

    const summary = await getPOSummary(ENTITY_ID);
    expect(summary.totalOpen).toBe(5); // DRAFT + ISSUED (CLOSED excluded)
    expect(summary.totalAmount).toBe(37500);
    expect(summary.byStatus).toEqual({ DRAFT: 3, ISSUED: 2, CLOSED: 5 });
  });
});
