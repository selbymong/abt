import { useEffect, useState } from 'react';
import { getEntities, getFunds, createFund, deleteFund } from '../api/client';

export function FundsPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [funds, setFunds] = useState<any[]>([]);
  const [error, setError] = useState('');

  // New fund form
  const [fundType, setFundType] = useState('UNRESTRICTED');
  const [fundLabel, setFundLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    getEntities()
      .then((data) => {
        const nfpEntities = data.entities.filter((e: any) => e.fund_accounting_enabled);
        setEntities(nfpEntities);
      })
      .catch((e) => setError(e.message));
  }, []);

  const loadFunds = async (entityId: string) => {
    setSelectedEntity(entityId);
    try {
      const data = await getFunds(entityId);
      setFunds(data.items);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCreate = async () => {
    if (!selectedEntity || !fundLabel) return;
    try {
      await createFund({
        entityId: selectedEntity,
        fundType,
        label: fundLabel,
        restrictionDescription: description || undefined,
      });
      setFundLabel('');
      setDescription('');
      loadFunds(selectedEntity);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFund(id);
      loadFunds(selectedEntity);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h2>Fund Management (NFP Entities)</h2>
      {error && <div className="error">{error}</div>}

      <div className="form-row">
        <label>Select NFP Entity:</label>
        <select value={selectedEntity} onChange={(e) => loadFunds(e.target.value)}>
          <option value="">-- Select --</option>
          {entities.map((e) => (
            <option key={e.id} value={e.id}>{e.label} ({e.jurisdiction})</option>
          ))}
        </select>
      </div>

      {selectedEntity && (
        <>
          <div className="card">
            <h3>Create Fund</h3>
            <div className="form-row">
              <label>Type:</label>
              <select value={fundType} onChange={(e) => setFundType(e.target.value)}>
                <option value="UNRESTRICTED">Unrestricted</option>
                <option value="TEMPORARILY_RESTRICTED">Temporarily Restricted</option>
                <option value="PERMANENTLY_RESTRICTED">Permanently Restricted</option>
                <option value="ENDOWMENT">Endowment</option>
              </select>
            </div>
            <div className="form-row">
              <label>Label:</label>
              <input value={fundLabel} onChange={(e) => setFundLabel(e.target.value)} placeholder="Fund name" />
            </div>
            <div className="form-row">
              <label>Restriction Description:</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </div>
            <button onClick={handleCreate}>Create Fund</button>
          </div>

          <h3>Existing Funds</h3>
          <table>
            <thead>
              <tr>
                <th>Label</th>
                <th>Type</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {funds.map((f: any) => (
                <tr key={f.id}>
                  <td>{f.label}</td>
                  <td>{f.fund_type}</td>
                  <td>{f.restriction_description || '-'}</td>
                  <td><button onClick={() => handleDelete(f.id)}>Delete</button></td>
                </tr>
              ))}
              {funds.length === 0 && (
                <tr><td colSpan={4}>No funds yet</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
