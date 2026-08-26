import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@outlook-sync': resolve(here, 'src'),
      '@dayflow/sync-core': resolve(here, '../sync-core/src/index.ts'),
      '@dayflow/core': resolve(here, '../../core/src/caldav-entry.ts'),
      '@': resolve(here, '../../core/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
