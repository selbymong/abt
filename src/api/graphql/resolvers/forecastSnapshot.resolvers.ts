import {
  createForecastSnapshot,
  listForecastSnapshots,
  getForecastSnapshot,
  deleteForecastSnapshot,
  getForecastVsActualReport,
} from '../../../services/gl/forecast-snapshot-service.js';

export const forecastSnapshotResolvers = {
  Query: {
    forecastSnapshots: async (
      _: unknown,
      { entityId, budgetId, fiscalYear }: { entityId: string; budgetId?: string; fiscalYear?: number },
    ) => listForecastSnapshots(entityId, budgetId, fiscalYear),

    forecastSnapshot: async (_: unknown, { id }: { id: string }) =>
      getForecastSnapshot(id),

    forecastVsActualReport: async (
      _: unknown,
      { snapshotId, periodIds }: { snapshotId: string; periodIds?: string[] },
    ) => getForecastVsActualReport(snapshotId, periodIds),
  },

  Mutation: {
    createForecastSnapshot: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const id = await createForecastSnapshot(input as any);
      return getForecastSnapshot(id);
    },

    deleteForecastSnapshot: async (_: unknown, { id }: { id: string }) => {
      await deleteForecastSnapshot(id);
      return id;
    },
  },
};
