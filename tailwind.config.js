/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // Tokens viven en src/styles.css como R G B (sin comas) — invariante R7.
        // El bridge funciona via <alpha-value> nativo de Tailwind 3.4+.
        // DO NOT add commas to the CSS var values — Tailwind <alpha-value> requires space-separated channels
        forge: {
          50:  'rgb(var(--forge-50) / <alpha-value>)',
          100: 'rgb(var(--forge-100) / <alpha-value>)',
          200: 'rgb(var(--forge-200) / <alpha-value>)',
          300: 'rgb(var(--forge-300) / <alpha-value>)',
          400: 'rgb(var(--forge-400) / <alpha-value>)',
          500: 'rgb(var(--forge-500) / <alpha-value>)',
          600: 'rgb(var(--forge-600) / <alpha-value>)',
          700: 'rgb(var(--forge-700) / <alpha-value>)',
          800: 'rgb(var(--forge-800) / <alpha-value>)',
          850: 'rgb(var(--forge-850) / <alpha-value>)',
          900: 'rgb(var(--forge-900) / <alpha-value>)',
          925: 'rgb(var(--forge-925) / <alpha-value>)',
          950: 'rgb(var(--forge-950) / <alpha-value>)',
        },
        accent: {
          50:  'rgb(var(--accent-50) / <alpha-value>)',
          100: 'rgb(var(--accent-100) / <alpha-value>)',
          200: 'rgb(var(--accent-200) / <alpha-value>)',
          300: 'rgb(var(--accent-300) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
          700: 'rgb(var(--accent-700) / <alpha-value>)',
        },
        destructive: {
          500: 'rgb(var(--destructive-500) / <alpha-value>)',
          600: 'rgb(var(--destructive-600) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
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
