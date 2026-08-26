import { renderHook, act } from '@testing-library/preact';
import type { Mock } from 'vitest';

import { useSearchController } from '@/renderer/hooks/useSearchController';
import { ICalendarApp } from '@/types';
import { CalendarSearchEvent } from '@/types/search';

describe('useSearchController', () => {
  let mockApp: ICalendarApp;

  beforeEach(() => {
    mockApp = {
      state: {
        highlightedEventId: null,
        locale: 'en-US',
        switcherMode: 'select',
        calendarRegistry: {
          get: vi.fn(),
          resolveColors: vi.fn(() => ({ lineColor: '#000' })),
        },
      },
      selectEvent: vi.fn(),
      highlightEvent: vi.fn(),
      setCurrentDate: vi.fn(),
      getEvents: vi.fn(() => []),
      getCalendarRegistry: vi.fn(() => ({
        get: vi.fn(),
        resolveColors: vi.fn(() => ({ lineColor: '#000' })),
      })),
      subscribeThemeChange: vi.fn(() => () => {
        /* unsubscribe */
      }),
      getTheme: vi.fn(() => 'light'),
    } as unknown as ICalendarApp;
  });

  it('should call onResultClick when provided', () => {
    const onResultClick = vi.fn();
    const searchConfig = { onResultClick };
    const { result } = renderHook(() =>
      useSearchController(mockApp, searchConfig)
    );

    const event = {
      id: '1',
      title: 'Test Event',
      start: new Date(),
    } as unknown as CalendarSearchEvent;
    act(() => {
      result.current.handleSearchResultClick(event, 'desktop');
    });

    expect(onResultClick).toHaveBeenCalledWith(
      expect.objectContaining({
        event,
        app: mockApp,
        source: 'desktop',
      })
    );

    // Check if defaultAction is passed and works
    const callArgs = onResultClick.mock.calls[0][0];
    act(() => {
      callArgs.defaultAction();
    });
    expect(mockApp.setCurrentDate).toHaveBeenCalled();
    expect(mockApp.highlightEvent).toHaveBeenCalledWith('1');
  });

  it('should execute defaultAction when onResultClick is not provided', () => {
    const searchConfig = {};
    const { result } = renderHook(() =>
      useSearchController(mockApp, searchConfig)
    );

    const event = {
      id: '1',
      title: 'Test Event',
      start: new Date(),
    } as unknown as CalendarSearchEvent;
    act(() => {
      result.current.handleSearchResultClick(event, 'desktop');
    });

    expect(mockApp.setCurrentDate).toHaveBeenCalled();
    expect(mockApp.highlightEvent).toHaveBeenCalledWith('1');
  });

  it('should close search when closeSearch is called', () => {
    const onResultClick = vi.fn(({ closeSearch }) => {
      closeSearch();
    });
    const searchConfig = { onResultClick };
    const { result } = renderHook(() =>
      useSearchController(mockApp, searchConfig)
    );

    // Open desktop search first
    act(() => {
      result.current.setIsSearchOpen(true);
    });
    expect(result.current.isSearchOpen).toBe(true);

    const event = {
      id: '1',
      title: 'Test Event',
      start: new Date(),
    } as unknown as CalendarSearchEvent;
    act(() => {
      result.current.handleSearchResultClick(event, 'desktop');
    });

    expect(result.current.isSearchOpen).toBe(false);
    expect(mockApp.highlightEvent).not.toHaveBeenCalledWith(null);

    // Test mobile close
    act(() => {
      result.current.setIsMobileSearchOpen(true);
    });
    expect(result.current.isMobileSearchOpen).toBe(true);

    act(() => {
      result.current.handleSearchResultClick(event, 'mobile');
    });
    expect(result.current.isMobileSearchOpen).toBe(false);
  });

  it('keeps highlight when custom navigation calls defaultAction and closeSearch', () => {
    const onResultClick = vi.fn(({ defaultAction, closeSearch }) => {
      defaultAction();
      closeSearch();
    });
    const searchConfig = { onResultClick };
    const { result } = renderHook(() =>
      useSearchController(mockApp, searchConfig)
    );

    act(() => {
      result.current.setIsSearchOpen(true);
    });

    const event = {
      id: 'focus-event',
      title: 'Focus Event',
      start: new Date(),
    } as unknown as CalendarSearchEvent;

    act(() => {
      result.current.handleSearchResultClick(event, 'desktop');
    });

    expect(mockApp.highlightEvent).toHaveBeenCalledWith('focus-event');
    expect(mockApp.highlightEvent).not.toHaveBeenCalledWith(null);
    expect(result.current.isSearchOpen).toBe(false);
  });

  it('does not clear highlight when config identity changes while search is empty', () => {
    mockApp.state.highlightedEventId = 'event-1';

    const { rerender } = renderHook(
      ({ config }: { config: { onResultClick: Mock } }) =>
        useSearchController(mockApp, config),
      {
        initialProps: {
          config: {
            onResultClick: vi.fn(),
          },
        },
      }
    );

    expect(mockApp.highlightEvent).not.toHaveBeenCalledWith(null);

    rerender({
      config: {
        onResultClick: vi.fn(),
      },
    });

    expect(mockApp.highlightEvent).not.toHaveBeenCalledWith(null);
  });
});
