import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import { emit } from '../../lib/kafka.js';
import {
  computeCurrentTax,
  getApplicableTaxRate,
} from './tax-engine-service.js';

// ============================================================
// Tax Module Interface
// ============================================================

export interface TaxModuleResult {
  moduleId: string;
  moduleName: string;
  jurisdiction: string;
  entityId: string;
  periodId: string;
  taxableIncome: number;
  taxRate: number;
  taxAmount: number;
  adjustments: TaxAdjustment[];
  filingReference?: string;
}

export interface TaxAdjustment {
  description: string;
  amount: number;
  adjustmentType: 'DEDUCTION' | 'ADDITION' | 'CREDIT' | 'EXEMPTION';
}

// ============================================================
// CRA Corporate (T2)
// ============================================================

export interface CRACorpInput {
  entityId: string;
  periodId: string;
  activeBusinessIncome?: number;
  smallBusinessLimit?: number;
  gripBalance?: number;
  lripBalance?: number;
}

/**
 * CRA Corporate tax module (T2 filing).
 * Applies small business deduction for qualifying CCPCs.
 * Tracks GRIP (General Rate Income Pool) / LRIP (Low Rate Income Pool).
 */
export async function computeCRACorporate(
  input: CRACorpInput,
): Promise<TaxModuleResult> {
  const rate = await getApplicableTaxRate(input.entityId);
  const currentTax = await computeCurrentTax({
    entityId: input.entityId,
    periodId: input.periodId,
    taxRate: rate.federalRate,
  });

  const adjustments: TaxAdjustment[] = [];

  // Small business deduction: 19% rate reduction on first $500K of active business income
  const sbd_limit = input.smallBusinessLimit ?? 500000;
  const activeIncome = input.activeBusinessIncome ?? currentTax.taxableIncome;
  const qualifyingIncome = Math.min(activeIncome, sbd_limit);

  if (qualifyingIncome > 0) {
    // SBD reduces federal rate from 15% to ~9% on qualifying income
    const sbdReduction = qualifyingIncome * 0.06; // 15% - 9% = 6% reduction
    adjustments.push({
      description: 'Small business deduction (§125)',
      amount: -sbdReduction,
      adjustmentType: 'DEDUCTION',
    });
  }

  // GRIP tracking (General Rate Income Pool)
  const gripAddition = Math.max(0, currentTax.taxableIncome - qualifyingIncome);
  if (gripAddition > 0 && input.gripBalance !== undefined) {
    adjustments.push({
      description: `GRIP addition: $${gripAddition.toFixed(2)}`,
      amount: 0, // informational
      adjustmentType: 'ADDITION',
    });
  }

  const totalAdjustment = adjustments.reduce((s, a) => s + a.amount, 0);
  const taxAmount = Math.round((currentTax.currentTaxExpense + totalAdjustment) * 100) / 100;

  const id = uuid();
  await runCypher(
    `CREATE (tm:TaxModuleResult {
       id: $id,
       module_name: 'CRA_CORPORATE',
       jurisdiction: 'CA',
       entity_id: $entityId,
       period_id: $periodId,
       taxable_income: $taxableIncome,
       tax_rate: $taxRate,
       tax_amount: $taxAmount,
       filing_reference: 'T2',
       adjustments: $adjustmentsJson,
       created_at: datetime()
     })`,
    {
      id,
      entityId: input.entityId,
      periodId: input.periodId,
      taxableIncome: currentTax.taxableIncome,
      taxRate: rate.federalRate,
      taxAmount,
      adjustmentsJson: JSON.stringify(adjustments),
    },
  );

  return {
    moduleId: id,
    moduleName: 'CRA_CORPORATE',
    jurisdiction: 'CA',
    entityId: input.entityId,
    periodId: input.periodId,
    taxableIncome: currentTax.taxableIncome,
    taxRate: rate.federalRate,
    taxAmount,
    adjustments,
    filingReference: 'T2',
  };
}

// ============================================================
// GST/HST Module
// ============================================================

