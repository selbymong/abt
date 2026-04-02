import { useEffect, useState, useRef, useCallback } from 'react';
import { getEntities, getBudgetsByEntity, getProjectionTimeSeries } from '../api/client';
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

interface ProjectionResult {
  entityId: string;
  budgetIds: string[];
  groupBy: string;
  currency: string;
  rows: ProjectionRow[];
  categories: string[];
  totals: { revenue: number; expense: number; net: number };
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
  const yearMap = new Map<number, ProjectionRow>();
  for (const row of rows) {
    const { year } = parseYearMonth(row.startDate);
    if (!yearMap.has(year)) {
      yearMap.set(year, {
        periodId: `year-${year}`,
        periodLabel: `${year}`,
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
        revenue: 0,
        expense: 0,
        net: 0,
        breakdown: {},
      });
    }
    const agg = yearMap.get(year)!;
    agg.revenue += row.revenue;
    agg.expense += row.expense;
    agg.net += row.net;
    for (const [cat, val] of Object.entries(row.breakdown)) {
      agg.breakdown[cat] = (agg.breakdown[cat] || 0) + val;
    }
  }
  return [...yearMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row);
}

function filterRowsByRange(rows: ProjectionRow[], years: number): ProjectionRow[] {
  if (rows.length === 0 || years <= 0) return rows;
  const first = rows[0].startDate;
  const startDate = new Date(first);
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + years);
  const endStr = endDate.toISOString().slice(0, 10);
  return rows.filter((r) => r.startDate < endStr);
}

// ── D3 Chart Component ─────────────────────────────────────────

