import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import type { OciComponent, OciSourceNodeType } from '../../schema/neo4j/types.js';

// Non-recycling OCI components (NEVER recycle to P&L)
const NON_RECYCLING_COMPONENTS: OciComponent[] = [
  'FVOCI_EQUITY', 'DB_PENSION', 'REVALUATION_SURPLUS',
];

// ============================================================
// RetainedEarnings
// ============================================================

export interface ComputeRetainedEarningsInput {
  entityId: string;
  periodId: string;
  fundId?: string;
  dividendsDeclared?: number;
  otherAdjustments?: number;
}

/**
 * Compute RetainedEarnings for a period.
 * Reads net income from TimescaleDB (revenue - expenses),
 * carries forward closing_balance from previous period.
 */
export async function computeRetainedEarnings(
  input: ComputeRetainedEarningsInput,
): Promise<string> {
  // Get net income from TimescaleDB
  const pnlResult = await query<{ economic_category: string; net_balance: string }>(
    `SELECT economic_category,
            COALESCE(SUM(net_balance), 0) AS net_balance
     FROM gl_period_balances
     WHERE entity_id = $1 AND period_id = $2
       AND economic_category IN ('REVENUE', 'EXPENSE')
     GROUP BY economic_category`,
    [input.entityId, input.periodId],
  );

  let revenue = 0, expenses = 0;
  for (const row of pnlResult.rows) {
    const net = Number(row.net_balance);
    if (row.economic_category === 'REVENUE') revenue = Math.abs(net);
    if (row.economic_category === 'EXPENSE') expenses = Math.abs(net);
  }
  const netIncome = revenue - expenses;

  // Get previous period's closing balance
  const prevRe = await runCypher<{ closing: number }>(
    `MATCH (re:RetainedEarnings {entity_id: $entityId})
     WHERE re.period_id <> $periodId
     ${input.fundId ? 'AND re.fund_id = $fundId' : ''}
     RETURN re.closing_balance AS closing
     ORDER BY re.created_at DESC LIMIT 1`,
    { entityId: input.entityId, periodId: input.periodId, fundId: input.fundId ?? null },
  );
  const openingBalance = prevRe.length > 0 ? Number(prevRe[0].closing) : 0;

  const dividends = input.dividendsDeclared ?? 0;
  const adjustments = input.otherAdjustments ?? 0;
  const closingBalance = openingBalance + netIncome - dividends + adjustments;

  const id = uuid();
  await runCypher(
    `CREATE (re:RetainedEarnings {
      id: $id, entity_id: $entityId,
      fund_id: $fundId, period_id: $periodId,
      opening_balance: $opening,
      net_income: $netIncome,
      dividends_declared: $dividends,
      other_adjustments: $adjustments,
      closing_balance: $closing,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      fundId: input.fundId ?? null,
      periodId: input.periodId,
      opening: Math.round(openingBalance * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,
      dividends: Math.round(dividends * 100) / 100,
      adjustments: Math.round(adjustments * 100) / 100,
      closing: Math.round(closingBalance * 100) / 100,
    },
  );

  // Project to equity_period_balances
  await query(
    `INSERT INTO equity_period_balances
       (entity_id, period_id, fund_id, component, opening_balance, movement, recycled_to_pnl, closing_balance)
     VALUES ($1, $2, $3, 'RETAINED_EARNINGS', $4::numeric, $5::numeric, 0, $6::numeric)
     ON CONFLICT (entity_id, period_id, fund_id, component) DO UPDATE
     SET opening_balance = $4::numeric, movement = $5::numeric,
         closing_balance = $6::numeric, last_updated = now()`,
    [
      input.entityId, input.periodId,
      input.fundId ?? '00000000-0000-0000-0000-000000000000',
      openingBalance, netIncome - dividends + adjustments, closingBalance,
    ],
  );

  return id;
}

export async function getRetainedEarnings(entityId: string, periodId: string, fundId?: string) {
  const params: Record<string, unknown> = { entityId, periodId };
  let where = `{entity_id: $entityId, period_id: $periodId}`;
  if (fundId) {
    where = `{entity_id: $entityId, period_id: $periodId, fund_id: $fundId}`;
    params.fundId = fundId;
  }

  const results = await runCypher<{ re: Record<string, unknown> }>(
    `MATCH (re:RetainedEarnings ${where}) RETURN properties(re) AS re`,
    params,
  );
  return results[0]?.re ?? null;
}

// ============================================================
// OtherComprehensiveIncome
// ============================================================

export interface RecordOCIInput {
  entityId: string;
  periodId: string;
  component: OciComponent;
  currentPeriod: number;
  sourceNodeId?: string;
  sourceNodeType?: OciSourceNodeType;
}

/**
 * Record an OCI component for a period.
 * Gets opening balance from previous period's closing balance.
 */
export async function recordOCI(input: RecordOCIInput): Promise<string> {
  // Get previous period's closing balance for this component
  const prevOci = await runCypher<{ closing: number }>(
    `MATCH (oci:OtherComprehensiveIncome {entity_id: $entityId, component: $component})
     WHERE oci.period_id <> $periodId
     RETURN oci.closing_balance AS closing
     ORDER BY oci.created_at DESC LIMIT 1`,
    { entityId: input.entityId, component: input.component, periodId: input.periodId },
  );
  const openingBalance = prevOci.length > 0 ? Number(prevOci[0].closing) : 0;
  const closingBalance = openingBalance + input.currentPeriod;

  const id = uuid();
  await runCypher(
    `CREATE (oci:OtherComprehensiveIncome {
      id: $id, entity_id: $entityId, period_id: $periodId,
      component: $component,
      opening_balance: $opening,
      current_period: $currentPeriod,
      recycled_to_pnl: 0,
      closing_balance: $closing,
      source_node_id: $sourceNodeId,
      source_node_type: $sourceNodeType,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      periodId: input.periodId,
      component: input.component,
      opening: Math.round(openingBalance * 100) / 100,
      currentPeriod: Math.round(input.currentPeriod * 100) / 100,
      closing: Math.round(closingBalance * 100) / 100,
      sourceNodeId: input.sourceNodeId ?? null,
      sourceNodeType: input.sourceNodeType ?? null,
    },
  );

  // Project to equity_period_balances
  const componentKey = `OCI_${input.component}`;
  await query(
    `INSERT INTO equity_period_balances
       (entity_id, period_id, fund_id, component, opening_balance, movement, recycled_to_pnl, closing_balance)
     VALUES ($1, $2, '00000000-0000-0000-0000-000000000000', $3, $4::numeric, $5::numeric, 0, $6::numeric)
     ON CONFLICT (entity_id, period_id, fund_id, component) DO UPDATE
     SET opening_balance = $4::numeric, movement = $5::numeric,
         closing_balance = $6::numeric, last_updated = now()`,
    [input.entityId, input.periodId, componentKey, openingBalance, input.currentPeriod, closingBalance],
  );

  return id;
}

/**
 * Recycle an OCI component to P&L.
 * Only allowed for recycling components (CTA_COMPONENT, CASHFLOW_HEDGE,
 * NET_INVESTMENT_HEDGE, FVOCI_DEBT).
 * Throws if component is non-recycling.
 */
export async function recycleOCI(
  ociId: string,
  amount: number,
): Promise<boolean> {
  const results = await runCypher<{ oci: Record<string, unknown> }>(
    `MATCH (oci:OtherComprehensiveIncome {id: $id}) RETURN properties(oci) AS oci`,
    { id: ociId },
  );
  if (results.length === 0) return false;

  const oci = results[0].oci;
  const component = oci.component as OciComponent;

  if (NON_RECYCLING_COMPONENTS.includes(component)) {
    throw new Error(
      `Cannot recycle ${component} to P&L — non-recycling OCI component per IFRS`,
    );
  }

  const newRecycled = Number(oci.recycled_to_pnl) + amount;
  const newClosing = Number(oci.opening_balance) + Number(oci.current_period) - newRecycled;

  await runCypher(
    `MATCH (oci:OtherComprehensiveIncome {id: $id})
     SET oci.recycled_to_pnl = $recycled,
         oci.closing_balance = $closing,
         oci.updated_at = datetime()`,
    {
      id: ociId,
      recycled: Math.round(newRecycled * 100) / 100,
      closing: Math.round(newClosing * 100) / 100,
    },
  );

  // Update equity_period_balances
  const componentKey = `OCI_${component}`;
  await query(
    `UPDATE equity_period_balances
     SET recycled_to_pnl = $3::numeric,
         closing_balance = $4::numeric,
         last_updated = now()
     WHERE entity_id = $1 AND period_id = $2 AND component = $5`,
    [
      oci.entity_id as string,
      oci.period_id as string,
      newRecycled,
      newClosing,
      componentKey,
    ],
  );

  return true;
}

export async function getOCIComponents(entityId: string, periodId: string) {
  const results = await runCypher<{ oci: Record<string, unknown> }>(
    `MATCH (oci:OtherComprehensiveIncome {entity_id: $entityId, period_id: $periodId})
     RETURN properties(oci) AS oci ORDER BY oci.component`,
    { entityId, periodId },
  );
  return results.map((r) => r.oci);
}

/**
 * Check if an OCI component is recyclable.
 */
export function isRecyclable(component: OciComponent): boolean {
  return !NON_RECYCLING_COMPONENTS.includes(component);
}

// ============================================================
// EquitySection (Presentation Node)
// ============================================================

/**
 * Generate the EquitySection presentation node for an entity and period.
 * Aggregates RetainedEarnings + all OCI components.
 */
export async function generateEquitySection(
  entityId: string,
  periodId: string,
  nciEquity?: number,
): Promise<string> {
  // Get retained earnings
  const reResults = await runCypher<{ closing: number }>(
    `MATCH (re:RetainedEarnings {entity_id: $entityId, period_id: $periodId})
     RETURN COALESCE(SUM(re.closing_balance), 0) AS closing`,
    { entityId, periodId },
  );
  const retainedEarnings = Number(reResults[0]?.closing ?? 0);

  // Get accumulated OCI
  const ociResults = await runCypher<{ total: number }>(
    `MATCH (oci:OtherComprehensiveIncome {entity_id: $entityId, period_id: $periodId})
     RETURN COALESCE(SUM(oci.closing_balance), 0) AS total`,
    { entityId, periodId },
  );
  const accumulatedOci = Number(ociResults[0]?.total ?? 0);

  // Sum share capital from all ShareClass nodes
  const scResults = await runCypher<{ total: number }>(
    `MATCH (sc:ShareClass {entity_id: $entityId})
     RETURN COALESCE(SUM(sc.share_capital_amount), 0) AS total`,
    { entityId },
  );
  const shareCapital = Number(scResults[0]?.total ?? 0);
  const totalEquity = shareCapital + retainedEarnings + accumulatedOci;
  const nci = nciEquity ?? 0;
  const totalWithNci = totalEquity + nci;

  const id = uuid();
  await runCypher(
    `CREATE (es:EquitySection {
      id: $id, entity_id: $entityId, period_id: $periodId,
      share_capital: $shareCapital,
      retained_earnings: $retainedEarnings,
      accumulated_oci: $accumulatedOci,
      total_equity: $totalEquity,
      nci_equity: $nci,
      total_equity_and_nci: $totalWithNci,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId,
      periodId,
      shareCapital,
      retainedEarnings: Math.round(retainedEarnings * 100) / 100,
      accumulatedOci: Math.round(accumulatedOci * 100) / 100,
      totalEquity: Math.round(totalEquity * 100) / 100,
      nci: Math.round(nci * 100) / 100,
      totalWithNci: Math.round(totalWithNci * 100) / 100,
    },
  );

  return id;
}

export async function getEquitySection(entityId: string, periodId: string) {
  const results = await runCypher<{ es: Record<string, unknown> }>(
    `MATCH (es:EquitySection {entity_id: $entityId, period_id: $periodId})
     RETURN properties(es) AS es`,
    { entityId, periodId },
  );
  return results[0]?.es ?? null;
}

/**
 * Get full equity breakdown from equity_period_balances (CQRS read).
 */
export async function getEquityBreakdown(entityId: string, periodId: string) {
  const result = await query<{
    component: string;
    opening_balance: string;
    movement: string;
    recycled_to_pnl: string;
    closing_balance: string;
  }>(
    `SELECT component, opening_balance, movement, recycled_to_pnl, closing_balance
     FROM equity_period_balances
     WHERE entity_id = $1 AND period_id = $2
     ORDER BY component`,
    [entityId, periodId],
  );
  return result.rows.map((r) => ({
    component: r.component,
    openingBalance: Number(r.opening_balance),
    movement: Number(r.movement),
    recycledToPnl: Number(r.recycled_to_pnl),
    closingBalance: Number(r.closing_balance),
  }));
}
