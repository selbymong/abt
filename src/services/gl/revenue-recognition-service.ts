import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { postJournalEntry } from './journal-posting-service.js';
import type {
  ContractStatus,
  POSatisfactionMethod,
  OverTimeMeasure,
  VariableConsiderationType,
  ConstraintEstimateMethod,
} from '../../schema/neo4j/types.js';

// ============================================================
// RevenueContract CRUD
// ============================================================

export interface CreateRevenueContractInput {
  entityId: string;
  label: string;
  customerName: string;
  customerId?: string;
  inceptionDate: string;
  transactionPrice: number;
  currency: string;
  periodId: string;
}

export async function createRevenueContract(input: CreateRevenueContractInput): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (rc:RevenueContract {
      id: $id, entity_id: $entityId, label: $label,
      customer_name: $customerName, customer_id: $customerId,
      contract_status: 'DRAFT',
      inception_date: $inceptionDate, completion_date: null,
      transaction_price: $transactionPrice,
      allocated_transaction_price: 0,
      variable_consideration_estimate: 0,
      constraint_applied: false,
      currency: $currency, period_id: $periodId,
      total_revenue_recognized: 0,
      contract_asset: 0, contract_liability: 0,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      label: input.label,
      customerName: input.customerName,
      customerId: input.customerId ?? null,
      inceptionDate: input.inceptionDate,
      transactionPrice: input.transactionPrice,
      currency: input.currency,
      periodId: input.periodId,
    },
  );
  return id;
}

export async function getRevenueContract(id: string) {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (rc:RevenueContract {id: $id}) RETURN properties(rc) AS rc`,
    { id },
  );
  return rows.length > 0 ? rows[0].rc : null;
}

export async function listRevenueContracts(entityId: string, status?: ContractStatus) {
  const statusClause = status ? ' AND rc.contract_status = $status' : '';
  return runCypher<Record<string, any>>(
    `MATCH (rc:RevenueContract {entity_id: $entityId})
     WHERE 1=1 ${statusClause}
     RETURN properties(rc) AS rc ORDER BY rc.inception_date`,
    { entityId, status: status ?? null },
  ).then(rows => rows.map(r => r.rc));
}

export async function activateContract(id: string) {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (rc:RevenueContract {id: $id})
     WHERE rc.contract_status = 'DRAFT'
     SET rc.contract_status = 'ACTIVE', rc.updated_at = datetime()
     RETURN properties(rc) AS rc`,
    { id },
  );
  if (rows.length === 0) throw new Error('Contract not found or not DRAFT');
  return rows[0].rc;
}

export async function completeContract(id: string) {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (rc:RevenueContract {id: $id})
     WHERE rc.contract_status = 'ACTIVE'
     SET rc.contract_status = 'COMPLETED',
         rc.completion_date = date().toString(),
         rc.updated_at = datetime()
     RETURN properties(rc) AS rc`,
    { id },
  );
  if (rows.length === 0) throw new Error('Contract not found or not ACTIVE');
  return rows[0].rc;
}

// ============================================================
// PerformanceObligation CRUD
// ============================================================

export interface CreatePOInput {
  entityId: string;
  contractId: string;
  label: string;
  standaloneSellingPrice: number;
  satisfactionMethod: POSatisfactionMethod;
  overTimeMeasure?: OverTimeMeasure;
  isDistinct?: boolean;
}

export async function createPerformanceObligation(input: CreatePOInput): Promise<string> {
  const id = uuid();
  await runCypher(
    `CREATE (po:PerformanceObligation {
      id: $id, entity_id: $entityId, contract_id: $contractId,
      label: $label,
      standalone_selling_price: $ssp,
      allocated_transaction_price: 0,
      satisfaction_method: $method,
      over_time_measure: $overTimeMeasure,
      progress_pct: 0, revenue_recognized: 0,
      is_distinct: $isDistinct, is_satisfied: false,
      satisfied_date: null,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      contractId: input.contractId,
      label: input.label,
      ssp: input.standaloneSellingPrice,
      method: input.satisfactionMethod,
      overTimeMeasure: input.overTimeMeasure ?? null,
      isDistinct: input.isDistinct ?? true,
    },
  );
  return id;
}

