import { applySetEdit, SetEditValues } from './set-edit.mapper';
import { WorkedSet, WeightRepsSet, BodyweightRepsSet, TimeSet, DistanceTimeSet } from '../../domain/worked-set';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';

const base = {
  id: 'ws-1',
  sessionId: 's-1',
  exerciseId: 'ex-1',
  targetSetIndex: 2,
  note: 'pesado',
  isPR: true,
  createdAt: new Date('2026-01-01'),
};

function weightReps(): WeightRepsSet {
  return { ...base, type: 'weight-reps', reps: new Reps(8), weight: new Weight(80) };
}
function bodyweight(): BodyweightRepsSet {
  return { ...base, type: 'bodyweight-reps', reps: new Reps(10), extraWeight: new Weight(5) };
}
function time(): TimeSet {
  return { ...base, type: 'time', durationSec: 30 };
}
function distanceTime(): DistanceTimeSet {
  return { ...base, type: 'distance-time', distanceKm: 2, durationSec: 600 };
}

describe('applySetEdit', () => {
  it('weight-reps: actualiza reps y weight con los nuevos valores', () => {
    const values: SetEditValues = { reps: 12, weightKg: 100 };
    const result = applySetEdit(weightReps(), values) as WeightRepsSet;

    expect(result.type).toBe('weight-reps');
    expect(result.reps.value).toBe(12);
    expect(result.weight.value).toBe(100);
  });

  it('bodyweight-reps: actualiza reps y extraWeight', () => {
    const values: SetEditValues = { reps: 15, extraWeightKg: 10 };
    const result = applySetEdit(bodyweight(), values) as BodyweightRepsSet;

    expect(result.reps.value).toBe(15);
    expect(result.extraWeight?.value).toBe(10);
  });

  it('bodyweight-reps: extraWeightKg null/0 → extraWeight undefined', () => {
    const a = applySetEdit(bodyweight(), { reps: 15, extraWeightKg: null }) as BodyweightRepsSet;
    const b = applySetEdit(bodyweight(), { reps: 15, extraWeightKg: 0 }) as BodyweightRepsSet;

    expect(a.extraWeight).toBeUndefined();
    expect(b.extraWeight).toBeUndefined();
  });

  it('time: actualiza durationSec', () => {
    const result = applySetEdit(time(), { durationSec: 45 }) as TimeSet;
    expect(result.durationSec).toBe(45);
  });

  it('distance-time: actualiza distanceKm y durationSec', () => {
    const result = applySetEdit(distanceTime(), { distanceKm: 5, durationSec: 1200 }) as DistanceTimeSet;
    expect(result.distanceKm).toBe(5);
    expect(result.durationSec).toBe(1200);
  });

  it('preserva los campos base del set original (id, createdAt, note, targetSetIndex, sessionId, exerciseId)', () => {
    const original = weightReps();
    const result = applySetEdit(original, { reps: 12, weightKg: 100 });

    expect(result.id).toBe(original.id);
    expect(result.sessionId).toBe(original.sessionId);
    expect(result.exerciseId).toBe(original.exerciseId);
    expect(result.targetSetIndex).toBe(original.targetSetIndex);
    expect(result.note).toBe(original.note);
    expect(result.createdAt).toBe(original.createdAt);
    // isPR se conserva tal cual — el EditWorkedSetUseCase lo recalcula después.
    expect(result.isPR).toBe(original.isPR);
  });

  it('no muta el set original (devuelve una copia nueva)', () => {
    const original = weightReps();
    const result = applySetEdit(original, { reps: 12, weightKg: 100 });

    expect(result).not.toBe(original);
    expect(original.reps.value).toBe(8);
    expect(original.weight.value).toBe(80);
  });
});
