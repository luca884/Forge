import { TestBed } from '@angular/core/testing';
import { PersonalRecordDetector } from './personal-record-detector';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';
import { WeightRepsSet, BodyweightRepsSet, TimeSet, WorkedSet } from '../worked-set';

// Helper factories
function makeWeightRepsSet(
  repsVal: number,
  weightVal: number,
  overrides: Partial<WeightRepsSet> = {},
): WeightRepsSet {
  return {
    id: 'set-1',
    sessionId: 'session-1',
    exerciseId: 'exercise-1',
    isPR: false,
    createdAt: new Date('2024-01-01'),
    type: 'weight-reps',
    reps: new Reps(repsVal),
    weight: new Weight(weightVal),
    ...overrides,
  };
}

function makeBodyweightSet(
  repsVal: number,
  extraWeightVal?: number,
  overrides: Partial<BodyweightRepsSet> = {},
): BodyweightRepsSet {
  return {
    id: 'set-1',
    sessionId: 'session-1',
    exerciseId: 'exercise-1',
    isPR: false,
    createdAt: new Date('2024-01-01'),
    type: 'bodyweight-reps',
    reps: new Reps(repsVal),
    extraWeight: extraWeightVal !== undefined ? new Weight(extraWeightVal) : undefined,
    ...overrides,
  };
}

function makeTimeSet(durationSec: number): TimeSet {
  return {
    id: 'set-1',
    sessionId: 'session-1',
    exerciseId: 'exercise-1',
    isPR: false,
    createdAt: new Date('2024-01-01'),
    type: 'time',
    durationSec,
  };
}

describe('PersonalRecordDetector', () => {
  let detector: PersonalRecordDetector;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PersonalRecordDetector],
    });
    detector = TestBed.inject(PersonalRecordDetector);
  });

  // V-17: empty history → always PR
  it('should return true for any set when history is empty', () => {
    const set = makeWeightRepsSet(10, 100);
    expect(detector.isPR(set, [])).toBe(true);
  });

  it('should return true for bodyweight set when history is empty', () => {
    const set = makeBodyweightSet(10);
    expect(detector.isPR(set, [])).toBe(true);
  });

  // V-18: time type → false, no throw
  it('should return false for time type without throwing (slice-1 not implemented)', () => {
    const set = makeTimeSet(60);
    expect(() => detector.isPR(set, [])).not.toThrow();
    expect(detector.isPR(set, [])).toBe(false);
  });

  it('should return false for distance-time type without throwing', () => {
    const set: WorkedSet = {
      id: 'set-1',
      sessionId: 'session-1',
      exerciseId: 'exercise-1',
      isPR: false,
      createdAt: new Date(),
      type: 'distance-time',
      distanceKm: 5,
      durationSec: 1800,
    };
    expect(() => detector.isPR(set, [])).not.toThrow();
    expect(detector.isPR(set, [])).toBe(false);
  });

  // weight-reps PR: more reps at same or lower weight
  it('should return true for weight-reps when more reps at same weight (D-22/R4)', () => {
    const history: WorkedSet[] = [makeWeightRepsSet(10, 100)];
    const newSet = makeWeightRepsSet(12, 100);
    expect(detector.isPR(newSet, history)).toBe(true);
  });

  // weight-reps PR: more weight at same or more reps
  it('should return true for weight-reps when more weight with same reps (D-22/R4)', () => {
    const history: WorkedSet[] = [makeWeightRepsSet(10, 100)];
    const newSet = makeWeightRepsSet(10, 105);
    expect(detector.isPR(newSet, history)).toBe(true);
  });

  it('should return true for weight-reps when more weight with fewer reps if still a weight-PR (D-22/S4)', () => {
    // history: 10 reps @ 100kg
    // new: 8 reps @ 105kg
    // Weight PR: 105 > max(weight WHERE reps >= 8) = 100 (8 reps >= 8) → PR
    const history: WorkedSet[] = [makeWeightRepsSet(10, 100)];
    const newSet = makeWeightRepsSet(8, 105);
    expect(detector.isPR(newSet, history)).toBe(true);
  });

  it('should return false for weight-reps when fewer reps at same weight', () => {
    const history: WorkedSet[] = [makeWeightRepsSet(10, 100)];
    const newSet = makeWeightRepsSet(8, 100);
    expect(detector.isPR(newSet, history)).toBe(false);
  });

  it('should return false for weight-reps when same reps and same weight', () => {
    const history: WorkedSet[] = [makeWeightRepsSet(10, 100)];
    const newSet = makeWeightRepsSet(10, 100);
    expect(detector.isPR(newSet, history)).toBe(false);
  });

  it('should filter history to only same type before comparing', () => {
    // Only bodyweight sets in history — weight-reps comparison ignores them → empty → PR
    const history: WorkedSet[] = [makeBodyweightSet(10)];
    const newSet = makeWeightRepsSet(5, 50);
    expect(detector.isPR(newSet, history)).toBe(true);
  });

  // bodyweight-reps: more reps at same or lower extra weight
  it('should return true for bodyweight when more reps without extra weight vs history without extra weight', () => {
    const history: WorkedSet[] = [makeBodyweightSet(10)];
    const newSet = makeBodyweightSet(12);
    expect(detector.isPR(newSet, history)).toBe(true);
  });

  it('should return false for bodyweight when same reps, no extra weight', () => {
    const history: WorkedSet[] = [makeBodyweightSet(10)];
    const newSet = makeBodyweightSet(10);
    expect(detector.isPR(newSet, history)).toBe(false);
  });

  // bodyweight-reps: more extra weight at same or more reps
  it('should return true for bodyweight when more extra weight with same reps', () => {
    const history: WorkedSet[] = [makeBodyweightSet(10, 10)];
    const newSet = makeBodyweightSet(10, 15);
    expect(detector.isPR(newSet, history)).toBe(true);
  });

  // D-22/R5: undefined extraWeight treated as 0
  it('should return true for bodyweight when new has more reps and both have no extra weight (D-22/S5)', () => {
    const history: WorkedSet[] = [makeBodyweightSet(10)]; // extraWeight = undefined → treated as 0
    const newSet = makeBodyweightSet(12); // extraWeight = undefined → treated as 0; 12 > 10 at same extraWeight(0<=0) → PR
    expect(detector.isPR(newSet, history)).toBe(true);
  });

  it('should return false for bodyweight when fewer reps and same extra weight', () => {
    const history: WorkedSet[] = [makeBodyweightSet(10, 10)];
    const newSet = makeBodyweightSet(8, 10);
    expect(detector.isPR(newSet, history)).toBe(false);
  });
});
