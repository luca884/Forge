import { TrackingType } from '@core/shared/domain/tracking-type';

export type ProgressStatus = 'improving' | 'stable' | 'no-progress';

export interface ExerciseProgressEntry {
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly trackingType: TrackingType;
  /**
   * Best-of-workout scalar at the first workout (units depend on trackingType).
   * weight-reps: Epley 1RM in kg over the load, so plates exercises count plates × plate weight (S11).
   */
  readonly firstValue: number;
  /** Best-of-workout scalar at the latest workout. */
  readonly latestValue: number;
  /** Signed % change in the desirable direction; + = improvement, − = regression. */
  readonly deltaPct: number | null;
  readonly status: ProgressStatus;
  /** 'kg' | 'sec' | 'sec/km' — display hint for the component. */
  readonly unitLabel: string;
}
