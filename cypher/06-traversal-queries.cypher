// ============================================================
// 06-traversal-queries.cypher
// Enterprise Business Graph — Core traversal queries
// Phase 0: Validate all queries parse against empty DB
// See docs/05-cypher-patterns.md for full 20-query reference
// ============================================================

// Q1: Full impact paths — Activity → Outcome
// Returns all contribution paths with computed path_contribution
MATCH path = (a:Activity)-[:CONTRIBUTES_TO*1..6]->(o:Outcome)
WHERE a.entity_id = $entity_id
  AND a.status IN ['IN_PROGRESS', 'PLANNED']
WITH a, o, path,
  reduce(w = 1.0, r IN relationships(path) | w * r.weight) AS path_weight,
  reduce(d = 0, r IN relationships(path) | d + r.lag_days) AS total_lag
RETURN a.id AS activity_id, a.label AS activity,
  o.id AS outcome_id, o.label AS outcome,
  o.outcome_type, o.ontology,
  path_weight AS path_contribution,
  total_lag,
  length(path) AS path_length
ORDER BY path_weight DESC;

// Q5: Orphaned activities — spending with no outcome path
MATCH (a:Activity)
WHERE a.entity_id = $entity_id
  AND a.status IN ['IN_PROGRESS', 'PLANNED']
  AND a.cost_monetary > 0
  AND NOT EXISTS {
    MATCH (a)-[:CONTRIBUTES_TO*1..6]->(:Outcome)
  }
RETURN a.id, a.label, a.cost_monetary, a.status
ORDER BY a.cost_monetary DESC;

// Q7: Social constraint violation scan
MATCH (sc:SocialConstraint)-[p:PROHIBITS]->(a:Activity)
WHERE a.entity_id = $entity_id
  AND a.status IN ['IN_PROGRESS', 'PLANNED']
RETURN sc.label AS constraint_name,
  sc.constraint_type,
  a.id AS activity_id, a.label AS activity,
  p.violation_risk_score
ORDER BY p.violation_risk_score DESC;

// Q8: Obligation due-date alert queue
MATCH (o:Obligation)
WHERE o.entity_id = $entity_id
  AND o.status = 'PENDING'
  AND o.due_date <= date() + duration({days: 30})
RETURN o.id, o.label, o.due_date,
  o.penalty_exposure, o.non_compliance_risk,
  CASE
    WHEN o.due_date < date() THEN 'OVERDUE'
    WHEN o.due_date <= date() + duration({days: 7}) THEN 'CRITICAL'
    WHEN o.due_date <= date() + duration({days: 14}) THEN 'WARNING'
    ELSE 'UPCOMING'
  END AS risk_class
ORDER BY o.due_date ASC;

// Invariant check: GRAPH_INVARIANT_1 — every active Activity has outcome path
MATCH (a:Activity)
WHERE a.status IN ['IN_PROGRESS', 'PLANNED']
  AND NOT EXISTS {
    MATCH (a)-[:CONTRIBUTES_TO*1..6]->(:Outcome)
  }
RETURN count(a) AS orphaned_activity_count;
// MUST return 0 for invariant to pass

// Invariant check: ONTOLOGY_INVARIANT_1 — Outcome.ontology matches entity
MATCH (o:Outcome)
MATCH (e:Entity {id: o.entity_id})
WHERE o.ontology <> e.outcome_ontology
RETURN count(o) AS mismatched_ontology_count;
// MUST return 0 for invariant to pass

// Invariant check: ONTOLOGY_INVARIANT_2 — paths terminate at matching ontology
MATCH path = (a:Activity)-[:CONTRIBUTES_TO*1..6]->(o:Outcome)
MATCH (e:Entity {id: a.entity_id})
WHERE o.ontology <> e.outcome_ontology
RETURN count(path) AS cross_ontology_path_count;
// MUST return 0 for invariant to pass
