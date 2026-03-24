// ============================================================
// 04-workforce-customer-nodes.cypher
// Enterprise Business Graph — WorkforceAsset + CustomerRelationshipAsset
// Phase 0: Constraints already in 01. Templates here.
// ============================================================

// --- CustomerRelationshipAsset creation template ---
// CREATE (c:CustomerRelationshipAsset {
//   id: randomUUID(), label: $label, entity_id: $entity_id,
//   nps: null, csat: null, churn_rate: null,
//   retention_rate: null, expansion_rate: null,
//   // Measurement confidence
//   mc_validity: 0.7, mc_precision: 0.7,
//   mc_coverage: 0.6, mc_freshness: 0.8, mc_composite: 0.7,
//   // Epistemic
//   value_state: 'REALIZED',
//   uncertainty_type: 'MIXED', uncertainty_score: 0.3,
//   calibration_factor: 1.0,
//   // Control
//   control_class: 'PROXIMATE_EXT', control_score: 0.6,
//   observability_score: 0.8, response_window_days: 30,
//   created_at: datetime(), updated_at: datetime()
// })

// --- WorkforceAsset creation template ---
// CREATE (w:WorkforceAsset {
//   id: randomUUID(), label: $label, entity_id: $entity_id,
//   enps: null,                    // LEADING — intent to stay
//   engagement_score: null,        // COINCIDENT
//   turnover_rate: null,           // LAGGING
//   absenteeism_rate: null,        // COINCIDENT — early warning
//   internal_fill_rate: null,      // LEADING — career health
//   // Measurement confidence
//   mc_validity: 0.7, mc_precision: 0.7,
//   mc_coverage: 0.6, mc_freshness: 0.8, mc_composite: 0.7,
//   // Epistemic
//   value_state: 'ESTIMATED',
//   uncertainty_type: 'MIXED', uncertainty_score: 0.4,
//   calibration_factor: 1.0,
//   // Control
//   control_class: 'DELEGATED', control_score: 0.7,
//   observability_score: 0.7, response_window_days: 60,
//   created_at: datetime(), updated_at: datetime()
// })
