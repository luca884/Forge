import { ICONS } from './icon.catalog';

/**
 * Catalog spec — verifies completeness and integrity of the ICONS record.
 * Source of truth: Design/Forge/icons.jsx (36 icons counted exactly).
 * Nav(5) + Common(16) + Domain(15) = 36 total.
 *
 * Known intentional duplicate: `download` and `install` share the same SVG path
 * (same visual glyph, different semantic meaning). Not a copy-paste error.
 */
describe('ICONS catalog', () => {
  const EXPECTED_KEYS = [
    // Nav (5)
    'layers', 'dumbbell', 'flame', 'trending', 'user',
    // Common (16)
    'plus', 'check', 'check-circle', 'x', 'chevron-left', 'chevron-right',
    'chevron-down', 'arrow-right', 'more', 'edit', 'trash', 'search',
    'settings', 'bell', 'download', 'share',
    // Domain (15)
    'timer', 'trophy', 'target', 'history', 'calendar', 'pin', 'zap',
    'minus', 'install', 'weight', 'info', 'skip', 'pause', 'play', 'dot',
  ] as const;

  it('ICONS object is not empty', () => {
    expect(Object.keys(ICONS).length).toBeGreaterThan(0);
  });

  it('ICONS contains exactly 36 icons (matching Design/Forge/icons.jsx)', () => {
    expect(Object.keys(ICONS).length).toBe(36);
  });

  it('every expected key is present', () => {
    const missingKeys = EXPECTED_KEYS.filter(
      (key) => !Object.prototype.hasOwnProperty.call(ICONS, key)
    );
    expect(missingKeys).toEqual([]);
  });

  it('every value is a non-empty string starting with "M" (valid SVG path)', () => {
    const badEntries = Object.entries(ICONS).filter(([, path]) => {
      return typeof path !== 'string' || path.trim().length === 0 || !/^M/.test(path.trim());
    });
    expect(badEntries.map(([name]) => name)).toEqual([]);
  });

  it('no unexpected duplicate path values (catches copy-paste errors)', () => {
    // Known intentional duplicate: download and install share the same glyph
    // (same visual, different semantic). Exclude them from the uniqueness check.
    const KNOWN_DUPLICATES: readonly string[] = ['install'];
    const entries = Object.entries(ICONS).filter(([key]) => !KNOWN_DUPLICATES.includes(key));
    const values = entries.map(([, v]) => v);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
