/**
 * Accounts Receivable Subledger — Integration Tests
 *
 * Tests customer master, invoice lifecycle (create → post → pay / write-off),
 * aging report, and collections list.
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
import { postJournalEntry } from '../../src/services/gl/journal-posting-service.js';
import {
  createCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
  createARInvoice,
  getARInvoice,
  listARInvoices,
  postARInvoice,
  recordARPayment,
  writeOffARInvoice,
  getARAgingReport,
  getCollectionsList,
} from '../../src/services/gl/ar-subledger-service.js';

const mockRunCypher = vi.mocked(runCypher);
const mockPostJE = vi.mocked(postJournalEntry);

const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const PERIOD_ID = '22222222-2222-2222-2222-222222222222';
const CUSTOMER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const INVOICE_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const SAMPLE_CUSTOMER = {
  id: CUSTOMER_ID,
  entity_id: ENTITY_ID,
  name: 'Maple Corp',
  customer_code: 'C-001',
  currency: 'CAD',
  payment_terms_days: 30,
  credit_limit: 50000,
  status: 'ACTIVE',
  total_outstanding: 0,
  contact_email: 'ar@maple.com',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

const SAMPLE_INVOICE = {
  id: INVOICE_ID,
  entity_id: ENTITY_ID,
  customer_id: CUSTOMER_ID,
  invoice_number: 'INV-001',
  invoice_date: '2026-03-01',
  due_date: '2026-03-31',
  amount: 10000,
  amount_received: 0,
  amount_remaining: 10000,
  currency: 'CAD',
  description: 'Consulting services March',
  status: 'DRAFT',
  line_items: JSON.stringify([
    { description: 'Consulting', amount: 10000, nodeRefId: 'node-1', nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE' },
  ]),
  period_id: PERIOD_ID,
  fund_id: null,
  created_at: '2026-03-01',
  updated_at: '2026-03-01',
};

beforeEach(() => {
  vi.resetAllMocks();
});

// ============================================================
// Customer CRUD
// ============================================================

describe('Customer CRUD', () => {
  it('createCustomer — creates customer node in Neo4j', async () => {
    mockRunCypher.mockResolvedValueOnce([]);
    const id = await createCustomer({
      entityId: ENTITY_ID,
      name: 'Maple Corp',
      customerCode: 'C-001',
      currency: 'CAD',
      paymentTermsDays: 30,
      creditLimit: 50000,
      contactEmail: 'ar@maple.com',
    });
    expect(id).toBeDefined();
    expect(mockRunCypher).toHaveBeenCalledTimes(1);
    const cypher = mockRunCypher.mock.calls[0][0];
    expect(cypher).toContain('CREATE (c:Customer');
  });

  it('getCustomer — returns customer by id', async () => {
    mockRunCypher.mockResolvedValueOnce([{ c: SAMPLE_CUSTOMER }]);
    const result = await getCustomer(CUSTOMER_ID);
    expect(result).toEqual(SAMPLE_CUSTOMER);
  });

  it('getCustomer — returns null for non-existent', async () => {
    mockRunCypher.mockResolvedValueOnce([]);
    const result = await getCustomer('nonexistent');
    expect(result).toBeNull();
  });

  it('listCustomers — returns customers for entity', async () => {
    mockRunCypher.mockResolvedValueOnce([{ c: SAMPLE_CUSTOMER }]);
    const result = await listCustomers(ENTITY_ID);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Maple Corp');
  });

  it('listCustomers — filters by status', async () => {
    mockRunCypher.mockResolvedValueOnce([]);
    await listCustomers(ENTITY_ID, 'BLOCKED');
    const cypher = mockRunCypher.mock.calls[0][0];
    expect(cypher).toContain('c.status = $status');
  });

  it('updateCustomer — updates fields and returns customer', async () => {
    mockRunCypher.mockResolvedValueOnce([{ c: { ...SAMPLE_CUSTOMER, credit_limit: 75000 } }]);
    const result = await updateCustomer(CUSTOMER_ID, { credit_limit: 75000 });
    expect(result.credit_limit).toBe(75000);
    const cypher = mockRunCypher.mock.calls[0][0];
    expect(cypher).toContain('SET');
  });
});

// ============================================================
// AR Invoice Lifecycle
// ============================================================

describe('AR Invoice Lifecycle', () => {
  it('createARInvoice — creates invoice after credit check', async () => {
    // getCustomer call inside createARInvoice
    mockRunCypher.mockResolvedValueOnce([{ c: SAMPLE_CUSTOMER }]);
    // CREATE invoice
    mockRunCypher.mockResolvedValueOnce([]);

    const id = await createARInvoice({
      entityId: ENTITY_ID,
      customerId: CUSTOMER_ID,
      invoiceNumber: 'INV-001',
      invoiceDate: '2026-03-01',
      dueDate: '2026-03-31',
      amount: 10000,
      currency: 'CAD',
      description: 'Consulting services March',
      lineItems: [{ description: 'Consulting', amount: 10000, nodeRefId: 'node-1', nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE' }],
      periodId: PERIOD_ID,
    });
    expect(id).toBeDefined();
    expect(mockRunCypher).toHaveBeenCalledTimes(2);
  });

  it('createARInvoice — rejects when exceeds credit limit', async () => {
    mockRunCypher.mockResolvedValueOnce([{ c: { ...SAMPLE_CUSTOMER, total_outstanding: 45000 } }]);
    await expect(
      createARInvoice({
        entityId: ENTITY_ID,
        customerId: CUSTOMER_ID,
        invoiceNumber: 'INV-002',
        invoiceDate: '2026-03-01',
        dueDate: '2026-03-31',
        amount: 10000,
        currency: 'CAD',
        description: 'Over limit',
        lineItems: [{ description: 'Item', amount: 10000, nodeRefId: 'n1', nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE' }],
        periodId: PERIOD_ID,
      }),
    ).rejects.toThrow('credit limit');
  });

  it('postARInvoice — posts JE and updates status', async () => {
    // getARInvoice
    mockRunCypher.mockResolvedValueOnce([{ i: SAMPLE_INVOICE }]);
    // postJournalEntry
    mockPostJE.mockResolvedValueOnce('je-ar-001');
    // SET status to POSTED
    mockRunCypher.mockResolvedValueOnce([]);
    // Update customer outstanding
    mockRunCypher.mockResolvedValueOnce([]);

    const jeId = await postARInvoice(INVOICE_ID);
    expect(jeId).toBe('je-ar-001');
    expect(mockPostJE).toHaveBeenCalledTimes(1);

    const jeInput = mockPostJE.mock.calls[0][0] as any;
    expect(jeInput.entryType).toBe('OPERATIONAL');
    expect(jeInput.reference).toContain('AR-INV-');
    // Check double entry: 1 debit + N credit lines
    const debits = jeInput.lines.filter((l: any) => l.side === 'DEBIT');
    const credits = jeInput.lines.filter((l: any) => l.side === 'CREDIT');
    expect(debits).toHaveLength(1);
    expect(credits.length).toBeGreaterThanOrEqual(1);
    expect(debits[0].amount).toBe(10000);
  });

  it('postARInvoice — rejects non-DRAFT invoice', async () => {
    mockRunCypher.mockResolvedValueOnce([{ i: { ...SAMPLE_INVOICE, status: 'POSTED' } }]);
    await expect(postARInvoice(INVOICE_ID)).rejects.toThrow('must be DRAFT');
  });

  it('recordARPayment — full payment marks PAID', async () => {
    const postedInvoice = { ...SAMPLE_INVOICE, status: 'POSTED' };
    mockRunCypher.mockResolvedValueOnce([{ i: postedInvoice }]);
    mockPostJE.mockResolvedValueOnce('je-pay-001');
    mockRunCypher.mockResolvedValueOnce([]); // update invoice
    mockRunCypher.mockResolvedValueOnce([]); // update customer outstanding

    const result = await recordARPayment(INVOICE_ID, 10000, PERIOD_ID, '2026-03-15', 'CAD');
    expect(result.journalEntryId).toBe('je-pay-001');
    expect(result.newStatus).toBe('PAID');

    const jeInput = mockPostJE.mock.calls[0][0] as any;
    expect(jeInput.reference).toContain('AR-PAY-');
    expect(jeInput.lines).toHaveLength(2);
  });

  it('recordARPayment — partial payment marks PARTIALLY_PAID', async () => {
    const postedInvoice = { ...SAMPLE_INVOICE, status: 'POSTED' };
    mockRunCypher.mockResolvedValueOnce([{ i: postedInvoice }]);
    mockPostJE.mockResolvedValueOnce('je-pay-002');
    mockRunCypher.mockResolvedValueOnce([]);
    mockRunCypher.mockResolvedValueOnce([]);

    const result = await recordARPayment(INVOICE_ID, 3000, PERIOD_ID, '2026-03-15', 'CAD');
    expect(result.newStatus).toBe('PARTIALLY_PAID');
  });

  it('recordARPayment — rejects overpayment', async () => {
    const postedInvoice = { ...SAMPLE_INVOICE, status: 'POSTED' };
    mockRunCypher.mockResolvedValueOnce([{ i: postedInvoice }]);
    await expect(
      recordARPayment(INVOICE_ID, 20000, PERIOD_ID, '2026-03-15', 'CAD'),
    ).rejects.toThrow('exceeds remaining');
  });

  it('writeOffARInvoice — posts bad debt JE', async () => {
    const postedInvoice = { ...SAMPLE_INVOICE, status: 'POSTED' };
    mockRunCypher.mockResolvedValueOnce([{ i: postedInvoice }]);
    mockPostJE.mockResolvedValueOnce('je-wo-001');
    mockRunCypher.mockResolvedValueOnce([]); // update invoice
    mockRunCypher.mockResolvedValueOnce([]); // update customer outstanding

    const jeId = await writeOffARInvoice(INVOICE_ID, PERIOD_ID, 'CAD');
    expect(jeId).toBe('je-wo-001');

    const jeInput = mockPostJE.mock.calls[0][0] as any;
    expect(jeInput.entryType).toBe('ADJUSTMENT');
    expect(jeInput.reference).toContain('AR-WO-');
    // DR Bad Debt Expense, CR Accounts Receivable
    const debits = jeInput.lines.filter((l: any) => l.side === 'DEBIT');
    const credits = jeInput.lines.filter((l: any) => l.side === 'CREDIT');
    expect(debits[0].economicCategory).toBe('EXPENSE');
    expect(credits[0].economicCategory).toBe('ASSET');
  });

  it('writeOffARInvoice — rejects DRAFT invoice', async () => {
    mockRunCypher.mockResolvedValueOnce([{ i: SAMPLE_INVOICE }]); // status = DRAFT
    await expect(writeOffARInvoice(INVOICE_ID, PERIOD_ID, 'CAD')).rejects.toThrow('Cannot write off');
  });
});

// ============================================================
// Aging Report
// ============================================================

describe('AR Aging Report', () => {
  it('getARAgingReport — buckets invoices by age', async () => {
    mockRunCypher.mockResolvedValueOnce([
      { customer_id: CUSTOMER_ID, customer_name: 'Maple Corp', customer_code: 'C-001', due_date: '2026-04-01', amount_remaining: 5000 }, // future = current
      { customer_id: CUSTOMER_ID, customer_name: 'Maple Corp', customer_code: 'C-001', due_date: '2026-03-10', amount_remaining: 3000 }, // 16 days = days30
      { customer_id: CUSTOMER_ID, customer_name: 'Maple Corp', customer_code: 'C-001', due_date: '2026-01-01', amount_remaining: 2000 }, // 85 days = days90
    ]);

    const report = await getARAgingReport(ENTITY_ID, '2026-03-26');
    expect(report.entityId).toBe(ENTITY_ID);
    expect(report.customers).toHaveLength(1);
    expect(report.customers[0].aging.current).toBe(5000);
    expect(report.customers[0].aging.days30).toBe(3000);
    expect(report.customers[0].aging.days90).toBe(2000);
    expect(report.totals.total).toBe(10000);
  });

  it('getARAgingReport — handles multiple customers', async () => {
    mockRunCypher.mockResolvedValueOnce([
      { customer_id: 'c1', customer_name: 'Alpha', customer_code: 'A', due_date: '2026-04-01', amount_remaining: 1000 },
      { customer_id: 'c2', customer_name: 'Beta', customer_code: 'B', due_date: '2026-04-01', amount_remaining: 2000 },
    ]);

    const report = await getARAgingReport(ENTITY_ID, '2026-03-26');
    expect(report.customers).toHaveLength(2);
    expect(report.totals.current).toBe(3000);
  });
});

// ============================================================
// Collections
// ============================================================

describe('Collections List', () => {
  it('getCollectionsList — returns overdue invoices with days overdue', async () => {
    mockRunCypher.mockResolvedValueOnce([
      {
        id: INVOICE_ID,
        invoice_number: 'INV-001',
        customer_id: CUSTOMER_ID,
        customer_name: 'Maple Corp',
        due_date: '2026-03-10',
        amount_remaining: 5000,
      },
    ]);

    const list = await getCollectionsList(ENTITY_ID, '2026-03-26');
    expect(list).toHaveLength(1);
    expect(list[0].daysOverdue).toBe(16);
    expect(list[0].amountRemaining).toBe(5000);
    expect(list[0].invoiceNumber).toBe('INV-001');
  });

  it('getCollectionsList — empty when no overdue', async () => {
    mockRunCypher.mockResolvedValueOnce([]);
    const list = await getCollectionsList(ENTITY_ID, '2026-03-26');
    expect(list).toHaveLength(0);
  });
});
