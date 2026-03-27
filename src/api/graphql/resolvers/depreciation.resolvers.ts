import { GraphQLError } from 'graphql';
import {
  createFixedAsset,
  getFixedAsset,
  listFixedAssets,
  updateFixedAsset,
  disposeFixedAsset,
  getAssetClassByCode,
  listAssetClasses,
  getAssetClassesForAsset,
  createBelongsToEdge,
  createUCCPool,
  getUCCPool,
  getUCCPoolForClass,
  calculateCCA,
} from '../../../services/depreciation/fixed-asset-service.js';
import {
  depreciateAsset,
  depreciateAllAssets,
  getDepreciationSchedule,
} from '../../../services/depreciation/depreciation-engine.js';

export const depreciationResolvers = {
  Query: {
    async fixedAsset(_: unknown, args: { id: string }) {
      return getFixedAsset(args.id);
    },

    async fixedAssets(_: unknown, args: { entityId: string }) {
      return listFixedAssets(args.entityId);
    },

    async assetClasses(_: unknown, args: { classSystem?: string; jurisdiction?: string }) {
      return listAssetClasses(
        args.classSystem as any,
        args.jurisdiction,
      );
    },

    async assetClass(_: unknown, args: { code: string }) {
      return getAssetClassByCode(args.code);
    },

    async assetClassesForAsset(_: unknown, args: { assetId: string }) {
      return getAssetClassesForAsset(args.assetId);
    },

    async uccPool(_: unknown, args: { id: string }) {
      return getUCCPool(args.id);
    },

    async uccPoolForClass(_: unknown, args: { entityId: string; assetClassId: string; fiscalYear: string }) {
      return getUCCPoolForClass(args.entityId, args.assetClassId, args.fiscalYear);
    },

    async depreciationSchedule(_: unknown, args: { fixedAssetId: string }) {
      return getDepreciationSchedule(args.fixedAssetId);
    },
  },

  Mutation: {
    async createFixedAsset(_: unknown, args: { input: any }) {
      try {
        return await createFixedAsset(args.input);
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'BAD_USER_INPUT' } });
      }
    },

    async updateFixedAsset(_: unknown, args: { id: string; input: Record<string, unknown> }) {
      try {
        return await updateFixedAsset(args.id, args.input);
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'BAD_USER_INPUT' } });
      }
    },

    async disposeFixedAsset(_: unknown, args: { id: string; disposalDate: string; proceedsAmount: number }) {
      try {
        return await disposeFixedAsset(args.id, args.disposalDate, args.proceedsAmount);
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'NOT_FOUND' } });
      }
    },

    async createBelongsToEdge(_: unknown, args: { input: any }) {
      try {
        await createBelongsToEdge(args.input);
        return true;
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'BAD_USER_INPUT' } });
      }
    },

    async createUCCPool(_: unknown, args: { input: any }) {
      try {
        return await createUCCPool(args.input);
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'BAD_USER_INPUT' } });
      }
    },

    async calculateCCA(_: unknown, args: { poolId: string; claimAmount?: number }) {
      try {
        return await calculateCCA(args.poolId, args.claimAmount ?? undefined);
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'NOT_FOUND' } });
      }
    },

    async depreciateAsset(_: unknown, args: { fixedAssetId: string; periodId: string; postJE?: boolean }) {
      try {
        return await depreciateAsset(args.fixedAssetId, args.periodId, args.postJE ?? true);
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },

    async depreciateAllAssets(_: unknown, args: { entityId: string; periodId: string }) {
      try {
        return await depreciateAllAssets(args.entityId, args.periodId);
      } catch (err: any) {
        throw new GraphQLError(err.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },
  },
};
