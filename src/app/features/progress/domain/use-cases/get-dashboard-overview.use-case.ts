import { Injectable, inject } from '@angular/core';
import { SessionRepository } from '@features/training/domain/session.repository';
import { computeOverview } from '../services/progress-aggregation.service';
import type { DashboardOverview } from '../models/dashboard-overview.model';

@Injectable()
export class GetDashboardOverviewUseCase {
  private readonly sessionRepo = inject(SessionRepository);

  async execute({ dateWindowDays = 30 }: { dateWindowDays?: number } = {}): Promise<DashboardOverview> {
    const today = new Date();
    const currentStart = new Date(today);
    currentStart.setDate(today.getDate() - dateWindowDays);

    const priorStart = new Date(today);
    priorStart.setDate(today.getDate() - dateWindowDays * 2);

    const [currentSets, allPriorSets] = await Promise.all([
      this.sessionRepo.getWorkedSetsSince(currentStart),
      this.sessionRepo.getWorkedSetsSince(priorStart),
    ]);

    const currentStartTime = currentStart.getTime();
    const priorSets = allPriorSets.filter(s => s.createdAt.getTime() < currentStartTime);

    return computeOverview(currentSets, priorSets);
  }
}
