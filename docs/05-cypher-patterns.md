# 05 — Key Cypher Query Patterns

The 20 most important traversal queries. All financial reporting
reads from TimescaleDB — these are semantic/analytical queries.

## Business Graph Queries

### Q1 — Full impact path (activity to outcomes)
```cypher
MATCH path = (a:Activity)-[:CONTRIBUTES_TO*1..6]->(o:Outcome)
WHERE a.id = $activity_id
WITH path, relationships(path) AS edges
RETURN
  path,
  [node IN nodes(path) | node.label] AS path_labels,
  REDUCE(w = 1.0, e IN edges |
    w * e.weight * e.temporal_value_pct
  ) AS path_contribution,
  REDUCE(d = 0, e IN edges | d + e.lag_days) AS total_lag_days,
  last(nodes(path)).outcome_type AS outcome_type
ORDER BY path_contribution DESC
```

### Q2 — Epistemic priority queue (what to validate next)
```cypher
MATCH (n)
WHERE n.value_state IN ['ESTIMATED', 'FORECASTED']
  AND n.epistemic_priority > 0
RETURN n.id, n.label, labels(n)[0] AS node_type,
  n.value_state, n.epistemic_priority,
  n.ci_point_estimate AS headline,
  n.calibration_factor * n.ci_point_estimate AS adjusted_estimate,
  n.ci_upper_bound - n.ci_lower_bound AS ci_width,
  n.expires_at
ORDER BY n.epistemic_priority DESC
LIMIT 20
```

### Q3 — Stalled HARD_BLOCK paths
```cypher
MATCH (a:Activity)-[:DEPENDS_ON {dependency_class: 'HARD_BLOCK'}]->(blocker)
WHERE blocker.status <> 'COMPLETED'
  AND a.status = 'IN_PROGRESS'
WITH a, blocker
MATCH downstream = (a)-[:CONTRIBUTES_TO*1..4]->(o:Outcome)
RETURN a.id, a.label, a.cost_monetary,
  blocker.id AS blocker_id, blocker.label AS blocker_label,
  COUNT(downstream) AS blocked_paths
ORDER BY blocked_paths DESC, a.cost_monetary DESC
```

### Q4 — Control attenuation walk
```cypher
MATCH path = (root)-[:DELEGATES_TO*1..5]->(leaf)
WHERE NOT (leaf)-[:DELEGATES_TO]->()
WITH path, relationships(path) AS edges, root, leaf
RETURN root.id, root.label, leaf.id, leaf.label,
  length(path) AS delegation_hops,
  REDUCE(c = 1.0, e IN edges |
    c * (1 - e.control_attenuation)
  ) AS effective_control
ORDER BY effective_control ASC
```

### Q5 — Orphaned activities (spending with no outcome path)
```cypher
MATCH (a:Activity)
WHERE NOT (a)-[:CONTRIBUTES_TO*1..6]->(:Outcome)
  AND a.status NOT IN ['COMPLETED', 'CANCELLED']
RETURN a.id, a.label, a.cost_monetary, a.cost_time_hours,
  a.status, a.responsible_team
ORDER BY a.cost_monetary DESC
```

### Q6 — Portfolio effective-stake summary
```cypher
MATCH (n:Initiative)
WHERE n.status NOT IN ['COMPLETED', 'CANCELLED']
WITH n,
  CASE n.value_state
    WHEN 'FORECASTED' THEN 0.30
    WHEN 'ESTIMATED'  THEN 0.45
    WHEN 'VALIDATED'  THEN 0.80
    WHEN 'REALIZED'   THEN 1.00
    ELSE 0.30
  END AS state_discount,
  CASE WHEN n.ci_point_estimate > 0
    THEN toFloat(n.ci_upper_bound - n.ci_lower_bound) / n.ci_point_estimate
    ELSE 0.0
  END AS ci_width_pct
WITH n, state_discount, ci_width_pct,
  n.ci_point_estimate
    * state_discount
    * n.calibration_factor
    * CASE WHEN (1 - ci_width_pct * 0.18) < 0
           THEN 0 ELSE (1 - ci_width_pct * 0.18) END AS effective_stake
RETURN n.id, n.label, n.value_state,
  n.ci_point_estimate AS headline, effective_stake,
  CASE WHEN n.ci_point_estimate > 0
    THEN effective_stake / n.ci_point_estimate ELSE 0
  END AS stake_ratio,
  CASE WHEN effective_stake / n.ci_point_estimate < 0.30
    THEN 'BLOCKED'
    WHEN effective_stake / n.ci_point_estimate < 0.55
    THEN 'CAUTION'
    ELSE 'CLEARED'
  END AS recommendation
ORDER BY stake_ratio ASC
```

