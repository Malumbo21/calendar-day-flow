import { JSX, RefObject } from 'preact';
import { useState, useCallback, useRef } from 'preact/hooks';

import { ICalendarApp, Event } from '@/types';
import { generateUniKey } from '@/utils/helpers';
import { dateToZonedDateTime } from '@/utils/temporalTypeGuards';
import { getNextHourRangeInTimeZone } from '@/utils/timeUtils';

export interface QuickCreateController {
  isQuickCreateOpen: boolean;
  setIsQuickCreateOpen: (open: boolean) => void;
  quickCreateAnchorRef: RefObject<HTMLElement>;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  mobileDraftEvent: Event | null;
  setMobileDraftEvent: (event: Event | null) => void;
  handleAddButtonClick: (
    e: JSX.TargetedMouseEvent<HTMLElement> | JSX.TargetedTouchEvent<HTMLElement>
  ) => void;
  isCreateCalendarOpen: boolean;
  setIsCreateCalendarOpen: (open: boolean) => void;
}

/**
 * Manages the "add event" affordance for both desktop (QuickCreateEventPopup)
 * and mobile (MobileEventDrawer with a pre-populated draft event).
 */
export function useQuickCreateController(
  app: ICalendarApp,
  isMobile: boolean,
  sidebarEnabled: boolean
): QuickCreateController {
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const quickCreateAnchorRef = useRef<HTMLElement>(null!);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [mobileDraftEvent, setMobileDraftEvent] = useState<Event | null>(null);
  const [isCreateCalendarOpen, setIsCreateCalendarOpen] = useState(false);

  const handleCreateCalendar = useCallback(() => {
    setIsCreateCalendarOpen(true);
  }, []);

  const handleAddButtonClick = useCallback(
    (
      e:
        | JSX.TargetedMouseEvent<HTMLElement>
        | JSX.TargetedTouchEvent<HTMLElement>
    ) => {
      const isEditable = app.canMutateFromUI();
      if (!isEditable) return;

      if (isMobile) {
        const { start, end } = getNextHourRangeInTimeZone(app.timeZone);

        const draft: Event = {
          id: generateUniKey(),
          title: '',
          start: dateToZonedDateTime(start, app.timeZone),
          end: dateToZonedDateTime(end, app.timeZone),
          calendarId:
            app.getCalendars().find(c => c.isVisible !== false)?.id ||
            app.getCalendars()[0]?.id,
        };
        setMobileDraftEvent(draft);
        setIsMobileDrawerOpen(true);
        return;
      }

      if (sidebarEnabled) {
        // Desktop: Toggle popup
        if (isQuickCreateOpen) {
          setIsQuickCreateOpen(false);
        } else {
          (
            quickCreateAnchorRef as unknown as { current: EventTarget | null }
          ).current = e.currentTarget;
          setIsQuickCreateOpen(true);
        }
      } else {
        // Sidebar disabled -> Add Button creates calendar
        handleCreateCalendar();
      }
    },
    [isMobile, isQuickCreateOpen, app, sidebarEnabled, handleCreateCalendar]
  );

  return {
    isQuickCreateOpen,
    setIsQuickCreateOpen,
    quickCreateAnchorRef,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    mobileDraftEvent,
    setMobileDraftEvent,
    handleAddButtonClick,
    isCreateCalendarOpen,
    setIsCreateCalendarOpen,
  };
}
