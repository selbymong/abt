import { GraphQLError } from 'graphql';
import { runCypher } from '../../../lib/neo4j.js';
import {
  getEntity,
  getAllEntities,
  createOutcome,
  listOutcomes,
  createContributesToEdge,
  createDependsOnEdge,
  createDelegatesToEdge,
  createProhibitsEdge,
  getContributesToEdges,
  getDependsOnEdges,
  getDelegatesToEdges,
  getProhibitsEdges,
} from '../../../services/graph/graph-crud-service.js';

// Whitelisted labels for generic CRUD (matches graph-crud-service)
const VALID_NODE_LABELS = new Set([
  'Entity', 'Outcome', 'Activity', 'Resource', 'Project', 'Initiative',
  'Metric', 'Capability', 'Asset', 'CustomerRelationshipAsset',
  'WorkforceAsset', 'StakeholderAsset', 'SocialConstraint', 'Obligation',
  'CashFlowEvent', 'AccountingPeriod', 'Fund',
]);

const VALID_EDGE_TYPES = new Set([
  'CONTRIBUTES_TO', 'DEPENDS_ON', 'DELEGATES_TO', 'PROHIBITS',
]);

const VALID_PROPERTY_KEY = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function assertValidLabel(label: string): void {
  if (!VALID_NODE_LABELS.has(label)) {
    throw new GraphQLError(`Invalid node label: ${label}`, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
}

function assertValidEdgeType(edgeType: string): void {
  if (!VALID_EDGE_TYPES.has(edgeType)) {
    throw new GraphQLError(`Invalid edge type: ${edgeType}`, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
}

function sanitizeProps(props: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (!VALID_PROPERTY_KEY.test(key)) {
      throw new GraphQLError(`Invalid property key: ${key}`, {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    if (key === 'id' || key === 'created_at') continue;
    clean[key] = props[key];
  }
  return clean;
}

export const graphResolvers = {
  Query: {
    entity: async (_: unknown, { id }: { id: string }) => {
      try {
        const entity = await getEntity(id);
        if (!entity) {
          throw new GraphQLError(`Entity ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return entity;
      } catch (err: unknown) {
        if (err instanceof GraphQLError) throw err;
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    entities: async () => {
      try {
        return await getAllEntities();
      } catch (err: unknown) {
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    node: async (_: unknown, { label, id }: { label: string; id: string }) => {
      try {
        assertValidLabel(label);
        const results = await runCypher<{ n: Record<string, unknown> }>(
          `MATCH (n:${label} {id: $id}) RETURN properties(n) AS n`,
          { id },
        );
        if (results.length === 0) return null;
        return { id, label: results[0].n.label as string, entity_id: results[0].n.entity_id, properties: results[0].n, created_at: results[0].n.created_at, updated_at: results[0].n.updated_at };
      } catch (err: unknown) {
        if (err instanceof GraphQLError) throw err;
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    nodesByEntity: async (_: unknown, { label, entityId }: { label: string; entityId: string }) => {
      try {
        assertValidLabel(label);
        const results = await runCypher<{ n: Record<string, unknown> }>(
          `MATCH (n:${label} {entity_id: $entityId}) RETURN properties(n) AS n ORDER BY n.label`,
          { entityId },
        );
        return results.map((r) => ({
          id: r.n.id,
          label: r.n.label as string,
          entity_id: r.n.entity_id,
          properties: r.n,
          created_at: r.n.created_at,
          updated_at: r.n.updated_at,
        }));
      } catch (err: unknown) {
        if (err instanceof GraphQLError) throw err;
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    outcomes: async (_: unknown, { entityId }: { entityId: string }) => {
      try {
        return await listOutcomes(entityId);
      } catch (err: unknown) {
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    edges: async (_: unknown, { edgeType, sourceId }: { edgeType: string; sourceId: string }) => {
      try {
        assertValidEdgeType(edgeType);
        switch (edgeType) {
          case 'CONTRIBUTES_TO': return await getContributesToEdges(sourceId);
          case 'DEPENDS_ON': return await getDependsOnEdges(sourceId);
          case 'DELEGATES_TO': return await getDelegatesToEdges(sourceId);
          case 'PROHIBITS': return await getProhibitsEdges(sourceId);
          default: return [];
        }
      } catch (err: unknown) {
        if (err instanceof GraphQLError) throw err;
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    impactPaths: async (_: unknown, { entityId }: { entityId: string }) => {
      try {
        const results = await runCypher<{
          activity_id: string;
          activity: string;
          outcome_id: string;
          outcome: string;
          outcome_type: string;
          ontology: string;
          path_contribution: number;
          total_lag: number;
          path_length: number;
        }>(
          `MATCH path = (a:Activity)-[:CONTRIBUTES_TO*1..6]->(o:Outcome)
           WHERE a.entity_id = $entityId
             AND a.status IN ['IN_PROGRESS', 'PLANNED']
           WITH a, o, path,
             reduce(w = 1.0, r IN relationships(path) | w * r.weight) AS path_weight,
             reduce(d = 0, r IN relationships(path) | d + r.lag_days) AS total_lag
           RETURN a.id AS activity_id, a.label AS activity,
             o.id AS outcome_id, o.label AS outcome,
             o.outcome_type AS outcome_type, o.ontology AS ontology,
             path_weight AS path_contribution, total_lag,
             length(path) AS path_length
           ORDER BY path_weight DESC`,
          { entityId },
        );
        return results;
      } catch (err: unknown) {
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    orphanedActivities: async (_: unknown, { entityId }: { entityId: string }) => {
      try {
        const results = await runCypher<{
          id: string;
          label: string;
          cost_monetary: number;
          status: string;
        }>(
          `MATCH (a:Activity)
           WHERE a.entity_id = $entityId
             AND a.status IN ['IN_PROGRESS', 'PLANNED']
             AND a.cost_monetary > 0
             AND NOT EXISTS { MATCH (a)-[:CONTRIBUTES_TO*1..6]->(:Outcome) }
           RETURN a.id AS id, a.label AS label, a.cost_monetary AS cost_monetary, a.status AS status
           ORDER BY a.cost_monetary DESC`,
          { entityId },
        );
        return results;
      } catch (err: unknown) {
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  Mutation: {
    createEntity: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      try {
        const props: Record<string, unknown> = {
          label: input.label,
          entity_type: input.entity_type,
          tax_status: input.tax_status,
          reporting_framework: input.reporting_framework,
          jurisdiction: input.jurisdiction,
          functional_currency: input.functional_currency,
          outcome_ontology: input.outcome_ontology,
          fund_accounting_enabled: input.fund_accounting_enabled,
          fiscal_year_end: input.fiscal_year_end,
          consolidation_method: input.consolidation_method ?? 'FULL',
          ownership_pct: input.ownership_pct ?? 100,
          nci_pct: input.nci_pct ?? 0,
          is_parent: input.is_parent ?? false,
          registration_number: input.registration_number ?? null,
          reporting_lag_days: input.reporting_lag_days ?? 0,
        };

        // Use runCypher directly for Entity creation (createNode is private)
        const { v4: uuid } = await import('uuid');
        const id = uuid();
        await runCypher(
          `CREATE (e:Entity {
            id: $id, label: $label,
            entity_type: $entity_type, tax_status: $tax_status,
            reporting_framework: $reporting_framework,
            jurisdiction: $jurisdiction,
            functional_currency: $functional_currency,
            outcome_ontology: $outcome_ontology,
            fund_accounting_enabled: $fund_accounting_enabled,
            fiscal_year_end: $fiscal_year_end,
            consolidation_method: $consolidation_method,
            ownership_pct: $ownership_pct,
            nci_pct: $nci_pct,
            is_parent: $is_parent,
            registration_number: $registration_number,
            reporting_lag_days: $reporting_lag_days,
            created_at: datetime(), updated_at: datetime()
          })`,
          { id, ...props },
        );

        return await getEntity(id);
      } catch (err: unknown) {
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    createOutcome: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      try {
        const id = await createOutcome({
          entityId: input.entityId as string,
          label: input.label as string,
          ontology: input.ontology as 'FINANCIAL' | 'MISSION',
          outcomeType: input.outcomeType as any,
          targetDelta: input.targetDelta as number,
          currency: input.currency as string,
          periodStart: input.periodStart as string,
          periodEnd: input.periodEnd as string,
          measurementUnit: input.measurementUnit as string | undefined,
          streamId: input.streamId as string | undefined,
        });

        const results = await runCypher<{ o: Record<string, unknown> }>(
          `MATCH (o:Outcome {id: $id}) RETURN properties(o) AS o`,
          { id },
        );
        return results[0]?.o ?? null;
      } catch (err: unknown) {
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    },

    createNode: async (_: unknown, { label, input }: { label: string; input: { entityId: string; label: string; properties?: Record<string, unknown> } }) => {
      try {
        assertValidLabel(label);
        const { v4: uuid } = await import('uuid');
        const id = uuid();
        const props: Record<string, unknown> = {
          id,
          entity_id: input.entityId,
          label: input.label,
          ...(input.properties ? sanitizeProps(input.properties) : {}),
        };

        const paramKeys = Object.keys(props);
        const setParts = paramKeys.map((k) => `${k}: $${k}`);
        setParts.push('created_at: datetime()', 'updated_at: datetime()');

        await runCypher(
          `CREATE (n:${label} {${setParts.join(', ')}})`,
          props,
        );

        return {
          id,
          label: input.label,
          entity_id: input.entityId,
          properties: props,
          created_at: null,
          updated_at: null,
        };
      } catch (err: unknown) {
        if (err instanceof GraphQLError) throw err;
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    updateNode: async (_: unknown, { label, id, input }: { label: string; id: string; input: { properties: Record<string, unknown> } }) => {
      try {
        assertValidLabel(label);
        const sanitized = sanitizeProps(input.properties);
        const keys = Object.keys(sanitized);
        if (keys.length === 0) return false;

        const setParts = keys.map((k) => `n.${k} = $${k}`);
        setParts.push('n.updated_at = datetime()');

        const result = await runCypher<{ id: string }>(
          `MATCH (n:${label} {id: $id}) SET ${setParts.join(', ')} RETURN n.id AS id`,
          { id, ...sanitized },
        );
        return result.length > 0;
      } catch (err: unknown) {
        if (err instanceof GraphQLError) throw err;
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    deleteNode: async (_: unknown, { label, id }: { label: string; id: string }) => {
      try {
        assertValidLabel(label);
        const exists = await runCypher<{ id: string }>(
          `MATCH (n:${label} {id: $id}) RETURN n.id AS id`,
          { id },
        );
        if (exists.length === 0) return false;
        await runCypher(
          `MATCH (n:${label} {id: $id}) DETACH DELETE n`,
          { id },
        );
        return true;
      } catch (err: unknown) {
        if (err instanceof GraphQLError) throw err;
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    createContributesToEdge: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      try {
        await createContributesToEdge({
          sourceId: input.sourceId as string,
          targetId: input.targetId as string,
          weight: input.weight as number,
          confidence: input.confidence as number,
          lagDays: input.lagDays as number | undefined,
          contributionFunction: input.contributionFunction as string | undefined,
          thresholdValue: input.thresholdValue as number | undefined,
          elasticity: input.elasticity as number | undefined,
          isCrossAssetEdge: input.isCrossAssetEdge as boolean | undefined,
          aiInferred: input.aiInferred as boolean | undefined,
        });
        return true;
      } catch (err: unknown) {
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    },

    createDependsOnEdge: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      try {
        await createDependsOnEdge({
          sourceId: input.sourceId as string,
          targetId: input.targetId as string,
          dependencyClass: input.dependencyClass as string,
          description: input.description as string,
        });
        return true;
      } catch (err: unknown) {
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    },

    createDelegatesToEdge: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      try {
        await createDelegatesToEdge({
          sourceId: input.sourceId as string,
          targetId: input.targetId as string,
          controlAttenuation: input.controlAttenuation as number,
          slaReference: input.slaReference as string | undefined,
        });
        return true;
      } catch (err: unknown) {
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    },

    createProhibitsEdge: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      try {
        await createProhibitsEdge({
          constraintId: input.constraintId as string,
          activityId: input.activityId as string,
          severity: input.severity as number,
        });
        return true;
      } catch (err: unknown) {
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    },

    updateEdge: async (_: unknown, { edgeType, input }: { edgeType: string; input: { sourceId: string; targetId: string; properties: Record<string, unknown> } }) => {
      try {
        assertValidEdgeType(edgeType);
        const sanitized = sanitizeProps(input.properties);
        const keys = Object.keys(sanitized);
        if (keys.length === 0) return false;

        const setParts = keys.map((k) => `r.${k} = $${k}`);
        const result = await runCypher<{ sid: string }>(
          `MATCH (s {id: $sourceId})-[r:${edgeType}]->(t {id: $targetId})
           SET ${setParts.join(', ')}
           RETURN s.id AS sid`,
          { sourceId: input.sourceId, targetId: input.targetId, ...sanitized },
        );
        return result.length > 0;
      } catch (err: unknown) {
        if (err instanceof GraphQLError) throw err;
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    deleteEdge: async (_: unknown, { edgeType, input }: { edgeType: string; input: { sourceId: string; targetId: string } }) => {
      try {
        assertValidEdgeType(edgeType);
        const exists = await runCypher<{ sid: string }>(
          `MATCH (s {id: $sourceId})-[r:${edgeType}]->(t {id: $targetId})
           RETURN s.id AS sid`,
          { sourceId: input.sourceId, targetId: input.targetId },
        );
        if (exists.length === 0) return false;
        await runCypher(
          `MATCH (s {id: $sourceId})-[r:${edgeType}]->(t {id: $targetId})
           DELETE r`,
          { sourceId: input.sourceId, targetId: input.targetId },
        );
        return true;
      } catch (err: unknown) {
        if (err instanceof GraphQLError) throw err;
        throw new GraphQLError((err as Error).message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
};
