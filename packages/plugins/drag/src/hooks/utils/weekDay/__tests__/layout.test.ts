import { dateToZonedDateTime } from '@dayflow/core';
import { buildWeekDayDragLayout } from '@drag/hooks/utils/weekDay/layout';

describe('weekDay layout', () => {
  it('returns null when event cannot be resolved', () => {
    expect(
      buildWeekDayDragLayout({
        calculateDragLayout: () => ({ width: 1 }) as never,
        dayIndex: 2,
        endHour: 10,
        eventId: 'missing',
        events: [],
        roundToTimeStep: value => value,
        startHour: 9,
      })
    ).toBeNull();
  });

  it('uses rounded hours when building drag layout', () => {
    const calculateDragLayout = vi.fn(() => ({ width: 42 }) as never);
    const result = buildWeekDayDragLayout({
      calculateDragLayout,
      dayIndex: 3,
      endHour: 10.2,
      eventId: 'event-1',
      events: [
        {
          id: 'event-1',
          title: 'Focus',
          day: 2,
          start: dateToZonedDateTime(new Date('2026-04-08T09:00:00Z'), 'UTC'),
          end: dateToZonedDateTime(new Date('2026-04-08T10:00:00Z'), 'UTC'),
          allDay: false,
          calendarId: 'work',
        },
      ],
      roundToTimeStep: value => Math.round(value),
      startHour: 9.4,
    });

    expect(result).toEqual({ width: 42 });
    expect(calculateDragLayout).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'event-1' }),
      3,
      9,
      10
    );
  });
});
