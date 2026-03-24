// ============================================================
// 05-edges.cypher
// Enterprise Business Graph — Edge type definitions
// Phase 0: Reference templates for all edge types
// ============================================================

// --- CONTRIBUTES_TO (core semantic edge) ---
// MATCH (source), (target:Outcome)
// WHERE source.id = $source_id AND target.id = $target_id
// CREATE (source)-[:CONTRIBUTES_TO {
//   weight: $weight,                     // 0–1
//   confidence: $confidence,             // 0–1
//   lag_days: $lag_days,
//   temporal_value_pct: $temporal_value,  // DCF-like discount
//   ai_inferred: $ai_inferred,
//   contribution_function: $function,    // LINEAR|LOGARITHMIC|EXPONENTIAL|
//                                        // THRESHOLD|BIMODAL|S_CURVE
//   threshold_value: $threshold,
//   elasticity: $elasticity,
//   is_cross_asset_edge: $cross_asset,
//   ontology_bridge: false               // hard boundary — AI never propagates
// }]->(target)

// --- DEPENDS_ON ---
// CREATE (source)-[:DEPENDS_ON {
//   dependency_class: $class,   // HARD_BLOCK|SOFT_DEPENDENCY|ENABLES
//   dependency_description: $desc
// }]->(target)

// --- DELEGATES_TO ---
// CREATE (source)-[:DELEGATES_TO {
//   control_attenuation: $attenuation,  // 0–1
//   sla_reference: $sla
// }]->(target)

// --- INTERCOMPANY_MATCH ---
// CREATE (source:LedgerLine)-[:INTERCOMPANY_MATCH {
//   source_entity_id: $src_entity, target_entity_id: $tgt_entity,
//   source_ledger_line_id: $src_ll, target_ledger_line_id: $tgt_ll,
//   elimination_amount: $amount
// }]->(target:LedgerLine)

// --- RELATED_PARTY [v1.2-A] ---
// CREATE (e1:Entity)-[:RELATED_PARTY {
//   relationship_type: $type,  // SHARED_BOARD|SHARED_MANAGEMENT|ECONOMIC_DEPENDENCE|
//                               // FAMILY|SIGNIFICANT_INFLUENCE
//   individuals_in_common: $individuals,
//   effective_from: $from, effective_until: $until,
//   disclosure_required: $disclosure
// }]->(e2:Entity)

// --- RELATED_PARTY_TRANSACTION [v1.2-A] ---
// CREATE (je1:JournalEntry)-[:RELATED_PARTY_TRANSACTION {
//   transaction_nature: $nature,
//   source_entity_id: $src, target_entity_id: $tgt,
//   arms_length_validated: $validated,
//   arms_length_method: $method,
//   source_journal_entry_id: $src_je, target_journal_entry_id: $tgt_je,
//   tax_deductible_for_source: $deductible,
//   donation_receipt_issued: $receipt
// }]->(je2:JournalEntry)

// --- QUALIFIES_FOR [v1.2-B] ---
// CREATE (node)-[:QUALIFIES_FOR {
//   qualification_basis: $basis,  // AI_INFERRED|MANUALLY_TAGGED|RULE_MATCHED
//   eligible_amount: $amount,
//   eligibility_confidence: $confidence,
//   expenditure_category: $category,
//   claim_id: $claim_id,
//   reviewer_accepted: null, rejection_reason: null
// }]->(program:TaxCreditProgram)

// --- REDUCES_COST_OF [v1.2-B] ---
// CREATE (claim:TaxCreditClaim)-[:REDUCES_COST_OF {
//   cost_reduction_amount: $amount,
//   cost_reduction_pct: $pct,
//   certainty: $certainty  // CLAIMED|ASSESSED|REALIZED
// }]->(activity:Activity)

// --- BELONGS_TO [v1.2-C] ---
// CREATE (asset:FixedAsset)-[:BELONGS_TO {
//   class_system: $system,       // CCA|MACRS|ACCOUNTING
//   override_rate_pct: null,
//   override_useful_life: null,
//   override_salvage_value: null,
//   override_reason: null,
//   effective_from: $from,
//   reclassified_from: null
// }]->(ac:AssetClass)

// --- Epistemic edges ---
// CREATE (ea:EpistemicActivity)-[:REDUCES_UNCERTAINTY_OF {
//   expected_uncertainty_delta: $expected,
//   actual_uncertainty_delta: $actual,
//   target_property: $property
// }]->(target)

// --- Cashflow edges ---
// CREATE (a:Activity)-[:GENERATES]->(cfe:CashFlowEvent)
// CREATE (cfe:CashFlowEvent)-[:CREATES]->(fw:FloatWindow)
// CREATE (cf:CreditFacility)-[:FINANCES {
//   draw_amount: $amount, rate: $rate, repayment_date: $date
// }]->(cfe:CashFlowEvent)
// CREATE (cfe:CashFlowEvent)-[:GOVERNED_BY]->(pt:PaymentTerm)

// --- Social edges ---
// CREATE (sc:SocialConstraint)-[:PROHIBITS {
//   violation_risk_score: $score, rationale: $rationale
// }]->(a:Activity)
// CREATE (o:Obligation)-[:PROTECTS {
//   penalty_exposure: $penalty, non_compliance_risk: $risk
// }]->(outcome:Outcome)
