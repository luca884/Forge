import { Injectable, inject } from '@angular/core';
import { generateUUID } from '@core/shared/utils/uuid';
import { Exercise, MuscleGroup } from '../exercise.entity';
import { ExerciseRepository } from '../exercise.repository';

interface SeedEntry {
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: Exercise['equipment'];
  trackingType: Exercise['trackingType'];
}

const SEED_ENTRIES: readonly SeedEntry[] = [
  // weight-reps (8 entries)
  { name: 'Press de banca', muscleGroup: 'chest', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Sentadilla', muscleGroup: 'legs', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Peso muerto', muscleGroup: 'back', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Press militar', muscleGroup: 'shoulders', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Remo con barra', muscleGroup: 'back', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Curl de bíceps', muscleGroup: 'biceps', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Jalón al pecho', muscleGroup: 'back', equipment: 'cable', trackingType: 'weight-reps' },
  { name: 'Prensa de piernas', muscleGroup: 'legs', equipment: 'machine', trackingType: 'weight-reps' },
  // bodyweight-reps (4 entries)
  { name: 'Dominadas', muscleGroup: 'back', equipment: 'bodyweight', trackingType: 'bodyweight-reps' },
  { name: 'Fondos en paralelas', muscleGroup: 'chest', equipment: 'bodyweight', trackingType: 'bodyweight-reps' },
  { name: 'Dominadas supinas', muscleGroup: 'biceps', equipment: 'bodyweight', trackingType: 'bodyweight-reps' },
  { name: 'Flexiones', muscleGroup: 'chest', equipment: 'bodyweight', trackingType: 'bodyweight-reps' },
];

@Injectable()
export class SeedExercisesUseCase {
  private readonly repo = inject(ExerciseRepository);

  async execute(): Promise<void> {
    const count = await this.repo.count();
    if (count > 0) {
      return;
    }

    const now = new Date();
    for (const entry of SEED_ENTRIES) {
      const exercise: Exercise = {
        id: generateUUID(),
        name: entry.name,
        muscleGroup: entry.muscleGroup,
        equipment: entry.equipment,
        trackingType: entry.trackingType,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
      };
      await this.repo.save(exercise);
    }
  }
}
