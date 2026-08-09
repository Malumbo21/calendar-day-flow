import { fireEvent, render, screen } from '@testing-library/preact';

import { QuickCreateEventPopup } from '@/components/common/QuickCreateEventPopup';
import { CalendarApp } from '@/core/CalendarApp';
import { CalendarPlugin, ViewType } from '@/types';

const createApp = (plugins: CalendarPlugin[] = []) =>
  new CalendarApp({
    views: [],
    plugins,
    defaultView: ViewType.MONTH,
    events: [],
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
    defaultCalendar: 'work',
    timeZone: 'Australia/Sydney',
  });

const createAnchor = () => {
  const anchor = document.createElement('div');
  Object.defineProperty(anchor, 'getBoundingClientRect', {
    value: () => ({
      top: 120,
      left: 160,
      right: 200,
      bottom: 152,
      width: 40,
      height: 32,
      x: 160,
      y: 120,
      toJSON: () => ({}),
    }),
  });
  document.body.append(anchor);
  return anchor;
};

describe('QuickCreateEventPopup', () => {
  it('creates an event from the keyboard suggestion flow', () => {
    const app = createApp();
    const onClose = jest.fn();
    const anchor = document.createElement('div');

    Object.defineProperty(anchor, 'getBoundingClientRect', {
      value: () => ({
        top: 120,
        left: 160,
        right: 200,
        bottom: 152,
        width: 40,
        height: 32,
        x: 160,
        y: 120,
        toJSON: () => ({}),
      }),
    });

    document.body.append(anchor);

    render(
      <QuickCreateEventPopup
        app={app}
        anchorRef={{ current: anchor }}
        onClose={onClose}
        isOpen
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.input(input, { target: { value: 'Plan review' } });
    fireEvent.keyDown(window, { key: 'Enter' });

    const createdEvent = app
      .getEvents()
      .find(event => event.title === 'Plan review');

    expect(createdEvent).toBeDefined();
    expect(createdEvent?.calendarId).toBe('work');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('plugin top content', () => {
    it('renders no extra content when no plugin contributes it', () => {
      render(
        <QuickCreateEventPopup
          app={createApp()}
          anchorRef={{ current: createAnchor() }}
          onClose={jest.fn()}
          isOpen
        />
      );

      expect(screen.queryByTestId('plugin-top-content')).toBeNull();
      expect(screen.getByRole('textbox')).toBeDefined();
    });

    it('renders plugin-owned content with popup control callbacks', () => {
      const plugin: CalendarPlugin = {
        name: 'demo-plugin',
        install: jest.fn(),
        renderQuickCreateTopContent: ({ focusInput, close }) => (
          <div data-testid='plugin-top-content'>
            <button type='button' onClick={focusInput}>
              Focus input
            </button>
            <button type='button' onClick={close}>
              Close popup
            </button>
          </div>
        ),
      };
      const app = createApp([plugin]);
      const onClose = jest.fn();

      render(
        <QuickCreateEventPopup
          app={app}
          anchorRef={{ current: createAnchor() }}
          onClose={onClose}
          isOpen
        />
      );

      expect(screen.getByTestId('plugin-top-content')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Focus input'));
      expect(screen.getByRole('textbox')).toHaveFocus();

      fireEvent.click(screen.getByText('Close popup'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
