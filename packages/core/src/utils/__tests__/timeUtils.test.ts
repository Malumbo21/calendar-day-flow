import { Temporal } from 'temporal-polyfill';

import { ICalendarApp } from '@/types';
import {
  formatTime,
  formatTimeRangeFormatted,
  generateSecondaryTimeSlots,
  getNextHourRangeInTimeZone,
  getTodayInTimeZone,
  getViewTimeFormat,
  restoreVisualEventToCanonical,
} from '@/utils/timeUtils';

describe('getViewTimeFormat', () => {
  const appWith = (getCurrentView: () => unknown) =>
    ({ getCurrentView }) as unknown as ICalendarApp;

  it('reads timeFormat from the active view config', () => {
    const app = appWith(() => ({
      type: 'month',
      config: { timeFormat: '12h' },
    }));

    expect(getViewTimeFormat(app)).toBe('12h');
  });

  it('falls back to 24h when the view config omits timeFormat', () => {
    const app = appWith(() => ({ type: 'month', config: {} }));

    expect(getViewTimeFormat(app)).toBe('24h');
  });

  it('falls back to 24h when no view is registered yet', () => {
    const app = appWith(() => {
      throw new Error('Current view month is not registered');
    });

    expect(getViewTimeFormat(app)).toBe('24h');
    expect(getViewTimeFormat()).toBe('24h');
  });
});

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

    expect(result).toEqual([{ hour: 12, minute: 0 }]);
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

describe('formatTimeRangeFormatted', () => {
  it('formats same period 12h range concisely (e.g. 12-1pm, 9-10am)', () => {
    expect(formatTimeRangeFormatted(12, 0, 13, 0, '12h')).toBe('12-1pm');
    expect(formatTimeRangeFormatted(9, 0, 10, 0, '12h')).toBe('9-10am');
    expect(formatTimeRangeFormatted(14, 0, 16, 30, '12h')).toBe('2-4:30pm');
  });

  it('formats cross boundary 12h range fully (e.g. 11am-12pm, 11pm-12am)', () => {
    expect(formatTimeRangeFormatted(11, 0, 12, 0, '12h')).toBe('11am-12pm');
    expect(formatTimeRangeFormatted(23, 0, 24, 0, '12h')).toBe('11pm-12am');
    expect(formatTimeRangeFormatted(10, 0, 14, 0, '12h')).toBe('10am-2pm');
  });

  it('formats 24h range with standard HH:MM format', () => {
    expect(formatTimeRangeFormatted(14, 0, 16, 0, '24h')).toBe('14:00 - 16:00');
  });
});

describe('formatTime', () => {
  it('preserves :00 minutes when alwaysShowMinutes is true', () => {
    expect(formatTime(10, 0, '12h', false, true)).toBe('10:00');
    expect(formatTime(10, 5, '12h', false, true)).toBe('10:05');
    expect(formatTime(10, 0, '12h', false, false)).toBe('10');
  });
});
