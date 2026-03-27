/**
 * Segment Reporting Service (IFRS 8)
 *
 * Segments map to Initiative nodes. Activities and Projects belong to
 * Initiatives via initiative_id. This service aggregates P&L and assets
 * per segment (Initiative) for CODM reporting.
 *
 * CQRS: P&L/asset data from TimescaleDB gl_period_balances,
 * segment hierarchy from Neo4j.
 */
import { query } from '../../lib/pg.js';
import { runCypher } from '../../lib/neo4j.js';

const NULL_FUND = '00000000-0000-0000-0000-000000000000';

// ============================================================
// Types
// ============================================================

export interface SegmentInfo {
  id: string;
  label: string;
  entity_id: string;
  status: string;
  budget: number;
}

export interface SegmentPnL {
  segment: SegmentInfo;
  revenue: number;
  expenses: number;
  segment_profit: number;
  assets: number;
  liabilities: number;
  byCategory: Array<{
    economic_category: string;
    debit_total: number;
    credit_total: number;
    net_balance: number;
  }>;
}

export interface SegmentReportResult {
  entity_id: string;
  period_id: string;
  fund_id?: string;
  segments: SegmentPnL[];
  unallocated: SegmentPnL;
  consolidated: {
    revenue: number;
    expenses: number;
    segment_profit: number;
    assets: number;
    liabilities: number;
  };
  inter_segment_eliminations: number;
}

// ============================================================
// Core Segment Reporting
// ============================================================

/**
 * Generate IFRS 8 segment report for an entity/period.
 *
 * Steps:
 * 1. Fetch all Initiative (segment) nodes for the entity
 * 2. For each segment, find child Activity/Project node_ref_ids
 * 3. Aggregate gl_period_balances by segment
 * 4. Compute unallocated (balances not tied to any segment)
 * 5. Inter-segment eliminations
 */
export async function getSegmentReport(
  entityId: string,
  periodId: string,
  fundId?: string,
): Promise<SegmentReportResult> {
  const fundFilter = fundId ?? NULL_FUND;

  // Step 1: Get all Initiative segments for this entity
  const initiatives = await runCypher<{
    id: string;
    label: string;
    entity_id: string;
    status: string;
    budget: number;
  }>(
    `MATCH (i:Initiative {entity_id: $entityId})
     RETURN i.id AS id, i.label AS label, i.entity_id AS entity_id,
            i.status AS status, COALESCE(i.budget, 0) AS budget
     ORDER BY i.label`,
    { entityId },
  );

  // Step 2: For each initiative, find child Activity and Project node_ref_ids
  const segmentNodeMap = new Map<string, string[]>();

  if (initiatives.length > 0) {
    const initiativeIds = initiatives.map((i) => i.id);

    // Activities with initiative_id
    const activityNodes = await runCypher<{ initiative_id: string; id: string }>(
      `MATCH (a:Activity)
       WHERE a.initiative_id IN $initiativeIds AND a.entity_id = $entityId
       RETURN a.initiative_id AS initiative_id, a.id AS id`,
      { initiativeIds, entityId },
    );

    // Projects with initiative_id
    const projectNodes = await runCypher<{ initiative_id: string; id: string }>(
      `MATCH (p:Project)
       WHERE p.initiative_id IN $initiativeIds AND p.entity_id = $entityId
       RETURN p.initiative_id AS initiative_id, p.id AS id`,
      { initiativeIds, entityId },
    );

    // Also include the initiative nodes themselves (direct postings)
    for (const init of initiatives) {
      segmentNodeMap.set(init.id, [init.id]);
    }

    for (const a of activityNodes) {
      const existing = segmentNodeMap.get(a.initiative_id) ?? [];
      existing.push(a.id);
      segmentNodeMap.set(a.initiative_id, existing);
    }

    for (const p of projectNodes) {
      const existing = segmentNodeMap.get(p.initiative_id) ?? [];
      existing.push(p.id);
      segmentNodeMap.set(p.initiative_id, existing);
    }
  }

  // Step 3: Get ALL gl_period_balances for this entity/period
  const allBalances = await query<{
    node_ref_id: string;
    economic_category: string;
    debit_total: string;
    credit_total: string;
    net_balance: string;
  }>(
    `SELECT node_ref_id::text, economic_category,
            SUM(debit_total) AS debit_total,
            SUM(credit_total) AS credit_total,
            SUM(net_balance) AS net_balance
     FROM gl_period_balances
     WHERE entity_id = $1::uuid AND period_id = $2::uuid
       AND COALESCE(fund_id, '00000000-0000-0000-0000-000000000000'::uuid) = $3::uuid
     GROUP BY node_ref_id, economic_category`,
    [entityId, periodId, fundFilter],
  );

  // Build node → balances map
  const nodeBalanceMap = new Map<string, Array<{
    economic_category: string;
    debit_total: number;
    credit_total: number;
    net_balance: number;
  }>>();

  for (const row of allBalances.rows) {
    const entry = {
      economic_category: row.economic_category,
      debit_total: Number(row.debit_total),
      credit_total: Number(row.credit_total),
      net_balance: Number(row.net_balance),
    };
    const existing = nodeBalanceMap.get(row.node_ref_id) ?? [];
    existing.push(entry);
    nodeBalanceMap.set(row.node_ref_id, existing);
  }

  // Step 4: Aggregate per segment
  const allocatedNodeIds = new Set<string>();
  const segments: SegmentPnL[] = [];

  for (const init of initiatives) {
    const nodeIds = segmentNodeMap.get(init.id) ?? [];
    const segBalances = aggregateBalances(nodeIds, nodeBalanceMap);

    for (const nid of nodeIds) {
      allocatedNodeIds.add(nid);
    }

    segments.push({
      segment: {
        id: init.id,
        label: init.label,
        entity_id: init.entity_id,
        status: init.status,
        budget: init.budget,
      },
      ...segBalances,
    });
  }

  // Step 5: Unallocated — balances not tied to any segment
  const unallocatedNodeIds = [...nodeBalanceMap.keys()].filter(
    (nid) => !allocatedNodeIds.has(nid),
  );
  const unallocatedBalances = aggregateBalances(unallocatedNodeIds, nodeBalanceMap);
  const unallocated: SegmentPnL = {
    segment: {
      id: 'UNALLOCATED',
      label: 'Unallocated',
      entity_id: entityId,
      status: 'N/A',
      budget: 0,
    },
    ...unallocatedBalances,
  };

  // Step 6: Inter-segment eliminations (INTER_SEGMENT edges between initiatives)
  const interSegment = await getInterSegmentEliminations(entityId, periodId, fundFilter);

  // Consolidated totals
  const allSegs = [...segments, unallocated];
  const consolidated = {
    revenue: allSegs.reduce((s, seg) => s + seg.revenue, 0),
    expenses: allSegs.reduce((s, seg) => s + seg.expenses, 0),
    segment_profit: allSegs.reduce((s, seg) => s + seg.segment_profit, 0) - interSegment,
    assets: allSegs.reduce((s, seg) => s + seg.assets, 0),
    liabilities: allSegs.reduce((s, seg) => s + seg.liabilities, 0),
  };

  return {
    entity_id: entityId,
    period_id: periodId,
    fund_id: fundId,
    segments,
    unallocated,
    consolidated,
    inter_segment_eliminations: interSegment,
  };
}

