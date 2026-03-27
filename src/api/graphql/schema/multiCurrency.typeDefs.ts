export const multiCurrencyTypeDefs = `
  type FXRate {
    id: String!
    from_currency: String!
    to_currency: String!
    rate: Float!
    rate_date: String!
    source: String!
    created_at: String
  }

  type ConversionResult {
    fromCurrency: String!
    toCurrency: String!
    fromAmount: Float!
    toAmount: Float!
    rate: Float!
    rateDate: String!
  }

  type RevaluationItem {
    nodeRefId: String!
    nodeRefType: String!
    economicCategory: String!
    currency: String!
    originalAmount: Float!
    originalRate: Float!
    closingRate: Float!
    revaluedAmount: Float!
    unrealizedGainLoss: Float!
    journalEntryId: String!
  }

  type RevaluationReport {
    entityId: String!
    periodId: String!
    functionalCurrency: String!
    asOfDate: String!
    items: [RevaluationItem!]!
    totalGainLoss: Float!
  }

  type RevaluationRun {
    id: String!
    periodId: String!
    functionalCurrency: String!
    asOfDate: String!
    itemsCount: Int!
    totalGainLoss: Float!
    createdAt: String!
  }

  input SetFXRateInput {
    fromCurrency: String!
    toCurrency: String!
    rate: Float!
    rateDate: String!
    source: String
  }

  extend type Query {
    fxRate(fromCurrency: String!, toCurrency: String!, rateDate: String!): FXRate
    fxRates(fromCurrency: String, toCurrency: String, startDate: String, endDate: String): [FXRate!]!
    convertCurrency(fromCurrency: String!, toCurrency: String!, amount: Float!, rateDate: String!): ConversionResult!
    revaluationHistory(entityId: String!): [RevaluationRun!]!
  }

  extend type Mutation {
    setFXRate(input: SetFXRateInput!): String!
    setFXRatesBatch(rates: [SetFXRateInput!]!): Int!
    performRevaluation(entityId: String!, periodId: String!, functionalCurrency: String!, asOfDate: String!): RevaluationReport!
  }
`;
