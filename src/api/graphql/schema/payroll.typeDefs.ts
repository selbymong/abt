export const payrollTypeDefs = `
  type Employee {
    id: String!
    entity_id: String!
    workforce_asset_id: String
    first_name: String!
    last_name: String!
    employee_code: String!
    pay_type: String!
    annual_salary: Float!
    hourly_rate: Float!
    currency: String!
    jurisdiction: String!
    status: String!
    start_date: String!
    department: String
    ytd_gross: Float!
    ytd_deductions: Float!
    ytd_net: Float!
    created_at: String
    updated_at: String
  }

  type PayRun {
    id: String!
    entity_id: String!
    period_id: String!
    pay_date: String!
    pay_period_start: String!
    pay_period_end: String!
    status: String!
    total_gross: Float!
    total_deductions: Float!
    total_net: Float!
    employee_count: Int!
    journal_entry_id: String
    description: String
    created_at: String
  }

  type PayDeduction {
    type: String!
    description: String!
    amount: Float!
  }

  type PayStub {
    id: String!
    pay_run_id: String!
    employee_id: String!
    employee_name: String!
    gross_pay: Float!
    deductions: [PayDeduction!]!
    total_deductions: Float!
    net_pay: Float!
  }

  type TaxSlip {
    type: String!
    year: Int!
    employeeId: String!
    employeeName: String!
    employerName: String!
    grossIncome: Float!
    incomeTax: Float!
    cpp: Float
    ei: Float
    fica: Float
    medicare: Float
    netPay: Float!
  }

  input CreateEmployeeInput {
    entityId: String!
    workforceAssetId: String
    firstName: String!
    lastName: String!
    employeeCode: String!
    payType: String!
    annualSalary: Float
    hourlyRate: Float
    currency: String!
    jurisdiction: String!
    startDate: String!
    department: String
  }

  input CreatePayRunInput {
    entityId: String!
    periodId: String!
    payDate: String!
    payPeriodStart: String!
    payPeriodEnd: String!
    description: String
  }

  extend type Query {
    employee(id: ID!): Employee
    employees(entityId: String!, status: String): [Employee!]!
    payRun(id: ID!): PayRun
    payRuns(entityId: String!): [PayRun!]!
    payStubs(payRunId: String!): [PayStub!]!
    taxSlips(entityId: String!, year: Int!): [TaxSlip!]!
  }

  extend type Mutation {
    createEmployee(input: CreateEmployeeInput!): Employee!
    createPayRun(input: CreatePayRunInput!): String!
    calculatePayRun(payRunId: String!): [PayStub!]!
    approvePayRun(payRunId: String!): String!
    postPayRun(payRunId: String!): String!
  }
`;
