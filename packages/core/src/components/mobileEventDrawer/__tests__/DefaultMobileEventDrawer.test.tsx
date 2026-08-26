import { fireEvent, render, screen } from '@testing-library/preact';
import { Temporal } from 'temporal-polyfill';

import { MobileEventDrawer } from '@/components/mobileEventDrawer/DefaultMobileEventDrawer';
import { CalendarApp } from '@/core/CalendarApp';
import { ViewType } from '@/types';

const createApp = () =>
  new CalendarApp({
    views: [],
    plugins: [],
    defaultView: ViewType.MONTH,
    events: [
      {
        id: 'event-1',
        title: 'Existing event',
        description: 'Saved notes',
        calendarId: 'work',
        allDay: false,
        start: Temporal.ZonedDateTime.from(
          '2026-04-17T09:00:00+10:00[Australia/Sydney]'
        ),
        end: Temporal.ZonedDateTime.from(
          '2026-04-17T10:00:00+10:00[Australia/Sydney]'
        ),
      },
    ],
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
    timeZone: 'Australia/Sydney',
  });

describe('MobileEventDrawer', () => {
  beforeAll(() => {
    window.scrollTo = vi.fn();
  });

  it('hydrates notes and toggles start date expander state', () => {
    const app = createApp();
    const draftEvent = {
      ...app.getEvents()[0],
      description: 'Saved notes',
    };

    render(
      <MobileEventDrawer
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        onEventDelete={vi.fn()}
        draftEvent={draftEvent}
        app={app}
      />
    );

    expect(screen.getByDisplayValue('Saved notes')).toBeInTheDocument();

    const [startDateButton] = screen.getAllByRole('button', {
      name: /Apr 17, 2026/i,
    });
    fireEvent.click(startDateButton);

    const expandedCalendar = document.querySelector(
      '.df-mobile-event-drawer-expander[data-kind="calendar"][data-expanded="true"]'
    );

    expect(expandedCalendar).not.toBeNull();
  });

  it('locks background scroll when open and restores it when closed', () => {
    const app = createApp();
    const draftEvent = app.getEvents()[0];

    const { unmount } = render(
      <MobileEventDrawer
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        onEventDelete={vi.fn()}
        draftEvent={draftEvent}
        app={app}
      />
    );

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.position).toBe('');
    expect(document.body.style.overflow).toBe('');
    expect(window.scrollTo).toHaveBeenCalled();
  });
});
