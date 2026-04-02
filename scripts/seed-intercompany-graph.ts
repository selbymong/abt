export {};

/**
 * Seed Intercompany Graph Model
 *
 * Creates:
 * 1. Renames US entities to Harness brand
 * 2. ConsolidationGroup ("Harness Group") with HX as parent
 * 3. OwnershipInterest: HX → Harness Exchange US (100%)
 * 4. RELATED_PARTY edges between all entity pairs
 * 5. HG subgraph: 3 outcomes, 7 activities, 4 metrics, 2 resources, 2 funds, edges
 * 6. HX US subgraph: 3 outcomes, 4 activities, 3 metrics, edges
 * 7. HG US subgraph: 3 outcomes, 5 activities, 2 funds, edges
 *
 * Run: npx tsx scripts/seed-intercompany-graph.ts
 */

const BASE = 'http://localhost:4000/api';
const GQL = 'http://localhost:4000/graphql';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${path}: ${body}`);
  }
  return res.json() as Promise<T>;
}

async function gql(query: string, variables?: Record<string, unknown>): Promise<any> {
  const res = await fetch(GQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json: any = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

// Retry wrapper for throttled requests
async function apiRetry<T>(path: string, options?: RequestInit, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await api<T>(path, options);
    } catch (e: any) {
      if (e.message.includes('429') && i < retries - 1) {
        console.log(`    Rate limited, waiting 2s...`);
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      throw e;
    }
  }
  throw new Error('Unreachable');
}

// ── Helpers ───────────────────────────────────────────────────

async function createOutcome(entityId: string, label: string, outcomeType: string, ontology: string): Promise<string> {
  const result = await apiRetry<any>('/graph/outcomes', {
    method: 'POST',
    body: JSON.stringify({
      entityId, label, outcomeType, ontology,
      targetDelta: 0, currency: 'CAD',
      periodStart: '2026-04-01', periodEnd: '2031-03-31',
    }),
  });
  return result.id;
}

async function createActivity(entityId: string, label: string, description: string, status = 'IN_PROGRESS'): Promise<string> {
  const result = await apiRetry<any>('/graph/activities', {
    method: 'POST',
    body: JSON.stringify({ entityId, label, description, status }),
  });
  return result.id;
}

async function createMetric(entityId: string, label: string, metricType: string, unit: string): Promise<string> {
  const result = await apiRetry<any>('/graph/metrics', {
    method: 'POST',
    body: JSON.stringify({ entityId, label, metricType, unit, currentValue: 0, targetValue: 0 }),
  });
  return result.id;
}

async function createResource(entityId: string, label: string, resourceType: string): Promise<string> {
  const result = await apiRetry<any>('/graph/resources', {
    method: 'POST',
    body: JSON.stringify({
      entityId, label, resourceType, status: 'ACTIVE',
      allocationPct: 100, costMonetary: 0, currency: 'CAD',
    }),
  });
  return result.id;
}

async function createFund(entityId: string, label: string, fundType: string, description?: string): Promise<string> {
  const result = await apiRetry<any>('/graph/funds', {
    method: 'POST',
    body: JSON.stringify({ entityId, label, fundType, restrictionDescription: description }),
  });
  return result.id;
}

async function createEdge(sourceId: string, targetId: string, weight: number, confidence = 0.85): Promise<void> {
  await apiRetry<any>('/graph/edges/contributes-to', {
    method: 'POST',
    body: JSON.stringify({
      sourceId, targetId, weight, confidence,
      contributionFunction: 'LINEAR',
    }),
  });
}

// ── Main ───────────────────────────────────────────────────────

async function main() {
  console.log('=== Seeding Intercompany Graph Model ===\n');

  // ── Step 0: Look up all 4 entities ──────────────────────────
  console.log('Looking up entities...');
  const entities = await api<{ entities: any[] }>('/graph/entities');

  const hx = entities.entities.find((e: any) => e.label === 'Harness Exchange');
  const hg = entities.entities.find((e: any) => e.label === 'Harness Good');
  const usFp = entities.entities.find((e: any) =>
    e.label === 'US ForProfit Corp' || e.label === 'Harness Exchange US',
  );
  const usNfp = entities.entities.find((e: any) =>
    e.label === 'US NotForProfit' || e.label === 'Harness Good US',
  );

  if (!hx || !hg || !usFp || !usNfp) {
    throw new Error(`Missing entities. Found: ${entities.entities.map((e: any) => e.label).join(', ')}`);
  }

  console.log(`  HX:     ${hx.id} (${hx.label})`);
  console.log(`  HG:     ${hg.id} (${hg.label})`);
  console.log(`  US FP:  ${usFp.id} (${usFp.label})`);
  console.log(`  US NFP: ${usNfp.id} (${usNfp.label})`);

  // ── Step 1: Rename US entities ──────────────────────────────
  console.log('\nRenaming US entities...');

  if (usFp.label !== 'Harness Exchange US') {
    await gql(
      `mutation($id: ID!, $props: JSON!) { updateNode(label: "Entity", id: $id, input: { properties: $props }) }`,
      { id: usFp.id, props: { label: 'Harness Exchange US', legal_name: 'Harness Exchange US Inc.' } },
    );
    console.log(`  Renamed "${usFp.label}" → "Harness Exchange US"`);
  } else {
    console.log('  Harness Exchange US already named');
  }

  if (usNfp.label !== 'Harness Good US') {
    await gql(
      `mutation($id: ID!, $props: JSON!) { updateNode(label: "Entity", id: $id, input: { properties: $props }) }`,
      { id: usNfp.id, props: { label: 'Harness Good US', legal_name: 'Harness Good US Foundation' } },
    );
    console.log(`  Renamed "${usNfp.label}" → "Harness Good US"`);
  } else {
    console.log('  Harness Good US already named');
  }

  // ── Step 2: ConsolidationGroup + Relationships ──────────────
  console.log('\nCreating consolidation group...');

  try {
    const group = await api<any>('/consolidation/groups', {
      method: 'POST',
      body: JSON.stringify({
        label: 'Harness Group',
        parentEntityId: hx.id,
        functionalCurrency: 'CAD',
        entityIds: [hx.id, hg.id, usFp.id, usNfp.id],
        minorityInterestMethod: 'PROPORTIONATE',
        intercompanyThreshold: 0,
      }),
    });
    console.log(`  ConsolidationGroup "Harness Group": ${group.id}`);
  } catch (e: any) {
    console.log(`  ConsolidationGroup: ${e.message}`);
  }

  // OwnershipInterest: HX → Harness Exchange US (100%)
  console.log('\nCreating ownership interest...');
  try {
    const oi = await api<any>('/consolidation/ownership-interests', {
      method: 'POST',
      body: JSON.stringify({
        investorEntityId: hx.id,
        investeeEntityId: usFp.id,
        ownershipPct: 1.0,
        acquisitionCost: 0,
        netAssetsAtAcquisition: 0,
        acquisitionDate: '2026-04-01',
      }),
    });
    console.log(`  OwnershipInterest HX → HX US (100%): ${oi.id}`);
  } catch (e: any) {
    console.log(`  OwnershipInterest: ${e.message}`);
  }

  // RELATED_PARTY edges
  console.log('\nCreating related party edges...');

  const relatedPartyPairs: [string, string, string, string][] = [
    [hx.id, hg.id, 'SHARED_MANAGEMENT', 'HX ↔ HG'],
    [hx.id, usFp.id, 'SIGNIFICANT_INFLUENCE', 'HX ↔ HX US'],
    [hx.id, usNfp.id, 'SHARED_MANAGEMENT', 'HX ↔ HG US'],
    [hg.id, usNfp.id, 'SHARED_MANAGEMENT', 'HG ↔ HG US'],
    [usFp.id, usNfp.id, 'SHARED_MANAGEMENT', 'HX US ↔ HG US'],
    [hg.id, usFp.id, 'ECONOMIC_DEPENDENCE', 'HG ↔ HX US'],
  ];

  for (const [src, tgt, relType, label] of relatedPartyPairs) {
    try {
      await api<any>('/gl/related-parties', {
        method: 'POST',
        body: JSON.stringify({
          sourceEntityId: src,
          targetEntityId: tgt,
          relationshipType: relType,
          individualsInCommon: ['Selby Mong'],
          effectiveFrom: '2026-04-01',
          disclosureRequired: true,
        }),
      });
      console.log(`  ${label} (${relType})`);
    } catch (e: any) {
      console.log(`  ${label}: ${e.message}`);
    }
  }

  // ── Step 3: HG Subgraph (Harness Good) ─────────────────────
  console.log('\n=== Building Harness Good Subgraph ===');

  // Outcomes
  console.log('\nOutcomes (MISSION)...');
  const hgOutcomes: Record<string, string> = {};

  const hgOutcomeDefs = [
    { label: 'Maximize Charitable Impact', type: 'DELIVER_MISSION' },
    { label: 'Grow Donation Revenue', type: 'SUSTAIN_FUNDING' },
    { label: 'Minimize Operational Overhead', type: 'STEWARD_RESOURCES' },
  ];
  for (const o of hgOutcomeDefs) {
    try {
      hgOutcomes[o.label] = await createOutcome(hg.id, o.label, o.type, 'MISSION');
      console.log(`  ${o.label} (${o.type}): ${hgOutcomes[o.label]}`);
    } catch (e: any) {
      console.log(`  ${o.label}: ${e.message}`);
    }
  }

  // Activities
  console.log('\nActivities...');
  const hgActivities: Record<string, string> = {};

  const hgActivityDefs = [
    { label: 'DAF Donation Collection', desc: 'Receiving and processing charitable donations into the DAF' },
    { label: 'DAF Distribution to Charities', desc: 'Granting DAF funds to vetted registered charities' },
    { label: 'Donation Receipt Issuance', desc: 'CRA-compliant tax receipt generation for donors' },
    { label: 'Charity Vetting & Research', desc: 'Due diligence on recipient charities (CI legacy role)' },
    { label: 'Donor Communications', desc: 'Impact reporting, acknowledgments, and donor engagement' },
    { label: 'Platform Service — DAF Operations', desc: 'Consumption of Harness Exchange platform services for DAF operations' },
    { label: 'Regulatory Compliance (CRA)', desc: 'Charity registration maintenance and T3010 annual filing' },
  ];
  for (const a of hgActivityDefs) {
    try {
      hgActivities[a.label] = await createActivity(hg.id, a.label, a.desc);
      console.log(`  ${a.label}: ${hgActivities[a.label]}`);
    } catch (e: any) {
      console.log(`  ${a.label}: ${e.message}`);
    }
  }

  // Metrics
  console.log('\nMetrics...');
  const hgMetrics: Record<string, string> = {};

  const hgMetricDefs = [
    { label: 'Active Donors', type: 'OBSERVED', unit: 'donors' },
    { label: 'Donation Volume', type: 'OBSERVED', unit: 'CAD' },
    { label: 'Charities Supported', type: 'OBSERVED', unit: 'charities' },
    { label: 'Donor Retention Rate', type: 'OBSERVED', unit: 'percent' },
  ];
  for (const m of hgMetricDefs) {
    try {
      hgMetrics[m.label] = await createMetric(hg.id, m.label, m.type, m.unit);
      console.log(`  ${m.label}: ${hgMetrics[m.label]}`);
    } catch (e: any) {
      console.log(`  ${m.label}: ${e.message}`);
    }
  }

  // Resources
  console.log('\nResources...');
  try {
    const dafPool = await createResource(hg.id, 'DAF Fund Pool', 'CASH');
    console.log(`  DAF Fund Pool: ${dafPool}`);
  } catch (e: any) { console.log(`  DAF Fund Pool: ${e.message}`); }

  try {
    const opsBudget = await createResource(hg.id, 'HG Operations Budget', 'CASH');
    console.log(`  HG Operations Budget: ${opsBudget}`);
  } catch (e: any) { console.log(`  HG Operations Budget: ${e.message}`); }

  // Funds
  console.log('\nFunds...');
  try {
    const genOps = await createFund(hg.id, 'General Operations', 'UNRESTRICTED', 'Operating revenue for Harness Good');
    console.log(`  General Operations: ${genOps}`);
  } catch (e: any) { console.log(`  General Operations: ${e.message}`); }

  try {
    const dafFund = await createFund(hg.id, 'Donor Advised Fund Pool', 'TEMPORARILY_RESTRICTED', 'Pooled donor-advised funds awaiting distribution');
    console.log(`  Donor Advised Fund Pool: ${dafFund}`);
  } catch (e: any) { console.log(`  Donor Advised Fund Pool: ${e.message}`); }

  // CONTRIBUTES_TO edges
  console.log('\nEdges...');

  const hgEdges: [string, string, number, string][] = [
    ['DAF Donation Collection', 'Grow Donation Revenue', 0.9, 'Activity→Outcome'],
    ['DAF Distribution to Charities', 'Maximize Charitable Impact', 0.95, 'Activity→Outcome'],
    ['Donation Receipt Issuance', 'Grow Donation Revenue', 0.7, 'Activity→Outcome'],
    ['Charity Vetting & Research', 'Maximize Charitable Impact', 0.8, 'Activity→Outcome'],
    ['Donor Communications', 'Grow Donation Revenue', 0.6, 'Activity→Outcome'],
    ['Platform Service — DAF Operations', 'Minimize Operational Overhead', 0.7, 'Activity→Outcome'],
    ['Regulatory Compliance (CRA)', 'Minimize Operational Overhead', 0.6, 'Activity→Outcome'],
  ];

  for (const [src, tgt, weight, desc] of hgEdges) {
    const srcId = hgActivities[src];
    const tgtId = hgOutcomes[tgt];
    if (!srcId || !tgtId) { console.log(`  SKIP ${src} → ${tgt} (missing ID)`); continue; }
    try {
      await createEdge(srcId, tgtId, weight);
      console.log(`  ${src} → ${tgt} (${weight})`);
    } catch (e: any) { console.log(`  ${src} → ${tgt}: ${e.message}`); }
  }

  // Metric → Outcome edges
  const hgMetricEdges: [string, string, number][] = [
    ['Active Donors', 'Grow Donation Revenue', 0.8],
    ['Donation Volume', 'Maximize Charitable Impact', 0.9],
    ['Charities Supported', 'Maximize Charitable Impact', 0.7],
    ['Donor Retention Rate', 'Grow Donation Revenue', 0.75],
  ];

  for (const [src, tgt, weight] of hgMetricEdges) {
    const srcId = hgMetrics[src];
    const tgtId = hgOutcomes[tgt];
    if (!srcId || !tgtId) { console.log(`  SKIP ${src} → ${tgt} (missing ID)`); continue; }
    try {
      await createEdge(srcId, tgtId, weight);
      console.log(`  ${src} → ${tgt} (${weight})`);
    } catch (e: any) { console.log(`  ${src} → ${tgt}: ${e.message}`); }
  }

  // ── Step 4: Harness Exchange US Subgraph ────────────────────
  console.log('\n=== Building Harness Exchange US Subgraph ===');

  // Outcomes
  console.log('\nOutcomes (FINANCIAL)...');
  const hxUsOutcomes: Record<string, string> = {};

  const hxUsOutcomeDefs = [
    { label: 'US Platform Revenue', type: 'IMPROVE_REVENUE' },
    { label: 'US Market Expansion', type: 'NEW_REVENUE' },
    { label: 'US Operational Efficiency', type: 'MITIGATE_EXPENSE' },
  ];
  for (const o of hxUsOutcomeDefs) {
    try {
      hxUsOutcomes[o.label] = await createOutcome(usFp.id, o.label, o.type, 'FINANCIAL');
      console.log(`  ${o.label} (${o.type}): ${hxUsOutcomes[o.label]}`);
    } catch (e: any) {
      console.log(`  ${o.label}: ${e.message}`);
    }
  }

  // Activities
  console.log('\nActivities...');
  const hxUsActivities: Record<string, string> = {};

  const hxUsActivityDefs = [
    { label: 'US Platform Operations', desc: 'Operating the Harness Platform for US market' },
    { label: 'US Customer Acquisition', desc: 'Acquiring US donors and charity partners' },
    { label: 'Platform Service — US License', desc: 'Licensing Harness Platform from Harness Exchange (intercompany)' },
    { label: 'US Regulatory Compliance (IRS/SEC)', desc: 'US federal and state regulatory compliance' },
  ];
  for (const a of hxUsActivityDefs) {
    try {
      hxUsActivities[a.label] = await createActivity(usFp.id, a.label, a.desc);
      console.log(`  ${a.label}: ${hxUsActivities[a.label]}`);
    } catch (e: any) {
      console.log(`  ${a.label}: ${e.message}`);
    }
  }

  // Metrics
  console.log('\nMetrics...');
  const hxUsMetrics: Record<string, string> = {};

  const hxUsMetricDefs = [
    { label: 'US Platform Users', type: 'OBSERVED', unit: 'users' },
    { label: 'US Transaction Volume', type: 'OBSERVED', unit: 'USD' },
    { label: 'US Revenue per User', type: 'OBSERVED', unit: 'USD' },
  ];
  for (const m of hxUsMetricDefs) {
    try {
      hxUsMetrics[m.label] = await createMetric(usFp.id, m.label, m.type, m.unit);
      console.log(`  ${m.label}: ${hxUsMetrics[m.label]}`);
    } catch (e: any) {
      console.log(`  ${m.label}: ${e.message}`);
    }
  }

  // Edges
  console.log('\nEdges...');

  const hxUsEdges: [string, string, number][] = [
    ['US Platform Operations', 'US Platform Revenue', 0.9],
    ['US Customer Acquisition', 'US Platform Revenue', 0.8],
    ['Platform Service — US License', 'US Operational Efficiency', 0.7],
    ['US Regulatory Compliance (IRS/SEC)', 'US Operational Efficiency', 0.6],
  ];
  for (const [src, tgt, weight] of hxUsEdges) {
    const srcId = hxUsActivities[src];
    const tgtId = hxUsOutcomes[tgt];
    if (!srcId || !tgtId) { console.log(`  SKIP ${src} → ${tgt}`); continue; }
    try {
      await createEdge(srcId, tgtId, weight);
      console.log(`  ${src} → ${tgt} (${weight})`);
    } catch (e: any) { console.log(`  ${src} → ${tgt}: ${e.message}`); }
  }

  // Metric → Outcome edges
  const hxUsMetricEdges: [string, string, number][] = [
    ['US Platform Users', 'US Platform Revenue', 0.7],
    ['US Transaction Volume', 'US Platform Revenue', 0.9],
    ['US Revenue per User', 'US Platform Revenue', 0.6],
  ];
  for (const [src, tgt, weight] of hxUsMetricEdges) {
    const srcId = hxUsMetrics[src];
    const tgtId = hxUsOutcomes[tgt];
    if (!srcId || !tgtId) continue;
    try {
      await createEdge(srcId, tgtId, weight);
      console.log(`  ${src} → ${tgt} (${weight})`);
    } catch (e: any) { console.log(`  ${src} → ${tgt}: ${e.message}`); }
  }

  // ── Step 5: Harness Good US Subgraph ────────────────────────
  console.log('\n=== Building Harness Good US Subgraph ===');

  // Outcomes
  console.log('\nOutcomes (MISSION)...');
  const hgUsOutcomes: Record<string, string> = {};

  const hgUsOutcomeDefs = [
    { label: 'US Charitable Impact', type: 'DELIVER_MISSION' },
    { label: 'US Donation Growth', type: 'SUSTAIN_FUNDING' },
    { label: 'US Fund Stewardship', type: 'STEWARD_RESOURCES' },
  ];
  for (const o of hgUsOutcomeDefs) {
    try {
      hgUsOutcomes[o.label] = await createOutcome(usNfp.id, o.label, o.type, 'MISSION');
      console.log(`  ${o.label} (${o.type}): ${hgUsOutcomes[o.label]}`);
    } catch (e: any) {
      console.log(`  ${o.label}: ${e.message}`);
    }
  }

  // Activities
  console.log('\nActivities...');
  const hgUsActivities: Record<string, string> = {};

  const hgUsActivityDefs = [
    { label: 'US DAF Donation Collection', desc: 'Receiving US charitable donations into the DAF' },
    { label: 'US DAF Distribution', desc: 'Granting DAF funds to vetted US 501(c)(3) charities' },
    { label: 'US Donation Receipt Issuance', desc: 'IRS-compliant 501(c)(3) tax receipt generation' },
    { label: 'Platform Service — US DAF', desc: 'Consumption of Harness Exchange platform services for US DAF operations' },
    { label: 'US Regulatory Compliance (IRS 990)', desc: 'IRS Form 990 filing and 501(c)(3) status maintenance' },
  ];
  for (const a of hgUsActivityDefs) {
    try {
      hgUsActivities[a.label] = await createActivity(usNfp.id, a.label, a.desc);
      console.log(`  ${a.label}: ${hgUsActivities[a.label]}`);
    } catch (e: any) {
      console.log(`  ${a.label}: ${e.message}`);
    }
  }

  // Funds
  console.log('\nFunds...');
  try {
    const usGenOps = await createFund(usNfp.id, 'US General Operations', 'UNRESTRICTED', 'Operating revenue for Harness Good US');
    console.log(`  US General Operations: ${usGenOps}`);
  } catch (e: any) { console.log(`  US General Operations: ${e.message}`); }

  try {
    const usDaf = await createFund(usNfp.id, 'US DAF Pool', 'TEMPORARILY_RESTRICTED', 'Pooled US donor-advised funds awaiting distribution');
    console.log(`  US DAF Pool: ${usDaf}`);
  } catch (e: any) { console.log(`  US DAF Pool: ${e.message}`); }

  // Edges
  console.log('\nEdges...');

  const hgUsEdges: [string, string, number][] = [
    ['US DAF Donation Collection', 'US Donation Growth', 0.9],
    ['US DAF Distribution', 'US Charitable Impact', 0.95],
    ['US Donation Receipt Issuance', 'US Donation Growth', 0.7],
    ['Platform Service — US DAF', 'US Fund Stewardship', 0.7],
    ['US Regulatory Compliance (IRS 990)', 'US Fund Stewardship', 0.6],
  ];
  for (const [src, tgt, weight] of hgUsEdges) {
    const srcId = hgUsActivities[src];
    const tgtId = hgUsOutcomes[tgt];
    if (!srcId || !tgtId) { console.log(`  SKIP ${src} → ${tgt}`); continue; }
    try {
      await createEdge(srcId, tgtId, weight);
      console.log(`  ${src} → ${tgt} (${weight})`);
    } catch (e: any) { console.log(`  ${src} → ${tgt}: ${e.message}`); }
  }

  // ── Summary ─────────────────────────────────────────────────
  console.log('\n=== Verifying Final State ===\n');

  for (const ent of [
    { id: hx.id, label: 'Harness Exchange' },
    { id: hg.id, label: 'Harness Good' },
    { id: usFp.id, label: 'Harness Exchange US' },
    { id: usNfp.id, label: 'Harness Good US' },
  ]) {
    const outcomes = await api<{ items: any[] }>(`/graph/outcomes/by-entity/${ent.id}`);
    const activities = await api<{ items: any[] }>(`/graph/activities/by-entity/${ent.id}`);
    const metrics = await api<{ items: any[] }>(`/graph/metrics/by-entity/${ent.id}`);
    console.log(`${ent.label}: ${outcomes.items.length} outcomes, ${activities.items.length} activities, ${metrics.items.length} metrics`);
  }

  console.log('\n=== Done! Open http://localhost:5173/graph to explore ===');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
