import { Injectable, inject } from '@angular/core';
import { RoutineRepository } from '../../../routines/domain/routine.repository';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { TrainingDay } from '../../../routines/domain/training-day.entity';
import { DayOfWeek, getDayId } from '../../../routines/domain/value-objects/weekly-schedule';

export type SuggestedDayResult =
  | { day: TrainingDay; reason: 'scheduled' }
  | { day: null; reason: 'rest-day' | 'no-active-routine' | 'no-schedule-configured' };

export interface GetSuggestedDayInput {
  /** Inject a Date for deterministic testing. Defaults to new Date() when omitted. */
  now?: Date;
}

/**
 * GetSuggestedDayForTodayUseCase — derives the suggested TrainingDay for today.
 *
 * Returns a discriminated union so UI can render different copy per case.
 * D-18, CC-20. Lives in training because it's consumed by TrainingHomePage.
 *
 * Cross-feature port reuse: reads RoutineRepository and TrainingDayRepository
 * (both abstractions — Clean boundary preserved, per ADR-15 pattern).
 */
@Injectable()
export class GetSuggestedDayForTodayUseCase {
  private readonly routineRepo = inject(RoutineRepository);
  private readonly dayRepo = inject(TrainingDayRepository);

  async execute(input: GetSuggestedDayInput = {}): Promise<SuggestedDayResult> {
    const now = input.now ?? new Date();

    // Step 1: Load active routine
    const routine = await this.routineRepo.getActive();
    if (!routine) {
      return { day: null, reason: 'no-active-routine' };
    }

    // Step 2: Check if schedule is configured
    if (!routine.schedule) {
      return { day: null, reason: 'no-schedule-configured' };
    }

    // Step 3: Map today's date to DayOfWeek
    const dow = dateToDayOfWeek(now);

    // Step 4: Look up day ID in schedule
    const dayId = getDayId(routine.schedule, dow);
    if (!dayId) {
      return { day: null, reason: 'rest-day' };
    }

    // Step 5: Load the TrainingDay
    const day = await this.dayRepo.getById(dayId);
    if (!day) {
      // Orphaned dayId — treat as rest day (graceful degradation)
      return { day: null, reason: 'rest-day' };
    }

    return { day, reason: 'scheduled' };
  }
}

/**
 * Maps a Date to a DayOfWeek string using JS getDay() (0 = Sunday).
 * Pure function for easy testing.
 */
function dateToDayOfWeek(date: Date): DayOfWeek {
  const DAY_MAP: readonly DayOfWeek[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  // getDay() returns 0–6 always; index is always valid
  return DAY_MAP[date.getDay()] as DayOfWeek;
}
