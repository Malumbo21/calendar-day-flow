import { defineI18n } from 'fumadocs-core/i18n';

const LOCALES = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ko', name: '한국어' },
] as const;

export type LanguageCode = (typeof LOCALES)[number]['code'];

export const defaultLanguage: LanguageCode = 'en';

/**
 * URL prefix of a locale's docs section.
 *
 * The default locale keeps the bare `/docs` prefix and the others keep the
 * `/docs-<code>` shape they have always been published under — fumadocs' own
 * `/{locale}/docs` layout would invalidate every indexed docs URL, and the site
 * is statically exported (`output: 'export'`), so there is no server left to
 * issue redirects from the old paths.
 */
export function docsPrefix(locale: LanguageCode): string {
  return locale === defaultLanguage ? '/docs' : `/docs-${locale}`;
}

export const languages = LOCALES.map(locale => ({
  ...locale,
  prefix: docsPrefix(locale.code),
}));

/**
 * Single source of truth for every locale-aware consumer: the docs `loader()`,
 * the static search index and the UI provider all derive from this.
 *
 * `parser: 'dir'` maps the first path segment under `content/docs` to a locale,
 * so every file must live in a locale directory — `content/docs/en/...`.
 */
export const i18n = defineI18n({
  languages: LOCALES.map(locale => locale.code),
  defaultLanguage,
  parser: 'dir',
  // Explicit, though it is also the default: a locale that has not translated a
  // page yet inherits the English one instead of 404ing, which is what lets a
  // new language ship before its translation is complete.
  fallbackLanguage: defaultLanguage,
});

export const localeItems = LOCALES.map(locale => ({
  locale: locale.code,
  name: locale.name,
}));

export function getLanguageFromPathname(pathname: string) {
  return (
    [...languages]
      .toSorted((a, b) => b.prefix.length - a.prefix.length)
      .find(
        language =>
          pathname === language.prefix ||
          pathname.startsWith(`${language.prefix}/`)
      ) ?? languages[0]
  );
}

export function getLanguageCodeFromPathname(pathname: string): LanguageCode {
  return getLanguageFromPathname(pathname).code;
}
