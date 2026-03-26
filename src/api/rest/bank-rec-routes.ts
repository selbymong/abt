import { Router, Request, Response } from 'express';
import {
  createBankStatement,
  getBankStatement,
  listBankStatements,
  addStatementLine,
  getBankStatementLine,
  listStatementLines,
  importStatementLines,
  matchLineToEvent,
  manualClearLine,
  autoMatch,
  finalizeReconciliation,
  generateReconciliationReport,
} from '../../services/reconciliation/bank-reconciliation-service.js';

export const bankRecRouter = Router();

// --- Bank Statements ---

bankRecRouter.post('/statements', async (req: Request, res: Response) => {
  try {
    const id = await createBankStatement(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

bankRecRouter.get('/statements/:id', async (req: Request, res: Response) => {
  try {
    const bs = await getBankStatement(req.params.id as string);
    if (!bs) return res.status(404).json({ error: 'BankStatement not found' });
    res.json(bs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

bankRecRouter.get('/statements/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const bankAccountId = req.query.bankAccountId as string | undefined;
    const statements = await listBankStatements(req.params.entityId as string, bankAccountId);
    res.json(statements);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Statement Lines ---

bankRecRouter.post('/lines', async (req: Request, res: Response) => {
  try {
    const id = await addStatementLine(req.body);
    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

bankRecRouter.get('/lines/:id', async (req: Request, res: Response) => {
  try {
    const line = await getBankStatementLine(req.params.id as string);
    if (!line) return res.status(404).json({ error: 'BankStatementLine not found' });
    res.json(line);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

bankRecRouter.get('/lines/by-statement/:statementId', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const lines = await listStatementLines(req.params.statementId as string, status as any);
    res.json(lines);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

bankRecRouter.post('/lines/import', async (req: Request, res: Response) => {
  try {
    const { entityId, statementId, bankAccountId, lines } = req.body;
    const result = await importStatementLines(entityId, statementId, bankAccountId, lines);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Matching ---

bankRecRouter.post('/match', async (req: Request, res: Response) => {
  try {
    const { lineId, cashFlowEventId } = req.body;
    if (!lineId || !cashFlowEventId) {
      return res.status(400).json({ error: 'lineId and cashFlowEventId required' });
    }
    await matchLineToEvent(lineId, cashFlowEventId);
    res.json({ status: 'matched' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

bankRecRouter.post('/clear/:lineId', async (req: Request, res: Response) => {
  try {
    await manualClearLine(req.params.lineId as string);
    res.json({ status: 'cleared' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

bankRecRouter.post('/auto-match/:statementId', async (req: Request, res: Response) => {
  try {
    const dateTolerance = req.body.dateTolerance ?? 3;
    const result = await autoMatch(req.params.statementId as string, dateTolerance);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Reconciliation ---

bankRecRouter.post('/finalize/:statementId', async (req: Request, res: Response) => {
  try {
    const result = await finalizeReconciliation(req.params.statementId as string);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

bankRecRouter.get('/report/:bankAccountId/:statementId', async (req: Request, res: Response) => {
  try {
    const report = await generateReconciliationReport(
      req.params.bankAccountId as string,
      req.params.statementId as string,
    );
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
