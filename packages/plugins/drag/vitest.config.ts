import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@drag': resolve(here, 'src'),
      '@dayflow/core': resolve(here, '../../core/src/index.ts'),
      '@dayflow/ui-range-picker': resolve(
        here,
        '../../ui/range-picker/src/index.ts'
      ),
      '@dayflow/ui-context-menu': resolve(
        here,
        '../../ui/context-menu/src/index.ts'
      ),
      '@ui-range-picker': resolve(here, '../../ui/range-picker/src'),
      '@': resolve(here, '../../core/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
