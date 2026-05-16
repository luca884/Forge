import { Injectable, inject } from '@angular/core';
import { TrainingDayRepository } from '../domain/training-day.repository';
import { TrainingDay } from '../domain/training-day.entity';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { toTrainingDay, toTrainingDayRow } from './training-day.mapper';

@Injectable()
export class DexieTrainingDayRepository extends TrainingDayRepository {
  private readonly db = inject(ForgeDatabaseService);

  async getById(id: string): Promise<TrainingDay | null> {
    const row = await this.db.trainingDays.get(id);
    return row ? toTrainingDay(row) : null;
  }

  async getByRoutineId(routineId: string): Promise<TrainingDay[]> {
    const rows = await this.db.trainingDays
      .where('routineId')
      .equals(routineId)
      .toArray();
    return rows.map(toTrainingDay);
  }

  async save(day: TrainingDay): Promise<void> {
    await this.db.trainingDays.put(toTrainingDayRow(day));
  }

  async delete(id: string): Promise<void> {
    await this.db.trainingDays.delete(id);
  }
}
