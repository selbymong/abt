import { Router, Request, Response, NextFunction } from 'express';
import {
  generateIncomeStatement,
  generateBalanceSheet,
  generateCashFlowStatement,
  generateEquityChanges,
} from '../../services/gl/financial-statements-service.js';
import type { StatementType } from '../../services/gl/financial-statements-service.js';

export const financialStatementsRouter = Router();

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// GET /api/financial-statements/:type?entityId=&periodId=&priorPeriodId=&currency=
financialStatementsRouter.get('/:type', wrap(async (req, res) => {
  const type = (req.params.type as string).toUpperCase() as StatementType;
  const entityId = req.query.entityId as string;
  const periodId = req.query.periodId as string;
  const priorPeriodId = req.query.priorPeriodId as string | undefined;
  const currency = req.query.currency as string | undefined;

  if (!entityId || !periodId) {
    res.status(400).json({ error: 'entityId and periodId are required' });
    return;
  }

  const generators: Record<StatementType, typeof generateIncomeStatement> = {
    INCOME_STATEMENT: generateIncomeStatement,
    BALANCE_SHEET: generateBalanceSheet,
    CASH_FLOW: generateCashFlowStatement,
    EQUITY_CHANGES: generateEquityChanges,
  };

  const generator = generators[type];
  if (!generator) {
    res.status(400).json({ error: `Invalid statement type: ${type}. Must be one of: ${Object.keys(generators).join(', ')}` });
    return;
  }

  const statement = await generator(entityId, periodId, priorPeriodId, currency);
  res.json(statement);
}));

// GET /api/financial-statements/full-set?entityId=&periodId=&priorPeriodId=&currency=
financialStatementsRouter.get('/', wrap(async (req, res) => {
  const entityId = req.query.entityId as string;
  const periodId = req.query.periodId as string;
  const priorPeriodId = req.query.priorPeriodId as string | undefined;
  const currency = req.query.currency as string | undefined;

  if (!entityId || !periodId) {
    res.status(400).json({ error: 'entityId and periodId are required' });
    return;
  }

  const [incomeStatement, balanceSheet, cashFlow, equityChanges] = await Promise.all([
    generateIncomeStatement(entityId, periodId, priorPeriodId, currency),
    generateBalanceSheet(entityId, periodId, priorPeriodId, currency),
    generateCashFlowStatement(entityId, periodId, priorPeriodId, currency),
    generateEquityChanges(entityId, periodId, priorPeriodId, currency),
  ]);

  res.json({ incomeStatement, balanceSheet, cashFlow, equityChanges });
}));
