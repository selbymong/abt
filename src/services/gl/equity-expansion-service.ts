import { v4 as uuid } from 'uuid';
import { runCypher } from '../../lib/neo4j.js';
import { postJournalEntry } from './journal-posting-service.js';
import type {
  ShareClassType,
  AwardType,
  AwardStatus,
  VestingType,
} from '../../schema/neo4j/types.js';

// ============================================================
// ShareClass CRUD
// ============================================================

export interface CreateShareClassInput {
  entityId: string;
  label: string;
  shareClassType: ShareClassType;
  parValue: number;
  authorizedShares: number;
  issuedShares?: number;
  currency: string;
  isVoting?: boolean;
  dividendRate?: number;
  isCumulativeDividend?: boolean;
  liquidationPreference?: number;
  conversionRatio?: number;
  isParticipating?: boolean;
}

export async function createShareClass(input: CreateShareClassInput): Promise<string> {
  const id = uuid();
  const issued = input.issuedShares ?? 0;
  const shareCapital = Math.round(issued * input.parValue * 100) / 100;

  await runCypher(
    `CREATE (sc:ShareClass {
      id: $id, entity_id: $entityId, label: $label,
      share_class_type: $type, par_value: $parValue,
      authorized_shares: $authorized, issued_shares: $issued,
      outstanding_shares: $issued, treasury_shares: 0,
      share_capital_amount: $shareCapital,
      currency: $currency, is_voting: $isVoting,
      dividend_rate: $dividendRate,
      is_cumulative_dividend: $isCumulative,
      liquidation_preference: $liquidationPref,
      conversion_ratio: $conversionRatio,
      is_participating: $isParticipating,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      label: input.label,
      type: input.shareClassType,
      parValue: input.parValue,
      authorized: input.authorizedShares,
      issued,
      shareCapital,
      currency: input.currency,
      isVoting: input.isVoting ?? true,
      dividendRate: input.dividendRate ?? null,
      isCumulative: input.isCumulativeDividend ?? false,
      liquidationPref: input.liquidationPreference ?? null,
      conversionRatio: input.conversionRatio ?? null,
      isParticipating: input.isParticipating ?? false,
    },
  );
  return id;
}

export async function getShareClass(id: string) {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (sc:ShareClass {id: $id}) RETURN properties(sc) AS sc`,
    { id },
  );
  return rows.length > 0 ? rows[0].sc : null;
}

export async function listShareClasses(entityId: string) {
  return runCypher<Record<string, any>>(
    `MATCH (sc:ShareClass {entity_id: $entityId})
     RETURN properties(sc) AS sc ORDER BY sc.share_class_type`,
    { entityId },
  ).then(rows => rows.map(r => r.sc));
}

/**
 * Issue additional shares (e.g., from stock offering or award exercise).
 */
export async function issueShares(
  shareClassId: string,
  additionalShares: number,
  pricePerShare: number,
): Promise<{ newIssued: number; newShareCapital: number }> {
  const sc = await getShareClass(shareClassId);
  if (!sc) throw new Error('ShareClass not found');

  const currentIssued = Number(sc.issued_shares);
  const authorized = Number(sc.authorized_shares);
  if (currentIssued + additionalShares > authorized) {
    throw new Error(`Cannot issue ${additionalShares} shares: exceeds authorized limit of ${authorized}`);
  }

  const parValue = Number(sc.par_value);
  const additionalCapital = Math.round(additionalShares * parValue * 100) / 100;
  const newIssued = currentIssued + additionalShares;
  const newShareCapital = Math.round(Number(sc.share_capital_amount) + additionalCapital);

  await runCypher(
    `MATCH (sc:ShareClass {id: $id})
     SET sc.issued_shares = $issued,
         sc.outstanding_shares = sc.outstanding_shares + $additional,
         sc.share_capital_amount = $shareCapital,
         sc.updated_at = datetime()`,
    { id: shareClassId, issued: newIssued, additional: additionalShares, shareCapital: newShareCapital },
  );

  return { newIssued, newShareCapital };
}

