import { DocsLocaleLayout } from '@/components/docs/DocsLocaleLayout';

export default function Layout({ children }: LayoutProps<'/docs-fr'>) {
  return <DocsLocaleLayout locale='fr'>{children}</DocsLocaleLayout>;
}
