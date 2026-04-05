import { render } from '@testing-library/preact';
import { Temporal } from 'temporal-polyfill';

import CalendarEvent from '@/components/calendarEvent/CalendarEvent';
import { Event, ViewType } from '@/types';

const baseEvent: Event = {
  id: 'event-1',
  title: 'Shifted Event',
  calendarId: 'default',
  allDay: false,
  start: Temporal.ZonedDateTime.from('2026-04-07T18:00:00+00:00[UTC]'),
  end: Temporal.ZonedDateTime.from('2026-04-07T19:30:00+00:00[UTC]'),
};

describe('CalendarEvent timezone rendering', () => {
  it('recomputes timed event positioning when the secondary timezone changes', () => {
    const calendarElement = document.createElement('div');
    const calendarRef = { current: calendarElement };

    const { container, rerender } = render(
      <CalendarEvent
        event={baseEvent}
        viewType={ViewType.DAY}
        calendarRef={calendarRef}
        hourHeight={10}
        firstHour={0}
        onEventUpdate={jest.fn()}
        onEventDelete={jest.fn()}
        appTimeZone='Pacific/Kiritimati'
      />
    );

    const eventElement = container.querySelector(
      '[data-event-id="event-1"]'
    ) as HTMLDivElement | null;

    expect(eventElement?.style.top).toBe('83px');
    expect(eventElement?.style.height).toBe('11px');

    rerender(
      <CalendarEvent
        event={baseEvent}
        viewType={ViewType.DAY}
        calendarRef={calendarRef}
        hourHeight={10}
        firstHour={0}
        onEventUpdate={jest.fn()}
        onEventDelete={jest.fn()}
        appTimeZone='America/New_York'
      />
    );

    const updatedEventElement = container.querySelector(
      '[data-event-id="event-1"]'
    ) as HTMLDivElement | null;

    expect(updatedEventElement?.style.top).toBe('143px');
    expect(updatedEventElement?.style.height).toBe('11px');
  });
});
