/**
 * CustomRenderingStore is the seam between the Preact core and every framework
 * adapter: Preact registers placeholder <div>s here, adapters subscribe and
 * portal their own content into them.
 *
 * Its notification rules are deliberately narrow — it only wakes listeners for
 * slots someone has actually overridden — so a calendar with no custom content
 * does no adapter work at all. Those rules are what these tests pin down.
 */
import { CustomRenderingStore } from '../CustomRenderingStore';
import type { CustomRendering } from '../CustomRenderingStore';

const makeRendering = (
  generatorName: string,
  id = `${generatorName}-1`,
  generatorArgs: unknown = {}
): CustomRendering => ({
  id,
  containerEl: document.createElement('div'),
  generatorName,
  generatorArgs,
});

describe('CustomRenderingStore — overrides', () => {
  it('starts with no overrides when constructed bare', () => {
    const store = new CustomRenderingStore();

    expect(store.isOverridden('titleBarSlot')).toBe(false);
  });

  it('accepts initial overrides so the first render already knows them', () => {
    // The adapter computes overrides synchronously and hands them to the
    // renderer's constructor. Without that, the first Preact render would draw
    // default content and swap it a frame later.
    const store = new CustomRenderingStore(['titleBarSlot', 'calendarHeader']);

    expect(store.isOverridden('titleBarSlot')).toBe(true);
    expect(store.isOverridden('calendarHeader')).toBe(true);
    expect(store.isOverridden('eventContentWeek')).toBe(false);
  });

  it('ignores an empty initial override list', () => {
    const store = new CustomRenderingStore([]);

    expect(store.isOverridden('titleBarSlot')).toBe(false);
  });

  it('replaces the override set wholesale rather than merging', () => {
    const store = new CustomRenderingStore(['titleBarSlot']);

    store.setOverrides(['calendarHeader']);

    expect(store.isOverridden('titleBarSlot')).toBe(false);
    expect(store.isOverridden('calendarHeader')).toBe(true);
  });
});

describe('CustomRenderingStore — registration', () => {
  it('hands a subscriber the current map immediately', () => {
    const store = new CustomRenderingStore(['titleBarSlot']);
    store.register(makeRendering('titleBarSlot'));
    const listener = vi.fn();

    store.subscribe(listener);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].size).toBe(1);
  });

  it('notifies when an overridden slot registers', () => {
    const store = new CustomRenderingStore(['titleBarSlot']);
    const listener = vi.fn();
    store.subscribe(listener);
    listener.mockClear();

    store.register(makeRendering('titleBarSlot'));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].get('titleBarSlot-1')).toMatchObject({
      generatorName: 'titleBarSlot',
    });
  });

  it('stays quiet when a slot nobody overrode registers', () => {
    // A default calendar registers placeholders for every slot. Waking the
    // adapter for each one would be pure churn.
    const store = new CustomRenderingStore(['titleBarSlot']);
    const listener = vi.fn();
    store.subscribe(listener);
    listener.mockClear();

    store.register(makeRendering('eventContentWeek'));

    expect(listener).not.toHaveBeenCalled();
  });

  it('still records a non-overridden rendering even without notifying', () => {
    // It has to be in the map: if that slot is overridden later, the adapter
    // must be able to find the placeholder that already exists.
    const store = new CustomRenderingStore();
    store.register(makeRendering('eventContentWeek'));
    const listener = vi.fn();

    store.subscribe(listener);

    expect(listener.mock.calls[0][0].size).toBe(1);
  });

  it('surfaces a previously silent rendering once its slot is overridden', () => {
    const store = new CustomRenderingStore();
    store.register(makeRendering('eventContentWeek'));
    const listener = vi.fn();
    store.subscribe(listener);
    listener.mockClear();

    store.setOverrides(['eventContentWeek']);

    expect(listener).toHaveBeenCalled();
    expect(listener.mock.calls[0][0].size).toBe(1);
  });

  it('keeps registrations keyed by id, not by slot name', () => {
    // Many events render the same slot name at once; each needs its own entry.
    const store = new CustomRenderingStore(['eventContentWeek']);
    store.register(makeRendering('eventContentWeek', 'a'));
    store.register(makeRendering('eventContentWeek', 'b'));
    const listener = vi.fn();

    store.subscribe(listener);

    expect(listener.mock.calls[0][0].size).toBe(2);
  });

  it('overwrites an entry re-registered under the same id', () => {
    const store = new CustomRenderingStore(['titleBarSlot']);
    const first = makeRendering('titleBarSlot', 'same', { v: 1 });
    const second = makeRendering('titleBarSlot', 'same', { v: 2 });
    store.register(first);
    store.register(second);
    const listener = vi.fn();

    store.subscribe(listener);

    const map = listener.mock.calls[0][0];
    expect(map.size).toBe(1);
    expect(map.get('same').generatorArgs).toEqual({ v: 2 });
  });
});

