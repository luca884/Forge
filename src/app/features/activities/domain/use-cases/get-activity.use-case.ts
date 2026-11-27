import { Injectable, inject } from '@angular/core';
import type { Activity } from '../activity.entity';
import { ActivityRepository } from '../activity.repository';
import { ActivityNotFoundError } from '../errors/activity-not-found.error';

@Injectable()
export class GetActivityUseCase {
  private readonly repo = inject(ActivityRepository);

  async execute(id: string): Promise<Activity> {
    const activity = await this.repo.getById(id);
    if (activity === null) throw new ActivityNotFoundError(id);
    return activity;
  }
}
