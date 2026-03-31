import { useEffect, useState } from 'react';
import {
  getEntities,
  getPeriods,
  getBudgetsByEntity,
  getForecastSnapshotsByEntity,
  createForecastSnapshot,
  deleteForecastSnapshot,
  getForecastVsActual,
} from '../api/client';

// ── Types ──────────────────────────────────────────────────────

interface Snapshot {
  id: string;
  budget_id: string;
  entity_id: string;
  name: string;
  fiscal_year: number;
  currency: string;
  snapshot_type: string;
  created_by: string;
  created_at: string;
  notes: string | null;
  line_count?: number;
}

interface VsActualItem {
  periodId: string;
  nodeRefId: string;
  nodeRefType: string;
  economicCategory: string;
  budgetAmount: number;
  forecastAmount: number;
  actualAmount: number;
  forecastVariance: number;
  forecastVariancePercent: number;
  varianceType: string;
}

interface VsActualReport {
  snapshotId: string;
  snapshotName: string;
  entityId: string;
  fiscalYear: number;
  currency: string;
  snapshotDate: string;
  items: VsActualItem[];
  totalBudget: number;
  totalForecast: number;
  totalActual: number;
  totalForecastVariance: number;
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

const varianceColor = (type: string) =>
  type === 'FAVORABLE' ? '#2e7d32' : type === 'UNFAVORABLE' ? '#d32f2f' : '#666';

const badgeStyle = (type: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '0.7rem',
  fontWeight: 600,
  color: '#fff',
  background: type === 'FAVORABLE' ? '#2e7d32' : type === 'UNFAVORABLE' ? '#d32f2f' : '#888',
});

// ── Main Component ─────────────────────────────────────────────

