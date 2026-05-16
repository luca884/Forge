import { TestBed } from '@angular/core/testing';
import { GetSuggestedDayForTodayUseCase } from './get-suggested-day-for-today.use-case';
import { RoutineRepository } from '../../../routines/domain/routine.repository';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { Routine } from '../../../routines/domain/routine.entity';
import { TrainingDay } from '../../../routines/domain/training-day.entity';
import { WeeklySchedule } from '../../../routines/domain/value-objects/weekly-schedule';

// Tuesday 2024-01-02 (Tuesdays = day index 2 in JS)
const TUESDAY = new Date('2024-01-02T10:00:00');
// Monday 2024-01-01
const MONDAY = new Date('2024-01-01T10:00:00');
// Sunday 2024-01-07
const SUNDAY = new Date('2024-01-07T10:00:00');

class StubRoutineRepository extends RoutineRepository {
  activeRoutine: Routine | null = null;

  override async getAll(): Promise<Routine[]> { return []; }
  override async getActive(): Promise<Routine | null> { return this.activeRoutine; }
  override async getById(_id: string): Promise<Routine | null> { return null; }
  override async save(_routine: Routine): Promise<void> {}
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

const makeRoutine = (schedule?: WeeklySchedule): Routine => ({
  id: 'routine-1',
  name: 'My Routine',
  isActive: true,
  schedule,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

const makeDay = (id: string): TrainingDay => ({
  id,
  routineId: 'routine-1',
  name: `Día ${id}`,
  exercises: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

describe('GetSuggestedDayForTodayUseCase', () => {
  let useCase: GetSuggestedDayForTodayUseCase;
  let routineRepo: StubRoutineRepository;
  let dayRepo: StubTrainingDayRepository;

  beforeEach(() => {
    routineRepo = new StubRoutineRepository();
    dayRepo = new StubTrainingDayRepository();

    TestBed.configureTestingModule({
      providers: [
        GetSuggestedDayForTodayUseCase,
        { provide: RoutineRepository, useValue: routineRepo },
        { provide: TrainingDayRepository, useValue: dayRepo },
      ],
    });
    useCase = TestBed.inject(GetSuggestedDayForTodayUseCase);
  });

  it('returns { day, reason: scheduled } when routine has schedule and today matches — D-18/S1', async () => {
    // V-62 (scheduled path)
    const schedule: WeeklySchedule = { tuesday: 'day-b-id' };
    routineRepo.activeRoutine = makeRoutine(schedule);
    dayRepo.days = [makeDay('day-b-id')];

    const result = await useCase.execute({ now: TUESDAY });

    expect(result.reason).toBe('scheduled');
    if (result.reason === 'scheduled') {
      expect(result.day.id).toBe('day-b-id');
    }
  });

  it('returns { day: null, reason: rest-day } when today is a rest day in schedule — D-18/S2', async () => {
    // V-62
    const schedule: WeeklySchedule = { monday: 'day-a-id' }; // tuesday not set = rest day
    routineRepo.activeRoutine = makeRoutine(schedule);
    dayRepo.days = [makeDay('day-a-id')];

    const result = await useCase.execute({ now: TUESDAY });

    expect(result.reason).toBe('rest-day');
    expect(result.day).toBeNull();
  });

  it('returns { day: null, reason: no-active-routine } when no active routine — D-18/S3', async () => {
    // V-63
    routineRepo.activeRoutine = null;

    const result = await useCase.execute({ now: TUESDAY });

    expect(result.reason).toBe('no-active-routine');
    expect(result.day).toBeNull();
  });

  it('returns { day: null, reason: no-schedule-configured } when routine has no schedule — D-18/S4', async () => {
    routineRepo.activeRoutine = makeRoutine(undefined); // no schedule set

    const result = await useCase.execute({ now: TUESDAY });

    expect(result.reason).toBe('no-schedule-configured');
    expect(result.day).toBeNull();
  });

  it('returns { day: null, reason: rest-day } when TrainingDayRepository returns null (orphaned dayId) — D-18/S5', async () => {
    const schedule: WeeklySchedule = { tuesday: 'orphaned-day-id' };
    routineRepo.activeRoutine = makeRoutine(schedule);
    dayRepo.days = []; // no days in repo — orphaned

    const result = await useCase.execute({ now: TUESDAY });

    // Orphaned = rest-day (TrainingDay not found)
    expect(result.reason).toBe('rest-day');
    expect(result.day).toBeNull();
  });

  it('correctly maps Monday to monday dow', async () => {
    const schedule: WeeklySchedule = { monday: 'day-a-id' };
    routineRepo.activeRoutine = makeRoutine(schedule);
    dayRepo.days = [makeDay('day-a-id')];

    const result = await useCase.execute({ now: MONDAY });

    expect(result.reason).toBe('scheduled');
  });

  it('correctly maps Sunday to sunday dow', async () => {
    const schedule: WeeklySchedule = { sunday: 'day-c-id' };
    routineRepo.activeRoutine = makeRoutine(schedule);
    dayRepo.days = [makeDay('day-c-id')];

    const result = await useCase.execute({ now: SUNDAY });

    expect(result.reason).toBe('scheduled');
  });
});
