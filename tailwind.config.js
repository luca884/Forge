/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // Tokens viven en src/styles.css como R G B (sin comas) — invariante R7.
        // El bridge funciona via <alpha-value> nativo de Tailwind 3.4+.
        // DO NOT add commas to the CSS var values — Tailwind <alpha-value> requires space-separated channels
        // Cuaderno · semánticos, cambian con data-theme / data-accent (src/styles.css)
        page: 'rgb(var(--color-page) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        line: {
          DEFAULT: 'rgb(var(--color-line) / <alpha-value>)',
          soft: 'rgb(var(--color-line-soft) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          2: 'rgb(var(--color-ink-2) / <alpha-value>)',
        },
        dash: 'rgb(var(--color-dash) / <alpha-value>)',
        empty: 'rgb(var(--color-empty) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          ink: 'rgb(var(--color-accent-ink) / <alpha-value>)',
          on: 'rgb(var(--color-accent-on) / <alpha-value>)',
          // alfa fijo por tema (0.08 claro, 0.16 oscuro); no admite modificador /NN
          soft: 'rgb(var(--color-accent) / var(--color-accent-soft-alpha))',
        },
      },
      fontFamily: {
        sans: ['Inter Tight', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xs: 'var(--r-xs)',
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        '2xl': 'var(--r-2xl)',
      },
      zIndex: {
        header: 'var(--z-header)',
        bottomnav: 'var(--z-bottomnav)',
        timer: 'var(--z-timer-pinned)',
        'sheet-bg': 'var(--z-sheet-backdrop)',
        sheet: 'var(--z-sheet)',
        'modal-bg': 'var(--z-modal-backdrop)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
        celebration: 'var(--z-celebration)',
      },
    },
  },
  plugins: [],
};
