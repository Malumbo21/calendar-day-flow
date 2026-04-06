import { Temporal } from 'temporal-polyfill';

import {
  generateSecondaryTimeSlots,
  getNextHourRangeInTimeZone,
  getTodayInTimeZone,
  restoreVisualEventToCanonical,
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

describe('restoreVisualEventToCanonical', () => {
  it('converts an edited app-timezone zdt back into the original event timezone', () => {
    const originalEvent = {
      id: 'event-1',
      title: 'Customer Call',
      start: Temporal.ZonedDateTime.from(
        '2026-04-02T15:30:00+11:00[Australia/Sydney]'
      ),
      end: Temporal.ZonedDateTime.from(
        '2026-04-02T16:30:00+11:00[Australia/Sydney]'
      ),
      allDay: false,
    };

    const visualEvent = {
      ...originalEvent,
      start: Temporal.ZonedDateTime.from(
        '2026-04-02T12:30:00+08:00[Asia/Shanghai]'
      ),
      end: Temporal.ZonedDateTime.from(
        '2026-04-02T14:00:00+08:00[Asia/Shanghai]'
      ),
    };

    const result = restoreVisualEventToCanonical(
      originalEvent,
      visualEvent,
      'Asia/Shanghai'
    );

    expect(result.start.toString()).toBe(
      '2026-04-02T15:30:00+11:00[Australia/Sydney]'
    );
    expect(result.end.toString()).toBe(
      '2026-04-02T17:00:00+11:00[Australia/Sydney]'
    );
  });
});
