/**
 * Payroll Service
 *
 * Implements:
 * - Employee master linked to WorkforceAsset graph nodes
 * - Pay run creation and processing
 * - Compensation calculation (salary, hourly, bonus)
 * - Statutory deductions: CPP/EI (Canada), FICA/Medicare (US)
 * - Income tax withholding (federal + provincial/state)
 * - Pay run posting: JE with DR Salary Expense / CR Cash + Payables
 * - Remittance tracking (CRA, IRS)
 * - Year-end tax slip generation (T4, W-2)
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import { postJournalEntry } from './journal-posting-service.js';

// ============================================================
// Types
// ============================================================

export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
export type PayType = 'SALARY' | 'HOURLY' | 'CONTRACT';
export type PayRunStatus = 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'POSTED' | 'PAID';
export type Jurisdiction = 'CA' | 'US';
export type RemittanceStatus = 'PENDING' | 'SUBMITTED' | 'CONFIRMED';

export interface CreateEmployeeInput {
  entityId: string;
  workforceAssetId?: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  payType: PayType;
  annualSalary?: number;
  hourlyRate?: number;
  currency: string;
  jurisdiction: Jurisdiction;
  startDate: string;
  department?: string;
  sinOrSsn?: string;
}

export interface Employee {
  id: string;
  entity_id: string;
  workforce_asset_id?: string;
  first_name: string;
  last_name: string;
  employee_code: string;
  pay_type: PayType;
  annual_salary: number;
  hourly_rate: number;
  currency: string;
  jurisdiction: Jurisdiction;
  status: EmployeeStatus;
  start_date: string;
  department?: string;
  ytd_gross: number;
  ytd_deductions: number;
  ytd_net: number;
  created_at: string;
  updated_at: string;
}

export interface PayRunInput {
  entityId: string;
  periodId: string;
  payDate: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  description?: string;
}

export interface PayRun {
  id: string;
  entity_id: string;
  period_id: string;
  pay_date: string;
  pay_period_start: string;
  pay_period_end: string;
  status: PayRunStatus;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  employee_count: number;
  journal_entry_id?: string;
  description?: string;
  created_at: string;
}

export interface PayStub {
  id: string;
  pay_run_id: string;
  employee_id: string;
  employee_name: string;
  gross_pay: number;
  deductions: PayDeduction[];
  total_deductions: number;
  net_pay: number;
}

export interface PayDeduction {
  type: string;
  description: string;
  amount: number;
}

export interface TaxSlip {
  type: 'T4' | 'W2';
  year: number;
  employeeId: string;
  employeeName: string;
  employerName: string;
  grossIncome: number;
  incomeTax: number;
  cpp?: number;
  ei?: number;
  fica?: number;
  medicare?: number;
  netPay: number;
}

// ============================================================
// Deduction Rates (simplified — production would use ConfigService)
// ============================================================

const CA_RATES = {
  cpp_rate: 0.0595,
  cpp_max: 3867.50,
  ei_rate: 0.0166,
  ei_max: 1049.12,
  federal_tax_rate: 0.15, // simplified bracket
  provincial_tax_rate: 0.05,
};

const US_RATES = {
  fica_rate: 0.062,
  fica_max: 10453.20,
  medicare_rate: 0.0145,
  federal_tax_rate: 0.22, // simplified bracket
  state_tax_rate: 0.05,
};

function calculateDeductions(grossPay: number, jurisdiction: Jurisdiction, ytdGross: number): PayDeduction[] {
  const deductions: PayDeduction[] = [];

  if (jurisdiction === 'CA') {
    const cppAmount = Math.min(grossPay * CA_RATES.cpp_rate, Math.max(0, CA_RATES.cpp_max - ytdGross * CA_RATES.cpp_rate));
    const eiAmount = Math.min(grossPay * CA_RATES.ei_rate, Math.max(0, CA_RATES.ei_max - ytdGross * CA_RATES.ei_rate));

    deductions.push({ type: 'CPP', description: 'Canada Pension Plan', amount: Math.round(cppAmount * 100) / 100 });
    deductions.push({ type: 'EI', description: 'Employment Insurance', amount: Math.round(eiAmount * 100) / 100 });
    deductions.push({ type: 'FED_TAX', description: 'Federal Income Tax', amount: Math.round(grossPay * CA_RATES.federal_tax_rate * 100) / 100 });
    deductions.push({ type: 'PROV_TAX', description: 'Provincial Income Tax', amount: Math.round(grossPay * CA_RATES.provincial_tax_rate * 100) / 100 });
  } else {
    const ficaAmount = Math.min(grossPay * US_RATES.fica_rate, Math.max(0, US_RATES.fica_max - ytdGross * US_RATES.fica_rate));
    const medicareAmount = grossPay * US_RATES.medicare_rate;

    deductions.push({ type: 'FICA', description: 'Social Security', amount: Math.round(ficaAmount * 100) / 100 });
    deductions.push({ type: 'MEDICARE', description: 'Medicare', amount: Math.round(medicareAmount * 100) / 100 });
    deductions.push({ type: 'FED_TAX', description: 'Federal Income Tax', amount: Math.round(grossPay * US_RATES.federal_tax_rate * 100) / 100 });
    deductions.push({ type: 'STATE_TAX', description: 'State Income Tax', amount: Math.round(grossPay * US_RATES.state_tax_rate * 100) / 100 });
  }

  return deductions;
}

// ============================================================
// Employee CRUD
// ============================================================

export async function createEmployee(input: CreateEmployeeInput): Promise<string> {
  const id = uuid();

  await runCypher(
    `CREATE (e:Employee {
      id: $id, entity_id: $entityId,
      workforce_asset_id: $workforceAssetId,
      first_name: $firstName, last_name: $lastName,
      employee_code: $employeeCode, pay_type: $payType,
      annual_salary: $annualSalary, hourly_rate: $hourlyRate,
      currency: $currency, jurisdiction: $jurisdiction,
      status: 'ACTIVE', start_date: $startDate,
      department: $department,
      ytd_gross: 0, ytd_deductions: 0, ytd_net: 0,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      workforceAssetId: input.workforceAssetId ?? null,
      firstName: input.firstName,
      lastName: input.lastName,
      employeeCode: input.employeeCode,
      payType: input.payType,
      annualSalary: input.annualSalary ?? 0,
      hourlyRate: input.hourlyRate ?? 0,
      currency: input.currency,
      jurisdiction: input.jurisdiction,
      startDate: input.startDate,
      department: input.department ?? null,
    },
  );

  return id;
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const results = await runCypher<{ e: Employee }>(
    `MATCH (e:Employee {id: $id}) RETURN properties(e) AS e`,
    { id },
  );
  return results[0]?.e ?? null;
}

export async function listEmployees(entityId: string, status?: EmployeeStatus): Promise<Employee[]> {
  const statusFilter = status ? ' AND e.status = $status' : '';
  const results = await runCypher<{ e: Employee }>(
    `MATCH (e:Employee {entity_id: $entityId})
     WHERE true ${statusFilter}
     RETURN properties(e) AS e ORDER BY e.last_name, e.first_name`,
    { entityId, status: status ?? null },
  );
  return results.map((r) => r.e);
}

// ============================================================
// Pay Run
// ============================================================

export async function createPayRun(input: PayRunInput): Promise<string> {
  const id = uuid();

  await query(
    `INSERT INTO pay_runs (id, entity_id, period_id, pay_date, pay_period_start,
      pay_period_end, status, total_gross, total_deductions, total_net,
      employee_count, description, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'DRAFT', 0, 0, 0, 0, $7, NOW())`,
    [id, input.entityId, input.periodId, input.payDate,
     input.payPeriodStart, input.payPeriodEnd, input.description ?? null],
  );

  return id;
}

export async function getPayRun(id: string): Promise<PayRun | null> {
  const result = await query('SELECT * FROM pay_runs WHERE id = $1', [id]);
  return (result.rows[0] as PayRun) ?? null;
}

export async function listPayRuns(entityId: string): Promise<PayRun[]> {
  const result = await query(
    'SELECT * FROM pay_runs WHERE entity_id = $1 ORDER BY pay_date DESC',
    [entityId],
  );
  return result.rows as any;
}

export async function calculatePayRun(payRunId: string): Promise<PayStub[]> {
  const payRun = await getPayRun(payRunId);
  if (!payRun) throw new Error(`Pay run ${payRunId} not found`);
  if (payRun.status !== 'DRAFT') throw new Error(`Pay run is ${payRun.status}, must be DRAFT`);

  // Get all active employees for entity
  const employees = await listEmployees(payRun.entity_id, 'ACTIVE');
  const stubs: PayStub[] = [];

  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  for (const emp of employees) {
    let grossPay: number;
    if (emp.pay_type === 'SALARY') {
      // Bi-weekly: annual / 26
      grossPay = Math.round((Number(emp.annual_salary) / 26) * 100) / 100;
    } else {
      // Hourly: assume 80 hours per pay period
      grossPay = Math.round(Number(emp.hourly_rate) * 80 * 100) / 100;
    }

    const deductions = calculateDeductions(grossPay, emp.jurisdiction, Number(emp.ytd_gross));
    const dedTotal = deductions.reduce((s, d) => s + d.amount, 0);
    const netPay = Math.round((grossPay - dedTotal) * 100) / 100;

    const stub: PayStub = {
      id: uuid(),
      pay_run_id: payRunId,
      employee_id: emp.id,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      gross_pay: grossPay,
      deductions,
      total_deductions: Math.round(dedTotal * 100) / 100,
      net_pay: netPay,
    };

    stubs.push(stub);
    totalGross += grossPay;
    totalDeductions += dedTotal;
    totalNet += netPay;

    // Store pay stub in PG
    await query(
      `INSERT INTO pay_stubs (id, pay_run_id, employee_id, employee_name,
        gross_pay, deductions, total_deductions, net_pay, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [stub.id, payRunId, emp.id, stub.employee_name,
       grossPay, JSON.stringify(deductions), stub.total_deductions, netPay],
    );
  }

  // Update pay run totals
  await query(
    `UPDATE pay_runs SET status = 'CALCULATED', total_gross = $1, total_deductions = $2,
      total_net = $3, employee_count = $4 WHERE id = $5`,
    [Math.round(totalGross * 100) / 100, Math.round(totalDeductions * 100) / 100,
     Math.round(totalNet * 100) / 100, employees.length, payRunId],
  );

  return stubs;
}

export async function approvePayRun(payRunId: string): Promise<void> {
  const payRun = await getPayRun(payRunId);
  if (!payRun) throw new Error(`Pay run ${payRunId} not found`);
  if (payRun.status !== 'CALCULATED') throw new Error(`Pay run is ${payRun.status}, must be CALCULATED`);

  await query(`UPDATE pay_runs SET status = 'APPROVED' WHERE id = $1`, [payRunId]);
}

export async function postPayRun(payRunId: string): Promise<string> {
  const payRun = await getPayRun(payRunId);
  if (!payRun) throw new Error(`Pay run ${payRunId} not found`);
  if (payRun.status !== 'APPROVED') throw new Error(`Pay run is ${payRun.status}, must be APPROVED`);

  const totalGross = Number(payRun.total_gross);
  const totalDeductions = Number(payRun.total_deductions);
  const totalNet = Number(payRun.total_net);

  // JE: DR Salary Expense / CR Cash (net) + CR Statutory Payables (deductions)
  const jeId = await postJournalEntry({
    entityId: payRun.entity_id,
    periodId: payRun.period_id,
    entryType: 'OPERATIONAL',
    reference: `PAYROLL-${payRun.pay_date}`,
    narrative: `Payroll for period ${payRun.pay_period_start} to ${payRun.pay_period_end}`,
    currency: 'CAD', // TODO: from entity
    validDate: payRun.pay_date,
    sourceSystem: 'payroll',
    lines: [
      { side: 'DEBIT', amount: totalGross, nodeRefId: payRun.entity_id, nodeRefType: 'ENTITY' as any, economicCategory: 'EXPENSE' },
      { side: 'CREDIT', amount: totalNet, nodeRefId: payRun.entity_id, nodeRefType: 'ENTITY' as any, economicCategory: 'ASSET' },
      { side: 'CREDIT', amount: totalDeductions, nodeRefId: payRun.entity_id, nodeRefType: 'ENTITY' as any, economicCategory: 'LIABILITY' },
    ],
  });

  await query(
    `UPDATE pay_runs SET status = 'POSTED', journal_entry_id = $1 WHERE id = $2`,
    [jeId, payRunId],
  );

  // Update employee YTD amounts
  const stubsResult = await query('SELECT * FROM pay_stubs WHERE pay_run_id = $1', [payRunId]);
  for (const stub of stubsResult.rows as any[]) {
    await runCypher(
      `MATCH (e:Employee {id: $id})
       SET e.ytd_gross = e.ytd_gross + $gross,
           e.ytd_deductions = e.ytd_deductions + $deductions,
           e.ytd_net = e.ytd_net + $net,
           e.updated_at = datetime()`,
      { id: stub.employee_id, gross: Number(stub.gross_pay), deductions: Number(stub.total_deductions), net: Number(stub.net_pay) },
    );
  }

  return jeId;
}

// ============================================================
// Pay Stubs
// ============================================================

export async function getPayStubs(payRunId: string): Promise<PayStub[]> {
  const result = await query(
    'SELECT * FROM pay_stubs WHERE pay_run_id = $1 ORDER BY employee_name',
    [payRunId],
  );
  return result.rows.map((r: any) => ({
    ...r,
    deductions: typeof r.deductions === 'string' ? JSON.parse(r.deductions) : r.deductions,
  }));
}

// ============================================================
// Remittances
// ============================================================

export async function createRemittance(
  entityId: string,
  remittanceType: string,
  amount: number,
  periodId: string,
  dueDate: string,
): Promise<string> {
  const id = uuid();
  await query(
    `INSERT INTO payroll_remittances (id, entity_id, remittance_type, amount, period_id, due_date, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW())`,
    [id, entityId, remittanceType, amount, periodId, dueDate],
  );
  return id;
}

export async function listRemittances(entityId: string, status?: RemittanceStatus): Promise<any[]> {
  let sql = 'SELECT * FROM payroll_remittances WHERE entity_id = $1';
  const params: unknown[] = [entityId];
  if (status) {
    sql += ' AND status = $2';
    params.push(status);
  }
  sql += ' ORDER BY due_date';
  const result = await query(sql, params);
  return result.rows as any;
}

// ============================================================
// Tax Slips (T4 / W-2)
// ============================================================

export async function generateTaxSlips(entityId: string, year: number): Promise<TaxSlip[]> {
  const employees = await runCypher<{ e: Employee }>(
    `MATCH (e:Employee {entity_id: $entityId})
     WHERE e.status IN ['ACTIVE', 'TERMINATED']
       AND e.ytd_gross > 0
     RETURN properties(e) AS e`,
    { entityId },
  );

  const entity = await runCypher<{ name: string }>(
    `MATCH (ent:Entity {id: $entityId}) RETURN ent.legal_name AS name`,
    { entityId },
  );
  const employerName = entity[0]?.name ?? 'Unknown';

  return employees.map((r) => {
    const emp = r.e;
    const grossIncome = Number(emp.ytd_gross);
    const totalDeductions = Number(emp.ytd_deductions);
    const netPay = Number(emp.ytd_net);

    if (emp.jurisdiction === 'CA') {
      return {
        type: 'T4' as const,
        year,
        employeeId: emp.id,
        employeeName: `${emp.first_name} ${emp.last_name}`,
        employerName,
        grossIncome,
        incomeTax: Math.round(grossIncome * (CA_RATES.federal_tax_rate + CA_RATES.provincial_tax_rate) * 100) / 100,
        cpp: Math.min(Math.round(grossIncome * CA_RATES.cpp_rate * 100) / 100, CA_RATES.cpp_max),
        ei: Math.min(Math.round(grossIncome * CA_RATES.ei_rate * 100) / 100, CA_RATES.ei_max),
        netPay,
      };
    } else {
      return {
        type: 'W2' as const,
        year,
        employeeId: emp.id,
        employeeName: `${emp.first_name} ${emp.last_name}`,
        employerName,
        grossIncome,
        incomeTax: Math.round(grossIncome * (US_RATES.federal_tax_rate + US_RATES.state_tax_rate) * 100) / 100,
        fica: Math.min(Math.round(grossIncome * US_RATES.fica_rate * 100) / 100, US_RATES.fica_max),
        medicare: Math.round(grossIncome * US_RATES.medicare_rate * 100) / 100,
        netPay,
      };
    }
  });
}
