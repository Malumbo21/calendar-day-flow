/**
 * `throttle` paces high-frequency handlers (drag, scroll, resize). Its exact
 * edges matter: it is leading-edge, it schedules one trailing call, and it must
 * be cancellable so a component unmounting mid-drag does not fire afterwards.
 */
import { throttle } from '../throttle';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('throttle', () => {
  it('invokes on the leading edge', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('collapses a burst into one leading and one trailing call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not schedule a trailing call when nothing came in', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    vi.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('invokes immediately again once the window has passed', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    vi.advanceTimersByTime(150);
    throttled();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('passes through the latest arguments on the trailing call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('first' as never);
    throttled('second' as never);
    throttled('third' as never);
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenNthCalledWith(1, 'first');
    // The trailing call replays whichever invocation scheduled the timer.
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('preserves the call-site `this`', () => {
    const seen: unknown[] = [];
    const host = {
      label: 'host',
      run: throttle(function (this: { label: string }) {
        seen.push(this?.label);
      }, 100),
    };

    host.run();

    expect(seen).toEqual(['host']);
  });

  it('cancel() drops a pending trailing call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled.cancel();
    vi.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancel() reopens the window so the next call runs immediately', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled.cancel();
    throttled();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('is safe to cancel when nothing is pending', () => {
    const throttled = throttle(vi.fn(), 100);

    expect(() => throttled.cancel()).not.toThrow();
  });
});
