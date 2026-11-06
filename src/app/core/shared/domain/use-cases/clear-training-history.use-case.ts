import { Injectable, inject } from '@angular/core';
import { TrainingHistoryReset } from '../training-history-reset';
import { EventBus } from '../../events/event-bus';
import type { TrainingHistoryClearedEvent } from '../../events/training-history-cleared.event';

@Injectable()
export class ClearTrainingHistoryUseCase {
  private readonly reset = inject(TrainingHistoryReset);
  private readonly eventBus = inject(EventBus);

  async execute(): Promise<void> {
    await this.reset.clear();
    // Lets views mounted outside the page (the shell's session-in-progress bar) drop what they show.
    this.eventBus.publish<TrainingHistoryClearedEvent>({ name: 'TrainingHistoryCleared', occurredAt: new Date() });
  }
}