function ProjectionChart({
  rows,
  currency,
  viewMode,
  chartType,
}: {
  rows: ProjectionRow[];
  currency: string;
  viewMode: 'MONTH' | 'YEAR';
  chartType: 'line' | 'bar';
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  const draw = useCallback(() => {
    if (!svgRef.current || rows.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 80, bottom: 50, left: 70 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 320 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(rows.map((r) => r.periodLabel))
      .range([0, width])
      .padding(chartType === 'bar' ? 0.3 : 0.1);

    const allValues = rows.flatMap((r) => [r.revenue, r.expense, Math.abs(r.net)]);
    const yMax = d3.max(allValues) || 1;
    const yMin = Math.min(0, d3.min(rows.map((r) => r.net)) || 0);

    const y = d3
      .scaleLinear()
      .domain([yMin * 1.1, yMax * 1.1])
      .range([height, 0]);

    // Grid lines
    g.selectAll('.grid-line')
      .data(y.ticks(6))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', '#e0e0e0')
      .attr('stroke-dasharray', '3,3');

    // Zero line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', y(0))
      .attr('y2', y(0))
      .attr('stroke', '#999')
      .attr('stroke-width', 1);

    // X axis
    const xAxis = g
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    if (viewMode === 'MONTH' && rows.length > 12) {
      xAxis
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .style('font-size', '9px');
    }

    // Y axis
    g.append('g').call(
      d3.axisLeft(y).ticks(6).tickFormat((d) => fmtShort(d as number)),
    );

    const colors = { revenue: '#4caf50', expense: '#ef5350', net: '#2196f3' };

    if (chartType === 'bar') {
      const barWidth = x.bandwidth() / 3;

      // Revenue bars
      g.selectAll('.bar-rev')
        .data(rows)
        .enter()
        .append('rect')
        .attr('x', (d) => x(d.periodLabel)!)
        .attr('y', (d) => y(d.revenue))
        .attr('width', barWidth)
        .attr('height', (d) => height - y(d.revenue))
        .attr('fill', colors.revenue)
        .attr('opacity', 0.85);

      // Expense bars
      g.selectAll('.bar-exp')
        .data(rows)
        .enter()
        .append('rect')
        .attr('x', (d) => x(d.periodLabel)! + barWidth)
        .attr('y', (d) => y(d.expense))
        .attr('width', barWidth)
        .attr('height', (d) => height - y(d.expense))
        .attr('fill', colors.expense)
        .attr('opacity', 0.85);

      // Net bars
      g.selectAll('.bar-net')
        .data(rows)
        .enter()
        .append('rect')
        .attr('x', (d) => x(d.periodLabel)! + barWidth * 2)
        .attr('y', (d) => y(Math.max(0, d.net)))
        .attr('width', barWidth)
        .attr('height', (d) => Math.abs(y(d.net) - y(0)))
        .attr('fill', colors.net)
        .attr('opacity', 0.85);
    } else {
      // Line chart
      const xMid = (label: string) => (x(label) || 0) + x.bandwidth() / 2;

      for (const [key, color] of Object.entries(colors) as [keyof typeof colors, string][]) {
        const line = d3
          .line<ProjectionRow>()
          .x((d) => xMid(d.periodLabel))
          .y((d) => y(d[key]))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(rows)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 2)
          .attr('d', line);

        g.selectAll(`.dot-${key}`)
          .data(rows)
          .enter()
          .append('circle')
          .attr('cx', (d) => xMid(d.periodLabel))
          .attr('cy', (d) => y(d[key]))
          .attr('r', rows.length > 24 ? 2 : 3.5)
          .attr('fill', color);
      }
    }

    // Legend
    const legend = g.append('g').attr('transform', `translate(${width + 10}, 0)`);
    const legendItems = [
      { label: 'Revenue', color: colors.revenue },
      { label: 'Expenses', color: colors.expense },
      { label: 'Net', color: colors.net },
    ];
    legendItems.forEach((item, i) => {
      legend
        .append('rect')
        .attr('x', 0)
        .attr('y', i * 20)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', item.color);
      legend
        .append('text')
        .attr('x', 16)
        .attr('y', i * 20 + 10)
        .text(item.label)
        .style('font-size', '11px')
        .attr('fill', '#333');
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
      .style('background', 'rgba(0,0,0,0.85)')
      .style('color', '#fff')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('display', 'none')
      .style('z-index', '10');

    // Invisible hover rects
    g.selectAll('.hover-rect')
      .data(rows)
      .enter()
      .append('rect')
      .attr('x', (d) => x(d.periodLabel)!)
      .attr('y', 0)
      .attr('width', x.bandwidth())
      .attr('height', height)
      .attr('fill', 'transparent')
      .on('mouseover', (event, d) => {
        tooltip
          .style('display', 'block')
          .html(
            `<strong>${d.periodLabel}</strong><br/>` +
            `Revenue: ${fmt(d.revenue, currency)}<br/>` +
            `Expenses: ${fmt(d.expense, currency)}<br/>` +
            `Net: ${fmt(d.net, currency)}`,
          );
      })
      .on('mousemove', (event) => {
        const rect = svgRef.current!.parentElement!.getBoundingClientRect();
        tooltip
          .style('left', `${event.clientX - rect.left + 15}px`)
          .style('top', `${event.clientY - rect.top - 10}px`);
      })
      .on('mouseout', () => {
        tooltip.style('display', 'none');
      });
  }, [rows, currency, viewMode, chartType]);

  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

  if (rows.length === 0) return null;

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef} style={{ width: '100%', height: 320 }} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export function BudgetProjectionsPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedBudgets, setSelectedBudgets] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'' | 'REVENUE' | 'EXPENSE'>('');
  const [viewMode, setViewMode] = useState<'MONTH' | 'YEAR'>('MONTH');
  const [yearRange, setYearRange] = useState(3);
  const [chartType, setChartType] = useState<'line' | 'bar'>('bar');
  const [projection, setProjection] = useState<ProjectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(false);

  // Load entities
  useEffect(() => {
    getEntities()
      .then((data) => setEntities(data.entities))
      .catch((e) => setError(e.message));
  }, []);

  // Load budgets when entity changes
  useEffect(() => {
    if (!selectedEntity) return;
    setBudgets([]);
    setSelectedBudgets([]);
    setProjection(null);

    getBudgetsByEntity(selectedEntity)
      .then((data) => setBudgets(data.budgets))
      .catch(() => setBudgets([]));
  }, [selectedEntity]);

  // Auto-load projection when entity or filters change
  useEffect(() => {
    if (!selectedEntity) return;
    loadProjection();
  }, [selectedEntity, selectedBudgets, categoryFilter]);

  const loadProjection = async () => {
    if (!selectedEntity) return;
    setLoading(true);
    setError('');
    try {
      const data = await getProjectionTimeSeries(
        selectedEntity,
        selectedBudgets.length > 0 ? selectedBudgets : undefined,
        categoryFilter || undefined,
      );
      setProjection(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBudget = (id: string) => {
    setSelectedBudgets((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  // Apply view transformations
  let displayRows = projection?.rows || [];
  displayRows = filterRowsByRange(displayRows, yearRange);
  if (viewMode === 'YEAR') {
    displayRows = groupRowsByYear(displayRows);
  }

  const currency = projection?.currency || 'CAD';

  // Filtered totals
  const totals = displayRows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      expense: acc.expense + r.expense,
      net: acc.net + r.net,
    }),
    { revenue: 0, expense: 0, net: 0 },
  );

  // Cumulative net for running total column
  let cumulativeNet = 0;

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
              <option value={4}>4 Years</option>
              <option value={5}>5 Years</option>
            </select>
          </div>

          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Chart</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as 'line' | 'bar')}
              style={{ width: 100 }}
            >
              <option value="bar">Bar</option>
              <option value="line">Line</option>
            </select>
          </div>
        </div>

        {/* Budget filter checkboxes */}
        {budgets.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: '#555' }}>
              Filter by budget (empty = all):
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {budgets.map((b) => (
                <label
                  key={b.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: selectedBudgets.includes(b.id) ? '#e3f2fd' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedBudgets.includes(b.id)}
                    onChange={() => toggleBudget(b.id)}
                  />
                  {b.name}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}

      {loading && <div style={{ marginTop: 12, color: '#888' }}>Loading projection...</div>}

      {/* Summary cards */}
      {projection && displayRows.length > 0 && (
        <>
          <div
            className="card"
            style={{
              display: 'flex',
              gap: 24,
              flexWrap: 'wrap',
              padding: '12px 20px',
              background: '#1a1a2e',
              color: '#fff',
              marginTop: 16,
            }}
          >
            <SummaryMetric label="Total Revenue" value={totals.revenue} currency={currency} color="#4caf50" />
            <SummaryMetric label="Total Expenses" value={totals.expense} currency={currency} color="#ef5350" />
            <SummaryMetric label="Net Income" value={totals.net} currency={currency} />
            <SummaryMetric
              label="Margin"
              value={totals.revenue > 0 ? (totals.net / totals.revenue) * 100 : 0}
              currency={currency}
              suffix="%"
            />
            <SummaryMetric label="Periods" value={displayRows.length} currency={currency} isCount />
          </div>

          {/* Chart */}
          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>
              Revenue vs Expenses — {viewMode === 'MONTH' ? 'Monthly' : 'Yearly'} ({yearRange}yr)
            </h3>
            <ProjectionChart
              rows={displayRows}
              currency={currency}
              viewMode={viewMode}
              chartType={chartType}
            />
          </div>

          {/* Data table */}
          <div className="card" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Projection Data</h3>
              {projection.categories.length > 0 && (
                <button
                  onClick={() => setExpandedCategories(!expandedCategories)}
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
                    {expandedCategories &&
                      projection.categories.map((cat) => (
                        <th key={cat} style={{ textAlign: 'right', fontSize: '0.7rem', maxWidth: 100 }}>
                          {cat}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => {
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
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 600,
                            color: row.net >= 0 ? '#2e7d32' : '#d32f2f',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {fmt(row.net, currency)}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            color: cumulativeNet >= 0 ? '#1565c0' : '#c62828',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {fmt(cumulativeNet, currency)}
                        </td>
                        {expandedCategories &&
                          projection.categories.map((cat) => (
                            <td
                              key={cat}
                              style={{ textAlign: 'right', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}
                            >
                              {row.breakdown[cat] ? fmt(row.breakdown[cat], currency) : '-'}
                            </td>
                          ))}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, borderTop: '2px solid #333' }}>
                    <td>Total</td>
                    <td style={{ textAlign: 'right', color: '#2e7d32' }}>{fmt(totals.revenue, currency)}</td>
                    <td style={{ textAlign: 'right', color: '#d32f2f' }}>{fmt(totals.expense, currency)}</td>
                    <td
                      style={{
                        textAlign: 'right',
                        color: totals.net >= 0 ? '#2e7d32' : '#d32f2f',
                      }}
                    >
                      {fmt(totals.net, currency)}
                    </td>
                    <td />
                    {expandedCategories &&
                      projection.categories.map((cat) => {
                        const catTotal = displayRows.reduce(
                          (sum, r) => sum + (r.breakdown[cat] || 0),
                          0,
                        );
                        return (
                          <td key={cat} style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                            {catTotal ? fmt(catTotal, currency) : '-'}
                          </td>
                        );
                      })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {projection && displayRows.length === 0 && !loading && (
        <div className="card" style={{ marginTop: 16, color: '#888' }}>
          No budget data found for this entity. Create budgets with line items to see projections.
        </div>
      )}
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  currency,
  color,
  suffix,
  isCount,
}: {
  label: string;
  value: number;
  currency: string;
  color?: string;
  suffix?: string;
  isCount?: boolean;
}) {
  const displayValue = isCount
    ? String(value)
    : suffix === '%'
      ? `${value.toFixed(1)}%`
      : fmt(value, currency);
  const displayColor = color || (value >= 0 ? '#4caf50' : '#ef5350');

  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase' }}>{label}</div>
      <div
        style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: displayColor,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {displayValue}
      </div>
    </div>
  );
}
