/**
 * Float Sync Scheduler
 *
 * Runs periodic sync for all entities with float.sync_enabled=true.
 * Pattern matches nightly-reconciliation-service.ts scheduler.
 */
import { query } from '../../lib/pg.js';
import { resolveConfig } from '../config/configuration-service.js';
import { runFullFloatSync } from './float-sync-service.js';
import { pushGlCodesToFloat, pushVendorsToFloat } from './float-push-service.js';
import { logger } from '../../lib/logger.js';
import { runCypher } from '../../lib/neo4j.js';

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Find entities with float.sync_enabled = true.
 */
async function getEnabledEntities(): Promise<string[]> {
  const result = await query<{ scope_id: string }>(
    `SELECT scope_id FROM configuration_settings
     WHERE setting_key = 'float.sync_enabled'
       AND value_boolean = true
       AND scope_type = 'ENTITY'
       AND valid_from <= CURRENT_DATE
       AND (valid_until IS NULL OR valid_until > CURRENT_DATE)`,
  );
  return result.rows.map((r) => r.scope_id);
}

/**
 * Find the current open accounting period for an entity.
 */
async function getCurrentPeriodId(entityId: string): Promise<string | null> {
  const result = await runCypher<{ pid: string }>(
    `MATCH (p:AccountingPeriod {entity_id: $entityId})
     WHERE p.status IN ['OPEN', 'SOFT_CLOSED']
       AND p.start_date <= date()
       AND p.end_date >= date()
     RETURN p.id AS pid
     LIMIT 1`,
    { entityId },
  );
  return result[0]?.pid ?? null;
}

async function runScheduledSync(): Promise<void> {
  const entityIds = await getEnabledEntities();
  if (entityIds.length === 0) return;

  logger.info({ entities: entityIds.length }, 'Starting scheduled Float sync');

  for (const entityId of entityIds) {
    try {
      const periodId = await getCurrentPeriodId(entityId);
      if (!periodId) {
        logger.warn({ entityId }, 'No open accounting period for Float sync — skipping');
        continue;
      }

      // Inbound: Float → EBG
      const results = await runFullFloatSync(entityId, periodId);
      const totalImported = results.reduce((s, r) => s + r.itemsImported, 0);

      // Outbound: EBG → Float
      await pushGlCodesToFloat(entityId);
      await pushVendorsToFloat(entityId);

      logger.info({ entityId, totalImported }, 'Scheduled Float sync completed');
    } catch (err) {
      logger.error({ entityId, err }, 'Scheduled Float sync failed');
    }
  }
}

/**
 * Start the Float sync scheduler.
 */
export function startFloatSyncScheduler(
  intervalMs = 24 * 60 * 60 * 1000,
): void {
  if (schedulerInterval) {
    logger.warn('Float sync scheduler already running');
    return;
  }

  logger.info({ intervalMs }, 'Starting Float sync scheduler');

  schedulerInterval = setInterval(async () => {
    await runScheduledSync();
  }, intervalMs);

  schedulerInterval.unref();
}

/**
 * Stop the Float sync scheduler.
 */
export function stopFloatSyncScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('Float sync scheduler stopped');
  }
}
