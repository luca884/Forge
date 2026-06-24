import { TrackingType } from '@core/shared/domain/tracking-type';
import { WeightUnit } from '@core/shared/domain/weight-unit';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'full-body';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'band';

export interface Exercise {
  readonly id: string;
  readonly name: string;
  readonly muscleGroup: MuscleGroup;
  readonly equipment?: Equipment;
  readonly trackingType: TrackingType;
  /**
   * Unit used to log weight for this exercise.
   * 'kg'     → standard kilograms (default, backward-compat).
   * 'plates' → abstract machine-stack plates (integer, no kg conversion).
   * Only meaningful when trackingType === 'weight-reps'.
   */
  readonly weightUnit: WeightUnit;
  readonly isCustom: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