export async function getPerformanceObligation(id: string) {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (po:PerformanceObligation {id: $id}) RETURN properties(po) AS po`,
    { id },
  );
  return rows.length > 0 ? rows[0].po : null;
}

export async function listPerformanceObligations(contractId: string) {
  return runCypher<Record<string, any>>(
    `MATCH (po:PerformanceObligation {contract_id: $contractId})
     RETURN properties(po) AS po ORDER BY po.label`,
    { contractId },
  ).then(rows => rows.map(r => r.po));
}

// ============================================================
// Step 3 & 4: Transaction Price Allocation
// ============================================================

/**
 * Allocate transaction price across performance obligations
 * using the relative standalone selling price (SSP) method.
 * Also incorporates any variable consideration.
 */
export async function allocateTransactionPrice(contractId: string): Promise<{
  contractTransactionPrice: number;
  variableConsideration: number;
  totalAllocatable: number;
  allocations: { poId: string; label: string; ssp: number; allocated: number }[];
}> {
  // Get contract
  const contractRows = await runCypher<Record<string, any>>(
    `MATCH (rc:RevenueContract {id: $contractId})
     RETURN properties(rc) AS rc`,
    { contractId },
  );
  if (contractRows.length === 0) throw new Error('Contract not found');
  const contract = contractRows[0].rc;

  // Get variable consideration
  const vcRows = await runCypher<Record<string, any>>(
    `MATCH (vc:VariableConsideration {contract_id: $contractId})
     WHERE vc.resolved = false
     RETURN properties(vc) AS vc`,
    { contractId },
  );
  const variableConsideration = vcRows.reduce((sum: number, r: any) =>
    sum + Number(r.vc.constraint_adjusted_amount ?? r.vc.estimated_amount), 0);

  // Get POs
  const poRows = await runCypher<Record<string, any>>(
    `MATCH (po:PerformanceObligation {contract_id: $contractId})
     RETURN po.id AS id, po.label AS label, po.standalone_selling_price AS ssp`,
    { contractId },
  );
  if (poRows.length === 0) throw new Error('No performance obligations found');

  const totalSSP = poRows.reduce((sum: number, r: any) => sum + Number(r.ssp), 0);
  const totalAllocatable = Number(contract.transaction_price) + variableConsideration;

  const allocations = poRows.map((r: any) => {
    const ssp = Number(r.ssp);
    const ratio = totalSSP > 0 ? ssp / totalSSP : 1 / poRows.length;
    const allocated = Math.round(totalAllocatable * ratio * 100) / 100;
    return { poId: r.id as string, label: r.label as string, ssp, allocated };
  });

  // Adjust last PO for rounding
  const allocatedTotal = allocations.reduce((s, a) => s + a.allocated, 0);
  if (allocations.length > 0) {
    allocations[allocations.length - 1].allocated += Math.round((totalAllocatable - allocatedTotal) * 100) / 100;
  }

  // Persist allocations
  for (const alloc of allocations) {
    await runCypher(
      `MATCH (po:PerformanceObligation {id: $poId})
       SET po.allocated_transaction_price = $allocated, po.updated_at = datetime()`,
      { poId: alloc.poId, allocated: alloc.allocated },
    );
  }

  // Update contract
  await runCypher(
    `MATCH (rc:RevenueContract {id: $contractId})
     SET rc.allocated_transaction_price = $total,
         rc.variable_consideration_estimate = $vc,
         rc.constraint_applied = $constrained,
         rc.updated_at = datetime()`,
    {
      contractId,
      total: totalAllocatable,
      vc: variableConsideration,
      constrained: vcRows.some((r: any) => r.vc.is_constrained),
    },
  );

  return {
    contractTransactionPrice: Number(contract.transaction_price),
    variableConsideration,
    totalAllocatable,
    allocations,
  };
}

// ============================================================
// Variable Consideration
// ============================================================

export interface CreateVariableConsiderationInput {
  entityId: string;
  contractId: string;
  considerationType: VariableConsiderationType;
  estimateMethod: ConstraintEstimateMethod;
  estimatedAmount: number;
  isConstrained?: boolean;
  constraintReason?: string;
}

export async function createVariableConsideration(input: CreateVariableConsiderationInput): Promise<string> {
  const id = uuid();
  const constraintAdjusted = input.isConstrained ? 0 : input.estimatedAmount;
  await runCypher(
    `CREATE (vc:VariableConsideration {
      id: $id, entity_id: $entityId, contract_id: $contractId,
      consideration_type: $type,
      estimate_method: $method,
      estimated_amount: $estimated,
      constraint_adjusted_amount: $adjusted,
      constraint_reason: $reason,
      is_constrained: $constrained,
      resolved_amount: null, resolved: false,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      contractId: input.contractId,
      type: input.considerationType,
      method: input.estimateMethod,
      estimated: input.estimatedAmount,
      adjusted: constraintAdjusted,
      reason: input.constraintReason ?? null,
      constrained: input.isConstrained ?? false,
    },
  );
  return id;
}

