import { Injectable, inject } from '@angular/core';
import { TrainingDay, ExerciseInDay } from '../training-day.entity';
import { TrainingDayRepository } from '../training-day.repository';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { TargetSet } from '../target-set';
import { TargetSetTypeMismatchError } from '../errors/target-set-type-mismatch.error';

export interface SetTargetSetsInput {
  dayId: string;
  exerciseId: string;
  targetSets: TargetSet[];
}

@Injectable()
export class SetTargetSetsUseCase {
  private readonly dayRepo = inject(TrainingDayRepository);
  private readonly exerciseRepo = inject(ExerciseRepository);

  async execute(input: SetTargetSetsInput): Promise<ExerciseInDay> {
    const exercise = await this.exerciseRepo.getById(input.exerciseId);
    if (!exercise) {
      throw new Error(`Exercise not found: ${input.exerciseId}`);
    }

    const day = await this.dayRepo.getById(input.dayId);
    if (!day) {
      throw new Error(`TrainingDay not found: ${input.dayId}`);
    }

    // Validate all target sets have matching type
    for (const targetSet of input.targetSets) {
      if (targetSet.type !== exercise.trackingType) {
        throw new TargetSetTypeMismatchError(input.exerciseId, exercise.trackingType, targetSet.type);
      }
    }

    const updatedExercises = day.exercises.map(e => {
      if (e.exerciseId !== input.exerciseId) return e;
      return { ...e, targetSets: input.targetSets };
    });

    const updatedDay: TrainingDay = {
      ...day,
      exercises: updatedExercises,
      updatedAt: new Date(),
    };

    await this.dayRepo.save(updatedDay);

    const updatedExercise = updatedDay.exercises.find(e => e.exerciseId === input.exerciseId)!;
    return updatedExercise;
  }
}
