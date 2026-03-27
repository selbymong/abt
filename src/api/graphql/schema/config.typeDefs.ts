export const configTypeDefs = `
  type ConfigurationSetting {
    id: ID!
    setting_key: String!
    scope_type: String!
    scope_id: String
    value_string: String
    value_numeric: Float
    value_boolean: Boolean
    value_json: JSON
    valid_from: String!
    valid_until: String
  }

  input SetConfigInput {
    key: String!
    scopeType: String!
    scopeId: String
    scopeId2: String
    valueType: String!
    valueString: String
    valueNumeric: Float
    valueBoolean: Boolean
    valueJson: JSON
    validFrom: String!
    validUntil: String
    changedBy: String!
    changeReason: String
    requiresRestatement: Boolean
  }

  extend type Query {
    config(key: String!, entityId: String, entityPairId: String): ConfigurationSetting
    configHistory(key: String!): [ConfigurationSetting!]!
  }

  extend type Mutation {
    setConfig(input: SetConfigInput!): ConfigurationSetting!
  }
`;