describe('CustomRenderingStore — unregistration', () => {
  it('notifies when an overridden slot unregisters', () => {
    const store = new CustomRenderingStore(['titleBarSlot']);
    store.register(makeRendering('titleBarSlot'));
    const listener = vi.fn();
    store.subscribe(listener);
    listener.mockClear();

    store.unregister('titleBarSlot-1');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].size).toBe(0);
  });

  it('stays quiet unregistering a slot nobody overrode', () => {
    const store = new CustomRenderingStore(['titleBarSlot']);
    store.register(makeRendering('eventContentWeek'));
    const listener = vi.fn();
    store.subscribe(listener);
    listener.mockClear();

    store.unregister('eventContentWeek-1');

    expect(listener).not.toHaveBeenCalled();
  });

  it('is a no-op for an id it never saw', () => {
    const store = new CustomRenderingStore(['titleBarSlot']);
    const listener = vi.fn();
    store.subscribe(listener);
    listener.mockClear();

    expect(() => store.unregister('never-existed')).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
  });

  it('goes quiet once overrides are cleared, even as slots tear down', () => {
    // This is what lets an adapter clear overrides before unmounting: the
    // renderer's teardown then unregisters everything without waking anyone.
    const store = new CustomRenderingStore(['titleBarSlot']);
    store.register(makeRendering('titleBarSlot'));
    const listener = vi.fn();
    store.subscribe(listener);

    store.setOverrides([]);
    listener.mockClear();
    store.unregister('titleBarSlot-1');

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('CustomRenderingStore — subscriptions', () => {
  it('stops calling a listener after it unsubscribes', () => {
    const store = new CustomRenderingStore(['titleBarSlot']);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    listener.mockClear();

    unsubscribe();
    store.register(makeRendering('titleBarSlot'));

    expect(listener).not.toHaveBeenCalled();
  });

  it('supports several listeners independently', () => {
    const store = new CustomRenderingStore(['titleBarSlot']);
    const first = vi.fn();
    const second = vi.fn();
    const offFirst = store.subscribe(first);
    store.subscribe(second);
    first.mockClear();
    second.mockClear();

    offFirst();
    store.register(makeRendering('titleBarSlot'));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('notifies rendering listeners on every setOverrides call', () => {
    const store = new CustomRenderingStore();
    const listener = vi.fn();
    store.subscribe(listener);
    listener.mockClear();

    store.setOverrides(['titleBarSlot']);

    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('CustomRenderingStore — override listeners', () => {
  it('calls an override listener immediately on subscribe', () => {
    const store = new CustomRenderingStore();
    const listener = vi.fn();

    store.subscribeToOverrides(listener);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('wakes override listeners only for setOverrides, not registration', () => {
    // ContentSlot uses this channel so a slot re-renders when its override
    // status flips, but not on every unrelated register/unregister.
    const store = new CustomRenderingStore(['titleBarSlot']);
    const listener = vi.fn();
    store.subscribeToOverrides(listener);
    listener.mockClear();

    store.register(makeRendering('titleBarSlot'));
    expect(listener).not.toHaveBeenCalled();

    store.setOverrides(['calendarHeader']);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('stops calling an override listener after it unsubscribes', () => {
    const store = new CustomRenderingStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribeToOverrides(listener);
    listener.mockClear();

    unsubscribe();
    store.setOverrides(['titleBarSlot']);

    expect(listener).not.toHaveBeenCalled();
  });
});
