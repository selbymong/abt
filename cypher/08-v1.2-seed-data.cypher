// ============================================================
// 08-v1.2-seed-data.cypher
// Enterprise Business Graph v1.2
// Seed data: AssetClass nodes, initial Entity nodes
// Run AFTER 07-v1.2-constraints-indexes.cypher
// ============================================================

// --- Four Entity Nodes (MERGE to be idempotent) ---

MERGE (e:Entity {label: 'CA ForProfit Corp'})
ON CREATE SET e.id = randomUUID(), e.entity_type = 'FOR_PROFIT', e.tax_status = 'TAXABLE',
  e.reporting_framework = 'ASPE', e.jurisdiction = 'CA',
  e.functional_currency = 'CAD', e.outcome_ontology = 'FINANCIAL',
  e.fund_accounting_enabled = false, e.fiscal_year_end = '12-31',
  e.legal_name = 'CA ForProfit Corp';

MERGE (e:Entity {label: 'CA NotForProfit'})
ON CREATE SET e.id = randomUUID(), e.entity_type = 'NOT_FOR_PROFIT', e.tax_status = 'EXEMPT',
  e.reporting_framework = 'ASNFPO', e.jurisdiction = 'CA',
  e.functional_currency = 'CAD', e.outcome_ontology = 'MISSION',
  e.fund_accounting_enabled = true, e.fiscal_year_end = '12-31',
  e.legal_name = 'CA NotForProfit';

MERGE (e:Entity {label: 'US ForProfit Corp'})
ON CREATE SET e.id = randomUUID(), e.entity_type = 'FOR_PROFIT', e.tax_status = 'TAXABLE',
  e.reporting_framework = 'US_GAAP', e.jurisdiction = 'US',
  e.functional_currency = 'USD', e.outcome_ontology = 'FINANCIAL',
  e.fund_accounting_enabled = false, e.fiscal_year_end = '12-31',
  e.legal_name = 'US ForProfit Corp';

MERGE (e:Entity {label: 'US NotForProfit'})
ON CREATE SET e.id = randomUUID(), e.entity_type = 'NOT_FOR_PROFIT', e.tax_status = 'EXEMPT',
  e.reporting_framework = 'ASC_958', e.jurisdiction = 'US',
  e.functional_currency = 'USD', e.outcome_ontology = 'MISSION',
  e.fund_accounting_enabled = true, e.fiscal_year_end = '12-31',
  e.legal_name = 'US NotForProfit';

// --- CCA Classes (Canada) ---

