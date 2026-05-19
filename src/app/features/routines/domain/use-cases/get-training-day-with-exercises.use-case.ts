import { Injectable, inject } from '@angular/core';
import { TrainingDayRepository } from '../training-day.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { ExerciseInDay, TrainingDay } from '../training-day.entity';

export interface ExerciseInDayView extends ExerciseInDay {
  readonly exerciseName: string;
}

export interface TrainingDayView extends Omit<TrainingDay, 'exercises'> {
  readonly exercises: readonly ExerciseInDayView[];
}

export interface GetTrainingDayWithExercisesInput {
  trainingDayId: string;
}

@Injectable()
export class GetTrainingDayWithExercisesUseCase {
  private readonly dayRepo = inject(TrainingDayRepository);
  private readonly exerciseRepo = inject(ExerciseRepository);

  async execute(
    input: GetTrainingDayWithExercisesInput,
  ): Promise<TrainingDayView | null> {
    const day = await this.dayRepo.getById(input.trainingDayId);
    if (!day) return null;

    const exercises = await this.exerciseRepo.getAll();
    const nameById = new Map(exercises.map(e => [e.id, e.name] as const));

    const enriched: readonly ExerciseInDayView[] = day.exercises.map(e => ({
      ...e,
      exerciseName: nameById.get(e.exerciseId) ?? '[Ejercicio eliminado]',
    }));

    return { ...day, exercises: enriched };
  }
}
