// ============================================================
// 03-gl-nodes.cypher
// Enterprise Business Graph — General Ledger nodes
// Phase 0: Constraints and indexes for GL nodes
// ============================================================

// --- JournalEntry ---
CREATE CONSTRAINT je_id_unique IF NOT EXISTS
FOR (j:JournalEntry) REQUIRE j.id IS UNIQUE;

CREATE INDEX je_entity_idx IF NOT EXISTS
FOR (j:JournalEntry) ON (j.entity_id);

CREATE INDEX je_period_idx IF NOT EXISTS
FOR (j:JournalEntry) ON (j.period_id);

CREATE INDEX je_type_idx IF NOT EXISTS
FOR (j:JournalEntry) ON (j.entry_type);

CREATE INDEX je_valid_time_idx IF NOT EXISTS
FOR (j:JournalEntry) ON (j.valid_time_start);

CREATE INDEX je_transaction_time_idx IF NOT EXISTS
FOR (j:JournalEntry) ON (j.transaction_time_start);

CREATE INDEX je_idempotency_idx IF NOT EXISTS
FOR (j:JournalEntry) REQUIRE j.idempotency_key IS UNIQUE;

// --- LedgerLine ---
CREATE CONSTRAINT ll_id_unique IF NOT EXISTS
FOR (l:LedgerLine) REQUIRE l.id IS UNIQUE;

CREATE INDEX ll_journal_entry_idx IF NOT EXISTS
FOR (l:LedgerLine) ON (l.journal_entry_id);

CREATE INDEX ll_node_ref_idx IF NOT EXISTS
FOR (l:LedgerLine) ON (l.node_ref_id);

CREATE INDEX ll_node_ref_type_idx IF NOT EXISTS
FOR (l:LedgerLine) ON (l.node_ref_type);

CREATE INDEX ll_economic_category_idx IF NOT EXISTS
FOR (l:LedgerLine) ON (l.economic_category);

CREATE INDEX ll_fund_idx IF NOT EXISTS
FOR (l:LedgerLine) ON (l.fund_id);

// --- AccountingPeriod ---
CREATE CONSTRAINT ap_id_unique IF NOT EXISTS
FOR (p:AccountingPeriod) REQUIRE p.id IS UNIQUE;

CREATE INDEX ap_entity_idx IF NOT EXISTS
FOR (p:AccountingPeriod) ON (p.entity_id);

CREATE INDEX ap_status_idx IF NOT EXISTS
FOR (p:AccountingPeriod) ON (p.status);

CREATE INDEX ap_dates_idx IF NOT EXISTS
FOR (p:AccountingPeriod) ON (p.start_date, p.end_date);

// --- TemporalClaim ---
CREATE CONSTRAINT tc_id_unique IF NOT EXISTS
FOR (t:TemporalClaim) REQUIRE t.id IS UNIQUE;

CREATE INDEX tc_entity_idx IF NOT EXISTS
FOR (t:TemporalClaim) ON (t.entity_id);

CREATE INDEX tc_type_idx IF NOT EXISTS
FOR (t:TemporalClaim) ON (t.claim_type);

// --- Provision ---
CREATE CONSTRAINT provision_id_unique IF NOT EXISTS
FOR (p:Provision) REQUIRE p.id IS UNIQUE;

CREATE INDEX provision_entity_idx IF NOT EXISTS
FOR (p:Provision) ON (p.entity_id);

// --- FixedAsset ---
CREATE CONSTRAINT fa_id_unique IF NOT EXISTS
FOR (f:FixedAsset) REQUIRE f.id IS UNIQUE;

CREATE INDEX fa_entity_idx IF NOT EXISTS
FOR (f:FixedAsset) ON (f.entity_id);

CREATE INDEX fa_cgu_idx IF NOT EXISTS
FOR (f:FixedAsset) ON (f.cgu_id);

// --- DepreciationSchedule ---
CREATE CONSTRAINT ds_id_unique IF NOT EXISTS
FOR (d:DepreciationSchedule) REQUIRE d.id IS UNIQUE;

CREATE INDEX ds_asset_idx IF NOT EXISTS
FOR (d:DepreciationSchedule) ON (d.fixed_asset_id);

// --- JournalEntry creation template (bi-temporal, append-only) ---
// CREATE (j:JournalEntry {
//   id: randomUUID(),
//   entity_id: $entity_id,
//   period_id: $period_id,
//   entry_type: $entry_type,     // OPERATIONAL|ACCRUAL|DEFERRAL|REVERSAL|ADJUSTMENT|ELIMINATION|IMPAIRMENT
//   reference: $reference,
//   narrative: $narrative,
//   total_debit: $total_debit,   // MUST equal total_credit
//   total_credit: $total_credit,
//   currency: $currency,
//   valid_time_start: $valid_date,
//   valid_time_end: null,
//   transaction_time_start: datetime(),  // IMMUTABLE — set by system
//   transaction_time_end: null,
//   approval_status: $approval_status,
//   approved_by: $approved_by,
//   idempotency_key: $idempotency_key,
//   source_system: $source_system,
//   created_at: datetime()
// })

// --- LedgerLine creation template (append-only) ---
// CREATE (l:LedgerLine {
//   id: randomUUID(),
//   journal_entry_id: $je_id,
//   side: $side,               // DEBIT | CREDIT
//   amount: $amount,           // ALWAYS POSITIVE
//   currency: $currency,
//   functional_amount: $functional_amount,
//   fx_rate: $fx_rate,
//   node_ref_id: $node_ref_id,
//   node_ref_type: $node_ref_type,
//   economic_category: $economic_category,
//   statutory_code: $statutory_code,
//   fund_id: $fund_id,         // required when entity.fund_accounting_enabled = true
//   created_at: datetime()
// })
