/**
 * Equity Expansion — Integration Tests
 *
 * Tests ShareClass CRUD, EquityAward vesting (IFRS 2),
 * share issuance, and EPS computation (IAS 33).
 *
 * Requires: Neo4j + TimescaleDB + Kafka running with EBG schema applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import { query, closePg } from '../../src/lib/pg.js';
import { closeKafka } from '../../src/lib/kafka.js';
import { getAllEntities, createAccountingPeriod } from '../../src/services/graph/graph-crud-service.js';
import {
  createShareClass,
  getShareClass,
  listShareClasses,
  issueShares,
  getTotalShareCapital,
  createEquityAward,
  getEquityAward,
  listEquityAwards,
  recognizeVestingCompensation,
  forfeitAward,
  computeEPS,
} from '../../src/services/gl/equity-expansion-service.js';

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
    label: 'Equity Test Period',
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

  // Clean up JEs
  const jeIds = await runCypher<{ id: string }>(
    `MATCH (j:JournalEntry) WHERE j.reference STARTS WITH 'EQUITY-' RETURN j.id AS id`,
    {},
  );
  for (const je of jeIds) {
    await runCypher(`MATCH (ll:LedgerLine {journal_entry_id: $id}) DETACH DELETE ll`, { id: je.id });
    await runCypher(`MATCH (j:JournalEntry {id: $id}) DETACH DELETE j`, { id: je.id });
  }

  // Clean up nodes
  for (const { id } of cleanupIds) {
    await runCypher(`MATCH (n {id: $id}) DETACH DELETE n`, { id });
  }

  await closeNeo4j();
  await closePg();
  await closeKafka();
});

// ============================================================
// ShareClass CRUD
// ============================================================

describe('ShareClass', () => {
  let commonId: string;
  let preferredId: string;

  it('creates a common share class', async () => {
    commonId = track('ShareClass', await createShareClass({
      entityId: testEntityId,
      label: 'Common Shares',
      shareClassType: 'COMMON',
      parValue: 1.00,
      authorizedShares: 1000000,
      issuedShares: 500000,
      currency: 'CAD',
      isVoting: true,
    }));

    const sc = await getShareClass(commonId);
    expect(sc).not.toBeNull();
    expect(sc.share_class_type).toBe('COMMON');
    expect(Number(sc.authorized_shares)).toBe(1000000);
    expect(Number(sc.issued_shares)).toBe(500000);
    expect(Number(sc.outstanding_shares)).toBe(500000);
    expect(Number(sc.share_capital_amount)).toBe(500000);
    expect(sc.is_voting).toBe(true);
  });

  it('creates a preferred share class', async () => {
    preferredId = track('ShareClass', await createShareClass({
      entityId: testEntityId,
      label: 'Series A Preferred',
      shareClassType: 'PREFERRED',
      parValue: 25.00,
      authorizedShares: 100000,
      issuedShares: 20000,
      currency: 'CAD',
      isVoting: false,
      dividendRate: 0.06,
      isCumulativeDividend: true,
      liquidationPreference: 25.00,
      conversionRatio: 2.0,
    }));

    const sc = await getShareClass(preferredId);
    expect(sc.share_class_type).toBe('PREFERRED');
    expect(Number(sc.dividend_rate)).toBe(0.06);
    expect(sc.is_cumulative_dividend).toBe(true);
    expect(Number(sc.conversion_ratio)).toBe(2.0);
  });

  it('lists share classes by entity', async () => {
    const classes = await listShareClasses(testEntityId);
    expect(classes.length).toBeGreaterThanOrEqual(2);
  });

  it('issues additional shares', async () => {
    const result = await issueShares(commonId, 100000, 5.00);
    expect(result.newIssued).toBe(600000);
    expect(result.newShareCapital).toBe(600000);

    const sc = await getShareClass(commonId);
    expect(Number(sc.issued_shares)).toBe(600000);
  });

  it('rejects issuance exceeding authorized', async () => {
    await expect(issueShares(commonId, 999999, 1.00)).rejects.toThrow('exceeds authorized');
  });

  it('computes total share capital', async () => {
    const total = await getTotalShareCapital(testEntityId);
    // Common: 600000 + Preferred: 20000×25 = 500000
    expect(total).toBe(1100000);
  });
});

// ============================================================
// EquityAward (IFRS 2)
// ============================================================

describe('EquityAward', () => {
  let commonId: string;
  let optionId: string;
  let rsuId: string;

  beforeAll(async () => {
    commonId = track('ShareClass', await createShareClass({
      entityId: testEntityId,
      label: 'Award Common',
      shareClassType: 'COMMON',
      parValue: 1.00,
      authorizedShares: 500000,
      issuedShares: 200000,
      currency: 'CAD',
    }));
  });

  it('creates a stock option award', async () => {
    optionId = track('EquityAward', await createEquityAward({
      entityId: testEntityId,
      shareClassId: commonId,
      label: 'CEO Option Grant 2026',
      awardType: 'STOCK_OPTION',
      grantDate: '2026-01-01',
      vestingType: 'GRADED',
      vestingPeriodMonths: 48,
      cliffMonths: 12,
      sharesGranted: 10000,
      exercisePrice: 5.00,
      fairValueAtGrant: 8.00,
      expiryDate: '2036-01-01',
    }));

    const award = await getEquityAward(optionId);
    expect(award).not.toBeNull();
    expect(award.award_type).toBe('STOCK_OPTION');
    expect(award.award_status).toBe('GRANTED');
    expect(Number(award.total_compensation_cost)).toBe(80000);
    expect(Number(award.remaining_compensation)).toBe(80000);
  });

  it('creates an RSU award', async () => {
    rsuId = track('EquityAward', await createEquityAward({
      entityId: testEntityId,
      shareClassId: commonId,
      label: 'Employee RSU 2026',
      awardType: 'RSU',
      grantDate: '2026-01-01',
      vestingType: 'TIME_BASED',
      vestingPeriodMonths: 36,
      sharesGranted: 5000,
      fairValueAtGrant: 10.00,
    }));

    const award = await getEquityAward(rsuId);
    expect(award.award_type).toBe('RSU');
    expect(Number(award.total_compensation_cost)).toBe(50000);
  });

  it('lists awards by entity', async () => {
    const awards = await listEquityAwards(testEntityId);
    expect(awards.length).toBeGreaterThanOrEqual(2);
  });

  it('does not vest before cliff period', async () => {
    const result = await recognizeVestingCompensation(
      optionId, periodId, 6, '2026-07-01', 'CAD',
    );
    expect(result.compensationExpense).toBe(0);
    expect(result.journalEntryId).toBeNull();
  });

  it('vests compensation after cliff', async () => {
    const result = await recognizeVestingCompensation(
      optionId, periodId, 24, '2028-01-01', 'CAD',
    );
    // 24/48 × 80000 = 40000
    expect(result.compensationExpense).toBe(40000);
    expect(result.journalEntryId).toBeDefined();
    expect(result.sharesVested).toBe(5000);

    const award = await getEquityAward(optionId);
    expect(award.award_status).toBe('VESTING');
    expect(Number(award.recognized_compensation)).toBe(40000);
  });

  it('completes vesting at full period', async () => {
    const result = await recognizeVestingCompensation(
      optionId, periodId, 48, '2030-01-01', 'CAD',
    );
    // 48/48 × 80000 - 40000 = 40000 incremental
    expect(result.compensationExpense).toBe(40000);
    expect(result.sharesVested).toBe(10000);

    const award = await getEquityAward(optionId);
    expect(award.award_status).toBe('VESTED');
  });

  it('forfeits an award', async () => {
    const forfeitId = track('EquityAward', await createEquityAward({
      entityId: testEntityId,
      shareClassId: commonId,
      label: 'Forfeited Award',
      awardType: 'RSU',
      grantDate: '2026-01-01',
      vestingType: 'TIME_BASED',
      vestingPeriodMonths: 24,
      sharesGranted: 1000,
      fairValueAtGrant: 5.00,
    }));

    await forfeitAward(forfeitId);
    const award = await getEquityAward(forfeitId);
    expect(award.award_status).toBe('FORFEITED');
    expect(Number(award.shares_forfeited)).toBe(1000);
  });
});

// ============================================================
// EPS Computation (IAS 33)
// ============================================================

describe('EPS Computation', () => {
  let commonId: string;
  let preferredId: string;

  beforeAll(async () => {
    // Create share classes for EPS test
    commonId = track('ShareClass', await createShareClass({
      entityId: testEntityId,
      label: 'EPS Common',
      shareClassType: 'COMMON',
      parValue: 1.00,
      authorizedShares: 1000000,
      issuedShares: 100000,
      currency: 'CAD',
    }));

    preferredId = track('ShareClass', await createShareClass({
      entityId: testEntityId,
      label: 'EPS Preferred',
      shareClassType: 'PREFERRED',
      parValue: 10.00,
      authorizedShares: 50000,
      issuedShares: 10000,
      currency: 'CAD',
      dividendRate: 0.05,
      conversionRatio: 3.0,
    }));
  });

  it('computes basic and diluted EPS', async () => {
    const result = await computeEPS(testEntityId, periodId, 500000);

    expect(result.entityId).toBe(testEntityId);
    expect(result.netIncome).toBe(500000);
    expect(result.preferredDividends).toBeGreaterThan(0);
    expect(result.incomeAvailableToCommon).toBeLessThan(500000);
    expect(result.weightedAvgSharesBasic).toBeGreaterThan(0);
    expect(result.basicEPS).toBeGreaterThan(0);
    expect(result.weightedAvgSharesDiluted).toBeGreaterThanOrEqual(result.weightedAvgSharesBasic);
    expect(result.dilutedEPS).toBeLessThanOrEqual(result.basicEPS);
  });

  it('handles zero net income', async () => {
    const result = await computeEPS(testEntityId, periodId, 0);
    expect(result.basicEPS).toBeLessThanOrEqual(0);
  });
});
