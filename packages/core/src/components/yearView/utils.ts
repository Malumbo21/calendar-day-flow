import { Event } from '@/types';
import {
  dateToPlainDate,
  dateToZonedDateTime,
  temporalToVisualDate,
} from '@/utils';
import { createAllDayDisplayComparator } from '@/utils/allDaySort';

export interface YearMultiDaySegment {
  id: string;
  event: Event;
  startCellIndex: number; // 0 to columnsPerRow-1
  endCellIndex: number; // 0 to columnsPerRow-1
  isFirstSegment: boolean;
  isLastSegment: boolean;
  visualRowIndex: number; // Vertical slot index within the row to avoid overlap
}

/**
 * Groups an array of days into rows based on the number of columns per row.
 */
export function groupDaysIntoRows(
  yearDays: Date[],
  columnsPerRow: number
): Date[][] {
  const rows: Date[][] = [];
  for (let i = 0; i < yearDays.length; i += columnsPerRow) {
    rows.push(yearDays.slice(i, i + columnsPerRow));
  }
  return rows;
}

/**
 * Analyzes events for a specific row of days and returns segments for multi-day events.
 * It also calculates the vertical layout (visualRowIndex) to prevent overlaps.
 */
export function analyzeMultiDayEventsForRow(
  events: Event[],
  rowDays: Date[],
  columnsPerRow: number,
  comparator?: (a: Event, b: Event) => number,
  appTimeZone?: string
): YearMultiDaySegment[] {
  if (rowDays.length === 0) return [];

  const firstDay = rowDays[0];
  const lastDay = rowDays.at(-1);
  if (!firstDay || !lastDay) return [];

  const rowStartMs = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth(),
    firstDay.getDate()
  ).getTime();

  const rowEndMs = new Date(
    lastDay.getFullYear(),
    lastDay.getMonth(),
    lastDay.getDate(),
    23,
    59,
    59,
    999
  ).getTime();

  // 1. Filter and normalize events that overlap with this row
  const eventsWithDates = events
    .map(event => {
      const start = temporalToVisualDate(event.start, appTimeZone);
      const end = event.end
        ? temporalToVisualDate(event.end, appTimeZone)
        : start;

      const startMs = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      ).getTime();
      const endMs = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate()
      ).getTime();

      return {
        event,
        startMs,
        endMs,
      };
    })
    .filter(item => item.startMs <= rowEndMs && item.endMs >= rowStartMs);

  if (eventsWithDates.length === 0) return [];

  // 2. Sort events based on the all-day display priority
  // This matches MonthView and WeekView logic.
  const allDayComparator = createAllDayDisplayComparator(
    eventsWithDates.map(d => d.event),
    comparator
  );
  eventsWithDates.sort((a, b) => {
    // Priority 1: All-day events always before timed events
    const aAllDay = !!a.event.allDay;
    const bAllDay = !!b.event.allDay;
    if (aAllDay !== bAllDay) {
      return aAllDay ? -1 : 1;
    }
    // Priority 2: Standard all-day sort logic (multi-day first, then calendar, then comparator)
    return allDayComparator(a.event, b.event);
  });

  const segments: YearMultiDaySegment[] = [];
  const occupiedSlots: boolean[][] = []; // [visualRowIndex][colIndex]

  eventsWithDates.forEach(({ event, startMs, endMs }) => {
    // Calculate start and end indices in the current row
    let startCellIndex = Math.round(
      (startMs - rowStartMs) / (1000 * 60 * 60 * 24)
    );
    let endCellIndex = Math.round((endMs - rowStartMs) / (1000 * 60 * 60 * 24));

    // Clamp indices to row boundaries
    startCellIndex = Math.max(0, Math.min(startCellIndex, columnsPerRow - 1));
    endCellIndex = Math.max(0, Math.min(endCellIndex, columnsPerRow - 1));

    // Determine if it's the very first/last segment of the entire event
    const isFirstSegment = startMs >= rowStartMs;
    const isLastSegment = endMs <= rowEndMs;

    // Determine visualRowIndex (simple packing algorithm)
    let visualRowIndex = 0;
    while (true) {
      if (!occupiedSlots[visualRowIndex]) {
        occupiedSlots[visualRowIndex] = [];
      }

      let overlap = false;
      for (let i = startCellIndex; i <= endCellIndex; i++) {
        if (occupiedSlots[visualRowIndex][i]) {
          overlap = true;
          break;
        }
      }

      if (!overlap) {
        // Found a slot, mark it occupied
        for (let i = startCellIndex; i <= endCellIndex; i++) {
          occupiedSlots[visualRowIndex][i] = true;
        }
        break;
      }
      visualRowIndex++;
    }

    segments.push({
      id: `${event.id}::year-${rowStartMs}`,
      event,
      startCellIndex,
      endCellIndex,
      isFirstSegment,
      isLastSegment,
      visualRowIndex,
    });
  });

  return segments;
}

