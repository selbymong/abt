// AI domain GraphQL type definitions
// Covers: weight learner, epistemic scorer, scenario engine, graph queries, vector embedder

export const aiTypeDefs = `
  # ============================================================
  # Weight Learner Types
  # ============================================================

  type RealizationResult {
    accuracy: Float!
    edgesUpdated: Int!
    calibrationBefore: Float!
    calibrationAfter: Float!
  }

  type EffectiveStakeResult {
    nodeId: String!
    nodeLabel: String!
    ciPointEstimate: Float!
    valueState: ValueState!
    stateDiscount: Float!
    calibrationFactor: Float!
    ciWidthPenalty: Float!
    effectiveStake: Float!
    blocked: Boolean!
  }

  type EffectiveContributionResult {
    sourceId: String!
    targetId: String!
    weight: Float!
    temporalValuePct: Float!
    controlScore: Float!
    effectiveContribution: Float!
  }

  type CalibrationHistory {
    periodId: String!
    outcomeType: String!
    accuracy: Float!
    calibrationBefore: Float!
    calibrationAfter: Float!
    computedAt: String!
  }

  # ============================================================
  # Epistemic Scorer Types
  # ============================================================

  type EVOIResult {
    nodeId: String!
    nodeLabel: String!
    nodeType: String!
    valueState: ValueState!
    ciPointEstimate: Float!
    currentEffectiveStake: Float!
    nextState: ValueState
    nextEffectiveStake: Float!
    uncertaintyReduction: Float!
    evoi: Float!
    recommendedAction: String!
  }

  type EpistemicROI {
    nodeId: String!
    nodeLabel: String!
    activityCost: Float!
    informationValue: Float!
    roi: Float!
    justified: Boolean!
  }

  type StaleEstimate {
    nodeId: String!
    label: String!
    expiresAt: String!
  }

  # ============================================================
  # Scenario Engine Types
  # ============================================================

  type ScenarioSet {
    id: String!
    node_id: String!
    entity_id: String!
    label: String!
    base_value: Float!
    scenarios: JSON!
    created_at: String
    updated_at: String
  }

  type MonteCarloResult {
    scenarioSetId: String!
    nodeId: String!
    baseValue: Float!
    simulations: Int!
    mean: Float!
    median: Float!
    stdDev: Float!
    p5: Float!
    p25: Float!
    p50: Float!
    p75: Float!
    p95: Float!
    min: Float!
    max: Float!
    expectedValue: Float!
    tailRisk: Float!
    distribution: [Float!]!
  }

  type NodeRiskProfile {
    nodeId: String!
    nodeLabel: String!
    controlClass: ControlClass!
    baseValue: Float!
    expectedValue: Float!
    tailRisk: Float!
    p5: Float!
    p95: Float!
    riskAdjustedValue: Float!
  }

  type EntityRiskProfile {
    profiles: [NodeRiskProfile!]!
  }

  # ============================================================
  # Graph Query Types
  # ============================================================

  type PathStep {
    nodeId: String!
    nodeLabel: String!
    nodeType: String!
    weight: Float!
    confidence: Float!
    temporalValuePct: Float!
    contributionFunction: String!
    effectiveContribution: Float!
  }

  type PathResult {
    path: [PathStep!]!
    totalEffectiveContribution: Float!
    pathLength: Int!
  }

  type TopContributor {
    activityId: String!
    activityLabel: String!
    effectiveContribution: Float!
    pathLength: Int!
    controlScore: Float!
  }

  type GraphQueryResult {
    intentType: String!
    data: JSON!
  }

  type NodeCountEntry {
    label: String!
    count: Int!
  }

  type EdgeCountEntry {
    type: String!
    count: Int!
  }

  type OutcomeSummary {
    id: String!
    label: String!
    outcomeType: String!
    valueState: String!
  }

  type GraphSummary {
    nodeCounts: [NodeCountEntry!]!
    edgeCounts: [EdgeCountEntry!]!
    outcomes: [OutcomeSummary!]!
  }

  # ============================================================
  # Vector Embedder Types
  # ============================================================

  type EmbeddingResult {
    nodeId: String!
    dimension: Int!
  }

  type SimilarityResult {
    sourceId: String!
    targetId: String!
    cosineSimilarity: Float!
    sourceLabel: String!
    targetLabel: String!
  }

  type EdgeCandidate {
    sourceId: String!
    targetId: String!
    cosineSimilarity: Float!
    sourceLabel: String!
    targetLabel: String!
  }

  type BulkEmbedResult {
    embedded: Int!
    nodeLabels: [String!]!
  }

  type InferredEdgesResult {
    created: Int!
    edgeIds: [String!]!
  }

  type EdgeDiscoveryPipelineResult {
    embedded: Int!
    candidates: [EdgeCandidate!]!
    created: Int!
    edgeIds: [String!]!
  }

  # ============================================================
  # Input Types
  # ============================================================

  input RecordRealizationInput {
    outcomeId: String!
    realizedDelta: Float!
    periodId: String!
  }

  input TransitionValueStateInput {
    nodeId: String!
    newState: ValueState!
    epistemicActivityId: String
  }

  input ScenarioInput {
    label: String!
    probability: Float!
    impactMultiplier: Float!
    description: String
  }

  input CreateScenarioSetInput {
    nodeId: String!
    label: String!
    scenarios: [ScenarioInput!]!
    baseValue: Float!
  }

  input EdgeDiscoveryPipelineOptions {
    threshold: Float
    limit: Int
    autoCreate: Boolean
  }

  # ============================================================
  # Queries
  # ============================================================

  extend type Query {
    # Weight Learner
    effectiveStake(nodeId: String!): EffectiveStakeResult
    effectiveContribution(edgeSourceId: String!, edgeTargetId: String): [EffectiveContributionResult!]!
    calibrationHistory(entityId: String!, outcomeType: String): [CalibrationHistory!]!

    # Epistemic Scorer
    evoi(nodeId: String!): EVOIResult
    entityEVOIs(entityId: String!, threshold: Float): [EVOIResult!]!
    staleEstimates(entityId: String!): [StaleEstimate!]!

    # Scenario Engine
    scenarioSet(id: String!): ScenarioSet
    scenarioSets(nodeId: String!): [ScenarioSet!]!
    entityRiskProfile(entityId: String!): EntityRiskProfile!

    # Graph Queries
    graphPaths(nodeId: String!, entityId: String, maxHops: Int): [PathResult!]!
    topContributors(outcomeId: String!, limit: Int): [TopContributor!]!
    graphQuery(query: String!): GraphQueryResult!
    graphSummary(entityId: String!): GraphSummary!

    # Vector Embedder
    embedding(nodeId: String!): EmbeddingResult
    similarNodes(nodeId: String!, limit: Int, threshold: Float): [SimilarityResult!]!
  }

  # ============================================================
  # Mutations
  # ============================================================

  extend type Mutation {
    # Weight Learner
    recordRealization(input: RecordRealizationInput!): RealizationResult!
    transitionValueState(input: TransitionValueStateInput!): Boolean!

    # Epistemic Scorer
    updateEpistemicPriorities(entityId: String!): Int!
    downgradeStaleEstimates(entityId: String!): Int!

    # Scenario Engine
    createScenarioSet(input: CreateScenarioSetInput!): String!
    runMonteCarlo(scenarioSetId: String!, simulations: Int): MonteCarloResult
    fireScenario(scenarioSetId: String!, scenarioLabel: String!, actualImpact: Float!): Boolean!

    # Vector Embedder
    generateEmbedding(nodeId: String!, entityId: String!, nodeLabel: String!): EmbeddingResult!
    embedEntityNodes(entityId: String!): BulkEmbedResult!
    discoverEdgeCandidates(entityId: String!, threshold: Float, limit: Int): [EdgeCandidate!]!
    createInferredEdges(candidates: [EdgeCandidateInput!]!, entityId: String!): InferredEdgesResult!
    runEdgeDiscoveryPipeline(entityId: String!, options: EdgeDiscoveryPipelineOptions): EdgeDiscoveryPipelineResult!
  }

  input EdgeCandidateInput {
    sourceId: String!
    targetId: String!
    cosineSimilarity: Float!
    sourceLabel: String!
    targetLabel: String!
  }
`;
