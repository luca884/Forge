import { Injectable, inject } from '@angular/core';
import { Exercise } from '../exercise.entity';
import { ExerciseRepository } from '../exercise.repository';

/**
 * Devuelve un lookup `Map<exerciseId, Exercise>` para resolver nombre u objeto
 * completo en O(1). Centraliza el patrón ADR-40 (`getAll()` + construir Map) que
 * replicaban training-day enrich, session-summary, progress-home, pr-list y
 * training-session. Los consumers name-only derivan el nombre via `.get(id)?.name`.
 */
@Injectable()
export class GetExercisesMapUseCase {
  private readonly repo = inject(ExerciseRepository);

  async execute(): Promise<Map<string, Exercise>> {
    const exercises = await this.repo.getAll();
    return new Map(exercises.map((e) => [e.id, e] as const));
  }
}
