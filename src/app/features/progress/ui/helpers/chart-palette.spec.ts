import { chartAlpha, readChartPalette } from './chart-palette';

describe('readChartPalette', () => {
  afterEach(() => {
    const style = document.documentElement.style;
    for (const name of ['--color-ink', '--color-ink-2', '--color-line', '--color-accent', '--color-accent-ink', '--color-surface']) {
      style.removeProperty(name);
    }
  });

  it('reads the Cuaderno tokens from the root element as comma-separated rgb()', () => {
    const style = document.documentElement.style;
    style.setProperty('--color-ink', '17 17 19');
    style.setProperty('--color-ink-2', '91 91 96');
    style.setProperty('--color-line', '228 228 224');
    style.setProperty('--color-surface', '255 255 255');
    style.setProperty('--color-accent', '43 89 255');
    style.setProperty('--color-accent-ink', '124 152 255');

    expect(readChartPalette()).toEqual({
      ink: 'rgb(17, 17, 19)',
      ink2: 'rgb(91, 91, 96)',
      line: 'rgb(228, 228, 224)',
      surface: 'rgb(255, 255, 255)',
      accent: 'rgb(43, 89, 255)',
      accentInk: 'rgb(124, 152, 255)',
    });
  });

  it('follows the tokens when they change', () => {
    const style = document.documentElement.style;
    style.setProperty('--color-accent', '43 89 255');
    const before = readChartPalette().accent;
    style.setProperty('--color-accent', '255 90 31');
    const after = readChartPalette().accent;

    expect(before).toBe('rgb(43, 89, 255)');
    expect(after).toBe('rgb(255, 90, 31)');
  });

  it('falls back to a usable rgb() colour when a token is not defined', () => {
    const palette = readChartPalette();
    for (const color of Object.values(palette)) {
      expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    }
  });
});

describe('chartAlpha', () => {
  it('turns an rgb() colour into rgba() with the given alpha', () => {
    expect(chartAlpha('rgb(43, 89, 255)', 0.25)).toBe('rgba(43, 89, 255, 0.25)');
  });
});
