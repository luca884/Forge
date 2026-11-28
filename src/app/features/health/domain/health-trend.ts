import type { HealthDay, HealthRange } from './health-day.entity';

export interface HealthTrendPoint {
  id: string;
  steps: number | null;
  distanceMeters: number | null;
  caloriesKcal: number | null;
  heartRateAvg: number | null;
  oxygenSaturationAvg: number | null;
}

export interface HealthTrendSummary {
  /** Días de la ventana con al menos un valor. */
  daysWithData: number;
  /** Promedio de pasos sobre los días que tienen pasos. */
  stepsAvg: number | null;
  /** Promedios ponderados por la cantidad de muestras de cada día. */
  heartRateAvg: number | null;
  oxygenSaturationAvg: number | null;
}

export interface HealthTrend {
  /** Un punto por día de la ventana, del más viejo al más nuevo. */
  points: HealthTrendPoint[];
  summary: HealthTrendSummary;
}

/** Suma días a un día local AAAA-MM-DD; calcula en UTC, así que el horario de verano no influye. */
export function addDays(dayId: string, delta: number): string {
  const [year, month, day] = dayId.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day + delta)).toISOString().slice(0, 10);
}

export function buildHealthTrend(days: readonly HealthDay[], endId: string, length: number): HealthTrend {
  const byId = new Map(days.map((day) => [day.id, day]));
  const points = Array.from({ length }, (_, i): HealthTrendPoint => {
    const id = addDays(endId, i - (length - 1));
    const day = byId.get(id);
    return {
      id,
      steps: day?.steps ?? null,
      distanceMeters: day?.distanceMeters ?? null,
      caloriesKcal: day?.caloriesKcal ?? null,
      heartRateAvg: day?.heartRate?.avg ?? null,
      oxygenSaturationAvg: day?.oxygenSaturation?.avg ?? null,
    };
  });
  const inWindow = points.flatMap((p) => byId.get(p.id) ?? []);
  const withSteps = inWindow.flatMap((d) => d.steps ?? []);

  return {
    points,
    summary: {
      daysWithData: inWindow.filter(hasAnyValue).length,
      stepsAvg: withSteps.length ? withSteps.reduce((a, b) => a + b, 0) / withSteps.length : null,
      heartRateAvg: weightedAvg(inWindow.map((d) => d.heartRate)),
      oxygenSaturationAvg: weightedAvg(inWindow.map((d) => d.oxygenSaturation)),
    },
  };
}

function hasAnyValue(day: HealthDay): boolean {
  return [day.steps, day.distanceMeters, day.caloriesKcal, day.heartRate, day.oxygenSaturation].some((v) => v !== null);
}

function weightedAvg(ranges: readonly (HealthRange | null)[]): number | null {
  const present = ranges.flatMap((r) => r ?? []);
  const samples = present.reduce((sum, r) => sum + r.samples, 0);
  return samples ? present.reduce((sum, r) => sum + r.avg * r.samples, 0) / samples : null;
}
