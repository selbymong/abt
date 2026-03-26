import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { emit } from '../../lib/kafka.js';
import type { ClaimStatus, CreditCertainty } from '../../schema/neo4j/types.js';

// ============================================================
// TaxCreditProgram Queries
// ============================================================

/**
 * Get all TaxCreditProgram nodes.
 */
export async function listTaxCreditPrograms(
  jurisdiction?: string,
): Promise<Array<Record<string, unknown>>> {
  const cypher = jurisdiction
    ? `MATCH (p:TaxCreditProgram {jurisdiction: $jurisdiction})
       RETURN properties(p) AS p ORDER BY p.program_code`
    : `MATCH (p:TaxCreditProgram)
       RETURN properties(p) AS p ORDER BY p.program_code`;
  const results = await runCypher<Record<string, unknown>>(cypher, { jurisdiction });
  return results.map((r) => r.p as Record<string, unknown>);
}

/**
 * Get a TaxCreditProgram by program_code.
 */
export async function getTaxCreditProgram(
  programCode: string,
): Promise<Record<string, unknown> | null> {
  const results = await runCypher<Record<string, unknown>>(
    `MATCH (p:TaxCreditProgram {program_code: $programCode})
     RETURN properties(p) AS p`,
    { programCode },
  );
  return results.length > 0 ? results[0].p as Record<string, unknown> : null;
}

// ============================================================
// Eligible Expenditure Identification
// ============================================================

export interface IdentifyEligibleInput {
  entityId: string;
  programCode: string;
  periodId: string;
}

export interface EligibleExpenditure {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  expenditureAmount: number;
  qualificationBasis: 'AI_INFERRED' | 'MANUALLY_TAGGED' | 'RULE_MATCHED';
  confidence: number;
}

/**
 * Identify eligible expenditures for a tax credit program.
 * Uses graph traversal to find Activity/Resource nodes that match
 * the program's eligibility criteria.
 *
 * For SR&ED: looks for R&D-related activities
 * For IRA §45: looks for clean energy activities
 * Generic fallback: matches by label keywords
 */
export async function identifyEligibleExpenditures(
  input: IdentifyEligibleInput,
): Promise<EligibleExpenditure[]> {
  const program = await getTaxCreditProgram(input.programCode);
  if (!program) throw new Error(`Program ${input.programCode} not found`);

  // Build keyword filter based on program type
  let keywords: string[];
  switch (input.programCode) {
    case 'CA-SRED':
      keywords = ['research', 'development', 'r&d', 'experimental', 'scientific', 'engineering', 'prototype'];
      break;
    case 'US-IRC41-RD':
      keywords = ['research', 'development', 'r&d', 'experimental', 'innovation', 'prototype'];
      break;
    case 'US-IRA-45':
      keywords = ['energy', 'solar', 'wind', 'renewable', 'clean', 'electric', 'carbon'];
      break;
    default:
      keywords = [];
  }

  // Find activities with matching labels and cost data
  const keywordFilter = keywords.length > 0
    ? `AND ANY(kw IN $keywords WHERE toLower(n.label) CONTAINS kw)`
    : '';

  const results = await runCypher<{
    id: string;
    label: string;
    nodeType: string[];
    cost: number;
  }>(
    `MATCH (n {entity_id: $entityId})
     WHERE (n:Activity OR n:Resource OR n:Project)
       AND n.cost_monetary IS NOT NULL
       AND n.cost_monetary > 0
       ${keywordFilter}
     RETURN n.id AS id, n.label AS label, labels(n) AS nodeType,
            n.cost_monetary AS cost
     ORDER BY n.cost_monetary DESC
     LIMIT 50`,
    { entityId: input.entityId, keywords },
  );

  return results.map((r) => ({
    nodeId: r.id,
    nodeLabel: r.label,
    nodeType: (r.nodeType as string[])[0],
    expenditureAmount: Number(r.cost),
    qualificationBasis: keywords.length > 0 ? 'AI_INFERRED' as const : 'RULE_MATCHED' as const,
    confidence: keywords.length > 0 ? 0.75 : 0.90,
  }));
}

