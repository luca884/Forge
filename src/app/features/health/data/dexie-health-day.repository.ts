import { Injectable, inject } from '@angular/core';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import type { HealthDay } from '../domain/health-day.entity';
import { HealthDayRepository } from '../domain/health-day.repository';

@Injectable()
export class DexieHealthDayRepository extends HealthDayRepository {
  private readonly db = inject(ForgeDatabaseService);

  // La fila tiene la misma forma que la entidad: solo números, texto y objetos simples.
  async saveMany(days: readonly HealthDay[]): Promise<void> {
    await this.db.healthDaily.bulkPut([...days]);
  }

  listRange(fromId: string, toId: string): Promise<HealthDay[]> {
    return this.db.healthDaily.where('id').between(fromId, toId, true, true).toArray();
  }
}
