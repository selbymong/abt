/**
 * Social Control Service
 *
 * Implements PROHIBITS pre-filter: before any activity is approved or
 * optimized, check that no active SocialConstraint blocks it.
 *
 * Also manages obligation tracking and alert generation.
 */
import { runCypher } from '../../lib/neo4j.js';
import { logger } from '../../lib/logger.js';

export interface ProhibitionCheck {
  activityId: string;
  isProhibited: boolean;
  prohibitions: {
    constraintId: string;
    constraintLabel: string;
    constraintType: string;
    severity: number;
    rationale: string;
  }[];
}

export interface ObligationAlert {
  obligationId: string;
  label: string;
  obligationType: string;
  dueDate: string;
  daysUntilDue: number;
  nonComplianceRisk: number;
  penaltyExposure: number;
  status: string;
}

/**
 * PROHIBITS pre-filter: check whether an Activity is blocked by
 * any SocialConstraint via PROHIBITS edges.
 *
 * This MUST be called before activity approval or optimization.
 * "Social constraints are pre-filters" — CLAUDE.md principle #8.
 */
export async function checkProhibitions(activityId: string): Promise<ProhibitionCheck> {
  const results = await runCypher<{
    constraintId: string;
    constraintLabel: string;
    constraintType: string;
    severity: number;
    rationale: string;
  }>(
    `MATCH (sc:SocialConstraint)-[r:PROHIBITS]->(a:Activity {id: $activityId})
     RETURN sc.id AS constraintId,
            sc.label AS constraintLabel,
            sc.constraint_type AS constraintType,
            r.severity AS severity,
            sc.rationale AS rationale
     ORDER BY r.severity DESC`,
    { activityId },
  );

  return {
    activityId,
    isProhibited: results.length > 0,
    prohibitions: results,
  };
}

/**
 * Batch check: given a list of activity IDs, return which ones
 * are prohibited. Used by the optimizer to filter candidates.
 */
export async function filterProhibitedActivities(
  activityIds: string[],
): Promise<{ allowed: string[]; prohibited: string[] }> {
  if (activityIds.length === 0) return { allowed: [], prohibited: [] };

  const results = await runCypher<{ activityId: string }>(
    `UNWIND $activityIds AS aid
     MATCH (sc:SocialConstraint)-[:PROHIBITS]->(a:Activity {id: aid})
     RETURN DISTINCT a.id AS activityId`,
    { activityIds },
  );

  const prohibitedSet = new Set(results.map((r) => r.activityId));
  const allowed = activityIds.filter((id) => !prohibitedSet.has(id));
  const prohibited = activityIds.filter((id) => prohibitedSet.has(id));

  return { allowed, prohibited };
}

/**
 * Get upcoming obligation alerts for an entity.
 * Returns obligations due within the specified horizon (days).
 */
export async function getObligationAlerts(
  entityId: string,
  horizonDays: number = 30,
): Promise<ObligationAlert[]> {
  const results = await runCypher<{
    obligationId: string;
    label: string;
    obligationType: string;
    dueDate: string;
    daysUntilDue: number;
    nonComplianceRisk: number;
    penaltyExposure: number;
    status: string;
  }>(
    `MATCH (o:Obligation {entity_id: $entityId})
     WHERE o.status IN ['PENDING', 'OVERDUE']
       AND o.due_date <= date() + duration({days: $horizonDays})
     RETURN o.id AS obligationId,
            o.label AS label,
            o.obligation_type AS obligationType,
            toString(o.due_date) AS dueDate,
            duration.between(date(), o.due_date).days AS daysUntilDue,
            o.non_compliance_risk AS nonComplianceRisk,
            o.penalty_exposure AS penaltyExposure,
            o.status AS status
     ORDER BY o.due_date ASC`,
    { entityId, horizonDays },
  );

  // Mark overdue obligations
  for (const alert of results) {
    if (alert.daysUntilDue < 0) {
      alert.status = 'OVERDUE';
    }
  }

  if (results.length > 0) {
    logger.info(
      { entityId, alertCount: results.length, horizonDays },
      'Obligation alerts generated',
    );
  }

  return results;
}

/**
 * Get all obligations for an entity regardless of due date.
 */
export async function getEntityObligations(
  entityId: string,
  statusFilter?: string,
): Promise<ObligationAlert[]> {
  const statusClause = statusFilter ? 'AND o.status = $statusFilter' : '';

  const results = await runCypher<{
    obligationId: string;
    label: string;
    obligationType: string;
    dueDate: string;
    daysUntilDue: number;
    nonComplianceRisk: number;
    penaltyExposure: number;
    status: string;
  }>(
    `MATCH (o:Obligation {entity_id: $entityId})
     ${statusClause}
     RETURN o.id AS obligationId,
            o.label AS label,
            o.obligation_type AS obligationType,
            toString(o.due_date) AS dueDate,
            duration.between(date(), o.due_date).days AS daysUntilDue,
            o.non_compliance_risk AS nonComplianceRisk,
            o.penalty_exposure AS penaltyExposure,
            o.status AS status
     ORDER BY o.due_date ASC`,
    { entityId, statusFilter: statusFilter ?? null },
  );

  return results;
}
