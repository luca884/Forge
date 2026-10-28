/**
 * A starter routine offered on the first-use screen (S3, D1).
 *
 * Exercises are referenced by catalog name, never by id: the ids are generated when the library is
 * seeded, so they differ on every device. Templates carry no weight targets, no rest overrides and
 * no weekly schedule: the user fills those in afterwards.
 */

/** One exercise of a template day: how many sets, and either reps or seconds per set. */
export type TemplateExercise =
  | { readonly name: string; readonly sets: number; readonly reps: number }
  | { readonly name: string; readonly sets: number; readonly seconds: number };

export interface TemplateDay {
  readonly name: string;
  readonly exercises: readonly TemplateExercise[];
}

export interface RoutineTemplate {
  readonly id: string;
  readonly name: string;
  /** Second line of the template row on the first-use screen, e.g. "3 días · ideal para empezar". */
  readonly summary: string;
  readonly days: readonly TemplateDay[];
}
