import { Injectable, inject } from '@angular/core';
import { ExerciseRepository } from '../exercise.repository';
import { ExerciseNotFoundError } from '../errors/exercise-not-found.error';
import { CannotDeleteBuiltInExerciseError } from '../errors/cannot-delete-built-in-exercise.error';

export interface DeleteCustomExerciseInput {
  id: string;
}

@Injectable()
export class DeleteCustomExerciseUseCase {
  private readonly repo = inject(ExerciseRepository);

  async execute(input: DeleteCustomExerciseInput): Promise<void> {
    const existing = await this.repo.getById(input.id);

    if (!existing) {
      throw new ExerciseNotFoundError(input.id);
    }

    if (!existing.isCustom) {
      throw new CannotDeleteBuiltInExerciseError(input.id);
    }

    await this.repo.delete(input.id);
  }
}
