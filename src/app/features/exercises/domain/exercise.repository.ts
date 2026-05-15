import { Exercise } from './exercise.entity';
import { ExerciseFilter } from './exercise-filter';

export abstract class ExerciseRepository {
  abstract getAll(filter?: ExerciseFilter): Promise<Exercise[]>;
  abstract getById(id: string): Promise<Exercise | null>;
  abstract save(exercise: Exercise): Promise<void>;
  abstract count(): Promise<number>;
}
