/**
 * exercise.mapper.spec.ts — Slice A: weightUnit backward-compat and persistence (TDD).
 */
import { toExercise, toExerciseRow } from './exercise.mapper';
import type { ExerciseRow } from '@core/db/database';
import type { Exercise } from '../domain/exercise.entity';

const baseRow: ExerciseRow = {
  id: 'ex-1',
  name: 'Bench Press',
  muscleGroup: 'chest',
  trackingType: 'weight-reps',
  isCustom: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const baseExercise: Exercise = {
  id: 'ex-1',
  name: 'Bench Press',
  muscleGroup: 'chest',
  trackingType: 'weight-reps',
  weightUnit: 'kg',
  isCustom: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('toExercise (mapper)', () => {
  it('defaults weightUnit to "kg" when row has no weightUnit field (backward-compat)', () => {
    const exercise = toExercise(baseRow);
    expect(exercise.weightUnit).toBe('kg');
  });

  it('reads weightUnit from row when present', () => {
    const row: ExerciseRow = { ...baseRow, weightUnit: 'plates' };
    const exercise = toExercise(row);
    expect(exercise.weightUnit).toBe('plates');
  });

  it('reads kg weightUnit from row when explicitly set', () => {
    const row: ExerciseRow = { ...baseRow, weightUnit: 'kg' };
    const exercise = toExercise(row);
    expect(exercise.weightUnit).toBe('kg');
  });
});

describe('toExerciseRow (mapper)', () => {
  it('persists weightUnit="kg" to the row', () => {
    const row = toExerciseRow(baseExercise);
    expect(row.weightUnit).toBe('kg');
  });

  it('persists weightUnit="plates" to the row', () => {
    const exercise: Exercise = { ...baseExercise, weightUnit: 'plates' };
    const row = toExerciseRow(exercise);
    expect(row.weightUnit).toBe('plates');
  });
});
