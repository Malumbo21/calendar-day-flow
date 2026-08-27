import { loader } from 'fumadocs-core/source';
import type { InferPageType } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { statusBadgesPlugin } from 'fumadocs-core/source/status-badges';
import { docs } from 'fumadocs-mdx:collections/server';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import type { LanguageCode } from '@/lib/i18n';
import { defaultLanguage, docsPrefix, i18n } from '@/lib/i18n';

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

/**
 * One loader for every locale.
 *
 * `i18n` makes the whole output locale-aware — `getPageTree(locale)`,
 * `getPages(locale)`, `getPage(slugs, locale)` — and the page tree builder
 * namespaces node ids by locale on its own (`generateId` prefixes with
 * `ctx.locale`), so the per-locale `pageTree.idPrefix` that the three separate
 * loaders needed to avoid sharing fumadocs-ui's module-level tree cache is no
 * longer required.
 *
 * `url` overrides the built-in `/{locale}/docs/...` layout to keep the URLs the
 * docs have always been published under; see `docsPrefix`.
 */
export const source = loader({
  i18n,
  baseUrl: '/docs',
  url: (slugs, locale) =>
    [docsPrefix((locale ?? defaultLanguage) as LanguageCode), ...slugs].join(
      '/'
    ),
  source: docs.toFumadocsSource(),
  plugins: [
    lucideIconsPlugin(),
    statusBadgesPlugin({
      renderBadge: renderProBadge,
    }),
  ],
});

/**
 * OG image route segments for a page. The locale leads the path so the three
 * locales' identically-slugged pages get their own image instead of colliding
 * on one — previously only the English pages emitted an OG image at all.
 */
export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [page.locale ?? defaultLanguage, ...page.slugs, 'image.png'];

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
