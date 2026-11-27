import type { ActivityType } from '../../domain/activity.entity';

const missing = '—';
const locale = 'es-AR';
const wholeNumber = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
const kilometers = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
const speed = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });

export const activityTypeLabels = {
  walk: 'Caminata',
  bike: 'Bici',
  run: 'Correr',
} as const satisfies Record<ActivityType, string>;

export function formatActivityDate(timestamp: number): string {
  return date.format(timestamp);
}

export function formatDistance(meters: number | null): string {
  if (meters === null) return missing;
  return meters < 1000 ? `${wholeNumber.format(meters)} m` : `${kilometers.format(meters / 1000)} km`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return missing;
  const magnitude = Math.abs(seconds);
  const sign = seconds < 0 ? '−' : '';
  const minutes = Math.floor(magnitude / 60);
  if (minutes === 0) return `${sign}${Math.floor(magnitude)} s`;
  if (minutes < 60) return `${sign}${minutes} min`;
  return `${sign}${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}

export function formatSpeed(kmh: number | null): string {
  return kmh === null ? missing : `${speed.format(kmh)} km/h`;
}

export function formatElevationGain(meters: number | null): string {
  return meters === null ? missing : `+${wholeNumber.format(meters)} m`;
}
