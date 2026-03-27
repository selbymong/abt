// AI domain GraphQL resolvers
// Delegates to: weight-learner, epistemic-scorer, scenario-engine, graph-query, vector-embedder

import { GraphQLError } from 'graphql';

import {
  recordRealization,
  computeEffectiveStake,
  computeEffectiveContributions,
  transitionValueState,
  getCalibrationHistory,
} from '../../../services/ai/weight-learner-service.js';

import {
  computeEVOI,
  computeEntityEVOIs,
  updateEpistemicPriorities,
  findStaleEstimates,
  downgradeStaleEstimates,
} from '../../../services/ai/epistemic-scorer-service.js';

import {
  createScenarioSet,
  getScenarioSet,
  getScenarioSetsForNode,
  runMonteCarlo,
  computeEntityRiskProfiles,
  fireScenario,
} from '../../../services/ai/scenario-engine-service.js';

import {
  findPathsToOutcomes,
  findTopContributors,
  parseQuery,
  executeQuery,
  getEntityGraphSummary,
} from '../../../services/ai/graph-query-service.js';

import {
  generateAndStoreEmbedding,
  getEmbedding,
  findSimilarNodes,
  embedEntityNodes,
  discoverEdgeCandidates,
  createInferredEdges,
  runEdgeDiscoveryPipeline,
} from '../../../services/ai/vector-embedder-service.js';

import type { SimilarityCandidate } from '../../../services/ai/vector-embedder-service.js';

function toGraphQLError(err: unknown): GraphQLError {
  const message = err instanceof Error ? err.message : String(err);
  return new GraphQLError(message, { extensions: { code: 'AI_SERVICE_ERROR' } });
}

