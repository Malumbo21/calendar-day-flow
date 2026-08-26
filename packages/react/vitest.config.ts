import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const here = dirname(fileURLToPath(import.meta.url));
const testKit = resolve(here, '../../test-kit/src/index.ts');

export default defineConfig({
  resolve: {
    alias: {
      '@dayflow/core': testKit,
      '@test-kit': testKit,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/index.ts', 'src/__tests__/**'],
    },
  },
});