export async function getVariableConsideration(id: string) {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (vc:VariableConsideration {id: $id}) RETURN properties(vc) AS vc`,
    { id },
  );
  return rows.length > 0 ? rows[0].vc : null;
}

export async function listVariableConsiderations(contractId: string) {
  return runCypher<Record<string, any>>(
    `MATCH (vc:VariableConsideration {contract_id: $contractId})
     RETURN properties(vc) AS vc ORDER BY vc.consideration_type`,
    { contractId },
  ).then(rows => rows.map(r => r.vc));
}

export async function resolveVariableConsideration(id: string, resolvedAmount: number) {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (vc:VariableConsideration {id: $id})
     SET vc.resolved = true,
         vc.resolved_amount = $amount,
         vc.constraint_adjusted_amount = $amount,
         vc.is_constrained = false,
         vc.updated_at = datetime()
     RETURN properties(vc) AS vc`,
    { id, amount: resolvedAmount },
  );
  if (rows.length === 0) throw new Error('VariableConsideration not found');
  return rows[0].vc;
}

// ============================================================
// Step 5: Revenue Recognition
// ============================================================

/**
 * Recognize revenue for a POINT_IN_TIME performance obligation.
 * Fully satisfies the PO and recognizes all allocated revenue.
 */
export async function recognizePointInTime(
  poId: string,
  periodId: string,
  satisfiedDate: string,
): Promise<{ journalEntryId: string; revenueAmount: number }> {
  const po = await getPerformanceObligation(poId);
  if (!po) throw new Error('PerformanceObligation not found');
  if (po.is_satisfied) throw new Error('PO already satisfied');

  const allocated = Number(po.allocated_transaction_price);
  if (allocated <= 0) throw new Error('PO has no allocated transaction price — run allocateTransactionPrice first');

  // Get contract for entity context
  const contractRows = await runCypher<Record<string, any>>(
    `MATCH (rc:RevenueContract {id: $contractId})
     RETURN properties(rc) AS rc`,
    { contractId: po.contract_id },
  );
  const contract = contractRows[0].rc;

  // Post revenue journal entry
  const journalEntryId = await postJournalEntry({
    entityId: contract.entity_id as string,
    periodId,
    entryType: 'OPERATIONAL',
    reference: `IFRS15-PIT-${poId}`,
    narrative: `Revenue recognition (point in time): ${po.label}`,
    currency: contract.currency as string,
    validDate: satisfiedDate,
    sourceSystem: 'IFRS15',
    lines: [
      {
        side: 'DEBIT',
        amount: allocated,
        nodeRefId: contract.id as string,
        nodeRefType: 'REVENUE_CONTRACT',
        economicCategory: 'ASSET',
      },
      {
        side: 'CREDIT',
        amount: allocated,
        nodeRefId: poId,
        nodeRefType: 'PERFORMANCE_OBLIGATION',
        economicCategory: 'REVENUE',
      },
    ],
  });

  // Mark PO as satisfied
  await runCypher(
    `MATCH (po:PerformanceObligation {id: $poId})
     SET po.is_satisfied = true,
         po.satisfied_date = $date,
         po.progress_pct = 100,
         po.revenue_recognized = $amount,
         po.updated_at = datetime()`,
    { poId, date: satisfiedDate, amount: allocated },
  );

  // Update contract totals
  await updateContractTotals(contract.id as string);

  return { journalEntryId, revenueAmount: allocated };
}

/**
 * Recognize revenue for an OVER_TIME performance obligation.
 * Recognizes revenue proportional to completion progress.
 */
