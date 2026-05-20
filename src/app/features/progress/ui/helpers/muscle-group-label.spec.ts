/**
 * muscle-group-label spec (Slice D).
 * Pure function — no TestBed needed.
 * TDD strict: RED before implementation exists.
 */
import type { MuscleGroup } from '@features/exercises/domain/exercise.entity';
import { muscleGroupLabel } from './muscle-group-label';

describe('muscleGroupLabel', () => {
  it.each<[MuscleGroup, string]>([
    ['chest', 'Pecho'],
    ['back', 'Espalda'],
    ['shoulders', 'Hombros'],
    ['biceps', 'Bíceps'],
    ['triceps', 'Tríceps'],
    ['legs', 'Piernas'],
    ['glutes', 'Glúteos'],
    ['core', 'Core'],
    ['full-body', 'Cuerpo completo'],
  ])('maps %s to %s', (input, expected) => {
    expect(muscleGroupLabel(input)).toBe(expected);
  });

  it('returns the raw string for an unknown muscle group (fallback)', () => {
    expect(muscleGroupLabel('unknown-group' as any)).toBe('unknown-group');
  });
});