/**
 * Get total share capital for an entity (sum across all share classes).
 */
export async function getTotalShareCapital(entityId: string): Promise<number> {
  const rows = await runCypher<{ total: number }>(
    `MATCH (sc:ShareClass {entity_id: $entityId})
     RETURN COALESCE(SUM(sc.share_capital_amount), 0) AS total`,
    { entityId },
  );
  return Number(rows[0]?.total ?? 0);
}

// ============================================================
// EquityAward CRUD (IFRS 2)
// ============================================================

export interface CreateEquityAwardInput {
  entityId: string;
  shareClassId: string;
  label: string;
  awardType: AwardType;
  grantDate: string;
  vestingType: VestingType;
  vestingPeriodMonths: number;
  cliffMonths?: number;
  sharesGranted: number;
  exercisePrice?: number;
  fairValueAtGrant: number;
  expiryDate?: string;
}

export async function createEquityAward(input: CreateEquityAwardInput): Promise<string> {
  const id = uuid();
  const totalCompensation = Math.round(input.sharesGranted * input.fairValueAtGrant * 100) / 100;

  await runCypher(
    `CREATE (ea:EquityAward {
      id: $id, entity_id: $entityId, share_class_id: $shareClassId,
      label: $label, award_type: $type,
      award_status: 'GRANTED',
      grant_date: $grantDate,
      vesting_type: $vestingType,
      vesting_period_months: $vestingMonths,
      cliff_months: $cliffMonths,
      shares_granted: $sharesGranted,
      shares_vested: 0, shares_forfeited: 0,
      exercise_price: $exercisePrice,
      fair_value_at_grant: $fairValue,
      total_compensation_cost: $totalComp,
      recognized_compensation: 0,
      remaining_compensation: $totalComp,
      expiry_date: $expiryDate,
      created_at: datetime(), updated_at: datetime()
    })`,
    {
      id,
      entityId: input.entityId,
      shareClassId: input.shareClassId,
      label: input.label,
      type: input.awardType,
      grantDate: input.grantDate,
      vestingType: input.vestingType,
      vestingMonths: input.vestingPeriodMonths,
      cliffMonths: input.cliffMonths ?? null,
      sharesGranted: input.sharesGranted,
      exercisePrice: input.exercisePrice ?? null,
      fairValue: input.fairValueAtGrant,
      totalComp: totalCompensation,
      expiryDate: input.expiryDate ?? null,
    },
  );
  return id;
}

export async function getEquityAward(id: string) {
  const rows = await runCypher<Record<string, any>>(
    `MATCH (ea:EquityAward {id: $id}) RETURN properties(ea) AS ea`,
    { id },
  );
  return rows.length > 0 ? rows[0].ea : null;
}

export async function listEquityAwards(entityId: string, status?: AwardStatus) {
  const statusClause = status ? ' AND ea.award_status = $status' : '';
  return runCypher<Record<string, any>>(
    `MATCH (ea:EquityAward {entity_id: $entityId})
     WHERE 1=1 ${statusClause}
     RETURN properties(ea) AS ea ORDER BY ea.grant_date`,
    { entityId, status: status ?? null },
  ).then(rows => rows.map(r => r.ea));
}

/**
 * Recognize vesting compensation for a period (IFRS 2 straight-line over vesting period).
 * Posts DR Compensation Expense / CR Share-Based Comp Reserve (Equity).
 */