UNWIND [
  {code:'CA-CCA-1',  label:'CCA Class 1 — Buildings',           rate:0.04, method:'DECLINING_BALANCE', examples:['office buildings','warehouses']},
  {code:'CA-CCA-6',  label:'CCA Class 6 — Frame buildings',     rate:0.10, method:'DECLINING_BALANCE', examples:['wood-frame structures','fences']},
  {code:'CA-CCA-8',  label:'CCA Class 8 — Misc tangible',       rate:0.20, method:'DECLINING_BALANCE', examples:['furniture','equipment','tools >$500','machinery NEC']},
  {code:'CA-CCA-10', label:'CCA Class 10 — Motor vehicles',     rate:0.30, method:'DECLINING_BALANCE', examples:['cars','trucks','vans']},
  {code:'CA-CCA-10.1',label:'CCA Class 10.1 — Luxury vehicles', rate:0.30, method:'DECLINING_BALANCE', examples:['passenger vehicles >$37k']},
  {code:'CA-CCA-12', label:'CCA Class 12 — Small tools',        rate:1.00, method:'DECLINING_BALANCE', examples:['tools <$500','utensils','dies']},
  {code:'CA-CCA-13', label:'CCA Class 13 — Leasehold improvements', rate:null, method:'STRAIGHT_LINE', examples:['leasehold improvements']},
  {code:'CA-CCA-14', label:'CCA Class 14 — Limited-life intangibles', rate:null, method:'STRAIGHT_LINE', examples:['patents','franchises','licences']},
  {code:'CA-CCA-14.1',label:'CCA Class 14.1 — Goodwill/intangibles', rate:0.05, method:'DECLINING_BALANCE', examples:['goodwill','trademarks','customer lists']},
  {code:'CA-CCA-43', label:'CCA Class 43 — M&P machinery',      rate:0.30, method:'DECLINING_BALANCE', examples:['manufacturing equipment']},
  {code:'CA-CCA-43.1',label:'CCA Class 43.1 — M&P accelerated', rate:0.50, method:'DECLINING_BALANCE', examples:['M&P acquired before 2026']},
  {code:'CA-CCA-43.2',label:'CCA Class 43.2 — Clean energy',    rate:0.50, method:'DECLINING_BALANCE', examples:['solar','wind','heat recovery']},
  {code:'CA-CCA-46', label:'CCA Class 46 — Network infrastructure', rate:0.30, method:'DECLINING_BALANCE', examples:['fibre optic','switches','routers']},
  {code:'CA-CCA-50', label:'CCA Class 50 — Computer equipment',  rate:0.55, method:'DECLINING_BALANCE', examples:['laptops','servers','tablets','printers']},
  {code:'CA-CCA-54', label:'CCA Class 54 — Zero-emission vehicles', rate:0.30, method:'DECLINING_BALANCE', examples:['battery EVs','hydrogen FCEVs','PHEVs']}
] AS cls
CREATE (ac:AssetClass {
  id: randomUUID(), class_code: cls.code, label: cls.label,
  class_system: 'CCA', jurisdiction: 'CA',
  depreciation_method: cls.method,
  rate_pct: cls.rate, salvage_value_pct: 0.0,
  first_year_rule: 'HALF_YEAR', pool_method: 'POOLED',
  disposal_rule: 'RECAPTURE_AND_TERMINAL_LOSS',
  eligible_entity_types: ['FOR_PROFIT'],
  asset_examples: cls.examples,
  effective_from: date('2024-01-01')
});

// --- MACRS Classes (United States) ---

UNWIND [
  {code:'US-MACRS-3',    label:'MACRS 3-year property',    life:3.0,  method:'DOUBLE_DECLINING', examples:['jigs','molds','tractors']},
  {code:'US-MACRS-5',    label:'MACRS 5-year property',    life:5.0,  method:'DOUBLE_DECLINING', examples:['computers','cars','trucks','office equipment']},
  {code:'US-MACRS-7',    label:'MACRS 7-year property',    life:7.0,  method:'DOUBLE_DECLINING', examples:['furniture','fixtures','general equipment']},
  {code:'US-MACRS-10',   label:'MACRS 10-year property',   life:10.0, method:'DOUBLE_DECLINING', examples:['boats','barges','agricultural structures']},
  {code:'US-MACRS-15',   label:'MACRS 15-year property',   life:15.0, method:'DECLINING_BALANCE', examples:['parking lots','fences','sidewalks']},
  {code:'US-MACRS-20',   label:'MACRS 20-year property',   life:20.0, method:'DECLINING_BALANCE', examples:['farm buildings','utility property']},
  {code:'US-MACRS-27.5', label:'MACRS 27.5-year residential', life:27.5, method:'STRAIGHT_LINE', examples:['apartment buildings','rental houses']},
  {code:'US-MACRS-39',   label:'MACRS 39-year nonresidential', life:39.0, method:'STRAIGHT_LINE', examples:['office buildings','retail','warehouses']}
] AS cls
CREATE (ac:AssetClass {
  id: randomUUID(), class_code: cls.code, label: cls.label,
  class_system: 'MACRS', jurisdiction: 'US',
  depreciation_method: cls.method,
  useful_life_years: cls.life, salvage_value_pct: 0.0,
  first_year_rule: CASE WHEN cls.life >= 27.5 THEN 'MID_MONTH' ELSE 'HALF_YEAR' END,
  pool_method: 'INDIVIDUAL',
  disposal_rule: 'GAIN_LOSS_ON_DISPOSAL',
  eligible_entity_types: ['FOR_PROFIT'],
  asset_examples: cls.examples,
  effective_from: date('2024-01-01')
});

// --- Accounting Classes (both jurisdictions) ---

