import { TestBed } from '@angular/core/testing';
import { SetPreferredUnitUseCase } from './set-preferred-unit.use-case';
import { ProfileRepository } from '../profile.repository';
import { Profile } from '../profile.entity';

const existingProfile: Profile = {
  id: 'me',
  name: 'Luca',
  avatarBase64: 'data:image/png;base64,abc',
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

describe('SetPreferredUnitUseCase', () => {
  let useCase: SetPreferredUnitUseCase;
  let repo: StubProfileRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SetPreferredUnitUseCase,
        { provide: ProfileRepository, useClass: StubProfileRepository },
      ],
    });
    useCase = TestBed.inject(SetPreferredUnitUseCase);
    repo = TestBed.inject(ProfileRepository) as StubProfileRepository;
  });

  it('creates the profile with an empty name when none exists', async () => {
    repo.existing = null;
    const before = Date.now();

    await useCase.execute('lb');

    expect(repo.saved).toEqual({
      id: 'me',
      name: '',
      preferredUnit: 'lb',
      createdAt: repo.saved!.updatedAt,
      updatedAt: repo.saved!.updatedAt,
    });
    expect(repo.saved!.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('changes only the unit and updatedAt of an existing profile', async () => {
    repo.existing = existingProfile;
    const before = Date.now();

    await useCase.execute('lb');

    expect(repo.saved).toEqual({ ...existingProfile, preferredUnit: 'lb', updatedAt: repo.saved!.updatedAt });
    expect(repo.saved!.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
  });
});
