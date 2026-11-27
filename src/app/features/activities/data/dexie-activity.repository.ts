import { Injectable, inject } from '@angular/core';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import type { Activity } from '../domain/activity.entity';
import { ActivityRepository, type ActivitySummary } from '../domain/activity.repository';
import { toDomain, toRow, toSummary } from './activity.mapper';

@Injectable()
export class DexieActivityRepository extends ActivityRepository {
  private readonly db = inject(ForgeDatabaseService);

  async save(activity: Activity): Promise<void> {
    const { activities, activityTracks } = this.db;
    const { metadata, track } = toRow(activity);
    await this.db.transaction('rw', activities, activityTracks, () =>
      activities.put(metadata).then(() => activityTracks.put(track)),
    );
  }

  async list(): Promise<ActivitySummary[]> {
    const rows = await this.db.activities.toArray();
    return rows
      .sort((a, b) => (b.startedAt ?? b.importedAt) - (a.startedAt ?? a.importedAt))
      .map(toSummary);
  }

  getById(id: string): Promise<Activity | null> {
    const { activities, activityTracks } = this.db;
    return this.db.transaction('r', activities, activityTracks, () =>
      activities.get(id).then((row) =>
        row ? activityTracks.get(id).then((track) => (track ? toDomain(row, track) : null)) : null,
      ),
    );
  }

  async delete(id: string): Promise<void> {
    const { activities, activityTracks } = this.db;
    await this.db.transaction('rw', activities, activityTracks, () =>
      activities.delete(id).then(() => activityTracks.delete(id)),
    );
  }
}
