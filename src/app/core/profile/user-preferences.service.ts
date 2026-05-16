import { Injectable, inject, signal } from '@angular/core';
import { ProfileRepository } from '@features/profile/domain/profile.repository';
import { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';

/**
 * UserPreferencesService — root-scoped singleton (ADR-22, ADR-23).
 * Holds the user's preferred weight unit as a reactive signal.
 * Loaded lazily on first loadOnce() call (from each consuming page's ngOnInit).
 */
@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly profileRepo = inject(ProfileRepository);

  readonly unit = signal<PreferredUnit>('kg');
  private loaded = false;

  async loadOnce(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    const profile = await this.profileRepo.get();
    this.unit.set(profile?.preferredUnit ?? 'kg');
  }
}
