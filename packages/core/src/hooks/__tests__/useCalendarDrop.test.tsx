import { act, renderHook } from '@testing-library/preact';
import { Temporal } from 'temporal-polyfill';

import { useCalendarDrop } from '@/hooks/useCalendarDrop';
import { Event, ICalendarApp } from '@/types';

jest.mock('@/locale', () => ({
  useLocale: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params?.calendarName ? `${key}:${params.calendarName}` : key,
  }),
}));

describe('useCalendarDrop', () => {
  it('creates timed events in app.timeZone for day/week drops', () => {
    const app = {
      timeZone: 'Asia/Shanghai',
      addEvent: jest.fn(),
      getCalendarRegistry: jest.fn(() => ({
        get: jest.fn(() => ({
          readOnly: false,
          subscription: false,
        })),
      })),
    } as unknown as ICalendarApp;

    const { result } = renderHook(() => useCalendarDrop({ app }));

    const dataTransfer = {
      getData: jest.fn(() =>
        JSON.stringify({
          calendarId: 'work',
          calendarName: 'Work',
          calendarColors: {
            lineColor: '#2563eb',
            eventColor: '#dbeafe',
            eventSelectedColor: '#bfdbfe',
            textColor: '#1e3a8a',
          },
        })
      ),
    };

    const event = {
      preventDefault: jest.fn(),
      dataTransfer,
    } as unknown as DragEvent;

    let created: Event | null = null;
    act(() => {
      created = result.current.handleDrop(
        event,
        new Date(2026, 3, 2),
        15,
        false
      );
    });

    expect(created).not.toBeNull();
    expect(app.addEvent).toHaveBeenCalledTimes(1);
    const createdEvent = (app.addEvent as jest.Mock).mock.calls[0][0] as Event;
    expect(app.addEvent).toHaveBeenCalledWith(createdEvent);
    expect(createdEvent.start).toBeInstanceOf(Temporal.ZonedDateTime);
    expect(createdEvent.end).toBeInstanceOf(Temporal.ZonedDateTime);
    expect(String(createdEvent.start)).toContain('[Asia/Shanghai]');
    expect(String(createdEvent.end)).toContain('[Asia/Shanghai]');
    expect((createdEvent.start as Temporal.ZonedDateTime).hour).toBe(15);
    expect((createdEvent.end as Temporal.ZonedDateTime).hour).toBe(16);
  });
});
