import { DomainError } from '@core/shared/domain/errors/domain-error';

export type ActivityType = 'walk' | 'bike' | 'run';

export interface TrackPoint {
  lat: number;
  lon: number;
  ele: number | null;
  time: number | null;
}

export interface ActivityStats {
  distanceMeters: number;
  elapsedSeconds: number | null;
  movingSeconds: number | null;
  avgSpeedKmh: number | null;
  elevationGainMeters: number | null;
}

export interface Activity {
  readonly id: string;
  readonly name: string;
  readonly type: ActivityType;
  readonly startedAt: number | null;
  readonly points: TrackPoint[];
  readonly stats: ActivityStats;
  readonly importedAt: number;
}

export class InvalidActivityInputError extends DomainError {
  constructor(reason: string) {
    super(`Actividad no válida: ${reason}`, 'InvalidActivityInputError');
  }
}

export function createActivity(input: Activity): Activity {
  if (input.name.trim() === '') {
    throw new InvalidActivityInputError('el nombre no puede estar vacío');
  }
  if (input.points.length < 2) {
    throw new InvalidActivityInputError('se necesitan al menos dos puntos');
  }
  for (const { lat, lon } of input.points) {
    if (!(lat >= -90 && lat <= 90)) {
      throw new InvalidActivityInputError('la latitud debe estar entre -90 y 90');
    }
    if (!(lon >= -180 && lon <= 180)) {
      throw new InvalidActivityInputError('la longitud debe estar entre -180 y 180');
    }
  }
  return input;
}