// ============================================================
// TaxCreditClaim CRUD
// ============================================================

export interface CreateClaimInput {
  entityId: string;
  programCode: string;
  periodId: string;
  fiscalYear: string;
  eligibleExpenditureTotal: number;
  eligibleNodeIds: string[];
  aiConfidence?: number;
}

/**
 * Create a TaxCreditClaim.
 * Computes credit amounts based on program rates.
 */
export async function createTaxCreditClaim(
  input: CreateClaimInput,
): Promise<string> {
  const program = await getTaxCreditProgram(input.programCode);
  if (!program) throw new Error(`Program ${input.programCode} not found`);

  const creditRate = Number(program.credit_rate);
  const expenditureLimit = program.expenditure_limit ? Number(program.expenditure_limit) : Infinity;
  const eligibleAmount = Math.min(input.eligibleExpenditureTotal, expenditureLimit);
  const creditAmountClaimed = Math.round(eligibleAmount * creditRate * 100) / 100;

  // Determine refundable/non-refundable split
  const creditType = program.credit_type as string;
  let refundablePortion = 0;
  let nonRefundablePortion = creditAmountClaimed;

  if (creditType === 'REFUNDABLE' || creditType === 'DIRECT_PAY') {
    refundablePortion = creditAmountClaimed;
    nonRefundablePortion = 0;
  } else if (creditType === 'PARTIALLY_REFUNDABLE') {
    // SR&ED: 40% refundable for CCPCs on first $3M
    refundablePortion = Math.round(creditAmountClaimed * 0.40 * 100) / 100;
    nonRefundablePortion = Math.round((creditAmountClaimed - refundablePortion) * 100) / 100;
  }

  const id = uuid();
  const programId = program.id as string;

  await runCypher(
    `MATCH (prog:TaxCreditProgram {program_code: $programCode})
     CREATE (c:TaxCreditClaim {
       id: $id,
       entity_id: $entityId,
       program_id: $programId,
       period_id: $periodId,
       fiscal_year: $fiscalYear,
       claim_status: 'DRAFT',
       eligible_expenditure_total: $eligibleExpenditureTotal,
       credit_amount_claimed: $creditAmountClaimed,
       refundable_portion: $refundablePortion,
       non_refundable_portion: $nonRefundablePortion,
       applied_to_tax: 0,
       carried_forward: 0,
       carried_back: 0,
       cash_received: 0,
       eligible_node_ids: $eligibleNodeIds,
       ai_confidence: $aiConfidence,
       created_at: datetime(), updated_at: datetime()
     })
     CREATE (c)-[:CLAIMED_UNDER]->(prog)`,
    {
      id,
      entityId: input.entityId,
      programCode: input.programCode,
      programId,
      periodId: input.periodId,
      fiscalYear: input.fiscalYear,
      eligibleExpenditureTotal: input.eligibleExpenditureTotal,
      creditAmountClaimed,
      refundablePortion,
      nonRefundablePortion,
      eligibleNodeIds: input.eligibleNodeIds,
      aiConfidence: input.aiConfidence ?? null,
    },
  );

  await emit('ebg.tax', {
    event_id: uuid(),
    event_type: 'CREDIT_IDENTIFIED',
    sequence_number: Date.now(),
    idempotency_key: `credit-claim-${id}`,
    entity_id: input.entityId,
    period_id: input.periodId,
    timestamp: new Date().toISOString(),
    payload: { claimId: id, programCode: input.programCode, creditAmountClaimed },
  });

  return id;
}

/**
 * Get a TaxCreditClaim by ID.
 */
export async function getTaxCreditClaim(
  id: string,
): Promise<Record<string, unknown> | null> {
  const results = await runCypher<Record<string, unknown>>(
    `MATCH (c:TaxCreditClaim {id: $id})
     RETURN properties(c) AS c`,
    { id },
  );
  return results.length > 0 ? results[0].c as Record<string, unknown> : null;
}

