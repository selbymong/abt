import { useEffect, useState } from 'react';
import { getAssetClasses } from '../api/client';

export function AssetClassesPage() {
  const [assetClasses, setAssetClasses] = useState<any[]>([]);
  const [classSystem, setClassSystem] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async (system?: string, juris?: string) => {
    setError('');
    try {
      const data = await getAssetClasses(system || undefined, juris || undefined);
      setAssetClasses(data.assetClasses);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFilter = () => {
    load(classSystem, jurisdiction);
  };

  return (
    <div>
      <h2>Asset Class Management</h2>
      {error && <div className="error">{error}</div>}

      <div className="card">
        <div className="form-row" style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label>Class System:</label>
            <select value={classSystem} onChange={(e) => setClassSystem(e.target.value)}>
              <option value="">All</option>
              <option value="CCA">CCA (Canada)</option>
              <option value="MACRS">MACRS (US)</option>
              <option value="ACCOUNTING">Accounting</option>
            </select>
          </div>
          <div>
            <label>Jurisdiction:</label>
            <select value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)}>
              <option value="">All</option>
              <option value="CA">Canada</option>
              <option value="US">United States</option>
              <option value="INTL">International</option>
            </select>
          </div>
          <button onClick={handleFilter}>Filter</button>
        </div>
      </div>

      <p style={{ color: '#888', fontSize: '0.85rem' }}>
        {assetClasses.length} asset class{assetClasses.length !== 1 ? 'es' : ''} found.
        Click a row to see details.
      </p>

      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Label</th>
            <th>System</th>
            <th>Jurisdiction</th>
            <th>Method</th>
            <th>Rate (%)</th>
            <th>Useful Life (yrs)</th>
          </tr>
        </thead>
        <tbody>
          {assetClasses.map((ac: any) => (
            <>
              <tr
                key={ac.id}
                onClick={() => setExpandedId(expandedId === ac.id ? null : ac.id)}
                style={{ cursor: 'pointer' }}
              >
                <td><strong>{ac.class_code}</strong></td>
                <td>{ac.label}</td>
                <td>{ac.class_system}</td>
                <td>{ac.jurisdiction}</td>
                <td>{ac.depreciation_method || '-'}</td>
                <td>{ac.rate != null ? (Number(ac.rate) * 100).toFixed(1) : '-'}</td>
                <td>{ac.useful_life_years ?? '-'}</td>
              </tr>
              {expandedId === ac.id && (
                <tr key={`${ac.id}-detail`}>
                  <td colSpan={7}>
                    <div style={{ padding: '8px 0' }}>
                      <pre>{JSON.stringify(ac, null, 2)}</pre>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
          {assetClasses.length === 0 && (
            <tr><td colSpan={7}>No asset classes found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
