import { Injectable } from '@angular/core';
import { TrackingType } from '@core/shared/domain/tracking-type';
import { WeightUnit } from '@core/shared/domain/weight-unit';
import { WorkedSet, WeightRepsSet, BodyweightRepsSet } from '../worked-set';

export interface ProgressionTarget {
  readonly weightKg?: number;
  readonly extraWeightKg?: number;
  readonly reps: number;
  readonly previousBest: {
    readonly weightKg?: number;
    readonly extraWeightKg?: number;
    readonly reps: number;
  };
}

@Injectable()
export class ProgressionTargetCalculator {
  /**
   * Selects the single "best" set from the most recent session that is NOT the active session.
   *
   * "Most recent session" = the session whose sets have the greatest createdAt.
   * "Best set" from that session:
   *   - weight-reps: highest weight; break tie by most reps.
   *   - bodyweight-reps: highest extraWeight (undefined = 0); break tie by most reps.
   *   - time / distance-time: first set found (no meaningful ordering).
   *
   * Returns null when no previous sessions exist.
   */
  selectBestPreviousSet(allSets: WorkedSet[], activeSessionId: string): WorkedSet | null {
    const previousSets = allSets.filter(s => s.sessionId !== activeSessionId);
    if (previousSets.length === 0) return null;

    // Find the most recent session id by max createdAt among previous sets.
    const mostRecentSet = previousSets.reduce((best, s) =>
      s.createdAt > best.createdAt ? s : best,
    );
    const mostRecentSessionId = mostRecentSet.sessionId;

    const setsInMostRecentSession = previousSets.filter(
      s => s.sessionId === mostRecentSessionId,
    );

    // Pick best set from that session based on type.
    const first = setsInMostRecentSession[0];
    if (!first) return null;
    if (first.type === 'weight-reps') {
      return this.bestWeightRepsSet(setsInMostRecentSession as WeightRepsSet[]);
    }
    if (first.type === 'bodyweight-reps') {
      return this.bestBodyweightSet(setsInMostRecentSession as BodyweightRepsSet[]);
    }
    // time / distance-time — no ordering, return first
    return first;
  }

  /**
   * Calculates the progression target for the next session.
   *
   * @param previousBestSet The best set from the most recent previous session. Null → return null.
   * @param targetReps      The plan's target rep count (used for weight-reps decisions).
   * @param trackingType    The exercise's tracking type.
   * @param increment       Weight increment for weight-reps (default 2.5 kg).
   */
  calculateTarget(
    previousBestSet: WorkedSet | null,
    targetReps: number,
    trackingType: TrackingType,
    increment = 2.5,
  ): ProgressionTarget | null {
    if (previousBestSet === null) return null;

    switch (trackingType) {
      case 'weight-reps': {
        const prev = previousBestSet as WeightRepsSet;
        const prevReps = prev.reps.value;
        const prevWeight = prev.weight.value;
        if (prevReps >= targetReps) {
          return {
            weightKg: prevWeight + increment,
            reps: targetReps,
            previousBest: { weightKg: prevWeight, reps: prevReps },
          };
        } else {
          return {
            weightKg: prevWeight,
            reps: prevReps + 1,
            previousBest: { weightKg: prevWeight, reps: prevReps },
          };
        }
      }

      case 'bodyweight-reps': {
        const prev = previousBestSet as BodyweightRepsSet;
        const prevReps = prev.reps.value;
        const prevExtra = prev.extraWeight?.value;
        return {
          reps: prevReps + 1,
          extraWeightKg: prevExtra,
          previousBest: { reps: prevReps, extraWeightKg: prevExtra },
        };
      }

      case 'time':
      case 'distance-time':
        return null;
    }
  }

