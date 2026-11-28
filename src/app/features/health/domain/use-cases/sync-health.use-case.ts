import { Injectable, inject } from '@angular/core';
import type { HealthDay } from '../health-day.entity';
import { HealthSource, type HealthMetric, type HealthSample } from '../health-source';
import { dayBounds, localDayId } from '../local-day';
import { summarizeHealthDay, type DaySamples } from '../summarize-health-day';
import { SaveHealthDaysUseCase } from './save-health-days.use-case';

export type SyncHealthResult =
  | { status: 'unavailable' }
  | { status: 'denied' }
  | { status: 'synced'; days: number; metrics: HealthMetric[] };

export interface SyncHealthInput {
  now: Date;
  /** Cuántos días locales leer, contando hoy. */
  days: number;
}

@Injectable()
export class SyncHealthUseCase {
  private readonly source = inject(HealthSource);
  private readonly save = inject(SaveHealthDaysUseCase);

  /**
   * Lee los últimos `days` días de la fuente y guarda un resumen por día con datos. Cada día se
   * recalcula entero y reemplaza al anterior, así que repetir la sincronización no duplica nada.
   * Si falla una lectura no se guarda nada de la ventana.
   */
  async execute({ now, days }: SyncHealthInput): Promise<SyncHealthResult> {
    if (!(await this.source.isAvailable())) return { status: 'unavailable' };
    const metrics = await this.source.requestAccess();
    if (metrics.length === 0) return { status: 'denied' };

    const summaries: HealthDay[] = [];
    for (let back = days - 1; back >= 0; back--) {
      const dayId = localDayId(new Date(now.getFullYear(), now.getMonth(), now.getDate() - back));
      const { fromMs, toMs } = dayBounds(dayId);
      const samples: Record<HealthMetric, HealthSample[]> = { steps: [], distance: [], calories: [], heartRate: [], oxygenSaturation: [] };
      for (const metric of metrics) samples[metric] = await this.source.read(metric, fromMs, toMs);
      const summary = summarizeHealthDay(dayId, samples satisfies DaySamples, now.getTime());
      if (summary) summaries.push(summary);
    }

    if (summaries.length > 0) await this.save.execute(summaries);
    return { status: 'synced', days: summaries.length, metrics };
  }
}
