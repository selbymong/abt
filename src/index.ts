import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { logger } from './lib/logger.js';
import { closeNeo4j, runCypher } from './lib/neo4j.js';
import { closePg, query } from './lib/pg.js';
import { closeKafka } from './lib/kafka.js';
import { createGraphQLSchema } from './api/graphql/index.js';
import { configRouter } from './api/rest/config-routes.js';
import { glRouter } from './api/rest/gl-routes.js';
import { graphRouter } from './api/rest/graph-routes.js';
import { depreciationRouter } from './api/rest/depreciation-routes.js';
import { consolidationRouter } from './api/rest/consolidation-routes.js';
import { aiRouter } from './api/rest/ai-routes.js';
import { cashflowRouter } from './api/rest/cashflow-routes.js';
import { taxRouter } from './api/rest/tax-routes.js';
import { complianceRouter } from './api/rest/compliance-routes.js';
import { revenueRouter } from './api/rest/revenue-routes.js';
import { inventoryRouter } from './api/rest/inventory-routes.js';
import { equityRouter } from './api/rest/equity-routes.js';
import { xbrlRouter } from './api/rest/xbrl-routes.js';
import { bankRecRouter } from './api/rest/bank-rec-routes.js';
import { hedgeRouter } from './api/rest/hedge-routes.js';
import { migrationRouter } from './api/rest/migration-routes.js';
import { reconciliationRouter } from './api/rest/reconciliation-routes.js';
import { grantsRouter } from './api/rest/grants-routes.js';
import { startReconciliationScheduler, stopReconciliationScheduler } from './services/reconciliation/nightly-reconciliation-service.js';
import { startConsumers, stopConsumers } from './projectors/index.js';
import { getConsumerManager } from './projectors/consumer-manager.js';

// --- Environment validation ---
function validateEnv() {
  const required = process.env.NODE_ENV === 'production'
    ? ['NEO4J_URI', 'NEO4J_PASSWORD', 'PG_HOST', 'PG_PASSWORD']
    : [];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.fatal({ missing }, 'Missing required environment variables');
    process.exit(1);
  }
}
validateEnv();

async function main() {
  const app = express();
  const port = Number(process.env.PORT ?? 4000);

  // Security headers
  app.use(helmet());

  // CORS — restrict to known origins (override with CORS_ORIGIN env var)
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',');
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  }));

  // Rate limiting — 200 requests per minute per IP
  app.use(rateLimit({
    windowMs: 60_000,
    limit: 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }));

  app.use(express.json({ limit: '1mb' }));

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info({
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration,
      }, 'request');
    });
    next();
  });

  // Liveness probe
  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Readiness probe — checks database connectivity
  app.get('/health', async (_req, res) => {
    const checks: Record<string, string> = {};
    try {
      await runCypher('RETURN 1 AS n', {});
      checks.neo4j = 'ok';
    } catch { checks.neo4j = 'error'; }

    try {
      await query('SELECT 1');
      checks.postgres = 'ok';
    } catch { checks.postgres = 'error'; }

    const allOk = Object.values(checks).every((v) => v === 'ok');
    res.status(allOk ? 200 : 503).json({
      status: allOk ? 'ok' : 'degraded',
      version: '1.2.0',
      checks,
    });
  });

  // --- GraphQL ---
  const { typeDefs, resolvers } = createGraphQLSchema();
  const apollo = new ApolloServer({ typeDefs, resolvers });
  await apollo.start();
  app.use('/graphql', expressMiddleware(apollo));

  // --- REST API routes ---
  app.use('/api/config', configRouter);
  app.use('/api/gl', glRouter);
  app.use('/api/graph', graphRouter);
  app.use('/api/depreciation', depreciationRouter);
  app.use('/api/consolidation', consolidationRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/cashflow', cashflowRouter);
  app.use('/api/tax', taxRouter);
  app.use('/api/compliance', complianceRouter);
  app.use('/api/revenue', revenueRouter);
  app.use('/api/inventory', inventoryRouter);
  app.use('/api/equity', equityRouter);
  app.use('/api/xbrl', xbrlRouter);
  app.use('/api/bank-rec', bankRecRouter);
  app.use('/api/hedge', hedgeRouter);
  app.use('/api/migration', migrationRouter);
  app.use('/api/reconciliation', reconciliationRouter);
  app.use('/api/grants', grantsRouter);

  // --- Consumer Status ---
  app.get('/api/consumers/status', (_req, res) => {
    const manager = getConsumerManager();
    res.json({
      healthy: manager.isHealthy(),
      consumers: manager.getStatus(),
    });
  });

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err: err.message, stack: err.stack }, 'Unhandled error');
    const statusCode = (err as { statusCode?: number }).statusCode ?? 500;
    res.status(statusCode).json({
      error: err.message,
      code: (err as { code?: string }).code ?? 'INTERNAL_ERROR',
    });
  });

  const server = app.listen(port, () => {
    logger.info({ port }, 'EBG API server started (REST + GraphQL)');

    // Start Kafka consumers after server is listening (non-blocking)
    if (process.env.DISABLE_CONSUMERS !== 'true') {
      startConsumers().catch((err) => {
        logger.error({ err: (err as Error).message }, 'Failed to start Kafka consumers');
      });
    }

    // Start nightly reconciliation scheduler (default: every 24h)
    if (process.env.DISABLE_RECONCILIATION !== 'true') {
      const intervalMs = Number(process.env.RECONCILIATION_INTERVAL_MS) || 24 * 60 * 60 * 1000;
      startReconciliationScheduler(intervalMs);
    }
  });

  // Graceful shutdown with timeout
  const SHUTDOWN_TIMEOUT = 15_000;
  let shuttingDown = false;

  async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info('Shutting down...');

    const forceTimer = setTimeout(() => {
      logger.error('Shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT);
    forceTimer.unref();

    server.close(() => {
      logger.info('HTTP server closed');
    });

    try {
      stopReconciliationScheduler();
      await stopConsumers();
      await apollo.stop();
      await Promise.all([closeNeo4j(), closePg(), closeKafka()]);
      logger.info('All connections closed');
    } catch (err) {
      logger.error({ err }, 'Error during connection cleanup');
    }

    clearTimeout(forceTimer);
    process.exit(0);
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
