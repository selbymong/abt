/**
 * Float Financial API Client
 *
 * HTTP wrapper for the Float Financial spend management API (floatcard.com).
 * Handles authentication, pagination, retry with exponential backoff, and
 * rate limiting. Uses ConfigurationService for per-entity API keys.
 *
 * Float API docs: https://docs.floatfinancial.com/
 */
import { resolveConfig, resolveConfigRequired } from '../config/configuration-service.js';
import { FloatApiError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const DEFAULT_BASE_URL = 'https://api.floatfinancial.com/v1';
const MIN_REQUEST_GAP_MS = 100;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

// ── Types ────────────────────────────────────────────────────

export interface FloatClientConfig {
  apiKey: string;
  baseUrl: string;
  entityId: string;
}

export interface FloatPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
  };
}

export interface FloatTransaction {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  merchant_name: string;
  card_id: string;
  user_id: string;
  team_id?: string;
  subsidiary_id?: string;
  vendor_id?: string;
  gl_code_id?: string;
  tax_code_id?: string;
  status: 'IN_REVIEW' | 'READY_TO_EXPORT' | 'EXPORTED';
  receipt_url?: string;
  memo?: string;
  line_items?: FloatLineItem[];
}

export interface FloatBill {
  id: string;
  vendor_id: string;
  amount: number;
  currency: string;
  date: string;
  due_date: string;
  description: string;
  gl_code_id?: string;
  tax_code_id?: string;
  status: 'IN_REVIEW' | 'READY_TO_EXPORT' | 'EXPORTED';
  line_items?: FloatLineItem[];
}

export interface FloatReimbursement {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  status: 'IN_REVIEW' | 'READY_TO_EXPORT' | 'EXPORTED';
  expenses: FloatReimbursementExpense[];
}

export interface FloatReimbursementExpense {
  id: string;
  amount: number;
  gl_code_id?: string;
  tax_code_id?: string;
  description: string;
  date: string;
}

export interface FloatLineItem {
  amount: number;
  gl_code_id?: string;
  tax_code_id?: string;
  description?: string;
}

export interface FloatVendor {
  id: string;
  name: string;
}

export interface FloatGLCode {
  id: string;
  code: string;
  name: string;
  parent_id?: string;
}

export interface FloatTaxCode {
  id: string;
  code: string;
  name: string;
  rate: number;
}

// ── Rate limiter (per-entity) ────────────────────────────────

const lastRequestTime = new Map<string, number>();

async function rateLimit(entityId: string): Promise<void> {
  const last = lastRequestTime.get(entityId) ?? 0;
  const elapsed = Date.now() - last;
  if (elapsed < MIN_REQUEST_GAP_MS) {
    await new Promise((r) => setTimeout(r, MIN_REQUEST_GAP_MS - elapsed));
  }
  lastRequestTime.set(entityId, Date.now());
}

// ── Client factory ───────────────────────────────────────────

export async function createFloatClient(entityId: string): Promise<FloatClientConfig> {
  const apiKeyConfig = await resolveConfigRequired('float.api_key', { entityId });
  const baseUrlConfig = await resolveConfig('float.base_url', {});
  return {
    apiKey: apiKeyConfig.value_string!,
    baseUrl: baseUrlConfig?.value_string ?? DEFAULT_BASE_URL,
    entityId,
  };
}

// ── Core HTTP methods ────────────────────────────────────────

async function floatRequest<T>(
  config: FloatClientConfig,
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string>,
): Promise<T> {
  await rateLimit(config.entityId);

  const url = new URL(`${config.baseUrl}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        method,
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.ok) {
        return await res.json() as T;
      }

      const resBody = await res.text();

      // Retry on rate limit or server errors
      if (res.status === 429 || res.status >= 500) {
        lastError = new FloatApiError(config.entityId, `${method} ${path}`, res.status, resBody);
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        logger.warn({ attempt, status: res.status, backoff }, 'Float API retrying');
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      // Non-retryable error
      throw new FloatApiError(config.entityId, `${method} ${path}`, res.status, resBody);
    } catch (err) {
      if (err instanceof FloatApiError) throw err;
      lastError = err as Error;
      if (attempt < MAX_RETRIES - 1) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  }

  throw lastError ?? new Error('Float API request failed after retries');
}

export async function floatGet<T>(
  config: FloatClientConfig,
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  return floatRequest<T>(config, 'GET', path, undefined, params);
}

export async function floatPost<T>(
  config: FloatClientConfig,
  path: string,
  body: unknown,
): Promise<T> {
  return floatRequest<T>(config, 'POST', path, body);
}

export async function floatPatch<T>(
  config: FloatClientConfig,
  path: string,
  body: unknown,
): Promise<T> {
  return floatRequest<T>(config, 'PATCH', path, body);
}

// ── Pagination helper ────────────────────────────────────────

export async function floatGetAllPages<T>(
  config: FloatClientConfig,
  path: string,
  params?: Record<string, string>,
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;

  while (true) {
    const pageParams = { ...params, page: String(page), per_page: '100' };
    const res = await floatGet<FloatPaginatedResponse<T>>(config, path, pageParams);
    all.push(...res.data);

    if (page >= res.pagination.total_pages) break;
    page++;
  }

  return all;
}
