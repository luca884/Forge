import { Injectable, inject } from '@angular/core';
import { Profile } from '../profile.entity';
import { ProfileRepository } from '../profile.repository';

@Injectable()
export class GetUserProfileUseCase {
  private readonly profileRepo = inject(ProfileRepository);

  execute(): Promise<Profile | null> {
    return this.profileRepo.get();
  }
}
