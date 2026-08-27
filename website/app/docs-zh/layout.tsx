import { DocsLocaleLayout } from '@/components/docs/DocsLocaleLayout';

export default function Layout({ children }: LayoutProps<'/docs-zh'>) {
  return <DocsLocaleLayout locale='zh'>{children}</DocsLocaleLayout>;
}
