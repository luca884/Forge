import { Injectable, inject } from '@angular/core';
import { createHealthDay, type HealthDay } from '../health-day.entity';
import { HealthDayRepository } from '../health-day.repository';

@Injectable()
export class SaveHealthDaysUseCase {
  private readonly repo = inject(HealthDayRepository);

  /** Valida todos los días antes de guardar: si uno falla no se guarda ninguno. */
  async execute(days: readonly HealthDay[]): Promise<void> {
    await this.repo.saveMany(days.map(createHealthDay));
  }
}
