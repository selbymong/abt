/**
 * Float Inbound Sync Service
 *
 * Pulls data from Float Financial → EBG:
 * - Card transactions → AP invoices + journal entries
 * - Bills → AP invoices + journal entries
 * - Reimbursements → direct journal entries
 *
 * Idempotent: checks float_id_mapping before processing each item.
 * Marks items as EXPORTED in Float after successful import.
 */
import { v4 as uuid } from 'uuid';
import {
  createFloatClient, floatGetAllPages, floatPatch, floatPost,
  type FloatClientConfig, type FloatTransaction, type FloatBill, type FloatReimbursement,
} from './float-api-client.js';
import {
  getEbgIdForFloat, setFloatMapping, resolveGlCodeToActivity,
  getSyncState, updateSyncState, recordSyncRun,
} from './float-mapping-service.js';
import {
  createInvoice, approveInvoice, postInvoice, createVendor,
  type CreateInvoiceInput, type CreateVendorInput,
} from '../gl/ap-subledger-service.js';
import { postJournalEntry } from '../gl/journal-posting-service.js';
import { resolveConfig } from '../config/configuration-service.js';
import { emit } from '../../lib/kafka.js';
import { logger } from '../../lib/logger.js';

// ── Types ────────────────────────────────────────────────────

export interface FloatSyncResult {
  syncRunId: string;
  entityId: string;
  syncType: string;
  itemsFetched: number;
  itemsImported: number;
  itemsSkipped: number;
  itemsFailed: number;
  journalEntriesCreated: string[];
  errors: Array<{ floatId: string; error: string }>;
  durationMs: number;
}

// ── Helpers ──────────────────────────────────────────────────

async function getConfigString(key: string, entityId: string): Promise<string | null> {
  const cfg = await resolveConfig(key, { entityId });
  return cfg?.value_string ?? null;
}

async function getConfigBoolean(key: string, entityId: string, defaultVal = false): Promise<boolean> {
  const cfg = await resolveConfig(key, { entityId });
  return cfg?.value_boolean ?? defaultVal;
}

async function resolveActivityForGlCode(
  entityId: string,
  floatGlCodeId: string | undefined,
): Promise<string | null> {
  if (!floatGlCodeId) return null;
  return resolveGlCodeToActivity(entityId, floatGlCodeId);
}

async function resolveOrCreateVendor(
  config: FloatClientConfig,
  entityId: string,
  floatVendorId: string | undefined,
  merchantName: string,
): Promise<string | null> {
  if (!floatVendorId) return null;

  // Check existing mapping
  const ebgVendorId = await getEbgIdForFloat(entityId, 'VENDOR', floatVendorId);
  if (ebgVendorId) return ebgVendorId;

  // Auto-create if configured
  const autoCreate = await getConfigBoolean('float.auto_create_vendors', entityId);
  if (!autoCreate) return null;

  const vendorInput: CreateVendorInput = {
    entityId,
    name: merchantName || `Float Vendor ${floatVendorId.slice(0, 8)}`,
    vendorCode: `FLOAT-${floatVendorId.slice(0, 8).toUpperCase()}`,
    currency: 'CAD',
    paymentTermsDays: 0,
  };

  const newVendorId = await createVendor(vendorInput);
  await setFloatMapping(entityId, 'VENDOR', floatVendorId, newVendorId, 'Vendor');
  logger.info({ entityId, floatVendorId, newVendorId }, 'Auto-created vendor from Float');
  return newVendorId;
}

// ── Sync Transactions ────────────────────────────────────────

