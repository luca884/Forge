import { Weight } from './weight';

describe('Weight Value Object', () => {
  describe('tryFrom', () => {
    it('S1: returns ok:true for 100 kg', () => {
      const result = Weight.tryFrom(100);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.value).toBe(100);
      }
    });

    it('S2: returns ok:true for fractional kg (0.5)', () => {
      const result = Weight.tryFrom(0.5);
      expect(result.ok).toBe(true);
    });

    it('S3: returns ok:false for 0 (not positive)', () => {
      const result = Weight.tryFrom(0);
      expect(result.ok).toBe(false);
    });

    it('S4: returns ok:false for -10 (negative)', () => {
      const result = Weight.tryFrom(-10);
      expect(result.ok).toBe(false);
    });

    it('S5: returns ok:true for 500 (boundary inclusive)', () => {
      const result = Weight.tryFrom(500);
      expect(result.ok).toBe(true);
    });

    it('V5: returns ok:false for 500.1 (exceeds max)', () => {
      const result = Weight.tryFrom(500.1);
      expect(result.ok).toBe(false);
    });

    it('S7: returns ok:false for NaN', () => {
      const result = Weight.tryFrom(NaN);
      expect(result.ok).toBe(false);
    });

    it('returns ok:false for Infinity', () => {
      const result = Weight.tryFrom(Infinity);
      expect(result.ok).toBe(false);
    });

    it('returns ok:false for -Infinity', () => {
      const result = Weight.tryFrom(-Infinity);
      expect(result.ok).toBe(false);
    });

    it('returns error string on failure', () => {
      const result = Weight.tryFrom(-1);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeTruthy();
      }
    });
  });

  describe('constructor', () => {
    it('constructs with valid weight', () => {
      const w = new Weight(75);
      expect(w.value).toBe(75);
    });

    it('throws for 0', () => {
      expect(() => new Weight(0)).toThrow();
    });

    it('throws for negative', () => {
      expect(() => new Weight(-1)).toThrow();
    });

    it('throws for > 500', () => {
      expect(() => new Weight(501)).toThrow();
    });

    it('accepts fractional values (102.5 kg)', () => {
      const w = new Weight(102.5);
      expect(w.value).toBe(102.5);
    });

    it('.value getter returns the weight', () => {
      const w = new Weight(50);
      expect(w.value).toBe(50);
    });
  });
});
