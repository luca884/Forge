/**
 * clear-training-history.use-case.spec.ts
 * TDD strict — RED written before implementation.
 * Uses a stub for TrainingHistoryReset to verify delegation.
 */
import { TestBed } from '@angular/core/testing';
import { TrainingHistoryReset } from '../training-history-reset';
import { ClearTrainingHistoryUseCase } from './clear-training-history.use-case';
import { EventBus } from '../../events/event-bus';
import { InMemoryEventBus } from '../../events/in-memory-event-bus';
import type { TrainingHistoryClearedEvent } from '../../events/training-history-cleared.event';

class StubTrainingHistoryReset extends TrainingHistoryReset {
  clearCallCount = 0;

  override clear(): Promise<void> {
    this.clearCallCount++;
    return Promise.resolve();
  }
}

describe('ClearTrainingHistoryUseCase', () => {
  let useCase: ClearTrainingHistoryUseCase;
  let stub: StubTrainingHistoryReset;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ClearTrainingHistoryUseCase,
        { provide: TrainingHistoryReset, useClass: StubTrainingHistoryReset },
        { provide: EventBus, useClass: InMemoryEventBus },
      ],
    });
    useCase = TestBed.inject(ClearTrainingHistoryUseCase);
    stub = TestBed.inject(TrainingHistoryReset) as StubTrainingHistoryReset;
  });

  it('calls reset.clear() exactly once when executed', async () => {
    await useCase.execute();
    expect(stub.clearCallCount).toBe(1);
  });

  it('announces TrainingHistoryCleared once the history is gone', async () => {
    const seen: number[] = [];
    TestBed.inject(EventBus).subscribe<TrainingHistoryClearedEvent>('TrainingHistoryCleared', () =>
      seen.push(stub.clearCallCount),
    );
    await useCase.execute();
    expect(seen).toEqual([1]);
  });

  it('does not call reset.clear() before execute()', () => {
    expect(stub.clearCallCount).toBe(0);
  });
});
