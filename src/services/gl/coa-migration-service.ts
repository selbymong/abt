/**
 * COA Migration Service
 *
 * Imports historical data from traditional chart-of-accounts-based GL systems
 * into the graph-native ledger. Maps legacy COA codes to graph node references,
 * batch-posts journal entries, seeds StatutoryMappings, and verifies balances.
 */
import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import { postJournalEntry } from './journal-posting-service.js';
import { createStatutoryMapping } from './statutory-mapping-service.js';
import type { NodeRefType, EconomicCategory, EntryType, Side } from '../../schema/neo4j/types.js';

// ============================================================
// COA Mapping — bridge legacy codes to graph nodes
// ============================================================

export interface COAMapping {
  coaCode: string;
  coaLabel: string;
  nodeRefId: string;
  nodeRefType: NodeRefType;
  economicCategory: EconomicCategory;
  jurisdiction?: string;
}

const coaMappingStore: Map<string, COAMapping> = new Map();

export function registerCOAMapping(mapping: COAMapping): void {
  coaMappingStore.set(mapping.coaCode, mapping);
}

export function registerCOAMappings(mappings: COAMapping[]): number {
  for (const m of mappings) {
    coaMappingStore.set(m.coaCode, m);
  }
  return mappings.length;
}

export function getCOAMapping(coaCode: string): COAMapping | undefined {
  return coaMappingStore.get(coaCode);
}

export function listCOAMappings(): COAMapping[] {
  return Array.from(coaMappingStore.values());
}

export function clearCOAMappings(): void {
  coaMappingStore.clear();
}

// ============================================================
// Legacy GL Import Types
// ============================================================

export interface LegacyGLEntry {
  legacyId: string;
  entryDate: string;
  narrative: string;
  sourceSystem: string;
  lines: LegacyGLLine[];
}

export interface LegacyGLLine {
  coaCode: string;
  side: Side;
  amount: number;
  fundId?: string;
}

export interface ImportValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  entryCount: number;
  lineCount: number;
  unmappedCodes: string[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  journalEntryIds: string[];
  errors: string[];
}

// ============================================================
// Validation
// ============================================================

export function validateImport(entries: LegacyGLEntry[]): ImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const unmappedCodes = new Set<string>();
  let lineCount = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (!entry.legacyId) {
      errors.push(`Entry ${i}: missing legacyId`);
    }
    if (!entry.entryDate) {
      errors.push(`Entry ${i}: missing entryDate`);
    }
    if (!entry.lines || entry.lines.length === 0) {
      errors.push(`Entry ${i} (${entry.legacyId}): no lines`);
      continue;
    }

    // Double-entry check
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of entry.lines) {
      lineCount++;

      if (!line.coaCode) {
        errors.push(`Entry ${entry.legacyId}: line missing coaCode`);
        continue;
      }
      if (line.amount <= 0) {
        errors.push(`Entry ${entry.legacyId}: line amount must be positive (got ${line.amount})`);
      }

      const mapping = getCOAMapping(line.coaCode);
      if (!mapping) {
        unmappedCodes.add(line.coaCode);
      }

      if (line.side === 'DEBIT') totalDebit += line.amount;
      else totalCredit += line.amount;
    }

    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.01) {
      errors.push(
        `Entry ${entry.legacyId}: debits (${totalDebit}) != credits (${totalCredit}), diff=${diff.toFixed(2)}`,
      );
    }
  }

  if (unmappedCodes.size > 0) {
    warnings.push(`${unmappedCodes.size} unmapped COA code(s): ${Array.from(unmappedCodes).join(', ')}`);
  }

  return {
    valid: errors.length === 0 && unmappedCodes.size === 0,
    errors,
    warnings,
    entryCount: entries.length,
    lineCount,
    unmappedCodes: Array.from(unmappedCodes),
  };
}

// ============================================================
// Import (batch post)
// ============================================================

