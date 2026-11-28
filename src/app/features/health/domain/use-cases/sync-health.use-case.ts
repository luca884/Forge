import { Injectable, inject } from '@angular/core';
import type { HealthDay } from '../health-day.entity';
import { HealthDayRepository } from '../health-day.repository';
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
  private readonly repo = inject(HealthDayRepository);

  /**
   * Lee los últimos `days` días de la fuente y guarda un resumen por día con datos. Cada día se
   * recalcula y reemplaza al anterior, así que repetir la sincronización no duplica nada. Las medidas
   * que no se pudieron leer (permiso revocado) conservan el valor ya guardado en vez de borrarse.
   * Si falla una lectura no se guarda nada de la ventana.
   */
  async execute({ now, days }: SyncHealthInput): Promise<SyncHealthResult> {
    if (!(await this.source.isAvailable())) return { status: 'unavailable' };
    const metrics = await this.source.requestAccess();
    if (metrics.length === 0) return { status: 'denied' };

    const firstId = localDayId(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)));
    const stored = new Map((await this.repo.listRange(firstId, localDayId(now))).map((d) => [d.id, d]));
    const summaries: HealthDay[] = [];
    for (let back = days - 1; back >= 0; back--) {
      const dayId = localDayId(new Date(now.getFullYear(), now.getMonth(), now.getDate() - back));
      const { fromMs, toMs } = dayBounds(dayId);
      const samples: Record<HealthMetric, HealthSample[]> = { steps: [], distance: [], calories: [], heartRate: [], oxygenSaturation: [] };
      for (const metric of metrics) samples[metric] = await this.source.read(metric, fromMs, toMs);
      const summary = summarizeHealthDay(dayId, samples satisfies DaySamples, now.getTime());
      if (summary) summaries.push(keepUnread(summary, stored.get(dayId), metrics));
    }

    if (summaries.length > 0) await this.save.execute(summaries);
    return { status: 'synced', days: summaries.length, metrics };
  }
}

const FIELD_OF = {
  steps: 'steps',
  distance: 'distanceMeters',
  calories: 'caloriesKcal',
  heartRate: 'heartRate',
  oxygenSaturation: 'oxygenSaturation',
} as const satisfies Record<HealthMetric, keyof HealthDay>;

function keepUnread(summary: HealthDay, stored: HealthDay | undefined, read: readonly HealthMetric[]): HealthDay {
  if (!stored) return summary;
  const unread = Object.entries(FIELD_OF).filter(([metric]) => !read.includes(metric as HealthMetric));
  return { ...summary, ...Object.fromEntries(unread.map(([, field]) => [field, stored[field]])) };
}
