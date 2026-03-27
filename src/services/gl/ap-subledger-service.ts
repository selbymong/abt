/**
 * Accounts Payable Subledger Service
 *
 * Implements AP subledger:
 * - Vendor master: create, update, list vendors
 * - Invoice management: create, approve, post invoices (posts JE)
 * - Aging report: current, 30, 60, 90, 120+ day buckets
 * - Payment runs: batch pay approved invoices, post payment JEs
 * - Dunning: track overdue invoices by vendor
 *
 * All invoices post journal entries to the GL via postJournalEntry.
 * Invoice → LedgerLine linkage via node_ref_id = invoice ID.
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import { postJournalEntry } from './journal-posting-service.js';

// ============================================================
// Types
// ============================================================

export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type InvoiceStatus = 'DRAFT' | 'APPROVED' | 'POSTED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID';
export type PaymentRunStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface CreateVendorInput {
  entityId: string;
  name: string;
  vendorCode: string;
  currency: string;
  paymentTermsDays: number;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  taxId?: string;
  bankAccount?: string;
  bankRouting?: string;
}

export interface Vendor {
  id: string;
  entity_id: string;
  name: string;
  vendor_code: string;
  currency: string;
  payment_terms_days: number;
  status: VendorStatus;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  tax_id?: string;
  bank_account?: string;
  bank_routing?: string;
  total_outstanding: number;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceInput {
  entityId: string;
  vendorId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  currency: string;
  description: string;
  lineItems: InvoiceLineItem[];
  periodId: string;
  fundId?: string;
}

export interface InvoiceLineItem {
  description: string;
  amount: number;
  nodeRefId: string;
  nodeRefType: string;
  economicCategory: string;
}

export interface APInvoice {
  id: string;
  entity_id: string;
  vendor_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  description: string;
  status: InvoiceStatus;
  line_items: string;
  period_id: string;
  journal_entry_id?: string;
  payment_journal_entry_id?: string;
  fund_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AgingBucket {
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days120plus: number;
  total: number;
}

export interface VendorAging {
  vendorId: string;
  vendorName: string;
  vendorCode: string;
  aging: AgingBucket;
}

export interface PaymentRunResult {
  paymentRunId: string;
  invoicesPaid: number;
  totalAmount: number;
  journalEntryIds: string[];
}

// ============================================================
// Vendor CRUD
// ============================================================

export async function createVendor(input: CreateVendorInput): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (v:Vendor {
      id: $id, entity_id: $entityId, name: $name,
      vendor_code: $vendorCode, currency: $currency,
      payment_terms_days: $paymentTermsDays,
      status: 'ACTIVE',
      contact_email: $contactEmail, contact_phone: $contactPhone,
      address: $address, tax_id: $taxId,
      bank_account: $bankAccount, bank_routing: $bankRouting,
      total_outstanding: 0,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      name: input.name,
      vendorCode: input.vendorCode,
      currency: input.currency,
      paymentTermsDays: input.paymentTermsDays,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      address: input.address ?? null,
      taxId: input.taxId ?? null,
      bankAccount: input.bankAccount ?? null,
      bankRouting: input.bankRouting ?? null,
    },
  );
  return id;
}

export async function getVendor(id: string): Promise<Vendor | null> {
  const results = await runCypher<{ v: Vendor }>(
    `MATCH (v:Vendor {id: $id}) RETURN properties(v) AS v`,
    { id },
  );
  return results[0]?.v ?? null;
}

export async function listVendors(entityId: string, status?: VendorStatus): Promise<Vendor[]> {
  const statusFilter = status ? ' AND v.status = $status' : '';
  const results = await runCypher<{ v: Vendor }>(
    `MATCH (v:Vendor {entity_id: $entityId})
     WHERE true ${statusFilter}
     RETURN properties(v) AS v ORDER BY v.name`,
    { entityId, status: status ?? null },
  );
  return results.map((r) => r.v);
}

export async function updateVendor(
  id: string,
  updates: Partial<Pick<Vendor, 'name' | 'payment_terms_days' | 'status' | 'contact_email' | 'contact_phone' | 'address' | 'tax_id' | 'bank_account' | 'bank_routing'>>,
): Promise<Vendor> {
  const setClauses: string[] = [];
  const params: Record<string, unknown> = { id };

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      setClauses.push(`v.${key} = $${key}`);
      params[key] = value;
    }
  }

  if (setClauses.length === 0) {
    const v = await getVendor(id);
    if (!v) throw new Error(`Vendor ${id} not found`);
    return v;
  }

  setClauses.push('v.updated_at = datetime()');

  const results = await runCypher<{ v: Vendor }>(
    `MATCH (v:Vendor {id: $id})
     SET ${setClauses.join(', ')}
     RETURN properties(v) AS v`,
    params,
  );

  if (results.length === 0) throw new Error(`Vendor ${id} not found`);
  return results[0].v;
}

// ============================================================
// Invoice Management
// ============================================================

export async function createInvoice(input: CreateInvoiceInput): Promise<string> {
  const id = uuid();

  // Verify vendor exists
  const vendor = await getVendor(input.vendorId);
  if (!vendor) throw new Error(`Vendor ${input.vendorId} not found`);

  await runCypher(
    `CREATE (i:APInvoice {
      id: $id, entity_id: $entityId, vendor_id: $vendorId,
      invoice_number: $invoiceNumber, invoice_date: $invoiceDate,
      due_date: $dueDate, amount: $amount, amount_paid: 0,
      amount_remaining: $amount, currency: $currency,
      description: $description, status: 'DRAFT',
      line_items: $lineItems, period_id: $periodId,
      fund_id: $fundId,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      vendorId: input.vendorId,
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      lineItems: JSON.stringify(input.lineItems),
      periodId: input.periodId,
      fundId: input.fundId ?? null,
    },
  );

  return id;
}

export async function getInvoice(id: string): Promise<APInvoice | null> {
  const results = await runCypher<{ i: APInvoice }>(
    `MATCH (i:APInvoice {id: $id}) RETURN properties(i) AS i`,
    { id },
  );
  return results[0]?.i ?? null;
}

export async function listInvoices(
  entityId: string,
  vendorId?: string,
  status?: InvoiceStatus,
): Promise<APInvoice[]> {
  let whereClause = 'i.entity_id = $entityId';
  const params: Record<string, unknown> = { entityId };

  if (vendorId) {
    whereClause += ' AND i.vendor_id = $vendorId';
    params.vendorId = vendorId;
  }
  if (status) {
    whereClause += ' AND i.status = $status';
    params.status = status;
  }

  const results = await runCypher<{ i: APInvoice }>(
    `MATCH (i:APInvoice) WHERE ${whereClause}
     RETURN properties(i) AS i ORDER BY i.due_date`,
    params,
  );
  return results.map((r) => r.i);
}

/**
 * Approve an invoice (DRAFT → APPROVED).
 */
