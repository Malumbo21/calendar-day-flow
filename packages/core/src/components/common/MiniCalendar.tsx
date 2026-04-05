import { useMemo } from 'preact/hooks';
import { Temporal } from 'temporal-polyfill';

import { CalendarRegistry } from '@/core/calendarRegistry';
import { useLocale, getWeekDaysLabels } from '@/locale';
import {
  miniCalendarDay,
  miniCalendarDayHeader,
  miniCalendarGrid,
  miniCalendarCurrentMonth,
  miniCalendarOtherMonth,
  miniCalendarToday,
  miniCalendarSelected,
} from '@/styles/classNames';
import type { Event } from '@/types/event';
import { getLineColor, temporalToVisualDate } from '@/utils';

import { ChevronLeft, ChevronRight } from './Icons';

const MAX_EVENT_DOTS = 4;

interface MiniCalendarProps {
  visibleMonth: Date;
  currentDate: Date;
  showHeader?: boolean;
  onMonthChange: (offset: number) => void;
  onDateSelect: (date: Date) => void;
  locale?: string;
  events?: Event[];
  showEventDots?: boolean;
  calendarRegistry?: CalendarRegistry;
  timeZone?: string;
}

export const MiniCalendar = ({
  visibleMonth,
  currentDate,
  showHeader = false,
  onMonthChange,
  onDateSelect,
  events = [],
  showEventDots = false,
  calendarRegistry,
  timeZone,
}: MiniCalendarProps) => {
  const { locale } = useLocale();
  const todayKey = useMemo(() => {
    const todayInTz = timeZone
      ? Temporal.Now.plainDateISO(timeZone)
      : Temporal.Now.plainDateISO();
    const todayLocal = new Date(
      todayInTz.year,
      todayInTz.month - 1,
      todayInTz.day
    );
    return todayLocal.toDateString();
  }, [timeZone]);
  const currentDateKey = currentDate.toDateString();

  const weekdayLabels = useMemo(
    () => getWeekDaysLabels(locale, 'narrow'),
    [locale]
  );

  const monthLabel = useMemo(
    () =>
      visibleMonth.toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      }),
    [visibleMonth, locale]
  );

  const eventDotsByDate = useMemo(() => {
    if (!showEventDots || !events?.length) return null;
    const map = new Map<string, string[]>();

    events.forEach(event => {
      const startFull = temporalToVisualDate(event.start, timeZone);
      const endFull = event.end
        ? temporalToVisualDate(event.end, timeZone)
        : startFull;

      // Normalize to day boundaries
      const startDate = new Date(startFull);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(endFull);
      endDate.setHours(0, 0, 0, 0);

      let adjustedEnd = new Date(endDate);

      // Match MonthView's logic for non all-day events ending at midnight
      if (!event.allDay) {
        const hasTimeComponent =
          endFull.getHours() !== 0 ||
          endFull.getMinutes() !== 0 ||
          endFull.getSeconds() !== 0 ||
          endFull.getMilliseconds() !== 0;

        if (!hasTimeComponent) {
          adjustedEnd.setDate(adjustedEnd.getDate() - 1);
        }
      }

      if (adjustedEnd < startDate) {
        adjustedEnd = new Date(startDate);
      }

      const color = getLineColor(
        event.calendarId || 'default',
        calendarRegistry
      ).toLowerCase();

      // Iterate through all days the event spans
      for (
        let current = new Date(startDate);
        current <= adjustedEnd;
        current = new Date(current.getTime() + 86400000)
      ) {
        const key = current.toDateString();
        const existing = map.get(key) ?? [];
        // Keep dots unique by color and cap density so the cell stays readable.
        if (!existing.includes(color) && existing.length < MAX_EVENT_DOTS) {
          map.set(key, [...existing, color]);
        }
      }
    });
    return map;
  }, [showEventDots, events, timeZone, calendarRegistry]);

  const miniCalendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday as first day
    const totalCells = 42;
    const days: Array<{
      date: number;
      fullDate: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    for (let cell = 0; cell < totalCells; cell++) {
      const cellDate = new Date(year, month, cell - startOffset + 1);
      const cellDateString = cellDate.toDateString();
      days.push({
        date: cellDate.getDate(),
        fullDate: cellDate,
        isCurrentMonth: cellDate.getMonth() === month,
        isToday: cellDateString === todayKey,
        isSelected: cellDateString === currentDateKey,
      });
    }

    return days;
  }, [visibleMonth, currentDateKey, todayKey]);

  return (
    <div className='px-3 py-3'>
      {showHeader ? (
        <div className='mb-3 flex items-center justify-between'>
          <button
            type='button'
            className='flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800'
            onClick={() => onMonthChange(-1)}
            aria-label='Previous month'
          >
            <ChevronLeft className='h-4 w-4' />
          </button>
          <span className='text-sm font-semibold text-gray-700 dark:text-gray-200'>
            {monthLabel}
          </span>
          <button
            type='button'
            className='flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800'
            onClick={() => onMonthChange(1)}
            aria-label='Next month'
          >
            <ChevronRight className='h-4 w-4' />
          </button>
        </div>
      ) : (
        ''
      )}
      <div className={miniCalendarGrid}>
        {weekdayLabels.map((label, index) => (
          <div
            key={`weekday-${index}`}
            className={`${miniCalendarDayHeader} text-gray-500 dark:text-gray-400`}
          >
            {label}
          </div>
        ))}
        {miniCalendarDays.map(day => {
          const dots = eventDotsByDate?.get(day.fullDate.toDateString()) ?? [];
          return (
            <button
              type='button'
              key={day.fullDate.getTime()}
              className={` ${miniCalendarDay} ${
                day.isToday
                  ? miniCalendarToday
                  : day.isSelected
                    ? miniCalendarSelected
                    : day.isCurrentMonth
                      ? miniCalendarCurrentMonth
                      : miniCalendarOtherMonth
              } relative flex flex-col items-center justify-center pt-1 pb-1`}
              onClick={() => onDateSelect(day.fullDate)}
            >
              <span className='z-10'>{day.date}</span>
              {showEventDots && dots.length > 0 && (
                <div className='absolute bottom-0.5 flex gap-px'>
                  {dots.slice(0, MAX_EVENT_DOTS).map((color, index) => (
                    <div
                      key={`${color}-${index}`}
                      data-mini-calendar-dot='true'
                      className='h-1 w-1 rounded-full'
                      style={{
                        backgroundColor: color,
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
