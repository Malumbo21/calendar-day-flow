import { DocsLocaleLayout } from '@/components/docs/DocsLocaleLayout';

export default function Layout({ children }: LayoutProps<'/docs-ja'>) {
  return <DocsLocaleLayout locale='ja'>{children}</DocsLocaleLayout>;
}
