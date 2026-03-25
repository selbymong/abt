const BASE_URL = 'http://localhost:4000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// Entities
export const getEntities = () => request<{ entities: any[] }>('/graph/entities');
export const getEntity = (id: string) => request<any>(`/graph/entities/${id}`);

// Config
export const getConfig = (key: string, entityId?: string) =>
  request<any>(`/config/resolve?key=${key}${entityId ? `&entityId=${entityId}` : ''}`);
export const setConfig = (data: any) =>
  request<any>('/config', { method: 'POST', body: JSON.stringify(data) });

// Funds
export const getFunds = (entityId: string) =>
  request<{ items: any[] }>(`/graph/funds/by-entity/${entityId}`);
export const createFund = (data: any) =>
  request<{ id: string }>('/graph/funds', { method: 'POST', body: JSON.stringify(data) });
export const deleteFund = (id: string) =>
  request<any>(`/graph/funds/${id}`, { method: 'DELETE' });

// Periods
export const getPeriods = (entityId: string) =>
  request<{ items: any[] }>(`/graph/periods/by-entity/${entityId}`);
export const softClosePeriod = (periodId: string, closedBy: string) =>
  request<any>(`/gl/periods/${periodId}/soft-close`, {
    method: 'POST', body: JSON.stringify({ closedBy }),
  });
export const hardClosePeriod = (periodId: string, closedBy: string) =>
  request<any>(`/gl/periods/${periodId}/hard-close`, {
    method: 'POST', body: JSON.stringify({ closedBy }),
  });

// Reporting
export const getTrialBalance = (entityId: string, periodId: string) =>
  request<any>(`/gl/trial-balance?entityId=${entityId}&periodId=${periodId}`);
export const getPnL = (entityId: string, periodId: string) =>
  request<any>(`/gl/profit-and-loss?entityId=${entityId}&periodId=${periodId}`);
export const getBalanceSheet = (entityId: string, periodId: string) =>
  request<any>(`/gl/balance-sheet?entityId=${entityId}&periodId=${periodId}`);

// Obligations
export const getObligationAlerts = (entityId: string, days?: number) =>
  request<{ alerts: any[] }>(`/graph/obligations/alerts/${entityId}${days ? `?horizonDays=${days}` : ''}`);
