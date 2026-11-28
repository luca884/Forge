import { createHealthDay, InvalidHealthDayInputError, type HealthDay } from './health-day.entity';

const valid: HealthDay = {
  id: '2026-11-27',
  steps: 8123,
  distanceMeters: 6100,
  caloriesKcal: 2210,
  heartRate: { avg: 72, min: 51, max: 130, samples: 96 },
  oxygenSaturation: { avg: 97, min: 94, max: 99, samples: 12 },
  syncedAt: 1793813400000,
};

describe('createHealthDay', () => {
  it('returns a valid day unchanged', () => {
    expect(createHealthDay(valid)).toEqual(valid);
  });

  it('accepts a day with no data at all', () => {
    const empty = { ...valid, steps: null, distanceMeters: null, caloriesKcal: null, heartRate: null, oxygenSaturation: null };
    expect(createHealthDay(empty)).toEqual(empty);
  });

  it.each<[string, Partial<HealthDay>, string]>([
    ['a malformed id', { id: '27/11/2026' }, 'el id debe ser un día AAAA-MM-DD'],
    ['an id that is not a real day', { id: '2026-02-30' }, 'el id debe ser un día AAAA-MM-DD'],
    ['negative steps', { steps: -1 }, 'los pasos deben ser un entero mayor o igual a 0'],
    ['fractional steps', { steps: 10.5 }, 'los pasos deben ser un entero mayor o igual a 0'],
    ['negative distance', { distanceMeters: -5 }, 'la distancia debe ser un número mayor o igual a 0'],
    ['non-finite calories', { caloriesKcal: Number.NaN }, 'las calorías deben ser un número mayor o igual a 0'],
    ['a heart rate with min above avg', { heartRate: { avg: 60, min: 70, max: 130, samples: 3 } }, 'la frecuencia cardíaca debe cumplir mínimo ≤ promedio ≤ máximo'],
    ['a heart rate with max below avg', { heartRate: { avg: 140, min: 51, max: 130, samples: 3 } }, 'la frecuencia cardíaca debe cumplir mínimo ≤ promedio ≤ máximo'],
    ['a negative heart rate', { heartRate: { avg: -1, min: -2, max: 0, samples: 1 } }, 'la frecuencia cardíaca no puede ser negativa'],
    ['a heart rate with no samples', { heartRate: { avg: 72, min: 51, max: 130, samples: 0 } }, 'la frecuencia cardíaca necesita al menos una muestra'],
    ['an oxygen saturation above 100', { oxygenSaturation: { avg: 97, min: 94, max: 101, samples: 2 } }, 'la saturación de oxígeno debe estar entre 0 y 100'],
    ['an oxygen saturation with min above avg', { oxygenSaturation: { avg: 90, min: 95, max: 99, samples: 2 } }, 'la saturación de oxígeno debe cumplir mínimo ≤ promedio ≤ máximo'],
  ])('rejects %s', (_case, change, reason) => {
    const attempt = () => createHealthDay({ ...valid, ...change });
    expect(attempt).toThrow(InvalidHealthDayInputError);
    expect(attempt).toThrow(`Día de salud no válido: ${reason}`);
  });

  it('accepts the boundaries: zero values and an oxygen saturation of 0 and 100', () => {
    expect(() => createHealthDay({ ...valid, steps: 0, distanceMeters: 0, caloriesKcal: 0, oxygenSaturation: { avg: 100, min: 100, max: 100, samples: 1 } })).not.toThrow();
    expect(() => createHealthDay({ ...valid, oxygenSaturation: { avg: 0, min: 0, max: 0, samples: 1 } })).not.toThrow();
  });

  it.each([Infinity, Number.NaN])('rejects %p as steps and as a heart rate value', (n) => {
    expect(() => createHealthDay({ ...valid, steps: n })).toThrow(InvalidHealthDayInputError);
    expect(() => createHealthDay({ ...valid, heartRate: { avg: 1, min: 1, max: n, samples: 1 } })).toThrow(InvalidHealthDayInputError);
  });

  it('rejects ids that are not real days or are not zero-padded, and accepts a leap day', () => {
    for (const id of ['2026-02-29', '2026-13-01', '2026-1-1', '2026-11-27\n']) {
      expect(() => createHealthDay({ ...valid, id })).toThrow(InvalidHealthDayInputError);
    }
    expect(() => createHealthDay({ ...valid, id: '2028-02-29' })).not.toThrow();
  });
});
