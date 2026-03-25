import { runCypher } from '../../lib/neo4j.js';
import type {
  RelatedPartyRelationshipType,
  TransactionNature,
  ArmsLengthMethod,
} from '../../schema/neo4j/types.js';

// ============================================================
// RELATED_PARTY Edge Management (Entity ↔ Entity)
// ============================================================

export interface CreateRelatedPartyInput {
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: RelatedPartyRelationshipType;
  individualsInCommon: string[];
  effectiveFrom: string;
  effectiveUntil?: string;
  disclosureRequired?: boolean;
}

export async function createRelatedParty(input: CreateRelatedPartyInput): Promise<boolean> {
  await runCypher(
    `MATCH (e1:Entity {id: $sourceId})
     MATCH (e2:Entity {id: $targetId})
     CREATE (e1)-[:RELATED_PARTY {
       relationship_type: $type,
       individuals_in_common: $individuals,
       effective_from: date($from),
       effective_until: $until,
       disclosure_required: $disclosure,
       created_at: datetime()
     }]->(e2)`,
    {
      sourceId: input.sourceEntityId,
      targetId: input.targetEntityId,
      type: input.relationshipType,
      individuals: input.individualsInCommon,
      from: input.effectiveFrom,
      until: input.effectiveUntil ?? null,
      disclosure: input.disclosureRequired ?? true,
    },
  );
  return true;
}

export async function getRelatedParties(entityId: string): Promise<Array<Record<string, unknown>>> {
  const results = await runCypher<{ target_id: string; target_label: string; rel: Record<string, unknown> }>(
    `MATCH (e:Entity {id: $entityId})-[r:RELATED_PARTY]->(e2:Entity)
     RETURN e2.id AS target_id, e2.label AS target_label, properties(r) AS rel
     UNION
     MATCH (e2:Entity)-[r:RELATED_PARTY]->(e:Entity {id: $entityId})
     RETURN e2.id AS target_id, e2.label AS target_label, properties(r) AS rel`,
    { entityId },
  );
  return results.map((row) => ({
    relatedEntityId: row.target_id,
    relatedEntityLabel: row.target_label,
    ...row.rel,
  }));
}

export async function getRelatedPartyBetween(
  entityId1: string,
  entityId2: string,
): Promise<Record<string, unknown> | null> {
  const results = await runCypher<{ rel: Record<string, unknown>; direction: string }>(
    `MATCH (e1:Entity {id: $id1})-[r:RELATED_PARTY]->(e2:Entity {id: $id2})
     RETURN properties(r) AS rel, 'outgoing' AS direction
     UNION
     MATCH (e1:Entity {id: $id2})-[r:RELATED_PARTY]->(e2:Entity {id: $id1})
     RETURN properties(r) AS rel, 'incoming' AS direction`,
    { id1: entityId1, id2: entityId2 },
  );
  return results[0]?.rel ?? null;
}

export async function updateRelatedParty(
  sourceEntityId: string,
  targetEntityId: string,
  updates: Partial<{
    individualsInCommon: string[];
    effectiveUntil: string;
    disclosureRequired: boolean;
  }>,
): Promise<boolean> {
  const setClauses: string[] = [];
  const params: Record<string, unknown> = { sourceId: sourceEntityId, targetId: targetEntityId };

  if (updates.individualsInCommon !== undefined) {
    setClauses.push('r.individuals_in_common = $individuals');
    params.individuals = updates.individualsInCommon;
  }
  if (updates.effectiveUntil !== undefined) {
    setClauses.push('r.effective_until = date($until)');
    params.until = updates.effectiveUntil;
  }
  if (updates.disclosureRequired !== undefined) {
    setClauses.push('r.disclosure_required = $disclosure');
    params.disclosure = updates.disclosureRequired;
  }

  if (setClauses.length === 0) return false;

  const result = await runCypher<{ count: number }>(
    `MATCH (e1:Entity {id: $sourceId})-[r:RELATED_PARTY]->(e2:Entity {id: $targetId})
     SET ${setClauses.join(', ')}
     RETURN count(r) AS count`,
    params,
  );
  return (result[0]?.count ?? 0) > 0;
}

export async function deleteRelatedParty(
  sourceEntityId: string,
  targetEntityId: string,
): Promise<boolean> {
  const result = await runCypher<{ count: number }>(
    `MATCH (e1:Entity {id: $sourceId})-[r:RELATED_PARTY]->(e2:Entity {id: $targetId})
     DELETE r
     RETURN count(r) AS count`,
    { sourceId: sourceEntityId, targetId: targetEntityId },
  );
  return (result[0]?.count ?? 0) > 0;
}

