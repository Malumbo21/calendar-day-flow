import {
  createFakeApp,
  lifecycleLog,
  resetCoreFake,
  expectAdapterContract,
} from '@test-kit';
/**
 * The React adapter against the shared cross-framework contract.
 *
 * The same assertions run for Vue, Angular and Svelte. If one adapter drifts
 * from the others on renderer lifecycle ordering, this is what catches it.
 */
import { render } from '@testing-library/react';
import React, { StrictMode } from 'react';

import { DayFlowCalendar } from '../DayFlowCalendar';

beforeEach(() => {
  resetCoreFake();
});

const slot = () => <span>content</span>;

describe('React adapter conformance', () => {
  it('satisfies the contract on a plain mount', () => {
    const app = createFakeApp();
    render(<DayFlowCalendar calendar={app as never} titleBarSlot={slot} />);

    expectAdapterContract(lifecycleLog);
  });

  it('satisfies the contract on unmount', () => {
    const app = createFakeApp();
    const view = render(
      <DayFlowCalendar calendar={app as never} titleBarSlot={slot} />
    );
    view.unmount();

    expectAdapterContract(lifecycleLog);
  });

  it('satisfies the contract when the app instance is swapped', () => {
    const first = createFakeApp();
    const second = createFakeApp();
    const view = render(
      <DayFlowCalendar calendar={first as never} titleBarSlot={slot} />
    );
    view.rerender(
      <DayFlowCalendar calendar={second as never} titleBarSlot={slot} />
    );

    expectAdapterContract(lifecycleLog);
  });

  it('satisfies the contract under StrictMode double-mounting', () => {
    const app = createFakeApp();
    render(
      <StrictMode>
        <DayFlowCalendar calendar={app as never} titleBarSlot={slot} />
      </StrictMode>
    );

    expectAdapterContract(lifecycleLog);
  });
});
