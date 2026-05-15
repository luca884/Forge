import { ExerciseRow } from '@core/db/database';
import { Exercise, Equipment, MuscleGroup } from '../domain/exercise.entity';
import { TrackingType } from '@core/shared/domain/tracking-type';

export function toExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscleGroup as MuscleGroup,
    equipment: row.equipment as Equipment | undefined,
    trackingType: row.trackingType as TrackingType,
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
    isCustom: exercise.isCustom,
    createdAt: exercise.createdAt,
    updatedAt: exercise.updatedAt,
  };
}
