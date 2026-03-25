import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { query } from '../../lib/pg.js';
import { emit } from '../../lib/kafka.js';
import { executeSaga, SagaStep } from '../../saga/saga-coordinator.js';
import { logger } from '../../lib/logger.js';
import {
  DoubleEntryViolation,
  FundRequiredError,
  PeriodClosedError,
} from '../../lib/errors.js';
import type { EntryType, Side, EconomicCategory, NodeRefType } from '../../schema/neo4j/types.js';

export interface PostJournalEntryInput {
  entityId: string;
  periodId: string;
  entryType: EntryType;
  reference: string;
  narrative: string;
  currency: string;
  validDate: string;
  approvedBy?: string;
  sourceSystem?: string;
  lines: {
    side: Side;
    amount: number;
    nodeRefId: string;
    nodeRefType: NodeRefType;
    economicCategory: EconomicCategory;
    fundId?: string;
    fxRate?: number;
  }[];
}

/**
 * Post a journal entry using the cross-store saga pattern.
 *
 * Steps:
 *   1. Validate double-entry, period status, fund requirements
 *   2. Write JournalEntry + LedgerLines to Neo4j
 *   3. Write audit_log to PostgreSQL
 *   4. Update gl_period_balances in TimescaleDB
 *   5. Emit JOURNAL_LINE_POSTED events to Kafka
 */
