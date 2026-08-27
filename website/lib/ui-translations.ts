import type { Translations } from 'fumadocs-ui/i18n';

import type { LanguageCode } from '@/lib/i18n';

/**
 * Chrome around the docs — search box, table of contents, pager, theme and
 * language pickers. English is fumadocs' built-in default, so it is omitted;
 * a locale missing from this map simply falls back to those English strings,
 * which keeps adding a language from being blocked on translating the shell.
 */
export const uiTranslations: Partial<
  Record<LanguageCode, Partial<Translations>>
> = {
  zh: {
    search: '搜索',
    searchNoResult: '没有找到结果',
    toc: '本页内容',
    tocNoHeadings: '本页没有标题',
    lastUpdate: '最后更新于',
    chooseLanguage: '选择语言',
    nextPage: '下一页',
    previousPage: '上一页',
    chooseTheme: '主题',
    editOnGithub: '在 GitHub 上编辑',
  },
  ja: {
    search: '検索',
    searchNoResult: '結果が見つかりません',
    toc: '目次',
    tocNoHeadings: '見出しがありません',
    lastUpdate: '最終更新',
    chooseLanguage: '言語を選択',
    nextPage: '次のページ',
    previousPage: '前のページ',
    chooseTheme: 'テーマ',
    editOnGithub: 'GitHub で編集',
  },
  es: {
    search: 'Buscar',
    searchNoResult: 'No se encontraron resultados',
    toc: 'En esta página',
    tocNoHeadings: 'Sin encabezados',
    lastUpdate: 'Última actualización',
    chooseLanguage: 'Elegir idioma',
    nextPage: 'Página siguiente',
    previousPage: 'Página anterior',
    chooseTheme: 'Tema',
    editOnGithub: 'Editar en GitHub',
  },
  fr: {
    search: 'Rechercher',
    searchNoResult: 'Aucun résultat',
    toc: 'Dans cette page',
    tocNoHeadings: 'Aucun titre',
    lastUpdate: 'Dernière mise à jour',
    chooseLanguage: 'Choisir la langue',
    nextPage: 'Page suivante',
    previousPage: 'Page précédente',
    chooseTheme: 'Thème',
    editOnGithub: 'Modifier sur GitHub',
  },
  de: {
    search: 'Suchen',
    searchNoResult: 'Keine Ergebnisse gefunden',
    toc: 'Auf dieser Seite',
    tocNoHeadings: 'Keine Überschriften',
    lastUpdate: 'Zuletzt aktualisiert',
    chooseLanguage: 'Sprache wählen',
    nextPage: 'Nächste Seite',
    previousPage: 'Vorherige Seite',
    chooseTheme: 'Erscheinungsbild',
    editOnGithub: 'Auf GitHub bearbeiten',
  },
  ko: {
    search: '검색',
    searchNoResult: '검색 결과가 없습니다',
    toc: '이 페이지의 내용',
    tocNoHeadings: '제목이 없습니다',
    lastUpdate: '최종 업데이트',
    chooseLanguage: '언어 선택',
    nextPage: '다음 페이지',
    previousPage: '이전 페이지',
    chooseTheme: '테마',
    editOnGithub: 'GitHub에서 편집',
  },
};
