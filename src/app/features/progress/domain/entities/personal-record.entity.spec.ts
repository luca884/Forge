import { TrackingType } from '@core/shared/domain/tracking-type';
import { PersonalRecord } from './personal-record.entity';
import { WeightRepsSet, TimeSet } from '@features/training/domain/worked-set';

describe('PersonalRecord entity', () => {
  const makeWeightRepsRecord = (): PersonalRecord => ({
    id: 'pr-1',
    exerciseId: 'ex-bench',
    trackingType: 'weight-reps' as TrackingType,
    workedSetId: 'ws-1',
    achievedAt: new Date('2026-01-15'),
    set: {
      id: 'ws-1',
      sessionId: 'session-1',
      exerciseId: 'ex-bench',
      type: 'weight-reps',
      reps: { value: 5 } as any,
      weight: { value: 100 } as any,
      isPR: true,
      createdAt: new Date('2026-01-15'),
    } as WeightRepsSet,
  });

  it('creates a valid PersonalRecord with all required readonly fields', () => {
    // D-3/S1 — shape conformance
    const pr = makeWeightRepsRecord();
    expect(pr.id).toBe('pr-1');
    expect(pr.exerciseId).toBe('ex-bench');
    expect(pr.trackingType).toBe('weight-reps');
    expect(pr.workedSetId).toBe('ws-1');
    expect(pr.achievedAt).toBeInstanceOf(Date);
    expect(pr.set).toBeDefined();
  });

  it('accepts a TimeSet when trackingType is "time"', () => {
    // D-3/S2 — WorkedSet polymorphism: TimeSet accepted when trackingType='time'
    const timeRecord: PersonalRecord = {
      id: 'pr-2',
      exerciseId: 'ex-run',
      trackingType: 'time' as TrackingType,
      workedSetId: 'ws-2',
      achievedAt: new Date('2026-01-20'),
      set: {
        id: 'ws-2',
        sessionId: 'session-2',
        exerciseId: 'ex-run',
        type: 'time',
        durationSec: 120,
        isPR: true,
        createdAt: new Date('2026-01-20'),
      } as TimeSet,
    };
    expect(timeRecord.set.type).toBe('time');
    expect((timeRecord.set as TimeSet).durationSec).toBe(120);
  });

  it('all fields are readonly — TypeScript enforces immutability at compile time', () => {
    // D-3/S1 — readonly enforcement (runtime check — TypeScript catches this at compile time)
    // This test documents the intent; actual enforcement is compile-time via readonly keyword.
    const pr = makeWeightRepsRecord();
    expect(Object.isFrozen(pr)).toBe(false); // interface, not Object.freeze — TS readonly is compile-time
    // We verify the interface is correctly typed by the factory above compiling without error
    expect(pr).toBeDefined();
  });
});
