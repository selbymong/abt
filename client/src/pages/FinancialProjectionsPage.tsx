import { useEffect, useState } from 'react';
import { getEntities, getPeriods, getFullFinancialStatements } from '../api/client';

// ── Types ──────────────────────────────────────────────────────

interface LineItem {
  label: string;
  category: string;
  currentPeriod: number;
  priorPeriod: number;
  variance: number;
  variancePercent: number;
}

interface Section {
  title: string;
  items: LineItem[];
  subtotal: number;
  priorSubtotal: number;
}

interface Note {
  number: number;
  title: string;
  content: string;
}

interface Statement {
  type: string;
  entityId: string;
  entityName: string;
  periodId: string;
  periodLabel: string;
  priorPeriodId?: string;
  priorPeriodLabel?: string;
  currency: string;
  generatedAt: string;
  sections: Section[];
  totals: Record<string, number>;
  notes: Note[];
}

// ── Helpers ────────────────────────────────────────────────────

const fmt = (n: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const fmtPct = (n: number) =>
  n === 0 ? '-' : `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;

const varianceColor = (n: number) =>
  n > 0 ? '#2e7d32' : n < 0 ? '#d32f2f' : '#666';

const STATEMENT_TITLES: Record<string, string> = {
  INCOME_STATEMENT: 'Income Statement',
  BALANCE_SHEET: 'Balance Sheet',
  CASH_FLOW: 'Cash Flow Statement',
  EQUITY_CHANGES: 'Statement of Changes in Equity',
};

// ── Statement Card Component ───────────────────────────────────

function StatementCard({ statement, comparative }: { statement: Statement; comparative: boolean }) {
  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>
          {STATEMENT_TITLES[statement.type] || statement.type}
        </h3>
        <span style={{ fontSize: '0.75rem', color: '#888' }}>
          {statement.currency} | Generated {new Date(statement.generatedAt).toLocaleString()}
        </span>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width: '40%' }}>Line Item</th>
            <th style={{ textAlign: 'right' }}>Current Period</th>
            {comparative && <th style={{ textAlign: 'right' }}>Prior Period</th>}
            {comparative && <th style={{ textAlign: 'right' }}>Variance</th>}
            {comparative && <th style={{ textAlign: 'right' }}>%</th>}
          </tr>
        </thead>
        <tbody>
          {statement.sections.map((section) => (
            <SectionRows key={section.title} section={section} currency={statement.currency} comparative={comparative} />
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid #333', fontWeight: 700 }}>
            <td colSpan={comparative ? 5 : 2} style={{ paddingTop: 12 }}>
              {Object.entries(statement.totals).map(([key, val]) => (
                <span key={key} style={{ marginRight: 24, fontSize: '0.85rem' }}>
                  {formatTotalKey(key)}: {fmt(val, statement.currency)}
                </span>
              ))}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Notes */}
      {statement.notes.length > 0 && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: '#f8f9fa', borderRadius: 4 }}>
          <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 4, color: '#555' }}>Notes</div>
          {statement.notes.map((note) => (
            <div key={note.number} style={{ fontSize: '0.78rem', marginBottom: 2, color: '#666' }}>
              <strong>{note.number}.</strong> {note.title}: {note.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionRows({ section, currency, comparative }: {
  section: Section; currency: string; comparative: boolean;
}) {
  return (
    <>
      {/* Section header */}
      <tr style={{ background: '#f8f9fa' }}>
        <td colSpan={comparative ? 5 : 2} style={{ fontWeight: 700, fontSize: '0.85rem' }}>
          {section.title}
        </td>
      </tr>
      {/* Line items */}
      {section.items.map((item, i) => (
        <tr key={i}>
          <td style={{ paddingLeft: 24 }}>{item.label}</td>
          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(item.currentPeriod, currency)}
          </td>
          {comparative && (
            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#888' }}>
              {fmt(item.priorPeriod, currency)}
            </td>
          )}
          {comparative && (
            <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: varianceColor(item.variance) }}>
              {fmt(item.variance, currency)}
            </td>
          )}
          {comparative && (
            <td style={{ textAlign: 'right', fontSize: '0.8rem', color: varianceColor(item.variancePercent) }}>
              {fmtPct(item.variancePercent)}
            </td>
          )}
        </tr>
      ))}
      {/* Subtotal */}
      <tr style={{ fontWeight: 600, borderBottom: '1px solid #ccc' }}>
        <td style={{ paddingLeft: 24 }}>Subtotal: {section.title}</td>
        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {fmt(section.subtotal, currency)}
        </td>
        {comparative && (
          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#888' }}>
            {fmt(section.priorSubtotal, currency)}
          </td>
        )}
        {comparative && <td />}
        {comparative && <td />}
      </tr>
    </>
  );
}

function formatTotalKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
}

// ── Main Component ─────────────────────────────────────────────

export function FinancialProjectionsPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [priorPeriod, setPriorPeriod] = useState('');
  const [currency, setCurrency] = useState('CAD');
  const [statements, setStatements] = useState<{
    incomeStatement: Statement;
    balanceSheet: Statement;
    cashFlow: Statement;
    equityChanges: Statement;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Load entities
  useEffect(() => {
    getEntities()
      .then((data) => setEntities(data.entities))
      .catch((e) => setError(e.message));
  }, []);

  // Load periods when entity changes
  useEffect(() => {
    if (!selectedEntity) return;
    setPeriods([]);
    setSelectedPeriod('');
    setPriorPeriod('');
    setStatements(null);
    getPeriods(selectedEntity)
      .then((data) => setPeriods(data.items || []))
      .catch(() => setPeriods([]));

    // Set currency from entity
    const entity = entities.find((e) => e.id === selectedEntity);
    if (entity?.functional_currency) setCurrency(entity.functional_currency);
  }, [selectedEntity, entities]);

  const generate = async () => {
    if (!selectedEntity || !selectedPeriod) return;
    setLoading(true);
    setError('');
    try {
      const data = await getFullFinancialStatements(
        selectedEntity, selectedPeriod, priorPeriod || undefined, currency,
      );
      setStatements(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const comparative = !!priorPeriod && !!statements;

  const tabs = [
    { key: 'all', label: 'Full Set' },
    { key: 'income', label: 'Income Statement' },
    { key: 'balance', label: 'Balance Sheet' },
    { key: 'cashflow', label: 'Cash Flow' },
    { key: 'equity', label: 'Equity Changes' },
  ];

  return (
    <div>
      <h2>Financial Projections</h2>

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
            <label>Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{ width: 220 }}
              disabled={!selectedEntity}
            >
              <option value="">Select period...</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label || p.name || p.id?.slice(0, 8)} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Prior Period (comparative)</label>
            <select
              value={priorPeriod}
              onChange={(e) => setPriorPeriod(e.target.value)}
              style={{ width: 220 }}
              disabled={!selectedEntity}
            >
              <option value="">None</option>
              {periods
                .filter((p) => p.id !== selectedPeriod)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label || p.name || p.id?.slice(0, 8)} ({p.status})
                  </option>
                ))}
            </select>
          </div>

          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: 100 }}>
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <button onClick={generate} disabled={loading || !selectedEntity || !selectedPeriod}>
            {loading ? 'Generating...' : 'Generate Statements'}
          </button>
        </div>
      </div>

      {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}

      {/* Tabs */}
      {statements && (
        <>
          <div style={{ display: 'flex', gap: 4, marginTop: 16, marginBottom: 16 }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: activeTab === tab.key ? '#0f3460' : '#e0e0e0',
                  color: activeTab === tab.key ? '#fff' : '#333',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Statements */}
          {(activeTab === 'all' || activeTab === 'income') && (
            <StatementCard statement={statements.incomeStatement} comparative={comparative} />
          )}
          {(activeTab === 'all' || activeTab === 'balance') && (
            <StatementCard statement={statements.balanceSheet} comparative={comparative} />
          )}
          {(activeTab === 'all' || activeTab === 'cashflow') && (
            <StatementCard statement={statements.cashFlow} comparative={comparative} />
          )}
          {(activeTab === 'all' || activeTab === 'equity') && (
            <StatementCard statement={statements.equityChanges} comparative={comparative} />
          )}

          {/* Totals summary bar */}
          <div className="card" style={{
            display: 'flex', gap: 20, flexWrap: 'wrap',
            padding: '12px 20px', background: '#1a1a2e', color: '#fff',
          }}>
            <SummaryMetric label="Net Income" value={statements.incomeStatement.totals.netIncome} currency={currency} />
            <SummaryMetric label="Total Assets" value={statements.balanceSheet.totals.totalAssets} currency={currency} />
            <SummaryMetric label="Total Liabilities" value={statements.balanceSheet.totals.totalLiabilities} currency={currency} />
            <SummaryMetric label="Total Equity" value={statements.balanceSheet.totals.totalEquity} currency={currency} />
            <SummaryMetric label="Net Cash Change" value={statements.cashFlow.totals.netChange} currency={currency} />
          </div>
        </>
      )}
    </div>
  );
}

function SummaryMetric({ label, value, currency }: { label: string; value: number; currency: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase' }}>{label}</div>
      <div style={{
        fontSize: '1.1rem', fontWeight: 700,
        color: value >= 0 ? '#4caf50' : '#ef5350',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {fmt(value, currency)}
      </div>
    </div>
  );
}
