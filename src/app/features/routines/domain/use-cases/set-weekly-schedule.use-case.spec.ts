import { TestBed } from '@angular/core/testing';
import { SetWeeklyScheduleUseCase } from './set-weekly-schedule.use-case';
import { RoutineRepository } from '../routine.repository';
import { TrainingDayRepository } from '../training-day.repository';
import { Routine } from '../routine.entity';
import { TrainingDay } from '../training-day.entity';
import { WeeklySchedule } from '../value-objects/weekly-schedule';
import { RoutineNotFoundError } from '../errors/routine-not-found.error';
import { InvalidScheduleError } from '../errors/invalid-schedule.error';

class StubRoutineRepository extends RoutineRepository {
  routines: Routine[] = [];
  savedRoutines: Routine[] = [];

  override async getAll(): Promise<Routine[]> { return this.routines; }
  override async getActive(): Promise<Routine | null> { return null; }
  override async getById(id: string): Promise<Routine | null> {
    return this.routines.find(r => r.id === id) ?? null;
  }
  override async save(routine: Routine): Promise<void> {
    this.savedRoutines.push(routine);
    const idx = this.routines.findIndex(r => r.id === routine.id);
    if (idx >= 0) this.routines[idx] = routine;
    else this.routines.push(routine);
  }
  override async setActive(_id: string): Promise<void> {}
  override async delete(_id: string): Promise<void> {}
}

class StubTrainingDayRepository extends TrainingDayRepository {
  days: TrainingDay[] = [];

  override async getById(id: string): Promise<TrainingDay | null> {
    return this.days.find(d => d.id === id) ?? null;
  }
  override async getByRoutineId(routineId: string): Promise<TrainingDay[]> {
    return this.days.filter(d => d.routineId === routineId);
  }
  override async save(_day: TrainingDay): Promise<void> {}
  override async delete(_id: string): Promise<void> {}
}

const makeRoutine = (overrides: Partial<Routine> = {}): Routine => ({
  id: 'routine-1',
  name: 'My Routine',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const makeDay = (overrides: Partial<TrainingDay> = {}): TrainingDay => ({
  id: 'day-a',
  routineId: 'routine-1',
  name: 'Día A',
  exercises: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('SetWeeklyScheduleUseCase', () => {
  let useCase: SetWeeklyScheduleUseCase;
  let routineRepo: StubRoutineRepository;
  let dayRepo: StubTrainingDayRepository;

  beforeEach(() => {
    routineRepo = new StubRoutineRepository();
    dayRepo = new StubTrainingDayRepository();

    TestBed.configureTestingModule({
      providers: [
        SetWeeklyScheduleUseCase,
        { provide: RoutineRepository, useValue: routineRepo },
        { provide: TrainingDayRepository, useValue: dayRepo },
      ],
    });
    useCase = TestBed.inject(SetWeeklyScheduleUseCase);
  });

  it('calls routineRepo.save with updated schedule when all dayIds are valid — D-17/S1', async () => {
    routineRepo.routines = [makeRoutine()];
    dayRepo.days = [makeDay({ id: 'day-a', routineId: 'routine-1' })];

    const schedule: WeeklySchedule = { monday: 'day-a', tuesday: undefined };
    const saveSpy = jest.spyOn(routineRepo, 'save');

    await useCase.execute({ routineId: 'routine-1', schedule });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    const savedRoutine = saveSpy.mock.calls[0]?.[0];
    expect(savedRoutine?.schedule).toEqual(schedule);
  });

  it('throws RoutineNotFoundError when routine does not exist — D-17/S2', async () => {
    // V-60
    const schedule: WeeklySchedule = {};
    await expect(
      useCase.execute({ routineId: 'nonexistent', schedule })
    ).rejects.toThrow(RoutineNotFoundError);
  });

  it('throws InvalidScheduleError when schedule references a dayId not in the routine — D-17/S3', async () => {
    // V-61
    routineRepo.routines = [makeRoutine()];
    dayRepo.days = [makeDay({ id: 'day-a', routineId: 'routine-1' })];

    const schedule: WeeklySchedule = { monday: 'day-foreign' }; // day-foreign does not belong to routine-1
    await expect(
      useCase.execute({ routineId: 'routine-1', schedule })
    ).rejects.toThrow(InvalidScheduleError);
  });

  it('calls routineRepo.save with empty schedule (all-rest week is valid) — D-17/S4', async () => {
    routineRepo.routines = [makeRoutine()];
    dayRepo.days = [];

    const schedule: WeeklySchedule = {}; // no days assigned = full rest week
    const saveSpy = jest.spyOn(routineRepo, 'save');

    await useCase.execute({ routineId: 'routine-1', schedule });

    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('does not call routineRepo.save when routine is not found', async () => {
    routineRepo.routines = [];
    const saveSpy = jest.spyOn(routineRepo, 'save');

    await expect(
      useCase.execute({ routineId: 'routine-1', schedule: {} })
    ).rejects.toThrow(RoutineNotFoundError);

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('validates all day entries in the schedule — multiple days', async () => {
    routineRepo.routines = [makeRoutine()];
    dayRepo.days = [
      makeDay({ id: 'day-a', routineId: 'routine-1' }),
      makeDay({ id: 'day-b', routineId: 'routine-1' }),
    ];

    const schedule: WeeklySchedule = { monday: 'day-a', wednesday: 'day-b', friday: 'day-a' };
    const saveSpy = jest.spyOn(routineRepo, 'save');

    await useCase.execute({ routineId: 'routine-1', schedule });

    expect(saveSpy).toHaveBeenCalledTimes(1);
  });
});
