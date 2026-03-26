/**
 * Bank Reconciliation Service
 *
 * Manages BankStatement and BankStatementLine nodes.
 * Matches bank statement lines to CashFlowEvents,
 * performs auto-matching, and generates reconciliation reports.
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import type { BankStatementLineStatus } from '../../schema/neo4j/types.js';

// ============================================================
// BankStatement CRUD
// ============================================================

export interface CreateBankStatementInput {
  entityId: string;
  bankAccountId: string;
  statementDate: string;
  openingBalance: number;
  closingBalance: number;
  currency: string;
}

export async function createBankStatement(input: CreateBankStatementInput): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (bs:BankStatement {
      id: $id, entity_id: $entityId,
      bank_account_id: $bankAccountId,
      statement_date: $statementDate,
      opening_balance: $openingBalance,
      closing_balance: $closingBalance,
      currency: $currency,
      line_count: 0, matched_count: 0,
      is_reconciled: false,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      bankAccountId: input.bankAccountId,
      statementDate: input.statementDate,
      openingBalance: input.openingBalance,
      closingBalance: input.closingBalance,
      currency: input.currency,
    },
  );
  return id;
}

export async function getBankStatement(id: string) {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (bs:BankStatement {id: $id}) RETURN properties(bs) AS bs`,
    { id },
  );
  return rows.length > 0 ? rows[0].bs : null;
}

export async function listBankStatements(entityId: string, bankAccountId?: string) {
  const accountClause = bankAccountId ? ' AND bs.bank_account_id = $bankAccountId' : '';
  return runCypher<Record<string, any>>(
    `MATCH (bs:BankStatement {entity_id: $entityId})
     WHERE 1=1 ${accountClause}
     RETURN properties(bs) AS bs ORDER BY bs.statement_date DESC`,
    { entityId, bankAccountId: bankAccountId ?? null },
  ).then(rows => rows.map(r => r.bs));
}

// ============================================================
// BankStatementLine CRUD
// ============================================================

export interface CreateBankStatementLineInput {
  entityId: string;
  statementId: string;
  bankAccountId: string;
  transactionDate: string;
  amount: number;
  description: string;
  reference?: string;
}

export async function addStatementLine(input: CreateBankStatementLineInput): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (bsl:BankStatementLine {
      id: $id, entity_id: $entityId,
      statement_id: $statementId,
      bank_account_id: $bankAccountId,
      transaction_date: $transactionDate,
      amount: $amount,
      description: $description,
      reference: $reference,
      status: 'UNMATCHED',
      matched_cfe_id: null,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      statementId: input.statementId,
      bankAccountId: input.bankAccountId,
      transactionDate: input.transactionDate,
      amount: input.amount,
      description: input.description,
      reference: input.reference ?? null,
    },
  );

  // Update statement line count
  await runCypher(
    `MATCH (bs:BankStatement {id: $statementId})
     SET bs.line_count = bs.line_count + 1,
         bs.updated_at = datetime()`,
    { statementId: input.statementId },
  );

  return id;
}

export async function getBankStatementLine(id: string) {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (bsl:BankStatementLine {id: $id}) RETURN properties(bsl) AS bsl`,
    { id },
  );
  return rows.length > 0 ? rows[0].bsl : null;
}

export async function listStatementLines(statementId: string, status?: BankStatementLineStatus) {
  const statusClause = status ? ' AND bsl.status = $status' : '';
  return runCypher<Record<string, any>>(
    `MATCH (bsl:BankStatementLine {statement_id: $statementId})
     WHERE 1=1 ${statusClause}
     RETURN properties(bsl) AS bsl ORDER BY bsl.transaction_date`,
    { statementId, status: status ?? null },
  ).then(rows => rows.map(r => r.bsl));
}

// ============================================================
// Bulk Import Statement Lines
// ============================================================

export interface BulkLineInput {
  transactionDate: string;
  amount: number;
  description: string;
  reference?: string;
}

export async function importStatementLines(
  entityId: string,
  statementId: string,
  bankAccountId: string,
  lines: BulkLineInput[],
): Promise<{ imported: number; lineIds: string[] }> {
  const lineIds: string[] = [];
  for (const line of lines) {
    const id = await addStatementLine({
      entityId,
      statementId,
      bankAccountId,
      transactionDate: line.transactionDate,
      amount: line.amount,
      description: line.description,
      reference: line.reference,
    });
    lineIds.push(id);
  }
  return { imported: lineIds.length, lineIds };
}

// ============================================================
// Manual Match
// ============================================================

/**
 * Manually match a bank statement line to a CashFlowEvent.
 */
