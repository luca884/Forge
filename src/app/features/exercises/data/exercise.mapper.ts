import { ExerciseRow } from '@core/db/database';
import { Exercise, Equipment, MuscleGroup } from '../domain/exercise.entity';
import { TrackingType } from '@core/shared/domain/tracking-type';
import { WeightUnit } from '@core/shared/domain/weight-unit';

export function toExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscleGroup as MuscleGroup,
    equipment: row.equipment as Equipment | undefined,
    trackingType: row.trackingType as TrackingType,
    // Backward-compat: rows without weightUnit default to 'kg'
    weightUnit: (row.weightUnit as WeightUnit | undefined) ?? 'kg',
    // Rows saved before S11 have no plate weight: the domain falls back to the default.
    plateWeightKg: row.plateWeightKg,
    isCustom: row.isCustom,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toExerciseRow(exercise: Exercise): ExerciseRow {
  return {
    id: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    trackingType: exercise.trackingType,
    weightUnit: exercise.weightUnit,
    // Only when set, so the rows of every other exercise keep their shape (S10).
    ...(exercise.plateWeightKg !== undefined && { plateWeightKg: exercise.plateWeightKg }),
    isCustom: exercise.isCustom,
    createdAt: exercise.createdAt,
    updatedAt: exercise.updatedAt,
  };
}
