import { DocsLocaleLayout } from '@/components/docs/DocsLocaleLayout';

export default function Layout({ children }: LayoutProps<'/docs-es'>) {
  return <DocsLocaleLayout locale='es'>{children}</DocsLocaleLayout>;
}
