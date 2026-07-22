import { Injectable, inject } from '@angular/core';
import { SessionRepository } from '@features/training/domain/session.repository';
import type { WeeklyTrendPoint } from '../models/weekly-trend-point.model';
import { weeklyTrendPoints } from '../services/progress-aggregation.service';

@Injectable()
export class GetWeeklyTrendUseCase {
  private readonly sessionRepo = inject(SessionRepository);

  async execute({ weeksBack = 12 }: { weeksBack?: number } = {}): Promise<WeeklyTrendPoint[]> {
    const fromDate = mondayWeeksAgo(weeksBack - 1);
    const sets = await this.sessionRepo.getWorkedSetsSince(fromDate);
    return weeklyTrendPoints(sets, weeksBack);
  }
}

function mondayWeeksAgo(weeksAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7) - weeksAgo * 7);
  date.setHours(0, 0, 0, 0);
  return date;
}
