import { Injectable, inject } from '@angular/core';
import { TrainingDay } from '../training-day.entity';
import { TrainingDayRepository } from '../training-day.repository';

export interface RemoveExerciseFromDayInput {
  dayId: string;
  exerciseId: string;
}

@Injectable()
export class RemoveExerciseFromDayUseCase {
  private readonly repo = inject(TrainingDayRepository);

  async execute(input: RemoveExerciseFromDayInput): Promise<TrainingDay> {
    const day = await this.repo.getById(input.dayId);
    if (!day) {
      throw new Error(`TrainingDay not found: ${input.dayId}`);
    }

    const remaining = day.exercises
      .filter(e => e.exerciseId !== input.exerciseId)
      .map((e, idx) => ({ ...e, order: idx }));

    const updated: TrainingDay = {
      ...day,
      exercises: remaining,
      updatedAt: new Date(),
    };

    await this.repo.save(updated);
    return updated;
  }
}
