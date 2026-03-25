import { useState } from 'react';
import { getConfig, setConfig } from '../api/client';

export function ConfigPage() {
  const [key, setKey] = useState('');
  const [entityId, setEntityId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Set config form
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newScope, setNewScope] = useState('SYSTEM');
  const [newEntityId, setNewEntityId] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  const handleLookup = async () => {
    setError('');
    setResult(null);
    try {
      const data = await getConfig(key, entityId || undefined);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSave = async () => {
    setSaveMsg('');
    try {
      await setConfig({
        key: newKey,
        value: newValue,
        scope: newScope,
        entityId: newEntityId || undefined,
      });
      setSaveMsg('Saved successfully');
    } catch (e: any) {
      setSaveMsg(`Error: ${e.message}`);
    }
  };

  return (
    <div>
      <h2>Configuration Settings</h2>

      <div className="card">
        <h3>Lookup Configuration</h3>
        <div className="form-row">
          <label>Key:</label>
          <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g., materiality_threshold" />
        </div>
        <div className="form-row">
          <label>Entity ID (optional):</label>
          <input value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="UUID" />
        </div>
        <button onClick={handleLookup}>Lookup</button>
        {error && <div className="error">{error}</div>}
        {result && (
          <pre>{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>

      <div className="card">
        <h3>Set Configuration</h3>
        <div className="form-row">
          <label>Key:</label>
          <input value={newKey} onChange={(e) => setNewKey(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Value:</label>
          <input value={newValue} onChange={(e) => setNewValue(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Scope:</label>
          <select value={newScope} onChange={(e) => setNewScope(e.target.value)}>
            <option value="SYSTEM">SYSTEM</option>
            <option value="ENTITY">ENTITY</option>
            <option value="ENTITY_PAIR">ENTITY_PAIR</option>
          </select>
        </div>
        <div className="form-row">
          <label>Entity ID (for ENTITY scope):</label>
          <input value={newEntityId} onChange={(e) => setNewEntityId(e.target.value)} />
        </div>
        <button onClick={handleSave}>Save</button>
        {saveMsg && <div className={saveMsg.startsWith('Error') ? 'error' : 'success'}>{saveMsg}</div>}
      </div>
    </div>
  );
}
