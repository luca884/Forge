import type { ActivityRow, ActivityTrackRow } from '@core/db/database';
import type { Activity } from '../domain/activity.entity';
import type { ActivitySummary } from '../domain/activity.repository';

export function toSummary({ id, name, type, startedAt, importedAt, stats }: ActivityRow): ActivitySummary {
  return { id, name, type, startedAt, importedAt, stats };
}

export function toDomain(row: ActivityRow, track: ActivityTrackRow): Activity {
  return { ...toSummary(row), points: track.points };
}

export function toRow(activity: Activity): { metadata: ActivityRow; track: ActivityTrackRow } {
  return { metadata: toSummary(activity), track: { activityId: activity.id, points: activity.points } };
}
