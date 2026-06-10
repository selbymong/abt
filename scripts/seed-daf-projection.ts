export {};

/**
 * DAF (Donor-Advised Fund) — 5-Year Revenue & Cost Projection
 *
 * Models a DAF product offered by Harness Good (CA NFP). Revenue comes from
 * administrative fees (0.60%) and investment management spread (0.15%) on
 * assets under management (AUM). AUM grows from new contributions, additional
 * contributions from existing accounts, and investment returns, reduced by
 * grants disbursed.
 *
 * Two scenarios:
 *   - "DAF — Organic": Growth from Give donor cross-sell, minimal marketing
 *   - "DAF — Active Growth": Dedicated HNW marketing + financial advisor
 *     partnerships + Give cross-sell
 *
 * This script creates:
 *   1. New graph nodes (Product, Activities, Metrics) under Harness Good
 *   2. CONTRIBUTES_TO edges to existing HG outcomes
 *   3. Accounting periods for HG (FY2027–FY2031)
 *   4. Budget lines for revenue and costs per year per scenario
 *
 * Run: npx tsx scripts/seed-daf-projection.ts
 */

const BASE = 'http://localhost:4000/api';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let apiCallCount = 0;
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  apiCallCount++;
  if (apiCallCount % 50 === 0) await sleep(1000);
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (res.status === 429) { await sleep(5000 + attempt * 3000); continue; }
    if (!res.ok) { throw new Error(`${res.status} ${path}: ${await res.text()}`); }
    return res.json() as Promise<T>;
  }
  throw new Error(`429 rate limit exceeded: ${path}`);
}

// ══════════════════════════════════════════════════════════════════════
// AUM MODEL
// ══════════════════════════════════════════════════════════════════════
//
// Each year:
//   new_contributions = new_accounts × avg_initial_contribution
//   additional_contributions = prior_total_accounts × additional_rate × avg_additional
//   total_inflows = new_contributions + additional_contributions
//   investment_returns = (beg_AUM + total_inflows / 2) × return_rate
//   grants_out = beg_AUM × payout_rate
//   end_AUM = beg_AUM + total_inflows + investment_returns - grants_out
//   avg_AUM = (beg_AUM + end_AUM) / 2
//
// Revenue:
//   admin_fee = avg_AUM × 0.0060
//   inv_spread = avg_AUM × 0.0015
//
// Fee structure to donor accounts:
//   Admin fee: 0.60% of AUM → revenue to Harness Good
//   Investment management fee: 0.40% total, of which:
//     - 0.25% → investment manager (deducted from account, never touches HG books)
//     - 0.15% → HG (investment spread revenue)
//   Total cost to donor: 1.00% of AUM
//   Total HG revenue: 0.75% of AUM

const ADMIN_FEE_RATE = 0.0060;
const INV_SPREAD_RATE = 0.0015;
const INVESTMENT_RETURN = 0.06;  // 6% balanced portfolio (after investment manager's 0.25%)

interface YearAssumptions {
  newAccounts: number;
  avgInitialContribution: number;
  additionalRate: number;       // % of prior accounts that add more
  avgAdditional: number;        // $ added per additional contributor
  payoutRate: number;           // % of beginning AUM granted out
}

interface AumYear {
  year: number;
  label: string;
  newAccounts: number;
  totalAccounts: number;
  newContributions: number;
  additionalContributions: number;
  begAum: number;
  investmentReturns: number;
  grantsOut: number;
  endAum: number;
  avgAum: number;
  adminFee: number;
  invSpread: number;
  totalRevenue: number;
}

