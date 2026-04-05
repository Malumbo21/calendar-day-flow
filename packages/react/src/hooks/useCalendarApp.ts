import type {
  AllDaySortComparator,
  CalendarAppConfig,
  UseCalendarAppReturn,
} from '@dayflow/core';
import { CalendarApp, isDeepEqual } from '@dayflow/core';
import { useState, useEffect, useMemo, useRef } from 'react';

export function useCalendarApp(
  config: CalendarAppConfig,
  version?: string | number
): UseCalendarAppReturn {
  const comparatorRef = useRef<AllDaySortComparator | undefined>(
    config.allDaySortComparator
  );
  comparatorRef.current = config.allDaySortComparator;

  const stableAllDaySortComparator = useMemo<AllDaySortComparator>(
    () => (a, b) => comparatorRef.current?.(a, b) ?? 0,
    []
  );

  const normalizedConfig = useMemo(
    () => ({
      ...config,
      allDaySortComparator: config.allDaySortComparator
        ? stableAllDaySortComparator
        : undefined,
    }),
    [config, stableAllDaySortComparator]
  );

  // `version` lets callers recreate the app (e.g. when plugins change) without
  // unmounting the React component. Changing `version` creates a new CalendarApp
  // with the current normalizedConfig; subsequent config-only diffs are synced
  // via app.updateConfig() in the effect below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const app = useMemo(() => new CalendarApp(normalizedConfig), [version]);
  const [, setTick] = useState(0);
  const configRef = useRef(normalizedConfig);

  useEffect(() => {
    if (!app) {
      return;
    }
    // Subscribe to state changes to trigger React re-renders
    const unsubscribe = app.subscribe(() => {
      setTick((tick: number) => tick + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [app]);

  // Sync config changes to the app instance
  useEffect(() => {
    if (app && !isDeepEqual(normalizedConfig, configRef.current)) {
      app.updateConfig(normalizedConfig);
      configRef.current = normalizedConfig;
    }
  }, [app, normalizedConfig]);

  // Map app to the UseCalendarAppReturn interface
  // (In a real implementation, we might want a more comprehensive mapping)
  return {
    app,
    currentView: app.state.currentView,
    currentDate: app.state.currentDate,
    events: app.getEvents(),
    applyEventsChanges: app.applyEventsChanges,
    changeView: app.changeView,
    setCurrentDate: app.setCurrentDate,
    addEvent: app.addEvent,
    updateEvent: app.updateEvent,
    deleteEvent: app.deleteEvent,
    undo: app.undo,
    goToToday: app.goToToday,
    goToPrevious: app.goToPrevious,
    goToNext: app.goToNext,
    selectDate: app.selectDate,
    getCalendars: app.getCalendars,
    createCalendar: app.createCalendar,
    mergeCalendars: app.mergeCalendars,
    setCalendarVisibility: app.setCalendarVisibility,
    setAllCalendarsVisibility: app.setAllCalendarsVisibility,
    getAllEvents: app.getAllEvents,
    highlightEvent: app.highlightEvent,
    setVisibleMonth: app.setVisibleMonth,
    getVisibleMonth: app.getVisibleMonth,
    emitVisibleRange: app.emitVisibleRange,
    canMutateFromUI: app.canMutateFromUI,
    readOnlyConfig: app.getReadOnlyConfig(),
  };
}
