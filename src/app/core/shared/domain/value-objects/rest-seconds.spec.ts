import { RestSeconds } from './rest-seconds';

describe('RestSeconds Value Object', () => {
  describe('tryFrom', () => {
    it('returns ok:true for 60 seconds', () => {
      const result = RestSeconds.tryFrom(60);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.value).toBe(60);
      }
    });

    it('returns ok:true for 0 (no rest)', () => {
      const result = RestSeconds.tryFrom(0);
      expect(result.ok).toBe(true);
    });

    it('returns ok:false for negative', () => {
      const result = RestSeconds.tryFrom(-1);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeTruthy();
      }
    });

    it('returns ok:false for NaN', () => {
      const result = RestSeconds.tryFrom(NaN);
      expect(result.ok).toBe(false);
    });

    it('returns ok:false for Infinity', () => {
      const result = RestSeconds.tryFrom(Infinity);
      expect(result.ok).toBe(false);
    });

    it('accepts whole seconds only (rejects 1.5)', () => {
      const result = RestSeconds.tryFrom(1.5);
      expect(result.ok).toBe(false);
    });
  });

  describe('constructor', () => {
    it('constructs with 90', () => {
      const r = new RestSeconds(90);
      expect(r.value).toBe(90);
    });

    it('throws for negative', () => {
      expect(() => new RestSeconds(-1)).toThrow();
    });

    it('.value getter returns the seconds', () => {
      const r = new RestSeconds(30);
      expect(r.value).toBe(30);
    });
  });
});
