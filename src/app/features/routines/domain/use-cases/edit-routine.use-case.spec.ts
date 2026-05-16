import { TestBed } from '@angular/core/testing';
import { EditRoutineUseCase } from './edit-routine.use-case';
import { RoutineRepository } from '../routine.repository';
import { Routine } from '../routine.entity';

class StubRoutineRepository extends RoutineRepository {
  routines: Routine[] = [];

  override async getAll(): Promise<Routine[]> { return this.routines; }
  override async getActive(): Promise<Routine | null> { return null; }

  override async getById(id: string): Promise<Routine | null> {
    return this.routines.find(r => r.id === id) ?? null;
  }

  override async save(routine: Routine): Promise<void> {
    const idx = this.routines.findIndex(r => r.id === routine.id);
    if (idx >= 0) this.routines[idx] = routine;
    else this.routines.push(routine);
  }

  override async setActive(_id: string): Promise<void> {}
  override async delete(_id: string): Promise<void> {}
}

const makeRoutine = (overrides: Partial<Routine> = {}): Routine => ({
  id: 'r1',
  name: 'Original',
  isActive: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('EditRoutineUseCase', () => {
  let useCase: EditRoutineUseCase;
  let repo: StubRoutineRepository;

  beforeEach(() => {
    repo = new StubRoutineRepository();
    TestBed.configureTestingModule({
      providers: [
        EditRoutineUseCase,
        { provide: RoutineRepository, useValue: repo },
      ],
    });
    useCase = TestBed.inject(EditRoutineUseCase);
  });

  it('should update name and description of existing routine', async () => {
    repo.routines = [makeRoutine()];

    const updated = await useCase.execute({ id: 'r1', name: 'New Name', description: 'New desc' });

    expect(updated.name).toBe('New Name');
    expect(updated.description).toBe('New desc');
    expect(updated.id).toBe('r1');
  });

  it('should preserve isActive and other fields when editing', async () => {
    repo.routines = [makeRoutine({ isActive: true })];

    const updated = await useCase.execute({ id: 'r1', name: 'Renamed' });

    expect(updated.isActive).toBe(true);
  });

  it('should throw when routine not found', async () => {
    await expect(useCase.execute({ id: 'nonexistent', name: 'X' }))
      .rejects.toThrow();
  });

  it('should persist changes via repo.save', async () => {
    repo.routines = [makeRoutine()];
    const spy = jest.spyOn(repo, 'save');

    await useCase.execute({ id: 'r1', name: 'Updated' });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should update updatedAt timestamp', async () => {
    const originalDate = new Date('2024-01-01');
    repo.routines = [makeRoutine({ updatedAt: originalDate })];

    const updated = await useCase.execute({ id: 'r1', name: 'Updated' });

    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(originalDate.getTime());
  });
});
