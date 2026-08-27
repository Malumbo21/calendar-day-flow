import { defaultLanguage } from '@/lib/i18n';
import { source } from '@/lib/source';

export const revalidate = false;

export function GET() {
  const lines: string[] = ['# Documentation', ''];
  for (const page of source.getPages(defaultLanguage)) {
    lines.push(`- [${page.data.title}](${page.url}): ${page.data.description}`);
  }
  return new Response(lines.join('\n'));
}
