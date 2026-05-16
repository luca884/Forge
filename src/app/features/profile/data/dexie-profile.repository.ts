import { Injectable, inject } from '@angular/core';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { Profile } from '../domain/profile.entity';
import { ProfileRepository } from '../domain/profile.repository';
import { toDomain, toRow } from './profile.mapper';

@Injectable()
export class DexieProfileRepository extends ProfileRepository {
  private readonly db = inject(ForgeDatabaseService);

  async get(): Promise<Profile | null> {
    const row = await this.db.profile.get('me');
    return row ? toDomain(row) : null;
  }

  async save(profile: Profile): Promise<void> {
    await this.db.profile.put(toRow(profile));
  }
}
