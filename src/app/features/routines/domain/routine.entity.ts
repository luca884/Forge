import { WeeklySchedule } from './value-objects/weekly-schedule';

export interface Routine {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly isActive: boolean;
  /** Optional weekly schedule mapping DayOfWeek → TrainingDay.id. undefined = not configured yet. D-22. */
  readonly schedule?: WeeklySchedule;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