### Q7 — Social constraint violation scan
```cypher
MATCH (sc:SocialConstraint)-[e:PROHIBITS]->(a:Activity)
WHERE a.status NOT IN ['COMPLETED', 'CANCELLED']
RETURN sc.id, sc.constraint_type, sc.rationale,
  e.violation_risk_score, a.id, a.label,
  a.status, a.cost_monetary
ORDER BY e.violation_risk_score DESC
```

### Q8 — Obligation due-date alert queue
```cypher
MATCH (ob:Obligation)
WHERE ob.due_date <= date() + duration({days: 30})
  AND ob.due_date >= date()
WITH ob, ob.due_date - date() AS days_rem
RETURN ob.id, ob.label, ob.obligation_type, ob.due_date,
  days_rem.days AS days_remaining,
  ob.non_compliance_risk,
  ob.penalty_exposure,
  ob.non_compliance_risk * ob.penalty_exposure AS expected_penalty,
  CASE
    WHEN days_rem.days <= 7  THEN 'CRITICAL'
    WHEN days_rem.days <= 14 THEN 'URGENT'
    ELSE 'WARNING'
  END AS alert_level
ORDER BY ob.due_date ASC
```

### Q9 — Calibration health (ESTIMATED vs REALIZED accuracy)
```cypher
MATCH (o:Outcome)
WHERE o.value_state = 'REALIZED'
  AND o.ci_point_estimate > 0
  AND o.realized_delta IS NOT NULL
WITH o, o.realized_delta / o.ci_point_estimate AS ratio
RETURN o.outcome_type,
  COUNT(o) AS sample_size,
  AVG(ratio) AS avg_accuracy,
  MIN(ratio) AS min_ratio, MAX(ratio) AS max_ratio,
  AVG(ratio) - 1.0 AS systematic_bias,
  CASE
    WHEN AVG(ratio) < 0.70
    THEN 'OVER-OPTIMISTIC — reduce calibration_factor'
    WHEN AVG(ratio) > 1.30
    THEN 'UNDER-OPTIMISTIC — increase calibration_factor'
    ELSE 'CALIBRATED'
  END AS recommendation
ORDER BY ABS(AVG(ratio) - 1.0) DESC
```

## Cashflow Queries

### Q10 — Float window opportunities
```cypher
MATCH (fw:FloatWindow)<-[:CREATES]-(cfe:CashFlowEvent)
WHERE fw.net_value > 0
OPTIONAL MATCH (cf:CreditFacility)
WITH fw, cfe, cf,
  CASE WHEN fw.annualized_discount_rate IS NOT NULL
         AND cf.rate_annual IS NOT NULL
       THEN fw.annualized_discount_rate > cf.rate_annual
       ELSE false
  END AS discount_worse_than_facility
RETURN fw.id, fw.opportunity_type, fw.window_days,
  fw.float_amount, fw.net_value,
  fw.annualized_discount_rate, cf.rate_annual,
  discount_worse_than_facility,
  cfe.counterparty_id, cfe.relationship_sensitivity
ORDER BY fw.net_value DESC
```

## Workforce Queries

### Q11 — Full workforce impact paths (v1.1)
```cypher
MATCH path = (w:WorkforceAsset)-[:CONTRIBUTES_TO*1..3]->(o:Outcome)
WITH path, relationships(path) AS edges, nodes(path) AS pathNodes
RETURN
  [node IN pathNodes | node.label] AS path_labels,
  [node IN pathNodes | labels(node)[0]] AS node_types,
  REDUCE(w = 1.0, e IN edges |
    w * e.weight * e.temporal_value_pct
  ) AS path_contribution,
  REDUCE(d = 0, e IN edges | d + e.lag_days) AS total_lag_days,
  last(pathNodes).outcome_type AS outcome_type,
  length(path) AS hops
ORDER BY path_contribution DESC
```

