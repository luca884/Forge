/**
 * weight-unit.spec.ts — Slice A: WeightUnit type and options (TDD).
 */
import {
  DEFAULT_PLATE_WEIGHT_KG,
  WEIGHT_UNIT_OPTIONS,
  WeightUnit,
  loadKg,
  normalizePlateWeightKg,
} from './weight-unit';

describe('WeightUnit', () => {
  it('WEIGHT_UNIT_OPTIONS contains kg and plates entries', () => {
    const values = WEIGHT_UNIT_OPTIONS.map((o) => o.value);
    expect(values).toContain('kg');
    expect(values).toContain('plates');
  });

  it('WEIGHT_UNIT_OPTIONS has labels for each entry', () => {
    for (const opt of WEIGHT_UNIT_OPTIONS) {
      expect(opt.label.length).toBeGreaterThan(0);
    }
  });

  it('kg option has Spanish label containing "kg"', () => {
    const kg = WEIGHT_UNIT_OPTIONS.find((o) => o.value === 'kg');
    expect(kg).toBeDefined();
    expect(kg!.label.toLowerCase()).toContain('kg');
  });

  it('plates option has Spanish label mentioning "placas"', () => {
    const plates = WEIGHT_UNIT_OPTIONS.find((o) => o.value === 'plates');
    expect(plates).toBeDefined();
    expect(plates!.label.toLowerCase()).toContain('placa');
  });

  it('WeightUnit type allows only kg and plates (runtime narrowing check)', () => {
    const validValues: WeightUnit[] = ['kg', 'plates'];
    expect(validValues).toHaveLength(2);
  });
});

// ── S11: plate weight ─────────────────────────────────────────────────────────

describe('loadKg', () => {
  it('returns a kg weight unchanged', () => {
    expect(loadKg(100, { weightUnit: 'kg' })).toBe(100);
  });

  it('returns the weight unchanged when the exercise is unknown', () => {
    expect(loadKg(100, null)).toBe(100);
    expect(loadKg(100, undefined)).toBe(100);
  });

  it('counts each plate as DEFAULT_PLATE_WEIGHT_KG (5 kg) when the exercise sets no plate weight', () => {
    expect(DEFAULT_PLATE_WEIGHT_KG).toBe(5);
    expect(loadKg(7, { weightUnit: 'plates' })).toBe(35);
  });

  it("uses the exercise's own plate weight", () => {
    expect(loadKg(7, { weightUnit: 'plates', plateWeightKg: 10 })).toBe(70);
  });

  it('ignores a plate weight on a kg exercise', () => {
    expect(loadKg(100, { weightUnit: 'kg', plateWeightKg: 10 })).toBe(100);
  });
});

describe('normalizePlateWeightKg', () => {
  it('keeps a positive plate weight on a plates exercise', () => {
    expect(normalizePlateWeightKg('plates', 2.5)).toBe(2.5);
  });

  it.each([undefined, null, 0, -5, Number.NaN, Number.POSITIVE_INFINITY])(
    'drops %p: the exercise falls back to the default',
    (value) => {
      expect(normalizePlateWeightKg('plates', value)).toBeUndefined();
    },
  );

  it('drops any plate weight on a kg exercise', () => {
    expect(normalizePlateWeightKg('kg', 10)).toBeUndefined();
  });
});
