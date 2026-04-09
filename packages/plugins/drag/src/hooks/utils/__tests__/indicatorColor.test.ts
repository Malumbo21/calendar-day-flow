import {
  getColorAlpha,
  isUsableIndicatorBackground,
} from '@drag/hooks/utils/indicatorColor';

describe('indicatorColor', () => {
  it('treats transparent colors as unusable indicator backgrounds', () => {
    expect(getColorAlpha('transparent')).toBe(0);
    expect(getColorAlpha('rgba(0, 0, 0, 0)')).toBe(0);
    expect(getColorAlpha('rgb(0 0 0 / 0)')).toBe(0);
    expect(isUsableIndicatorBackground('rgba(37, 99, 235, 0.2)')).toBe(false);
  });

  it('accepts solid and sufficiently opaque colors', () => {
    expect(getColorAlpha('#2563eb')).toBe(1);
    expect(getColorAlpha('#2563eb99')).toBeCloseTo(0.6, 1);
    expect(isUsableIndicatorBackground('#2563eb')).toBe(true);
    expect(isUsableIndicatorBackground('rgba(37, 99, 235, 0.6)')).toBe(true);
  });
});
