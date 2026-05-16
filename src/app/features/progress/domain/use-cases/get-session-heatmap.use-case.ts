import { Injectable, inject } from '@angular/core';
import { SessionRepository } from '@features/training/domain/session.repository';

@Injectable()
export class GetSessionHeatmapUseCase {
  private readonly sessionRepo = inject(SessionRepository);

  async execute(): Promise<Map<string, number>> {
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - 84);

    const sessions = await this.sessionRepo.getAllSessions(fromDate);

    const map = new Map<string, number>();
    for (const session of sessions) {
      const dateKey = session.startedAt.toLocaleDateString('en-CA');
      map.set(dateKey, (map.get(dateKey) ?? 0) + 1);
    }

    return map;
  }
}
