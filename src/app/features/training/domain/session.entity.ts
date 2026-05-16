import { SessionStatus } from './session-status';

export interface Session {
  readonly id: string;
  readonly routineId: string;
  readonly dayId: string;
  /** ISO date string, format YYYY-MM-DD */
  readonly date: string;
  readonly startedAt: Date;
  readonly endedAt?: Date;
  readonly status: SessionStatus;
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
