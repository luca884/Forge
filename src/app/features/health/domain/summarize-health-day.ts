import type { HealthDay, HealthRange } from './health-day.entity';
import type { HealthMetric, HealthSample } from './health-source';
import { dayBounds } from './local-day';

/**
 * Pasos, distancia y calorías llegan de tres orígenes en Health Connect (Samsung Health, GloryFit y
 * el sensor del teléfono); sumarlos triplica los totales, así que solo cuenta el reloj (D1).
 */
export const GLORYFIT_SOURCE_ID = 'com.yc.gloryfit';

export type DaySamples = Readonly<Record<HealthMetric, readonly HealthSample[]>>;

/** Resumen de un día local, o null si no hay ninguna muestra utilizable. */
export function summarizeHealthDay(dayId: string, samples: DaySamples, syncedAt: number): HealthDay | null {
  const { fromMs, toMs } = dayBounds(dayId);
  // Una muestra pertenece al día en que empieza; Health Connect puede devolver la misma en dos días.
  const usable = (list: readonly HealthSample[]) =>
    list.filter((s) => s.startMs >= fromMs && s.startMs < toMs && Number.isFinite(s.value) && s.value >= 0);
  const fromWatch = (list: readonly HealthSample[]) => usable(list).filter((s) => s.sourceId === GLORYFIT_SOURCE_ID);

  const day: HealthDay = {
    id: dayId,
    steps: total(fromWatch(samples.steps)),
    distanceMeters: total(fromWatch(samples.distance)),
    caloriesKcal: total(fromWatch(samples.calories)),
    heartRate: range(usable(samples.heartRate)),
    oxygenSaturation: range(usable(samples.oxygenSaturation)),
    syncedAt,
  };
  const empty = day.steps === null && day.distanceMeters === null && day.caloriesKcal === null && day.heartRate === null && day.oxygenSaturation === null;
  return empty ? null : day;
}

function total(list: readonly HealthSample[]): number | null {
  return list.length ? list.reduce((sum, s) => sum + s.value, 0) : null;
}

function range(list: readonly HealthSample[]): HealthRange | null {
  if (!list.length) return null;
  const values = list.map((s) => s.value);
  return {
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    samples: values.length,
  };
}