UNWIND [
  {code:'ACCT-BUILDING',   label:'Building (accounting)',         life:35.0, method:'STRAIGHT_LINE', salvage:0.10, examples:['office buildings']},
  {code:'ACCT-LEASEHOLD',  label:'Leasehold improvements (acct)', life:null, method:'STRAIGHT_LINE', salvage:0.0,  examples:['leasehold improvements']},
  {code:'ACCT-FURNITURE',  label:'Furniture (accounting)',        life:8.0,  method:'STRAIGHT_LINE', salvage:0.05, examples:['desks','chairs','shelving']},
  {code:'ACCT-IT-EQUIP',   label:'IT equipment (accounting)',     life:4.0,  method:'STRAIGHT_LINE', salvage:0.0,  examples:['laptops','servers','network gear']},
  {code:'ACCT-VEHICLE',    label:'Vehicle (accounting)',          life:6.0,  method:'STRAIGHT_LINE', salvage:0.10, examples:['company vehicles']},
  {code:'ACCT-MACHINERY',  label:'Machinery (accounting)',        life:12.0, method:'STRAIGHT_LINE', salvage:0.05, examples:['production equipment']},
  {code:'ACCT-SOFTWARE',   label:'Software (accounting)',         life:3.0,  method:'STRAIGHT_LINE', salvage:0.0,  examples:['purchased software licences']},
  {code:'ACCT-LAND',       label:'Land (never depreciated)',      life:null, method:'NONE',          salvage:null, examples:['land']}
] AS cls
CREATE (ac:AssetClass {
  id: randomUUID(), class_code: cls.code, label: cls.label,
  class_system: 'ACCOUNTING', jurisdiction: 'ALL',
  depreciation_method: CASE WHEN cls.method = 'NONE' THEN null ELSE cls.method END,
  useful_life_years: cls.life, salvage_value_pct: cls.salvage,
  first_year_rule: 'FULL_YEAR', pool_method: 'INDIVIDUAL',
  disposal_rule: 'GAIN_LOSS_ON_DISPOSAL',
  eligible_entity_types: ['FOR_PROFIT','NOT_FOR_PROFIT'],
  asset_examples: cls.examples,
  effective_from: date('2024-01-01')
});

// --- Core Tax Credit Programs ---

UNWIND [
  {code:'CA-SRED', label:'SR&ED Investment Tax Credit', jur:'CA', auth:'CRA',
   type:'PARTIALLY_REFUNDABLE', rate:0.15, enhanced:0.35, limit:3000000,
   carry_fwd:20, carry_back:3, form:'T661', ref:'ITA §127(9)'},
  {code:'US-IRC41-RD', label:'Research & Development Credit', jur:'US', auth:'IRS',
   type:'NON_REFUNDABLE', rate:0.20, enhanced:null, limit:null,
   carry_fwd:20, carry_back:1, form:'Form 6765', ref:'IRC §41'},
  {code:'CA-GST-REBATE', label:'GST/HST Public Service Bodies Rebate', jur:'CA', auth:'CRA',
   type:'REFUNDABLE', rate:0.50, enhanced:null, limit:null,
   carry_fwd:null, carry_back:null, form:'GST66', ref:'ETA §259'},
  {code:'US-IRA-45', label:'IRA Clean Energy Production Tax Credit', jur:'US', auth:'IRS',
   type:'REFUNDABLE', rate:0.027, enhanced:null, limit:null,
   carry_fwd:null, carry_back:null, form:'Form 8835', ref:'IRC §45'}
] AS prog
CREATE (p:TaxCreditProgram {
  id: randomUUID(), program_code: prog.code, label: prog.label,
  jurisdiction: prog.jur, authority: prog.auth,
  credit_type: prog.type, credit_rate: prog.rate,
  credit_rate_enhanced: prog.enhanced, expenditure_limit: prog.limit,
  carryforward_years: prog.carry_fwd, carryback_years: prog.carry_back,
  filing_form: prog.form, legislation_reference: prog.ref,
  eligible_entity_types: ['FOR_PROFIT','NOT_FOR_PROFIT'],
  effective_from: date('2024-01-01')
});
