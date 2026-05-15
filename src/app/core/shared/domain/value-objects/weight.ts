const MAX_WEIGHT_KG = 500;

export class Weight {
  readonly value: number;

  constructor(value: number) {
    if (!Number.isFinite(value) || value <= 0 || value > MAX_WEIGHT_KG) {
      throw new Error(
        `Weight must be a positive number <= ${MAX_WEIGHT_KG} kg. Received: ${value}`,
      );
    }
    this.value = value;
  }

  static tryFrom(
    value: number,
  ): { ok: true; value: Weight } | { ok: false; error: string } {
    if (!Number.isFinite(value) || value <= 0 || value > MAX_WEIGHT_KG) {
      return {
        ok: false,
        error: `Weight must be a positive number <= ${MAX_WEIGHT_KG} kg. Received: ${value}`,
      };
    }
    return { ok: true, value: new Weight(value) };
  }
}
