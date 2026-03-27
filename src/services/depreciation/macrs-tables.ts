/**
 * MACRS Depreciation Tables — IRS Publication 946
 *
 * Embeds the General Depreciation System (GDS) and Alternative Depreciation
 * System (ADS) percentage tables for Modified Accelerated Cost Recovery System.
 *
 * GDS uses 200% or 150% declining balance switching to straight-line.
 * ADS uses straight-line over the ADS recovery period.
 *
 * Tables assume half-year convention unless otherwise specified.
 * Mid-quarter tables are provided for assets placed in service when >40%
 * of total depreciable basis is placed in the last quarter.
 */

// ============================================================
// GDS Tables (Half-Year Convention) — IRS Pub 946 Table A-1
// ============================================================

/** GDS half-year convention percentage tables by recovery period.
 *  Index 0 = Year 1, Index n = Year n+1.
 *  Percentages expressed as decimals (e.g. 0.3333 = 33.33%).
 */
export const GDS_HALF_YEAR: Record<number, number[]> = {
  3: [0.3333, 0.4445, 0.1481, 0.0741],
  5: [0.2000, 0.3200, 0.1920, 0.1152, 0.1152, 0.0576],
  7: [0.1429, 0.2449, 0.1749, 0.1249, 0.0893, 0.0892, 0.0893, 0.0446],
  10: [0.1000, 0.1800, 0.1440, 0.1152, 0.0922, 0.0737, 0.0655, 0.0655, 0.0656, 0.0655, 0.0328],
  15: [0.0500, 0.0950, 0.0855, 0.0770, 0.0693, 0.0623, 0.0590, 0.0590, 0.0591, 0.0590, 0.0591, 0.0590, 0.0591, 0.0590, 0.0591, 0.0295],
  20: [0.0375, 0.0722, 0.0668, 0.0618, 0.0571, 0.0528, 0.0489, 0.0452, 0.0447, 0.0447, 0.0446, 0.0446, 0.0447, 0.0446, 0.0446, 0.0446, 0.0446, 0.0447, 0.0446, 0.0446, 0.0223],
};

// ============================================================
// GDS Tables (Mid-Quarter Convention) — IRS Pub 946 Tables A-2..A-5
// ============================================================

/** GDS mid-quarter convention tables by recovery period and quarter placed in service. */
export const GDS_MID_QUARTER: Record<number, Record<number, number[]>> = {
  5: {
    1: [0.3500, 0.2600, 0.1560, 0.1110, 0.1110, 0.0120],
    2: [0.2500, 0.3000, 0.1800, 0.1140, 0.1140, 0.0420],
    3: [0.1500, 0.3400, 0.2040, 0.1224, 0.1122, 0.0620],
    4: [0.0500, 0.3800, 0.2280, 0.1368, 0.1094, 0.0810],
  },
  7: {
    1: [0.2500, 0.2143, 0.1531, 0.1093, 0.0875, 0.0875, 0.0875, 0.0133],
    2: [0.1786, 0.2388, 0.1706, 0.1219, 0.0871, 0.0871, 0.0871, 0.0488],
    3: [0.1071, 0.2633, 0.1880, 0.1343, 0.0959, 0.0959, 0.0959, 0.0196],
    4: [0.0357, 0.2878, 0.2054, 0.1468, 0.1048, 0.0748, 0.0748, 0.0699],
  },
};

// ============================================================
// ADS Tables (Straight-Line, Half-Year) — IRS Pub 946 Table A-8..A-13
// ============================================================

/** ADS recovery periods by property class. */
export const ADS_RECOVERY_PERIODS: Record<number, number> = {
  3: 5,    // 3-year GDS → 5-year ADS
  5: 5,    // 5-year GDS → 5-year ADS (or 9/12 for some property)
  7: 10,   // 7-year GDS → 10-year ADS
  10: 15,  // 10-year GDS → 15-year ADS
  15: 20,  // 15-year GDS → 20-year ADS
  20: 25,  // 20-year GDS → 25-year ADS
  27.5: 30, // Residential rental → 30-year ADS
  31.5: 40, // Nonresidential (pre-1993)
  39: 40,  // Nonresidential real → 40-year ADS
};

/**
 * Generate ADS straight-line percentages for a given ADS recovery period.
 * Half-year convention: first and last year get half.
 */
function generateADSTable(recoveryYears: number): number[] {
  const table: number[] = [];
  const annualRate = 1.0 / recoveryYears;
  // Year 1: half-year convention
  table.push(annualRate / 2);
  // Years 2 through N
  for (let y = 2; y <= recoveryYears; y++) {
    table.push(annualRate);
  }
  // Year N+1: remaining half
  table.push(annualRate / 2);
  return table;
}

