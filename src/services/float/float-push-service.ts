/**
 * Float Outbound Push Service
 *
 * Pushes EBG data → Float Financial:
 * - Activity nodes → Float GL codes (so card users can categorize spend)
 * - Vendors → Float vendors
 * - Tax codes → Float tax codes
 */
import { v4 as uuid } from 'uuid';
import { createFloatClient, floatPost, type FloatClientConfig, type FloatGLCode } from './float-api-client.js';
import { getFloatIdForEbg, setFloatMapping, recordSyncRun, type FloatType } from './float-mapping-service.js';
import { listActivities } from '../graph/graph-crud-service.js';
import { listVendors } from '../gl/ap-subledger-service.js';
import { emit } from '../../lib/kafka.js';
import { logger } from '../../lib/logger.js';

// ── Types ────────────────────────────────────────────────────

export interface FloatPushResult {
  pushRunId: string;
  entityId: string;
  pushType: string;
  itemsPushed: number;
  itemsSkipped: number;
  itemsFailed: number;
  errors: Array<{ floatId: string; error: string }>;
  durationMs: number;
}

// ── Push GL Codes ────────────────────────────────────────────

export async function pushGlCodesToFloat(entityId: string): Promise<FloatPushResult> {
  const start = Date.now();
  const config = await createFloatClient(entityId);
  const activities = await listActivities(entityId) as Array<{ id: string; label: string }>;
  const errors: Array<{ floatId: string; error: string }> = [];
  let pushed = 0;
  let skipped = 0;

  for (const activity of activities) {
    try {
      const existing = await getFloatIdForEbg(entityId, 'GL_CODE', activity.id);
      if (existing) {
        skipped++;
        continue;
      }

      const result = await floatPost<FloatGLCode>(config, '/gl-codes', {
        items: [{
          code: activity.id.slice(0, 8),
          name: activity.label,
        }],
      });

      // Float returns created items — map the first one
      const created = Array.isArray(result) ? result[0] : result;
      if (created?.id) {
        await setFloatMapping(entityId, 'GL_CODE', created.id, activity.id, 'Activity');
        pushed++;
        logger.info({ activityId: activity.id, floatGlCodeId: created.id }, 'Pushed GL code to Float');
      }
    } catch (err: any) {
      errors.push({ floatId: activity.id, error: err.message });
      logger.warn({ activityId: activity.id, err }, 'Failed to push GL code to Float');
    }
  }

  const durationMs = Date.now() - start;
  const pushRunId = await recordSyncRun({
    entityId,
    syncType: 'GL_CODES',
    direction: 'OUTBOUND',
    itemsFetched: activities.length,
    itemsImported: pushed,
    itemsSkipped: skipped,
    itemsFailed: errors.length,
    errors,
    durationMs,
  });

  await emitPushCompleted(entityId, 'GL_CODES', { pushRunId, pushed, skipped, failed: errors.length });

  return { pushRunId, entityId, pushType: 'GL_CODES', itemsPushed: pushed, itemsSkipped: skipped, itemsFailed: errors.length, errors, durationMs };
}

// ── Push Vendors ─────────────────────────────────────────────

export async function pushVendorsToFloat(entityId: string): Promise<FloatPushResult> {
  const start = Date.now();
  const config = await createFloatClient(entityId);
  const vendors = await listVendors(entityId, 'ACTIVE');
  const errors: Array<{ floatId: string; error: string }> = [];
  let pushed = 0;
  let skipped = 0;

  for (const vendor of vendors) {
    try {
      const existing = await getFloatIdForEbg(entityId, 'VENDOR', vendor.id);
      if (existing) {
        skipped++;
        continue;
      }

      const result = await floatPost<any>(config, '/vendors', {
        items: [{ name: vendor.name }],
      });

      const created = Array.isArray(result) ? result[0] : result;
      if (created?.id) {
        await setFloatMapping(entityId, 'VENDOR', created.id, vendor.id, 'Vendor');
        pushed++;
        logger.info({ vendorId: vendor.id, floatVendorId: created.id }, 'Pushed vendor to Float');
      }
    } catch (err: any) {
      errors.push({ floatId: vendor.id, error: err.message });
      logger.warn({ vendorId: vendor.id, err }, 'Failed to push vendor to Float');
    }
  }

  const durationMs = Date.now() - start;
  const pushRunId = await recordSyncRun({
    entityId,
    syncType: 'VENDORS',
    direction: 'OUTBOUND',
    itemsFetched: vendors.length,
    itemsImported: pushed,
    itemsSkipped: skipped,
    itemsFailed: errors.length,
    errors,
    durationMs,
  });

  await emitPushCompleted(entityId, 'VENDORS', { pushRunId, pushed, skipped, failed: errors.length });

  return { pushRunId, entityId, pushType: 'VENDORS', itemsPushed: pushed, itemsSkipped: skipped, itemsFailed: errors.length, errors, durationMs };
}

// ── Push Tax Codes ───────────────────────────────────────────

export async function pushTaxCodesToFloat(entityId: string): Promise<FloatPushResult> {
  const start = Date.now();
  // Tax codes are a future extension — for now return a no-op result
  const durationMs = Date.now() - start;
  return {
    pushRunId: uuid(),
    entityId,
    pushType: 'TAX_CODES',
    itemsPushed: 0,
    itemsSkipped: 0,
    itemsFailed: 0,
    errors: [],
    durationMs,
  };
}

// ── Kafka events ─────────────────────────────────────────────

async function emitPushCompleted(entityId: string, pushType: string, payload: unknown): Promise<void> {
  try {
    await emit('ebg.integrations', {
      event_id: uuid(),
      event_type: 'FLOAT_PUSH_COMPLETED',
      sequence_number: 0,
      idempotency_key: `float-push-${entityId}-${pushType}-${Date.now()}`,
      entity_id: entityId,
      timestamp: new Date().toISOString(),
      payload,
    });
  } catch {
    // Non-critical — don't fail the push over Kafka
  }
}
