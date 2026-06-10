import { Injectable, inject } from '@angular/core';
import { TrainingDay, ExerciseInDay } from '../training-day.entity';
import { TrainingDayRepository } from '../training-day.repository';
import { RestSeconds } from '@core/shared/domain/value-objects/rest-seconds';

export interface SetRestSecondsInput {
  dayId: string;
  exerciseId: string;
  /** Pass undefined to remove the per-exercise override (reverts to default). */
  restSeconds: number | undefined;
}

@Injectable()
export class SetRestSecondsUseCase {
  private readonly dayRepo = inject(TrainingDayRepository);

  async execute(input: SetRestSecondsInput): Promise<ExerciseInDay> {
    if (input.restSeconds !== undefined) {
      const result = RestSeconds.tryFrom(input.restSeconds);
      if (!result.ok) {
        throw new Error(result.error);
      }
    }

    const day = await this.dayRepo.getById(input.dayId);
    if (!day) {
      throw new Error(`TrainingDay not found: ${input.dayId}`);
    }

    if (!day.exercises.some(e => e.exerciseId === input.exerciseId)) {
      throw new Error(`Exercise not in day: ${input.exerciseId}`);
    }

    const updatedExercises = day.exercises.map(e => {
      if (e.exerciseId !== input.exerciseId) return e;
      const { restSeconds: _removed, ...rest } = e as ExerciseInDay & { restSeconds?: number };
      return input.restSeconds !== undefined
        ? { ...rest, restSeconds: input.restSeconds }
        : rest;
    });

    const updatedDay: TrainingDay = {
      ...day,
      exercises: updatedExercises,
      updatedAt: new Date(),
    };

    await this.dayRepo.save(updatedDay);

    return updatedDay.exercises.find(e => e.exerciseId === input.exerciseId)!;
  }
}
