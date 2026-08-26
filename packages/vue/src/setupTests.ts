import '@testing-library/jest-dom/vitest';

// jsdom does not implement ResizeObserver, which the calendar's layout code uses.
const noop = (): void => undefined;

global.ResizeObserver = class ResizeObserver {
  observe = noop;
  unobserve = noop;
  disconnect = noop;
};
