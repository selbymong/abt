import { GraphQLError } from 'graphql';
import {
  lookupTag,
  getAvailableTags,
  generateXBRLFacts,
  validateXBRLTagging,
  tagMapping,
  bulkAutoTag,
  generateIXBRL,
} from '../../../services/gl/xbrl-service.js';
import type { XBRLTaxonomy } from '../../../services/gl/xbrl-service.js';

export const xbrlResolvers = {
  Query: {
    xbrlTag: async (_: unknown, { name, taxonomy }: { name: string; taxonomy: string }) => {
      const tag = lookupTag(name, taxonomy as XBRLTaxonomy);
      if (!tag) throw new GraphQLError('XBRL tag not found', { extensions: { code: 'NOT_FOUND' } });
      return tag;
    },
    xbrlTags: async (_: unknown, { taxonomy }: { taxonomy: string }) => {
      return getAvailableTags(taxonomy as XBRLTaxonomy);
    },
    xbrlFacts: async (_: unknown, { entityId, periodId, taxonomy, currency }: { entityId: string; periodId: string; taxonomy: string; currency: string }) => {
      // Derive jurisdiction from taxonomy
      const jurisdiction = taxonomy === 'us-gaap' ? 'US' : 'IFRS';
      return generateXBRLFacts(jurisdiction, entityId, periodId, currency);
    },
    validateXBRL: async (_: unknown, { entityId: _entityId, periodId: _periodId, taxonomy }: { entityId: string; periodId: string; taxonomy: string }) => {
      const jurisdiction = taxonomy === 'us-gaap' ? 'US' : 'IFRS';
      return validateXBRLTagging(jurisdiction);
    },
  },
  Mutation: {
    tagMapping: async (_: unknown, { mappingId, xbrlElement, xbrlTaxonomy }: { mappingId: string; xbrlElement: string; xbrlTaxonomy: string }) => {
      return tagMapping(mappingId, xbrlElement, xbrlTaxonomy as XBRLTaxonomy);
    },
    autoTagMappings: async (_: unknown, { jurisdiction }: { jurisdiction: string }) => {
      return bulkAutoTag(jurisdiction);
    },
    generateIXBRL: async (_: unknown, { jurisdiction, entityId, periodId, currency }: { jurisdiction: string; entityId: string; periodId: string; currency: string }) => {
      return generateIXBRL(jurisdiction, entityId, periodId, currency);
    },
  },
};
