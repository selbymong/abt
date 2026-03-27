/**
 * MACRS Tables — Integration Tests
 *
 * Tests IRS Publication 946 GDS/ADS percentage table lookup,
 * schedule generation, and integration with the depreciation engine.
 *
 * These are pure computation tests — no database required.
 */
import { describe, it, expect } from 'vitest';
import {
  lookupMACRS,
  calculateMACRSCharge,
  getMACRSSchedule,
  getAvailableRecoveryPeriods,
  GDS_HALF_YEAR,
  ADS_HALF_YEAR,
} from '../../src/services/depreciation/macrs-tables.js';
import { calculateCharge } from '../../src/services/depreciation/depreciation-engine.js';

describe('P7-MACRS-TABLES', () => {
  // ========== GDS Half-Year Convention ==========

  describe('GDS Half-Year Tables', () => {
    it('should have correct 5-year GDS percentages (Table A-1)', () => {
      const table = GDS_HALF_YEAR[5];
      expect(table).toBeDefined();
      expect(table.length).toBe(6); // 5-year property has 6 years (half-year convention)

      // IRS Pub 946 Table A-1: 5-year property
      expect(table[0]).toBeCloseTo(0.2000, 3);   // Year 1: 20.00%
      expect(table[1]).toBeCloseTo(0.3200, 3);   // Year 2: 32.00%
      expect(table[2]).toBeCloseTo(0.1920, 3);   // Year 3: 19.20%
      expect(table[3]).toBeCloseTo(0.1152, 3);   // Year 4: 11.52%
      expect(table[4]).toBeCloseTo(0.1152, 3);   // Year 5: 11.52%
      expect(table[5]).toBeCloseTo(0.0576, 3);   // Year 6: 5.76%

      // Should sum to ~1.0
      const sum = table.reduce((s, v) => s + v, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should have correct 7-year GDS percentages', () => {
      const table = GDS_HALF_YEAR[7];
      expect(table).toBeDefined();
      expect(table.length).toBe(8); // 7-year property has 8 years

      expect(table[0]).toBeCloseTo(0.1429, 3);   // Year 1: 14.29%
      const sum = table.reduce((s, v) => s + v, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should have correct 3-year GDS percentages', () => {
      const table = GDS_HALF_YEAR[3];
      expect(table).toBeDefined();
      expect(table.length).toBe(4);
      expect(table[0]).toBeCloseTo(0.3333, 3);   // Year 1: 33.33%
      const sum = table.reduce((s, v) => s + v, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should cover all standard GDS recovery periods', () => {
      expect(GDS_HALF_YEAR[3]).toBeDefined();
      expect(GDS_HALF_YEAR[5]).toBeDefined();
      expect(GDS_HALF_YEAR[7]).toBeDefined();
      expect(GDS_HALF_YEAR[10]).toBeDefined();
      expect(GDS_HALF_YEAR[15]).toBeDefined();
      expect(GDS_HALF_YEAR[20]).toBeDefined();
    });
  });

  // ========== ADS Tables ==========

  describe('ADS Tables', () => {
    it('should generate ADS straight-line percentages', () => {
      const table = ADS_HALF_YEAR[5]; // 5-year GDS → 5-year ADS
      expect(table).toBeDefined();
      // ADS 5-year: half year + 4 full years + half year = 6 entries
      expect(table.length).toBe(6);
      expect(table[0]).toBeCloseTo(0.10, 2);   // Year 1: 10% (half of 20%)
      expect(table[1]).toBeCloseTo(0.20, 2);   // Year 2: 20%
      expect(table[5]).toBeCloseTo(0.10, 2);   // Year 6: 10% (remaining half)
    });

    it('ADS tables should sum to ~1.0', () => {
      for (const [, table] of Object.entries(ADS_HALF_YEAR)) {
        const sum = table.reduce((s, v) => s + v, 0);
        expect(sum).toBeCloseTo(1.0, 2);
      }
    });
  });

  // ========== Lookup Function ==========

  describe('lookupMACRS', () => {
    it('should return correct percentage for 5-year GDS year 1', () => {
      const result = lookupMACRS(5, 1, 'GDS', 'HALF_YEAR');
      expect(result).toBeTruthy();
      expect(result!.percentage).toBeCloseTo(0.2000, 3);
      expect(result!.system).toBe('GDS');
      expect(result!.convention).toBe('HALF_YEAR');
    });

    it('should return correct percentage for 7-year GDS year 3', () => {
      const result = lookupMACRS(7, 3, 'GDS');
      expect(result).toBeTruthy();
      expect(result!.percentage).toBeCloseTo(0.1749, 3);
    });

    it('should return 0 for year beyond recovery period', () => {
      const result = lookupMACRS(5, 7, 'GDS');
      expect(result).toBeTruthy();
      expect(result!.percentage).toBe(0);
    });

    it('should return null for invalid recovery period', () => {
      const result = lookupMACRS(99, 1, 'GDS');
      expect(result).toBeNull();
    });

    it('should support ADS lookup', () => {
      const result = lookupMACRS(7, 1, 'ADS');
      expect(result).toBeTruthy();
      expect(result!.system).toBe('ADS');
      expect(result!.recoveryPeriod).toBe(10); // 7-year GDS → 10-year ADS
    });

    it('should support mid-quarter convention', () => {
      const result = lookupMACRS(5, 1, 'GDS', 'MID_QUARTER', 1);
      expect(result).toBeTruthy();
      expect(result!.convention).toBe('MID_QUARTER');
      expect(result!.percentage).toBeGreaterThan(0);
    });

    it('should support mid-month convention for real property', () => {
      const result = lookupMACRS(27.5, 1, 'GDS', 'MID_MONTH', 1);
      expect(result).toBeTruthy();
      expect(result!.convention).toBe('MID_MONTH');
      expect(result!.percentage).toBeGreaterThan(0);
    });
  });

  // ========== Charge Calculation ==========

  describe('calculateMACRSCharge', () => {
    it('should calculate correct charge for $100,000 5-year property year 1', () => {
      const charge = calculateMACRSCharge(100_000, 5, 1, 'GDS', 'HALF_YEAR');
      expect(charge).toBe(20_000); // 20% of 100K
    });

    it('should calculate correct charge for year 2', () => {
      const charge = calculateMACRSCharge(100_000, 5, 2, 'GDS', 'HALF_YEAR');
      expect(charge).toBe(32_000); // 32% of 100K
    });

    it('should return 0 for year beyond schedule', () => {
      const charge = calculateMACRSCharge(100_000, 5, 10, 'GDS', 'HALF_YEAR');
      expect(charge).toBe(0);
    });
  });

  // ========== Schedule Generation ==========

  describe('getMACRSSchedule', () => {
    it('should generate full 5-year schedule', () => {
      const schedule = getMACRSSchedule(100_000, 5, 'GDS');
      expect(schedule.length).toBe(6); // 5-year has 6 entries

      expect(schedule[0].year).toBe(1);
      expect(schedule[0].charge).toBe(20_000);
      expect(schedule[0].accumulated).toBe(20_000);
      expect(schedule[0].remaining).toBe(80_000);

      // Last entry should bring remaining to 0
      const lastEntry = schedule[schedule.length - 1];
      expect(lastEntry.remaining).toBeCloseTo(0, 0);
      expect(lastEntry.accumulated).toBeCloseTo(100_000, 0);
    });

    it('should generate 7-year schedule summing to full cost', () => {
      const schedule = getMACRSSchedule(50_000, 7, 'GDS');
      expect(schedule.length).toBe(8);

      const totalDep = schedule.reduce((s, e) => s + e.charge, 0);
      expect(totalDep).toBeCloseTo(50_000, 0);
    });
  });

  // ========== Integration with calculateCharge ==========

  describe('depreciation engine integration', () => {
    it('should calculate GDS_TABLE charge via calculateCharge', () => {
      const charge = calculateCharge(
        100_000,  // cost
        0,        // accumulated
        'GDS_TABLE',
        5,        // useful life (recovery period)
        null,     // ratePct
        0,        // salvage (MACRS has no salvage)
        true,     // first year
        'HALF_YEAR',
        1,        // macrsRecoveryYear
        'HALF_YEAR',
      );
      // Year 1 annual = 20K, monthly = 20K/12 ≈ 1666.67
      expect(charge).toBeGreaterThan(1600);
      expect(charge).toBeLessThan(1700);
    });

    it('should calculate ADS_TABLE charge via calculateCharge', () => {
      const charge = calculateCharge(
        100_000,
        0,
        'ADS_TABLE',
        7,        // 7-year GDS → 10-year ADS
        null,
        0,
        true,
        'HALF_YEAR',
        1,
        'HALF_YEAR',
      );
      // ADS 10-year, year 1 = 5% = 5K annual, 5K/12 ≈ 416.67
      expect(charge).toBeGreaterThan(400);
      expect(charge).toBeLessThan(450);
    });
  });

  // ========== Recovery Period Info ==========

  describe('getAvailableRecoveryPeriods', () => {
    it('should return all 8 standard MACRS recovery periods', () => {
      const periods = getAvailableRecoveryPeriods();
      expect(periods.length).toBe(8);

      const recoveryYears = periods.map((p) => p.recoveryPeriod);
      expect(recoveryYears).toContain(3);
      expect(recoveryYears).toContain(5);
      expect(recoveryYears).toContain(7);
      expect(recoveryYears).toContain(10);
      expect(recoveryYears).toContain(15);
      expect(recoveryYears).toContain(20);
      expect(recoveryYears).toContain(27.5);
      expect(recoveryYears).toContain(39);
    });

    it('should include property type descriptions', () => {
      const periods = getAvailableRecoveryPeriods();
      const fiveYear = periods.find((p) => p.recoveryPeriod === 5);
      expect(fiveYear!.propertyType).toContain('Automobiles');
    });
  });
});
