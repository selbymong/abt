import {
  designateQualifyingAsset,
  suspendCapitalization,
  resumeCapitalization,
  ceaseCapitalization,
  capitalizeBorrowingCosts,
  listQualifyingAssets,
  getQualifyingAsset,
} from '../../../services/gl/borrowing-costs-service.js';

export const borrowingCostsResolvers = {
  Query: {
    qualifyingAssets: async (_: unknown, args: { entityId: string; status?: string }) =>
      listQualifyingAssets(args.entityId, args.status as any),

    qualifyingAsset: async (_: unknown, args: { assetId: string }) =>
      getQualifyingAsset(args.assetId),
  },

  Mutation: {
    designateQualifyingAsset: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      await designateQualifyingAsset(input as any);
      return true;
    },

    capitalizeBorrowingCosts: async (_: unknown, { input }: { input: Record<string, unknown> }) =>
      capitalizeBorrowingCosts(input as any),

    suspendCapitalization: async (_: unknown, args: { assetId: string; entityId: string }) => {
      await suspendCapitalization(args.assetId, args.entityId);
      return true;
    },

    resumeCapitalization: async (_: unknown, args: { assetId: string; entityId: string }) => {
      await resumeCapitalization(args.assetId, args.entityId);
      return true;
    },

    ceaseCapitalization: async (_: unknown, args: { assetId: string; entityId: string; cessationDate: string }) => {
      await ceaseCapitalization(args.assetId, args.entityId, args.cessationDate);
      return true;
    },
  },
};
