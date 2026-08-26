import { DocsLocaleLayout } from '@/components/docs/DocsLocaleLayout';

export default function Layout({ children }: LayoutProps<'/docs-ko'>) {
  return <DocsLocaleLayout locale='ko'>{children}</DocsLocaleLayout>;
}
