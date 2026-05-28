import { describe, it, expect } from 'vitest';

import { TimeUtils } from '@/code/utils/TimeUtils';

/** Tests TimeUtils class. */
describe('TimeUtils', () => {

  it('Full conversion: null date should convert to null string', () => {
    const result = TimeUtils.cnvFull(null);
    expect(result).toBe(null);
  });

  it('Full conversion: date should fully convert to ISO string', () => {
    const date = new Date(2026, 5, 28, 0, 0, 0, 0); // note month is zero-indexed
    const result = TimeUtils.cnvFull(date);
    expect(result).toBe('2026-06-28T00:00:00');
  });

  it('Full conversion: date&time should fully convert to ISO string', () => {
    const date = new Date(2025, 11, 8, 1, 2, 3, 5); // note month is zero-indexed
    const result = TimeUtils.cnvFull(date);
    expect(result).toBe('2025-12-08T01:02:03.005');
  });

  //

  it('Date conversion: null date should convert to null string', () => {
    const result = TimeUtils.cnvDate(null);
    expect(result).toBe(null);
  });

  it('Date conversion: date should fully convert to ISO string', () => {
    const date = new Date(2010, 0, 13, 0, 0, 0, 0); // note month is zero-indexed
    const result = TimeUtils.cnvDate(date);
    expect(result).toBe('2010-01-13');
  });

  it('Date conversion: date&time should fully convert to ISO string', () => {
    const date = new Date(2020, 9, 20, 11, 22, 33, 456); // note month is zero-indexed
    const result = TimeUtils.cnvDate(date);
    expect(result).toBe('2020-10-20');
  });

  //

  it('Time conversion: null date should convert to null string', () => {
    const result = TimeUtils.cnvTime(null);
    expect(result).toBe(null);
  });

  it('Time conversion: date should fully convert to ISO string', () => {
    const date = new Date(2026, 5, 28, 0, 0, 0, 0); // note month is zero-indexed
    const result = TimeUtils.cnvTime(date);
    expect(result).toBe('00:00:00');
  });

  it('Time conversion: date&time should fully convert to ISO string', () => {
    const date = new Date(2025, 11, 8, 11, 22, 33, 456); // note month is zero-indexed
    const result = TimeUtils.cnvTime(date);
    expect(result).toBe('11:22:33.456');
  });
});
