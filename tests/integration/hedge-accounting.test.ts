/**
 * Hedge Accounting (IFRS 9) — Integration Tests
 *
 * Tests FinancialInstrument CRUD, HedgeRelationship CRUD,
 * prospective/retrospective effectiveness testing,
 * fair value / cash flow / net investment hedge processing,
 * de-designation, OCI recycling, and summary reporting.
 *
 * Requires: Neo4j + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { v4 as uuid } from 'uuid';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities } from '../../src/services/graph/graph-crud-service.js';
import {
  createFinancialInstrument,
  getFinancialInstrument,
  listFinancialInstruments,
  createHedgeRelationship,
  getHedgeRelationship,
  listHedgeRelationships,
  runProspectiveTest,
  runRetrospectiveTest,
  processFairValueHedge,
  processCashFlowHedge,
  processNetInvestmentHedge,
  dedesignateHedge,
  recycleOciToP_L,
  getHedgeAccountingSummary,
} from '../../src/services/gl/hedge-accounting-service.js';

let testEntityId: string;
const cleanupIds: string[] = [];

function track(id: string) {
  cleanupIds.push(id);
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  const fpEntity = entities.find((e) => e.entity_type === 'FOR_PROFIT');
  testEntityId = fpEntity!.id;
});

afterAll(async () => {
  for (const id of cleanupIds) {
    await runCypher(`MATCH (n {id: $id}) DETACH DELETE n`, { id });
  }
  await closeNeo4j();
  await closePg();
  await closeKafka();
});

// ============================================================
// FinancialInstrument CRUD
// ============================================================

describe('FinancialInstrument CRUD', () => {
  let instrumentId: string;

  it('creates a financial instrument', async () => {
    instrumentId = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'DERIVATIVE',
      ifrs9Classification: 'FVTPL',
      label: 'Interest Rate Swap',
      fairValue: 50000,
      fairValueHierarchy: 'LEVEL_2',
      grossCarryingAmount: 50000,
    }));

    const fi = await getFinancialInstrument(instrumentId);
    expect(fi).not.toBeNull();
    expect(fi.instrument_type).toBe('DERIVATIVE');
    expect(fi.ifrs9_classification).toBe('FVTPL');
    expect(Number(fi.fair_value)).toBe(50000);
    expect(fi.ecl_stage).toBe('STAGE_1');
    expect(Number(fi.ecl_allowance)).toBe(0);
  });

  it('lists instruments by entity', async () => {
    const instruments = await listFinancialInstruments(testEntityId);
    expect(instruments.length).toBeGreaterThanOrEqual(1);
  });

  it('filters by instrument type', async () => {
    const derivatives = await listFinancialInstruments(testEntityId, 'DERIVATIVE');
    expect(derivatives.some((fi: any) => fi.id === instrumentId)).toBe(true);

    const bonds = await listFinancialInstruments(testEntityId, 'BOND');
    expect(bonds.some((fi: any) => fi.id === instrumentId)).toBe(false);
  });
});

// ============================================================
// HedgeRelationship CRUD
// ============================================================

describe('HedgeRelationship CRUD', () => {
  let hedgingId: string;
  let hedgedId: string;
  let hedgeId: string;

  beforeAll(async () => {
    hedgingId = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'DERIVATIVE',
      ifrs9Classification: 'FVTPL',
      label: 'FX Forward Contract',
      fairValue: 10000,
      grossCarryingAmount: 10000,
    }));

    hedgedId = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'RECEIVABLE',
      ifrs9Classification: 'AMORTISED_COST',
      label: 'USD Receivable',
      grossCarryingAmount: 100000,
    }));
  });

  it('creates a hedge relationship', async () => {
    hedgeId = track(await createHedgeRelationship({
      entityId: testEntityId,
      hedgeType: 'CASH_FLOW',
      hedgingInstrumentId: hedgingId,
      hedgedItemId: hedgedId,
      designationDate: '2026-01-01',
      hedgeRatio: 1.0,
      effectivenessMethod: 'DOLLAR_OFFSET',
    }));

    const hr = await getHedgeRelationship(hedgeId);
    expect(hr).not.toBeNull();
    expect(hr.hedge_type).toBe('CASH_FLOW');
    expect(Number(hr.hedge_ratio)).toBe(1.0);
    expect(hr.prospective_test).toBe('PASS');
    expect(hr.is_active).toBe(true);
    expect(Number(hr.oci_balance)).toBe(0);
  });

  it('lists hedge relationships', async () => {
    const hedges = await listHedgeRelationships(testEntityId);
    expect(hedges.length).toBeGreaterThanOrEqual(1);
  });

  it('filters by hedge type', async () => {
    const cashFlow = await listHedgeRelationships(testEntityId, 'CASH_FLOW');
    expect(cashFlow.some((h: any) => h.id === hedgeId)).toBe(true);

    const fairValue = await listHedgeRelationships(testEntityId, 'FAIR_VALUE');
    expect(fairValue.some((h: any) => h.id === hedgeId)).toBe(false);
  });

  it('throws when instrument not found', async () => {
    await expect(createHedgeRelationship({
      entityId: testEntityId,
      hedgeType: 'FAIR_VALUE',
      hedgingInstrumentId: uuid(),
      hedgedItemId: hedgedId,
      designationDate: '2026-01-01',
      hedgeRatio: 1.0,
      effectivenessMethod: 'DOLLAR_OFFSET',
    })).rejects.toThrow('Hedging instrument not found');
  });
});

// ============================================================
// Effectiveness Testing
// ============================================================

describe('Effectiveness Testing', () => {
  let hedgeId: string;

  beforeAll(async () => {
    const instr = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'DERIVATIVE',
      ifrs9Classification: 'FVTPL',
      label: 'Effectiveness Test Swap',
      fairValue: 20000,
      grossCarryingAmount: 20000,
    }));
    const hedged = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'LOAN',
      ifrs9Classification: 'AMORTISED_COST',
      label: 'Effectiveness Test Loan',
      grossCarryingAmount: 200000,
    }));
    hedgeId = track(await createHedgeRelationship({
      entityId: testEntityId,
      hedgeType: 'FAIR_VALUE',
      hedgingInstrumentId: instr,
      hedgedItemId: hedged,
      designationDate: '2026-02-01',
      hedgeRatio: 1.0,
      effectivenessMethod: 'DOLLAR_OFFSET',
    }));
  });

  it('passes prospective test within 80-125%', async () => {
    const result = await runProspectiveTest(hedgeId);
    expect(result.result).toBe('PASS');
    expect(result.hedgeRatio).toBe(1.0);
  });

  it('fails prospective test outside range', async () => {
    // Create a hedge with extreme ratio
    const instr2 = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'DERIVATIVE',
      ifrs9Classification: 'FVTPL',
      label: 'Bad Ratio Swap',
      fairValue: 5000,
      grossCarryingAmount: 5000,
    }));
    const hedged2 = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'LOAN',
      ifrs9Classification: 'AMORTISED_COST',
      label: 'Bad Ratio Loan',
      grossCarryingAmount: 50000,
    }));
    const badHedge = track(await createHedgeRelationship({
      entityId: testEntityId,
      hedgeType: 'FAIR_VALUE',
      hedgingInstrumentId: instr2,
      hedgedItemId: hedged2,
      designationDate: '2026-02-01',
      hedgeRatio: 0.5, // below 0.8
      effectivenessMethod: 'DOLLAR_OFFSET',
    }));

    const result = await runProspectiveTest(badHedge);
    expect(result.result).toBe('FAIL');
  });

  it('passes retrospective test with matching changes', async () => {
    const result = await runRetrospectiveTest(hedgeId, -1000, 1000);
    expect(result.result).toBe('PASS');
    expect(result.effectivenessRatio).toBeCloseTo(1.0, 2);
  });

  it('fails retrospective test with extreme divergence', async () => {
    const instr3 = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'DERIVATIVE',
      ifrs9Classification: 'FVTPL',
      label: 'Retro Fail Swap',
      fairValue: 8000,
      grossCarryingAmount: 8000,
    }));
    const hedged3 = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'BOND',
      ifrs9Classification: 'AMORTISED_COST',
      label: 'Retro Fail Bond',
      grossCarryingAmount: 80000,
    }));
    const retroHedge = track(await createHedgeRelationship({
      entityId: testEntityId,
      hedgeType: 'FAIR_VALUE',
      hedgingInstrumentId: instr3,
      hedgedItemId: hedged3,
      designationDate: '2026-02-15',
      hedgeRatio: 1.0,
      effectivenessMethod: 'DOLLAR_OFFSET',
    }));

    const result = await runRetrospectiveTest(retroHedge, -500, 5000);
    expect(result.result).toBe('FAIL');
    // Should de-designate
    const hr = await getHedgeRelationship(retroHedge);
    expect(hr.is_active).toBe(false);
  });
});

// ============================================================
// Fair Value Hedge Processing
// ============================================================

describe('Fair Value Hedge', () => {
  let hedgeId: string;
  let instrId: string;
  let hedgedId: string;

  beforeAll(async () => {
    instrId = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'DERIVATIVE',
      ifrs9Classification: 'FVTPL',
      label: 'FV Hedge Swap',
      fairValue: 0,
      grossCarryingAmount: 100000,
    }));
    hedgedId = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'BOND',
      ifrs9Classification: 'AMORTISED_COST',
      label: 'FV Hedged Bond',
      fairValue: 100000,
      grossCarryingAmount: 100000,
    }));
    hedgeId = track(await createHedgeRelationship({
      entityId: testEntityId,
      hedgeType: 'FAIR_VALUE',
      hedgingInstrumentId: instrId,
      hedgedItemId: hedgedId,
      designationDate: '2026-03-01',
      hedgeRatio: 1.0,
      effectivenessMethod: 'DOLLAR_OFFSET',
    }));
  });

  it('processes fair value hedge — both changes to P&L', async () => {
    const result = await processFairValueHedge(hedgeId, 2000, -1800);
    expect(result.instrumentPnL).toBe(2000);
    expect(result.hedgedItemPnL).toBe(-1800);
    expect(result.netPnL).toBe(200); // ineffectiveness

    // Hedged item carrying amount adjusted
    const hedgedItem = await getFinancialInstrument(hedgedId);
    expect(Number(hedgedItem.gross_carrying_amount)).toBe(98200); // 100000 - 1800
  });
});

// ============================================================
// Cash Flow Hedge Processing
// ============================================================

describe('Cash Flow Hedge', () => {
  let hedgeId: string;

  beforeAll(async () => {
    const instr = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'DERIVATIVE',
      ifrs9Classification: 'FVTPL',
      label: 'CF Hedge Forward',
      fairValue: 0,
      grossCarryingAmount: 50000,
    }));
    const hedged = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'RECEIVABLE',
      ifrs9Classification: 'AMORTISED_COST',
      label: 'CF Hedged Receivable',
      grossCarryingAmount: 500000,
    }));
    hedgeId = track(await createHedgeRelationship({
      entityId: testEntityId,
      hedgeType: 'CASH_FLOW',
      hedgingInstrumentId: instr,
      hedgedItemId: hedged,
      designationDate: '2026-03-15',
      hedgeRatio: 1.0,
      effectivenessMethod: 'DOLLAR_OFFSET',
    }));
  });

  it('splits effective (OCI) and ineffective (P&L) portions', async () => {
    const result = await processCashFlowHedge(hedgeId, 3000, -2500);
    // Effective = min(3000, 2500) = 2500 (positive since instrument gained)
    expect(result.effectivePortion).toBe(2500);
    // Ineffective = 3000 - 2500 = 500
    expect(result.ineffectivePortion).toBe(500);
    expect(result.ociBalance).toBe(2500);

    const hr = await getHedgeRelationship(hedgeId);
    expect(Number(hr.oci_balance)).toBe(2500);
  });

  it('accumulates OCI balance over periods', async () => {
    const result = await processCashFlowHedge(hedgeId, 1000, -1000);
    expect(result.effectivePortion).toBe(1000);
    expect(result.ineffectivePortion).toBe(0);
    expect(result.ociBalance).toBe(3500); // 2500 + 1000
  });
});

// ============================================================
// Net Investment Hedge Processing
// ============================================================

describe('Net Investment Hedge', () => {
  let hedgeId: string;

  beforeAll(async () => {
    const instr = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'DERIVATIVE',
      ifrs9Classification: 'FVTPL',
      label: 'NI Hedge Forward',
      fairValue: 0,
      grossCarryingAmount: 200000,
    }));
    const hedged = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'EQUITY_INVESTMENT',
      ifrs9Classification: 'FVOCI_EQUITY',
      label: 'Foreign Subsidiary Investment',
      grossCarryingAmount: 2000000,
    }));
    hedgeId = track(await createHedgeRelationship({
      entityId: testEntityId,
      hedgeType: 'NET_INVESTMENT',
      hedgingInstrumentId: instr,
      hedgedItemId: hedged,
      designationDate: '2026-04-01',
      hedgeRatio: 1.0,
      effectivenessMethod: 'DOLLAR_OFFSET',
    }));
  });

  it('sends effective portion to OCI', async () => {
    const result = await processNetInvestmentHedge(hedgeId, -5000, 5000);
    expect(result.effectivePortion).toBe(-5000);
    expect(result.ineffectivePortion).toBe(0);
    expect(result.ociBalance).toBe(-5000);
  });
});

// ============================================================
// De-designation & OCI Recycling
// ============================================================

describe('De-designation & Recycling', () => {
  let hedgeId: string;

  beforeAll(async () => {
    const instr = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'DERIVATIVE',
      ifrs9Classification: 'FVTPL',
      label: 'Recycle Test Forward',
      fairValue: 0,
      grossCarryingAmount: 30000,
    }));
    const hedged = track(await createFinancialInstrument({
      entityId: testEntityId,
      instrumentType: 'RECEIVABLE',
      ifrs9Classification: 'AMORTISED_COST',
      label: 'Recycle Test Receivable',
      grossCarryingAmount: 300000,
    }));
    hedgeId = track(await createHedgeRelationship({
      entityId: testEntityId,
      hedgeType: 'CASH_FLOW',
      hedgingInstrumentId: instr,
      hedgedItemId: hedged,
      designationDate: '2026-05-01',
      hedgeRatio: 1.0,
      effectivenessMethod: 'DOLLAR_OFFSET',
    }));
    // Build up OCI balance
    await processCashFlowHedge(hedgeId, 4000, -4000);
  });

  it('de-designates a hedge', async () => {
    const result = await dedesignateHedge(hedgeId);
    expect(result.hedgeType).toBe('CASH_FLOW');
    expect(result.ociBalance).toBe(4000);

    const hr = await getHedgeRelationship(hedgeId);
    expect(hr.is_active).toBe(false);
  });

  it('recycles OCI to P&L', async () => {
    const result = await recycleOciToP_L(hedgeId);
    expect(result.recycledAmount).toBe(4000);
    expect(result.hedgeType).toBe('CASH_FLOW');

    const hr = await getHedgeRelationship(hedgeId);
    expect(Number(hr.oci_balance)).toBe(0);
  });
});

// ============================================================
// Summary Report
// ============================================================

describe('Hedge Accounting Summary', () => {
  it('generates summary for entity', async () => {
    const summary = await getHedgeAccountingSummary(testEntityId);
    expect(summary.totalHedges).toBeGreaterThanOrEqual(1);
    expect(typeof summary.activeHedges).toBe('number');
    expect(typeof summary.totalOciBalance).toBe('number');
    expect(typeof summary.totalIneffectiveness).toBe('number');
    expect(typeof summary.byType).toBe('object');
  });
});
