/**
 * Cashflow Optimizer — Integration Tests
 *
 * Tests CashFlowEvent CRUD, CreditFacility CRUD, FloatWindow scoring,
 * AR discount vs facility analysis, and entity-wide scoring.
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities } from '../../src/services/graph/graph-crud-service.js';
import {
  createCashFlowEvent,
  getCashFlowEvent,
  listCashFlowEvents,
  settleCashFlowEvent,
  createCreditFacility,
  getCreditFacility,
  listCreditFacilities,
  scoreFloatWindow,
  scoreEntityFloatWindows,
  getFloatWindows,
  analyzeDiscount,
} from '../../src/services/cashflow/cashflow-optimizer-service.js';

let caFpEntityId: string;
const cleanupIds: { label: string; id: string }[] = [];

function track(label: string, id: string) {
  cleanupIds.push({ label, id });
  return id;
}

beforeAll(async () => {
  const entities = await getAllEntities();
  caFpEntityId = entities.find((e) => e.entity_type === 'FOR_PROFIT' && e.jurisdiction === 'CA')!.id;
});

afterAll(async () => {
  // Clean up FloatWindow edges and nodes
  for (const { id } of cleanupIds.filter((c) => c.label === 'CashFlowEvent')) {
    await runCypher(
      `MATCH (cfe:CashFlowEvent {id: $id})-[r:CREATES]->(fw:FloatWindow)
       DELETE r, fw`,
      { id },
    );
  }

  for (const { label, id } of cleanupIds) {
    await runCypher(`MATCH (n:${label} {id: $id}) DETACH DELETE n`, { id });
  }

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

describe('CashFlowEvent CRUD', () => {
  let outflowId: string;

  it('creates an outflow event (payable)', async () => {
    outflowId = track('CashFlowEvent', await createCashFlowEvent({
      entityId: caFpEntityId,
      label: 'Supplier Invoice #1001',
      direction: 'OUTFLOW',
      amount: 50000,
      currency: 'CAD',
      scheduledDate: '2026-05-15',
      latestDate: '2026-06-15',
      penaltyRateDaily: 0.0001,
      counterpartyId: caFpEntityId,
      relationshipSensitivity: 0.7,
    }));
    expect(outflowId).toBeDefined();
  });

  it('retrieves cash flow event', async () => {
    const cfe = await getCashFlowEvent(outflowId);
    expect(cfe).toBeDefined();
    expect(cfe!.direction).toBe('OUTFLOW');
    expect(Number(cfe!.amount)).toBe(50000);
    expect(cfe!.status).toBe('PENDING');
  });

  it('lists events by entity', async () => {
    const events = await listCashFlowEvents(caFpEntityId);
    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  it('settles cash flow event', async () => {
    const settleId = track('CashFlowEvent', await createCashFlowEvent({
      entityId: caFpEntityId,
      label: 'Quick Settle Test',
      direction: 'OUTFLOW',
      amount: 1000,
      currency: 'CAD',
      scheduledDate: '2026-05-01',
    }));

    const result = await settleCashFlowEvent(settleId);
    expect(result).toBe(true);

    const cfe = await getCashFlowEvent(settleId);
    expect(cfe!.status).toBe('SETTLED');
  });
});

describe('CreditFacility CRUD', () => {
  let facilityId: string;

  it('creates a credit facility', async () => {
    facilityId = track('CreditFacility', await createCreditFacility({
      entityId: caFpEntityId,
      label: 'Operating Line',
      facilityType: 'REVOLVER',
      limit: 500000,
      drawn: 100000,
      interestRate: 0.065,
      rateType: 'VARIABLE',
      maturityDate: '2027-12-31',
    }));
    expect(facilityId).toBeDefined();
  });

  it('retrieves credit facility', async () => {
    const cf = await getCreditFacility(facilityId);
    expect(cf).toBeDefined();
    expect(cf!.facility_type).toBe('REVOLVER');
    expect(Number(cf!.facility_limit)).toBe(500000);
    expect(Number(cf!.drawn)).toBe(100000);
    expect(Number(cf!.available)).toBe(400000);
    expect(Number(cf!.interest_rate)).toBe(0.065);
  });

  it('lists facilities by entity', async () => {
    const facilities = await listCreditFacilities(caFpEntityId);
    expect(facilities.length).toBeGreaterThanOrEqual(1);
  });
});

describe('FloatWindow Scoring — Outflow (DELAY_PAYABLE)', () => {
  let payableId: string;

  beforeAll(async () => {
    payableId = track('CashFlowEvent', await createCashFlowEvent({
      entityId: caFpEntityId,
      label: 'Vendor Payment — 30 day delay window',
      direction: 'OUTFLOW',
      amount: 100000,
      currency: 'CAD',
      scheduledDate: '2026-06-01',
      latestDate: '2026-07-01',
      penaltyRateDaily: 0.0002,
    }));
  });

  it('scores delay payable opportunity', async () => {
    const result = await scoreFloatWindow(payableId);
    expect(result).toBeDefined();
    expect(result!.opportunityType).toBe('DELAY_PAYABLE');
    expect(result!.windowDays).toBe(30);
    expect(result!.floatAmount).toBe(100000);
    // Opportunity = 100000 * 0.04 * 30/365 ≈ 328.77
    expect(result!.opportunityValue).toBeGreaterThan(0);
    // Penalty = 100000 * 0.0002 * 30 = 600
    expect(result!.discountCost).toBe(600);
    // Net = 328.77 - 600 = negative
    expect(result!.netValue).toBeLessThan(0);
  });
});

describe('FloatWindow Scoring — Inflow (ACCELERATE_RECEIVABLE)', () => {
  let receivableId: string;

  beforeAll(async () => {
    receivableId = track('CashFlowEvent', await createCashFlowEvent({
      entityId: caFpEntityId,
      label: 'Customer Invoice — 2/10 net 45',
      direction: 'INFLOW',
      amount: 200000,
      currency: 'CAD',
      scheduledDate: '2026-06-30',
      earliestDate: '2026-06-10',
      discountOfferedPct: 0.02,
    }));
  });

  it('scores accelerate receivable opportunity', async () => {
    const result = await scoreFloatWindow(receivableId);
    expect(result).toBeDefined();
    expect(result!.opportunityType).toBe('ACCELERATE_RECEIVABLE');
    expect(result!.windowDays).toBe(20);
    expect(result!.floatAmount).toBe(200000);
    // Discount cost = 200000 * 0.02 = 4000
    expect(result!.discountCost).toBe(4000);
    // Annualized rate = (0.02/0.98) * (365/20) ≈ 37.24%
    expect(result!.annualizedDiscountRate).toBeGreaterThan(0.30);
  });

  it('recommends facility over expensive discount', async () => {
    const result = await scoreFloatWindow(receivableId);
    expect(result).toBeDefined();
    // Facility rate is 6.5%, discount annualizes to ~37%
    // Should recommend facility
    if (result!.facilityRate != null) {
      expect(result!.useDiscountOverFacility).toBe(false);
      expect(result!.recommendation).toContain('facility');
    }
  });
});

describe('AR Discount Analysis', () => {
  let cheapDiscountId: string;

  beforeAll(async () => {
    // Create a CFE with a cheap discount (below facility rate)
    cheapDiscountId = track('CashFlowEvent', await createCashFlowEvent({
      entityId: caFpEntityId,
      label: 'Customer Invoice — small discount, long window',
      direction: 'INFLOW',
      amount: 100000,
      currency: 'CAD',
      scheduledDate: '2026-12-31',
      earliestDate: '2026-06-30',
      discountOfferedPct: 0.005, // 0.5%
    }));
  });

  it('analyzes expensive discount (recommends facility)', async () => {
    // Reuse the 2% discount receivable from previous describe
    const events = await listCashFlowEvents(caFpEntityId, 'PENDING');
    const expensiveDiscount = events.find((e: any) =>
      (e.label as string).includes('2/10 net 45'),
    );

    if (expensiveDiscount) {
      const analysis = await analyzeDiscount(expensiveDiscount.id as string);
      expect(analysis).toBeDefined();
      if (analysis!.bestFacilityRate != null) {
        expect(analysis!.facilityCheaper).toBe(true);
        expect(analysis!.recommendation).toBe('USE_FACILITY');
        expect(analysis!.savings).toBeGreaterThan(0);
      }
    }
  });

  it('analyzes cheap discount (recommends taking discount)', async () => {
    const analysis = await analyzeDiscount(cheapDiscountId);
    expect(analysis).toBeDefined();
    expect(analysis!.discountPct).toBe(0.005);
    // Annualized = (0.005/0.995) * (365/184) ≈ 1.0%
    expect(analysis!.annualizedRate).toBeLessThan(0.02);
    // Facility rate is 6.5% — discount is much cheaper
    if (analysis!.bestFacilityRate != null) {
      expect(analysis!.facilityCheaper).toBe(false);
      expect(analysis!.recommendation).toBe('TAKE_DISCOUNT');
    }
  });
});

describe('Entity-Wide Scoring', () => {
  it('scores all pending events for entity', async () => {
    const windows = await scoreEntityFloatWindows(caFpEntityId);
    // At least some of the events should produce windows
    expect(windows.length).toBeGreaterThanOrEqual(1);
    // Should be sorted by net value descending
    if (windows.length >= 2) {
      expect(windows[0].netValue).toBeGreaterThanOrEqual(windows[1].netValue);
    }
  });

  it('retrieves positive float windows', async () => {
    const windows = await getFloatWindows(caFpEntityId);
    for (const w of windows) {
      expect(Number((w as any).net_value)).toBeGreaterThan(0);
    }
  });
});
