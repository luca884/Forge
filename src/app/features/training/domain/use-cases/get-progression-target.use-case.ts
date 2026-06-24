import { Injectable, inject } from '@angular/core';
import { TrackingType } from '@core/shared/domain/tracking-type';
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
   * @param increment       Weight increment in kg (default 2.5).
   */
  async execute(
    exerciseId: string,
    activeSessionId: string,
    targetReps: number,
    trackingType: TrackingType,
    increment = 2.5,
  ): Promise<ProgressionTarget | null> {
    const allSets = await this.sessionRepo.getAllWorkedSetsForExercise(exerciseId);
    const bestPrev = this.calculator.selectBestPreviousSet(allSets, activeSessionId);
    return this.calculator.calculateTarget(bestPrev, targetReps, trackingType, increment);
  }
}
