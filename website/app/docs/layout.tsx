import { DocsLocaleLayout } from '@/components/docs/DocsLocaleLayout';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return <DocsLocaleLayout locale='en'>{children}</DocsLocaleLayout>;
}