/**
 * List TaxCreditClaims for an entity.
 */
export async function listTaxCreditClaims(
  entityId: string,
  status?: ClaimStatus,
): Promise<Array<Record<string, unknown>>> {
  const statusFilter = status ? 'AND c.claim_status = $status' : '';
  const results = await runCypher<Record<string, unknown>>(
    `MATCH (c:TaxCreditClaim {entity_id: $entityId})
     WHERE true ${statusFilter}
     RETURN properties(c) AS c
     ORDER BY c.created_at DESC`,
    { entityId, status },
  );
  return results.map((r) => r.c as Record<string, unknown>);
}

/**
 * Update claim status.
 */
export async function updateClaimStatus(
  id: string,
  newStatus: ClaimStatus,
  assessedAmount?: number,
): Promise<Record<string, unknown>> {
  const setClause = assessedAmount !== undefined
    ? `SET c.claim_status = $newStatus, c.credit_amount_assessed = $assessedAmount, c.updated_at = datetime()`
    : `SET c.claim_status = $newStatus, c.updated_at = datetime()`;

  const results = await runCypher<Record<string, unknown>>(
    `MATCH (c:TaxCreditClaim {id: $id})
     ${setClause}
     RETURN properties(c) AS c`,
    { id, newStatus, assessedAmount: assessedAmount ?? null },
  );
  if (results.length === 0) throw new Error(`Claim ${id} not found`);

  if (newStatus === 'ASSESSED' && assessedAmount !== undefined) {
    await emit('ebg.tax', {
      event_id: uuid(),
      event_type: 'CREDIT_ASSESSED',
      sequence_number: Date.now(),
      idempotency_key: `credit-assessed-${id}`,
      entity_id: (results[0].c as any).entity_id,
      timestamp: new Date().toISOString(),
      payload: { claimId: id, assessedAmount },
    });
  }

  return results[0].c as Record<string, unknown>;
}

// ============================================================
// TaxCreditBalance (FIFO Vintage Tracking)
// ============================================================

export interface UpdateBalanceInput {
  entityId: string;
  programCode: string;
  balanceAsOf: string;
  creditsEarned: number;
  creditsApplied?: number;
  creditsExpired?: number;
  creditsCarriedBack?: number;
}

/**
 * Update or create a TaxCreditBalance with FIFO vintage tracking.
 */