export async function recognizeVestingCompensation(
  awardId: string,
  periodId: string,
  monthsElapsed: number,
  validDate: string,
  currency: string,
): Promise<{ compensationExpense: number; journalEntryId: string | null; sharesVested: number }> {
  const award = await getEquityAward(awardId);
  if (!award) throw new Error('EquityAward not found');
  if (award.award_status === 'FORFEITED' || award.award_status === 'EXPIRED') {
    throw new Error(`Award is ${award.award_status}`);
  }

  const totalComp = Number(award.total_compensation_cost);
  const vestingMonths = Number(award.vesting_period_months);
  const cliffMonths = Number(award.cliff_months ?? 0);
  const previouslyRecognized = Number(award.recognized_compensation);

  // Check cliff: no recognition until cliff is passed
  if (cliffMonths > 0 && monthsElapsed < cliffMonths) {
    return { compensationExpense: 0, journalEntryId: null, sharesVested: 0 };
  }

  // Cumulative recognition = (months / vesting_period) × total_compensation, capped at total
  const cumulativeTarget = Math.min(
    Math.round((monthsElapsed / vestingMonths) * totalComp * 100) / 100,
    totalComp,
  );
  const incrementalExpense = Math.round((cumulativeTarget - previouslyRecognized) * 100) / 100;

  // Calculate shares vested
  const totalGranted = Number(award.shares_granted);
  const vestingRatio = Math.min(monthsElapsed / vestingMonths, 1);
  const sharesVested = Math.floor(totalGranted * vestingRatio);

  let journalEntryId: string | null = null;
  if (incrementalExpense > 0.001) {
    journalEntryId = await postJournalEntry({
      entityId: award.entity_id as string,
      periodId,
      entryType: 'OPERATIONAL',
      reference: `EQUITY-VEST-${awardId}`,
      narrative: `Share-based compensation: ${award.label} (${monthsElapsed}/${vestingMonths} months)`,
      currency,
      validDate,
      sourceSystem: 'EQUITY',
      lines: [
        {
          side: 'DEBIT',
          amount: incrementalExpense,
          nodeRefId: awardId,
          nodeRefType: 'ACTIVITY',
          economicCategory: 'EXPENSE',
        },
        {
          side: 'CREDIT',
          amount: incrementalExpense,
          nodeRefId: awardId,
          nodeRefType: 'ACTIVITY',
          economicCategory: 'EQUITY',
        },
      ],
    });
  }

  // Update award
  const newStatus = sharesVested >= totalGranted ? 'VESTED' : 'VESTING';
  await runCypher(
    `MATCH (ea:EquityAward {id: $id})
     SET ea.recognized_compensation = $recognized,
         ea.remaining_compensation = $remaining,
         ea.shares_vested = $vested,
         ea.award_status = $status,
         ea.updated_at = datetime()`,
    {
      id: awardId,
      recognized: cumulativeTarget,
      remaining: Math.round((totalComp - cumulativeTarget) * 100) / 100,
      vested: sharesVested,
      status: newStatus,
    },
  );

  return { compensationExpense: incrementalExpense, journalEntryId, sharesVested };
}

/**
 * Forfeit an equity award (employee departure before full vesting).
 */
export async function forfeitAward(awardId: string): Promise<void> {
  const award = await getEquityAward(awardId);
  if (!award) throw new Error('EquityAward not found');

  const forfeited = Number(award.shares_granted) - Number(award.shares_vested);
  await runCypher(
    `MATCH (ea:EquityAward {id: $id})
     SET ea.award_status = 'FORFEITED',
         ea.shares_forfeited = $forfeited,
         ea.remaining_compensation = 0,
         ea.updated_at = datetime()`,
    { id: awardId, forfeited },
  );
}

// ============================================================
// EPS Computation (IAS 33)
// ============================================================

export interface EPSResult {
  entityId: string;
  periodId: string;
  netIncome: number;
  preferredDividends: number;
  incomeAvailableToCommon: number;
  weightedAvgSharesBasic: number;
  basicEPS: number;
  dilutiveShares: number;
  weightedAvgSharesDiluted: number;
  dilutedEPS: number;
  isAntidilutive: boolean;
}

