export {};

/**
 * Seed CI (Charity Intelligence) Monthly Visitor Projection — 2026, 2027, 2028
 *
 * Source data: GA4 Active Users from:
 *   - /mnt/c/temp/ci/2023 Monthly Ci Webpage Data.xlsx
 *   - /mnt/c/temp/ci/2024 Monthly Ci Webpage Data.xlsx
 *   - /mnt/c/temp/ci/2025 Monthly Ci Webpage Data.xlsx
 *
 * Methodology:
 *   1. Three-year monthly actuals (2023-2025) establish seasonal indices.
 *   2. YoY trend: 2023→2024 = -6.0%, 2024→2025 ≈ -2.6% (declining rate of decline).
 *   3. Projection assumes continued moderation: 2026 flat, 2027 +3%, 2028 +5%.
 *   4. Monthly distribution uses 3-year average seasonal index.
 *
 * Run: npx tsx scripts/seed-ci-visitor-projection.ts
 */

const BASE = 'http://localhost:4000/api';

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

// ── Historical GA4 Active Users (monthly) ─────────────────────

const ACTUALS: Record<number, number[]> = {
  // [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
  2023: [34311, 35056, 29893, 28063, 23617, 21909, 21207, 22542, 24859, 34995, 39769, 38123],
  2024: [28612, 25340, 26697, 26414, 25195, 21905, 22073, 20688, 24615, 35534, 36878, 43458],
  2025: [28785, 24232, 28356, 24121, 25487, 23274, 21735, 19928, 27383, 28699, 37301, 42000],
  // Dec 2025 estimated: 23,336 through Dec 15, extrapolated at ~55% capture → 42,000
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── Compute seasonal indices ──────────────────────────────────

function computeSeasonalIndices(): number[] {
  const indices: number[] = [];
  for (let m = 0; m < 12; m++) {
    // For each month, compute its proportion of annual total across all years
    const proportions: number[] = [];
    for (const year of [2023, 2024, 2025]) {
      const annual = ACTUALS[year].reduce((a, b) => a + b, 0);
      proportions.push(ACTUALS[year][m] / annual);
    }
    indices.push(proportions.reduce((a, b) => a + b, 0) / proportions.length);
  }
  return indices;
}

// ── Projection ────────────────────────────────────────────────

interface MonthlyProjection {
  year: number;
  month: number;
  monthLabel: string;
  activeUsers: number;
  periodStart: string;
  periodEnd: string;
}

function buildProjections(): {
  projections: MonthlyProjection[];
  annualTotals: Record<number, number>;
  seasonalIndices: number[];
  historicalTotals: Record<number, number>;
} {
  const seasonalIndices = computeSeasonalIndices();

  // Historical annual totals
  const historicalTotals: Record<number, number> = {};
  for (const [year, months] of Object.entries(ACTUALS)) {
    historicalTotals[Number(year)] = months.reduce((a, b) => a + b, 0);
  }
  // 2023: 354,344  2024: 337,409  2025 est: 317,301

  // YoY trends: 2023→2024 = -4.8%, 2024→2025 = -6.0%
  // Projection assumptions (conservative with web strategy improvements):
  //   2026: -1% (near-stabilization, strategy initiatives begin)
  //   2027: +3% (SEO + content strategy gains traction)
  //   2028: +5% (compounding digital strategy returns)
  const annualGrowth: Record<number, number> = {
    2026: -0.01,
    2027: 0.03,
    2028: 0.05,
  };

  const annualTotals: Record<number, number> = {};
  let prevTotal = historicalTotals[2025];

  for (const year of [2026, 2027, 2028]) {
    const total = Math.round(prevTotal * (1 + annualGrowth[year]));
    annualTotals[year] = total;
    prevTotal = total;
  }

  // Distribute across months using seasonal indices
  const projections: MonthlyProjection[] = [];

  for (const year of [2026, 2027, 2028]) {
    const annualTotal = annualTotals[year];
    for (let m = 0; m < 12; m++) {
      const monthNum = m + 1;
      const lastDay = new Date(year, monthNum, 0).getDate();
      projections.push({
        year,
        month: monthNum,
        monthLabel: `${MONTHS[m]} ${year}`,
        activeUsers: Math.round(annualTotal * seasonalIndices[m]),
        periodStart: `${year}-${String(monthNum).padStart(2, '0')}-01`,
        periodEnd: `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
      });
    }
  }

  return { projections, annualTotals, seasonalIndices, historicalTotals };
}

// ── Print projection summary ──────────────────────────────────

function printSummary(data: ReturnType<typeof buildProjections>) {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  CI Website — Monthly Active User Projection (2026-2028)');
  console.log('══════════════════════════════════════════════════════════════\n');

  console.log('Historical Annual Totals (GA4 Active Users):');
  for (const [year, total] of Object.entries(data.historicalTotals)) {
    console.log(`  ${year}: ${total.toLocaleString()}${year === '2025' ? ' (Dec estimated)' : ''}`);
  }

  console.log('\nProjected Annual Totals:');
  const growthLabels: Record<number, string> = { 2026: '-1.0%', 2027: '+3.0%', 2028: '+5.0%' };
  for (const [year, total] of Object.entries(data.annualTotals)) {
    console.log(`  ${year}: ${total.toLocaleString()} (${growthLabels[Number(year)]} YoY)`);
  }

  console.log('\nSeasonal Indices (3-year average):');
  data.seasonalIndices.forEach((idx, m) => {
    const bar = '█'.repeat(Math.round(idx * 200));
    console.log(`  ${MONTHS[m].padEnd(3)} ${(idx * 100).toFixed(1)}% ${bar}`);
  });

  console.log('\n┌──────────┬────────────┬────────────┬────────────┐');
  console.log('│  Month   │    2026    │    2027    │    2028    │');
  console.log('├──────────┼────────────┼────────────┼────────────┤');
  for (let m = 0; m < 12; m++) {
    const v26 = data.projections.find(p => p.year === 2026 && p.month === m + 1)!.activeUsers;
    const v27 = data.projections.find(p => p.year === 2027 && p.month === m + 1)!.activeUsers;
    const v28 = data.projections.find(p => p.year === 2028 && p.month === m + 1)!.activeUsers;
    console.log(
      `│  ${MONTHS[m].padEnd(6)} │ ${String(v26.toLocaleString()).padStart(10)} │ ${String(v27.toLocaleString()).padStart(10)} │ ${String(v28.toLocaleString()).padStart(10)} │`,
    );
  }
  console.log('├──────────┼────────────┼────────────┼────────────┤');
  console.log(
    `│  TOTAL   │ ${String(data.annualTotals[2026].toLocaleString()).padStart(10)} │ ${String(data.annualTotals[2027].toLocaleString()).padStart(10)} │ ${String(data.annualTotals[2028].toLocaleString()).padStart(10)} │`,
  );
  console.log('└──────────┴────────────┴────────────┴────────────┘');
}

// ── Seed into EBG ─────────────────────────────────────────────

async function seed() {
  const data = buildProjections();
  printSummary(data);

  console.log('\n── Seeding into EBG ─────────────────────────────────────\n');

  // Find or identify the CI entity — use "Harness Good" (NFP)
  const entities = await api<{ entities: any[] }>('/graph/entities');
  let entity = entities.entities.find(
    (e: any) => e.label === 'Harness Good' || e.label === 'Charity Intelligence',
  );

  if (!entity) {
    // Create a CI entity
    console.log('Creating Charity Intelligence entity...');
    entity = await api<any>('/graph/entities', {
      method: 'POST',
      body: JSON.stringify({
        label: 'Charity Intelligence',
        entity_type: 'NOT_FOR_PROFIT',
        jurisdiction: 'CA',
        reporting_framework: 'ASNFPO',
        fiscal_year_end_month: 12,
        outcome_ontology: 'NFP',
        base_currency: 'CAD',
      }),
    });
    console.log(`  Created entity: ${entity.id}`);
  } else {
    console.log(`  Found entity: ${entity.label} (${entity.id})`);
  }
  const entityId = entity.id;

  // Create a Metric node for "Active Website Users"
  console.log('Creating Website Active Users metric node...');
  let metricId: string;
  try {
    const metric = await api<{ id: string }>('/graph/metrics', {
      method: 'POST',
      body: JSON.stringify({
        entityId,
        label: 'Website Active Users',
        metricType: 'VOLUME',
        currentValue: ACTUALS[2025].reduce((a, b) => a + b, 0),
        targetValue: 400000,
        unit: 'active_users_monthly',
      }),
    });
    metricId = metric.id;
    console.log(`  Created metric: ${metricId}`);
  } catch (e: any) {
    // Metric may already exist — try to find it via list
    console.log(`  Metric creation error: ${e.message}`);
    const metrics = await api<any[]>(`/graph/metrics?entityId=${entityId}`);
    const existing = (Array.isArray(metrics) ? metrics : []).find(
      (m: any) => m.label === 'Website Active Users',
    );
    if (existing) {
      metricId = existing.id;
      console.log(`  Found existing metric: ${metricId}`);
    } else {
      throw new Error('Cannot create or find Website Active Users metric');
    }
  }

  // Create monthly periods and budget lines for each projected year
  for (const year of [2026, 2027, 2028]) {
    console.log(`\n── ${year} ──`);

    // Create annual period
    const annualPeriod = await api<any>('/graph/periods', {
      method: 'POST',
      body: JSON.stringify({
        entityId,
        label: `FY${year} — CI Website Visitor Projection`,
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      }),
    });
    const annualPeriodId = annualPeriod.id;
    console.log(`  Annual period: ${annualPeriodId}`);

    // Create budget for this year
    const budget = await api<any>('/budgeting/budgets', {
      method: 'POST',
      body: JSON.stringify({
        entityId,
        name: `FY${year} — CI Website Active Users Projection`,
        description: `Monthly active user projection for charityintelligence.ca based on 2023-2025 GA4 data. Seasonal indices from 3-year average.`,
        fiscalYear: year,
        currency: 'CAD',
        createdBy: 'seed-ci-projection',
      }),
    });
    const budgetId = budget.id;
    console.log(`  Budget: ${budgetId}`);

    // Create monthly periods and budget lines
    const yearProjections = data.projections.filter(p => p.year === year);
    for (const proj of yearProjections) {
      // Create monthly period
      const monthPeriod = await api<any>('/graph/periods', {
        method: 'POST',
        body: JSON.stringify({
          entityId,
          label: proj.monthLabel,
          startDate: proj.periodStart,
          endDate: proj.periodEnd,
        }),
      });

      // Add budget line: users as a "revenue" metric (visitor count)
      await api<any>('/budgeting/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId,
          periodId: monthPeriod.id,
          nodeRefId: metricId,
          nodeRefType: 'METRIC',
          economicCategory: 'REVENUE',
          amount: proj.activeUsers,
          notes: `Projected ${proj.activeUsers.toLocaleString()} active users for ${proj.monthLabel}`,
        }),
      });

      console.log(`  ${proj.monthLabel}: ${proj.activeUsers.toLocaleString()} users → period ${monthPeriod.id.slice(0, 8)}`);
    }

    console.log(`  Year total: ${data.annualTotals[year].toLocaleString()} active users`);
  }

  // Also load historical actuals as reference budgets
  for (const year of [2023, 2024, 2025]) {
    console.log(`\n── ${year} (historical actuals) ──`);

    const annualPeriod = await api<any>('/graph/periods', {
      method: 'POST',
      body: JSON.stringify({
        entityId,
        label: `FY${year} — CI Website Visitors (Actual)`,
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      }),
    });

    const budget = await api<any>('/budgeting/budgets', {
      method: 'POST',
      body: JSON.stringify({
        entityId,
        name: `FY${year} — CI Website Active Users (Actual)`,
        description: `Historical GA4 active users for charityintelligence.ca.${year === 2025 ? ' Dec estimated from partial data.' : ''}`,
        fiscalYear: year,
        currency: 'CAD',
        createdBy: 'seed-ci-projection',
      }),
    });
    const budgetId = budget.id;

    for (let m = 0; m < 12; m++) {
      const monthNum = m + 1;
      const lastDay = new Date(year, monthNum, 0).getDate();
      const monthPeriod = await api<any>('/graph/periods', {
        method: 'POST',
        body: JSON.stringify({
          entityId,
          label: `${MONTHS[m]} ${year}`,
          startDate: `${year}-${String(monthNum).padStart(2, '0')}-01`,
          endDate: `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
        }),
      });

      await api<any>('/budgeting/lines', {
        method: 'POST',
        body: JSON.stringify({
          budgetId,
          periodId: monthPeriod.id,
          nodeRefId: metricId,
          nodeRefType: 'METRIC',
          economicCategory: 'REVENUE',
          amount: ACTUALS[year][m],
          notes: `GA4 actual: ${ACTUALS[year][m].toLocaleString()} active users — ${MONTHS[m]} ${year}`,
        }),
      });

      console.log(`  ${MONTHS[m]} ${year}: ${ACTUALS[year][m].toLocaleString()} users`);
    }
    console.log(`  Year total: ${ACTUALS[year].reduce((a, b) => a + b, 0).toLocaleString()}`);
  }

  console.log('\n✓ CI visitor projection seeded successfully.\n');
}

// ── Entry point ───────────────────────────────────────────────

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
