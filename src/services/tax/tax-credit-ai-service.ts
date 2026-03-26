/**
 * Tax Credit AI Feedback Loop Service
 *
 * Implements the reviewer rejection → eligibility model refinement cycle:
 * 1. QUALIFIES_FOR edges link expenditure nodes to claims with reviewer feedback
 * 2. Reviewers accept/reject individual qualifications with reasons
 * 3. Feedback is aggregated per program to analyze rejection patterns
 * 4. Eligibility keywords are refined based on rejection history
 * 5. Precision/recall metrics track model accuracy over time
 * 6. Re-identification uses the refined model for improved future results
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { emit } from '../../lib/kafka.js';
import type { QualificationBasis } from '../../schema/neo4j/types.js';
import { identifyEligibleExpenditures, type EligibleExpenditure } from './tax-credits-service.js';

// ============================================================
// QUALIFIES_FOR Edge CRUD
// ============================================================

export interface CreateQualifiesForInput {
  sourceNodeId: string;
  claimId: string;
  qualificationBasis: QualificationBasis;
  eligibleAmount: number;
  eligibilityConfidence: number;
  expenditureCategory: ExpenditureCategory;
}

export type ExpenditureCategory =
  | 'SALARY'
  | 'MATERIALS'
  | 'SUBCONTRACTOR'
  | 'OVERHEAD_PROXY'
  | 'CAPITAL'
  | 'OTHER';

export interface QualifiesForEdge {
  sourceNodeId: string;
  claimId: string;
  qualificationBasis: QualificationBasis;
  eligibleAmount: number;
  eligibilityConfidence: number;
  expenditureCategory: ExpenditureCategory;
  reviewerAccepted: boolean | null;
  rejectionReason: string | null;
}

/**
 * Create a QUALIFIES_FOR edge from an expenditure node to a TaxCreditClaim.
 */
export async function createQualifiesForEdge(
  input: CreateQualifiesForInput,
): Promise<void> {
  await runCypher(
    `MATCH (n {id: $sourceNodeId})
     MATCH (c:TaxCreditClaim {id: $claimId})
     MERGE (n)-[r:QUALIFIES_FOR]->(c)
     SET r.qualification_basis = $qualificationBasis,
         r.eligible_amount = $eligibleAmount,
         r.eligibility_confidence = $eligibilityConfidence,
         r.expenditure_category = $expenditureCategory,
         r.reviewer_accepted = null,
         r.rejection_reason = null`,
    {
      sourceNodeId: input.sourceNodeId,
      claimId: input.claimId,
      qualificationBasis: input.qualificationBasis,
      eligibleAmount: input.eligibleAmount,
      eligibilityConfidence: input.eligibilityConfidence,
      expenditureCategory: input.expenditureCategory,
    },
  );
}

/**
 * List QUALIFIES_FOR edges for a claim.
 */
export async function listQualifiesForEdges(
  claimId: string,
): Promise<QualifiesForEdge[]> {
  const results = await runCypher<{
    sourceNodeId: string;
    claimId: string;
    qualification_basis: string;
    eligible_amount: number;
    eligibility_confidence: number;
    expenditure_category: string;
    reviewer_accepted: boolean | null;
    rejection_reason: string | null;
  }>(
    `MATCH (n)-[r:QUALIFIES_FOR]->(c:TaxCreditClaim {id: $claimId})
     RETURN n.id AS sourceNodeId, c.id AS claimId,
            r.qualification_basis AS qualification_basis,
            r.eligible_amount AS eligible_amount,
            r.eligibility_confidence AS eligibility_confidence,
            r.expenditure_category AS expenditure_category,
            r.reviewer_accepted AS reviewer_accepted,
            r.rejection_reason AS rejection_reason`,
    { claimId },
  );

  return results.map((r) => ({
    sourceNodeId: r.sourceNodeId,
    claimId: r.claimId,
    qualificationBasis: r.qualification_basis as QualificationBasis,
    eligibleAmount: Number(r.eligible_amount),
    eligibilityConfidence: Number(r.eligibility_confidence),
    expenditureCategory: r.expenditure_category as ExpenditureCategory,
    reviewerAccepted: r.reviewer_accepted,
    rejectionReason: r.rejection_reason,
  }));
}

// ============================================================
// Reviewer Feedback
// ============================================================

