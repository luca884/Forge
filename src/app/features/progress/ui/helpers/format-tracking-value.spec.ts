/**
 * format-tracking-value.spec.ts (D-6).
 * TDD strict — RED before implementation.
 * Tests unit-aware formatting via optional second parameter.
 */
import { formatTrackingValue } from './format-tracking-value';
import type { WorkedSet } from '@features/training/domain/worked-set';

const weightRepsSet: WorkedSet = {
  id: 'ws-1',
  sessionId: 's-1',
  exerciseId: 'ex-1',
  type: 'weight-reps',
  reps: { value: 5 } as any,
  weight: { value: 100 } as any,
  isPR: false,
  createdAt: new Date('2026-01-01'),
};

const bodyweightSetWithExtra: WorkedSet = {
  id: 'ws-2',
  sessionId: 's-1',
  exerciseId: 'ex-1',
  type: 'bodyweight-reps',
  reps: { value: 5 } as any,
  extraWeight: { value: 10 } as any,
  isPR: false,
  createdAt: new Date('2026-01-01'),
};

const bodyweightSetNoExtra: WorkedSet = {
  id: 'ws-3',
  sessionId: 's-1',
  exerciseId: 'ex-1',
  type: 'bodyweight-reps',
  reps: { value: 8 } as any,
  isPR: false,
  createdAt: new Date('2026-01-01'),
};

describe('formatTrackingValue', () => {
  // Backward-compatibility tests (no second arg)
  it('weight-reps without unit arg returns kg suffix', () => {
    expect(formatTrackingValue(weightRepsSet)).toBe('100 kg × 5 reps');
  });

  it('bodyweight-reps without extra and without unit arg returns reps only', () => {
    expect(formatTrackingValue(bodyweightSetNoExtra)).toBe('8 reps');
  });

  // Unit-aware tests (lb)
  it('weight-reps with unit="lb" converts weight and returns lb suffix', () => {
    expect(formatTrackingValue(weightRepsSet, 'lb')).toBe('220.5 lb × 5 reps');
  });

  it('bodyweight-reps with extraWeight and unit="lb" converts extraWeight', () => {
    expect(formatTrackingValue(bodyweightSetWithExtra, 'lb')).toBe('5 reps (+22.0 lb)');
  });

  it('bodyweight-reps without extra and unit="lb" returns reps only (no suffix)', () => {
    expect(formatTrackingValue(bodyweightSetNoExtra, 'lb')).toBe('8 reps');
  });

  // Explicit kg (same as default)
  it('weight-reps with unit="kg" returns kg suffix', () => {
    expect(formatTrackingValue(weightRepsSet, 'kg')).toBe('100 kg × 5 reps');
  });

  // ── Slice A: plates weightUnit ─────────────────────────────────────────────

  it('weight-reps with weightUnit="plates" returns "X placas × Y reps" (no kg conversion)', () => {
    expect(formatTrackingValue(weightRepsSet, 'kg', 'plates')).toBe('100 placas × 5 reps');
  });

  it('weight-reps with weightUnit="plates" ignores the lb unit preference (no conversion)', () => {
    expect(formatTrackingValue(weightRepsSet, 'lb', 'plates')).toBe('100 placas × 5 reps');
  });

  it('weight-reps with explicit weightUnit="kg" behaves same as default', () => {
    expect(formatTrackingValue(weightRepsSet, 'kg', 'kg')).toBe('100 kg × 5 reps');
  });
});
