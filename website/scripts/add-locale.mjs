#!/usr/bin/env node
/**
 * Scaffold a new documentation locale.
 *
 *   node scripts/add-locale.mjs <code> <display name>
 *   node scripts/add-locale.mjs pt "Português"
 *
 * Registers the locale in lib/i18n.ts, creates its content directory and
 * writes the two route files. The route files carry no logic — they delegate
 * to components/docs — so this exists purely to stop them being hand-copied.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [code, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(' ');

if (!code || !name) {
  console.error('Usage: node scripts/add-locale.mjs <code> <display name>');
  process.exit(1);
}
if (!/^[a-z]{2}(-[a-z]{2})?$/i.test(code)) {
  console.error(`Invalid locale code: ${code} (expected e.g. "pt" or "pt-br")`);
  process.exit(1);
}

const exists = p =>
  access(p).then(
    () => true,
    () => false
  );

// 1. Register the locale.
const i18nPath = path.join(root, 'lib/i18n.ts');
const i18n = await readFile(i18nPath, 'utf8');
if (i18n.includes(`code: '${code}'`)) {
  console.error(`Locale "${code}" is already registered in lib/i18n.ts`);
  process.exit(1);
}
await writeFile(
  i18nPath,
  i18n.replace(
    /(\n)(\] as const;)/,
    `$1  { code: '${code}', name: '${name}' },\n$2`
  )
);

// 2. Content directory. Every page falls back to English until translated.
const contentDir = path.join(root, 'content/docs', code);
await mkdir(contentDir, { recursive: true });
await writeFile(
  path.join(contentDir, '.gitkeep'),
  '# Translated pages go here, mirroring content/docs/en.\n' +
    '# Anything absent falls back to English (see fallbackLanguage in lib/i18n.ts).\n'
);

// 3. Routes.
const routeDir = path.join(root, 'app', `docs-${code}`);
if (await exists(routeDir)) {
  console.error(`Route app/docs-${code} already exists`);
  process.exit(1);
}
await mkdir(path.join(routeDir, '[[...slug]]'), { recursive: true });

await writeFile(
  path.join(routeDir, 'layout.tsx'),
  `import { DocsLocaleLayout } from '@/components/docs/DocsLocaleLayout';

export default function Layout({ children }: LayoutProps<'/docs-${code}'>) {
  return <DocsLocaleLayout locale='${code}'>{children}</DocsLocaleLayout>;
}
`
);

await writeFile(
  path.join(routeDir, '[[...slug]]', 'page.tsx'),
  `import type { Metadata } from 'next';

import {
  DocsLocalePage,
  generateDocsMetadata,
  generateDocsParams,
} from '@/components/docs/DocsLocalePage';

const LOCALE = '${code}';

export default async function Page(props: PageProps<'/docs-${code}/[[...slug]]'>) {
  const { slug } = await props.params;

  return <DocsLocalePage locale={LOCALE} slug={slug} />;
}

export function generateStaticParams() {
  return generateDocsParams(LOCALE);
}

export async function generateMetadata(
  props: PageProps<'/docs-${code}/[[...slug]]'>
): Promise<Metadata> {
  const { slug } = await props.params;

  return generateDocsMetadata(LOCALE, slug);
}
`
);

console.log(`Added locale "${code}" (${name})
  lib/i18n.ts            registered
  content/docs/${code}/${' '.repeat(Math.max(0, 12 - code.length))}created (empty — every page falls back to English)
  app/docs-${code}/${' '.repeat(Math.max(0, 17 - code.length))}routes written

Optional: add UI strings for "${code}" in lib/ui-translations.ts,
and a search tokenizer in app/api/search/route.ts if it is not space-delimited.`);