function computeAumModel(assumptions: YearAssumptions[]): AumYear[] {
  const years: AumYear[] = [];
  let totalAccounts = 0;
  let begAum = 0;

  for (let i = 0; i < assumptions.length; i++) {
    const a = assumptions[i];
    const priorAccounts = totalAccounts;
    totalAccounts += a.newAccounts;

    const newContributions = a.newAccounts * a.avgInitialContribution;
    const additionalContributions = Math.round(priorAccounts * a.additionalRate * a.avgAdditional);
    const totalInflows = newContributions + additionalContributions;

    const investmentReturns = Math.round((begAum + totalInflows / 2) * INVESTMENT_RETURN);
    const grantsOut = Math.round(begAum * a.payoutRate);
    const endAum = begAum + totalInflows + investmentReturns - grantsOut;
    const avgAum = Math.round((begAum + endAum) / 2);

    const adminFee = Math.round(avgAum * ADMIN_FEE_RATE);
    const invSpread = Math.round(avgAum * INV_SPREAD_RATE);

    years.push({
      year: i + 1,
      label: `FY${2027 + i}`,
      newAccounts: a.newAccounts,
      totalAccounts,
      newContributions,
      additionalContributions,
      begAum,
      investmentReturns,
      grantsOut,
      endAum,
      avgAum,
      adminFee,
      invSpread,
      totalRevenue: adminFee + invSpread,
    });

    begAum = endAum;
  }

  return years;
}

// ── Scenario A: Organic (Give Cross-sell) ────────────────────────────
//
// DAF grows primarily from Give donor base. Low marketing spend.
// Avg initial contribution is modest — Give donors exploring DAF concept.
// Payout rate starts at 0% (Year 1: new accounts, haven't granted yet),
// ramps to 12% at maturity.

const ORGANIC_ASSUMPTIONS: YearAssumptions[] = [
  { newAccounts: 30,  avgInitialContribution: 18_000, additionalRate: 0,    avgAdditional: 0,      payoutRate: 0 },
  { newAccounts: 80,  avgInitialContribution: 25_000, additionalRate: 0.20, avgAdditional: 10_000, payoutRate: 0.10 },
  { newAccounts: 200, avgInitialContribution: 35_000, additionalRate: 0.20, avgAdditional: 12_000, payoutRate: 0.12 },
  { newAccounts: 400, avgInitialContribution: 45_000, additionalRate: 0.22, avgAdditional: 15_000, payoutRate: 0.12 },
  { newAccounts: 700, avgInitialContribution: 55_000, additionalRate: 0.25, avgAdditional: 18_000, payoutRate: 0.12 },
];

// ── Scenario B: Active Growth (HNW marketing + advisor partnerships) ──
//
// Dedicated marketing to high-net-worth individuals. Financial advisor
// partnerships drive larger accounts. Faster AUM accumulation, but higher
// marketing/compliance costs.

const ACTIVE_GROWTH_ASSUMPTIONS: YearAssumptions[] = [
  { newAccounts: 80,    avgInitialContribution: 30_000, additionalRate: 0,    avgAdditional: 0,      payoutRate: 0 },
  { newAccounts: 270,   avgInitialContribution: 45_000, additionalRate: 0.20, avgAdditional: 15_000, payoutRate: 0.10 },
  { newAccounts: 650,   avgInitialContribution: 60_000, additionalRate: 0.22, avgAdditional: 20_000, payoutRate: 0.12 },
  { newAccounts: 1_500, avgInitialContribution: 75_000, additionalRate: 0.25, avgAdditional: 25_000, payoutRate: 0.12 },
  { newAccounts: 2_500, avgInitialContribution: 90_000, additionalRate: 0.25, avgAdditional: 30_000, payoutRate: 0.12 },
];

// ── DAF-Specific Costs ──────────────────────────────────────────────
// These are INCREMENTAL costs for DAF operations on top of existing
// Harness Good organizational costs (T3010, bookkeeping, audit, etc.)

interface DafCosts {
  complianceStaff: number;     // DAF compliance officer (part-time → full-time)
  investmentCommittee: number; // Board-level investment oversight
  technology: number;          // Portfolio dashboard, grant recommendation engine
  fidelityBond: number;        // Fidelity bond + E&O insurance for fund management
  investmentCounsel: number;   // Legal counsel for investment program
  marketing: number;           // DAF-specific acquisition
}