export async function importLegacyGL(
  entityId: string,
  periodId: string,
  entries: LegacyGLEntry[],
  currency: string = 'CAD',
): Promise<ImportResult> {
  const journalEntryIds: string[] = [];
  const errors: string[] = [];
  let skipped = 0;

  for (const entry of entries) {
    // Check idempotency — skip if already imported
    const existing = await runCypher<{ id: string }>(
      `MATCH (je:JournalEntry {entity_id: $entityId, reference: $ref})
       RETURN je.id AS id LIMIT 1`,
      { entityId, ref: `MIGRATION-${entry.sourceSystem}-${entry.legacyId}` },
    );
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    // Map lines
    const mappedLines: {
      side: Side;
      amount: number;
      nodeRefId: string;
      nodeRefType: NodeRefType;
      economicCategory: EconomicCategory;
      fundId?: string;
    }[] = [];

    let hasError = false;
    for (const line of entry.lines) {
      const mapping = getCOAMapping(line.coaCode);
      if (!mapping) {
        errors.push(`Entry ${entry.legacyId}: unmapped COA code ${line.coaCode}`);
        hasError = true;
        break;
      }
      mappedLines.push({
        side: line.side,
        amount: line.amount,
        nodeRefId: mapping.nodeRefId,
        nodeRefType: mapping.nodeRefType,
        economicCategory: mapping.economicCategory,
        fundId: line.fundId,
      });
    }
    if (hasError) {
      skipped++;
      continue;
    }

    try {
      const jeId = await postJournalEntry({
        entityId,
        periodId,
        entryType: 'OPERATIONAL' as EntryType,
        reference: `MIGRATION-${entry.sourceSystem}-${entry.legacyId}`,
        narrative: entry.narrative,
        currency,
        validDate: entry.entryDate,
        sourceSystem: entry.sourceSystem,
        lines: mappedLines,
      });
      journalEntryIds.push(jeId);
    } catch (err: any) {
      errors.push(`Entry ${entry.legacyId}: ${err.message}`);
      skipped++;
    }
  }

  return {
    imported: journalEntryIds.length,
    skipped,
    journalEntryIds,
    errors,
  };
}

// ============================================================
// Auto-create graph nodes for unmapped COA codes
// ============================================================

export async function createNodesForUnmappedCodes(
  entityId: string,
  unmappedCodes: { coaCode: string; coaLabel: string; economicCategory: EconomicCategory }[],
): Promise<COAMapping[]> {
  const mappings: COAMapping[] = [];

  for (const code of unmappedCodes) {
    const nodeId = uuid();

    // Determine node type from economic category
    let nodeRefType: NodeRefType;
    let nodeLabel: string;

    switch (code.economicCategory) {
      case 'REVENUE':
        nodeRefType = 'ACTIVITY';
        nodeLabel = 'Activity';
        break;
      case 'EXPENSE':
        nodeRefType = 'ACTIVITY';
        nodeLabel = 'Activity';
        break;
      case 'ASSET':
        nodeRefType = 'CASHFLOWEVENT';
        nodeLabel = 'CashFlowEvent';
        break;
      case 'LIABILITY':
        nodeRefType = 'CASHFLOWEVENT';
        nodeLabel = 'CashFlowEvent';
        break;
      case 'EQUITY':
        nodeRefType = 'FUND';
        nodeLabel = 'Fund';
        break;
      default:
        nodeRefType = 'ACTIVITY';
        nodeLabel = 'Activity';
    }

    // Create the graph node
    await runCypher(
      `CREATE (n:${nodeLabel} {
        id: $id, entity_id: $entityId,
        label: $label,
        status: 'IN_PROGRESS',
        migration_source_code: $coaCode,
        created_at: datetime(), updated_at: datetime()
      })`,
      {
        id: nodeId,
        entityId,
        label: `Legacy: ${code.coaCode} - ${code.coaLabel}`,
        coaCode: code.coaCode,
      },
    );

    const mapping: COAMapping = {
      coaCode: code.coaCode,
      coaLabel: code.coaLabel,
      nodeRefId: nodeId,
      nodeRefType,
      economicCategory: code.economicCategory,
    };
    registerCOAMapping(mapping);
    mappings.push(mapping);
  }

  return mappings;
}

// ============================================================
// Seed StatutoryMappings from COA mappings
// ============================================================

export async function seedStatutoryMappingsFromCOA(
  jurisdiction: string,
  asOfDate: string,
): Promise<{ seeded: number }> {
  const mappings = listCOAMappings();
  let seeded = 0;

  for (const m of mappings) {
    if (!m.jurisdiction || m.jurisdiction === jurisdiction) {
      try {
        await createStatutoryMapping({
          jurisdiction,
          nodeRefType: m.nodeRefType,
          economicCategory: m.economicCategory,
          statutoryAccountCode: m.coaCode,
          statutoryAccountLabel: m.coaLabel,
          appliesFrom: asOfDate,
        });
        seeded++;
      } catch {
        // Skip duplicates
      }
    }
  }

  return { seeded };
}

// ============================================================
// Trial Balance Verification
// ============================================================

