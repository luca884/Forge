import { Injectable, inject } from '@angular/core';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { Session } from '../domain/session.entity';
import { SessionRepository } from '../domain/session.repository';
import { WorkedSet } from '../domain/worked-set';
import { toSession, toSessionRow } from './session.mapper';
import { toWorkedSet, toWorkedSetRow } from './worked-set.mapper';

@Injectable()
export class DexieSessionRepository extends SessionRepository {
  private readonly db = inject(ForgeDatabaseService);

  async getActive(): Promise<Session | null> {
    // Use the status index, but filter client-side for reliability with fake-indexeddb
    const rows = await this.db.sessions.where('status').equals('in-progress').toArray();
    const row = rows[0];
    return row ? toSession(row) : null;
  }

  async getById(id: string): Promise<Session | null> {
    const row = await this.db.sessions.get(id);
    return row ? toSession(row) : null;
  }

  async save(session: Session): Promise<void> {
    await this.db.sessions.put(toSessionRow(session));
  }

  async addSetToSession(_sessionId: string, set: WorkedSet): Promise<void> {
    await this.db.workedSets.put(toWorkedSetRow(set));
  }

  async editWorkedSet(_sessionId: string, set: WorkedSet): Promise<void> {
    await this.db.workedSets.put(toWorkedSetRow(set));
  }

  async removeWorkedSet(_sessionId: string, setId: string): Promise<void> {
    await this.db.workedSets.delete(setId);
  }

  async getSetsForSession(sessionId: string): Promise<WorkedSet[]> {
    const rows = await this.db.workedSets
      .where('sessionId')
      .equals(sessionId)
      .sortBy('createdAt');
    return rows.map(toWorkedSet);
  }

  async getAllWorkedSetsForExercise(exerciseId: string): Promise<WorkedSet[]> {
    const rows = await this.db.workedSets
      .where('exerciseId')
      .equals(exerciseId)
      .sortBy('createdAt');
    return rows.map(toWorkedSet);
  }

  async getLastWorkedSetForExercise(exerciseId: string): Promise<WorkedSet | null> {
    const rows = await this.db.workedSets
      .where('exerciseId')
      .equals(exerciseId)
      .sortBy('createdAt');

    if (rows.length === 0) return null;
    return toWorkedSet(rows[rows.length - 1]!);
  }

  async getAllSessions(fromDate?: Date): Promise<Session[]> {
    if (fromDate) {
      // Use client-side filter for reliability across IndexedDB implementations.
      // Normalise to timestamps to handle cases where fake-indexeddb may return
      // Date-like objects that don't compare correctly with >=.
      const fromTime = fromDate.getTime();
      const rows = await this.db.sessions.toArray();
      return rows
        .filter(r => new Date(r.startedAt).getTime() >= fromTime)
        .map(toSession);
    }
    const rows = await this.db.sessions.toArray();
    return rows.map(toSession);
  }

  async existsWorkedSetForExercise(exerciseId: string): Promise<boolean> {
    return (await this.db.workedSets.where('exerciseId').equals(exerciseId).count()) > 0;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.db.sessions.delete(sessionId);
  }

  async deleteSetsBySessionId(sessionId: string): Promise<string[]> {
    const rows = await this.db.workedSets.where('sessionId').equals(sessionId).toArray();
    const ids = rows.map(r => r.id);
    if (ids.length > 0) {
      await this.db.workedSets.bulkDelete(ids);
    }
    return ids;
  }
}
