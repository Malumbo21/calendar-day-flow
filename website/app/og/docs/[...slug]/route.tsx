import { generate as DefaultImage } from 'fumadocs-ui/og';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';

import type { LanguageCode } from '@/lib/i18n';
import { getPageImage, source } from '@/lib/source';

export const dynamic = 'force-static';
export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<'/og/docs/[...slug]'>
) {
  const { slug } = await params;
  // `[locale, ...pageSlugs, 'image.png']` — see `getPageImage`.
  const [locale, ...rest] = slug;
  const page = source.getPage(rest.slice(0, -1), locale as LanguageCode);
  if (!page) notFound();

  return new ImageResponse(
    <DefaultImage
      title={page.data.title}
      description={page.data.description}
      site='DayFlow'
    />,
    {
      width: 1200,
      height: 630,
    }
  );
}

export function generateStaticParams() {
  // No locale argument: every language gets its own image, and the locale-led
  // segments keep identically-slugged pages from colliding.
  return source.getPages().map(page => ({
    slug: getPageImage(page).segments,
  }));
}
