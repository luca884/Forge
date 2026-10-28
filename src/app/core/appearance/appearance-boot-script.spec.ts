import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { APPEARANCE_STORAGE_KEY } from './appearance.service';

/**
 * The inline script in src/index.html applies the stored appearance before
 * Angular boots, so the first paint already has the right theme (no flash).
 * It cannot import AppearanceService, so these tests pin it to the same rules.
 */
function bootScript(): string {
  const indexHtml = readFileSync(resolve(__dirname, '../../../index.html'), 'utf8');
  const scripts = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  const script = scripts.find((code) => code.includes(APPEARANCE_STORAGE_KEY));
  if (!script) throw new Error(`No inline script reads ${APPEARANCE_STORAGE_KEY} in index.html`);
  return script;
}

function runBootScript(options: { stored?: string; systemDark?: boolean }): void {
  if (options.stored !== undefined) localStorage.setItem(APPEARANCE_STORAGE_KEY, options.stored);
  window.matchMedia = jest.fn().mockReturnValue({ matches: options.systemDark ?? false });
  // jest-environment-jsdom runs inline scripts, like the browser does while parsing <head>.
  const script = document.createElement('script');
  script.textContent = bootScript();
  document.head.appendChild(script);
}

function html(): HTMLElement {
  return document.documentElement;
}

function themeColor(): string | null {
  return document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null;
}

describe('index.html appearance boot script', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    html().removeAttribute('data-theme');
    html().removeAttribute('data-accent');
    document.head.innerHTML = '<meta name="theme-color" content="#000000">';
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('applies system light and cobalt when nothing is stored', () => {
    runBootScript({});

    expect(html().getAttribute('data-theme')).toBe('light');
    expect(html().getAttribute('data-accent')).toBe('cobalt');
    expect(themeColor()).toBe('#F6F6F4');
  });

  it('resolves system to dark when the device prefers dark', () => {
    runBootScript({ systemDark: true });

    expect(html().getAttribute('data-theme')).toBe('dark');
    expect(themeColor()).toBe('#0F0F11');
  });

  it('applies the stored theme and accent', () => {
    runBootScript({ stored: JSON.stringify({ theme: 'dark', accent: 'ink' }) });

    expect(html().getAttribute('data-theme')).toBe('dark');
    expect(html().getAttribute('data-accent')).toBe('ink');
    expect(themeColor()).toBe('#0F0F11');
  });

  it('an explicit light theme wins over a dark device', () => {
    runBootScript({ stored: JSON.stringify({ theme: 'light' }), systemDark: true });

    expect(html().getAttribute('data-theme')).toBe('light');
  });

  it.each([
    ['invalid JSON', '{not json'],
    ['null', 'null'],
    ['unknown values', JSON.stringify({ theme: 'blue', accent: 7 })],
  ])('falls back to the defaults on %s', (_label, stored) => {
    runBootScript({ stored });

    expect(html().getAttribute('data-theme')).toBe('light');
    expect(html().getAttribute('data-accent')).toBe('cobalt');
  });
});
