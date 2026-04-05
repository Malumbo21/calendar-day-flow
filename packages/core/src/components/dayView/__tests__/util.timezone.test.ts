import { Temporal } from 'temporal-polyfill';

import {
  filterDayEvents,
  normalizeLayoutEvents,
} from '@/components/dayView/util';
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
});
