/**
 * UserPreferencesService spec (D-1).
 * TDD strict — RED written before implementation.
 * Uses fake-indexeddb (registered globally in setup-jest.ts) via DexieProfileRepository.
 */
import { TestBed } from '@angular/core/testing';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { ProfileRepository } from '@features/profile/domain/profile.repository';
import { DexieProfileRepository } from '@features/profile/data/dexie-profile.repository';
import { UserPreferencesService } from './user-preferences.service';

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;
  let db: ForgeDatabaseService;
  let repo: DexieProfileRepository;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        ForgeDatabaseService,
        { provide: ProfileRepository, useClass: DexieProfileRepository },
        DexieProfileRepository,
        // Provide explicitly so each test gets a fresh instance (overrides providedIn:'root')
        UserPreferencesService,
      ],
    });
    db = TestBed.inject(ForgeDatabaseService);
    repo = TestBed.inject(DexieProfileRepository);
    service = TestBed.inject(UserPreferencesService);
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('unit() returns "kg" before loadOnce() is called', () => {
    expect(service.unit()).toBe('kg');
  });

  it('unit() returns "lb" after loadOnce() with a profile where preferredUnit = "lb"', async () => {
    await repo.save({
      id: 'me',
      name: 'Luca',
      preferredUnit: 'lb',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    });
    await service.loadOnce();
    expect(service.unit()).toBe('lb');
  });

  it('unit() returns "kg" after loadOnce() with null (no profile)', async () => {
    // Fresh DB — repo.get() returns null
    await service.loadOnce();
    expect(service.unit()).toBe('kg');
  });

  it('calling loadOnce() twice only invokes ProfileRepository.get() once', async () => {
    // Spy on the ProfileRepository token instance — same instance the service injects
    const profileRepo = TestBed.inject(ProfileRepository);
    const getSpy = jest.spyOn(profileRepo, 'get');
    await service.loadOnce();
    await service.loadOnce();
    expect(getSpy).toHaveBeenCalledTimes(1);
  });
});
