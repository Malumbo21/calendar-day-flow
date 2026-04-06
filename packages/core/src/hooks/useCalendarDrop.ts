import { useCallback } from 'preact/hooks';
import { Temporal } from 'temporal-polyfill';

import { useLocale } from '@/locale';
import { Event, CalendarColors, ICalendarApp } from '@/types';
import { dateToZonedDateTime } from '@/utils';

export interface CalendarDropData {
  calendarId: string;
  calendarName: string;
  calendarColors: CalendarColors;
  calendarIcon?: string;
}

export interface CalendarDropOptions {
  app: ICalendarApp;
  onEventCreated?: (event: Event) => void;
}

export interface CalendarDropReturn {
  handleDrop: (
    e: DragEvent,
    dropDate: Date,
    dropHour?: number,
    isAllDay?: boolean
  ) => Event | null;
  handleDragOver: (e: DragEvent) => void;
}

/**
 * Hook to handle dropping calendar from sidebar to create events
 */
export function useCalendarDrop(
  options: CalendarDropOptions
): CalendarDropReturn {
  const { app, onEventCreated } = options;
  const { t } = useLocale();

  const handleDragOver = useCallback((e: DragEvent) => {
    // Check if the drag data is from a calendar
    if (
      e.dataTransfer &&
      e.dataTransfer.types.includes('application/x-dayflow-calendar')
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback(
    (
      e: DragEvent,
      dropDate: Date,
      dropHour?: number,
      isAllDay?: boolean
    ): Event | null => {
      e.preventDefault();

      if (!e.dataTransfer) return null;

      // Get calendar data from drag event
      const dragDataStr = e.dataTransfer.getData(
        'application/x-dayflow-calendar'
      );
      if (!dragDataStr) {
        return null;
      }

      try {
        const dragData: CalendarDropData = JSON.parse(dragDataStr);

        // Create event based on drop location
        let start:
          | Temporal.PlainDate
          | Temporal.PlainDateTime
          | Temporal.ZonedDateTime;
        let end:
          | Temporal.PlainDate
          | Temporal.PlainDateTime
          | Temporal.ZonedDateTime;
        let allDay = false;

        if (isAllDay) {
          // For All-day area - create all-day event using PlainDate (no time component)
          const plainDate = Temporal.PlainDate.from({
            year: dropDate.getFullYear(),
            month: dropDate.getMonth() + 1,
            day: dropDate.getDate(),
          });
          start = plainDate;
          end = plainDate;
          allDay = true;
        } else if (dropHour === undefined) {
          // For Month view - create timed event 9:00-10:00
          const startDate = new Date(dropDate);
          startDate.setHours(9, 0, 0, 0);
          const endDate = new Date(startDate);
          endDate.setHours(10, 0, 0, 0);
          start = dateToZonedDateTime(startDate, app.timeZone);
          end = dateToZonedDateTime(endDate, app.timeZone);
        } else {
          // For Day/Week view with specific hour
          const startDate = new Date(dropDate);
          startDate.setHours(dropHour, 0, 0, 0);
          const endDate = new Date(startDate);
          endDate.setHours(dropHour + 1, 0, 0, 0);
          start = dateToZonedDateTime(startDate, app.timeZone);
          end = dateToZonedDateTime(endDate, app.timeZone);
        }

        // Generate unique event ID
        const eventId = `event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        // Create new event
        const newEvent: Event = {
          id: eventId,
          title: allDay
            ? t('newAllDayCalendarEvent', {
                calendarName: dragData.calendarName,
              })
            : t('newCalendarEvent', { calendarName: dragData.calendarName }),
          description: '',
          start,
          end,
          calendarId: dragData.calendarId,
          allDay,
        };

        // Add event to calendar
        app.addEvent(newEvent);

        // Trigger callback
        onEventCreated?.(newEvent);

        return newEvent;
      } catch (error) {
        console.error('Error creating event from calendar drop:', error);
        return null;
      }
    },
    [app, onEventCreated]
  );

  return {
    handleDrop,
    handleDragOver,
  };
}
