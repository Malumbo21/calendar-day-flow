import { render } from '@testing-library/preact';
import { Temporal } from 'temporal-polyfill';

import DefaultEventDetailDialog from '@/components/common/DefaultEventDetailDialog';
import { CalendarApp } from '@/core/CalendarApp';
import { LocaleProvider } from '@/locale';
import { Event, ViewType } from '@/types';

const event: Event = {
  id: 'event-1',
  title: 'Planning',
  calendarId: 'work',
  allDay: false,
  start: Temporal.ZonedDateTime.from(
    '2026-04-17T09:00:00+10:00[Australia/Sydney]'
  ),
  end: Temporal.ZonedDateTime.from(
    '2026-04-17T10:00:00+10:00[Australia/Sydney]'
  ),
};

const createApp = () =>
  new CalendarApp({
    views: [],
    plugins: [],
    defaultView: ViewType.MONTH,
    events: [event],
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

const renderDialog = (app?: CalendarApp) =>
  render(
    <LocaleProvider>
      <DefaultEventDetailDialog
        event={event}
        isOpen
        isAllDay={false}
        onEventUpdate={vi.fn()}
        onEventDelete={vi.fn()}
        onClose={vi.fn()}
        app={app}
      />
    </LocaleProvider>
  );

// The dialog portals into document.body, so query the document, not the container.
const dialogIsShown = () =>
  document.querySelector('[data-event-detail-dialog]') !== null;

describe('DefaultEventDetailDialog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  // ReadOnlyConfig.viewable is optional and means "allowed" when unset. Treating
  // an unset value as false hid the dialog whenever the config omitted it.
  it('opens when no app is provided', () => {
    renderDialog();
    expect(dialogIsShown()).toBe(true);
  });

  it('opens when the read-only config leaves viewable unset', () => {
    const app = createApp();
    vi.spyOn(app, 'getReadOnlyConfig').mockReturnValue({});
    renderDialog(app);
    expect(dialogIsShown()).toBe(true);
  });

  it('stays closed when viewable is explicitly false', () => {
    const app = createApp();
    vi.spyOn(app, 'getReadOnlyConfig').mockReturnValue({ viewable: false });
    renderDialog(app);
    expect(dialogIsShown()).toBe(false);
  });
});