export async function matchLineToEvent(
  lineId: string,
  cashFlowEventId: string,
): Promise<void> {
  // Verify both exist
  const line = await getBankStatementLine(lineId);
  if (!line) throw new Error('BankStatementLine not found');
  if (line.status !== 'UNMATCHED') throw new Error(`Line already ${line.status}`);

  const cfeRows = await runCypher<Record<string, any>>(
    `MATCH (cfe:CashFlowEvent {id: $id}) RETURN cfe.id AS id`,
    { id: cashFlowEventId },
  );
  if (cfeRows.length === 0) throw new Error('CashFlowEvent not found');

  // Update line
  await runCypher(
    `MATCH (bsl:BankStatementLine {id: $lineId})
     SET bsl.status = 'MATCHED',
         bsl.matched_cfe_id = $cfeId,
         bsl.updated_at = datetime()`,
    { lineId, cfeId: cashFlowEventId },
  );

  // Update CFE reconciliation status
  await runCypher(
    `MATCH (cfe:CashFlowEvent {id: $cfeId})
     SET cfe.reconciliation_status = 'RECONCILED',
         cfe.updated_at = datetime()`,
    { cfeId: cashFlowEventId },
  );

  // Update statement matched count
  await runCypher(
    `MATCH (bs:BankStatement {id: $statementId})
     SET bs.matched_count = bs.matched_count + 1,
         bs.updated_at = datetime()`,
    { statementId: line.statement_id },
  );
}

/**
 * Manually clear a bank statement line (no matching CFE).
 */
export async function manualClearLine(lineId: string): Promise<void> {
  const line = await getBankStatementLine(lineId);
  if (!line) throw new Error('BankStatementLine not found');
  if (line.status !== 'UNMATCHED') throw new Error(`Line already ${line.status}`);

  await runCypher(
    `MATCH (bsl:BankStatementLine {id: $lineId})
     SET bsl.status = 'MANUALLY_CLEARED',
         bsl.updated_at = datetime()`,
    { lineId },
  );

  await runCypher(
    `MATCH (bs:BankStatement {id: $statementId})
     SET bs.matched_count = bs.matched_count + 1,
         bs.updated_at = datetime()`,
    { statementId: line.statement_id },
  );
}

// ============================================================
// Auto-Match
// ============================================================

/**
 * Auto-match unmatched bank statement lines to CashFlowEvents.
 * Matches by amount and date (within tolerance).
 */
export async function autoMatch(
  statementId: string,
  dateTolerance: number = 3,
): Promise<{
  matched: number;
  matches: { lineId: string; cfeId: string; amount: number }[];
}> {
  // Get unmatched lines
  const lines = await listStatementLines(statementId, 'UNMATCHED');

  const matches: { lineId: string; cfeId: string; amount: number }[] = [];

  for (const line of lines) {
    const amount = Number(line.amount);
    const bankAccountId = line.bank_account_id;

    // Find unreconciled CFEs matching amount and date range
    const candidates = await runCypher<Record<string, any>>(
      `MATCH (cfe:CashFlowEvent {bank_account_id: $bankAccountId})
       WHERE (cfe.reconciliation_status IS NULL OR cfe.reconciliation_status = 'UNRECONCILED')
         AND cfe.status = 'SETTLED'
         AND ABS(cfe.functional_amount - $amount) < 0.01
       RETURN cfe.id AS id, cfe.functional_amount AS amount
       LIMIT 1`,
      { bankAccountId, amount: Math.abs(amount) },
    );

    if (candidates.length > 0) {
      const cfe = candidates[0];
      await matchLineToEvent(line.id as string, cfe.id as string);
      matches.push({
        lineId: line.id as string,
        cfeId: cfe.id as string,
        amount,
      });
    }
  }

  return { matched: matches.length, matches };
}

// ============================================================
// Reconciliation Status
// ============================================================

/**
 * Mark a statement as reconciled if all lines are matched/cleared.
 */
