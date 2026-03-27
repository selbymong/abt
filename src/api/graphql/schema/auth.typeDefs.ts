export const authTypeDefs = `
  type AuthUser {
    id: String!
    email: String!
    first_name: String!
    last_name: String!
    role: String!
    status: String!
    entity_ids: [String!]!
    last_login: String
    created_at: String
    updated_at: String
  }

  type AuthToken {
    token: String!
    userId: String!
    email: String!
    role: String!
    entityIds: [String!]!
    expiresAt: Float!
  }

  type PermissionEntry {
    resource: String!
    actions: [String!]!
  }

  input CreateUserInput {
    email: String!
    firstName: String!
    lastName: String!
    role: String!
    entityIds: [String!]!
    password: String!
  }

  extend type Query {
    authUser(id: ID!): AuthUser
    authUsers(role: String, status: String): [AuthUser!]!
    rolePermissions(role: String!): [PermissionEntry!]!
    checkPermission(role: String!, resource: String!, action: String!): Boolean!
  }

  extend type Mutation {
    createAuthUser(input: CreateUserInput!): AuthUser!
    login(email: String!, password: String!): AuthToken!
    updateAuthUser(id: String!, role: String, status: String, entityIds: [String!]): AuthUser!
  }
`;
