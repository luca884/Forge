import { Injectable, inject } from '@angular/core';
import { HealthDayRepository } from '../health-day.repository';
import { addDays, buildHealthTrend, type HealthTrend } from '../health-trend';

@Injectable()
export class GetHealthTrendUseCase {
  private readonly repo = inject(HealthDayRepository);

  /** Tendencia de los últimos `length` días hasta `endId` (día local AAAA-MM-DD, incluido). */
  async execute(endId: string, length: number): Promise<HealthTrend> {
    const days = await this.repo.listRange(addDays(endId, -(length - 1)), endId);
    return buildHealthTrend(days, endId, length);
  }
}
