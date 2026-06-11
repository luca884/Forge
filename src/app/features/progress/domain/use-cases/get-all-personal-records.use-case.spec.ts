import { TestBed } from '@angular/core/testing';
import { GetAllPersonalRecordsUseCase } from './get-all-personal-records.use-case';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { PersonalRecord } from '../entities/personal-record.entity';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';

const makeRecord = (id: string, exerciseId = 'ex-1'): PersonalRecord => ({
  id,
  exerciseId,
  trackingType: 'weight-reps',
  workedSetId: `ws-${id}`,
  achievedAt: new Date('2024-05-01'),
  set: {
    id: `ws-${id}`,
    exerciseId,
    sessionId: 's-1',
    type: 'weight-reps',
    reps: new Reps(5),
    weight: new Weight(80),
    isPR: true,
    createdAt: new Date('2024-05-01'),
  },
});

class StubPersonalRecordRepository extends PersonalRecordRepository {
  records: PersonalRecord[] = [];
  lastListAllArg: string | undefined = undefined;

  override async save(_record: PersonalRecord): Promise<void> {}
  override async getById(_id: string): Promise<PersonalRecord | null> { return null; }
  override async getCurrentForExercise(_exerciseId: string, _trackingType: import('@core/shared/domain/tracking-type').TrackingType): Promise<PersonalRecord | null> { return null; }
  override async listAll(exerciseId?: string): Promise<PersonalRecord[]> {
    this.lastListAllArg = exerciseId;
    return this.records;
  }
  override async existsByExerciseId(_exerciseId: string): Promise<boolean> { return false; }
  override async deleteByWorkedSetIds(_ids: ReadonlySet<string>): Promise<void> {}
}

describe('GetAllPersonalRecordsUseCase', () => {
  let useCase: GetAllPersonalRecordsUseCase;
  let repo: StubPersonalRecordRepository;

  beforeEach(() => {
    repo = new StubPersonalRecordRepository();
    TestBed.configureTestingModule({
      providers: [
        GetAllPersonalRecordsUseCase,
        { provide: PersonalRecordRepository, useValue: repo },
      ],
    });
    useCase = TestBed.inject(GetAllPersonalRecordsUseCase);
  });

  it('should return all records when called without exerciseId', async () => {
    repo.records = [makeRecord('pr-1'), makeRecord('pr-2'), makeRecord('pr-3')];

    const result = await useCase.execute();

    expect(result).toHaveLength(3);
    expect(result).toEqual(repo.records);
  });

  it('should pass exerciseId to repo.listAll when provided', async () => {
    repo.records = [makeRecord('pr-1', 'ex-1')];

    await useCase.execute('ex-1');

    expect(repo.lastListAllArg).toBe('ex-1');
  });

  it('should delegate to repo.listAll with no exerciseId when not provided', async () => {
    await useCase.execute();

    expect(repo.lastListAllArg).toBeUndefined();
  });

  it('should return empty array when repo returns no records', async () => {
    repo.records = [];

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });

  it('should return records filtered by exerciseId (delegated to repo)', async () => {
    repo.records = [makeRecord('pr-1', 'ex-1')];

    const result = await useCase.execute('ex-1');

    expect(result).toHaveLength(1);
    expect(result[0]?.exerciseId).toBe('ex-1');
  });
});
