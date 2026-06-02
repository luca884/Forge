import { Injectable, inject } from '@angular/core';
import { TrainingHistoryReset } from '../training-history-reset';

@Injectable()
export class ClearTrainingHistoryUseCase {
  private readonly reset = inject(TrainingHistoryReset);

  async execute(): Promise<void> {
    await this.reset.clear();
  }
}
