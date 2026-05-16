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

  /** Returns worked sets across ALL sessions for this exercise, ordered by createdAt ascending. */
  abstract getAllWorkedSetsForExercise(exerciseId: string): Promise<WorkedSet[]>;

  /** Returns the most recent worked set for this exercise across ALL sessions. */
  abstract getLastWorkedSetForExercise(exerciseId: string): Promise<WorkedSet | null>;
}
