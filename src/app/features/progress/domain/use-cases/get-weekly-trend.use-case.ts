import { Injectable, inject } from '@angular/core';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { SessionRepository } from '@features/training/domain/session.repository';
import type { WeeklyTrendPoint } from '../models/weekly-trend-point.model';
import { weeklyTrendPoints } from '../services/progress-aggregation.service';

@Injectable()
export class GetWeeklyTrendUseCase {
  private readonly sessionRepo = inject(SessionRepository);
  private readonly exerciseRepo = inject(ExerciseRepository);

  async execute({ weeksBack = 12 }: { weeksBack?: number } = {}): Promise<WeeklyTrendPoint[]> {
    const fromDate = mondayWeeksAgo(weeksBack - 1);
    const [sets, exercises] = await Promise.all([
      this.sessionRepo.getWorkedSetsSince(fromDate),
      this.exerciseRepo.getAll(),
    ]);
    return weeklyTrendPoints(sets, weeksBack, exercises);
  }
}

function mondayWeeksAgo(weeksAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7) - weeksAgo * 7);
  date.setHours(0, 0, 0, 0);
  return date;
}
