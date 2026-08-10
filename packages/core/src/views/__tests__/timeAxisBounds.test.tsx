import { CalendarApp } from '@/core/CalendarApp';
import { createDayView } from '@/factories/createDayView';
import { createWeekView } from '@/factories/createWeekView';
import { CalendarRenderer } from '@/renderer/CalendarRenderer';
import { CalendarPlugin, ViewType } from '@/types';

/**
 * The time axis used to always emit 24 rows starting at `firstHour`, so a
 * windowed grid ran past midnight into 24:00, 25:00, … 30:00.
 */
const mountCalendar = (app: CalendarApp) => {
  const host = document.createElement('div');
  document.body.append(host);
  const renderer = new CalendarRenderer(app);
  renderer.mount(host);
  return {
    host,
    cleanup: () => {
      renderer.unmount();
      host.remove();
    },
  };
};

const axisLabels = (host: HTMLElement) =>
  Array.from(host.querySelectorAll('.df-time-slot'))
    .map(node => node.textContent?.trim())
    .filter(Boolean);

describe('time axis bounds', () => {
  it('stops the week axis at lastHour instead of running past midnight', () => {
    const app = new CalendarApp({
      views: [
        createWeekView({
          firstHour: 7,
          lastHour: 19,
          showAllDay: false,
          scrollToCurrentTime: false,
          timeFormat: '24h',
        }),
      ],
      plugins: [],
      events: [],
      defaultView: ViewType.WEEK,
      timeZone: 'Australia/Sydney',
      timeFormat: '24h',
      useCalendarHeader: false,
    });

    const { host, cleanup } = mountCalendar(app);
    const labels = axisLabels(host);

    expect(labels).not.toContain('24:00');
    expect(labels).not.toContain('30:00');
    expect(labels.at(-1)).toBe('18:00');

    cleanup();
  });

  it('stops the day axis at lastHour as well', () => {
    const app = new CalendarApp({
      views: [
        createDayView({
          firstHour: 7,
          lastHour: 19,
          showAllDay: false,
          scrollToCurrentTime: false,
          timeFormat: '24h',
        }),
      ],
      plugins: [],
      events: [],
      defaultView: ViewType.DAY,
      timeZone: 'Australia/Sydney',
      timeFormat: '24h',
      useCalendarHeader: false,
    });

    const { host, cleanup } = mountCalendar(app);
    const labels = axisLabels(host);

    expect(labels).not.toContain('24:00');
    expect(labels.at(-1)).toBe('18:00');

    cleanup();
  });

  it('keeps a full-day axis at 24 hours', () => {
    const app = new CalendarApp({
      views: [
        createWeekView({
          showAllDay: false,
          scrollToCurrentTime: false,
          timeFormat: '24h',
        }),
      ],
      plugins: [],
      events: [],
      defaultView: ViewType.WEEK,
      timeZone: 'Australia/Sydney',
      timeFormat: '24h',
      useCalendarHeader: false,
    });

    const { host, cleanup } = mountCalendar(app);
    const labels = axisLabels(host);

    expect(labels.at(-1)).toBe('23:00');
    expect(labels).not.toContain('24:00');

    cleanup();
  });
});

describe('week header alignment', () => {
  it('reserves the time-column width even when the all-day row is hidden', () => {
    const app = new CalendarApp({
      views: [
        createWeekView({ showAllDay: false, scrollToCurrentTime: false }),
      ],
      plugins: [],
      events: [],
      defaultView: ViewType.WEEK,
      timeZone: 'Australia/Sydney',
      useCalendarHeader: false,
    });

    const { host, cleanup } = mountCalendar(app);

    // Without this spacer the weekday header columns start at x=0 while the
    // grid columns below start after the time axis.
    expect(host.querySelector('.df-week-all-day-side')).not.toBeNull();
    expect(
      host.querySelector<HTMLElement>('.df-week-all-day-side')?.dataset
        .showAllDay
    ).toBe('false');

    cleanup();
  });

  it('still renders the all-day label when the row is shown', () => {
    const app = new CalendarApp({
      views: [createWeekView({ showAllDay: true, scrollToCurrentTime: false })],
      plugins: [],
      events: [],
      defaultView: ViewType.WEEK,
      timeZone: 'Australia/Sydney',
      useCalendarHeader: false,
    });

    const { host, cleanup } = mountCalendar(app);

    expect(host.querySelector('.df-week-all-day-side')).not.toBeNull();
    expect(host.querySelector('.df-week-all-day-label')).not.toBeNull();

    cleanup();
  });
});

describe('time-grid plugin layer slot', () => {
  const layerPlugin: CalendarPlugin = {
    name: 'test-time-grid-layer',
    install: () => {
      // No installation work is required for this renderer contract test.
    },
    renderTimeGridLayer: context => (
      <div
        data-testid='time-grid-plugin-layer'
        data-view={context.view}
        data-visible-dates={context.visibleDates
          .map(date => date.toString())
          .join(',')}
        data-hours={`${context.firstHour}-${context.lastHour}`}
      />
    ),
  };

  it.each([
    {
      view: ViewType.DAY,
      factory: () =>
        createDayView({
          firstHour: 7,
          lastHour: 19,
          showAllDay: false,
          scrollToCurrentTime: false,
        }),
      visibleDateCount: 1,
    },
    {
      view: ViewType.WEEK,
      factory: () =>
        createWeekView({
          firstHour: 7,
          lastHour: 19,
          showAllDay: false,
          scrollToCurrentTime: false,
        }),
      visibleDateCount: 7,
    },
  ])('renders plugin content inside the $view grid', entry => {
    const app = new CalendarApp({
      views: [entry.factory()],
      plugins: [layerPlugin],
      events: [],
      defaultView: entry.view,
      initialDate: new Date(2026, 7, 10),
      timeZone: 'Australia/Sydney',
      useCalendarHeader: false,
    });

    const { host, cleanup } = mountCalendar(app);
    const layer = host.querySelector<HTMLElement>(
      '[data-testid="time-grid-plugin-layer"]'
    );

    expect(layer?.dataset.view).toBe(entry.view);
    expect(layer?.dataset.hours).toBe('7-19');
    expect(layer?.dataset.visibleDates?.split(',')).toHaveLength(
      entry.visibleDateCount
    );

    cleanup();
  });
});
