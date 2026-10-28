/**
 * "Best set" rule shared by the exercise history tiles and the records table:
 * the heaviest set wins and, on a tie, the one with more reps. The weight of a
 * bodyweight set is its extra weight (none counts as zero). A set without reps
 * (time, distance-time) ranks below any set that has them.
 *
 * Computed from the sets themselves, never from the PR rows, so the answer
 * matches what the history lists even when a PR row is missing or stale.
 * Pure UI helper — no Angular DI.
 */
import type { BodyweightRepsSet, WeightRepsSet, WorkedSet } from '@features/training/domain/worked-set';

type RepSet = WeightRepsSet | BodyweightRepsSet;

function hasReps(set: WorkedSet): set is RepSet {
  return set.type === 'weight-reps' || set.type === 'bodyweight-reps';
}

/**
 * The weight as logged, in the unit of its exercise (kg or plates). Two sets of the same
 * exercise share that unit, so comparing them raw is valid; no kg conversion is needed here.
 */
function loggedWeight(set: RepSet): number {
  return set.type === 'weight-reps' ? set.weight.value : (set.extraWeight?.value ?? 0);
}

/** Positive when `a` is the better set, negative when `b` is, zero on a perfect tie. */
export function compareBestSet(a: WorkedSet, b: WorkedSet): number {
  if (!hasReps(a)) return hasReps(b) ? -1 : 0;
  if (!hasReps(b)) return 1;
  return loggedWeight(a) - loggedWeight(b) || a.reps.value - b.reps.value;
}

/** The best set of the list, or null when none has reps. */
export function bestSetOf(sets: readonly WorkedSet[]): WorkedSet | null {
  let best: RepSet | null = null;
  for (const set of sets) {
    if (hasReps(set) && (best === null || compareBestSet(set, best) > 0)) best = set;
  }
  return best;
}

/** The highest rep count of any set, whatever its weight, or null when none has reps. */
export function maxRepsOf(sets: readonly WorkedSet[]): number | null {
  let max: number | null = null;
  for (const set of sets) {
    if (hasReps(set) && (max === null || set.reps.value > max)) max = set.reps.value;
  }
  return max;
}
