import { Injectable, inject } from '@angular/core';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { SessionRepository } from '@features/training/domain/session.repository';
import type { ExerciseProgressEntry } from '../models/exercise-progress-entry.model';
import { exerciseProgressEntries } from '../services/progress-aggregation.service';

@Injectable()
export class GetExerciseProgressListUseCase {
  private readonly sessionRepo = inject(SessionRepository);
  private readonly exerciseRepo = inject(ExerciseRepository);

  async execute({ weeksBack = 12 }: { weeksBack?: number } = {}): Promise<ExerciseProgressEntry[]> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - weeksBack * 7);

    const [sets, exercises] = await Promise.all([
      this.sessionRepo.getWorkedSetsSince(fromDate),
      this.exerciseRepo.getAll(),
    ]);
    return exerciseProgressEntries(sets, exercises);
  }
}
