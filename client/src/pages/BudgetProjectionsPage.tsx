import { useEffect, useState, useRef, useCallback } from 'react';
import { getEntities, getScenariosByEntity, getProjectionTimeSeries, getProjectionAssumptions } from '../api/client';
import * as d3 from 'd3';

// ── Types ──────────────────────────────────────────────────────

interface ProjectionRow {
  periodId: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  revenue: number;
  expense: number;
  net: number;
  breakdown: Record<string, number>;
}

interface ScenarioSeries {
  scenario: string;
  rows: ProjectionRow[];
  categories: string[];
  totals: { revenue: number; expense: number; net: number };
}

interface MultiScenarioResult {
  entityId: string;
  currency: string;
  groupBy: string;
  series: ScenarioSeries[];
}

// ── Helpers ────────────────────────────────────────────────────

const fmt = (n: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const fmtShort = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

function parseYearMonth(dateStr: string): { year: number; month: number } {
  const [y, m] = dateStr.split('-').map(Number);
  return { year: y, month: m };
}

function groupRowsByYear(rows: ProjectionRow[]): ProjectionRow[] {
  // Group by fiscal year (Apr-Mar). A month in Apr+ belongs to the FY
  // ending the following March, labeled by that end-year.
  // e.g. Apr 2026 → FY2027, Jan 2027 → FY2027
  const yearMap = new Map<number, ProjectionRow>();
  for (const row of rows) {
    const { year, month } = parseYearMonth(row.startDate);
    const fy = month >= 4 ? year + 1 : year;
    if (!yearMap.has(fy)) {
      yearMap.set(fy, {
        periodId: `fy-${fy}`,
        periodLabel: `FY${fy}`,
        startDate: `${fy - 1}-04-01`,
        endDate: `${fy}-03-31`,
        revenue: 0, expense: 0, net: 0, breakdown: {},
      });
    }
    const agg = yearMap.get(fy)!;
    agg.revenue += row.revenue;
    agg.expense += row.expense;
    agg.net += row.net;
    for (const [cat, val] of Object.entries(row.breakdown)) {
      agg.breakdown[cat] = (agg.breakdown[cat] || 0) + val;
    }
  }
  return [...yearMap.entries()].sort(([a], [b]) => a - b).map(([, row]) => row);
}

function filterRowsByRange(rows: ProjectionRow[], years: number): ProjectionRow[] {
  if (rows.length === 0 || years <= 0) return rows;
  const startDate = new Date(rows[0].startDate);
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + years);
  const endStr = endDate.toISOString().slice(0, 10);
  return rows.filter((r) => r.startDate < endStr);
}

// ── Scenario ↔ Markdown section mapping ─────────────────────

/** Map scenario names to keywords that appear in ### headings */
const SCENARIO_SECTION_KEYS: Record<string, string[]> = {
  'Baseline': ['Baseline', 'Platform-Wide'],
  'Give — With CI': ['With CI', 'Scenario A'],
  'Give — Without CI': ['Without CI', 'Scenario B'],
  'Give — With CI + US': ['With CI + US', 'Scenario C', 'US Expansion'],
  'DAF — Organic': ['DAF — Organic', 'Organic', 'Give Cross-sell'],
  'DAF — Active Growth': ['DAF — Active Growth', 'Active Growth', 'HNW'],
};

/**
 * Extract sections relevant to a specific scenario.
 * Keeps: the doc intro, any ## section that has NO scenario-specific ### subsections
 * (shared sections like Revenue Model, Infrastructure, Funnel, Modeling Decisions),
 * plus only the matching ### subsection from sections that ARE scenario-split.
 */
