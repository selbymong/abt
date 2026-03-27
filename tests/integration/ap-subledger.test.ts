/**
 * Accounts Payable Subledger — Integration Tests
 *
 * Tests vendor master, invoice lifecycle (create → approve → post → pay),
 * aging report, payment runs, and dunning.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/neo4j.js', () => ({ runCypher: vi.fn() }));
vi.mock('../../src/lib/pg.js', () => ({ query: vi.fn() }));
vi.mock('../../src/lib/kafka.js', () => ({ sendEvent: vi.fn() }));
vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn() },
}));
vi.mock('../../src/services/gl/journal-posting-service.js', () => ({
  postJournalEntry: vi.fn(),
}));

import { runCypher } from '../../src/lib/neo4j.js';
import { query } from '../../src/lib/pg.js';
import { postJournalEntry } from '../../src/services/gl/journal-posting-service.js';
import {
  createVendor,
  getVendor,
  listVendors,
  updateVendor,
  createInvoice,
  getInvoice,
  listInvoices,
  approveInvoice,
  postInvoice,
  voidInvoice,
  getAgingReport,
  executePaymentRun,
  getDunningList,
} from '../../src/services/gl/ap-subledger-service.js';

const mockRunCypher = vi.mocked(runCypher);
const mockQuery = vi.mocked(query);
const mockPostJE = vi.mocked(postJournalEntry);

const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const PERIOD_ID = '22222222-2222-2222-2222-222222222222';
const VENDOR_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const INVOICE_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const ACTIVITY_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const SAMPLE_VENDOR = {
  id: VENDOR_ID,
  entity_id: ENTITY_ID,
  name: 'Acme Supplies',
  vendor_code: 'V-001',
  currency: 'CAD',
  payment_terms_days: 30,
  status: 'ACTIVE',
  total_outstanding: 0,
};

const SAMPLE_INVOICE = {
  id: INVOICE_ID,
  entity_id: ENTITY_ID,
  vendor_id: VENDOR_ID,
  invoice_number: 'INV-001',
  invoice_date: '2026-03-01',
  due_date: '2026-03-31',
  amount: 5000,
  amount_paid: 0,
  amount_remaining: 5000,
  currency: 'CAD',
  description: 'Office supplies',
  status: 'DRAFT',
  line_items: JSON.stringify([{
    description: 'Supplies', amount: 5000,
    nodeRefId: ACTIVITY_ID, nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE',
  }]),
  period_id: PERIOD_ID,
  fund_id: null,
};

describe('P8-AP-SUBLEDGER', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRunCypher.mockResolvedValue([]);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);
    mockPostJE.mockResolvedValue('mock-je-id');
  });

  // ========== Vendor CRUD ==========

  it('should create a vendor', async () => {
    const id = await createVendor({
      entityId: ENTITY_ID,
      name: 'Acme Supplies',
      vendorCode: 'V-001',
      currency: 'CAD',
      paymentTermsDays: 30,
    });

    expect(id).toBeDefined();
    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining('CREATE (v:Vendor'),
      expect.objectContaining({ name: 'Acme Supplies' }),
    );
  });

  it('should get a vendor by ID', async () => {
    mockRunCypher.mockResolvedValueOnce([{ v: SAMPLE_VENDOR }]);
    const vendor = await getVendor(VENDOR_ID);
    expect(vendor).toBeDefined();
    expect(vendor!.name).toBe('Acme Supplies');
  });

  it('should list vendors by entity', async () => {
    mockRunCypher.mockResolvedValueOnce([
      { v: { ...SAMPLE_VENDOR, id: 'v1', name: 'Vendor A' } },
      { v: { ...SAMPLE_VENDOR, id: 'v2', name: 'Vendor B' } },
    ]);
    const vendors = await listVendors(ENTITY_ID);
    expect(vendors).toHaveLength(2);
  });

  it('should update a vendor', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      v: { ...SAMPLE_VENDOR, payment_terms_days: 45 },
    }]);

    const updated = await updateVendor(VENDOR_ID, { payment_terms_days: 45 });
    expect(updated.payment_terms_days).toBe(45);
  });

  // ========== Invoice Lifecycle ==========

  it('should create an invoice', async () => {
    // Vendor lookup
    mockRunCypher.mockResolvedValueOnce([{ v: SAMPLE_VENDOR }]);
    // Create invoice
    mockRunCypher.mockResolvedValueOnce([]);

    const id = await createInvoice({
      entityId: ENTITY_ID,
      vendorId: VENDOR_ID,
      invoiceNumber: 'INV-001',
      invoiceDate: '2026-03-01',
      dueDate: '2026-03-31',
      amount: 5000,
      currency: 'CAD',
      description: 'Office supplies',
      lineItems: [{ description: 'Supplies', amount: 5000, nodeRefId: ACTIVITY_ID, nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE' }],
      periodId: PERIOD_ID,
    });

    expect(id).toBeDefined();
    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining('CREATE (i:APInvoice'),
      expect.objectContaining({ invoiceNumber: 'INV-001' }),
    );
  });

  it('should reject invoice if vendor not found', async () => {
    mockRunCypher.mockResolvedValueOnce([]); // Vendor not found

    await expect(createInvoice({
      entityId: ENTITY_ID,
      vendorId: 'nonexistent',
      invoiceNumber: 'INV-001',
      invoiceDate: '2026-03-01',
      dueDate: '2026-03-31',
      amount: 5000,
      currency: 'CAD',
      description: 'Test',
      lineItems: [{ description: 'X', amount: 5000, nodeRefId: ACTIVITY_ID, nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE' }],
      periodId: PERIOD_ID,
    })).rejects.toThrow('not found');
  });

  it('should approve a draft invoice', async () => {
    mockRunCypher.mockResolvedValueOnce([{ i: { ...SAMPLE_INVOICE, status: 'DRAFT' } }]);
    mockRunCypher.mockResolvedValueOnce([]);

    await approveInvoice(INVOICE_ID);

    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining("status = 'APPROVED'"),
      expect.objectContaining({ id: INVOICE_ID }),
    );
  });

  it('should reject approve if not DRAFT', async () => {
    mockRunCypher.mockResolvedValueOnce([{ i: { ...SAMPLE_INVOICE, status: 'POSTED' } }]);

    await expect(approveInvoice(INVOICE_ID)).rejects.toThrow('expected DRAFT');
  });

  it('should post an approved invoice with JE', async () => {
    mockRunCypher.mockResolvedValueOnce([{ i: { ...SAMPLE_INVOICE, status: 'APPROVED' } }]);
    mockRunCypher.mockResolvedValueOnce([]); // Update invoice
    mockRunCypher.mockResolvedValueOnce([]); // Update vendor outstanding

    const jeId = await postInvoice(INVOICE_ID);

    expect(jeId).toBe('mock-je-id');
    expect(mockPostJE).toHaveBeenCalledWith(
      expect.objectContaining({
        entryType: 'OPERATIONAL',
        lines: expect.arrayContaining([
          expect.objectContaining({ side: 'DEBIT', amount: 5000, economicCategory: 'EXPENSE' }),
          expect.objectContaining({ side: 'CREDIT', amount: 5000, economicCategory: 'LIABILITY' }),
        ]),
      }),
    );
  });

  it('should reject post if not APPROVED', async () => {
    mockRunCypher.mockResolvedValueOnce([{ i: { ...SAMPLE_INVOICE, status: 'DRAFT' } }]);

    await expect(postInvoice(INVOICE_ID)).rejects.toThrow('must be APPROVED');
  });

  it('should void a draft invoice', async () => {
    mockRunCypher.mockResolvedValueOnce([{ i: { ...SAMPLE_INVOICE, status: 'DRAFT' } }]);
    mockRunCypher.mockResolvedValueOnce([]);

    await voidInvoice(INVOICE_ID);

    expect(mockRunCypher).toHaveBeenCalledWith(
      expect.stringContaining("status = 'VOID'"),
      expect.objectContaining({ id: INVOICE_ID }),
    );
  });

  it('should reject void if already posted', async () => {
    mockRunCypher.mockResolvedValueOnce([{ i: { ...SAMPLE_INVOICE, status: 'POSTED' } }]);

    await expect(voidInvoice(INVOICE_ID)).rejects.toThrow('Cannot void');
  });

  // ========== Aging Report ==========

  it('should generate aging report', async () => {
    mockRunCypher.mockResolvedValueOnce([
      { vendor_id: VENDOR_ID, vendor_name: 'Acme', vendor_code: 'V-001', due_date: '2026-03-27', amount_remaining: 1000 }, // current (not yet due)
      { vendor_id: VENDOR_ID, vendor_name: 'Acme', vendor_code: 'V-001', due_date: '2026-02-15', amount_remaining: 2000 }, // ~39 days overdue
      { vendor_id: VENDOR_ID, vendor_name: 'Acme', vendor_code: 'V-001', due_date: '2025-11-01', amount_remaining: 3000 }, // 120+
    ]);

    const report = await getAgingReport(ENTITY_ID, '2026-03-26');

    expect(report.vendors).toHaveLength(1);
    expect(report.vendors[0].aging.current).toBe(1000); // due tomorrow = current
    expect(report.vendors[0].aging.days30).toBe(0);
    expect(report.vendors[0].aging.days60).toBe(2000); // 39 days overdue
    expect(report.vendors[0].aging.days120plus).toBe(3000);
    expect(report.totals.total).toBe(6000);
  });

  it('should return empty aging when no outstanding invoices', async () => {
    mockRunCypher.mockResolvedValueOnce([]);

    const report = await getAgingReport(ENTITY_ID, '2026-03-26');
    expect(report.vendors).toHaveLength(0);
    expect(report.totals.total).toBe(0);
  });

  // ========== Payment Runs ==========

  it('should execute payment run', async () => {
    // Find payable invoices
    mockRunCypher.mockResolvedValueOnce([
      {
        i: { ...SAMPLE_INVOICE, id: 'inv-1', status: 'POSTED', amount_remaining: 5000, invoice_number: 'INV-001', vendor_id: VENDOR_ID },
        vendor_name: 'Acme',
      },
    ]);
    // Update invoice
    mockRunCypher.mockResolvedValueOnce([]);
    // Update vendor
    mockRunCypher.mockResolvedValueOnce([]);
    // PG insert payment run
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const result = await executePaymentRun(ENTITY_ID, PERIOD_ID, '2026-03-26', 'CAD');

    expect(result.invoicesPaid).toBe(1);
    expect(result.totalAmount).toBe(5000);
    expect(result.journalEntryIds).toHaveLength(1);

    // Payment JE: DR Liability / CR Asset
    expect(mockPostJE).toHaveBeenCalledWith(
      expect.objectContaining({
        lines: expect.arrayContaining([
          expect.objectContaining({ side: 'DEBIT', economicCategory: 'LIABILITY' }),
          expect.objectContaining({ side: 'CREDIT', economicCategory: 'ASSET' }),
        ]),
      }),
    );
  });

  it('should handle empty payment run', async () => {
    mockRunCypher.mockResolvedValueOnce([]); // No invoices
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const result = await executePaymentRun(ENTITY_ID, PERIOD_ID, '2026-03-26', 'CAD');

    expect(result.invoicesPaid).toBe(0);
    expect(result.totalAmount).toBe(0);
    expect(mockPostJE).not.toHaveBeenCalled();
  });

  // ========== Dunning ==========

  it('should return overdue invoices for dunning', async () => {
    mockRunCypher.mockResolvedValueOnce([
      {
        id: 'inv-1', invoice_number: 'INV-001', vendor_id: VENDOR_ID,
        vendor_name: 'Acme', due_date: '2026-02-26', amount_remaining: 3000,
      },
    ]);

    const list = await getDunningList(ENTITY_ID, '2026-03-26');

    expect(list).toHaveLength(1);
    expect(list[0].daysOverdue).toBe(28);
    expect(list[0].amountRemaining).toBe(3000);
  });

  // ========== Invoice Listing ==========

  it('should list invoices by entity', async () => {
    mockRunCypher.mockResolvedValueOnce([
      { i: { ...SAMPLE_INVOICE, id: 'inv-1' } },
      { i: { ...SAMPLE_INVOICE, id: 'inv-2' } },
    ]);

    const invoices = await listInvoices(ENTITY_ID);
    expect(invoices).toHaveLength(2);
  });

  it('should filter invoices by vendor', async () => {
    mockRunCypher.mockResolvedValueOnce([
      { i: { ...SAMPLE_INVOICE, id: 'inv-1', vendor_id: VENDOR_ID } },
    ]);

    const invoices = await listInvoices(ENTITY_ID, VENDOR_ID);
    expect(invoices).toHaveLength(1);
  });
});
