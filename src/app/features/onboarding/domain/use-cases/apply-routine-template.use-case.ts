import { Injectable, inject } from '@angular/core';
import { Exercise } from '@features/exercises/domain/exercise.entity';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { SeedExercisesUseCase } from '@features/exercises/domain/use-cases/seed-exercises.use-case';
import { Routine } from '@features/routines/domain/routine.entity';
import { TargetSet } from '@features/routines/domain/target-set';
import { AddExercisesToDayUseCase } from '@features/routines/domain/use-cases/add-exercises-to-day.use-case';
import { AddTrainingDayUseCase } from '@features/routines/domain/use-cases/add-training-day.use-case';
import { CreateRoutineUseCase } from '@features/routines/domain/use-cases/create-routine.use-case';
import { SetTargetSetsUseCase } from '@features/routines/domain/use-cases/set-target-sets.use-case';
import { RoutineTemplateNotFoundError } from '../errors/routine-template-not-found.error';
import { TemplateExercise } from '../routine-template';
import { findRoutineTemplate } from '../routine-templates';

/**
 * Builds the target sets of one template exercise from the exercise's own tracking type.
 * Template targets carry no weight. When the exercise cannot take what the template gives (for
 * example reps for a timed exercise) it gets no targets: the user sets them in the day editor.
 */
function targetSetsFor(exercise: Exercise, spec: TemplateExercise): TargetSet[] {
  const set = ((): TargetSet | null => {
    switch (exercise.trackingType) {
      case 'weight-reps':
        return 'reps' in spec ? { type: 'weight-reps', reps: spec.reps } : null;
      case 'bodyweight-reps':
        return 'reps' in spec ? { type: 'bodyweight-reps', reps: spec.reps } : null;
      case 'time':
        return 'seconds' in spec ? { type: 'time', durationSec: spec.seconds } : null;
      case 'distance-time':
        // No template asks for distance.
        return null;
    }
  })();
  return set ? Array.from({ length: spec.sets }, () => set) : [];
}

/**
 * Creates a routine from a starter template (S3, D1) using only the existing routines use cases.
 *
 * It only ever adds: a new routine, its days, and library exercises when the library is empty.
 * Routines, days and exercises that already exist are never deleted nor modified (L29), and
 * `CreateRoutineUseCase` leaves the current active routine alone, activating the new one only
 * when none is (J6a.2).
 */
@Injectable()
export class ApplyRoutineTemplateUseCase {
  private readonly seedExercises = inject(SeedExercisesUseCase);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly createRoutine = inject(CreateRoutineUseCase);
  private readonly addTrainingDay = inject(AddTrainingDayUseCase);
  private readonly addExercisesToDay = inject(AddExercisesToDayUseCase);
  private readonly setTargetSets = inject(SetTargetSetsUseCase);

  async execute(templateId: string): Promise<Routine> {
    const template = findRoutineTemplate(templateId);
    if (!template) {
      throw new RoutineTemplateNotFoundError(templateId);
    }

    // A fresh install has no exercises until some screen seeds them; Primer uso is the first screen
    // such a user sees. It does nothing when the library already has exercises.
    await this.seedExercises.execute();
    const library = new Map<string, Exercise>();
    for (const exercise of await this.exerciseRepo.getAll()) {
      if (!library.has(exercise.name)) library.set(exercise.name, exercise);
    }

    const routine = await this.createRoutine.execute({ name: template.name });

    for (const templateDay of template.days) {
      const day = await this.addTrainingDay.execute({ routineId: routine.id, name: templateDay.name });

      // An exercise missing from the library by name (renamed or deleted) is skipped.
      const resolved = templateDay.exercises.flatMap((spec) => {
        const exercise = library.get(spec.name);
        return exercise ? [{ exercise, spec }] : [];
      });
      if (resolved.length === 0) continue;

      await this.addExercisesToDay.execute({
        dayId: day.id,
        exerciseIds: resolved.map(({ exercise }) => exercise.id),
      });
      for (const { exercise, spec } of resolved) {
        const targetSets = targetSetsFor(exercise, spec);
        if (targetSets.length === 0) continue;
        await this.setTargetSets.execute({ dayId: day.id, exerciseId: exercise.id, targetSets });
      }
    }

    return routine;
  }
}