export interface MonthEventSegment extends YearMultiDaySegment {
  monthIndex: number;
}

export interface FixedWeekMonthData {
  monthIndex: number;
  monthName: string;
  days: (Date | null)[];
  monthEvents: Event[];
  eventSegments: MonthEventSegment[];
  minHeight: number;
}

export const EVENT_ROW_SPACING = 18;
export const DATE_HEADER_HEIGHT = 20;
export const MIN_ROW_HEIGHT = 60;

export const eventOverlapsMonth = (
  event: Event | null | undefined,
  year: number,
  monthIndex: number,
  appTimeZone?: string
) => {
  if (!event) return false;

  const monthStartMs = new Date(year, monthIndex, 1).getTime();
  const monthEndMs = new Date(
    year,
    monthIndex + 1,
    0,
    23,
    59,
    59,
    999
  ).getTime();
  const start = temporalToVisualDate(event.start, appTimeZone);
  const end = event.end ? temporalToVisualDate(event.end, appTimeZone) : start;
  const startMs = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  ).getTime();
  const endMs = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
    23,
    59,
    59,
    999
  ).getTime();

  return startMs <= monthEndMs && endMs >= monthStartMs;
};

export const getFixedWeekTotalColumns = (
  currentYear: number,
  startOfWeek: number
) => {
  let maxSlots = 0;
  for (let month = 0; month < 12; month++) {
    const monthStart = new Date(currentYear, month, 1);
    const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
    const monthStartDay = monthStart.getDay();
    const padding = (monthStartDay - startOfWeek + 7) % 7;
    const slots = padding + daysInMonth;
    if (slots > maxSlots) {
      maxSlots = slots;
    }
  }
  return maxSlots;
};

export const getFixedWeekLabels = ({
  locale,
  totalColumns,
  startOfWeek,
  getWeekDaysLabels,
}: {
  locale: string;
  totalColumns: number;
  startOfWeek: number;
  getWeekDaysLabels: (
    locale: string,
    format?: 'long' | 'short' | 'narrow',
    startOfWeek?: number
  ) => string[];
}) => {
  const labels = getWeekDaysLabels(locale, 'short', startOfWeek);

  const formattedLabels = labels.map(label => {
    if (locale.startsWith('zh')) {
      return label.at(-1) ?? label;
    }
    const twoChars = label.slice(0, 2);
    return twoChars.charAt(0).toUpperCase() + twoChars.slice(1).toLowerCase();
  });

  const result = [];
  for (let i = 0; i < totalColumns; i++) {
    result.push(formattedLabels[i % 7]);
  }
  return result;
};

export const createFixedWeekDragPreviewEvent = ({
  isDragging,
  dragState,
  yearEvents,
  appTimeZone,
}: {
  isDragging: boolean;
  dragState: {
    eventId: string | null;
    startDate: Date | null;
    endDate: Date | null;
    mode: 'create' | 'move' | 'resize' | null;
  };
  yearEvents: Event[];
  appTimeZone?: string;
}) => {
  if (
    !isDragging ||
    !dragState.eventId ||
    !dragState.startDate ||
    !dragState.endDate ||
    (dragState.mode !== 'move' && dragState.mode !== 'resize')
  ) {
    return null;
  }

  const baseEvent = yearEvents.find(event => event.id === dragState.eventId);
  if (!baseEvent) return null;

  return {
    ...baseEvent,
    start: baseEvent.allDay
      ? dateToPlainDate(dragState.startDate)
      : dateToZonedDateTime(dragState.startDate, appTimeZone),
    end: baseEvent.allDay
      ? dateToPlainDate(dragState.endDate)
      : dateToZonedDateTime(dragState.endDate, appTimeZone),
  } as Event;
};

