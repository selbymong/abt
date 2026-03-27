/**
 * Accounts Receivable Subledger Service
 *
 * Implements AR subledger:
 * - Customer master: create, update, list customers
 * - Invoice generation: create, post AR invoices (posts JE)
 * - Aging report: current, 30, 60, 90, 120+ day buckets
 * - Collections: track overdue invoices, record payments
 * - Integration with ECL stages for impairment
 *
 * AR invoices post: DR Accounts Receivable (asset) / CR Revenue
 * Payments post: DR Cash / CR Accounts Receivable
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import { postJournalEntry } from './journal-posting-service.js';

// ============================================================
// Types
// ============================================================

export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type ARInvoiceStatus = 'DRAFT' | 'SENT' | 'POSTED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID' | 'WRITTEN_OFF';

export interface CreateCustomerInput {
  entityId: string;
  name: string;
  customerCode: string;
  currency: string;
  paymentTermsDays: number;
  creditLimit?: number;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  taxId?: string;
}

export interface Customer {
  id: string;
  entity_id: string;
  name: string;
  customer_code: string;
  currency: string;
  payment_terms_days: number;
  credit_limit: number;
  status: CustomerStatus;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  tax_id?: string;
  total_outstanding: number;
  created_at: string;
  updated_at: string;
}

export interface CreateARInvoiceInput {
  entityId: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  currency: string;
  description: string;
  lineItems: ARInvoiceLineItem[];
  periodId: string;
  fundId?: string;
}

export interface ARInvoiceLineItem {
  description: string;
  amount: number;
  nodeRefId: string;
  nodeRefType: string;
  economicCategory: string;
}

export interface ARInvoice {
  id: string;
  entity_id: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  amount_received: number;
  amount_remaining: number;
  currency: string;
  description: string;
  status: ARInvoiceStatus;
  line_items: string;
  period_id: string;
  journal_entry_id?: string;
  fund_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ARAgingBucket {
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days120plus: number;
  total: number;
}

export interface CustomerAging {
  customerId: string;
  customerName: string;
  customerCode: string;
  aging: ARAgingBucket;
}

// ============================================================
// Customer CRUD
// ============================================================

export async function createCustomer(input: CreateCustomerInput): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (c:Customer {
      id: $id, entity_id: $entityId, name: $name,
      customer_code: $customerCode, currency: $currency,
      payment_terms_days: $paymentTermsDays,
      credit_limit: $creditLimit,
      status: 'ACTIVE',
      contact_email: $contactEmail, contact_phone: $contactPhone,
      address: $address, tax_id: $taxId,
      total_outstanding: 0,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      name: input.name,
      customerCode: input.customerCode,
      currency: input.currency,
      paymentTermsDays: input.paymentTermsDays,
      creditLimit: input.creditLimit ?? 0,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      address: input.address ?? null,
      taxId: input.taxId ?? null,
    },
  );
  return id;
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const results = await runCypher<{ c: Customer }>(
    `MATCH (c:Customer {id: $id}) RETURN properties(c) AS c`,
    { id },
  );
  return results[0]?.c ?? null;
}

export async function listCustomers(entityId: string, status?: CustomerStatus): Promise<Customer[]> {
  const statusFilter = status ? ' AND c.status = $status' : '';
  const results = await runCypher<{ c: Customer }>(
    `MATCH (c:Customer {entity_id: $entityId})
     WHERE true ${statusFilter}
     RETURN properties(c) AS c ORDER BY c.name`,
    { entityId, status: status ?? null },
  );
  return results.map((r) => r.c);
}

export async function updateCustomer(
  id: string,
  updates: Partial<Pick<Customer, 'name' | 'payment_terms_days' | 'credit_limit' | 'status' | 'contact_email' | 'contact_phone' | 'address'>>,
): Promise<Customer> {
  const setClauses: string[] = [];
  const params: Record<string, unknown> = { id };

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      setClauses.push(`c.${key} = $${key}`);
      params[key] = value;
    }
  }

  if (setClauses.length === 0) {
    const c = await getCustomer(id);
    if (!c) throw new Error(`Customer ${id} not found`);
    return c;
  }

  setClauses.push('c.updated_at = datetime()');

  const results = await runCypher<{ c: Customer }>(
    `MATCH (c:Customer {id: $id})
     SET ${setClauses.join(', ')}
     RETURN properties(c) AS c`,
    params,
  );

  if (results.length === 0) throw new Error(`Customer ${id} not found`);
  return results[0].c;
}

// ============================================================
// AR Invoice Management
// ============================================================

export async function createARInvoice(input: CreateARInvoiceInput): Promise<string> {
  const id = uuid();

  const customer = await getCustomer(input.customerId);
  if (!customer) throw new Error(`Customer ${input.customerId} not found`);

  // Check credit limit
  const currentOutstanding = Number(customer.total_outstanding);
  const creditLimit = Number(customer.credit_limit);
  if (creditLimit > 0 && currentOutstanding + input.amount > creditLimit) {
    throw new Error(`Invoice would exceed credit limit (${creditLimit}). Outstanding: ${currentOutstanding}, Invoice: ${input.amount}`);
  }

  await runCypher(
    `CREATE (i:ARInvoice {
      id: $id, entity_id: $entityId, customer_id: $customerId,
      invoice_number: $invoiceNumber, invoice_date: $invoiceDate,
      due_date: $dueDate, amount: $amount, amount_received: 0,
      amount_remaining: $amount, currency: $currency,
      description: $description, status: 'DRAFT',
      line_items: $lineItems, period_id: $periodId,
      fund_id: $fundId,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      customerId: input.customerId,
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

export async function getARInvoice(id: string): Promise<ARInvoice | null> {
  const results = await runCypher<{ i: ARInvoice }>(
    `MATCH (i:ARInvoice {id: $id}) RETURN properties(i) AS i`,
    { id },
  );
  return results[0]?.i ?? null;
}

export async function listARInvoices(
  entityId: string,
  customerId?: string,
  status?: ARInvoiceStatus,
): Promise<ARInvoice[]> {
  let whereClause = 'i.entity_id = $entityId';
  const params: Record<string, unknown> = { entityId };

  if (customerId) {
    whereClause += ' AND i.customer_id = $customerId';
    params.customerId = customerId;
  }
  if (status) {
    whereClause += ' AND i.status = $status';
    params.status = status;
  }

  const results = await runCypher<{ i: ARInvoice }>(
    `MATCH (i:ARInvoice) WHERE ${whereClause}
     RETURN properties(i) AS i ORDER BY i.due_date`,
    params,
  );
  return results.map((r) => r.i);
}

/**
 * Post an AR invoice to the GL.
 * JE: DR Accounts Receivable (asset) / CR Revenue lines.
 */
