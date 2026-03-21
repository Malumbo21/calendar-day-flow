import { render, within } from '@testing-library/preact';
import { Temporal } from 'temporal-polyfill';

import WeekComponent from '@/components/monthView/WeekComponent';
import { CalendarApp } from '@/core/CalendarApp';
import { ViewType } from '@/types';
import { generateWeekData } from '@/utils/calendarDataUtils';

const createAllDayEvent = (
  id: string,
  title: string,
  start: string,
  end: string = start,
  calendarId: string = 'work'
) => ({
  id,
  title,
  allDay: true,
  calendarId,
  start: Temporal.PlainDate.from(start),
  end: Temporal.PlainDate.from(end),
});

const createTimedEvent = (
  id: string,
  title: string,
  day: number,
  hour: number
) => ({
  id,
  title,
  allDay: false,
  calendarId: 'work',
  start: Temporal.PlainDateTime.from({
    year: 2026,
    month: 3,
    day,
    hour,
    minute: 0,
  }),
  end: Temporal.PlainDateTime.from({
    year: 2026,
    month: 3,
    day,
    hour: hour + 1,
    minute: 0,
  }),
});

const sortByCalendarId = (
  a: { calendarId?: string },
  b: { calendarId?: string }
) => a.calendarId!.localeCompare(b.calendarId!);

describe('WeekComponent', () => {
  it('lets each month cell decide independently whether to show 3 rows plus more or 4 rows', () => {
    const onEventUpdate = jest.fn();
    const onEventDelete = jest.fn();
    const onDetailPanelOpen = jest.fn();

    const events = [
      createAllDayEvent('a', 'Event A', '2026-03-12', '2026-03-14'),
      createAllDayEvent('b', 'Event B', '2026-03-12'),
      createAllDayEvent('c', 'Event C', '2026-03-12'),
      createAllDayEvent('d', 'Event D', '2026-03-12'),
      createTimedEvent('t1', 'Timed 1', 13, 9),
      createTimedEvent('t2', 'Timed 2', 13, 10),
      createTimedEvent('t3', 'Timed 3', 13, 11),
      createTimedEvent('t4', 'Timed 4', 13, 12),
    ];

    const app = new CalendarApp({
      views: [],
      plugins: [],
      events,
      defaultView: ViewType.MONTH,
      calendars: [
        {
          id: 'work',
          name: 'Work',
          colors: {
            lineColor: '#2563eb',
            eventColor: '#dbeafe',
            eventSelectedColor: '#bfdbfe',
            textColor: '#1e3a8a',
          },
        },
      ],
    });

    const calendarRef = {
      current: document.createElement('div'),
    } as { current: HTMLDivElement };

    const { container } = render(
      <WeekComponent
        currentMonth='March'
        currentYear={2026}
        newlyCreatedEventId={null}
        screenSize='desktop'
        isScrolling={false}
        isDragging={false}
        showWeekNumbers={false}
        item={{
          index: 0,
          weekData: generateWeekData(new Date(2026, 2, 9)),
          top: 0,
          height: 119,
        }}
        weekHeight={119}
        events={events}
        dragState={{
          active: false,
          mode: null,
          eventId: null,
          targetDate: null,
          startDate: null,
          endDate: null,
        }}
        calendarRef={calendarRef}
        onEventUpdate={onEventUpdate}
        onEventDelete={onEventDelete}
        onDetailPanelOpen={onDetailPanelOpen}
        app={app}
      />
    );

    const march12Cell = container.querySelector('[data-date="2026-03-12"]');
    const march13Cell = container.querySelector('[data-date="2026-03-13"]');

    expect(march12Cell).not.toBeNull();
    expect(march13Cell).not.toBeNull();
    expect(
      within(march12Cell as HTMLElement).queryByText(/\+\d+ more/)
    ).toBeNull();
    expect(
      within(march13Cell as HTMLElement).getByText('+2 more')
    ).toBeTruthy();
  });

  it('keeps same-calendar all-day events grouped in MonthView when a sort comparator is provided', () => {
    const events = [
      createAllDayEvent('a', 'Event A', '2026-03-12', '2026-03-15', 'a-cal'),
      createAllDayEvent('b', 'Event B', '2026-03-12', '2026-03-12', 'b-cal'),
      createAllDayEvent('c', 'Event C', '2026-03-12', '2026-03-12', 'a-cal'),
    ];

    const app = new CalendarApp({
      views: [],
      plugins: [],
      events,
      defaultView: ViewType.MONTH,
      allDaySortComparator: sortByCalendarId,
      calendars: [
        {
          id: 'a-cal',
          name: 'A',
          colors: {
            lineColor: '#2563eb',
            eventColor: '#dbeafe',
            eventSelectedColor: '#bfdbfe',
            textColor: '#1e3a8a',
          },
        },
        {
          id: 'b-cal',
          name: 'B',
          colors: {
            lineColor: '#16a34a',
            eventColor: '#dcfce7',
            eventSelectedColor: '#bbf7d0',
            textColor: '#166534',
          },
        },
      ],
    });

    const calendarRef = {
      current: document.createElement('div'),
    } as { current: HTMLDivElement };

    const { getByText } = render(
      <WeekComponent
        currentMonth='March'
        currentYear={2026}
        newlyCreatedEventId={null}
        screenSize='desktop'
        isScrolling={false}
        isDragging={false}
        showWeekNumbers={false}
        item={{
          index: 0,
          weekData: generateWeekData(new Date(2026, 2, 9)),
          top: 0,
          height: 119,
        }}
        weekHeight={119}
        events={events}
        dragState={{
          active: false,
          mode: null,
          eventId: null,
          targetDate: null,
          startDate: null,
          endDate: null,
        }}
        calendarRef={calendarRef}
        onEventUpdate={jest.fn()}
        onEventDelete={jest.fn()}
        onDetailPanelOpen={jest.fn()}
        app={app}
      />
    );

    const eventA = getByText('Event A');
    const eventB = getByText('Event B');
    const eventC = getByText('Event C');

    expect(eventA.compareDocumentPosition(eventC)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(eventC.compareDocumentPosition(eventB)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
});