/**
 * Record reviewer acceptance of a QUALIFIES_FOR edge.
 */
export async function acceptQualification(
  sourceNodeId: string,
  claimId: string,
): Promise<void> {
  const result = await runCypher<{ cnt: number }>(
    `MATCH (n {id: $sourceNodeId})-[r:QUALIFIES_FOR]->(c:TaxCreditClaim {id: $claimId})
     SET r.reviewer_accepted = true, r.rejection_reason = null
     RETURN count(r) AS cnt`,
    { sourceNodeId, claimId },
  );
  if (result[0]?.cnt === 0) {
    throw new Error(`QUALIFIES_FOR edge not found: ${sourceNodeId} → ${claimId}`);
  }
}

/**
 * Record reviewer rejection of a QUALIFIES_FOR edge with reason.
 */
export async function rejectQualification(
  sourceNodeId: string,
  claimId: string,
  rejectionReason: string,
): Promise<void> {
  const result = await runCypher<{ cnt: number }>(
    `MATCH (n {id: $sourceNodeId})-[r:QUALIFIES_FOR]->(c:TaxCreditClaim {id: $claimId})
     SET r.reviewer_accepted = false, r.rejection_reason = $rejectionReason
     RETURN count(r) AS cnt`,
    { sourceNodeId, claimId, rejectionReason },
  );
  if (result[0]?.cnt === 0) {
    throw new Error(`QUALIFIES_FOR edge not found: ${sourceNodeId} → ${claimId}`);
  }

  // Look up entity_id from the claim
  const claimEntity = await runCypher<{ entity_id: string }>(
    `MATCH (c:TaxCreditClaim {id: $claimId}) RETURN c.entity_id AS entity_id`,
    { claimId },
  );
  const entityId = claimEntity[0]?.entity_id ?? 'unknown';

  await emit('ebg.tax', {
    event_id: uuid(),
    event_type: 'CREDIT_QUALIFICATION_REJECTED',
    sequence_number: Date.now(),
    idempotency_key: `qual-reject-${sourceNodeId}-${claimId}`,
    entity_id: entityId,
    timestamp: new Date().toISOString(),
    payload: { sourceNodeId, claimId, rejectionReason },
  });
}

/**
 * Batch review: accept or reject multiple qualifications at once.
 */
export async function batchReview(
  reviews: Array<{
    sourceNodeId: string;
    claimId: string;
    accepted: boolean;
    rejectionReason?: string;
  }>,
): Promise<{ accepted: number; rejected: number }> {
  let accepted = 0;
  let rejected = 0;

  for (const review of reviews) {
    if (review.accepted) {
      await acceptQualification(review.sourceNodeId, review.claimId);
      accepted++;
    } else {
      await rejectQualification(
        review.sourceNodeId,
        review.claimId,
        review.rejectionReason ?? 'No reason provided',
      );
      rejected++;
    }
  }

  return { accepted, rejected };
}

// ============================================================
// Feedback Aggregation & Analysis
// ============================================================

export interface FeedbackSummary {
  programCode: string;
  totalReviewed: number;
  totalAccepted: number;
  totalRejected: number;
  precision: number; // accepted / (accepted + rejected)
  rejectionReasons: Array<{ reason: string; count: number }>;
  rejectedLabels: string[];
  acceptedLabels: string[];
}

/**
 * Aggregate reviewer feedback for a specific program.
 * Returns precision metrics and rejection pattern analysis.
 */
export async function getFeedbackSummary(
  programCode: string,
): Promise<FeedbackSummary> {
  // Get all reviewed QUALIFIES_FOR edges for claims under this program
  const results = await runCypher<{
    reviewer_accepted: boolean;
    rejection_reason: string | null;
    node_label: string;
  }>(
    `MATCH (n)-[r:QUALIFIES_FOR]->(c:TaxCreditClaim)-[:CLAIMED_UNDER]->(p:TaxCreditProgram {program_code: $programCode})
     WHERE r.reviewer_accepted IS NOT NULL
     RETURN r.reviewer_accepted AS reviewer_accepted,
            r.rejection_reason AS rejection_reason,
            n.label AS node_label`,
    { programCode },
  );

  const totalReviewed = results.length;
  const accepted = results.filter((r) => r.reviewer_accepted === true);
  const rejected = results.filter((r) => r.reviewer_accepted === false);

  // Aggregate rejection reasons
  const reasonCounts = new Map<string, number>();
  for (const r of rejected) {
    const reason = r.rejection_reason ?? 'Unknown';
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
  }

  const rejectionReasons = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const precision = totalReviewed > 0 ? accepted.length / totalReviewed : 0;

  return {
    programCode,
    totalReviewed,
    totalAccepted: accepted.length,
    totalRejected: rejected.length,
    precision: Math.round(precision * 1000) / 1000,
    rejectionReasons,
    rejectedLabels: rejected.map((r) => r.node_label),
    acceptedLabels: accepted.map((r) => r.node_label),
  };
}

