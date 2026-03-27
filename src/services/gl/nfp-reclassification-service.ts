/**
 * NFP Net Asset Reclassification Service
 *
 * Auto-reclassifies fund balances when time or purpose restrictions are met/expire.
 * Per ASC 958 / ASNFPO:
 * - TEMPORARILY_RESTRICTED → UNRESTRICTED when restriction expires or purpose is fulfilled
 * - Posts reclassification journal entry (DR Temp Restricted, CR Unrestricted)
 * - Tracks reclassification history for disclosure
 * - Supports batch scanning for expired restrictions
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import { postJournalEntry } from './journal-posting-service.js';
import type { FundType } from '../../schema/neo4j/types.js';

// ============================================================
// Types
// ============================================================

export interface ReclassificationInput {
  fundId: string;
  entityId: string;
  periodId: string;
  currency: string;
  amount: number;
  fromClass: FundType;
  toClass: FundType;
  reason: string;
  reclassificationDate: string;
  approvedBy?: string;
}

export interface ReclassificationResult {
  reclassificationId: string;
  fundId: string;
  fromClass: FundType;
  toClass: FundType;
  amount: number;
  journalEntryId: string;
  reclassificationDate: string;
}

export interface ExpiredRestriction {
  fundId: string;
  fundLabel: string;
  entityId: string;
  fundType: FundType;
  restrictionExpiry: string;
  restrictionPurpose?: string;
  netBalance: number;
}

export interface ReclassificationHistory {
  id: string;
  fund_id: string;
  entity_id: string;
  from_class: FundType;
  to_class: FundType;
  amount: number;
  reason: string;
  reclassification_date: string;
  journal_entry_id: string;
  approved_by?: string;
  created_at: string;
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Scan for funds with expired time restrictions that haven't been reclassified.
 * Returns funds where restriction_expiry <= asOfDate and fund_type is still TEMPORARILY_RESTRICTED.
 */
export async function scanExpiredRestrictions(
  entityId: string,
  asOfDate: string,
): Promise<ExpiredRestriction[]> {
  // Get temporarily restricted funds with expired restrictions
  const funds = await runCypher<{
    id: string;
    label: string;
    entity_id: string;
    fund_type: FundType;
    restriction_expiry: string;
    restriction_purpose?: string;
  }>(
    `MATCH (f:Fund {entity_id: $entityId})
     WHERE f.fund_type = 'TEMPORARILY_RESTRICTED'
       AND f.restriction_expiry IS NOT NULL
       AND f.restriction_expiry <= $asOfDate
     RETURN f.id AS id, f.label AS label, f.entity_id AS entity_id,
            f.fund_type AS fund_type, f.restriction_expiry AS restriction_expiry,
            f.restriction_purpose AS restriction_purpose`,
    { entityId, asOfDate },
  );

  if (funds.length === 0) return [];

  // Get net balances for these funds from TimescaleDB
  const fundIds = funds.map((f) => f.id);
  const balanceResult = await query(
    `SELECT fund_id,
            SUM(CASE WHEN economic_category IN ('REVENUE') THEN credit_total - debit_total
                     WHEN economic_category IN ('EXPENSE') THEN debit_total - credit_total
                     ELSE credit_total - debit_total END) AS net_balance
     FROM gl_period_balances
     WHERE entity_id = $1::uuid
       AND fund_id = ANY($2::uuid[])
     GROUP BY fund_id`,
    [entityId, fundIds],
  );

  const balanceMap = new Map<string, number>();
  for (const row of balanceResult.rows) {
    balanceMap.set(row.fund_id, Number(row.net_balance));
  }

  return funds.map((f) => ({
    fundId: f.id,
    fundLabel: f.label,
    entityId: f.entity_id,
    fundType: f.fund_type,
    restrictionExpiry: f.restriction_expiry,
    restrictionPurpose: f.restriction_purpose,
    netBalance: balanceMap.get(f.id) ?? 0,
  }));
}

/**
 * Reclassify a fund's net assets from one restriction class to another.
 * Posts a reclassification journal entry and updates the fund node.
 */
