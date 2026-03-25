import { Router, Request, Response } from 'express';
import { postJournalEntry, PostJournalEntryInput } from '../../services/gl/journal-posting-service.js';
import { softClosePeriod, hardClosePeriod, reopenPeriod } from '../../services/gl/period-service.js';
import { getProfitAndLoss, getBalanceSheet, getFundBalances } from '../../services/gl/reporting-service.js';
import {
  createStatutoryMapping,
  getStatutoryMapping,
  listStatutoryMappings,
  updateStatutoryMapping,
  deleteStatutoryMapping,
  resolveStatutoryCode,
} from '../../services/gl/statutory-mapping-service.js';
import { query } from '../../lib/pg.js';

export const glRouter = Router();

// POST /gl/journal-entries — post a journal entry
glRouter.post('/journal-entries', async (req: Request, res: Response) => {
  const input: PostJournalEntryInput = req.body;

  if (!input.entityId || !input.periodId || !input.lines?.length) {
    res.status(400).json({
      error: 'Required: entityId, periodId, lines[]',
    });
    return;
  }

  const journalEntryId = await postJournalEntry(input);
  res.status(201).json({ journalEntryId });
});

// GET /gl/period-balances — query TimescaleDB projection
glRouter.get('/period-balances', async (req: Request, res: Response) => {
  const entityId = req.query.entityId as string;
  const periodId = req.query.periodId as string;

  if (!entityId || !periodId) {
    res.status(400).json({ error: 'Required: entityId, periodId' });
    return;
  }

  const result = await query(
    `SELECT node_ref_type, economic_category, statutory_code,
            debit_total, credit_total, net_balance, transaction_count
     FROM gl_period_balances
     WHERE entity_id = $1 AND period_id = $2
     ORDER BY economic_category, node_ref_type`,
    [entityId, periodId],
  );

  res.json({ balances: result.rows });
});

// GET /gl/trial-balance — summarized trial balance
glRouter.get('/trial-balance', async (req: Request, res: Response) => {
  const entityId = req.query.entityId as string;
  const periodId = req.query.periodId as string;

  if (!entityId || !periodId) {
    res.status(400).json({ error: 'Required: entityId, periodId' });
    return;
  }

  const result = await query(
    `SELECT economic_category,
            SUM(debit_total) AS total_debit,
            SUM(credit_total) AS total_credit,
            SUM(net_balance) AS net_balance
     FROM gl_period_balances
     WHERE entity_id = $1 AND period_id = $2
     GROUP BY economic_category
     ORDER BY economic_category`,
    [entityId, periodId],
  );

  res.json({ trialBalance: result.rows });
});

// --- Period Lifecycle ---

glRouter.post('/periods/:periodId/soft-close', async (req: Request, res: Response) => {
  const result = await softClosePeriod(req.params.periodId as string, req.body.closedBy);
  res.json(result);
});

glRouter.post('/periods/:periodId/hard-close', async (req: Request, res: Response) => {
  const result = await hardClosePeriod(req.params.periodId as string, req.body.closedBy);
  res.json(result);
});

glRouter.post('/periods/:periodId/reopen', async (req: Request, res: Response) => {
  const result = await reopenPeriod(req.params.periodId as string, req.body.reopenedBy);
  res.json(result);
});

// --- Financial Reporting (CQRS reads from TimescaleDB) ---

glRouter.get('/profit-and-loss', async (req: Request, res: Response) => {
  const entityId = req.query.entityId as string;
  const periodId = req.query.periodId as string;
  const fundId = req.query.fundId as string | undefined;

  if (!entityId || !periodId) {
    res.status(400).json({ error: 'Required: entityId, periodId' });
    return;
  }

  const pnl = await getProfitAndLoss(entityId, periodId, fundId);
  res.json(pnl);
});

glRouter.get('/balance-sheet', async (req: Request, res: Response) => {
  const entityId = req.query.entityId as string;
  const periodId = req.query.periodId as string;
  const fundId = req.query.fundId as string | undefined;

  if (!entityId || !periodId) {
    res.status(400).json({ error: 'Required: entityId, periodId' });
    return;
  }

  const bs = await getBalanceSheet(entityId, periodId, fundId);
  res.json(bs);
});

glRouter.get('/fund-balances', async (req: Request, res: Response) => {
  const entityId = req.query.entityId as string;
  const periodId = req.query.periodId as string;

  if (!entityId || !periodId) {
    res.status(400).json({ error: 'Required: entityId, periodId' });
    return;
  }

  const funds = await getFundBalances(entityId, periodId);
  res.json({ funds });
});

// --- Statutory Mappings ---

glRouter.post('/statutory-mappings', async (req: Request, res: Response) => {
  const id = await createStatutoryMapping(req.body);
  res.status(201).json({ id });
});

glRouter.get('/statutory-mappings/:id', async (req: Request, res: Response) => {
  const mapping = await getStatutoryMapping(req.params.id as string);
  if (!mapping) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(mapping);
});

glRouter.get('/statutory-mappings/by-jurisdiction/:jurisdiction', async (req: Request, res: Response) => {
  const mappings = await listStatutoryMappings(req.params.jurisdiction as string);
  res.json({ mappings });
});

glRouter.patch('/statutory-mappings/:id', async (req: Request, res: Response) => {
  const updated = await updateStatutoryMapping(req.params.id as string, req.body);
  if (!updated) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ success: true });
});

glRouter.delete('/statutory-mappings/:id', async (req: Request, res: Response) => {
  const deleted = await deleteStatutoryMapping(req.params.id as string);
  if (!deleted) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ success: true });
});

glRouter.get('/statutory-mappings/resolve', async (req: Request, res: Response) => {
  const { jurisdiction, nodeRefType, economicCategory, asOfDate } = req.query;
  if (!jurisdiction || !nodeRefType || !economicCategory || !asOfDate) {
    res.status(400).json({ error: 'Required: jurisdiction, nodeRefType, economicCategory, asOfDate' });
    return;
  }
  const result = await resolveStatutoryCode(
    jurisdiction as string, nodeRefType as string,
    economicCategory as string, asOfDate as string,
  );
  if (!result) { res.status(404).json({ error: 'No matching mapping' }); return; }
  res.json(result);
});
