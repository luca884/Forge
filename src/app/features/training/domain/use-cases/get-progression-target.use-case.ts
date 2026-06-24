import { Injectable, inject } from '@angular/core';
import { TrackingType } from '@core/shared/domain/tracking-type';
import { WeightUnit } from '@core/shared/domain/weight-unit';
import { SessionRepository } from '../session.repository';
import {
  ProgressionTargetCalculator,
  ProgressionTarget,
} from '../services/progression-target-calculator';

@Injectable()
export class GetProgressionTargetUseCase {
  private readonly sessionRepo = inject(SessionRepository);
  private readonly calculator = inject(ProgressionTargetCalculator);

  /**
   * Returns the double-progression target for the next set, or null if this is
   * the first time the exercise is performed (no previous session data).
   *
   * @param exerciseId      The exercise being logged.
   * @param activeSessionId The currently active session (its sets are excluded from history).
   * @param targetReps      Rep goal from the routine plan (used for weight-reps decision).
   * @param trackingType    The exercise's tracking type.
   * @param weightUnit      Exercise weight unit (Slice B). 'plates' forces an integer
   *                        increment of 1 (one plate); 'kg' keeps the kg increment.
   * @param increment       Weight increment in kg for 'kg' exercises (default 2.5).
   *                        Ignored when weightUnit === 'plates'.
   */
  async execute(
    exerciseId: string,
    activeSessionId: string,
    targetReps: number,
    trackingType: TrackingType,
    weightUnit: WeightUnit = 'kg',
    increment = 2.5,
  ): Promise<ProgressionTarget | null> {
    const allSets = await this.sessionRepo.getAllWorkedSetsForExercise(exerciseId);
    const bestPrev = this.calculator.selectBestPreviousSet(allSets, activeSessionId);
    // Slice B: plates progress by +1 (one plate), not by the kg increment.
    const resolvedIncrement = weightUnit === 'plates' ? 1 : increment;
    return this.calculator.calculateTarget(bestPrev, targetReps, trackingType, resolvedIncrement);
  }
}
