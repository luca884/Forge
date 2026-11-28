export interface Bar {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Line {
  /** Tramos continuos: se corta la línea en los días sin datos. */
  segments: Point[][];
  /** Un punto por día con dato, incluidos los tramos de un solo punto. */
  dots: Point[];
}

/** Barras de una serie diaria: alto proporcional al máximo, apoyadas abajo; null = día sin barra. */
export function barGeometry(values: readonly (number | null)[], width: number, height: number, gap: number): (Bar | null)[] {
  const max = Math.max(0, ...values.flatMap((v) => v ?? []));
  const slot = width / values.length;
  return values.map((value, i) => {
    if (value === null) return null;
    const barHeight = max === 0 ? 0 : (value / max) * height;
    return { x: i * slot + gap / 2, y: height - barHeight, width: Math.max(slot - gap, 1), height: barHeight };
  });
}

/** Línea de una serie diaria: el mínimo va abajo y el máximo arriba, dentro de `pad` píxeles de margen. */
export function lineGeometry(values: readonly (number | null)[], width: number, height: number, pad: number): Line {
  const present = values.flatMap((v) => v ?? []);
  if (present.length === 0) return { segments: [], dots: [] };
  const min = Math.min(...present);
  const max = Math.max(...present);
  const xOf = (i: number) => (values.length === 1 ? width / 2 : (i * width) / (values.length - 1));
  const yOf = (v: number) => (max === min ? height / 2 : pad + (1 - (v - min) / (max - min)) * (height - 2 * pad));

  const segments: Point[][] = [];
  const dots: Point[] = [];
  let current: Point[] | null = null;
  values.forEach((value, i) => {
    if (value === null) {
      current = null;
      return;
    }
    const point = { x: xOf(i), y: yOf(value) };
    dots.push(point);
    if (current === null) {
      current = [];
      segments.push(current);
    }
    current.push(point);
  });
  return { segments, dots };
}
