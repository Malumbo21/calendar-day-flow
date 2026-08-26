/**
 * Stand-in for `CalendarRenderer`.
 *
 * An adapter's job is not to draw a calendar — it is to keep a framework
 * renderer in sync with the core's CustomRenderingStore. So this keeps the
 * *real* store (registration and notification semantics are the thing under
 * test) and replaces only the Preact render with something a test can drive.
 *
 * It mirrors the real renderer's observable behaviour:
 *   - the constructor pushes initial overrides onto the app and subscribes to it
 *   - `mount()` renders synchronously, registering one placeholder per override
 *   - `unmount()` tears those placeholders down, which notifies the store
 */
import { CustomRenderingStore } from '../../packages/core/src/renderer/CustomRenderingStore';
import type {
  CustomRendering,
  CustomRenderingListener,
} from '../../packages/core/src/renderer/CustomRenderingStore';
import type { FakeApp } from './fakeApp';
import { record } from './lifecycleLog';

let rendererSeq = 0;

export const createdRenderers: FakeCalendarRenderer[] = [];

export function resetRenderers(): void {
  rendererSeq = 0;
  createdRenderers.length = 0;
}

export class FakeCalendarRenderer {
  readonly id: number;
  readonly store: CustomRenderingStore;
  props: Record<string, unknown> = {};

  private container: HTMLElement | null = null;
  private appUnsubscribe: (() => void) | null = null;
  private slotIds: string[] = [];
  private overrides: string[];
  private slotSeq = 0;

  constructor(app: FakeApp, initialOverrides?: string[]) {
    rendererSeq += 1;
    this.id = rendererSeq;
    this.overrides = initialOverrides ? [...initialOverrides] : [];
    this.store = new CustomRenderingStore(initialOverrides);

    record({
      type: 'construct',
      renderer: this.id,
      overrides: [...this.overrides],
    });

    // Mirror the real renderer: initial overrides are pushed onto the app here.
    if (initialOverrides) {
      app.setOverrides(initialOverrides);
    }
    this.appUnsubscribe = app.subscribe(() => {
      /* re-render hook; not exercised by these tests */
    });

    this.instrumentStore();
    createdRenderers.push(this);
  }

  setProps(props: Record<string, unknown>): void {
    this.props = props;
    record({ type: 'setProps', renderer: this.id, props });
  }

  /** Synchronous, like the real mount: placeholders exist before paint. */
  mount(container: HTMLElement): void {
    record({ type: 'mount', renderer: this.id });
    this.container = container;
    this.renderSlots();
  }

  unmount(): void {
    record({ type: 'unmount', renderer: this.id });
    // The real unmount renders null, which unmounts every ContentSlot and
    // triggers store.unregister() for each one.
    this.clearSlots();
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    this.appUnsubscribe?.();
    this.appUnsubscribe = null;
  }

  getCustomRenderingStore(): CustomRenderingStore {
    return this.store;
  }

  /** Test hook: re-run the "Preact render" for the current overrides. */
  renderSlots(generatorArgs: Record<string, unknown> = {}): void {
    const { container } = this;
    if (!container) {
      return;
    }
    this.clearSlots();
    this.overrides.forEach(generatorName => {
      this.slotSeq += 1;
      const id = `r${this.id}-slot-${this.slotSeq}`;
      const el = document.createElement('div');
      el.dataset['slot'] = generatorName;
      container.append(el);
      this.slotIds.push(id);
      this.store.register({
        id,
        containerEl: el,
        generatorName,
        generatorArgs: { slot: generatorName, ...generatorArgs },
      });
    });
  }

  private clearSlots(): void {
    this.slotIds.forEach(id => this.store.unregister(id));
    this.slotIds = [];
  }

  /**
   * Wrap subscribe/setOverrides so the log records what the *adapter* actually
   * observed, not merely what the store did internally. Whether a notification
   * reaches the adapter is precisely the thing the contract cares about.
   */
  private instrumentStore(): void {
    const rawSubscribe = this.store.subscribe.bind(this.store);
    this.store.subscribe = (listener: CustomRenderingListener) => {
      record({ type: 'subscribe', renderer: this.id });
      const wrapped: CustomRenderingListener = (
        map: Map<string, CustomRendering>
      ) => {
        record({
          type: 'emit',
          renderer: this.id,
          size: map.size,
          names: [...map.values()].map(rendering => rendering.generatorName),
        });
        listener(map);
      };
      const off = rawSubscribe(wrapped);
      return () => {
        record({ type: 'unsubscribe', renderer: this.id });
        off();
      };
    };

    const rawSetOverrides = this.store.setOverrides.bind(this.store);
    this.store.setOverrides = (names: string[]) => {
      record({
        type: 'setOverrides',
        renderer: this.id,
        overrides: [...names],
      });
      this.overrides = [...names];
      rawSetOverrides(names);
    };
  }
}