function extractScenarioSections(md: string, scenario: string): string {
  const keys = SCENARIO_SECTION_KEYS[scenario];
  if (!keys) return md; // unknown scenario — show everything

  // Split into ## sections
  const sections = md.split(/(?=^## )/gm);
  const result: string[] = [];

  for (const section of sections) {
    // Check if this section has scenario-specific ### subsections
    const subheadings = section.match(/^### .+$/gm) || [];
    const allScenarioKeys = Object.values(SCENARIO_SECTION_KEYS).flat();
    const hasScenarioSubs = subheadings.some((h) =>
      allScenarioKeys.some((k) => h.includes(k)),
    );

    if (!hasScenarioSubs) {
      // Shared section — include entirely
      result.push(section);
    } else {
      // Section has scenario splits — keep the ## heading + only matching ### blocks
      const lines = section.split('\n');
      const filtered: string[] = [];
      let including = true; // start true to capture the ## heading lines before first ###

      for (const line of lines) {
        if (line.startsWith('### ')) {
          // Check if this subsection matches our scenario
          including = keys.some((k) => line.includes(k));
        }
        if (including) filtered.push(line);
      }
      if (filtered.length > 1) result.push(filtered.join('\n'));
    }
  }

  return result.join('\n');
}

// ── Minimal Markdown → HTML ──────────────────────────────────

function markdownToHtml(md: string): string {
  let html = md
    // code blocks
    .replace(/```([\s\S]*?)```/g, '<pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;font-size:0.8rem"><code>$1</code></pre>')
    // tables
    .replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, (_m, header: string, _sep: string, body: string) => {
      const ths = header.split('|').filter(Boolean).map((c: string) => `<th style="padding:4px 10px;border:1px solid #ddd;font-size:0.8rem">${c.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map((row: string) => {
        const tds = row.split('|').filter(Boolean).map((c: string) => `<td style="padding:4px 10px;border:1px solid #ddd;font-size:0.8rem">${c.trim()}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<table style="border-collapse:collapse;margin:12px 0;width:100%"><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
    })
    // headings
    .replace(/^#### (.+)$/gm, '<h4 style="margin:16px 0 4px">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 style="margin:20px 0 6px;font-size:1rem">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="margin:24px 0 8px;font-size:1.1rem;border-bottom:1px solid #e0e0e0;padding-bottom:4px">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="margin:0 0 12px;font-size:1.3rem">$1</h1>')
    // bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // horizontal rules
    .replace(/^---$/gm, '<hr style="margin:20px 0;border:none;border-top:1px solid #e0e0e0"/>')
    // line breaks → paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  return `<div style="line-height:1.6;font-size:0.85rem"><p>${html}</p></div>`;
}

// ── PDF Export ────────────────────────────────────────────────

function renderChartSvg(
  series: { scenario: string; rows: ProjectionRow[] },
  currency: string,
  viewMode: 'MONTH' | 'YEAR',
): string {
  const chartW = 800;
  const chartH = 340;
  const margin = { top: 20, right: 20, bottom: 50, left: 70 };
  const width = chartW - margin.left - margin.right;
  const height = chartH - margin.top - margin.bottom;

  const container = document.createElement('div');
  const svg = d3.select(container).append('svg')
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .attr('width', chartW).attr('height', chartH);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xDomain = series.rows.map((r) => r.periodLabel);
  const x = d3.scaleBand().domain(xDomain).range([0, width]).padding(0.1);

  const allValues = series.rows.flatMap((r) => [r.revenue, r.expense, r.net]);
  const yMax = d3.max(allValues) || 1;
  const yMin = Math.min(0, d3.min(allValues) || 0);
  const y = d3.scaleLinear().domain([yMin * 1.1, yMax * 1.1]).range([height, 0]);

  g.selectAll('.grid-line').data(y.ticks(6)).enter()
    .append('line')
    .attr('x1', 0).attr('x2', width)
    .attr('y1', (d) => y(d)).attr('y2', (d) => y(d))
    .attr('stroke', '#ddd').attr('stroke-dasharray', '3,3');

  g.append('line')
    .attr('x1', 0).attr('x2', width)
    .attr('y1', y(0)).attr('y2', y(0))
    .attr('stroke', '#999').attr('stroke-width', 1);

  const xAxis = g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));
  if (viewMode === 'MONTH' && xDomain.length > 12) {
    xAxis.selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '8px');
  }

  g.append('g').call(d3.axisLeft(y).ticks(6).tickFormat((d) => fmtShort(d as number)));

  const xMid = (label: string) => (x(label) || 0) + x.bandwidth() / 2;
  const colors = { revenue: '#4caf50', expense: '#ef5350', net: '#2196f3' };

  for (const [key, color] of Object.entries(colors) as [keyof typeof colors, string][]) {
    const points = series.rows.map((r) => ({ label: r.periodLabel, value: r[key] }));
    const line = d3.line<{ label: string; value: number }>()
      .x((d) => xMid(d.label))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2.5)
      .attr('d', line);

    if (xDomain.length <= 24) {
      g.selectAll(`.dot-${key}`).data(points).enter()
        .append('circle')
        .attr('cx', (d) => xMid(d.label))
        .attr('cy', (d) => y(d.value))
        .attr('r', 3)
        .attr('fill', color);
    }
  }

  // Inline legend
  const legend = g.append('g').attr('transform', `translate(${width - 160}, 0)`);
  const legendItems = [
    { label: 'Revenue', color: colors.revenue },
    { label: 'Expenses', color: colors.expense },
    { label: 'Net Income', color: colors.net },
  ];
  legendItems.forEach((item, i) => {
    legend.append('rect').attr('x', 0).attr('y', i * 18).attr('width', 14).attr('height', 3).attr('fill', item.color);
    legend.append('text').attr('x', 20).attr('y', i * 18 + 5).text(item.label)
      .style('font-size', '10px').attr('fill', '#333');
  });

  const svgMarkup = container.innerHTML;
  container.remove();
  return svgMarkup;
}

