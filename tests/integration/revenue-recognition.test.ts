/**
 * IFRS 15 Revenue Recognition — Integration Tests
 *
 * Tests RevenueContract, PerformanceObligation, VariableConsideration,
 * SSP-based allocation, point-in-time and over-time recognition.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { query, closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities, createAccountingPeriod } from '../../src/services/graph/graph-crud-service.js';
import {
  createRevenueContract,
  getRevenueContract,
  listRevenueContracts,
  activateContract,
  completeContract,
  createPerformanceObligation,
  getPerformanceObligation,
  listPerformanceObligations,
  allocateTransactionPrice,
  createVariableConsideration,
  getVariableConsideration,
  listVariableConsiderations,
  resolveVariableConsideration,
  recognizePointInTime,
  recognizeOverTime,
  getContractSummary,
} from '../../src/services/gl/revenue-recognition-service.js';

let testEntityId: string;
let periodId: string;
const cleanupIds: { label: string; id: string }[] = [];

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  const fpEntity = entities.find((e) => e.entity_type === 'FOR_PROFIT');
  testEntityId = fpEntity!.id;

  periodId = track('AccountingPeriod', await createAccountingPeriod({
    entityId: testEntityId,
    label: 'Revenue Test Period',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  }));
});

afterAll(async () => {
  // Clean up TimescaleDB
  const periodIds = [periodId,
    ...cleanupIds.filter(c => c.label === 'AccountingPeriod').map(c => c.id)];
  const placeholders = periodIds.map((_, i) => `$${i + 1}`).join(', ');
  await query(`DELETE FROM gl_period_balances WHERE period_id IN (${placeholders})`, periodIds);

  // Clean up JEs first (reference contains IFRS15)
  const jeIds = await runCypher<{ id: string }>(
    `MATCH (j:JournalEntry) WHERE j.reference STARTS WITH 'IFRS15' RETURN j.id AS id`,
    {},
  );
  for (const je of jeIds) {
    await runCypher(`MATCH (ll:LedgerLine {journal_entry_id: $id}) DETACH DELETE ll`, { id: je.id });
    await runCypher(`MATCH (j:JournalEntry {id: $id}) DETACH DELETE j`, { id: je.id });
  }

  // Clean up Neo4j nodes
  for (const { label, id } of cleanupIds) {
    if (label === 'RevenueContract') {
      await runCypher(
        `MATCH (po:PerformanceObligation {contract_id: $id}) DETACH DELETE po`,
        { id },
      );
      await runCypher(
        `MATCH (vc:VariableConsideration {contract_id: $id}) DETACH DELETE vc`,
        { id },
      );
    }
    await runCypher(`MATCH (n {id: $id}) DETACH DELETE n`, { id });
  }

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

// ============================================================
// RevenueContract CRUD
// ============================================================

describe('RevenueContract', () => {
  let contractId: string;

  it('creates a revenue contract in DRAFT status', async () => {
    contractId = track('RevenueContract', await createRevenueContract({
      entityId: testEntityId,
      label: 'Software License + Support',
      customerName: 'Acme Corp',
      customerId: 'CUST-001',
      inceptionDate: '2026-01-01',
      transactionPrice: 120000,
      currency: 'CAD',
      periodId,
    }));

    const rc = await getRevenueContract(contractId);
    expect(rc).not.toBeNull();
    expect(rc.contract_status).toBe('DRAFT');
    expect(Number(rc.transaction_price)).toBe(120000);
    expect(rc.customer_name).toBe('Acme Corp');
  });

  it('lists contracts by entity', async () => {
    const contracts = await listRevenueContracts(testEntityId);
    expect(contracts.length).toBeGreaterThanOrEqual(1);
    expect(contracts.some((c: any) => c.id === contractId)).toBe(true);
  });

  it('activates a DRAFT contract', async () => {
    const result = await activateContract(contractId);
    expect(result.contract_status).toBe('ACTIVE');
  });

  it('throws when activating a non-DRAFT contract', async () => {
    await expect(activateContract(contractId)).rejects.toThrow('not DRAFT');
  });

  it('lists contracts filtered by status', async () => {
    const active = await listRevenueContracts(testEntityId, 'ACTIVE');
    expect(active.some((c: any) => c.id === contractId)).toBe(true);

    const draft = await listRevenueContracts(testEntityId, 'DRAFT');
    expect(draft.some((c: any) => c.id === contractId)).toBe(false);
  });
});

// ============================================================
// PerformanceObligation CRUD
// ============================================================

describe('PerformanceObligation', () => {
  let contractId: string;
  let poLicenseId: string;
  let poSupportId: string;

  beforeAll(async () => {
    contractId = track('RevenueContract', await createRevenueContract({
      entityId: testEntityId,
      label: 'Multi-PO Contract',
      customerName: 'Beta Inc',
      inceptionDate: '2026-01-01',
      transactionPrice: 100000,
      currency: 'CAD',
      periodId,
    }));
  });

  it('creates a point-in-time performance obligation', async () => {
    poLicenseId = track('PO', await createPerformanceObligation({
      entityId: testEntityId,
      contractId,
      label: 'Software License',
      standaloneSellingPrice: 80000,
      satisfactionMethod: 'POINT_IN_TIME',
    }));

    const po = await getPerformanceObligation(poLicenseId);
    expect(po).not.toBeNull();
    expect(po.satisfaction_method).toBe('POINT_IN_TIME');
    expect(Number(po.standalone_selling_price)).toBe(80000);
    expect(po.is_distinct).toBe(true);
    expect(po.is_satisfied).toBe(false);
  });

  it('creates an over-time performance obligation', async () => {
    poSupportId = track('PO', await createPerformanceObligation({
      entityId: testEntityId,
      contractId,
      label: '12-Month Support',
      standaloneSellingPrice: 20000,
      satisfactionMethod: 'OVER_TIME',
      overTimeMeasure: 'STRAIGHT_LINE',
    }));

    const po = await getPerformanceObligation(poSupportId);
    expect(po.satisfaction_method).toBe('OVER_TIME');
    expect(po.over_time_measure).toBe('STRAIGHT_LINE');
  });

  it('lists POs by contract', async () => {
    const pos = await listPerformanceObligations(contractId);
    expect(pos.length).toBe(2);
  });
});

// ============================================================
// Transaction Price Allocation (Step 4)
// ============================================================

describe('Transaction Price Allocation', () => {
  let contractId: string;
  let poId1: string;
  let poId2: string;

  beforeAll(async () => {
    contractId = track('RevenueContract', await createRevenueContract({
      entityId: testEntityId,
      label: 'Allocation Test Contract',
      customerName: 'Gamma LLC',
      inceptionDate: '2026-01-01',
      transactionPrice: 150000,
      currency: 'CAD',
      periodId,
    }));

    poId1 = track('PO', await createPerformanceObligation({
      entityId: testEntityId,
      contractId,
      label: 'Product A',
      standaloneSellingPrice: 100000,
      satisfactionMethod: 'POINT_IN_TIME',
    }));

    poId2 = track('PO', await createPerformanceObligation({
      entityId: testEntityId,
      contractId,
      label: 'Service B',
      standaloneSellingPrice: 50000,
      satisfactionMethod: 'OVER_TIME',
      overTimeMeasure: 'INPUT',
    }));
  });

  it('allocates transaction price using relative SSP', async () => {
    const result = await allocateTransactionPrice(contractId);

    expect(result.contractTransactionPrice).toBe(150000);
    expect(result.totalAllocatable).toBe(150000);
    expect(result.allocations.length).toBe(2);

    // SSP ratio: 100k/150k = 2/3, 50k/150k = 1/3
    const productAlloc = result.allocations.find(a => a.label === 'Product A')!;
    const serviceAlloc = result.allocations.find(a => a.label === 'Service B')!;

    expect(productAlloc.allocated).toBe(100000);
    expect(serviceAlloc.allocated).toBe(50000);

    // Verify persisted
    const po1 = await getPerformanceObligation(poId1);
    expect(Number(po1.allocated_transaction_price)).toBe(100000);
  });

  it('incorporates variable consideration into allocation', async () => {
    // Add a bonus VC
    const vcId = track('VC', await createVariableConsideration({
      entityId: testEntityId,
      contractId,
      considerationType: 'BONUS',
      estimateMethod: 'MOST_LIKELY_AMOUNT',
      estimatedAmount: 15000,
      isConstrained: false,
    }));

    const result = await allocateTransactionPrice(contractId);

    // Total allocatable: 150000 + 15000 = 165000
    expect(result.variableConsideration).toBe(15000);
    expect(result.totalAllocatable).toBe(165000);

    // SSP ratio unchanged: 2/3 and 1/3
    const productAlloc = result.allocations.find(a => a.label === 'Product A')!;
    const serviceAlloc = result.allocations.find(a => a.label === 'Service B')!;

    expect(productAlloc.allocated).toBe(110000);
    expect(serviceAlloc.allocated).toBe(55000);
  });
});

// ============================================================
// Variable Consideration
// ============================================================

describe('VariableConsideration', () => {
  let contractId: string;
  let vcId: string;

  beforeAll(async () => {
    contractId = track('RevenueContract', await createRevenueContract({
      entityId: testEntityId,
      label: 'VC Test Contract',
      customerName: 'Delta Corp',
      inceptionDate: '2026-01-01',
      transactionPrice: 50000,
      currency: 'CAD',
      periodId,
    }));
  });

  it('creates a constrained variable consideration', async () => {
    vcId = track('VC', await createVariableConsideration({
      entityId: testEntityId,
      contractId,
      considerationType: 'REBATE',
      estimateMethod: 'EXPECTED_VALUE',
      estimatedAmount: 5000,
      isConstrained: true,
      constraintReason: 'High reversal risk',
    }));

    const vc = await getVariableConsideration(vcId);
    expect(vc).not.toBeNull();
    expect(vc.is_constrained).toBe(true);
    expect(Number(vc.estimated_amount)).toBe(5000);
    // Constrained = 0 (not included in TP until resolved)
    expect(Number(vc.constraint_adjusted_amount)).toBe(0);
  });

  it('lists variable considerations by contract', async () => {
    const vcs = await listVariableConsiderations(contractId);
    expect(vcs.length).toBeGreaterThanOrEqual(1);
  });

  it('resolves variable consideration with actual amount', async () => {
    const result = await resolveVariableConsideration(vcId, 4200);
    expect(result.resolved).toBe(true);
    expect(Number(result.resolved_amount)).toBe(4200);
    expect(result.is_constrained).toBe(false);
  });
});

// ============================================================
// Revenue Recognition — Point in Time
// ============================================================

describe('Revenue Recognition - Point in Time', () => {
  let contractId: string;
  let poId: string;

  beforeAll(async () => {
    contractId = track('RevenueContract', await createRevenueContract({
      entityId: testEntityId,
      label: 'PIT Recognition Contract',
      customerName: 'Epsilon Ltd',
      inceptionDate: '2026-01-01',
      transactionPrice: 75000,
      currency: 'CAD',
      periodId,
    }));

    poId = track('PO', await createPerformanceObligation({
      entityId: testEntityId,
      contractId,
      label: 'Equipment Delivery',
      standaloneSellingPrice: 75000,
      satisfactionMethod: 'POINT_IN_TIME',
    }));

    // Activate and allocate
    await activateContract(contractId);
    await allocateTransactionPrice(contractId);
  });

  it('recognizes full revenue at point of delivery', async () => {
    const result = await recognizePointInTime(poId, periodId, '2026-01-15');

    expect(result.journalEntryId).toBeDefined();
    expect(result.revenueAmount).toBe(75000);

    // Verify PO is satisfied
    const po = await getPerformanceObligation(poId);
    expect(po.is_satisfied).toBe(true);
    expect(Number(po.progress_pct)).toBe(100);
    expect(Number(po.revenue_recognized)).toBe(75000);
  });

  it('throws when recognizing already-satisfied PO', async () => {
    await expect(recognizePointInTime(poId, periodId, '2026-01-20')).rejects.toThrow('already satisfied');
  });

  it('updates contract totals after recognition', async () => {
    const contract = await getRevenueContract(contractId);
    expect(Number(contract.total_revenue_recognized)).toBe(75000);
  });
});

// ============================================================
// Revenue Recognition — Over Time
// ============================================================

describe('Revenue Recognition - Over Time', () => {
  let contractId: string;
  let poId: string;

  beforeAll(async () => {
    contractId = track('RevenueContract', await createRevenueContract({
      entityId: testEntityId,
      label: 'OT Recognition Contract',
      customerName: 'Zeta Inc',
      inceptionDate: '2026-01-01',
      transactionPrice: 60000,
      currency: 'CAD',
      periodId,
    }));

    poId = track('PO', await createPerformanceObligation({
      entityId: testEntityId,
      contractId,
      label: 'Construction Project',
      standaloneSellingPrice: 60000,
      satisfactionMethod: 'OVER_TIME',
      overTimeMeasure: 'INPUT',
    }));

    await activateContract(contractId);
    await allocateTransactionPrice(contractId);
  });

  it('recognizes incremental revenue at 25% completion', async () => {
    const result = await recognizeOverTime(poId, periodId, 25, '2026-01-10');

    expect(result.journalEntryId).toBeDefined();
    expect(result.revenueAmount).toBe(15000);
    expect(result.cumulativeRevenue).toBe(15000);

    const po = await getPerformanceObligation(poId);
    expect(Number(po.progress_pct)).toBe(25);
    expect(po.is_satisfied).toBe(false);
  });

  it('recognizes incremental revenue at 60% completion', async () => {
    const result = await recognizeOverTime(poId, periodId, 60, '2026-01-20');

    // Incremental: 60% of 60000 - 15000 = 21000
    expect(result.revenueAmount).toBe(21000);
    expect(result.cumulativeRevenue).toBe(36000);
  });

  it('completes over-time PO at 100%', async () => {
    const result = await recognizeOverTime(poId, periodId, 100, '2026-01-30');

    // Incremental: 100% of 60000 - 36000 = 24000
    expect(result.revenueAmount).toBe(24000);
    expect(result.cumulativeRevenue).toBe(60000);

    const po = await getPerformanceObligation(poId);
    expect(po.is_satisfied).toBe(true);
    expect(Number(po.revenue_recognized)).toBe(60000);
  });

  it('throws when recognizing already-satisfied over-time PO', async () => {
    await expect(recognizeOverTime(poId, periodId, 100, '2026-01-31')).rejects.toThrow('already satisfied');
  });

  it('rejects invalid progress percentage', async () => {
    // Create another PO for this test
    const po2Id = track('PO', await createPerformanceObligation({
      entityId: testEntityId,
      contractId,
      label: 'Extra Service',
      standaloneSellingPrice: 10000,
      satisfactionMethod: 'OVER_TIME',
      overTimeMeasure: 'OUTPUT',
    }));
    await allocateTransactionPrice(contractId);

    await expect(recognizeOverTime(po2Id, periodId, 150, '2026-01-15')).rejects.toThrow('progressPct');
  });
});

// ============================================================
// Contract Summary
// ============================================================

describe('Contract Summary', () => {
  let contractId: string;

  beforeAll(async () => {
    contractId = track('RevenueContract', await createRevenueContract({
      entityId: testEntityId,
      label: 'Summary Test Contract',
      customerName: 'Eta Corp',
      inceptionDate: '2026-01-01',
      transactionPrice: 200000,
      currency: 'CAD',
      periodId,
    }));

    track('PO', await createPerformanceObligation({
      entityId: testEntityId,
      contractId,
      label: 'License',
      standaloneSellingPrice: 160000,
      satisfactionMethod: 'POINT_IN_TIME',
    }));

    track('PO', await createPerformanceObligation({
      entityId: testEntityId,
      contractId,
      label: 'Support',
      standaloneSellingPrice: 40000,
      satisfactionMethod: 'OVER_TIME',
      overTimeMeasure: 'STRAIGHT_LINE',
    }));

    track('VC', await createVariableConsideration({
      entityId: testEntityId,
      contractId,
      considerationType: 'DISCOUNT',
      estimateMethod: 'MOST_LIKELY_AMOUNT',
      estimatedAmount: -10000,
      isConstrained: false,
    }));
  });

  it('returns full contract summary with POs and VCs', async () => {
    const summary = await getContractSummary(contractId);

    expect(summary.contract.id).toBe(contractId);
    expect(summary.performanceObligations.length).toBe(2);
    expect(summary.variableConsiderations.length).toBe(1);
    expect(summary.totalSSP).toBe(200000);
    expect(summary.completionPct).toBe(0);
  });

  it('completes an active contract', async () => {
    await activateContract(contractId);
    await allocateTransactionPrice(contractId);

    // Recognize one PO
    const licensePO = (await listPerformanceObligations(contractId))
      .find((po: any) => po.label === 'License');
    await recognizePointInTime(licensePO.id, periodId, '2026-01-15');

    const summary = await getContractSummary(contractId);
    expect(summary.totalRecognized).toBeGreaterThan(0);
    expect(summary.completionPct).toBeGreaterThan(0);
    expect(summary.completionPct).toBeLessThan(100);
  });
});
