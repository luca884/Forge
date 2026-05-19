import { TestBed } from '@angular/core/testing';
import { GetRoutineDaysCountUseCase } from './get-routine-days-count.use-case';
import { TrainingDayRepository } from '../training-day.repository';
import { TrainingDay } from '../training-day.entity';

class StubTrainingDayRepository extends TrainingDayRepository {
  days: TrainingDay[] = [];

  override async getById(_id: string): Promise<TrainingDay | null> { return null; }
  override async getByRoutineId(_routineId: string): Promise<TrainingDay[]> { return this.days; }
  override async save(_day: TrainingDay): Promise<void> {}
  override async delete(_id: string): Promise<void> {}
}

describe('GetRoutineDaysCountUseCase', () => {
  let useCase: GetRoutineDaysCountUseCase;
  let repo: StubTrainingDayRepository;

  beforeEach(() => {
    repo = new StubTrainingDayRepository();
    TestBed.configureTestingModule({
      providers: [
        GetRoutineDaysCountUseCase,
        { provide: TrainingDayRepository, useValue: repo },
      ],
    });
    useCase = TestBed.inject(GetRoutineDaysCountUseCase);
  });

  it('returns 0 when no days exist', async () => {
    repo.days = [];
    const result = await useCase.execute('r-1');
    expect(result).toBe(0);
  });

  it('returns correct count when days exist', async () => {
    const makeDay = (id: string): TrainingDay => ({
      id,
      routineId: 'r-1',
      name: `Día ${id}`,
      exercises: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repo.days = [makeDay('d-1'), makeDay('d-2'), makeDay('d-3')];
    const result = await useCase.execute('r-1');
    expect(result).toBe(3);
  });
});
