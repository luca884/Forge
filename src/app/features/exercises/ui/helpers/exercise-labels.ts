/**
 * Pure display helpers — map exercise enums to Spanish labels for the UI.
 * No Angular DI, no side effects. (muscleGroupLabel lives in progress/ui/helpers.)
 */
import type { Equipment, Exercise } from '../../domain/exercise.entity';
import { muscleGroupLabel } from '@features/progress/ui/helpers/muscle-group-label';
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

/**
 * Meta line of a library row: "Piernas · Barra", plus "placas" when the exercise
 * is logged in machine plates (the only weight unit that is a property of the
 * exercise; kg/lb weights are shown through DisplayWeightPipe elsewhere).
 */
export function exerciseMeta(exercise: Exercise): string {
  const parts: string[] = [muscleGroupLabel(exercise.muscleGroup)];
  if (exercise.equipment) parts.push(equipmentLabel(exercise.equipment));
  if (exercise.trackingType === 'weight-reps' && exercise.weightUnit === 'plates') {
    parts.push('placas');
  }
  return parts.join(' · ');
}
