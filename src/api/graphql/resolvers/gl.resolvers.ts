import { GraphQLError } from 'graphql';
import { runCypher } from '../../../lib/neo4j.js';
import { query } from '../../../lib/pg.js';
import { postJournalEntry } from '../../../services/gl/journal-posting-service.js';
import { softClosePeriod, hardClosePeriod, reopenPeriod } from '../../../services/gl/period-service.js';
import { getProfitAndLoss, getBalanceSheet, getFundBalances, getOutcomeAttributedPnL } from '../../../services/gl/reporting-service.js';
import { getSegmentReport, getSegmentDetail } from '../../../services/gl/segment-reporting-service.js';
import {
  createTemporalClaim,
  getTemporalClaim,
  listTemporalClaims,
  recognizeClaim,
  recognizeAllClaims,
  autoReverseClaims,
  updateECL,
  writeOffClaim,
} from '../../../services/gl/accruals-service.js';
import {
  createStatutoryMapping,
  getStatutoryMapping,
} from '../../../services/gl/statutory-mapping-service.js';
import {
  createLease,
  getRightOfUseAsset,
  listRightOfUseAssets,
  getLeaseLiability,
  listLeaseLiabilities,
  processLeasePayment,
} from '../../../services/gl/lease-service.js';
import {
  createProvision,
  getProvision,
  listProvisions,
  recognizeProvision,
  unwindProvisionDiscount,
  settleProvision,
} from '../../../services/gl/provision-service.js';
import {
  createRelatedParty,
  getRelatedParties,
  createRelatedPartyTransaction,
  validateArmsLength,
} from '../../../services/gl/related-party-service.js';
import {
  computeRetainedEarnings,
  getRetainedEarnings,
  recordOCI,
  recycleOCI,
  getOCIComponents,
  generateEquitySection,
  getEquitySection,
  getEquityBreakdown,
} from '../../../services/gl/equity-close-service.js';
import type { TemporalClaimStatus, ProbabilityOfOutflow, ArmsLengthMethod } from '../../../schema/neo4j/types.js';

function wrapError(err: unknown): GraphQLError {
  if (err instanceof GraphQLError) return err;
  return new GraphQLError((err as Error).message, {
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  });
}

