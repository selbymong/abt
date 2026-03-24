# 02 — Core Business Graph Model

## Foundational Principle

Every business activity ultimately contributes — directly or through intermediaries —
to one of three terminal outcome types. This set is **closed**:

```
IMPROVE_REVENUE    — improve quality, reliability, or volume of an existing revenue stream
NEW_REVENUE        — introduce a new revenue stream
MITIGATE_EXPENSE   — reduce or avoid a cost
```

There is no fourth outcome type. Customer satisfaction, employee engagement, social
contribution, brand equity — these are all intermediary nodes or constraint/preference
layers, not terminal outcomes. Elevating them to terminal outcomes severs their
measurable financial connections and makes the AI blind to them.

## Node Layer Architecture

```
INVESTMENT LAYER          INTERMEDIARY LAYER         OUTCOME LAYER
─────────────────         ──────────────────         ─────────────
Resource                  Metric / KPI               Improve Revenue
  └─ supplies             Capability                 New Revenue
Activity / Task           Asset / Product            Mitigate Expense
  └─ rolls up to          CustomerRelationshipAsset
Project                   WorkforceAsset
  └─ rolls up to          TemporalClaim (GL)
Initiative                FloatWindow (GL)

SPECIAL NODES             SOCIAL LAYER               GL NODES
─────────────             ────────────               ────────
Obligation                SocialConstraint           JournalEntry
EpistemicActivity         StakeholderAsset           LedgerLine
CashFlowEvent             Entity                     AccountingPeriod
PaymentTerm               ConsolidationGroup         FixedAsset
CreditFacility            OwnershipInterest          Provision
BusinessCombination       HedgeRelationship          FinancialInstrument
Goodwill
CashGeneratingUnit
ImpairmentTest
```

## The CONTRIBUTES_TO Edge — The Heart of the Model

Every path from investment to outcome flows through this edge type. It is the most
important object in the entire system.

### Properties
```
weight:                float 0–1   # AI-learned contribution strength
confidence:            float 0–1   # Uncertainty in the weight itself
lag_days:              int         # Days before contribution materialises
temporal_value_pct:    float       # 1 − (rate × lag_days / 365) — DCF discount
ai_inferred:           bool        # True = AI discovered, False = human declared
contribution_function: enum        # LINEAR | LOGARITHMIC | EXPONENTIAL |
                                   # THRESHOLD | BIMODAL | S_CURVE
threshold_value:       float?      # For THRESHOLD: activation level
elasticity:            float?      # For LOG/EXP: rate of diminishing/increasing returns
is_cross_asset_edge:   bool        # True for WorkforceAsset → CustomerRelationshipAsset
```

### Effective Contribution Formula
```
effective_contribution = weight × temporal_value_pct × control_score × measurement_confidence
```

This is the number the AI uses for resource allocation — not the raw weight.

### Back-propagation on Realization
When `realized_delta` is written to an Outcome node, the weight learner service:
1. Computes `accuracy = realized_delta / ci_point_estimate`
2. Updates `calibration_factor` for this outcome_type in PostgreSQL
3. Traverses all ancestor CONTRIBUTES_TO edges (up to 6 hops)
4. Applies gradient-descent-style weight update: `w_new = w_old + lr × (accuracy - 1)`
5. Emits `EDGE_WEIGHT_UPDATED` events for each updated edge

## Epistemic Properties (on every node)

Every node in the graph carries these properties governing how the AI weights its value:

```
value_state:              enum    FORECASTED | ESTIMATED | VALIDATED | REALIZED
uncertainty_type:         enum    ALEATORY | EPISTEMIC | MIXED
uncertainty_score:        float   0–1 (width of CI relative to point estimate)
ci_point_estimate:        float   The planning number (not the AI's bet)
ci_lower_bound:           float
ci_upper_bound:           float
ci_confidence_pct:        float   e.g. 0.70 = "70% sure true value is in range"
ci_distribution:          enum    NORMAL | SKEWED_HIGH | SKEWED_LOW | BIMODAL
ci_estimation_method:     enum    ANALOGICAL | DELPHI | PARAMETRIC | BOTTOM_UP
calibration_factor:       float   Learned from ESTIMATED→REALIZED history
epistemic_priority:       float   AI-computed EVOI
expires_at:               timestamp?  After this: downgrades to STALE_ESTIMATED
```

### Value State Machine
```
FORECASTED (0.30 discount) → ESTIMATED (0.45) → VALIDATED (0.80) → REALIZED (1.00)
```

Transitions are gated — each requires a recorded `epistemic_activity_id`.

### Effective Stake Formula
The number the AI actually uses for resource allocation:
```
effective_stake = ci_point_estimate
               × state_discount        (0.30 / 0.45 / 0.80 / 1.00)
               × calibration_factor    (learned from history)
               × ci_width_penalty      (max(0, 1 − CI_width_pct × 0.18))
               × measurement_confidence (REALIZED nodes only)
```

When `effective_stake / ci_point_estimate < 0.30` (allocation_block_threshold),
the AI **blocks capital commitment** and recommends epistemic investment instead.

## Control Model