function buildTableHtml(
  series: ScenarioSeries & { rows: ProjectionRow[] },
  currency: string,
): string {
  const { groupOrder, groups } = buildCategoryGroups(series.categories);
  let cumulativeNet = 0;

  const thStyle = 'padding:6px 10px;text-align:right;font-size:0.75rem;border-bottom:2px solid #333';
  const tdStyle = 'padding:4px 10px;text-align:right;font-size:0.8rem;font-variant-numeric:tabular-nums;border-bottom:1px solid #eee';

  let html = `<table style="border-collapse:collapse;width:100%;margin:0">`;
  html += `<thead><tr>`;
  html += `<th style="${thStyle};text-align:left">Period</th>`;
  html += `<th style="${thStyle}">Revenue</th>`;
  html += `<th style="${thStyle}">Expenses</th>`;
  html += `<th style="${thStyle}">Net</th>`;
  html += `<th style="${thStyle}">Cumulative</th>`;
  for (const group of groupOrder) {
    html += `<th style="${thStyle};border-left:2px solid #ccc;background:${GROUP_COLORS[group] || '#f5f5f5'}">${group}</th>`;
  }
  html += `</tr></thead><tbody>`;

  for (const row of series.rows) {
    cumulativeNet += row.net;
    const netColor = row.net >= 0 ? '#2e7d32' : '#d32f2f';
    const cumColor = cumulativeNet >= 0 ? '#1565c0' : '#c62828';
    html += `<tr>`;
    html += `<td style="${tdStyle};text-align:left;font-weight:500">${row.periodLabel}</td>`;
    html += `<td style="${tdStyle};color:#2e7d32">${fmt(row.revenue, currency)}</td>`;
    html += `<td style="${tdStyle};color:#d32f2f">${fmt(row.expense, currency)}</td>`;
    html += `<td style="${tdStyle};font-weight:600;color:${netColor}">${fmt(row.net, currency)}</td>`;
    html += `<td style="${tdStyle};color:${cumColor}">${fmt(cumulativeNet, currency)}</td>`;
    for (const group of groupOrder) {
      const cats = groups.get(group)!;
      const sub = cats.reduce((s, c) => s + (row.breakdown[c] || 0), 0);
      html += `<td style="${tdStyle};border-left:2px solid #eee">${sub ? fmt(sub, currency) : '-'}</td>`;
    }
    html += `</tr>`;
  }

  html += `</tbody><tfoot><tr style="font-weight:700;border-top:2px solid #333">`;
  html += `<td style="${tdStyle};text-align:left">Total</td>`;
  html += `<td style="${tdStyle};color:#2e7d32">${fmt(series.totals.revenue, currency)}</td>`;
  html += `<td style="${tdStyle};color:#d32f2f">${fmt(series.totals.expense, currency)}</td>`;
  const totalNetColor = series.totals.net >= 0 ? '#2e7d32' : '#d32f2f';
  html += `<td style="${tdStyle};color:${totalNetColor}">${fmt(series.totals.net, currency)}</td>`;
  html += `<td style="${tdStyle}"></td>`;
  for (const group of groupOrder) {
    const cats = groups.get(group)!;
    const groupTotal = series.rows.reduce((s, r) => cats.reduce((a, c) => a + (r.breakdown[c] || 0), s), 0);
    html += `<td style="${tdStyle};border-left:2px solid #eee">${groupTotal ? fmt(groupTotal, currency) : '-'}</td>`;
  }
  html += `</tr></tfoot></table>`;
  return html;
}

