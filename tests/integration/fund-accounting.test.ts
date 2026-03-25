/**
 * Fund Accounting — Integration Test
 *
 * Verifies fund accounting enforcement:
 * - Fund creation only for NFP entities (fund_accounting_enabled=true)
 * - Fund CRUD lifecycle with restriction types
 * - Fund listing by entity
 *
 * Requires: Neo4j running with EBG schema and seed data applied.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeNeo4j, runCypher } from '../../src/lib/neo4j.js';
import {
  getAllEntities,
  createFund,
  getFund,
  listFunds,
  updateFund,
  deleteFund,
} from '../../src/services/graph/graph-crud-service.js';
import type { Entity } from '../../src/schema/neo4j/types.js';

let fpEntity: Entity;
let nfpEntity: Entity;
const createdFundIds: string[] = [];

beforeAll(async () => {
  const entities = await getAllEntities();
  const fp = entities.find((e) => e.entity_type === 'FOR_PROFIT');
  const nfp = entities.find((e) => e.entity_type === 'NOT_FOR_PROFIT');
  expect(fp).toBeDefined();
  expect(nfp).toBeDefined();
  fpEntity = fp!;
  nfpEntity = nfp!;
});

afterAll(async () => {
  for (const id of createdFundIds) {
    await runCypher(`MATCH (f:Fund {id: $id}) DETACH DELETE f`, { id });
  }
  await closeNeo4j();
});

describe('Fund Accounting — NFP Enforcement', () => {
  it('NFP entity has fund_accounting_enabled=true', () => {
    expect(nfpEntity.fund_accounting_enabled).toBe(true);
  });

  it('FP entity has fund_accounting_enabled=false', () => {
    expect(fpEntity.fund_accounting_enabled).toBe(false);
  });

  it('allows Fund creation for NFP entity', async () => {
    const id = await createFund({
      entityId: nfpEntity.id,
      fundType: 'UNRESTRICTED',
      label: 'General Operations Fund',
    });
    createdFundIds.push(id);

    const fund = await getFund(id);
    expect(fund).not.toBeNull();
    expect((fund as any).fund_type).toBe('UNRESTRICTED');
  });

  it('rejects Fund creation for FP entity', async () => {
    await expect(
      createFund({
        entityId: fpEntity.id,
        fundType: 'UNRESTRICTED',
        label: 'Should Fail',
      }),
    ).rejects.toThrow('Fund accounting not enabled');
  });
});

describe('Fund Accounting — Restriction Types', () => {
  it('creates TEMPORARILY_RESTRICTED fund', async () => {
    const id = await createFund({
      entityId: nfpEntity.id,
      fundType: 'TEMPORARILY_RESTRICTED',
      label: 'Youth Program Grant 2026',
      restrictionDescription: 'Restricted to youth program expenses until Dec 2026',
    });
    createdFundIds.push(id);

    const fund = await getFund(id) as any;
    expect(fund.fund_type).toBe('TEMPORARILY_RESTRICTED');
    expect(fund.restriction_description).toContain('youth program');
  });

  it('creates PERMANENTLY_RESTRICTED fund', async () => {
    const id = await createFund({
      entityId: nfpEntity.id,
      fundType: 'PERMANENTLY_RESTRICTED',
      label: 'Endowment Principal',
      restrictionDescription: 'Donor-restricted endowment principal',
    });
    createdFundIds.push(id);

    const fund = await getFund(id) as any;
    expect(fund.fund_type).toBe('PERMANENTLY_RESTRICTED');
  });

  it('creates ENDOWMENT fund', async () => {
    const id = await createFund({
      entityId: nfpEntity.id,
      fundType: 'ENDOWMENT',
      label: 'Community Trust Endowment',
    });
    createdFundIds.push(id);

    const fund = await getFund(id) as any;
    expect(fund.fund_type).toBe('ENDOWMENT');
  });
});

describe('Fund Accounting — CRUD Operations', () => {
  it('lists all funds for NFP entity', async () => {
    const funds = await listFunds(nfpEntity.id);
    // At least the 4 we just created
    expect(funds.length).toBeGreaterThanOrEqual(4);
  });

  it('lists no funds for FP entity', async () => {
    const funds = await listFunds(fpEntity.id);
    expect(funds).toHaveLength(0);
  });

  it('updates fund restriction description', async () => {
    const id = createdFundIds[0];
    const updated = await updateFund(id, {
      restriction_description: 'Updated description',
    });
    expect(updated).toBe(true);

    const fund = await getFund(id) as any;
    expect(fund.restriction_description).toBe('Updated description');
  });

  it('deletes a fund', async () => {
    const id = await createFund({
      entityId: nfpEntity.id,
      fundType: 'UNRESTRICTED',
      label: 'Temporary Fund To Delete',
    });

    const deleted = await deleteFund(id);
    expect(deleted).toBe(true);

    const fund = await getFund(id);
    expect(fund).toBeNull();
  });
});
