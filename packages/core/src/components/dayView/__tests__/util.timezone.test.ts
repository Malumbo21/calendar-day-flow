import { Temporal } from 'temporal-polyfill';

import {
  filterDayEvents,
  normalizeLayoutEvents,
} from '@/components/dayView/util';
import { EventLayoutCalculator } from '@/components/eventLayout';
import {
  analyzeMultiDayRegularEvent,
  RegularEventSegment,
} from '@/components/monthView/util';
import { Event } from '@/types';
import { extractHourFromDate } from '@/utils';

describe('filterDayEvents', () => {
  it('filters events using their local/original day in Day view', () => {
    const currentDate = new Date(2026, 3, 8);
    const currentWeekStart = new Date(2026, 3, 6);

    const events: Event[] = [
      {
        id: 'same-day',
        title: 'Same Day',
        start: Temporal.PlainDateTime.from('2026-04-08T09:00:00'),
        end: Temporal.PlainDateTime.from('2026-04-08T10:00:00'),
      },
      {
        id: 'previous-day',
        title: 'Previous Day',
        start: Temporal.PlainDateTime.from('2026-04-07T18:00:00'),
        end: Temporal.PlainDateTime.from('2026-04-07T19:00:00'),
      },
      {
        id: 'all-day',
        title: 'All Day',
        start: Temporal.PlainDate.from('2026-04-08'),
        end: Temporal.PlainDate.from('2026-04-08'),
        allDay: true,
      },
    ];

    const results = filterDayEvents(events, currentDate, currentWeekStart);

    expect(results.map(event => event.id)).toEqual(['same-day', 'all-day']);
  });

  it('normalizes timed layout events without shifting their wall time', () => {
    const currentDate = new Date(2026, 3, 8);

    const timedEvent: Event = {
      id: 'timed-event',
      title: 'Timed Event',
      start: Temporal.PlainDateTime.from('2026-04-07T23:00:00'),
      end: Temporal.PlainDateTime.from('2026-04-08T02:30:00'),
    };

    const layoutEvents = normalizeLayoutEvents([timedEvent], currentDate);

    expect(extractHourFromDate(layoutEvents[0].start)).toBe(0);
    expect(extractHourFromDate(layoutEvents[0].end)).toBe(2.5);
  });

  it('correctly segment multi-day event spanning across multiple days for Day view', () => {
    const multiDayEvent: Event = {
      id: 'cross-day-event',
      title: 'Cross Day Event',
      start: Temporal.PlainDateTime.from('2026-07-31T05:30:00'),
      end: Temporal.PlainDateTime.from('2026-08-13T06:30:00'),
    };

    // On start day (2026-07-31): spans 05:30 to 24:00
    const startDaySegs = analyzeMultiDayRegularEvent(
      multiDayEvent,
      new Date(2026, 6, 31),
      1
    );
    const startSeg = startDaySegs.find(
      (s: RegularEventSegment) => s.dayIndex === 0
    );
    expect(startSeg).toEqual({
      dayIndex: 0,
      startHour: 5.5,
      endHour: 24,
      isFirst: true,
      isLast: false,
    });

    // On intermediate day (2026-08-01): spans full 24 hours (0 to 24)
    const middleDaySegs = analyzeMultiDayRegularEvent(
      multiDayEvent,
      new Date(2026, 7, 1),
      1
    );
    const middleSeg = middleDaySegs.find(
      (s: RegularEventSegment) => s.dayIndex === 0
    );
    expect(middleSeg).toEqual({
      dayIndex: 0,
      startHour: 0,
      endHour: 24,
      isFirst: false,
      isLast: false,
    });

    // On end day (2026-08-13): spans 00:00 to 06:30
    const endDaySegs = analyzeMultiDayRegularEvent(
      multiDayEvent,
      new Date(2026, 7, 13),
      1
    );
    const endSeg = endDaySegs.find(
      (s: RegularEventSegment) => s.dayIndex === 0
    );
    expect(endSeg).toEqual({
      dayIndex: 0,
      startHour: 0,
      endHour: 6.5,
      isFirst: false,
      isLast: true,
    });
  });

  it('correctly calculates stacking layout for multi-day events on intermediate days in Day view', () => {
    const multiDayEvent: Event = {
      id: 'cross-day-event',
      title: 'Cross Day Event',
      start: Temporal.PlainDateTime.from('2026-07-31T05:30:00'),
      end: Temporal.PlainDateTime.from('2026-08-13T06:30:00'),
    };
    const singleDayEvent: Event = {
      id: 'single-day-event',
      title: 'Single Day Event',
      start: Temporal.PlainDateTime.from('2026-08-01T09:00:00'),
      end: Temporal.PlainDateTime.from('2026-08-01T11:00:00'),
    };

    const currentDate = new Date(2026, 7, 1); // 2026-08-01
    const layoutEvents = normalizeLayoutEvents(
      [multiDayEvent, singleDayEvent],
      currentDate
    );

    const multiDayNormalized = layoutEvents.find(
      e => e.id === 'cross-day-event'
    )!;
    expect(multiDayNormalized._originalStartHour).toBe(0);
    expect(multiDayNormalized._originalEndHour).toBe(24);

    const layouts = EventLayoutCalculator.calculateDayEventLayouts(
      layoutEvents,
      { viewType: 'day' }
    );

    expect(layouts.get('cross-day-event')).toBeDefined();
    expect(layouts.get('single-day-event')).toBeDefined();
    // Multi-day event starting at 00:00 on Aug 1 should be the primary root event (level 0)
    expect(layouts.get('cross-day-event')!.isPrimary).toBe(true);
    expect(layouts.get('single-day-event')!.level).toBeGreaterThan(0);
  });
});