export const createPreviewMonthSegment = (
  event: Event | null | undefined,
  monthIndex: number,
  year: number,
  startOfWeek: number = 1,
  appTimeZone?: string
): MonthEventSegment | null => {
  if (!event) return null;

  const monthStart = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthStartDay = monthStart.getDay();
  const paddingStart = (monthStartDay - startOfWeek + 7) % 7;
  const monthStartMs = monthStart.getTime();
  const monthEndMs = new Date(
    year,
    monthIndex,
    daysInMonth,
    23,
    59,
    59,
    999
  ).getTime();

  const start = temporalToVisualDate(event.start, appTimeZone);
  const end = event.end ? temporalToVisualDate(event.end, appTimeZone) : start;
  const startDay = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const startMs = startDay.getTime();
  const endMs = endDay.getTime();

  if (startMs > monthEndMs || endMs < monthStartMs) {
    return null;
  }

  const clampedStartMs = Math.max(startMs, monthStartMs);
  const clampedEndMs = Math.min(endMs, monthEndMs);

  return {
    id: `${event.id}::preview-month-${monthIndex}`,
    event,
    startCellIndex: paddingStart + (new Date(clampedStartMs).getDate() - 1),
    endCellIndex: paddingStart + (new Date(clampedEndMs).getDate() - 1),
    isFirstSegment:
      startDay.getMonth() === monthIndex && startDay.getFullYear() === year,
    isLastSegment:
      endDay.getMonth() === monthIndex && endDay.getFullYear() === year,
    visualRowIndex: 0,
    monthIndex,
  };
};

export function analyzeEventsForMonth(
  events: Event[],
  monthIndex: number,
  year: number,
  startOfWeek: number = 1,
  appTimeZone?: string
): { segments: MonthEventSegment[]; maxVisualRow: number } {
  const monthStart = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthStartDay = monthStart.getDay();
  const paddingStart = (monthStartDay - startOfWeek + 7) % 7;

  const monthStartMs = monthStart.getTime();
  const monthEndMs = new Date(
    year,
    monthIndex,
    daysInMonth,
    23,
    59,
    59,
    999
  ).getTime();

  const monthEventsWithDates = events
    .filter(event => !!event.start)
    .map(event => {
      const start = temporalToVisualDate(event.start, appTimeZone);
      const end = event.end
        ? temporalToVisualDate(event.end, appTimeZone)
        : start;

      const eventStartDay = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );
      const eventEndDay = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate()
      );

      return {
        event,
        startMs: eventStartDay.getTime(),
        endMs: eventEndDay.getTime(),
        eventStartDay,
        eventEndDay,
      };
    })
    .filter(item => item.startMs <= monthEndMs && item.endMs >= monthStartMs);

  if (monthEventsWithDates.length === 0) {
    return { segments: [], maxVisualRow: -1 };
  }

  const allDayComparator = createAllDayDisplayComparator(
    monthEventsWithDates.map(i => i.event)
  );
  monthEventsWithDates.sort((a, b) => {
    const aAllDay = !!a.event.allDay;
    const bAllDay = !!b.event.allDay;
    if (aAllDay !== bAllDay) {
      return aAllDay ? -1 : 1;
    }
    return allDayComparator(a.event, b.event);
  });

  const segments: MonthEventSegment[] = [];
  const occupiedSlots: boolean[][] = [];

  monthEventsWithDates.forEach(
    ({ event, startMs, endMs, eventStartDay, eventEndDay }) => {
      const clampedStartMs = Math.max(startMs, monthStartMs);
      const clampedEndMs = Math.min(endMs, monthEndMs);

      const startDay = new Date(clampedStartMs).getDate();
      const endDay = new Date(clampedEndMs).getDate();

      const startCellIndex = paddingStart + (startDay - 1);
      const endCellIndex = paddingStart + (endDay - 1);

      const isFirstSegment =
        eventStartDay.getMonth() === monthIndex &&
        eventStartDay.getFullYear() === year;
      const isLastSegment =
        eventEndDay.getMonth() === monthIndex &&
        eventEndDay.getFullYear() === year;

      let visualRowIndex = 0;
      while (true) {
        if (!occupiedSlots[visualRowIndex]) {
          occupiedSlots[visualRowIndex] = [];
        }

        let overlap = false;
        for (let i = startCellIndex; i <= endCellIndex; i++) {
          if (occupiedSlots[visualRowIndex][i]) {
            overlap = true;
            break;
          }
        }

        if (!overlap) {
          for (let i = startCellIndex; i <= endCellIndex; i++) {
            occupiedSlots[visualRowIndex][i] = true;
          }
          break;
        }
        visualRowIndex++;
      }

      segments.push({
        id: `${event.id}::month-${monthIndex}`,
        event,
        startCellIndex,
        endCellIndex,
        isFirstSegment,
        isLastSegment,
        visualRowIndex,
        monthIndex,
      });
    }
  );

  const maxVisualRow =
    segments.length > 0 ? Math.max(...segments.map(s => s.visualRowIndex)) : -1;

  return { segments, maxVisualRow };
}

