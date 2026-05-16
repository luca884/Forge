import { createProfile, Profile } from './profile.entity';

describe('Profile entity', () => {
  it('creates profile with sentinel id me', () => {
    const profile = createProfile('Luca');
    expect(profile.id).toBe('me');
  });

  it('defaults preferredUnit to kg', () => {
    const profile = createProfile('Luca');
    expect(profile.preferredUnit).toBe('kg');
  });

  it('accepts lb as preferredUnit', () => {
    const profile = createProfile('Luca', 'lb');
    expect(profile.preferredUnit).toBe('lb');
  });

  it('stores the given name', () => {
    const profile = createProfile('Luca');
    expect(profile.name).toBe('Luca');
  });

  it('sets createdAt and updatedAt as dates', () => {
    const profile = createProfile('Luca');
    expect(profile.createdAt).toBeInstanceOf(Date);
    expect(profile.updatedAt).toBeInstanceOf(Date);
  });

  it('throws DomainError when name is empty string', () => {
    expect(() => createProfile('')).toThrow();
  });

  it('throws DomainError when name is whitespace only', () => {
    expect(() => createProfile('   ')).toThrow();
  });

  it('accepts optional avatarBase64', () => {
    const profile = createProfile('Luca', 'kg', 'data:image/png;base64,abc');
    expect(profile.avatarBase64).toBe('data:image/png;base64,abc');
  });

  it('profile id is always me (TypeScript literal)', () => {
    const profile: Profile = createProfile('Luca');
    // TypeScript literal type check — id must be 'me'
    const id: 'me' = profile.id;
    expect(id).toBe('me');
  });
});