export async function postARInvoice(invoiceId: string): Promise<string> {
  const invoice = await getARInvoice(invoiceId);
  if (!invoice) throw new Error(`AR Invoice ${invoiceId} not found`);
  if (invoice.status !== 'DRAFT') {
    throw new Error(`AR Invoice ${invoiceId} is ${invoice.status}, must be DRAFT to post`);
  }

  const lineItems: ARInvoiceLineItem[] = typeof invoice.line_items === 'string'
    ? JSON.parse(invoice.line_items)
    : invoice.line_items as unknown as ARInvoiceLineItem[];

  // DR Accounts Receivable (asset)
  const debitLine = {
    side: 'DEBIT' as const,
    amount: invoice.amount,
    nodeRefId: invoiceId,
    nodeRefType: 'ACTIVITY' as any,
    economicCategory: 'ASSET' as const,
    fundId: invoice.fund_id ?? undefined,
  };

  // CR Revenue lines
  const creditLines = lineItems.map((item) => ({
    side: 'CREDIT' as const,
    amount: item.amount,
    nodeRefId: item.nodeRefId,
    nodeRefType: item.nodeRefType as any,
    economicCategory: item.economicCategory as any,
    fundId: invoice.fund_id ?? undefined,
  }));

  const jeId = await postJournalEntry({
    entityId: invoice.entity_id,
    periodId: invoice.period_id,
    entryType: 'OPERATIONAL',
    reference: `AR-INV-${invoice.invoice_number}`,
    narrative: `AR invoice ${invoice.invoice_number} — ${invoice.description}`,
    currency: invoice.currency,
    validDate: invoice.invoice_date,
    sourceSystem: 'ar-subledger',
    lines: [debitLine, ...creditLines],
  });

  await runCypher(
    `MATCH (i:ARInvoice {id: $id})
     SET i.status = 'POSTED', i.journal_entry_id = $jeId, i.updated_at = datetime()`,
    { id: invoiceId, jeId },
  );

  // Update customer outstanding
  await runCypher(
    `MATCH (c:Customer {id: $customerId})
     SET c.total_outstanding = c.total_outstanding + $amount, c.updated_at = datetime()`,
    { customerId: invoice.customer_id, amount: invoice.amount },
  );

  return jeId;
}