export async function approveInvoice(invoiceId: string): Promise<void> {
  const invoice = await getInvoice(invoiceId);
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
  if (invoice.status !== 'DRAFT') {
    throw new Error(`Invoice ${invoiceId} is ${invoice.status}, expected DRAFT`);
  }

  await runCypher(
    `MATCH (i:APInvoice {id: $id})
     SET i.status = 'APPROVED', i.updated_at = datetime()`,
    { id: invoiceId },
  );
}

/**
 * Post an approved invoice to the GL.
 * Creates JE: DR Expense accounts (per line items) / CR Accounts Payable (liability).
 */
export async function postInvoice(
  invoiceId: string,
): Promise<string> {
  const invoice = await getInvoice(invoiceId);
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
  if (invoice.status !== 'APPROVED') {
    throw new Error(`Invoice ${invoiceId} is ${invoice.status}, must be APPROVED to post`);
  }

  const lineItems: InvoiceLineItem[] = typeof invoice.line_items === 'string'
    ? JSON.parse(invoice.line_items)
    : invoice.line_items as unknown as InvoiceLineItem[];

  // Build debit lines from invoice line items
  const debitLines = lineItems.map((item) => ({
    side: 'DEBIT' as const,
    amount: item.amount,
    nodeRefId: item.nodeRefId,
    nodeRefType: item.nodeRefType as any,
    economicCategory: item.economicCategory as any,
    fundId: invoice.fund_id ?? undefined,
  }));

  // Credit line: Accounts Payable (LIABILITY)
  const creditLine = {
    side: 'CREDIT' as const,
    amount: invoice.amount,
    nodeRefId: invoiceId,
    nodeRefType: 'ACTIVITY' as any,
    economicCategory: 'LIABILITY' as const,
    fundId: invoice.fund_id ?? undefined,
  };

  const jeId = await postJournalEntry({
    entityId: invoice.entity_id,
    periodId: invoice.period_id,
    entryType: 'OPERATIONAL',
    reference: `AP-INV-${invoice.invoice_number}`,
    narrative: `AP invoice ${invoice.invoice_number} — ${invoice.description}`,
    currency: invoice.currency,
    validDate: invoice.invoice_date,
    sourceSystem: 'ap-subledger',
    lines: [...debitLines, creditLine],
  });

  // Update invoice status and link to JE
  await runCypher(
    `MATCH (i:APInvoice {id: $id})
     SET i.status = 'POSTED', i.journal_entry_id = $jeId, i.updated_at = datetime()`,
    { id: invoiceId, jeId },
  );

  // Update vendor outstanding
  await runCypher(
    `MATCH (v:Vendor {id: $vendorId})
     SET v.total_outstanding = v.total_outstanding + $amount, v.updated_at = datetime()`,
    { vendorId: invoice.vendor_id, amount: invoice.amount },
  );

  return jeId;
}