export async function recognizeOverTime(
  poId: string,
  periodId: string,
  progressPct: number,
  validDate: string,
): Promise<{ journalEntryId: string | null; revenueAmount: number; cumulativeRevenue: number }> {
  if (progressPct < 0 || progressPct > 100) throw new Error('progressPct must be between 0 and 100');

  const po = await getPerformanceObligation(poId);
  if (!po) throw new Error('PerformanceObligation not found');
  if (po.is_satisfied) throw new Error('PO already satisfied');

  const allocated = Number(po.allocated_transaction_price);
  if (allocated <= 0) throw new Error('PO has no allocated transaction price — run allocateTransactionPrice first');

  const previouslyRecognized = Number(po.revenue_recognized);
  const cumulativeTarget = Math.round(allocated * (progressPct / 100) * 100) / 100;
  const incrementalRevenue = Math.round((cumulativeTarget - previouslyRecognized) * 100) / 100;

  // Get contract
  const contractRows = await runCypher<Record<string, any>>(
    `MATCH (rc:RevenueContract {id: $contractId})
     RETURN properties(rc) AS rc`,
    { contractId: po.contract_id },
  );
  const contract = contractRows[0].rc;

  let journalEntryId: string | null = null;
  if (incrementalRevenue > 0.001) {
    journalEntryId = await postJournalEntry({
      entityId: contract.entity_id as string,
      periodId,
      entryType: 'OPERATIONAL',
      reference: `IFRS15-OT-${poId}`,
      narrative: `Revenue recognition (over time ${progressPct}%): ${po.label}`,
      currency: contract.currency as string,
      validDate,
      sourceSystem: 'IFRS15',
      lines: [
        {
          side: 'DEBIT',
          amount: incrementalRevenue,
          nodeRefId: contract.id as string,
          nodeRefType: 'REVENUE_CONTRACT',
          economicCategory: 'ASSET',
        },
        {
          side: 'CREDIT',
          amount: incrementalRevenue,
          nodeRefId: poId,
          nodeRefType: 'PERFORMANCE_OBLIGATION',
          economicCategory: 'REVENUE',
        },
      ],
    });
  }

  // Update PO progress
  const isSatisfied = progressPct >= 100;
  await runCypher(
    `MATCH (po:PerformanceObligation {id: $poId})
     SET po.progress_pct = $pct,
         po.revenue_recognized = $cumulative,
         po.is_satisfied = $satisfied,
         po.satisfied_date = CASE WHEN $satisfied THEN $date ELSE po.satisfied_date END,
         po.updated_at = datetime()`,
    { poId, pct: progressPct, cumulative: cumulativeTarget, satisfied: isSatisfied, date: validDate },
  );

  // Update contract totals
  await updateContractTotals(contract.id as string);

  return { journalEntryId, revenueAmount: incrementalRevenue, cumulativeRevenue: cumulativeTarget };
}

/**
 * Update contract-level revenue totals and contract asset/liability.
 */
async function updateContractTotals(contractId: string): Promise<void> {
  // Sum recognized revenue across all POs
  const poRows = await runCypher<Record<string, any>>(
    `MATCH (po:PerformanceObligation {contract_id: $contractId})
     RETURN SUM(po.revenue_recognized) AS totalRecognized,
            SUM(po.allocated_transaction_price) AS totalAllocated`,
    { contractId },
  );
  const totalRecognized = Number(poRows[0].totalRecognized ?? 0);
  const totalAllocated = Number(poRows[0].totalAllocated ?? 0);

  // Contract asset = revenue recognized - cash received (simplified: allocated = billed)
  // Contract asset > 0 when revenue > billing; contract liability > 0 when billing > revenue
  const netPosition = totalRecognized - totalAllocated;
  const contractAsset = netPosition > 0 ? netPosition : 0;
  const contractLiability = netPosition < 0 ? Math.abs(netPosition) : 0;

  await runCypher(
    `MATCH (rc:RevenueContract {id: $contractId})
     SET rc.total_revenue_recognized = $totalRecognized,
         rc.contract_asset = $asset,
         rc.contract_liability = $liability,
         rc.updated_at = datetime()`,
    { contractId, totalRecognized, asset: contractAsset, liability: contractLiability },
  );
}

// ============================================================
// Contract Summary / Reporting
// ============================================================

export async function getContractSummary(contractId: string): Promise<{
  contract: Record<string, any>;
  performanceObligations: Record<string, any>[];
  variableConsiderations: Record<string, any>[];
  totalSSP: number;
  totalAllocated: number;
  totalRecognized: number;
  completionPct: number;
}> {
  const contract = await getRevenueContract(contractId);
  if (!contract) throw new Error('Contract not found');

  const pos = await listPerformanceObligations(contractId);
  const vcs = await listVariableConsiderations(contractId);

  const totalSSP = pos.reduce((s: number, po: any) => s + Number(po.standalone_selling_price), 0);
  const totalAllocated = pos.reduce((s: number, po: any) => s + Number(po.allocated_transaction_price), 0);
  const totalRecognized = pos.reduce((s: number, po: any) => s + Number(po.revenue_recognized), 0);
  const completionPct = totalAllocated > 0 ? Math.round((totalRecognized / totalAllocated) * 10000) / 100 : 0;

  return {
    contract,
    performanceObligations: pos,
    variableConsiderations: vcs,
    totalSSP,
    totalAllocated,
    totalRecognized,
    completionPct,
  };
}
