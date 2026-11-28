import type { HealthDay } from './health-day.entity';

export abstract class HealthDayRepository {
  /** Guarda los días en una sola transacción; un día que ya existe se reemplaza entero. */
  abstract saveMany(days: readonly HealthDay[]): Promise<void>;
  /** Días entre `fromId` y `toId`, ambos incluidos, del más viejo al más nuevo. */
  abstract listRange(fromId: string, toId: string): Promise<HealthDay[]>;
}