// ============================================================
// Segment Detail
// ============================================================

/**
 * Get detailed P&L for a single segment (Initiative) with node-level breakdown.
 */
export async function getSegmentDetail(
  entityId: string,
  periodId: string,
  initiativeId: string,
  fundId?: string,
): Promise<{
  segment: SegmentInfo;
  pnl: { revenue: number; expenses: number; segment_profit: number };
  nodes: Array<{
    node_ref_id: string;
    node_ref_type: string;
    label: string;
    revenue: number;
    expenses: number;
    net: number;
  }>;
}> {
  const fundFilter = fundId ?? NULL_FUND;

  // Get segment info
  const [init] = await runCypher<SegmentInfo>(
    `MATCH (i:Initiative {id: $id, entity_id: $entityId})
     RETURN i.id AS id, i.label AS label, i.entity_id AS entity_id,
            i.status AS status, COALESCE(i.budget, 0) AS budget`,
    { id: initiativeId, entityId },
  );

  if (!init) {
    throw new Error(`Initiative ${initiativeId} not found`);
  }

  // Get child nodes
  const childNodes = await runCypher<{ id: string; label: string; node_type: string }>(
    `MATCH (n)
     WHERE (n:Activity OR n:Project) AND n.initiative_id = $initiativeId AND n.entity_id = $entityId
     RETURN n.id AS id, n.label AS label, labels(n)[0] AS node_type
     UNION ALL
     MATCH (i:Initiative {id: $initiativeId, entity_id: $entityId})
     RETURN i.id AS id, i.label AS label, 'Initiative' AS node_type`,
    { initiativeId, entityId },
  );

  const nodeIds = childNodes.map((n) => n.id);

  // Get balances per node
  const balances = await query<{
    node_ref_id: string;
    node_ref_type: string;
    economic_category: string;
    debit_total: string;
    credit_total: string;
  }>(
    `SELECT node_ref_id::text, node_ref_type, economic_category,
            SUM(debit_total) AS debit_total,
            SUM(credit_total) AS credit_total
     FROM gl_period_balances
     WHERE entity_id = $1::uuid AND period_id = $2::uuid
       AND COALESCE(fund_id, '00000000-0000-0000-0000-000000000000'::uuid) = $3::uuid
       AND node_ref_id = ANY($4::uuid[])
     GROUP BY node_ref_id, node_ref_type, economic_category`,
    [entityId, periodId, fundFilter, nodeIds],
  );

  // Aggregate per node
  const nodeMap = new Map<string, { revenue: number; expenses: number }>();
  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const row of balances.rows) {
    const existing = nodeMap.get(row.node_ref_id) ?? { revenue: 0, expenses: 0 };
    const cat = row.economic_category;

    if (cat === 'REVENUE' || cat === 'OTHER_INCOME') {
      const rev = Number(row.credit_total);
      existing.revenue += rev;
      totalRevenue += rev;
    } else if (cat === 'EXPENSE' || cat === 'COST_OF_GOODS_SOLD' || cat === 'OTHER_EXPENSE') {
      const exp = Number(row.debit_total);
      existing.expenses += exp;
      totalExpenses += exp;
    }

    nodeMap.set(row.node_ref_id, existing);
  }

  const nodes = childNodes.map((n) => {
    const amounts = nodeMap.get(n.id) ?? { revenue: 0, expenses: 0 };
    return {
      node_ref_id: n.id,
      node_ref_type: n.node_type,
      label: n.label,
      revenue: amounts.revenue,
      expenses: amounts.expenses,
      net: amounts.revenue - amounts.expenses,
    };
  });

  return {
    segment: init,
    pnl: {
      revenue: totalRevenue,
      expenses: totalExpenses,
      segment_profit: totalRevenue - totalExpenses,
    },
    nodes,
  };
}

