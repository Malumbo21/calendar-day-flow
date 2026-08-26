import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

const here = dirname(fileURLToPath(import.meta.url));
const testKit = resolve(here, '../../test-kit/src/index.ts');

export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: {
    // The adapter's contract is the CustomRenderingStore protocol, not the
    // calendar's rendering internals. See test-kit.
    alias: {
      '@dayflow/core': testKit,
      '@test-kit': testKit,
    },
    conditions: ['browser'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.ts'],
  },
});
