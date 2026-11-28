/** Día local (AAAA-MM-DD) al que pertenece un instante. */
export function localDayId(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Desde la medianoche local del día (incluida) hasta la siguiente (excluida), en milisegundos. */
export function dayBounds(dayId: string): { fromMs: number; toMs: number } {
  const [year, month, day] = dayId.split('-').map(Number) as [number, number, number];
  return { fromMs: new Date(year, month - 1, day).getTime(), toMs: new Date(year, month - 1, day + 1).getTime() };
}
