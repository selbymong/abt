import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

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
