import { normalizeTimeZoneValue } from '@/utils/timeZoneUtils';

describe('normalizeTimeZoneValue', () => {
  it('canonicalizes uppercase timezone variants from enum-like values', () => {
    expect(normalizeTimeZoneValue('AMERICA/QUITO')).toBe('America/Quito');
    expect(normalizeTimeZoneValue('AUSTRALIA/SYDNEY')).toBe('Australia/Sydney');
  });
});
