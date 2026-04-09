import { render, waitFor } from '@testing-library/preact';

import { DefaultYearView } from '@/components/yearView/DefaultYearView';
import { CalendarApp } from '@/core/CalendarApp';
import { ViewType } from '@/types';

describe('DefaultYearView', () => {
  const originalClientWidth = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'clientWidth'
  );

  afterEach(() => {
    if (originalClientWidth) {
      // eslint-disable-next-line no-extend-native
      Object.defineProperty(
        HTMLElement.prototype,
        'clientWidth',
        originalClientWidth
      );
    }
  });

  it('uses the measured container width on first render instead of an initial window-width guess', async () => {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return 1200;
      },
    });

    const app = new CalendarApp({
      views: [],
      plugins: [],
      events: [],
      defaultView: ViewType.YEAR,
      calendars: [
        {
          id: 'work',
          name: 'Work',
          colors: {
            lineColor: '#2563eb',
            eventColor: '#dbeafe',
            eventSelectedColor: '#bfdbfe',
            textColor: '#1e3a8a',
          },
        },
      ],
    });

    const calendarRef = {
      current: document.createElement('div'),
    } as { current: HTMLDivElement };

    const { container } = render(
      <DefaultYearView app={app} calendarRef={calendarRef} />
    );

    await waitFor(() => {
      const rows = container.querySelectorAll('.relative.w-full');
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]?.querySelectorAll('[data-date]').length).toBe(15);
    });
  });
});
