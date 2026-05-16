import { TargetSet } from './target-set';

export interface ExerciseInDay {
  readonly exerciseId: string;
  readonly order: number;
  readonly targetSets: readonly TargetSet[];
  readonly restSeconds?: number;
  readonly note?: string;
}

export interface TrainingDay {
  readonly id: string;
  readonly routineId: string;
  readonly name: string;
  readonly label?: string;
  readonly exercises: readonly ExerciseInDay[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
