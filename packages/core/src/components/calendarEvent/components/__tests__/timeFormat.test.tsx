import { render, screen } from '@testing-library/preact';
import { Temporal } from 'temporal-polyfill';

import { EventContent } from '@/components/calendarEvent/components/EventContent';
import { ViewType, Event } from '@/types';

// 22:00 -> "10 PM" in 12h format. See issue #138.
const lateEvent: Event = {
  id: 'event-1',
  title: 'Late Meeting',
  calendarId: 'default',
  allDay: false,
  start: Temporal.ZonedDateTime.from('2026-04-07T22:00:00+00:00[UTC]'),
  end: Temporal.ZonedDateTime.from('2026-04-07T23:00:00+00:00[UTC]'),
};

const baseProps = {
  isMultiDay: false,
  segmentIndex: 0,
  isBeingDragged: false,
  isBeingResized: false,
  isEventSelected: false,
  isPopping: false,
  isEditable: false,
  isDraggable: false,
  canOpenDetail: true,
  isTouchEnabled: false,
  isMobile: false,
  customRenderingStore: null,
  eventContentSlotArgs: {},
};

describe('EventContent timeFormat', () => {
  it.each([ViewType.DAY, ViewType.WEEK])(
    'renders %s view event times in 12h format',
    viewType => {
      render(
        <EventContent
          {...baseProps}
          event={lateEvent}
          viewType={viewType}
          isAllDay={false}
          timeFormat='12h'
        />
      );

      expect(screen.getByText('10-11pm')).toBeTruthy();
    }
  );

  it('defaults day/week view event times to 24h format', () => {
    render(
      <EventContent
        {...baseProps}
        event={lateEvent}
        viewType={ViewType.DAY}
        isAllDay={false}
      />
    );

    expect(screen.getByText('22:00 - 23:00')).toBeTruthy();
  });

  it('renders month view event start time in 12h format', () => {
    const { container } = render(
      <EventContent
        {...baseProps}
        event={lateEvent}
        viewType={ViewType.MONTH}
        isAllDay={false}
        timeFormat='12h'
      />
    );

    const time = container.querySelector('.df-event-month-time');
    expect(time?.textContent).toBe('10 pm');
  });

  it('defaults month view event start time to 24h format', () => {
    const { container } = render(
      <EventContent
        {...baseProps}
        event={lateEvent}
        viewType={ViewType.MONTH}
        isAllDay={false}
      />
    );

    const time = container.querySelector('.df-event-month-time');
    expect(time?.textContent).toBe('22:00');
  });

  it('renders month multi-day segment times in 12h format', () => {
    const multiDayEvent: Event = {
      ...lateEvent,
      title: 'Multi-day Meeting',
      end: Temporal.ZonedDateTime.from('2026-04-09T23:00:00+00:00[UTC]'),
    };

    render(
      <EventContent
        {...baseProps}
        event={multiDayEvent}
        viewType={ViewType.MONTH}
        isAllDay={false}
        isMultiDay={true}
        timeFormat='12h'
        segment={{
          id: 'segment-1',
          originalEventId: multiDayEvent.id,
          event: multiDayEvent,
          startDayIndex: 0,
          endDayIndex: 2,
          isFirstSegment: true,
          isLastSegment: false,
          totalDays: 3,
          segmentType: 'start' as const,
          segmentIndex: 0,
        }}
      />
    );

    expect(screen.getByText('10 pm')).toBeTruthy();
  });
});