// ============================================================
// RELATED_PARTY_TRANSACTION Edge Management (JE ↔ JE)
// ============================================================

export interface CreateRelatedPartyTransactionInput {
  sourceJournalEntryId: string;
  targetJournalEntryId: string;
  transactionNature: TransactionNature;
  sourceEntityId: string;
  targetEntityId: string;
  armsLengthValidated?: boolean;
  armsLengthMethod?: ArmsLengthMethod;
  taxDeductibleForSource?: boolean;
  donationReceiptIssued?: boolean;
}

export async function createRelatedPartyTransaction(
  input: CreateRelatedPartyTransactionInput,
): Promise<boolean> {
  await runCypher(
    `MATCH (je1:JournalEntry {id: $sourceJeId})
     MATCH (je2:JournalEntry {id: $targetJeId})
     CREATE (je1)-[:RELATED_PARTY_TRANSACTION {
       transaction_nature: $nature,
       source_entity_id: $sourceEntityId,
       target_entity_id: $targetEntityId,
       arms_length_validated: $validated,
       arms_length_method: $method,
       source_journal_entry_id: $sourceJeId,
       target_journal_entry_id: $targetJeId,
       tax_deductible_for_source: $deductible,
       donation_receipt_issued: $receipt,
       created_at: datetime()
     }]->(je2)`,
    {
      sourceJeId: input.sourceJournalEntryId,
      targetJeId: input.targetJournalEntryId,
      nature: input.transactionNature,
      sourceEntityId: input.sourceEntityId,
      targetEntityId: input.targetEntityId,
      validated: input.armsLengthValidated ?? false,
      method: input.armsLengthMethod ?? null,
      deductible: input.taxDeductibleForSource ?? true,
      receipt: input.donationReceiptIssued ?? null,
    },
  );
  return true;
}

export async function getRelatedPartyTransactions(
  entityId: string,
  periodId?: string,
): Promise<Array<Record<string, unknown>>> {
  let query = `MATCH (je1:JournalEntry)-[r:RELATED_PARTY_TRANSACTION]->(je2:JournalEntry)
     WHERE r.source_entity_id = $entityId OR r.target_entity_id = $entityId`;
  const params: Record<string, unknown> = { entityId };

  if (periodId) {
    query += ` AND (je1.period_id = $periodId OR je2.period_id = $periodId)`;
    params.periodId = periodId;
  }

  query += ` RETURN properties(r) AS rel,
     je1.total_debit AS source_amount,
     je1.narrative AS source_narrative,
     je2.total_debit AS target_amount,
     je2.narrative AS target_narrative
     ORDER BY je1.created_at`;

  const results = await runCypher<{
    rel: Record<string, unknown>;
    source_amount: number;
    source_narrative: string;
    target_amount: number;
    target_narrative: string;
  }>(query, params);

  return results.map((row) => ({
    ...row.rel,
    source_amount: row.source_amount,
    source_narrative: row.source_narrative,
    target_amount: row.target_amount,
    target_narrative: row.target_narrative,
  }));
}

// ============================================================
// Arm's Length Validation
// ============================================================

export interface ArmsLengthValidationResult {
  sourceJournalEntryId: string;
  targetJournalEntryId: string;
  transactionNature: string;
  sourceAmount: number;
  targetAmount: number;
  validated: boolean;
  method: ArmsLengthMethod;
  variance?: number;
}

/**
 * Validate arm's length pricing for related party transactions in a period.
 * For each unvalidated transaction, marks it as validated with the specified method.
 *
 * In a full implementation this would compare to market rates/benchmarks.
 * For now, it validates symmetry (source amount ≈ target amount) and marks method.
 */
