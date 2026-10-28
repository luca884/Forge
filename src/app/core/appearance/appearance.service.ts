import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type AccentId = 'cobalt' | 'orange' | 'green' | 'ink';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];
export const ACCENT_IDS: readonly AccentId[] = ['cobalt', 'orange', 'green', 'ink'];

/**
 * Device preference, not user data: lives in localStorage, never in Dexie.
 * The inline script in src/index.html reads the same key before Angular boots
 * (pinned by appearance-boot-script.spec.ts) — keep both in sync.
 */
export const APPEARANCE_STORAGE_KEY = 'forge.appearance';

const DEFAULT_THEME: ThemePreference = 'system';
const DEFAULT_ACCENT: AccentId = 'cobalt';

/** Matches --color-page in src/styles.css, so the browser chrome follows the background. */
const THEME_COLOR: Record<ResolvedTheme, string> = { light: '#F6F6F4', dark: '#0F0F11' };

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

/**
 * AppearanceService — theme (Claro / Oscuro / Sistema) and accent color.
 * Writes data-theme (already resolved) and data-accent on <html>, plus
 * <meta name="theme-color">. "Sistema" follows prefers-color-scheme live.
 * Instantiated at bootstrap (APP_INITIALIZER) so the listener runs from the start.
 */
@Injectable({ providedIn: 'root' })
export class AppearanceService {
  private readonly document = inject(DOCUMENT);

  private readonly stored = readStored();
  private readonly systemDark = signal(false);
  private readonly themeState = signal<ThemePreference>(
    isThemePreference(this.stored['theme']) ? this.stored['theme'] : DEFAULT_THEME,
  );
  private readonly accentState = signal<AccentId>(
    isAccentId(this.stored['accent']) ? this.stored['accent'] : DEFAULT_ACCENT,
  );

  readonly theme = this.themeState.asReadonly();
  readonly accent = this.accentState.asReadonly();
  readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const theme = this.themeState();
    if (theme !== 'system') return theme;
    return this.systemDark() ? 'dark' : 'light';
  });

  constructor() {
    this.watchSystemScheme();
    this.apply();
  }

  setTheme(theme: ThemePreference): void {
    this.themeState.set(theme);
    this.persist();
    this.apply();
  }

  setAccent(accent: AccentId): void {
    this.accentState.set(accent);
    this.persist();
    this.apply();
  }

  private watchSystemScheme(): void {
    const view = this.document.defaultView;
    if (typeof view?.matchMedia !== 'function') return;
    const query = view.matchMedia(DARK_SCHEME_QUERY);
    this.systemDark.set(query.matches);
    query.addEventListener?.('change', (event: MediaQueryListEvent) => {
      this.systemDark.set(event.matches);
      this.apply();
    });
  }

  private apply(): void {
    const resolved = this.resolvedTheme();
    const root = this.document.documentElement;
    root.setAttribute('data-theme', resolved);
    root.setAttribute('data-accent', this.accent());
    this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[resolved]);
  }

  /** Merges into the stored object so other device preferences under the same key survive. */
  private persist(): void {
    const next = { ...readStored(), theme: this.theme(), accent: this.accent() };
    try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode or quota: the choice still applies for this visit.
    }
  }
}

function readStored(): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY) ?? '{}');
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference);
}

function isAccentId(value: unknown): value is AccentId {
  return ACCENT_IDS.includes(value as AccentId);
}
