import { metaSchema } from 'fumadocs-core/source/schema';
import {
  defineConfig,
  defineDocs,
  defineCollections,
  frontmatterSchema,
} from 'fumadocs-mdx/config';
import { z } from 'zod';

const customPageSchema = frontmatterSchema.extend({
  title: z.string().optional(),
  status: z.string().optional(),
});

const docsOptions = {
  docs: {
    schema: customPageSchema,
    // Load compiled MDX bodies lazily. Without this, the generated
    // `.source/server.ts` statically imports every MDX file of every locale,
    // so rendering a single page pulls all of them into the server module
    // graph — several MB of compiled JS each in dev, which exhausts the heap.
    // This stays necessary as locales are added; consolidating the per-locale
    // collections into one does not change what gets imported.
    async: true,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema.extend({
      status: z.string().optional(),
    }),
  },
};

// One collection for every locale. `loader()` splits it per language via the
// `parser: 'dir'` setting in `lib/i18n.ts`, which reads the locale from the
// first path segment (`content/docs/<locale>/...`).
export const docs = defineDocs({ dir: 'content/docs', ...docsOptions });

export const blog = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  schema: frontmatterSchema.extend({
    date: z.string().optional(),
  }),
});

export default defineConfig({
  mdxOptions: {},
});
