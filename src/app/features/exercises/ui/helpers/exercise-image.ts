/**
 * Maps an exercise to its bundled illustration path (logo-style, offline-first).
 * Built-in catalog exercises ship an image at `public/exercises/<slug>.webp`;
 * custom exercises won't have a matching file and fall back to an icon (F-8).
 *
 * Keyed by a slug of the name (stable for the fixed seed catalog).
 */
const COMBINING_MARKS = /[̀-ͯ]/g;

export function exerciseImageSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '') // strip accents (bíceps -> biceps)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function exerciseImageUrl(name: string): string {
  return `exercises/${exerciseImageSlug(name)}.webp`;
}
