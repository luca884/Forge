import { TestBed } from '@angular/core/testing';

import { AppearanceService, APPEARANCE_STORAGE_KEY } from './appearance.service';

/** Controllable prefers-color-scheme media query. */
function mockSystemScheme(initialDark: boolean): { setDark(dark: boolean): void } {
  let dark = initialDark;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mql = {
    get matches() {
      return dark;
    },
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
  };
  window.matchMedia = jest.fn().mockReturnValue(mql);
  return {
    setDark(next: boolean) {
      dark = next;
      listeners.forEach((listener) => listener({ matches: next } as MediaQueryListEvent));
    },
  };
}

function html(): HTMLElement {
  return document.documentElement;
}

function themeColor(): string | null {
  return document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null;
}

function stored(): Record<string, unknown> {
  return JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY) ?? '{}') as Record<string, unknown>;
}

function createService(): AppearanceService {
  TestBed.configureTestingModule({});
  return TestBed.inject(AppearanceService);
}

describe('AppearanceService', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    html().removeAttribute('data-theme');
    html().removeAttribute('data-accent');
    document.head.innerHTML = '<meta name="theme-color" content="#000000">';
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    jest.restoreAllMocks();
  });

  it('defaults to system theme and cobalt accent when nothing is stored', () => {
    mockSystemScheme(false);
    const service = createService();

    expect(service.theme()).toBe('system');
    expect(service.accent()).toBe('cobalt');
    expect(service.resolvedTheme()).toBe('light');
    expect(html().getAttribute('data-theme')).toBe('light');
    expect(html().getAttribute('data-accent')).toBe('cobalt');
    expect(themeColor()).toBe('#F6F6F4');
  });

  it('resolves system theme to dark when the device prefers dark', () => {
    mockSystemScheme(true);
    const service = createService();

    expect(service.resolvedTheme()).toBe('dark');
    expect(html().getAttribute('data-theme')).toBe('dark');
    expect(themeColor()).toBe('#0F0F11');
  });

  it('applies the stored theme and accent', () => {
    mockSystemScheme(false);
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ theme: 'dark', accent: 'green' }));
    const service = createService();

    expect(service.theme()).toBe('dark');
    expect(service.accent()).toBe('green');
    expect(html().getAttribute('data-theme')).toBe('dark');
    expect(html().getAttribute('data-accent')).toBe('green');
    expect(themeColor()).toBe('#0F0F11');
  });

  it.each([
    ['invalid JSON', '{not json'],
    ['a non-object value', '42'],
    ['null', 'null'],
    ['unknown values', JSON.stringify({ theme: 'blue', accent: 7 })],
  ])('falls back to the defaults on %s', (_label, raw) => {
    mockSystemScheme(false);
    localStorage.setItem(APPEARANCE_STORAGE_KEY, raw);
    const service = createService();

    expect(service.theme()).toBe('system');
    expect(service.accent()).toBe('cobalt');
    expect(html().getAttribute('data-theme')).toBe('light');
    expect(html().getAttribute('data-accent')).toBe('cobalt');
  });

  it('keeps a valid field when the other one is invalid', () => {
    mockSystemScheme(false);
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ theme: 'nope', accent: 'orange' }));
    const service = createService();

    expect(service.theme()).toBe('system');
    expect(service.accent()).toBe('orange');
  });

  it('setTheme applies at once and persists, keeping other stored fields', () => {
    mockSystemScheme(false);
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ accent: 'ink', keepAwake: false }));
    const service = createService();

    service.setTheme('dark');

    expect(service.theme()).toBe('dark');
    expect(html().getAttribute('data-theme')).toBe('dark');
    expect(themeColor()).toBe('#0F0F11');
    expect(stored()).toEqual({ theme: 'dark', accent: 'ink', keepAwake: false });
  });

  it('setAccent applies at once and persists', () => {
    mockSystemScheme(false);
    const service = createService();

    service.setAccent('orange');

    expect(service.accent()).toBe('orange');
    expect(html().getAttribute('data-accent')).toBe('orange');
    expect(stored()).toEqual({ theme: 'system', accent: 'orange' });
  });

  it('persisted values survive a new service instance (reload)', () => {
    mockSystemScheme(false);
    createService().setTheme('light');
    TestBed.resetTestingModule();
    html().removeAttribute('data-theme');

    const reloaded = createService();

    expect(reloaded.theme()).toBe('light');
    expect(html().getAttribute('data-theme')).toBe('light');
  });

  it('follows prefers-color-scheme live while the theme is system', () => {
    const system = mockSystemScheme(false);
    const service = createService();

    system.setDark(true);

    expect(service.resolvedTheme()).toBe('dark');
    expect(html().getAttribute('data-theme')).toBe('dark');
    expect(themeColor()).toBe('#0F0F11');

    system.setDark(false);

    expect(html().getAttribute('data-theme')).toBe('light');
    expect(themeColor()).toBe('#F6F6F4');
  });

  it('ignores prefers-color-scheme changes while the theme is explicit', () => {
    const system = mockSystemScheme(false);
    const service = createService();
    service.setTheme('light');

    system.setDark(true);

    expect(service.resolvedTheme()).toBe('light');
    expect(html().getAttribute('data-theme')).toBe('light');
  });

  it('treats a browser without matchMedia as a light system', () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    const service = createService();

    expect(service.resolvedTheme()).toBe('light');
    expect(html().getAttribute('data-theme')).toBe('light');
  });

  it('keeps working when localStorage throws', () => {
    mockSystemScheme(false);
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const service = createService();

    expect(service.theme()).toBe('system');
    expect(() => service.setAccent('green')).not.toThrow();
    expect(html().getAttribute('data-accent')).toBe('green');
  });
});
