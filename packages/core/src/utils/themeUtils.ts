/**
 * Resolve the currently applied theme on the document.
 */
export const resolveAppliedTheme = (
  effectiveTheme: 'light' | 'dark'
): 'light' | 'dark' => {
  if (typeof document === 'undefined') {
    return effectiveTheme;
  }

  const root = document.documentElement;

  const overrideAttributes = [
    root.dataset.dfThemeOverride,
    root.dataset.dfTheme,
    root.dataset.theme,
  ];

  for (const attr of overrideAttributes) {
    if (attr === 'light' || attr === 'dark') {
      return attr;
    }
  }

  if (root.classList.contains('dark')) {
    return 'dark';
  }

  if (root.classList.contains('light')) {
    return 'light';
  }

  return effectiveTheme;
};
