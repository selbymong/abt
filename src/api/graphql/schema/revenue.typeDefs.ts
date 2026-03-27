export const revenueTypeDefs = `
  type RevenueContract {
    id: ID!
    entity_id: String!
    label: String!
    customer_name: String!
    customer_id: String
    contract_status: ContractStatus!
    inception_date: String!
    completion_date: String
    transaction_price: Float!
    allocated_transaction_price: Float!
    variable_consideration_estimate: Float!
    constraint_applied: Boolean!
    currency: String!
    period_id: String!
    total_revenue_recognized: Float!
    contract_asset: Float!
    contract_liability: Float!
    created_at: DateTime
    updated_at: DateTime
  }

  type PerformanceObligation {
    id: ID!
    entity_id: String!
    contract_id: String!
    label: String!
    standalone_selling_price: Float!
    allocated_transaction_price: Float!
    satisfaction_method: POSatisfactionMethod!
    over_time_measure: OverTimeMeasure
    progress_pct: Float!
    revenue_recognized: Float!
    is_distinct: Boolean!
    is_satisfied: Boolean!
    satisfied_date: String
    created_at: DateTime
    updated_at: DateTime
  }

  type VariableConsideration {
    id: ID!
    entity_id: String!
    contract_id: String!
    consideration_type: VariableConsiderationType!
    estimate_method: ConstraintEstimateMethod!
    estimated_amount: Float!
    constraint_adjusted_amount: Float!
    constraint_reason: String
    is_constrained: Boolean!
    resolved_amount: Float
    resolved: Boolean!
    created_at: DateTime
    updated_at: DateTime
  }

  type AllocationEntry {
    poId: String!
    label: String!
    ssp: Float!
    allocated: Float!
  }

  type AllocationResult {
    contractTransactionPrice: Float!
    variableConsideration: Float!
    totalAllocatable: Float!
    allocations: [AllocationEntry!]!
  }

  type ContractSummary {
    contract: RevenueContract!
    performanceObligations: [PerformanceObligation!]!
    variableConsiderations: [VariableConsideration!]!
    totalSSP: Float!
    totalAllocated: Float!
    totalRecognized: Float!
    completionPct: Float!
  }

  type PointInTimeResult {
    journalEntryId: String!
    revenueAmount: Float!
  }

  type OverTimeResult {
    journalEntryId: String
    revenueAmount: Float!
    cumulativeRevenue: Float!
  }

  input CreateRevenueContractInput {
    entityId: String!
    label: String!
    customerName: String!
    customerId: String
    inceptionDate: String!
    transactionPrice: Float!
    currency: String!
    periodId: String!
  }

  input CreatePerformanceObligationInput {
    entityId: String!
    contractId: String!
    label: String!
    standaloneSellingPrice: Float!
    satisfactionMethod: POSatisfactionMethod!
    overTimeMeasure: OverTimeMeasure
    isDistinct: Boolean
  }

  input CreateVariableConsiderationInput {
    entityId: String!
    contractId: String!
    considerationType: VariableConsiderationType!
    estimateMethod: ConstraintEstimateMethod!
    estimatedAmount: Float!
    isConstrained: Boolean
    constraintReason: String
  }

  extend type Query {
    revenueContract(id: ID!): RevenueContract
    revenueContracts(entityId: String!, status: ContractStatus): [RevenueContract!]!
    performanceObligation(id: ID!): PerformanceObligation
    performanceObligations(contractId: String!): [PerformanceObligation!]!
    contractSummary(contractId: String!): ContractSummary!
  }

  extend type Mutation {
    createRevenueContract(input: CreateRevenueContractInput!): ID!
    activateContract(id: ID!): RevenueContract!
    createPerformanceObligation(input: CreatePerformanceObligationInput!): ID!
    recognizePointInTime(poId: ID!, periodId: String!, satisfiedDate: String!): PointInTimeResult!
    recognizeOverTime(poId: ID!, periodId: String!, progressPct: Float!, validDate: String!): OverTimeResult!
    allocateTransactionPrice(contractId: String!): AllocationResult!
    createVariableConsideration(input: CreateVariableConsiderationInput!): ID!
    resolveVariableConsideration(id: ID!, resolvedAmount: Float!): VariableConsideration!
  }
`;
