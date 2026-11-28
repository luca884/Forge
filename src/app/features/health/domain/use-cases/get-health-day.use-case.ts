import { Injectable, inject } from '@angular/core';
import type { HealthDay } from '../health-day.entity';
import { HealthDayRepository } from '../health-day.repository';

@Injectable()
export class GetHealthDayUseCase {
  private readonly repo = inject(HealthDayRepository);

  /** El resumen del día local `dayId` (AAAA-MM-DD), o null si todavía no hay datos de ese día. */
  async execute(dayId: string): Promise<HealthDay | null> {
    const [day] = await this.repo.listRange(dayId, dayId);
    return day ?? null;
  }
}
