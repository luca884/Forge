export class Reps {
  readonly value: number;

  constructor(value: number) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`Reps must be a positive integer. Received: ${value}`);
    }
    this.value = value;
  }
}
