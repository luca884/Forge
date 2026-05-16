import { OneRepMax } from './one-rep-max';

describe('OneRepMax', () => {
  describe('epley(weightKg, reps)', () => {
    it('epley(100, 5) returns 116.67', () => {
      // V-40: D-1/S1
      const orm = OneRepMax.epley(100, 5);
      expect(orm.kg).toBe(116.67);
    });

    it('epley(100, 1) returns 100.00 — 1-rep edge case', () => {
      // V-43: D-1/S2 — when reps=1 result must equal weightKg
      const orm = OneRepMax.epley(100, 1);
      expect(orm.kg).toBe(100.0);
    });

    it('epley result is rounded to 2 decimal places', () => {
      // D-1/R3
      const orm = OneRepMax.epley(80, 8);
      // 80 * (1 + 8/30) = 80 * 1.2667 = 101.333... → 101.33
      expect(orm.kg).toBe(101.33);
    });
  });

  describe('brzycki(weightKg, reps)', () => {
    it('brzycki(100, 5) returns a 1RM value in the expected range (~112-113)', () => {
      // D-1/S3: spec says "approximately 112.33 (rounded 2dp)"
      // Formula: 100 / (1.0278 - 0.0278*5) = 100 / 0.8888 ≈ 112.51 with the stated formula.
      // The spec's "approximately" allows for minor formula variant differences (±1 kg).
      const orm = OneRepMax.brzycki(100, 5);
      expect(orm.kg).toBeGreaterThan(110);
      expect(orm.kg).toBeLessThan(115);
      expect(orm.kg).toBe(112.51); // actual result of the formula documented in spec
    });

    it('brzycki(100, 1) returns 100.00 — 1-rep edge case', () => {
      // D-1/R7: when reps=1 formula should return weightKg
      // 100 / (1.0278 - 0.0278*1) = 100 / 1.0000 = 100.00
      const orm = OneRepMax.brzycki(100, 1);
      expect(orm.kg).toBe(100.0);
    });
  });

  describe('tryFrom({ weightKg, reps })', () => {
    it('returns ok:true with correct kg for valid inputs', () => {
      // D-1/S7: tryFrom({80, 8}) → ok:true, kg=101.33
      const result = OneRepMax.tryFrom({ weightKg: 80, reps: 8 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kg).toBe(101.33);
      }
    });

    it('returns ok:false when weightKg = 0', () => {
      // D-1/S4: V-41
      const result = OneRepMax.tryFrom({ weightKg: 0, reps: 5 });
      expect(result.ok).toBe(false);
    });

    it('returns ok:false when weightKg < 0', () => {
      // D-1/R6
      const result = OneRepMax.tryFrom({ weightKg: -10, reps: 5 });
      expect(result.ok).toBe(false);
    });

    it('returns ok:false when reps = 0', () => {
      // D-1/S5: V-42
      const result = OneRepMax.tryFrom({ weightKg: 100, reps: 0 });
      expect(result.ok).toBe(false);
    });

    it('returns ok:false when reps is not a positive integer (1.5)', () => {
      // D-1/S6
      const result = OneRepMax.tryFrom({ weightKg: 100, reps: 1.5 });
      expect(result.ok).toBe(false);
    });

    it('returns ok:false when weightKg is NaN', () => {
      // D-1/S8
      const result = OneRepMax.tryFrom({ weightKg: NaN, reps: 5 });
      expect(result.ok).toBe(false);
    });

    it('returns ok:false when reps is NaN', () => {
      // D-1/R6
      const result = OneRepMax.tryFrom({ weightKg: 100, reps: NaN });
      expect(result.ok).toBe(false);
    });

    it('returns ok:false when weightKg is Infinity', () => {
      // D-1/R6
      const result = OneRepMax.tryFrom({ weightKg: Infinity, reps: 5 });
      expect(result.ok).toBe(false);
    });

    it('returns ok:true for reps=1 (valid single-rep set)', () => {
      // D-1/R7
      const result = OneRepMax.tryFrom({ weightKg: 100, reps: 1 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kg).toBe(100.0);
      }
    });
  });

  describe('equals()', () => {
    it('two instances with same kg are equal', () => {
      // D-1 — VO equality
      const a = OneRepMax.epley(100, 5);
      const b = OneRepMax.epley(100, 5);
      expect(a.equals(b)).toBe(true);
    });

    it('two instances with different kg are not equal', () => {
      const a = OneRepMax.epley(100, 5);
      const b = OneRepMax.epley(80, 5);
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('toString()', () => {
    it('returns a readable string representation', () => {
      const orm = OneRepMax.epley(100, 5);
      expect(orm.toString()).toContain('116.67');
    });
  });
});
