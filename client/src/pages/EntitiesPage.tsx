import { useEffect, useState } from 'react';
import { getEntities } from '../api/client';

export function EntitiesPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getEntities()
      .then((data) => setEntities(data.entities))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div>
      <h2>Entities</h2>
      <table>
        <thead>
          <tr>
            <th>Label</th>
            <th>Type</th>
            <th>Jurisdiction</th>
            <th>Framework</th>
            <th>Currency</th>
            <th>Ontology</th>
            <th>Fund Accounting</th>
          </tr>
        </thead>
        <tbody>
          {entities.map((e) => (
            <tr key={e.id}>
              <td>{e.label}</td>
              <td>{e.entity_type}</td>
              <td>{e.jurisdiction}</td>
              <td>{e.accounting_framework}</td>
              <td>{e.functional_currency}</td>
              <td>{e.outcome_ontology}</td>
              <td>{e.fund_accounting_enabled ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
