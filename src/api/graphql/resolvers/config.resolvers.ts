import { GraphQLError } from 'graphql';
import { resolveConfig, setConfig } from '../../../services/config/configuration-service.js';
import { query } from '../../../lib/pg.js';

export const configResolvers = {
  Query: {
    config: async (_: unknown, { key, entityId, entityPairId }: { key: string; entityId?: string; entityPairId?: string }) => {
      const result = await resolveConfig(key, {
        entityId: entityId ?? undefined,
        entityId2: entityPairId ?? undefined,
      });
      if (!result) throw new GraphQLError('Configuration not found', { extensions: { code: 'NOT_FOUND' } });
      return result;
    },
    configHistory: async (_: unknown, { key }: { key: string }) => {
      const result = await query(
        `SELECT * FROM configuration_settings WHERE setting_key = $1 ORDER BY valid_from DESC`,
        [key],
      );
      return result.rows;
    },
  },
  Mutation: {
    setConfig: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      return setConfig({
        key: input.key as string,
        scopeType: input.scopeType as Parameters<typeof setConfig>[0]['scopeType'],
        scopeId: (input.scopeId as string) ?? undefined,
        scopeId2: (input.scopeId2 as string) ?? undefined,
        valueType: input.valueType as Parameters<typeof setConfig>[0]['valueType'],
        valueString: (input.valueString as string) ?? undefined,
        valueNumeric: (input.valueNumeric as number) ?? undefined,
        valueBoolean: (input.valueBoolean as boolean) ?? undefined,
        valueJson: input.valueJson ?? undefined,
        validFrom: input.validFrom as string,
        validUntil: (input.validUntil as string) ?? undefined,
        changedBy: input.changedBy as string,
        changeReason: (input.changeReason as string) ?? undefined,
        requiresRestatement: (input.requiresRestatement as boolean) ?? undefined,
      });
    },
  },
};
