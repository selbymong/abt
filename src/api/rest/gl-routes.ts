import { Router, Request, Response } from 'express';
import { postJournalEntry, PostJournalEntryInput } from '../../services/gl/journal-posting-service.js';
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
