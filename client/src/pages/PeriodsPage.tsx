import { useEffect, useState } from 'react';
import { getEntities, getPeriods, softClosePeriod, hardClosePeriod } from '../api/client';

export function PeriodsPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [periods, setPeriods] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getEntities()
      .then((data) => setEntities(data.entities))
      .catch((e) => setError(e.message));
  }, []);

  const loadPeriods = async (entityId: string) => {
    setSelectedEntity(entityId);
    setError('');
    try {
      const data = await getPeriods(entityId);
      setPeriods(data.items);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSoftClose = async (periodId: string) => {
    try {
      await softClosePeriod(periodId, 'admin@ebg.local');
      setMsg(`Period ${periodId} soft-closed`);
      loadPeriods(selectedEntity);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleHardClose = async (periodId: string) => {
    try {
      await hardClosePeriod(periodId, 'admin@ebg.local');
      setMsg(`Period ${periodId} hard-closed`);
      loadPeriods(selectedEntity);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h2>Accounting Periods</h2>
      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}

      <div className="form-row">
        <label>Entity:</label>
        <select value={selectedEntity} onChange={(e) => loadPeriods(e.target.value)}>
          <option value="">-- Select --</option>
          {entities.map((e) => (
            <option key={e.id} value={e.id}>{e.label}</option>
          ))}
        </select>
      </div>

      {selectedEntity && (
        <table>
          <thead>
            <tr>
              <th>Label</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p: any) => (
              <tr key={p.id}>
                <td>{p.label}</td>
                <td>{p.start_date}</td>
                <td>{p.end_date}</td>
                <td>
                  <span className={`status-${p.status?.toLowerCase()}`}>{p.status}</span>
                </td>
                <td>
                  {p.status === 'OPEN' && (
                    <button onClick={() => handleSoftClose(p.id)}>Soft Close</button>
                  )}
                  {p.status === 'SOFT_CLOSED' && (
                    <button onClick={() => handleHardClose(p.id)}>Hard Close</button>
                  )}
                  {p.status === 'HARD_CLOSED' && <span>Locked</span>}
                </td>
              </tr>
            ))}
            {periods.length === 0 && (
              <tr><td colSpan={5}>No periods found</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
