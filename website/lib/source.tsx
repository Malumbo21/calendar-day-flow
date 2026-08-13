import { loader } from 'fumadocs-core/source';
import type { InferPageType } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { statusBadgesPlugin } from 'fumadocs-core/source/status-badges';
import { docs, docsJa, docsZh } from 'fumadocs-mdx:collections/server';
import React from 'react';

import { Badge } from '@/components/ui/badge';

const renderProBadge = (status: string) => {
  if (status === 'pro') {
    return (
      <Badge
        variant='outline'
        className='ml-auto rounded-full bg-[#fee699] px-1.5 py-0.5 text-[11px] leading-none font-bold whitespace-nowrap text-[#231b08]'
      >
        PRO
      </Badge>
    );
  }
  return null;
};

// Each locale needs its own page tree `idPrefix`. The root node id defaults to
// `root` for every loader, and fumadocs-ui caches derived data (e.g. the
// prev/next footer list in `useFooterItems`) in a module-level Map keyed by it.
// Without distinct prefixes the three trees share one cache entry, so whichever
// locale a server process renders first wins and the others get a footer list
// that doesn't contain their pages — an empty prev/next footer, plus a
// hydration mismatch in dev.
export const source = loader({
  baseUrl: '/docs',
  pageTree: { idPrefix: 'docs' },
  source: docs.toFumadocsSource(),
  plugins: [
    lucideIconsPlugin(),
    statusBadgesPlugin({
      renderBadge: renderProBadge,
    }),
  ],
});

export const sourceJa = loader({
  baseUrl: '/docs-ja',
  pageTree: { idPrefix: 'docs-ja' },
  source: docsJa.toFumadocsSource(),
  plugins: [
    lucideIconsPlugin(),
    statusBadgesPlugin({
      renderBadge: renderProBadge,
    }),
  ],
});

export const sourceZh = loader({
  baseUrl: '/docs-zh',
  pageTree: { idPrefix: 'docs-zh' },
  source: docsZh.toFumadocsSource(),
  plugins: [
    lucideIconsPlugin(),
    statusBadgesPlugin({
      renderBadge: renderProBadge,
    }),
  ],
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

${processed}`;
}