export interface GSTHSTInput {
  entityId: string;
  periodId: string;
  gstRate?: number; // default 5%
  hstRate?: number; // varies by province (13% ON, 15% NS/NB/NL/PE)
  salesAmount: number;
  purchasesAmount: number;
  isNFP?: boolean;
}

/**
 * GST/HST module.
 * For-profit: full ITC (input tax credits).
 * Not-for-profit: 50% rebate on net GST paid.
 */
export async function computeGSTHST(
  input: GSTHSTInput,
): Promise<TaxModuleResult> {
  const rate = input.hstRate ?? input.gstRate ?? 0.05;
  const gstCollected = input.salesAmount * rate;
  const itcEligible = input.purchasesAmount * rate;
  const adjustments: TaxAdjustment[] = [];

  let netGST: number;

  if (input.isNFP) {
    // NFP: 50% public service bodies rebate
    const rebate = (gstCollected - itcEligible) * 0.50;
    netGST = gstCollected - itcEligible - Math.max(0, rebate);
    adjustments.push({
      description: 'GST collected on sales',
      amount: gstCollected,
      adjustmentType: 'ADDITION',
    });
    adjustments.push({
      description: 'Input tax credits',
      amount: -itcEligible,
      adjustmentType: 'CREDIT',
    });
    if (rebate > 0) {
      adjustments.push({
        description: 'Public service bodies rebate (50%)',
        amount: -rebate,
        adjustmentType: 'CREDIT',
      });
    }
  } else {
    // For-profit: full ITC offset
    netGST = gstCollected - itcEligible;
    adjustments.push({
      description: 'GST/HST collected on sales',
      amount: gstCollected,
      adjustmentType: 'ADDITION',
    });
    adjustments.push({
      description: 'Input tax credits (ITCs)',
      amount: -itcEligible,
      adjustmentType: 'CREDIT',
    });
  }

  netGST = Math.round(netGST * 100) / 100;

  const id = uuid();
  await runCypher(
    `CREATE (tm:TaxModuleResult {
       id: $id,
       module_name: 'GST_HST',
       jurisdiction: 'CA',
       entity_id: $entityId,
       period_id: $periodId,
       taxable_income: $salesAmount,
       tax_rate: $rate,
       tax_amount: $taxAmount,
       filing_reference: 'GST34',
       adjustments: $adjustmentsJson,
       created_at: datetime()
     })`,
    {
      id,
      entityId: input.entityId,
      periodId: input.periodId,
      salesAmount: input.salesAmount,
      rate,
      taxAmount: netGST,
      adjustmentsJson: JSON.stringify(adjustments),
    },
  );

  return {
    moduleId: id,
    moduleName: 'GST_HST',
    jurisdiction: 'CA',
    entityId: input.entityId,
    periodId: input.periodId,
    taxableIncome: input.salesAmount,
    taxRate: rate,
    taxAmount: netGST,
    adjustments,
    filingReference: 'GST34',
  };
}

// ============================================================
// IRS Corporate (Form 1120)
// ============================================================

export interface IRSCorpInput {
  entityId: string;
  periodId: string;
  section179Deduction?: number;
}

/**
 * IRS Corporate tax module (Form 1120).
 * Federal rate: 21%. Supports §179 expensing deduction.
 */
