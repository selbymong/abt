export const xbrlTypeDefs = `
  type XBRLTag {
    element: String!
    taxonomy: String!
    label: String!
    dataType: String!
    periodType: String!
    balance: String
  }

  type XBRLFact {
    element: String!
    taxonomy: String!
    value: Float!
    unit: String!
    periodType: String!
    context: String!
    decimals: Int
  }

  type XBRLFactsResult {
    entityId: String!
    periodId: String!
    taxonomy: String!
    facts: [XBRLFact!]!
    factCount: Int!
  }

  type XBRLValidationResult {
    jurisdiction: String!
    totalMappings: Int!
    taggedMappings: Int!
    untaggedMappings: Int!
    coveragePct: Float!
    untaggedCodes: [String!]!
    invalidTags: [InvalidTag!]!
  }

  type InvalidTag {
    id: String!
    code: String!
    element: String!
    reason: String!
  }

  type AutoTagResult {
    tagged: Int!
    skipped: Int!
    mappings: [AutoTagMapping!]!
  }

  type AutoTagMapping {
    id: String!
    code: String!
    element: String!
  }

  type IXBRLTaggedValue {
    element: String!
    label: String!
    value: Float!
    formattedValue: String!
    tag: String!
  }

  type IXBRLResult {
    entityId: String!
    periodId: String!
    taxonomy: String!
    taggedValues: [IXBRLTaggedValue!]!
  }

  extend type Query {
    xbrlTag(name: String!, taxonomy: String!): XBRLTag
    xbrlTags(taxonomy: String!): [XBRLTag!]!
    xbrlFacts(entityId: String!, periodId: String!, taxonomy: String!, currency: String!): XBRLFactsResult!
    validateXBRL(entityId: String!, periodId: String!, taxonomy: String!): XBRLValidationResult!
  }

  extend type Mutation {
    tagMapping(mappingId: String!, xbrlElement: String!, xbrlTaxonomy: String!): Boolean!
    autoTagMappings(jurisdiction: String!): AutoTagResult!
    generateIXBRL(jurisdiction: String!, entityId: String!, periodId: String!, currency: String!): IXBRLResult!
  }
`;
