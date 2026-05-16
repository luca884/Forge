import { Injectable, inject } from '@angular/core';
import { RoutineRepository } from '../domain/routine.repository';
import { Routine } from '../domain/routine.entity';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { toRoutine, toRoutineRow } from './routine.mapper';

@Injectable()
export class DexieRoutineRepository extends RoutineRepository {
  private readonly db = inject(ForgeDatabaseService);

  async getAll(): Promise<Routine[]> {
    const rows = await this.db.routines.toArray();
    return rows.map(toRoutine);
  }

  async getActive(): Promise<Routine | null> {
    // Boolean indexes in IndexedDB can be unreliable — filter client-side after load
    const rows = await this.db.routines.toArray();
    const activeRow = rows.find(r => r.isActive === true);
    return activeRow ? toRoutine(activeRow) : null;
  }

  async getById(id: string): Promise<Routine | null> {
    const row = await this.db.routines.get(id);
    return row ? toRoutine(row) : null;
  }

  async save(routine: Routine): Promise<void> {
    await this.db.routines.put(toRoutineRow(routine));
  }

  async setActive(id: string): Promise<void> {
    await this.db.transaction('rw', this.db.routines, () => {
      // Dexie transactions require Promise chaining (no async/await loops).
      // Use .modify() to batch update all rows, then update the target.
      return this.db.routines
        .where('id')
        .notEqual(id)
        .modify({ isActive: false })
        .then(() => this.db.routines.update(id, { isActive: true }));
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.routines.delete(id);
  }
}
