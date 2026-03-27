/**
 * Government Grants Service (IAS 20)
 *
 * Implements IAS 20 government grant accounting:
 * - Income approach: grant as DEFERRED_REVENUE, recognized to P&L over the periods
 *   in which the related costs are recognized
 * - Asset approach: grant deducted from carrying amount of the related asset,
 *   recognized as reduced depreciation over asset life
 * - Condition tracking: grants may have conditions that must be satisfied
 * - Clawback assessment: probability and estimated amount of potential repayment
 *
 * Builds on the existing TemporalClaim infrastructure (DEFERRED_REVENUE claims).
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { postJournalEntry } from './journal-posting-service.js';
import type {
  RecognitionMethod,
  RecognitionScheduleEntry,
  GrantApproach,
  NodeRefType,
} from '../../schema/neo4j/types.js';

// ============================================================
// Types
// ============================================================

export interface CreateGrantInput {
  entityId: string;
  grantProgramName: string;
  amount: number;
  currency: string;
  approach: GrantApproach;
  recognitionMethod: RecognitionMethod;
  recognitionSchedule: RecognitionScheduleEntry[];
  sourceNodeId: string;
  sourceNodeType: NodeRefType;
  periodIdOpened: string;
  conditionDescription?: string;
  relatedAssetId?: string;
  fundId?: string;
}

export interface GrantSummary {
  id: string;
  entity_id: string;
  grant_program_name: string;
  grant_approach: GrantApproach;
  original_amount: number;
  recognized_to_date: number;
  remaining: number;
  condition_met: boolean;
  clawback_probability: number;
  clawback_amount: number;
  status: string;
  created_at: string;
}

export interface GrantRecognitionResult {
  grantId: string;
  periodId: string;
  amountRecognized: number;
  journalEntryId: string;
  approach: GrantApproach;
}

export interface ClawbackAssessmentResult {
  grantId: string;
  clawbackProbability: number;
  clawbackAmount: number;
  provisionRequired: boolean;
  provisionAmount: number;
}

// ============================================================
// Grant CRUD
// ============================================================

/**
 * Create a government grant as a DEFERRED_REVENUE TemporalClaim
 * with IAS 20-specific properties.
 */
