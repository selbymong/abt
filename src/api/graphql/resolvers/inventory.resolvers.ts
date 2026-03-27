import { GraphQLError } from 'graphql';
import {
  createInventoryItem,
  getInventoryItem,
  listInventoryItems,
  createInventoryLot,
  getInventoryLot,
  listInventoryLots,
  receiveInventory,
  issueInventory,
  testNRV,
  getInventoryValuation,
} from '../../../services/gl/inventory-service.js';
import type { InventoryCategory } from '../../../schema/neo4j/types.js';

export const inventoryResolvers = {
  Query: {
    inventoryItem: async (_: unknown, { id }: { id: string }) => {
      const item = await getInventoryItem(id);
      if (!item) throw new GraphQLError('InventoryItem not found', { extensions: { code: 'NOT_FOUND' } });
      return item;
    },
    inventoryItems: async (_: unknown, { entityId, category }: { entityId: string; category?: InventoryCategory }) => {
      return listInventoryItems(entityId, category);
    },
    inventoryLot: async (_: unknown, { id }: { id: string }) => {
      const lot = await getInventoryLot(id);
      if (!lot) throw new GraphQLError('InventoryLot not found', { extensions: { code: 'NOT_FOUND' } });
      return lot;
    },
    inventoryLots: async (_: unknown, { itemId }: { itemId: string }) => {
      return listInventoryLots(itemId);
    },
    inventoryValuation: async (_: unknown, { entityId }: { entityId: string }) => {
      return getInventoryValuation(entityId);
    },
  },
  Mutation: {
    createInventoryItem: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      return createInventoryItem(input as unknown as Parameters<typeof createInventoryItem>[0]);
    },
    createInventoryLot: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      return createInventoryLot(input as unknown as Parameters<typeof createInventoryLot>[0]);
    },
    receiveInventory: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      return receiveInventory(input as unknown as Parameters<typeof receiveInventory>[0]);
    },
    issueInventory: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      return issueInventory(input as unknown as Parameters<typeof issueInventory>[0]);
    },
    testNRV: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      return testNRV(input as unknown as Parameters<typeof testNRV>[0]);
    },
  },
};
