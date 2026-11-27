import type { Activity } from './activity.entity';

export type ActivitySummary = Omit<Activity, 'points'>;

export abstract class ActivityRepository {
  abstract save(activity: Activity): Promise<void>;
  abstract list(): Promise<ActivitySummary[]>;
  abstract getById(id: string): Promise<Activity | null>;
  abstract delete(id: string): Promise<void>;
}
