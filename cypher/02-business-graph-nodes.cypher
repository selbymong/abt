// ============================================================
// 02-business-graph-nodes.cypher
// Enterprise Business Graph — Investment + Intermediary layer nodes
// Phase 0: Node type validation templates
// ============================================================

// This file defines the canonical node creation patterns.
// All node creation MUST go through the Graph CRUD service,
// which enforces these property sets.

// --- Resource creation template ---
// CREATE (r:Resource {
//   id: randomUUID(), label: $label, entity_id: $entity_id,
//   resource_type: $resource_type,  // CASH|PEOPLE|TIME|EQUIPMENT|EXTERNAL_SERVICE
//   allocation_pct: $allocation_pct, cost_monetary: $cost_monetary,
//   cost_time_hours: $cost_time_hours, currency: $currency,
//   // Epistemic properties
//   value_state: 'ESTIMATED', uncertainty_type: 'EPISTEMIC',
//   uncertainty_score: 0.5,
//   ci_point_estimate: $cost_monetary, ci_lower_bound: $ci_lower,
//   ci_upper_bound: $ci_upper, ci_confidence_pct: 0.80,
//   ci_distribution: 'NORMAL', ci_estimation_method: 'ANALOGICAL',
//   calibration_factor: 1.0, epistemic_priority: 0.0,
//   // Control properties
//   control_class: 'DIRECT', control_score: 1.0,
//   effective_control: 1.0, observability_score: 1.0,
//   response_window_days: 1, volatility: 0.0,
//   created_at: datetime(), updated_at: datetime()
// })

// --- Activity creation template ---
// CREATE (a:Activity {
//   id: randomUUID(), label: $label, entity_id: $entity_id,
//   status: 'PLANNED',  // PLANNED|IN_PROGRESS|COMPLETED|CANCELLED
//   cost_monetary: 0, cost_time_hours: null,
//   start_date: null, end_date: null,
//   project_id: $project_id, initiative_id: $initiative_id,
//   // Epistemic + Control properties (same as Resource)
//   value_state: 'FORECASTED', uncertainty_type: 'EPISTEMIC',
//   uncertainty_score: 0.7, calibration_factor: 1.0,
//   control_class: 'DIRECT', control_score: 1.0,
//   created_at: datetime(), updated_at: datetime()
// })

// --- Project creation template ---
// CREATE (p:Project {
//   id: randomUUID(), label: $label, entity_id: $entity_id,
//   status: 'PLANNED', budget: $budget, spent_to_date: 0,
//   initiative_id: $initiative_id,
//   value_state: 'FORECASTED', uncertainty_score: 0.6,
//   calibration_factor: 1.0,
//   control_class: 'DIRECT', control_score: 1.0,
//   created_at: datetime(), updated_at: datetime()
// })

// --- Initiative creation template ---
// CREATE (i:Initiative {
//   id: randomUUID(), label: $label, entity_id: $entity_id,
//   status: 'PLANNED', budget: $budget, time_horizon_months: $months,
//   value_state: 'FORECASTED', uncertainty_score: 0.7,
//   calibration_factor: 1.0,
//   control_class: 'DIRECT', control_score: 1.0,
//   created_at: datetime(), updated_at: datetime()
// })

// --- Metric creation template ---
// CREATE (m:Metric {
//   id: randomUUID(), label: $label, entity_id: $entity_id,
//   metric_type: $metric_type,  // LEADING|COINCIDENT|LAGGING
//   current_value: $current_value, target_value: $target_value,
//   unit: $unit,
//   measurement_confidence: {
//     validity: 0.8, precision: 0.8,
//     coverage: 0.7, freshness: 0.9, composite: 0.8
//   },
//   value_state: 'ESTIMATED', uncertainty_score: 0.4,
//   calibration_factor: 1.0,
//   created_at: datetime(), updated_at: datetime()
// })

// --- Capability creation template ---
// CREATE (c:Capability {
//   id: randomUUID(), label: $label, entity_id: $entity_id,
//   capability_level: $level,  // NASCENT|DEVELOPING|ESTABLISHED|MATURE
//   capacity_threshold: $threshold, build_cost: $cost,
//   value_state: 'ESTIMATED', uncertainty_score: 0.5,
//   calibration_factor: 1.0,
//   control_class: 'DIRECT', control_score: 0.9,
//   created_at: datetime(), updated_at: datetime()
// })

// --- Asset (Product) creation template ---
// CREATE (a:Asset {
//   id: randomUUID(), label: $label, entity_id: $entity_id,
//   asset_type: $asset_type,  // PRODUCT|BRAND|IP|INFRASTRUCTURE|DATA
//   book_value: $book_value, depreciation_rate: $dep_rate,
//   growth_rate: $growth_rate, fair_value: $fair_value,
//   fair_value_hierarchy: $fv_hierarchy,
//   value_state: 'ESTIMATED', uncertainty_score: 0.4,
//   calibration_factor: 1.0,
//   control_class: 'DIRECT', control_score: 0.9,
//   created_at: datetime(), updated_at: datetime()
// })

// --- Outcome creation template ---
// CREATE (o:Outcome {
//   id: randomUUID(), label: $label, entity_id: $entity_id,
//   ontology: $ontology,      // FINANCIAL | MISSION  [v1.2-A]
//   outcome_type: $type,      // IMPROVE_REVENUE|NEW_REVENUE|MITIGATE_EXPENSE|
//                              // DELIVER_MISSION|SUSTAIN_FUNDING|STEWARD_RESOURCES
//   measurement_unit: $unit,  // null for FINANCIAL, 'beneficiaries' etc for MISSION
//   stream_id: $stream_id,
//   target_delta: $target, realized_delta: 0,
//   currency: $currency,
//   period_start: $start, period_end: $end,
//   value_state: 'FORECASTED', uncertainty_score: 0.7,
//   calibration_factor: 1.0,
//   control_class: 'PROXIMATE_EXT', control_score: 0.6,
//   created_at: datetime(), updated_at: datetime()
// })