/**
 * Record a payment against an AR invoice.
 * JE: DR Cash (asset) / CR Accounts Receivable (asset reduction).
 */
export async function recordARPayment(
  invoiceId: string,
  paymentAmount: number,
  periodId: string,
  paymentDate: string,
  currency: string,
): Promise<{ journalEntryId: string; newStatus: ARInvoiceStatus }> {
  const invoice = await getARInvoice(invoiceId);
  if (!invoice) throw new Error(`AR Invoice ${invoiceId} not found`);
  if (invoice.status !== 'POSTED' && invoice.status !== 'PARTIALLY_PAID') {
    throw new Error(`AR Invoice ${invoiceId} is ${invoice.status}, must be POSTED or PARTIALLY_PAID`);
  }

  const remaining = Number(invoice.amount_remaining);
  if (paymentAmount > remaining + 0.01) {
    throw new Error(`Payment ${paymentAmount} exceeds remaining ${remaining}`);
  }

  const jeId = await postJournalEntry({
    entityId: invoice.entity_id,
    periodId,
    entryType: 'OPERATIONAL',
    reference: `AR-PAY-${invoice.invoice_number}`,
    narrative: `Payment received for ${invoice.invoice_number}`,
    currency,
    validDate: paymentDate,
    sourceSystem: 'ar-subledger',
    lines: [
      {
        side: 'DEBIT',
        amount: paymentAmount,
        nodeRefId: invoice.entity_id,
        nodeRefType: 'ACTIVITY' as any,
        economicCategory: 'ASSET',
      },
      {
        side: 'CREDIT',
        amount: paymentAmount,
        nodeRefId: invoiceId,
        nodeRefType: 'ACTIVITY' as any,
        economicCategory: 'ASSET',
      },
    ],
  });

  const newReceived = Number(invoice.amount_received) + paymentAmount;
  const newRemaining = Math.max(0, remaining - paymentAmount);
  const newStatus: ARInvoiceStatus = newRemaining <= 0.01 ? 'PAID' : 'PARTIALLY_PAID';

  await runCypher(
    `MATCH (i:ARInvoice {id: $id})
     SET i.amount_received = $received, i.amount_remaining = $remaining,
         i.status = $status, i.updated_at = datetime()`,
    { id: invoiceId, received: Math.round(newReceived * 100) / 100, remaining: Math.round(newRemaining * 100) / 100, status: newStatus },
  );

  await runCypher(
    `MATCH (c:Customer {id: $customerId})
     SET c.total_outstanding = c.total_outstanding - $amount, c.updated_at = datetime()`,
    { customerId: invoice.customer_id, amount: paymentAmount },
  );

  return { journalEntryId: jeId, newStatus };
}

/**
 * Write off an AR invoice (bad debt).
 * JE: DR Bad Debt Expense / CR Accounts Receivable.
 */
export async function writeOffARInvoice(
  invoiceId: string,
  periodId: string,
  currency: string,
): Promise<string> {
  const invoice = await getARInvoice(invoiceId);
  if (!invoice) throw new Error(`AR Invoice ${invoiceId} not found`);
  if (invoice.status !== 'POSTED' && invoice.status !== 'PARTIALLY_PAID') {
    throw new Error(`Cannot write off invoice in ${invoice.status} status`);
  }

  const writeOffAmount = Number(invoice.amount_remaining);

  const jeId = await postJournalEntry({
    entityId: invoice.entity_id,
    periodId,
    entryType: 'ADJUSTMENT',
    reference: `AR-WO-${invoice.invoice_number}`,
    narrative: `Bad debt write-off for ${invoice.invoice_number}`,
    currency,
    validDate: new Date().toISOString().slice(0, 10),
    sourceSystem: 'ar-subledger',
    lines: [
      {
        side: 'DEBIT',
        amount: writeOffAmount,
        nodeRefId: invoiceId,
        nodeRefType: 'ACTIVITY' as any,
        economicCategory: 'EXPENSE',
      },
      {
        side: 'CREDIT',
        amount: writeOffAmount,
        nodeRefId: invoiceId,
        nodeRefType: 'ACTIVITY' as any,
        economicCategory: 'ASSET',
      },
    ],
  });

  await runCypher(
    `MATCH (i:ARInvoice {id: $id})
     SET i.status = 'WRITTEN_OFF', i.amount_remaining = 0, i.updated_at = datetime()`,
    { id: invoiceId },
  );

  await runCypher(
    `MATCH (c:Customer {id: $customerId})
     SET c.total_outstanding = c.total_outstanding - $amount, c.updated_at = datetime()`,
    { customerId: invoice.customer_id, amount: writeOffAmount },
  );

  return jeId;
}

