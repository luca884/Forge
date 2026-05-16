import { Injectable, inject } from '@angular/core';
import { InvalidProfileInputError } from '../profile.entity';
import { PreferredUnit } from '../value-objects/preferred-unit.vo';
import { ProfileRepository } from '../profile.repository';

export interface SetUserProfileInput {
  name: string;
  preferredUnit?: PreferredUnit;
  avatarBase64?: string;
}

@Injectable()
export class SetUserProfileUseCase {
  private readonly profileRepo = inject(ProfileRepository);

  async execute(input: SetUserProfileInput): Promise<void> {
    if (input.name.trim() === '') {
      throw new InvalidProfileInputError('name must not be empty');
    }

    const existing = await this.profileRepo.get();
    const now = new Date();
    const createdAt = existing?.createdAt ?? now;

    const profile = {
      id: 'me' as const,
      name: input.name,
      preferredUnit: input.preferredUnit ?? 'kg',
      avatarBase64: input.avatarBase64,
      createdAt,
      updatedAt: now,
    };

    await this.profileRepo.save(profile);
  }
}