export async function computeIRSCorporate(
  input: IRSCorpInput,
): Promise<TaxModuleResult> {
  const rate = await getApplicableTaxRate(input.entityId);
  const currentTax = await computeCurrentTax({
    entityId: input.entityId,
    periodId: input.periodId,
    taxRate: rate.federalRate,
  });

  const adjustments: TaxAdjustment[] = [];

  // §179 expensing deduction
  if (input.section179Deduction && input.section179Deduction > 0) {
    const maxDeduction = 1160000; // 2024 limit
    const deduction = Math.min(input.section179Deduction, maxDeduction, currentTax.taxableIncome);
    adjustments.push({
      description: `§179 immediate expensing deduction`,
      amount: -(deduction * rate.federalRate),
      adjustmentType: 'DEDUCTION',
    });
  }

  const totalAdjustment = adjustments.reduce((s, a) => s + a.amount, 0);
  const taxAmount = Math.round((currentTax.currentTaxExpense + totalAdjustment) * 100) / 100;

  const id = uuid();
  await runCypher(
    `CREATE (tm:TaxModuleResult {
       id: $id,
       module_name: 'IRS_CORPORATE',
       jurisdiction: 'US',
       entity_id: $entityId,
       period_id: $periodId,
       taxable_income: $taxableIncome,
       tax_rate: $taxRate,
       tax_amount: $taxAmount,
       filing_reference: 'Form 1120',
       adjustments: $adjustmentsJson,
       created_at: datetime()
     })`,
    {
      id,
      entityId: input.entityId,
      periodId: input.periodId,
      taxableIncome: currentTax.taxableIncome,
      taxRate: rate.federalRate,
      taxAmount,
      adjustmentsJson: JSON.stringify(adjustments),
    },
  );

  return {
    moduleId: id,
    moduleName: 'IRS_CORPORATE',
    jurisdiction: 'US',
    entityId: input.entityId,
    periodId: input.periodId,
    taxableIncome: currentTax.taxableIncome,
    taxRate: rate.federalRate,
    taxAmount,
    adjustments,
    filingReference: 'Form 1120',
  };
}

// ============================================================
// CRA Charity (T3010)
// ============================================================

export interface CRACharityInput {
  entityId: string;
  periodId: string;
  totalRevenue: number;
  charitableExpenditures: number;
  managementExpenses: number;
}

/**
 * CRA Charity module (T3010 filing).
 * Registered charities: no income tax, but must meet disbursement quota.
 * Disbursement quota: 3.5% of property not used in charitable activities.
 */
export async function computeCRACharity(
  input: CRACharityInput,
): Promise<TaxModuleResult> {
  const adjustments: TaxAdjustment[] = [];

  // Charities are tax-exempt, so no tax computation
  adjustments.push({
    description: 'Registered charity tax exemption',
    amount: 0,
    adjustmentType: 'EXEMPTION',
  });

  // Disbursement quota check (3.5% of investment assets)
  const disbursementRatio = input.totalRevenue > 0
    ? input.charitableExpenditures / input.totalRevenue
    : 0;
  const meetsQuota = disbursementRatio >= 0.035;

  adjustments.push({
    description: `Disbursement ratio: ${(disbursementRatio * 100).toFixed(1)}% (min 3.5%)`,
    amount: 0,
    adjustmentType: meetsQuota ? 'EXEMPTION' : 'ADDITION',
  });

  const id = uuid();
  await runCypher(
    `CREATE (tm:TaxModuleResult {
       id: $id,
       module_name: 'CRA_CHARITY',
       jurisdiction: 'CA',
       entity_id: $entityId,
       period_id: $periodId,
       taxable_income: 0,
       tax_rate: 0,
       tax_amount: 0,
       filing_reference: 'T3010',
       disbursement_ratio: $disbursementRatio,
       meets_quota: $meetsQuota,
       adjustments: $adjustmentsJson,
       created_at: datetime()
     })`,
    {
      id,
      entityId: input.entityId,
      periodId: input.periodId,
      disbursementRatio,
      meetsQuota,
      adjustmentsJson: JSON.stringify(adjustments),
    },
  );

  return {
    moduleId: id,
    moduleName: 'CRA_CHARITY',
    jurisdiction: 'CA',
    entityId: input.entityId,
    periodId: input.periodId,
    taxableIncome: 0,
    taxRate: 0,
    taxAmount: 0,
    adjustments,
    filingReference: 'T3010',
  };
}

// ============================================================
// IRS Exempt (Form 990)
// ============================================================

export interface IRSExemptInput {
  entityId: string;
  periodId: string;
  totalRevenue: number;
  publicSupportRevenue: number;
  unrelatedBusinessIncome?: number;
}

/**
 * IRS Exempt module (Form 990).
 * 501(c)(3) organizations: exempt from income tax.
 * UBIT: unrelated business income taxed at 21%.
 * Public support test: ≥33% revenue from public sources.
 */
