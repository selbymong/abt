export const intercoLoanTypeDefs = `
  type IntercoLoan {
    id: String!
    lender_entity_id: String!
    borrower_entity_id: String!
    principal_amount: Float!
    principal_outstanding: Float!
    currency: String!
    interest_rate: Float!
    start_date: String!
    maturity_date: String!
    amortization_type: String!
    payment_frequency_months: Int!
    withholding_tax_rate: Float!
    status: String!
    description: String
    created_at: String
    updated_at: String
  }

  type AmortizationEntry {
    id: String!
    loan_id: String!
    period_number: Int!
    payment_date: String!
    principal_payment: Float!
    interest_payment: Float!
    total_payment: Float!
    principal_remaining: Float!
    status: String!
  }

  type InterestAccrualResult {
    borrowerJeId: String!
    lenderJeId: String!
  }

  type RepaymentResult {
    borrowerJeId: String!
    lenderJeId: String!
    newStatus: String!
  }

  input CreateIntercoLoanInput {
    lenderEntityId: String!
    borrowerEntityId: String!
    principalAmount: Float!
    currency: String!
    interestRate: Float!
    startDate: String!
    maturityDate: String!
    amortizationType: String!
    paymentFrequencyMonths: Int!
    withholdingTaxRate: Float
    description: String
  }

  extend type Query {
    intercoLoan(id: ID!): IntercoLoan
    intercoLoans(entityId: String!, role: String): [IntercoLoan!]!
    amortizationSchedule(loanId: String!): [AmortizationEntry!]!
  }

  extend type Mutation {
    createIntercoLoan(input: CreateIntercoLoanInput!): IntercoLoan!
    activateIntercoLoan(loanId: String!): [AmortizationEntry!]!
    accrueIntercoInterest(loanId: String!, periodId: String!, accrualDate: String!): InterestAccrualResult!
    recordIntercoRepayment(loanId: String!, periodId: String!, paymentDate: String!): RepaymentResult!
    eliminateIntercoLoan(loanId: String!, periodId: String!, asOfDate: String!): String!
  }
`;
