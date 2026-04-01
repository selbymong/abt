export {};

/**
 * CI (Charity Intelligence) Monthly Visitor Projection — 2026, 2027, 2028
 *
 * Three layers, each loaded separately:
 *   1. BASELINE — straight-line trend (what happens with zero intervention)
 *   2. ORGANIC GROWTH — incremental lift above baseline from SEO/content (3 scenarios)
 *   3. PAID MEDIA — incremental lift from ad spend (3 scenarios)
 *
 * Total users = Baseline + Organic scenario + Paid scenario
 *
 * Methodology:
 *   1. Straight-line monthly trend from 36 months of GA4 data (2023-2025)
 *   2. Seasonal decomposition: multiplicative seasonal indices from 3-year average
 *   3. Baseline = the straight-line projection (loaded as its own budget)
 *   4. Organic growth scenarios = incremental users above baseline
 *   5. Paid media scenarios = incremental new-user acquisition channel
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ASSUMPTIONS LOG — read this when projections diverge from reality
 * ══════════════════════════════════════════════════════════════════════════
 *
 * DATA SOURCES:
 *   - GA4 monthly active users: /mnt/c/temp/ci/2023 Monthly Ci Webpage Data.xlsx
 *   - GA4 monthly active users: /mnt/c/temp/ci/2024 Monthly Ci Webpage Data.xlsx
 *   - GA4 monthly active users: /mnt/c/temp/ci/2025 Monthly Ci Webpage Data.xlsx
 *   - Dec 2025 is partial (to Dec 15); estimated full month at 42,000 (55% rule)
 *   - Webstats Summary confirms same directional trend (peaked 2022, declining since)
 *
 * STRAIGHT-LINE TREND:
 *   - Linear regression on 36 deseasonalized monthly data points
 *   - Gives a per-month slope (users/month decline)
 *   - Does NOT assume any inflection or recovery
 *   - If the organic decline accelerates or reverses, the trend is wrong
 *
 * SEASONAL INDICES:
 *   - Oct-Dec = ~33% of annual traffic (Giving Tuesday + year-end giving)
 *   - Aug = trough (~6.2% of annual)
 *   - Assumes seasonality is STABLE — if CI changes its content calendar
 *     (e.g., major spring campaign), seasonality will shift
 *
 * BASELINE:
 *   - Loaded as its own budget (1 budget, 36 monthly lines)
 *   - Represents CI's existing user base projected forward with no intervention
 *   - This is NOT a scenario — it is always present as the foundation
 *
 * ORGANIC GROWTH SCENARIOS (incremental above baseline):
 *   - All scenarios are ADDITIVE to the baseline
 *   - Conservative: 0 incremental users — no SEO/content investment
 *     Baseline alone captures the trajectory. Conservative = do nothing.
 *   - Realistic: ~10K incremental users/year growing to ~24K by year 3
 *     Source: M+R Benchmarks — nonprofits investing in SEO see 5-15%
 *     annual growth; 3% lift in year 2, 8% lift by year 3
 *     CanadaHelps achieved 25-30% CAGR during growth years
 *   - Ambitious: ~10K year 1, ~31K year 2, ~66K year 3 incremental
 *     Source: M+R Benchmarks — active content marketing yields 15-25%;
 *     Airbnb achieved 80-100% via supply-driven SEO (listing pages);
 *     LinkedIn grew 50-60% via viral loops. Discounted 70% for nonprofit.
 *   - RISK: Organic growth depends on SEO investment, content velocity,
 *     and Google algorithm stability. A core update could negate gains.
 *
 * PAID MEDIA SCENARIOS (incremental above baseline):
 *   - All scenarios are ADDITIVE to baseline + organic
 *   - Conservative: Google Ad Grants only ($10K/mo free ads)
 *     ~2,500 incremental users/month growing 5%/year
 *     Source: Google Ad Grants benchmark for well-optimized nonprofits
 *     delivers 20-40% traffic lift; at CI's base = ~2,000-4,000/month
 *   - Realistic: Ad Grants + $2K/mo social budget
 *     ~6,000 incremental users/month growing 15%/year
 *     Source: Nonprofit paid acquisition CPAs of $3-15/donor (M+R);
 *     $2K social at $5 CPA = ~400 conversions + awareness lift
 *   - Ambitious: Full paid strategy ($5K/mo + Ad Grants)
 *     ~12,000 incremental users/month growing 25%/year
 *     Source: LinkedIn early growth ~50-60%/yr via viral loops;
 *     Airbnb ~80-100% via SEO + paid; discounted heavily for
 *     nonprofit context. CanadaHelps at ~25-30% CAGR is best comp.
 *   - RISK: Paid growth has diminishing returns. Doubling spend yields
 *     ~1.5-1.7x users (not 2x). CAC rises as easy audiences exhaust.
 *     Paid users may have lower engagement than organic visitors.
 *
 * PLATFORM GROWTH COMPS USED:
 *   - Uber (2012-2016): 200-300% → 80% → 35% — hyper-funded, not applicable
 *     to nonprofit but informs ceiling for paid-heavy strategies
 *   - Airbnb (2012-2017): 80-100% → 40-50% → 15-30% — supply-driven SEO
 *     growth is most relevant comp for CI's charity-listing-driven traffic
 *   - LinkedIn (2007-2015): 60-90% → 35-40% → 15% — viral/organic loop;
 *     relevant for CI's "someone viewed your charity" engagement model
 *   - CanadaHelps (2012-2023): 25-30% CAGR → 5-10% mature — BEST COMP;
 *     Canadian, nonprofit, charity-adjacent, similar audience
 *   - M+R Benchmarks (2023): 4-10% organic growth for established nonprofits
 *
 * Run: npx tsx scripts/seed-ci-visitor-projection.ts
 */