export async function computeIRSExempt(
  input: IRSExemptInput,
): Promise<TaxModuleResult> {
  const adjustments: TaxAdjustment[] = [];

  // UBIT computation
  const ubit = input.unrelatedBusinessIncome ?? 0;
  let taxAmount = 0;

  if (ubit > 1000) { // $1,000 specific deduction
    const taxableUBIT = ubit - 1000;
    taxAmount = Math.round(taxableUBIT * 0.21 * 100) / 100;
    adjustments.push({
      description: `UBIT: $${ubit.toFixed(2)} (less $1,000 deduction)`,
      amount: taxAmount,
      adjustmentType: 'ADDITION',
    });
  }

  // Public support test
  const publicSupportPct = input.totalRevenue > 0
    ? input.publicSupportRevenue / input.totalRevenue
    : 0;
  const passesPublicSupport = publicSupportPct >= 0.33;

  adjustments.push({
    description: `Public support: ${(publicSupportPct * 100).toFixed(1)}% (min 33%)`,
    amount: 0,
    adjustmentType: passesPublicSupport ? 'EXEMPTION' : 'ADDITION',
  });

  adjustments.push({
    description: 'Tax-exempt organization (§501(c)(3))',
    amount: 0,
    adjustmentType: 'EXEMPTION',
  });

  const id = uuid();
  await runCypher(
    `CREATE (tm:TaxModuleResult {
       id: $id,
       module_name: 'IRS_EXEMPT',
       jurisdiction: 'US',
       entity_id: $entityId,
       period_id: $periodId,
       taxable_income: $ubit,
       tax_rate: 0.21,
       tax_amount: $taxAmount,
       filing_reference: 'Form 990',
       public_support_pct: $publicSupportPct,
       passes_public_support: $passesPublicSupport,
       adjustments: $adjustmentsJson,
       created_at: datetime()
     })`,
    {
      id,
      entityId: input.entityId,
      periodId: input.periodId,
      ubit,
      taxAmount,
      publicSupportPct,
      passesPublicSupport,
      adjustmentsJson: JSON.stringify(adjustments),
    },
  );

  return {
    moduleId: id,
    moduleName: 'IRS_EXEMPT',
    jurisdiction: 'US',
    entityId: input.entityId,
    periodId: input.periodId,
    taxableIncome: ubit,
    taxRate: 0.21,
    taxAmount,
    adjustments,
    filingReference: 'Form 990',
  };
}

// ============================================================
// State/Provincial Tax
// ============================================================

export interface StateTaxInput {
  entityId: string;
  periodId: string;
  stateCode: string;
  stateRate: number;
  nexusEstablished: boolean;
  apportionmentFactor?: number; // 0-1, defaults to 1.0
}

/**
 * State/provincial tax module.
 * Applies if nexus is established in the jurisdiction.
 * Supports apportionment for multi-state operations.
 */
