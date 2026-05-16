export class InvalidScheduleError extends Error {
  constructor(invalidDayId: string) {
    super(`Schedule references a TrainingDay.id that does not belong to this routine: ${invalidDayId}`);
    this.name = 'InvalidScheduleError';
  }
}
