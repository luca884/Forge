/**
 * Pure display helpers — map exercise enums to Spanish labels for the UI.
 * No Angular DI, no side effects. (muscleGroupLabel lives in progress/ui/helpers.)
 */
import type { Equipment } from '../../domain/exercise.entity';
import type { TrackingType } from '@core/shared/domain/tracking-type';

const TRACKING_TYPE_LABELS: Record<TrackingType, string> = {
  'weight-reps': 'Peso y repeticiones',
  'bodyweight-reps': 'Peso corporal y repeticiones',
  time: 'Tiempo',
  'distance-time': 'Distancia y tiempo',
};

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barra',
  dumbbell: 'Mancuernas',
  machine: 'Máquina',
  cable: 'Polea',
  bodyweight: 'Peso corporal',
  kettlebell: 'Kettlebell',
  band: 'Banda',
};

export function trackingTypeLabel(type: TrackingType): string {
  return TRACKING_TYPE_LABELS[type] ?? (type as string);
}

export function equipmentLabel(equipment: Equipment): string {
  return EQUIPMENT_LABELS[equipment] ?? (equipment as string);
}