export async function syncFloatTransactions(
  entityId: string,
  periodId: string,
  options?: { fromDate?: string; toDate?: string },
): Promise<FloatSyncResult> {
  const start = Date.now();
  const config = await createFloatClient(entityId);
  const journalEntriesCreated: string[] = [];
  const errors: Array<{ floatId: string; error: string }> = [];
  let imported = 0;
  let skipped = 0;

  // Get sync cursor
  const syncState = await getSyncState(entityId, 'TRANSACTIONS');
  const params: Record<string, string> = { status: 'READY_TO_EXPORT' };
  if (options?.fromDate) params.created_at__gte = options.fromDate;
  else if (syncState?.last_synced_at) params.updated_after = syncState.last_synced_at;
  if (options?.toDate) params.created_at__lte = options.toDate;

  const transactions = await floatGetAllPages<FloatTransaction>(config, '/transactions', params);

  // Config lookups
  const cardLiabilityNodeId = await getConfigString('float.default_card_liability_node_id', entityId);
  const uncategorizedNodeId = await getConfigString('float.uncategorized_expense_node_id', entityId);

  for (const txn of transactions) {
    try {
      // Idempotency check
      const existing = await getEbgIdForFloat(entityId, 'TRANSACTION', txn.id);
      if (existing) { skipped++; continue; }

      // Resolve GL code → Activity
      const activityId = await resolveActivityForGlCode(entityId, txn.gl_code_id) ?? uncategorizedNodeId;
      if (!activityId) {
        errors.push({ floatId: txn.id, error: 'No GL code mapping and no uncategorized fallback configured' });
        continue;
      }

      // Resolve vendor
      const vendorId = await resolveOrCreateVendor(config, entityId, txn.vendor_id, txn.merchant_name);

      // Create AP Invoice
      const invoiceInput: CreateInvoiceInput = {
        entityId,
        vendorId: vendorId ?? entityId, // self-reference if no vendor
        invoiceNumber: `FLOAT-TXN-${txn.id}`,
        invoiceDate: txn.date,
        dueDate: txn.date, // card transactions are already settled
        amount: txn.amount,
        currency: txn.currency,
        description: `Float card: ${txn.merchant_name} — ${txn.description}`,
        periodId,
        lineItems: [{
          description: txn.description || txn.merchant_name,
          amount: txn.amount,
          nodeRefId: activityId,
          nodeRefType: 'ACTIVITY',
          economicCategory: 'EXPENSE',
        }],
      };

      const invoiceId = await createInvoice(invoiceInput);
      await approveInvoice(invoiceId);
      const jeId = await postInvoice(invoiceId);
      journalEntriesCreated.push(jeId);

      // Record mapping + mark exported in Float
      await setFloatMapping(entityId, 'TRANSACTION', txn.id, invoiceId, 'APInvoice');
      await floatPatch(config, `/transactions/${txn.id}`, { status: 'EXPORTED' });
      imported++;

      logger.info({ floatTxnId: txn.id, invoiceId, jeId }, 'Synced Float transaction');
    } catch (err: any) {
      errors.push({ floatId: txn.id, error: err.message });
      logger.warn({ floatTxnId: txn.id, err }, 'Failed to sync Float transaction');
    }
  }

  const durationMs = Date.now() - start;
  const syncRunId = await finishSync(entityId, 'TRANSACTIONS', transactions.length, imported, skipped, errors, durationMs, journalEntriesCreated);

  return { syncRunId, entityId, syncType: 'TRANSACTIONS', itemsFetched: transactions.length, itemsImported: imported, itemsSkipped: skipped, itemsFailed: errors.length, journalEntriesCreated, errors, durationMs };
}

// ── Sync Bills ───────────────────────────────────────────────