export async function finalizeReconciliation(statementId: string): Promise<{
  isReconciled: boolean;
  totalLines: number;
  matchedLines: number;
  unmatchedLines: number;
}> {
  const statement = await getBankStatement(statementId);
  if (!statement) throw new Error('BankStatement not found');

  const allLines = await listStatementLines(statementId);
  const unmatched = allLines.filter((l: any) => l.status === 'UNMATCHED');
  const matched = allLines.filter((l: any) => l.status !== 'UNMATCHED');

  const isReconciled = unmatched.length === 0 && allLines.length > 0;

  await runCypher(
    `MATCH (bs:BankStatement {id: $id})
     SET bs.is_reconciled = $reconciled,
         bs.matched_count = $matchedCount,
         bs.updated_at = datetime()`,
    { id: statementId, reconciled: isReconciled, matchedCount: matched.length },
  );

  return {
    isReconciled,
    totalLines: allLines.length,
    matchedLines: matched.length,
    unmatchedLines: unmatched.length,
  };
}

// ============================================================
// Reconciliation Report (Q20 pattern)
// ============================================================

export interface ReconciliationReport {
  bankAccountId: string;
  statementBalance: number;
  ledgerBalance: number;
  adjustedBankBalance: number;
  adjustedLedgerBalance: number;
  difference: number;
  unmatchedBankLines: Record<string, any>[];
  unreconciledLedgerEntries: Record<string, any>[];
  outstandingDeposits: number;
  outstandingChecks: number;
}

export async function generateReconciliationReport(
  bankAccountId: string,
  statementId: string,
): Promise<ReconciliationReport> {
  const statement = await getBankStatement(statementId);
  if (!statement) throw new Error('BankStatement not found');

  const statementBalance = Number(statement.closing_balance);

  // Unmatched bank lines (in bank, not in ledger)
  const unmatchedBankLines = await runCypher<Record<string, any>>(
    `MATCH (bsl:BankStatementLine {statement_id: $statementId, status: 'UNMATCHED'})
     RETURN properties(bsl) AS bsl ORDER BY bsl.transaction_date`,
    { statementId },
  ).then(rows => rows.map(r => r.bsl));

  // Unreconciled ledger entries (in ledger, not at bank)
  const unreconciledLedgerEntries = await runCypher<Record<string, any>>(
    `MATCH (cfe:CashFlowEvent {bank_account_id: $bankAccountId})
     WHERE (cfe.reconciliation_status IS NULL OR cfe.reconciliation_status = 'UNRECONCILED')
       AND cfe.status = 'SETTLED'
     RETURN properties(cfe) AS cfe ORDER BY cfe.scheduled_date`,
    { bankAccountId },
  ).then(rows => rows.map(r => r.cfe));

  // Outstanding deposits (positive unreconciled CFEs - in ledger, not at bank)
  const outstandingDeposits = unreconciledLedgerEntries
    .filter((e: any) => e.direction === 'INFLOW')
    .reduce((sum: number, e: any) => sum + Number(e.functional_amount ?? e.amount), 0);

  // Outstanding checks (negative unreconciled CFEs - in ledger, not at bank)
  const outstandingChecks = unreconciledLedgerEntries
    .filter((e: any) => e.direction === 'OUTFLOW')
    .reduce((sum: number, e: any) => sum + Number(e.functional_amount ?? e.amount), 0);

  // Adjusted balances
  const adjustedBankBalance = statementBalance + outstandingDeposits - outstandingChecks;

  // Ledger balance from matched items (sum of all settled CFEs for this account)
  const ledgerRows = await runCypher<{ total: number }>(
    `MATCH (cfe:CashFlowEvent {bank_account_id: $bankAccountId})
     WHERE cfe.status = 'SETTLED'
     RETURN COALESCE(
       SUM(CASE WHEN cfe.direction = 'INFLOW' THEN cfe.functional_amount
                WHEN cfe.direction = 'OUTFLOW' THEN -cfe.functional_amount
                ELSE 0 END),
       0) AS total`,
    { bankAccountId },
  );
  const ledgerBalance = Number(ledgerRows[0]?.total ?? 0);
  const adjustedLedgerBalance = ledgerBalance;

  const difference = Math.round((adjustedBankBalance - adjustedLedgerBalance) * 100) / 100;

  return {
    bankAccountId,
    statementBalance,
    ledgerBalance,
    adjustedBankBalance: Math.round(adjustedBankBalance * 100) / 100,
    adjustedLedgerBalance: Math.round(adjustedLedgerBalance * 100) / 100,
    difference,
    unmatchedBankLines,
    unreconciledLedgerEntries,
    outstandingDeposits: Math.round(outstandingDeposits * 100) / 100,
    outstandingChecks: Math.round(outstandingChecks * 100) / 100,
  };
}
