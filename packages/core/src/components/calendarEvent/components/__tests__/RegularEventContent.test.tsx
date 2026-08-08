import { render } from '@testing-library/preact';
import { Temporal } from 'temporal-polyfill';

import RegularEventContent from '@/components/calendarEvent/components/RegularEventContent';

describe('RegularEventContent', () => {
  it('keeps default density for multi-day timed segments', () => {
    const event = {
      id: 'event-1',
      title: 'Cross-day Event',
      start: Temporal.ZonedDateTime.from(
        '2026-04-05T17:00:00+10:00[Australia/Sydney]'
      ),
      end: Temporal.ZonedDateTime.from(
        '2026-04-06T05:00:00+10:00[Australia/Sydney]'
      ),
      calendarId: 'blue',
      allDay: false,
    };

    const { container } = render(
      <RegularEventContent
        event={event}
        isEditable={false}
        isTouchEnabled={false}
        isEventSelected={false}
        multiDaySegmentInfo={{
          startHour: 0,
          endHour: 0.25,
          isFirst: false,
          isLast: true,
          dayIndex: 1,
        }}
      />
    );

    const content = container.querySelector(
      '.df-event-timed-content'
    ) as HTMLElement | null;

    expect(content).not.toBeNull();
    expect(content!.dataset.density).toBe('default');
  });

  it('formats non-integer startHour and endHour correctly in multiDaySegmentInfo', () => {
    const event = {
      id: 'event-2',
      title: 'Multi-day Timed Event',
      start: Temporal.ZonedDateTime.from('2026-08-05T09:05:00+00:00[UTC]'),
      end: Temporal.ZonedDateTime.from('2026-08-06T10:59:00+00:00[UTC]'),
      calendarId: 'blue',
      allDay: false,
    };

    // 09:05 -> 9 + 5/60 = 9.083333333333334
    // 10:59 -> 10 + 59/60 = 10.983333333333333
    const { container } = render(
      <RegularEventContent
        event={event}
        isEditable={false}
        isTouchEnabled={false}
        isEventSelected={false}
        multiDaySegmentInfo={{
          startHour: 9 + 5 / 60,
          endHour: 10 + 59 / 60,
          isFirst: true,
          isLast: true,
          dayIndex: 0,
        }}
        timeFormat='24h'
      />
    );

    const timeElement = container.querySelector('.df-event-time');
    expect(timeElement).not.toBeNull();
    expect(timeElement!.textContent).toBe('09:05 - 10:59');
  });
});