export async function syncFloatBills(
  entityId: string,
  periodId: string,
  options?: { fromDate?: string; toDate?: string },
): Promise<FloatSyncResult> {
  const start = Date.now();
  const config = await createFloatClient(entityId);
  const journalEntriesCreated: string[] = [];
  const errors: Array<{ floatId: string; error: string }> = [];
  let imported = 0;
  let skipped = 0;

  const syncState = await getSyncState(entityId, 'BILLS');
  const params: Record<string, string> = { status: 'READY_TO_EXPORT' };
  if (options?.fromDate) params.created_at__gte = options.fromDate;
  else if (syncState?.last_synced_at) params.updated_after = syncState.last_synced_at;
  if (options?.toDate) params.created_at__lte = options.toDate;

  const bills = await floatGetAllPages<FloatBill>(config, '/bills', params);
  const uncategorizedNodeId = await getConfigString('float.uncategorized_expense_node_id', entityId);

  for (const bill of bills) {
    try {
      const existing = await getEbgIdForFloat(entityId, 'BILL', bill.id);
      if (existing) { skipped++; continue; }

      // Build line items from bill
      const lineItems = bill.line_items && bill.line_items.length > 0
        ? await Promise.all(bill.line_items.map(async (li) => {
            const nodeId = await resolveActivityForGlCode(entityId, li.gl_code_id) ?? uncategorizedNodeId ?? entityId;
            return {
              description: li.description || bill.description,
              amount: li.amount,
              nodeRefId: nodeId,
              nodeRefType: 'ACTIVITY',
              economicCategory: 'EXPENSE',
            };
          }))
        : [{
            description: bill.description,
            amount: bill.amount,
            nodeRefId: await resolveActivityForGlCode(entityId, bill.gl_code_id) ?? uncategorizedNodeId ?? entityId,
            nodeRefType: 'ACTIVITY',
            economicCategory: 'EXPENSE',
          }];

      const vendorId = await resolveOrCreateVendor(config, entityId, bill.vendor_id, '');

      const invoiceInput: CreateInvoiceInput = {
        entityId,
        vendorId: vendorId ?? entityId,
        invoiceNumber: `FLOAT-BILL-${bill.id}`,
        invoiceDate: bill.date,
        dueDate: bill.due_date,
        amount: bill.amount,
        currency: bill.currency,
        description: `Float bill: ${bill.description}`,
        periodId,
        lineItems,
      };

      const invoiceId = await createInvoice(invoiceInput);
      await approveInvoice(invoiceId);
      const jeId = await postInvoice(invoiceId);
      journalEntriesCreated.push(jeId);

      await setFloatMapping(entityId, 'BILL', bill.id, invoiceId, 'APInvoice');
      await floatPatch(config, `/bills/${bill.id}`, { status: 'EXPORTED' });
      await floatPost(config, `/bills/${bill.id}/synced`, {});
      imported++;

      logger.info({ floatBillId: bill.id, invoiceId, jeId }, 'Synced Float bill');
    } catch (err: any) {
      errors.push({ floatId: bill.id, error: err.message });
      logger.warn({ floatBillId: bill.id, err }, 'Failed to sync Float bill');
    }
  }

  const durationMs = Date.now() - start;
  const syncRunId = await finishSync(entityId, 'BILLS', bills.length, imported, skipped, errors, durationMs, journalEntriesCreated);

  return { syncRunId, entityId, syncType: 'BILLS', itemsFetched: bills.length, itemsImported: imported, itemsSkipped: skipped, itemsFailed: errors.length, journalEntriesCreated, errors, durationMs };
}

// ── Sync Reimbursements ──────────────────────────────────────

