import { Injectable, inject } from '@angular/core';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { TrainingHistoryReset } from '../domain/training-history-reset';

@Injectable()
export class DexieTrainingHistoryReset extends TrainingHistoryReset {
  private readonly db = inject(ForgeDatabaseService);

  async clear(): Promise<void> {
    await this.db.transaction(
      'rw',
      [
        this.db.routines,
        this.db.trainingDays,
        this.db.sessions,
        this.db.workedSets,
        this.db.personalRecords,
        this.db.auditEvents,
      ],
      async () => {
        await Promise.all([
          this.db.routines.clear(),
          this.db.trainingDays.clear(),
          this.db.sessions.clear(),
          this.db.workedSets.clear(),
          this.db.personalRecords.clear(),
          this.db.auditEvents.clear(),
        ]);
      },
    );
  }
}
