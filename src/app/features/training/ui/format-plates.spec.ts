import { formatPlates } from './format-plates';

describe('formatPlates (D4)', () => {
  it('uses the singular for exactly one plate', () => {
    expect(formatPlates(1)).toBe('1 placa');
  });

  it('uses the plural for any other count', () => {
    expect(formatPlates(7)).toBe('7 placas');
    expect(formatPlates(0)).toBe('0 placas');
    expect(formatPlates(2.5)).toBe('2.5 placas');
  });
});
