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
      const date = new Date(2026, 5, 28, 0, 0, 0, 0); // note month is zero-indexed
      const result = TimeUtils.cnvFull(date);
      expect(result).toBe('2026-06-28T00:00:00');
    });

    it('date&time should fully convert to ISO string', () => {
      const date = new Date(2025, 11, 8, 1, 2, 3, 5); // note month is zero-indexed
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
      const date = new Date(2010, 0, 13, 0, 0, 0, 0); // note month is zero-indexed
      const result = TimeUtils.cnvDate(date);
      expect(result).toBe('2010-01-13');
    });

    it('date&time should fully convert to ISO string', () => {
      const date = new Date(2020, 9, 20, 11, 22, 33, 456); // note month is zero-indexed
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
      const date = new Date(2026, 5, 28, 0, 0, 0, 0); // note month is zero-indexed
      const result = TimeUtils.cnvTime(date);
      expect(result).toBe('00:00:00');
    });

    it('date&time should fully convert to ISO string', () => {
      const date = new Date(2025, 11, 8, 11, 22, 33, 456); // note month is zero-indexed
      const result = TimeUtils.cnvTime(date);
      expect(result).toBe('11:22:33.456');
    });
  });
});
