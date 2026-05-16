import { isPreferredUnit, PreferredUnit } from './preferred-unit.vo';

describe('PreferredUnit VO', () => {
  describe('isPreferredUnit', () => {
    it('returns true for kg', () => {
      expect(isPreferredUnit('kg')).toBe(true);
    });

    it('returns true for lb', () => {
      expect(isPreferredUnit('lb')).toBe(true);
    });

    it('returns false for lbs', () => {
      expect(isPreferredUnit('lbs')).toBe(false);
    });

    it('returns false for metric', () => {
      expect(isPreferredUnit('metric')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isPreferredUnit('')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isPreferredUnit(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isPreferredUnit(undefined)).toBe(false);
    });

    it('returns false for number', () => {
      expect(isPreferredUnit(1)).toBe(false);
    });
  });

  describe('PreferredUnit.from', () => {
    it('returns kg for valid kg', () => {
      expect(PreferredUnit.from('kg')).toBe('kg');
    });

    it('returns lb for valid lb', () => {
      expect(PreferredUnit.from('lb')).toBe('lb');
    });

    it('throws DomainError for invalid value metric', () => {
      expect(() => PreferredUnit.from('metric')).toThrow();
    });

    it('throws DomainError for null', () => {
      expect(() => PreferredUnit.from(null)).toThrow();
    });

    it('throws DomainError for undefined', () => {
      expect(() => PreferredUnit.from(undefined)).toThrow();
    });
  });
});
