import { Router, Request, Response } from 'express';
import { postJournalEntry, PostJournalEntryInput } from '../../services/gl/journal-posting-service.js';
import { softClosePeriod, hardClosePeriod, reopenPeriod } from '../../services/gl/period-service.js';
import { getProfitAndLoss, getBalanceSheet, getFundBalances, getOutcomeAttributedPnL } from '../../services/gl/reporting-service.js';
import { getSegmentReport, getSegmentDetail } from '../../services/gl/segment-reporting-service.js';
import {
  validateBody, postJournalEntrySchema, createTemporalClaimSchema, createProvisionSchema,
  periodActionSchema, createStatutoryMappingSchema, recognizeClaimSchema,
  recognizeAllClaimsSchema, autoReverseClaimsSchema, updateECLSchema,
  createLeaseSchema, processLeasePaymentSchema, createAspeLeaseSchema,
  processAspeLeasePaymentSchema, createLeaseFrameworkAwareSchema,
  provisionPeriodActionSchema,
  settleProvisionSchema, createRelatedPartySchema, createRelatedPartyTransactionSchema,
  validateArmsLengthSchema, computeRetainedEarningsSchema, recordOCISchema,
  recycleOCISchema, generateEquitySectionSchema,
} from './validation.js';
import {
  createStatutoryMapping,
  getStatutoryMapping,
  listStatutoryMappings,
  updateStatutoryMapping,
  deleteStatutoryMapping,
  resolveStatutoryCode,
} from '../../services/gl/statutory-mapping-service.js';
import {
  createTemporalClaim,
  getTemporalClaim,
  listTemporalClaims,
  updateTemporalClaim,
  recognizeClaim,
  recognizeAllClaims,
  autoReverseClaims,
  updateECL,
  writeOffClaim,
} from '../../services/gl/accruals-service.js';
import {
  createLease,
  createAspeOperatingLease,
  processAspeLeasePayment,
  getAspeOperatingLease,
  listAspeOperatingLeases,
  createLeaseFrameworkAware,
  getRightOfUseAsset,
  listRightOfUseAssets,
  getLeaseLiability,
  listLeaseLiabilities,
  processLeasePayment,
} from '../../services/gl/lease-service.js';
import {
  createProvision,
  getProvision,
  listProvisions,
  updateProvision,
  deleteProvision,
  recognizeProvision,
  unwindProvisionDiscount,
  settleProvision,
  getProvisionsNeedingReview,
} from '../../services/gl/provision-service.js';
import {
  createRelatedParty,
  getRelatedParties,
  getRelatedPartyBetween,
  updateRelatedParty,
  deleteRelatedParty,
  createRelatedPartyTransaction,
  getRelatedPartyTransactions,
  validateArmsLength,
  generateDisclosureSchedule,
} from '../../services/gl/related-party-service.js';
import {
  computeRetainedEarnings,
  getRetainedEarnings,
  recordOCI,
  recycleOCI,
  getOCIComponents,
  isRecyclable,
  generateEquitySection,
  getEquitySection,
  getEquityBreakdown,
} from '../../services/gl/equity-close-service.js';
import { query } from '../../lib/pg.js';
import { runCypher } from '../../lib/neo4j.js';

export const glRouter = Router();

