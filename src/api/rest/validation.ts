import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Express middleware factory: validates req.body against a Zod schema.
 * Returns 400 with structured errors on failure.
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// --- Journal Entry schemas ---

const ledgerLineSchema = z.object({
  side: z.enum(['DEBIT', 'CREDIT']),
  amount: z.number().positive(),
  nodeRefId: z.string().uuid(),
  nodeRefType: z.string().min(1),
  economicCategory: z.string().min(1),
  fundId: z.string().uuid().optional(),
  fxRate: z.number().positive().optional(),
});

export const postJournalEntrySchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  entryType: z.string().min(1),
  reference: z.string().min(1),
  narrative: z.string().min(1),
  currency: z.string().length(3),
  validDate: z.string().min(1),
  approvedBy: z.string().optional(),
  sourceSystem: z.string().optional(),
  lines: z.array(ledgerLineSchema).min(1),
});

// --- Period lifecycle ---

export const periodActionSchema = z.object({
  closedBy: z.string().min(1).optional(),
  reopenedBy: z.string().min(1).optional(),
});

// --- Provision ---

export const createProvisionSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  name: z.string().min(1),
  provisionType: z.enum([
    'WARRANTY', 'RESTRUCTURING', 'LEGAL_CLAIM',
    'ENVIRONMENTAL', 'ONEROUS_CONTRACT', 'DECOMMISSIONING',
  ]),
  probability: z.enum(['PROBABLE', 'POSSIBLE', 'REMOTE']),
  bestEstimate: z.number().nonnegative(),
  lowEstimate: z.number().nonnegative().optional(),
  highEstimate: z.number().nonnegative().optional(),
  discountRate: z.number().min(0).max(1).optional(),
  expectedSettlementDate: z.string().optional(),
  narrative: z.string().optional(),
});

// --- Temporal Claim ---

export const createTemporalClaimSchema = z.object({
  entityId: z.string().uuid(),
  periodId: z.string().uuid(),
  claimType: z.string().min(1),
  totalAmount: z.number().positive(),
  nodeRefId: z.string().uuid(),
  nodeRefType: z.string().min(1),
  economicCategory: z.string().min(1),
  counterNodeRefId: z.string().uuid(),
  counterNodeRefType: z.string().min(1),
  counterEconomicCategory: z.string().min(1),
  schedule: z.array(z.object({
    periodId: z.string().uuid(),
    amount: z.number().positive(),
  })).min(1),
  fundId: z.string().uuid().optional(),
  currency: z.string().length(3).optional(),
});