export async function computeStateTax(
  input: StateTaxInput,
): Promise<TaxModuleResult> {
  const adjustments: TaxAdjustment[] = [];

  if (!input.nexusEstablished) {
    adjustments.push({
      description: `No nexus in ${input.stateCode} — no tax obligation`,
      amount: 0,
      adjustmentType: 'EXEMPTION',
    });

    const id = uuid();
    await runCypher(
      `CREATE (tm:TaxModuleResult {
         id: $id,
         module_name: 'STATE_TAX',
         jurisdiction: $stateCode,
         entity_id: $entityId,
         period_id: $periodId,
         taxable_income: 0,
         tax_rate: $stateRate,
         tax_amount: 0,
         nexus_established: false,
         adjustments: $adjustmentsJson,
         created_at: datetime()
       })`,
      {
        id,
        entityId: input.entityId,
        periodId: input.periodId,
        stateCode: input.stateCode,
        stateRate: input.stateRate,
        adjustmentsJson: JSON.stringify(adjustments),
      },
    );

    return {
      moduleId: id,
      moduleName: 'STATE_TAX',
      jurisdiction: input.stateCode,
      entityId: input.entityId,
      periodId: input.periodId,
      taxableIncome: 0,
      taxRate: input.stateRate,
      taxAmount: 0,
      adjustments,
    };
  }

  const federalRate = await getApplicableTaxRate(input.entityId);
  const currentTax = await computeCurrentTax({
    entityId: input.entityId,
    periodId: input.periodId,
    taxRate: federalRate.federalRate,
  });

  const apportionmentFactor = input.apportionmentFactor ?? 1.0;
  const apportionedIncome = currentTax.taxableIncome * apportionmentFactor;
  const taxAmount = Math.round(apportionedIncome * input.stateRate * 100) / 100;

  if (apportionmentFactor < 1.0) {
    adjustments.push({
      description: `Apportionment factor: ${(apportionmentFactor * 100).toFixed(1)}%`,
      amount: 0,
      adjustmentType: 'DEDUCTION',
    });
  }

  const id = uuid();
  await runCypher(
    `CREATE (tm:TaxModuleResult {
       id: $id,
       module_name: 'STATE_TAX',
       jurisdiction: $stateCode,
       entity_id: $entityId,
       period_id: $periodId,
       taxable_income: $apportionedIncome,
       tax_rate: $stateRate,
       tax_amount: $taxAmount,
       nexus_established: true,
       apportionment_factor: $apportionmentFactor,
       adjustments: $adjustmentsJson,
       created_at: datetime()
     })`,
    {
      id,
      entityId: input.entityId,
      periodId: input.periodId,
      stateCode: input.stateCode,
      apportionedIncome,
      stateRate: input.stateRate,
      taxAmount,
      apportionmentFactor,
      adjustmentsJson: JSON.stringify(adjustments),
    },
  );

  return {
    moduleId: id,
    moduleName: 'STATE_TAX',
    jurisdiction: input.stateCode,
    entityId: input.entityId,
    periodId: input.periodId,
    taxableIncome: apportionedIncome,
    taxRate: input.stateRate,
    taxAmount,
    adjustments,
  };
}

// ============================================================
// Cross-border Withholding Tax
// ============================================================

export interface WithholdingTaxInput {
  entityId: string;
  periodId: string;
  sourceEntityId: string;
  targetEntityId: string;
  paymentType: 'DIVIDEND' | 'INTEREST' | 'ROYALTY' | 'MANAGEMENT_FEE';
  grossAmount: number;
  treatyRate?: number; // Override treaty rate
}

/**
 * Cross-border withholding tax module (Canada-US Tax Treaty).
 * Default treaty rates:
 *   Dividends: 5% (significant ownership) or 15% (portfolio)
 *   Interest: 0% (arm's length) or 10%
 *   Royalties: 0% or 10%
 *   Management fees: 0% under treaty
 */
