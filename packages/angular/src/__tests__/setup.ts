import '@angular/compiler';
import '@analogjs/vitest-angular/setup-zone';
import '@testing-library/jest-dom/vitest';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// jsdom does not implement ResizeObserver, which the calendar's layout code uses.
const noop = (): void => undefined;

global.ResizeObserver = class ResizeObserver {
  observe = noop;
  unobserve = noop;
  disconnect = noop;
};
