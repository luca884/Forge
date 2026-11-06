import { Injectable, inject } from '@angular/core';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { toPersonalRecordRow } from '@features/progress/data/mappers/personal-record.mapper';
import { ExerciseHistoryStore, type ExerciseHistoryRewrite } from '../domain/exercise-history.store';
import { toWorkedSetRow } from './worked-set.mapper';

@Injectable()
export class DexieExerciseHistoryStore extends ExerciseHistoryStore {
  private readonly db = inject(ForgeDatabaseService);

  async rewrite(change: ExerciseHistoryRewrite): Promise<void> {
    const { workedSets, personalRecords } = this.db;
    // One transaction: a failed write rolls back the deletes too. Chained Dexie promises, not
    // sequential awaits, so zone.js keeps the transaction alive (PrematureCommitError otherwise).
    await this.db.transaction('rw', [workedSets, personalRecords], () =>
      Promise.all([
        workedSets.bulkDelete([...change.removedSetIds]),
        workedSets.bulkPut(change.sets.map(toWorkedSetRow)),
        personalRecords.where('exerciseId').equals(change.exerciseId).delete(),
      ]).then(() => personalRecords.bulkAdd(change.records.map(toPersonalRecordRow))),
    );
  }
}
