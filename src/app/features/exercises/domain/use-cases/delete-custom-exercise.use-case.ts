import { Injectable, inject } from '@angular/core';
import { ExerciseRepository } from '../exercise.repository';
import { ExerciseNotFoundError } from '../errors/exercise-not-found.error';
import { CannotDeleteBuiltInExerciseError } from '../errors/cannot-delete-built-in-exercise.error';
import { ExerciseInUseError } from '../errors/exercise-in-use.error';
import { SessionRepository } from '@features/training/domain/session.repository';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { TrainingDayRepository } from '@features/routines/domain/training-day.repository';

export interface DeleteCustomExerciseInput {
  id: string;
}

@Injectable()
export class DeleteCustomExerciseUseCase {
  private readonly repo = inject(ExerciseRepository);
  private readonly sessionRepo = inject(SessionRepository);
  private readonly prRepo = inject(PersonalRecordRepository);
  private readonly trainingDayRepo = inject(TrainingDayRepository);

  async execute(input: DeleteCustomExerciseInput): Promise<void> {
    const existing = await this.repo.getById(input.id);

    if (!existing) {
      throw new ExerciseNotFoundError(input.id);
    }

    if (!existing.isCustom) {
      throw new CannotDeleteBuiltInExerciseError(input.id);
    }

    if (await this.sessionRepo.existsWorkedSetForExercise(input.id)) {
      throw new ExerciseInUseError(input.id);
    }

    if (await this.prRepo.existsByExerciseId(input.id)) {
      throw new ExerciseInUseError(input.id);
    }

    if (await this.trainingDayRepo.existsExerciseInAnyDay(input.id)) {
      throw new ExerciseInUseError(input.id);
    }

    await this.repo.delete(input.id);
  }
}
