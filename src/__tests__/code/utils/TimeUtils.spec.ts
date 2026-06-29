import { describe, it, expect } from 'vitest';

import { TimeUtils } from '@/code/utils/TimeUtils';

/** Tests TimeUtils class. */
describe('TimeUtils', () => {
  describe('Timezone handling', () => {
    it('Handle winter time', () => {
      const dateUtc = '2025-02-02T12:00:00.345';

      const actualDate = TimeUtils.zoned(dateUtc);
      const expectedDate = '2025-02-02 13:00:00';
      expect(actualDate).toBe(expectedDate);
    });

    it('Handle summer time', () => {
      const dateUtc = '2025-07-02T12:00:00.345';

      const actualDate = TimeUtils.zoned(dateUtc);
      const expectedDate = '2025-07-02 14:00:00';
      expect(actualDate).toBe(expectedDate);
    });
  });

  //

  describe('Full conversion', () => {
    it('null date should convert to null string', () => {
      const result = TimeUtils.cnvFull(null);
      expect(result).toBe(null);
    });

    it('date should fully convert to ISO string', () => {
      const date = new Date(Date.UTC(2026, 5, 28, 0, 0, 0, 0)); // note month is zero-indexed
      const result = TimeUtils.cnvFull(date);
      expect(result).toBe('2026-06-28T00:00:00');
    });

    it('date&time should fully convert to ISO string', () => {
      const date = new Date(Date.UTC(2025, 11, 8, 1, 2, 3, 5)); // note month is zero-indexed
      const result = TimeUtils.cnvFull(date);
      expect(result).toBe('2025-12-08T01:02:03.005');
    });
  });

  describe('Date conversion', () => {
    it('null date should convert to null string', () => {
      const result = TimeUtils.cnvDate(null);
      expect(result).toBe(null);
    });

    it('date should fully convert to ISO string', () => {
      const date = new Date(Date.UTC(2010, 0, 13, 0, 0, 0, 0)); // note month is zero-indexed
      const result = TimeUtils.cnvDate(date);
      expect(result).toBe('2010-01-13');
    });

    it('date&time should fully convert to ISO string', () => {
      const date = new Date(Date.UTC(2020, 9, 20, 11, 22, 33, 456)); // note month is zero-indexed
      const result = TimeUtils.cnvDate(date);
      expect(result).toBe('2020-10-20');
    });
  });

  describe('Time conversion', () => {
    it('null date should convert to null string', () => {
      const result = TimeUtils.cnvTime(null);
      expect(result).toBe(null);
    });

    it('date should fully convert to ISO string', () => {
      const date = new Date(Date.UTC(2026, 5, 28, 0, 0, 0, 0)); // note month is zero-indexed
      const result = TimeUtils.cnvTime(date);
      expect(result).toBe('00:00:00');
    });

    it('date&time should fully convert to ISO string', () => {
      const date = new Date(Date.UTC(2025, 11, 8, 11, 22, 33, 456)); // note month is zero-indexed
      const result = TimeUtils.cnvTime(date);
      expect(result).toBe('11:22:33.456');
    });
  });

  //

  describe('Getting week number', () => {
    it('from date', () => {
      const result1 = TimeUtils.getWeekNumberFromDate(new Date(2026, 11, 22));
      expect(result1).toBe(52);
      const result2 = TimeUtils.getWeekNumber(2026, 11, 22);
      expect(result2).toBe(52);
    });

    it('end of week matches end of month', () => {
      // May/June
      const result1 = TimeUtils.getWeekNumber(2026, 4, 31);
      expect(result1).toBe(22);
      const result2 = TimeUtils.getWeekNumber(2026, 5, 1);
      expect(result2).toBe(23);
    });

    it('weeks of January 2025', () => {
      const result53b = TimeUtils.getWeekNumber(2024, 11, 31);
      expect(result53b).toBe(53);
      const result1a = TimeUtils.getWeekNumber(2025, 0, 1);
      expect(result1a).toBe(1);
      const result1b = TimeUtils.getWeekNumber(2025, 0, 5);
      expect(result1b).toBe(1);
      const result2a = TimeUtils.getWeekNumber(2026, 0, 6);
      expect(result2a).toBe(2);
      const result2b = TimeUtils.getWeekNumber(2025, 0, 12);
      expect(result2b).toBe(2);
      const result3a = TimeUtils.getWeekNumber(2026, 0, 13);
      expect(result3a).toBe(3);
      const result3b = TimeUtils.getWeekNumber(2025, 0, 19);
      expect(result3b).toBe(3);
      const result4a = TimeUtils.getWeekNumber(2026, 0, 20);
      expect(result4a).toBe(4);
      const result4b = TimeUtils.getWeekNumber(2025, 0, 26);
      expect(result4b).toBe(4);
      const result5a = TimeUtils.getWeekNumber(2026, 0, 27);
      expect(result5a).toBe(5);
      const result5b = TimeUtils.getWeekNumber(2026, 0, 31);
      expect(result5b).toBe(5);
      const result5c = TimeUtils.getWeekNumber(2026, 1, 1);
      expect(result5c).toBe(5);
    });

    it('beginning of year 2026', () => {
      const result1 = TimeUtils.getWeekNumber(2025, 11, 31);
      expect(result1).toBe(53);
      const result2 = TimeUtils.getWeekNumber(2026, 0, 1);
      expect(result2).toBe(1);
    });

    it('entire week that is between years 2026/2027', () => {
      const result1 = TimeUtils.getWeekNumber(2026, 11, 28);
      expect(result1).toBe(53);
      const result2 = TimeUtils.getWeekNumber(2026, 11, 29);
      expect(result2).toBe(53);
      const result3 = TimeUtils.getWeekNumber(2026, 11, 30);
      expect(result3).toBe(53);
      const result4 = TimeUtils.getWeekNumber(2026, 11, 31);
      expect(result4).toBe(53);
      const result5 = TimeUtils.getWeekNumber(2027, 0, 1);
      expect(result5).toBe(1);
      const result6 = TimeUtils.getWeekNumber(2027, 0, 2);
      expect(result6).toBe(1);
      const result7 = TimeUtils.getWeekNumber(2027, 0, 3);
      expect(result7).toBe(1);
    });
  });
});