export async function validateArmsLength(
  entityId: string,
  periodId: string,
  method: ArmsLengthMethod,
  tolerancePct: number = 0.05,
): Promise<ArmsLengthValidationResult[]> {
  // Find unvalidated transactions
  const transactions = await runCypher<{
    sourceJeId: string;
    targetJeId: string;
    nature: string;
    sourceAmount: number;
    targetAmount: number;
  }>(
    `MATCH (je1:JournalEntry)-[r:RELATED_PARTY_TRANSACTION]->(je2:JournalEntry)
     WHERE (r.source_entity_id = $entityId OR r.target_entity_id = $entityId)
       AND (je1.period_id = $periodId OR je2.period_id = $periodId)
       AND r.arms_length_validated = false
     RETURN r.source_journal_entry_id AS sourceJeId,
            r.target_journal_entry_id AS targetJeId,
            r.transaction_nature AS nature,
            je1.total_debit AS sourceAmount,
            je2.total_debit AS targetAmount`,
    { entityId, periodId },
  );

  const results: ArmsLengthValidationResult[] = [];

  for (const txn of transactions) {
    const sourceAmt = Number(txn.sourceAmount);
    const targetAmt = Number(txn.targetAmount);
    const variance = sourceAmt > 0 ? Math.abs(sourceAmt - targetAmt) / sourceAmt : 0;
    const isValid = variance <= tolerancePct;

    // Update the edge
    await runCypher(
      `MATCH (je1:JournalEntry {id: $sourceJeId})-[r:RELATED_PARTY_TRANSACTION]->(je2:JournalEntry {id: $targetJeId})
       SET r.arms_length_validated = $validated,
           r.arms_length_method = $method`,
      {
        sourceJeId: txn.sourceJeId,
        targetJeId: txn.targetJeId,
        validated: isValid,
        method,
      },
    );

    results.push({
      sourceJournalEntryId: txn.sourceJeId,
      targetJournalEntryId: txn.targetJeId,
      transactionNature: txn.nature,
      sourceAmount: sourceAmt,
      targetAmount: targetAmt,
      validated: isValid,
      method,
      variance: Math.round(variance * 10000) / 10000,
    });
  }

  return results;
}

// ============================================================
// Disclosure Schedule Generation
// ============================================================

export interface DisclosureEntry {
  relatedEntityId: string;
  relatedEntityLabel: string;
  relationshipType: string;
  transactionNature: string;
  amount: number;
  armsLengthValidated: boolean;
  armsLengthMethod?: string;
  donationReceiptIssued?: boolean;
}

/**
 * Generate a related party disclosure schedule for an entity and period.
 * Returns all related party transactions that require disclosure per IAS 24.
 */
export async function generateDisclosureSchedule(
  entityId: string,
  periodId: string,
): Promise<DisclosureEntry[]> {
  // Step 1: Get all related entities with disclosure_required = true
  const relatedEntities = await runCypher<{
    relatedEntityId: string;
    relatedEntityLabel: string;
    relationshipType: string;
  }>(
    `MATCH (e1:Entity {id: $entityId})-[rp:RELATED_PARTY]-(e2:Entity)
     WHERE rp.disclosure_required = true
     RETURN DISTINCT e2.id AS relatedEntityId,
            e2.label AS relatedEntityLabel,
            rp.relationship_type AS relationshipType`,
    { entityId },
  );

  if (relatedEntities.length === 0) return [];

  // Step 2: For each related entity, find transactions in the period
  const results: Array<{
    relatedEntityId: string;
    relatedEntityLabel: string;
    relationshipType: string;
    nature: string;
    amount: number;
    validated: boolean;
    method: string | null;
    receipt: boolean | null;
  }> = [];

  for (const re of relatedEntities) {
    const transactions = await runCypher<{
      nature: string;
      amount: number;
      validated: boolean;
      method: string | null;
      receipt: boolean | null;
    }>(
      `MATCH (je1:JournalEntry)-[rpt:RELATED_PARTY_TRANSACTION]->(je2:JournalEntry)
       WHERE ((rpt.source_entity_id = $entityId AND rpt.target_entity_id = $relatedId)
           OR (rpt.source_entity_id = $relatedId AND rpt.target_entity_id = $entityId))
         AND (je1.period_id = $periodId OR je2.period_id = $periodId)
       RETURN rpt.transaction_nature AS nature,
              je1.total_debit AS amount,
              rpt.arms_length_validated AS validated,
              rpt.arms_length_method AS method,
              rpt.donation_receipt_issued AS receipt`,
      { entityId, relatedId: re.relatedEntityId, periodId },
    );

    for (const txn of transactions) {
      results.push({
        relatedEntityId: re.relatedEntityId,
        relatedEntityLabel: re.relatedEntityLabel,
        relationshipType: re.relationshipType,
        ...txn,
      });
    }
  }

  return results.map((row) => ({
    relatedEntityId: row.relatedEntityId,
    relatedEntityLabel: row.relatedEntityLabel,
    relationshipType: row.relationshipType,
    transactionNature: row.nature,
    amount: Number(row.amount),
    armsLengthValidated: row.validated,
    armsLengthMethod: row.method ?? undefined,
    donationReceiptIssued: row.receipt ?? undefined,
  }));
}
