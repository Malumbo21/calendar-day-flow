import { fireEvent, render, screen } from '@testing-library/preact';
import { useState } from 'preact/hooks';
import { Temporal } from 'temporal-polyfill';

import { EventRepeatEditor } from '@/components/common/EventRepeatEditor';
import { LocaleProvider } from '@/locale/LocaleProvider';
import type { Event } from '@/types';

const initialEvent: Event = {
  id: 'repeat-event',
  title: 'Review',
  start: Temporal.PlainDateTime.from('2026-08-26T09:00'),
  end: Temporal.PlainDateTime.from('2026-08-26T10:00'),
};

const StatefulEditor = ({ onChange }: { onChange: (event: Event) => void }) => {
  const [event, setEvent] = useState(initialEvent);
  return (
    <LocaleProvider>
      <EventRepeatEditor
        event={event}
        onChange={nextEvent => {
          setEvent(nextEvent);
          onChange(nextEvent);
        }}
      />
    </LocaleProvider>
  );
};

describe('EventRepeatEditor', () => {
  it('sets a standard repeat and end date', () => {
    const onChange = vi.fn();
    render(<StatefulEditor onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Repeat'));
    fireEvent.click(screen.getByRole('option', { name: 'Every Week' }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        meta: {
          recurring: true,
          recurrenceRule: 'FREQ=WEEKLY',
        },
      })
    );

    fireEvent.click(screen.getByLabelText('End Repeat'));
    fireEvent.click(screen.getByRole('option', { name: 'On Date' }));
    expect(screen.getByLabelText('On Date')).toHaveValue('2026-09-26');

    fireEvent.change(screen.getByLabelText('On Date'), {
      target: { value: '2026-12-31' },
    });
    expect(onChange.mock.calls.at(-1)?.[0].meta.recurrenceRule).toBe(
      'FREQ=WEEKLY;UNTIL=20261231'
    );
  });

  it('supports a custom weekly interval, weekdays, and occurrence count', () => {
    const onChange = vi.fn();
    render(<StatefulEditor onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Repeat'));
    fireEvent.click(screen.getByRole('option', { name: 'Custom' }));
    expect(screen.getByRole('dialog', { name: 'Custom Repeat' })).toBeVisible();
    expect(screen.getByLabelText('Frequency')).toHaveTextContent('Weekly');
    fireEvent.change(screen.getByLabelText('Every'), {
      target: { value: '3' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mon' }));
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    fireEvent.click(screen.getByLabelText('End Repeat'));
    fireEvent.click(screen.getByRole('option', { name: 'After' }));
    fireEvent.change(screen.getByLabelText('occurrences'), {
      target: { value: '12' },
    });

    expect(onChange.mock.calls.at(-1)?.[0].meta.recurrenceRule).toBe(
      'FREQ=WEEKLY;INTERVAL=3;COUNT=12;BYDAY=MO,WE'
    );
  });

  it('does not change the event when custom repeat is cancelled', () => {
    const onChange = vi.fn();
    render(<StatefulEditor onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Repeat'));
    fireEvent.click(screen.getByRole('option', { name: 'Custom' }));
    fireEvent.change(screen.getByLabelText('Every'), {
      target: { value: '4' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog', { name: 'Custom Repeat' })).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
