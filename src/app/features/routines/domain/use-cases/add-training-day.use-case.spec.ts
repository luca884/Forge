import { TestBed } from '@angular/core/testing';
import { AddTrainingDayUseCase } from './add-training-day.use-case';
import { TrainingDayRepository } from '../training-day.repository';
import { TrainingDay } from '../training-day.entity';

let uuidCounter = 0;
beforeEach(() => {
  uuidCounter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: { randomUUID: () => `test-uuid-${++uuidCounter}` },
    writable: true,
  });
});

class StubTrainingDayRepository extends TrainingDayRepository {
  days: TrainingDay[] = [];

  override async getById(id: string): Promise<TrainingDay | null> {
    return this.days.find(d => d.id === id) ?? null;
  }

  override async getByRoutineId(routineId: string): Promise<TrainingDay[]> {
    return this.days.filter(d => d.routineId === routineId);
  }

  override async save(day: TrainingDay): Promise<void> {
    this.days.push(day);
  }

  override async delete(id: string): Promise<void> {
    this.days = this.days.filter(d => d.id !== id);
  }
}

describe('AddTrainingDayUseCase', () => {
  let useCase: AddTrainingDayUseCase;
  let repo: StubTrainingDayRepository;

  beforeEach(() => {
    repo = new StubTrainingDayRepository();
    TestBed.configureTestingModule({
      providers: [
        AddTrainingDayUseCase,
        { provide: TrainingDayRepository, useValue: repo },
      ],
    });
    useCase = TestBed.inject(AddTrainingDayUseCase);
  });

  it('should create a training day with empty exercises array', async () => {
    const day = await useCase.execute({ routineId: 'r1', name: 'Día A' });
    expect(day.exercises).toHaveLength(0);
    expect(day.name).toBe('Día A');
    expect(day.routineId).toBe('r1');
  });

  it('should persist the training day via repo.save', async () => {
    const spy = jest.spyOn(repo, 'save');
    await useCase.execute({ routineId: 'r1', name: 'Día B' });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should assign a non-empty id', async () => {
    const day = await useCase.execute({ routineId: 'r1', name: 'Día C' });
    expect(day.id).toBeTruthy();
  });

  it('should include optional label when provided', async () => {
    const day = await useCase.execute({ routineId: 'r1', name: 'Día A', label: 'Push' });
    expect(day.label).toBe('Push');
  });
});