### Q12 — Cross-asset attribution overlap detection
```cypher
MATCH (wa:WorkforceAsset)-[e1:CONTRIBUTES_TO]->(cr:CustomerRelationshipAsset)
     -[e2:CONTRIBUTES_TO]->(o:Outcome)
MATCH (wa)-[e3:CONTRIBUTES_TO]->(o)
WHERE e1.weight > 0 AND e3.weight > 0
RETURN wa.id, o.id, o.outcome_type,
  e3.weight AS direct_weight,
  e1.weight * e2.weight AS indirect_weight,
  e3.weight + (e1.weight * e2.weight) AS combined_weight,
  CASE WHEN e3.weight + (e1.weight * e2.weight) > 0.80
    THEN 'FLAG — potential double-counting'
    ELSE 'OK'
  END AS recommendation
ORDER BY combined_weight DESC
```

## GL Queries (read from TimescaleDB for performance)

### Q13 — P&L from TimescaleDB projection
```sql
SELECT node_ref_type, economic_category, statutory_code,
  SUM(net_balance) AS net_amount
FROM gl_period_balances
WHERE entity_id = $entity_id
  AND period_id = $period_id
  AND economic_category IN ('REVENUE', 'EXPENSE')
GROUP BY node_ref_type, economic_category, statutory_code
ORDER BY economic_category, SUM(net_balance) DESC
```

### Q14 — Balance sheet from TimescaleDB projection
```sql
SELECT economic_category, statutory_code, node_ref_type,
  SUM(CASE WHEN economic_category = 'ASSET'
    THEN net_balance ELSE -net_balance END) AS balance
FROM gl_period_balances
WHERE entity_id = $entity_id
  AND period_id = $period_id
  AND economic_category IN ('ASSET','LIABILITY','EQUITY')
GROUP BY economic_category, statutory_code, node_ref_type
HAVING SUM(net_balance) <> 0
ORDER BY economic_category, statutory_code
```

### Q15 — Outcome attribution P&L (Neo4j — semantic, not in TimescaleDB)
```cypher
MATCH (je:JournalEntry)-[:HAS_LINE]->(ll:LedgerLine)
WHERE je.entity_id = $entity_id
  AND je.period_id = $period_id
  AND ll.economic_category = 'EXPENSE'
  AND ll.side = 'DEBIT'
MATCH (src {id: ll.node_ref_id})-[:CONTRIBUTES_TO*1..6]->(o:Outcome)
WITH o.outcome_type AS outcome, ll.node_ref_label AS activity,
  ll.functional_amount AS cost,
  REDUCE(w=1.0, r IN relationships(
    (src)-[:CONTRIBUTES_TO*1..6]->(o)) | w * r.weight) AS path_weight
RETURN outcome, SUM(cost) AS total_spend,
  SUM(cost * path_weight) AS attributed_spend,
  o.realized_delta AS realized_outcome
ORDER BY outcome, attributed_spend DESC
```

## Consolidation Queries

### Q16 — Consolidated P&L
```cypher
MATCH (cg:ConsolidationGroup {id: $group_id})
MATCH (e:Entity)-[:REPORTS_TO_GROUP]->(cg)
WHERE e.consolidation_method = 'FULL'
MATCH (je:JournalEntry {entity_id: e.id})-[:HAS_LINE]->(ll:LedgerLine)
WHERE je.period_id = $period_id
  AND ll.economic_category IN ['REVENUE', 'EXPENSE']
WHERE NOT EXISTS {
  MATCH (ll)-[:INTERCOMPANY_MATCH]->(ll2:LedgerLine)
  MATCH (e2:Entity {id: ll2.entity_id})-[:REPORTS_TO_GROUP]->(cg)
}
WITH e, ll,
  CASE ll.side WHEN 'CREDIT' THEN ll.reporting_currency_amount
               ELSE -ll.reporting_currency_amount END AS signed_amount
RETURN ll.economic_category, ll.node_ref_label AS line_item,
  e.label AS entity, SUM(signed_amount) AS consolidated_amount
ORDER BY ll.economic_category, SUM(signed_amount) DESC
```

