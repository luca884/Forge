import { toDomain, toRow } from './profile.mapper';
import { ProfileRow } from '@core/db/database';
import { Profile } from '../domain/profile.entity';

const baseRow: ProfileRow = {
  id: 'me',
  name: 'Luca',
  preferredUnit: 'kg',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
};

const baseProfile: Profile = {
  id: 'me',
  name: 'Luca',
  preferredUnit: 'kg',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
};

describe('ProfileMapper', () => {
  describe('toDomain', () => {
    it('maps row to Profile correctly', () => {
      const profile = toDomain(baseRow);
      expect(profile.id).toBe('me');
      expect(profile.name).toBe('Luca');
      expect(profile.preferredUnit).toBe('kg');
    });

    it('defaults preferredUnit to kg when undefined', () => {
      const rowWithoutUnit: ProfileRow = { ...baseRow, preferredUnit: undefined };
      const profile = toDomain(rowWithoutUnit);
      expect(profile.preferredUnit).toBe('kg');
    });

    it('maps lb preferredUnit correctly', () => {
      const rowWithLb: ProfileRow = { ...baseRow, preferredUnit: 'lb' };
      const profile = toDomain(rowWithLb);
      expect(profile.preferredUnit).toBe('lb');
    });

    it('maps optional avatarBase64', () => {
      const rowWithAvatar: ProfileRow = { ...baseRow, avatarBase64: 'data:image/png;base64,abc' };
      const profile = toDomain(rowWithAvatar);
      expect(profile.avatarBase64).toBe('data:image/png;base64,abc');
    });

    it('leaves avatarBase64 undefined when not in row', () => {
      const profile = toDomain(baseRow);
      expect(profile.avatarBase64).toBeUndefined();
    });
  });

  describe('toRow', () => {
    it('maps Profile to row correctly', () => {
      const row = toRow(baseProfile);
      expect(row.id).toBe('me');
      expect(row.name).toBe('Luca');
      expect(row.preferredUnit).toBe('kg');
    });

    it('round-trip: toRow then toDomain returns original (non-null unit)', () => {
      const row = toRow(baseProfile);
      const profile = toDomain(row);
      expect(profile).toEqual(baseProfile);
    });
  });
});
