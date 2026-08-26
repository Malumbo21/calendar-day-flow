import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

const here = dirname(fileURLToPath(import.meta.url));
const testKit = resolve(here, '../../test-kit/src');

export default defineConfig({
  plugins: [angular({ tsconfig: './tsconfig.spec.json' })],
  resolve: {
    alias: {
      '@dayflow/core': testKit,
      '@test-kit': testKit,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/public-api.ts', 'src/__tests__/**'],
    },
  },
});