// ============================================================
// Eligibility Model Refinement
// ============================================================

// Default keyword lists per program (same as tax-credits-service.ts)
const DEFAULT_KEYWORDS: Record<string, string[]> = {
  'CA-SRED': ['research', 'development', 'r&d', 'experimental', 'scientific', 'engineering', 'prototype'],
  'US-IRC41-RD': ['research', 'development', 'r&d', 'experimental', 'innovation', 'prototype'],
  'US-IRA-45': ['energy', 'solar', 'wind', 'renewable', 'clean', 'electric', 'carbon'],
};

// In-memory refined keyword store (per program)
const refinedKeywords: Map<string, {
  positive: string[];
  negative: string[];
  baseKeywords: string[];
}> = new Map();

/**
 * Extract keywords from node labels (lowercased, split on whitespace/punctuation).
 */
function extractKeywords(label: string): string[] {
  return label
    .toLowerCase()
    .split(/[\s\-_,;:./()]+/)
    .filter((w) => w.length > 2);
}

/**
 * Refine the eligibility model for a program based on reviewer feedback.
 * Analyzes accepted vs rejected labels to learn positive/negative signals.
 */
export async function refineEligibilityModel(
  programCode: string,
): Promise<{
  programCode: string;
  positiveKeywords: string[];
  negativeKeywords: string[];
  feedbackSummary: FeedbackSummary;
}> {
  const summary = await getFeedbackSummary(programCode);

  // Extract keywords from accepted and rejected labels
  const acceptedWords = new Map<string, number>();
  const rejectedWords = new Map<string, number>();

  for (const label of summary.acceptedLabels) {
    for (const word of extractKeywords(label)) {
      acceptedWords.set(word, (acceptedWords.get(word) ?? 0) + 1);
    }
  }

  for (const label of summary.rejectedLabels) {
    for (const word of extractKeywords(label)) {
      rejectedWords.set(word, (rejectedWords.get(word) ?? 0) + 1);
    }
  }

  // Find negative keywords: words that appear in rejected but not accepted
  const negativeKeywords: string[] = [];
  for (const [word, count] of rejectedWords) {
    if (!acceptedWords.has(word) && count >= 1) {
      negativeKeywords.push(word);
    }
  }

  // Find positive keywords: words that appear in accepted but not rejected
  const positiveKeywords: string[] = [];
  for (const [word, count] of acceptedWords) {
    if (!rejectedWords.has(word) && count >= 1) {
      positiveKeywords.push(word);
    }
  }

  // Store refined model
  const baseKeywords = DEFAULT_KEYWORDS[programCode] ?? [];
  refinedKeywords.set(programCode, {
    positive: positiveKeywords,
    negative: negativeKeywords,
    baseKeywords,
  });

  await emit('ebg.tax', {
    event_id: uuid(),
    event_type: 'ELIGIBILITY_MODEL_REFINED',
    sequence_number: Date.now(),
    idempotency_key: `model-refine-${programCode}-${Date.now()}`,
    entity_id: programCode,
    timestamp: new Date().toISOString(),
    payload: {
      programCode,
      positiveKeywordsAdded: positiveKeywords.length,
      negativeKeywordsAdded: negativeKeywords.length,
      precision: summary.precision,
    },
  });

  return {
    programCode,
    positiveKeywords,
    negativeKeywords,
    feedbackSummary: summary,
  };
}

/**
 * Get current refined model state for a program.
 */
export function getRefinedModel(
  programCode: string,
): { positive: string[]; negative: string[]; baseKeywords: string[] } | null {
  return refinedKeywords.get(programCode) ?? null;
}

