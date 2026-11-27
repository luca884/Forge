import { Injectable, inject } from '@angular/core';
import { ActivityRepository, type ActivitySummary } from '../activity.repository';

@Injectable()
export class ListActivitiesUseCase {
  private readonly repo = inject(ActivityRepository);

  execute(): Promise<ActivitySummary[]> {
    return this.repo.list();
  }
}
