/**
 * Intercompany Loan Service
 *
 * Implements:
 * - Loan agreement creation between related entities
 * - Amortization schedule generation (equal principal or equal payment)
 * - Interest accrual posting (DR Interest Expense / CR Interest Payable for borrower,
 *   DR Interest Receivable / CR Interest Revenue for lender)
 * - Principal repayment posting
 * - Automatic elimination entries for consolidation
 * - Withholding tax on intercompany interest
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import { postJournalEntry } from './journal-posting-service.js';

// ============================================================
// Types
// ============================================================

export type LoanStatus = 'DRAFT' | 'ACTIVE' | 'FULLY_REPAID' | 'DEFAULTED' | 'CANCELLED';
export type AmortizationType = 'EQUAL_PRINCIPAL' | 'EQUAL_PAYMENT' | 'BULLET';
export type ScheduleEntryStatus = 'PENDING' | 'ACCRUED' | 'PAID';

export interface CreateIntercoLoanInput {
  lenderEntityId: string;
  borrowerEntityId: string;
  principalAmount: number;
  currency: string;
  interestRate: number; // annual rate as decimal (0.05 = 5%)
  startDate: string;
  maturityDate: string;
  amortizationType: AmortizationType;
  paymentFrequencyMonths: number; // 1=monthly, 3=quarterly, 12=annual
  withholdingTaxRate?: number; // rate as decimal
  description?: string;
}

export interface IntercoLoan {
  id: string;
  lender_entity_id: string;
  borrower_entity_id: string;
  principal_amount: number;
  principal_outstanding: number;
  currency: string;
  interest_rate: number;
  start_date: string;
  maturity_date: string;
  amortization_type: AmortizationType;
  payment_frequency_months: number;
  withholding_tax_rate: number;
  status: LoanStatus;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AmortizationEntry {
  id: string;
  loan_id: string;
  period_number: number;
  payment_date: string;
  principal_payment: number;
  interest_payment: number;
  total_payment: number;
  principal_remaining: number;
  status: ScheduleEntryStatus;
}

// ============================================================
// Loan CRUD
// ============================================================

export async function createIntercoLoan(input: CreateIntercoLoanInput): Promise<string> {
  const id = uuid();

  await runCypher(
    `CREATE (l:IntercoLoan {
      id: $id,
      lender_entity_id: $lenderEntityId,
      borrower_entity_id: $borrowerEntityId,
      principal_amount: $principalAmount,
      principal_outstanding: $principalAmount,
      currency: $currency,
      interest_rate: $interestRate,
      start_date: $startDate,
      maturity_date: $maturityDate,
      amortization_type: $amortizationType,
      payment_frequency_months: $paymentFrequencyMonths,
      withholding_tax_rate: $withholdingTaxRate,
      status: 'DRAFT',
      description: $description,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      lenderEntityId: input.lenderEntityId,
      borrowerEntityId: input.borrowerEntityId,
      principalAmount: input.principalAmount,
      principalOutstanding: input.principalAmount,
      currency: input.currency,
      interestRate: input.interestRate,
      startDate: input.startDate,
      maturityDate: input.maturityDate,
      amortizationType: input.amortizationType,
      paymentFrequencyMonths: input.paymentFrequencyMonths,
      withholdingTaxRate: input.withholdingTaxRate ?? 0,
      description: input.description ?? null,
    },
  );

  return id;
}

export async function getIntercoLoan(id: string): Promise<IntercoLoan | null> {
  const results = await runCypher<{ l: IntercoLoan }>(
    `MATCH (l:IntercoLoan {id: $id}) RETURN properties(l) AS l`,
    { id },
  );
  return results[0]?.l ?? null;
}

export async function listIntercoLoans(entityId: string, role?: 'lender' | 'borrower'): Promise<IntercoLoan[]> {
  let where: string;
  if (role === 'lender') {
    where = 'l.lender_entity_id = $entityId';
  } else if (role === 'borrower') {
    where = 'l.borrower_entity_id = $entityId';
  } else {
    where = '(l.lender_entity_id = $entityId OR l.borrower_entity_id = $entityId)';
  }

  const results = await runCypher<{ l: IntercoLoan }>(
    `MATCH (l:IntercoLoan) WHERE ${where}
     RETURN properties(l) AS l ORDER BY l.start_date DESC`,
    { entityId },
  );
  return results.map((r) => r.l);
}

// ============================================================
// Activate Loan & Generate Schedule
// ============================================================

export async function activateLoan(loanId: string): Promise<AmortizationEntry[]> {
  const loan = await getIntercoLoan(loanId);
  if (!loan) throw new Error(`Loan ${loanId} not found`);
  if (loan.status !== 'DRAFT') throw new Error(`Loan ${loanId} is ${loan.status}, must be DRAFT to activate`);

  const schedule = generateAmortizationSchedule(loan);

  // Store schedule entries in PG
  for (const entry of schedule) {
    await query(
      `INSERT INTO interco_amortization (id, loan_id, period_number, payment_date,
        principal_payment, interest_payment, total_payment, principal_remaining, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', NOW())`,
      [entry.id, loanId, entry.period_number, entry.payment_date,
       entry.principal_payment, entry.interest_payment, entry.total_payment,
       entry.principal_remaining],
    );
  }

  await runCypher(
    `MATCH (l:IntercoLoan {id: $id})
     SET l.status = 'ACTIVE', l.updated_at = datetime()`,
    { id: loanId },
  );

  return schedule;
}

function generateAmortizationSchedule(loan: IntercoLoan): AmortizationEntry[] {
  const principal = Number(loan.principal_amount);
  const annualRate = Number(loan.interest_rate);
  const freqMonths = Number(loan.payment_frequency_months);
  const periodicRate = annualRate * freqMonths / 12;

  const start = new Date(loan.start_date);
  const end = new Date(loan.maturity_date);
  const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const numPeriods = Math.max(1, Math.floor(totalMonths / freqMonths));

  const entries: AmortizationEntry[] = [];
  let remaining = principal;

  for (let i = 1; i <= numPeriods; i++) {
    const payDate = new Date(start);
    payDate.setMonth(payDate.getMonth() + i * freqMonths);
    const payDateStr = payDate.toISOString().slice(0, 10);

    const interest = Math.round(remaining * periodicRate * 100) / 100;

    let principalPayment: number;
    if (loan.amortization_type === 'BULLET') {
      principalPayment = i === numPeriods ? remaining : 0;
    } else if (loan.amortization_type === 'EQUAL_PRINCIPAL') {
      principalPayment = Math.round((principal / numPeriods) * 100) / 100;
      if (i === numPeriods) principalPayment = remaining; // clean up rounding
    } else {
      // EQUAL_PAYMENT
      if (periodicRate === 0) {
        principalPayment = Math.round((principal / numPeriods) * 100) / 100;
      } else {
        const payment = principal * periodicRate / (1 - Math.pow(1 + periodicRate, -numPeriods));
        principalPayment = Math.round((payment - interest) * 100) / 100;
      }
      if (i === numPeriods) principalPayment = remaining;
    }

    principalPayment = Math.min(principalPayment, remaining);
    remaining = Math.round((remaining - principalPayment) * 100) / 100;

    entries.push({
      id: uuid(),
      loan_id: loan.id,
      period_number: i,
      payment_date: payDateStr,
      principal_payment: principalPayment,
      interest_payment: interest,
      total_payment: Math.round((principalPayment + interest) * 100) / 100,
      principal_remaining: remaining,
      status: 'PENDING',
    });
  }

  return entries;
}

// ============================================================
// Interest Accrual
// ============================================================

export async function accrueInterest(
  loanId: string,
  periodId: string,
  accrualDate: string,
): Promise<{ borrowerJeId: string; lenderJeId: string }> {
  const loan = await getIntercoLoan(loanId);
  if (!loan) throw new Error(`Loan ${loanId} not found`);
  if (loan.status !== 'ACTIVE') throw new Error(`Loan ${loanId} is ${loan.status}, must be ACTIVE`);

  // Find the next pending schedule entry
  const result = await query(
    `SELECT * FROM interco_amortization
     WHERE loan_id = $1 AND status = 'PENDING'
     ORDER BY period_number LIMIT 1`,
    [loanId],
  );

  if (result.rows.length === 0) throw new Error(`No pending schedule entries for loan ${loanId}`);
  const entry = result.rows[0] as any;
  const interestAmount = Number(entry.interest_payment);
  const withholdingAmount = Math.round(interestAmount * Number(loan.withholding_tax_rate) * 100) / 100;
  const netInterest = Math.round((interestAmount - withholdingAmount) * 100) / 100;

  // Borrower JE: DR Interest Expense / CR Interest Payable
  const borrowerJeId = await postJournalEntry({
    entityId: loan.borrower_entity_id,
    periodId,
    entryType: 'ACCRUAL',
    reference: `INTERCO-INT-${loanId.slice(0, 8)}-${entry.period_number}`,
    narrative: `Interco interest accrual period ${entry.period_number}`,
    currency: loan.currency,
    validDate: accrualDate,
    sourceSystem: 'interco-loan',
    lines: [
      { side: 'DEBIT', amount: interestAmount, nodeRefId: loanId, nodeRefType: 'ACTIVITY' as any, economicCategory: 'EXPENSE' },
      { side: 'CREDIT', amount: interestAmount, nodeRefId: loanId, nodeRefType: 'ACTIVITY' as any, economicCategory: 'LIABILITY' },
    ],
  });

  // Lender JE: DR Interest Receivable / CR Interest Revenue
  const lenderLines: any[] = [
    { side: 'DEBIT', amount: netInterest, nodeRefId: loanId, nodeRefType: 'ACTIVITY' as any, economicCategory: 'ASSET' },
  ];
  if (withholdingAmount > 0) {
    lenderLines.push({ side: 'DEBIT', amount: withholdingAmount, nodeRefId: loanId, nodeRefType: 'ACTIVITY' as any, economicCategory: 'ASSET' });
  }
  lenderLines.push({ side: 'CREDIT', amount: interestAmount, nodeRefId: loanId, nodeRefType: 'ACTIVITY' as any, economicCategory: 'REVENUE' });

  const lenderJeId = await postJournalEntry({
    entityId: loan.lender_entity_id,
    periodId,
    entryType: 'ACCRUAL',
    reference: `INTERCO-INT-${loanId.slice(0, 8)}-${entry.period_number}`,
    narrative: `Interco interest revenue period ${entry.period_number}`,
    currency: loan.currency,
    validDate: accrualDate,
    sourceSystem: 'interco-loan',
    lines: lenderLines,
  });

  // Mark entry as accrued
  await query(
    `UPDATE interco_amortization SET status = 'ACCRUED' WHERE id = $1`,
    [entry.id],
  );

  return { borrowerJeId, lenderJeId };
}

// ============================================================
// Principal Repayment
// ============================================================

export async function recordRepayment(
  loanId: string,
  periodId: string,
  paymentDate: string,
): Promise<{ borrowerJeId: string; lenderJeId: string; newStatus: LoanStatus }> {
  const loan = await getIntercoLoan(loanId);
  if (!loan) throw new Error(`Loan ${loanId} not found`);
  if (loan.status !== 'ACTIVE') throw new Error(`Loan ${loanId} is ${loan.status}, must be ACTIVE`);

  // Get next accrued entry (must accrue interest first)
  const result = await query(
    `SELECT * FROM interco_amortization
     WHERE loan_id = $1 AND status = 'ACCRUED'
     ORDER BY period_number LIMIT 1`,
    [loanId],
  );

  if (result.rows.length === 0) throw new Error(`No accrued entries to pay for loan ${loanId}`);
  const entry = result.rows[0] as any;
  const principalPayment = Number(entry.principal_payment);
  const interestPayment = Number(entry.interest_payment);
  const totalPayment = principalPayment + interestPayment;

  // Borrower JE: DR Loan Payable + Interest Payable / CR Cash
  const borrowerJeId = await postJournalEntry({
    entityId: loan.borrower_entity_id,
    periodId,
    entryType: 'OPERATIONAL',
    reference: `INTERCO-PAY-${loanId.slice(0, 8)}-${entry.period_number}`,
    narrative: `Interco loan repayment period ${entry.period_number}`,
    currency: loan.currency,
    validDate: paymentDate,
    sourceSystem: 'interco-loan',
    lines: [
      { side: 'DEBIT', amount: principalPayment, nodeRefId: loanId, nodeRefType: 'ACTIVITY' as any, economicCategory: 'LIABILITY' },
      { side: 'DEBIT', amount: interestPayment, nodeRefId: loanId, nodeRefType: 'ACTIVITY' as any, economicCategory: 'LIABILITY' },
      { side: 'CREDIT', amount: totalPayment, nodeRefId: loan.borrower_entity_id, nodeRefType: 'ENTITY' as any, economicCategory: 'ASSET' },
    ],
  });

  // Lender JE: DR Cash / CR Loan Receivable + Interest Receivable
  const lenderJeId = await postJournalEntry({
    entityId: loan.lender_entity_id,
    periodId,
    entryType: 'OPERATIONAL',
    reference: `INTERCO-RCV-${loanId.slice(0, 8)}-${entry.period_number}`,
    narrative: `Interco loan receipt period ${entry.period_number}`,
    currency: loan.currency,
    validDate: paymentDate,
    sourceSystem: 'interco-loan',
    lines: [
      { side: 'DEBIT', amount: totalPayment, nodeRefId: loan.lender_entity_id, nodeRefType: 'ENTITY' as any, economicCategory: 'ASSET' },
      { side: 'CREDIT', amount: principalPayment, nodeRefId: loanId, nodeRefType: 'ACTIVITY' as any, economicCategory: 'ASSET' },
      { side: 'CREDIT', amount: interestPayment, nodeRefId: loanId, nodeRefType: 'ACTIVITY' as any, economicCategory: 'ASSET' },
    ],
  });

  // Update loan outstanding
  const newOutstanding = Math.round((Number(loan.principal_outstanding) - principalPayment) * 100) / 100;
  const newStatus: LoanStatus = newOutstanding <= 0.01 ? 'FULLY_REPAID' : 'ACTIVE';

  await runCypher(
    `MATCH (l:IntercoLoan {id: $id})
     SET l.principal_outstanding = $outstanding, l.status = $status, l.updated_at = datetime()`,
    { id: loanId, outstanding: Math.max(0, newOutstanding), status: newStatus },
  );

  // Mark entry as paid
  await query(
    `UPDATE interco_amortization SET status = 'PAID' WHERE id = $1`,
    [entry.id],
  );

  return { borrowerJeId, lenderJeId, newStatus };
}

// ============================================================
// Amortization Schedule
// ============================================================

export async function getAmortizationSchedule(loanId: string): Promise<AmortizationEntry[]> {
  const result = await query(
    `SELECT * FROM interco_amortization WHERE loan_id = $1 ORDER BY period_number`,
    [loanId],
  );
  return result.rows as any;
}

// ============================================================
// Elimination Entries (for consolidation)
// ============================================================

export async function generateEliminationEntries(
  loanId: string,
  consolidationPeriodId: string,
  asOfDate: string,
): Promise<string> {
  const loan = await getIntercoLoan(loanId);
  if (!loan) throw new Error(`Loan ${loanId} not found`);

  const outstanding = Number(loan.principal_outstanding);
  if (outstanding <= 0) throw new Error(`Loan ${loanId} has no outstanding balance`);

  // Elimination JE: remove intercompany receivable and payable
  const jeId = await postJournalEntry({
    entityId: loan.lender_entity_id,
    periodId: consolidationPeriodId,
    entryType: 'ELIMINATION',
    reference: `INTERCO-ELIM-${loanId.slice(0, 8)}`,
    narrative: `Elimination of interco loan ${loanId.slice(0, 8)} for consolidation`,
    currency: loan.currency,
    validDate: asOfDate,
    sourceSystem: 'interco-loan',
    lines: [
      // Eliminate lender's receivable
      { side: 'CREDIT', amount: outstanding, nodeRefId: loanId, nodeRefType: 'ACTIVITY' as any, economicCategory: 'ASSET' },
      // Eliminate borrower's payable
      { side: 'DEBIT', amount: outstanding, nodeRefId: loanId, nodeRefType: 'ACTIVITY' as any, economicCategory: 'LIABILITY' },
    ],
  });

  return jeId;
}