export async function postJournalEntry(input: PostJournalEntryInput): Promise<string> {
  const idempotencyKey = uuid();
  const journalEntryId = uuid();

  // --- Pre-validation ---
  const totalDebit = input.lines
    .filter((l) => l.side === 'DEBIT')
    .reduce((sum, l) => sum + l.amount, 0);
  const totalCredit = input.lines
    .filter((l) => l.side === 'CREDIT')
    .reduce((sum, l) => sum + l.amount, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new DoubleEntryViolation(totalDebit, totalCredit);
  }

  // Check period is open
  const periods = await runCypher<{ status: string; fund_accounting_enabled: boolean }>(
    `MATCH (p:AccountingPeriod {id: $periodId})
     MATCH (e:Entity {id: $entityId})
     RETURN p.status AS status, e.fund_accounting_enabled AS fund_accounting_enabled`,
    { periodId: input.periodId, entityId: input.entityId },
  );

  if (periods.length > 0) {
    const { status, fund_accounting_enabled } = periods[0];
    if (status !== 'OPEN') {
      throw new PeriodClosedError(input.periodId, status);
    }

    // Validate fund_id required for NFP entities
    if (fund_accounting_enabled) {
      for (const line of input.lines) {
        if (!line.fundId) {
          throw new FundRequiredError(input.entityId);
        }
      }
    }
  }

  // --- Build saga steps ---
  const steps: SagaStep[] = [
    // Step 1: Write to Neo4j
    {
      name: 'neo4j_write',
      execute: async (ctx) => {
        // Create JournalEntry
        await runCypher(
          `CREATE (j:JournalEntry {
            id: $id, entity_id: $entityId, period_id: $periodId,
            entry_type: $entryType, reference: $reference, narrative: $narrative,
            total_debit: $totalDebit, total_credit: $totalCredit,
            currency: $currency,
            valid_time_start: date($validDate), valid_time_end: null,
            transaction_time_start: datetime(), transaction_time_end: null,
            approval_status: $approvalStatus,
            approved_by: $approvedBy,
            idempotency_key: $idempotencyKey,
            source_system: $sourceSystem,
            created_at: datetime()
          })`,
          {
            id: journalEntryId,
            entityId: input.entityId,
            periodId: input.periodId,
            entryType: input.entryType,
            reference: input.reference,
            narrative: input.narrative,
            totalDebit: totalDebit,
            totalCredit: totalCredit,
            currency: input.currency,
            validDate: input.validDate,
            approvalStatus: input.approvedBy ? 'APPROVED' : 'PENDING',
            approvedBy: input.approvedBy ?? null,
            idempotencyKey: idempotencyKey,
            sourceSystem: input.sourceSystem ?? null,
          },
        );

        // Create LedgerLines
        const lineIds: string[] = [];
        for (const line of input.lines) {
          const lineId = uuid();
          lineIds.push(lineId);
          const functionalAmount = line.fxRate
            ? line.amount * line.fxRate
            : line.amount;

          await runCypher(
            `CREATE (l:LedgerLine {
              id: $id, journal_entry_id: $jeId,
              side: $side, amount: $amount,
              currency: $currency, functional_amount: $functionalAmount,
              fx_rate: $fxRate,
              node_ref_id: $nodeRefId, node_ref_type: $nodeRefType,
              economic_category: $economicCategory,
              fund_id: $fundId,
              created_at: datetime()
            })`,
            {
              id: lineId,
              jeId: journalEntryId,
              side: line.side,
              amount: line.amount,
              currency: input.currency,
              functionalAmount: functionalAmount,
              fxRate: line.fxRate ?? null,
              nodeRefId: line.nodeRefId,
              nodeRefType: line.nodeRefType,
              economicCategory: line.economicCategory,
              fundId: line.fundId ?? null,
            },
          );
        }

        ctx.data.lineIds = lineIds;
        return { journalEntryId, lineIds };
      },
      compensate: async () => {
        await runCypher(
          `MATCH (l:LedgerLine {journal_entry_id: $jeId}) DETACH DELETE l`,
          { jeId: journalEntryId },
        );
        await runCypher(
          `MATCH (j:JournalEntry {id: $id}) DETACH DELETE j`,
          { id: journalEntryId },
        );
        logger.info({ journalEntryId }, 'Neo4j write compensated');
      },
    },

    // Step 2: Write audit log to PostgreSQL
    {
      name: 'pg_audit',
      execute: async () => {
        const result = await query(
          `INSERT INTO audit_log (entity_id, action, node_type, node_id, user_id, details)
           VALUES ($1, 'CREATE', 'JournalEntry', $2, $3, $4)
           RETURNING id`,
          [
            input.entityId,
            journalEntryId,
            input.approvedBy ?? '00000000-0000-0000-0000-000000000000',
            JSON.stringify({
              entry_type: input.entryType,
              total_debit: totalDebit,
              total_credit: totalCredit,
              line_count: input.lines.length,
            }),
          ],
        );
        return result.rows[0]?.id;
      },
      compensate: async (ctx) => {
        const auditId = ctx.data.pg_audit;
        if (auditId) {
          await query('DELETE FROM audit_log WHERE id = $1', [auditId]);
        }
      },
    },

    // Step 3: Update gl_period_balances in TimescaleDB
    {
      name: 'timescale_projection',
      execute: async () => {
        for (const line of input.lines) {
          const debit = line.side === 'DEBIT' ? line.amount : 0;
          const credit = line.side === 'CREDIT' ? line.amount : 0;
          const functionalAmount = line.fxRate ? line.amount * line.fxRate : line.amount;
          const dFunctional = line.side === 'DEBIT' ? functionalAmount : 0;
          const cFunctional = line.side === 'CREDIT' ? functionalAmount : 0;

          await query(
            `INSERT INTO gl_period_balances
               (entity_id, period_id, fund_id, node_ref_id, node_ref_type,
                economic_category, debit_total, credit_total,
                net_balance, transaction_count)
             VALUES ($1, $2,
               COALESCE($3, '00000000-0000-0000-0000-000000000000'::uuid),
               $4, $5, $6, $7::numeric, $8::numeric, $7::numeric - $8::numeric, 1)
             ON CONFLICT (entity_id, period_id, fund_id, node_ref_id, economic_category)
             DO UPDATE SET
               debit_total = gl_period_balances.debit_total + $7::numeric,
               credit_total = gl_period_balances.credit_total + $8::numeric,
               net_balance = (gl_period_balances.debit_total + $7::numeric) -
                             (gl_period_balances.credit_total + $8::numeric),
               transaction_count = gl_period_balances.transaction_count + 1,
               last_updated = now()`,
            [
              input.entityId, input.periodId, line.fundId ?? null,
              line.nodeRefId, line.nodeRefType, line.economicCategory,
              dFunctional, cFunctional,
            ],
          );
        }
      },
      compensate: async () => {
        // Subtract amounts for each line
        for (const line of input.lines) {
          const functionalAmount = line.fxRate ? line.amount * line.fxRate : line.amount;
          const dFunctional = line.side === 'DEBIT' ? functionalAmount : 0;
          const cFunctional = line.side === 'CREDIT' ? functionalAmount : 0;

          await query(
            `UPDATE gl_period_balances SET
               debit_total = debit_total - $5::numeric,
               credit_total = credit_total - $6::numeric,
               net_balance = (debit_total - $5::numeric) - (credit_total - $6::numeric),
               transaction_count = transaction_count - 1,
               last_updated = now()
             WHERE entity_id = $1 AND period_id = $2
               AND fund_id = COALESCE($3, '00000000-0000-0000-0000-000000000000'::uuid)
               AND node_ref_id = $4`,
            [input.entityId, input.periodId, line.fundId ?? null, line.nodeRefId,
             dFunctional, cFunctional],
          );
        }
      },
    },

    // Step 4: Emit to Kafka (last step — retried, not compensable)
    {
      name: 'kafka_emit',
      execute: async () => {
        for (let i = 0; i < input.lines.length; i++) {
          const line = input.lines[i];
          const lineId = (ctx_data_lineIds as string[])[i];
          await emit('ebg.gl', {
            event_id: uuid(),
            event_type: 'JOURNAL_LINE_POSTED',
            sequence_number: i,
            idempotency_key: `${idempotencyKey}-line-${i}`,
            entity_id: input.entityId,
            period_id: input.periodId,
            timestamp: new Date().toISOString(),
            payload: {
              journal_entry_id: journalEntryId,
              ledger_line_id: lineId,
              entity_id: input.entityId,
              period_id: input.periodId,
              fund_id: line.fundId ?? null,
              node_ref_id: line.nodeRefId,
              node_ref_type: line.nodeRefType,
              economic_category: line.economicCategory,
              side: line.side,
              functional_amount: line.fxRate
                ? line.amount * line.fxRate
                : line.amount,
            },
          });
        }
      },
      compensate: async () => {
        // Cannot un-emit; emit cancellation event instead
        await emit('ebg.gl', {
          event_id: uuid(),
          event_type: 'JOURNAL_ENTRY_CANCELLED',
          sequence_number: 0,
          idempotency_key: `${idempotencyKey}-cancel`,
          entity_id: input.entityId,
          period_id: input.periodId,
          timestamp: new Date().toISOString(),
          payload: { journal_entry_id: journalEntryId },
        });
      },
    },
  ];

  // Reference to lineIds from context — fix the closure
  let ctx_data_lineIds: string[] = [];
  const originalSteps = [...steps];
  originalSteps[3] = {
    ...steps[3],
    execute: async (ctx) => {
      ctx_data_lineIds = ctx.data.neo4j_write
        ? (ctx.data.neo4j_write as { lineIds: string[] }).lineIds
        : [];
      return steps[3].execute(ctx);
    },
  };

  const result = await executeSaga(originalSteps, { journalEntryId });

  logger.info(
    { journalEntryId, lineCount: input.lines.length, totalDebit },
    'Journal entry posted successfully',
  );

  return journalEntryId;
}
