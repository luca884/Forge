import { Injectable, inject } from '@angular/core';
import { TrainingDay, ExerciseInDay } from '../training-day.entity';
import { TrainingDayRepository } from '../training-day.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { ExerciseNotFoundError } from '../errors/exercise-not-found.error';

export interface AddExercisesToDayInput {
  dayId: string;
  exerciseIds: readonly string[];
}

/**
 * Adds several exercises to a day in ONE read+save so the `order` is always
 * consecutive (the singular use case recomputed order per call → race when
 * adding many). Skips ids already present (dedup). N-2 / multi-select picker.
 */
@Injectable()
export class AddExercisesToDayUseCase {
  private readonly dayRepo = inject(TrainingDayRepository);
  private readonly exerciseRepo = inject(ExerciseRepository);

  async execute(input: AddExercisesToDayInput): Promise<TrainingDay> {
    const day = await this.dayRepo.getById(input.dayId);
    if (!day) {
      throw new Error(`TrainingDay not found: ${input.dayId}`);
    }

    const existing = new Set(day.exercises.map((e) => e.exerciseId));
    const toAdd = input.exerciseIds.filter((id) => !existing.has(id));

    const newExercises: ExerciseInDay[] = [];
    let order = day.exercises.length;
    for (const exerciseId of toAdd) {
      const exercise = await this.exerciseRepo.getById(exerciseId);
      if (!exercise) {
        throw new ExerciseNotFoundError(exerciseId);
      }
      newExercises.push({ exerciseId, order, targetSets: [] });
      order += 1;
    }

    if (newExercises.length === 0) return day;

    const updated: TrainingDay = {
      ...day,
      exercises: [...day.exercises, ...newExercises],
      updatedAt: new Date(),
    };
    await this.dayRepo.save(updated);
    return updated;
  }
}
