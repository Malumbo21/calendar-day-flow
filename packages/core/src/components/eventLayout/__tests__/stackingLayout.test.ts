import { Temporal } from 'temporal-polyfill';

import { EventLayoutCalculator } from '@/components/eventLayout';
import { Event } from '@/types';

describe('EventLayoutCalculator stacking layout optimization', () => {
  it('correctly partitions child events into time-overlapping clusters under a long parent event', () => {
    const eventA: Event = {
      id: 'event-A',
      title: 'Event A',
      start: Temporal.PlainDateTime.from('2026-08-01T09:00:00'),
      end: Temporal.PlainDateTime.from('2026-08-01T12:00:00'),
    };
    const eventB: Event = {
      id: 'event-B',
      title: 'Event B',
      start: Temporal.PlainDateTime.from('2026-08-01T09:00:00'),
      end: Temporal.PlainDateTime.from('2026-08-01T10:00:00'),
    };
    const eventC: Event = {
      id: 'event-C',
      title: 'Event C',
      start: Temporal.PlainDateTime.from('2026-08-01T12:00:00'),
      end: Temporal.PlainDateTime.from('2026-08-01T13:00:00'),
    };
    const eventD: Event = {
      id: 'event-D',
      title: 'Event D',
      start: Temporal.PlainDateTime.from('2026-08-01T13:30:00'),
      end: Temporal.PlainDateTime.from('2026-08-01T16:30:00'),
    };
    const eventE: Event = {
      id: 'event-E',
      title: 'Event E',
      start: Temporal.PlainDateTime.from('2026-08-01T08:00:00'),
      end: Temporal.PlainDateTime.from('2026-08-01T17:00:00'),
    };

    const events = [eventA, eventB, eventC, eventD, eventE];

    const layouts = EventLayoutCalculator.calculateDayEventLayouts(events, {
      viewType: 'day',
    });

    const layoutA = layouts.get('event-A')!;
    const layoutB = layouts.get('event-B')!;
    const layoutC = layouts.get('event-C')!;
    const layoutD = layouts.get('event-D')!;
    const layoutE = layouts.get('event-E')!;

    expect(layoutE).toBeDefined();
    expect(layoutE.isPrimary).toBe(true);

    // Event A and Event B overlap at 9am under Event E.
    // They should split parallel columns (~50% width each, with minor depth indent offset)
    expect(layoutA.width).toBeGreaterThan(40);
    expect(layoutA.width).toBeLessThan(60);

    expect(layoutB.width).toBeGreaterThan(40);
    expect(layoutB.width).toBeLessThan(60);

    // Event C (12-1pm) and Event D (1:30-4:30pm) do not overlap with A/B or each other.
    // They should receive ~100% of available parent width (minus minor depth indent offset),
    // NOT squeezed into a 25% 4-column layout.
    expect(layoutC.width).toBeGreaterThan(90);
    expect(layoutD.width).toBeGreaterThan(90);
  });
});
