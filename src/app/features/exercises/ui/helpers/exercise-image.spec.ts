import { exerciseImageSlug, exerciseImageUrl } from './exercise-image';

describe('exerciseImageSlug', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(exerciseImageSlug('Press de banca')).toBe('press-de-banca');
  });

  it('strips accents', () => {
    expect(exerciseImageSlug('Curl de bíceps')).toBe('curl-de-biceps');
    expect(exerciseImageSlug('Jalón al pecho')).toBe('jalon-al-pecho');
  });

  it('collapses non-alphanumerics and trims edge hyphens', () => {
    expect(exerciseImageSlug('  Fondos en paralelas!  ')).toBe('fondos-en-paralelas');
  });
});

describe('exerciseImageUrl', () => {
  it('builds a bundled webp path under exercises/', () => {
    expect(exerciseImageUrl('Press militar')).toBe('exercises/press-militar.webp');
  });
});