/**
 * Clear refined model (reset to defaults).
 */
export function clearRefinedModel(programCode: string): void {
  refinedKeywords.delete(programCode);
}

// ============================================================
// Re-Identification with Refined Model
// ============================================================

/**
 * Re-identify eligible expenditures using the refined model.
 * Filters out nodes matching negative keywords and boosts confidence
 * for nodes matching positive keywords.
 */
export async function reidentifyWithRefinedModel(
  entityId: string,
  programCode: string,
  periodId: string,
): Promise<EligibleExpenditure[]> {
  // Get base identification results
  const baseResults = await identifyEligibleExpenditures({
    entityId,
    programCode,
    periodId,
  });

  const model = refinedKeywords.get(programCode);
  if (!model) {
    // No refinement available — return base results
    return baseResults;
  }

  // Apply refinement
  const refined: EligibleExpenditure[] = [];

  for (const result of baseResults) {
    const labelWords = extractKeywords(result.nodeLabel);

    // Check for negative keywords — exclude if matches
    const hasNegative = labelWords.some((w) => model.negative.includes(w));
    if (hasNegative) continue;

    // Check for positive keyword boost
    const hasPositive = labelWords.some((w) => model.positive.includes(w));
    const adjustedConfidence = hasPositive
      ? Math.min(result.confidence + 0.15, 1.0)
      : result.confidence;

    refined.push({
      ...result,
      confidence: Math.round(adjustedConfidence * 1000) / 1000,
    });
  }

  return refined;
}

// ============================================================
// Accuracy Metrics
// ============================================================

export interface AccuracyMetrics {
  programCode: string;
  totalIdentified: number;
  totalReviewed: number;
  truePositives: number;
  falsePositives: number;
  precision: number;
  reviewCoverage: number;
  averageConfidence: number;
  averageAcceptedConfidence: number;
  averageRejectedConfidence: number;
}

/**
 * Compute accuracy metrics for a program's AI identifications.
 */
export async function computeAccuracyMetrics(
  programCode: string,
): Promise<AccuracyMetrics> {
  const results = await runCypher<{
    reviewer_accepted: boolean | null;
    eligibility_confidence: number;
    qualification_basis: string;
  }>(
    `MATCH (n)-[r:QUALIFIES_FOR]->(c:TaxCreditClaim)-[:CLAIMED_UNDER]->(p:TaxCreditProgram {program_code: $programCode})
     RETURN r.reviewer_accepted AS reviewer_accepted,
            r.eligibility_confidence AS eligibility_confidence,
            r.qualification_basis AS qualification_basis`,
    { programCode },
  );

  const totalIdentified = results.length;
  const reviewed = results.filter((r) => r.reviewer_accepted !== null);
  const truePositives = reviewed.filter((r) => r.reviewer_accepted === true).length;
  const falsePositives = reviewed.filter((r) => r.reviewer_accepted === false).length;

  const precision = reviewed.length > 0 ? truePositives / reviewed.length : 0;
  const reviewCoverage = totalIdentified > 0 ? reviewed.length / totalIdentified : 0;

  const avgConfidence = totalIdentified > 0
    ? results.reduce((s, r) => s + Number(r.eligibility_confidence), 0) / totalIdentified
    : 0;

  const acceptedResults = reviewed.filter((r) => r.reviewer_accepted === true);
  const rejectedResults = reviewed.filter((r) => r.reviewer_accepted === false);

  const avgAcceptedConf = acceptedResults.length > 0
    ? acceptedResults.reduce((s, r) => s + Number(r.eligibility_confidence), 0) / acceptedResults.length
    : 0;
  const avgRejectedConf = rejectedResults.length > 0
    ? rejectedResults.reduce((s, r) => s + Number(r.eligibility_confidence), 0) / rejectedResults.length
    : 0;

  return {
    programCode,
    totalIdentified,
    totalReviewed: reviewed.length,
    truePositives,
    falsePositives,
    precision: Math.round(precision * 1000) / 1000,
    reviewCoverage: Math.round(reviewCoverage * 1000) / 1000,
    averageConfidence: Math.round(avgConfidence * 1000) / 1000,
    averageAcceptedConfidence: Math.round(avgAcceptedConf * 1000) / 1000,
    averageRejectedConfidence: Math.round(avgRejectedConf * 1000) / 1000,
  };
}