// Pre-generate ADS tables
export const ADS_HALF_YEAR: Record<number, number[]> = {};
for (const [gdsClass, adsYears] of Object.entries(ADS_RECOVERY_PERIODS)) {
  ADS_HALF_YEAR[Number(gdsClass)] = generateADSTable(adsYears);
}

// ============================================================
// Residential and Nonresidential Real Property (Mid-Month)
// ============================================================

/** 27.5-year residential rental property — mid-month convention.
 *  Each sub-array is indexed by month placed in service (0=Jan, 11=Dec).
 *  Year 1 rates differ by month; years 2-28 are 3.636%; year 29 is remainder.
 */
export const GDS_RESIDENTIAL_MID_MONTH: number[][] = (() => {
  const yearlyRate = 1 / 27.5;
  const table: number[][] = [];
  for (let month = 0; month < 12; month++) {
    const row: number[] = [];
    // Year 1: mid-month for the month placed in service
    const monthsInService = 12 - month - 0.5;
    row.push(yearlyRate * (monthsInService / 12));
    // Years 2-27: full year
    for (let y = 2; y <= 27; y++) {
      row.push(yearlyRate);
    }
    // Year 28: remainder
    const used = row.reduce((s, v) => s + v, 0);
    row.push(Math.max(0, 1 - used));
    table.push(row);
  }
  return table;
})();

/** 39-year nonresidential real property — mid-month convention. */
export const GDS_NONRESIDENTIAL_MID_MONTH: number[][] = (() => {
  const yearlyRate = 1 / 39;
  const table: number[][] = [];
  for (let month = 0; month < 12; month++) {
    const row: number[] = [];
    // Year 1: mid-month
    const monthsInService = 12 - month - 0.5;
    row.push(yearlyRate * (monthsInService / 12));
    // Years 2-39: full year
    for (let y = 2; y <= 39; y++) {
      row.push(yearlyRate);
    }
    // Year 40: remainder
    const used = row.reduce((s, v) => s + v, 0);
    row.push(Math.max(0, 1 - used));
    table.push(row);
  }
  return table;
})();

// ============================================================
// Lookup Functions
// ============================================================

export type MACRSConvention = 'HALF_YEAR' | 'MID_QUARTER' | 'MID_MONTH';

export interface MACRSLookupResult {
  system: 'GDS' | 'ADS';
  recoveryPeriod: number;
  convention: MACRSConvention;
  year: number;
  percentage: number;
  table: number[];
}

/**
 * Look up the MACRS depreciation percentage for a given property class, year, and convention.
 *
 * @param recoveryPeriod GDS recovery period in years (3, 5, 7, 10, 15, 20, 27.5, 39)
 * @param year The year of the recovery period (1-based)
 * @param system 'GDS' (default) or 'ADS'
 * @param convention 'HALF_YEAR' (default), 'MID_QUARTER', or 'MID_MONTH'
 * @param quarterOrMonth For MID_QUARTER: quarter placed in service (1-4).
 *                       For MID_MONTH: month placed in service (1-12).
 * @returns The depreciation percentage and full table, or null if not found.
 */
export function lookupMACRS(
  recoveryPeriod: number,
  year: number,
  system: 'GDS' | 'ADS' = 'GDS',
  convention: MACRSConvention = 'HALF_YEAR',
  quarterOrMonth?: number,
): MACRSLookupResult | null {
  if (year < 1) return null;

  if (system === 'ADS') {
    const table = ADS_HALF_YEAR[recoveryPeriod];
    if (!table) return null;
    const pct = year <= table.length ? table[year - 1] : 0;
    return {
      system: 'ADS',
      recoveryPeriod: ADS_RECOVERY_PERIODS[recoveryPeriod] ?? recoveryPeriod,
      convention: 'HALF_YEAR',
      year,
      percentage: Math.round(pct * 10000) / 10000,
      table: table.map((p) => Math.round(p * 10000) / 10000),
    };
  }

  // GDS
  if (convention === 'MID_MONTH') {
    const month = (quarterOrMonth ?? 1) - 1; // 0-indexed
    if (month < 0 || month > 11) return null;

    let table: number[];
    if (recoveryPeriod === 27.5) {
      table = GDS_RESIDENTIAL_MID_MONTH[month];
    } else if (recoveryPeriod === 39 || recoveryPeriod === 31.5) {
      table = GDS_NONRESIDENTIAL_MID_MONTH[month];
    } else {
      return null; // mid-month only for real property
    }

    const pct = year <= table.length ? table[year - 1] : 0;
    return {
      system: 'GDS',
      recoveryPeriod,
      convention: 'MID_MONTH',
      year,
      percentage: Math.round(pct * 10000) / 10000,
      table: table.map((p) => Math.round(p * 10000) / 10000),
    };
  }

  if (convention === 'MID_QUARTER') {
    const quarter = quarterOrMonth ?? 1;
    if (quarter < 1 || quarter > 4) return null;
    const classTable = GDS_MID_QUARTER[recoveryPeriod];
    if (!classTable) return null;
    const table = classTable[quarter];
    if (!table) return null;
    const pct = year <= table.length ? table[year - 1] : 0;
    return {
      system: 'GDS',
      recoveryPeriod,
      convention: 'MID_QUARTER',
      year,
      percentage: Math.round(pct * 10000) / 10000,
      table: table.map((p) => Math.round(p * 10000) / 10000),
    };
  }

  // HALF_YEAR convention (default)
  const table = GDS_HALF_YEAR[recoveryPeriod];
  if (!table) return null;
  const pct = year <= table.length ? table[year - 1] : 0;
  return {
    system: 'GDS',
    recoveryPeriod,
    convention: 'HALF_YEAR',
    year,
    percentage: Math.round(pct * 10000) / 10000,
    table: table.map((p) => Math.round(p * 10000) / 10000),
  };
}

