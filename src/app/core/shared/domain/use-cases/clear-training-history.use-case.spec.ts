/**
 * clear-training-history.use-case.spec.ts
 * TDD strict — RED written before implementation.
 * Uses a stub for TrainingHistoryReset to verify delegation.
 */
import { TestBed } from '@angular/core/testing';
import { TrainingHistoryReset } from '../training-history-reset';
import { ClearTrainingHistoryUseCase } from './clear-training-history.use-case';

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
      ],
    });
    useCase = TestBed.inject(ClearTrainingHistoryUseCase);
    stub = TestBed.inject(TrainingHistoryReset) as StubTrainingHistoryReset;
  });

  it('calls reset.clear() exactly once when executed', async () => {
    await useCase.execute();
    expect(stub.clearCallCount).toBe(1);
  });

  it('does not call reset.clear() before execute()', () => {
    expect(stub.clearCallCount).toBe(0);
  });
});
