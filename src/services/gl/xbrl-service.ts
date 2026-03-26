/**
 * XBRL Tagging Service
 *
 * Manages XBRL element tagging on StatutoryMapping entries.
 * Supports IFRS and US-GAAP taxonomies, bulk tagging,
 * validation, and iXBRL document generation.
 */
import { v4 as uuid } from 'uuid';
import { query } from '../../lib/pg.js';

// ============================================================
// Taxonomy Definitions
// ============================================================

export type XBRLTaxonomy = 'ifrs-full' | 'us-gaap' | 'dei';

export interface XBRLTag {
  element: string;
  taxonomy: XBRLTaxonomy;
  label: string;
  dataType: 'monetary' | 'string' | 'date' | 'shares' | 'perShare' | 'percent';
  periodType: 'instant' | 'duration';
  balance?: 'debit' | 'credit';
}

// Common IFRS XBRL elements
const IFRS_TAGS: Record<string, XBRLTag> = {
  'Revenue': { element: 'ifrs-full:Revenue', taxonomy: 'ifrs-full', label: 'Revenue', dataType: 'monetary', periodType: 'duration', balance: 'credit' },
  'CostOfSales': { element: 'ifrs-full:CostOfSales', taxonomy: 'ifrs-full', label: 'Cost of sales', dataType: 'monetary', periodType: 'duration', balance: 'debit' },
  'GrossProfit': { element: 'ifrs-full:GrossProfit', taxonomy: 'ifrs-full', label: 'Gross profit', dataType: 'monetary', periodType: 'duration', balance: 'credit' },
  'AdministrativeExpense': { element: 'ifrs-full:AdministrativeExpense', taxonomy: 'ifrs-full', label: 'Administrative expenses', dataType: 'monetary', periodType: 'duration', balance: 'debit' },
  'ProfitLoss': { element: 'ifrs-full:ProfitLoss', taxonomy: 'ifrs-full', label: 'Profit (loss)', dataType: 'monetary', periodType: 'duration', balance: 'credit' },
  'Assets': { element: 'ifrs-full:Assets', taxonomy: 'ifrs-full', label: 'Total assets', dataType: 'monetary', periodType: 'instant', balance: 'debit' },
  'NoncurrentAssets': { element: 'ifrs-full:NoncurrentAssets', taxonomy: 'ifrs-full', label: 'Non-current assets', dataType: 'monetary', periodType: 'instant', balance: 'debit' },
  'CurrentAssets': { element: 'ifrs-full:CurrentAssets', taxonomy: 'ifrs-full', label: 'Current assets', dataType: 'monetary', periodType: 'instant', balance: 'debit' },
  'Inventories': { element: 'ifrs-full:Inventories', taxonomy: 'ifrs-full', label: 'Inventories', dataType: 'monetary', periodType: 'instant', balance: 'debit' },
  'PropertyPlantAndEquipment': { element: 'ifrs-full:PropertyPlantAndEquipment', taxonomy: 'ifrs-full', label: 'Property, plant and equipment', dataType: 'monetary', periodType: 'instant', balance: 'debit' },
  'RightOfUseAssets': { element: 'ifrs-full:RightofuseAssets', taxonomy: 'ifrs-full', label: 'Right-of-use assets', dataType: 'monetary', periodType: 'instant', balance: 'debit' },
  'Goodwill': { element: 'ifrs-full:Goodwill', taxonomy: 'ifrs-full', label: 'Goodwill', dataType: 'monetary', periodType: 'instant', balance: 'debit' },
  'Equity': { element: 'ifrs-full:Equity', taxonomy: 'ifrs-full', label: 'Total equity', dataType: 'monetary', periodType: 'instant', balance: 'credit' },
  'RetainedEarnings': { element: 'ifrs-full:RetainedEarnings', taxonomy: 'ifrs-full', label: 'Retained earnings', dataType: 'monetary', periodType: 'instant', balance: 'credit' },
  'IssuedCapital': { element: 'ifrs-full:IssuedCapital', taxonomy: 'ifrs-full', label: 'Issued capital', dataType: 'monetary', periodType: 'instant', balance: 'credit' },
  'Liabilities': { element: 'ifrs-full:Liabilities', taxonomy: 'ifrs-full', label: 'Total liabilities', dataType: 'monetary', periodType: 'instant', balance: 'credit' },
  'CurrentLiabilities': { element: 'ifrs-full:CurrentLiabilities', taxonomy: 'ifrs-full', label: 'Current liabilities', dataType: 'monetary', periodType: 'instant', balance: 'credit' },
  'NoncurrentLiabilities': { element: 'ifrs-full:NoncurrentLiabilities', taxonomy: 'ifrs-full', label: 'Non-current liabilities', dataType: 'monetary', periodType: 'instant', balance: 'credit' },
  'IncomeTaxExpense': { element: 'ifrs-full:IncomeTaxExpenseContinuingOperations', taxonomy: 'ifrs-full', label: 'Income tax expense', dataType: 'monetary', periodType: 'duration', balance: 'debit' },
  'DeferredTaxAssets': { element: 'ifrs-full:DeferredTaxAssets', taxonomy: 'ifrs-full', label: 'Deferred tax assets', dataType: 'monetary', periodType: 'instant', balance: 'debit' },
  'DeferredTaxLiabilities': { element: 'ifrs-full:DeferredTaxLiabilities', taxonomy: 'ifrs-full', label: 'Deferred tax liabilities', dataType: 'monetary', periodType: 'instant', balance: 'credit' },
  'Provisions': { element: 'ifrs-full:Provisions', taxonomy: 'ifrs-full', label: 'Provisions', dataType: 'monetary', periodType: 'instant', balance: 'credit' },
  'LeaseLiabilities': { element: 'ifrs-full:LeaseLiabilities', taxonomy: 'ifrs-full', label: 'Lease liabilities', dataType: 'monetary', periodType: 'instant', balance: 'credit' },
  'ContractAssets': { element: 'ifrs-full:ContractAssets', taxonomy: 'ifrs-full', label: 'Contract assets', dataType: 'monetary', periodType: 'instant', balance: 'debit' },
  'ContractLiabilities': { element: 'ifrs-full:ContractLiabilities', taxonomy: 'ifrs-full', label: 'Contract liabilities', dataType: 'monetary', periodType: 'instant', balance: 'credit' },
  'BasicEarningsPerShare': { element: 'ifrs-full:BasicEarningsLossPerShare', taxonomy: 'ifrs-full', label: 'Basic earnings per share', dataType: 'perShare', periodType: 'duration' },
  'DilutedEarningsPerShare': { element: 'ifrs-full:DilutedEarningsLossPerShare', taxonomy: 'ifrs-full', label: 'Diluted earnings per share', dataType: 'perShare', periodType: 'duration' },
};

