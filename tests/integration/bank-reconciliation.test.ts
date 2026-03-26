/**
 * Bank Reconciliation — Integration Tests
 *
 * Tests BankStatement/Line CRUD, manual matching, auto-matching,
 * manual clearing, finalization, and reconciliation reports.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { v4 as uuid } from 'uuid';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities } from '../../src/services/graph/graph-crud-service.js';
import {
  createBankStatement,
  getBankStatement,
  listBankStatements,
  addStatementLine,
  getBankStatementLine,
  listStatementLines,
  importStatementLines,
  matchLineToEvent,
  manualClearLine,
  autoMatch,
  finalizeReconciliation,
  generateReconciliationReport,
} from '../../src/services/reconciliation/bank-reconciliation-service.js';

let testEntityId: string;
const bankAccountId = uuid();
const cleanupIds: string[] = [];

function track(id: string) {
  cleanupIds.push(id);
  return id;
}

// Helper to create a CashFlowEvent with bank_account_id and functional_amount
async function createTestCFE(params: {
  entityId: string;
  direction: 'INFLOW' | 'OUTFLOW';
  amount: number;
  scheduledDate: string;
  bankAccountId: string;
  status?: string;
}): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (cfe:CashFlowEvent {
      id: $id, entity_id: $entityId, label: 'Test CFE',
      direction: $direction, amount: $amount, currency: 'CAD',
      functional_amount: $amount,
      scheduled_date: $scheduledDate,
      earliest_date: $scheduledDate,
      latest_date: $scheduledDate,
      counterparty_id: $counterparty,
      relationship_sensitivity: 0.5,
      bank_account_id: $bankAccountId,
      reconciliation_status: 'UNRECONCILED',
      status: $status,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: params.entityId,
      direction: params.direction,
      amount: params.amount,
      scheduledDate: params.scheduledDate,
      bankAccountId: params.bankAccountId,
      counterparty: uuid(),
      status: params.status ?? 'SETTLED',
    },
  );
  track(id);
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  const fpEntity = entities.find((e) => e.entity_type === 'FOR_PROFIT');
  testEntityId = fpEntity!.id;
});

afterAll(async () => {
  // Clean up all test nodes
  for (const id of cleanupIds) {
    await runCypher(`MATCH (n {id: $id}) DETACH DELETE n`, { id });
  }
  // Clean up by bank_account_id
  await runCypher(
    `MATCH (bs:BankStatement {bank_account_id: $bankAccountId}) DETACH DELETE bs`,
    { bankAccountId },
  );
  await runCypher(
    `MATCH (bsl:BankStatementLine {bank_account_id: $bankAccountId}) DETACH DELETE bsl`,
    { bankAccountId },
  );
  await runCypher(
    `MATCH (cfe:CashFlowEvent {bank_account_id: $bankAccountId}) DETACH DELETE cfe`,
    { bankAccountId },
  );

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

// ============================================================
// BankStatement CRUD
// ============================================================

describe('BankStatement CRUD', () => {
  let statementId: string;

  it('creates a bank statement', async () => {
    statementId = track(await createBankStatement({
      entityId: testEntityId,
      bankAccountId,
      statementDate: '2026-01-31',
      openingBalance: 50000,
      closingBalance: 55000,
      currency: 'CAD',
    }));

    const bs = await getBankStatement(statementId);
    expect(bs).not.toBeNull();
    expect(Number(bs.opening_balance)).toBe(50000);
    expect(Number(bs.closing_balance)).toBe(55000);
    expect(bs.is_reconciled).toBe(false);
    expect(Number(bs.line_count)).toBe(0);
  });

  it('lists statements by entity', async () => {
    const statements = await listBankStatements(testEntityId);
    expect(statements.length).toBeGreaterThanOrEqual(1);
  });

  it('filters statements by bank account', async () => {
    const statements = await listBankStatements(testEntityId, bankAccountId);
    expect(statements.some((s: any) => s.id === statementId)).toBe(true);
  });
});

// ============================================================
// BankStatementLine CRUD
// ============================================================

describe('BankStatementLine CRUD', () => {
  let statementId: string;
  let lineId: string;

  beforeAll(async () => {
    statementId = track(await createBankStatement({
      entityId: testEntityId,
      bankAccountId,
      statementDate: '2026-01-31',
      openingBalance: 10000,
      closingBalance: 12500,
      currency: 'CAD',
    }));
  });

  it('adds a statement line', async () => {
    lineId = track(await addStatementLine({
      entityId: testEntityId,
      statementId,
      bankAccountId,
      transactionDate: '2026-01-15',
      amount: 2500,
      description: 'Customer payment - INV-001',
      reference: 'TXN-12345',
    }));

    const line = await getBankStatementLine(lineId);
    expect(line).not.toBeNull();
    expect(Number(line.amount)).toBe(2500);
    expect(line.status).toBe('UNMATCHED');
    expect(line.reference).toBe('TXN-12345');
  });

  it('increments statement line count', async () => {
    const bs = await getBankStatement(statementId);
    expect(Number(bs.line_count)).toBeGreaterThanOrEqual(1);
  });

  it('lists lines by statement', async () => {
    const lines = await listStatementLines(statementId);
    expect(lines.length).toBeGreaterThanOrEqual(1);
  });

  it('filters lines by status', async () => {
    const unmatched = await listStatementLines(statementId, 'UNMATCHED');
    expect(unmatched.length).toBeGreaterThanOrEqual(1);

    const matched = await listStatementLines(statementId, 'MATCHED');
    expect(matched.every((l: any) => l.status === 'MATCHED')).toBe(true);
  });

  it('bulk imports statement lines', async () => {
    const result = await importStatementLines(testEntityId, statementId, bankAccountId, [
      { transactionDate: '2026-01-10', amount: 1000, description: 'Deposit' },
      { transactionDate: '2026-01-20', amount: -500, description: 'Wire transfer out' },
    ]);
    expect(result.imported).toBe(2);
    expect(result.lineIds.length).toBe(2);
    result.lineIds.forEach(id => track(id));
  });
});

// ============================================================
// Manual Matching
// ============================================================

describe('Manual Matching', () => {
  let statementId: string;
  let lineId: string;
  let cfeId: string;

  beforeAll(async () => {
    statementId = track(await createBankStatement({
      entityId: testEntityId,
      bankAccountId,
      statementDate: '2026-02-28',
      openingBalance: 20000,
      closingBalance: 23000,
      currency: 'CAD',
    }));

    lineId = track(await addStatementLine({
      entityId: testEntityId,
      statementId,
      bankAccountId,
      transactionDate: '2026-02-15',
      amount: 3000,
      description: 'Customer payment',
    }));

    cfeId = await createTestCFE({
      entityId: testEntityId,
      direction: 'INFLOW',
      amount: 3000,
      scheduledDate: '2026-02-15',
      bankAccountId,
    });
  });

  it('matches a line to a CashFlowEvent', async () => {
    await matchLineToEvent(lineId, cfeId);

    const line = await getBankStatementLine(lineId);
    expect(line.status).toBe('MATCHED');
    expect(line.matched_cfe_id).toBe(cfeId);

    const cfe = await runCypher<Record<string, any>>(
      `MATCH (cfe:CashFlowEvent {id: $id}) RETURN properties(cfe) AS cfe`,
      { id: cfeId },
    ).then(rows => rows[0].cfe);
    expect(cfe.reconciliation_status).toBe('RECONCILED');
  });

  it('throws when matching already-matched line', async () => {
    const cfe2 = await createTestCFE({
      entityId: testEntityId,
      direction: 'INFLOW',
      amount: 3000,
      scheduledDate: '2026-02-16',
      bankAccountId,
    });
    await expect(matchLineToEvent(lineId, cfe2)).rejects.toThrow('already MATCHED');
  });
});

// ============================================================
// Manual Clearing
// ============================================================

describe('Manual Clearing', () => {
  let statementId: string;

  beforeAll(async () => {
    statementId = track(await createBankStatement({
      entityId: testEntityId,
      bankAccountId,
      statementDate: '2026-03-31',
      openingBalance: 5000,
      closingBalance: 5050,
      currency: 'CAD',
    }));
  });

  it('manually clears a line', async () => {
    const lineId = track(await addStatementLine({
      entityId: testEntityId,
      statementId,
      bankAccountId,
      transactionDate: '2026-03-15',
      amount: 50,
      description: 'Bank fee',
    }));

    await manualClearLine(lineId);

    const line = await getBankStatementLine(lineId);
    expect(line.status).toBe('MANUALLY_CLEARED');
  });
});

// ============================================================
// Auto-Match
// ============================================================

describe('Auto-Match', () => {
  let statementId: string;

  beforeAll(async () => {
    statementId = track(await createBankStatement({
      entityId: testEntityId,
      bankAccountId,
      statementDate: '2026-04-30',
      openingBalance: 30000,
      closingBalance: 35000,
      currency: 'CAD',
    }));

    // Create matching CFE + line pairs
    await createTestCFE({
      entityId: testEntityId,
      direction: 'INFLOW',
      amount: 5000,
      scheduledDate: '2026-04-10',
      bankAccountId,
    });

    track(await addStatementLine({
      entityId: testEntityId,
      statementId,
      bankAccountId,
      transactionDate: '2026-04-10',
      amount: 5000,
      description: 'Deposit',
    }));
  });

  it('auto-matches lines to CFEs by amount', async () => {
    const result = await autoMatch(statementId);
    expect(result.matched).toBeGreaterThanOrEqual(1);
    expect(result.matches[0].amount).toBe(5000);
  });
});

// ============================================================
// Finalization
// ============================================================

describe('Finalization', () => {
  let statementId: string;

  beforeAll(async () => {
    statementId = track(await createBankStatement({
      entityId: testEntityId,
      bankAccountId,
      statementDate: '2026-05-31',
      openingBalance: 10000,
      closingBalance: 10100,
      currency: 'CAD',
    }));

    // Add one line and manually clear it
    const lineId = track(await addStatementLine({
      entityId: testEntityId,
      statementId,
      bankAccountId,
      transactionDate: '2026-05-15',
      amount: 100,
      description: 'Interest',
    }));
    await manualClearLine(lineId);
  });

  it('finalizes reconciliation when all lines matched/cleared', async () => {
    const result = await finalizeReconciliation(statementId);
    expect(result.isReconciled).toBe(true);
    expect(result.unmatchedLines).toBe(0);
    expect(result.matchedLines).toBe(1);

    const bs = await getBankStatement(statementId);
    expect(bs.is_reconciled).toBe(true);
  });

  it('does not finalize when unmatched lines remain', async () => {
    // Add an unmatched line
    track(await addStatementLine({
      entityId: testEntityId,
      statementId,
      bankAccountId,
      transactionDate: '2026-05-20',
      amount: 200,
      description: 'Unknown deposit',
    }));

    const result = await finalizeReconciliation(statementId);
    expect(result.isReconciled).toBe(false);
    expect(result.unmatchedLines).toBe(1);
  });
});

// ============================================================
// Reconciliation Report
// ============================================================

describe('Reconciliation Report', () => {
  let statementId: string;

  beforeAll(async () => {
    const reportBankAccountId = bankAccountId; // Use same account

    statementId = track(await createBankStatement({
      entityId: testEntityId,
      bankAccountId: reportBankAccountId,
      statementDate: '2026-06-30',
      openingBalance: 40000,
      closingBalance: 45000,
      currency: 'CAD',
    }));

    // Add some unmatched lines
    track(await addStatementLine({
      entityId: testEntityId,
      statementId,
      bankAccountId: reportBankAccountId,
      transactionDate: '2026-06-15',
      amount: 3000,
      description: 'Unmatched deposit',
    }));
  });

  it('generates a reconciliation report', async () => {
    const report = await generateReconciliationReport(bankAccountId, statementId);

    expect(report.bankAccountId).toBe(bankAccountId);
    expect(report.statementBalance).toBe(45000);
    expect(typeof report.ledgerBalance).toBe('number');
    expect(typeof report.adjustedBankBalance).toBe('number');
    expect(typeof report.difference).toBe('number');
    expect(Array.isArray(report.unmatchedBankLines)).toBe(true);
    expect(Array.isArray(report.unreconciledLedgerEntries)).toBe(true);
    expect(typeof report.outstandingDeposits).toBe('number');
    expect(typeof report.outstandingChecks).toBe('number');
  });
});
