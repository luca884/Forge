import { Injectable, inject } from '@angular/core';
import { TrainingDayRepository } from '../training-day.repository';

@Injectable()
export class RemoveTrainingDayUseCase {
  private readonly repo = inject(TrainingDayRepository);

  execute(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}