/**
 * Compute basic and diluted EPS per IAS 33.
 *
 * Basic EPS = (Net Income - Preferred Dividends) / Weighted Average Common Shares
 * Diluted EPS = (Net Income - Preferred Dividends) / (WA Common Shares + Dilutive Potential Shares)
 */
export async function computeEPS(
  entityId: string,
  periodId: string,
  netIncome: number,
): Promise<EPSResult> {
  // Get share classes
  const shareClasses = await listShareClasses(entityId);
  const commonClasses = shareClasses.filter(
    (sc: any) => sc.share_class_type === 'COMMON' || sc.share_class_type === 'CLASS_A',
  );
  const preferredClasses = shareClasses.filter(
    (sc: any) => sc.share_class_type === 'PREFERRED',
  );

  // Weighted average common shares (simplified: use outstanding_shares)
  const weightedAvgSharesBasic = commonClasses.reduce(
    (sum: number, sc: any) => sum + Number(sc.outstanding_shares), 0,
  );

  // Preferred dividends
  const preferredDividends = preferredClasses.reduce((sum: number, sc: any) => {
    const rate = Number(sc.dividend_rate ?? 0);
    const capital = Number(sc.share_capital_amount);
    return sum + Math.round(capital * rate * 100) / 100;
  }, 0);

  const incomeAvailableToCommon = Math.round((netIncome - preferredDividends) * 100) / 100;

  // Basic EPS
  const basicEPS = weightedAvgSharesBasic > 0
    ? Math.round((incomeAvailableToCommon / weightedAvgSharesBasic) * 100) / 100
    : 0;

  // Dilutive potential shares from in-the-money equity awards (treasury stock method)
  const awards = await listEquityAwards(entityId);
  let dilutiveShares = 0;

  for (const award of awards) {
    if (award.award_status === 'FORFEITED' || award.award_status === 'EXPIRED') continue;

    const exercisePrice = Number(award.exercise_price ?? 0);
    const unvested = Number(award.shares_granted) - Number(award.shares_vested) - Number(award.shares_forfeited);
    const vested = Number(award.shares_vested);
    const potentialShares = unvested + (award.award_status === 'VESTED' ? vested : 0);

    if (award.award_type === 'STOCK_OPTION' && exercisePrice > 0) {
      // Treasury stock method: dilutive shares = potential - (potential × exercise / market)
      // Simplified: assume dilutive if exercise < fair value at grant
      const fairValue = Number(award.fair_value_at_grant);
      if (exercisePrice < fairValue) {
        const buyback = Math.floor(potentialShares * exercisePrice / fairValue);
        dilutiveShares += potentialShares - buyback;
      }
    } else {
      // RSUs, performance shares: fully dilutive
      dilutiveShares += potentialShares;
    }
  }

  // Convertible preferred shares
  let convertibleShares = 0;
  for (const pref of preferredClasses) {
    if (Number(pref.conversion_ratio ?? 0) > 0) {
      convertibleShares += Math.floor(Number(pref.outstanding_shares) * Number(pref.conversion_ratio));
    }
  }
  dilutiveShares += convertibleShares;

  const weightedAvgSharesDiluted = weightedAvgSharesBasic + dilutiveShares;

  // Diluted EPS
  const dilutedEPS = weightedAvgSharesDiluted > 0
    ? Math.round((incomeAvailableToCommon / weightedAvgSharesDiluted) * 100) / 100
    : 0;

  // Anti-dilution check: if diluted EPS > basic EPS, it's anti-dilutive
  const isAntidilutive = dilutedEPS > basicEPS;

  return {
    entityId,
    periodId,
    netIncome,
    preferredDividends,
    incomeAvailableToCommon,
    weightedAvgSharesBasic,
    basicEPS,
    dilutiveShares,
    weightedAvgSharesDiluted,
    dilutedEPS: isAntidilutive ? basicEPS : dilutedEPS,
    isAntidilutive,
  };
}
