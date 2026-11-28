/** Medidas que Forge sabe leer de la fuente de salud. */
export const HEALTH_METRICS = ['steps', 'distance', 'calories', 'heartRate', 'oxygenSaturation'] as const;
export type HealthMetric = (typeof HEALTH_METRICS)[number];

/** Una muestra ya normalizada: `value` en pasos, metros, kcal, lpm o % según la medida. */
export interface HealthSample {
  /** Inicio de la muestra, en milisegundos desde epoch. */
  startMs: number;
  value: number;
  /** Aplicación que escribió la muestra en la fuente, si la fuente la informa. */
  sourceId: string | null;
}

/**
 * Puerto hacia el almacén de salud del teléfono (Health Connect). Solo existe en la app nativa;
 * en la web `isAvailable()` responde false y no se lee nada.
 */
export abstract class HealthSource {
  abstract isAvailable(): Promise<boolean>;
  /** Pide permiso de lectura y devuelve las medidas que el usuario concedió. */
  abstract requestAccess(): Promise<HealthMetric[]>;
  /** Muestras con inicio entre `fromMs` (incluido) y `toMs` (excluido). */
  abstract read(metric: HealthMetric, fromMs: number, toMs: number): Promise<HealthSample[]>;
}
