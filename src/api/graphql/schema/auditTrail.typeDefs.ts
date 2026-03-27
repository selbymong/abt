export const auditTrailTypeDefs = `
  type AuditChange {
    field: String!
    oldValue: JSON
    newValue: JSON
  }

  type AuditEntry {
    id: String!
    entityId: String
    action: String!
    nodeType: String!
    nodeId: String!
    userId: String!
    timestamp: String!
    reason: String
    beforeSnapshot: JSON
    afterSnapshot: JSON
    changes: [AuditChange!]!
    sensitivity: Int!
  }

  type AuditStats {
    totalEntries: Int!
    byAction: JSON!
    byNodeType: JSON!
    byUser: JSON!
  }

  input RecordAuditInput {
    entityId: String
    action: String!
    nodeType: String!
    nodeId: String!
    userId: String!
    reason: String
    beforeSnapshot: JSON
    afterSnapshot: JSON
    sensitivity: Int
  }

  extend type Query {
    auditEntry(id: ID!): AuditEntry
    nodeAuditHistory(nodeId: String!, limit: Int, offset: Int): [AuditEntry!]!
    entityAuditLog(
      entityId: String!
      action: String
      nodeType: String
      userId: String
      startDate: String
      endDate: String
      limit: Int
      offset: Int
    ): [AuditEntry!]!
    userAuditLog(userId: String!, limit: Int, offset: Int): [AuditEntry!]!
    auditStats(entityId: String!, startDate: String, endDate: String): AuditStats!
  }

  extend type Mutation {
    recordAudit(input: RecordAuditInput!): AuditEntry!
  }
`;
