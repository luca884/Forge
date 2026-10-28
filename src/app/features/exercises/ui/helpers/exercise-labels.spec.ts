import type { Exercise } from '../../domain/exercise.entity';
import { trackingTypeLabel, equipmentLabel, exerciseMeta } from './exercise-labels';

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

describe('exerciseMeta', () => {
  const base: Exercise = {
    id: 'ex-1',
    name: 'Sentadilla',
    muscleGroup: 'legs',
    trackingType: 'weight-reps',
    weightUnit: 'kg',
    isCustom: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  it('joins muscle group and equipment with a middle dot', () => {
    expect(exerciseMeta({ ...base, equipment: 'barbell' })).toBe('Piernas · Barra');
  });

  it('omits the equipment when the exercise has none', () => {
    expect(exerciseMeta(base)).toBe('Piernas');
  });

  it('adds "placas" for weight-reps exercises logged in plates', () => {
    expect(exerciseMeta({ ...base, equipment: 'machine', weightUnit: 'plates' })).toBe(
      'Piernas · Máquina · placas',
    );
  });

  it('ignores plates when the tracking type is not weight-reps', () => {
    expect(exerciseMeta({ ...base, trackingType: 'time', weightUnit: 'plates' })).toBe('Piernas');
  });
});
