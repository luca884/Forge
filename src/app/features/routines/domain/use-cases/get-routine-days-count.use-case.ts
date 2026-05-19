import { Injectable, inject } from '@angular/core';
import { TrainingDayRepository } from '../training-day.repository';

@Injectable()
export class GetRoutineDaysCountUseCase {
  private readonly repo = inject(TrainingDayRepository);

  async execute(routineId: string): Promise<number> {
    const days = await this.repo.getByRoutineId(routineId);
    return days.length;
  }
}
