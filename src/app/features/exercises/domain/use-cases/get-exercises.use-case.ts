import { Injectable, inject } from '@angular/core';
import { Exercise } from '../exercise.entity';
import { ExerciseFilter } from '../exercise-filter';
import { ExerciseRepository } from '../exercise.repository';

@Injectable()
export class GetExercisesUseCase {
  private readonly repo = inject(ExerciseRepository);

  execute(filter?: ExerciseFilter): Promise<Exercise[]> {
    return this.repo.getAll(filter);
  }
}
