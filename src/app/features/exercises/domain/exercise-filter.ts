import { MuscleGroup } from './exercise.entity';

export interface ExerciseFilter {
  search?: string;
  muscleGroup?: MuscleGroup;
}