// ============================================================
// Aging Report
// ============================================================

export async function getARAgingReport(
  entityId: string,
  asOfDate: string,
): Promise<{
  entityId: string;
  asOfDate: string;
  customers: CustomerAging[];
  totals: ARAgingBucket;
}> {
  const invoices = await runCypher<{
    customer_id: string;
    customer_name: string;
    customer_code: string;
    due_date: string;
    amount_remaining: number;
  }>(
    `MATCH (i:ARInvoice {entity_id: $entityId})
     WHERE i.status IN ['POSTED', 'PARTIALLY_PAID']
       AND i.amount_remaining > 0
     MATCH (c:Customer {id: i.customer_id})
     RETURN i.customer_id AS customer_id, c.name AS customer_name,
            c.customer_code AS customer_code,
            i.due_date AS due_date, i.amount_remaining AS amount_remaining`,
    { entityId },
  );

  const asOf = new Date(asOfDate);
  const customerMap = new Map<string, CustomerAging>();

  for (const inv of invoices) {
    if (!customerMap.has(inv.customer_id)) {
      customerMap.set(inv.customer_id, {
        customerId: inv.customer_id,
        customerName: inv.customer_name,
        customerCode: inv.customer_code,
        aging: { current: 0, days30: 0, days60: 0, days90: 0, days120plus: 0, total: 0 },
      });
    }

    const ca = customerMap.get(inv.customer_id)!;
    const dueDate = new Date(inv.due_date);
    const daysOverdue = Math.floor((asOf.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const amount = Number(inv.amount_remaining);

    if (daysOverdue <= 0) ca.aging.current += amount;
    else if (daysOverdue <= 30) ca.aging.days30 += amount;
    else if (daysOverdue <= 60) ca.aging.days60 += amount;
    else if (daysOverdue <= 90) ca.aging.days90 += amount;
    else ca.aging.days120plus += amount;

    ca.aging.total += amount;
  }

  const customers = Array.from(customerMap.values());
  const totals: ARAgingBucket = { current: 0, days30: 0, days60: 0, days90: 0, days120plus: 0, total: 0 };
  for (const c of customers) {
    totals.current += c.aging.current;
    totals.days30 += c.aging.days30;
    totals.days60 += c.aging.days60;
    totals.days90 += c.aging.days90;
    totals.days120plus += c.aging.days120plus;
    totals.total += c.aging.total;
  }

  return { entityId, asOfDate, customers, totals };
}

// ============================================================
// Collections
// ============================================================

export async function getCollectionsList(
  entityId: string,
  asOfDate: string,
): Promise<Array<{
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  dueDate: string;
  daysOverdue: number;
  amountRemaining: number;
}>> {
  const invoices = await runCypher<{
    id: string;
    invoice_number: string;
    customer_id: string;
    customer_name: string;
    due_date: string;
    amount_remaining: number;
  }>(
    `MATCH (i:ARInvoice {entity_id: $entityId})
     WHERE i.status IN ['POSTED', 'PARTIALLY_PAID']
       AND i.amount_remaining > 0
       AND i.due_date < $asOfDate
     MATCH (c:Customer {id: i.customer_id})
     RETURN i.id AS id, i.invoice_number AS invoice_number,
            i.customer_id AS customer_id, c.name AS customer_name,
            i.due_date AS due_date, i.amount_remaining AS amount_remaining
     ORDER BY i.due_date`,
    { entityId, asOfDate },
  );

  const asOf = new Date(asOfDate);
  return invoices.map((inv) => ({
    invoiceId: inv.id,
    invoiceNumber: inv.invoice_number,
    customerId: inv.customer_id,
    customerName: inv.customer_name,
    dueDate: inv.due_date,
    daysOverdue: Math.floor((asOf.getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24)),
    amountRemaining: Number(inv.amount_remaining),
  }));
}
