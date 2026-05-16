/**
 * dexie-profile.repository.spec.ts
 * TDD strict — RED written before implementation.
 * Uses fake-indexeddb (registered globally in setup-jest.ts). D-13.
 * NO jest.mock of Dexie internals.
 */
import { TestBed } from '@angular/core/testing';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { ProfileRepository } from '../domain/profile.repository';
import { DexieProfileRepository } from './dexie-profile.repository';
import { Profile } from '../domain/profile.entity';

const profile1: Profile = {
  id: 'me',
  name: 'Luca',
  preferredUnit: 'kg',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const profile2: Profile = {
  id: 'me',
  name: 'Luca Updated',
  preferredUnit: 'lb',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
};

describe('DexieProfileRepository', () => {
  let repo: DexieProfileRepository;
  let db: ForgeDatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        ForgeDatabaseService,
        { provide: ProfileRepository, useClass: DexieProfileRepository },
        DexieProfileRepository,
      ],
    });
    db = TestBed.inject(ForgeDatabaseService);
    repo = TestBed.inject(DexieProfileRepository);
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('returns null for a fresh database', async () => {
    const result = await repo.get();
    expect(result).toBeNull();
  });

  it('returns the saved profile', async () => {
    await repo.save(profile1);
    const result = await repo.get();
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Luca');
    expect(result?.preferredUnit).toBe('kg');
  });

  it('upserts: second save overwrites first (same id)', async () => {
    await repo.save(profile1);
    await repo.save(profile2);
    const result = await repo.get();
    expect(result?.name).toBe('Luca Updated');
    expect(result?.preferredUnit).toBe('lb');
  });

  it('always returns id me', async () => {
    await repo.save(profile1);
    const result = await repo.get();
    expect(result?.id).toBe('me');
  });
});
