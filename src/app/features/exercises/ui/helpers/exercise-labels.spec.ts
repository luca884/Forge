import { trackingTypeLabel, equipmentLabel } from './exercise-labels';

describe('trackingTypeLabel', () => {
  it('maps tracking types to Spanish labels', () => {
    expect(trackingTypeLabel('weight-reps')).toBe('Peso y repeticiones');
    expect(trackingTypeLabel('bodyweight-reps')).toBe('Peso corporal y repeticiones');
    expect(trackingTypeLabel('time')).toBe('Tiempo');
    expect(trackingTypeLabel('distance-time')).toBe('Distancia y tiempo');
  });
});

describe('equipmentLabel', () => {
  it('maps equipment to Spanish labels', () => {
    expect(equipmentLabel('barbell')).toBe('Barra');
    expect(equipmentLabel('dumbbell')).toBe('Mancuernas');
    expect(equipmentLabel('bodyweight')).toBe('Peso corporal');
    expect(equipmentLabel('kettlebell')).toBe('Kettlebell');
  });
});