export async function reclassifyFund(
  input: ReclassificationInput,
): Promise<ReclassificationResult> {
  const { fundId, entityId, periodId, currency, amount, fromClass, toClass, reason, reclassificationDate, approvedBy } = input;

  // Validate fund exists and matches fromClass
  const funds = await runCypher<{ id: string; fund_type: FundType; entity_id: string }>(
    `MATCH (f:Fund {id: $fundId, entity_id: $entityId})
     RETURN f.id AS id, f.fund_type AS fund_type, f.entity_id AS entity_id`,
    { fundId, entityId },
  );

  if (funds.length === 0) {
    throw new Error(`Fund ${fundId} not found for entity ${entityId}`);
  }

  if (funds[0].fund_type !== fromClass) {
    throw new Error(`Fund ${fundId} is ${funds[0].fund_type}, expected ${fromClass}`);
  }

  if (fromClass === toClass) {
    throw new Error('fromClass and toClass must be different');
  }

  if (amount <= 0) {
    throw new Error('Reclassification amount must be positive');
  }

  // Validate: cannot reclassify FROM unrestricted or permanently restricted
  if (fromClass === 'UNRESTRICTED') {
    throw new Error('Cannot reclassify from UNRESTRICTED');
  }
  if (fromClass === 'PERMANENTLY_RESTRICTED' && toClass !== 'TEMPORARILY_RESTRICTED') {
    throw new Error('PERMANENTLY_RESTRICTED can only be reclassified to TEMPORARILY_RESTRICTED (board-designated)');
  }

  const reclassificationId = uuid();

  // Post reclassification journal entry
  // DR: fromClass equity account (reduces restricted net assets)
  // CR: toClass equity account (increases unrestricted net assets)
  const journalEntryId = await postJournalEntry({
    entityId,
    periodId,
    entryType: 'ADJUSTMENT',
    reference: `RECLASS-${reclassificationId.slice(0, 8)}`,
    narrative: `Reclassification: ${fromClass} → ${toClass} — ${reason}`,
    currency,
    validDate: reclassificationDate,
    approvedBy,
    lines: [
      {
        side: 'DEBIT',
        amount,
        nodeRefId: fundId,
        nodeRefType: 'FUND' as any,
        economicCategory: 'EQUITY',
        fundId,
      },
      {
        side: 'CREDIT',
        amount,
        nodeRefId: fundId,
        nodeRefType: 'FUND' as any,
        economicCategory: 'EQUITY',
      },
    ],
  });

  // Update fund type if fully reclassified (toClass)
  // For partial reclassifications, the fund stays at its current type
  // The full reclassification updates the fund_type
  if (toClass === 'UNRESTRICTED') {
    // Check if this fully depletes the restricted balance
    const balanceResult = await query(
      `SELECT COALESCE(SUM(credit_total - debit_total), 0) AS remaining
       FROM gl_period_balances
       WHERE entity_id = $1::uuid AND fund_id = $2::uuid`,
      [entityId, fundId],
    );
    const remaining = Number(balanceResult.rows[0]?.remaining ?? 0) - amount;

    if (remaining <= 0) {
      await runCypher(
        `MATCH (f:Fund {id: $fundId})
         SET f.fund_type = 'UNRESTRICTED', f.updated_at = datetime()`,
        { fundId },
      );
    }
  }

  // Record reclassification history in PG
  await query(
    `INSERT INTO nfp_reclassifications (id, fund_id, entity_id, from_class, to_class, amount,
       reason, reclassification_date, journal_entry_id, approved_by, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
    [reclassificationId, fundId, entityId, fromClass, toClass, amount,
     reason, reclassificationDate, journalEntryId, approvedBy ?? null],
  );

  return {
    reclassificationId,
    fundId,
    fromClass,
    toClass,
    amount,
    journalEntryId,
    reclassificationDate,
  };
}

/**
 * Auto-reclassify all funds with expired time restrictions for an entity.
 * Convenience method that scans + reclassifies in batch.
 */
export async function autoReclassifyExpired(
  entityId: string,
  periodId: string,
  currency: string,
  asOfDate: string,
  approvedBy?: string,
): Promise<ReclassificationResult[]> {
  const expired = await scanExpiredRestrictions(entityId, asOfDate);
  const results: ReclassificationResult[] = [];

  for (const fund of expired) {
    if (fund.netBalance <= 0) continue;

    const result = await reclassifyFund({
      fundId: fund.fundId,
      entityId,
      periodId,
      currency,
      amount: fund.netBalance,
      fromClass: 'TEMPORARILY_RESTRICTED',
      toClass: 'UNRESTRICTED',
      reason: `Time restriction expired on ${fund.restrictionExpiry}`,
      reclassificationDate: asOfDate,
      approvedBy,
    });
    results.push(result);
  }

  return results;
}

/**
 * Mark a fund's purpose restriction as fulfilled and reclassify.
 */
export async function fulfillPurposeRestriction(
  fundId: string,
  entityId: string,
  periodId: string,
  currency: string,
  amount: number,
  fulfillmentDate: string,
  fulfillmentDescription: string,
  approvedBy?: string,
): Promise<ReclassificationResult> {
  return reclassifyFund({
    fundId,
    entityId,
    periodId,
    currency,
    amount,
    fromClass: 'TEMPORARILY_RESTRICTED',
    toClass: 'UNRESTRICTED',
    reason: `Purpose restriction fulfilled: ${fulfillmentDescription}`,
    reclassificationDate: fulfillmentDate,
    approvedBy,
  });
}

/**
 * Get reclassification history for an entity.
 */
export async function getReclassificationHistory(
  entityId: string,
  fundId?: string,
): Promise<ReclassificationHistory[]> {
  let sql = `SELECT id, fund_id, entity_id, from_class, to_class, amount,
                    reason, reclassification_date, journal_entry_id, approved_by, created_at
             FROM nfp_reclassifications
             WHERE entity_id = $1::uuid`;
  const params: unknown[] = [entityId];

  if (fundId) {
    sql += ` AND fund_id = $2::uuid`;
    params.push(fundId);
  }

  sql += ` ORDER BY reclassification_date DESC, created_at DESC`;

  const result = await query(sql, params);
  return result.rows as ReclassificationHistory[];
}

/**
 * Get fund balance summary with restriction status for NFP entity.
 */
export async function getFundRestrictionSummary(
  entityId: string,
  periodId?: string,
): Promise<{
  entityId: string;
  funds: Array<{
    fundId: string;
    label: string;
    fundType: FundType;
    restrictionExpiry?: string;
    restrictionPurpose?: string;
    netBalance: number;
    isExpired: boolean;
  }>;
  totalUnrestricted: number;
  totalTemporarilyRestricted: number;
  totalPermanentlyRestricted: number;
  totalEndowment: number;
}> {
  // Get all funds for entity
  const funds = await runCypher<{
    id: string;
    label: string;
    fund_type: FundType;
    restriction_expiry?: string;
    restriction_purpose?: string;
  }>(
    `MATCH (f:Fund {entity_id: $entityId})
     RETURN f.id AS id, f.label AS label, f.fund_type AS fund_type,
            f.restriction_expiry AS restriction_expiry, f.restriction_purpose AS restriction_purpose`,
    { entityId },
  );

  // Get balances from PG
  let balanceSql = `SELECT fund_id,
                           COALESCE(SUM(credit_total - debit_total), 0) AS net_balance
                    FROM gl_period_balances
                    WHERE entity_id = $1::uuid AND fund_id IS NOT NULL`;
  const params: unknown[] = [entityId];

  if (periodId) {
    balanceSql += ` AND period_id = $2::uuid`;
    params.push(periodId);
  }
  balanceSql += ` GROUP BY fund_id`;

  const balanceResult = await query(balanceSql, params);
  const balanceMap = new Map<string, number>();
  for (const row of balanceResult.rows) {
    balanceMap.set(row.fund_id, Number(row.net_balance));
  }

  const now = new Date().toISOString().slice(0, 10);
  let totalUnrestricted = 0;
  let totalTemporarilyRestricted = 0;
  let totalPermanentlyRestricted = 0;
  let totalEndowment = 0;

  const fundList = funds.map((f) => {
    const netBalance = balanceMap.get(f.id) ?? 0;
    const isExpired = f.fund_type === 'TEMPORARILY_RESTRICTED' &&
      !!f.restriction_expiry && f.restriction_expiry <= now;

    switch (f.fund_type) {
      case 'UNRESTRICTED': totalUnrestricted += netBalance; break;
      case 'TEMPORARILY_RESTRICTED': totalTemporarilyRestricted += netBalance; break;
      case 'PERMANENTLY_RESTRICTED': totalPermanentlyRestricted += netBalance; break;
      case 'ENDOWMENT': totalEndowment += netBalance; break;
    }

    return {
      fundId: f.id,
      label: f.label,
      fundType: f.fund_type,
      restrictionExpiry: f.restriction_expiry,
      restrictionPurpose: f.restriction_purpose,
      netBalance,
      isExpired,
    };
  });

  return {
    entityId,
    funds: fundList,
    totalUnrestricted,
    totalTemporarilyRestricted,
    totalPermanentlyRestricted,
    totalEndowment,
  };
}
