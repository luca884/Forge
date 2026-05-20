import { TrainingDay } from './training-day.entity';

export abstract class TrainingDayRepository {
  abstract getById(id: string): Promise<TrainingDay | null>;
  abstract getByRoutineId(routineId: string): Promise<TrainingDay[]>;
  abstract save(day: TrainingDay): Promise<void>;
  abstract delete(id: string): Promise<void>;

  /**
   * Returns true if the given exerciseId appears in at least one training day's
   * exercises array. Full-scan (exercises are stored as JSON blob, no index). P3-2.
   */
  abstract existsExerciseInAnyDay(exerciseId: string): Promise<boolean>;
}
