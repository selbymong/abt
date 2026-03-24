// ============================================================
// 07-v1.2-constraints-indexes.cypher
// Enterprise Business Graph v1.2
// All new nodes from Addenda A (multi-entity), B (tax credits),
// C (asset classes), E (OCI/equity)
// Run AFTER 01-06 base DDL files
// ============================================================

// --- Addendum A: Multi-Entity ---

CREATE CONSTRAINT fund_id_unique IF NOT EXISTS
FOR (f:Fund) REQUIRE f.id IS UNIQUE;

CREATE INDEX fund_entity_idx IF NOT EXISTS
FOR (f:Fund) ON (f.entity_id);

CREATE INDEX fund_type_idx IF NOT EXISTS
FOR (f:Fund) ON (f.fund_type);

// --- Addendum B: Tax Credits ---

CREATE CONSTRAINT tax_credit_program_id_unique IF NOT EXISTS
FOR (p:TaxCreditProgram) REQUIRE p.id IS UNIQUE;

CREATE INDEX tcp_program_code_idx IF NOT EXISTS
FOR (p:TaxCreditProgram) ON (p.program_code);

CREATE INDEX tcp_jurisdiction_idx IF NOT EXISTS
FOR (p:TaxCreditProgram) ON (p.jurisdiction);

CREATE CONSTRAINT tax_credit_claim_id_unique IF NOT EXISTS
FOR (c:TaxCreditClaim) REQUIRE c.id IS UNIQUE;

CREATE INDEX tcc_entity_period_idx IF NOT EXISTS
FOR (c:TaxCreditClaim) ON (c.entity_id, c.period_id);

CREATE INDEX tcc_status_idx IF NOT EXISTS
FOR (c:TaxCreditClaim) ON (c.claim_status);

CREATE CONSTRAINT tax_credit_balance_id_unique IF NOT EXISTS
FOR (b:TaxCreditBalance) REQUIRE b.id IS UNIQUE;

CREATE INDEX tcb_entity_program_idx IF NOT EXISTS
FOR (b:TaxCreditBalance) ON (b.entity_id, b.program_id);

// --- Addendum C: Asset Classes ---

CREATE CONSTRAINT asset_class_id_unique IF NOT EXISTS
FOR (ac:AssetClass) REQUIRE ac.id IS UNIQUE;

CREATE INDEX ac_class_code_idx IF NOT EXISTS
FOR (ac:AssetClass) ON (ac.class_code);

CREATE INDEX ac_system_jurisdiction_idx IF NOT EXISTS
FOR (ac:AssetClass) ON (ac.class_system, ac.jurisdiction);

CREATE CONSTRAINT ucc_pool_id_unique IF NOT EXISTS
FOR (u:UCCPool) REQUIRE u.id IS UNIQUE;

CREATE INDEX ucc_entity_class_year_idx IF NOT EXISTS
FOR (u:UCCPool) ON (u.entity_id, u.asset_class_id, u.fiscal_year);

// --- Addendum E: OCI / Equity ---

CREATE CONSTRAINT retained_earnings_id_unique IF NOT EXISTS
FOR (re:RetainedEarnings) REQUIRE re.id IS UNIQUE;

CREATE INDEX re_entity_period_idx IF NOT EXISTS
FOR (re:RetainedEarnings) ON (re.entity_id, re.period_id);

CREATE CONSTRAINT oci_id_unique IF NOT EXISTS
FOR (oci:OtherComprehensiveIncome) REQUIRE oci.id IS UNIQUE;

CREATE INDEX oci_entity_period_component_idx IF NOT EXISTS
FOR (oci:OtherComprehensiveIncome) ON (oci.entity_id, oci.period_id, oci.component);

CREATE CONSTRAINT equity_section_id_unique IF NOT EXISTS
FOR (es:EquitySection) REQUIRE es.id IS UNIQUE;

CREATE INDEX es_entity_period_idx IF NOT EXISTS
FOR (es:EquitySection) ON (es.entity_id, es.period_id);

// --- Tax Engine (completing v1.0 stubs) ---

CREATE CONSTRAINT tax_provision_id_unique IF NOT EXISTS
FOR (tp:TaxProvision) REQUIRE tp.id IS UNIQUE;

CREATE INDEX tp_entity_period_idx IF NOT EXISTS
FOR (tp:TaxProvision) ON (tp.entity_id, tp.period_id);

CREATE CONSTRAINT deferred_tax_position_id_unique IF NOT EXISTS
FOR (dtp:DeferredTaxPosition) REQUIRE dtp.id IS UNIQUE;

CREATE INDEX dtp_source_node_idx IF NOT EXISTS
FOR (dtp:DeferredTaxPosition) ON (dtp.source_node_id);