function printScenarioPdf(
  series: ScenarioSeries & { rows: ProjectionRow[] },
  currency: string,
  viewMode: 'MONTH' | 'YEAR',
  yearRange: number,
  entityName: string,
  assumptionsHtml: string,
) {
  const chartSvg = renderChartSvg(series, currency, viewMode);
  const tableHtml = buildTableHtml(series, currency);
  const margin = series.totals.revenue > 0
    ? ((series.totals.net / series.totals.revenue) * 100).toFixed(1)
    : '0.0';

  const doc = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>${series.scenario} — Budget Projection</title>
<style>
  @page { size: landscape; margin: 0.5in; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif;
         color: #222; margin: 0; padding: 0; font-size: 11px; line-height: 1.4; }
  .page-break { page-break-before: always; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  .subtitle { color: #666; font-size: 11px; margin: 0 0 16px; }
  .summary { display: flex; gap: 32px; margin: 16px 0; }
  .summary-item .label { font-size: 9px; text-transform: uppercase; color: #888; }
  .summary-item .value { font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .chart-container { margin: 16px 0; }
  .chart-container svg { width: 100%; height: auto; }
  table { border-collapse: collapse; width: 100%; }
  .assumptions { font-size: 10px; line-height: 1.5; }
  .assumptions h2 { font-size: 12px; }
  .assumptions h3 { font-size: 11px; }
  .assumptions table { font-size: 9px; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head><body>

<h1>${series.scenario}</h1>
<div class="subtitle">${entityName} — ${viewMode === 'MONTH' ? 'Monthly' : 'Yearly'} projection (${yearRange}yr) — ${currency}</div>

<div class="summary">
  <div class="summary-item">
    <div class="label">Total Revenue</div>
    <div class="value" style="color:#2e7d32">${fmt(series.totals.revenue, currency)}</div>
  </div>
  <div class="summary-item">
    <div class="label">Total Expenses</div>
    <div class="value" style="color:#d32f2f">${fmt(series.totals.expense, currency)}</div>
  </div>
  <div class="summary-item">
    <div class="label">Net Income</div>
    <div class="value" style="color:${series.totals.net >= 0 ? '#2e7d32' : '#d32f2f'}">${fmt(series.totals.net, currency)}</div>
  </div>
  <div class="summary-item">
    <div class="label">Margin</div>
    <div class="value">${margin}%</div>
  </div>
</div>

<div class="chart-container">${chartSvg}</div>

<h2>Forecasted Financials</h2>
${tableHtml}

<div class="page-break"></div>
<div class="assumptions">
<h2>Assumptions & Sources</h2>
${assumptionsHtml}
</div>

</body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(doc);
  win.document.close();
  win.addEventListener('load', () => {
    win.print();
  });
}

// Distinct colors for scenario series
const SCENARIO_COLORS = [
  { revenue: '#4caf50', expense: '#ef5350', net: '#2196f3' },
  { revenue: '#66bb6a', expense: '#ff7043', net: '#42a5f5' },
  { revenue: '#81c784', expense: '#ff8a65', net: '#64b5f6' },
  { revenue: '#a5d6a7', expense: '#ffab91', net: '#90caf9' },
];

// ── Multi-Scenario D3 Chart ───────────────────────────────────

function MultiScenarioChart({
  seriesList,
  currency,
  viewMode,
}: {
  seriesList: { scenario: string; rows: ProjectionRow[] }[];
  currency: string;
  viewMode: 'MONTH' | 'YEAR';
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  const draw = useCallback(() => {
    if (!svgRef.current || seriesList.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 140, bottom: 50, left: 70 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 360 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Use the union of all period labels as x domain
    const allLabels = new Set<string>();
    for (const s of seriesList) {
      for (const r of s.rows) allLabels.add(r.periodLabel);
    }
    const xDomain = [...allLabels].sort((a, b) => {
      // Sort by date approximation
      const sa = seriesList[0].rows.find((r) => r.periodLabel === a)?.startDate || a;
      const sb = seriesList[0].rows.find((r) => r.periodLabel === b)?.startDate || b;
      return sa.localeCompare(sb);
    });

    const x = d3.scaleBand().domain(xDomain).range([0, width]).padding(0.1);

    // Find global y range across all series
    const allValues = seriesList.flatMap((s) => s.rows.flatMap((r) => [r.revenue, r.expense, r.net]));
    const yMax = d3.max(allValues) || 1;
    const yMin = Math.min(0, d3.min(allValues) || 0);
    const y = d3.scaleLinear().domain([yMin * 1.1, yMax * 1.1]).range([height, 0]);

    // Grid
    g.selectAll('.grid-line')
      .data(y.ticks(6))
      .enter()
      .append('line')
      .attr('x1', 0).attr('x2', width)
      .attr('y1', (d) => y(d)).attr('y2', (d) => y(d))
      .attr('stroke', '#e0e0e0').attr('stroke-dasharray', '3,3');

    // Zero line
    g.append('line')
      .attr('x1', 0).attr('x2', width)
      .attr('y1', y(0)).attr('y2', y(0))
      .attr('stroke', '#999').attr('stroke-width', 1);

    // X axis
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));
    if (viewMode === 'MONTH' && xDomain.length > 12) {
      xAxis.selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .style('font-size', '9px');
    }

    // Y axis
    g.append('g').call(d3.axisLeft(y).ticks(6).tickFormat((d) => fmtShort(d as number)));

    const xMid = (label: string) => (x(label) || 0) + x.bandwidth() / 2;

    // Draw each scenario as a set of lines
    const dashPatterns = ['', '6,3', '3,3', '1,3'];

    seriesList.forEach((s, si) => {
      const colors = SCENARIO_COLORS[si % SCENARIO_COLORS.length];
      const dash = dashPatterns[si % dashPatterns.length];

      const rowMap = new Map(s.rows.map((r) => [r.periodLabel, r]));

      for (const [key, color] of [['revenue', colors.revenue], ['expense', colors.expense], ['net', colors.net]] as const) {
        const points = xDomain
          .map((label) => ({ label, value: rowMap.get(label)?.[key] ?? null }))
          .filter((p): p is { label: string; value: number } => p.value !== null);

        const line = d3.line<{ label: string; value: number }>()
          .x((d) => xMid(d.label))
          .y((d) => y(d.value))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(points)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', si === 0 ? 2.5 : 2)
          .attr('stroke-dasharray', dash)
          .attr('d', line);

        if (xDomain.length <= 24) {
          g.selectAll(`.dot-${si}-${key}`)
            .data(points)
            .enter()
            .append('circle')
            .attr('cx', (d) => xMid(d.label))
            .attr('cy', (d) => y(d.value))
            .attr('r', 3)
            .attr('fill', color);
        }
      }
    });

    // Legend
    const legend = g.append('g').attr('transform', `translate(${width + 12}, 0)`);
    let ly = 0;
    seriesList.forEach((s, si) => {
      const colors = SCENARIO_COLORS[si % SCENARIO_COLORS.length];
      const dash = dashPatterns[si % dashPatterns.length];

      // Scenario label
      legend.append('text')
        .attr('x', 0).attr('y', ly + 10)
        .text(s.scenario)
        .style('font-size', '10px').style('font-weight', '600').attr('fill', '#333');
      ly += 16;

      for (const [label, color] of [['Rev', colors.revenue], ['Exp', colors.expense], ['Net', colors.net]] as const) {
        legend.append('line')
          .attr('x1', 0).attr('x2', 16)
          .attr('y1', ly + 6).attr('y2', ly + 6)
          .attr('stroke', color).attr('stroke-width', 2)
          .attr('stroke-dasharray', dash);
        legend.append('text')
          .attr('x', 20).attr('y', ly + 10)
          .text(label)
          .style('font-size', '10px').attr('fill', '#555');
        ly += 14;
      }
      ly += 6;
    });

    // Tooltip
    const tooltip = d3
      .select(svgRef.current.parentElement!)
      .selectAll('.chart-tooltip')
      .data([null])
      .join('div')
      .attr('class', 'chart-tooltip')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', 'rgba(0,0,0,0.9)')
      .style('color', '#fff')
      .style('padding', '10px 14px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('display', 'none')
      .style('z-index', '10')
      .style('max-width', '320px');

    // Hover rects
    g.selectAll('.hover-rect')
      .data(xDomain)
      .enter()
      .append('rect')
      .attr('x', (d) => x(d)!)
      .attr('y', 0)
      .attr('width', x.bandwidth())
      .attr('height', height)
      .attr('fill', 'transparent')
      .on('mouseover', (event, label) => {
        let html = `<strong>${label}</strong>`;
        for (const s of seriesList) {
          const row = s.rows.find((r) => r.periodLabel === label);
          if (!row) continue;
          html += `<br/><span style="color:#aaa;font-size:10px">${s.scenario}</span>`;
          html += `<br/>Rev: ${fmt(row.revenue, currency)}`;
          html += ` &nbsp; Exp: ${fmt(row.expense, currency)}`;
          html += ` &nbsp; <strong>Net: ${fmt(row.net, currency)}</strong>`;
        }
        tooltip.style('display', 'block').html(html);
      })
      .on('mousemove', (event) => {
        const rect = svgRef.current!.parentElement!.getBoundingClientRect();
        tooltip
          .style('left', `${event.clientX - rect.left + 15}px`)
          .style('top', `${event.clientY - rect.top - 10}px`);
      })
      .on('mouseout', () => tooltip.style('display', 'none'));
  }, [seriesList, currency, viewMode]);

  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

  if (seriesList.length === 0) return null;

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef} style={{ width: '100%', height: 360 }} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export function BudgetProjectionsPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<string[]>([]);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'' | 'REVENUE' | 'EXPENSE'>('');
  const [viewMode, setViewMode] = useState<'MONTH' | 'YEAR'>('YEAR');
  const [yearRange, setYearRange] = useState(5);
  const [projection, setProjection] = useState<MultiScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(false);
  const [assumptionsScenario, setAssumptionsScenario] = useState<string | null>(null);
  const [assumptionsRaw, setAssumptionsRaw] = useState('');
  const [assumptionsLoading, setAssumptionsLoading] = useState(false);

  const ensureAssumptions = async (): Promise<string> => {
    if (assumptionsRaw) return assumptionsRaw;
    const md = await getProjectionAssumptions();
    setAssumptionsRaw(md);
    return md;
  };

  const showAssumptionsFor = async (scenario: string) => {
    if (assumptionsRaw) {
      setAssumptionsScenario(scenario);
      return;
    }
    setAssumptionsLoading(true);
    try {
      await ensureAssumptions();
      setAssumptionsScenario(scenario);
    } catch (e: any) {
      setError('Failed to load assumptions: ' + e.message);
    } finally {
      setAssumptionsLoading(false);
    }
  };

  const handlePrintPdf = async (series: ScenarioSeries & { rows: ProjectionRow[] }) => {
    try {
      const md = await ensureAssumptions();
      const scenarioHtml = markdownToHtml(extractScenarioSections(md, series.scenario));
      const entity = entities.find((e) => e.id === selectedEntity);
      const entityName = entity ? `${entity.label} (${entity.entity_type})` : selectedEntity;
      printScenarioPdf(series, currency, viewMode, yearRange, entityName, scenarioHtml);
    } catch (e: any) {
      setError('Failed to generate PDF: ' + e.message);
    }
  };

  const assumptionsHtml = assumptionsScenario
    ? markdownToHtml(extractScenarioSections(assumptionsRaw, assumptionsScenario))
    : '';

  useEffect(() => {
    // Only show entities that have budget data (scenarios)
    getEntities()
      .then(async (data) => {
        const withBudgets: any[] = [];
        for (const ent of data.entities) {
          try {
            const s = await getScenariosByEntity(ent.id);
            if (s.scenarios.length > 0) withBudgets.push(ent);
          } catch { /* skip */ }
        }
        setEntities(withBudgets.length > 0 ? withBudgets : data.entities);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedEntity) return;
    setScenarios([]);
    setSelectedScenarios([]);
    setProjection(null);
    getScenariosByEntity(selectedEntity)
      .then((data) => setScenarios(data.scenarios))
      .catch(() => setScenarios([]));
  }, [selectedEntity]);

  useEffect(() => {
    if (!selectedEntity) return;
    loadProjection();
  }, [selectedEntity, selectedScenarios, categoryFilter]);

  const loadProjection = async () => {
    if (!selectedEntity) return;
    setLoading(true);
    setError('');
    try {
      const data = await getProjectionTimeSeries(
        selectedEntity,
        undefined,
        categoryFilter || undefined,
        selectedScenarios.length > 0 ? selectedScenarios : undefined,
      );
      setProjection(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleScenario = (name: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  };

  // Apply view transforms per series
  const displaySeries = (projection?.series || []).map((s) => {
    let rows = filterRowsByRange(s.rows, yearRange);
    if (viewMode === 'YEAR') rows = groupRowsByYear(rows);
    return { ...s, rows };
  });

  const currency = projection?.currency || 'CAD';

  return (
    <div>
      <h2>Budget Projections</h2>

      {/* Controls */}
      <div className="card">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Entity</label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              style={{ width: 260 }}
            >
              <option value="">Select entity...</option>
              {entities.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ent.label} ({ent.entity_type})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              style={{ width: 140 }}
            >
              <option value="">All</option>
              <option value="REVENUE">Revenue only</option>
              <option value="EXPENSE">Expenses only</option>
            </select>
          </div>

          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>View</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'MONTH' | 'YEAR')}
              style={{ width: 120 }}
            >
              <option value="MONTH">Monthly</option>
              <option value="YEAR">Yearly</option>
            </select>
          </div>

          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Range</label>
            <select
              value={yearRange}
              onChange={(e) => setYearRange(Number(e.target.value))}
              style={{ width: 120 }}
            >
              <option value={1}>1 Year</option>
              <option value={2}>2 Years</option>
              <option value={3}>3 Years</option>
              <option value={5}>5 Years</option>
            </select>
          </div>
        </div>

        {/* Scenario multi-select */}
        {scenarios.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: '#555' }}>
              Scenarios (empty = all independently):
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {scenarios.map((s) => {
                const active = selectedScenarios.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleScenario(s)}
                    style={{
                      padding: '4px 14px',
                      borderRadius: 16,
                      border: active ? '2px solid #1976d2' : '1px solid #bbb',
                      background: active ? '#e3f2fd' : '#fff',
                      color: active ? '#1565c0' : '#555',
                      fontWeight: active ? 600 : 400,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
      {loading && <div style={{ marginTop: 12, color: '#888' }}>Loading projection...</div>}

      {/* Per-scenario summary cards */}
      {displaySeries.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          {displaySeries.map((s, si) => (
            <div
              key={s.scenario}
              className="card"
              style={{
                flex: '1 1 280px',
                padding: '12px 20px',
                background: '#1a1a2e',
                color: '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 600 }}>
                  {s.scenario}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => showAssumptionsFor(s.scenario)}
                    disabled={assumptionsLoading}
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      color: '#90caf9',
                      fontSize: '0.7rem',
                      padding: '2px 10px',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    Assumptions
                  </button>
                  <button
                    onClick={() => handlePrintPdf(s)}
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      color: '#a5d6a7',
                      fontSize: '0.7rem',
                      padding: '2px 10px',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    Print PDF
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <SummaryMetric label="Revenue" value={s.totals.revenue} currency={currency} color="#4caf50" />
                <SummaryMetric label="Expenses" value={s.totals.expense} currency={currency} color="#ef5350" />
                <SummaryMetric label="Net" value={s.totals.net} currency={currency} />
                <SummaryMetric
                  label="Margin"
                  value={s.totals.revenue > 0 ? (s.totals.net / s.totals.revenue) * 100 : 0}
                  currency={currency}
                  suffix="%"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart — all scenarios overlaid */}
      {displaySeries.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>
            Scenario Comparison — {viewMode === 'MONTH' ? 'Monthly' : 'Yearly'} ({yearRange}yr)
          </h3>
          <MultiScenarioChart
            seriesList={displaySeries}
            currency={currency}
            viewMode={viewMode}
          />
        </div>
      )}

      {/* Per-scenario data tables */}
      {displaySeries.map((s) => (
        <ScenarioTable
          key={s.scenario}
          series={s}
          currency={currency}
          expandedCategories={expandedCategories}
          onToggleExpanded={() => setExpandedCategories(!expandedCategories)}
        />
      ))}

      {projection && displaySeries.length === 0 && !loading && (
        <div className="card" style={{ marginTop: 16, color: '#888' }}>
          No budget data found for this entity. Create budgets with line items to see projections.
        </div>
      )}

      {/* Assumptions Modal — per scenario */}
      {assumptionsScenario && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
          }}
          onClick={() => setAssumptionsScenario(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 10, width: '90%', maxWidth: 900,
              maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 24px', borderBottom: '1px solid #e0e0e0',
            }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
                Assumptions & Sources — {assumptionsScenario}
              </h2>
              <button
                onClick={() => setAssumptionsScenario(null)}
                style={{
                  background: 'none', border: 'none', fontSize: '1.4rem',
                  cursor: 'pointer', color: '#888', padding: '0 4px',
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}
              dangerouslySetInnerHTML={{ __html: assumptionsHtml }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Parse categories like "Infrastructure > Compute & Hosting" into { group, detail } */
function parseCategory(cat: string): { group: string; detail: string } {
  const idx = cat.indexOf(' > ');
  if (idx >= 0) return { group: cat.slice(0, idx), detail: cat.slice(idx + 3) };
  return { group: cat, detail: cat };
}

/** Build ordered group structure from categories */
function buildCategoryGroups(categories: string[]) {
  const groupOrder: string[] = [];
  const groups = new Map<string, string[]>();
  for (const cat of categories) {
    const { group } = parseCategory(cat);
    if (!groups.has(group)) {
      groups.set(group, []);
      groupOrder.push(group);
    }
    groups.get(group)!.push(cat);
  }
  return { groupOrder, groups };
}

// Colors for group header rows
const GROUP_COLORS: Record<string, string> = {
  Revenue: '#e8f5e9',
  Infrastructure: '#e3f2fd',
  'Compliance & Security': '#fff3e0',
  Marketing: '#f3e5f5',
  Organizational: '#fce4ec',
  'Marketing (CA)': '#f3e5f5',
  'Marketing (US)': '#ede7f6',
  'Organizational (CA)': '#fce4ec',
  'Organizational (US)': '#fbe9e7',
  'Payment Processing (CA)': '#fff8e1',
  'Payment Processing (US)': '#fff3e0',
};

function ScenarioTable({
  series,
  currency,
  expandedCategories,
  onToggleExpanded,
}: {
  series: ScenarioSeries & { rows: ProjectionRow[] };
  currency: string;
  expandedCategories: boolean;
  onToggleExpanded: () => void;
}) {
  let cumulativeNet = 0;
  const { groupOrder, groups } = buildCategoryGroups(series.categories);

  // Compute group subtotals per row for the summary columns
  const groupSubtotal = (row: ProjectionRow, cats: string[]) =>
    cats.reduce((sum, c) => sum + (row.breakdown[c] || 0), 0);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem' }}>{series.scenario}</h3>
        {series.categories.length > 0 && (
          <button
            onClick={onToggleExpanded}
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            {expandedCategories ? 'Hide Breakdown' : 'Show Breakdown'}
          </button>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Period</th>
              <th style={{ textAlign: 'right' }}>Revenue</th>
              <th style={{ textAlign: 'right' }}>Expenses</th>
              <th style={{ textAlign: 'right' }}>Net</th>
              <th style={{ textAlign: 'right' }}>Cumulative</th>
              {expandedCategories && groupOrder.map((group) => {
                const cats = groups.get(group)!;
                const hasDetail = cats.length > 1 || parseCategory(cats[0]).detail !== group;
                return [
                  <th
                    key={`g-${group}`}
                    style={{
                      textAlign: 'right', fontSize: '0.7rem',
                      background: GROUP_COLORS[group] || '#f5f5f5',
                      fontWeight: 700, borderLeft: '2px solid #ddd',
                    }}
                  >
                    {group}
                  </th>,
                  ...(hasDetail ? cats.map((cat) => (
                    <th
                      key={cat}
                      style={{
                        textAlign: 'right', fontSize: '0.65rem', maxWidth: 90,
                        color: '#666', fontWeight: 400,
                        background: GROUP_COLORS[group] ? GROUP_COLORS[group] + '80' : '#fafafa',
                      }}
                    >
                      {parseCategory(cat).detail}
                    </th>
                  )) : []),
                ];
              })}
            </tr>
          </thead>
          <tbody>
            {series.rows.map((row) => {
              cumulativeNet += row.net;
              return (
                <tr key={row.periodId}>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{row.periodLabel}</td>
                  <td style={{ textAlign: 'right', color: '#2e7d32', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(row.revenue, currency)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#d32f2f', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(row.expense, currency)}
                  </td>
                  <td style={{
                    textAlign: 'right', fontWeight: 600,
                    color: row.net >= 0 ? '#2e7d32' : '#d32f2f',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {fmt(row.net, currency)}
                  </td>
                  <td style={{
                    textAlign: 'right',
                    color: cumulativeNet >= 0 ? '#1565c0' : '#c62828',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {fmt(cumulativeNet, currency)}
                  </td>
                  {expandedCategories && groupOrder.map((group) => {
                    const cats = groups.get(group)!;
                    const hasDetail = cats.length > 1 || parseCategory(cats[0]).detail !== group;
                    const sub = groupSubtotal(row, cats);
                    return [
                      <td
                        key={`g-${group}`}
                        style={{
                          textAlign: 'right', fontWeight: 600,
                          fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums',
                          borderLeft: '2px solid #eee',
                          background: GROUP_COLORS[group] ? GROUP_COLORS[group] + '40' : undefined,
                        }}
                      >
                        {sub ? fmt(sub, currency) : '-'}
                      </td>,
                      ...(hasDetail ? cats.map((cat) => (
                        <td
                          key={cat}
                          style={{
                            textAlign: 'right', fontSize: '0.75rem',
                            fontVariantNumeric: 'tabular-nums', color: '#555',
                          }}
                        >
                          {row.breakdown[cat] ? fmt(row.breakdown[cat], currency) : '-'}
                        </td>
                      )) : []),
                    ];
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 700, borderTop: '2px solid #333' }}>
              <td>Total</td>
              <td style={{ textAlign: 'right', color: '#2e7d32' }}>{fmt(series.totals.revenue, currency)}</td>
              <td style={{ textAlign: 'right', color: '#d32f2f' }}>{fmt(series.totals.expense, currency)}</td>
              <td style={{
                textAlign: 'right',
                color: series.totals.net >= 0 ? '#2e7d32' : '#d32f2f',
              }}>
                {fmt(series.totals.net, currency)}
              </td>
              <td />
              {expandedCategories && groupOrder.map((group) => {
                const cats = groups.get(group)!;
                const hasDetail = cats.length > 1 || parseCategory(cats[0]).detail !== group;
                const groupTotal = series.rows.reduce((s, r) => s + groupSubtotal(r, cats), 0);
                return [
                  <td
                    key={`g-${group}`}
                    style={{
                      textAlign: 'right', fontSize: '0.8rem',
                      borderLeft: '2px solid #eee',
                      background: GROUP_COLORS[group] ? GROUP_COLORS[group] + '40' : undefined,
                    }}
                  >
                    {groupTotal ? fmt(groupTotal, currency) : '-'}
                  </td>,
                  ...(hasDetail ? cats.map((cat) => {
                    const catTotal = series.rows.reduce((s, r) => s + (r.breakdown[cat] || 0), 0);
                    return (
                      <td key={cat} style={{ textAlign: 'right', fontSize: '0.75rem', color: '#555' }}>
                        {catTotal ? fmt(catTotal, currency) : '-'}
                      </td>
                    );
                  }) : []),
                ];
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  currency,
  color,
  suffix,
}: {
  label: string;
  value: number;
  currency: string;
  color?: string;
  suffix?: string;
}) {
  const displayValue = suffix === '%' ? `${value.toFixed(1)}%` : fmt(value, currency);
  const displayColor = color || (value >= 0 ? '#4caf50' : '#ef5350');

  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase' }}>{label}</div>
      <div style={{
        fontSize: '1.1rem', fontWeight: 700,
        color: displayColor, fontVariantNumeric: 'tabular-nums',
      }}>
        {displayValue}
      </div>
    </div>
  );
}