const ORGANIC_COSTS: DafCosts[] = [
  { complianceStaff: 15_000, investmentCommittee: 0,     technology: 10_000, fidelityBond: 2_000,  investmentCounsel: 3_000,  marketing: 2_000 },
  { complianceStaff: 20_000, investmentCommittee: 0,     technology: 15_000, fidelityBond: 3_000,  investmentCounsel: 5_000,  marketing: 5_000 },
  { complianceStaff: 35_000, investmentCommittee: 5_000, technology: 20_000, fidelityBond: 5_000,  investmentCounsel: 8_000,  marketing: 8_000 },
  { complianceStaff: 55_000, investmentCommittee: 10_000, technology: 30_000, fidelityBond: 8_000, investmentCounsel: 12_000, marketing: 12_000 },
  { complianceStaff: 80_000, investmentCommittee: 15_000, technology: 40_000, fidelityBond: 12_000, investmentCounsel: 18_000, marketing: 18_000 },
];

const ACTIVE_COSTS: DafCosts[] = [
  { complianceStaff: 25_000, investmentCommittee: 0,      technology: 15_000, fidelityBond: 3_000,  investmentCounsel: 5_000,  marketing: 25_000 },
  { complianceStaff: 40_000, investmentCommittee: 5_000,  technology: 25_000, fidelityBond: 5_000,  investmentCounsel: 10_000, marketing: 60_000 },
  { complianceStaff: 70_000, investmentCommittee: 10_000, technology: 40_000, fidelityBond: 10_000, investmentCounsel: 15_000, marketing: 120_000 },
  { complianceStaff: 120_000, investmentCommittee: 15_000, technology: 60_000, fidelityBond: 18_000, investmentCounsel: 25_000, marketing: 200_000 },
  { complianceStaff: 180_000, investmentCommittee: 20_000, technology: 80_000, fidelityBond: 30_000, investmentCounsel: 35_000, marketing: 300_000 },
];

const COST_LABELS: Record<keyof DafCosts, string> = {
  complianceStaff: 'DAF Compliance Staff',
  investmentCommittee: 'Investment Committee',
  technology: 'DAF Technology Platform',
  fidelityBond: 'Fidelity Bond & E&O Insurance',
  investmentCounsel: 'Investment Legal Counsel',
  marketing: 'DAF Marketing & Acquisition',
};

