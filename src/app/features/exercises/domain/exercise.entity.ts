import { TrackingType } from '@core/shared/domain/tracking-type';

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
  readonly isCustom: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
