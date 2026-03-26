import { useEffect, useState } from 'react';
import { getEntities, getPeriods, getJournalEntries, getJournalEntry, postJournalEntry } from '../api/client';

export function RestatementPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [selectedJE, setSelectedJE] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reversalNarrative, setReversalNarrative] = useState('');

  useEffect(() => {
    getEntities()
      .then((data) => setEntities(data.entities))
      .catch((e) => setError(e.message));
  }, []);

  const loadPeriods = async (entityId: string) => {
    setSelectedEntity(entityId);
    setSelectedPeriod('');
    setJournalEntries([]);
    setSelectedJE(null);
    try {
      const data = await getPeriods(entityId);
      setPeriods(data.items);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const loadEntries = async (periodId: string) => {
    setSelectedPeriod(periodId);
    setSelectedJE(null);
    setError('');
    try {
      const data = await getJournalEntries(selectedEntity, periodId);
      setJournalEntries(data.items);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const viewEntry = async (id: string) => {
    setError('');
    try {
      const data = await getJournalEntry(id);
      setSelectedJE(data);
      setReversalNarrative(`Reversal of: ${data.narrative || data.reference}`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleReversal = async () => {
    if (!selectedJE || !selectedJE.lines?.length) return;
    setError('');
    setSuccess('');

    // Build reversal: flip debit/credit sides
    const reversalLines = selectedJE.lines.map((line: any) => ({
      side: line.side === 'DEBIT' ? 'CREDIT' : 'DEBIT',
      amount: Number(line.functional_amount || line.amount),
      nodeRefId: line.node_ref_id,
      nodeRefType: line.node_ref_type,
      economicCategory: line.economic_category,
      fundId: line.fund_id || undefined,
    }));

    // Find an open period for the entity
    const openPeriod = periods.find((p: any) => p.status === 'OPEN');
    if (!openPeriod) {
      setError('No open period available for reversal entry');
      return;
    }

    try {
      const result = await postJournalEntry({
        entityId: selectedEntity,
        periodId: openPeriod.id,
        entryType: 'REVERSAL',
        reference: `REV-${selectedJE.reference || selectedJE.id}`,
        narrative: reversalNarrative || `Reversal of ${selectedJE.id}`,
        currency: selectedJE.currency || 'CAD',
        validDate: new Date().toISOString().split('T')[0],
        lines: reversalLines,
      });
      setSuccess(`Reversal posted: ${result.journalEntryId}`);
      // Reload entries
      if (selectedPeriod) loadEntries(selectedPeriod);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h2>Restatement Workflow</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <div className="form-row">
          <label>Entity:</label>
          <select value={selectedEntity} onChange={(e) => loadPeriods(e.target.value)}>
            <option value="">-- Select --</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>{e.label} ({e.jurisdiction})</option>
            ))}
          </select>
        </div>

        {selectedEntity && (
          <div className="form-row">
            <label>Period:</label>
            <select value={selectedPeriod} onChange={(e) => loadEntries(e.target.value)}>
              <option value="">-- Select --</option>
              {periods.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {journalEntries.length > 0 && (
        <>
          <h3>Journal Entries ({journalEntries.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Narrative</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {journalEntries.map((je: any) => (
                <tr key={je.id} style={selectedJE?.id === je.id ? { background: '#e3f2fd' } : {}}>
                  <td>{je.reference}</td>
                  <td>
                    <span className={`status-${je.entry_type === 'REVERSAL' ? 'hard_closed' : 'open'}`}>
                      {je.entry_type}
                    </span>
                  </td>
                  <td>{je.narrative}</td>
                  <td>{Number(je.total_debit).toLocaleString()}</td>
                  <td>{Number(je.total_credit).toLocaleString()}</td>
                  <td>
                    <button onClick={() => viewEntry(je.id)}>View / Reverse</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {selectedJE && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Entry Detail: {selectedJE.reference}</h3>
          <p><strong>Type:</strong> {selectedJE.entry_type} | <strong>Narrative:</strong> {selectedJE.narrative}</p>

          {selectedJE.lines?.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Side</th>
                  <th>Amount</th>
                  <th>Node Ref Type</th>
                  <th>Economic Category</th>
                  <th>Fund</th>
                </tr>
              </thead>
              <tbody>
                {selectedJE.lines.map((line: any, i: number) => (
                  <tr key={i}>
                    <td className={line.side === 'DEBIT' ? 'status-open' : 'status-hard_closed'}>
                      {line.side}
                    </td>
                    <td>{Number(line.functional_amount || line.amount).toLocaleString()}</td>
                    <td>{line.node_ref_type}</td>
                    <td>{line.economic_category}</td>
                    <td>{line.fund_id || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: 16 }}>
            <h3>Post Reversal</h3>
            <div className="form-row">
              <label>Reversal Narrative:</label>
              <input
                value={reversalNarrative}
                onChange={(e) => setReversalNarrative(e.target.value)}
                style={{ width: 400 }}
              />
            </div>
            <button onClick={handleReversal} style={{ background: '#d32f2f' }}>
              Post Reversal Entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