// ============================================================
// Helpers
// ============================================================

interface AggregatedBalances {
  revenue: number;
  expenses: number;
  segment_profit: number;
  assets: number;
  liabilities: number;
  byCategory: Array<{
    economic_category: string;
    debit_total: number;
    credit_total: number;
    net_balance: number;
  }>;
}

function aggregateBalances(
  nodeIds: string[],
  nodeBalanceMap: Map<string, Array<{
    economic_category: string;
    debit_total: number;
    credit_total: number;
    net_balance: number;
  }>>,
): AggregatedBalances {
  const categoryTotals = new Map<string, { debit_total: number; credit_total: number; net_balance: number }>();

  for (const nid of nodeIds) {
    const balances = nodeBalanceMap.get(nid) ?? [];
    for (const b of balances) {
      const existing = categoryTotals.get(b.economic_category) ?? { debit_total: 0, credit_total: 0, net_balance: 0 };
      existing.debit_total += b.debit_total;
      existing.credit_total += b.credit_total;
      existing.net_balance += b.net_balance;
      categoryTotals.set(b.economic_category, existing);
    }
  }

  const byCategory = [...categoryTotals.entries()].map(([cat, totals]) => ({
    economic_category: cat,
    ...totals,
  }));

  const revenue = byCategory
    .filter((r) => r.economic_category === 'REVENUE' || r.economic_category === 'OTHER_INCOME')
    .reduce((s, r) => s + r.credit_total, 0);

  const expenses = byCategory
    .filter((r) => r.economic_category === 'EXPENSE' || r.economic_category === 'COST_OF_GOODS_SOLD' || r.economic_category === 'OTHER_EXPENSE')
    .reduce((s, r) => s + r.debit_total, 0);

  const assets = byCategory
    .filter((r) => r.economic_category === 'ASSET')
    .reduce((s, r) => s + r.debit_total - r.credit_total, 0);

  const liabilities = byCategory
    .filter((r) => r.economic_category === 'LIABILITY')
    .reduce((s, r) => s + r.credit_total - r.debit_total, 0);

  return {
    revenue,
    expenses,
    segment_profit: revenue - expenses,
    assets,
    liabilities,
    byCategory,
  };
}

/**
 * Check for inter-segment revenue that should be eliminated.
 * Inter-segment transactions are LedgerLines where the posting node
 * belongs to one segment but the counterparty node belongs to another.
 * For simplicity, we look for node_ref_type INTER_SEGMENT entries.
 */
async function getInterSegmentEliminations(
  entityId: string,
  periodId: string,
  fundFilter: string,
): Promise<number> {
  const result = await query<{ elimination: string }>(
    `SELECT COALESCE(SUM(credit_total), 0) AS elimination
     FROM gl_period_balances
     WHERE entity_id = $1::uuid AND period_id = $2::uuid
       AND COALESCE(fund_id, '00000000-0000-0000-0000-000000000000'::uuid) = $3::uuid
       AND node_ref_type = 'INTER_SEGMENT'`,
    [entityId, periodId, fundFilter],
  );

  return Number(result.rows[0]?.elimination ?? 0);
}
