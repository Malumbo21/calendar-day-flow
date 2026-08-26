/**
 * `isDeepEqual` guards two hot paths: `CalendarRenderer.setProps` skips a
 * re-render when props are unchanged, and the adapter config sync skips an
 * `updateConfig` call. A false negative there means re-rendering the whole
 * calendar on every parent render.
 */
import { isDeepEqual } from '../compareUtils';

const noop = (): void => undefined;
const otherNoop = (): void => undefined;

describe('isDeepEqual — primitives', () => {
  it.each([
    ['identical numbers', 1, 1, true],
    ['different numbers', 1, 2, false],
    ['identical strings', 'a', 'a', true],
    ['different strings', 'a', 'b', false],
    ['both null', null, null, true],
    ['both undefined', undefined, undefined, true],
    ['null vs undefined', null, undefined, false],
    ['zero vs false', 0, false, false],
    ['empty string vs zero', '', 0, false],
  ])('%s', (_label, a, b, expected) => {
    expect(isDeepEqual(a, b)).toBe(expected);
  });

  it('treats NaN as unequal to itself, matching ===', () => {
    // Documenting the behaviour rather than endorsing it: a NaN in props will
    // always look changed.
    expect(isDeepEqual(Number.NaN, Number.NaN)).toBe(false);
  });
});

describe('isDeepEqual — dates', () => {
  it('compares dates by their timestamp, not identity', () => {
    expect(isDeepEqual(new Date('2026-08-23'), new Date('2026-08-23'))).toBe(
      true
    );
  });

  it('separates dates with different timestamps', () => {
    expect(isDeepEqual(new Date('2026-08-23'), new Date('2026-08-24'))).toBe(
      false
    );
  });

  it('does not equate a date with its timestamp', () => {
    const date = new Date('2026-08-23');
    expect(isDeepEqual(date, date.getTime())).toBe(false);
  });
});

describe('isDeepEqual — objects', () => {
  it('compares plain objects structurally', () => {
    expect(isDeepEqual({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toBe(true);
  });

  it('ignores key order', () => {
    expect(isDeepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  it('separates objects with different key counts', () => {
    expect(isDeepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('separates objects with the same key count but different keys', () => {
    expect(isDeepEqual({ a: 1 }, { b: 1 })).toBe(false);
  });

  it('recurses into nested objects', () => {
    expect(
      isDeepEqual({ theme: { mode: 'dark' } }, { theme: { mode: 'dark' } })
    ).toBe(true);
    expect(
      isDeepEqual({ theme: { mode: 'dark' } }, { theme: { mode: 'light' } })
    ).toBe(false);
  });

  it('separates values with different prototypes', () => {
    class Wrapper {
      a = 1;
    }
    expect(isDeepEqual(new Wrapper(), { a: 1 })).toBe(false);
  });

  it('separates an array from an object with the same indices', () => {
    expect(isDeepEqual([1, 2], { 0: 1, 1: 2 })).toBe(false);
  });
});

describe('isDeepEqual — arrays', () => {
  it('compares arrays element by element', () => {
    expect(isDeepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it('is order-sensitive', () => {
    expect(isDeepEqual([1, 2], [2, 1])).toBe(false);
  });

  it('separates arrays of different lengths', () => {
    expect(isDeepEqual([1], [1, 2])).toBe(false);
  });

  it('recurses into arrays of objects, like a calendars list', () => {
    const previous = [{ id: 'a', isVisible: true }];
    expect(isDeepEqual(previous, [{ id: 'a', isVisible: true }])).toBe(true);
    expect(isDeepEqual(previous, [{ id: 'a', isVisible: false }])).toBe(false);
  });

  it('handles empty arrays and objects', () => {
    expect(isDeepEqual([], [])).toBe(true);
    expect(isDeepEqual({}, {})).toBe(true);
    expect(isDeepEqual([], {})).toBe(false);
  });
});

describe('isDeepEqual — functions', () => {
  it('compares functions by identity', () => {
    expect(isDeepEqual(noop, noop)).toBe(true);
    expect(isDeepEqual(noop, otherNoop)).toBe(false);
  });

  it('separates objects holding different function instances', () => {
    // This is why adapters must keep callbacks stable: a fresh arrow function
    // every render reads as a config change.
    expect(isDeepEqual({ onClick: noop }, { onClick: otherNoop })).toBe(false);
  });
});