export async function createGrant(input: CreateGrantInput): Promise<string> {
  const id = uuid();
  const scheduleJson = JSON.stringify(input.recognitionSchedule);

  await runCypher(
    `CREATE (t:TemporalClaim {
      id: $id, entity_id: $entityId,
      claim_type: 'DEFERRED_REVENUE', direction: 'PAYABLE',
      original_amount: $amount,
      recognized_to_date: 0, remaining: $amount,
      currency: $currency,
      recognition_method: $recognitionMethod,
      recognition_schedule: $recognitionSchedule,
      source_node_id: $sourceNodeId, source_node_type: $sourceNodeType,
      settlement_node_id: null, outcome_node_id: null,
      period_id_opened: $periodIdOpened, period_id_closed: null,
      status: 'OPEN',
      auto_reverse: false,
      collectability_score: 1.0,
      ecl_allowance: 0, ecl_stage: 'STAGE_1',
      tax_recognition_basis: 'ACCRUAL_BASIS',
      materiality_flag: false,
      grant_flag: true,
      grant_approach: $approach,
      grant_program_name: $grantProgramName,
      grant_condition_description: $conditionDescription,
      condition_met: $conditionMet,
      condition_met_date: null,
      clawback_probability: 0,
      clawback_amount: 0,
      related_asset_id: $relatedAssetId,
      fund_id: $fundId,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      amount: input.amount,
      currency: input.currency,
      recognitionMethod: input.recognitionMethod,
      recognitionSchedule: scheduleJson,
      sourceNodeId: input.sourceNodeId,
      sourceNodeType: input.sourceNodeType,
      periodIdOpened: input.periodIdOpened,
      approach: input.approach,
      grantProgramName: input.grantProgramName,
      conditionDescription: input.conditionDescription ?? null,
      conditionMet: !input.conditionDescription, // If no condition, it's met immediately
      relatedAssetId: input.relatedAssetId ?? null,
      fundId: input.fundId ?? null,
    },
  );

  // For asset approach, also reduce the related asset's carrying amount
  if (input.approach === 'ASSET' && input.relatedAssetId) {
    await runCypher(
      `MATCH (a:FixedAsset {id: $assetId})
       SET a.carrying_amount = a.carrying_amount - $amount,
           a.updated_at = datetime()`,
      { assetId: input.relatedAssetId, amount: input.amount },
    );
  }

  return id;
}

/**
 * Get a government grant by ID.
 */
export async function getGrant(grantId: string): Promise<GrantSummary | null> {
  const results = await runCypher<{ t: Record<string, unknown> }>(
    `MATCH (t:TemporalClaim {id: $id, grant_flag: true})
     RETURN properties(t) AS t`,
    { id: grantId },
  );

  if (results.length === 0) return null;
  return mapGrantSummary(results[0].t);
}

/**
 * List all government grants for an entity.
 */
export async function listGrants(
  entityId: string,
  statusFilter?: string,
): Promise<GrantSummary[]> {
  let whereClause = 'WHERE t.entity_id = $entityId AND t.grant_flag = true';
  if (statusFilter) {
    whereClause += ' AND t.status = $statusFilter';
  }

  const results = await runCypher<{ t: Record<string, unknown> }>(
    `MATCH (t:TemporalClaim) ${whereClause}
     RETURN properties(t) AS t ORDER BY t.created_at`,
    { entityId, statusFilter: statusFilter ?? null },
  );

  return results.map((r) => mapGrantSummary(r.t));
}

// ============================================================
// Grant Recognition
// ============================================================

/**
 * Recognize grant income for a period (income approach).
 *
 * Income approach (IAS 20.12): DR Deferred Revenue, CR Grant Revenue
 * Asset approach (IAS 20.24): Grant already deducted from asset;
 *   recognition happens implicitly through reduced depreciation.
 *   We still track the schedule and mark amounts as recognized.
 */
export async function recognizeGrantIncome(
  grantId: string,
  periodId: string,
): Promise<GrantRecognitionResult> {
  // Fetch the grant
  const results = await runCypher<{ t: Record<string, unknown> }>(
    `MATCH (t:TemporalClaim {id: $id, grant_flag: true})
     RETURN properties(t) AS t`,
    { id: grantId },
  );

  if (results.length === 0) {
    throw new Error(`Grant ${grantId} not found`);
  }

  const grant = results[0].t;
  const status = grant.status as string;
  if (status === 'FULLY_RECOGNIZED' || status === 'WRITTEN_OFF') {
    throw new Error(`Grant ${grantId} is already ${status}`);
  }

  // Check condition
  if (grant.grant_condition_description && !grant.condition_met) {
    throw new Error(`Grant condition not yet met: ${grant.grant_condition_description}`);
  }

  // Find schedule entry for this period
  const schedule: RecognitionScheduleEntry[] = typeof grant.recognition_schedule === 'string'
    ? JSON.parse(grant.recognition_schedule as string)
    : (grant.recognition_schedule as RecognitionScheduleEntry[]);

  const entry = schedule.find((e) => e.period_id === periodId && !e.recognized_at);
  if (!entry) {
    throw new Error(`No unrecognized schedule entry for period ${periodId}`);
  }

  const amount = entry.amount;
  const approach = grant.grant_approach as GrantApproach;
  const entityId = grant.entity_id as string;
  const fundId = (grant.fund_id as string) ?? undefined;

  let journalEntryId: string;

  const currency = grant.currency as string;
  const validDate = new Date().toISOString().slice(0, 10);

  if (approach === 'INCOME') {
    // Income approach: DR Deferred Revenue (liability), CR Revenue
    journalEntryId = await postJournalEntry({
      entityId,
      periodId,
      entryType: 'DEFERRAL',
      reference: `GRANT-REC-${grantId.slice(0, 8)}`,
      narrative: `Grant income recognition: ${grant.grant_program_name}`,
      currency,
      validDate,
      lines: [
        {
          side: 'DEBIT' as const,
          amount,
          nodeRefId: grantId,
          nodeRefType: 'TEMPORAL_CLAIM' as NodeRefType,
          economicCategory: 'LIABILITY',
          fundId,
        },
        {
          side: 'CREDIT' as const,
          amount,
          nodeRefId: grant.source_node_id as string,
          nodeRefType: grant.source_node_type as NodeRefType,
          economicCategory: 'REVENUE',
          fundId,
        },
      ],
    });
  } else {
    // Asset approach: recognition is implicit through reduced depreciation.
    // Post a tracking entry: DR Deferred Grant, CR Asset offset
    journalEntryId = await postJournalEntry({
      entityId,
      periodId,
      entryType: 'DEFERRAL',
      reference: `GRANT-ASSET-${grantId.slice(0, 8)}`,
      narrative: `Grant asset recognition: ${grant.grant_program_name}`,
      currency,
      validDate,
      lines: [
        {
          side: 'DEBIT' as const,
          amount,
          nodeRefId: grantId,
          nodeRefType: 'TEMPORAL_CLAIM' as NodeRefType,
          economicCategory: 'LIABILITY',
          fundId,
        },
        {
          side: 'CREDIT' as const,
          amount,
          nodeRefId: grant.related_asset_id as string,
          nodeRefType: 'FIXED_ASSET' as NodeRefType,
          economicCategory: 'ASSET',
          fundId,
        },
      ],
    });
  }

  // Update schedule entry with recognized_at
  entry.recognized_at = new Date().toISOString();
  const updatedSchedule = JSON.stringify(schedule);

  const newRecognized = (grant.recognized_to_date as number) + amount;
  const newRemaining = (grant.original_amount as number) - newRecognized;
  const newStatus = newRemaining <= 0.005 ? 'FULLY_RECOGNIZED' : 'PARTIALLY_RECOGNIZED';

  await runCypher(
    `MATCH (t:TemporalClaim {id: $id})
     SET t.recognition_schedule = $schedule,
         t.recognized_to_date = $recognized,
         t.remaining = $remaining,
         t.status = $status,
         t.updated_at = datetime()`,
    {
      id: grantId,
      schedule: updatedSchedule,
      recognized: newRecognized,
      remaining: newRemaining,
      status: newStatus,
    },
  );

  return {
    grantId,
    periodId,
    amountRecognized: amount,
    journalEntryId,
    approach,
  };
}

// ============================================================
// Condition Management
// ============================================================

/**
 * Mark a grant condition as satisfied.
 */
export async function markConditionMet(grantId: string): Promise<void> {
  const result = await runCypher<{ count: number }>(
    `MATCH (t:TemporalClaim {id: $id, grant_flag: true})
     SET t.condition_met = true,
         t.condition_met_date = datetime(),
         t.updated_at = datetime()
     RETURN count(t) AS count`,
    { id: grantId },
  );

  if (result[0]?.count === 0) {
    throw new Error(`Grant ${grantId} not found`);
  }
}

// ============================================================
// Clawback Assessment
// ============================================================

/**
 * Assess clawback risk for a grant (IAS 20.14-18).
 *
 * If there is reasonable assurance the grant conditions will NOT be met,
 * a provision may be required for the repayment amount.
 */
export async function assessClawback(
  grantId: string,
  probability: number,
  amount: number,
): Promise<ClawbackAssessmentResult> {
  if (probability < 0 || probability > 1) {
    throw new Error('Probability must be between 0 and 1');
  }

  await runCypher(
    `MATCH (t:TemporalClaim {id: $id, grant_flag: true})
     SET t.clawback_probability = $probability,
         t.clawback_amount = $amount,
         t.updated_at = datetime()`,
    { id: grantId, probability, amount },
  );

  // IAS 20.14: if repayment becomes probable, treat as change in estimate
  const provisionRequired = probability > 0.5;
  const provisionAmount = provisionRequired ? amount : 0;

  return {
    grantId,
    clawbackProbability: probability,
    clawbackAmount: amount,
    provisionRequired,
    provisionAmount,
  };
}

// ============================================================
// Helpers
// ============================================================

function mapGrantSummary(t: Record<string, unknown>): GrantSummary {
  return {
    id: t.id as string,
    entity_id: t.entity_id as string,
    grant_program_name: (t.grant_program_name as string) ?? '',
    grant_approach: (t.grant_approach as GrantApproach) ?? 'INCOME',
    original_amount: t.original_amount as number,
    recognized_to_date: t.recognized_to_date as number,
    remaining: t.remaining as number,
    condition_met: (t.condition_met as boolean) ?? true,
    clawback_probability: (t.clawback_probability as number) ?? 0,
    clawback_amount: (t.clawback_amount as number) ?? 0,
    status: t.status as string,
    created_at: t.created_at as string,
  };
}
