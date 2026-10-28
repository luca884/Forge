import { Injectable, inject } from '@angular/core';
import { PreferredUnit } from '../value-objects/preferred-unit.vo';
import { ProfileRepository } from '../profile.repository';

/**
 * Saves the weight unit chosen in Perfil. Name and avatar are no longer edited
 * in the UI, so they are kept as stored; a first save creates the profile with
 * an empty name.
 */
@Injectable()
export class SetPreferredUnitUseCase {
  private readonly profileRepo = inject(ProfileRepository);

  async execute(preferredUnit: PreferredUnit): Promise<void> {
    const existing = await this.profileRepo.get();
    const now = new Date();

    await this.profileRepo.save(
      existing
        ? { ...existing, preferredUnit, updatedAt: now }
        : { id: 'me', name: '', preferredUnit, createdAt: now, updatedAt: now },
    );
  }
}
