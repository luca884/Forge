export class Reps {
  readonly value: number;

  constructor(value: number) {
    if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
      throw new Error(
        `Reps must be a non-negative integer. Received: ${value}`,
      );
    }
    this.value = value;
  }

  static tryFrom(
    value: number,
  ): { ok: true; value: Reps } | { ok: false; error: string } {
    if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
      return {
        ok: false,
        error: `Reps must be a non-negative integer. Received: ${value}`,
      };
    }
    return { ok: true, value: new Reps(value) };
  }
}
