import { render } from '@testing-library/preact';
import { Temporal } from 'temporal-polyfill';

import { MiniCalendar } from '@/components/common/MiniCalendar';
import { CalendarRegistry } from '@/core/calendarRegistry';
import { CalendarType } from '@/types/calendarTypes';

const makeCalendar = (id: string, lineColor: string): CalendarType => ({
  id,
  name: id,
  colors: {
    eventColor: '#ffffff',
    eventSelectedColor: '#000000',
    lineColor,
    textColor: '#111111',
  },
});

describe('MiniCalendar', () => {
  it('shows up to four unique event dots per day using calendar line colors', () => {
    const calendarRegistry = new CalendarRegistry([
      makeCalendar('a', '#111111'),
      makeCalendar('b', '#222222'),
      makeCalendar('c', '#333333'),
      makeCalendar('d', '#444444'),
      makeCalendar('e', '#555555'),
      makeCalendar('dup', '#222222'),
    ]);

    const day = Temporal.PlainDate.from('2026-04-10');
    const events = ['a', 'b', 'c', 'd', 'e', 'dup'].map(
      (calendarId, index) => ({
        id: `event-${index}`,
        title: `Event ${index}`,
        calendarId,
        start: day,
        end: day,
        allDay: true,
      })
    );

    const { container } = render(
      <MiniCalendar
        visibleMonth={new Date(2026, 3, 1)}
        currentDate={new Date(2026, 3, 10)}
        onMonthChange={() => {
          /* noop */
        }}
        onDateSelect={() => {
          /* noop */
        }}
        events={events}
        showEventDots
        calendarRegistry={calendarRegistry}
      />
    );

    const dots = Array.from(
      container.querySelectorAll('[data-mini-calendar-dot="true"]')
    ) as HTMLDivElement[];

    expect(dots).toHaveLength(4);
    expect(dots.map(dot => dot.style.backgroundColor)).toEqual([
      'rgb(17, 17, 17)',
      'rgb(34, 34, 34)',
      'rgb(51, 51, 51)',
      'rgb(68, 68, 68)',
    ]);
  });
});