  /**
   * Formats the goal part of the objective string.
   * - kg weight-reps:     "82.5kg × 8"
   * - plates weight-reps: "placa 6 × 12"  (Slice B — integer plate number, no kg)
   * - bodyweight:         "11 reps (+20kg lastre)" / "11 reps"
   */
  formatTarget(target: ProgressionTarget, weightUnit: WeightUnit = 'kg'): string {
    if (target.weightKg !== undefined) {
      if (weightUnit === 'plates') {
        return `placa ${this.fmt(target.weightKg)} × ${target.reps}`;
      }
      return `${this.fmt(target.weightKg)}kg × ${target.reps}`;
    }
    if (target.extraWeightKg !== undefined) {
      return `${target.reps} reps (+${this.fmt(target.extraWeightKg)}kg lastre)`;
    }
    return `${target.reps} reps`;
  }

  /**
   * Returns true when a freshly logged set meets or exceeds the progression target.
   *
   * - target null → false.
   * - weight-reps: weight >= target.weightKg AND reps >= target.reps.
   * - bodyweight-reps: extraWeight (undefined = 0) >= target.extraWeightKg (undefined = 0)
   *   AND reps >= target.reps.
   * - time / distance-time: false (no target exists for these types).
   * - Set type incompatible with the target shape → false (defensive guard).
   *
   * Target type is inferred from the target shape: a weight-reps target always has
   * weightKg defined (calculateTarget guarantees it); a bodyweight target never does.
   */
  meetsTarget(loggedSet: WorkedSet, target: ProgressionTarget | null): boolean {
    if (target === null) return false;

    const targetIsWeightReps = target.weightKg !== undefined;

    switch (loggedSet.type) {
      case 'weight-reps': {
        if (!targetIsWeightReps) return false; // set/target type mismatch
        return (
          loggedSet.weight.value >= target.weightKg! &&
          loggedSet.reps.value >= target.reps
        );
      }
      case 'bodyweight-reps': {
        if (targetIsWeightReps) return false; // set/target type mismatch
        const setExtra = loggedSet.extraWeight?.value ?? 0;
        const targetExtra = target.extraWeightKg ?? 0;
        return setExtra >= targetExtra && loggedSet.reps.value >= target.reps;
      }
      case 'time':
      case 'distance-time':
        return false;
    }
  }

  /**
   * Formats the "previous best" reference.
   * - kg weight-reps:     "80kg × 8"
   * - plates weight-reps: "placa 5 × 12"  (Slice B)
   * - bodyweight:         "10 reps (+20kg lastre)" / "10 reps"
   */
  formatPreviousBest(
    prev: ProgressionTarget['previousBest'],
    weightUnit: WeightUnit = 'kg',
  ): string {
    if (prev.weightKg !== undefined) {
      if (weightUnit === 'plates') {
        return `placa ${this.fmt(prev.weightKg)} × ${prev.reps}`;
      }
      return `${this.fmt(prev.weightKg)}kg × ${prev.reps}`;
    }
    if (prev.extraWeightKg !== undefined) {
      return `${prev.reps} reps (+${this.fmt(prev.extraWeightKg)}kg lastre)`;
    }
    return `${prev.reps} reps`;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private bestWeightRepsSet(sets: WeightRepsSet[]): WeightRepsSet {
    return sets.reduce((best, s) => {
      const bw = best.weight.value;
      const sw = s.weight.value;
      if (sw > bw) return s;
      if (sw === bw && s.reps.value > best.reps.value) return s;
      return best;
    });
  }

  private bestBodyweightSet(sets: BodyweightRepsSet[]): BodyweightRepsSet {
    return sets.reduce((best, s) => {
      const bExtra = best.extraWeight?.value ?? 0;
      const sExtra = s.extraWeight?.value ?? 0;
      if (sExtra > bExtra) return s;
      if (sExtra === bExtra && s.reps.value > best.reps.value) return s;
      return best;
    });
  }

  /** Format number — suppress trailing .0 (80 not 80.0), keep meaningful decimals (82.5). */
  private fmt(n: number): string {
    return n % 1 === 0 ? String(n) : String(n);
  }
}