// Common US-GAAP XBRL elements
const USGAAP_TAGS: Record<string, XBRLTag> = {
  'Revenues': { element: 'us-gaap:Revenues', taxonomy: 'us-gaap', label: 'Revenues', dataType: 'monetary', periodType: 'duration', balance: 'credit' },
  'CostOfGoodsSold': { element: 'us-gaap:CostOfGoodsAndServicesSold', taxonomy: 'us-gaap', label: 'Cost of goods and services sold', dataType: 'monetary', periodType: 'duration', balance: 'debit' },
  'NetIncomeLoss': { element: 'us-gaap:NetIncomeLoss', taxonomy: 'us-gaap', label: 'Net income (loss)', dataType: 'monetary', periodType: 'duration', balance: 'credit' },
  'Assets': { element: 'us-gaap:Assets', taxonomy: 'us-gaap', label: 'Total assets', dataType: 'monetary', periodType: 'instant', balance: 'debit' },
  'StockholdersEquity': { element: 'us-gaap:StockholdersEquity', taxonomy: 'us-gaap', label: "Stockholders' equity", dataType: 'monetary', periodType: 'instant', balance: 'credit' },
  'Liabilities': { element: 'us-gaap:Liabilities', taxonomy: 'us-gaap', label: 'Total liabilities', dataType: 'monetary', periodType: 'instant', balance: 'credit' },
  'PropertyPlantAndEquipmentNet': { element: 'us-gaap:PropertyPlantAndEquipmentNet', taxonomy: 'us-gaap', label: 'Property, plant and equipment, net', dataType: 'monetary', periodType: 'instant', balance: 'debit' },
  'InventoryNet': { element: 'us-gaap:InventoryNet', taxonomy: 'us-gaap', label: 'Inventory, net', dataType: 'monetary', periodType: 'instant', balance: 'debit' },
  'IncomeTaxExpenseBenefit': { element: 'us-gaap:IncomeTaxExpenseBenefit', taxonomy: 'us-gaap', label: 'Income tax expense (benefit)', dataType: 'monetary', periodType: 'duration', balance: 'debit' },
  'EarningsPerShareBasic': { element: 'us-gaap:EarningsPerShareBasic', taxonomy: 'us-gaap', label: 'Earnings per share, basic', dataType: 'perShare', periodType: 'duration' },
  'EarningsPerShareDiluted': { element: 'us-gaap:EarningsPerShareDiluted', taxonomy: 'us-gaap', label: 'Earnings per share, diluted', dataType: 'perShare', periodType: 'duration' },
};

