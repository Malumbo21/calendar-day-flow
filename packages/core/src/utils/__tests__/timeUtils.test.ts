import { Temporal } from 'temporal-polyfill';

import {
  generateSecondaryTimeSlots,
  getNextHourRangeInTimeZone,
  getTodayInTimeZone,
} from '@/utils/timeUtils';

describe('generateSecondaryTimeSlots', () => {
  it('uses the visible reference date for DST-sensitive timezone conversion', () => {
    const slots = [{ hour: 15, label: '15:00' }];

    const result = generateSecondaryTimeSlots(
      slots,
      'Asia/Shanghai',
      '24h',
      new Date(2026, 3, 2),
      'Australia/Sydney'
    );

    expect(result).toEqual(['12:00']);
  });
});

describe('timezone-aware current date helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns today using the app timezone wall date', () => {
    jest
      .spyOn(Temporal.Now, 'plainDateISO')
      .mockReturnValue(Temporal.PlainDate.from('2026-04-06'));

    const result = getTodayInTimeZone('Asia/Shanghai');

    expect(result).toEqual(new Date(2026, 3, 6));
  });

  it('builds the next-hour draft range from the app timezone wall clock', () => {
    jest
      .spyOn(Temporal.Now, 'zonedDateTimeISO')
      .mockReturnValue(
        Temporal.ZonedDateTime.from('2026-04-05T23:20:00+08:00[Asia/Shanghai]')
      );

    const result = getNextHourRangeInTimeZone('Asia/Shanghai');

    expect(result).toEqual({
      start: new Date(2026, 3, 6, 0, 0, 0, 0),
      end: new Date(2026, 3, 6, 1, 0, 0, 0),
    });
  });
});
