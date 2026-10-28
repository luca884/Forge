import { TestBed } from '@angular/core/testing';
import { Exercise } from '@features/exercises/domain/exercise.entity';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { SeedExercisesUseCase } from '@features/exercises/domain/use-cases/seed-exercises.use-case';
import { Routine } from '@features/routines/domain/routine.entity';
import { RoutineRepository } from '@features/routines/domain/routine.repository';
import { TrainingDay } from '@features/routines/domain/training-day.entity';
import { TrainingDayRepository } from '@features/routines/domain/training-day.repository';
import { AddExercisesToDayUseCase } from '@features/routines/domain/use-cases/add-exercises-to-day.use-case';
import { AddTrainingDayUseCase } from '@features/routines/domain/use-cases/add-training-day.use-case';
import { CreateRoutineUseCase } from '@features/routines/domain/use-cases/create-routine.use-case';
import { SetTargetSetsUseCase } from '@features/routines/domain/use-cases/set-target-sets.use-case';
import { RoutineTemplateNotFoundError } from '../errors/routine-template-not-found.error';
import { ApplyRoutineTemplateUseCase } from './apply-routine-template.use-case';

// crypto.randomUUID is not available in jsdom: ids need a deterministic generator.
let uuidCounter = 0;
beforeEach(() => {
  uuidCounter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: { randomUUID: () => `uuid-${++uuidCounter}` },
    writable: true,
  });
});

// In-memory repositories with the same semantics as the Dexie ones (the active routine is the one
// flagged `isActive`), so the real routines use cases run unchanged underneath.

class InMemoryRoutineRepository extends RoutineRepository {
  rows: Routine[] = [];
  override async getAll(): Promise<Routine[]> {
    return [...this.rows];
  }
  override async getActive(): Promise<Routine | null> {
    return this.rows.find((r) => r.isActive) ?? null;
  }
  override async getById(id: string): Promise<Routine | null> {
    return this.rows.find((r) => r.id === id) ?? null;
  }
  override async save(routine: Routine): Promise<void> {
    this.rows = [...this.rows.filter((r) => r.id !== routine.id), routine];
  }
  override async setActive(id: string): Promise<void> {
    this.rows = this.rows.map((r) => ({ ...r, isActive: r.id === id }));
  }
  override async delete(id: string): Promise<void> {
    this.rows = this.rows.filter((r) => r.id !== id);
  }
}

class InMemoryTrainingDayRepository extends TrainingDayRepository {
  rows: TrainingDay[] = [];
  override async getById(id: string): Promise<TrainingDay | null> {
    return this.rows.find((d) => d.id === id) ?? null;
  }
  override async getByRoutineId(routineId: string): Promise<TrainingDay[]> {
    return this.rows.filter((d) => d.routineId === routineId);
  }
  override async save(day: TrainingDay): Promise<void> {
    const index = this.rows.findIndex((d) => d.id === day.id);
    if (index >= 0) this.rows[index] = day;
    else this.rows.push(day);
  }
  override async delete(id: string): Promise<void> {
    this.rows = this.rows.filter((d) => d.id !== id);
  }
  override async existsExerciseInAnyDay(exerciseId: string): Promise<boolean> {
    return this.rows.some((d) => d.exercises.some((e) => e.exerciseId === exerciseId));
  }
}

class InMemoryExerciseRepository extends ExerciseRepository {
  rows: Exercise[] = [];
  override async getAll(): Promise<Exercise[]> {
    return [...this.rows];
  }
  override async getById(id: string): Promise<Exercise | null> {
    return this.rows.find((e) => e.id === id) ?? null;
  }
  override async save(exercise: Exercise): Promise<void> {
    const index = this.rows.findIndex((e) => e.id === exercise.id);
    if (index >= 0) this.rows[index] = exercise;
    else this.rows.push(exercise);
  }
  override async count(): Promise<number> {
    return this.rows.length;
  }
  override async delete(id: string): Promise<void> {
    this.rows = this.rows.filter((e) => e.id !== id);
  }
}

const LONG_AGO = new Date('2026-01-01T00:00:00Z');

