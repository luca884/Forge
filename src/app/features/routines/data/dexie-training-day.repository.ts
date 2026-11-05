import { Injectable, inject } from '@angular/core';
import { TrainingDayRepository } from '../domain/training-day.repository';
import { TrainingDay } from '../domain/training-day.entity';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { toTrainingDay, toTrainingDayRow, ExerciseInDayRow } from './training-day.mapper';

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
    // The index orders by id (a UUID), which is arbitrary. Days keep the order they were created in;
    // a template creates several within one millisecond, so ties fall back to the name (A, B, C).
    return rows
      .map(toTrainingDay)
      .sort(
        (a, b) =>
          // new Date(): IndexedDB can hand back a Date from another realm (as in Jest).
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
          a.name.localeCompare(b.name, 'es', { numeric: true }),
      );
  }

  async save(day: TrainingDay): Promise<void> {
    await this.db.trainingDays.put(toTrainingDayRow(day));
  }

  async delete(id: string): Promise<void> {
    await this.db.trainingDays.delete(id);
  }

  async existsExerciseInAnyDay(exerciseId: string): Promise<boolean> {
    const days = await this.db.trainingDays.toArray();
    return days.some(d =>
      (d.exercises as ExerciseInDayRow[] | null ?? []).some(e => e.exerciseId === exerciseId),
    );
  }
}
