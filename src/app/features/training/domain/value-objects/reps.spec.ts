import { Reps } from './reps';

describe('Reps Value Object', () => {
  it('should construct with a valid positive integer', () => {
    const reps = new Reps(5);
    expect(reps.value).toBe(5);
  });

  it('should throw when value is zero', () => {
    expect(() => new Reps(0)).toThrow();
  });

  it('should throw when value is negative', () => {
    expect(() => new Reps(-1)).toThrow();
  });

  it('should throw when value is a non-integer (decimal)', () => {
    expect(() => new Reps(1.5)).toThrow();
  });
});
