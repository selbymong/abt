import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { postJournalEntry } from './journal-posting-service.js';
import { ClaimFullyRecognizedError, ClaimWrittenOffError } from '../../lib/errors.js';
import type {
  ClaimType, ClaimDirection, RecognitionMethod, ECLStage,
  TaxRecognitionBasis, NodeRefType, RecognitionScheduleEntry,
  TemporalClaimStatus,
} from '../../schema/neo4j/types.js';

// ============================================================
// TemporalClaim CRUD
// ============================================================

export interface CreateTemporalClaimInput {
  entityId: string;
  claimType: ClaimType;
  direction: ClaimDirection;
  originalAmount: number;
  currency: string;
  recognitionMethod: RecognitionMethod;
  recognitionSchedule: RecognitionScheduleEntry[];
  sourceNodeId: string;
  sourceNodeType: NodeRefType;
  periodIdOpened: string;
  autoReverse: boolean;
  collectabilityScore?: number;
  eclAllowance?: number;
  eclStage?: ECLStage;
  taxRecognitionBasis?: TaxRecognitionBasis;
  settlementNodeId?: string;
  outcomeNodeId?: string;
}

export async function createTemporalClaim(input: CreateTemporalClaimInput): Promise<string> {
  const id = uuid();
  const scheduleJson = JSON.stringify(input.recognitionSchedule);

  await runCypher(
    `CREATE (t:TemporalClaim {
      id: $id, entity_id: $entityId,
      claim_type: $claimType, direction: $direction,
      original_amount: $originalAmount,
      recognized_to_date: 0, remaining: $originalAmount,
      currency: $currency,
      recognition_method: $recognitionMethod,
      recognition_schedule: $recognitionSchedule,
      source_node_id: $sourceNodeId, source_node_type: $sourceNodeType,
      settlement_node_id: $settlementNodeId,
      outcome_node_id: $outcomeNodeId,
      period_id_opened: $periodIdOpened, period_id_closed: null,
      status: 'OPEN',
      auto_reverse: $autoReverse,
      collectability_score: $collectabilityScore,
      ecl_allowance: $eclAllowance,
      ecl_stage: $eclStage,
      tax_recognition_basis: $taxRecognitionBasis,
      materiality_flag: false,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      claimType: input.claimType,
      direction: input.direction,
      originalAmount: input.originalAmount,
      currency: input.currency,
      recognitionMethod: input.recognitionMethod,
      recognitionSchedule: scheduleJson,
      sourceNodeId: input.sourceNodeId,
      sourceNodeType: input.sourceNodeType,
      settlementNodeId: input.settlementNodeId ?? null,
      outcomeNodeId: input.outcomeNodeId ?? null,
      periodIdOpened: input.periodIdOpened,
      autoReverse: input.autoReverse,
      collectabilityScore: input.collectabilityScore ?? 1.0,
      eclAllowance: input.eclAllowance ?? 0,
      eclStage: input.eclStage ?? 'STAGE_1',
      taxRecognitionBasis: input.taxRecognitionBasis ?? 'ACCRUAL_BASIS',
    },
  );

  return id;
}

export async function getTemporalClaim(id: string) {
  const results = await runCypher<{ t: Record<string, unknown> }>(
    `MATCH (t:TemporalClaim {id: $id}) RETURN properties(t) AS t`,
    { id },
  );
  if (results.length === 0) return null;
  const t = results[0].t;
  // Parse recognition_schedule from JSON string
  if (typeof t.recognition_schedule === 'string') {
    t.recognition_schedule = JSON.parse(t.recognition_schedule);
  }
  return t;
}

export async function listTemporalClaims(entityId: string, statusFilter?: TemporalClaimStatus) {
  const whereClause = statusFilter
    ? `WHERE t.entity_id = $entityId AND t.status = $statusFilter`
    : `WHERE t.entity_id = $entityId`;

  const results = await runCypher<{ t: Record<string, unknown> }>(
    `MATCH (t:TemporalClaim) ${whereClause} RETURN properties(t) AS t ORDER BY t.created_at`,
    { entityId, statusFilter: statusFilter ?? null },
  );
  return results.map((r) => {
    if (typeof r.t.recognition_schedule === 'string') {
      r.t.recognition_schedule = JSON.parse(r.t.recognition_schedule);
    }
    return r.t;
  });
}

export async function updateTemporalClaim(
  id: string,
  updates: Record<string, unknown>,
): Promise<boolean> {
  const keys = Object.keys(updates);
  if (keys.length === 0) return false;

  // Serialize recognition_schedule if present
  const params: Record<string, unknown> = { id };
  for (const k of keys) {
    params[k] = k === 'recognition_schedule'
      ? JSON.stringify(updates[k])
      : updates[k];
  }

  const setParts = keys.map((k) => `t.${k} = $${k}`);
  setParts.push('t.updated_at = datetime()');

  const result = await runCypher<{ id: string }>(
    `MATCH (t:TemporalClaim {id: $id}) SET ${setParts.join(', ')} RETURN t.id AS id`,
    params,
  );
  return result.length > 0;
}

// ============================================================
// Recognition Engine
// ============================================================

/**
 * Process recognition for a single TemporalClaim in a given period.
 * Finds schedule entries matching the period, posts JournalEntries,
 * and updates recognized_to_date / remaining / status.
 */
export async function recognizeClaim(
  claimId: string,
  periodId: string,
): Promise<{ journalEntryIds: string[]; amountRecognized: number }> {
  const claim = await getTemporalClaim(claimId);
  if (!claim) throw new Error(`TemporalClaim ${claimId} not found`);
  if (claim.status === 'FULLY_RECOGNIZED') throw new ClaimFullyRecognizedError(claimId);
  if (claim.status === 'WRITTEN_OFF') throw new ClaimWrittenOffError(claimId);

  const schedule = claim.recognition_schedule as RecognitionScheduleEntry[];
  const dueEntries = schedule.filter(
    (e) => e.period_id === periodId && !e.recognized_at,
  );

  if (dueEntries.length === 0) {
    return { journalEntryIds: [], amountRecognized: 0 };
  }

  const journalEntryIds: string[] = [];
  let totalRecognized = 0;

  for (const entry of dueEntries) {
    // Determine debit/credit based on claim_type
    const { debitCategory, creditCategory } = getRecognitionCategories(claim.claim_type as ClaimType);

    const jeId = await postJournalEntry({
      entityId: claim.entity_id as string,
      periodId,
      entryType: 'ACCRUAL',
      reference: `RECOGNITION-${claimId}`,
      narrative: `Recognition of ${claim.claim_type} claim ${claimId}`,
      currency: claim.currency as string,
      validDate: new Date().toISOString().split('T')[0],
      sourceSystem: 'accruals-engine',
      lines: [
        {
          side: 'DEBIT',
          amount: entry.amount,
          nodeRefId: claim.source_node_id as string,
          nodeRefType: claim.source_node_type as NodeRefType,
          economicCategory: debitCategory,
        },
        {
          side: 'CREDIT',
          amount: entry.amount,
          nodeRefId: claim.source_node_id as string,
          nodeRefType: claim.source_node_type as NodeRefType,
          economicCategory: creditCategory,
        },
      ],
    });

    journalEntryIds.push(jeId);
    totalRecognized += entry.amount;

    // Mark schedule entry as recognized
    entry.recognized_at = new Date().toISOString();
  }

  // Update claim totals — Neo4j returns numeric values as Integer objects
  const newRecognizedToDate = Number(claim.recognized_to_date) + totalRecognized;
  const newRemaining = Number(claim.original_amount) - newRecognizedToDate;
  const newStatus: TemporalClaimStatus = newRemaining <= 0.001
    ? 'FULLY_RECOGNIZED'
    : 'PARTIALLY_RECOGNIZED';

  await updateTemporalClaim(claimId, {
    recognized_to_date: newRecognizedToDate,
    remaining: Math.max(0, newRemaining),
    status: newStatus,
    recognition_schedule: schedule,
    ...(newStatus === 'FULLY_RECOGNIZED' ? { period_id_closed: periodId } : {}),
  });

  return { journalEntryIds, amountRecognized: totalRecognized };
}

/**
 * Process all open claims for an entity in a given period.
 */
export async function recognizeAllClaims(
  entityId: string,
  periodId: string,
): Promise<{ claimCount: number; totalRecognized: number; journalEntryIds: string[] }> {
  const openClaims = await listTemporalClaims(entityId);
  const activeClaims = (openClaims as Record<string, unknown>[]).filter(
    (c) => c.status === 'OPEN' || c.status === 'PARTIALLY_RECOGNIZED',
  );

  let totalRecognized = 0;
  let claimCount = 0;
  const allJeIds: string[] = [];

  for (const claim of activeClaims) {
    const result = await recognizeClaim(claim.id as string, periodId);
    if (result.amountRecognized > 0) {
      claimCount++;
      totalRecognized += result.amountRecognized;
      allJeIds.push(...result.journalEntryIds);
    }
  }

  return { claimCount, totalRecognized, journalEntryIds: allJeIds };
}

// ============================================================
// Auto-Reversal
// ============================================================

/**
 * Generate reversal entries for auto_reverse claims that were
 * recognized in the previous period.
 */
export async function autoReverseClaims(
  entityId: string,
  currentPeriodId: string,
  previousPeriodId: string,
): Promise<{ reversalCount: number; journalEntryIds: string[] }> {
  // Find claims with auto_reverse=true that have recognized entries in previous period
  const results = await runCypher<{ t: Record<string, unknown> }>(
    `MATCH (t:TemporalClaim {entity_id: $entityId, auto_reverse: true})
     WHERE t.status IN ['PARTIALLY_RECOGNIZED', 'FULLY_RECOGNIZED']
     RETURN properties(t) AS t`,
    { entityId },
  );

  const journalEntryIds: string[] = [];
  let reversalCount = 0;

  for (const row of results) {
    const claim = row.t;
    if (typeof claim.recognition_schedule === 'string') {
      claim.recognition_schedule = JSON.parse(claim.recognition_schedule);
    }

    const schedule = claim.recognition_schedule as RecognitionScheduleEntry[];
    const previousEntries = schedule.filter(
      (e) => e.period_id === previousPeriodId && e.recognized_at,
    );

    if (previousEntries.length === 0) continue;

    const totalToReverse = previousEntries.reduce((sum, e) => sum + e.amount, 0);
    const { debitCategory, creditCategory } = getRecognitionCategories(claim.claim_type as ClaimType);

    // Reversal swaps debit/credit
    const jeId = await postJournalEntry({
      entityId: claim.entity_id as string,
      periodId: currentPeriodId,
      entryType: 'REVERSAL',
      reference: `AUTO-REVERSAL-${claim.id}`,
      narrative: `Auto-reversal of ${claim.claim_type} claim ${claim.id} from period ${previousPeriodId}`,
      currency: claim.currency as string,
      validDate: new Date().toISOString().split('T')[0],
      sourceSystem: 'accruals-engine',
      lines: [
        {
          side: 'DEBIT',
          amount: totalToReverse,
          nodeRefId: claim.source_node_id as string,
          nodeRefType: claim.source_node_type as NodeRefType,
          economicCategory: creditCategory, // Reversed
        },
        {
          side: 'CREDIT',
          amount: totalToReverse,
          nodeRefId: claim.source_node_id as string,
          nodeRefType: claim.source_node_type as NodeRefType,
          economicCategory: debitCategory, // Reversed
        },
      ],
    });

    journalEntryIds.push(jeId);
    reversalCount++;
  }

  return { reversalCount, journalEntryIds };
}

// ============================================================
// ECL Update
// ============================================================

/**
 * Update ECL stage and allowance for a claim based on collectability score.
 */
export async function updateECL(
  claimId: string,
  collectabilityScore: number,
  eclAllowance: number,
): Promise<{ previousStage: string; newStage: ECLStage }> {
  const claim = await getTemporalClaim(claimId);
  if (!claim) throw new Error(`TemporalClaim ${claimId} not found`);

  const previousStage = claim.ecl_stage as string;

  // Stage determination per IFRS 9 simplified approach
  let newStage: ECLStage;
  if (collectabilityScore >= 0.8) {
    newStage = 'STAGE_1';
  } else if (collectabilityScore >= 0.5) {
    newStage = 'STAGE_2';
  } else {
    newStage = 'STAGE_3';
  }

  await updateTemporalClaim(claimId, {
    collectability_score: collectabilityScore,
    ecl_allowance: eclAllowance,
    ecl_stage: newStage,
  });

  return { previousStage, newStage };
}

/**
 * Write off a claim (uncollectable).
 */
export async function writeOffClaim(claimId: string): Promise<boolean> {
  return updateTemporalClaim(claimId, {
    status: 'WRITTEN_OFF',
    remaining: 0,
  });
}

// ============================================================
// Helpers
// ============================================================

function getRecognitionCategories(claimType: ClaimType): {
  debitCategory: 'ASSET' | 'LIABILITY' | 'REVENUE' | 'EXPENSE';
  creditCategory: 'ASSET' | 'LIABILITY' | 'REVENUE' | 'EXPENSE';
} {
  switch (claimType) {
    case 'ACCRUED_REVENUE':
      // DR Asset (Receivable), CR Revenue
      return { debitCategory: 'ASSET', creditCategory: 'REVENUE' };
    case 'DEFERRED_REVENUE':
      // DR Liability (Unearned), CR Revenue
      return { debitCategory: 'LIABILITY', creditCategory: 'REVENUE' };
    case 'PREPAID_EXPENSE':
      // DR Expense, CR Asset (Prepaid)
      return { debitCategory: 'EXPENSE', creditCategory: 'ASSET' };
    case 'ACCRUED_LIABILITY':
      // DR Expense, CR Liability (Accrued)
      return { debitCategory: 'EXPENSE', creditCategory: 'LIABILITY' };
  }
}
