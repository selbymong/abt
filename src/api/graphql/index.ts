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
import { grantsTypeDefs } from './schema/grants.typeDefs.js';
import { borrowingCostsTypeDefs } from './schema/borrowingCosts.typeDefs.js';
import { discontinuedOpsTypeDefs } from './schema/discontinuedOps.typeDefs.js';
import { nfpReclassificationTypeDefs } from './schema/nfpReclassification.typeDefs.js';
import { pensionTypeDefs } from './schema/pension.typeDefs.js';
import { apTypeDefs } from './schema/ap.typeDefs.js';
import { arTypeDefs } from './schema/ar.typeDefs.js';
import { procurementTypeDefs } from './schema/procurement.typeDefs.js';
import { budgetingTypeDefs } from './schema/budgeting.typeDefs.js';
import { multiCurrencyTypeDefs } from './schema/multiCurrency.typeDefs.js';
import { intercoLoanTypeDefs } from './schema/intercoLoan.typeDefs.js';
import { payrollTypeDefs } from './schema/payroll.typeDefs.js';

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
import { grantsResolvers } from './resolvers/grants.resolvers.js';
import { borrowingCostsResolvers } from './resolvers/borrowingCosts.resolvers.js';
import { discontinuedOpsResolvers } from './resolvers/discontinuedOps.resolvers.js';
import { nfpReclassificationResolvers } from './resolvers/nfpReclassification.resolvers.js';
import { pensionResolvers } from './resolvers/pension.resolvers.js';
import { apResolvers } from './resolvers/ap.resolvers.js';
import { arResolvers } from './resolvers/ar.resolvers.js';
import { procurementResolvers } from './resolvers/procurement.resolvers.js';
import { budgetingResolvers } from './resolvers/budgeting.resolvers.js';
import { multiCurrencyResolvers } from './resolvers/multiCurrency.resolvers.js';
import { intercoLoanResolvers } from './resolvers/intercoLoan.resolvers.js';
import { payrollResolvers } from './resolvers/payroll.resolvers.js';

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
  grantsResolvers,
  borrowingCostsResolvers,
  discontinuedOpsResolvers,
  nfpReclassificationResolvers,
  pensionResolvers,
  apResolvers,
  arResolvers,
  procurementResolvers,
  budgetingResolvers,
  multiCurrencyResolvers,
  intercoLoanResolvers,
  payrollResolvers,
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
    grantsTypeDefs,
    borrowingCostsTypeDefs,
    discontinuedOpsTypeDefs,
    nfpReclassificationTypeDefs,
    pensionTypeDefs,
    apTypeDefs,
    arTypeDefs,
    procurementTypeDefs,
    budgetingTypeDefs,
    multiCurrencyTypeDefs,
    intercoLoanTypeDefs,
    payrollTypeDefs,
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
