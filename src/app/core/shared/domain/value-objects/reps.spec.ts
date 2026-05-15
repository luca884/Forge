import { Reps } from './reps';

describe('Reps Value Object', () => {
  describe('tryFrom', () => {
    it('S1: returns ok:true with value 10 for valid positive integer', () => {
      const result = Reps.tryFrom(10);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.value).toBe(10);
      }
    });

    it('S2: returns ok:true for 0 (rest set / missed set notation)', () => {
      const result = Reps.tryFrom(0);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.value).toBe(0);
      }
    });

    it('S3: returns ok:false for -1 (negative)', () => {
      const result = Reps.tryFrom(-1);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeTruthy();
      }
    });

    it('S4: returns ok:false for 1.5 (fractional)', () => {
      const result = Reps.tryFrom(1.5);
      expect(result.ok).toBe(false);
    });

    it('edge case: returns ok:false for NaN', () => {
      const result = Reps.tryFrom(NaN);
      expect(result.ok).toBe(false);
    });

    it('edge case: returns ok:false for Infinity', () => {
      const result = Reps.tryFrom(Infinity);
      expect(result.ok).toBe(false);
    });

    it('edge case: returns ok:false for -Infinity', () => {
      const result = Reps.tryFrom(-Infinity);
      expect(result.ok).toBe(false);
    });
  });

  describe('constructor', () => {
    it('should construct with a valid positive integer', () => {
      const reps = new Reps(5);
      expect(reps.value).toBe(5);
    });

    it('S5: should throw when value is negative', () => {
      expect(() => new Reps(-5)).toThrow();
    });

    it('should throw when value is a non-integer (decimal)', () => {
      expect(() => new Reps(1.5)).toThrow();
    });

    it('should accept 0 (rest set notation)', () => {
      const reps = new Reps(0);
      expect(reps.value).toBe(0);
    });

    it('.value getter returns the validated integer', () => {
      const reps = new Reps(7);
      expect(reps.value).toBe(7);
    });
  });
});
