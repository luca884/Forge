import { Injectable, inject } from '@angular/core';
import { RoutineRepository } from '../routine.repository';
import { TrainingDayRepository } from '../training-day.repository';

/**
 * Deletes a routine and cascades to its training days so no orphan days remain.
 * (TrainingDay repo has no deleteByRoutineId, so we fetch + delete each.)
 */
@Injectable()
export class DeleteRoutineUseCase {
  private readonly routineRepo = inject(RoutineRepository);
  private readonly dayRepo = inject(TrainingDayRepository);

  async execute(routineId: string): Promise<void> {
    const days = await this.dayRepo.getByRoutineId(routineId);
    await Promise.all(days.map((day) => this.dayRepo.delete(day.id)));
    await this.routineRepo.delete(routineId);
  }
}
