export {};

/**
 * CI Conversion Funnel + Monthly Cost Model — 2026, 2027, 2028
 *
 * Applies industry-benchmarked conversion rates to CI visitor projections
 * and builds a monthly cost model split into variable (growth-dependent)
 * and fixed (user-independent) categories.
 *
 * Three layers:
 *   1. FUNNEL RATES — industry benchmarks applied to CI visitors
 *   2. VARIABLE COSTS — scale with cumulative registered users
 *   3. FIXED COSTS — independent of user count
 *
 * ══════════════════════════════════════════════════════════════════════════
 * INDUSTRY BENCHMARK ASSUMPTIONS — read this when projections diverge
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── BOUNCE RATE: 58% ──
 *
 *   Definition: % of visitors who leave after viewing only one page
 *   (GA4 "not engaged" = session < 10s, no conversion, no 2nd pageview)
 *
 *   Sources:
 *     - Contentsquare 2024 Digital Experience Benchmarks: nonprofit/
 *       associations sector 40-60%, content-heavy reference sites 55-65%
 *     - Similarweb 2024: "Charity and Philanthropy" category 45-55%
 *     - Charity Navigator (charitynavigator.org): Similarweb estimates
 *       45-55% — closest direct comp as a charity lookup/rating site
 *     - M+R Benchmarks 2024: implies 50-60% for nonprofit info sites
 *       (derived from engagement rate and pages/session data)
 *     - Google Analytics community benchmarks (2023-2024): nonprofit
 *       websites average 50-65% depending on traffic source
 *
 *   Why 58%:
 *     CI is a content-heavy research/lookup site. Users arrive via search
 *     ("is [charity] good?"), check a rating, and leave. This is healthy
 *     behavior — the site answered their question. The 58% sits between
 *     Charity Navigator's lower estimate (better UX, US market) and the
 *     upper range for pure reference sites. CI's seasonal traffic pattern
 *     (Oct-Dec giving season) likely has LOWER bounce due to intent-driven
 *     visitors, while summer months have HIGHER bounce from casual traffic.
 *
 *   GA4 caveat: GA4 measures "engagement rate" (inverse of bounce).
 *     A 58% bounce = 42% engagement rate. GA4 counts a 10s+ visit as
 *     "engaged" even without a second pageview, so GA4 bounce rates
 *     appear ~5-10pp lower than UA bounce rates. Our 58% is a GA4-era
 *     figure. If comparing to pre-2023 UA benchmarks, adjust upward.
 *
 *   Risk: Bounce rate is highly sensitive to traffic source mix. If CI
 *     shifts from organic search (higher bounce) to email/direct (lower
 *     bounce), the rate could drop to 45-50%. Conversely, if paid traffic
 *     increases without landing page optimization, it could rise to 65%+.
 *
 * ── REGISTRATION RATE: 1.8% ──
 *
 *   Definition: % of unique visitors who create an account
 *   (NOT email newsletter signup, which is typically higher)
 *
 *   Sources:
 *     - M+R Benchmarks 2024: nonprofit email list growth 10-12%/yr of
 *       existing list; visitor-to-email-signup 1-3% of all visitors
 *     - Account creation (more friction than email signup): 0.5-2%
 *       on ungated content sites (Glassdoor, Crunchbase free tier)
 *     - Platforms that gate content behind registration: 5-15%
 *       (not applicable — CI should not gate charity ratings)
 *     - SaaS free trial benchmarks: 2-5% visitor-to-trial
 *     - Wikipedia (extreme low, no account features): 0.05%
 *     - Charity Navigator: no public data on account creation rate,
 *       but they offer "My Charities" saved list feature — estimated
 *       1-2% voluntary signup based on similar free research tools
 *
 *   Why 1.8%:
 *     CI does not gate content (and shouldn't — open ratings serve the
 *     mission). Registration must offer clear value: saved charity lists,
 *     donation receipts, personalized recommendations, alerts when a
 *     rated charity's score changes. The 1.8% is above the ungated
 *     baseline (0.5-1.5%) because CI's target audience (engaged donors)
 *     has higher intent than average web visitors, but below the email-
 *     signup benchmark (2-3%) because account creation has more friction.
 *     CanadaHelps likely sees 3-5%+ registration but their visitors arrive
 *     with transactional intent — not a valid comparison.
 *
 *   Risk: If CI launches premium features (detailed reports, tax receipt
 *     tracking) behind a free account wall, registration could reach 4-5%.
 *     If the account offers no compelling value, it may stall at <1%.
 *     Mobile users register at ~0.5x the rate of desktop users — if mobile
 *     share grows, the blended rate drops.
 *
 * ── DONATION RATE: 0.35% ──
 *
 *   Definition: % of unique visitors who complete a donation
 *   (either to CI itself or through CI to a rated charity)
 *
 *   Sources:
 *     - M+R Benchmarks 2024: median nonprofit website donation conversion
 *       0.5-1% of all visitors; top performers 2-3%. But this is for
 *       organizations whose PRIMARY call-to-action is "donate."
 *     - Charity Navigator: estimated <0.3% of visitors donate through
 *       the platform — their primary function is information, not
 *       transaction. Similar to CI's model.
 *     - GiveWell: higher (~1-3%) but self-selected high-intent donor
 *       audience — not a valid comparison for CI's broader traffic.
 *     - CanadaHelps: 10-20%+ donation conversion — but users arrive
 *       specifically to donate (transactional platform). Not comparable.
 *     - Double the Donation 2024: donation PAGE conversion 8-17%,
 *       but this is of visitors who REACH the donate page, not all
 *       visitors. CI's visitor-to-donate-page rate is likely 2-4%.
 *     - Blackbaud 2023 Charitable Giving Report: online giving = ~13%
 *       of total giving; does not report per-visit conversion.
 *     - Network for Good: donation page conversion 10-20% (of those
 *       who reach the page).
 *
 *   Why 0.35%:
 *     CI is an information-first site. Donation is a secondary action.
 *     Most visitors arrive to research a charity and donate ELSEWHERE
 *     (directly on the charity's website, via CanadaHelps, etc.). CI
 *     should track "donation influence" separately from direct conversion.
 *     The 0.35% represents direct platform donations: 0.1% to CI itself
 *     (supporting the evaluator) + 0.25% through CI to rated charities.
 *     This is in line with Charity Navigator's model and the lower end
 *     of M+R Benchmarks for non-transactional nonprofit sites.
 *
 *   Risk: If CI integrates a seamless donation widget (like CanadaHelps
 *     embed), conversion could reach 0.8-1.2%. If donation functionality
 *     is buried or requires leaving the site, it may stay at 0.1-0.2%.
 *     Seasonal variation is extreme: Nov-Dec giving season could see
 *     0.8-1.5% conversion while summer months drop to 0.05-0.15%.
 *
 * ── COST MODEL ASSUMPTIONS ──
 *
 *   Variable costs scale with cumulative registered users (not visitors).
 *   The registered user base grows as visitors convert at 1.8%.
 *   Cost scaling is sub-linear: 2x users ≠ 2x cost (caching, batching,
 *   shared infrastructure absorb marginal load).
 *
 *   Cost tiers interpolated from the Harness Exchange production cost
 *   model (seed-harness-projection.ts) which defines 4 tiers:
 *     Startup (1K users): $91/mo total infra
 *     Growth (10K users): $585/mo total infra
 *     Scale (50K users): $2,330/mo total infra
 *     Enterprise (250K users): $8,265/mo total infra
 *
 *   Variable costs (scale with users):
 *     Compute, Database, Redis, Kafka, LLM/AI tokens, Email, SMS,
 *     CDN/Storage, Search
 *
 *   Fixed costs (independent of user count):
 *     Domain + SSL, Monitoring (step function, not continuous),
 *     PCI-DSS Compliance, Penetration Testing, SOC 2 Audit,
 *     Apple Developer
 *
 *   Growth trajectory maps cumulative registered users (from the CI
 *   funnel) to interpolated cost tiers. If the realistic organic +
 *   realistic paid scenario plays out, cumulative registered users
 *   reach ~7K by end of 2028, placing costs in the Growth tier.
 *
 * Run: npx tsx scripts/seed-ci-funnel-and-costs.ts
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
    if (res.status === 429) {
      await sleep(5000 + attempt * 3000);
      continue;
    }
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`${res.status} ${path}: ${body}`);
    }
    return res.json() as Promise<T>;
  }
  throw new Error(`429 rate limit exceeded after retries: ${path}`);
}

// ── Industry Benchmark Rates ─────────────────────────────────

const BOUNCE_RATE = 0.58;          // 58% — see assumptions above
const REGISTRATION_RATE = 0.018;   // 1.8% of visitors create accounts
const DONATION_RATE = 0.0035;      // 0.35% of visitors donate

// Seasonal modifiers for rates (relative to annual average)
// Giving season (Oct-Dec) has lower bounce, higher donation
// Summer (Jun-Aug) has higher bounce, lower donation
const SEASONAL_BOUNCE_MOD: Record<number, number> = {
  1: 1.00, 2: 1.02, 3: 1.01, 4: 1.03, 5: 1.05, 6: 1.07,
  7: 1.08, 8: 1.08, 9: 1.02, 10: 0.93, 11: 0.88, 12: 0.85,
};
const SEASONAL_DONATION_MOD: Record<number, number> = {
  1: 0.90, 2: 0.75, 3: 0.80, 4: 0.70, 5: 0.65, 6: 0.55,
  7: 0.50, 8: 0.50, 9: 0.70, 10: 1.10, 11: 1.60, 12: 2.20,
};
const SEASONAL_REG_MOD: Record<number, number> = {
  1: 1.05, 2: 0.95, 3: 1.00, 4: 0.95, 5: 0.90, 6: 0.85,
  7: 0.80, 8: 0.80, 9: 0.95, 10: 1.10, 11: 1.20, 12: 1.30,
};

// ── Cost Model (monthly, USD) ────────────────────────────────

// Variable costs: per-user-month at different tier breakpoints
// Interpolated log-linearly between tiers
interface CostTier {
  users: number;
  compute: number;
  database: number;
  redis: number;
  kafka: number;
  llm: number;
  email: number;
  sms: number;
  cdn: number;
  search: number;
}

const VARIABLE_TIERS: CostTier[] = [
  { users: 0,       compute: 20,  database: 10,  redis: 0,   kafka: 0,   llm: 5,   email: 0,  sms: 0,  cdn: 3,   search: 0 },
  { users: 1_000,   compute: 35,  database: 18,  redis: 5,   kafka: 0,   llm: 10,  email: 0,  sms: 2,  cdn: 6,   search: 0 },
  { users: 10_000,  compute: 85,  database: 100, redis: 35,  kafka: 55,  llm: 100, email: 30, sms: 25, cdn: 35,  search: 75 },
  { users: 50_000,  compute: 400, database: 375, redis: 150, kafka: 200, llm: 475, email: 75, sms: 90, cdn: 170, search: 300 },
  { users: 250_000, compute: 1050,database: 1400,redis: 300, kafka: 1000,llm: 2350,email: 300,sms: 450,cdn: 500, search: 700 },
];

const VARIABLE_CATEGORIES = ['compute', 'database', 'redis', 'kafka', 'llm', 'email', 'sms', 'cdn', 'search'] as const;

const VARIABLE_LABELS: Record<string, string> = {
  compute: 'Compute & Hosting',
  database: 'PostgreSQL + pgvector',
  redis: 'Redis Cache',
  kafka: 'Kafka / Event Streaming',
  llm: 'AI/LLM Tokens (Claude)',
  email: 'Email (Resend)',
  sms: 'SMS (Twilio)',
  cdn: 'CDN + Storage (S3/CF)',
  search: 'Search (Elasticsearch)',
};

// Fixed costs (monthly, independent of user count)
interface FixedCosts {
  domain: number;       // Domain + SSL
  monitoring: number;   // Monitoring & Observability
  pciDss: number;       // PCI-DSS compliance (annualized to monthly)
  penTest: number;      // Penetration testing (annualized)
  soc2: number;         // SOC 2 audit (annualized)
  appleDev: number;     // Apple Developer (annualized)
}

// Fixed costs step up at specific dates (maturity-driven, not user-driven)
const FIXED_COSTS_BY_YEAR: Record<number, FixedCosts> = {
  2026: {
    domain: 15,
    monitoring: 0,       // Free tier (Grafana Cloud, etc.)
    pciDss: 21,          // $250/yr ÷ 12
    penTest: 417,        // $5,000/yr ÷ 12
    soc2: 0,             // Not started yet
    appleDev: 8,         // $99/yr ÷ 12
  },
  2027: {
    domain: 15,
    monitoring: 30,      // Basic paid monitoring
    pciDss: 21,          // $250/yr
    penTest: 417,        // $5,000/yr
    soc2: 2083,          // $25,000/yr ÷ 12 — first SOC 2 audit
    appleDev: 8,
  },
  2028: {
    domain: 15,
    monitoring: 50,      // Expanded monitoring (more services)
    pciDss: 42,          // $500/yr
    penTest: 833,        // $10,000/yr
    soc2: 2500,          // $30,000/yr
    appleDev: 8,
  },
};

const FIXED_LABELS: Record<string, string> = {
  domain: 'Domain + SSL',
  monitoring: 'Monitoring & Observability',
  pciDss: 'PCI-DSS Compliance',
  penTest: 'Penetration Testing',
  soc2: 'SOC 2 Type II Audit',
  appleDev: 'Apple Developer Program',
};

// ── Interpolation ────────────────────────────────────────────

function interpolateVariableCost(users: number, category: keyof CostTier): number {
  if (users <= 0) return (VARIABLE_TIERS[0] as any)[category];

  for (let i = 1; i < VARIABLE_TIERS.length; i++) {
    if (users <= VARIABLE_TIERS[i].users) {
      const low = VARIABLE_TIERS[i - 1];
      const high = VARIABLE_TIERS[i];
      // Log-linear interpolation (sub-linear cost scaling)
      const logLow = Math.log(Math.max(1, low.users));
      const logHigh = Math.log(high.users);
      const logUsers = Math.log(users);
      const t = (logUsers - logLow) / (logHigh - logLow);
      return Math.round((low as any)[category] * (1 - t) + (high as any)[category] * t);
    }
  }
  // Above highest tier — extrapolate linearly from last two tiers
  const secondLast = VARIABLE_TIERS[VARIABLE_TIERS.length - 2];
  const last = VARIABLE_TIERS[VARIABLE_TIERS.length - 1];
  const t = (users - secondLast.users) / (last.users - secondLast.users);
  return Math.round((secondLast as any)[category] * (1 - t) + (last as any)[category] * t);
}

// ── CI Visitor Baseline (from seed-ci-visitor-projection.ts) ──

const ACTUALS: Record<number, number[]> = {
  2023: [34311, 35056, 29893, 28063, 23617, 21909, 21207, 22542, 24859, 34995, 39769, 38123],
  2024: [28612, 25340, 26697, 26414, 25195, 21905, 22073, 20688, 24615, 35534, 36878, 43458],
  2025: [28785, 24232, 28356, 24121, 25487, 23274, 21735, 19928, 27383, 28699, 37301, 42000],
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function computeSeasonalIndices(): number[] {
  const indices: number[] = [];
  for (let m = 0; m < 12; m++) {
    const proportions: number[] = [];
    for (const year of [2023, 2024, 2025]) {
      const annual = ACTUALS[year].reduce((a, b) => a + b, 0);
      proportions.push(ACTUALS[year][m] / annual);
    }
    indices.push(proportions.reduce((a, b) => a + b, 0) / proportions.length);
  }
  return indices;
}

function computeLinearTrend(seasonalIndices: number[]): { slope: number; intercept: number } {
  const months: number[] = [];
  const values: number[] = [];
  let t = 0;
  for (const year of [2023, 2024, 2025]) {
    for (let m = 0; m < 12; m++) {
      months.push(t);
      values.push(ACTUALS[year][m] / seasonalIndices[m]);
      t++;
    }
  }
  const n = months.length;
  const sumX = months.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = months.reduce((a, x, i) => a + x * values[i], 0);
  const sumXX = months.reduce((a, x) => a + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

// ── Build Monthly Projections ────────────────────────────────

interface MonthData {
  year: number;
  month: number;
  label: string;
  periodStart: string;
  periodEnd: string;

  // Visitors (from baseline — the "realistic" scenario uses baseline only
  // since organic + paid are separate budgets in the CI visitor projection)
  visitors: number;

  // Funnel
  bounceRate: number;
  engagedVisitors: number;
  registrations: number;
  cumulativeRegistered: number;
  donations: number;
  donationRate: number;

  // Costs (USD/month)
  variableCosts: Record<string, number>;
  variableTotal: number;
  fixedCosts: Record<string, number>;
  fixedTotal: number;
  totalCost: number;
}

function buildMonthlyProjections(): MonthData[] {
  const seasonalIndices = computeSeasonalIndices();
  const trend = computeLinearTrend(seasonalIndices);

  const results: MonthData[] = [];
  let cumulativeRegistered = 0;

  for (const year of [2026, 2027, 2028]) {
    for (let m = 0; m < 12; m++) {
      const monthNum = m + 1;
      const t = (year - 2023) * 12 + m;
      const deseasonalized = trend.slope * t + trend.intercept;
      const visitors = Math.max(0, Math.round(deseasonalized * seasonalIndices[m]));

      const lastDay = new Date(year, monthNum, 0).getDate();

      // Apply seasonal modifiers to benchmark rates
      const bounceRate = Math.min(0.85, Math.max(0.35,
        BOUNCE_RATE * SEASONAL_BOUNCE_MOD[monthNum]));
      const engagedVisitors = Math.round(visitors * (1 - bounceRate));

      const regRate = REGISTRATION_RATE * SEASONAL_REG_MOD[monthNum];
      const registrations = Math.round(visitors * regRate);
      cumulativeRegistered += registrations;

      const donRate = DONATION_RATE * SEASONAL_DONATION_MOD[monthNum];
      const donations = Math.round(visitors * donRate);

      // Variable costs based on cumulative registered users
      const variableCosts: Record<string, number> = {};
      let variableTotal = 0;
      for (const cat of VARIABLE_CATEGORIES) {
        const cost = interpolateVariableCost(cumulativeRegistered, cat);
        variableCosts[cat] = cost;
        variableTotal += cost;
      }

      // Fixed costs based on year
      const fixed = FIXED_COSTS_BY_YEAR[year];
      const fixedCosts: Record<string, number> = { ...fixed } as unknown as Record<string, number>;
      let fixedTotal = 0;
      for (const val of Object.values(fixed)) fixedTotal += val;

      results.push({
        year,
        month: monthNum,
        label: `${MONTHS[m]} ${year}`,
        periodStart: `${year}-${String(monthNum).padStart(2, '0')}-01`,
        periodEnd: `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
        visitors,
        bounceRate,
        engagedVisitors,
        registrations,
        cumulativeRegistered,
        donations,
        donationRate: donRate,
        variableCosts,
        variableTotal,
        fixedCosts,
        fixedTotal,
        totalCost: variableTotal + fixedTotal,
      });
    }
  }

  return results;
}

// ── Print Summary ────────────────────────────────────────────

function printSummary(data: MonthData[]) {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  CI Conversion Funnel + Monthly Cost Model (2026-2028)');
  console.log('══════════════════════════════════════════════════════════════');

  console.log('\n── INDUSTRY BENCHMARK RATES ──');
  console.log(`  Bounce rate:       ${(BOUNCE_RATE * 100).toFixed(0)}%  (Contentsquare 2024, M+R, Similarweb)`);
  console.log(`  Registration rate: ${(REGISTRATION_RATE * 100).toFixed(1)}% (M+R Benchmarks, ungated content site avg)`);
  console.log(`  Donation rate:     ${(DONATION_RATE * 100).toFixed(2)}% (M+R, Charity Navigator model, info-first site)`);

  // Annual summaries
  for (const year of [2026, 2027, 2028]) {
    const yearData = data.filter((d) => d.year === year);
    const totalVisitors = yearData.reduce((a, d) => a + d.visitors, 0);
    const totalEngaged = yearData.reduce((a, d) => a + d.engagedVisitors, 0);
    const totalRegs = yearData.reduce((a, d) => a + d.registrations, 0);
    const totalDonations = yearData.reduce((a, d) => a + d.donations, 0);
    const endRegistered = yearData[yearData.length - 1].cumulativeRegistered;
    const totalVarCost = yearData.reduce((a, d) => a + d.variableTotal, 0);
    const totalFixedCost = yearData.reduce((a, d) => a + d.fixedTotal, 0);
    const totalCost = totalVarCost + totalFixedCost;

    console.log(`\n── ${year} ANNUAL SUMMARY ──`);
    console.log(`  Visitors:              ${totalVisitors.toLocaleString()}`);
    console.log(`  Engaged (non-bounce):  ${totalEngaged.toLocaleString()} (${((totalEngaged / totalVisitors) * 100).toFixed(0)}%)`);
    console.log(`  New registrations:     ${totalRegs.toLocaleString()} (${((totalRegs / totalVisitors) * 100).toFixed(1)}% of visitors)`);
    console.log(`  Cumulative registered: ${endRegistered.toLocaleString()} (end of year)`);
    console.log(`  Donations:             ${totalDonations.toLocaleString()} (${((totalDonations / totalVisitors) * 100).toFixed(2)}% of visitors)`);
    console.log(`  Variable costs:        $${totalVarCost.toLocaleString()}/yr ($${Math.round(totalVarCost / 12).toLocaleString()}/mo avg)`);
    console.log(`  Fixed costs:           $${totalFixedCost.toLocaleString()}/yr ($${Math.round(totalFixedCost / 12).toLocaleString()}/mo avg)`);
    console.log(`  Total costs:           $${totalCost.toLocaleString()}/yr ($${Math.round(totalCost / 12).toLocaleString()}/mo avg)`);
  }

  // Monthly detail table for funnel
  console.log('\n── MONTHLY FUNNEL (Baseline Visitors Only) ──');
  console.log('┌──────────┬──────────┬────────┬────────┬─────────┬──────────┐');
  console.log('│  Month   │ Visitors │ Bounce │ Regist │ Cum Reg │ Donation │');
  console.log('├──────────┼──────────┼────────┼────────┼─────────┼──────────┤');
  for (const d of data) {
    if (d.month === 1 || d.month === 6 || d.month === 12) {
      console.log(
        `│ ${d.label.padEnd(8)} │ ${String(d.visitors.toLocaleString()).padStart(8)} │ ${(d.bounceRate * 100).toFixed(0).padStart(4)}%  │ ${String(d.registrations.toLocaleString()).padStart(5)}  │ ${String(d.cumulativeRegistered.toLocaleString()).padStart(7)} │ ${String(d.donations.toLocaleString()).padStart(6)}   │`,
      );
    }
  }
  console.log('└──────────┴──────────┴────────┴────────┴─────────┴──────────┘');
  console.log('  (Showing Jan, Jun, Dec of each year — full 36 months seeded)');

  // Monthly cost breakdown table
  console.log('\n── MONTHLY COSTS (Variable vs Fixed) ──');
  console.log('┌──────────┬─────────┬──────────┬──────────┬──────────┐');
  console.log('│  Month   │ Reg Usr │ Variable │   Fixed  │   Total  │');
  console.log('├──────────┼─────────┼──────────┼──────────┼──────────┤');
  for (const d of data) {
    if (d.month === 1 || d.month === 6 || d.month === 12) {
      console.log(
        `│ ${d.label.padEnd(8)} │ ${String(d.cumulativeRegistered.toLocaleString()).padStart(7)} │ $${String(d.variableTotal.toLocaleString()).padStart(7)}  │ $${String(d.fixedTotal.toLocaleString()).padStart(7)} │ $${String(d.totalCost.toLocaleString()).padStart(7)} │`,
      );
    }
  }
  console.log('└──────────┴─────────┴──────────┴──────────┴──────────┘');

  // Variable cost breakdown by category
  const lastMonth = data[data.length - 1];
  console.log(`\n── VARIABLE COST BREAKDOWN (Dec 2028, ${lastMonth.cumulativeRegistered.toLocaleString()} registered users) ──`);
  for (const cat of VARIABLE_CATEGORIES) {
    const cost = lastMonth.variableCosts[cat];
    console.log(`  ${VARIABLE_LABELS[cat].padEnd(28)} $${String(cost).padStart(6)}/mo`);
  }
  console.log(`  ${'─'.repeat(28)} ${'─'.repeat(9)}`);
  console.log(`  ${'Variable subtotal'.padEnd(28)} $${String(lastMonth.variableTotal).padStart(6)}/mo`);

  console.log(`\n── FIXED COST BREAKDOWN (2028) ──`);
  const fixed2028 = FIXED_COSTS_BY_YEAR[2028];
  for (const [key, val] of Object.entries(fixed2028)) {
    console.log(`  ${FIXED_LABELS[key].padEnd(28)} $${String(val).padStart(6)}/mo`);
  }
  console.log(`  ${'─'.repeat(28)} ${'─'.repeat(9)}`);
  console.log(`  ${'Fixed subtotal'.padEnd(28)} $${String(lastMonth.fixedTotal).padStart(6)}/mo`);

  console.log(`\n  ${'TOTAL'.padEnd(28)} $${String(lastMonth.totalCost).padStart(6)}/mo`);
}

// ── Delete Old Data ──────────────────────────────────────────

async function deleteOldData(entityId: string) {
  console.log('\n── Deleting old funnel/cost projection data ──');

  const budgets = await api<{ budgets: any[] }>(`/budgeting/budgets/by-entity/${entityId}`);
  const oldBudgets = budgets.budgets.filter(
    (b: any) => b.created_by === 'seed-ci-funnel-costs',
  );

  for (const budget of oldBudgets) {
    try {
      await api(`/budgeting/budgets/${budget.id}`, { method: 'DELETE' });
      console.log(`  Deleted budget: ${budget.name}`);
    } catch (e: any) {
      console.log(`  Could not delete budget ${budget.name}: ${e.message}`);
    }
  }

  // Delete old metric nodes
  const metricsResp = await api<{ items: any[] }>(`/graph/metrics/by-entity/${entityId}`);
  const oldMetrics = (metricsResp.items || []).filter(
    (m: any) => m.label?.startsWith('CI Bounce') ||
      m.label?.startsWith('CI Registration') ||
      m.label?.startsWith('CI Donation') ||
      m.label?.startsWith('CI Engaged') ||
      m.label?.startsWith('CI Cumulative'),
  );
  for (const m of oldMetrics) {
    try {
      await api(`/graph/metrics/${m.id}`, { method: 'DELETE' });
      console.log(`  Deleted metric: ${m.label}`);
    } catch { /* ok */ }
  }

  // Delete old periods
  const periods = await api<{ items: any[] }>(`/graph/periods/by-entity/${entityId}`);
  const oldPeriods = (periods.items || []).filter(
    (p: any) => p.label?.includes('(Funnel)') || p.label?.includes('(VarCost)') || p.label?.includes('(FixCost)'),
  );
  for (const p of oldPeriods) {
    try {
      await api(`/graph/periods/${p.id}`, { method: 'DELETE' });
    } catch { /* ok */ }
  }

  console.log(`  Cleanup: ${oldBudgets.length} budgets, ${oldPeriods.length} periods removed`);
}

