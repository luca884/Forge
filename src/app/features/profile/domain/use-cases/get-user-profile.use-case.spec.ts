import { TestBed } from '@angular/core/testing';
import { GetUserProfileUseCase } from './get-user-profile.use-case';
import { ProfileRepository } from '../profile.repository';
import { Profile } from '../profile.entity';

const mockProfile: Profile = {
  id: 'me',
  name: 'Luca',
  preferredUnit: 'kg',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

class StubProfileRepository extends ProfileRepository {
  result: Profile | null = null;

  override get(): Promise<Profile | null> {
    return Promise.resolve(this.result);
  }

  override save(_profile: Profile): Promise<void> {
    return Promise.resolve();
  }
}

describe('GetUserProfileUseCase', () => {
  let useCase: GetUserProfileUseCase;
  let repo: StubProfileRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GetUserProfileUseCase,
        { provide: ProfileRepository, useClass: StubProfileRepository },
      ],
    });
    useCase = TestBed.inject(GetUserProfileUseCase);
    repo = TestBed.inject(ProfileRepository) as StubProfileRepository;
  });

  it('returns null when no profile exists', async () => {
    repo.result = null;
    expect(await useCase.execute()).toBeNull();
  });

  it('returns the profile when it exists', async () => {
    repo.result = mockProfile;
    expect(await useCase.execute()).toEqual(mockProfile);
  });
});