// GET /gl/journal-entries — list journal entries for entity/period
glRouter.get('/journal-entries', async (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId as string;
    const periodId = req.query.periodId as string;
    if (!entityId) return res.status(400).json({ error: 'Required: entityId' });
    const periodFilter = periodId ? 'AND je.period_id = $periodId' : '';
    const results = await runCypher<{ je: Record<string, unknown> }>(
      `MATCH (je:JournalEntry {entity_id: $entityId})
       WHERE true ${periodFilter}
       RETURN properties(je) AS je
       ORDER BY je.created_at DESC
       LIMIT 100`,
      { entityId, periodId: periodId ?? null },
    );
    res.json({ items: results.map((r) => r.je) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /gl/journal-entries/:id — get a single journal entry with lines
glRouter.get('/journal-entries/:id', async (req: Request, res: Response) => {
  try {
    const results = await runCypher<{ je: Record<string, unknown> }>(
      `MATCH (je:JournalEntry {id: $id})
       RETURN properties(je) AS je`,
      { id: req.params.id },
    );
    if (results.length === 0) return res.status(404).json({ error: 'JournalEntry not found' });

    const lines = await runCypher<{ ll: Record<string, unknown> }>(
      `MATCH (ll:LedgerLine {journal_entry_id: $jeId})
       RETURN properties(ll) AS ll`,
      { jeId: req.params.id },
    );
    res.json({ ...results[0].je, lines: lines.map((l) => l.ll) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /gl/journal-entries — post a journal entry
glRouter.post('/journal-entries', validateBody(postJournalEntrySchema), async (req: Request, res: Response) => {
  try {
    const journalEntryId = await postJournalEntry(req.body as PostJournalEntryInput);
    res.status(201).json({ journalEntryId });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /gl/period-balances — query TimescaleDB projection
glRouter.get('/period-balances', async (req: Request, res: Response) => {
  try {
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
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /gl/trial-balance — summarized trial balance
glRouter.get('/trial-balance', async (req: Request, res: Response) => {
  try {
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
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Period Lifecycle ---

glRouter.post('/periods/:periodId/soft-close', validateBody(periodActionSchema), async (req: Request, res: Response) => {
  try {
    const result = await softClosePeriod(req.params.periodId as string, req.body.closedBy);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/periods/:periodId/hard-close', validateBody(periodActionSchema), async (req: Request, res: Response) => {
  try {
    const result = await hardClosePeriod(req.params.periodId as string, req.body.closedBy);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/periods/:periodId/reopen', validateBody(periodActionSchema), async (req: Request, res: Response) => {
  try {
    const result = await reopenPeriod(req.params.periodId as string, req.body.reopenedBy);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Financial Reporting (CQRS reads from TimescaleDB) ---

glRouter.get('/profit-and-loss', async (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId as string;
    const periodId = req.query.periodId as string;
    const fundId = req.query.fundId as string | undefined;

    if (!entityId || !periodId) {
      res.status(400).json({ error: 'Required: entityId, periodId' });
      return;
    }

    const pnl = await getProfitAndLoss(entityId, periodId, fundId);
    res.json(pnl);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/balance-sheet', async (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId as string;
    const periodId = req.query.periodId as string;
    const fundId = req.query.fundId as string | undefined;

    if (!entityId || !periodId) {
      res.status(400).json({ error: 'Required: entityId, periodId' });
      return;
    }

    const bs = await getBalanceSheet(entityId, periodId, fundId);
    res.json(bs);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/fund-balances', async (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId as string;
    const periodId = req.query.periodId as string;

    if (!entityId || !periodId) {
      res.status(400).json({ error: 'Required: entityId, periodId' });
      return;
    }

    const funds = await getFundBalances(entityId, periodId);
    res.json({ funds });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/attributed-pnl', async (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId as string;
    const periodId = req.query.periodId as string;
    const maxHops = req.query.maxHops ? Number(req.query.maxHops) : 6;

    if (!entityId || !periodId) {
      res.status(400).json({ error: 'Required: entityId, periodId' });
      return;
    }

    const result = await getOutcomeAttributedPnL(entityId, periodId, maxHops);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Statutory Mappings ---

glRouter.post('/statutory-mappings', validateBody(createStatutoryMappingSchema), async (req: Request, res: Response) => {
  try {
    const id = await createStatutoryMapping(req.body);
    res.status(201).json({ id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/statutory-mappings/:id', async (req: Request, res: Response) => {
  try {
    const mapping = await getStatutoryMapping(req.params.id as string);
    if (!mapping) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(mapping);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/statutory-mappings/by-jurisdiction/:jurisdiction', async (req: Request, res: Response) => {
  try {
    const mappings = await listStatutoryMappings(req.params.jurisdiction as string);
    res.json({ mappings });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.patch('/statutory-mappings/:id', async (req: Request, res: Response) => {
  try {
    const updated = await updateStatutoryMapping(req.params.id as string, req.body);
    if (!updated) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.delete('/statutory-mappings/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteStatutoryMapping(req.params.id as string);
    if (!deleted) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- TemporalClaim / Accruals ---

glRouter.post('/temporal-claims', validateBody(createTemporalClaimSchema), async (req: Request, res: Response) => {
  try {
    const id = await createTemporalClaim(req.body);
    res.status(201).json({ id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/temporal-claims/:id', async (req: Request, res: Response) => {
  try {
    const claim = await getTemporalClaim(req.params.id as string);
    if (!claim) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(claim);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/temporal-claims/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const claims = await listTemporalClaims(
      req.params.entityId as string,
      status as any,
    );
    res.json({ claims });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.patch('/temporal-claims/:id', async (req: Request, res: Response) => {
  try {
    const updated = await updateTemporalClaim(req.params.id as string, req.body);
    if (!updated) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/temporal-claims/:id/recognize', validateBody(recognizeClaimSchema), async (req: Request, res: Response) => {
  try {
    const { periodId } = req.body;
    const result = await recognizeClaim(req.params.id as string, periodId);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/temporal-claims/recognize-all', validateBody(recognizeAllClaimsSchema), async (req: Request, res: Response) => {
  try {
    const { entityId, periodId } = req.body;
    const result = await recognizeAllClaims(entityId, periodId);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/temporal-claims/auto-reverse', validateBody(autoReverseClaimsSchema), async (req: Request, res: Response) => {
  try {
    const { entityId, currentPeriodId, previousPeriodId } = req.body;
    const result = await autoReverseClaims(entityId, currentPeriodId, previousPeriodId);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/temporal-claims/:id/ecl', validateBody(updateECLSchema), async (req: Request, res: Response) => {
  try {
    const { collectabilityScore, eclAllowance } = req.body;
    const result = await updateECL(req.params.id as string, collectabilityScore, eclAllowance);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/temporal-claims/:id/write-off', async (req: Request, res: Response) => {
  try {
    const result = await writeOffClaim(req.params.id as string);
    res.json({ success: result });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/statutory-mappings/resolve', async (req: Request, res: Response) => {
  try {
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
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Lease Accounting ---

glRouter.post('/leases', validateBody(createLeaseSchema), async (req: Request, res: Response) => {
  try {
    const result = await createLease(req.body);
    res.status(201).json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/rou-assets/:id', async (req: Request, res: Response) => {
  try {
    const asset = await getRightOfUseAsset(req.params.id as string);
    if (!asset) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(asset);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/rou-assets/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const assets = await listRightOfUseAssets(req.params.entityId as string);
    res.json({ assets });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/lease-liabilities/:id', async (req: Request, res: Response) => {
  try {
    const liability = await getLeaseLiability(req.params.id as string);
    if (!liability) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(liability);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/lease-liabilities/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const liabilities = await listLeaseLiabilities(req.params.entityId as string);
    res.json({ liabilities });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/leases/process-payment', validateBody(processLeasePaymentSchema), async (req: Request, res: Response) => {
  try {
    const { leaseLiabilityId, rouAssetId, periodId } = req.body;
    const result = await processLeasePayment(leaseLiabilityId, rouAssetId, periodId);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- ASPE Operating Leases ---

glRouter.post('/leases/aspe', validateBody(createAspeLeaseSchema), async (req: Request, res: Response) => {
  try {
    const result = await createAspeOperatingLease(req.body);
    res.status(201).json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/leases/aspe/process-payment', validateBody(processAspeLeasePaymentSchema), async (req: Request, res: Response) => {
  try {
    const { temporalClaimId, periodId } = req.body;
    const result = await processAspeLeasePayment(temporalClaimId, periodId);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/leases/aspe/:id', async (req: Request, res: Response) => {
  try {
    const lease = await getAspeOperatingLease(req.params.id as string);
    if (!lease) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(lease);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/leases/aspe/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const leases = await listAspeOperatingLeases(req.params.entityId as string);
    res.json({ leases });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/leases/framework-aware', validateBody(createLeaseFrameworkAwareSchema), async (req: Request, res: Response) => {
  try {
    const result = await createLeaseFrameworkAware(req.body);
    res.status(201).json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Provisions (IAS 37) ---

glRouter.post('/provisions', validateBody(createProvisionSchema), async (req: Request, res: Response) => {
  try {
    const id = await createProvision(req.body);
    res.status(201).json({ id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/provisions/:id', async (req: Request, res: Response) => {
  try {
    const provision = await getProvision(req.params.id as string);
    if (!provision) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(provision);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/provisions/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const probability = req.query.probability as string | undefined;
    const provisions = await listProvisions(req.params.entityId as string, probability as any);
    res.json({ provisions });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.patch('/provisions/:id', async (req: Request, res: Response) => {
  try {
    const updated = await updateProvision(req.params.id as string, req.body);
    if (!updated) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.delete('/provisions/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteProvision(req.params.id as string);
    if (!deleted) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/provisions/:id/recognize', validateBody(provisionPeriodActionSchema), async (req: Request, res: Response) => {
  try {
    const { periodId } = req.body;
    const result = await recognizeProvision(req.params.id as string, periodId);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/provisions/:id/unwind', validateBody(provisionPeriodActionSchema), async (req: Request, res: Response) => {
  try {
    const { periodId } = req.body;
    const result = await unwindProvisionDiscount(req.params.id as string, periodId);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/provisions/:id/settle', validateBody(settleProvisionSchema), async (req: Request, res: Response) => {
  try {
    const { periodId, actualAmount } = req.body;
    const result = await settleProvision(req.params.id as string, periodId, actualAmount);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/provisions/review/:entityId', async (req: Request, res: Response) => {
  try {
    const periodEndDate = req.query.periodEndDate as string;
    if (!periodEndDate) { res.status(400).json({ error: 'Required: periodEndDate' }); return; }
    const provisions = await getProvisionsNeedingReview(req.params.entityId as string, periodEndDate);
    res.json({ provisions });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Related Party (IAS 24) ---

glRouter.post('/related-parties', validateBody(createRelatedPartySchema), async (req: Request, res: Response) => {
  try {
    await createRelatedParty(req.body);
    res.status(201).json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/related-parties/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const parties = await getRelatedParties(req.params.entityId as string);
    res.json({ relatedParties: parties });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/related-parties/between', async (req: Request, res: Response) => {
  try {
    const { entityId1, entityId2 } = req.query;
    if (!entityId1 || !entityId2) { res.status(400).json({ error: 'Required: entityId1, entityId2' }); return; }
    const rel = await getRelatedPartyBetween(entityId1 as string, entityId2 as string);
    if (!rel) { res.status(404).json({ error: 'No related party relationship found' }); return; }
    res.json(rel);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.patch('/related-parties', async (req: Request, res: Response) => {
  try {
    const { sourceEntityId, targetEntityId, ...updates } = req.body;
    if (!sourceEntityId || !targetEntityId) { res.status(400).json({ error: 'Required: sourceEntityId, targetEntityId' }); return; }
    const updated = await updateRelatedParty(sourceEntityId, targetEntityId, updates);
    if (!updated) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.delete('/related-parties', async (req: Request, res: Response) => {
  try {
    const { sourceEntityId, targetEntityId } = req.body;
    if (!sourceEntityId || !targetEntityId) { res.status(400).json({ error: 'Required: sourceEntityId, targetEntityId' }); return; }
    const deleted = await deleteRelatedParty(sourceEntityId, targetEntityId);
    if (!deleted) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/related-party-transactions', validateBody(createRelatedPartyTransactionSchema), async (req: Request, res: Response) => {
  try {
    await createRelatedPartyTransaction(req.body);
    res.status(201).json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/related-party-transactions/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const periodId = req.query.periodId as string | undefined;
    const transactions = await getRelatedPartyTransactions(req.params.entityId as string, periodId);
    res.json({ transactions });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/related-party-transactions/validate-arms-length', validateBody(validateArmsLengthSchema), async (req: Request, res: Response) => {
  try {
    const { entityId, periodId, method, tolerancePct } = req.body;
    const results = await validateArmsLength(entityId, periodId, method, tolerancePct);
    res.json({ results });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/related-party-transactions/disclosure/:entityId', async (req: Request, res: Response) => {
  try {
    const periodId = req.query.periodId as string;
    if (!periodId) { res.status(400).json({ error: 'Required: periodId' }); return; }
    const schedule = await generateDisclosureSchedule(req.params.entityId as string, periodId);
    res.json({ disclosures: schedule });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Equity Close ---

glRouter.post('/retained-earnings', validateBody(computeRetainedEarningsSchema), async (req: Request, res: Response) => {
  try {
    const id = await computeRetainedEarnings(req.body);
    res.status(201).json({ id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/retained-earnings', async (req: Request, res: Response) => {
  try {
    const { entityId, periodId, fundId } = req.query;
    if (!entityId || !periodId) { res.status(400).json({ error: 'Required: entityId, periodId' }); return; }
    const re = await getRetainedEarnings(entityId as string, periodId as string, fundId as string | undefined);
    if (!re) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(re);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/oci', validateBody(recordOCISchema), async (req: Request, res: Response) => {
  try {
    const id = await recordOCI(req.body);
    res.status(201).json({ id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/oci/:id/recycle', validateBody(recycleOCISchema), async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const result = await recycleOCI(req.params.id as string, amount);
    if (!result) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/oci/by-entity/:entityId', async (req: Request, res: Response) => {
  try {
    const periodId = req.query.periodId as string;
    if (!periodId) { res.status(400).json({ error: 'Required: periodId' }); return; }
    const components = await getOCIComponents(req.params.entityId as string, periodId);
    res.json({ components });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/oci/recyclable/:component', async (req: Request, res: Response) => {
  try {
    const recyclable = isRecyclable(req.params.component as any);
    res.json({ component: req.params.component, recyclable });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.post('/equity-section', validateBody(generateEquitySectionSchema), async (req: Request, res: Response) => {
  try {
    const { entityId, periodId, nciEquity } = req.body;
    const id = await generateEquitySection(entityId, periodId, nciEquity);
    res.status(201).json({ id });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/equity-section', async (req: Request, res: Response) => {
  try {
    const { entityId, periodId } = req.query;
    if (!entityId || !periodId) { res.status(400).json({ error: 'Required: entityId, periodId' }); return; }
    const es = await getEquitySection(entityId as string, periodId as string);
    if (!es) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(es);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/equity-breakdown', async (req: Request, res: Response) => {
  try {
    const { entityId, periodId } = req.query;
    if (!entityId || !periodId) { res.status(400).json({ error: 'Required: entityId, periodId' }); return; }
    const breakdown = await getEquityBreakdown(entityId as string, periodId as string);
    res.json({ breakdown });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Segment Reporting (IFRS 8) ---

glRouter.get('/segment-report', async (req: Request, res: Response) => {
  try {
    const { entityId, periodId, fundId } = req.query;
    if (!entityId || !periodId) { res.status(400).json({ error: 'Required: entityId, periodId' }); return; }
    const report = await getSegmentReport(entityId as string, periodId as string, fundId as string | undefined);
    res.json(report);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

glRouter.get('/segment-detail', async (req: Request, res: Response) => {
  try {
    const { entityId, periodId, initiativeId, fundId } = req.query;
    if (!entityId || !periodId || !initiativeId) {
      res.status(400).json({ error: 'Required: entityId, periodId, initiativeId' });
      return;
    }
    const detail = await getSegmentDetail(
      entityId as string, periodId as string, initiativeId as string, fundId as string | undefined,
    );
    res.json(detail);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
