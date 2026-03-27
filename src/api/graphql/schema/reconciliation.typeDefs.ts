export const reconciliationTypeDefs = `
  type ReconciliationDiscrepancy {
    entity_id: String!
    period_id: String!
    neo4j_debit: Float!
    neo4j_credit: Float!
    pg_debit: Float!
    pg_credit: Float!
    debit_difference: Float!
    credit_difference: Float!
  }

  type ReconciliationRun {
    id: ID!
    run_date: String!
    status: String!
    entity_id_filter: String
    period_id_filter: String
    total_pairs_checked: Int!
    balanced_count: Int!
    discrepancy_count: Int!
    tolerance: Float!
    discrepancies: [ReconciliationDiscrepancy!]!
    duration_ms: Int!
    error_message: String
    created_at: String!
  }

  type ReconciliationRunSummary {
    id: ID!
    run_date: String!
    status: String!
    entity_id_filter: String
    period_id_filter: String
    total_pairs_checked: Int!
    balanced_count: Int!
    discrepancy_count: Int!
    tolerance: Float!
    duration_ms: Int!
    created_at: String!
  }

  extend type Query {
    reconciliationRun(id: ID!): ReconciliationRun
    reconciliationRuns(limit: Int, entityId: String): [ReconciliationRunSummary!]!
    latestReconciliationRun(entityId: String): ReconciliationRun
  }

  extend type Mutation {
    runReconciliation(entityId: String, periodId: String, tolerance: Float): ReconciliationRun!
  }
`;
