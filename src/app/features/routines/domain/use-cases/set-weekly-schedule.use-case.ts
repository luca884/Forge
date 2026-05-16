import { Injectable, inject } from '@angular/core';
import { RoutineRepository } from '../routine.repository';
import { TrainingDayRepository } from '../training-day.repository';
import { WeeklySchedule, DAYS_OF_WEEK } from '../value-objects/weekly-schedule';
import { RoutineNotFoundError } from '../errors/routine-not-found.error';
import { InvalidScheduleError } from '../errors/invalid-schedule.error';

export interface SetWeeklyScheduleInput {
  routineId: string;
  schedule: WeeklySchedule;
}

/**
 * SetWeeklyScheduleUseCase — saves a WeeklySchedule on a Routine.
 *
 * Validates that every non-undefined day entry in the schedule references
 * a TrainingDay.id that belongs to the target routine. D-17, V-60, V-61.
 */
@Injectable()
export class SetWeeklyScheduleUseCase {
  private readonly routineRepo = inject(RoutineRepository);
  private readonly dayRepo = inject(TrainingDayRepository);

  async execute(input: SetWeeklyScheduleInput): Promise<void> {
    const { routineId, schedule } = input;

    // Step 1: Load the routine — throws if not found
    const routine = await this.routineRepo.getById(routineId);
    if (!routine) {
      throw new RoutineNotFoundError(routineId);
    }

    // Step 2: Collect all day IDs referenced in the schedule
    const referencedDayIds = DAYS_OF_WEEK
      .map(dow => schedule[dow])
      .filter((id): id is string => id !== undefined);

    // Step 3: Validate each referenced dayId belongs to this routine
    if (referencedDayIds.length > 0) {
      const routineDays = await this.dayRepo.getByRoutineId(routineId);
      const validDayIds = new Set(routineDays.map(d => d.id));

      for (const dayId of referencedDayIds) {
        if (!validDayIds.has(dayId)) {
          throw new InvalidScheduleError(dayId);
        }
      }
    }

    // Step 4: Save the updated routine
    const updatedRoutine = {
      ...routine,
      schedule,
      updatedAt: new Date(),
    };

    await this.routineRepo.save(updatedRoutine);
  }
}