export async function computeWithholdingTax(
  input: WithholdingTaxInput,
): Promise<TaxModuleResult> {
  // Determine treaty rate
  let defaultRate: number;
  switch (input.paymentType) {
    case 'DIVIDEND': defaultRate = 0.05; break;
    case 'INTEREST': defaultRate = 0; break;
    case 'ROYALTY': defaultRate = 0.10; break;
    case 'MANAGEMENT_FEE': defaultRate = 0; break;
  }

  const withholdingRate = input.treatyRate ?? defaultRate;
  const taxAmount = Math.round(input.grossAmount * withholdingRate * 100) / 100;

  const adjustments: TaxAdjustment[] = [];
  adjustments.push({
    description: `${input.paymentType} withholding at treaty rate ${(withholdingRate * 100).toFixed(1)}%`,
    amount: taxAmount,
    adjustmentType: 'ADDITION',
  });

  if (withholdingRate < 0.25) {
    adjustments.push({
      description: 'Canada-US Tax Treaty rate reduction applied',
      amount: 0,
      adjustmentType: 'DEDUCTION',
    });
  }

  const id = uuid();
  await runCypher(
    `CREATE (tm:TaxModuleResult {
       id: $id,
       module_name: 'WITHHOLDING_TAX',
       jurisdiction: 'CROSS_BORDER',
       entity_id: $entityId,
       period_id: $periodId,
       taxable_income: $grossAmount,
       tax_rate: $withholdingRate,
       tax_amount: $taxAmount,
       payment_type: $paymentType,
       source_entity_id: $sourceEntityId,
       target_entity_id: $targetEntityId,
       adjustments: $adjustmentsJson,
       created_at: datetime()
     })`,
    {
      id,
      entityId: input.entityId,
      periodId: input.periodId,
      grossAmount: input.grossAmount,
      withholdingRate,
      taxAmount,
      paymentType: input.paymentType,
      sourceEntityId: input.sourceEntityId,
      targetEntityId: input.targetEntityId,
      adjustmentsJson: JSON.stringify(adjustments),
    },
  );

  return {
    moduleId: id,
    moduleName: 'WITHHOLDING_TAX',
    jurisdiction: 'CROSS_BORDER',
    entityId: input.entityId,
    periodId: input.periodId,
    taxableIncome: input.grossAmount,
    taxRate: withholdingRate,
    taxAmount,
    adjustments,
  };
}

// ============================================================
// Module Result Queries
// ============================================================

/**
 * Get all tax module results for an entity/period.
 */
export async function getTaxModuleResults(
  entityId: string,
  periodId?: string,
): Promise<Array<Record<string, unknown>>> {
  const cypher = periodId
    ? `MATCH (tm:TaxModuleResult {entity_id: $entityId, period_id: $periodId})
       RETURN properties(tm) AS tm
       ORDER BY tm.module_name`
    : `MATCH (tm:TaxModuleResult {entity_id: $entityId})
       RETURN properties(tm) AS tm
       ORDER BY tm.created_at DESC`;
  const results = await runCypher<Record<string, unknown>>(cypher, { entityId, periodId });
  return results.map((r) => r.tm as Record<string, unknown>);
}

/**
 * Get a specific tax module result by ID.
 */
export async function getTaxModuleResult(
  id: string,
): Promise<Record<string, unknown> | null> {
  const results = await runCypher<Record<string, unknown>>(
    `MATCH (tm:TaxModuleResult {id: $id})
     RETURN properties(tm) AS tm`,
    { id },
  );
  return results.length > 0 ? results[0].tm as Record<string, unknown> : null;
}

/**
 * Compute all applicable tax modules for an entity in one call.
 * Dispatches to the appropriate modules based on entity jurisdiction and type.
 */
export async function computeAllModules(
  entityId: string,
  periodId: string,
): Promise<TaxModuleResult[]> {
  const entityResult = await runCypher<{
    jurisdiction: string;
    entity_type: string;
    tax_status: string;
  }>(
    `MATCH (e:Entity {id: $entityId})
     RETURN e.jurisdiction AS jurisdiction,
            e.entity_type AS entity_type,
            e.tax_status AS tax_status`,
    { entityId },
  );

  if (entityResult.length === 0) {
    throw new Error(`Entity ${entityId} not found`);
  }

  const entity = entityResult[0];
  const results: TaxModuleResult[] = [];

  if (entity.jurisdiction === 'CA') {
    if (entity.entity_type === 'FOR_PROFIT') {
      results.push(await computeCRACorporate({ entityId, periodId }));
    } else if (entity.tax_status === 'EXEMPT') {
      results.push(await computeCRACharity({
        entityId,
        periodId,
        totalRevenue: 0,
        charitableExpenditures: 0,
        managementExpenses: 0,
      }));
    }
  } else if (entity.jurisdiction === 'US') {
    if (entity.entity_type === 'FOR_PROFIT') {
      results.push(await computeIRSCorporate({ entityId, periodId }));
    } else if (entity.tax_status === 'EXEMPT') {
      results.push(await computeIRSExempt({
        entityId,
        periodId,
        totalRevenue: 0,
        publicSupportRevenue: 0,
      }));
    }
  }

  return results;
}
