import { OneRepMax } from '@core/shared/domain/value-objects/one-rep-max';
import type { WorkedSet } from '@features/training/domain/worked-set';
import type { Exercise } from '@features/exercises/domain/exercise.entity';
import type { TrackingType } from '@core/shared/domain/tracking-type';
import type { DashboardOverview } from '../models/dashboard-overview.model';
import type { WeeklyTrendPoint } from '../models/weekly-trend-point.model';
import { type ExerciseProgressEntry, type ProgressStatus } from '../models/exercise-progress-entry.model';

export const IMPROVING_MIN_PCT = 5;
export const NO_PROGRESS_MAX_PCT = -5;

export function computeVolume(sets: readonly WorkedSet[]): number {
  return sets.reduce((sum, set) => {
    switch (set.type) {
      case 'weight-reps':
        return sum + set.weight.value * set.reps.value;
      case 'bodyweight-reps':
        return sum + (set.extraWeight?.value ?? 0) * set.reps.value;
      case 'time':
      case 'distance-time':
        return sum;
    }
  }, 0);
}

export function countSessions(sets: readonly WorkedSet[]): number {
  return new Set(sets.map(s => s.sessionId)).size;
}

export function deltaPercent(first: number, latest: number): number | null {
  if (first === 0) return null;
  return ((latest - first) / first) * 100;
}

export function signedImprovementPct(
  first: number,
  latest: number,
  direction: 'higher-better' | 'lower-better',
): number | null {
  if (first === 0) return null;
  if (direction === 'higher-better') {
    return ((latest - first) / first) * 100;
  }
  return ((first - latest) / first) * 100;
}

export function classifyProgressStatus(signedImprovementPct: number | null): ProgressStatus {
  if (signedImprovementPct === null) return 'no-progress';
  if (signedImprovementPct > IMPROVING_MIN_PCT) return 'improving';
  if (signedImprovementPct >= NO_PROGRESS_MAX_PCT) return 'stable';
  return 'no-progress';
}

export function computeOverview(
  current: readonly WorkedSet[],
  prior: readonly WorkedSet[],
): DashboardOverview {
  const sessionsCurrent = countSessions(current);
  const sessionsPrior = countSessions(prior);
  const setsCurrent = current.length;
  const setsPrior = prior.length;
  const volumeCurrentKg = computeVolume(current);
  const volumePriorKg = computeVolume(prior);

  return {
    sessionsCurrent,
    sessionsPrior,
    sessionsDeltaPct: deltaPercent(sessionsPrior, sessionsCurrent),
    setsCurrent,
    setsPrior,
    setsDeltaPct: deltaPercent(setsPrior, setsCurrent),
    volumeCurrentKg,
    volumePriorKg,
    volumeDeltaPct: deltaPercent(volumePriorKg, volumeCurrentKg),
  };
}

export function weeklyTrendPoints(sets: readonly WorkedSet[], weeksBack: number): WeeklyTrendPoint[] {
  if (weeksBack <= 0) return [];

  const today = new Date();
  const currentWeekMonday = getMonday(today);

  const points: WeeklyTrendPoint[] = [];
  for (let i = weeksBack - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekMonday);
    weekStart.setDate(currentWeekMonday.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekStartTime = weekStart.getTime();
    const weekEndTime = weekEnd.getTime();

    const weekSets = sets.filter(s => {
      const t = s.createdAt.getTime();
      return t >= weekStartTime && t < weekEndTime;
    });

    points.push({
      weekStart: weekStart.toLocaleDateString('en-CA'),
      volumeKg: computeVolume(weekSets),
      sessions: countSessions(weekSets),
    });
  }

  return points;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sunday, 1 Monday, ...
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function exerciseProgressEntries(
  sets: readonly WorkedSet[],
  exercises: readonly Exercise[],
): ExerciseProgressEntry[] {
  const exerciseMap = new Map(exercises.map(e => [e.id, e]));
  const byExercise = groupBy(sets, s => s.exerciseId);

  const entries: ExerciseProgressEntry[] = [];

  for (const [exerciseId, exerciseSets] of byExercise.entries()) {
    const exercise = exerciseMap.get(exerciseId);
    const trackingType = exerciseSets[0]!.type;
    const workouts = groupByWorkout(exerciseSets);
    if (workouts.length < 2) continue;

    const firstWorkout = workouts[0]!;
    const latestWorkout = workouts[workouts.length - 1]!;

    const firstBest = bestMetric(firstWorkout, trackingType);
    const latestBest = bestMetric(latestWorkout, trackingType);

    const direction = desirableDirection(trackingType);
    const deltaPct = signedImprovementPct(firstBest, latestBest, direction);
    const status = classifyProgressStatus(deltaPct);

    entries.push({
      exerciseId,
      exerciseName: exercise?.name ?? exerciseId,
      trackingType,
      firstValue: firstBest,
      latestValue: latestBest,
      deltaPct,
      status,
      unitLabel: unitLabel(trackingType),
    });
  }

  return entries.sort((a, b) => {
    if (a.deltaPct === null && b.deltaPct === null) return 0;
    if (a.deltaPct === null) return 1;
    if (b.deltaPct === null) return -1;
    return Math.abs(b.deltaPct) - Math.abs(a.deltaPct);
  });
}

function groupByWorkout(sets: readonly WorkedSet[]): WorkedSet[][] {
  const bySession = groupBy(sets, s => s.sessionId);
  return Array.from(bySession.values()).sort((a, b) => {
    const aTime = Math.min(...a.map(s => s.createdAt.getTime()));
    const bTime = Math.min(...b.map(s => s.createdAt.getTime()));
    return aTime - bTime;
  });
}

function bestMetric(workoutSets: readonly WorkedSet[], trackingType: TrackingType): number {
  switch (trackingType) {
    case 'weight-reps': {
      let max = -Infinity;
      for (const set of workoutSets) {
        if (set.type === 'weight-reps') {
          const rm = OneRepMax.epley(set.weight.value, set.reps.value).kg;
          if (rm > max) max = rm;
        }
      }
      return max === -Infinity ? 0 : max;
    }
    case 'bodyweight-reps': {
      let max = -Infinity;
      for (const set of workoutSets) {
        if (set.type === 'bodyweight-reps') {
          const value = set.extraWeight?.value ?? 0;
          if (value > max) max = value;
        }
      }
      return max === -Infinity ? 0 : max;
    }
    case 'time': {
      let max = -Infinity;
      for (const set of workoutSets) {
        if (set.type === 'time') {
          if (set.durationSec > max) max = set.durationSec;
        }
      }
      return max === -Infinity ? 0 : max;
    }
    case 'distance-time': {
      let min = Infinity;
      for (const set of workoutSets) {
        if (set.type === 'distance-time') {
          const pace = set.durationSec / set.distanceKm;
          if (pace < min) min = pace;
        }
      }
      return min === Infinity ? 0 : min;
    }
  }
}

function desirableDirection(trackingType: TrackingType): 'higher-better' | 'lower-better' {
  return trackingType === 'distance-time' ? 'lower-better' : 'higher-better';
}

function unitLabel(trackingType: TrackingType): string {
  switch (trackingType) {
    case 'weight-reps':
    case 'bodyweight-reps':
      return 'kg';
    case 'time':
      return 'sec';
    case 'distance-time':
      return 'sec/km';
  }
}

function groupBy<T, K>(items: readonly T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(item);
  }
  return map;
}
