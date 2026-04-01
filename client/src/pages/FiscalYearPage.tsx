import { useEffect, useState, useCallback } from 'react';
import { getEntities, getConfig, setConfig } from '../api/client';

interface Entity {
  id: string;
  label: string;
  entity_type: string;
}

// Common fiscal year end options
const FY_END_OPTIONS = [
  { value: '12-31', label: 'December 31 (Calendar year)' },
  { value: '03-31', label: 'March 31 (Apr–Mar)' },
  { value: '06-30', label: 'June 30 (Jul–Jun)' },
  { value: '09-30', label: 'September 30 (Oct–Sep)' },
  { value: '01-31', label: 'January 31' },
];

const SYSTEM_USER = '00000000-0000-0000-0000-000000000001';

export function FiscalYearPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [systemFYEnd, setSystemFYEnd] = useState<string | null>(null);
  const [entityFYEnds, setEntityFYEnds] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // which item is being saved
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Bulk apply state
  const [bulkValue, setBulkValue] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const entData = await getEntities();
      const ents = entData.entities || [];
      setEntities(ents);

      // Load system-level fiscal year setting
      try {
        const sysConfig = await getConfig('fiscal_year_end');
        setSystemFYEnd(sysConfig?.value_string || sysConfig?.valueString || null);
      } catch {
        setSystemFYEnd(null);
      }

      // Load entity-level fiscal year settings
      const entitySettings: Record<string, string | null> = {};
      for (const ent of ents) {
        try {
          const entConfig = await getConfig('fiscal_year_end', ent.id);
          const val = entConfig?.value_string || entConfig?.valueString || null;
          // Only record if it's entity-scoped (not inherited from system)
          const scope = entConfig?.scope_type || entConfig?.scopeType;
          entitySettings[ent.id] = scope === 'ENTITY' ? val : null;
        } catch {
          entitySettings[ent.id] = null;
        }
      }
      setEntityFYEnds(entitySettings);
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const saveSystemFYEnd = async (value: string) => {
    setSaving('system');
    setMessage(null);
    try {
      await setConfig('fiscal_year_end', {
        scopeType: 'SYSTEM',
        valueType: 'STRING',
        valueString: value,
        validFrom: new Date().toISOString().slice(0, 10),
        changedBy: SYSTEM_USER,
        changeReason: 'Set system-wide fiscal year end',
      });
      setSystemFYEnd(value);
      setMessage({ text: 'System fiscal year end saved', type: 'success' });
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' });
    } finally {
      setSaving(null);
    }
  };

  const saveEntityFYEnd = async (entityId: string, value: string) => {
    setSaving(entityId);
    setMessage(null);
    try {
      await setConfig('fiscal_year_end', {
        scopeType: 'ENTITY',
        scopeId: entityId,
        valueType: 'STRING',
        valueString: value,
        validFrom: new Date().toISOString().slice(0, 10),
        changedBy: SYSTEM_USER,
        changeReason: 'Set entity fiscal year end',
      });
      setEntityFYEnds((prev) => ({ ...prev, [entityId]: value }));
      setMessage({ text: 'Entity fiscal year end saved', type: 'success' });
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' });
    } finally {
      setSaving(null);
    }
  };

  const clearEntityFYEnd = async (entityId: string) => {
    setSaving(entityId);
    setMessage(null);
    try {
      // Set to empty to effectively "clear" the entity override
      // The entity will then inherit from the system default
      await setConfig('fiscal_year_end', {
        scopeType: 'ENTITY',
        scopeId: entityId,
        valueType: 'STRING',
        valueString: '',
        validFrom: new Date().toISOString().slice(0, 10),
        validUntil: new Date().toISOString().slice(0, 10), // expire immediately
        changedBy: SYSTEM_USER,
        changeReason: 'Cleared entity override — inherits system default',
      });
      setEntityFYEnds((prev) => ({ ...prev, [entityId]: null }));
      setMessage({ text: 'Entity override cleared — inherits system default', type: 'success' });
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' });
    } finally {
      setSaving(null);
    }
  };

  const applyToAll = async () => {
    if (!bulkValue) return;
    setSaving('bulk');
    setMessage(null);
    try {
      // Set system default
      await setConfig('fiscal_year_end', {
        scopeType: 'SYSTEM',
        valueType: 'STRING',
        valueString: bulkValue,
        validFrom: new Date().toISOString().slice(0, 10),
        changedBy: SYSTEM_USER,
        changeReason: 'Bulk set fiscal year end for all entities',
      });
      setSystemFYEnd(bulkValue);

      // Set for each entity too (explicit override)
      for (const ent of entities) {
        await setConfig('fiscal_year_end', {
          scopeType: 'ENTITY',
          scopeId: ent.id,
          valueType: 'STRING',
          valueString: bulkValue,
          validFrom: new Date().toISOString().slice(0, 10),
          changedBy: SYSTEM_USER,
          changeReason: 'Bulk set fiscal year end for all entities',
        });
      }
      const newEnds: Record<string, string | null> = {};
      for (const ent of entities) newEnds[ent.id] = bulkValue;
      setEntityFYEnds(newEnds);
      setMessage({ text: `Fiscal year end set to ${bulkValue} for all ${entities.length} entities`, type: 'success' });
    } catch (e: any) {
      setMessage({ text: e.message, type: 'error' });
    } finally {
      setSaving(null);
    }
  };

  const getEffectiveValue = (entityId: string): string => {
    return entityFYEnds[entityId] || systemFYEnd || '—';
  };

  const isInherited = (entityId: string): boolean => {
    return !entityFYEnds[entityId];
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Fiscal Year Settings</h2>

      {message && (
        <div className={message.type === 'error' ? 'error' : 'success'} style={{ marginBottom: 16 }}>
          {message.text}
        </div>
      )}

      {/* System Default */}
      <div className="card">
        <h3>System Default</h3>
        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: 0 }}>
          All entities inherit this fiscal year end unless overridden individually.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={systemFYEnd || ''}
            onChange={(e) => saveSystemFYEnd(e.target.value)}
            disabled={saving === 'system'}
            style={{ width: 300 }}
          >
            <option value="">Not set</option>
            {FY_END_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {saving === 'system' && <span style={{ color: '#888' }}>Saving...</span>}
        </div>
      </div>

      {/* Apply to All */}
      <div className="card">
        <h3>Apply to All Entities</h3>
        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: 0 }}>
          Set the same fiscal year end for every entity at once (overrides all individual settings).
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            style={{ width: 300 }}
          >
            <option value="">Select fiscal year end...</option>
            {FY_END_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button onClick={applyToAll} disabled={!bulkValue || saving === 'bulk'}>
            {saving === 'bulk' ? 'Applying...' : 'Apply to All'}
          </button>
        </div>
      </div>

      {/* Per-Entity Settings */}
      <div className="card">
        <h3>Per-Entity Settings</h3>
        <table>
          <thead>
            <tr>
              <th>Entity</th>
              <th>Type</th>
              <th>Fiscal Year End</th>
              <th>Source</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entities.map((ent) => (
              <tr key={ent.id}>
                <td style={{ fontWeight: 600 }}>{ent.label}</td>
                <td>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: ent.entity_type?.includes('FOR_PROFIT') ? '#e3f2fd' : '#f3e5f5',
                    color: ent.entity_type?.includes('FOR_PROFIT') ? '#1565c0' : '#7b1fa2',
                  }}>
                    {ent.entity_type}
                  </span>
                </td>
                <td>
                  <select
                    value={entityFYEnds[ent.id] || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        saveEntityFYEnd(ent.id, e.target.value);
                      }
                    }}
                    disabled={saving === ent.id}
                    style={{ width: 260 }}
                  >
                    <option value="">
                      {systemFYEnd ? `Inherit system (${systemFYEnd})` : 'Not set'}
                    </option>
                    {FY_END_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: isInherited(ent.id) ? '#e8f5e9' : '#fff3e0',
                    color: isInherited(ent.id) ? '#2e7d32' : '#e65100',
                  }}>
                    {isInherited(ent.id) ? 'Inherited' : 'Override'}
                  </span>
                </td>
                <td>
                  {!isInherited(ent.id) && (
                    <button
                      onClick={() => clearEntityFYEnd(ent.id)}
                      disabled={saving === ent.id}
                      style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                    >
                      Clear
                    </button>
                  )}
                  {saving === ent.id && <span style={{ color: '#888', marginLeft: 8 }}>Saving...</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entities.length === 0 && (
          <p style={{ color: '#888' }}>No entities found.</p>
        )}
      </div>
    </div>
  );
}
