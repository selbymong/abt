export {};

/**
 * Seed Harness Platform 5-Year Financial Cost Projection
 *
 * Creates an Entity for Harness Exchange (HX), accounting periods for
 * 5 fiscal years, and budget lines for each cost category at each
 * growth tier. Uses the cost model from ~/harness/docs/production-cost-model.md.
 *
 * Run: npx tsx scripts/seed-harness-projection.ts
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

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(GQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json: any = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

// ── Cost Model (midpoint estimates per month) ──────────────────

interface TierCosts {
  users: number;
  compute: number;
  database: number;
  redis: number;
  kafka: number;
  llm: number;
  email: number;
  sms: number;
  cdn: number;
  monitoring: number;
  search: number;
  domain: number;
}

const TIERS: Record<string, TierCosts> = {
  startup: {
    users: 1_000,
    compute: 35,      // $20-40 avg + $0 kafka workers
    database: 18,     // $10-25
    redis: 5,         // $0-10
    kafka: 0,         // PG-only mode
    llm: 10,          // $5-15
    email: 0,         // free tier
    sms: 2,
    cdn: 6,
    monitoring: 0,    // free tier
    search: 0,        // SQL-only
    domain: 15,
  },
  growth: {
    users: 10_000,
    compute: 85,      // $40-80 app + $15-30 kafka
    database: 100,
    redis: 35,
    kafka: 55,
    llm: 100,
    email: 30,
    sms: 25,
    cdn: 35,
    monitoring: 30,
    search: 75,
    domain: 15,
  },
  scale: {
    users: 50_000,
    compute: 400,     // $200-400 app + $80-200 kafka
    database: 375,
    redis: 150,
    kafka: 200,
    llm: 475,
    email: 75,
    sms: 90,
    cdn: 170,
    monitoring: 80,
    search: 300,
    domain: 15,
  },
  enterprise: {
    users: 250_000,
    compute: 1_050,   // $500-1200 app + $200-500 kafka
    database: 1_400,
    redis: 300,
    kafka: 1_000,
    llm: 2_350,
    email: 300,
    sms: 450,
    cdn: 500,
    monitoring: 200,
    search: 700,
    domain: 15,
  },
};

// 5-year growth trajectory:
// Year 1: Startup (1K users)
// Year 2: Growth (10K users)
// Year 3: Scale-early (25K users — interpolated)
// Year 4: Scale (50K users)
// Year 5: Enterprise-early (100K users — interpolated)

function interpolate(a: TierCosts, b: TierCosts, t: number): TierCosts {
  const result: any = {};
  for (const key of Object.keys(a)) {
    result[key] = Math.round((a as any)[key] * (1 - t) + (b as any)[key] * t);
  }
  return result;
}

const YEARLY_TIERS: { year: number; label: string; tier: TierCosts }[] = [
  { year: 1, label: 'FY2027 — Startup (1K users)', tier: TIERS.startup },
  { year: 2, label: 'FY2028 — Growth (10K users)', tier: TIERS.growth },
  { year: 3, label: 'FY2029 — Scale-Early (25K users)', tier: interpolate(TIERS.growth, TIERS.scale, 0.375) },
  { year: 4, label: 'FY2030 — Scale (50K users)', tier: TIERS.scale },
  { year: 5, label: 'FY2031 — Enterprise-Early (100K users)', tier: interpolate(TIERS.scale, TIERS.enterprise, 0.25) },
];

// ── Revenue Model (CRA T1 2023 data + platform economics) ────
//
// CRA 2023: ~5M donors, $12.8B total, median $390, avg ~$2,272/donor
// Online platforms: avg ~$500/transaction (CanadaHelps: $444.7M / 881K donors)
// Platform fee: 3.5% of donation volume (competitive with CanadaHelps 4%)
//
// Assumptions per tier:
//   - active_donor_pct: % of users who donate at least once/year (grows with maturity)
//   - donations_per_donor: avg transactions/yr (monthly givers pull this up)
//   - avg_donation: per-transaction amount, based on CRA median $390 trending
//     toward online avg $500 as platform matures and attracts recurring givers
//   - platform_fee_pct: 3.5% base, dropping slightly at scale
//   - premium_revenue: SaaS fees from charity partners (dashboards, analytics, API)

interface RevenueAssumptions {
  users: number;
  activeDonorPct: number;       // % of users who donate
  donationsPerDonor: number;    // avg transactions per active donor per year
  avgDonation: number;          // avg $ per transaction (CRA-informed)
  platformFeePct: number;       // % of donation volume taken as fee
  premiumCharityPartners: number; // paying charity orgs
  premiumAvgAnnualFee: number;  // avg annual SaaS fee per charity partner
}

const REVENUE_TIERS: RevenueAssumptions[] = [
  // Year 1: 1K users — early, low conversion, small avg donation (near CRA median $390)
  { users: 1_000,   activeDonorPct: 0.12, donationsPerDonor: 3.0, avgDonation: 350, platformFeePct: 0.035, premiumCharityPartners: 5,   premiumAvgAnnualFee: 600 },
  // Year 2: 10K users — growing trust, more recurring givers
  { users: 10_000,  activeDonorPct: 0.16, donationsPerDonor: 3.8, avgDonation: 410, platformFeePct: 0.035, premiumCharityPartners: 35,  premiumAvgAnnualFee: 900 },
  // Year 3: 25K users — maturing, avg donation trending toward online avg
  { users: 25_000,  activeDonorPct: 0.18, donationsPerDonor: 4.2, avgDonation: 440, platformFeePct: 0.034, premiumCharityPartners: 80,  premiumAvgAnnualFee: 1_200 },
  // Year 4: 50K users — established, strong recurring base
  { users: 50_000,  activeDonorPct: 0.20, donationsPerDonor: 4.5, avgDonation: 470, platformFeePct: 0.033, premiumCharityPartners: 150, premiumAvgAnnualFee: 1_500 },
  // Year 5: 100K users — scale, approaching online platform avg $500
  { users: 100_000, activeDonorPct: 0.22, donationsPerDonor: 5.0, avgDonation: 500, platformFeePct: 0.032, premiumCharityPartners: 280, premiumAvgAnnualFee: 1_800 },
];

// Annual one-time costs
const ANNUAL_COSTS: Record<string, number[]> = {
  // [yr1, yr2, yr3, yr4, yr5]
  'PCI-DSS Compliance':   [250,    250,    500,    500,    500],
  'Penetration Testing':  [5_000, 5_000, 10_000, 10_000, 15_000],
  'SOC 2 Type II Audit':  [0,     25_000, 30_000, 35_000, 40_000],
  'Apple Developer':      [99,    99,     99,     99,     99],
};

const COST_CATEGORIES = [
  'compute', 'database', 'redis', 'kafka', 'llm',
  'email', 'sms', 'cdn', 'monitoring', 'search', 'domain',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  compute: 'Compute & Hosting',
  database: 'PostgreSQL + pgvector',
  redis: 'Redis Cache',
  kafka: 'Kafka / Event Streaming',
  llm: 'AI/LLM Tokens (Claude)',
  email: 'Email (Resend)',
  sms: 'SMS (Twilio)',
  cdn: 'CDN + Storage (S3/CF)',
  monitoring: 'Monitoring & Observability',
  search: 'Search (Elasticsearch)',
  domain: 'Domain + SSL',
};

// ── Main ───────────────────────────────────────────────────────

async function main() {
  console.log('=== Seeding Harness Platform 5-Year Projection ===\n');

  // 1. Find existing Harness Exchange entity
  console.log('Looking up Harness Exchange entity...');
  const entities = await api<{ entities: any[] }>('/graph/entities');
  const hx = entities.entities.find((e: any) => e.label === 'Harness Exchange');
  if (!hx) throw new Error('Harness Exchange entity not found — create it first via seed data');
  const entityId = hx.id;
  console.log(`  Using entity: ${entityId} (${hx.label})`);
  const currency = hx.functional_currency || 'CAD';

  // 2. Create Platform → Product → Acquisition → Conversion graph
  console.log('\nCreating platform & product graph...');

  // Harness Platform (Resource — the platform itself)
  let platformId = '';
  try {
    const result = await api<any>('/graph/resources', {
      method: 'POST',
      body: JSON.stringify({
        entityId,
        label: 'Harness Platform',
        resourceType: 'TECHNOLOGY',
        status: 'ACTIVE',
        allocationPct: 100,
        costMonetary: 0,
        currency: 'CAD',
      }),
    });
    platformId = result.id;
    console.log(`  Resource "Harness Platform": ${platformId}`);
  } catch (e: any) {
    console.log(`  Harness Platform failed: ${e.message}`);
  }

  // Give Product (Initiative — the donation product built on Harness Platform)
  let giveProductId = '';
  try {
    const result = await api<any>('/graph/initiatives', {
      method: 'POST',
      body: JSON.stringify({
        entityId,
        label: 'Give',
        description: 'Donation product enabling charitable giving through the Harness Platform',
        status: 'IN_PROGRESS',
        budget: 0,
        timeHorizonMonths: 60,
      }),
    });
    giveProductId = result.id;
    console.log(`  Initiative "Give": ${giveProductId}`);
  } catch (e: any) {
    console.log(`  Give product failed: ${e.message}`);
  }

  // Give CONTRIBUTES_TO Harness Platform
  if (giveProductId && platformId) {
    try {
      await api<any>('/graph/edges/contributes-to', {
        method: 'POST',
        body: JSON.stringify({
          sourceId: giveProductId,
          targetId: platformId,
          weight: 1.0,
          confidence: 0.95,
          contributionFunction: 'LINEAR',
        }),
      });
      console.log(`  Give → Harness Platform`);
    } catch (e: any) {
      console.log(`  Edge Give→Platform failed: ${e.message}`);
    }
  }

  // User acquisition channels (Activities)
  console.log('\nCreating user acquisition channels...');

  let charityIntelId = '';
  try {
    const result = await api<any>('/graph/activities', {
      method: 'POST',
      body: JSON.stringify({
        entityId,
        label: 'Charity Intelligence Traffic',
        description: 'Current primary user acquisition channel — organic traffic from Charity Intelligence partnership',
        status: 'IN_PROGRESS',
      }),
    });
    charityIntelId = result.id;
    console.log(`  Activity "Charity Intelligence Traffic": ${charityIntelId}`);
  } catch (e: any) {
    console.log(`  Charity Intelligence failed: ${e.message}`);
  }

  let marketingId = '';
  try {
    const result = await api<any>('/graph/activities', {
      method: 'POST',
      body: JSON.stringify({
        entityId,
        label: 'Marketing & Growth',
        description: 'Future user acquisition — paid + organic marketing efforts',
        status: 'PLANNED',
      }),
    });
    marketingId = result.id;
    console.log(`  Activity "Marketing & Growth": ${marketingId}`);
  } catch (e: any) {
    console.log(`  Marketing failed: ${e.message}`);
  }

  // Acquisition channels CONTRIBUTES_TO Give product
  for (const [label, sourceId, weight] of [
    ['Charity Intelligence', charityIntelId, 0.85],
    ['Marketing & Growth', marketingId, 0.15],
  ] as [string, string, number][]) {
    if (!sourceId || !giveProductId) continue;
    try {
      await api<any>('/graph/edges/contributes-to', {
        method: 'POST',
        body: JSON.stringify({
          sourceId,
          targetId: giveProductId,
          weight,
          confidence: 0.8,
          contributionFunction: 'LINEAR',
        }),
      });
      console.log(`  ${label} → Give (weight: ${weight})`);
    } catch (e: any) {
      console.log(`  Edge ${label}→Give failed: ${e.message}`);
    }
  }

  // Platform Users & Converted Donors metrics per year
  // These represent the funnel: Platform Users (from traffic) → Converted Donors (subset who donate)
  console.log('\nCreating user funnel metrics per year...');

  // Conversion assumptions per tier:
  // Platform users = total visitors driven by acquisition channels
  // Converted donors = activeDonorPct of registered users (a further subset)
  // Visitor-to-registration rate: ~8-15% depending on maturity
  const FUNNEL_ASSUMPTIONS = [
    { year: 1, platformVisitors: 12_500,  registeredUsers: 1_000,   convertedDonors: 120 },   // 8% reg, 12% donor
    { year: 2, platformVisitors: 80_000,  registeredUsers: 10_000,  convertedDonors: 1_600 },  // 12.5% reg, 16% donor
    { year: 3, platformVisitors: 180_000, registeredUsers: 25_000,  convertedDonors: 4_500 },  // 13.9% reg, 18% donor
    { year: 4, platformVisitors: 350_000, registeredUsers: 50_000,  convertedDonors: 10_000 }, // 14.3% reg, 20% donor
    { year: 5, platformVisitors: 650_000, registeredUsers: 100_000, convertedDonors: 22_000 }, // 15.4% reg, 22% donor
  ];

  const platformUserMetricIds: string[] = [];
  const registeredUserMetricIds: string[] = [];
  const convertedDonorMetricIds: string[] = [];

  for (let i = 0; i < FUNNEL_ASSUMPTIONS.length; i++) {
    const f = FUNNEL_ASSUMPTIONS[i];
    const label = YEARLY_TIERS[i].label;
    const regRate = ((f.registeredUsers / f.platformVisitors) * 100).toFixed(1);
    const donorRate = ((f.convertedDonors / f.registeredUsers) * 100).toFixed(0);

    // Platform Visitors metric
    try {
      const result = await api<any>('/graph/metrics', {
        method: 'POST',
        body: JSON.stringify({
          entityId,
          label: `Platform Visitors — ${label}`,
          metricType: 'OBSERVED',
          unit: 'users',
          currentValue: f.platformVisitors,
          targetValue: f.platformVisitors,
        }),
      });
      platformUserMetricIds.push(result.id);
      console.log(`  Metric "Platform Visitors ${label}": ${f.platformVisitors.toLocaleString()}`);
    } catch (e: any) {
      platformUserMetricIds.push('');
      console.log(`  Platform visitors metric failed: ${e.message}`);
    }

    // Registered Users metric
    try {
      const result = await api<any>('/graph/metrics', {
        method: 'POST',
        body: JSON.stringify({
          entityId,
          label: `Registered Users — ${label}`,
          metricType: 'OBSERVED',
          unit: 'users',
          currentValue: f.registeredUsers,
          targetValue: f.registeredUsers,
        }),
      });
      registeredUserMetricIds.push(result.id);
      console.log(`  Metric "Registered Users ${label}": ${f.registeredUsers.toLocaleString()} (${regRate}% reg rate)`);
    } catch (e: any) {
      registeredUserMetricIds.push('');
      console.log(`  Registered users metric failed: ${e.message}`);
    }

    // Converted Donors metric
    try {
      const result = await api<any>('/graph/metrics', {
        method: 'POST',
        body: JSON.stringify({
          entityId,
          label: `Converted Donors — ${label}`,
          metricType: 'OBSERVED',
          unit: 'donors',
          currentValue: f.convertedDonors,
          targetValue: f.convertedDonors,
        }),
      });
      convertedDonorMetricIds.push(result.id);
      console.log(`  Metric "Converted Donors ${label}": ${f.convertedDonors.toLocaleString()} (${donorRate}% of registered)`);
    } catch (e: any) {
      convertedDonorMetricIds.push('');
      console.log(`  Converted donors metric failed: ${e.message}`);
    }
  }

  // Wire funnel edges:
  // Acquisition channels → Platform Visitors (each year)
  // Platform Visitors → Registered Users (CONTRIBUTES_TO with conversion weight)
  // Registered Users → Converted Donors (CONTRIBUTES_TO with donor conversion weight)
  // Converted Donors → User Growth outcome
  console.log('\nWiring funnel edges...');

  for (let i = 0; i < FUNNEL_ASSUMPTIONS.length; i++) {
    const f = FUNNEL_ASSUMPTIONS[i];
    const pvId = platformUserMetricIds[i];
    const ruId = registeredUserMetricIds[i];
    const cdId = convertedDonorMetricIds[i];

    // Charity Intelligence → Platform Visitors (primary current channel)
    if (charityIntelId && pvId) {
      try {
        await api<any>('/graph/edges/contributes-to', {
          method: 'POST',
          body: JSON.stringify({
            sourceId: charityIntelId,
            targetId: pvId,
            weight: i < 2 ? 0.90 : i < 4 ? 0.70 : 0.50, // decreasing as marketing ramps up
            confidence: 0.85,
            contributionFunction: 'LINEAR',
          }),
        });
      } catch (e: any) { /* silent */ }
    }

    // Marketing → Platform Visitors (growing channel)
    if (marketingId && pvId) {
      try {
        await api<any>('/graph/edges/contributes-to', {
          method: 'POST',
          body: JSON.stringify({
            sourceId: marketingId,
            targetId: pvId,
            weight: i < 2 ? 0.10 : i < 4 ? 0.30 : 0.50, // increasing over time
            confidence: 0.6,
            contributionFunction: 'LINEAR',
          }),
        });
      } catch (e: any) { /* silent */ }
    }

    // Platform Visitors → Registered Users (registration conversion)
    if (pvId && ruId) {
      const regRate = f.registeredUsers / f.platformVisitors;
      try {
        await api<any>('/graph/edges/contributes-to', {
          method: 'POST',
          body: JSON.stringify({
            sourceId: pvId,
            targetId: ruId,
            weight: regRate,
            confidence: 0.8,
            contributionFunction: 'LINEAR',
          }),
        });
      } catch (e: any) { /* silent */ }
    }

    // Registered Users → Converted Donors (donor conversion)
    if (ruId && cdId) {
      const donorRate = f.convertedDonors / f.registeredUsers;
      try {
        await api<any>('/graph/edges/contributes-to', {
          method: 'POST',
          body: JSON.stringify({
            sourceId: ruId,
            targetId: cdId,
            weight: donorRate,
            confidence: 0.75,
            contributionFunction: 'LINEAR',
          }),
        });
      } catch (e: any) { /* silent */ }
    }

    console.log(`  Year ${i + 1}: ${f.platformVisitors.toLocaleString()} visitors → ${f.registeredUsers.toLocaleString()} registered → ${f.convertedDonors.toLocaleString()} donors`);
  }

  // 3. Create Accounting Periods (FY2027-FY2031)
  console.log('\nCreating accounting periods...');
  const periodIds: string[] = [];

  for (const { year, label } of YEARLY_TIERS) {
    const fyYear = 2026 + year;
    try {
      const period = await api<any>('/graph/periods', {
        method: 'POST',
        body: JSON.stringify({
          entityId,
          label: `${label}`,
          startDate: `${fyYear - 1}-04-01`,
          endDate: `${fyYear}-03-31`,
        }),
      });
      periodIds.push(period.id);
      console.log(`  Period FY${fyYear}: ${period.id}`);
    } catch (e: any) {
      console.log(`  Period FY${fyYear} creation failed: ${e.message}`);
      const periods = await api<{ items: any[] }>(`/graph/periods/by-entity/${entityId}`);
      const existing = periods.items.find((p: any) => p.label?.includes(`FY${fyYear}`));
      if (existing) {
        periodIds.push(existing.id);
        console.log(`  Using existing period: ${existing.id}`);
      } else {
        periodIds.push('');
      }
    }
  }

  // 3. Create Outcome nodes for cost tracking
  console.log('\nCreating Outcome nodes...');
  const outcomeIds: Record<string, string> = {};

  const outcomes = [
    { label: 'Platform Infrastructure', type: 'MITIGATE_EXPENSE' },
    { label: 'AI & Intelligence', type: 'MITIGATE_EXPENSE' },
    { label: 'User Growth', type: 'IMPROVE_REVENUE' },
    { label: 'Compliance & Security', type: 'MITIGATE_EXPENSE' },
  ];

  for (const outcome of outcomes) {
    try {
      const result = await api<any>('/graph/outcomes', {
        method: 'POST',
        body: JSON.stringify({
          entityId,
          label: outcome.label,
          outcomeType: outcome.type,
          ontology: 'FINANCIAL',
          targetDelta: 0,
          currency: 'CAD',
          periodStart: '2026-04-01',
          periodEnd: '2031-03-31',
        }),
      });
      outcomeIds[outcome.label] = result.id;
      console.log(`  Outcome "${outcome.label}": ${result.id}`);
    } catch (e: any) {
      console.log(`  Outcome "${outcome.label}" failed: ${e.message}`);
    }
  }

  // 4. Create Activity nodes for each cost category
  console.log('\nCreating Activity nodes for cost categories...');
  const activityIds: Record<string, string> = {};

  for (const cat of COST_CATEGORIES) {
    try {
      const result = await api<any>('/graph/activities', {
        method: 'POST',
        body: JSON.stringify({
          entityId,
          label: CATEGORY_LABELS[cat],
          status: 'IN_PROGRESS',
        }),
      });
      activityIds[cat] = result.id;
      console.log(`  Activity "${CATEGORY_LABELS[cat]}": ${result.id}`);
    } catch (e: any) {
      console.log(`  Activity "${CATEGORY_LABELS[cat]}" failed: ${e.message}`);
    }
  }

  // Add annual cost activities
  for (const costName of Object.keys(ANNUAL_COSTS)) {
    try {
      const result = await api<any>('/graph/activities', {
        method: 'POST',
        body: JSON.stringify({
          entityId,
          label: costName,
          status: 'IN_PROGRESS',
        }),
      });
      activityIds[costName] = result.id;
      console.log(`  Activity "${costName}": ${result.id}`);
    } catch (e: any) {
      console.log(`  Activity "${costName}" failed: ${e.message}`);
    }
  }

  // 5. Create CONTRIBUTES_TO edges (activities → outcomes)
  console.log('\nCreating CONTRIBUTES_TO edges...');
  const infraOutcome = outcomeIds['Platform Infrastructure'];
  const aiOutcome = outcomeIds['AI & Intelligence'];
  const complianceOutcome = outcomeIds['Compliance & Security'];

  const edgeMappings: Record<string, string> = {
    compute: infraOutcome,
    database: infraOutcome,
    redis: infraOutcome,
    kafka: infraOutcome,
    cdn: infraOutcome,
    monitoring: infraOutcome,
    search: infraOutcome,
    domain: infraOutcome,
    llm: aiOutcome,
    email: infraOutcome,
    sms: infraOutcome,
    'PCI-DSS Compliance': complianceOutcome,
    'Penetration Testing': complianceOutcome,
    'SOC 2 Type II Audit': complianceOutcome,
    'Apple Developer': infraOutcome,
  };

  for (const [cat, outcomeId] of Object.entries(edgeMappings)) {
    if (!activityIds[cat] || !outcomeId) continue;
    try {
      await api<any>('/graph/edges/contributes-to', {
        method: 'POST',
        body: JSON.stringify({
          sourceId: activityIds[cat],
          targetId: outcomeId,
          weight: cat === 'compute' || cat === 'database' || cat === 'llm' ? 0.8 : 0.4,
          confidence: 0.9,
          contributionFunction: 'LINEAR',
        }),
      });
      console.log(`  ${cat} → ${outcomeId.slice(0, 8)}...`);
    } catch (e: any) {
      console.log(`  Edge ${cat} failed: ${e.message}`);
    }
  }

  // 6. Create Budgets for each year
  console.log('\nCreating budgets with line items...');

  for (let i = 0; i < YEARLY_TIERS.length; i++) {
    const { year, label, tier } = YEARLY_TIERS[i];
    const periodId = periodIds[i];
    if (!periodId) continue;

    try {
      // Create budget
      const fyYear = 2026 + year;
      const budget = await api<any>('/budgeting/budgets', {
        method: 'POST',
        body: JSON.stringify({
          entityId,
          periodId,
          name: `${label} — Operating Budget`,
          description: `Harness platform infrastructure costs for ${label}`,
          budgetType: 'ANNUAL',
          fiscalYear: fyYear,
          currency: 'CAD',
          createdBy: 'seed-script',
        }),
      });
      const budgetId = budget.id;
      console.log(`\n  Budget for ${label}: ${budgetId}`);

      // Add monthly recurring cost lines (annualized)
      for (const cat of COST_CATEGORIES) {
        const monthlyCost = tier[cat];
        const annualCost = monthlyCost * 12;
        if (annualCost === 0) continue;

        try {
          await api<any>(`/budgeting/lines`, {
            method: 'POST',
            body: JSON.stringify({
              budgetId,
              periodId,
              nodeRefId: activityIds[cat] || periodId,
              nodeRefType: 'ACTIVITY',
              economicCategory: 'EXPENSE',
              amount: annualCost,
              notes: `${CATEGORY_LABELS[cat]}: $${monthlyCost}/mo × 12 = $${annualCost}/yr (${tier.users.toLocaleString()} users)`,
            }),
          });
          console.log(`    ${CATEGORY_LABELS[cat]}: $${annualCost.toLocaleString()}/yr`);
        } catch (e: any) {
          console.log(`    Line ${cat} failed: ${e.message}`);
        }
      }

      // Add annual one-time costs
      for (const [costName, yearlyAmounts] of Object.entries(ANNUAL_COSTS)) {
        const amount = yearlyAmounts[i];
        if (amount === 0) continue;

        try {
          await api<any>(`/budgeting/lines`, {
            method: 'POST',
            body: JSON.stringify({
              budgetId,
              periodId,
              nodeRefId: activityIds[costName] || periodId,
              nodeRefType: 'ACTIVITY',
              economicCategory: 'EXPENSE',
              amount,
              notes: `${costName}: $${amount.toLocaleString()}/yr`,
            }),
          });
          console.log(`    ${costName}: $${amount.toLocaleString()}/yr`);
        } catch (e: any) {
          console.log(`    Line ${costName} failed: ${e.message}`);
        }
      }

      // Compute year total
      let yearTotal = 0;
      for (const cat of COST_CATEGORIES) yearTotal += tier[cat] * 12;
      for (const [, amounts] of Object.entries(ANNUAL_COSTS)) yearTotal += amounts[i];
      console.log(`  ── Year ${year} Total: $${yearTotal.toLocaleString()}/yr ($${Math.round(yearTotal / 12).toLocaleString()}/mo)`);

    } catch (e: any) {
      console.log(`  Budget creation failed for ${label}: ${e.message}`);
    }
  }

  // 7. Create Revenue Activities and budget lines
  console.log('\nCreating revenue streams...');

  const revenueActivities: Record<string, string> = {};
  const revenueLabels: Record<string, string> = {
    'txn-fees': 'Transaction Fee Revenue',
    'premium-saas': 'Charity Partner SaaS Revenue',
  };

  for (const [key, label] of Object.entries(revenueLabels)) {
    try {
      const result = await api<any>('/graph/activities', {
        method: 'POST',
        body: JSON.stringify({ entityId, label, status: 'IN_PROGRESS' }),
      });
      revenueActivities[key] = result.id;
      console.log(`  Activity "${label}": ${result.id}`);
    } catch (e: any) {
      console.log(`  Activity "${label}" failed: ${e.message}`);
    }
  }

  // Link revenue activities to User Growth outcome
  const userGrowthOutcome = outcomeIds['User Growth'];
  for (const [key, actId] of Object.entries(revenueActivities)) {
    if (!actId || !userGrowthOutcome) continue;
    try {
      await api<any>('/graph/edges/contributes-to', {
        method: 'POST',
        body: JSON.stringify({
          sourceId: actId,
          targetId: userGrowthOutcome,
          weight: key === 'txn-fees' ? 0.9 : 0.6,
          confidence: 0.85,
          contributionFunction: 'LINEAR',
        }),
      });
      console.log(`  ${key} → ${userGrowthOutcome.slice(0, 8)}...`);
    } catch (e: any) {
      console.log(`  Edge ${key} failed: ${e.message}`);
    }
  }

  // Link Converted Donors (each year) → Transaction Fee Revenue
  // This closes the loop: acquisition → visitors → registered → donors → revenue
  console.log('\nLinking converted donors to revenue...');
  for (let i = 0; i < convertedDonorMetricIds.length; i++) {
    const cdId = convertedDonorMetricIds[i];
    if (!cdId || !revenueActivities['txn-fees']) continue;
    try {
      await api<any>('/graph/edges/contributes-to', {
        method: 'POST',
        body: JSON.stringify({
          sourceId: cdId,
          targetId: revenueActivities['txn-fees'],
          weight: 0.95,
          confidence: 0.9,
          contributionFunction: 'LINEAR',
        }),
      });
      console.log(`  Converted Donors Yr${i + 1} → Transaction Fee Revenue`);
    } catch (e: any) {
      console.log(`  Edge donors→revenue yr${i + 1} failed: ${e.message}`);
    }
  }

  // Link Give product → User Growth outcome
  if (giveProductId && userGrowthOutcome) {
    try {
      await api<any>('/graph/edges/contributes-to', {
        method: 'POST',
        body: JSON.stringify({
          sourceId: giveProductId,
          targetId: userGrowthOutcome,
          weight: 0.85,
          confidence: 0.9,
          contributionFunction: 'LINEAR',
        }),
      });
      console.log(`  Give → User Growth`);
    } catch (e: any) {
      console.log(`  Edge Give→UserGrowth failed: ${e.message}`);
    }
  }

  // Link Platform resource → IMPROVE_REVENUE outcome (platform enables all revenue)
  const improveRevenueOutcome = outcomeIds['User Growth']; // same outcome
  if (platformId && improveRevenueOutcome) {
    try {
      await api<any>('/graph/edges/contributes-to', {
        method: 'POST',
        body: JSON.stringify({
          sourceId: platformId,
          targetId: improveRevenueOutcome,
          weight: 0.7,
          confidence: 0.85,
          contributionFunction: 'LINEAR',
        }),
      });
      console.log(`  Harness Platform → User Growth`);
    } catch (e: any) {
      console.log(`  Edge Platform→UserGrowth failed: ${e.message}`);
    }
  }

  console.log('\nProjecting revenue by year (CRA-informed model)...');
  for (let i = 0; i < YEARLY_TIERS.length; i++) {
    const periodId = periodIds[i];
    if (!periodId) continue;

    const rev = REVENUE_TIERS[i];
    const activeDonors = Math.round(rev.users * rev.activeDonorPct);
    const totalTransactions = Math.round(activeDonors * rev.donationsPerDonor);
    const donationVolume = totalTransactions * rev.avgDonation;
    const txnFeeRevenue = Math.round(donationVolume * rev.platformFeePct);
    const saasRevenue = rev.premiumCharityPartners * rev.premiumAvgAnnualFee;
    const totalRevenue = txnFeeRevenue + saasRevenue;

    console.log(`\n  ${YEARLY_TIERS[i].label}:`);
    console.log(`    Active donors: ${activeDonors.toLocaleString()} (${(rev.activeDonorPct * 100).toFixed(0)}% of ${rev.users.toLocaleString()} users)`);
    console.log(`    Transactions: ${totalTransactions.toLocaleString()} @ avg $${rev.avgDonation} (CRA median $390)`);
    console.log(`    Donation volume: $${donationVolume.toLocaleString()}`);
    console.log(`    Transaction fee revenue (${(rev.platformFeePct * 100).toFixed(1)}%): $${txnFeeRevenue.toLocaleString()}`);
    console.log(`    SaaS revenue (${rev.premiumCharityPartners} partners × $${rev.premiumAvgAnnualFee}): $${saasRevenue.toLocaleString()}`);
    console.log(`    Total revenue: $${totalRevenue.toLocaleString()}`);

    // Find the budget for this period (re-use existing or create revenue budget)
    const fyYear = 2026 + YEARLY_TIERS[i].year;
    const revBudget = await api<any>('/budgeting/budgets', {
      method: 'POST',
      body: JSON.stringify({
        entityId,
        periodId,
        name: `${YEARLY_TIERS[i].label} — Revenue Budget`,
        description: `Harness Exchange projected revenue for ${YEARLY_TIERS[i].label}`,
        budgetType: 'ANNUAL',
        fiscalYear: fyYear,
        currency: 'CAD',
        createdBy: 'seed-script',
      }),
    });

    // Transaction fee revenue line
    if (revenueActivities['txn-fees']) {
      try {
        await api<any>('/budgeting/lines', {
          method: 'POST',
          body: JSON.stringify({
            budgetId: revBudget.id,
            periodId,
            nodeRefId: revenueActivities['txn-fees'],
            nodeRefType: 'ACTIVITY',
            economicCategory: 'REVENUE',
            amount: txnFeeRevenue,
            notes: `${activeDonors.toLocaleString()} donors × ${rev.donationsPerDonor} txns × $${rev.avgDonation} avg × ${(rev.platformFeePct * 100).toFixed(1)}% fee`,
          }),
        });
      } catch (e: any) {
        console.log(`    Txn fee line failed: ${e.message}`);
      }
    }

    // SaaS revenue line
    if (revenueActivities['premium-saas']) {
      try {
        await api<any>('/budgeting/lines', {
          method: 'POST',
          body: JSON.stringify({
            budgetId: revBudget.id,
            periodId,
            nodeRefId: revenueActivities['premium-saas'],
            nodeRefType: 'ACTIVITY',
            economicCategory: 'REVENUE',
            amount: saasRevenue,
            notes: `${rev.premiumCharityPartners} charity partners × $${rev.premiumAvgAnnualFee.toLocaleString()}/yr avg`,
          }),
        });
      } catch (e: any) {
        console.log(`    SaaS line failed: ${e.message}`);
      }
    }
  }

  // 8. Project revenue into gl_period_balances (via direct PG insert)
  // We do this by POSTing budget lines — the GL projection was already done for expenses.
  // We need to project revenue budget lines into gl_period_balances too.
  // Since we don't have a direct PG endpoint, we'll print the SQL for manual execution.
  console.log('\nProjecting revenue into GL...');
  console.log('  (Revenue budget lines created — GL projection will be done via SQL)');

  // 9. Print 5-year P&L summary
  console.log('\n\n=== 5-YEAR P&L PROJECTION (CRA-Informed Revenue Model) ===\n');
  console.log('Year | Users    | Revenue     | Expenses    | Net Income  | Margin');
  console.log('-----|----------|-------------|-------------|-------------|-------');

  let grandRevenue = 0;
  let grandExpense = 0;
  for (let i = 0; i < YEARLY_TIERS.length; i++) {
    const { year, tier } = YEARLY_TIERS[i];
    const rev = REVENUE_TIERS[i];

    // Expenses
    let yearExpense = 0;
    for (const cat of COST_CATEGORIES) yearExpense += tier[cat] * 12;
    for (const [, amounts] of Object.entries(ANNUAL_COSTS)) yearExpense += amounts[i];

    // Revenue
    const activeDonors = Math.round(rev.users * rev.activeDonorPct);
    const totalTxns = Math.round(activeDonors * rev.donationsPerDonor);
    const donationVol = totalTxns * rev.avgDonation;
    const txnFee = Math.round(donationVol * rev.platformFeePct);
    const saas = rev.premiumCharityPartners * rev.premiumAvgAnnualFee;
    const yearRevenue = txnFee + saas;

    const netIncome = yearRevenue - yearExpense;
    const margin = yearRevenue > 0 ? ((netIncome / yearRevenue) * 100).toFixed(1) : '0.0';

    grandRevenue += yearRevenue;
    grandExpense += yearExpense;

    console.log(
      `  ${year}  | ${String(tier.users).padStart(7)}  | $${String(yearRevenue).padStart(9)} | $${String(yearExpense).padStart(9)} | $${String(netIncome).padStart(9)} | ${margin}%`,
    );
  }
  const grandNet = grandRevenue - grandExpense;
  console.log(`-----|----------|-------------|-------------|-------------|`);
  console.log(`     |          | $${String(grandRevenue).padStart(9)} | $${String(grandExpense).padStart(9)} | $${String(grandNet).padStart(9)} | 5-yr total`);

  console.log('\nRevenue sources:');
  console.log('  Transaction fees: 3.2-3.5% of donation volume (CRA avg donation $390-$500)');
  console.log('  SaaS subscriptions: charity partner analytics & API access ($600-$1,800/yr)');

  console.log('\n=== Done! Open http://localhost:5173/projections to view ===');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
