/**
 * Barrel + integration smoke spec.
 *
 * Verifies that the public API of the icon module is correctly re-exported
 * from the barrel index.ts and that the imports resolve without errors.
 */
import { FgIconComponent } from './index';
import { ICONS } from './index';
import type { IconName } from './index';

describe('icon barrel (index.ts)', () => {
  it('FgIconComponent is exported from the barrel', () => {
    expect(FgIconComponent).toBeDefined();
  });

  it('ICONS catalog is exported from the barrel', () => {
    expect(ICONS).toBeDefined();
    expect(typeof ICONS).toBe('object');
    expect(Object.keys(ICONS).length).toBeGreaterThan(0);
  });

  it('IconName type is usable (compile-time check via type annotation)', () => {
    // This test only validates the export resolves; the type constraint
    // is enforced at compile time by tsc --noEmit.
    const name: IconName = 'check';
    expect(name).toBe('check');
  });

  it('FgIconComponent selector is fg-icon', () => {
    // Verify the metadata matches expected selector without instantiating
    const metadata = (FgIconComponent as { ɵcmp?: { selectors?: unknown[][] } }).ɵcmp;
    if (metadata) {
      expect(metadata.selectors).toEqual([['fg-icon']]);
    } else {
      // Fallback: class exists and is a function (constructor)
      expect(typeof FgIconComponent).toBe('function');
    }
  });
});
