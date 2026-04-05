import { render } from '@testing-library/preact';
import { Temporal } from 'temporal-polyfill';

import RegularEventContent from '@/components/calendarEvent/components/RegularEventContent';

describe('RegularEventContent', () => {
  it('keeps normal padding for multi-day timed segments', () => {
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

    const content = container.querySelector('.pl-3');

    expect(content?.className).toContain('p-1');
    expect(content?.className).not.toContain('py-0');
  });
});
