import { Injectable, inject } from '@angular/core';
import { Exercise, Equipment, MuscleGroup } from '../exercise.entity';
import { ExerciseRepository } from '../exercise.repository';
import { TrackingType } from '@core/shared/domain/tracking-type';
import { DuplicateExerciseNameError } from '../errors/duplicate-exercise-name.error';
import { ExerciseNameRequiredError } from '../errors/exercise-name-required.error';
import { generateUUID } from '@core/shared/utils/uuid';

export interface CreateCustomExerciseInput {
  name: string;
  muscleGroup: MuscleGroup;
  trackingType: TrackingType;
  equipment?: Equipment;
}

@Injectable()
export class CreateCustomExerciseUseCase {
  private readonly repo = inject(ExerciseRepository);

  async execute(input: CreateCustomExerciseInput): Promise<Exercise> {
    const trimmedName = input.name.trim();

    if (trimmedName === '') {
      throw new ExerciseNameRequiredError();
    }

    const existing = await this.repo.getAll();
    const duplicate = existing.find(
      (e) => e.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );
    if (duplicate) {
      throw new DuplicateExerciseNameError(trimmedName);
    }

    const now = new Date();
    const exercise: Exercise = {
      id: generateUUID(),
      name: trimmedName,
      muscleGroup: input.muscleGroup,
      trackingType: input.trackingType,
      equipment: input.equipment,
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.save(exercise);
    return exercise;
  }
}
