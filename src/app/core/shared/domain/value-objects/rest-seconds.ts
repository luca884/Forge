export class RestSeconds {
  readonly value: number;

  constructor(value: number) {
    if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
      throw new Error(
        `RestSeconds must be a non-negative integer. Received: ${value}`,
      );
    }
    this.value = value;
  }

  static tryFrom(
    value: number,
  ): { ok: true; value: RestSeconds } | { ok: false; error: string } {
    if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
      return {
        ok: false,
        error: `RestSeconds must be a non-negative integer. Received: ${value}`,
      };
    }
    return { ok: true, value: new RestSeconds(value) };
  }
}