export async function syncFloatReimbursements(
  entityId: string,
  periodId: string,
  options?: { fromDate?: string; toDate?: string },
): Promise<FloatSyncResult> {
  const start = Date.now();
  const config = await createFloatClient(entityId);
  const journalEntriesCreated: string[] = [];
  const errors: Array<{ floatId: string; error: string }> = [];
  let imported = 0;
  let skipped = 0;

  const syncState = await getSyncState(entityId, 'REIMBURSEMENTS');
  const params: Record<string, string> = { status: 'READY_TO_EXPORT' };
  if (options?.fromDate) params.created_at__gte = options.fromDate;
  else if (syncState?.last_synced_at) params.updated_after = syncState.last_synced_at;
  if (options?.toDate) params.created_at__lte = options.toDate;

  const reimbursements = await floatGetAllPages<FloatReimbursement>(config, '/reimbursements', params);
  const reimbPayableNodeId = await getConfigString('float.default_reimbursement_payable_node_id', entityId);
  const uncategorizedNodeId = await getConfigString('float.uncategorized_expense_node_id', entityId);

  for (const reimb of reimbursements) {
    try {
      const existing = await getEbgIdForFloat(entityId, 'REIMBURSEMENT', reimb.id);
      if (existing) { skipped++; continue; }

      if (!reimbPayableNodeId) {
        errors.push({ floatId: reimb.id, error: 'float.default_reimbursement_payable_node_id not configured' });
        continue;
      }

      // Build debit lines from individual expenses
      const debitLines = await Promise.all(
        reimb.expenses.map(async (exp) => {
          const nodeId = await resolveActivityForGlCode(entityId, exp.gl_code_id) ?? uncategorizedNodeId ?? entityId;
          return {
            side: 'DEBIT' as const,
            amount: exp.amount,
            nodeRefId: nodeId,
            nodeRefType: 'ACTIVITY' as const,
            economicCategory: 'EXPENSE' as const,
          };
        }),
      );

      // Credit line: reimbursement payable
      const creditLine = {
        side: 'CREDIT' as const,
        amount: reimb.amount,
        nodeRefId: reimbPayableNodeId,
        nodeRefType: 'ACTIVITY' as const,
        economicCategory: 'LIABILITY' as const,
      };

      const jeId = await postJournalEntry({
        entityId,
        periodId,
        entryType: 'OPERATIONAL',
        reference: `FLOAT-REIMB-${reimb.id}`,
        narrative: `Float reimbursement: ${reimb.description}`,
        currency: reimb.currency,
        validDate: reimb.date,
        sourceSystem: 'float-sync',
        lines: [...debitLines, creditLine],
      });

      journalEntriesCreated.push(jeId);
      await setFloatMapping(entityId, 'REIMBURSEMENT', reimb.id, jeId, 'JournalEntry');
      await floatPatch(config, `/reimbursements/${reimb.id}`, { status: 'EXPORTED' });
      await floatPost(config, `/reimbursements/${reimb.id}/synced`, {});
      imported++;

      logger.info({ floatReimbId: reimb.id, jeId }, 'Synced Float reimbursement');
    } catch (err: any) {
      errors.push({ floatId: reimb.id, error: err.message });
      logger.warn({ floatReimbId: reimb.id, err }, 'Failed to sync Float reimbursement');
    }
  }

  const durationMs = Date.now() - start;
  const syncRunId = await finishSync(entityId, 'REIMBURSEMENTS', reimbursements.length, imported, skipped, errors, durationMs, journalEntriesCreated);

  return { syncRunId, entityId, syncType: 'REIMBURSEMENTS', itemsFetched: reimbursements.length, itemsImported: imported, itemsSkipped: skipped, itemsFailed: errors.length, journalEntriesCreated, errors, durationMs };
}

// ── Full Sync ────────────────────────────────────────────────

export async function runFullFloatSync(
  entityId: string,
  periodId: string,
): Promise<FloatSyncResult[]> {
  const results: FloatSyncResult[] = [];
  results.push(await syncFloatTransactions(entityId, periodId));
  results.push(await syncFloatBills(entityId, periodId));
  results.push(await syncFloatReimbursements(entityId, periodId));
  return results;
}

// ── Internal helpers ─────────────────────────────────────────

async function finishSync(
  entityId: string,
  syncType: 'TRANSACTIONS' | 'BILLS' | 'REIMBURSEMENTS',
  fetched: number,
  imported: number,
  skipped: number,
  errors: Array<{ floatId: string; error: string }>,
  durationMs: number,
  journalEntriesCreated: string[],
): Promise<string> {
  const now = new Date().toISOString();
  const runId = await recordSyncRun({
    entityId, syncType, direction: 'INBOUND',
    itemsFetched: fetched, itemsImported: imported,
    itemsSkipped: skipped, itemsFailed: errors.length,
    errors, durationMs,
  });

  await updateSyncState(entityId, syncType, now, runId);

  try {
    await emit('ebg.integrations', {
      event_id: uuid(),
      event_type: 'FLOAT_SYNC_COMPLETED',
      sequence_number: 0,
      idempotency_key: `float-sync-${entityId}-${syncType}-${Date.now()}`,
      entity_id: entityId,
      timestamp: now,
      payload: { syncType, fetched, imported, skipped, failed: errors.length, journalEntriesCreated },
    });
  } catch {
    // Non-critical
  }

  return runId;
}