/**
 * Calculate a MACRS depreciation charge for a given year using the table percentage.
 *
 * @param cost Original cost basis of the asset
 * @param recoveryPeriod GDS recovery period in years
 * @param year Year in the recovery period (1-based)
 * @param system 'GDS' or 'ADS'
 * @param convention Convention to use
 * @param quarterOrMonth Quarter (1-4) or month (1-12) placed in service
 * @returns The depreciation charge amount, or 0 if lookup fails
 */
export function calculateMACRSCharge(
  cost: number,
  recoveryPeriod: number,
  year: number,
  system: 'GDS' | 'ADS' = 'GDS',
  convention: MACRSConvention = 'HALF_YEAR',
  quarterOrMonth?: number,
): number {
  const result = lookupMACRS(recoveryPeriod, year, system, convention, quarterOrMonth);
  if (!result) return 0;
  return Math.round(cost * result.percentage * 100) / 100;
}

/**
 * Get the full MACRS depreciation schedule for a property class.
 * Returns all year percentages and amounts.
 */
export function getMACRSSchedule(
  cost: number,
  recoveryPeriod: number,
  system: 'GDS' | 'ADS' = 'GDS',
  convention: MACRSConvention = 'HALF_YEAR',
  quarterOrMonth?: number,
): Array<{ year: number; percentage: number; charge: number; accumulated: number; remaining: number }> {
  const firstResult = lookupMACRS(recoveryPeriod, 1, system, convention, quarterOrMonth);
  if (!firstResult) return [];

  const schedule: Array<{ year: number; percentage: number; charge: number; accumulated: number; remaining: number }> = [];
  let accumulated = 0;

  for (let i = 0; i < firstResult.table.length; i++) {
    const pct = firstResult.table[i];
    const charge = Math.round(cost * pct * 100) / 100;
    accumulated = Math.round((accumulated + charge) * 100) / 100;
    schedule.push({
      year: i + 1,
      percentage: pct,
      charge,
      accumulated,
      remaining: Math.round((cost - accumulated) * 100) / 100,
    });
  }

  return schedule;
}

/**
 * List all available MACRS recovery periods.
 */
export function getAvailableRecoveryPeriods(): Array<{
  recoveryPeriod: number;
  gdsYears: number;
  adsYears: number;
  propertyType: string;
}> {
  return [
    { recoveryPeriod: 3, gdsYears: 3, adsYears: 5, propertyType: 'Tractor units, racehorses, special tools' },
    { recoveryPeriod: 5, gdsYears: 5, adsYears: 5, propertyType: 'Automobiles, computers, office equipment' },
    { recoveryPeriod: 7, gdsYears: 7, adsYears: 10, propertyType: 'Office furniture, agricultural structures' },
    { recoveryPeriod: 10, gdsYears: 10, adsYears: 15, propertyType: 'Vessels, barges, single-purpose structures' },
    { recoveryPeriod: 15, gdsYears: 15, adsYears: 20, propertyType: 'Land improvements, municipal wastewater' },
    { recoveryPeriod: 20, gdsYears: 20, adsYears: 25, propertyType: 'Farm buildings, municipal sewer' },
    { recoveryPeriod: 27.5, gdsYears: 27.5, adsYears: 30, propertyType: 'Residential rental property' },
    { recoveryPeriod: 39, gdsYears: 39, adsYears: 40, propertyType: 'Nonresidential real property' },
  ];
}
