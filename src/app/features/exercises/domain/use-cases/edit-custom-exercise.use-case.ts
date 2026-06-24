import { Injectable, inject } from '@angular/core';
import { Exercise, Equipment, MuscleGroup } from '../exercise.entity';
import { ExerciseRepository } from '../exercise.repository';
import { WeightUnit } from '@core/shared/domain/weight-unit';
import { DuplicateExerciseNameError } from '../errors/duplicate-exercise-name.error';
import { ExerciseNameRequiredError } from '../errors/exercise-name-required.error';
import { ExerciseNotFoundError } from '../errors/exercise-not-found.error';
import { CannotEditBuiltInExerciseError } from '../errors/cannot-edit-built-in-exercise.error';

export interface EditCustomExerciseInput {
  id: string;
  name?: string;
  muscleGroup?: MuscleGroup;
  equipment?: Equipment;
  /** Only meaningful for weight-reps exercises. */
  weightUnit?: WeightUnit;
}

@Injectable()
export class EditCustomExerciseUseCase {
  private readonly repo = inject(ExerciseRepository);

  async execute(input: EditCustomExerciseInput): Promise<void> {
    const existing = await this.repo.getById(input.id);

    if (!existing) {
      throw new ExerciseNotFoundError(input.id);
    }

    if (!existing.isCustom) {
      throw new CannotEditBuiltInExerciseError(input.id);
    }

    if (input.name !== undefined) {
      const trimmedName = input.name.trim();

      if (trimmedName === '') {
        throw new ExerciseNameRequiredError();
      }

      const all = await this.repo.getAll();
      const duplicate = all.find(
        (e) =>
          e.id !== input.id &&
          e.name.trim().toLowerCase() === trimmedName.toLowerCase(),
      );
      if (duplicate) {
        throw new DuplicateExerciseNameError(trimmedName);
      }
    }

    const updated: Exercise = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      muscleGroup: input.muscleGroup ?? existing.muscleGroup,
      equipment: input.equipment !== undefined ? input.equipment : existing.equipment,
      weightUnit: input.weightUnit ?? existing.weightUnit,
      updatedAt: new Date(),
    };

    await this.repo.save(updated);
  }
}
