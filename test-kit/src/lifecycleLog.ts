/**
 * A single ordered transcript of everything the stand-in core does, shared by
 * all four adapter suites.
 *
 * The adapter bugs worth catching are ordering bugs, and ordering is only
 * visible as a sequence — so the kit records one flat log rather than a set of
 * spies, and the contract assertions read it as a timeline.
 */

/** Every observable step a renderer takes, in order, across all instances. */
export type LifecycleEvent =
  | { type: 'construct'; renderer: number; overrides: string[] }
  | { type: 'subscribe'; renderer: number }
  | { type: 'unsubscribe'; renderer: number }
  | { type: 'mount'; renderer: number }
  | { type: 'unmount'; renderer: number }
  | { type: 'setProps'; renderer: number; props: Record<string, unknown> }
  | { type: 'setOverrides'; renderer: number; overrides: string[] }
  | { type: 'appSetOverrides'; overrides: string[] }
  /** A store notification actually delivered to the adapter. */
  | { type: 'emit'; renderer: number; size: number; names: string[] };

export const lifecycleLog: LifecycleEvent[] = [];

export function record(event: LifecycleEvent): void {
  lifecycleLog.push(event);
}

export function clearLifecycleLog(): void {
  lifecycleLog.length = 0;
}

/** The renderer id an event belongs to, or undefined for app-level events. */
export function rendererOf(event: LifecycleEvent): number | undefined {
  return 'renderer' in event ? event.renderer : undefined;
}

/**
 * Overrides the first renderer was constructed with.
 *
 * Reading this needs a type narrow, which belongs out here rather than inside a
 * test body where a conditional would hide which branch ran.
 */
export function initialOverrides(
  log: LifecycleEvent[] = lifecycleLog
): string[] {
  const construct = log.find(event => event.type === 'construct');
  return construct?.type === 'construct' ? construct.overrides : [];
}

/** Every store notification delivered to the adapter, in order. */
export function emits(
  log: LifecycleEvent[] = lifecycleLog
): Array<Extract<LifecycleEvent, { type: 'emit' }>> {
  return log.filter(
    (event): event is Extract<LifecycleEvent, { type: 'emit' }> =>
      event.type === 'emit'
  );
}

/** Every `store.setOverrides` call, in order. */
export function overrideUpdates(
  log: LifecycleEvent[] = lifecycleLog
): Array<Extract<LifecycleEvent, { type: 'setOverrides' }>> {
  return log.filter(
    (event): event is Extract<LifecycleEvent, { type: 'setOverrides' }> =>
      event.type === 'setOverrides'
  );
}

/** Every `renderer.setProps` call, in order. */
export function propUpdates(
  log: LifecycleEvent[] = lifecycleLog
): Array<Extract<LifecycleEvent, { type: 'setProps' }>> {
  return log.filter(
    (event): event is Extract<LifecycleEvent, { type: 'setProps' }> =>
      event.type === 'setProps'
  );
}

/** Index of the first event matching `predicate`, or -1. */
export function indexOfEvent(
  predicate: (event: LifecycleEvent) => boolean,
  log: LifecycleEvent[] = lifecycleLog
): number {
  return log.findIndex(event => predicate(event));
}

/**
 * Index of the first `type` event belonging to `renderer`, or -1.
 *
 * Lives here rather than in a test body so that matching two fields at once
 * does not read as a conditional inside `it()`.
 */
export function indexOfRendererEvent(
  type: LifecycleEvent['type'],
  renderer: number,
  log: LifecycleEvent[] = lifecycleLog
): number {
  return log.findIndex(
    event => event.type === type && rendererOf(event) === renderer
  );
}