/**
 * Void an invoice (DRAFT or APPROVED → VOID).
 */
export async function voidInvoice(invoiceId: string): Promise<void> {
  const invoice = await getInvoice(invoiceId);
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
  if (invoice.status !== 'DRAFT' && invoice.status !== 'APPROVED') {
    throw new Error(`Cannot void invoice in ${invoice.status} status`);
  }

  await runCypher(
    `MATCH (i:APInvoice {id: $id})
     SET i.status = 'VOID', i.updated_at = datetime()`,
    { id: invoiceId },
  );
}

// ============================================================
// Aging Report
// ============================================================

/**
 * Generate AP aging report for an entity, grouped by vendor.
 */
export async function getAgingReport(
  entityId: string,
  asOfDate: string,
): Promise<{
  entityId: string;
  asOfDate: string;
  vendors: VendorAging[];
  totals: AgingBucket;
}> {
  // Get all posted/partially-paid invoices with outstanding balance
  const invoices = await runCypher<{
    vendor_id: string;
    vendor_name: string;
    vendor_code: string;
    due_date: string;
    amount_remaining: number;
  }>(
    `MATCH (i:APInvoice {entity_id: $entityId})
     WHERE i.status IN ['POSTED', 'PARTIALLY_PAID']
       AND i.amount_remaining > 0
     MATCH (v:Vendor {id: i.vendor_id})
     RETURN i.vendor_id AS vendor_id, v.name AS vendor_name, v.vendor_code AS vendor_code,
            i.due_date AS due_date, i.amount_remaining AS amount_remaining`,
    { entityId },
  );

  const asOf = new Date(asOfDate);
  const vendorMap = new Map<string, VendorAging>();

  for (const inv of invoices) {
    if (!vendorMap.has(inv.vendor_id)) {
      vendorMap.set(inv.vendor_id, {
        vendorId: inv.vendor_id,
        vendorName: inv.vendor_name,
        vendorCode: inv.vendor_code,
        aging: { current: 0, days30: 0, days60: 0, days90: 0, days120plus: 0, total: 0 },
      });
    }

    const va = vendorMap.get(inv.vendor_id)!;
    const dueDate = new Date(inv.due_date);
    const daysOverdue = Math.floor((asOf.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const amount = Number(inv.amount_remaining);

    if (daysOverdue <= 0) va.aging.current += amount;
    else if (daysOverdue <= 30) va.aging.days30 += amount;
    else if (daysOverdue <= 60) va.aging.days60 += amount;
    else if (daysOverdue <= 90) va.aging.days90 += amount;
    else va.aging.days120plus += amount;

    va.aging.total += amount;
  }

  const vendors = Array.from(vendorMap.values());
  const totals: AgingBucket = { current: 0, days30: 0, days60: 0, days90: 0, days120plus: 0, total: 0 };
  for (const v of vendors) {
    totals.current += v.aging.current;
    totals.days30 += v.aging.days30;
    totals.days60 += v.aging.days60;
    totals.days90 += v.aging.days90;
    totals.days120plus += v.aging.days120plus;
    totals.total += v.aging.total;
  }

  return { entityId, asOfDate, vendors, totals };
}

// ============================================================
// Payment Runs
// ============================================================

/**
 * Execute a payment run: pay all posted invoices up to a given date.
 * Posts payment JEs: DR Accounts Payable / CR Cash.
 */
export async function executePaymentRun(
  entityId: string,
  periodId: string,
  paymentDate: string,
  currency: string,
  maxDueDate?: string,
  vendorId?: string,
): Promise<PaymentRunResult> {
  const paymentRunId = uuid();

  // Find payable invoices
  let whereClause = `i.entity_id = $entityId AND i.status IN ['POSTED', 'PARTIALLY_PAID'] AND i.amount_remaining > 0`;
  const params: Record<string, unknown> = { entityId };

  if (maxDueDate) {
    whereClause += ` AND i.due_date <= $maxDueDate`;
    params.maxDueDate = maxDueDate;
  }
  if (vendorId) {
    whereClause += ` AND i.vendor_id = $vendorId`;
    params.vendorId = vendorId;
  }

  const invoices = await runCypher<APInvoice & { vendor_name: string }>(
    `MATCH (i:APInvoice) WHERE ${whereClause}
     MATCH (v:Vendor {id: i.vendor_id})
     RETURN properties(i) AS i, v.name AS vendor_name
     ORDER BY i.due_date`,
    params,
  );

  // Flatten: the query returns { i: {...}, vendor_name: ... }
  // Actually runCypher returns the row object directly
  const journalEntryIds: string[] = [];
  let totalAmount = 0;
  let invoicesPaid = 0;

  for (const row of invoices) {
    const inv = (row as any).i ?? row;
    const payAmount = Number(inv.amount_remaining);
    if (payAmount <= 0.001) continue;

    // Post payment JE: DR Liability (AP) / CR Asset (Cash)
    const jeId = await postJournalEntry({
      entityId,
      periodId,
      entryType: 'OPERATIONAL',
      reference: `AP-PAY-${inv.invoice_number ?? inv.id}`,
      narrative: `Payment for invoice ${inv.invoice_number ?? inv.id}`,
      currency,
      validDate: paymentDate,
      sourceSystem: 'ap-subledger',
      lines: [
        {
          side: 'DEBIT',
          amount: payAmount,
          nodeRefId: inv.id,
          nodeRefType: 'ACTIVITY' as any,
          economicCategory: 'LIABILITY',
        },
        {
          side: 'CREDIT',
          amount: payAmount,
          nodeRefId: entityId,
          nodeRefType: 'ACTIVITY' as any,
          economicCategory: 'ASSET',
        },
      ],
    });

    journalEntryIds.push(jeId);

    // Update invoice
    await runCypher(
      `MATCH (i:APInvoice {id: $id})
       SET i.amount_paid = i.amount_paid + $payAmount,
           i.amount_remaining = 0,
           i.status = 'PAID',
           i.payment_journal_entry_id = $jeId,
           i.updated_at = datetime()`,
      { id: inv.id, payAmount, jeId },
    );

    // Update vendor outstanding
    await runCypher(
      `MATCH (v:Vendor {id: $vendorId})
       SET v.total_outstanding = v.total_outstanding - $payAmount, v.updated_at = datetime()`,
      { vendorId: inv.vendor_id, payAmount },
    );

    totalAmount += payAmount;
    invoicesPaid++;
  }

  // Record payment run in PG
  await query(
    `INSERT INTO ap_payment_runs (id, entity_id, period_id, payment_date, invoices_paid,
       total_amount, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'COMPLETED', NOW())`,
    [paymentRunId, entityId, periodId, paymentDate, invoicesPaid, totalAmount],
  );

  return { paymentRunId, invoicesPaid, totalAmount, journalEntryIds };
}

/**
 * Get payment run history for an entity.
 */
export async function listPaymentRuns(entityId: string): Promise<Array<{
  id: string;
  entity_id: string;
  period_id: string;
  payment_date: string;
  invoices_paid: number;
  total_amount: number;
  status: PaymentRunStatus;
  created_at: string;
}>> {
  const result = await query(
    `SELECT id, entity_id, period_id, payment_date, invoices_paid, total_amount, status, created_at
     FROM ap_payment_runs WHERE entity_id = $1::uuid ORDER BY created_at DESC`,
    [entityId],
  );
  return result.rows as any;
}

// ============================================================
// Dunning
// ============================================================

/**
 * Get overdue invoices (dunning list) for an entity.
 */
export async function getDunningList(
  entityId: string,
  asOfDate: string,
): Promise<Array<{
  invoiceId: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  dueDate: string;
  daysOverdue: number;
  amountRemaining: number;
}>> {
  const invoices = await runCypher<{
    id: string;
    invoice_number: string;
    vendor_id: string;
    vendor_name: string;
    due_date: string;
    amount_remaining: number;
  }>(
    `MATCH (i:APInvoice {entity_id: $entityId})
     WHERE i.status IN ['POSTED', 'PARTIALLY_PAID']
       AND i.amount_remaining > 0
       AND i.due_date < $asOfDate
     MATCH (v:Vendor {id: i.vendor_id})
     RETURN i.id AS id, i.invoice_number AS invoice_number,
            i.vendor_id AS vendor_id, v.name AS vendor_name,
            i.due_date AS due_date, i.amount_remaining AS amount_remaining
     ORDER BY i.due_date`,
    { entityId, asOfDate },
  );

  const asOf = new Date(asOfDate);
  return invoices.map((inv) => ({
    invoiceId: inv.id,
    invoiceNumber: inv.invoice_number,
    vendorId: inv.vendor_id,
    vendorName: inv.vendor_name,
    dueDate: inv.due_date,
    daysOverdue: Math.floor((asOf.getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24)),
    amountRemaining: Number(inv.amount_remaining),
  }));
}
