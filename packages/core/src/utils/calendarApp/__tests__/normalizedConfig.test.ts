import type { CalendarAppConfig } from '@/types';

/**
 * Users write `allDaySortComparator={(a, b) => ...}` inline, which produces a
 * new function every render. Config sync compares that field by identity, so
 * without normalisation every render would look like a config change.
 *
 * This getter hands out one stable wrapper that forwards to whichever
 * comparator is current.
 */
import { createNormalizedCalendarAppConfigGetter } from '../normalizedConfig';

const noop = (): void => undefined;

const configWith = (
  allDaySortComparator?: CalendarAppConfig['allDaySortComparator']
) =>
  ({ views: ['week'], allDaySortComparator }) as unknown as CalendarAppConfig;

describe('createNormalizedCalendarAppConfigGetter', () => {
  it('passes the rest of the config through untouched', () => {
    const config = configWith();
    const getNormalized = createNormalizedCalendarAppConfigGetter(() => config);

    expect(getNormalized().views).toBe(config.views);
  });

  it('leaves the comparator undefined when the user supplied none', () => {
    const getNormalized = createNormalizedCalendarAppConfigGetter(() =>
      configWith()
    );

    expect(getNormalized().allDaySortComparator).toBeUndefined();
  });

  it('returns the same wrapper identity across calls', () => {
    // The whole point: a fresh inline comparator each render must not read as
    // a change downstream.
    let config = configWith(() => -1);
    const getNormalized = createNormalizedCalendarAppConfigGetter(() => config);

    const first = getNormalized().allDaySortComparator;
    config = configWith(() => 1);
    const second = getNormalized().allDaySortComparator;

    expect(first).toBe(second);
  });

  it('forwards to the latest comparator behind that stable identity', () => {
    let config = configWith(() => -1);
    const getNormalized = createNormalizedCalendarAppConfigGetter(() => config);

    const comparator = getNormalized().allDaySortComparator!;
    expect(comparator({} as never, {} as never)).toBe(-1);

    config = configWith(() => 1);
    getNormalized();

    expect(comparator({} as never, {} as never)).toBe(1);
  });

  it('falls back to 0 when the current comparator returns nothing', () => {
    const getNormalized = createNormalizedCalendarAppConfigGetter(() =>
      configWith(noop as never)
    );

    const comparator = getNormalized().allDaySortComparator!;

    expect(comparator({} as never, {} as never)).toBe(0);
  });

  it('drops the wrapper again once the user removes their comparator', () => {
    let config = configWith(() => -1);
    const getNormalized = createNormalizedCalendarAppConfigGetter(() => config);
    expect(getNormalized().allDaySortComparator).toBeDefined();

    config = configWith();

    expect(getNormalized().allDaySortComparator).toBeUndefined();
  });

  it('handles a comparator that only appears on a later read', () => {
    let config = configWith();
    const getNormalized = createNormalizedCalendarAppConfigGetter(() => config);
    expect(getNormalized().allDaySortComparator).toBeUndefined();

    config = configWith(() => 1);
    const comparator = getNormalized().allDaySortComparator;

    expect(comparator).toBeDefined();
    expect(comparator!({} as never, {} as never)).toBe(1);
  });
});
