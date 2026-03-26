import { Router, Request, Response } from 'express';
import {
  registerCOAMapping,
  registerCOAMappings,
  getCOAMapping,
  listCOAMappings,
  clearCOAMappings,
  validateImport,
  importLegacyGL,
  createNodesForUnmappedCodes,
  seedStatutoryMappingsFromCOA,
  verifyAgainstTrialBalance,
  getMigrationSummary,
} from '../../services/gl/coa-migration-service.js';
import {
  validateBody,
  registerCOAMappingSchema,
  validateImportSchema,
  importLegacyGLSchema,
  createNodesForUnmappedCodesSchema,
  seedStatutorySchema,
  verifyTrialBalanceSchema,
} from './validation.js';

export const migrationRouter = Router();

// --- COA Mappings ---

migrationRouter.post('/coa-mappings', validateBody(registerCOAMappingSchema), async (req: Request, res: Response) => {
  try {
    if (Array.isArray(req.body)) {
      const count = registerCOAMappings(req.body);
      res.status(201).json({ registered: count });
    } else {
      registerCOAMapping(req.body);
      res.status(201).json({ registered: 1 });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

migrationRouter.get('/coa-mappings', (_req: Request, res: Response) => {
  try {
    res.json(listCOAMappings());
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

migrationRouter.get('/coa-mappings/:coaCode', (req: Request, res: Response) => {
  try {
    const mapping = getCOAMapping(req.params.coaCode as string);
    if (!mapping) return res.status(404).json({ error: 'COA mapping not found' });
    res.json(mapping);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

migrationRouter.delete('/coa-mappings', (_req: Request, res: Response) => {
  try {
    clearCOAMappings();
    res.json({ cleared: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Validation ---

migrationRouter.post('/validate', validateBody(validateImportSchema), (req: Request, res: Response) => {
  try {
    const result = validateImport(req.body.entries ?? []);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Import ---

migrationRouter.post('/import', validateBody(importLegacyGLSchema), async (req: Request, res: Response) => {
  try {
    const { entityId, periodId, entries, currency } = req.body;
    if (!entityId || !periodId || !entries) {
      return res.status(400).json({ error: 'Required: entityId, periodId, entries' });
    }
    const result = await importLegacyGL(entityId, periodId, entries, currency);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Auto-create nodes ---

migrationRouter.post('/create-nodes', validateBody(createNodesForUnmappedCodesSchema), async (req: Request, res: Response) => {
  try {
    const { entityId, unmappedCodes } = req.body;
    if (!entityId || !unmappedCodes) {
      return res.status(400).json({ error: 'Required: entityId, unmappedCodes' });
    }
    const mappings = await createNodesForUnmappedCodes(entityId, unmappedCodes);
    res.status(201).json({ created: mappings.length, mappings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Seed StatutoryMappings ---

migrationRouter.post('/seed-statutory', validateBody(seedStatutorySchema), async (req: Request, res: Response) => {
  try {
    const { jurisdiction, asOfDate } = req.body;
    if (!jurisdiction || !asOfDate) {
      return res.status(400).json({ error: 'Required: jurisdiction, asOfDate' });
    }
    const result = await seedStatutoryMappingsFromCOA(jurisdiction, asOfDate);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Verification ---

migrationRouter.post('/verify', validateBody(verifyTrialBalanceSchema), async (req: Request, res: Response) => {
  try {
    const { entityId, periodId, trialBalance } = req.body;
    if (!entityId || !periodId || !trialBalance) {
      return res.status(400).json({ error: 'Required: entityId, periodId, trialBalance' });
    }
    const result = await verifyAgainstTrialBalance(entityId, periodId, trialBalance);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Summary ---

migrationRouter.get('/summary/:entityId/:sourceSystem', async (req: Request, res: Response) => {
  try {
    const summary = await getMigrationSummary(
      req.params.entityId as string,
      req.params.sourceSystem as string,
    );
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