export interface TrialBalanceEntry {
  coaCode: string;
  coaLabel: string;
  debitBalance: number;
  creditBalance: number;
}

export interface VerificationResult {
  matched: number;
  mismatched: number;
  missing: number;
  totalLegacyDebits: number;
  totalLegacyCredited: number;
  totalGraphDebits: number;
  totalGraphCredits: number;
  details: {
    coaCode: string;
    legacyDebit: number;
    legacyCredit: number;
    graphDebit: number;
    graphCredit: number;
    matches: boolean;
  }[];
}

export async function verifyAgainstTrialBalance(
  entityId: string,
  periodId: string,
  legacyTrialBalance: TrialBalanceEntry[],
): Promise<VerificationResult> {
  let matched = 0;
  let mismatched = 0;
  let missing = 0;
  let totalLegacyDebits = 0;
  let totalLegacyCredited = 0;
  let totalGraphDebits = 0;
  let totalGraphCredits = 0;

  const details: VerificationResult['details'] = [];

  for (const tb of legacyTrialBalance) {
    totalLegacyDebits += tb.debitBalance;
    totalLegacyCredited += tb.creditBalance;

    const mapping = getCOAMapping(tb.coaCode);
    if (!mapping) {
      missing++;
      details.push({
        coaCode: tb.coaCode,
        legacyDebit: tb.debitBalance,
        legacyCredit: tb.creditBalance,
        graphDebit: 0,
        graphCredit: 0,
        matches: false,
      });
      continue;
    }

    // Query graph balances for this node_ref_id in the period
    const result = await query<{
      total_debit: string;
      total_credit: string;
    }>(
      `SELECT
         COALESCE(SUM(CASE WHEN side = 'DEBIT' THEN functional_amount ELSE 0 END), 0)::text AS total_debit,
         COALESCE(SUM(CASE WHEN side = 'CREDIT' THEN functional_amount ELSE 0 END), 0)::text AS total_credit
       FROM gl_period_balances
       WHERE entity_id = $1 AND period_id = $2 AND node_ref_id = $3`,
      [entityId, periodId, mapping.nodeRefId],
    );

    const graphDebit = Number(result.rows[0]?.total_debit ?? 0);
    const graphCredit = Number(result.rows[0]?.total_credit ?? 0);
    totalGraphDebits += graphDebit;
    totalGraphCredits += graphCredit;

    const debitMatch = Math.abs(graphDebit - tb.debitBalance) < 0.01;
    const creditMatch = Math.abs(graphCredit - tb.creditBalance) < 0.01;
    const matches = debitMatch && creditMatch;

    if (matches) matched++;
    else mismatched++;

    details.push({
      coaCode: tb.coaCode,
      legacyDebit: tb.debitBalance,
      legacyCredit: tb.creditBalance,
      graphDebit,
      graphCredit,
      matches,
    });
  }

  return {
    matched,
    mismatched,
    missing,
    totalLegacyDebits,
    totalLegacyCredited,
    totalGraphDebits,
    totalGraphCredits,
    details,
  };
}

// ============================================================
// Migration Summary
// ============================================================

export async function getMigrationSummary(
  entityId: string,
  sourceSystem: string,
): Promise<{
  totalEntries: number;
  totalLines: number;
  totalDebits: number;
  totalCredits: number;
  dateRange: { earliest: string | null; latest: string | null };
}> {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (je:JournalEntry {entity_id: $entityId})
     WHERE je.reference STARTS WITH $prefix
     OPTIONAL MATCH (je)<-[:BELONGS_TO]-(ll:LedgerLine)
     RETURN count(DISTINCT je) AS entryCount,
            count(ll) AS lineCount,
            SUM(CASE WHEN ll.side = 'DEBIT' THEN ll.functional_amount ELSE 0 END) AS totalDebits,
            SUM(CASE WHEN ll.side = 'CREDIT' THEN ll.functional_amount ELSE 0 END) AS totalCredits,
            MIN(je.entry_date) AS earliest,
            MAX(je.entry_date) AS latest`,
    { entityId, prefix: `MIGRATION-${sourceSystem}` },
  );

  const row = rows[0] ?? {};
  return {
    totalEntries: Number(row.entryCount ?? 0),
    totalLines: Number(row.lineCount ?? 0),
    totalDebits: Number(row.totalDebits ?? 0),
    totalCredits: Number(row.totalCredits ?? 0),
    dateRange: {
      earliest: row.earliest ?? null,
      latest: row.latest ?? null,
    },
  };
}
