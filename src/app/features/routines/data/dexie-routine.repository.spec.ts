import { TestBed } from '@angular/core/testing';
import { DexieRoutineRepository } from './dexie-routine.repository';
import { RoutineRepository } from '../domain/routine.repository';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { ForgeDatabase } from '@core/db/database';
import { Routine } from '../domain/routine.entity';

const makeRoutine = (overrides: Partial<Routine> = {}): Routine => ({
  id: 'r1',
  name: 'Push Pull Legs',
  isActive: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('DexieRoutineRepository', () => {
  let repo: RoutineRepository;
  let db: ForgeDatabaseService;

  beforeEach(async () => {
    // fake-indexeddb/auto resets between tests via the Dexie.delete() call
    db = new ForgeDatabaseService();
    TestBed.configureTestingModule({
      providers: [
        DexieRoutineRepository,
        { provide: RoutineRepository, useClass: DexieRoutineRepository },
        { provide: ForgeDatabaseService, useValue: db },
      ],
    });
    repo = TestBed.inject(DexieRoutineRepository);
    // Clear DB state between tests
    await db.routines.clear();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should save and retrieve a routine via getAll', async () => {
    const routine = makeRoutine();
    await repo.save(routine);
    const all = await repo.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]!.name).toBe('Push Pull Legs');
  });

  it('should upsert on repeated save with same id', async () => {
    const routine = makeRoutine();
    await repo.save(routine);
    await repo.save({ ...routine, name: 'Updated Name' });
    const all = await repo.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]!.name).toBe('Updated Name');
  });

  it('should return routine by id', async () => {
    const routine = makeRoutine();
    await repo.save(routine);
    const result = await repo.getById('r1');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('r1');
  });

  it('should return null for non-existent id', async () => {
    const result = await repo.getById('nonexistent');
    expect(result).toBeNull();
  });

  it('should return null for getActive when no active routine exists', async () => {
    await repo.save(makeRoutine({ isActive: false }));
    const active = await repo.getActive();
    expect(active).toBeNull();
  });

  it('should return the active routine via getActive', async () => {
    await repo.save(makeRoutine({ id: 'r1', isActive: false }));
    await repo.save(makeRoutine({ id: 'r2', isActive: true, name: 'Active' }));

    const active = await repo.getActive();
    expect(active).not.toBeNull();
    expect(active!.id).toBe('r2');
  });

  it('should set one routine as active and deactivate others (setActive transaction)', async () => {
    await repo.save(makeRoutine({ id: 'r1', isActive: true, name: 'Routine A' }));
    await repo.save(makeRoutine({ id: 'r2', isActive: false, name: 'Routine B' }));

    await repo.setActive('r2');

    const r1 = await repo.getById('r1');
    const r2 = await repo.getById('r2');

    expect(r1!.isActive).toBe(false);
    expect(r2!.isActive).toBe(true);
  });

  it('should deactivate all other routines when setActive is called', async () => {
    await repo.save(makeRoutine({ id: 'r1', isActive: true }));
    await repo.save(makeRoutine({ id: 'r2', isActive: true }));
    await repo.save(makeRoutine({ id: 'r3', isActive: false }));

    await repo.setActive('r3');

    const all = await repo.getAll();
    const activeCount = all.filter(r => r.isActive).length;
    expect(activeCount).toBe(1);
    expect(all.find(r => r.id === 'r3')!.isActive).toBe(true);
  });

  it('should delete a routine by id', async () => {
    await repo.save(makeRoutine({ id: 'r1' }));
    await repo.save(makeRoutine({ id: 'r2' }));

    await repo.delete('r1');

    const all = await repo.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]!.id).toBe('r2');
  });
});