### Q17 — Intercompany reconciliation scan
```cypher
MATCH (ll1:LedgerLine)-[m:INTERCOMPANY_MATCH]->(ll2:LedgerLine)
MATCH (je1:JournalEntry)-[:HAS_LINE]->(ll1)
MATCH (je2:JournalEntry)-[:HAS_LINE]->(ll2)
WHERE je1.period_id = $period_id AND je2.period_id = $period_id
WITH m,
  ABS(ll1.reporting_currency_amount - ll2.reporting_currency_amount) AS discrepancy,
  m.seller_entity_id, m.buyer_entity_id, m.transaction_type
WHERE discrepancy > $materiality_threshold
RETURN m.seller_entity_id, m.buyer_entity_id, m.transaction_type,
  ll1.reporting_currency_amount AS side_a,
  ll2.reporting_currency_amount AS side_b, discrepancy,
  CASE WHEN discrepancy > 10000
    THEN 'BLOCK CLOSE' ELSE 'WARNING' END AS status
ORDER BY discrepancy DESC
```

## Impairment Queries

### Q18 — CGU value in use (contribution path DCF)
```cypher
MATCH (cgu:CashGeneratingUnit {id: $cgu_id})
MATCH (cgu)-[:CONTAINS]->(src)
WHERE src:Activity OR src:Initiative OR src:Project
MATCH path = (src)-[:CONTRIBUTES_TO*1..6]->(o:Outcome)
WITH path, relationships(path) AS edges, o,
  REDUCE(contrib = 1.0, e IN edges |
    contrib * e.weight * e.temporal_value_pct
  ) AS path_contribution,
  REDUCE(lag = 0, e IN edges | lag + e.lag_days) AS total_lag
WHERE total_lag <= cgu.viu_horizon_years * 365
WITH o,
  o.ci_point_estimate * path_contribution AS projected_cashflow,
  (1.0 / (1 + cgu.viu_discount_rate)
    ^ (total_lag / 365.0)) AS pv_factor
WITH SUM(projected_cashflow * pv_factor) AS projection_viu,
  MAX(projected_cashflow) AS terminal_cf
RETURN projection_viu,
  terminal_cf * (1 + $terminal_growth) / ($wacc - $terminal_growth)
    / (1 + $wacc) ^ $horizon AS terminal_value,
  projection_viu + (terminal_cf * (1 + $terminal_growth)
    / ($wacc - $terminal_growth)
    / (1 + $wacc) ^ $horizon) AS total_viu
```

### Q19 — CGU impairment risk monitoring
```cypher
MATCH (cgu:CashGeneratingUnit)
MATCH (gw:Goodwill {cgu_id: cgu.id})
WHERE gw.carrying_amount > 0
WITH cgu, gw,
  gw.carrying_amount AS carrying,
  cgu.last_recoverable_amount AS last_recoverable,
  cgu.last_recoverable_amount - gw.carrying_amount AS headroom,
  cgu.last_impairment_test_date AS last_tested
RETURN cgu.label, gw.carrying_amount, headroom,
  CASE WHEN carrying > 0 THEN headroom / carrying ELSE 0 END AS headroom_pct,
  last_tested,
  CASE
    WHEN headroom < 0                      THEN 'CRITICAL'
    WHEN headroom / carrying < 0.10        THEN 'HIGH RISK'
    WHEN headroom / carrying < 0.20        THEN 'WATCH'
    WHEN last_tested < date() - duration({months: 11}) THEN 'TEST DUE'
    ELSE 'OK'
  END AS risk_flag
ORDER BY headroom ASC
```

## Bank Reconciliation

### Q20 — Outstanding reconciliation items
```cypher
// Unmatched bank lines (in bank, not in ledger)
MATCH (bsl:BankStatementLine {status: 'UNMATCHED', bank_account_id: $account_id})
WHERE bsl.transaction_date <= date() - duration({days: 5})
RETURN bsl.id, bsl.transaction_date, bsl.amount,
  bsl.description, 'UNMATCHED BANK LINE' AS issue_type

UNION

// Unmatched ledger entries (in ledger, not at bank yet)
MATCH (cfe:CashFlowEvent {bank_account_id: $account_id})
WHERE cfe.reconciliation_status = 'UNRECONCILED'
  AND cfe.scheduled_date <= date() - duration({days: 5})
RETURN cfe.id, cfe.scheduled_date, cfe.amount,
  'Unreconciled ' + cfe.direction AS description,
  'UNMATCHED LEDGER ENTRY' AS issue_type
```
