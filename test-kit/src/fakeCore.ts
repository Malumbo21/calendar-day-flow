/**
 * The `@dayflow/core` surface, assembled from the stand-ins.
 *
 * Each adapter's test runner maps `@dayflow/core` here, so what the adapter
 * imports at runtime is this module — the real CustomRenderingStore plus a
 * renderer and an app that a test can drive.
 */
import { resetCalendarAppFake } from './fakeCalendarApp';
import { resetRenderers } from './fakeRenderer';
import { clearLifecycleLog } from './lifecycleLog';

export { CustomRenderingStore } from '../../packages/core/src/renderer/CustomRenderingStore';
export type { CustomRendering } from '../../packages/core/src/renderer/CustomRenderingStore';

export { FakeCalendarRenderer as CalendarRenderer } from './fakeRenderer';
export {
  FakeCalendarApp as CalendarApp,
  createConfigSyncSnapshot,
  createNormalizedCalendarAppConfigGetter,
  syncCalendarAppConfig,
} from './fakeCalendarApp';

/** Clear the transcript and every stand-in created by the previous test. */
export function resetCoreFake(): void {
  clearLifecycleLog();
  resetRenderers();
  resetCalendarAppFake();
}