export const glResolvers = {
  Query: {
    journalEntry: async (_: unknown, { id }: { id: string }) => {
      try {
        const results = await runCypher<{ je: Record<string, unknown> }>(
          `MATCH (j:JournalEntry {id: $id}) RETURN properties(j) AS je`,
          { id },
        );
        if (results.length === 0) return null;
        return results[0].je;
      } catch (err) { throw wrapError(err); }
    },

    journalEntries: async (_: unknown, { entityId, periodId }: { entityId: string; periodId?: string }) => {
      try {
        const params: Record<string, unknown> = { entityId };
        let where = `j.entity_id = $entityId`;
        if (periodId) {
          where += ` AND j.period_id = $periodId`;
          params.periodId = periodId;
        }
        const results = await runCypher<{ je: Record<string, unknown> }>(
          `MATCH (j:JournalEntry) WHERE ${where} RETURN properties(j) AS je ORDER BY j.created_at`,
          params,
        );
        return results.map((r) => r.je);
      } catch (err) { throw wrapError(err); }
    },

    profitAndLoss: async (_: unknown, { entityId, periodId, fundId }: { entityId: string; periodId: string; fundId?: string }) => {
      try {
        return await getProfitAndLoss(entityId, periodId, fundId ?? undefined);
      } catch (err) { throw wrapError(err); }
    },

    balanceSheet: async (_: unknown, { entityId, periodId, fundId }: { entityId: string; periodId: string; fundId?: string }) => {
      try {
        return await getBalanceSheet(entityId, periodId, fundId ?? undefined);
      } catch (err) { throw wrapError(err); }
    },

    trialBalance: async (_: unknown, { entityId, periodId }: { entityId: string; periodId: string }) => {
      try {
        const result = await query<{
          economic_category: string;
          total_debit: string;
          total_credit: string;
          net_balance: string;
        }>(
          `SELECT economic_category,
                  SUM(debit_total) AS total_debit,
                  SUM(credit_total) AS total_credit,
                  SUM(net_balance) AS net_balance
           FROM gl_period_balances
           WHERE entity_id = $1 AND period_id = $2
           GROUP BY economic_category
           ORDER BY economic_category`,
          [entityId, periodId],
        );
        return result.rows.map((r) => ({
          economic_category: r.economic_category,
          total_debit: Number(r.total_debit),
          total_credit: Number(r.total_credit),
          net_balance: Number(r.net_balance),
        }));
      } catch (err) { throw wrapError(err); }
    },

    periodBalances: async (_: unknown, { entityId, periodId }: { entityId: string; periodId: string }) => {
      try {
        const result = await query<Record<string, unknown>>(
          `SELECT entity_id, period_id, fund_id, node_ref_id, node_ref_type,
                  economic_category, debit_total, credit_total, net_balance, transaction_count
           FROM gl_period_balances
           WHERE entity_id = $1 AND period_id = $2
           ORDER BY economic_category, node_ref_type`,
          [entityId, periodId],
        );
        return result.rows.map((r) => ({
          entity_id: r.entity_id,
          period_id: r.period_id,
          fund_id: r.fund_id,
          node_ref_id: r.node_ref_id,
          node_ref_type: r.node_ref_type,
          economic_category: r.economic_category,
          debit_total: Number(r.debit_total),
          credit_total: Number(r.credit_total),
          net_balance: Number(r.net_balance),
          transaction_count: Number(r.transaction_count),
        }));
      } catch (err) { throw wrapError(err); }
    },

    fundBalances: async (_: unknown, { entityId, periodId }: { entityId: string; periodId: string }) => {
      try {
        return await getFundBalances(entityId, periodId);
      } catch (err) { throw wrapError(err); }
    },

    outcomeAttributedPnL: async (_: unknown, { entityId, periodId, maxHops }: { entityId: string; periodId: string; maxHops?: number }) => {
      try {
        return await getOutcomeAttributedPnL(entityId, periodId, maxHops ?? 6);
      } catch (err) { throw wrapError(err); }
    },

    temporalClaim: async (_: unknown, { id }: { id: string }) => {
      try {
        return await getTemporalClaim(id);
      } catch (err) { throw wrapError(err); }
    },

    temporalClaims: async (_: unknown, { entityId, status }: { entityId: string; status?: TemporalClaimStatus }) => {
      try {
        return await listTemporalClaims(entityId, status ?? undefined);
      } catch (err) { throw wrapError(err); }
    },

    provision: async (_: unknown, { id }: { id: string }) => {
      try {
        return await getProvision(id);
      } catch (err) { throw wrapError(err); }
    },

    provisions: async (_: unknown, { entityId, probability }: { entityId: string; probability?: ProbabilityOfOutflow }) => {
      try {
        return await listProvisions(entityId, probability ?? undefined);
      } catch (err) { throw wrapError(err); }
    },

    rouAsset: async (_: unknown, { id }: { id: string }) => {
      try {
        return await getRightOfUseAsset(id);
      } catch (err) { throw wrapError(err); }
    },

    rouAssets: async (_: unknown, { entityId }: { entityId: string }) => {
      try {
        return await listRightOfUseAssets(entityId);
      } catch (err) { throw wrapError(err); }
    },

    leaseLiability: async (_: unknown, { id }: { id: string }) => {
      try {
        return await getLeaseLiability(id);
      } catch (err) { throw wrapError(err); }
    },

    leaseLiabilities: async (_: unknown, { entityId }: { entityId: string }) => {
      try {
        return await listLeaseLiabilities(entityId);
      } catch (err) { throw wrapError(err); }
    },

    relatedParties: async (_: unknown, { entityId }: { entityId: string }) => {
      try {
        return await getRelatedParties(entityId);
      } catch (err) { throw wrapError(err); }
    },

    retainedEarnings: async (_: unknown, { entityId, periodId }: { entityId: string; periodId: string }) => {
      try {
        return await getRetainedEarnings(entityId, periodId);
      } catch (err) { throw wrapError(err); }
    },

    ociComponents: async (_: unknown, { entityId, periodId }: { entityId: string; periodId: string }) => {
      try {
        return await getOCIComponents(entityId, periodId);
      } catch (err) { throw wrapError(err); }
    },

    equitySection: async (_: unknown, { entityId, periodId }: { entityId: string; periodId: string }) => {
      try {
        return await getEquitySection(entityId, periodId);
      } catch (err) { throw wrapError(err); }
    },

    equityBreakdown: async (_: unknown, { entityId, periodId }: { entityId: string; periodId: string }) => {
      try {
        return await getEquityBreakdown(entityId, periodId);
      } catch (err) { throw wrapError(err); }
    },

    segmentReport: async (_: unknown, { entityId, periodId, fundId }: { entityId: string; periodId: string; fundId?: string }) => {
      try {
        return await getSegmentReport(entityId, periodId, fundId);
      } catch (err) { throw wrapError(err); }
    },

    segmentDetail: async (_: unknown, { entityId, periodId, initiativeId, fundId }: { entityId: string; periodId: string; initiativeId: string; fundId?: string }) => {
      try {
        return await getSegmentDetail(entityId, periodId, initiativeId, fundId);
      } catch (err) { throw wrapError(err); }
    },
  },

  Mutation: {
    postJournalEntry: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      try {
        const jeId = await postJournalEntry({
          entityId: input.entityId as string,
          periodId: input.periodId as string,
          entryType: input.entryType as any,
          reference: input.reference as string,
          narrative: input.narrative as string,
          currency: input.currency as string,
          validDate: input.validDate as string,
          approvedBy: input.approvedBy as string | undefined,
          sourceSystem: input.sourceSystem as string | undefined,
          lines: (input.lines as Array<Record<string, unknown>>).map((l) => ({
            side: l.side as any,
            amount: l.amount as number,
            nodeRefId: l.nodeRefId as string,
            nodeRefType: l.nodeRefType as any,
            economicCategory: l.economicCategory as any,
            fundId: l.fundId as string | undefined,
            fxRate: l.fxRate as number | undefined,
          })),
        });

        // Fetch the created journal entry
        const results = await runCypher<{ je: Record<string, unknown> }>(
          `MATCH (j:JournalEntry {id: $id}) RETURN properties(j) AS je`,
          { id: jeId },
        );
        return results[0]?.je ?? { id: jeId };
      } catch (err) { throw wrapError(err); }
    },

    softClosePeriod: async (_: unknown, { periodId, closedBy }: { periodId: string; closedBy: string }): Promise<{ periodId: string; previousStatus: string; newStatus: string }> => {
      try {
        return await softClosePeriod(periodId, closedBy);
      } catch (err) { throw wrapError(err); }
    },

    hardClosePeriod: async (_: unknown, { periodId, closedBy }: { periodId: string; closedBy: string }): Promise<{ periodId: string; previousStatus: string; newStatus: string }> => {
      try {
        return await hardClosePeriod(periodId, closedBy);
      } catch (err) { throw wrapError(err); }
    },

    reopenPeriod: async (_: unknown, { periodId, reopenedBy }: { periodId: string; reopenedBy: string }): Promise<{ periodId: string; previousStatus: string; newStatus: string }> => {
      try {
        return await reopenPeriod(periodId, reopenedBy);
      } catch (err) { throw wrapError(err); }
    },

    createStatutoryMapping: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      try {
        const id = await createStatutoryMapping({
          jurisdiction: input.jurisdiction as string,
          nodeRefType: input.nodeRefType as string,
          economicCategory: input.economicCategory as string,
          nodeTagsMatch: input.nodeTagsMatch as string[] | undefined,
          statutoryAccountCode: input.statutoryAccountCode as string,
          statutoryAccountLabel: input.statutoryAccountLabel as string,
          appliesFrom: input.appliesFrom as string,
          appliesUntil: input.appliesUntil as string | undefined,
          xbrlElement: input.xbrlElement as string | undefined,
          xbrlTaxonomy: input.xbrlTaxonomy as string | undefined,
        });
        const mapping = await getStatutoryMapping(id);
        return mapping;
      } catch (err) { throw wrapError(err); }
    },

    createTemporalClaim: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      try {
        const id = await createTemporalClaim({
          entityId: input.entityId as string,
          claimType: input.claimType as any,
          direction: input.direction as any,
          originalAmount: input.originalAmount as number,
          currency: input.currency as string,
          recognitionMethod: input.recognitionMethod as any,
          recognitionSchedule: (input.recognitionSchedule as Array<Record<string, unknown>>).map((e) => ({
            period_id: e.period_id as string,
            amount: e.amount as number,
          })),
          sourceNodeId: input.sourceNodeId as string,
          sourceNodeType: input.sourceNodeType as any,
          periodIdOpened: input.periodIdOpened as string,
          autoReverse: input.autoReverse as boolean,
          collectabilityScore: input.collectabilityScore as number | undefined,
          eclAllowance: input.eclAllowance as number | undefined,
          eclStage: input.eclStage as any,
          taxRecognitionBasis: input.taxRecognitionBasis as any,
          settlementNodeId: input.settlementNodeId as string | undefined,
          outcomeNodeId: input.outcomeNodeId as string | undefined,
        });
        return await getTemporalClaim(id);
      } catch (err) { throw wrapError(err); }
    },

    recognizeClaim: async (_: unknown, { claimId, periodId }: { claimId: string; periodId: string }) => {
      try {
        return await recognizeClaim(claimId, periodId);
      } catch (err) { throw wrapError(err); }
    },

    recognizeAllClaims: async (_: unknown, { entityId, periodId }: { entityId: string; periodId: string }) => {
      try {
        return await recognizeAllClaims(entityId, periodId);
      } catch (err) { throw wrapError(err); }
    },

    autoReverseClaims: async (_: unknown, { entityId, currentPeriodId, previousPeriodId }: { entityId: string; currentPeriodId: string; previousPeriodId: string }) => {
      try {
        return await autoReverseClaims(entityId, currentPeriodId, previousPeriodId);
      } catch (err) { throw wrapError(err); }
    },

    updateECL: async (_: unknown, { claimId, collectabilityScore, eclAllowance }: { claimId: string; collectabilityScore: number; eclAllowance: number }) => {
      try {
        return await updateECL(claimId, collectabilityScore, eclAllowance);
      } catch (err) { throw wrapError(err); }
    },

    writeOffClaim: async (_: unknown, { claimId }: { claimId: string }) => {
      try {
        return await writeOffClaim(claimId);
      } catch (err) { throw wrapError(err); }
    },

    createLease: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      try {
        return await createLease({
          entityId: input.entityId as string,
          label: input.label as string,
          leaseClassification: input.leaseClassification as any,
          totalLeasePayments: input.totalLeasePayments as number,
          leaseTermMonths: input.leaseTermMonths as number,
          monthlyPayment: input.monthlyPayment as number,
          incrementalBorrowingRate: input.incrementalBorrowingRate as number,
          commencementDate: input.commencementDate as string,
          leaseEndDate: input.leaseEndDate as string,
          periodSchedule: (input.periodSchedule as Array<Record<string, unknown>>).map((e) => ({
            periodId: e.periodId as string,
            paymentDate: e.paymentDate as string,
          })),
          activityRefId: input.activityRefId as string | undefined,
        });
      } catch (err) { throw wrapError(err); }
    },

    processLeasePayment: async (_: unknown, { leaseLiabilityId, rouAssetId, periodId }: { leaseLiabilityId: string; rouAssetId: string; periodId: string }) => {
      try {
        return await processLeasePayment(leaseLiabilityId, rouAssetId, periodId);
      } catch (err) { throw wrapError(err); }
    },

    createProvision: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      try {
        const id = await createProvision({
          entityId: input.entityId as string,
          label: input.label as string,
          provisionType: input.provisionType as any,
          presentObligationBasis: input.presentObligationBasis as string,
          probabilityOfOutflow: input.probabilityOfOutflow as any,
          bestEstimate: input.bestEstimate as number,
          rangeLow: input.rangeLow as number | undefined,
          rangeHigh: input.rangeHigh as number | undefined,
          discountRate: input.discountRate as number | undefined,
          expectedSettlementDate: input.expectedSettlementDate as string | undefined,
          reimbursementAssetId: input.reimbursementAssetId as string | undefined,
        });
        return await getProvision(id);
      } catch (err) { throw wrapError(err); }
    },

    recognizeProvision: async (_: unknown, { provisionId, periodId }: { provisionId: string; periodId: string }) => {
      try {
        return await recognizeProvision(provisionId, periodId);
      } catch (err) { throw wrapError(err); }
    },

    unwindProvisionDiscount: async (_: unknown, { provisionId, periodId }: { provisionId: string; periodId: string }) => {
      try {
        return await unwindProvisionDiscount(provisionId, periodId);
      } catch (err) { throw wrapError(err); }
    },

    settleProvision: async (_: unknown, { provisionId, periodId, actualAmount }: { provisionId: string; periodId: string; actualAmount: number }) => {
      try {
        return await settleProvision(provisionId, periodId, actualAmount);
      } catch (err) { throw wrapError(err); }
    },

    createRelatedParty: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      try {
        return await createRelatedParty({
          sourceEntityId: input.sourceEntityId as string,
          targetEntityId: input.targetEntityId as string,
          relationshipType: input.relationshipType as any,
          individualsInCommon: input.individualsInCommon as string[],
          effectiveFrom: input.effectiveFrom as string,
          effectiveUntil: input.effectiveUntil as string | undefined,
          disclosureRequired: input.disclosureRequired as boolean | undefined,
        });
      } catch (err) { throw wrapError(err); }
    },

    createRelatedPartyTransaction: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      try {
        return await createRelatedPartyTransaction({
          sourceJournalEntryId: input.sourceJournalEntryId as string,
          targetJournalEntryId: input.targetJournalEntryId as string,
          transactionNature: input.transactionNature as any,
          sourceEntityId: input.sourceEntityId as string,
          targetEntityId: input.targetEntityId as string,
          armsLengthValidated: input.armsLengthValidated as boolean | undefined,
          armsLengthMethod: input.armsLengthMethod as any,
          taxDeductibleForSource: input.taxDeductibleForSource as boolean | undefined,
          donationReceiptIssued: input.donationReceiptIssued as boolean | undefined,
        });
      } catch (err) { throw wrapError(err); }
    },

    validateArmsLength: async (_: unknown, { entityId, periodId, method, tolerancePct }: { entityId: string; periodId: string; method: ArmsLengthMethod; tolerancePct?: number }) => {
      try {
        return await validateArmsLength(entityId, periodId, method, tolerancePct ?? undefined);
      } catch (err) { throw wrapError(err); }
    },

    computeRetainedEarnings: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      try {
        const id = await computeRetainedEarnings({
          entityId: input.entityId as string,
          periodId: input.periodId as string,
          fundId: input.fundId as string | undefined,
          dividendsDeclared: input.dividendsDeclared as number | undefined,
          otherAdjustments: input.otherAdjustments as number | undefined,
        });
        return await getRetainedEarnings(input.entityId as string, input.periodId as string, input.fundId as string | undefined);
      } catch (err) { throw wrapError(err); }
    },

    recordOCI: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      try {
        const id = await recordOCI({
          entityId: input.entityId as string,
          periodId: input.periodId as string,
          component: input.component as any,
          currentPeriod: input.currentPeriod as number,
          sourceNodeId: input.sourceNodeId as string | undefined,
          sourceNodeType: input.sourceNodeType as any,
        });
        const results = await runCypher<{ oci: Record<string, unknown> }>(
          `MATCH (oci:OtherComprehensiveIncome {id: $id}) RETURN properties(oci) AS oci`,
          { id },
        );
        return results[0]?.oci ?? null;
      } catch (err) { throw wrapError(err); }
    },

    recycleOCI: async (_: unknown, { ociId, amount }: { ociId: string; amount: number }) => {
      try {
        return await recycleOCI(ociId, amount);
      } catch (err) { throw wrapError(err); }
    },

    generateEquitySection: async (_: unknown, { entityId, periodId, nciEquity }: { entityId: string; periodId: string; nciEquity?: number }) => {
      try {
        await generateEquitySection(entityId, periodId, nciEquity ?? undefined);
        return await getEquitySection(entityId, periodId);
      } catch (err) { throw wrapError(err); }
    },
  },

  // Nested resolver: JournalEntry.lines fetches associated LedgerLines
  JournalEntry: {
    lines: async (parent: { id: string }) => {
      try {
        const results = await runCypher<{ l: Record<string, unknown> }>(
          `MATCH (l:LedgerLine {journal_entry_id: $jeId}) RETURN properties(l) AS l ORDER BY l.created_at`,
          { jeId: parent.id },
        );
        return results.map((r) => r.l);
      } catch (err) { throw wrapError(err); }
    },
  },
};