function routineRow(id: string, overrides: Partial<Routine> = {}): Routine {
  return { id, name: `Rutina ${id}`, isActive: false, createdAt: LONG_AGO, updatedAt: LONG_AGO, ...overrides };
}

function dayRow(id: string, routineId: string, exerciseId: string): TrainingDay {
  return {
    id,
    routineId,
    name: `Día ${id}`,
    label: 'X',
    exercises: [
      {
        exerciseId,
        order: 0,
        targetSets: [{ type: 'weight-reps', reps: 5, weightKg: 100 }],
        restSeconds: 120,
        note: 'no tocar',
      },
    ],
    createdAt: LONG_AGO,
    updatedAt: LONG_AGO,
  };
}

describe('ApplyRoutineTemplateUseCase', () => {
  let useCase: ApplyRoutineTemplateUseCase;
  let routines: InMemoryRoutineRepository;
  let days: InMemoryTrainingDayRepository;
  let exercises: InMemoryExerciseRepository;

  /** Day names -> exercise names of a routine, in stored order. */
  async function layoutOf(routineId: string): Promise<Record<string, string[]>> {
    const names = new Map(exercises.rows.map((e) => [e.id, e.name]));
    const layout: Record<string, string[]> = {};
    for (const day of await days.getByRoutineId(routineId)) {
      layout[day.name] = [...day.exercises]
        .sort((a, b) => a.order - b.order)
        .map((e) => names.get(e.exerciseId) ?? e.exerciseId);
    }
    return layout;
  }

  beforeEach(async () => {
    routines = new InMemoryRoutineRepository();
    days = new InMemoryTrainingDayRepository();
    exercises = new InMemoryExerciseRepository();
    TestBed.configureTestingModule({
      providers: [
        ApplyRoutineTemplateUseCase,
        CreateRoutineUseCase,
        AddTrainingDayUseCase,
        AddExercisesToDayUseCase,
        SetTargetSetsUseCase,
        SeedExercisesUseCase,
        { provide: RoutineRepository, useValue: routines },
        { provide: TrainingDayRepository, useValue: days },
        { provide: ExerciseRepository, useValue: exercises },
      ],
    });
    useCase = TestBed.inject(ApplyRoutineTemplateUseCase);
    // The library the app ships with; the one test that needs it empty clears it.
    await TestBed.inject(SeedExercisesUseCase).execute();
  });

  it('creates a routine named after the template with its days and exercises in order', async () => {
    const routine = await useCase.execute('full-body');

    expect(routine.name).toBe('Full body');
    expect(routines.rows.map((r) => r.id)).toEqual([routine.id]);
    expect(await layoutOf(routine.id)).toEqual({
      A: ['Sentadilla', 'Press de banca', 'Remo con barra', 'Plancha'],
      B: ['Peso muerto', 'Press militar', 'Jalón al pecho', 'Zancadas'],
      C: ['Prensa de piernas', 'Press de banca con mancuernas', 'Remo en polea baja', 'Abdominales'],
    });
    expect(Object.keys(await layoutOf(routine.id))).toEqual(['A', 'B', 'C']);
  });

  it('builds each target set from the exercise tracking type: reps, bodyweight reps or seconds, no weight', async () => {
    const routine = await useCase.execute('full-body');
    const [dayA, , dayC] = await days.getByRoutineId(routine.id);
    const targetsOf = (day: TrainingDay | undefined, exerciseName: string): unknown => {
      const id = exercises.rows.find((e) => e.name === exerciseName)?.id;
      return day?.exercises.find((e) => e.exerciseId === id)?.targetSets;
    };

    expect(targetsOf(dayA, 'Sentadilla')).toEqual(Array(3).fill({ type: 'weight-reps', reps: 8 }));
    expect(targetsOf(dayA, 'Plancha')).toEqual(Array(3).fill({ type: 'time', durationSec: 45 }));
    expect(targetsOf(dayC, 'Abdominales')).toEqual(Array(3).fill({ type: 'bodyweight-reps', reps: 15 }));
  });

  it('sets no weekly schedule, no rest override and no note', async () => {
    const routine = await useCase.execute('torso-pierna');

    expect(routine.schedule).toBeUndefined();
    const stored = await days.getByRoutineId(routine.id);
    expect(stored).toHaveLength(4);
    for (const day of stored) {
      for (const exercise of day.exercises) {
        expect(exercise.restSeconds).toBeUndefined();
        expect(exercise.note).toBeUndefined();
      }
    }
  });

  it('makes the new routine active when none is', async () => {
    const routine = await useCase.execute('push-pull-piernas');

    expect(routine.isActive).toBe(true);
    expect((await routines.getActive())?.id).toBe(routine.id);
  });

  it('keeps the single active routine when another one already is', async () => {
    routines.rows = [routineRow('mine', { isActive: true })];

    const routine = await useCase.execute('full-body');

    expect(routine.isActive).toBe(false);
    expect((await routines.getActive())?.id).toBe('mine');
    expect(routines.rows.filter((r) => r.isActive)).toHaveLength(1);
  });

  it('never deletes or modifies existing routines, days or exercises (L29)', async () => {
    // Built twice, so `before` is a copy the use case never had a reference to.
    const existing = (): { routines: Routine[]; days: TrainingDay[]; own: Exercise } => ({
      routines: [
        routineRow('r-active', { isActive: true, schedule: { monday: 'd-1' } }),
        routineRow('r-other', { description: 'otra' }),
      ],
      days: [dayRow('d-1', 'r-active', 'ex-own'), dayRow('d-2', 'r-other', 'ex-own')],
      own: {
        id: 'ex-own',
        name: 'Mi ejercicio',
        muscleGroup: 'core',
        trackingType: 'weight-reps',
        weightUnit: 'plates',
        plateWeightKg: 10,
        isCustom: true,
        createdAt: LONG_AGO,
        updatedAt: LONG_AGO,
      },
    });
    const installed = existing();
    routines.rows = installed.routines;
    days.rows = installed.days;
    await exercises.save(installed.own);
    const libraryBefore = exercises.rows.map((e) => ({ ...e }));
    const before = existing();

    const created = await useCase.execute('torso-pierna');

    // Everything that was there is still there, identical; the only additions are the new routine's.
    expect(routines.rows.filter((r) => r.id !== created.id)).toEqual(before.routines);
    expect(days.rows.filter((d) => d.routineId !== created.id)).toEqual(before.days);
    expect(exercises.rows).toEqual(libraryBefore);
    expect(routines.rows).toHaveLength(before.routines.length + 1);
  });

  it('seeds the exercise library first when it is empty, so a new install gets its exercises', async () => {
    exercises.rows = [];

    const routine = await useCase.execute('full-body');

    expect(exercises.rows.length).toBeGreaterThan(0);
    expect((await layoutOf(routine.id))['A']).toEqual(['Sentadilla', 'Press de banca', 'Remo con barra', 'Plancha']);
  });

  it('skips an exercise that is no longer in the library by name and still creates the routine', async () => {
    exercises.rows = exercises.rows.filter((e) => e.name !== 'Plancha');

    const routine = await useCase.execute('full-body');

    expect((await layoutOf(routine.id))['A']).toEqual(['Sentadilla', 'Press de banca', 'Remo con barra']);
    expect(routines.rows.map((r) => r.id)).toEqual([routine.id]);
  });

  it('adds an exercise without targets when its tracking type cannot take the template target', async () => {
    // "Plancha" turned into a rep-based exercise: the template only gives it seconds.
    exercises.rows = exercises.rows.map((e) => (e.name === 'Plancha' ? { ...e, trackingType: 'weight-reps' } : e));

    const routine = await useCase.execute('full-body');

    const [dayA] = await days.getByRoutineId(routine.id);
    const plancha = dayA?.exercises.find((e) => e.exerciseId === exercises.rows.find((x) => x.name === 'Plancha')?.id);
    expect(plancha?.targetSets).toEqual([]);
    expect(dayA?.exercises).toHaveLength(4);
  });

  it('rejects an unknown template without writing anything', async () => {
    await expect(useCase.execute('no-such-template')).rejects.toBeInstanceOf(RoutineTemplateNotFoundError);

    expect(routines.rows).toEqual([]);
    expect(days.rows).toEqual([]);
  });
});