// ============================================================
// XBRL Tag Management
// ============================================================

/**
 * Get available XBRL tags for a taxonomy.
 */
export function getAvailableTags(taxonomy: XBRLTaxonomy): XBRLTag[] {
  const tags = taxonomy === 'ifrs-full' ? IFRS_TAGS : taxonomy === 'us-gaap' ? USGAAP_TAGS : {};
  return Object.values(tags);
}

/**
 * Look up an XBRL tag by name from the taxonomy catalog.
 */
export function lookupTag(tagName: string, taxonomy: XBRLTaxonomy): XBRLTag | null {
  const tags = taxonomy === 'ifrs-full' ? IFRS_TAGS : taxonomy === 'us-gaap' ? USGAAP_TAGS : {};
  return tags[tagName] ?? null;
}

/**
 * Tag a statutory mapping with an XBRL element.
 */
export async function tagMapping(
  mappingId: string,
  xbrlElement: string,
  xbrlTaxonomy: XBRLTaxonomy,
): Promise<boolean> {
  const result = await query(
    `UPDATE statutory_mappings
     SET xbrl_element = $2, xbrl_taxonomy = $3
     WHERE id = $1::uuid`,
    [mappingId, xbrlElement, xbrlTaxonomy],
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Bulk-tag statutory mappings for a jurisdiction using auto-mapping rules.
 */
export async function bulkAutoTag(jurisdiction: string): Promise<{
  tagged: number;
  skipped: number;
  mappings: { id: string; code: string; element: string }[];
}> {
  // Get all untagged mappings
  const result = await query<{
    id: string;
    statutory_account_code: string;
    statutory_account_label: string;
    economic_category: string;
    node_ref_type: string;
  }>(
    `SELECT id, statutory_account_code, statutory_account_label,
            economic_category, node_ref_type
     FROM statutory_mappings
     WHERE jurisdiction = $1
       AND (xbrl_element IS NULL OR xbrl_element = '')
     ORDER BY statutory_account_code`,
    [jurisdiction],
  );

  const taxonomy: XBRLTaxonomy = jurisdiction.startsWith('US') ? 'us-gaap' : 'ifrs-full';
  const tags = taxonomy === 'ifrs-full' ? IFRS_TAGS : USGAAP_TAGS;

  let tagged = 0;
  let skipped = 0;
  const mappings: { id: string; code: string; element: string }[] = [];

  for (const row of result.rows) {
    const match = autoMatchTag(row, tags);
    if (match) {
      await tagMapping(row.id, match.element, taxonomy);
      mappings.push({ id: row.id, code: row.statutory_account_code, element: match.element });
      tagged++;
    } else {
      skipped++;
    }
  }

  return { tagged, skipped, mappings };
}

function autoMatchTag(
  mapping: { economic_category: string; node_ref_type: string; statutory_account_label: string },
  tags: Record<string, XBRLTag>,
): XBRLTag | null {
  const label = mapping.statutory_account_label.toLowerCase();
  const category = mapping.economic_category;
  const nodeType = mapping.node_ref_type;

  // Match by node_ref_type first
  if (nodeType === 'FIXED_ASSET') return tags['PropertyPlantAndEquipment'] ?? tags['PropertyPlantAndEquipmentNet'] ?? null;
  if (nodeType === 'RIGHT_OF_USE_ASSET') return tags['RightOfUseAssets'] ?? null;
  if (nodeType === 'GOODWILL') return tags['Goodwill'] ?? null;
  if (nodeType === 'PROVISION') return tags['Provisions'] ?? null;
  if (nodeType === 'LEASE_LIABILITY') return tags['LeaseLiabilities'] ?? null;
  if (nodeType === 'INVENTORY_ITEM') return tags['Inventories'] ?? tags['InventoryNet'] ?? null;
  if (nodeType === 'REVENUE_CONTRACT' && category === 'ASSET') return tags['ContractAssets'] ?? null;
  if (nodeType === 'REVENUE_CONTRACT' && category === 'LIABILITY') return tags['ContractLiabilities'] ?? null;

  // Match by label keywords
  if (label.includes('revenue') && category === 'REVENUE') return tags['Revenue'] ?? tags['Revenues'] ?? null;
  if (label.includes('cost of') && category === 'EXPENSE') return tags['CostOfSales'] ?? tags['CostOfGoodsSold'] ?? null;
  if (label.includes('tax') && category === 'EXPENSE') return tags['IncomeTaxExpense'] ?? tags['IncomeTaxExpenseBenefit'] ?? null;

  // Match by economic category
  if (category === 'ASSET') return tags['Assets'] ?? null;
  if (category === 'LIABILITY') return tags['Liabilities'] ?? null;
  if (category === 'EQUITY') return tags['Equity'] ?? tags['StockholdersEquity'] ?? null;

  return null;
}

// ============================================================
// XBRL Validation
// ============================================================

export interface XBRLValidationResult {
  jurisdiction: string;
  totalMappings: number;
  taggedMappings: number;
  untaggedMappings: number;
  coveragePct: number;
  untaggedCodes: string[];
  invalidTags: { id: string; code: string; element: string; reason: string }[];
}

/**
 * Validate XBRL tagging completeness and correctness for a jurisdiction.
 */
export async function validateXBRLTagging(jurisdiction: string): Promise<XBRLValidationResult> {
  const allResult = await query<{
    id: string;
    statutory_account_code: string;
    xbrl_element: string | null;
    xbrl_taxonomy: string | null;
    economic_category: string;
  }>(
    `SELECT id, statutory_account_code, xbrl_element, xbrl_taxonomy, economic_category
     FROM statutory_mappings
     WHERE jurisdiction = $1
     ORDER BY statutory_account_code`,
    [jurisdiction],
  );

  const totalMappings = allResult.rows.length;
  const tagged = allResult.rows.filter(r => r.xbrl_element);
  const untagged = allResult.rows.filter(r => !r.xbrl_element);

  const invalidTags: { id: string; code: string; element: string; reason: string }[] = [];

  // Validate tagged elements
  for (const row of tagged) {
    const taxonomy = row.xbrl_taxonomy as XBRLTaxonomy;
    const tags = taxonomy === 'ifrs-full' ? IFRS_TAGS : taxonomy === 'us-gaap' ? USGAAP_TAGS : {};
    const tag = Object.values(tags).find(t => t.element === row.xbrl_element);

    if (!tag) {
      invalidTags.push({
        id: row.id,
        code: row.statutory_account_code,
        element: row.xbrl_element!,
        reason: 'Element not found in taxonomy catalog',
      });
    } else if (tag.balance) {
      // Check balance direction matches
      const expectedBalance = row.economic_category === 'ASSET' || row.economic_category === 'EXPENSE' ? 'debit' : 'credit';
      if (tag.balance !== expectedBalance) {
        invalidTags.push({
          id: row.id,
          code: row.statutory_account_code,
          element: row.xbrl_element!,
          reason: `Balance mismatch: element is ${tag.balance}, mapping is ${row.economic_category} (expected ${expectedBalance})`,
        });
      }
    }
  }

  return {
    jurisdiction,
    totalMappings,
    taggedMappings: tagged.length,
    untaggedMappings: untagged.length,
    coveragePct: totalMappings > 0 ? Math.round((tagged.length / totalMappings) * 10000) / 100 : 0,
    untaggedCodes: untagged.map(r => r.statutory_account_code),
    invalidTags,
  };
}

// ============================================================
// XBRL Document Generation
// ============================================================

export interface XBRLFact {
  element: string;
  taxonomy: string;
  value: number | string;
  unit: string;
  periodType: string;
  context: string;
  decimals?: number;
}

/**
 * Generate XBRL facts from GL period balances for a jurisdiction/period.
 */
export async function generateXBRLFacts(
  jurisdiction: string,
  entityId: string,
  periodId: string,
  currency: string,
): Promise<{
  entityId: string;
  periodId: string;
  taxonomy: string;
  facts: XBRLFact[];
  factCount: number;
}> {
  // Get tagged mappings with balances
  const result = await query<{
    xbrl_element: string;
    xbrl_taxonomy: string;
    economic_category: string;
    statutory_account_code: string;
    debit_total: string;
    credit_total: string;
  }>(
    `SELECT sm.xbrl_element, sm.xbrl_taxonomy,
            sm.economic_category, sm.statutory_account_code,
            COALESCE(gb.debit_total, 0) AS debit_total,
            COALESCE(gb.credit_total, 0) AS credit_total
     FROM statutory_mappings sm
     LEFT JOIN gl_period_balances gb
       ON gb.entity_id = $2::uuid
       AND gb.period_id = $3::uuid
       AND gb.node_ref_type = sm.node_ref_type
       AND gb.economic_category = sm.economic_category
     WHERE sm.jurisdiction = $1
       AND sm.xbrl_element IS NOT NULL
       AND sm.xbrl_element != ''
     ORDER BY sm.statutory_account_code`,
    [jurisdiction, entityId, periodId],
  );

  const taxonomy: XBRLTaxonomy = jurisdiction.startsWith('US') ? 'us-gaap' : 'ifrs-full';
  const facts: XBRLFact[] = [];

  for (const row of result.rows) {
    const debit = Number(row.debit_total);
    const credit = Number(row.credit_total);
    const value = debit - credit; // Net debit balance

    if (Math.abs(value) < 0.01) continue;

    const tagInfo = Object.values(taxonomy === 'ifrs-full' ? IFRS_TAGS : USGAAP_TAGS)
      .find(t => t.element === row.xbrl_element);

    facts.push({
      element: row.xbrl_element,
      taxonomy: row.xbrl_taxonomy,
      value,
      unit: currency,
      periodType: tagInfo?.periodType ?? 'duration',
      context: `${entityId}_${periodId}`,
      decimals: -3,
    });
  }

  return {
    entityId,
    periodId,
    taxonomy,
    facts,
    factCount: facts.length,
  };
}

/**
 * Generate iXBRL-ready tagged values for inline rendering.
 */
export async function generateIXBRL(
  jurisdiction: string,
  entityId: string,
  periodId: string,
  currency: string,
): Promise<{
  entityId: string;
  periodId: string;
  taxonomy: string;
  taggedValues: { element: string; label: string; value: number; formattedValue: string; tag: string }[];
}> {
  const { facts, taxonomy } = await generateXBRLFacts(jurisdiction, entityId, periodId, currency);
  const tags = taxonomy === 'ifrs-full' ? IFRS_TAGS : USGAAP_TAGS;

  const taggedValues = facts.map(fact => {
    const tagInfo = Object.values(tags).find(t => t.element === fact.element);
    const value = typeof fact.value === 'number' ? fact.value : parseFloat(fact.value as string);
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Math.abs(value));

    return {
      element: fact.element,
      label: tagInfo?.label ?? fact.element,
      value,
      formattedValue: formatted,
      tag: `<ix:nonFraction name="${fact.element}" contextRef="${fact.context}" unitRef="${currency}" decimals="${fact.decimals}">${formatted}</ix:nonFraction>`,
    };
  });

  return { entityId, periodId, taxonomy, taggedValues };
}
