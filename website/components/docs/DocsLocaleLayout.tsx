import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import React from 'react';

import { DocsHeader } from '@/components/DocsHeader';
import type { LanguageCode } from '@/lib/i18n';
import { docsPrefix } from '@/lib/i18n';
import { baseOptions, gitConfig, sidebarTabs } from '@/lib/layout.shared';
import { source } from '@/lib/source';

const GITHUB_URL = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

const CONTAINER_STYLE = {
  '--fd-banner-height': '56px',
  gridTemplate: `"banner banner banner banner banner" 56px "sidebar sidebar header toc toc" "sidebar sidebar toc-popover toc toc" "sidebar sidebar main toc toc" 1fr / minmax(min-content, 1fr) var(--fd-sidebar-col) minmax(0, calc(var(--fd-layout-width,97rem) - var(--fd-sidebar-width) - var(--fd-toc-width))) var(--fd-toc-width) minmax(min-content, 1fr)`,
} as React.CSSProperties;

/**
 * The docs shell for one locale. Every per-locale `layout.tsx` is a thin
 * wrapper around this, so adding a language cannot introduce the drift that
 * the three hand-copied layouts had accumulated.
 */
export function DocsLocaleLayout({
  locale,
  children,
}: {
  locale: LanguageCode;
  children: React.ReactNode;
}) {
  return (
    <DocsLayout
      tree={source.getPageTree(locale)}
      {...baseOptions()}
      links={[]}
      nav={{
        component: <DocsHeader githubUrl={GITHUB_URL} />,
      }}
      sidebar={{
        collapsible: false,
        tabs: sidebarTabs(
          docsPrefix(locale),
          source.getPages(locale).map(page => page.url)
        ),
      }}
      containerProps={{ style: CONTAINER_STYLE }}
    >
      {children}
    </DocsLayout>
  );
}
