export const complianceTypeDefs = `
  type ApprovalWorkflow {
    id: ID!
    entity_id: String!
    target_node_id: String!
    target_node_type: String!
    workflow_status: String!
    requested_by: String!
    requested_at: DateTime!
    approved_by: String
    approved_at: DateTime
    rejected_by: String
    rejected_at: DateTime
    rejection_reason: String
    approval_level: Int!
    required_level: Int!
    narrative: String
    created_at: DateTime
    updated_at: DateTime
  }

  type SourceDocument {
    id: ID!
    entity_id: String!
    document_type: String!
    reference: String!
    file_path: String
    hash: String
    verified: Boolean!
    verified_at: DateTime
    verified_by: String
    linked_node_id: String
    linked_node_type: String
    narrative: String
    created_at: DateTime
    updated_at: DateTime
  }

  type AccessLogEntry {
    id: ID!
    user_id: String!
    action: String!
    resource_type: String!
    resource_id: String!
    sensitivity_level: String!
    ip_address: String
    timestamp: DateTime!
    metadata: JSON
  }

  input AccessLogFilters {
    userId: String
    action: String
    resourceType: String
    resourceId: String
    since: DateTime
    until: DateTime
    limit: Int
  }

  input CreateApprovalWorkflowInput {
    entityId: String!
    targetNodeId: String!
    targetNodeType: String!
    requestedBy: String!
    requiredLevel: Int!
    narrative: String
  }

  input CreateSourceDocumentInput {
    entityId: String!
    documentType: String!
    reference: String!
    filePath: String
    hash: String
    linkedNodeId: String
    linkedNodeType: String
    narrative: String
  }

  input LogAccessInput {
    userId: String!
    action: String!
    resourceType: String!
    resourceId: String!
    sensitivityLevel: String!
    ipAddress: String
    metadata: JSON
  }

  extend type Query {
    approvalWorkflow(id: ID!): ApprovalWorkflow
    pendingApprovals(targetNodeType: String): [ApprovalWorkflow!]!
    sourceDocument(id: ID!): SourceDocument
    accessLogs(filters: AccessLogFilters): [AccessLogEntry!]!
    highSensitivityAccess(since: DateTime!): [AccessLogEntry!]!
  }

  extend type Mutation {
    createApprovalWorkflow(input: CreateApprovalWorkflowInput!): ID!
    approveWorkflow(id: ID!, approvedBy: String!): ApprovalWorkflow!
    rejectWorkflow(id: ID!, rejectedBy: String!, reason: String!): ApprovalWorkflow!
    createSourceDocument(input: CreateSourceDocumentInput!): ID!
    verifyDocument(id: ID!, verifiedBy: String!): SourceDocument!
    logAccess(input: LogAccessInput!): ID!
  }
`;