export async function updateCreditBalance(
  input: UpdateBalanceInput,
): Promise<string> {
  const program = await getTaxCreditProgram(input.programCode);
  if (!program) throw new Error(`Program ${input.programCode} not found`);
  const programId = program.id as string;

  // Get existing balance
  const existing = await runCypher<Record<string, unknown>>(
    `MATCH (b:TaxCreditBalance {entity_id: $entityId, program_id: $programId})
     RETURN properties(b) AS b
     ORDER BY b.created_at DESC LIMIT 1`,
    { entityId: input.entityId, programId },
  );

  const openingBalance = existing.length > 0
    ? Number((existing[0].b as any).closing_balance)
    : 0;

  const creditsApplied = input.creditsApplied ?? 0;
  const creditsExpired = input.creditsExpired ?? 0;
  const creditsCarriedBack = input.creditsCarriedBack ?? 0;
  const closingBalance = Math.round(
    (openingBalance + input.creditsEarned - creditsApplied - creditsExpired - creditsCarriedBack) * 100,
  ) / 100;

  // Build vintage tracking (FIFO)
  const existingVintages: Array<{ year: string; amount: number }> = [];
  if (existing.length > 0 && (existing[0].b as any).vintages) {
    try {
      existingVintages.push(...JSON.parse((existing[0].b as any).vintages));
    } catch {
      // ignore parse errors
    }
  }

  // Add new vintage
  existingVintages.push({ year: input.balanceAsOf, amount: input.creditsEarned });

  // Apply credits in FIFO order
  let remaining = creditsApplied;
  for (const v of existingVintages) {
    if (remaining <= 0) break;
    const apply = Math.min(v.amount, remaining);
    v.amount -= apply;
    remaining -= apply;
  }

  // Remove exhausted vintages
  const activeVintages = existingVintages.filter((v) => v.amount > 0.01);

  // Expire old vintages based on carryforward limit
  const carryForwardYears = program.carryforward_years ? Number(program.carryforward_years) : null;
  if (carryForwardYears) {
    const cutoffYear = parseInt(input.balanceAsOf.substring(0, 4)) - carryForwardYears;
    for (const v of activeVintages) {
      const vintageYear = parseInt(v.year.substring(0, 4));
      if (vintageYear < cutoffYear) {
        v.amount = 0; // expired
      }
    }
  }
  const finalVintages = activeVintages.filter((v) => v.amount > 0.01);

  const id = uuid();
  await runCypher(
    `CREATE (b:TaxCreditBalance {
       id: $id,
       entity_id: $entityId,
       program_id: $programId,
       balance_as_of: $balanceAsOf,
       opening_balance: $openingBalance,
       credits_earned: $creditsEarned,
       credits_applied: $creditsApplied,
       credits_expired: $creditsExpired,
       credits_carried_back: $creditsCarriedBack,
       closing_balance: $closingBalance,
       vintages: $vintagesJson,
       created_at: datetime(), updated_at: datetime()
     })`,
    {
      id,
      entityId: input.entityId,
      programId,
      balanceAsOf: input.balanceAsOf,
      openingBalance,
      creditsEarned: input.creditsEarned,
      creditsApplied: creditsApplied,
      creditsExpired: creditsExpired,
      creditsCarriedBack: creditsCarriedBack,
      closingBalance,
      vintagesJson: JSON.stringify(finalVintages),
    },
  );

  return id;
}

/**
 * Get current credit balance for entity/program.
 */
export async function getCreditBalance(
  entityId: string,
  programCode: string,
): Promise<Record<string, unknown> | null> {
  const program = await getTaxCreditProgram(programCode);
  if (!program) return null;

  const results = await runCypher<Record<string, unknown>>(
    `MATCH (b:TaxCreditBalance {entity_id: $entityId, program_id: $programId})
     RETURN properties(b) AS b
     ORDER BY b.created_at DESC LIMIT 1`,
    { entityId, programId: program.id as string },
  );
  return results.length > 0 ? results[0].b as Record<string, unknown> : null;
}

/**
 * List all credit balances for an entity.
 */
export async function listCreditBalances(
  entityId: string,
): Promise<Array<Record<string, unknown>>> {
  const results = await runCypher<Record<string, unknown>>(
    `MATCH (b:TaxCreditBalance {entity_id: $entityId})
     RETURN properties(b) AS b
     ORDER BY b.balance_as_of DESC`,
    { entityId },
  );
  return results.map((r) => r.b as Record<string, unknown>);
}

// ============================================================
// REDUCES_COST_OF Edge (Credit-adjusted ROI)
// ============================================================

/**
 * Create a REDUCES_COST_OF edge from a claim to a node.
 * Used for credit-adjusted ROI computation.
 */
export async function createReducesCostEdge(
  claimId: string,
  targetNodeId: string,
  costReductionAmount: number,
  certainty: CreditCertainty,
): Promise<void> {
  const costReductionPct = await runCypher<{ cost: number }>(
    `MATCH (n {id: $targetNodeId})
     RETURN COALESCE(n.cost_monetary, 0) AS cost`,
    { targetNodeId },
  );

  const originalCost = costReductionPct.length > 0 ? Number(costReductionPct[0].cost) : 0;
  const reductionPct = originalCost > 0 ? costReductionAmount / originalCost : 0;

  await runCypher(
    `MATCH (c:TaxCreditClaim {id: $claimId})
     MATCH (n {id: $targetNodeId})
     MERGE (c)-[r:REDUCES_COST_OF]->(n)
     SET r.cost_reduction_amount = $costReductionAmount,
         r.cost_reduction_pct = $reductionPct,
         r.certainty = $certainty`,
    { claimId, targetNodeId, costReductionAmount, reductionPct, certainty },
  );
}