function totalCosts(c: DafCosts): number {
  return c.complianceStaff + c.investmentCommittee + c.technology +
    c.fidelityBond + c.investmentCounsel + c.marketing;
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Seeding DAF 5-Year Projections (Harness Good) ===\n');

  // 1. Look up Harness Good entity
  const entities = await api<{ entities: any[] }>('/graph/entities');
  const hg = entities.entities.find((e: any) => e.label === 'Harness Good');
  if (!hg) throw new Error('Harness Good entity not found — run seed-intercompany-graph.ts first');
  const entityId = hg.id;
  const currency = hg.functional_currency || 'CAD';
  console.log(`Entity: ${hg.label} (${entityId}), currency: ${currency}`);

  // 2. Look up existing graph nodes
  const activities = await api<{ items: any[] }>(`/graph/activities/by-entity/${entityId}`);
  const activityByLabel = new Map(activities.items.map((a: any) => [a.label, a.id]));

  const metrics = await api<{ items: any[] }>(`/graph/metrics/by-entity/${entityId}`);
  const metricByLabel = new Map(metrics.items.map((m: any) => [m.label, m.id]));

  const outcomes = await api<{ items: any[] }>(`/graph/outcomes/by-entity/${entityId}`);
  const outcomeByLabel = new Map(outcomes.items.map((o: any) => [o.label, o.id]));

  console.log(`  ${activityByLabel.size} activities, ${metricByLabel.size} metrics, ${outcomeByLabel.size} outcomes`);

  // 3. Create DAF Product node
  console.log('\nCreating DAF product node...');
  let dafProductId = '';
  try {
    const result = await api<any>('/graph/products', {
      method: 'POST',
      body: JSON.stringify({
        entityId,
        label: 'DAF',
        description: 'Donor-Advised Fund — tax-advantaged charitable giving vehicle with pooled investment management',
        status: 'PLANNED',
        budget: 0,
        timeHorizonMonths: 60,
      }),
    });
    dafProductId = result.id;
    console.log(`  Product "DAF": ${dafProductId}`);
  } catch (e: any) {
    console.log(`  DAF product: ${e.message}`);
  }

  // 4. Create DAF-specific Activity nodes (for revenue and cost lines)
  console.log('\nCreating DAF activity nodes...');
  const dafActivities: Record<string, string> = {};

  const activityDefs = [
    { key: 'adminFeeRevenue', label: 'DAF Admin Fee Revenue', desc: 'Annual administrative fee (0.60% of AUM) charged to DAF accounts' },
    { key: 'invSpreadRevenue', label: 'DAF Investment Spread', desc: 'Net investment management spread (0.15% of AUM) after custodian/manager fees' },
    { key: 'complianceStaff', label: 'DAF Compliance Staff', desc: 'Part-time → full-time DAF compliance officer' },
    { key: 'investmentCommittee', label: 'Investment Committee', desc: 'Board-level investment policy oversight and quarterly reviews' },
    { key: 'technology', label: 'DAF Technology Platform', desc: 'Portfolio dashboard, grant recommendation engine, account management' },
    { key: 'fidelityBond', label: 'Fidelity Bond & E&O Insurance', desc: 'Fidelity bond and errors & omissions insurance for fund management' },
    { key: 'investmentCounsel', label: 'Investment Legal Counsel', desc: 'Securities counsel for investment program and fund governance' },
    { key: 'marketing', label: 'DAF Marketing & Acquisition', desc: 'DAF-specific donor acquisition (cross-sell from Give, HNW targeting, advisor partnerships)' },
  ];

  for (const a of activityDefs) {
    // Check if already exists
    if (activityByLabel.has(a.label)) {
      dafActivities[a.key] = activityByLabel.get(a.label)!;
      console.log(`  ${a.label}: ${dafActivities[a.key]} (existing)`);
      continue;
    }
    try {
      const result = await api<any>('/graph/activities', {
        method: 'POST',
        body: JSON.stringify({ entityId, label: a.label, description: a.desc, status: 'PLANNED' }),
      });
      dafActivities[a.key] = result.id;
      console.log(`  ${a.label}: ${result.id}`);
    } catch (e: any) {
      console.log(`  ${a.label}: ${e.message}`);
    }
  }

  // 5. Create DAF-specific Metric nodes
  console.log('\nCreating DAF metric nodes...');
  const dafMetrics: Record<string, string> = {};

  const metricDefs = [
    { key: 'accounts', label: 'DAF Accounts', unit: 'accounts', target: 5_000 },
    { key: 'aum', label: 'Assets Under Management', unit: 'CAD', target: 400_000_000 },
    { key: 'grantsDisbursed', label: 'DAF Grants Disbursed', unit: 'CAD', target: 50_000_000 },
  ];

  for (const m of metricDefs) {
    if (metricByLabel.has(m.label)) {
      dafMetrics[m.key] = metricByLabel.get(m.label)!;
      console.log(`  ${m.label}: ${dafMetrics[m.key]} (existing)`);
      continue;
    }
    try {
      const result = await api<any>('/graph/metrics', {
        method: 'POST',
        body: JSON.stringify({
          entityId, label: m.label, metricType: 'OBSERVED',
          unit: m.unit, currentValue: 0, targetValue: m.target,
        }),
      });
      dafMetrics[m.key] = result.id;
      console.log(`  ${m.label}: ${result.id}`);
    } catch (e: any) {
      console.log(`  ${m.label}: ${e.message}`);
    }
  }

  // 6. Wire CONTRIBUTES_TO edges
  console.log('\nWiring CONTRIBUTES_TO edges...');

  const sustainFunding = outcomeByLabel.get('Grow Donation Revenue') || '';
  const deliverMission = outcomeByLabel.get('Maximize Charitable Impact') || '';
  const stewardResources = outcomeByLabel.get('Minimize Operational Overhead') || '';

  const edges: [string, string, number, string][] = [
    // DAF Product → Outcomes
    [dafProductId, sustainFunding, 0.85, 'DAF → Grow Donation Revenue'],
    [dafProductId, deliverMission, 0.70, 'DAF → Maximize Charitable Impact'],
    // Revenue activities → Outcomes
    [dafActivities.adminFeeRevenue || '', sustainFunding, 0.90, 'Admin Fee → Sustain Funding'],
    [dafActivities.invSpreadRevenue || '', sustainFunding, 0.80, 'Inv Spread → Sustain Funding'],
    // Cost activities → Steward Resources
    [dafActivities.complianceStaff || '', stewardResources, 0.70, 'Compliance → Steward Resources'],
    [dafActivities.technology || '', stewardResources, 0.60, 'Technology → Steward Resources'],
    // Metrics → Outcomes
    [dafMetrics.aum || '', sustainFunding, 0.90, 'AUM → Sustain Funding'],
    [dafMetrics.grantsDisbursed || '', deliverMission, 0.95, 'Grants → Deliver Mission'],
    [dafMetrics.accounts || '', sustainFunding, 0.75, 'Accounts → Sustain Funding'],
    // DAF Product → existing DAF activities
    [dafProductId, activityByLabel.get('DAF Donation Collection') || '', 0.90, 'DAF → Donation Collection'],
    [dafProductId, activityByLabel.get('DAF Distribution to Charities') || '', 0.85, 'DAF → Distribution'],
  ];

  for (const [srcId, tgtId, weight, desc] of edges) {
    if (!srcId || !tgtId) { console.log(`  SKIP ${desc} (missing ID)`); continue; }
    try {
      await api<any>('/graph/edges/contributes-to', {
        method: 'POST',
        body: JSON.stringify({ sourceId: srcId, targetId: tgtId, weight, confidence: 0.8, contributionFunction: 'LINEAR' }),
      });
      console.log(`  ${desc} (${weight})`);
    } catch (e: any) { console.log(`  ${desc}: ${e.message}`); }
  }

  // 7. Create or look up accounting periods for Harness Good (FY2027–FY2031)
  console.log('\nSetting up accounting periods...');
  const existingPeriods = await api<{ items: any[] }>(`/graph/periods/by-entity/${entityId}`);
  const periodIds: string[] = [];

  for (let yr = 1; yr <= 5; yr++) {
    const fyYear = 2026 + yr;
    const existing = existingPeriods.items.find((p: any) => p.label === `FY${fyYear}`);
    if (existing) {
      periodIds.push(existing.id);
      console.log(`  FY${fyYear}: ${existing.id} (existing)`);
    } else {
      try {
        const period = await api<any>('/graph/periods', {
          method: 'POST',
          body: JSON.stringify({
            entityId, label: `FY${fyYear}`,
            startDate: `${fyYear - 1}-04-01`, endDate: `${fyYear}-03-31`,
          }),
        });
        periodIds.push(period.id);
        console.log(`  FY${fyYear}: ${period.id}`);
      } catch (e: any) {
        console.log(`  FY${fyYear}: ${e.message}`);
        periodIds.push('');
      }
    }
  }

  // 8. Compute AUM models
  const organicModel = computeAumModel(ORGANIC_ASSUMPTIONS);
  const activeModel = computeAumModel(ACTIVE_GROWTH_ASSUMPTIONS);

  // 9. Seed budgets
  async function seedScenario(
    tag: string,
    model: AumYear[],
    costs: DafCosts[],
  ) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ${tag}`);
    console.log(`${'═'.repeat(60)}`);

    for (let i = 0; i < 5; i++) {
      const yr = model[i];
      const cost = costs[i];
      const periodId = periodIds[i];
      if (!periodId) continue;
      const fyYear = 2027 + i;

      // --- Revenue budget ---
      const revBudget = await api<any>('/budgeting/budgets', {
        method: 'POST',
        body: JSON.stringify({
          entityId, periodId, name: `${yr.label} — ${tag} Revenue`,
          description: `DAF ${tag}: projected revenue from AUM fees`,
          budgetType: 'ANNUAL', fiscalYear: fyYear, currency, createdBy: 'seed-daf-projection',
          scenario: `${tag}`,
        }),
      });
      console.log(`\n  ${yr.label} Revenue: ${revBudget.id}`);

      // Admin fee revenue
      await api<any>('/budgeting/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId: revBudget.id, periodId,
          nodeRefId: dafActivities.adminFeeRevenue || periodId,
          nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE', amount: yr.adminFee,
          notes: `Admin fee: avg AUM $${(yr.avgAum / 1000).toFixed(0)}K × 0.60% = $${yr.adminFee.toLocaleString()} (${yr.totalAccounts} accounts, end AUM $${(yr.endAum / 1_000_000).toFixed(1)}M)`,
        }),
      });
      console.log(`    Admin Fee: $${yr.adminFee.toLocaleString()} (avg AUM $${(yr.avgAum / 1_000_000).toFixed(2)}M)`);

      // Investment spread revenue
      await api<any>('/budgeting/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId: revBudget.id, periodId,
          nodeRefId: dafActivities.invSpreadRevenue || periodId,
          nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE', amount: yr.invSpread,
          notes: `Investment spread: avg AUM $${(yr.avgAum / 1000).toFixed(0)}K × 0.15% = $${yr.invSpread.toLocaleString()}`,
        }),
      });
      console.log(`    Inv Spread: $${yr.invSpread.toLocaleString()}`);

      // --- Cost budget ---
      const costBudget = await api<any>('/budgeting/budgets', {
        method: 'POST',
        body: JSON.stringify({
          entityId, periodId, name: `${yr.label} — ${tag} Operations`,
          description: `DAF ${tag}: incremental operating costs`,
          budgetType: 'ANNUAL', fiscalYear: fyYear, currency, createdBy: 'seed-daf-projection',
          scenario: `${tag}`,
        }),
      });
      console.log(`  ${yr.label} Operations: ${costBudget.id}`);

      for (const [key, label] of Object.entries(COST_LABELS)) {
        const amount = cost[key as keyof DafCosts];
        if (amount === 0) continue;
        await api<any>('/budgeting/lines', {
          method: 'POST',
          body: JSON.stringify({
            budgetId: costBudget.id, periodId,
            nodeRefId: dafActivities[key] || periodId,
            nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE', amount,
            notes: `DAF Operations > ${label}: $${amount.toLocaleString()}/yr`,
          }),
        });
        console.log(`    ${label}: $${amount.toLocaleString()}`);
      }
    }
  }

  await seedScenario('DAF — Organic', organicModel, ORGANIC_COSTS);
  await seedScenario('DAF — Active Growth', activeModel, ACTIVE_COSTS);

  // 10. Attach ScenarioSets
  console.log('\n── Attaching ScenarioSets ──\n');
  if (dafProductId) {
    try {
      await api<any>('/ai/scenario-sets', {
        method: 'POST',
        body: JSON.stringify({
          nodeId: dafProductId,
          label: 'DAF Growth Strategy',
          baseValue: 1_410,
          scenarios: [
            { label: 'Organic (Give cross-sell)', probability: 0.45, impactMultiplier: 1.0, description: 'DAF grows from Give donors. 1,410 accounts, $70M AUM by Year 5.' },
            { label: 'Active Growth (HNW + advisors)', probability: 0.55, impactMultiplier: 3.5, description: 'Dedicated marketing + advisor partnerships. 5,000 accounts, $415M AUM by Year 5.' },
          ],
        }),
      });
      console.log('  ScenarioSet on DAF Product');
    } catch (e: any) { console.log(`  ScenarioSet: ${e.message}`); }
  }

  // 11. Print P&L summaries
  const p = (n: number, w: number) => (n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`).padStart(w);

  function printPnL(label: string, model: AumYear[], costs: DafCosts[]) {
    console.log(`\n=== ${label.toUpperCase()} ===\n`);
    console.log('Year  | Accounts  | End AUM         | Avg AUM         | Revenue      | Costs        | Net          | Margin');
    console.log('------|-----------|-----------------|-----------------|--------------|--------------|--------------|-------');
    let gR = 0, gE = 0;
    for (let i = 0; i < 5; i++) {
      const yr = model[i];
      const exp = totalCosts(costs[i]);
      const net = yr.totalRevenue - exp;
      gR += yr.totalRevenue;
      gE += exp;
      console.log(
        `  ${yr.year}   | ${String(yr.totalAccounts).padStart(7)}   | $${(yr.endAum / 1_000_000).toFixed(1).padStart(8)}M      | $${(yr.avgAum / 1_000_000).toFixed(2).padStart(8)}M      | ${p(yr.totalRevenue, 12)} | ${p(exp, 12)} | ${p(net, 12)} | ${yr.totalRevenue > 0 ? ((net / yr.totalRevenue) * 100).toFixed(1) : 'N/A'}%`,
      );
    }
    console.log(
      `      |           |                 |                 | $${gR.toLocaleString().padStart(11)} | $${gE.toLocaleString().padStart(11)} | $${(gR - gE).toLocaleString().padStart(11)} | 5-yr`,
    );
  }

  printPnL('DAF — Organic', organicModel, ORGANIC_COSTS);
  printPnL('DAF — Active Growth', activeModel, ACTIVE_COSTS);

  // Cross-scenario comparison
  const orgNet = organicModel.reduce((s, yr, i) => s + yr.totalRevenue - totalCosts(ORGANIC_COSTS[i]), 0);
  const actNet = activeModel.reduce((s, yr, i) => s + yr.totalRevenue - totalCosts(ACTIVE_COSTS[i]), 0);

  console.log(`\n── 5-Year Net Comparison ──`);
  console.log(`  Organic:       ${p(orgNet, 12)}   (${organicModel[4].totalAccounts.toLocaleString()} accounts, $${(organicModel[4].endAum / 1_000_000).toFixed(1)}M AUM)`);
  console.log(`  Active Growth: ${p(actNet, 12)}   (${activeModel[4].totalAccounts.toLocaleString()} accounts, $${(activeModel[4].endAum / 1_000_000).toFixed(1)}M AUM)`);
  console.log(`  Active uplift: ${p(actNet - orgNet, 12)} over Organic`);

  // AUM trajectory detail
  console.log('\n── AUM Trajectory ──\n');
  console.log('Year  | Organic Accounts | Organic AUM     | Active Accounts | Active AUM');
  console.log('------|------------------|-----------------|-----------------|----------------');
  for (let i = 0; i < 5; i++) {
    const o = organicModel[i];
    const a = activeModel[i];
    console.log(
      `  ${o.year}   | ${String(o.totalAccounts).padStart(14)}   | $${(o.endAum / 1_000_000).toFixed(1).padStart(8)}M      | ${String(a.totalAccounts).padStart(13)}   | $${(a.endAum / 1_000_000).toFixed(1).padStart(8)}M`,
    );
  }

  console.log('\n=== Done! Budget data created for Harness Good DAF ===');
  console.log('Open http://localhost:5173/projections and select Harness Good to view.\n');
}

main().catch((e) => { console.error('Fatal error:', e); process.exit(1); });
