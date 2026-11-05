import { Injectable, inject } from '@angular/core';
import { ExerciseInDay, TrainingDay } from '../training-day.entity';
import { TrainingDayRepository } from '../training-day.repository';

export interface ReorderExercisesInDayInput {
  dayId: string;
  /** Every exerciseId of the day, in the new order. */
  exerciseIds: readonly string[];
}

/**
 * Persists a new exercise order for a training day. The order lives in the
 * routine, so a session that reorders also changes the next sessions of that day.
 * Rejects a list that is not exactly the day's exercises (stale UI) without saving.
 */
@Injectable()
export class ReorderExercisesInDayUseCase {
  private readonly repo = inject(TrainingDayRepository);

  async execute(input: ReorderExercisesInDayInput): Promise<TrainingDay> {
    const day = await this.repo.getById(input.dayId);
    if (!day) {
      throw new Error(`TrainingDay not found: ${input.dayId}`);
    }

    const byId = new Map(day.exercises.map(e => [e.exerciseId, e]));
    const isSameSet =
      input.exerciseIds.length === day.exercises.length &&
      new Set(input.exerciseIds).size === input.exerciseIds.length &&
      input.exerciseIds.every(id => byId.has(id));
    if (!isSameSet) {
      throw new Error(`The new order must contain exactly the exercises of day ${day.id}`);
    }

    const exercises: ExerciseInDay[] = input.exerciseIds.map((id, order) => ({
      ...byId.get(id)!,
      order,
    }));

    const updated: TrainingDay = { ...day, exercises, updatedAt: new Date() };
    await this.repo.save(updated);
    return updated;
  }
}
