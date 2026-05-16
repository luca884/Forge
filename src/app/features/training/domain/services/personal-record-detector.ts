import { Injectable } from '@angular/core';
import { assertNever } from '@core/shared/domain/tracking-type';
import { WorkedSet, WeightRepsSet, BodyweightRepsSet } from '../worked-set';

@Injectable()
export class PersonalRecordDetector {
  isPR(newSet: WorkedSet, history: WorkedSet[]): boolean {
    // Filter history to same type
    const sameTypeHistory = history.filter(h => h.type === newSet.type);

    // First set for this type is always a PR
    if (sameTypeHistory.length === 0) {
      return this.isFirstSetPR(newSet);
    }

    switch (newSet.type) {
      case 'weight-reps':
        return this.checkWeightReps(
          newSet,
          sameTypeHistory as WeightRepsSet[],
        );

      case 'bodyweight-reps':
        return this.checkBodyweightReps(
          newSet,
          sameTypeHistory as BodyweightRepsSet[],
        );

      case 'time':
        // No PR detection for time in slice-1
        return false;

      case 'distance-time':
        // No PR detection for distance-time in slice-1
        return false;

      default:
        return assertNever(newSet);
    }
  }

  private isFirstSetPR(newSet: WorkedSet): boolean {
    switch (newSet.type) {
      case 'weight-reps':
      case 'bodyweight-reps':
        return true;
      case 'time':
      case 'distance-time':
        return false;
      default:
        return assertNever(newSet);
    }
  }

  /**
   * D-22/R4: PR if:
   *   reps > max(history_reps WHERE weight <= newSet.weight)  [more reps at same or lower weight]
   * OR
   *   weight > max(history_weight WHERE reps >= newSet.reps)  [more weight at same or more reps]
   */
  private checkWeightReps(newSet: WeightRepsSet, history: WeightRepsSet[]): boolean {
    const newReps = newSet.reps.value;
    const newWeight = newSet.weight.value;

    // Check: more reps at same or lower weight
    const historyAtSameOrLowerWeight = history.filter(h => h.weight.value <= newWeight);
    if (historyAtSameOrLowerWeight.length > 0) {
      const maxHistoricReps = Math.max(...historyAtSameOrLowerWeight.map(h => h.reps.value));
      if (newReps > maxHistoricReps) return true;
    }

    // Check: more weight at same or more reps
    const historyAtSameOrMoreReps = history.filter(h => h.reps.value >= newReps);
    if (historyAtSameOrMoreReps.length > 0) {
      const maxHistoricWeight = Math.max(...historyAtSameOrMoreReps.map(h => h.weight.value));
      if (newWeight > maxHistoricWeight) return true;
    }

    return false;
  }

  /**
   * D-22/R5: PR if:
   *   reps > max(history_reps WHERE extraWeight <= newSet.extraWeight)  [more reps at same or lower extra weight]
   * OR
   *   extraWeight > max(history_extraWeight WHERE reps >= newSet.reps)  [more extra weight at same or more reps]
   * Note: undefined extraWeight is treated as 0
   */
  private checkBodyweightReps(newSet: BodyweightRepsSet, history: BodyweightRepsSet[]): boolean {
    const newReps = newSet.reps.value;
    const newExtraWeight = newSet.extraWeight?.value ?? 0;

    // Check: more reps at same or lower extra weight
    const historyAtSameOrLowerExtra = history.filter(
      h => (h.extraWeight?.value ?? 0) <= newExtraWeight,
    );
    if (historyAtSameOrLowerExtra.length > 0) {
      const maxHistoricReps = Math.max(...historyAtSameOrLowerExtra.map(h => h.reps.value));
      if (newReps > maxHistoricReps) return true;
    }

    // Check: more extra weight at same or more reps
    const historyAtSameOrMoreReps = history.filter(h => h.reps.value >= newReps);
    if (historyAtSameOrMoreReps.length > 0) {
      const maxHistoricExtra = Math.max(
        ...historyAtSameOrMoreReps.map(h => h.extraWeight?.value ?? 0),
      );
      if (newExtraWeight > maxHistoricExtra) return true;
    }

    return false;
  }
}