const BASE = 'http://localhost:4000/api';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let apiCallCount = 0;
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  // Throttle: pause every 50 calls to stay under rate limit
  apiCallCount++;
  if (apiCallCount % 50 === 0) {
    await sleep(1000);
  }
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

// ── Historical GA4 Active Users (monthly) ─────────────────────

const ACTUALS: Record<number, number[]> = {
  // [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
  2023: [34311, 35056, 29893, 28063, 23617, 21909, 21207, 22542, 24859, 34995, 39769, 38123],
  2024: [28612, 25340, 26697, 26414, 25195, 21905, 22073, 20688, 24615, 35534, 36878, 43458],
  2025: [28785, 24232, 28356, 24121, 25487, 23274, 21735, 19928, 27383, 28699, 37301, 42000],
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── Seasonal Decomposition ────────────────────────────────────

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

// ── Straight-line Trend (linear regression on deseasonalized data) ──

function computeLinearTrend(seasonalIndices: number[]): { slope: number; intercept: number } {
  // Flatten 36 months of actuals into a series
  const months: number[] = [];
  const values: number[] = [];
  let t = 0;
  for (const year of [2023, 2024, 2025]) {
    for (let m = 0; m < 12; m++) {
      months.push(t);
      // Deseasonalize: divide actual by seasonal index to get trend component
      values.push(ACTUALS[year][m] / seasonalIndices[m]);
      t++;
    }
  }

  // Linear regression: y = slope * x + intercept
  const n = months.length;
  const sumX = months.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = months.reduce((a, x, i) => a + x * values[i], 0);
  const sumXX = months.reduce((a, x) => a + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

// ── Projection Engine ─────────────────────────────────────────

interface MonthProjection {
  year: number;
  month: number;
  label: string;
  users: number;
  periodStart: string;
  periodEnd: string;
}

interface ScenarioResult {
  channel: 'BASELINE' | 'ORGANIC_GROWTH' | 'PAID_MEDIA';
  scenario: 'BASELINE' | 'CONSERVATIVE' | 'REALISTIC' | 'AMBITIOUS';
  name: string;
  description: string;
  months: MonthProjection[];
  annualTotals: Record<number, number>;
}

function projectMonths(
  seasonalIndices: number[],
  annualUsersByYear: Record<number, number>,
): MonthProjection[] {
  const results: MonthProjection[] = [];
  for (const year of [2026, 2027, 2028]) {
    const annualTotal = annualUsersByYear[year];
    for (let m = 0; m < 12; m++) {
      const monthNum = m + 1;
      const lastDay = new Date(year, monthNum, 0).getDate();
      results.push({
        year,
        month: monthNum,
        label: `${MONTHS[m]} ${year}`,
        users: Math.max(0, Math.round(annualTotal * seasonalIndices[m])),
        periodStart: `${year}-${String(monthNum).padStart(2, '0')}-01`,
        periodEnd: `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
      });
    }
  }
  return results;
}

function buildAllScenarios(): ScenarioResult[] {
  const seasonalIndices = computeSeasonalIndices();
  const trend = computeLinearTrend(seasonalIndices);

  // Straight-line annualized values
  const straightLineAnnual = (year: number): number => {
    let total = 0;
    for (let m = 0; m < 12; m++) {
      const t = (year - 2023) * 12 + m;
      const deseasonalizedMonthly = trend.slope * t + trend.intercept;
      total += deseasonalizedMonthly * seasonalIndices[m];
    }
    return Math.round(total);
  };

  const sl2026 = straightLineAnnual(2026);
  const sl2027 = straightLineAnnual(2027);
  const sl2028 = straightLineAnnual(2028);

  console.log(`\nStraight-line trend: slope = ${trend.slope.toFixed(1)} deseasonalized users/month`);
  console.log(`  Baseline projections: 2026=${sl2026.toLocaleString()}, 2027=${sl2027.toLocaleString()}, 2028=${sl2028.toLocaleString()}`);

  // ── 1. BASELINE (straight-line, no intervention) ──

  const baseline: ScenarioResult = {
    channel: 'BASELINE',
    scenario: 'BASELINE',
    name: 'Baseline — Straight-line trend (no intervention)',
    description: 'Linear regression on 36 months of GA4 data (2023-2025). ' +
      'Slope = ' + trend.slope.toFixed(1) + ' deseasonalized users/month. ' +
      'Represents CI existing user base with zero new investment. ' +
      'Source: CI GA4 monthly active users 2023-2025.',
    annualTotals: { 2026: sl2026, 2027: sl2027, 2028: sl2028 },
    months: projectMonths(seasonalIndices, { 2026: sl2026, 2027: sl2027, 2028: sl2028 }),
  };

  // ── 2. ORGANIC GROWTH (incremental above baseline) ──

  // Conservative: zero incremental — do nothing beyond baseline
  const organicConservative: ScenarioResult = {
    channel: 'ORGANIC_GROWTH',
    scenario: 'CONSERVATIVE',
    name: 'Organic Growth — Conservative (no investment)',
    description: 'Zero incremental organic users. No SEO/content investment beyond current state. ' +
      'Total users = baseline only. This is the "do nothing" scenario.',
    annualTotals: { 2026: 0, 2027: 0, 2028: 0 },
    months: projectMonths(seasonalIndices, { 2026: 0, 2027: 0, 2028: 0 }),
  };

  // Realistic: SEO investment starts producing lift in year 2
  // 0% lift year 1 (lag), 3% of baseline year 2, 8% of baseline year 3
  const orgRealLift2026 = 0;
  const orgRealLift2027 = Math.round(sl2027 * 0.03); // ~9,300
  const orgRealLift2028 = Math.round(sl2028 * 0.08); // ~24,000
  const organicRealistic: ScenarioResult = {
    channel: 'ORGANIC_GROWTH',
    scenario: 'REALISTIC',
    name: 'Organic Growth — Realistic (SEO + content investment)',
    description: 'Incremental organic users from moderate SEO and content investment. ' +
      'Year 1: 0 lift (12-18 month lag for SEO results). ' +
      'Year 2: +3% of baseline (~9K incremental). Year 3: +8% (~24K). ' +
      'Source: M+R Benchmarks — nonprofits investing in SEO see 5-15% annual growth; ' +
      'CanadaHelps achieved 25-30% CAGR during growth years. ' +
      'Discounted for CI established base and 12-18 month SEO lag.',
    annualTotals: { 2026: orgRealLift2026, 2027: orgRealLift2027, 2028: orgRealLift2028 },
    months: projectMonths(seasonalIndices, { 2026: orgRealLift2026, 2027: orgRealLift2027, 2028: orgRealLift2028 }),
  };

  // Ambitious: aggressive content strategy with faster ramp
  // 3% lift year 1, 10% year 2, 22% year 3
  const orgAmbLift2026 = Math.round(sl2026 * 0.03); // ~9,600
  const orgAmbLift2027 = Math.round(sl2027 * 0.10); // ~31,000
  const orgAmbLift2028 = Math.round(sl2028 * 0.22); // ~66,000
  const organicAmbitious: ScenarioResult = {
    channel: 'ORGANIC_GROWTH',
    scenario: 'AMBITIOUS',
    name: 'Organic Growth — Ambitious (full content + SEO strategy)',
    description: 'Incremental organic users from heavy content marketing + SEO + charity listing expansion. ' +
      'Year 1: +3% of baseline (~10K). Year 2: +10% (~31K). Year 3: +22% (~66K). ' +
      'Source: M+R Benchmarks — active content marketing yields 15-25% organic growth; ' +
      'Airbnb achieved 80-100% via supply-driven SEO (listing pages); ' +
      'LinkedIn grew 50-60% via viral loops. Discounted 70% for nonprofit sector ceiling. ' +
      'Assumes dedicated content team and 6-month ramp.',
    annualTotals: { 2026: orgAmbLift2026, 2027: orgAmbLift2027, 2028: orgAmbLift2028 },
    months: projectMonths(seasonalIndices, { 2026: orgAmbLift2026, 2027: orgAmbLift2027, 2028: orgAmbLift2028 }),
  };

  // ── 3. PAID MEDIA (incremental above baseline) ──
  // Paid media follows dampened seasonality
  const paidSeasonalIndices = seasonalIndices.map((idx) => {
    const dampened = (idx + 1 / 12) / 2;
    return dampened;
  });
  const paidSum = paidSeasonalIndices.reduce((a, b) => a + b, 0);
  const paidSeasonal = paidSeasonalIndices.map((v) => v / paidSum);

  // Conservative: Google Ad Grants only ($10K/mo free)
  const paidCon2026 = 30000;
  const paidCon2027 = Math.round(paidCon2026 * 1.05);
  const paidCon2028 = Math.round(paidCon2027 * 1.05);
  const paidConservative: ScenarioResult = {
    channel: 'PAID_MEDIA',
    scenario: 'CONSERVATIVE',
    name: 'Paid Media — Conservative (Google Ad Grants only)',
    description: 'Google Ad Grants ($10K/mo free Google Ads for registered charities). ' +
      '~2,500 incremental users/month. 5% annual growth from campaign optimization. ' +
      'Source: Google Ad Grants benchmarks show 20-40% traffic lift for well-optimized nonprofits; ' +
      'at CI base of ~27K/month, 2,500 = ~9% lift. ' +
      'Risk: Google Ad Grants has strict policy compliance — account can be suspended.',
    annualTotals: { 2026: paidCon2026, 2027: paidCon2027, 2028: paidCon2028 },
    months: projectMonths(paidSeasonal, { 2026: paidCon2026, 2027: paidCon2027, 2028: paidCon2028 }),
  };

  // Realistic: Ad Grants + $2K/mo social spend
  const paidReal2026 = 72000;
  const paidReal2027 = Math.round(paidReal2026 * 1.15);
  const paidReal2028 = Math.round(paidReal2027 * 1.15);
  const paidRealistic: ScenarioResult = {
    channel: 'PAID_MEDIA',
    scenario: 'REALISTIC',
    name: 'Paid Media — Realistic (Ad Grants + social budget)',
    description: 'Google Ad Grants + $2K/month Meta/Instagram budget. ' +
      '~6,000 incremental users/month. 15% annual growth from audience expansion. ' +
      'Source: Nonprofit social CPAs of $3-15/user (M+R Benchmarks); ' +
      '$2K/mo at $5 CPA = ~400 conversions + 5x awareness multiplier. ' +
      'CanadaHelps achieved 25-30% CAGR with moderate marketing investment. ' +
      'Risk: Social CPAs rising ~10-15%/year; audience saturation in Canadian charity space.',
    annualTotals: { 2026: paidReal2026, 2027: paidReal2027, 2028: paidReal2028 },
    months: projectMonths(paidSeasonal, { 2026: paidReal2026, 2027: paidReal2027, 2028: paidReal2028 }),
  };

  // Ambitious: Full paid strategy ($5K/mo + Ad Grants)
  const paidAmb2026 = 144000;
  const paidAmb2027 = Math.round(paidAmb2026 * 1.25);
  const paidAmb2028 = Math.round(paidAmb2027 * 1.25);
  const paidAmbitious: ScenarioResult = {
    channel: 'PAID_MEDIA',
    scenario: 'AMBITIOUS',
    name: 'Paid Media — Ambitious (full paid strategy)',
    description: 'Google Ad Grants + $5K/month total paid budget (search + social + display). ' +
      '~12,000 incremental users/month. 25% annual growth from multi-channel expansion. ' +
      'Source: LinkedIn early growth ~50-60%/yr via viral + paid; ' +
      'Airbnb achieved 80-100% via localized landing pages + paid. ' +
      'CanadaHelps ~25-30% CAGR is the best comp. Discounted for: ' +
      'diminishing marginal returns (2x spend = 1.5-1.7x users), ' +
      'nonprofit sector ceiling, Canadian charity market size (~86K charities). ' +
      'Risk: Paid users may have 30-50% lower engagement than organic. ' +
      'CAC will rise as easy audiences exhaust in years 2-3.',
    annualTotals: { 2026: paidAmb2026, 2027: paidAmb2027, 2028: paidAmb2028 },
    months: projectMonths(paidSeasonal, { 2026: paidAmb2026, 2027: paidAmb2027, 2028: paidAmb2028 }),
  };

  return [
    baseline,
    organicConservative, organicRealistic, organicAmbitious,
    paidConservative, paidRealistic, paidAmbitious,
  ];
}

// ── Print ─────────────────────────────────────────────────────

function printSummary(scenarios: ScenarioResult[]) {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  CI Website — User Growth Projection (2026-2028)');
  console.log('  Total = Baseline + Organic Growth + Paid Media');
  console.log('══════════════════════════════════════════════════════════════');

  const seasonalIndices = computeSeasonalIndices();
  console.log('\nSeasonal Indices (3-year average):');
  seasonalIndices.forEach((idx, m) => {
    const bar = '█'.repeat(Math.round(idx * 200));
    console.log(`  ${MONTHS[m].padEnd(3)} ${(idx * 100).toFixed(1)}% ${bar}`);
  });

  console.log('\nHistorical GA4 Active Users:');
  for (const year of [2023, 2024, 2025]) {
    const total = ACTUALS[year].reduce((a, b) => a + b, 0);
    const prev = year > 2023 ? ACTUALS[year - 1].reduce((a, b) => a + b, 0) : null;
    const yoy = prev ? ` (${((total / prev - 1) * 100).toFixed(1)}% YoY)` : '';
    console.log(`  ${year}: ${total.toLocaleString()}${yoy}${year === 2025 ? ' (Dec estimated)' : ''}`);
  }

  // Baseline
  const bl = scenarios.find((s) => s.channel === 'BASELINE')!;
  console.log('\n── BASELINE (straight-line, no intervention) ──');
  console.log(`  2026: ${bl.annualTotals[2026].toLocaleString()}  2027: ${bl.annualTotals[2027].toLocaleString()}  2028: ${bl.annualTotals[2028].toLocaleString()}`);

  // Organic Growth (incremental)
  const orgScenarios = scenarios.filter((s) => s.channel === 'ORGANIC_GROWTH');
  console.log('\n── ORGANIC GROWTH (incremental above baseline) ──');
  console.log('\n┌──────────────┬────────────┬────────────┬────────────┐');
  console.log('│  Scenario    │    2026    │    2027    │    2028    │');
  console.log('├──────────────┼────────────┼────────────┼────────────┤');
  for (const s of orgScenarios) {
    const label = s.scenario.slice(0, 12).padEnd(12);
    console.log(
      `│  ${label}│ ${String(s.annualTotals[2026] === 0 ? '—' : '+' + s.annualTotals[2026].toLocaleString()).padStart(10)} │ ${String(s.annualTotals[2027] === 0 ? '—' : '+' + s.annualTotals[2027].toLocaleString()).padStart(10)} │ ${String(s.annualTotals[2028] === 0 ? '—' : '+' + s.annualTotals[2028].toLocaleString()).padStart(10)} │`,
    );
  }
  console.log('└──────────────┴────────────┴────────────┴────────────┘');

  // Paid Media (incremental)
  const paidScenarios = scenarios.filter((s) => s.channel === 'PAID_MEDIA');
  console.log('\n── PAID MEDIA (incremental above baseline) ──');
  console.log('\n┌──────────────┬────────────┬────────────┬────────────┐');
  console.log('│  Scenario    │    2026    │    2027    │    2028    │');
  console.log('├──────────────┼────────────┼────────────┼────────────┤');
  for (const s of paidScenarios) {
    const label = s.scenario.slice(0, 12).padEnd(12);
    console.log(
      `│  ${label}│ ${('+' + s.annualTotals[2026].toLocaleString()).padStart(10)} │ ${('+' + s.annualTotals[2027].toLocaleString()).padStart(10)} │ ${('+' + s.annualTotals[2028].toLocaleString()).padStart(10)} │`,
    );
  }
  console.log('└──────────────┴────────────┴────────────┴────────────┘');

  // Combined totals table
  console.log('\n── COMBINED TOTALS (Baseline + Organic + Paid) ──');
  console.log('\n┌─────────────────────────┬────────────┬────────────┬────────────┐');
  console.log('│  Combination            │    2026    │    2027    │    2028    │');
  console.log('├─────────────────────────┼────────────┼────────────┼────────────┤');
  for (const org of orgScenarios) {
    for (const paid of paidScenarios) {
      const label = `${org.scenario.slice(0, 3)}+${paid.scenario.slice(0, 3)}`.padEnd(23);
      for (const year of [2026]) { // just print one line for each combo
        const t26 = bl.annualTotals[2026] + org.annualTotals[2026] + paid.annualTotals[2026];
        const t27 = bl.annualTotals[2027] + org.annualTotals[2027] + paid.annualTotals[2027];
        const t28 = bl.annualTotals[2028] + org.annualTotals[2028] + paid.annualTotals[2028];
        console.log(
          `│  ${label}│ ${String(t26.toLocaleString()).padStart(10)} │ ${String(t27.toLocaleString()).padStart(10)} │ ${String(t28.toLocaleString()).padStart(10)} │`,
        );
      }
    }
  }
  console.log('└─────────────────────────┴────────────┴────────────┴────────────┘');
  console.log('  (CON=Conservative, REA=Realistic, AMB=Ambitious)');
}

// ── Delete Old Data ───────────────────────────────────────────

async function deleteOldProjectionData(entityId: string) {
  console.log('\n── Deleting old CI projection data ──');

  // Find all budgets created by old or current seed scripts
  const budgets = await api<{ budgets: any[] }>(`/budgeting/budgets/by-entity/${entityId}`);
  const ciProjectionBudgets = budgets.budgets.filter(
    (b: any) =>
      b.created_by === 'seed-ci-projection' || b.created_by === 'seed-ci-projection-v2',
  );

  for (const budget of ciProjectionBudgets) {
    try {
      await api(`/budgeting/budgets/${budget.id}`, { method: 'DELETE' });
      console.log(`  Deleted budget: ${budget.name}`);
    } catch (e: any) {
      console.log(`  Could not delete budget ${budget.name}: ${e.message}`);
    }
  }

  // Delete old metric nodes
  const metricsResp = await api<{ items: any[] }>(`/graph/metrics/by-entity/${entityId}`);
  const metricsArr = metricsResp.items || [];
  for (const m of metricsArr) {
    if (m.label === 'Website Active Users' || m.label === 'CI Organic Website Users' || m.label === 'CI Paid Media Users' || m.label === 'CI Baseline Website Users') {
      try {
        await api(`/graph/metrics/${m.id}`, { method: 'DELETE' });
        console.log(`  Deleted metric: ${m.label}`);
      } catch (e: any) {
        console.log(`  Could not delete metric ${m.label}: ${e.message}`);
      }
    }
  }

  // Delete old period nodes created by our seed
  const periods = await api<{ items: any[] }>(`/graph/periods/by-entity/${entityId}`);
  const ciPeriods = (periods.items || []).filter(
    (p: any) =>
      p.label?.includes('CI Website') ||
      p.label?.includes('(Base') ||
      p.label?.includes('Org-') ||
      p.label?.includes('Paid-') ||
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) 20(2[3-8])$/.test(p.label || ''),
  );
  for (const period of ciPeriods) {
    try {
      await api(`/graph/periods/${period.id}`, { method: 'DELETE' });
    } catch { /* ok */ }
  }

  console.log(`  Cleanup: ${ciProjectionBudgets.length} budgets, ${ciPeriods.length} periods removed`);
}

// ── Seed Scenarios ────────────────────────────────────────────

async function seedScenarios(entityId: string, scenarios: ScenarioResult[]) {
  console.log('\n── Seeding 7 forecast budgets into EBG ──\n');

  // Create metric nodes for each channel
  const metricIds: Record<string, string> = {};

  const channelDefs = [
    { key: 'BASELINE', label: 'CI Baseline Website Users', currentValue: 331301, targetValue: 300000 },
    { key: 'ORGANIC_GROWTH', label: 'CI Organic Website Users', currentValue: 0, targetValue: 50000 },
    { key: 'PAID_MEDIA', label: 'CI Paid Media Users', currentValue: 0, targetValue: 100000 },
  ];

  for (const ch of channelDefs) {
    try {
      const metric = await api<{ id: string }>('/graph/metrics', {
        method: 'POST',
        body: JSON.stringify({
          entityId,
          label: ch.label,
          metricType: 'VOLUME',
          currentValue: ch.currentValue,
          targetValue: ch.targetValue,
          unit: 'active_users_monthly',
        }),
      });
      metricIds[ch.key] = metric.id;
      console.log(`  Created metric: ${ch.label} (${metric.id})`);
    } catch (e: any) {
      console.log(`  Metric error: ${e.message}`);
      metricIds[ch.key] = entityId; // fallback
    }
  }

  for (const scenario of scenarios) {
    const budgetName = `FY2026-2028 — ${scenario.name}`;
    console.log(`\n  ▸ ${budgetName}`);

    // Create a single multi-year budget for this scenario
    const budget = await api<{ id: string }>('/budgeting/budgets', {
      method: 'POST',
      body: JSON.stringify({
        entityId,
        name: budgetName,
        description: scenario.description,
        fiscalYear: 2026,
        currency: 'CAD',
        createdBy: 'seed-ci-projection-v2',
      }),
    });
    const budgetId = budget.id;

    const metricId = metricIds[scenario.channel];

    // Period label prefix based on channel
    const channelPrefix = scenario.channel === 'BASELINE' ? 'Base'
      : scenario.channel === 'ORGANIC_GROWTH' ? 'Org'
      : 'Paid';
    const scenarioSuffix = scenario.scenario === 'BASELINE' ? '' : `-${scenario.scenario.slice(0, 3)}`;

    // Create monthly periods and budget lines
    for (const proj of scenario.months) {
      const period = await api<{ id: string }>('/graph/periods', {
        method: 'POST',
        body: JSON.stringify({
          entityId,
          label: `${proj.label} (${channelPrefix}${scenarioSuffix})`,
          startDate: proj.periodStart,
          endDate: proj.periodEnd,
        }),
      });

      await api<{ id: string }>('/budgeting/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId,
          periodId: period.id,
          nodeRefId: metricId,
          nodeRefType: 'METRIC',
          economicCategory: 'REVENUE',
          amount: proj.users,
          notes: `${scenario.channel} ${scenario.scenario}: ${proj.users.toLocaleString()} active users — ${proj.label}`,
        }),
      });
    }

    const totalAll = Object.values(scenario.annualTotals).reduce((a, b) => a + b, 0);
    console.log(`    ${scenario.months.length} months, ${totalAll.toLocaleString()} total users over 3 years`);
  }
}

// ── Entry point ───────────────────────────────────────────────

async function main() {
  const scenarios = buildAllScenarios();
  printSummary(scenarios);

  console.log('\n── Seeding into EBG ──');

  // Find Harness Good entity
  const entities = await api<{ entities: any[] }>('/graph/entities');
  const entity = entities.entities.find(
    (e: any) => e.label === 'Harness Good' || e.label === 'Charity Intelligence',
  );
  if (!entity) throw new Error('Entity not found (Harness Good or Charity Intelligence)');
  const entityId = entity.id;
  console.log(`  Entity: ${entity.label} (${entityId})`);

  // Delete old projection data
  await deleteOldProjectionData(entityId);

  // Seed new scenarios
  await seedScenarios(entityId, scenarios);

  console.log('\n✓ 7 CI visitor projection budgets seeded successfully.');
  console.log('  1 Baseline (straight-line trend)');
  console.log('  3 Organic Growth: Conservative / Realistic / Ambitious (incremental)');
  console.log('  3 Paid Media: Conservative / Realistic / Ambitious (incremental)');
  console.log('  Each with 36 monthly budget lines (2026-2028).');
  console.log('  Total users = Baseline + Organic scenario + Paid scenario\n');
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
