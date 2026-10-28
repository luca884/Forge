/**
 * Reads the Cuaderno colour tokens (src/styles.css, `--color-*`) for the
 * <canvas> charts. Chart.js cannot resolve `rgb(var(--x) / a)`, so the tokens
 * are read from the root element with getComputedStyle and handed over as
 * plain `rgb(r, g, b)` strings. The tokens follow <html data-theme data-accent>,
 * so callers re-read them whenever the theme or the accent changes.
 *
 * Pure UI helper — no Angular DI.
 */
export interface ChartPalette {
  /** Primary text; also the chart baseline. */
  readonly ink: string;
  /** Secondary text: ticks, axis titles, legend. */
  readonly ink2: string;
  /** Grid lines and borders. */
  readonly line: string;
  /** Card background; used as the ring around the last point. */
  readonly surface: string;
  /** Series colour. */
  readonly accent: string;
  /** Accent for text (reaches contrast in both themes). */
  readonly accentInk: string;
}

/** Light-theme values, used only where no stylesheet is loaded (jsdom). */
const FALLBACK: Record<keyof ChartPalette, string> = {
  ink: 'rgb(17, 17, 19)',
  ink2: 'rgb(91, 91, 96)',
  line: 'rgb(228, 228, 224)',
  surface: 'rgb(255, 255, 255)',
  accent: 'rgb(43, 89, 255)',
  accentInk: 'rgb(43, 89, 255)',
};

const TOKEN: Record<keyof ChartPalette, string> = {
  ink: '--color-ink',
  ink2: '--color-ink-2',
  line: '--color-line',
  surface: '--color-surface',
  accent: '--color-accent',
  accentInk: '--color-accent-ink',
};

export function readChartPalette(root: HTMLElement = document.documentElement): ChartPalette {
  let styles: CSSStyleDeclaration | null = null;
  try {
    styles = getComputedStyle(root);
  } catch {
    // No layout engine: every token falls back.
  }
  const read = (key: keyof ChartPalette): string => {
    const channels = styles?.getPropertyValue(TOKEN[key]).trim().split(/\s+/) ?? [];
    return channels.length === 3 && channels.every((c) => /^\d+$/.test(c))
      ? `rgb(${channels.join(', ')})`
      : FALLBACK[key];
  };
  return {
    ink: read('ink'),
    ink2: read('ink2'),
    line: read('line'),
    surface: read('surface'),
    accent: read('accent'),
    accentInk: read('accentInk'),
  };
}

/** `rgb(r, g, b)` → `rgba(r, g, b, alpha)`. */
export function chartAlpha(color: string, alpha: number): string {
  return color.replace(/^rgb\((.*)\)$/, `rgba($1, ${alpha})`);
}
