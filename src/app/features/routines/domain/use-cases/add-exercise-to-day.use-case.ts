import { Injectable, inject } from '@angular/core';
import { TrainingDay, ExerciseInDay } from '../training-day.entity';
import { TrainingDayRepository } from '../training-day.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { ExerciseNotFoundError } from '../errors/exercise-not-found.error';

export interface AddExerciseToDayInput {
  dayId: string;
  exerciseId: string;
}

@Injectable()
export class AddExerciseToDayUseCase {
  private readonly dayRepo = inject(TrainingDayRepository);
  private readonly exerciseRepo = inject(ExerciseRepository);

  async execute(input: AddExerciseToDayInput): Promise<TrainingDay> {
    const exercise = await this.exerciseRepo.getById(input.exerciseId);
    if (!exercise) {
      throw new ExerciseNotFoundError(input.exerciseId);
    }

    const day = await this.dayRepo.getById(input.dayId);
    if (!day) {
      throw new Error(`TrainingDay not found: ${input.dayId}`);
    }

    const newExercise: ExerciseInDay = {
      exerciseId: input.exerciseId,
      order: day.exercises.length,
      targetSets: [],
    };

    const updated: TrainingDay = {
      ...day,
      exercises: [...day.exercises, newExercise],
      updatedAt: new Date(),
    };

    await this.dayRepo.save(updated);
    return updated;
  }
}
