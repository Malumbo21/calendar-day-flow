/**
 * The adapter conformance contract.
 *
 * These assertions read the lifecycle transcript rather than any one
 * framework's API, so React portals, Vue Teleports, Angular templates and
 * Svelte actions are all held to the same ordering rules. An adapter that
 * drifts from the others fails here rather than in a user's browser.
 *
 * Each helper throws (via `expect`) on violation, so they compose inside any
 * test. Keeping the narrowing and filtering in here also keeps conditionals out
 * of test bodies, where they would hide which branch actually ran.
 */
import { emits, indexOfRendererEvent, rendererOf } from './lifecycleLog';
import type { LifecycleEvent } from './lifecycleLog';

/** Every renderer id that appears in the transcript, in creation order. */
export function rendererIds(log: LifecycleEvent[]): number[] {
  return log
    .filter(event => event.type === 'construct')
    .map(event => rendererOf(event))
    .filter((id): id is number => id !== undefined);
}

const firstIndexOf = (
  log: LifecycleEvent[],
  type: LifecycleEvent['type'],
  renderer: number
): number => indexOfRendererEvent(type, renderer, log);

/**
 * Rule 1 — subscribe before mount.
 *
 * `mount()` registers placeholders synchronously. An adapter that subscribes
 * afterwards misses that burst and only catches up on a later commit, which is
 * a frame with an empty slot on screen.
 */
export function expectSubscribeBeforeMount(log: LifecycleEvent[]): void {
  const ids = rendererIds(log);
  expect(ids.length).toBeGreaterThan(0);

  const violations = ids
    .map(id => ({
      id,
      subscribeAt: firstIndexOf(log, 'subscribe', id),
      mountAt: firstIndexOf(log, 'mount', id),
    }))
    // A renderer that never mounted has no ordering to police.
    .filter(entry => entry.mountAt > -1)
    .filter(
      entry => entry.subscribeAt === -1 || entry.subscribeAt > entry.mountAt
    );

  expect(violations).toEqual([]);
}

/**
 * Rule 2 — unsubscribe before unmount.
 *
 * `unmount()` unregisters every slot and the store notifies. An adapter still
 * listening at that moment clears its portal list to empty — the flicker.
 */
export function expectUnsubscribeBeforeUnmount(log: LifecycleEvent[]): void {
  const violations = rendererIds(log)
    .map(id => ({
      id,
      unsubscribeAt: firstIndexOf(log, 'unsubscribe', id),
      unmountAt: firstIndexOf(log, 'unmount', id),
    }))
    // Still mounted: nothing to order yet.
    .filter(entry => entry.unmountAt > -1)
    .filter(
      entry =>
        entry.unsubscribeAt === -1 || entry.unsubscribeAt > entry.unmountAt
    );

  expect(violations).toEqual([]);
}

/**
 * Rule 3 — never hold an empty map after mount.
 *
 * Stated so that it does not depend on the ordering it polices: a renderer's
 * slots exist from mount onward, so any empty map delivered after that point
 * means every portal was dropped.
 */
export function expectNoEmptyEmitAfterMount(log: LifecycleEvent[]): void {
  const offenders = log.filter((event, index) => {
    const mountAt = firstIndexOf(log, 'mount', rendererOf(event) ?? -1);
    return (
      event.type === 'emit' &&
      event.size === 0 &&
      mountAt > -1 &&
      mountAt < index
    );
  });

  expect(offenders).toEqual([]);
}

/**
 * Rule 4 — an empty state must be superseded in the same synchronous block.
 *
 * The empty map an adapter sees when it subscribes before mounting is benign
 * only because `mount()` follows immediately. Asserting the pairing keeps
 * "subscribe early" from degrading into "render empty and hope".
 */
export function expectEmptyStatesAreSuperseded(log: LifecycleEvent[]): void {
  const all = emits(log);
  const danglingEmpties = all.filter((emit, index) => {
    const next = all[index + 1];
    return (
      emit.size === 0 &&
      (next === undefined || next.renderer !== emit.renderer || next.size === 0)
    );
  });

  expect(danglingEmpties).toEqual([]);
}

/** All four rules at once — the conformance suite an adapter must pass. */
export function expectAdapterContract(log: LifecycleEvent[]): void {
  expectSubscribeBeforeMount(log);
  expectUnsubscribeBeforeUnmount(log);
  expectNoEmptyEmitAfterMount(log);
  expectEmptyStatesAreSuperseded(log);
}
