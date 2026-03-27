// GraphQL schema bootstrap
// Merges base schema with all domain modules

import { enumTypeDefs } from './schema/enums.js';
import { commonTypeDefs } from './schema/common.js';
import { graphTypeDefs } from './schema/graph.typeDefs.js';
import { glTypeDefs } from './schema/gl.typeDefs.js';
import { taxTypeDefs } from './schema/tax.typeDefs.js';
import { consolidationTypeDefs } from './schema/consolidation.typeDefs.js';
import { depreciationTypeDefs } from './schema/depreciation.typeDefs.js';
import { cashflowTypeDefs } from './schema/cashflow.typeDefs.js';
import { hedgeTypeDefs } from './schema/hedge.typeDefs.js';
import { aiTypeDefs } from './schema/ai.typeDefs.js';
import { equityTypeDefs } from './schema/equity.typeDefs.js';
import { revenueTypeDefs } from './schema/revenue.typeDefs.js';
import { inventoryTypeDefs } from './schema/inventory.typeDefs.js';
import { bankRecTypeDefs } from './schema/bankRec.typeDefs.js';
import { complianceTypeDefs } from './schema/compliance.typeDefs.js';
import { xbrlTypeDefs } from './schema/xbrl.typeDefs.js';
import { configTypeDefs } from './schema/config.typeDefs.js';
import { reconciliationTypeDefs } from './schema/reconciliation.typeDefs.js';

import { graphResolvers } from './resolvers/graph.resolvers.js';
import { glResolvers } from './resolvers/gl.resolvers.js';
import { taxResolvers } from './resolvers/tax.resolvers.js';
import { consolidationResolvers } from './resolvers/consolidation.resolvers.js';
import { depreciationResolvers } from './resolvers/depreciation.resolvers.js';
import { cashflowResolvers } from './resolvers/cashflow.resolvers.js';
import { hedgeResolvers } from './resolvers/hedge.resolvers.js';
import { aiResolvers } from './resolvers/ai.resolvers.js';
import { equityResolvers } from './resolvers/equity.resolvers.js';
import { revenueResolvers } from './resolvers/revenue.resolvers.js';
import { inventoryResolvers } from './resolvers/inventory.resolvers.js';
import { bankRecResolvers } from './resolvers/bankRec.resolvers.js';
import { complianceResolvers } from './resolvers/compliance.resolvers.js';
import { xbrlResolvers } from './resolvers/xbrl.resolvers.js';
import { configResolvers } from './resolvers/config.resolvers.js';
import { reconciliationResolvers } from './resolvers/reconciliation.resolvers.js';

const baseTypeDefs = `
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

// Simple passthrough JSON scalar resolver
const jsonScalarResolver = {
  serialize(value: unknown): unknown {
    return value;
  },
  parseValue(value: unknown): unknown {
    return value;
  },
};

const allResolverModules = [
  graphResolvers,
  glResolvers,
  taxResolvers,
  consolidationResolvers,
  depreciationResolvers,
  cashflowResolvers,
  hedgeResolvers,
  aiResolvers,
  equityResolvers,
  revenueResolvers,
  inventoryResolvers,
  bankRecResolvers,
  complianceResolvers,
  xbrlResolvers,
  configResolvers,
  reconciliationResolvers,
];

export function createGraphQLSchema(): {
  typeDefs: string;
  resolvers: Record<string, any>;
} {
  const typeDefs = [
    baseTypeDefs,
    enumTypeDefs,
    commonTypeDefs,
    graphTypeDefs,
    glTypeDefs,
    taxTypeDefs,
    consolidationTypeDefs,
    depreciationTypeDefs,
    cashflowTypeDefs,
    hedgeTypeDefs,
    aiTypeDefs,
    equityTypeDefs,
    revenueTypeDefs,
    inventoryTypeDefs,
    bankRecTypeDefs,
    complianceTypeDefs,
    xbrlTypeDefs,
    configTypeDefs,
    reconciliationTypeDefs,
  ].join('\n');

  // Merge all Query and Mutation resolvers from domain modules
  const mergedQuery: Record<string, unknown> = {};
  const mergedMutation: Record<string, unknown> = {};

  for (const mod of allResolverModules) {
    if (mod.Query) Object.assign(mergedQuery, mod.Query);
    if (mod.Mutation) Object.assign(mergedMutation, mod.Mutation);
  }

  const resolvers: Record<string, any> = {
    JSON: jsonScalarResolver,
    Query: mergedQuery,
    Mutation: mergedMutation,
    // Nested resolvers
    JournalEntry: (glResolvers as Record<string, unknown>).JournalEntry,
  };

  return { typeDefs, resolvers };
}