export const aiResolvers = {
  Query: {
    // ----------------------------------------------------------
    // Weight Learner
    // ----------------------------------------------------------

    effectiveStake: async (_: unknown, args: { nodeId: string }) => {
      try {
        return await computeEffectiveStake(args.nodeId);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    effectiveContribution: async (
      _: unknown,
      args: { edgeSourceId: string; edgeTargetId?: string },
    ) => {
      try {
        return await computeEffectiveContributions(args.edgeSourceId);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    calibrationHistory: async (
      _: unknown,
      args: { entityId: string; outcomeType?: string },
    ) => {
      try {
        return await getCalibrationHistory(args.entityId, args.outcomeType ?? undefined);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    // ----------------------------------------------------------
    // Epistemic Scorer
    // ----------------------------------------------------------

    evoi: async (_: unknown, args: { nodeId: string }) => {
      try {
        return await computeEVOI(args.nodeId);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    entityEVOIs: async (
      _: unknown,
      args: { entityId: string; threshold?: number },
    ) => {
      try {
        return await computeEntityEVOIs(args.entityId, args.threshold ?? undefined);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    staleEstimates: async (_: unknown, args: { entityId: string }) => {
      try {
        return await findStaleEstimates(args.entityId);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    // ----------------------------------------------------------
    // Scenario Engine
    // ----------------------------------------------------------

    scenarioSet: async (_: unknown, args: { id: string }) => {
      try {
        return await getScenarioSet(args.id);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    scenarioSets: async (_: unknown, args: { nodeId: string }) => {
      try {
        return await getScenarioSetsForNode(args.nodeId);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    entityRiskProfile: async (_: unknown, args: { entityId: string }) => {
      try {
        const profiles = await computeEntityRiskProfiles(args.entityId);
        return { profiles };
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    // ----------------------------------------------------------
    // Graph Queries
    // ----------------------------------------------------------

    graphPaths: async (
      _: unknown,
      args: { nodeId: string; entityId?: string; maxHops?: number },
    ) => {
      try {
        return await findPathsToOutcomes(args.nodeId, args.maxHops ?? 6);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    topContributors: async (
      _: unknown,
      args: { outcomeId: string; limit?: number },
    ) => {
      try {
        return await findTopContributors(args.outcomeId, 6, args.limit ?? 10);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    graphQuery: async (_: unknown, args: { query: string }) => {
      try {
        const intent = parseQuery(args.query);
        const data = await executeQuery(intent);
        return { intentType: intent.type, data };
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    graphSummary: async (_: unknown, args: { entityId: string }) => {
      try {
        return await getEntityGraphSummary(args.entityId);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    // ----------------------------------------------------------
    // Vector Embedder
    // ----------------------------------------------------------

    embedding: async (_: unknown, args: { nodeId: string }) => {
      try {
        const result = await getEmbedding(args.nodeId);
        if (!result) return null;
        return { nodeId: result.node_id, dimension: 1536 };
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    similarNodes: async (
      _: unknown,
      args: { nodeId: string; limit?: number; threshold?: number },
    ) => {
      try {
        return await findSimilarNodes(
          args.nodeId,
          args.threshold ?? 0.82,
          args.limit ?? 50,
        );
      } catch (err) {
        throw toGraphQLError(err);
      }
    },
  },

  Mutation: {
    // ----------------------------------------------------------
    // Weight Learner
    // ----------------------------------------------------------

    recordRealization: async (
      _: unknown,
      args: { input: { outcomeId: string; realizedDelta: number; periodId: string } },
    ) => {
      try {
        return await recordRealization(args.input);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    transitionValueState: async (
      _: unknown,
      args: { input: { nodeId: string; newState: string; epistemicActivityId?: string } },
    ) => {
      try {
        return await transitionValueState(args.input as Parameters<typeof transitionValueState>[0]);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    // ----------------------------------------------------------
    // Epistemic Scorer
    // ----------------------------------------------------------

    updateEpistemicPriorities: async (
      _: unknown,
      args: { entityId: string },
    ) => {
      try {
        return await updateEpistemicPriorities(args.entityId);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    downgradeStaleEstimates: async (
      _: unknown,
      args: { entityId: string },
    ) => {
      try {
        return await downgradeStaleEstimates(args.entityId);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    // ----------------------------------------------------------
    // Scenario Engine
    // ----------------------------------------------------------

    createScenarioSet: async (
      _: unknown,
      args: {
        input: {
          nodeId: string;
          label: string;
          scenarios: Array<{
            label: string;
            probability: number;
            impactMultiplier: number;
            description?: string;
          }>;
          baseValue: number;
        };
      },
    ) => {
      try {
        return await createScenarioSet(args.input);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    runMonteCarlo: async (
      _: unknown,
      args: { scenarioSetId: string; simulations?: number },
    ) => {
      try {
        return await runMonteCarlo(args.scenarioSetId, args.simulations ?? 10000);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    fireScenario: async (
      _: unknown,
      args: { scenarioSetId: string; scenarioLabel: string; actualImpact: number },
    ) => {
      try {
        return await fireScenario(
          args.scenarioSetId,
          args.scenarioLabel,
          args.actualImpact,
        );
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    // ----------------------------------------------------------
    // Vector Embedder
    // ----------------------------------------------------------

    generateEmbedding: async (
      _: unknown,
      args: { nodeId: string; entityId: string; nodeLabel: string },
    ) => {
      try {
        return await generateAndStoreEmbedding(args.nodeId, args.entityId, args.nodeLabel);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    embedEntityNodes: async (_: unknown, args: { entityId: string }) => {
      try {
        return await embedEntityNodes(args.entityId);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    discoverEdgeCandidates: async (
      _: unknown,
      args: { entityId: string; threshold?: number; limit?: number },
    ) => {
      try {
        return await discoverEdgeCandidates(
          args.entityId,
          args.threshold ?? 0.82,
          args.limit ?? 50,
        );
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    createInferredEdges: async (
      _: unknown,
      args: { candidates: SimilarityCandidate[]; entityId: string },
    ) => {
      try {
        return await createInferredEdges(args.candidates, args.entityId);
      } catch (err) {
        throw toGraphQLError(err);
      }
    },

    runEdgeDiscoveryPipeline: async (
      _: unknown,
      args: {
        entityId: string;
        options?: { threshold?: number; limit?: number; autoCreate?: boolean };
      },
    ) => {
      try {
        return await runEdgeDiscoveryPipeline(args.entityId, args.options ?? {});
      } catch (err) {
        throw toGraphQLError(err);
      }
    },
  },
};
