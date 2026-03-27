// Shared GraphQL types: scalars and common property blocks

export const commonTypeDefs = `
  scalar DateTime
  scalar JSON

  type EpistemicProperties {
    value_state: ValueState!
    uncertainty_type: UncertaintyType!
    uncertainty_score: Float!
    ci_point_estimate: Float!
    ci_lower_bound: Float!
    ci_upper_bound: Float!
    ci_confidence_pct: Float!
    ci_distribution: String!
    ci_estimation_method: String!
    calibration_factor: Float!
    epistemic_priority: Float!
    expires_at: DateTime
  }

  type ControlProperties {
    control_class: ControlClass!
    control_score: Float!
    effective_control: Float!
    observability_score: Float!
    response_window_days: Int!
    volatility: Float!
    scenario_set_id: [String!]
  }
`;
