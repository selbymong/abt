/**
 * Multi-Currency Service
 *
 * Implements:
 * - FX rate management: store and lookup exchange rates by date
 * - Currency conversion at transaction date rates
 * - Month-end revaluation of foreign currency monetary balances
 * - Unrealized FX gain/loss posting (JE: DR/CR FX Gain/Loss + offsetting Receivable/Payable)
 * - Integration with CurrencyTranslation for consolidation
 *
 * FX rates stored in PostgreSQL for efficient date-based lookups.
 * Revaluation produces ADJUSTMENT journal entries.
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import { postJournalEntry } from './journal-posting-service.js';

// ============================================================
// Types
// ============================================================

export interface FXRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  rate_date: string;
  source: string;
  created_at: string;
}

export interface SetFXRateInput {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateDate: string;
  source?: string;
}

export interface ConversionResult {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  rateDate: string;
}

export interface RevaluationItem {
  nodeRefId: string;
  nodeRefType: string;
  economicCategory: string;
  currency: string;
  originalAmount: number;
  originalRate: number;
  closingRate: number;
  revaluedAmount: number;
  unrealizedGainLoss: number;
  journalEntryId: string;
}

export interface RevaluationReport {
  entityId: string;
  periodId: string;
  functionalCurrency: string;
  asOfDate: string;
  items: RevaluationItem[];
  totalGainLoss: number;
}

// ============================================================
// FX Rate Management
// ============================================================

export async function setFXRate(input: SetFXRateInput): Promise<string> {
  const id = uuid();

  // Upsert: replace if same pair + date exists
  await query(
    `INSERT INTO fx_rates (id, from_currency, to_currency, rate, rate_date, source, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (from_currency, to_currency, rate_date)
     DO UPDATE SET rate = $4, source = $6, created_at = NOW()
     RETURNING id`,
    [id, input.fromCurrency, input.toCurrency, input.rate, input.rateDate, input.source ?? 'MANUAL'],
  );

  return id;
}

export async function setFXRatesBatch(rates: SetFXRateInput[]): Promise<number> {
  let count = 0;
  for (const rate of rates) {
    await setFXRate(rate);
    count++;
  }
  return count;
}

export async function getFXRate(
  fromCurrency: string,
  toCurrency: string,
  rateDate: string,
): Promise<FXRate | null> {
  if (fromCurrency === toCurrency) {
    return {
      id: 'identity',
      from_currency: fromCurrency,
      to_currency: toCurrency,
      rate: 1,
      rate_date: rateDate,
      source: 'IDENTITY',
      created_at: rateDate,
    };
  }

  // Get the rate for exact date, or most recent before that date
  const result = await query(
    `SELECT * FROM fx_rates
     WHERE from_currency = $1 AND to_currency = $2 AND rate_date <= $3
     ORDER BY rate_date DESC LIMIT 1`,
    [fromCurrency, toCurrency, rateDate],
  );

  if (result.rows.length > 0) return result.rows[0] as any;

  // Try inverse rate
  const inverse = await query(
    `SELECT * FROM fx_rates
     WHERE from_currency = $1 AND to_currency = $2 AND rate_date <= $3
     ORDER BY rate_date DESC LIMIT 1`,
    [toCurrency, fromCurrency, rateDate],
  );

  if (inverse.rows.length > 0) {
    const inv = inverse.rows[0] as any;
    return {
      id: inv.id,
      from_currency: fromCurrency,
      to_currency: toCurrency,
      rate: Math.round((1 / Number(inv.rate)) * 1000000) / 1000000,
      rate_date: inv.rate_date,
      source: `INVERSE(${inv.source})`,
      created_at: inv.created_at,
    };
  }

  return null;
}

export async function listFXRates(
  fromCurrency?: string,
  toCurrency?: string,
  startDate?: string,
  endDate?: string,
): Promise<FXRate[]> {
  let sql = 'SELECT * FROM fx_rates WHERE 1=1';
  const params: unknown[] = [];
  let idx = 1;

  if (fromCurrency) {
    sql += ` AND from_currency = $${idx++}`;
    params.push(fromCurrency);
  }
  if (toCurrency) {
    sql += ` AND to_currency = $${idx++}`;
    params.push(toCurrency);
  }
  if (startDate) {
    sql += ` AND rate_date >= $${idx++}`;
    params.push(startDate);
  }
  if (endDate) {
    sql += ` AND rate_date <= $${idx++}`;
    params.push(endDate);
  }

  sql += ' ORDER BY rate_date DESC, from_currency, to_currency';
  const result = await query(sql, params);
  return result.rows as any;
}

// ============================================================
// Currency Conversion
// ============================================================

export async function convertCurrency(
  fromCurrency: string,
  toCurrency: string,
  amount: number,
  rateDate: string,
): Promise<ConversionResult> {
  const fxRate = await getFXRate(fromCurrency, toCurrency, rateDate);
  if (!fxRate) {
    throw new Error(`No FX rate found for ${fromCurrency}→${toCurrency} on or before ${rateDate}`);
  }

  const rate = Number(fxRate.rate);
  const toAmount = Math.round(amount * rate * 100) / 100;

  return {
    fromCurrency,
    toCurrency,
    fromAmount: amount,
    toAmount,
    rate,
    rateDate: fxRate.rate_date,
  };
}

// ============================================================
// Month-End Revaluation
// ============================================================

export async function performRevaluation(
  entityId: string,
  periodId: string,
  functionalCurrency: string,
  asOfDate: string,
): Promise<RevaluationReport> {
  // Find all open foreign currency monetary items (receivables, payables)
  // These are nodes with outstanding balances in non-functional currencies
  const monetaryItems = await runCypher<{
    node_ref_id: string;
    node_ref_type: string;
    economic_category: string;
    currency: string;
    amount: number;
    original_rate: number;
  }>(
    `MATCH (n)
     WHERE (n:ARInvoice OR n:APInvoice) AND n.entity_id = $entityId
       AND n.status IN ['POSTED', 'PARTIALLY_PAID']
       AND n.currency <> $functionalCurrency
     RETURN n.id AS node_ref_id,
            CASE WHEN n:ARInvoice THEN 'AR_INVOICE' ELSE 'AP_INVOICE' END AS node_ref_type,
            CASE WHEN n:ARInvoice THEN 'ASSET' ELSE 'LIABILITY' END AS economic_category,
            n.currency AS currency,
            COALESCE(n.amount_remaining, n.amount_remaining) AS amount,
            COALESCE(n.original_rate, 1.0) AS original_rate`,
    { entityId, functionalCurrency },
  );

  const items: RevaluationItem[] = [];
  let totalGainLoss = 0;

  for (const item of monetaryItems) {
    const originalAmount = Number(item.amount);
    const originalRate = Number(item.original_rate);

    // Get closing rate
    const closingFX = await getFXRate(item.currency, functionalCurrency, asOfDate);
    if (!closingFX) continue; // Skip if no rate available

    const closingRate = Number(closingFX.rate);
    const revaluedAmount = Math.round(originalAmount * closingRate * 100) / 100;
    const originalFunctional = Math.round(originalAmount * originalRate * 100) / 100;
    const unrealizedGainLoss = Math.round((revaluedAmount - originalFunctional) * 100) / 100;

    if (Math.abs(unrealizedGainLoss) < 0.01) continue; // No material difference

    // Post revaluation JE
    // For assets (receivables): gain if closing > original, loss if closing < original
    // For liabilities (payables): loss if closing > original, gain if closing < original
    const isGain = item.economic_category === 'ASSET'
      ? unrealizedGainLoss > 0
      : unrealizedGainLoss < 0;

    const absAmount = Math.abs(unrealizedGainLoss);

    const jeId = await postJournalEntry({
      entityId,
      periodId,
      entryType: 'ADJUSTMENT',
      reference: `FX-REVAL-${item.node_ref_id.slice(0, 8)}`,
      narrative: `FX revaluation: ${item.currency}→${functionalCurrency} at ${closingRate}`,
      currency: functionalCurrency,
      validDate: asOfDate,
      sourceSystem: 'multi-currency',
      lines: isGain
        ? [
            { side: 'DEBIT', amount: absAmount, nodeRefId: item.node_ref_id, nodeRefType: item.node_ref_type as any, economicCategory: item.economic_category as any },
            { side: 'CREDIT', amount: absAmount, nodeRefId: entityId, nodeRefType: 'ENTITY' as any, economicCategory: 'REVENUE' as any },
          ]
        : [
            { side: 'DEBIT', amount: absAmount, nodeRefId: entityId, nodeRefType: 'ENTITY' as any, economicCategory: 'EXPENSE' as any },
            { side: 'CREDIT', amount: absAmount, nodeRefId: item.node_ref_id, nodeRefType: item.node_ref_type as any, economicCategory: item.economic_category as any },
          ],
    });

    items.push({
      nodeRefId: item.node_ref_id,
      nodeRefType: item.node_ref_type,
      economicCategory: item.economic_category,
      currency: item.currency,
      originalAmount,
      originalRate,
      closingRate,
      revaluedAmount,
      unrealizedGainLoss,
      journalEntryId: jeId,
    });

    totalGainLoss += unrealizedGainLoss;
  }

  // Record revaluation run
  await query(
    `INSERT INTO fx_revaluation_runs (id, entity_id, period_id, functional_currency, as_of_date, items_count, total_gain_loss, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [uuid(), entityId, periodId, functionalCurrency, asOfDate, items.length, Math.round(totalGainLoss * 100) / 100],
  );

  return {
    entityId,
    periodId,
    functionalCurrency,
    asOfDate,
    items,
    totalGainLoss: Math.round(totalGainLoss * 100) / 100,
  };
}

// ============================================================
// Revaluation History
// ============================================================

export async function getRevaluationHistory(
  entityId: string,
): Promise<Array<{
  id: string;
  periodId: string;
  functionalCurrency: string;
  asOfDate: string;
  itemsCount: number;
  totalGainLoss: number;
  createdAt: string;
}>> {
  const result = await query(
    `SELECT id, period_id, functional_currency, as_of_date, items_count, total_gain_loss, created_at
     FROM fx_revaluation_runs
     WHERE entity_id = $1
     ORDER BY created_at DESC`,
    [entityId],
  );

  return result.rows.map((r: any) => ({
    id: r.id,
    periodId: r.period_id,
    functionalCurrency: r.functional_currency,
    asOfDate: r.as_of_date,
    itemsCount: Number(r.items_count),
    totalGainLoss: Number(r.total_gain_loss),
    createdAt: r.created_at,
  }));
}
