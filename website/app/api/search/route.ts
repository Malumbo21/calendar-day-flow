import { flexsearchI18n } from 'fumadocs-core/search/flexsearch';

import { i18n } from '@/lib/i18n';
import { source } from '@/lib/source';

export const dynamic = 'force-static';

/**
 * Tokenizer overrides. Locales absent from this map use flexsearch's default,
 * so a new language only needs an entry when it is not space-delimited.
 */
type LocaleMap = NonNullable<Parameters<typeof flexsearchI18n>[0]['localeMap']>;

const TOKENIZERS: LocaleMap = {
  zh: 'cjk',
  ja: 'cjk',
  // Korean is space-delimited but agglutinative: particles attach to the noun
  // ("캘린더" vs "캘린더를"), so the default word tokenizer would miss the stem.
  // Character-level indexing matches it.
  ko: 'cjk',
};

type SearchPage = ReturnType<typeof source.getPages>[number];

type TreeNode = {
  type?: string;
  name?: unknown;
  url?: string;
  children?: TreeNode[];
};

function findPagePath(
  nodes: TreeNode[] | undefined,
  url: string,
  parents: TreeNode[] = []
): TreeNode[] | undefined {
  if (!nodes) return;

  for (const node of nodes) {
    const nextParents = [...parents, node];

    if (node.type === 'page' && node.url === url) {
      return nextParents;
    }

    const nested = findPagePath(node.children, url, nextParents);
    if (nested) return nested;
  }
}

function buildBreadcrumbs(locale: string, page: SearchPage) {
  const tree = source.getPageTree(locale) as TreeNode;
  const path = findPagePath(tree.children, page.url);

  if (!path) return;

  const breadcrumbs: string[] = [];

  if (typeof tree.name === 'string' && tree.name.length > 0) {
    breadcrumbs.push(tree.name);
  }

  for (const node of path.slice(0, -1)) {
    if (typeof node.name === 'string' && node.name.length > 0) {
      breadcrumbs.push(node.name);
    }
  }

  return breadcrumbs.length > 0 ? breadcrumbs : undefined;
}

async function getStructuredData(page: SearchPage) {
  const pageData = page.data as {
    structuredData?: unknown | (() => unknown | Promise<unknown>);
    load?: () => Promise<{ structuredData?: unknown }>;
  };

  if (typeof pageData.structuredData === 'function') {
    return pageData.structuredData();
  }

  if (pageData.structuredData) {
    return pageData.structuredData;
  }

  if (typeof pageData.load === 'function') {
    return (await pageData.load()).structuredData;
  }
}

async function buildSearchIndex(locale: string, page: SearchPage) {
  const structuredData = await getStructuredData(page);

  if (!structuredData) {
    throw new Error(`Cannot build search index for ${page.url}`);
  }

  return {
    id: page.url,
    title: page.data.title ?? page.slugs.at(-1) ?? page.path,
    description: page.data.description,
    url: page.url,
    structuredData,
    breadcrumbs: buildBreadcrumbs(locale, page),
  };
}

const search = flexsearchI18n({
  i18n,
  localeMap: TOKENIZERS,
  indexes() {
    return Promise.all(
      source.getLanguages().flatMap(({ language, pages }) =>
        pages.map(async page => ({
          locale: language,
          ...(await buildSearchIndex(language, page)),
        }))
      )
    );
  },
});

export const GET = search.staticGET;
