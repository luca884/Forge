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
  // chest
  { name: 'Press de banca', muscleGroup: 'chest', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Press inclinado con barra', muscleGroup: 'chest', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Press de banca con mancuernas', muscleGroup: 'chest', equipment: 'dumbbell', trackingType: 'weight-reps' },
  { name: 'Aperturas con mancuernas', muscleGroup: 'chest', equipment: 'dumbbell', trackingType: 'weight-reps' },
  { name: 'Cruce de poleas', muscleGroup: 'chest', equipment: 'cable', trackingType: 'weight-reps' },
  { name: 'Fondos en paralelas', muscleGroup: 'chest', equipment: 'bodyweight', trackingType: 'bodyweight-reps' },
  { name: 'Flexiones', muscleGroup: 'chest', equipment: 'bodyweight', trackingType: 'bodyweight-reps' },
  // back
  { name: 'Peso muerto', muscleGroup: 'back', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Remo con barra', muscleGroup: 'back', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Remo con mancuerna', muscleGroup: 'back', equipment: 'dumbbell', trackingType: 'weight-reps' },
  { name: 'Jalón al pecho', muscleGroup: 'back', equipment: 'cable', trackingType: 'weight-reps' },
  { name: 'Remo en polea baja', muscleGroup: 'back', equipment: 'cable', trackingType: 'weight-reps' },
  { name: 'Dominadas', muscleGroup: 'back', equipment: 'bodyweight', trackingType: 'bodyweight-reps' },
  // shoulders
  { name: 'Press militar', muscleGroup: 'shoulders', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Press de hombros con mancuernas', muscleGroup: 'shoulders', equipment: 'dumbbell', trackingType: 'weight-reps' },
  { name: 'Elevaciones laterales', muscleGroup: 'shoulders', equipment: 'dumbbell', trackingType: 'weight-reps' },
  { name: 'Elevaciones posteriores', muscleGroup: 'shoulders', equipment: 'dumbbell', trackingType: 'weight-reps' },
  { name: 'Face pull', muscleGroup: 'shoulders', equipment: 'cable', trackingType: 'weight-reps' },
  // biceps
  { name: 'Curl de bíceps', muscleGroup: 'biceps', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Curl con mancuernas', muscleGroup: 'biceps', equipment: 'dumbbell', trackingType: 'weight-reps' },
  { name: 'Curl martillo', muscleGroup: 'biceps', equipment: 'dumbbell', trackingType: 'weight-reps' },
  { name: 'Dominadas supinas', muscleGroup: 'biceps', equipment: 'bodyweight', trackingType: 'bodyweight-reps' },
  // triceps
  { name: 'Extensión de tríceps en polea', muscleGroup: 'triceps', equipment: 'cable', trackingType: 'weight-reps' },
  { name: 'Press francés', muscleGroup: 'triceps', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Fondos en banco', muscleGroup: 'triceps', equipment: 'bodyweight', trackingType: 'bodyweight-reps' },
  // legs
  { name: 'Sentadilla', muscleGroup: 'legs', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Prensa de piernas', muscleGroup: 'legs', equipment: 'machine', trackingType: 'weight-reps' },
  { name: 'Peso muerto rumano', muscleGroup: 'legs', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Zancadas', muscleGroup: 'legs', equipment: 'dumbbell', trackingType: 'weight-reps' },
  { name: 'Extensión de cuádriceps', muscleGroup: 'legs', equipment: 'machine', trackingType: 'weight-reps' },
  { name: 'Curl femoral', muscleGroup: 'legs', equipment: 'machine', trackingType: 'weight-reps' },
  { name: 'Elevación de gemelos', muscleGroup: 'legs', equipment: 'machine', trackingType: 'weight-reps' },
  // glutes
  { name: 'Hip thrust', muscleGroup: 'glutes', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Patada de glúteo en polea', muscleGroup: 'glutes', equipment: 'cable', trackingType: 'weight-reps' },
  { name: 'Puente de glúteos', muscleGroup: 'glutes', equipment: 'bodyweight', trackingType: 'bodyweight-reps' },
  // core
  { name: 'Plancha', muscleGroup: 'core', equipment: 'bodyweight', trackingType: 'time' },
  { name: 'Abdominales', muscleGroup: 'core', equipment: 'bodyweight', trackingType: 'bodyweight-reps' },
  { name: 'Elevación de piernas colgado', muscleGroup: 'core', equipment: 'bodyweight', trackingType: 'bodyweight-reps' },
  { name: 'Rueda abdominal', muscleGroup: 'core', equipment: 'bodyweight', trackingType: 'bodyweight-reps' },
  // full-body
  { name: 'Burpees', muscleGroup: 'full-body', equipment: 'bodyweight', trackingType: 'bodyweight-reps' },
  { name: 'Cargada de potencia', muscleGroup: 'full-body', equipment: 'barbell', trackingType: 'weight-reps' },
  { name: 'Kettlebell swing', muscleGroup: 'full-body', equipment: 'kettlebell', trackingType: 'weight-reps' },
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
