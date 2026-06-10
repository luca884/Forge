import { TestBed } from '@angular/core/testing';
import { SetRestSecondsUseCase } from './set-rest-seconds.use-case';
import { TrainingDayRepository } from '../training-day.repository';
import { TrainingDay } from '../training-day.entity';

class StubTrainingDayRepository extends TrainingDayRepository {
  days: TrainingDay[] = [];

  override async getById(id: string): Promise<TrainingDay | null> {
    return this.days.find(d => d.id === id) ?? null;
  }

  override async getByRoutineId(_id: string): Promise<TrainingDay[]> { return []; }

  override async save(day: TrainingDay): Promise<void> {
    const idx = this.days.findIndex(d => d.id === day.id);
    if (idx >= 0) this.days[idx] = day;
  }

  override async delete(_id: string): Promise<void> {}

  override async existsExerciseInAnyDay(_exerciseId: string): Promise<boolean> { return false; }
}

const makeDay = (): TrainingDay => ({
  id: 'd1',
  routineId: 'r1',
  name: 'Día A',
  exercises: [{ exerciseId: 'ex1', order: 0, targetSets: [] }],
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('SetRestSecondsUseCase', () => {
  let useCase: SetRestSecondsUseCase;
  let dayRepo: StubTrainingDayRepository;

  beforeEach(() => {
    dayRepo = new StubTrainingDayRepository();
    TestBed.configureTestingModule({
      providers: [
        SetRestSecondsUseCase,
        { provide: TrainingDayRepository, useValue: dayRepo },
      ],
    });
    useCase = TestBed.inject(SetRestSecondsUseCase);
  });

  it('should set restSeconds for an exercise in a training day', async () => {
    dayRepo.days = [makeDay()];

    const updated = await useCase.execute({ dayId: 'd1', exerciseId: 'ex1', restSeconds: 120 });

    expect(updated.restSeconds).toBe(120);
  });

  it('should persist changes via repo.save', async () => {
    dayRepo.days = [makeDay()];
    const spy = jest.spyOn(dayRepo, 'save');

    await useCase.execute({ dayId: 'd1', exerciseId: 'ex1', restSeconds: 60 });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should clear restSeconds when undefined is passed', async () => {
    dayRepo.days = [{ ...makeDay(), exercises: [{ exerciseId: 'ex1', order: 0, targetSets: [], restSeconds: 90 }] }];

    const updated = await useCase.execute({ dayId: 'd1', exerciseId: 'ex1', restSeconds: undefined });

    expect(updated.restSeconds).toBeUndefined();
  });

  it('should allow restSeconds = 0 (no rest)', async () => {
    dayRepo.days = [makeDay()];

    const updated = await useCase.execute({ dayId: 'd1', exerciseId: 'ex1', restSeconds: 0 });

    expect(updated.restSeconds).toBe(0);
  });

  it('should throw when training day not found', async () => {
    await expect(
      useCase.execute({ dayId: 'nonexistent', exerciseId: 'ex1', restSeconds: 90 }),
    ).rejects.toThrow('TrainingDay not found: nonexistent');
  });

  it('should throw when exercise is not in day', async () => {
    dayRepo.days = [makeDay()];

    await expect(
      useCase.execute({ dayId: 'd1', exerciseId: 'ex-not-in-day', restSeconds: 90 }),
    ).rejects.toThrow('Exercise not in day: ex-not-in-day');
  });

  it('should not call repo.save when exercise not in day', async () => {
    dayRepo.days = [makeDay()];
    const spy = jest.spyOn(dayRepo, 'save');

    await expect(
      useCase.execute({ dayId: 'd1', exerciseId: 'ex-not-in-day', restSeconds: 90 }),
    ).rejects.toThrow();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should throw when restSeconds is negative', async () => {
    dayRepo.days = [makeDay()];

    await expect(
      useCase.execute({ dayId: 'd1', exerciseId: 'ex1', restSeconds: -1 }),
    ).rejects.toThrow();
  });

  it('should throw when restSeconds is not an integer', async () => {
    dayRepo.days = [makeDay()];

    await expect(
      useCase.execute({ dayId: 'd1', exerciseId: 'ex1', restSeconds: 90.5 }),
    ).rejects.toThrow();
  });

  it('should not modify other exercises in the day', async () => {
    const day: TrainingDay = {
      id: 'd1',
      routineId: 'r1',
      name: 'Día A',
      exercises: [
        { exerciseId: 'ex1', order: 0, targetSets: [], restSeconds: 60 },
        { exerciseId: 'ex2', order: 1, targetSets: [], restSeconds: 120 },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dayRepo.days = [day];

    await useCase.execute({ dayId: 'd1', exerciseId: 'ex1', restSeconds: 90 });

    const saved = dayRepo.days.find(d => d.id === 'd1')!;
    const ex2 = saved.exercises.find(e => e.exerciseId === 'ex2')!;
    expect(ex2.restSeconds).toBe(120);
  });
});
