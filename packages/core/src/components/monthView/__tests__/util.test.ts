import { Temporal } from 'temporal-polyfill';

import { sortDayEvents } from '@/components/monthView/util';
import type { Event } from '@/types';

const makeEvent = (id: string, start: string, end: string): Event => ({
  id,
  title: id,
  calendarId: 'work',
  start: Temporal.ZonedDateTime.from(start),
  end: Temporal.ZonedDateTime.from(end),
});

describe('month event ordering', () => {
  it('sorts timed events by their start in the app timezone', () => {
    const laterInUtc = makeEvent(
      'new-york',
      '2026-08-26T09:00:00-04:00[America/New_York]',
      '2026-08-26T10:00:00-04:00[America/New_York]'
    );
    const earlierInUtc = makeEvent(
      'london',
      '2026-08-26T10:00:00+01:00[Europe/London]',
      '2026-08-26T11:00:00+01:00[Europe/London]'
    );

    expect(
      sortDayEvents([laterInUtc, earlierInUtc], 'UTC').map(event => event.id)
    ).toEqual(['london', 'new-york']);
  });
});
