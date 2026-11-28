import { DomainError } from '@core/shared/domain/errors/domain-error';

/** Resumen de las muestras de un día: promedio, extremos y cuántas muestras lo respaldan. */
export interface HealthRange {
  avg: number;
  min: number;
  max: number;
  samples: number;
}

/**
 * Un día de datos de salud. `id` es el día local (AAAA-MM-DD). Cada medida es null cuando ese día
 * no hay datos de la fuente; las muestras sueltas no se guardan, solo su resumen.
 */
export interface HealthDay {
  readonly id: string;
  readonly steps: number | null;
  readonly distanceMeters: number | null;
  readonly caloriesKcal: number | null;
  readonly heartRate: HealthRange | null;
  readonly oxygenSaturation: HealthRange | null;
  /** Milisegundos desde epoch en que se calculó este resumen. */
  readonly syncedAt: number;
}

export class InvalidHealthDayInputError extends DomainError {
  constructor(reason: string) {
    super(`Día de salud no válido: ${reason}`, 'InvalidHealthDayInputError');
  }
}

const DAY_ID = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDayId(value: string): boolean {
  const match = DAY_ID.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isNonNegative(value: number | null): boolean {
  return value === null || (Number.isFinite(value) && value >= 0);
}

function checkRange(range: HealthRange | null, label: string, limit?: number): void {
  if (range === null) return;
  if (!Number.isInteger(range.samples) || range.samples < 1) {
    throw new InvalidHealthDayInputError(`${label} necesita al menos una muestra`);
  }
  const values = [range.avg, range.min, range.max];
  if (limit !== undefined && !values.every((v) => v >= 0 && v <= limit)) {
    throw new InvalidHealthDayInputError(`${label} debe estar entre 0 y ${limit}`);
  }
  if (!values.every(Number.isFinite) || !(range.min <= range.avg && range.avg <= range.max)) {
    throw new InvalidHealthDayInputError(`${label} debe cumplir mínimo ≤ promedio ≤ máximo`);
  }
}

export function createHealthDay(input: HealthDay): HealthDay {
  if (!isDayId(input.id)) {
    throw new InvalidHealthDayInputError('el id debe ser un día AAAA-MM-DD');
  }
  if (input.steps !== null && !(Number.isInteger(input.steps) && input.steps >= 0)) {
    throw new InvalidHealthDayInputError('los pasos deben ser un entero mayor o igual a 0');
  }
  if (!isNonNegative(input.distanceMeters)) {
    throw new InvalidHealthDayInputError('la distancia debe ser un número mayor o igual a 0');
  }
  if (!isNonNegative(input.caloriesKcal)) {
    throw new InvalidHealthDayInputError('las calorías deben ser un número mayor o igual a 0');
  }
  checkRange(input.heartRate, 'la frecuencia cardíaca');
  checkRange(input.oxygenSaturation, 'la saturación de oxígeno', 100);
  return input;
}