/**
 * Compute credit-adjusted effective cost for a node.
 */
export async function computeEffectiveCost(
  nodeId: string,
): Promise<{ originalCost: number; totalReductions: number; effectiveCost: number }> {
  const nodeResult = await runCypher<{ cost: number }>(
    `MATCH (n {id: $nodeId})
     RETURN COALESCE(n.cost_monetary, 0) AS cost`,
    { nodeId },
  );

  const originalCost = nodeResult.length > 0 ? Number(nodeResult[0].cost) : 0;

  const reductions = await runCypher<{ amount: number; certainty: string }>(
    `MATCH (c:TaxCreditClaim)-[r:REDUCES_COST_OF]->(n {id: $nodeId})
     RETURN r.cost_reduction_amount AS amount, r.certainty AS certainty`,
    { nodeId },
  );

  let totalReductions = 0;
  for (const r of reductions) {
    // Weight by certainty
    const weight = r.certainty === 'REALIZED' ? 1.0 : r.certainty === 'ASSESSED' ? 0.9 : 0.7;
    totalReductions += Number(r.amount) * weight;
  }

  return {
    originalCost,
    totalReductions: Math.round(totalReductions * 100) / 100,
    effectiveCost: Math.round((originalCost - totalReductions) * 100) / 100,
  };
}

// ============================================================
// Filing Data Export
// ============================================================

/**
 * Generate T661 SR&ED filing data for CRA.
 */
export async function generateT661Data(
  entityId: string,
  fiscalYear: string,
): Promise<Record<string, unknown>> {
  const claims = await runCypher<Record<string, unknown>>(
    `MATCH (c:TaxCreditClaim {entity_id: $entityId, fiscal_year: $fiscalYear})
     MATCH (c)-[:CLAIMED_UNDER]->(p:TaxCreditProgram {program_code: 'CA-SRED'})
     RETURN properties(c) AS c`,
    { entityId, fiscalYear },
  );

  const totalEligible = claims.reduce((s, r) =>
    s + Number((r.c as any).eligible_expenditure_total), 0);
  const totalClaimed = claims.reduce((s, r) =>
    s + Number((r.c as any).credit_amount_claimed), 0);

  return {
    filingForm: 'T661',
    entityId,
    fiscalYear,
    claimCount: claims.length,
    totalEligibleExpenditures: Math.round(totalEligible * 100) / 100,
    totalCreditClaimed: Math.round(totalClaimed * 100) / 100,
    claims: claims.map((r) => r.c),
  };
}

/**
 * Generate Form 6765 R&D credit filing data for IRS.
 */
export async function generateForm6765Data(
  entityId: string,
  fiscalYear: string,
): Promise<Record<string, unknown>> {
  const claims = await runCypher<Record<string, unknown>>(
    `MATCH (c:TaxCreditClaim {entity_id: $entityId, fiscal_year: $fiscalYear})
     MATCH (c)-[:CLAIMED_UNDER]->(p:TaxCreditProgram {program_code: 'US-IRC41-RD'})
     RETURN properties(c) AS c`,
    { entityId, fiscalYear },
  );

  const totalEligible = claims.reduce((s, r) =>
    s + Number((r.c as any).eligible_expenditure_total), 0);
  const totalClaimed = claims.reduce((s, r) =>
    s + Number((r.c as any).credit_amount_claimed), 0);

  return {
    filingForm: 'Form 6765',
    entityId,
    fiscalYear,
    claimCount: claims.length,
    totalQualifiedResearchExpenditures: Math.round(totalEligible * 100) / 100,
    totalCreditClaimed: Math.round(totalClaimed * 100) / 100,
    claims: claims.map((r) => r.c),
  };
}
