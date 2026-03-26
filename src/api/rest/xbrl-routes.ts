import { Router, Request, Response } from 'express';
import {
  getAvailableTags,
  lookupTag,
  tagMapping,
  bulkAutoTag,
  validateXBRLTagging,
  generateXBRLFacts,
  generateIXBRL,
} from '../../services/gl/xbrl-service.js';

export const xbrlRouter = Router();

// --- Taxonomy Catalog ---

xbrlRouter.get('/tags/:taxonomy', async (req: Request, res: Response) => {
  try {
    const tags = getAvailableTags(req.params.taxonomy as any);
    res.json(tags);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

xbrlRouter.get('/tags/:taxonomy/:tagName', async (req: Request, res: Response) => {
  try {
    const tag = lookupTag(req.params.tagName as string, req.params.taxonomy as any);
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    res.json(tag);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Tagging ---

xbrlRouter.post('/tag/:mappingId', async (req: Request, res: Response) => {
  try {
    const { xbrlElement, xbrlTaxonomy } = req.body;
    if (!xbrlElement || !xbrlTaxonomy) {
      return res.status(400).json({ error: 'xbrlElement and xbrlTaxonomy required' });
    }
    const success = await tagMapping(req.params.mappingId as string, xbrlElement, xbrlTaxonomy);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

xbrlRouter.post('/auto-tag/:jurisdiction', async (req: Request, res: Response) => {
  try {
    const result = await bulkAutoTag(req.params.jurisdiction as string);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Validation ---

xbrlRouter.get('/validate/:jurisdiction', async (req: Request, res: Response) => {
  try {
    const result = await validateXBRLTagging(req.params.jurisdiction as string);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Generation ---

xbrlRouter.get('/facts/:jurisdiction/:entityId/:periodId', async (req: Request, res: Response) => {
  try {
    const currency = (req.query.currency as string) ?? 'CAD';
    const result = await generateXBRLFacts(
      req.params.jurisdiction as string,
      req.params.entityId as string,
      req.params.periodId as string,
      currency,
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

xbrlRouter.get('/ixbrl/:jurisdiction/:entityId/:periodId', async (req: Request, res: Response) => {
  try {
    const currency = (req.query.currency as string) ?? 'CAD';
    const result = await generateIXBRL(
      req.params.jurisdiction as string,
      req.params.entityId as string,
      req.params.periodId as string,
      currency,
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
