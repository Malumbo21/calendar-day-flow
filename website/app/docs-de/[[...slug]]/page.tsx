import type { Metadata } from 'next';

import {
  DocsLocalePage,
  generateDocsMetadata,
  generateDocsParams,
} from '@/components/docs/DocsLocalePage';

const LOCALE = 'de';

export default async function Page(props: PageProps<'/docs-de/[[...slug]]'>) {
  const { slug } = await props.params;

  return <DocsLocalePage locale={LOCALE} slug={slug} />;
}

export function generateStaticParams() {
  return generateDocsParams(LOCALE);
}

export async function generateMetadata(
  props: PageProps<'/docs-de/[[...slug]]'>
): Promise<Metadata> {
  const { slug } = await props.params;

  return generateDocsMetadata(LOCALE, slug);
}
