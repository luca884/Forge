import { ExerciseProgressEntry, ProgressStatus } from './exercise-progress-entry.model';

describe('ExerciseProgressEntry model', () => {
  it('accepts a populated entry with all progress statuses', () => {
    const improving: ExerciseProgressEntry = {
      exerciseId: 'ex-1',
      exerciseName: 'Bench Press',
      trackingType: 'weight-reps',
      firstValue: 80,
      latestValue: 92,
      deltaPct: 15,
      status: 'improving',
      unitLabel: 'kg',
    };
    const stable: ExerciseProgressEntry = {
      ...improving,
      deltaPct: 3,
      status: 'stable',
    };
    const noProgress: ExerciseProgressEntry = {
      ...improving,
      deltaPct: -8,
      status: 'no-progress',
    };
    expect(improving.status).toBe<ProgressStatus>('improving');
    expect(stable.status).toBe<ProgressStatus>('stable');
    expect(noProgress.status).toBe<ProgressStatus>('no-progress');
  });

  it('allows null delta when fewer than 2 records exist', () => {
    const entry: ExerciseProgressEntry = {
      exerciseId: 'ex-2',
      exerciseName: 'Deadlift',
      trackingType: 'weight-reps',
      firstValue: 0,
      latestValue: 0,
      deltaPct: null,
      status: 'no-progress',
      unitLabel: 'kg',
    };
    expect(entry.deltaPct).toBeNull();
  });
});
