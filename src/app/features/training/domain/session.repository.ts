import { Session } from './session.entity';
import { WorkedSet } from './worked-set';

export abstract class SessionRepository {
  /** Returns the in-progress session, or null if none exists. */
  abstract getActive(): Promise<Session | null>;

  abstract getById(id: string): Promise<Session | null>;

  abstract save(session: Session): Promise<void>;

  abstract addSetToSession(sessionId: string, set: WorkedSet): Promise<void>;

  abstract editWorkedSet(sessionId: string, set: WorkedSet): Promise<void>;

  abstract removeWorkedSet(sessionId: string, setId: string): Promise<void>;

  /** Returns all worked sets for a specific session, ordered by createdAt ascending. */
  abstract getSetsForSession(sessionId: string): Promise<WorkedSet[]>;

  /** Returns worked sets across ALL sessions for this exercise, ordered by createdAt ascending. */
  abstract getAllWorkedSetsForExercise(exerciseId: string): Promise<WorkedSet[]>;

  /** Returns the most recent worked set for this exercise across ALL sessions. */
  abstract getLastWorkedSetForExercise(exerciseId: string): Promise<WorkedSet | null>;

  /** Returns all sessions, optionally filtered by startedAt >= fromDate. */
  abstract getAllSessions(fromDate?: Date): Promise<Session[]>;

  /** Returns true if any worked set references the given exerciseId. P3-2. */
  abstract existsWorkedSetForExercise(exerciseId: string): Promise<boolean>;

  /**
   * Permanently deletes the session row.
   * Used only by CancelSessionUseCase — called after sets are removed.
   */
  abstract deleteSession(sessionId: string): Promise<void>;

  /**
   * Permanently deletes all worked sets that belong to the given session.
   * Returns the list of deleted set IDs so the caller can cascade to PRs.
   */
  abstract deleteSetsBySessionId(sessionId: string): Promise<string[]>;
}
