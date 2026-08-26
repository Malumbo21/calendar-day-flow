import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@caldav': resolve(here, 'src'),
      '@dayflow/sync-core': resolve(here, '../sync-core/src/index.ts'),
      '@dayflow/core': resolve(here, '../../core/src/caldav-entry.ts'),
      '@': resolve(here, '../../core/src'),
      '@dayflow/ui-context-menu': resolve(
        here,
        '../../ui/context-menu/src/index.ts'
      ),
      '@dayflow/ui-range-picker': resolve(
        here,
        '../../ui/range-picker/src/index.ts'
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
