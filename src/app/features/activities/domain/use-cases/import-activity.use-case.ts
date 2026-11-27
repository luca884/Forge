import { Injectable, inject } from '@angular/core';
import { generateUUID } from '@core/shared/utils/uuid';
import { computeStats } from '../activity-stats';
import { createActivity, type Activity, type ActivityType } from '../activity.entity';
import { ActivityRepository } from '../activity.repository';
import { ActivityTypeRequiredError } from '../errors/activity-type-required.error';
import { parseGpx } from '../gpx-parser';

export interface ImportActivityInput {
  xml: string;
  fileName: string;
  type?: ActivityType;
}

@Injectable()
export class ImportActivityUseCase {
  private readonly repo = inject(ActivityRepository);

  async execute(input: ImportActivityInput): Promise<Activity> {
    const parsed = parseGpx(input.xml);
    const type = input.type ?? parsed.type;
    if (type === null) throw new ActivityTypeRequiredError();

    const activity = createActivity({
      id: generateUUID(),
      name: parsed.name ?? input.fileName.replace(/\.[^.]+$/, ''),
      type,
      startedAt: parsed.points.find((point) => point.time !== null)?.time ?? null,
      points: parsed.points,
      stats: computeStats(parsed.points),
      importedAt: Date.now(),
    });
    await this.repo.save(activity);
    return activity;
  }
}
