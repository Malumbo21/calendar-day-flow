import { Temporal } from 'temporal-polyfill';

import { filterWeekEvents } from '@/components/weekView/util';
import { Event } from '@/types';

describe('filterWeekEvents', () => {
  it('computes day indexes from the event local/original date in Week view', () => {
    const currentWeekStart = new Date(2026, 3, 6);

    const events: Event[] = [
      {
        id: 'tuesday-event',
        title: 'Tuesday Event',
        start: Temporal.PlainDateTime.from('2026-04-07T18:00:00'),
        end: Temporal.PlainDateTime.from('2026-04-07T19:00:00'),
      },
      {
        id: 'wednesday-event',
        title: 'Wednesday Event',
        start: Temporal.PlainDateTime.from('2026-04-08T09:00:00'),
        end: Temporal.PlainDateTime.from('2026-04-08T10:00:00'),
      },
    ];

    const results = filterWeekEvents(events, currentWeekStart, 7);

    expect(results.map(event => event.day)).toEqual([1, 2]);
  });
});
