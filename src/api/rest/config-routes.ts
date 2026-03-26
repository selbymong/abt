import { Router, Request, Response } from 'express';
import {
  resolveConfig,
  setConfig,
  ScopeType,
} from '../../services/config/configuration-service.js';

export const configRouter = Router();

// GET /config/:key — resolve config with cascade
configRouter.get('/:key', async (req: Request, res: Response) => {
  try {
    const key = req.params.key as string;
    const entityId = req.query.entityId as string | undefined;
    const asOfDate = req.query.asOfDate as string | undefined;

    const config = await resolveConfig(key, { entityId, asOfDate });
    if (!config) {
      res.status(404).json({ error: `Configuration '${key}' not found` });
      return;
    }
    res.json(config);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// PUT /config/:key — set config value
configRouter.put('/:key', async (req: Request, res: Response) => {
  try {
    const key = req.params.key as string;
    const {
      scopeType, scopeId, scopeId2,
      valueType, valueString, valueNumeric, valueBoolean, valueJson,
      validFrom, validUntil, changedBy, changeReason, requiresRestatement,
    } = req.body;

    if (!scopeType || !valueType || !validFrom || !changedBy) {
      res.status(400).json({
        error: 'Required: scopeType, valueType, validFrom, changedBy',
      });
      return;
    }

    const config = await setConfig({
      key,
      scopeType: scopeType as ScopeType,
      scopeId,
      scopeId2,
      valueType,
      valueString,
      valueNumeric,
      valueBoolean,
      valueJson,
      validFrom,
      validUntil,
      changedBy,
      changeReason,
      requiresRestatement,
    });

    res.status(201).json(config);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
