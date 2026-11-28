const missing = '—';
const locale = 'es-AR';
const whole = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
const kilometers = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

function orDash(value: number | null, format: (n: number) => string): string {
  return value === null ? missing : format(value);
}

export const formatSteps = (steps: number | null): string => orDash(steps, (n) => whole.format(n));

export const formatMeters = (meters: number | null): string =>
  orDash(meters, (n) => (n < 1000 ? `${whole.format(n)} m` : `${kilometers.format(n / 1000)} km`));

export const formatKcal = (kcal: number | null): string => orDash(kcal, (n) => `${whole.format(n)} kcal`);

export const formatBpm = (bpm: number | null): string => orDash(bpm, (n) => `${whole.format(n)} lpm`);

export const formatPercent = (percent: number | null): string => orDash(percent, (n) => `${whole.format(n)} %`);
