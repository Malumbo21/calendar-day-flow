import { record } from './lifecycleLog';

export type FakePlugin = { name: string; config?: Record<string, unknown> };

/** The core notifies app subscribers with the app itself. */
export type AppListener = (app: FakeApp) => void;

/** Minimal ICalendarApp stand-in with the surface the adapters touch. */
export interface FakeApp {
  state: { plugins: FakePlugin[] };
  setOverrides: (names: string[]) => void;
  subscribe: (listener: AppListener) => () => void;
  notify: () => void;
  overrides: string[];
}

export function createFakeApp(plugins: FakePlugin[] = []): FakeApp {
  const listeners = new Set<AppListener>();
  const app: FakeApp = {
    state: { plugins },
    overrides: [],
    setOverrides(names: string[]) {
      app.overrides = names;
      record({ type: 'appSetOverrides', overrides: [...names] });
    },
    subscribe(listener: AppListener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    notify() {
      listeners.forEach(fn => fn(app));
    },
  };
  return app;
}
