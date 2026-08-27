import type { Metadata } from 'next';

import {
  DocsLocalePage,
  generateDocsMetadata,
  generateDocsParams,
} from '@/components/docs/DocsLocalePage';

const LOCALE = 'es';

export default async function Page(props: PageProps<'/docs-es/[[...slug]]'>) {
  const { slug } = await props.params;

  return <DocsLocalePage locale={LOCALE} slug={slug} />;
}

export function generateStaticParams() {
  return generateDocsParams(LOCALE);
}

export async function generateMetadata(
  props: PageProps<'/docs-es/[[...slug]]'>
): Promise<Metadata> {
  const { slug } = await props.params;

  return generateDocsMetadata(LOCALE, slug);
}
