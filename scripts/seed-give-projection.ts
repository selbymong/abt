export {};

/**
 * Give Product — 5-Year Revenue & Cost Projection (Three Scenarios)
 *
 * This script creates BUDGET data only — no graph nodes. It references the
 * existing graph nodes created by seed-harness-projection.ts (Activities,
 * Metrics, Outcomes, Resources, Product). The graph models the real business
 * structure; budgets are financial projections stored in PostgreSQL budget_lines
 * that reference those graph nodes via node_ref_id.
 *
 * Three budget sets are created with different amounts referencing the SAME nodes:
 *   - "With CI" budgets: CI provides free traffic, low marketing spend (CA only)
 *   - "Without CI" budgets: must buy all traffic, high marketing spend (CA only)
 *   - "With CI + US" budgets: CA launch with CI bootstraps US entry 4 months later
 *
 * Scenario C models: CA credibility from CI partnership → US market entry at
 * month 4. The proven Canadian platform + "Charity Intelligence" trust signal
 * accelerates US growth vs cold entry. US uses Stripe nonprofit pricing (2.2% + $0.30),
 * separate compliance costs, and heavier marketing (no CI traffic equivalent).
 *
 * ScenarioSets are attached to existing graph nodes for Monte Carlo analysis.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ASSUMPTIONS — see docs/projection-assumptions.md for full revenue/cost model
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Run: npx tsx scripts/seed-give-projection.ts
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

// ── Infrastructure Cost Tiers (same as seed-harness-projection) ──────

interface TierCosts {
  users: number;
  compute: number; database: number; redis: number; kafka: number;
  llm: number; email: number; sms: number; cdn: number;
  monitoring: number; search: number; domain: number;
}

const TIERS: Record<string, TierCosts> = {
  startup:    { users: 1_000,   compute: 35,    database: 18,   redis: 5,   kafka: 0,   llm: 10,    email: 0,   sms: 2,   cdn: 6,   monitoring: 0,   search: 0,   domain: 15 },
  growth:     { users: 10_000,  compute: 85,    database: 100,  redis: 35,  kafka: 55,  llm: 100,   email: 30,  sms: 25,  cdn: 35,  monitoring: 30,  search: 75,  domain: 15 },
  scale:      { users: 50_000,  compute: 400,   database: 375,  redis: 150, kafka: 200, llm: 475,   email: 75,  sms: 90,  cdn: 170, monitoring: 80,  search: 300, domain: 15 },
  enterprise: { users: 250_000, compute: 1_050, database: 1_400, redis: 300, kafka: 1_000, llm: 2_350, email: 300, sms: 450, cdn: 500, monitoring: 200, search: 700, domain: 15 },
};

function interpolateTier(a: TierCosts, b: TierCosts, t: number): TierCosts {
  const result: any = {};
  for (const key of Object.keys(a)) result[key] = Math.round((a as any)[key] * (1 - t) + (b as any)[key] * t);
  return result;
}

const COST_CATEGORIES = ['compute', 'database', 'redis', 'kafka', 'llm', 'email', 'sms', 'cdn', 'monitoring', 'search', 'domain'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  compute: 'Compute & Hosting', database: 'PostgreSQL + pgvector', redis: 'Redis Cache',
  kafka: 'Kafka / Event Streaming', llm: 'AI/LLM Tokens (Claude)', email: 'Email (Resend)',
  sms: 'SMS (Twilio)', cdn: 'CDN + Storage (S3/CF)', monitoring: 'Monitoring & Observability',
  search: 'Search (Elasticsearch)', domain: 'Domain + SSL',
};

const ANNUAL_FIXED_COSTS: Record<string, number[]> = {
  'PCI-DSS Compliance':   [250,    250,    500,    500,    500],
  'Penetration Testing':  [5_000, 5_000, 10_000, 10_000, 15_000],
  'SOC 2 Type II Audit':  [0,     25_000, 30_000, 35_000, 40_000],
  'Apple Developer':      [99,    99,     99,     99,     99],
};

// Group labels for budget breakdown categories
const EXPENSE_GROUPS: Record<string, string> = {
  compute: 'Infrastructure', database: 'Infrastructure', redis: 'Infrastructure',
  kafka: 'Infrastructure', llm: 'Infrastructure', email: 'Infrastructure',
  sms: 'Infrastructure', cdn: 'Infrastructure', monitoring: 'Infrastructure',
  search: 'Infrastructure', domain: 'Infrastructure',
  'PCI-DSS Compliance': 'Compliance & Security', 'Penetration Testing': 'Compliance & Security',
  'SOC 2 Type II Audit': 'Compliance & Security', 'Apple Developer': 'Compliance & Security',
};

// Organizational costs — Harness Good (CA NFP) for Give scenarios
const ORG_COSTS: Record<string, number[]> = {
  'Annual return (federal)':          [12,    12,    12,    12,    12],
  'T3010 charity return':             [1_500, 2_000, 2_500, 3_000, 3_500],
  'Bookkeeping':                      [2_400, 3_600, 6_000, 9_600, 12_000],
  'Financial audit':                  [0,     8_000, 10_000, 15_000, 20_000],
  'General liability insurance':      [500,   500,   800,   1_000, 1_500],
  'Cyber insurance':                  [1_500, 2_000, 3_000, 5_000, 8_000],
  'Legal retainer':                   [3_000, 5_000, 8_000, 10_000, 12_000],
};

// ── Marketing channel costs per scenario ─────────────────────────────
// Keys must match Activity.label in the graph (from seed-harness-projection)

// Scenario A: CI provides free traffic, light supplemental marketing
const SCENARIO_A_MARKETING: Record<string, number[]> = {
  'Organic Marketing':  [6_000,   12_000,  18_000,  24_000,  30_000],
  'Paid Media':         [1_800,   4_600,   53_000,  100_400, 148_800],
};

// Scenario B: must buy ALL traffic — heavy paid + SEO + social
const SCENARIO_B_MARKETING: Record<string, number[]> = {
  'Organic Marketing':  [42_000,  72_000,  96_000,  120_000, 138_000],
  'Paid Media':         [103_200, 164_400, 226_800, 277_200, 333_600],
};

// ── Revenue Model ────────────────────────────────────────────────────

interface RevenueAssumptions {
  users: number; activeDonorPct: number; donationsPerDonor: number;
  avgDonation: number; platformFeePct: number;
  premiumCharityPartners: number; premiumAvgAnnualFee: number;
}

const SCENARIO_A_REVENUE: RevenueAssumptions[] = [
  { users: 1_300,   activeDonorPct: 0.10, donationsPerDonor: 2.5, avgDonation: 350, platformFeePct: 0.035, premiumCharityPartners: 3,   premiumAvgAnnualFee: 600 },
  { users: 5_000,   activeDonorPct: 0.14, donationsPerDonor: 3.2, avgDonation: 390, platformFeePct: 0.035, premiumCharityPartners: 15,  premiumAvgAnnualFee: 900 },
  { users: 14_000,  activeDonorPct: 0.17, donationsPerDonor: 3.8, avgDonation: 420, platformFeePct: 0.034, premiumCharityPartners: 50,  premiumAvgAnnualFee: 1_200 },
  { users: 30_000,  activeDonorPct: 0.19, donationsPerDonor: 4.2, avgDonation: 460, platformFeePct: 0.033, premiumCharityPartners: 120, premiumAvgAnnualFee: 1_500 },
  { users: 55_000,  activeDonorPct: 0.21, donationsPerDonor: 4.8, avgDonation: 500, platformFeePct: 0.032, premiumCharityPartners: 250, premiumAvgAnnualFee: 1_800 },
];

const SCENARIO_B_REVENUE: RevenueAssumptions[] = [
  { users: 500,     activeDonorPct: 0.08, donationsPerDonor: 2.0, avgDonation: 320, platformFeePct: 0.035, premiumCharityPartners: 1,   premiumAvgAnnualFee: 600 },
  { users: 3_000,   activeDonorPct: 0.12, donationsPerDonor: 2.8, avgDonation: 370, platformFeePct: 0.035, premiumCharityPartners: 10,  premiumAvgAnnualFee: 900 },
  { users: 10_000,  activeDonorPct: 0.16, donationsPerDonor: 3.5, avgDonation: 410, platformFeePct: 0.034, premiumCharityPartners: 40,  premiumAvgAnnualFee: 1_200 },
  { users: 25_000,  activeDonorPct: 0.18, donationsPerDonor: 4.0, avgDonation: 450, platformFeePct: 0.033, premiumCharityPartners: 100, premiumAvgAnnualFee: 1_500 },
  { users: 55_000,  activeDonorPct: 0.21, donationsPerDonor: 4.8, avgDonation: 500, platformFeePct: 0.032, premiumCharityPartners: 250, premiumAvgAnnualFee: 1_800 },
];

const SCENARIO_A_TIERS: { label: string; visitors: number; registered: number; tier: TierCosts }[] = [
  { label: 'FY2027', visitors: 130_000,  registered: 1_300,   tier: TIERS.startup },
  { label: 'FY2028', visitors: 175_000,  registered: 5_000,   tier: interpolateTier(TIERS.startup, TIERS.growth, 0.44) },
  { label: 'FY2029', visitors: 210_000,  registered: 14_000,  tier: interpolateTier(TIERS.growth, TIERS.scale, 0.1) },
  { label: 'FY2030', visitors: 260_000,  registered: 30_000,  tier: interpolateTier(TIERS.growth, TIERS.scale, 0.5) },
  { label: 'FY2031', visitors: 320_000,  registered: 55_000,  tier: TIERS.scale },
];

const SCENARIO_B_TIERS: { label: string; visitors: number; registered: number; tier: TierCosts }[] = [
  { label: 'FY2027', visitors: 40_000,   registered: 500,     tier: TIERS.startup },
  { label: 'FY2028', visitors: 100_000,  registered: 3_000,   tier: interpolateTier(TIERS.startup, TIERS.growth, 0.22) },
  { label: 'FY2029', visitors: 180_000,  registered: 10_000,  tier: TIERS.growth },
  { label: 'FY2030', visitors: 280_000,  registered: 25_000,  tier: interpolateTier(TIERS.growth, TIERS.scale, 0.375) },
  { label: 'FY2031', visitors: 380_000,  registered: 55_000,  tier: TIERS.scale },
];

// ══════════════════════════════════════════════════════════════════════
// Scenario C: With CI + US Expansion
// ══════════════════════════════════════════════════════════════════════
// Canadian launch with CI → 4 months later, enter US market.
// CA credibility (CI partnership, press, proven platform) bootstraps
// US growth curve vs cold entry. US market is ~50x the donor volume
// but no CI traffic equivalent. Stripe nonprofit rate (2.2%) applies in both markets.
//
// Timeline: CA launches Apr 2026 (FY2027 start), US enters Aug 2026.
// FY2027 US = 8 months of activity (Aug 2026 – Mar 2027).

const US_PARTIAL_YEAR_FACTOR = 8 / 12;

// US revenue model — annualized rates; Year 1 transactions & SaaS scaled
// to 8 months via partialYearFactor.
//
// Bootstrap effect: US Year 1 starts at 1,200 users (vs 500 cold in Scenario B)
// because CA/CI credibility drives early PR, cross-border charity referrals,
// and "as featured by Charity Intelligence Canada" trust signal.
// US avg donation is lower ($250 vs $350 CA) — US online avg ~$200-250
// (Network for Good Digital Giving Trends 2023).
// Platform fee same 3.5%→3.2% trajectory as CA.
const US_REVENUE: RevenueAssumptions[] = [
  { users: 1_200,    activeDonorPct: 0.08, donationsPerDonor: 2.0, avgDonation: 250, platformFeePct: 0.035, premiumCharityPartners: 3,   premiumAvgAnnualFee: 500 },
  { users: 12_000,   activeDonorPct: 0.11, donationsPerDonor: 2.8, avgDonation: 280, platformFeePct: 0.035, premiumCharityPartners: 25,  premiumAvgAnnualFee: 800 },
  { users: 40_000,   activeDonorPct: 0.14, donationsPerDonor: 3.2, avgDonation: 310, platformFeePct: 0.034, premiumCharityPartners: 80,  premiumAvgAnnualFee: 1_100 },
  { users: 95_000,   activeDonorPct: 0.17, donationsPerDonor: 3.8, avgDonation: 350, platformFeePct: 0.033, premiumCharityPartners: 180, premiumAvgAnnualFee: 1_400 },
  { users: 200_000,  activeDonorPct: 0.19, donationsPerDonor: 4.5, avgDonation: 400, platformFeePct: 0.032, premiumCharityPartners: 400, premiumAvgAnnualFee: 1_700 },
];

// US marketing — heavier than CA (no CI traffic), bootstrapped by CA brand.
// Spend ramps for US giving season (same Nov-Dec peak).
// Year 1 annualized values; scaled to 8 months at budget creation.
const US_MARKETING: Record<string, number[]> = {
  'Organic Marketing':  [15_000,  36_000,   60_000,   84_000,   108_000],
  'Paid Media':         [60_000,  150_000,  240_000,  320_000,  400_000],
};

// US-specific compliance & organizational costs (annualized; Y1 scaled)
const US_COMPLIANCE: Record<string, number[]> = {
  'US state charity registrations':  [5_000,   8_000,   12_000,  15_000,  18_000],
  'US legal counsel':                [10_000,  15_000,  20_000,  25_000,  30_000],
  'Form 990 preparation':           [0,       3_500,   5_000,   7_500,   10_000],
  'US bookkeeping':                  [3_000,   6_000,   9_000,   12_000,  15_000],
  'US D&O / liability insurance':    [2_000,   3_000,   5_000,   8_000,   12_000],
};

// Combined CA + US infrastructure tiers (shared platform, combined user load)
// CA users from Scenario A + US users from US_REVENUE
const SCENARIO_C_TIERS: { label: string; caVisitors: number; usVisitors: number; caRegistered: number; usRegistered: number; tier: TierCosts }[] = [
  { label: 'FY2027', caVisitors: 130_000, usVisitors: 60_000,   caRegistered: 1_300,  usRegistered: 1_200,   tier: interpolateTier(TIERS.startup, TIERS.growth, 0.17) },
  { label: 'FY2028', caVisitors: 175_000, usVisitors: 200_000,  caRegistered: 5_000,  usRegistered: 12_000,  tier: interpolateTier(TIERS.growth, TIERS.scale, 0.175) },
  { label: 'FY2029', caVisitors: 210_000, usVisitors: 400_000,  caRegistered: 14_000, usRegistered: 40_000,  tier: interpolateTier(TIERS.scale, TIERS.enterprise, 0.02) },
  { label: 'FY2030', caVisitors: 260_000, usVisitors: 650_000,  caRegistered: 30_000, usRegistered: 95_000,  tier: interpolateTier(TIERS.scale, TIERS.enterprise, 0.375) },
  { label: 'FY2031', caVisitors: 320_000, usVisitors: 950_000,  caRegistered: 55_000, usRegistered: 200_000, tier: TIERS.enterprise },
];

// ── Helpers ──────────────────────────────────────────────────────────

// Stripe fee: 2.2% + $0.30 for nonprofits (both CA and US)
// US standard is 2.9% + $0.30 but Stripe offers 501(c)(3) nonprofits the
// same 2.2% + $0.30 rate as Canada. Requires EIN verification + >80% of
// volume being tax-deductible donations. Source: support.stripe.com
const STRIPE_PCT = 0.022;
const STRIPE_FIXED = 0.30;
const US_STRIPE_PCT = 0.022;
const US_STRIPE_FIXED = 0.30;

function computeRevenue(
  rev: RevenueAssumptions,
  stripePct = STRIPE_PCT,
  stripeFixed = STRIPE_FIXED,
  partialYearFactor = 1,
) {
  const activeDonors = Math.round(rev.users * rev.activeDonorPct);
  const totalTxns = Math.round(activeDonors * rev.donationsPerDonor * partialYearFactor);
  const donationVolume = totalTxns * rev.avgDonation;
  const txnFee = Math.round(donationVolume * rev.platformFeePct);
  const saas = Math.round(rev.premiumCharityPartners * rev.premiumAvgAnnualFee * partialYearFactor);
  const stripeFee = Math.round(donationVolume * stripePct + totalTxns * stripeFixed);
  return { txnFee, saas, total: txnFee + saas, activeDonors, totalTxns, donationVolume, stripeFee };
}

function computeInfraExpense(tier: TierCosts): number {
  return COST_CATEGORIES.reduce((s, c) => s + (tier as any)[c] * 12, 0);
}

function sumMkt(mkt: Record<string, number[]>, i: number, partialYearFactor = 1): number {
  return Math.round(Object.values(mkt).reduce((s, a) => s + a[i], 0) * partialYearFactor);
}

function sumCosts(costs: Record<string, number[]>, i: number, partialYearFactor = 1): number {
  return Math.round(Object.values(costs).reduce((s, a) => s + a[i], 0) * partialYearFactor);
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Seeding Give 5-Year Projections (Budget Data Only) ===\n');

  // 1. Look up entity and existing graph nodes
  const entities = await api<{ entities: any[] }>('/graph/entities');
  const hx = entities.entities.find((e: any) => e.label === 'Harness Exchange');
  if (!hx) throw new Error('Harness Exchange entity not found');
  const entityId = hx.id;
  const currency = hx.functional_currency || 'CAD';
  console.log(`Entity: ${hx.label} (${entityId})`);

  // Look up existing Activity nodes by label → id
  const activities = await api<{ items: any[] }>(`/graph/activities/by-entity/${entityId}`);
  const activityByLabel = new Map(activities.items.map((a: any) => [a.label, a.id]));

  // Map infra cost categories to their Activity node IDs
  const infraNodeIds: Record<string, string> = {};
  for (const cat of COST_CATEGORIES) {
    infraNodeIds[cat] = activityByLabel.get(CATEGORY_LABELS[cat]) || '';
    if (!infraNodeIds[cat]) console.warn(`  WARNING: No Activity node for "${CATEGORY_LABELS[cat]}"`);
  }

  // Map fixed costs to their Activity node IDs
  const fixedNodeIds: Record<string, string> = {};
  for (const costName of Object.keys(ANNUAL_FIXED_COSTS)) {
    fixedNodeIds[costName] = activityByLabel.get(costName) || '';
    if (!fixedNodeIds[costName]) console.warn(`  WARNING: No Activity node for "${costName}"`);
  }

  // Revenue activity IDs
  const txnFeeNodeId = activityByLabel.get('Transaction Fee Revenue') || '';
  const saasNodeId = activityByLabel.get('Charity Partner SaaS Revenue') || '';
  if (!txnFeeNodeId) console.warn('  WARNING: No "Transaction Fee Revenue" Activity');
  if (!saasNodeId) console.warn('  WARNING: No "Charity Partner SaaS Revenue" Activity');

  // Marketing activity IDs
  const mktNodeIds: Record<string, string> = {};
  for (const ch of ['Organic Marketing', 'Paid Media', 'Charity Intelligence Traffic']) {
    mktNodeIds[ch] = activityByLabel.get(ch) || '';
  }

  console.log(`  Found ${activityByLabel.size} activities, ${Object.values(infraNodeIds).filter(Boolean).length} infra, ${Object.values(fixedNodeIds).filter(Boolean).length} fixed\n`);

  // 2. Look up existing accounting periods
  const existingPeriods = await api<{ items: any[] }>(`/graph/periods/by-entity/${entityId}`);
  const periodIds: string[] = [];
  for (let yr = 1; yr <= 5; yr++) {
    const fyYear = 2026 + yr;
    const period = existingPeriods.items.find((p: any) => p.label === `FY${fyYear}`);
    periodIds.push(period?.id || '');
    console.log(`  FY${fyYear}: ${period?.id || 'MISSING'}`);
  }

  // 3. Seed budgets for each scenario
  async function seedBudgets(
    tag: string,
    tiers: typeof SCENARIO_A_TIERS,
    revenueModel: RevenueAssumptions[],
    marketing: Record<string, number[]>,
  ) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ${tag}`);
    console.log(`${'═'.repeat(60)}`);

    for (let i = 0; i < 5; i++) {
      const { label, tier } = tiers[i];
      const periodId = periodIds[i];
      if (!periodId) continue;
      const fyYear = 2027 + i;

      // --- Infrastructure + Fixed Costs budget ---
      const infraBudget = await api<any>('/budgeting/budgets', {
        method: 'POST',
        body: JSON.stringify({
          entityId, periodId, name: `${label} — ${tag} Infrastructure`,
          description: `Give ${tag}: infrastructure + fixed costs`,
          budgetType: 'ANNUAL', fiscalYear: fyYear, currency, createdBy: 'seed-give-projection',
          scenario: `Give — ${tag}`,
        }),
      });
      console.log(`\n  ${label} ${tag} Infra: ${infraBudget.id}`);

      for (const cat of COST_CATEGORIES) {
        const annual = (tier as any)[cat] * 12;
        if (annual === 0) continue;
        await api<any>('/budgeting/lines', {
          method: 'POST',
          body: JSON.stringify({
            budgetId: infraBudget.id, periodId,
            nodeRefId: infraNodeIds[cat] || periodId,
            nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE', amount: annual,
            notes: `${EXPENSE_GROUPS[cat] || 'Other'} > ${CATEGORY_LABELS[cat]}: $${(tier as any)[cat]}/mo × 12`,
          }),
        });
        console.log(`    ${CATEGORY_LABELS[cat]}: $${annual.toLocaleString()}/yr`);
      }

      for (const [costName, amounts] of Object.entries(ANNUAL_FIXED_COSTS)) {
        if (amounts[i] === 0) continue;
        await api<any>('/budgeting/lines', {
          method: 'POST',
          body: JSON.stringify({
            budgetId: infraBudget.id, periodId,
            nodeRefId: fixedNodeIds[costName] || periodId,
            nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE', amount: amounts[i],
            notes: `${EXPENSE_GROUPS[costName] || 'Other'} > ${costName}: $${amounts[i].toLocaleString()}/yr`,
          }),
        });
        console.log(`    ${costName}: $${amounts[i].toLocaleString()}/yr`);
      }

      // Organizational costs
      for (const [costName, amounts] of Object.entries(ORG_COSTS)) {
        if (amounts[i] === 0) continue;
        await api<any>('/budgeting/lines', {
          method: 'POST',
          body: JSON.stringify({
            budgetId: infraBudget.id, periodId,
            nodeRefId: periodId,
            nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE', amount: amounts[i],
            notes: `Organizational > ${costName}: $${amounts[i].toLocaleString()}/yr`,
          }),
        });
        console.log(`    ${costName}: $${amounts[i].toLocaleString()}/yr`);
      }

      // --- Marketing budget ---
      const mktBudget = await api<any>('/budgeting/budgets', {
        method: 'POST',
        body: JSON.stringify({
          entityId, periodId, name: `${label} — ${tag} Marketing`,
          description: `Give ${tag}: user acquisition`,
          budgetType: 'ANNUAL', fiscalYear: fyYear, currency, createdBy: 'seed-give-projection',
          scenario: `Give — ${tag}`,
        }),
      });
      console.log(`  ${label} ${tag} Marketing: ${mktBudget.id}`);

      for (const [ch, amounts] of Object.entries(marketing)) {
        if (amounts[i] === 0) continue;
        await api<any>('/budgeting/lines', {
          method: 'POST',
          body: JSON.stringify({
            budgetId: mktBudget.id, periodId,
            nodeRefId: mktNodeIds[ch] || periodId,
            nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE', amount: amounts[i],
            notes: `Marketing > ${ch}: $${amounts[i].toLocaleString()}/yr`,
            seasonalityProfile: 'GIVING_SEASON_MARKETING',
          }),
        });
        console.log(`    ${ch}: $${amounts[i].toLocaleString()}/yr (GIVING_SEASON_MARKETING)`);
      }

      // --- Revenue budget ---
      const rev = computeRevenue(revenueModel[i]);
      const revBudget = await api<any>('/budgeting/budgets', {
        method: 'POST',
        body: JSON.stringify({
          entityId, periodId, name: `${label} — ${tag} Revenue`,
          description: `Give ${tag}: projected revenue`,
          budgetType: 'ANNUAL', fiscalYear: fyYear, currency, createdBy: 'seed-give-projection',
          scenario: `Give — ${tag}`,
        }),
      });
      console.log(`  ${label} ${tag} Revenue: ${revBudget.id}`);

      // Donation revenue follows giving-season seasonality (Oct-Jan peak, Dec ~31%)
      await api<any>('/budgeting/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId: revBudget.id, periodId,
          nodeRefId: txnFeeNodeId || periodId,
          nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE', amount: rev.txnFee,
          notes: `Txn fees: ${rev.activeDonors} donors × ${revenueModel[i].donationsPerDonor} txns × $${revenueModel[i].avgDonation} × ${(revenueModel[i].platformFeePct * 100).toFixed(1)}%`,
          seasonalityProfile: 'GIVING_SEASON',
        }),
      });
      console.log(`    Transaction Fee Revenue: $${rev.txnFee.toLocaleString()} (GIVING_SEASON)`);

      // SaaS revenue is uniform — charities pay monthly/annual subscriptions
      await api<any>('/budgeting/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId: revBudget.id, periodId,
          nodeRefId: saasNodeId || periodId,
          nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE', amount: rev.saas,
          notes: `SaaS: ${revenueModel[i].premiumCharityPartners} partners × $${revenueModel[i].premiumAvgAnnualFee}/yr`,
        }),
      });
      console.log(`    Charity SaaS Revenue: $${rev.saas.toLocaleString()} (uniform)`);

      // Stripe processing cost follows donation seasonality (scales with volume)
      if (rev.stripeFee > 0) {
        await api<any>('/budgeting/lines', {
          method: 'POST',
          body: JSON.stringify({
            budgetId: infraBudget.id, periodId,
            nodeRefId: periodId,
            nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE', amount: rev.stripeFee,
            notes: `Payment Processing > Stripe fees: ${rev.totalTxns.toLocaleString()} txns × (2.2% + $0.30) on $${rev.donationVolume.toLocaleString()} volume`,
            seasonalityProfile: 'GIVING_SEASON',
          }),
        });
        console.log(`    Stripe Processing: $${rev.stripeFee.toLocaleString()} (GIVING_SEASON)`);
      }
    }
  }

  await seedBudgets('With CI', SCENARIO_A_TIERS, SCENARIO_A_REVENUE, SCENARIO_A_MARKETING);
  await seedBudgets('Without CI', SCENARIO_B_TIERS, SCENARIO_B_REVENUE, SCENARIO_B_MARKETING);

  // ── Scenario C: With CI + US Expansion ──────────────────────────────
  // CA launches with CI (same as Scenario A), US enters 4 months later.
  // Combined budgets show both markets under one scenario tag.

  async function seedScenarioC() {
    const tag = 'With CI + US';
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ${tag}`);
    console.log(`${'═'.repeat(60)}`);

    for (let i = 0; i < 5; i++) {
      const ct = SCENARIO_C_TIERS[i];
      const periodId = periodIds[i];
      if (!periodId) continue;
      const fyYear = 2027 + i;
      const usFactor = i === 0 ? US_PARTIAL_YEAR_FACTOR : 1;

      // --- Combined Infrastructure (shared platform, combined user load) ---
      const infraBudget = await api<any>('/budgeting/budgets', {
        method: 'POST',
        body: JSON.stringify({
          entityId, periodId, name: `${ct.label} — ${tag} Infrastructure`,
          description: `Give ${tag}: combined CA+US infrastructure`,
          budgetType: 'ANNUAL', fiscalYear: fyYear, currency, createdBy: 'seed-give-projection',
          scenario: `Give — ${tag}`,
        }),
      });
      console.log(`\n  ${ct.label} ${tag} Infra: ${infraBudget.id} (${(ct.caRegistered + ct.usRegistered).toLocaleString()} combined users)`);

      for (const cat of COST_CATEGORIES) {
        const annual = (ct.tier as any)[cat] * 12;
        if (annual === 0) continue;
        await api<any>('/budgeting/lines', {
          method: 'POST',
          body: JSON.stringify({
            budgetId: infraBudget.id, periodId,
            nodeRefId: infraNodeIds[cat] || periodId,
            nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE', amount: annual,
            notes: `${EXPENSE_GROUPS[cat] || 'Other'} > ${CATEGORY_LABELS[cat]}: $${(ct.tier as any)[cat]}/mo × 12 (CA+US combined)`,
          }),
        });
        console.log(`    ${CATEGORY_LABELS[cat]}: $${annual.toLocaleString()}/yr`);
      }

      // Shared fixed costs (PCI, pen-test, SOC2, Apple)
      for (const [costName, amounts] of Object.entries(ANNUAL_FIXED_COSTS)) {
        if (amounts[i] === 0) continue;
        await api<any>('/budgeting/lines', {
          method: 'POST',
          body: JSON.stringify({
            budgetId: infraBudget.id, periodId,
            nodeRefId: fixedNodeIds[costName] || periodId,
            nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE', amount: amounts[i],
            notes: `${EXPENSE_GROUPS[costName] || 'Other'} > ${costName}: $${amounts[i].toLocaleString()}/yr`,
          }),
        });
        console.log(`    ${costName}: $${amounts[i].toLocaleString()}/yr`);
      }

      // CA organizational costs
      for (const [costName, amounts] of Object.entries(ORG_COSTS)) {
        if (amounts[i] === 0) continue;
        await api<any>('/budgeting/lines', {
          method: 'POST',
          body: JSON.stringify({
            budgetId: infraBudget.id, periodId,
            nodeRefId: periodId,
            nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE', amount: amounts[i],
            notes: `Organizational (CA) > ${costName}: $${amounts[i].toLocaleString()}/yr`,
          }),
        });
        console.log(`    CA: ${costName}: $${amounts[i].toLocaleString()}/yr`);
      }

      // US compliance & organizational costs (Year 1 pro-rated to 8 months)
      for (const [costName, amounts] of Object.entries(US_COMPLIANCE)) {
        const amount = Math.round(amounts[i] * usFactor);
        if (amount === 0) continue;
        await api<any>('/budgeting/lines', {
          method: 'POST',
          body: JSON.stringify({
            budgetId: infraBudget.id, periodId,
            nodeRefId: periodId,
            nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE', amount,
            notes: `Organizational (US) > ${costName}: $${amount.toLocaleString()}/yr${i === 0 ? ' (8mo)' : ''}`,
          }),
        });
        console.log(`    US: ${costName}: $${amount.toLocaleString()}/yr${i === 0 ? ' (8mo)' : ''}`);
      }

      // --- CA Marketing (light, with CI traffic) ---
      const caMktBudget = await api<any>('/budgeting/budgets', {
        method: 'POST',
        body: JSON.stringify({
          entityId, periodId, name: `${ct.label} — ${tag} CA Marketing`,
          description: `Give ${tag}: Canadian marketing (CI-assisted)`,
          budgetType: 'ANNUAL', fiscalYear: fyYear, currency, createdBy: 'seed-give-projection',
          scenario: `Give — ${tag}`,
        }),
      });
      console.log(`  ${ct.label} ${tag} CA Marketing: ${caMktBudget.id}`);

      for (const [ch, amounts] of Object.entries(SCENARIO_A_MARKETING)) {
        if (amounts[i] === 0) continue;
        await api<any>('/budgeting/lines', {
          method: 'POST',
          body: JSON.stringify({
            budgetId: caMktBudget.id, periodId,
            nodeRefId: mktNodeIds[ch] || periodId,
            nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE', amount: amounts[i],
            notes: `Marketing (CA) > ${ch}: $${amounts[i].toLocaleString()}/yr`,
            seasonalityProfile: 'GIVING_SEASON_MARKETING',
          }),
        });
        console.log(`    CA ${ch}: $${amounts[i].toLocaleString()}/yr`);
      }

      // --- US Marketing (heavier, no CI equivalent) ---
      const usMktBudget = await api<any>('/budgeting/budgets', {
        method: 'POST',
        body: JSON.stringify({
          entityId, periodId, name: `${ct.label} — ${tag} US Marketing`,
          description: `Give ${tag}: US market acquisition`,
          budgetType: 'ANNUAL', fiscalYear: fyYear, currency, createdBy: 'seed-give-projection',
          scenario: `Give — ${tag}`,
        }),
      });
      console.log(`  ${ct.label} ${tag} US Marketing: ${usMktBudget.id}`);

      for (const [ch, amounts] of Object.entries(US_MARKETING)) {
        const amount = Math.round(amounts[i] * usFactor);
        if (amount === 0) continue;
        await api<any>('/budgeting/lines', {
          method: 'POST',
          body: JSON.stringify({
            budgetId: usMktBudget.id, periodId,
            nodeRefId: mktNodeIds[ch] || periodId,
            nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE', amount,
            notes: `Marketing (US) > ${ch}: $${amount.toLocaleString()}/yr${i === 0 ? ' (8mo)' : ''}`,
            seasonalityProfile: 'GIVING_SEASON_MARKETING',
          }),
        });
        console.log(`    US ${ch}: $${amount.toLocaleString()}/yr${i === 0 ? ' (8mo)' : ''}`);
      }

      // --- CA Revenue (same as Scenario A) ---
      const caRev = computeRevenue(SCENARIO_A_REVENUE[i]);
      const revBudget = await api<any>('/budgeting/budgets', {
        method: 'POST',
        body: JSON.stringify({
          entityId, periodId, name: `${ct.label} — ${tag} Revenue`,
          description: `Give ${tag}: CA + US projected revenue`,
          budgetType: 'ANNUAL', fiscalYear: fyYear, currency, createdBy: 'seed-give-projection',
          scenario: `Give — ${tag}`,
        }),
      });
      console.log(`  ${ct.label} ${tag} Revenue: ${revBudget.id}`);

      await api<any>('/budgeting/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId: revBudget.id, periodId,
          nodeRefId: txnFeeNodeId || periodId,
          nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE', amount: caRev.txnFee,
          notes: `CA Txn fees: ${caRev.activeDonors} donors × ${SCENARIO_A_REVENUE[i].donationsPerDonor} txns × $${SCENARIO_A_REVENUE[i].avgDonation} × ${(SCENARIO_A_REVENUE[i].platformFeePct * 100).toFixed(1)}%`,
          seasonalityProfile: 'GIVING_SEASON',
        }),
      });
      console.log(`    CA Txn Fee Revenue: $${caRev.txnFee.toLocaleString()}`);

      await api<any>('/budgeting/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId: revBudget.id, periodId,
          nodeRefId: saasNodeId || periodId,
          nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE', amount: caRev.saas,
          notes: `CA SaaS: ${SCENARIO_A_REVENUE[i].premiumCharityPartners} partners × $${SCENARIO_A_REVENUE[i].premiumAvgAnnualFee}/yr`,
        }),
      });
      console.log(`    CA SaaS Revenue: $${caRev.saas.toLocaleString()}`);

      // CA Stripe
      if (caRev.stripeFee > 0) {
        await api<any>('/budgeting/lines', {
          method: 'POST',
          body: JSON.stringify({
            budgetId: infraBudget.id, periodId,
            nodeRefId: periodId,
            nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE', amount: caRev.stripeFee,
            notes: `Payment Processing (CA) > Stripe fees: ${caRev.totalTxns.toLocaleString()} txns × (2.2% + $0.30) on $${caRev.donationVolume.toLocaleString()} volume`,
            seasonalityProfile: 'GIVING_SEASON',
          }),
        });
        console.log(`    CA Stripe: $${caRev.stripeFee.toLocaleString()}`);
      }

      // --- US Revenue (bootstrapped by CA/CI credibility) ---
      const usRev = computeRevenue(US_REVENUE[i], US_STRIPE_PCT, US_STRIPE_FIXED, usFactor);

      await api<any>('/budgeting/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId: revBudget.id, periodId,
          nodeRefId: txnFeeNodeId || periodId,
          nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE', amount: usRev.txnFee,
          notes: `US Txn fees: ${usRev.activeDonors} donors × ${(US_REVENUE[i].donationsPerDonor * usFactor).toFixed(1)} txns × $${US_REVENUE[i].avgDonation} × ${(US_REVENUE[i].platformFeePct * 100).toFixed(1)}%${i === 0 ? ' (8mo)' : ''}`,
          seasonalityProfile: 'GIVING_SEASON',
        }),
      });
      console.log(`    US Txn Fee Revenue: $${usRev.txnFee.toLocaleString()}${i === 0 ? ' (8mo)' : ''}`);

      await api<any>('/budgeting/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId: revBudget.id, periodId,
          nodeRefId: saasNodeId || periodId,
          nodeRefType: 'ACTIVITY', economicCategory: 'REVENUE', amount: usRev.saas,
          notes: `US SaaS: ${US_REVENUE[i].premiumCharityPartners} partners × $${US_REVENUE[i].premiumAvgAnnualFee}/yr${i === 0 ? ' (8mo)' : ''}`,
        }),
      });
      console.log(`    US SaaS Revenue: $${usRev.saas.toLocaleString()}${i === 0 ? ' (8mo)' : ''}`);

      // US Stripe (2.2% + $0.30 — nonprofit rate, same as Canada)
      if (usRev.stripeFee > 0) {
        await api<any>('/budgeting/lines', {
          method: 'POST',
          body: JSON.stringify({
            budgetId: infraBudget.id, periodId,
            nodeRefId: periodId,
            nodeRefType: 'ACTIVITY', economicCategory: 'EXPENSE', amount: usRev.stripeFee,
            notes: `Payment Processing (US) > Stripe fees: ${usRev.totalTxns.toLocaleString()} txns × (2.2% + $0.30) on $${usRev.donationVolume.toLocaleString()} volume${i === 0 ? ' (8mo)' : ''}`,
            seasonalityProfile: 'GIVING_SEASON',
          }),
        });
        console.log(`    US Stripe: $${usRev.stripeFee.toLocaleString()} (2.2% + $0.30)${i === 0 ? ' (8mo)' : ''}`);
      }
    }
  }

  await seedScenarioC();

  // 4. Attach ScenarioSets to existing graph nodes
  console.log('\n── Attaching ScenarioSets ──\n');

  const giveProduct = (await api<{ items: any[] }>(`/graph/products/by-entity/${entityId}`))
    .items.find((i: any) => i.label === 'Give');

  if (giveProduct) {
    await api<any>('/ai/scenario-sets', {
      method: 'POST',
      body: JSON.stringify({
        nodeId: giveProduct.id,
        label: 'Give Growth Path: CA-only vs US Expansion',
        baseValue: 55_000,
        scenarios: [
          { label: 'With CI (CA only)', probability: 0.3, impactMultiplier: 1.0, description: 'CI provides ~330K visitors/yr. CA-only, 55K users by year 5.' },
          { label: 'Without CI (CA only)', probability: 0.2, impactMultiplier: 0.6, description: 'No CI traffic. Heavy marketing. Same 55K target but higher cost.' },
          { label: 'With CI + US Expansion', probability: 0.5, impactMultiplier: 3.5, description: 'CA credibility bootstraps US entry. 255K combined users by year 5.' },
        ],
      }),
    });
    console.log('  ScenarioSet on Give Product');
  }

  // 5. P&L summaries
  const p = (n: number, w: number) => (n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`).padStart(w);

  function printPnL(label: string, tiers: typeof SCENARIO_A_TIERS, rev: RevenueAssumptions[], mkt: Record<string, number[]>) {
    console.log(`\n=== ${label.toUpperCase()} ===\n`);
    console.log('Year  | Users     | Revenue      | Infra+Fixed  | Marketing    | Total Exp    | Net          | Margin');
    console.log('------|-----------|--------------|--------------|--------------|--------------|--------------|-------');
    let gR = 0, gE = 0;
    for (let i = 0; i < 5; i++) {
      const r = computeRevenue(rev[i]);
      const infra = computeInfraExpense(tiers[i].tier) + Object.values(ANNUAL_FIXED_COSTS).reduce((s, a) => s + a[i], 0)
        + Object.values(ORG_COSTS).reduce((s, a) => s + a[i], 0) + r.stripeFee;
      const m = sumMkt(mkt, i);
      const exp = infra + m;
      const net = r.total - exp;
      gR += r.total; gE += exp;
      console.log(`  ${i + 1}   | ${String(tiers[i].registered).padStart(7)}   | ${p(r.total, 12)} | ${p(infra, 12)} | ${p(m, 12)} | ${p(exp, 12)} | ${p(net, 12)} | ${r.total > 0 ? ((net / r.total) * 100).toFixed(1) : 'N/A'}%`);
    }
    console.log(`      |           | $${gR.toLocaleString().padStart(11)} |              |              | $${gE.toLocaleString().padStart(11)} | $${(gR - gE).toLocaleString().padStart(11)} | 5-yr`);
  }

  function printCombinedPnL() {
    console.log(`\n=== WITH CI + US EXPANSION (COMBINED) ===\n`);
    console.log('Year  | CA Users  | US Users  | CA Rev       | US Rev       | Revenue      | Infra+Comp   | Marketing    | Total Exp    | Net          | Margin');
    console.log('------|-----------|-----------|--------------|--------------|--------------|--------------|--------------|--------------|--------------|-------');
    let gR = 0, gE = 0;
    for (let i = 0; i < 5; i++) {
      const ct = SCENARIO_C_TIERS[i];
      const usFactor = i === 0 ? US_PARTIAL_YEAR_FACTOR : 1;

      const caRev = computeRevenue(SCENARIO_A_REVENUE[i]);
      const usRev = computeRevenue(US_REVENUE[i], US_STRIPE_PCT, US_STRIPE_FIXED, usFactor);
      const totalRev = caRev.total + usRev.total;

      const infra = computeInfraExpense(ct.tier)
        + Object.values(ANNUAL_FIXED_COSTS).reduce((s, a) => s + a[i], 0)
        + Object.values(ORG_COSTS).reduce((s, a) => s + a[i], 0)
        + sumCosts(US_COMPLIANCE, i, usFactor)
        + caRev.stripeFee + usRev.stripeFee;
      const mkt = sumMkt(SCENARIO_A_MARKETING, i) + sumMkt(US_MARKETING, i, usFactor);
      const exp = infra + mkt;
      const net = totalRev - exp;
      gR += totalRev; gE += exp;

      console.log(`  ${i + 1}   | ${String(ct.caRegistered).padStart(7)}   | ${String(ct.usRegistered).padStart(7)}   | ${p(caRev.total, 12)} | ${p(usRev.total, 12)} | ${p(totalRev, 12)} | ${p(infra, 12)} | ${p(mkt, 12)} | ${p(exp, 12)} | ${p(net, 12)} | ${totalRev > 0 ? ((net / totalRev) * 100).toFixed(1) : 'N/A'}%`);
    }
    console.log(`      |           |           |              |              | $${gR.toLocaleString().padStart(11)} |              |              | $${gE.toLocaleString().padStart(11)} | $${(gR - gE).toLocaleString().padStart(11)} | 5-yr`);
  }

  printPnL('With CI (CA only)', SCENARIO_A_TIERS, SCENARIO_A_REVENUE, SCENARIO_A_MARKETING);
  printPnL('Without CI (CA only)', SCENARIO_B_TIERS, SCENARIO_B_REVENUE, SCENARIO_B_MARKETING);
  printCombinedPnL();

  // Cross-scenario comparison
  const ciOnlyNet = SCENARIO_A_TIERS.reduce((s, t, i) => {
    const r = computeRevenue(SCENARIO_A_REVENUE[i]);
    return s + r.total - computeInfraExpense(t.tier) - Object.values(ANNUAL_FIXED_COSTS).reduce((x, a) => x + a[i], 0)
      - Object.values(ORG_COSTS).reduce((x, a) => x + a[i], 0) - r.stripeFee - sumMkt(SCENARIO_A_MARKETING, i);
  }, 0);
  const noCiNet = SCENARIO_B_TIERS.reduce((s, t, i) => {
    const r = computeRevenue(SCENARIO_B_REVENUE[i]);
    return s + r.total - computeInfraExpense(t.tier) - Object.values(ANNUAL_FIXED_COSTS).reduce((x, a) => x + a[i], 0)
      - Object.values(ORG_COSTS).reduce((x, a) => x + a[i], 0) - r.stripeFee - sumMkt(SCENARIO_B_MARKETING, i);
  }, 0);
  const combinedNet = SCENARIO_C_TIERS.reduce((s, ct, i) => {
    const usFactor = i === 0 ? US_PARTIAL_YEAR_FACTOR : 1;
    const caRev = computeRevenue(SCENARIO_A_REVENUE[i]);
    const usRev = computeRevenue(US_REVENUE[i], US_STRIPE_PCT, US_STRIPE_FIXED, usFactor);
    const totalRev = caRev.total + usRev.total;
    const infra = computeInfraExpense(ct.tier)
      + Object.values(ANNUAL_FIXED_COSTS).reduce((x, a) => x + a[i], 0)
      + Object.values(ORG_COSTS).reduce((x, a) => x + a[i], 0)
      + sumCosts(US_COMPLIANCE, i, usFactor)
      + caRev.stripeFee + usRev.stripeFee;
    const mkt = sumMkt(SCENARIO_A_MARKETING, i) + sumMkt(US_MARKETING, i, usFactor);
    return s + totalRev - infra - mkt;
  }, 0);

  console.log(`\n── 5-Year Net Comparison ──`);
  console.log(`  With CI (CA only):     ${p(ciOnlyNet, 12)}`);
  console.log(`  Without CI (CA only):  ${p(noCiNet, 12)}`);
  console.log(`  With CI + US:          ${p(combinedNet, 12)}`);
  console.log(`  US expansion uplift:   ${p(combinedNet - ciOnlyNet, 12)} over CA-only`);

  console.log('\n=== Done! Budget data created — no graph nodes modified ===');
}

main().catch((e) => { console.error('Fatal error:', e); process.exit(1); });