export function ForecastSnapshotsPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [completedPeriods, setCompletedPeriods] = useState<string[]>([]);
  const [remainingPeriods, setRemainingPeriods] = useState<string[]>([]);

  // Report state
  const [report, setReport] = useState<VsActualReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Load entities
  useEffect(() => {
    getEntities()
      .then((data) => setEntities(data.entities))
      .catch((e) => setError(e.message));
  }, []);

  // Load budgets + periods when entity changes
  useEffect(() => {
    if (!selectedEntity) return;
    setBudgets([]);
    setPeriods([]);
    setSelectedBudget('');
    setSnapshots([]);
    setReport(null);

    getBudgetsByEntity(selectedEntity)
      .then((data) => setBudgets(data.budgets))
      .catch(() => setBudgets([]));

    getPeriods(selectedEntity)
      .then((data) => setPeriods(data.items || []))
      .catch(() => setPeriods([]));
  }, [selectedEntity]);

  // Load snapshots when budget changes
  useEffect(() => {
    if (!selectedEntity) return;
    setReport(null);
    loadSnapshots();
  }, [selectedEntity, selectedBudget]);

  const loadSnapshots = async () => {
    if (!selectedEntity) return;
    try {
      const data = await getForecastSnapshotsByEntity(
        selectedEntity,
        selectedBudget || undefined,
      );
      setSnapshots(data.snapshots);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCreate = async () => {
    if (!selectedBudget || !newName) return;
    setLoading(true);
    setError('');
    try {
      await createForecastSnapshot({
        budgetId: selectedBudget,
        name: newName,
        createdBy: 'admin',
        completedPeriodIds: completedPeriods,
        remainingPeriodIds: remainingPeriods,
        snapshotType: 'ROLLING',
        notes: newNotes || undefined,
      });
      setNewName('');
      setNewNotes('');
      setCompletedPeriods([]);
      setRemainingPeriods([]);
      setShowCreate(false);
      await loadSnapshots();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteForecastSnapshot(id);
      setSnapshots((prev) => prev.filter((s) => s.id !== id));
      if (report?.snapshotId === id) setReport(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleViewReport = async (snapshotId: string) => {
    setReportLoading(true);
    setError('');
    try {
      const data = await getForecastVsActual(snapshotId);
      setReport(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setReportLoading(false);
    }
  };

  const togglePeriod = (periodId: string, list: string[], setList: (v: string[]) => void) => {
    setList(
      list.includes(periodId)
        ? list.filter((id) => id !== periodId)
        : [...list, periodId],
    );
  };

  return (
    <div>
      <h2>Forecast Snapshots</h2>
      <p style={{ color: '#888', fontSize: '0.85rem', marginTop: -8 }}>
        Freeze forecast values at a point in time to compare against actuals later.
      </p>

      {/* Entity + Budget selectors */}
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
            <label>Budget (filter)</label>
            <select
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              style={{ width: 260 }}
              disabled={!selectedEntity}
            >
              <option value="">All budgets</option>
              {budgets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — FY{b.fiscal_year} ({b.status})
                </option>
              ))}
            </select>
          </div>

          <button
            disabled={!selectedBudget}
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? 'Cancel' : 'New Snapshot'}
          </button>
        </div>
      </div>

      {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}

      {/* Create Form */}
      {showCreate && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Create Forecast Snapshot</h3>

          <div className="form-row">
            <label>Snapshot Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Q1 Rolling Forecast"
              style={{ width: 300 }}
            />
          </div>

          <div className="form-row">
            <label>Notes (optional)</label>
            <input
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Why this snapshot was taken..."
              style={{ width: 400 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.8rem' }}>Completed Periods</label>
              <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 4, padding: 8, marginTop: 4 }}>
                {periods.map((p) => (
                  <label key={p.id} style={{ display: 'block', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={completedPeriods.includes(p.id)}
                      onChange={() => togglePeriod(p.id, completedPeriods, setCompletedPeriods)}
                      style={{ marginRight: 6 }}
                    />
                    {p.label || p.id?.slice(0, 8)} ({p.status})
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: '0.8rem' }}>Remaining Periods</label>
              <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 4, padding: 8, marginTop: 4 }}>
                {periods.map((p) => (
                  <label key={p.id} style={{ display: 'block', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={remainingPeriods.includes(p.id)}
                      onChange={() => togglePeriod(p.id, remainingPeriods, setRemainingPeriods)}
                      style={{ marginRight: 6 }}
                    />
                    {p.label || p.id?.slice(0, 8)} ({p.status})
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !newName || remainingPeriods.length === 0}
            style={{ marginTop: 12 }}
          >
            {loading ? 'Creating...' : 'Create Snapshot'}
          </button>
        </div>
      )}

      {/* Snapshot List */}
      {selectedEntity && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>
            Snapshots {snapshots.length > 0 && <span style={{ fontWeight: 400, color: '#888' }}>({snapshots.length})</span>}
          </h3>

          {snapshots.length === 0 ? (
            <p style={{ color: '#888' }}>No snapshots yet. Create one to freeze forecast values.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>FY</th>
                  <th>Lines</th>
                  <th>Created</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>
                      <span style={{
                        padding: '2px 6px', borderRadius: 3,
                        fontSize: '0.7rem', background: '#e3f2fd', color: '#1565c0',
                      }}>
                        {s.snapshot_type}
                      </span>
                    </td>
                    <td>{s.fiscal_year}</td>
                    <td>{s.line_count ?? '-'}</td>
                    <td style={{ fontSize: '0.8rem', color: '#888' }}>
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#888', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.notes || '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleViewReport(s.id)}
                        style={{ marginRight: 8, fontSize: '0.8rem' }}
                      >
                        Forecast vs Actual
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        style={{ fontSize: '0.8rem', background: '#d32f2f', color: '#fff' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Forecast vs Actual Report */}
      {reportLoading && <p style={{ marginTop: 12, color: '#888' }}>Loading report...</p>}

      {report && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>
              Forecast vs Actual: {report.snapshotName}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#888' }}>
              {report.currency} | Snapshot taken {new Date(report.snapshotDate).toLocaleDateString()}
            </span>
          </div>

          {/* Summary bar */}
          <div style={{
            display: 'flex', gap: 20, flexWrap: 'wrap',
            padding: '12px 20px', background: '#1a1a2e', color: '#fff',
            borderRadius: 6, marginBottom: 16,
          }}>
            <SummaryMetric label="Total Budget" value={report.totalBudget} currency={report.currency} />
            <SummaryMetric label="Total Forecast" value={report.totalForecast} currency={report.currency} />
            <SummaryMetric label="Total Actual" value={report.totalActual} currency={report.currency} />
            <SummaryMetric
              label="Forecast Variance"
              value={report.totalForecastVariance}
              currency={report.currency}
            />
          </div>

          {/* Detail table */}
          <table>
            <thead>
              <tr>
                <th>Node</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Budget</th>
                <th style={{ textAlign: 'right' }}>Forecast</th>
                <th style={{ textAlign: 'right' }}>Actual</th>
                <th style={{ textAlign: 'right' }}>Variance</th>
                <th style={{ textAlign: 'right' }}>%</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ fontSize: '0.8rem' }}>
                    <span style={{ color: '#888', marginRight: 4 }}>{item.nodeRefType}</span>
                    {item.nodeRefId.slice(0, 8)}
                  </td>
                  <td>{item.economicCategory}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#888' }}>
                    {fmt(item.budgetAmount, report.currency)}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(item.forecastAmount, report.currency)}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                    {fmt(item.actualAmount, report.currency)}
                  </td>
                  <td style={{
                    textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                    color: varianceColor(item.varianceType),
                  }}>
                    {fmt(item.forecastVariance, report.currency)}
                  </td>
                  <td style={{
                    textAlign: 'right', fontSize: '0.8rem',
                    color: varianceColor(item.varianceType),
                  }}>
                    {fmtPct(item.forecastVariancePercent)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={badgeStyle(item.varianceType)}>
                      {item.varianceType}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {report.items.length === 0 && (
            <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>
              No line items in this snapshot.
            </p>
          )}
        </div>
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
