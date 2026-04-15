/**
 * Get localized weekday labels starting from startOfWeek (0: Sun, 1: Mon, etc.)
 */
export const getWeekDaysLabels = (
  locale: string,
  format: 'long' | 'short' | 'narrow' = 'short',
  startOfWeek = 1
): string[] => {
  const labels: string[] = [];
  // Use a known date (2024-01-07 was a Sunday)
  const baseDate = new Date(2024, 0, 7);
  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + startOfWeek + i);
    try {
      labels.push(date.toLocaleDateString(locale, { weekday: format }));
    } catch {
      labels.push(date.toLocaleDateString('en-US', { weekday: format }));
    }
  }
  return labels;
};

/**
 * Get localized month labels
 */
export const getMonthLabels = (
  locale: string,
  format: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit' = 'long'
): string[] => {
  const labels: string[] = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(2024, i, 1);
    try {
      labels.push(date.toLocaleDateString(locale, { month: format }));
    } catch {
      labels.push(date.toLocaleDateString('en-US', { month: format }));
    }
  }
  return labels;
};