Control and uncertainty are **orthogonal axes** — not the same thing.

```
control_class:         enum    DIRECT | DELEGATED | PROXIMATE_EXT | DISTAL_EXT | FORCE_MAJEURE
control_score:         float   0–1 raw controllability
effective_control:     float   computed: product along DELEGATES_TO chain
observability_score:   float   0–1 how early can changes be detected
response_window_days:  int     days between signal and impact
volatility:            float   rate of change
scenario_set_id:       [UUID]  Monte Carlo scenario definitions
```

### AI Strategy by Class × Observability
```
DIRECT + high obs      → Optimize actively (real-time feedback loop)
DELEGATED + low obs    → Select rigorously + SLAs (engineer observability in)
PROXIMATE_EXT + high   → Monitor + respond (contingency paths)
DISTAL_EXT + low       → Scenario plan (Monte Carlo, resilience buffers)
FORCE_MAJEURE          → Buffer + diversify (no path depends entirely on one)
```

### Control Attenuation
```
child.effective_control = parent.control_score × (1 − DELEGATES_TO.control_attenuation)
```

The highest-leverage intervention is always the last DIRECT node before a delegation hop —
it sets the ceiling for everything downstream.

## WorkforceAsset — The Cross-Asset Node (v1.1)

WorkforceAsset is structurally parallel to CustomerRelationshipAsset. It is:
- NOT a fourth outcome type
- NOT a hard constraint (labour law minimums are already Obligation nodes)
- An intermediary asset with high fan-out to all three outcomes

### Metric sub-nodes
```
enps:               float?  LEADING  — employee NPS, intent-to-stay signal
engagement_score:   float?  COINCIDENT — present and actively contributing
turnover_rate:      float?  LAGGING  — already left (50–150% of salary to replace)
absenteeism_rate:   float?  COINCIDENT — present but disengaged, early warning
internal_fill_rate: float?  LEADING  — % roles filled internally, career health
```

### Fan-out edges
```
WorkforceAsset → Improve Revenue    LOGARITHMIC  lag 30–90 days
WorkforceAsset → New Revenue        THRESHOLD    lag 90–180 days (engagement_score > 0.55)
WorkforceAsset → Mitigate Expense   EXPONENTIAL  lag 0–30 days
WorkforceAsset → CustomerRelAsset   LINEAR       lag 60–180 days  ← unique cross-asset edge
```

The cross-asset edge creates a two-hop path to all outcomes. Stacked lag applies.
Monitor combined attribution weight (direct + indirect) — flag if > 0.80.

## Social Contribution Layer — Three Modes

Social contribution is a **decision layer orthogonal to the outcome structure**, not a
fourth outcome type.

### Mode 1: Hard Constraint
`SocialConstraint` node + `PROHIBITS` edge. Pre-filter before financial optimization.
Unconditional — no ROI test can override. If an activity violates this, it is invisible
to the optimizer.

### Mode 2: Soft Preference
`tolerance_band_pct` on StakeholderAsset. Within the financial equivalence band,
the socially preferred option wins. Outside the band, financial outcome prevails
and the cost of the preference is surfaced explicitly.

Example: biodegradable input costs 4% more. If `tolerance_band_pct = 0.05`,
the biodegradable option is selected. If it costs 8% more, the cheaper option
is selected and the $X premium is reported.

### Mode 3: Genuine Intermediary
`StakeholderAsset` node with `CONTRIBUTES_TO` edges. ESG score → cost of capital.
Brand → retention/acquisition. Governance → measurement confidence across all Metric nodes.

**Key governance insight:** `governance_score` is the only social property that feeds back
into the epistemic layer. Low governance = unreliable reporting = lower
`measurement_confidence.freshness` and `.validity` across all Metric nodes.

## Obligation Nodes

Mandatory activities with no CONTRIBUTES_TO edges. Their semantic is inverted:
**absence creates penalty risk against all outcomes simultaneously**.

Properties: `must_do: true`, `obligation_type`, `due_date`, `recurrence`,
`non_compliance_risk`, `penalty_exposure`.

Uses `PROTECTS` edge type (not `CONTRIBUTES_TO`).
ROI = `avoided (penalty_exposure × non_compliance_risk)`.
Scheduled BEFORE discretionary allocation — no ROI test required.

## Epistemic Activities — The Meta-Graph

Epistemic activities produce not business outcomes but improvements to the graph's
own confidence properties. They form a meta-graph layer.

Edge types:
- `REDUCES_UNCERTAINTY_OF` → lowers uncertainty_score
- `VALIDATES` → transitions ESTIMATED → VALIDATED (requires pilot/A/B test)
- `IMPROVES_COVERAGE_OF` → raises measurement_confidence.coverage
- `CALIBRATES` → updates calibration_factor after ESTIMATED vs REALIZED comparison

**Epistemic ROI** = Δ(uncertainty_reduction × stake) − cost of the activity

If a $50k pilot would move a $4M initiative from ESTIMATED (0.45 discount) to
VALIDATED (0.80 discount), the expected value of that information is
$4M × (0.80 − 0.45) = $1.4M — automatically justifying the pilot cost.
