import { TrainingDayRow } from '@core/db/database';
import { TrainingDay, ExerciseInDay } from '../domain/training-day.entity';
import { TargetSet } from '../domain/target-set';

export interface ExerciseInDayRow {
  exerciseId: string;
  order: number;
  targetSets: TargetSet[];
  restSeconds?: number;
  note?: string;
}

export function toTrainingDay(row: TrainingDayRow): TrainingDay {
  const exercises = (row.exercises as ExerciseInDayRow[] | null) ?? [];
  return {
    id: row.id,
    routineId: row.routineId,
    name: row.name,
    label: row.label,
    exercises: exercises.map(e => ({
      exerciseId: e.exerciseId,
      order: e.order,
      targetSets: (e.targetSets ?? []) as TargetSet[],
      restSeconds: e.restSeconds,
      note: e.note,
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toTrainingDayRow(day: TrainingDay): TrainingDayRow {
  const exercisesRow: ExerciseInDayRow[] = day.exercises.map(e => ({
    exerciseId: e.exerciseId,
    order: e.order,
    targetSets: [...e.targetSets] as TargetSet[],
    restSeconds: e.restSeconds,
    note: e.note,
  }));

  return {
    id: day.id,
    routineId: day.routineId,
    name: day.name,
    label: day.label,
    exercises: exercisesRow,
    createdAt: day.createdAt,
    updatedAt: day.updatedAt,
  };
}