// ── Seed Data ────────────────────────────────────────────────

async function seedFunnelAndCosts(entityId: string, data: MonthData[]) {
  console.log('\n── Seeding funnel metrics + cost budgets ──\n');

  // Create metric nodes
  const metricDefs = [
    { label: 'CI Engaged Visitors', type: 'VOLUME', current: 0, target: 200000 },
    { label: 'CI Cumulative Registrations', type: 'VOLUME', current: 0, target: 10000 },
    { label: 'CI Donations', type: 'VOLUME', current: 0, target: 2000 },
  ];

  const metricIds: Record<string, string> = {};
  for (const def of metricDefs) {
    try {
      const metric = await api<{ id: string }>('/graph/metrics', {
        method: 'POST',
        body: JSON.stringify({
          entityId,
          label: def.label,
          metricType: def.type,
          currentValue: def.current,
          targetValue: def.target,
          unit: def.label.includes('Donation') ? 'donations' : 'users',
        }),
      });
      metricIds[def.label] = metric.id;
      console.log(`  Created metric: ${def.label} (${metric.id})`);
    } catch (e: any) {
      console.log(`  Metric error: ${e.message}`);
    }
  }

  // ── 1. Funnel Budget (36 monthly lines) ──
  const funnelBudget = await api<{ id: string }>('/budgeting/budgets', {
    method: 'POST',
    body: JSON.stringify({
      entityId,
      name: 'FY2026-2028 — CI Conversion Funnel (Baseline)',
      description: `Industry-benchmarked conversion funnel applied to CI baseline visitors. ` +
        `Bounce ${(BOUNCE_RATE * 100).toFixed(0)}% (Contentsquare/M+R), ` +
        `Registration ${(REGISTRATION_RATE * 100).toFixed(1)}% (M+R ungated avg), ` +
        `Donation ${(DONATION_RATE * 100).toFixed(2)}% (Charity Navigator model).`,
      fiscalYear: 2026,
      currency: 'CAD',
      createdBy: 'seed-ci-funnel-costs',
    }),
  });
  console.log(`\n  ▸ Funnel budget: ${funnelBudget.id}`);

  for (const d of data) {
    const period = await api<{ id: string }>('/graph/periods', {
      method: 'POST',
      body: JSON.stringify({
        entityId,
        label: `${d.label} (Funnel)`,
        startDate: d.periodStart,
        endDate: d.periodEnd,
      }),
    });

    // Engaged visitors line
    if (metricIds['CI Engaged Visitors']) {
      await api('/budgeting/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId: funnelBudget.id,
          periodId: period.id,
          nodeRefId: metricIds['CI Engaged Visitors'],
          nodeRefType: 'METRIC',
          economicCategory: 'REVENUE',
          amount: d.engagedVisitors,
          notes: `${d.visitors.toLocaleString()} visitors × ${((1 - d.bounceRate) * 100).toFixed(0)}% engaged = ${d.engagedVisitors.toLocaleString()} — ${d.label}`,
        }),
      });
    }

    // Registrations line
    if (metricIds['CI Cumulative Registrations']) {
      await api('/budgeting/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId: funnelBudget.id,
          periodId: period.id,
          nodeRefId: metricIds['CI Cumulative Registrations'],
          nodeRefType: 'METRIC',
          economicCategory: 'REVENUE',
          amount: d.registrations,
          notes: `+${d.registrations.toLocaleString()} new registrations (${(REGISTRATION_RATE * 100).toFixed(1)}% × seasonal), cumulative: ${d.cumulativeRegistered.toLocaleString()} — ${d.label}`,
        }),
      });
    }

    // Donations line
    if (metricIds['CI Donations']) {
      await api('/budgeting/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId: funnelBudget.id,
          periodId: period.id,
          nodeRefId: metricIds['CI Donations'],
          nodeRefType: 'METRIC',
          economicCategory: 'REVENUE',
          amount: d.donations,
          notes: `${d.donations.toLocaleString()} donations (${(d.donationRate * 100).toFixed(2)}% of ${d.visitors.toLocaleString()} visitors) — ${d.label}`,
        }),
      });
    }
  }
  const totalRegs = data[data.length - 1].cumulativeRegistered;
  const totalDonations = data.reduce((a, d) => a + d.donations, 0);
  console.log(`    36 months: ${totalRegs.toLocaleString()} cumulative registrations, ${totalDonations.toLocaleString()} total donations`);

  // ── 2. Variable Costs Budget (36 monthly lines) ──
  const varBudget = await api<{ id: string }>('/budgeting/budgets', {
    method: 'POST',
    body: JSON.stringify({
      entityId,
      name: 'FY2026-2028 — Variable Costs (growth-dependent)',
      description: 'Infrastructure costs that scale with registered user count: ' +
        'compute, database, redis, kafka, LLM tokens, email, SMS, CDN, search. ' +
        'Interpolated from 4-tier production cost model (startup→growth→scale→enterprise). ' +
        'Sub-linear scaling: log-linear interpolation between tier breakpoints.',
      fiscalYear: 2026,
      currency: 'USD',
      createdBy: 'seed-ci-funnel-costs',
    }),
  });
  console.log(`\n  ▸ Variable costs budget: ${varBudget.id}`);

  for (const d of data) {
    const period = await api<{ id: string }>('/graph/periods', {
      method: 'POST',
      body: JSON.stringify({
        entityId,
        label: `${d.label} (VarCost)`,
        startDate: d.periodStart,
        endDate: d.periodEnd,
      }),
    });

    for (const cat of VARIABLE_CATEGORIES) {
      const cost = d.variableCosts[cat];
      if (cost === 0) continue;
      await api('/budgeting/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId: varBudget.id,
          periodId: period.id,
          nodeRefId: varBudget.id, // self-ref as fallback
          nodeRefType: 'ACTIVITY',
          economicCategory: 'EXPENSE',
          amount: cost,
          notes: `${VARIABLE_LABELS[cat]}: $${cost}/mo @ ${d.cumulativeRegistered.toLocaleString()} registered users — ${d.label}`,
        }),
      });
    }
  }
  const totalVarCost = data.reduce((a, d) => a + d.variableTotal, 0);
  console.log(`    36 months variable: $${totalVarCost.toLocaleString()} total`);

  // ── 3. Fixed Costs Budget (36 monthly lines) ──
  const fixBudget = await api<{ id: string }>('/budgeting/budgets', {
    method: 'POST',
    body: JSON.stringify({
      entityId,
      name: 'FY2026-2028 — Fixed Costs (user-independent)',
      description: 'Costs independent of user count: domain/SSL, monitoring, PCI-DSS compliance, ' +
        'penetration testing, SOC 2 audit, Apple Developer. Step up by maturity year, not user growth.',
      fiscalYear: 2026,
      currency: 'USD',
      createdBy: 'seed-ci-funnel-costs',
    }),
  });
  console.log(`\n  ▸ Fixed costs budget: ${fixBudget.id}`);

  for (const d of data) {
    const period = await api<{ id: string }>('/graph/periods', {
      method: 'POST',
      body: JSON.stringify({
        entityId,
        label: `${d.label} (FixCost)`,
        startDate: d.periodStart,
        endDate: d.periodEnd,
      }),
    });

    const fixed = FIXED_COSTS_BY_YEAR[d.year];
    for (const [key, val] of Object.entries(fixed)) {
      if (val === 0) continue;
      await api('/budgeting/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId: fixBudget.id,
          periodId: period.id,
          nodeRefId: fixBudget.id,
          nodeRefType: 'ACTIVITY',
          economicCategory: 'EXPENSE',
          amount: val,
          notes: `${FIXED_LABELS[key]}: $${val}/mo (fixed, ${d.year}) — ${d.label}`,
        }),
      });
    }
  }
  const totalFixCost = data.reduce((a, d) => a + d.fixedTotal, 0);
  console.log(`    36 months fixed: $${totalFixCost.toLocaleString()} total`);

  console.log(`\n✓ Seeded successfully:`);
  console.log(`  1 Funnel budget (3 metrics × 36 months = 108 lines)`);
  console.log(`  1 Variable cost budget (up to ${VARIABLE_CATEGORIES.length} categories × 36 months)`);
  console.log(`  1 Fixed cost budget (up to ${Object.keys(FIXED_LABELS).length} categories × 36 months)`);
  console.log(`  Total 3-year cost: $${(totalVarCost + totalFixCost).toLocaleString()}`);
}

// ── Entry Point ──────────────────────────────────────────────

async function main() {
  const data = buildMonthlyProjections();
  printSummary(data);

  console.log('\n── Seeding into EBG ──');

  // Find Harness Good entity (CI is modeled under Harness Good)
  const entities = await api<{ entities: any[] }>('/graph/entities');
  const entity = entities.entities.find(
    (e: any) => e.label === 'Harness Good' || e.label === 'Charity Intelligence',
  );
  if (!entity) throw new Error('Entity not found (Harness Good or Charity Intelligence)');
  const entityId = entity.id;
  console.log(`  Entity: ${entity.label} (${entityId})`);

  await deleteOldData(entityId);
  await seedFunnelAndCosts(entityId, data);
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
