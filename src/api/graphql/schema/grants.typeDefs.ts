export const grantsTypeDefs = `
  type GrantSummary {
    id: ID!
    entity_id: String!
    grant_program_name: String!
    grant_approach: String!
    original_amount: Float!
    recognized_to_date: Float!
    remaining: Float!
    condition_met: Boolean!
    clawback_probability: Float!
    clawback_amount: Float!
    status: String!
    created_at: String!
  }

  type GrantRecognitionResult {
    grantId: String!
    periodId: String!
    amountRecognized: Float!
    journalEntryId: String!
    approach: String!
  }

  type ClawbackAssessmentResult {
    grantId: String!
    clawbackProbability: Float!
    clawbackAmount: Float!
    provisionRequired: Boolean!
    provisionAmount: Float!
  }

  input CreateGrantInput {
    entityId: String!
    grantProgramName: String!
    amount: Float!
    currency: String!
    approach: String!
    recognitionMethod: String!
    recognitionSchedule: [RecognitionScheduleInput!]!
    sourceNodeId: String!
    sourceNodeType: String!
    periodIdOpened: String!
    conditionDescription: String
    relatedAssetId: String
    fundId: String
  }

  input RecognitionScheduleInput {
    period_id: String!
    amount: Float!
  }

  extend type Query {
    grant(id: ID!): GrantSummary
    grants(entityId: String!, status: String): [GrantSummary!]!
  }

  extend type Mutation {
    createGrant(input: CreateGrantInput!): ID!
    recognizeGrantIncome(grantId: String!, periodId: String!): GrantRecognitionResult!
    markGrantConditionMet(grantId: String!): Boolean!
    assessGrantClawback(grantId: String!, probability: Float!, amount: Float!): ClawbackAssessmentResult!
  }
`;
