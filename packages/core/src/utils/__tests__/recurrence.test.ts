import { Temporal } from 'temporal-polyfill';

import type { Event } from '@/types';
import {
  expandRecurringEvents,
  parseEventRecurrence,
  serializeEventRecurrence,
  setEventRecurrence,
} from '@/utils/recurrence';

const makeEvent = (meta?: Record<string, unknown>): Event => ({
  id: 'event-1',
  title: 'Planning',
  start: Temporal.PlainDateTime.from('2026-08-26T09:00'),
  end: Temporal.PlainDateTime.from('2026-08-26T10:00'),
  meta,
});

describe('event recurrence utilities', () => {
  it('parses standard interval and end-repeat RRULE fields', () => {
    const recurrence = parseEventRecurrence(
      makeEvent({
        recurring: true,
        recurrenceRule: 'FREQ=WEEKLY;INTERVAL=2;UNTIL=20261031',
      })
    );

    expect(recurrence).toEqual({
      frequency: 'WEEKLY',
      interval: 2,
      end: { type: 'on-date', date: '2026-10-31' },
      extraParts: [],
    });
  });

  it('preserves RRULE fields that the default editor does not manage', () => {
    const recurrence = parseEventRecurrence(
      makeEvent({ recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE;COUNT=8' })
    );

    expect(recurrence).not.toBeNull();
    expect(serializeEventRecurrence(recurrence!)).toBe(
      'FREQ=WEEKLY;COUNT=8;BYDAY=MO,WE'
    );
  });

  it('adds and removes recurrence without losing other metadata', () => {
    const event = makeEvent({ location: 'Room 4' });
    const repeating = setEventRecurrence(event, {
      frequency: 'MONTHLY',
      interval: 1,
      end: { type: 'after', occurrences: 6 },
      extraParts: [],
    });

    expect(repeating.meta).toEqual({
      location: 'Room 4',
      recurring: true,
      recurrenceRule: 'FREQ=MONTHLY;COUNT=6',
    });
    expect(setEventRecurrence(repeating, null).meta).toEqual({
      location: 'Room 4',
    });
  });

  it('expands daily occurrences into a bounded render range', () => {
    const event = setEventRecurrence(makeEvent(), {
      frequency: 'DAILY',
      interval: 1,
      end: { type: 'after', occurrences: 4 },
      extraParts: [],
    });
    const occurrences = expandRecurringEvents(
      [event],
      new Date(2026, 7, 26),
      new Date(2026, 7, 31, 23, 59, 59),
      'Australia/Sydney'
    );

    expect(occurrences.map(item => item.start.toString())).toEqual([
      '2026-08-26T09:00:00',
      '2026-08-27T09:00:00',
      '2026-08-28T09:00:00',
      '2026-08-29T09:00:00',
    ]);
    expect(occurrences[1]._recurrenceMasterId).toBe('event-1');
    expect(occurrences[1].id).toBe('event-1::repeat-2026-08-27');
  });

  it('expands custom weekly weekdays while keeping the series start', () => {
    const event = setEventRecurrence(makeEvent(), {
      frequency: 'WEEKLY',
      interval: 1,
      end: { type: 'after', occurrences: 5 },
      extraParts: ['BYDAY=MO,WE,FR'],
    });
    const occurrences = expandRecurringEvents(
      [event],
      new Date(2026, 7, 26),
      new Date(2026, 8, 6, 23, 59, 59),
      'Australia/Sydney'
    );

    expect(occurrences.map(item => item.start.toString())).toEqual([
      '2026-08-26T09:00:00',
      '2026-08-28T09:00:00',
      '2026-08-31T09:00:00',
      '2026-09-02T09:00:00',
      '2026-09-04T09:00:00',
    ]);
  });

  it('skips invalid monthly calendar dates instead of constraining them', () => {
    const event = setEventRecurrence(
      {
        ...makeEvent(),
        start: Temporal.PlainDateTime.from('2026-01-31T09:00'),
        end: Temporal.PlainDateTime.from('2026-01-31T10:00'),
      },
      {
        frequency: 'MONTHLY',
        interval: 1,
        end: { type: 'never' },
        extraParts: [],
      }
    );
    const occurrences = expandRecurringEvents(
      [event],
      new Date(2026, 0, 1),
      new Date(2026, 2, 31, 23, 59, 59)
    );

    expect(occurrences.map(item => item.start.toString())).toEqual([
      '2026-01-31T09:00:00',
      '2026-03-31T09:00:00',
    ]);
  });

  it('counts valid monthly occurrences for an After end', () => {
    const event = setEventRecurrence(
      {
        ...makeEvent(),
        start: Temporal.PlainDateTime.from('2026-01-31T09:00'),
        end: Temporal.PlainDateTime.from('2026-01-31T10:00'),
      },
      {
        frequency: 'MONTHLY',
        interval: 1,
        end: { type: 'after', occurrences: 2 },
        extraParts: [],
      }
    );
    const occurrences = expandRecurringEvents(
      [event],
      new Date(2026, 0, 1),
      new Date(2026, 3, 30, 23, 59, 59)
    );

    expect(occurrences.map(item => item.start.toString())).toEqual([
      '2026-01-31T09:00:00',
      '2026-03-31T09:00:00',
    ]);
  });
});
