function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function assertInputs(weightKg: number, reps: number): string | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return `weightKg must be a positive finite number. Received: ${weightKg}`;
  }
  if (!Number.isFinite(reps) || !Number.isInteger(reps) || reps <= 0) {
    return `reps must be a positive integer. Received: ${reps}`;
  }
  return null;
}

export class OneRepMax {
  readonly kg: number;

  private constructor(kg: number) {
    this.kg = kg;
  }

  static epley(weightKg: number, reps: number): OneRepMax {
    // D-1/R7: when reps=1, both formulas must return weightKg exactly
    if (reps === 1) return new OneRepMax(round2(weightKg));
    // Formula: 1RM = weightKg × (1 + reps / 30)
    return new OneRepMax(round2(weightKg * (1 + reps / 30)));
  }

  static brzycki(weightKg: number, reps: number): OneRepMax {
    // D-1/R7: when reps=1, both formulas must return weightKg exactly
    if (reps === 1) return new OneRepMax(round2(weightKg));
    // Formula: 1RM = weightKg / (1.0278 - 0.0278 × reps)
    return new OneRepMax(round2(weightKg / (1.0278 - 0.0278 * reps)));
  }

  static tryFrom(
    input: { weightKg: number; reps: number },
  ): { ok: true; value: OneRepMax } | { ok: false; error: string } {
    const error = assertInputs(input.weightKg, input.reps);
    if (error !== null) {
      return { ok: false, error };
    }
    return { ok: true, value: OneRepMax.epley(input.weightKg, input.reps) };
  }

  equals(other: OneRepMax): boolean {
    return this.kg === other.kg;
  }

  toString(): string {
    return `OneRepMax(${this.kg} kg)`;
  }
}
