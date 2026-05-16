import { Injectable, inject } from '@angular/core';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { Exercise } from '../domain/exercise.entity';
import { ExerciseFilter } from '../domain/exercise-filter';
import { ExerciseRepository } from '../domain/exercise.repository';
import { toExercise, toExerciseRow } from './exercise.mapper';

@Injectable()
export class DexieExerciseRepository extends ExerciseRepository {
  private readonly db = inject(ForgeDatabaseService);

  async getAll(filter?: ExerciseFilter): Promise<Exercise[]> {
    let rows;

    if (filter?.muscleGroup) {
      rows = await this.db.exercises
        .where('muscleGroup')
        .equals(filter.muscleGroup)
        .toArray();
    } else {
      rows = await this.db.exercises.toArray();
    }

    let exercises = rows.map(toExercise);

    if (filter?.search) {
      const search = filter.search.toLowerCase();
      exercises = exercises.filter((e) =>
        e.name.toLowerCase().includes(search),
      );
    }

    return exercises;
  }

  async getById(id: string): Promise<Exercise | null> {
    const row = await this.db.exercises.get(id);
    return row ? toExercise(row) : null;
  }

  async save(exercise: Exercise): Promise<void> {
    await this.db.exercises.put(toExerciseRow(exercise));
  }

  async count(): Promise<number> {
    return this.db.exercises.count();
  }

  async delete(id: string): Promise<void> {
    await this.db.exercises.delete(id);
  }
}