export const buildFixedWeekMonthsData = ({
  currentYear,
  locale,
  totalColumns,
  yearEvents,
  startOfWeek,
  appTimeZone,
}: {
  currentYear: number;
  locale: string;
  totalColumns: number;
  yearEvents: Event[];
  startOfWeek: number;
  appTimeZone?: string;
}): FixedWeekMonthData[] => {
  const data: FixedWeekMonthData[] = [];

  for (let month = 0; month < 12; month++) {
    const monthStart = new Date(currentYear, month, 1);
    const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
    const monthStartDay = monthStart.getDay();
    const paddingStart = (monthStartDay - startOfWeek + 7) % 7;

    const days: (Date | null)[] = [];

    for (let i = 0; i < paddingStart; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentYear, month, i));
    }

    while (days.length < totalColumns) {
      days.push(null);
    }

    const rawMonthName = monthStart.toLocaleDateString(locale, {
      month: 'short',
    });
    const monthName =
      rawMonthName.charAt(0).toUpperCase() +
      rawMonthName.slice(1).toLowerCase();

    const { segments: eventSegments, maxVisualRow } = analyzeEventsForMonth(
      yearEvents,
      month,
      currentYear,
      startOfWeek,
      appTimeZone
    );

    const eventRows = maxVisualRow + 1;
    const minHeight = Math.max(
      MIN_ROW_HEIGHT,
      DATE_HEADER_HEIGHT + eventRows * EVENT_ROW_SPACING
    );

    data.push({
      monthIndex: month,
      monthName,
      days,
      monthEvents: yearEvents.filter(event =>
        eventOverlapsMonth(event, currentYear, month, appTimeZone)
      ),
      eventSegments,
      minHeight,
    });
  }

  return data;
};

export const buildEffectiveFixedWeekMonthsData = ({
  monthsData,
  dragPreviewEvent,
  isMovePreviewActive,
  currentYear,
  startOfWeek,
  appTimeZone,
}: {
  monthsData: FixedWeekMonthData[];
  dragPreviewEvent: Event | null;
  isMovePreviewActive: boolean;
  currentYear: number;
  startOfWeek: number;
  appTimeZone?: string;
}) =>
  monthsData.map(month => {
    if (isMovePreviewActive) {
      return month;
    }

    const monthIsAffectedByPreview =
      !!dragPreviewEvent &&
      (month.monthEvents.some(event => event.id === dragPreviewEvent.id) ||
        eventOverlapsMonth(
          dragPreviewEvent,
          currentYear,
          month.monthIndex,
          appTimeZone
        ));

    if (!monthIsAffectedByPreview) {
      return month;
    }

    const adjustedEvents = month.monthEvents.filter(
      event => event.id !== dragPreviewEvent?.id
    );

    if (
      dragPreviewEvent &&
      eventOverlapsMonth(
        dragPreviewEvent,
        currentYear,
        month.monthIndex,
        appTimeZone
      )
    ) {
      adjustedEvents.push(dragPreviewEvent);
    }

    const { segments: eventSegments, maxVisualRow } = analyzeEventsForMonth(
      adjustedEvents,
      month.monthIndex,
      currentYear,
      startOfWeek,
      appTimeZone
    );

    return {
      ...month,
      eventSegments,
      minHeight: Math.max(
        MIN_ROW_HEIGHT,
        DATE_HEADER_HEIGHT + (maxVisualRow + 1) * EVENT_ROW_SPACING
      ),
    };
  });
