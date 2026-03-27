import {
  createPensionPlan,
  getPensionPlan,
  listPensionPlans,
  processPensionPeriod,
  updateActuarialAssumptions,
  getPensionSummary,
} from '../../../services/gl/pension-service.js';

export const pensionResolvers = {
  Query: {
    pensionPlan: async (_: unknown, { id }: { id: string }) =>
      getPensionPlan(id),

    pensionPlans: async (_: unknown, { entityId }: { entityId: string }) =>
      listPensionPlans(entityId),

    pensionSummary: async (_: unknown, { entityId }: { entityId: string }) =>
      getPensionSummary(entityId),
  },

  Mutation: {
    createPensionPlan: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const id = await createPensionPlan(input as any);
      return getPensionPlan(id);
    },

    processPensionPeriod: async (_: unknown, { input }: { input: Record<string, unknown> }) =>
      processPensionPeriod(input as any),

    updateActuarialAssumptions: async (_: unknown, args: { pensionPlanId: string; input: Record<string, unknown> }) =>
      updateActuarialAssumptions(args.pensionPlanId, args.input as any),
  },
};
