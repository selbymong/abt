import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './lib/logger.js';
import { closeNeo4j } from './lib/neo4j.js';
import { closePg } from './lib/pg.js';
import { closeKafka } from './lib/kafka.js';
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

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.2.0' });
});

// API routes
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
  logger.info({ port }, 'EBG API server started');
});

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down...');
  server.close();
  await Promise.all([closeNeo4j(), closePg(), closeKafka()]);
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
