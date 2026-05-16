import { TestBed } from '@angular/core/testing';
import { SetUserProfileUseCase } from './set-user-profile.use-case';
import { ProfileRepository } from '../profile.repository';
import { Profile } from '../profile.entity';

const existingProfile: Profile = {
  id: 'me',
  name: 'OldName',
  preferredUnit: 'kg',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

class StubProfileRepository extends ProfileRepository {
  existing: Profile | null = null;
  saved: Profile | null = null;

  override get(): Promise<Profile | null> {
    return Promise.resolve(this.existing);
  }

  override save(profile: Profile): Promise<void> {
    this.saved = profile;
    return Promise.resolve();
  }
}

describe('SetUserProfileUseCase', () => {
  let useCase: SetUserProfileUseCase;
  let repo: StubProfileRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SetUserProfileUseCase,
        { provide: ProfileRepository, useClass: StubProfileRepository },
      ],
    });
    useCase = TestBed.inject(SetUserProfileUseCase);
    repo = TestBed.inject(ProfileRepository) as StubProfileRepository;
  });

  it('saves profile when repo is fresh (no existing profile)', async () => {
    repo.existing = null;
    await useCase.execute({ name: 'Luca', preferredUnit: 'kg' });
    expect(repo.saved).not.toBeNull();
    expect(repo.saved?.name).toBe('Luca');
    expect(repo.saved?.id).toBe('me');
  });

  it('preserves createdAt from existing profile on update', async () => {
    repo.existing = existingProfile;
    await useCase.execute({ name: 'Luca Updated' });
    expect(repo.saved?.createdAt).toEqual(existingProfile.createdAt);
  });

  it('updates updatedAt on update', async () => {
    repo.existing = existingProfile;
    const before = Date.now();
    await useCase.execute({ name: 'Luca Updated' });
    const after = Date.now();
    const updatedAt = repo.saved!.updatedAt.getTime();
    expect(updatedAt).toBeGreaterThanOrEqual(before);
    expect(updatedAt).toBeLessThanOrEqual(after);
  });

  it('throws DomainError when name is empty', async () => {
    repo.existing = null;
    await expect(useCase.execute({ name: '' })).rejects.toThrow();
    expect(repo.saved).toBeNull();
  });

  it('throws DomainError when name is whitespace only', async () => {
    await expect(useCase.execute({ name: '   ' })).rejects.toThrow();
  });

  it('does not call save when name validation fails', async () => {
    repo.existing = null;
    try {
      await useCase.execute({ name: '' });
    } catch {
      // expected
    }
    expect(repo.saved).toBeNull();
  });

  it('uses kg as default preferredUnit when not provided', async () => {
    repo.existing = null;
    await useCase.execute({ name: 'Luca' });
    expect(repo.saved?.preferredUnit).toBe('kg');
  });

  it('saves avatarBase64 when provided', async () => {
    repo.existing = null;
    await useCase.execute({ name: 'Luca', avatarBase64: 'data:image/png;base64,abc' });
    expect(repo.saved?.avatarBase64).toBe('data:image/png;base64,abc');
  });
});
