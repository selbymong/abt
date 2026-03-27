/**
 * Intercompany Loan Service — Integration Tests
 *
 * Tests loan CRUD, activation with amortization schedule generation,
 * interest accrual, principal repayment, and elimination entries.
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
  createIntercoLoan,
  getIntercoLoan,
  listIntercoLoans,
  activateLoan,
  accrueInterest,
  recordRepayment,
  getAmortizationSchedule,
  generateEliminationEntries,
} from '../../src/services/gl/interco-loan-service.js';

const mockRunCypher = vi.mocked(runCypher);
const mockQuery = vi.mocked(query);
const mockPostJE = vi.mocked(postJournalEntry);

const LENDER_ID = '11111111-1111-1111-1111-111111111111';
const BORROWER_ID = '22222222-2222-2222-2222-222222222222';
const LOAN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PERIOD_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const SAMPLE_LOAN = {
  id: LOAN_ID,
  lender_entity_id: LENDER_ID,
  borrower_entity_id: BORROWER_ID,
  principal_amount: 1000000,
  principal_outstanding: 1000000,
  currency: 'CAD',
  interest_rate: 0.05,
  start_date: '2026-01-01',
  maturity_date: '2027-01-01',
  amortization_type: 'EQUAL_PRINCIPAL' as const,
  payment_frequency_months: 3,
  withholding_tax_rate: 0,
  status: 'DRAFT' as const,
  description: 'Working capital loan',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

const qr = (rows: any[]) => ({ rows, rowCount: rows.length, command: 'SELECT' as any, oid: 0, fields: [] });

beforeEach(() => {
  vi.resetAllMocks();
});

// ============================================================
// Loan CRUD
// ============================================================

describe('Interco Loan CRUD', () => {
  it('createIntercoLoan — creates loan node', async () => {
    mockRunCypher.mockResolvedValueOnce([]);
    const id = await createIntercoLoan({
      lenderEntityId: LENDER_ID,
      borrowerEntityId: BORROWER_ID,
      principalAmount: 1000000,
      currency: 'CAD',
      interestRate: 0.05,
      startDate: '2026-01-01',
      maturityDate: '2027-01-01',
      amortizationType: 'EQUAL_PRINCIPAL',
      paymentFrequencyMonths: 3,
    });
    expect(id).toBeDefined();
    const cypher = mockRunCypher.mock.calls[0][0];
    expect(cypher).toContain('CREATE (l:IntercoLoan');
  });

  it('getIntercoLoan — returns loan by id', async () => {
    mockRunCypher.mockResolvedValueOnce([{ l: SAMPLE_LOAN }]);
    const loan = await getIntercoLoan(LOAN_ID);
    expect(loan).toEqual(SAMPLE_LOAN);
  });

  it('listIntercoLoans — filters by role', async () => {
    mockRunCypher.mockResolvedValueOnce([{ l: SAMPLE_LOAN }]);
    const loans = await listIntercoLoans(LENDER_ID, 'lender');
    expect(loans).toHaveLength(1);
    const cypher = mockRunCypher.mock.calls[0][0];
    expect(cypher).toContain('lender_entity_id');
  });
});

// ============================================================
// Activation & Schedule
// ============================================================

describe('Loan Activation', () => {
  it('activateLoan — generates amortization schedule', async () => {
    // getIntercoLoan
    mockRunCypher.mockResolvedValueOnce([{ l: SAMPLE_LOAN }]);
    // Insert schedule entries (4 quarterly periods)
    mockQuery.mockResolvedValue(qr([]));
    // Update loan status
    mockRunCypher.mockResolvedValueOnce([]);

    const schedule = await activateLoan(LOAN_ID);

    // 12 months / 3 months = 4 periods
    expect(schedule).toHaveLength(4);
    expect(schedule[0].period_number).toBe(1);
    expect(schedule[3].period_number).toBe(4);

    // Equal principal: 1M / 4 = 250K per period
    expect(schedule[0].principal_payment).toBe(250000);
    // Last payment should bring remaining to 0
    expect(schedule[3].principal_remaining).toBe(0);

    // Interest should decrease over time
    expect(schedule[0].interest_payment).toBeGreaterThan(schedule[3].interest_payment);
  });

  it('activateLoan — rejects non-DRAFT', async () => {
    mockRunCypher.mockResolvedValueOnce([{ l: { ...SAMPLE_LOAN, status: 'ACTIVE' } }]);
    await expect(activateLoan(LOAN_ID)).rejects.toThrow('must be DRAFT');
  });
});

// ============================================================
// Interest Accrual
// ============================================================

describe('Interest Accrual', () => {
  it('accrueInterest — posts JEs for both entities', async () => {
    // getIntercoLoan
    mockRunCypher.mockResolvedValueOnce([{ l: { ...SAMPLE_LOAN, status: 'ACTIVE' } }]);
    // Get pending schedule entry
    mockQuery.mockResolvedValueOnce(qr([{
      id: 'sched-1', period_number: 1, interest_payment: 12500, principal_payment: 250000,
    }]));
    // Post borrower JE
    mockPostJE.mockResolvedValueOnce('je-borrow-1');
    // Post lender JE
    mockPostJE.mockResolvedValueOnce('je-lend-1');
    // Update schedule status
    mockQuery.mockResolvedValueOnce(qr([]));

    const result = await accrueInterest(LOAN_ID, PERIOD_ID, '2026-03-31');
    expect(result.borrowerJeId).toBe('je-borrow-1');
    expect(result.lenderJeId).toBe('je-lend-1');
    expect(mockPostJE).toHaveBeenCalledTimes(2);

    // Borrower: DR Interest Expense / CR Interest Payable
    const borrowerJE = mockPostJE.mock.calls[0][0] as any;
    expect(borrowerJE.entityId).toBe(BORROWER_ID);
    expect(borrowerJE.entryType).toBe('ACCRUAL');

    // Lender: DR Interest Receivable / CR Interest Revenue
    const lenderJE = mockPostJE.mock.calls[1][0] as any;
    expect(lenderJE.entityId).toBe(LENDER_ID);
    expect(lenderJE.entryType).toBe('ACCRUAL');
  });

  it('accrueInterest — rejects non-ACTIVE loan', async () => {
    mockRunCypher.mockResolvedValueOnce([{ l: SAMPLE_LOAN }]); // DRAFT
    await expect(accrueInterest(LOAN_ID, PERIOD_ID, '2026-03-31')).rejects.toThrow('must be ACTIVE');
  });

  it('accrueInterest — handles withholding tax', async () => {
    const loanWithTax = { ...SAMPLE_LOAN, status: 'ACTIVE', withholding_tax_rate: 0.15 };
    mockRunCypher.mockResolvedValueOnce([{ l: loanWithTax }]);
    mockQuery.mockResolvedValueOnce(qr([{
      id: 'sched-1', period_number: 1, interest_payment: 10000,
    }]));
    mockPostJE.mockResolvedValueOnce('je-b');
    mockPostJE.mockResolvedValueOnce('je-l');
    mockQuery.mockResolvedValueOnce(qr([]));

    await accrueInterest(LOAN_ID, PERIOD_ID, '2026-03-31');

    // Lender JE should have withholding line
    const lenderJE = mockPostJE.mock.calls[1][0] as any;
    // Net interest = 10000 * (1 - 0.15) = 8500, withholding = 1500
    expect(lenderJE.lines).toHaveLength(3); // DR net + DR withholding + CR revenue
  });
});

// ============================================================
// Repayment
// ============================================================

describe('Principal Repayment', () => {
  it('recordRepayment — posts JEs and updates outstanding', async () => {
    mockRunCypher.mockResolvedValueOnce([{ l: { ...SAMPLE_LOAN, status: 'ACTIVE' } }]);
    mockQuery.mockResolvedValueOnce(qr([{
      id: 'sched-1', period_number: 1, principal_payment: 250000, interest_payment: 12500,
    }]));
    mockPostJE.mockResolvedValueOnce('je-b-pay');
    mockPostJE.mockResolvedValueOnce('je-l-rcv');
    // Update loan outstanding
    mockRunCypher.mockResolvedValueOnce([]);
    // Mark entry as paid
    mockQuery.mockResolvedValueOnce(qr([]));

    const result = await recordRepayment(LOAN_ID, PERIOD_ID, '2026-04-01');
    expect(result.borrowerJeId).toBe('je-b-pay');
    expect(result.lenderJeId).toBe('je-l-rcv');
    expect(result.newStatus).toBe('ACTIVE'); // 750K still outstanding

    // Borrower: DR Liability / CR Cash
    const borrowerJE = mockPostJE.mock.calls[0][0] as any;
    expect(borrowerJE.entryType).toBe('OPERATIONAL');
  });

  it('recordRepayment — marks FULLY_REPAID on last payment', async () => {
    const lastPaymentLoan = { ...SAMPLE_LOAN, status: 'ACTIVE', principal_outstanding: 250000 };
    mockRunCypher.mockResolvedValueOnce([{ l: lastPaymentLoan }]);
    mockQuery.mockResolvedValueOnce(qr([{
      id: 'sched-4', period_number: 4, principal_payment: 250000, interest_payment: 3125,
    }]));
    mockPostJE.mockResolvedValueOnce('je-b-final');
    mockPostJE.mockResolvedValueOnce('je-l-final');
    mockRunCypher.mockResolvedValueOnce([]);
    mockQuery.mockResolvedValueOnce(qr([]));

    const result = await recordRepayment(LOAN_ID, PERIOD_ID, '2026-12-31');
    expect(result.newStatus).toBe('FULLY_REPAID');
  });
});

// ============================================================
// Elimination
// ============================================================

describe('Elimination Entries', () => {
  it('generateEliminationEntries — posts ELIMINATION JE', async () => {
    mockRunCypher.mockResolvedValueOnce([{ l: { ...SAMPLE_LOAN, status: 'ACTIVE', principal_outstanding: 500000 } }]);
    mockPostJE.mockResolvedValueOnce('je-elim-1');

    const jeId = await generateEliminationEntries(LOAN_ID, PERIOD_ID, '2026-06-30');
    expect(jeId).toBe('je-elim-1');

    const jeInput = mockPostJE.mock.calls[0][0] as any;
    expect(jeInput.entryType).toBe('ELIMINATION');
    expect(jeInput.lines).toHaveLength(2);
    // CR Asset (eliminate receivable), DR Liability (eliminate payable)
    const credit = jeInput.lines.find((l: any) => l.side === 'CREDIT');
    const debit = jeInput.lines.find((l: any) => l.side === 'DEBIT');
    expect(credit.economicCategory).toBe('ASSET');
    expect(debit.economicCategory).toBe('LIABILITY');
    expect(credit.amount).toBe(500000);
  });

  it('generateEliminationEntries — rejects zero balance', async () => {
    mockRunCypher.mockResolvedValueOnce([{ l: { ...SAMPLE_LOAN, status: 'FULLY_REPAID', principal_outstanding: 0 } }]);
    await expect(
      generateEliminationEntries(LOAN_ID, PERIOD_ID, '2026-12-31'),
    ).rejects.toThrow('no outstanding balance');
  });
});
