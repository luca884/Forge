import { TestBed } from '@angular/core/testing';
import { DexieTrainingDayRepository } from './dexie-training-day.repository';
import { TrainingDayRepository } from '../domain/training-day.repository';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { TrainingDay } from '../domain/training-day.entity';

const makeDay = (overrides: Partial<TrainingDay> = {}): TrainingDay => ({
  id: 'd1',
  routineId: 'r1',
  name: 'Día A',
  exercises: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('DexieTrainingDayRepository', () => {
  let repo: TrainingDayRepository;
  let db: ForgeDatabaseService;

  beforeEach(async () => {
    db = new ForgeDatabaseService();
    TestBed.configureTestingModule({
      providers: [
        DexieTrainingDayRepository,
        { provide: TrainingDayRepository, useClass: DexieTrainingDayRepository },
        { provide: ForgeDatabaseService, useValue: db },
      ],
    });
    repo = TestBed.inject(DexieTrainingDayRepository);
    await db.trainingDays.clear();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should save and retrieve by id', async () => {
    const day = makeDay();
    await repo.save(day);
    const result = await repo.getById('d1');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Día A');
  });

  it('should return null for non-existent id', async () => {
    const result = await repo.getById('nonexistent');
    expect(result).toBeNull();
  });

  it('should retrieve all days for a routine', async () => {
    await repo.save(makeDay({ id: 'd1', routineId: 'r1' }));
    await repo.save(makeDay({ id: 'd2', routineId: 'r1', name: 'Día B' }));
    await repo.save(makeDay({ id: 'd3', routineId: 'r2', name: 'Different routine' }));

    const result = await repo.getByRoutineId('r1');
    expect(result).toHaveLength(2);
  });

  it('should upsert on repeated save with same id', async () => {
    const day = makeDay();
    await repo.save(day);
    await repo.save({ ...day, name: 'Updated Name' });

    const result = await repo.getById('d1');
    expect(result!.name).toBe('Updated Name');
  });

  it('should delete a day by id', async () => {
    await repo.save(makeDay({ id: 'd1' }));
    await repo.save(makeDay({ id: 'd2', name: 'Second' }));

    await repo.delete('d1');

    const all = await repo.getByRoutineId('r1');
    expect(all).toHaveLength(1);
    expect(all[0]!.id).toBe('d2');
  });

  it('should round-trip exercises with target sets', async () => {
    const dayWithExercises = makeDay({
      exercises: [
        {
          exerciseId: 'ex1',
          order: 0,
          targetSets: [{ type: 'weight-reps', reps: 8, weightKg: 100 }],
        },
      ],
    });

    await repo.save(dayWithExercises);
    const result = await repo.getById('d1');

    expect(result!.exercises).toHaveLength(1);
    expect(result!.exercises[0]!.exerciseId).toBe('ex1');
    expect(result!.exercises[0]!.targetSets[0]!.type).toBe('weight-reps');
  });
});
