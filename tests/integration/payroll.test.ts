/**
 * Payroll Service — Integration Tests
 *
 * Tests employee CRUD, pay run lifecycle, deduction calculation,
 * pay run posting, remittances, and tax slip generation.
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
  createEmployee,
  getEmployee,
  listEmployees,
  createPayRun,
  getPayRun,
  calculatePayRun,
  approvePayRun,
  postPayRun,
  createRemittance,
  listRemittances,
  generateTaxSlips,
} from '../../src/services/gl/payroll-service.js';

const mockRunCypher = vi.mocked(runCypher);
const mockQuery = vi.mocked(query);
const mockPostJE = vi.mocked(postJournalEntry);

const ENTITY_ID = '11111111-1111-1111-1111-111111111111';
const PERIOD_ID = '22222222-2222-2222-2222-222222222222';
const PAY_RUN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const SAMPLE_EMPLOYEE = {
  id: 'emp-1',
  entity_id: ENTITY_ID,
  first_name: 'Jane',
  last_name: 'Smith',
  employee_code: 'E-001',
  pay_type: 'SALARY',
  annual_salary: 78000,
  hourly_rate: 0,
  currency: 'CAD',
  jurisdiction: 'CA',
  status: 'ACTIVE',
  start_date: '2025-01-01',
  department: 'Engineering',
  ytd_gross: 0,
  ytd_deductions: 0,
  ytd_net: 0,
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
};

const SAMPLE_PAY_RUN = {
  id: PAY_RUN_ID,
  entity_id: ENTITY_ID,
  period_id: PERIOD_ID,
  pay_date: '2026-03-15',
  pay_period_start: '2026-03-01',
  pay_period_end: '2026-03-14',
  status: 'DRAFT',
  total_gross: 0,
  total_deductions: 0,
  total_net: 0,
  employee_count: 0,
  created_at: '2026-03-01',
};

const qr = (rows: any[]) => ({ rows, rowCount: rows.length, command: 'SELECT' as any, oid: 0, fields: [] });

beforeEach(() => {
  vi.resetAllMocks();
});

// ============================================================
// Employee CRUD
// ============================================================

describe('Employee CRUD', () => {
  it('createEmployee — creates employee node', async () => {
    mockRunCypher.mockResolvedValueOnce([]);
    const id = await createEmployee({
      entityId: ENTITY_ID,
      firstName: 'Jane',
      lastName: 'Smith',
      employeeCode: 'E-001',
      payType: 'SALARY',
      annualSalary: 78000,
      currency: 'CAD',
      jurisdiction: 'CA',
      startDate: '2025-01-01',
    });
    expect(id).toBeDefined();
    const cypher = mockRunCypher.mock.calls[0][0];
    expect(cypher).toContain('CREATE (e:Employee');
  });

  it('getEmployee — returns employee by id', async () => {
    mockRunCypher.mockResolvedValueOnce([{ e: SAMPLE_EMPLOYEE }]);
    const emp = await getEmployee('emp-1');
    expect(emp?.first_name).toBe('Jane');
  });

  it('listEmployees — filters by status', async () => {
    mockRunCypher.mockResolvedValueOnce([{ e: SAMPLE_EMPLOYEE }]);
    const emps = await listEmployees(ENTITY_ID, 'ACTIVE');
    expect(emps).toHaveLength(1);
  });
});

// ============================================================
// Pay Run Lifecycle
// ============================================================

describe('Pay Run Lifecycle', () => {
  it('createPayRun — creates draft pay run in PG', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));
    const id = await createPayRun({
      entityId: ENTITY_ID,
      periodId: PERIOD_ID,
      payDate: '2026-03-15',
      payPeriodStart: '2026-03-01',
      payPeriodEnd: '2026-03-14',
    });
    expect(id).toBeDefined();
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('INSERT INTO pay_runs');
  });

  it('calculatePayRun — calculates deductions for Canadian employee', async () => {
    // getPayRun
    mockQuery.mockResolvedValueOnce(qr([SAMPLE_PAY_RUN]));
    // listEmployees
    mockRunCypher.mockResolvedValueOnce([{ e: SAMPLE_EMPLOYEE }]);
    // Insert pay stub
    mockQuery.mockResolvedValueOnce(qr([]));
    // Update pay run totals
    mockQuery.mockResolvedValueOnce(qr([]));

    const stubs = await calculatePayRun(PAY_RUN_ID);
    expect(stubs).toHaveLength(1);

    const stub = stubs[0];
    // 78000 / 26 = 3000 bi-weekly gross
    expect(stub.gross_pay).toBe(3000);
    expect(stub.deductions.length).toBe(4); // CPP, EI, FED_TAX, PROV_TAX

    const cpp = stub.deductions.find((d) => d.type === 'CPP');
    const ei = stub.deductions.find((d) => d.type === 'EI');
    const fedTax = stub.deductions.find((d) => d.type === 'FED_TAX');
    expect(cpp).toBeDefined();
    expect(ei).toBeDefined();
    expect(fedTax).toBeDefined();
    expect(fedTax!.amount).toBe(450); // 3000 * 0.15

    expect(stub.net_pay).toBeLessThan(stub.gross_pay);
    expect(stub.total_deductions).toBeGreaterThan(0);
  });

  it('calculatePayRun — rejects non-DRAFT', async () => {
    mockQuery.mockResolvedValueOnce(qr([{ ...SAMPLE_PAY_RUN, status: 'POSTED' }]));
    await expect(calculatePayRun(PAY_RUN_ID)).rejects.toThrow('must be DRAFT');
  });

  it('approvePayRun — CALCULATED → APPROVED', async () => {
    mockQuery.mockResolvedValueOnce(qr([{ ...SAMPLE_PAY_RUN, status: 'CALCULATED' }]));
    mockQuery.mockResolvedValueOnce(qr([]));
    await approvePayRun(PAY_RUN_ID);
    const sql = mockQuery.mock.calls[1][0] as string;
    expect(sql).toContain('APPROVED');
  });

  it('approvePayRun — rejects non-CALCULATED', async () => {
    mockQuery.mockResolvedValueOnce(qr([SAMPLE_PAY_RUN])); // DRAFT
    await expect(approvePayRun(PAY_RUN_ID)).rejects.toThrow('must be CALCULATED');
  });

  it('postPayRun — posts JE and updates YTD', async () => {
    const approvedRun = { ...SAMPLE_PAY_RUN, status: 'APPROVED', total_gross: 3000, total_deductions: 750, total_net: 2250, employee_count: 1 };
    // getPayRun
    mockQuery.mockResolvedValueOnce(qr([approvedRun]));
    // postJournalEntry
    mockPostJE.mockResolvedValueOnce('je-payroll-1');
    // Update pay run status
    mockQuery.mockResolvedValueOnce(qr([]));
    // Get pay stubs
    mockQuery.mockResolvedValueOnce(qr([{ employee_id: 'emp-1', gross_pay: 3000, total_deductions: 750, net_pay: 2250 }]));
    // Update employee YTD
    mockRunCypher.mockResolvedValueOnce([]);

    const jeId = await postPayRun(PAY_RUN_ID);
    expect(jeId).toBe('je-payroll-1');

    // JE: DR Expense (gross) / CR Asset (net cash) + CR Liability (deductions)
    const jeInput = mockPostJE.mock.calls[0][0] as any;
    expect(jeInput.entryType).toBe('OPERATIONAL');
    expect(jeInput.lines).toHaveLength(3);
    const debit = jeInput.lines.find((l: any) => l.side === 'DEBIT');
    expect(debit.amount).toBe(3000);
    expect(debit.economicCategory).toBe('EXPENSE');
  });
});

// ============================================================
// US Employee Deductions
// ============================================================

describe('US Employee Deductions', () => {
  it('calculatePayRun — calculates FICA/Medicare for US employee', async () => {
    const usEmployee = { ...SAMPLE_EMPLOYEE, id: 'emp-us', jurisdiction: 'US', annual_salary: 65000 };
    mockQuery.mockResolvedValueOnce(qr([SAMPLE_PAY_RUN]));
    mockRunCypher.mockResolvedValueOnce([{ e: usEmployee }]);
    mockQuery.mockResolvedValueOnce(qr([]));
    mockQuery.mockResolvedValueOnce(qr([]));

    const stubs = await calculatePayRun(PAY_RUN_ID);
    const stub = stubs[0];
    // 65000 / 26 = 2500 bi-weekly gross
    expect(stub.gross_pay).toBe(2500);

    const fica = stub.deductions.find((d) => d.type === 'FICA');
    const medicare = stub.deductions.find((d) => d.type === 'MEDICARE');
    const fedTax = stub.deductions.find((d) => d.type === 'FED_TAX');
    const stateTax = stub.deductions.find((d) => d.type === 'STATE_TAX');

    expect(fica).toBeDefined();
    expect(medicare).toBeDefined();
    expect(fedTax!.amount).toBe(550); // 2500 * 0.22
    expect(stateTax!.amount).toBe(125); // 2500 * 0.05
  });
});

// ============================================================
// Remittances
// ============================================================

describe('Remittances', () => {
  it('createRemittance — creates pending remittance', async () => {
    mockQuery.mockResolvedValueOnce(qr([]));
    const id = await createRemittance(ENTITY_ID, 'CRA-CPP', 1500, PERIOD_ID, '2026-04-15');
    expect(id).toBeDefined();
  });

  it('listRemittances — returns remittances for entity', async () => {
    mockQuery.mockResolvedValueOnce(qr([{ id: 'r1', remittance_type: 'CRA-CPP', amount: 1500, status: 'PENDING' }]));
    const remits = await listRemittances(ENTITY_ID, 'PENDING');
    expect(remits).toHaveLength(1);
  });
});

// ============================================================
// Tax Slips
// ============================================================

describe('Tax Slips', () => {
  it('generateTaxSlips — generates T4 for Canadian employee', async () => {
    mockRunCypher.mockResolvedValueOnce([{
      e: { ...SAMPLE_EMPLOYEE, ytd_gross: 78000, ytd_deductions: 18000, ytd_net: 60000 },
    }]);
    mockRunCypher.mockResolvedValueOnce([{ name: 'Maple Corp Inc.' }]);

    const slips = await generateTaxSlips(ENTITY_ID, 2026);
    expect(slips).toHaveLength(1);
    expect(slips[0].type).toBe('T4');
    expect(slips[0].grossIncome).toBe(78000);
    expect(slips[0].employerName).toBe('Maple Corp Inc.');
    expect(slips[0].cpp).toBeDefined();
    expect(slips[0].ei).toBeDefined();
  });

  it('generateTaxSlips — generates W2 for US employee', async () => {
    const usEmp = { ...SAMPLE_EMPLOYEE, jurisdiction: 'US', ytd_gross: 65000, ytd_deductions: 15000, ytd_net: 50000 };
    mockRunCypher.mockResolvedValueOnce([{ e: usEmp }]);
    mockRunCypher.mockResolvedValueOnce([{ name: 'US Corp LLC' }]);

    const slips = await generateTaxSlips(ENTITY_ID, 2026);
    expect(slips[0].type).toBe('W2');
    expect(slips[0].fica).toBeDefined();
    expect(slips[0].medicare).toBeDefined();
  });
});
