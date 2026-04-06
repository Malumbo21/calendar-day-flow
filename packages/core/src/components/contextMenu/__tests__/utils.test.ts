import { Temporal } from 'temporal-polyfill';

import { handlePasteEvent } from '@/components/contextMenu/utils';
import { ViewType, ICalendarApp, Event } from '@/types';
import { clipboardStore } from '@/utils/clipboardStore';

describe('handlePasteEvent', () => {
  afterEach(() => {
    clipboardStore.clear();
    jest.restoreAllMocks();
  });

  it('creates timed pasted events in app.timeZone', async () => {
    const app = {
      timeZone: 'Asia/Shanghai',
      addEvent: jest.fn(),
      getCalendarRegistry: jest.fn(() => ({
        has: jest.fn(() => true),
        getDefaultCalendarId: jest.fn(() => 'work'),
      })),
    } as unknown as ICalendarApp;

    const copiedEvent: Event = {
      id: 'event-1',
      title: 'Copied Event',
      start: Temporal.PlainDateTime.from('2026-04-02T15:30'),
      end: Temporal.PlainDateTime.from('2026-04-02T16:30'),
      calendarId: 'work',
      allDay: false,
    };

    clipboardStore.setEvent(copiedEvent);

    await handlePasteEvent(app, new Date(2026, 3, 10), ViewType.DAY);

    expect(app.addEvent).toHaveBeenCalledTimes(1);
    const createdEvent = (app.addEvent as jest.Mock).mock.calls[0][0] as Event;
    expect(createdEvent.start).toBeInstanceOf(Temporal.ZonedDateTime);
    expect(createdEvent.end).toBeInstanceOf(Temporal.ZonedDateTime);
    expect(String(createdEvent.start)).toContain('[Asia/Shanghai]');
    expect(String(createdEvent.end)).toContain('[Asia/Shanghai]');
    expect((createdEvent.start as Temporal.ZonedDateTime).hour).toBe(15);
    expect((createdEvent.start as Temporal.ZonedDateTime).minute).toBe(30);
    expect((createdEvent.end as Temporal.ZonedDateTime).hour).toBe(16);
    expect((createdEvent.end as Temporal.ZonedDateTime).minute).toBe(30);
  });
});
