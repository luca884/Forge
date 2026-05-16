import { TestBed } from '@angular/core/testing';
import { CreateRoutineUseCase } from './create-routine.use-case';
import { RoutineRepository } from '../routine.repository';
import { Routine } from '../routine.entity';

// crypto.randomUUID is not available in jsdom — inject a deterministic mock
let uuidCounter = 0;
beforeEach(() => {
  uuidCounter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: { randomUUID: () => `test-uuid-${++uuidCounter}` },
    writable: true,
  });
});

class StubRoutineRepository extends RoutineRepository {
  private routines: Routine[] = [];
  activeId: string | null = null;

  override async getAll(): Promise<Routine[]> {
    return this.routines;
  }

  override async getActive(): Promise<Routine | null> {
    if (this.activeId === null) return null;
    return this.routines.find(r => r.id === this.activeId) ?? null;
  }

  override async getById(id: string): Promise<Routine | null> {
    return this.routines.find(r => r.id === id) ?? null;
  }

  override async save(routine: Routine): Promise<void> {
    const idx = this.routines.findIndex(r => r.id === routine.id);
    if (idx >= 0) {
      this.routines[idx] = routine;
    } else {
      this.routines.push(routine);
    }
  }

  override async setActive(id: string): Promise<void> {
    this.activeId = id;
  }

  override async delete(id: string): Promise<void> {
    this.routines = this.routines.filter(r => r.id !== id);
  }
}

describe('CreateRoutineUseCase', () => {
  let useCase: CreateRoutineUseCase;
  let repo: StubRoutineRepository;

  beforeEach(() => {
    repo = new StubRoutineRepository();
    TestBed.configureTestingModule({
      providers: [
        CreateRoutineUseCase,
        { provide: RoutineRepository, useValue: repo },
      ],
    });
    useCase = TestBed.inject(CreateRoutineUseCase);
  });

  it('should create a routine with isActive: true when no active routine exists', async () => {
    const routine = await useCase.execute({ name: 'Push Pull Legs' });
    expect(routine.name).toBe('Push Pull Legs');
    expect(routine.isActive).toBe(true);
  });

  it('should create a routine with isActive: false when an active routine already exists', async () => {
    // Seed an existing active routine
    const existing: Routine = {
      id: 'existing-1',
      name: 'Existing',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await repo.save(existing);
    repo.activeId = 'existing-1';

    const routine = await useCase.execute({ name: 'New Routine' });
    expect(routine.isActive).toBe(false);
  });

  it('should persist the routine via repo.save', async () => {
    const saveSpy = jest.spyOn(repo, 'save');
    await useCase.execute({ name: 'My Routine' });
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('should assign a non-empty id', async () => {
    const routine = await useCase.execute({ name: 'Test' });
    expect(routine.id).toBeTruthy();
    expect(typeof routine.id).toBe('string');
  });

  it('should include optional description when provided', async () => {
    const routine = await useCase.execute({ name: 'Test', description: 'My desc' });
    expect(routine.description).toBe('My desc');
  });
});
