// GraphQL type definitions for the Graph domain (business graph nodes and edges)

export const graphTypeDefs = `
  # ============================================================
  # Core Graph Node Types
  # ============================================================

  type Entity {
    id: ID!
    label: String!
    entity_type: EntityType!
    tax_status: TaxStatus!
    reporting_framework: ReportingFramework!
    jurisdiction: String!
    functional_currency: String!
    outcome_ontology: OutcomeOntology!
    fund_accounting_enabled: Boolean!
    registration_number: String
    fiscal_year_end: String!
    consolidation_method: ConsolidationMethod!
    ownership_pct: Float!
    nci_pct: Float!
    is_parent: Boolean!
    consolidation_group_id: String
    acquisition_date: String
    reporting_lag_days: Int!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type Outcome {
    id: ID!
    label: String!
    entity_id: String!
    ontology: OutcomeOntology!
    outcome_type: OutcomeType!
    measurement_unit: String
    stream_id: String
    target_delta: Float!
    realized_delta: Float!
    currency: String!
    period_start: String!
    period_end: String!
    value_state: ValueState
    uncertainty_type: UncertaintyType
    uncertainty_score: Float
    control_class: ControlClass
    control_score: Float
    created_at: DateTime!
    updated_at: DateTime!
  }

  type BusinessNode {
    id: ID!
    label: String!
    entity_id: String
    properties: JSON!
    created_at: DateTime
    updated_at: DateTime
  }

  type Activity {
    id: ID!
    label: String!
    entity_id: String!
    status: NodeStatus
    cost_monetary: Float
    cost_time_hours: Float
    start_date: String
    end_date: String
    project_id: String
    initiative_id: String
    created_at: DateTime
    updated_at: DateTime
  }

  type SocialConstraint {
    id: ID!
    label: String!
    entity_id: String!
    constraint_type: String!
    violation_risk_score: Float!
    rationale: String!
    created_at: DateTime
    updated_at: DateTime
  }

  type Obligation {
    id: ID!
    label: String!
    entity_id: String!
    obligation_type: String!
    due_date: String!
    status: String!
    non_compliance_risk: Float!
    penalty_exposure: Float!
    recurrence: String
    created_at: DateTime
    updated_at: DateTime
  }

  type CashFlowEventNode {
    id: ID!
    label: String!
    entity_id: String!
    direction: CashFlowDirection!
    amount: Float!
    currency: String!
    scheduled_date: String!
    status: CashFlowStatus!
    created_at: DateTime
    updated_at: DateTime
  }

  type AccountingPeriodNode {
    id: ID!
    label: String!
    entity_id: String!
    start_date: String!
    end_date: String!
    status: PeriodStatus!
    soft_closed_at: DateTime
    hard_closed_at: DateTime
    closed_by: String
    created_at: DateTime
    updated_at: DateTime
  }

  type FundNode {
    id: ID!
    label: String!
    entity_id: String!
    fund_type: FundType!
    restriction_description: String
    restriction_expiry: String
    restriction_purpose: String
    created_at: DateTime
    updated_at: DateTime
  }

  # ============================================================
  # Edge Types
  # ============================================================

  type ContributesToEdge {
    sourceId: ID!
    targetId: ID!
    sourceLabel: String!
    targetLabel: String!
    weight: Float!
    confidence: Float!
    lag_days: Int!
    temporal_value_pct: Float!
    ai_inferred: Boolean!
    contribution_function: ContributionFunction!
    threshold_value: Float
    elasticity: Float
    is_cross_asset_edge: Boolean!
    ontology_bridge: Boolean!
  }

  type DependsOnEdge {
    sourceId: ID!
    targetId: ID!
    sourceLabel: String!
    targetLabel: String!
    dependency_class: DependencyClass!
    dependency_description: String!
  }

  type DelegatesToEdge {
    sourceId: ID!
    targetId: ID!
    sourceLabel: String!
    targetLabel: String!
    control_attenuation: Float!
    sla_reference: String
  }

  type ImpactPath {
    activity_id: ID!
    activity: String!
    outcome_id: ID!
    outcome: String!
    outcome_type: String!
    ontology: String!
    path_contribution: Float!
    total_lag: Int!
    path_length: Int!
  }

  type OrphanedActivity {
    id: ID!
    label: String!
    cost_monetary: Float!
    status: String!
  }

  # ============================================================
  # Input Types
  # ============================================================

  input CreateEntityInput {
    label: String!
    entity_type: EntityType!
    tax_status: TaxStatus!
    reporting_framework: ReportingFramework!
    jurisdiction: String!
    functional_currency: String!
    outcome_ontology: OutcomeOntology!
    fund_accounting_enabled: Boolean!
    fiscal_year_end: String!
    consolidation_method: ConsolidationMethod
    ownership_pct: Float
    nci_pct: Float
    is_parent: Boolean
    registration_number: String
    reporting_lag_days: Int
  }

  input CreateOutcomeInput {
    entityId: String!
    label: String!
    ontology: OutcomeOntology!
    outcomeType: OutcomeType!
    targetDelta: Float!
    currency: String!
    periodStart: String!
    periodEnd: String!
    measurementUnit: String
    streamId: String
  }

  input CreateNodeInput {
    entityId: String!
    label: String!
    properties: JSON
  }

  input UpdateNodeInput {
    properties: JSON!
  }

  input CreateContributesToEdgeInput {
    sourceId: String!
    targetId: String!
    weight: Float!
    confidence: Float!
    lagDays: Int
    contributionFunction: ContributionFunction
    thresholdValue: Float
    elasticity: Float
    isCrossAssetEdge: Boolean
    aiInferred: Boolean
  }

  input CreateDependsOnEdgeInput {
    sourceId: String!
    targetId: String!
    dependencyClass: DependencyClass!
    description: String!
  }

  input CreateDelegatesToEdgeInput {
    sourceId: String!
    targetId: String!
    controlAttenuation: Float!
    slaReference: String
  }

  input CreateProhibitsEdgeInput {
    constraintId: String!
    activityId: String!
    severity: Float!
  }

  input UpdateEdgeInput {
    sourceId: String!
    targetId: String!
    properties: JSON!
  }

  input DeleteEdgeInput {
    sourceId: String!
    targetId: String!
  }

  # ============================================================
  # Queries
  # ============================================================

  extend type Query {
    entity(id: ID!): Entity
    entities: [Entity!]!
    node(label: String!, id: ID!): BusinessNode
    nodesByEntity(label: String!, entityId: String!): [BusinessNode!]!
    outcomes(entityId: String!): [Outcome!]!
    edges(edgeType: String!, sourceId: String!): [JSON!]!
    impactPaths(entityId: String!): [ImpactPath!]!
    orphanedActivities(entityId: String!): [OrphanedActivity!]!
  }

  # ============================================================
  # Mutations
  # ============================================================

  extend type Mutation {
    createEntity(input: CreateEntityInput!): Entity!
    createOutcome(input: CreateOutcomeInput!): Outcome!
    createNode(label: String!, input: CreateNodeInput!): BusinessNode!
    updateNode(label: String!, id: ID!, input: UpdateNodeInput!): Boolean!
    deleteNode(label: String!, id: ID!): Boolean!
    createContributesToEdge(input: CreateContributesToEdgeInput!): Boolean!
    createDependsOnEdge(input: CreateDependsOnEdgeInput!): Boolean!
    createDelegatesToEdge(input: CreateDelegatesToEdgeInput!): Boolean!
    createProhibitsEdge(input: CreateProhibitsEdgeInput!): Boolean!
    updateEdge(edgeType: String!, input: UpdateEdgeInput!): Boolean!
    deleteEdge(edgeType: String!, input: DeleteEdgeInput!): Boolean!
  }
`;
