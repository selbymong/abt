/**
 * StatutoryMapping Service
 *
 * Manages the mapping rules that translate graph node references +
 * economic categories into traditional Chart-of-Accounts codes for
 * each jurisdiction (CA-ASPE, US-GAAP, etc.).
 */
import { v4 as uuid } from 'uuid';
import { query } from '../../lib/pg.js';

export interface StatutoryMapping {
  id: string;
  jurisdiction: string;
  node_ref_type: string;
  economic_category: string;
  node_tags_match: string[] | null;
  statutory_account_code: string;
  statutory_account_label: string;
  applies_from: string;
  applies_until: string | null;
  xbrl_element: string | null;
  xbrl_taxonomy: string | null;
}

export interface CreateMappingInput {
  jurisdiction: string;
  nodeRefType: string;
  economicCategory: string;
  nodeTagsMatch?: string[];
  statutoryAccountCode: string;
  statutoryAccountLabel: string;
  appliesFrom: string;
  appliesUntil?: string;
  xbrlElement?: string;
  xbrlTaxonomy?: string;
}

export async function createStatutoryMapping(input: CreateMappingInput): Promise<string> {
  const id = uuid();
  await query(
    `INSERT INTO statutory_mappings
       (id, jurisdiction, node_ref_type, economic_category, node_tags_match,
        statutory_account_code, statutory_account_label, applies_from, applies_until,
        xbrl_element, xbrl_taxonomy)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8::date, $9::date, $10, $11)`,
    [
      id,
      input.jurisdiction,
      input.nodeRefType,
      input.economicCategory,
      input.nodeTagsMatch ?? null,
      input.statutoryAccountCode,
      input.statutoryAccountLabel,
      input.appliesFrom,
      input.appliesUntil ?? null,
      input.xbrlElement ?? null,
      input.xbrlTaxonomy ?? null,
    ],
  );
  return id;
}

export async function getStatutoryMapping(id: string): Promise<StatutoryMapping | null> {
  const result = await query<StatutoryMapping>(
    `SELECT * FROM statutory_mappings WHERE id = $1::uuid`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function listStatutoryMappings(jurisdiction: string): Promise<StatutoryMapping[]> {
  const result = await query<StatutoryMapping>(
    `SELECT * FROM statutory_mappings
     WHERE jurisdiction = $1
     ORDER BY economic_category, statutory_account_code`,
    [jurisdiction],
  );
  return result.rows;
}

export async function updateStatutoryMapping(
  id: string,
  updates: Partial<CreateMappingInput>,
): Promise<boolean> {
  const fields: string[] = [];
  const values: unknown[] = [id];
  let idx = 2;

  if (updates.statutoryAccountCode !== undefined) {
    fields.push(`statutory_account_code = $${idx++}`);
    values.push(updates.statutoryAccountCode);
  }
  if (updates.statutoryAccountLabel !== undefined) {
    fields.push(`statutory_account_label = $${idx++}`);
    values.push(updates.statutoryAccountLabel);
  }
  if (updates.appliesUntil !== undefined) {
    fields.push(`applies_until = $${idx++}::date`);
    values.push(updates.appliesUntil);
  }
  if (updates.xbrlElement !== undefined) {
    fields.push(`xbrl_element = $${idx++}`);
    values.push(updates.xbrlElement);
  }
  if (updates.xbrlTaxonomy !== undefined) {
    fields.push(`xbrl_taxonomy = $${idx++}`);
    values.push(updates.xbrlTaxonomy);
  }

  if (fields.length === 0) return false;

  const result = await query(
    `UPDATE statutory_mappings SET ${fields.join(', ')} WHERE id = $1::uuid`,
    values,
  );
  return (result.rowCount ?? 0) > 0;
}

export async function deleteStatutoryMapping(id: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM statutory_mappings WHERE id = $1::uuid`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Resolve the statutory account code for a given node + jurisdiction.
 * Matches on (jurisdiction, node_ref_type, economic_category) with
 * applies_from/applies_until date filtering.
 */
export async function resolveStatutoryCode(
  jurisdiction: string,
  nodeRefType: string,
  economicCategory: string,
  asOfDate: string,
): Promise<{ statutoryAccountCode: string; statutoryAccountLabel: string } | null> {
  const result = await query<{ statutory_account_code: string; statutory_account_label: string }>(
    `SELECT statutory_account_code, statutory_account_label
     FROM statutory_mappings
     WHERE jurisdiction = $1
       AND node_ref_type = $2
       AND economic_category = $3
       AND applies_from <= $4::date
       AND (applies_until IS NULL OR applies_until >= $4::date)
     ORDER BY applies_from DESC
     LIMIT 1`,
    [jurisdiction, nodeRefType, economicCategory, asOfDate],
  );
  if (result.rows.length === 0) return null;
  return {
    statutoryAccountCode: result.rows[0].statutory_account_code,
    statutoryAccountLabel: result.rows[0].statutory_account_label,
  };
}
