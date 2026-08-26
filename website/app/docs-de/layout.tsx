import { DocsLocaleLayout } from '@/components/docs/DocsLocaleLayout';

export default function Layout({ children }: LayoutProps<'/docs-de'>) {
  return <DocsLocaleLayout locale='de'>{children}</DocsLocaleLayout>;
}
