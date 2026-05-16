import { ProfileRow } from '@core/db/database';
import { Profile } from '../domain/profile.entity';

export function toDomain(row: ProfileRow): Profile {
  return {
    id: 'me',
    name: row.name,
    avatarBase64: row.avatarBase64,
    preferredUnit: row.preferredUnit ?? 'kg',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toRow(profile: Profile): ProfileRow {
  return {
    id: 'me',
    name: profile.name,
    avatarBase64: profile.avatarBase64,
    preferredUnit: profile.preferredUnit,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
