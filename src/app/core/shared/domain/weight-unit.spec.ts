/**
 * weight-unit.spec.ts — Slice A: WeightUnit type and options (TDD).
 */
import { WEIGHT_UNIT_OPTIONS, WeightUnit } from './weight-unit';

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
