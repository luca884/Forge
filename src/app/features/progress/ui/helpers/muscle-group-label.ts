/**
 * Pure display helper — maps MuscleGroup enum values to Spanish labels.
 * No Angular DI. No side effects.
 * Slice D: extracted because both exercise-history.page and pr-list.page consume it.
 */
import type { MuscleGroup } from '@features/exercises/domain/exercise.entity';

const LABELS: Record<MuscleGroup, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  legs: 'Piernas',
  glutes: 'Glúteos',
  core: 'Core',
  'full-body': 'Cuerpo completo',
};

export function muscleGroupLabel(group: MuscleGroup): string {
  return LABELS[group] ?? (group as string);
}
