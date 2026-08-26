/**
 * Lifecycle contract for the React adapter.
 *
 * Two renderers are involved in every mount: Preact draws the calendar and
 * registers placeholder <div>s, React fills those <div>s with portals. The
 * ordering between them is what matters — get it wrong and custom content
 * blanks for a frame on every remount.
 *
 * The ordering assertions themselves live in `@test-kit`, so
 * all four adapters are held to the same rules.
 */
import {
  createFakeApp,
  createdRenderers,
  expectEmptyStatesAreSuperseded,
  expectNoEmptyEmitAfterMount,
  expectSubscribeBeforeMount,
  expectUnsubscribeBeforeUnmount,
  indexOfRendererEvent,
  initialOverrides,
  lifecycleLog,
  overrideUpdates,
  propUpdates,
  resetCoreFake,
} from '@test-kit';
import type { FakeApp } from '@test-kit';
import { render, screen, act } from '@testing-library/react';
import React, { StrictMode } from 'react';

import { DayFlowCalendar } from '../DayFlowCalendar';

const titleBar = () => <span>my toolbar</span>;

beforeEach(() => {
  resetCoreFake();
});

describe('DayFlowCalendar — mount', () => {
  it('renders the wrapper div and mounts a renderer into it', () => {
    const app = createFakeApp();
    const { container } = render(<DayFlowCalendar calendar={app as never} />);

    expect(container.querySelector('.df-calendar-wrapper')).toBeInTheDocument();
    expect(createdRenderers).toHaveLength(1);
    expect(lifecycleLog.filter(e => e.type === 'mount')).toHaveLength(1);
  });

  it('subscribes to the store before mounting the renderer', () => {
    // If mount ran first, the placeholder registrations from the synchronous
    // Preact render would land before anyone was listening, and the adapter
    // would only catch up on a later commit — one blank frame.
    const app = createFakeApp();
    render(<DayFlowCalendar calendar={app as never} titleBarSlot={titleBar} />);

    expectSubscribeBeforeMount(lifecycleLog);
  });

  it('computes overrides from defined render props only', () => {
    const app = createFakeApp();
    render(
      <DayFlowCalendar
        calendar={app as never}
        titleBarSlot={titleBar}
        eventContentWeek={undefined}
      />
    );

    expect(initialOverrides(lifecycleLog)).toEqual(['titleBarSlot']);
  });

  it('adds sidebar plugin render functions to the overrides', () => {
    const app = createFakeApp([
      {
        name: 'sidebar',
        config: { render: titleBar, renderSidebarHeader: titleBar },
      },
    ]);
    render(<DayFlowCalendar calendar={app as never} />);

    const overrides = initialOverrides(lifecycleLog);
    expect(overrides).toEqual(
      expect.arrayContaining(['sidebar', 'sidebarHeader'])
    );
    expect(overrides).not.toContain('createCalendarDialog');
  });
});

describe('DayFlowCalendar — teardown ordering', () => {
  const remountWithNewApp = () => {
    const first = createFakeApp();
    const second = createFakeApp();
    const view = render(
      <DayFlowCalendar calendar={first as never} titleBarSlot={titleBar} />
    );
    view.rerender(
      <DayFlowCalendar calendar={second as never} titleBarSlot={titleBar} />
    );
    return { view, first, second };
  };

  it('unsubscribes before unmounting the old renderer', () => {
    // unmount() unregisters every slot, which notifies the store. Unsubscribing
    // first means that notification never reaches React, so the portal list is
    // never cleared to empty.
    remountWithNewApp();

    expectUnsubscribeBeforeUnmount(lifecycleLog);
  });

  it('never notifies the adapter with an empty map once a renderer has mounted', () => {
    // Stated so it does not depend on the very ordering it polices: a
    // renderer's slots exist from mount onward, so an empty map after that
    // point means React dropped every portal.
    remountWithNewApp();

    expectNoEmptyEmitAfterMount(lifecycleLog);
  });

  it('always supersedes an empty state within the same synchronous block', () => {
    // Subscribing before mount means the initial sync sees an empty store.
    // That is harmless only because mount() follows synchronously in the same
    // layout effect, so React commits once, already populated.
    remountWithNewApp();

    expectEmptyStatesAreSuperseded(lifecycleLog);
  });

  it('keeps the custom content in the document across the swap', () => {
    const { view } = remountWithNewApp();

    expect(screen.getByText('my toolbar')).toBeInTheDocument();
    view.unmount();
  });

  it('tears the old renderer down completely before the new one mounts', () => {
    remountWithNewApp();

    const oldUnmountAt = indexOfRendererEvent('unmount', 1, lifecycleLog);
    const newConstructAt = indexOfRendererEvent('construct', 2, lifecycleLog);
    expect(oldUnmountAt).toBeLessThan(newConstructAt);
    expect(createdRenderers).toHaveLength(2);
  });
});

describe('DayFlowCalendar — StrictMode', () => {
  it('survives React 18 double-invoked effects with content intact', () => {
    // StrictMode mounts, tears down, and remounts every effect — the same
    // teardown/setup sequence as a remount, run on purpose.
    const app = createFakeApp();
    render(
      <StrictMode>
        <DayFlowCalendar calendar={app as never} titleBarSlot={titleBar} />
      </StrictMode>
    );

    expect(screen.getByText('my toolbar')).toBeInTheDocument();
    expectNoEmptyEmitAfterMount(lifecycleLog);
    expectUnsubscribeBeforeUnmount(lifecycleLog);
  });
});

describe('DayFlowCalendar — updates', () => {
  it('does not touch overrides when the render props are unchanged', () => {
    const app = createFakeApp();
    const view = render(
      <DayFlowCalendar calendar={app as never} titleBarSlot={titleBar} />
    );

    const before = overrideUpdates(lifecycleLog).length;
    view.rerender(
      <DayFlowCalendar calendar={app as never} titleBarSlot={titleBar} />
    );

    expect(overrideUpdates(lifecycleLog)).toHaveLength(before);
  });

  it('pushes new overrides to both the store and the app when a slot appears', () => {
    const app = createFakeApp();
    const view = render(<DayFlowCalendar calendar={app as never} />);

    view.rerender(
      <DayFlowCalendar calendar={app as never} titleBarSlot={titleBar} />
    );

    expect(overrideUpdates(lifecycleLog).at(-1)).toMatchObject({
      overrides: ['titleBarSlot'],
    });
    expect((app as FakeApp).overrides).toEqual(['titleBarSlot']);
  });

  it('forwards renderer-level props on every update', () => {
    const app = createFakeApp();
    const view = render(
      <DayFlowCalendar calendar={app as never} collapsedSafeAreaLeft={10} />
    );
    view.rerender(
      <DayFlowCalendar calendar={app as never} collapsedSafeAreaLeft={24} />
    );

    expect(propUpdates(lifecycleLog).at(-1)).toMatchObject({
      props: { collapsedSafeAreaLeft: 24 },
    });
  });
});

describe('DayFlowCalendar — unmount', () => {
  it('unsubscribes, clears overrides, and unmounts the renderer', () => {
    const app = createFakeApp();
    const view = render(
      <DayFlowCalendar calendar={app as never} titleBarSlot={titleBar} />
    );

    act(() => {
      view.unmount();
    });

    expectUnsubscribeBeforeUnmount(lifecycleLog);
    expect(screen.queryByText('my toolbar')).not.toBeInTheDocument();
  });
});
