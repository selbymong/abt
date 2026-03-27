import {
  setFXRate, setFXRatesBatch, getFXRate, listFXRates,
  convertCurrency, performRevaluation, getRevaluationHistory,
} from '../../../services/gl/multi-currency-service.js';

export const multiCurrencyResolvers = {
  Query: {
    fxRate: async (_: unknown, { fromCurrency, toCurrency, rateDate }: { fromCurrency: string; toCurrency: string; rateDate: string }) =>
      getFXRate(fromCurrency, toCurrency, rateDate),
    fxRates: async (_: unknown, { fromCurrency, toCurrency, startDate, endDate }: { fromCurrency?: string; toCurrency?: string; startDate?: string; endDate?: string }) =>
      listFXRates(fromCurrency, toCurrency, startDate, endDate),
    convertCurrency: async (_: unknown, { fromCurrency, toCurrency, amount, rateDate }: { fromCurrency: string; toCurrency: string; amount: number; rateDate: string }) =>
      convertCurrency(fromCurrency, toCurrency, amount, rateDate),
    revaluationHistory: async (_: unknown, { entityId }: { entityId: string }) =>
      getRevaluationHistory(entityId),
  },

  Mutation: {
    setFXRate: async (_: unknown, { input }: { input: Record<string, unknown> }) =>
      setFXRate(input as any),
    setFXRatesBatch: async (_: unknown, { rates }: { rates: Record<string, unknown>[] }) =>
      setFXRatesBatch(rates as any),
    performRevaluation: async (_: unknown, { entityId, periodId, functionalCurrency, asOfDate }: { entityId: string; periodId: string; functionalCurrency: string; asOfDate: string }) =>
      performRevaluation(entityId, periodId, functionalCurrency, asOfDate),
  },
};
