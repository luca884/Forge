import { TestBed } from '@angular/core/testing';
import { GetCurrentPRForExerciseUseCase } from './get-current-pr-for-exercise.use-case';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { PersonalRecord } from '../entities/personal-record.entity';
import { TrackingType } from '@core/shared/domain/tracking-type';

const makeRecord = (id: string, exerciseId = 'ex-1', trackingType: TrackingType = 'weight-reps'): PersonalRecord => ({
  id,
  exerciseId,
  trackingType,
  workedSetId: `ws-${id}`,
  achievedAt: new Date('2024-05-01'),
  set: {
    id: `ws-${id}`,
    exerciseId,
    sessionId: 's-1',
    type: 'weight-reps',
    reps: 5,
    weightKg: 85,
    isPR: true,
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2024-05-01'),
  },
});

class StubPersonalRecordRepository extends PersonalRecordRepository {
  currentRecord: PersonalRecord | null = null;
  lastGetCurrentArgs: { exerciseId: string; trackingType: TrackingType } | null = null;

  override async save(_record: PersonalRecord): Promise<void> {}
  override async getById(_id: string): Promise<PersonalRecord | null> { return null; }
  override async listAll(_exerciseId?: string): Promise<PersonalRecord[]> { return []; }
  override async getCurrentForExercise(
    exerciseId: string,
    trackingType: TrackingType,
  ): Promise<PersonalRecord | null> {
    this.lastGetCurrentArgs = { exerciseId, trackingType };
    return this.currentRecord;
  }
}

describe('GetCurrentPRForExerciseUseCase', () => {
  let useCase: GetCurrentPRForExerciseUseCase;
  let repo: StubPersonalRecordRepository;

  beforeEach(() => {
    repo = new StubPersonalRecordRepository();
    TestBed.configureTestingModule({
      providers: [
        GetCurrentPRForExerciseUseCase,
        { provide: PersonalRecordRepository, useValue: repo },
      ],
    });
    useCase = TestBed.inject(GetCurrentPRForExerciseUseCase);
  });

  it('should return the record from repo when one exists', async () => {
    const record = makeRecord('pr-1', 'ex-1', 'weight-reps');
    repo.currentRecord = record;

    const result = await useCase.execute('ex-1', 'weight-reps');

    expect(result).toEqual(record);
  });

  it('should return null when repo returns no record', async () => {
    repo.currentRecord = null;

    const result = await useCase.execute('ex-1', 'weight-reps');

    expect(result).toBeNull();
  });

  it('should pass exerciseId and trackingType to repo.getCurrentForExercise', async () => {
    await useCase.execute('ex-42', 'bodyweight-reps');

    expect(repo.lastGetCurrentArgs).toEqual({
      exerciseId: 'ex-42',
      trackingType: 'bodyweight-reps',
    });
  });

  it('should work with all tracking types', async () => {
    const trackingTypes: TrackingType[] = ['weight-reps', 'bodyweight-reps', 'time', 'distance-time'];

    for (const trackingType of trackingTypes) {
      repo.currentRecord = makeRecord('pr-1', 'ex-1', trackingType);
      const result = await useCase.execute('ex-1', trackingType);
      expect(result).not.toBeNull();
      expect(repo.lastGetCurrentArgs?.trackingType).toBe(trackingType);
    }
  });
});
