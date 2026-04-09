export const getColorAlpha = (color?: string | null): number => {
  if (!color || color === 'transparent') return 0;

  const normalized = color.trim().toLowerCase();
  if (normalized === 'rgba(0, 0, 0, 0)' || normalized === 'rgb(0 0 0 / 0)') {
    return 0;
  }

  const rgbaMatch = normalized.match(
    /^rgba?\(\s*[\d.]+\s*[, ]\s*[\d.]+\s*[, ]\s*[\d.]+(?:\s*[,/]\s*([\d.]+))?\s*\)$/
  );
  if (rgbaMatch) {
    return rgbaMatch[1] ? Number.parseFloat(rgbaMatch[1]) : 1;
  }

  const hexMatch = normalized.match(/^#([\da-f]{4}|[\da-f]{8})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 4) {
      return Number.parseInt(hex[3] + hex[3], 16) / 255;
    }
    return Number.parseInt(hex.slice(6, 8), 16) / 255;
  }

  return 1;
};

export const isUsableIndicatorBackground = (
  color?: string | null,
  minAlpha: number = 0.4
) => getColorAlpha(color) >= minAlpha;
