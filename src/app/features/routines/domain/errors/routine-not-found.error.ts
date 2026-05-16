export class RoutineNotFoundError extends Error {
  constructor(routineId: string) {
    super(`Routine not found: ${routineId}`);
    this.name = 'RoutineNotFoundError';
  }
}
