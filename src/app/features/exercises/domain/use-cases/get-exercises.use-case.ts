import { Injectable, inject } from '@angular/core';
import { Exercise } from '../exercise.entity';
import { ExerciseFilter } from '../exercise-filter';
import { ExerciseRepository } from '../exercise.repository';

@Injectable()
export class GetExercisesUseCase {
  private readonly repo = inject(ExerciseRepository);

  async execute(filter?: ExerciseFilter): Promise<Exercise[]> {
    // Stable, locale-aware alphabetical order so the catalog reads predictably
    // in both the exercise list and the routine picker (shared use case). N-1.
    const exercises = await this.repo.getAll(filter);
    return [...exercises].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
}
