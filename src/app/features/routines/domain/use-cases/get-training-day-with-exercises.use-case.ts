import { Injectable, inject } from '@angular/core';
import { TrainingDayRepository } from '../training-day.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { ExerciseInDay, TrainingDay } from '../training-day.entity';
import { TrackingType } from '@core/shared/domain/tracking-type';
import { WeightUnit } from '@core/shared/domain/weight-unit';

export interface ExerciseInDayView extends ExerciseInDay {
  readonly exerciseName: string;
  /** Tracking type del ejercicio — necesario para editar las series objetivo. */
  readonly trackingType: TrackingType;
  /** Unidad del peso del ejercicio: en placas, las series objetivo piden placas y no kg (D4). */
  readonly weightUnit: WeightUnit;
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
    const byId = new Map(exercises.map(e => [e.id, e] as const));

    const enriched: readonly ExerciseInDayView[] = day.exercises.map(e => {
      const ex = byId.get(e.exerciseId);
      return {
        ...e,
        exerciseName: ex?.name ?? '[Ejercicio eliminado]',
        trackingType: ex?.trackingType ?? 'weight-reps',
        weightUnit: ex?.weightUnit ?? 'kg',
      };
    });

    return { ...day, exercises: enriched };
  }
}
