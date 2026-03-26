import { useEffect, useState } from 'react';
import { getEntities, getECLRateMatrix, setECLRateMatrix } from '../api/client';

interface Bucket {
  days_from: number;
  days_to: number | null;
  loss_rate: number;
}

interface ECLMatrix {
  buckets: Bucket[];
  methodology: string;
}

const DEFAULT_MATRIX: ECLMatrix = {
  buckets: [
    { days_from: 0, days_to: 30, loss_rate: 0.001 },
    { days_from: 31, days_to: 60, loss_rate: 0.008 },
    { days_from: 61, days_to: 90, loss_rate: 0.025 },
    { days_from: 91, days_to: null, loss_rate: 0.20 },
  ],
  methodology: 'historical_loss_rate',
};

export function ECLRateMatrixPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [matrix, setMatrix] = useState<ECLMatrix>(DEFAULT_MATRIX);
  const [methodology, setMethodology] = useState('historical_loss_rate');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scope, setScope] = useState<'SYSTEM' | 'ENTITY'>('SYSTEM');

  useEffect(() => {
    getEntities()
      .then((data) => setEntities(data.entities))
      .catch((e) => setError(e.message));
    loadMatrix();
  }, []);

  const loadMatrix = async (entityId?: string) => {
    setError('');
    setSuccess('');
    try {
      const data = await getECLRateMatrix(entityId);
      if (data?.value) {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        setMatrix(parsed);
        setMethodology(parsed.methodology || 'historical_loss_rate');
      } else {
        setMatrix(DEFAULT_MATRIX);
        setMethodology('historical_loss_rate');
      }
    } catch {
      setMatrix(DEFAULT_MATRIX);
      setMethodology('historical_loss_rate');
    }
  };

  const handleEntityChange = (entityId: string) => {
    setSelectedEntity(entityId);
    if (entityId) {
      setScope('ENTITY');
      loadMatrix(entityId);
    } else {
      setScope('SYSTEM');
      loadMatrix();
    }
  };

  const updateBucket = (index: number, field: keyof Bucket, value: string) => {
    const updated = [...matrix.buckets];
    if (field === 'loss_rate') {
      updated[index] = { ...updated[index], loss_rate: parseFloat(value) || 0 };
    } else if (field === 'days_from') {
      updated[index] = { ...updated[index], days_from: parseInt(value) || 0 };
    } else if (field === 'days_to') {
      updated[index] = { ...updated[index], days_to: value === '' ? null : parseInt(value) || 0 };
    }
    setMatrix({ ...matrix, buckets: updated });
  };

  const addBucket = () => {
    const last = matrix.buckets[matrix.buckets.length - 1];
    const newFrom = last ? (last.days_to ?? last.days_from + 30) + 1 : 0;
    setMatrix({
      ...matrix,
      buckets: [...matrix.buckets, { days_from: newFrom, days_to: null, loss_rate: 0 }],
    });
  };

  const removeBucket = (index: number) => {
    const updated = matrix.buckets.filter((_, i) => i !== index);
    setMatrix({ ...matrix, buckets: updated });
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    try {
      const value = { ...matrix, methodology };
      await setECLRateMatrix(value, scope === 'ENTITY' ? selectedEntity : undefined);
      setSuccess(`ECL rate matrix saved (${scope} scope)`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h2>ECL Rate Matrix Editor</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <div className="form-row">
          <label>Scope:</label>
          <select value={scope} onChange={(e) => {
            const newScope = e.target.value as 'SYSTEM' | 'ENTITY';
            setScope(newScope);
            if (newScope === 'SYSTEM') { setSelectedEntity(''); loadMatrix(); }
          }}>
            <option value="SYSTEM">System Default</option>
            <option value="ENTITY">Entity Override</option>
          </select>
        </div>

        {scope === 'ENTITY' && (
          <div className="form-row">
            <label>Entity:</label>
            <select value={selectedEntity} onChange={(e) => handleEntityChange(e.target.value)}>
              <option value="">-- Select --</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>{e.label} ({e.jurisdiction})</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-row">
          <label>Methodology:</label>
          <select value={methodology} onChange={(e) => setMethodology(e.target.value)}>
            <option value="historical_loss_rate">Historical Loss Rate</option>
            <option value="probability_weighted">Probability Weighted</option>
            <option value="discounted_cash_flow">Discounted Cash Flow</option>
          </select>
        </div>
      </div>

      <h3>Aging Buckets</h3>
      <table>
        <thead>
          <tr>
            <th>Days From</th>
            <th>Days To</th>
            <th>Loss Rate (%)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {matrix.buckets.map((bucket, i) => (
            <tr key={i}>
              <td>
                <input
                  type="number"
                  value={bucket.days_from}
                  onChange={(e) => updateBucket(i, 'days_from', e.target.value)}
                  style={{ width: 80 }}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={bucket.days_to ?? ''}
                  onChange={(e) => updateBucket(i, 'days_to', e.target.value)}
                  placeholder="No limit"
                  style={{ width: 80 }}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.001"
                  value={bucket.loss_rate}
                  onChange={(e) => updateBucket(i, 'loss_rate', e.target.value)}
                  style={{ width: 100 }}
                />
                <span style={{ marginLeft: 4, color: '#888', fontSize: '0.8rem' }}>
                  ({(bucket.loss_rate * 100).toFixed(1)}%)
                </span>
              </td>
              <td>
                <button onClick={() => removeBucket(i)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={addBucket} style={{ marginRight: 8 }}>Add Bucket</button>
      <button onClick={handleSave}>Save Matrix</button>
    </div>
  );
}
